import { getEnabledAIKeyEntries } from "./aiKeyVault";
import { SessionLeaseManager, type PlatformAccountLease } from "./sessionLeaseManager";
import { WebAiSessionManager, type WebAIProfile, type WebAIProfileStatus } from "./webAiSessionManager";

export type PlatformAccountResourceKind = "web_profile" | "api_key";

export interface PlatformAccountResource {
  id: string;
  kind: PlatformAccountResourceKind;
  platform: string;
  label: string;
  mode: "web_automation" | "api";
  enabled: boolean;
  status: WebAIProfileStatus | "active" | "disabled";
  createdAt: string;
  lastUsedAt?: string;
  lastError?: string;
  quotaResetAt?: string;
  consecutiveFailures?: number;
  capacity: "exclusive" | "shared";
  leaseable: boolean;
  source: "web_ai_profile" | "ai_key_vault";
  detail: Record<string, unknown>;
  activeLease?: PlatformAccountLease | null;
}

export interface PlatformAccountBrokerSummary {
  totalResources: number;
  byKind: Record<PlatformAccountResourceKind, number>;
  byStatus: Record<string, number>;
  activeLeases: number;
}

export interface PlatformAccountSnapshot {
  resources: PlatformAccountResource[];
  leases: PlatformAccountLease[];
  summary: PlatformAccountBrokerSummary;
}

const STATUS_RANK: Record<string, number> = {
  ready: 0,
  active: 1,
  untested: 2,
  quota: 3,
  login_required: 4,
  error: 5,
  disabled: 6,
};

function normalizeApiStatus(status?: string, enabled = true): PlatformAccountResource["status"] {
  if (!enabled) return "disabled";
  if (status === "ok") return "ready";
  if (status === "quota") return "quota";
  if (status === "error") return "error";
  return "untested";
}

function compareResources(a: PlatformAccountResource, b: PlatformAccountResource): number {
  const statusGap = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
  if (statusGap !== 0) return statusGap;
  return (a.consecutiveFailures ?? 0) - (b.consecutiveFailures ?? 0);
}

export class PlatformAccountBroker {
  private static mapWebProfile(profile: WebAIProfile, activeLease: PlatformAccountLease | null): PlatformAccountResource {
    return {
      id: profile.id,
      kind: "web_profile",
      platform: profile.platform,
      label: profile.name,
      mode: "web_automation",
      enabled: profile.enabled,
      status: profile.enabled ? (activeLease ? "active" : profile.status) : "disabled",
      createdAt: profile.createdAt,
      lastUsedAt: profile.lastUsedAt,
      lastError: profile.lastError,
      quotaResetAt: profile.quotaResetAt,
      consecutiveFailures: profile.consecutiveFailures,
      capacity: "exclusive",
      leaseable: profile.enabled,
      source: "web_ai_profile",
      activeLease,
      detail: {
        profileDir: profile.profileDir,
        profileType: profile.type ?? "sandboxed",
        metadata: profile.metadata ?? {},
      },
    };
  }

  private static mapApiEntry(entry: Awaited<ReturnType<typeof getEnabledAIKeyEntries>>[number]): PlatformAccountResource {
    return {
      id: entry.id,
      kind: "api_key",
      platform: entry.provider,
      label: entry.label,
      mode: "api",
      enabled: entry.enabled,
      status: normalizeApiStatus(entry.lastStatus, entry.enabled),
      createdAt: entry.createdAt,
      lastError: entry.lastError,
      capacity: "shared",
      leaseable: false,
      source: "ai_key_vault",
      activeLease: null,
      detail: {
        provider: entry.provider,
        model: entry.model ?? "",
        baseUrl: entry.baseUrl ?? "",
        priority: entry.priority,
      },
    };
  }

  public static async getSnapshot(platform?: string): Promise<PlatformAccountSnapshot> {
    const normalizedPlatform = platform?.trim().toLowerCase();
    const [profiles, activeLeases] = await Promise.all([
      WebAiSessionManager.listProfiles(),
      SessionLeaseManager.listActiveLeases(),
    ]);

    const leaseByResource = new Map(activeLeases.map((lease) => [lease.resourceId, lease] as const));

    const webResources = profiles
      .filter((profile) => !normalizedPlatform || profile.platform === normalizedPlatform)
      .map((profile) => this.mapWebProfile(profile, leaseByResource.get(profile.id) ?? null));

    let apiResources: PlatformAccountResource[] = [];
    try {
      const apiEntries = await getEnabledAIKeyEntries();
      apiResources = apiEntries
        .map((entry) => this.mapApiEntry(entry))
        .filter((entry) => !normalizedPlatform || entry.platform === normalizedPlatform);
    } catch (error) {
      console.warn("[PlatformAccountBroker] AI key vault unavailable for snapshot:", error);
    }

    const resources = [...webResources, ...apiResources].sort(compareResources);
    const summary = resources.reduce<PlatformAccountBrokerSummary>((acc, resource) => {
      acc.totalResources += 1;
      acc.byKind[resource.kind] += 1;
      acc.byStatus[resource.status] = (acc.byStatus[resource.status] || 0) + 1;
      return acc;
    }, {
      totalResources: 0,
      byKind: { web_profile: 0, api_key: 0 },
      byStatus: {},
      activeLeases: activeLeases.length,
    });

    return {
      resources,
      leases: activeLeases,
      summary,
    };
  }

  public static async claimBestAvailableWebProfile(input: {
    platform: string;
    leaseOwner: string;
    purpose: string;
    ttlMinutes?: number;
    preferredResourceId?: string;
  }): Promise<{ resource: PlatformAccountResource; lease: PlatformAccountLease }> {
    const snapshot = await this.getSnapshot(input.platform);
    const candidates = snapshot.resources.filter((resource) => resource.kind === "web_profile" && resource.leaseable);

    const ordered = candidates.sort((a, b) => {
      if (a.id === input.preferredResourceId) return -1;
      if (b.id === input.preferredResourceId) return 1;
      return compareResources(a, b);
    });

    const selected = ordered.find((resource) => !resource.activeLease && ["ready", "untested"].includes(resource.status));
    if (!selected) {
      throw new Error(`Không có profile khả dụng cho nền tảng ${input.platform}. Hãy kiểm tra login, quota hoặc trạng thái enable.`);
    }

    const lease = await SessionLeaseManager.claimLease({
      resourceId: selected.id,
      resourceKind: "web_profile",
      platform: selected.platform,
      leaseOwner: input.leaseOwner,
      purpose: input.purpose,
      ttlMinutes: input.ttlMinutes,
    });

    const refreshed = await this.getSnapshot(input.platform);
    const resource = refreshed.resources.find((item) => item.id === selected.id);
    if (!resource) {
      throw new Error("Claim succeeded but resource could not be reloaded.");
    }
    return { resource, lease };
  }
}
