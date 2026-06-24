export type SoftwareFactoryProviderKind = "api" | "ide" | "local" | "connector";
export type SoftwareFactoryProviderHealth = "healthy" | "limited" | "paused";
export type SoftwareFactoryWorkKind = "planning" | "coding" | "qa" | "media" | "launch";

export interface SoftwareFactoryProviderRuntimeProfile {
  id: string;
  label: string;
  kind: SoftwareFactoryProviderKind;
  priority: number;
  health: SoftwareFactoryProviderHealth;
  supportedWork: SoftwareFactoryWorkKind[];
  reviewRequired: boolean;
  note: string;
}

export interface SoftwareFactoryProviderRuntimeDecision {
  selected: SoftwareFactoryProviderRuntimeProfile | null;
  reason: string;
  reviewRequired: boolean;
}

const providerProfiles: SoftwareFactoryProviderRuntimeProfile[] = [
  { id: "api-primary", label: "API Primary", kind: "api", priority: 100, health: "healthy", supportedWork: ["planning", "coding", "qa", "media", "launch"], reviewRequired: false, note: "Default structured AI provider route." },
  { id: "ide-runner", label: "IDE Runner", kind: "ide", priority: 85, health: "healthy", supportedWork: ["coding", "qa"], reviewRequired: false, note: "Workspace and repository execution route." },
  { id: "local-runner", label: "Local Runner", kind: "local", priority: 70, health: "healthy", supportedWork: ["coding", "qa"], reviewRequired: false, note: "Local inspection and packaging route." },
  { id: "approved-connector", label: "Approved Connector", kind: "connector", priority: 60, health: "limited", supportedWork: ["planning", "media", "launch"], reviewRequired: true, note: "Workspace-approved connector route." },
];

export function listSoftwareFactoryProviderProfiles() {
  return [...providerProfiles].sort((a, b) => b.priority - a.priority);
}

export function getSoftwareFactoryProviderProfile(id: string) {
  return providerProfiles.find((profile) => profile.id === id) || null;
}

export function setSoftwareFactoryProviderHealth(id: string, health: SoftwareFactoryProviderHealth) {
  const profile = getSoftwareFactoryProviderProfile(id);
  if (!profile) return null;
  profile.health = health;
  return profile;
}

export function chooseSoftwareFactoryProvider(workKind: SoftwareFactoryWorkKind): SoftwareFactoryProviderRuntimeDecision {
  const candidates = providerProfiles
    .filter((profile) => profile.health !== "paused")
    .filter((profile) => profile.supportedWork.includes(workKind))
    .sort((a, b) => b.priority - a.priority);

  const selected = candidates[0] || null;
  if (!selected) {
    return {
      selected: null,
      reason: `No available provider profile supports ${workKind}.`,
      reviewRequired: true,
    };
  }

  return {
    selected,
    reason: `${selected.label} selected for ${workKind}.`,
    reviewRequired: selected.reviewRequired || selected.health === "limited",
  };
}

export function getSoftwareFactoryProviderStats() {
  const profiles = listSoftwareFactoryProviderProfiles();
  return {
    total: profiles.length,
    healthy: profiles.filter((profile) => profile.health === "healthy").length,
    limited: profiles.filter((profile) => profile.health === "limited").length,
    paused: profiles.filter((profile) => profile.health === "paused").length,
  };
}
