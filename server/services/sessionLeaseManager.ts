import fs from "fs";
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from "./runtimePaths";

export type LeaseStatus = "active" | "released" | "expired";

export interface PlatformAccountLease {
  id: string;
  resourceId: string;
  resourceKind: "web_profile" | "api_key";
  platform: string;
  leaseOwner: string;
  purpose: string;
  status: LeaseStatus;
  createdAt: string;
  expiresAt: string;
  releasedAt?: string;
  releasedBy?: string;
}

interface ClaimLeaseInput {
  resourceId: string;
  resourceKind: "web_profile" | "api_key";
  platform: string;
  leaseOwner: string;
  purpose: string;
  ttlMinutes?: number;
}

const LEASES_FILE = resolveRuntimePathFromEnv("PLATFORM_ACCOUNT_LEASES_FILE", "platform_account_leases.json");
const DEFAULT_TTL_MINUTES = 90;
const MAX_HISTORY = 300;

export class SessionLeaseManager {
  private static async readLeases(): Promise<PlatformAccountLease[]> {
    try {
      const readPath = resolveRuntimeReadPathFromEnv("PLATFORM_ACCOUNT_LEASES_FILE", "platform_account_leases.json");
      if (!fs.existsSync(readPath)) {
        return [];
      }
      const raw = await fs.promises.readFile(readPath, "utf8");
      const parsed = JSON.parse(raw) as PlatformAccountLease[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("[SessionLeaseManager] Failed to read leases:", error);
      return [];
    }
  }

  private static async writeLeases(leases: PlatformAccountLease[]): Promise<void> {
    try {
      ensureRuntimeRootSync();
      const trimmed = leases
        .slice()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, MAX_HISTORY);
      await fs.promises.writeFile(LEASES_FILE, JSON.stringify(trimmed, null, 2), "utf8");
    } catch (error) {
      console.error("[SessionLeaseManager] Failed to write leases:", error);
    }
  }

  private static normalizeExpiry(ttlMinutes?: number): string {
    const ttl = Math.min(Math.max(Math.floor(ttlMinutes ?? DEFAULT_TTL_MINUTES), 5), 24 * 60);
    return new Date(Date.now() + ttl * 60_000).toISOString();
  }

  public static async cleanupExpiredLeases(): Promise<PlatformAccountLease[]> {
    const leases = await this.readLeases();
    const now = Date.now();
    let changed = false;

    const updated = leases.map((lease) => {
      if (lease.status === "active" && Date.parse(lease.expiresAt) <= now) {
        changed = true;
        return {
          ...lease,
          status: "expired" as const,
          releasedAt: new Date(now).toISOString(),
          releasedBy: lease.releasedBy ?? "system",
        };
      }
      return lease;
    });

    if (changed) {
      await this.writeLeases(updated);
    }
    return updated;
  }

  public static async listLeases(): Promise<PlatformAccountLease[]> {
    return this.cleanupExpiredLeases();
  }

  public static async listActiveLeases(): Promise<PlatformAccountLease[]> {
    const leases = await this.cleanupExpiredLeases();
    return leases.filter((lease) => lease.status === "active");
  }

  public static async getActiveLeaseByResourceId(resourceId: string): Promise<PlatformAccountLease | null> {
    const leases = await this.listActiveLeases();
    return leases.find((lease) => lease.resourceId === resourceId) ?? null;
  }

  public static async claimLease(input: ClaimLeaseInput): Promise<PlatformAccountLease> {
    const leaseOwner = input.leaseOwner.trim();
    const purpose = input.purpose.trim();
    if (!leaseOwner) {
      throw new Error("Lease owner is required.");
    }
    if (!purpose) {
      throw new Error("Lease purpose is required.");
    }

    const leases = await this.cleanupExpiredLeases();
    const existing = leases.find((lease) => lease.resourceId === input.resourceId && lease.status === "active");
    if (existing) {
      throw new Error(`Resource đang được giữ bởi "${existing.leaseOwner}" đến ${new Date(existing.expiresAt).toLocaleString("vi-VN")}.`);
    }

    const lease: PlatformAccountLease = {
      id: `lease_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      resourceId: input.resourceId,
      resourceKind: input.resourceKind,
      platform: input.platform,
      leaseOwner,
      purpose,
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: this.normalizeExpiry(input.ttlMinutes),
    };

    leases.push(lease);
    await this.writeLeases(leases);
    return lease;
  }

  public static async releaseLease(id: string, releasedBy?: string): Promise<PlatformAccountLease> {
    const leases = await this.cleanupExpiredLeases();
    const target = leases.find((lease) => lease.id === id);
    if (!target) {
      throw new Error("Lease not found.");
    }
    if (target.status !== "active") {
      return target;
    }
    target.status = "released";
    target.releasedAt = new Date().toISOString();
    target.releasedBy = releasedBy?.trim() || "manual";
    await this.writeLeases(leases);
    return target;
  }

  public static async releaseLeaseByResourceId(resourceId: string, releasedBy?: string): Promise<PlatformAccountLease | null> {
    const active = await this.getActiveLeaseByResourceId(resourceId);
    if (!active) {
      return null;
    }
    return this.releaseLease(active.id, releasedBy);
  }
}
