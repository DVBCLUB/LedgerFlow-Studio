export type FactoryProviderKind = 'api' | 'ide' | 'local' | 'connector';
export type FactoryProviderHealth = 'healthy' | 'limited' | 'paused';
export type FactoryWorkKind = 'planning' | 'coding' | 'qa' | 'media' | 'launch';

export interface FactoryProviderProfile {
  id: string;
  label: string;
  kind: FactoryProviderKind;
  priority: number;
  health: FactoryProviderHealth;
  supportedWork: FactoryWorkKind[];
  reviewRequired: boolean;
  note: string;
}

export interface FactoryProviderDecision {
  selectedId: string | null;
  reason: string;
  reviewRequired: boolean;
}

export const FACTORY_PROVIDER_PROFILES: FactoryProviderProfile[] = [
  { id: 'api-primary', label: 'API Primary', kind: 'api', priority: 100, health: 'healthy', supportedWork: ['planning', 'coding', 'qa', 'media', 'launch'], reviewRequired: false, note: 'Structured provider profile for normal factory work.' },
  { id: 'ide-runner', label: 'IDE Runner', kind: 'ide', priority: 85, health: 'healthy', supportedWork: ['coding', 'qa'], reviewRequired: false, note: 'Repository, build, test and patch workflow.' },
  { id: 'local-runner', label: 'Local Runner', kind: 'local', priority: 70, health: 'healthy', supportedWork: ['qa', 'coding'], reviewRequired: false, note: 'Local checks, static review and packaging.' },
  { id: 'approved-connector', label: 'Approved Connector', kind: 'connector', priority: 60, health: 'limited', supportedWork: ['planning', 'media', 'launch'], reviewRequired: true, note: 'Connector profile enabled by workspace policy.' },
];

export function chooseFactoryProvider(work: FactoryWorkKind, profiles: FactoryProviderProfile[] = FACTORY_PROVIDER_PROFILES): FactoryProviderDecision {
  const available = profiles
    .filter((profile) => profile.health !== 'paused')
    .filter((profile) => profile.supportedWork.includes(work))
    .sort((a, b) => b.priority - a.priority);

  const selected = available[0];
  if (!selected) {
    return { selectedId: null, reason: `No provider profile is currently available for ${work}.`, reviewRequired: true };
  }

  return {
    selectedId: selected.id,
    reason: `${selected.label} selected for ${work}.`,
    reviewRequired: selected.reviewRequired || selected.health === 'limited',
  };
}

export function listFactoryProviderHealth(profiles: FactoryProviderProfile[] = FACTORY_PROVIDER_PROFILES) {
  return profiles.map((profile) => ({ id: profile.id, label: profile.label, health: profile.health, priority: profile.priority }));
}
