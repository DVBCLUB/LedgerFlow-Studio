export type FeatureStatus = 'active' | 'internal' | 'planned';

export type FeatureRegistration = {
  id: string;
  workspace: string;
  surface: string;
  component: string;
  status: FeatureStatus;
  source: string;
};

export const FEATURE_REGISTRY: readonly FeatureRegistration[] = [
  { id: 'ai-mission-templates', workspace: 'ai_factory', surface: 'advanced/tasks', component: 'AIWorkforceMissionTemplates', status: 'active', source: 'src/modules/ai-nhan-su/AIWorkforceMissionTemplates.tsx' },
  { id: 'ai-mobile-command', workspace: 'ai_factory', surface: 'advanced/tasks', component: 'AIWorkforceMobileCommandCenter', status: 'active', source: 'src/modules/ai-nhan-su/AIWorkforceMobileCommandCenter.tsx' },
  { id: 'robot-swarm', workspace: 'ai_factory', surface: 'advanced/robot', component: 'MultiPlatformRobotSwarmPanel', status: 'active', source: 'src/modules/ai-nhan-su/MultiPlatformRobotSwarmPanel.tsx' },
  { id: 'robot-lab', workspace: 'ai_factory', surface: 'advanced/robot', component: 'RobotLabPanel', status: 'active', source: 'src/modules/ai-nhan-su/RobotLabPanel.tsx' },
  { id: 'world-class-readiness', workspace: 'ai_factory', surface: 'advanced/health', component: 'WorldClassReadinessPanel', status: 'active', source: 'src/modules/ai-nhan-su/WorldClassReadinessPanel.tsx' },
  { id: 'executive-boardroom', workspace: 'ceo_command', surface: 'autonomous_command', component: 'ExecutiveBoardroomPanel', status: 'active', source: 'src/modules/analytics-models-sandbox/ExecutiveBoardroomPanel.tsx' },
  { id: 'synthetic-market', workspace: 'marketing_growth', surface: 'campaigns', component: 'SyntheticMarketSimulatorPanel', status: 'active', source: 'src/modules/marketing-growth/SyntheticMarketSimulatorPanel.tsx' },
  { id: 'project-memory', workspace: 'analytics', surface: 'dashboard', component: 'ProjectMemoryDecisionLog', status: 'active', source: 'src/modules/analytics-models-sandbox/ProjectMemoryDecisionLog.tsx' },
  { id: 'security-control', workspace: 'system_settings', surface: 'security/audit', component: 'SecurityControlCenter', status: 'active', source: 'src/modules/dev-ops/SecurityControlCenter.tsx' },
  { id: 'feature-registry', workspace: 'system_settings', surface: 'general', component: 'FeatureRegistryPanel', status: 'active', source: 'src/modules/system-settings/FeatureRegistryPanel.tsx' },
  { id: 'software-factory-catalog', workspace: 'ai_factory', surface: 'advanced/factory', component: 'SoftwareFactoryCatalogPanel', status: 'active', source: 'src/modules/ai-nhan-su/SoftwareFactoryCatalogPanel.tsx' },
  { id: 'factory-catalogs', workspace: 'ai_factory', surface: 'internal', component: 'factory*Catalog', status: 'internal', source: 'src/modules/ai-nhan-su/factory*Catalog.ts' },
] as const;
