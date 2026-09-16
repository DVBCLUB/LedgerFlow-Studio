export type FeatureStatus = 'active' | 'internal' | 'planned';
export type CapabilityPack = 'founder-control' | 'ai-workforce' | 'finance-intelligence' | 'growth-sales' | 'product-delivery' | 'integration-devops' | 'platform-governance';
export type ModuleRisk = 'read-only' | 'approval-required' | 'controlled-write';
export type WiringStatus = 'wired' | 'daemon-only' | 'dormant-approved' | 'test-only';

export type FeatureRegistration = {
  id: string;
  workspace: string;
  surface: string;
  component: string;
  status: FeatureStatus;
  source: string;
  capabilityPack: CapabilityPack;
  risk: ModuleRisk;
  wiring: WiringStatus;
  featureFlag: 'general' | 'founder-only' | 'pilot' | 'internal';
};

export const FEATURE_REGISTRY: readonly FeatureRegistration[] = [
  { id: 'ai-mission-templates', workspace: 'ai_factory', surface: 'advanced/tasks', component: 'AIWorkforceMissionTemplates', status: 'active', source: 'src/modules/ai-nhan-su/AIWorkforceMissionTemplates.tsx', capabilityPack: 'ai-workforce', risk: 'approval-required', wiring: 'wired', featureFlag: 'founder-only' },
  { id: 'ai-mobile-command', workspace: 'ai_factory', surface: 'advanced/tasks', component: 'AIWorkforceMobileCommandCenter', status: 'active', source: 'src/modules/ai-nhan-su/AIWorkforceMobileCommandCenter.tsx', capabilityPack: 'ai-workforce', risk: 'approval-required', wiring: 'wired', featureFlag: 'founder-only' },
  { id: 'robot-swarm', workspace: 'ai_factory', surface: 'advanced/robot', component: 'MultiPlatformRobotSwarmPanel', status: 'active', source: 'src/modules/ai-nhan-su/MultiPlatformRobotSwarmPanel.tsx', capabilityPack: 'ai-workforce', risk: 'controlled-write', wiring: 'wired', featureFlag: 'founder-only' },
  { id: 'robot-lab', workspace: 'ai_factory', surface: 'advanced/robot', component: 'RobotLabPanel', status: 'active', source: 'src/modules/ai-nhan-su/RobotLabPanel.tsx', capabilityPack: 'ai-workforce', risk: 'approval-required', wiring: 'wired', featureFlag: 'pilot' },
  { id: 'world-class-readiness', workspace: 'ai_factory', surface: 'advanced/health', component: 'WorldClassReadinessPanel', status: 'active', source: 'src/modules/ai-nhan-su/WorldClassReadinessPanel.tsx', capabilityPack: 'platform-governance', risk: 'read-only', wiring: 'wired', featureFlag: 'general' },
  { id: 'executive-boardroom', workspace: 'ceo_command', surface: 'autonomous_command', component: 'ExecutiveBoardroomPanel', status: 'active', source: 'src/modules/analytics-models-sandbox/ExecutiveBoardroomPanel.tsx', capabilityPack: 'founder-control', risk: 'read-only', wiring: 'wired', featureFlag: 'founder-only' },
  { id: 'synthetic-market', workspace: 'marketing_growth', surface: 'campaigns', component: 'SyntheticMarketSimulatorPanel', status: 'active', source: 'src/modules/marketing-growth/SyntheticMarketSimulatorPanel.tsx', capabilityPack: 'growth-sales', risk: 'read-only', wiring: 'wired', featureFlag: 'general' },
  { id: 'project-memory', workspace: 'analytics', surface: 'dashboard', component: 'ProjectMemoryDecisionLog', status: 'active', source: 'src/modules/analytics-models-sandbox/ProjectMemoryDecisionLog.tsx', capabilityPack: 'founder-control', risk: 'read-only', wiring: 'wired', featureFlag: 'founder-only' },
  { id: 'security-control', workspace: 'system_settings', surface: 'security/audit', component: 'SecurityControlCenter', status: 'active', source: 'src/modules/dev-ops/SecurityControlCenter.tsx', capabilityPack: 'platform-governance', risk: 'read-only', wiring: 'wired', featureFlag: 'internal' },
  { id: 'feature-registry', workspace: 'system_settings', surface: 'general', component: 'FeatureRegistryPanel', status: 'active', source: 'src/modules/system-settings/FeatureRegistryPanel.tsx', capabilityPack: 'platform-governance', risk: 'read-only', wiring: 'wired', featureFlag: 'internal' },
  { id: 'release-readiness', workspace: 'system_settings', surface: 'general', component: 'ReleaseReadinessPanel', status: 'active', source: 'src/modules/system-settings/ReleaseReadinessPanel.tsx', capabilityPack: 'integration-devops', risk: 'read-only', wiring: 'wired', featureFlag: 'internal' },
  { id: 'software-factory-catalog', workspace: 'ai_factory', surface: 'advanced/factory', component: 'SoftwareFactoryCatalogPanel', status: 'active', source: 'src/modules/ai-nhan-su/SoftwareFactoryCatalogPanel.tsx', capabilityPack: 'product-delivery', risk: 'approval-required', wiring: 'wired', featureFlag: 'pilot' },
  { id: 'factory-catalogs', workspace: 'ai_factory', surface: 'internal', component: 'factory*Catalog', status: 'internal', source: 'src/modules/ai-nhan-su/factory*Catalog.ts', capabilityPack: 'product-delivery', risk: 'read-only', wiring: 'test-only', featureFlag: 'internal' },
] as const;
