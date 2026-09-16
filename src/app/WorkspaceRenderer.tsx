import React, { Suspense, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  Calculator,
  CheckCircle,
  ClipboardList,
  Code,
  Coins,
  CreditCard,
  Database,
  FileCheck2,
  FolderKanban,
  Mail,
  Mic,
  Network,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TestTubeDiagonal,
  TrendingUp,
  Users,
  Users2,
  UsersRound,
  Film,
  Gamepad2,
  Lightbulb,
  GraduationCap,
  Scale,
  Wifi,
  Zap,
  GitBranch,
  Globe2,
  Video,
  Radio,
  HeartPulse,
  PhoneCall,
  Smile,
  ShieldAlert,
  Truck,
  Landmark,
  Leaf,
  FileText,
  UserCheck,
  Cpu,
  Cloud,
  Headphones,
  Building2,
  Smartphone,
  DollarSign,
  Package,
  Camera,
} from 'lucide-react';
import { TabType, RoleType } from './companyNavigation';
import { SUB_TABS_CONFIG, SEGMENT_CORE_IDS, classifySubtabTier, type WorkspaceSubtab, type WorkspaceSubtabTier } from './workspaceSubtabConfig';
import { resolveWorkspaceSubTab } from './workspaceSubtabAliases';
import WorkspaceSubNavigation from '../components/shared/WorkspaceSubNavigation';
import SimplePanelCard from '../components/shared/SimplePanelCard';
import Skeleton from '../components/ui/Skeleton';
import { useLanguage } from '../context/LanguageContext';

import * as WS from './workspaces';

// Specialized inline dynamic imports with custom named resolutions
const OpenClawWebRobotPanel = React.lazy(() => import('../modules/ai-nhan-su/OpenClawWebRobotPanel').then((module) => ({ default: module.OpenClawWebRobotPanel })));
const WorldClassReadinessPanel = React.lazy(() => import('../modules/ai-nhan-su/WorldClassReadinessPanel').then((module) => ({ default: module.WorldClassReadinessPanel })));
const ProjectPortfolioPanel = React.lazy(() => import('../components/operations/OperationsPanels').then((module) => ({ default: module.ProjectPortfolioPanel })));
const IndustryTemplatePanel = React.lazy(() => import('../components/operations/IndustryTemplatePanel'));
const ProcurementLogisticsPanel = React.lazy(() => import('../components/operations/OperationsPanels').then((module) => ({ default: module.ProcurementLogisticsPanel })));
const HRAdminPanel = React.lazy(() => import('../components/operations/OperationsPanels').then((module) => ({ default: module.HRAdminPanel })));
const UnifiedActivityStreamPanel = React.lazy(() => import('../modules/command-center/components/UnifiedActivityStreamPanel'));
const DepartmentHealthPanel = React.lazy(() => import('../modules/command-center/components/DepartmentHealthPanel'));
const CompanyCalendarPanel = React.lazy(() => import('../modules/command-center/components/CompanyCalendarPanel'));
const FounderControlPanel = React.lazy(() => import('../modules/command-center/FounderControlPanel'));

const {
  LedgerAccountingWorkspace,
  RealCustomerSubscriptionLedger,
  RevenueDashboard,
  ApprovalWorkflow,
  PythonSandbox,
  BusinessSimulationEngine,
  AIEcosystemArchitecture,
  MarketSurveySimulator,
  FinancialDataScienceLab,
  PromptPlayground,
  BrowserSimulationPlanner,
  DataScienceEngineering,
  DeployBusiness,
  GeminiPlayground,
  MLApplied,
  ABSimulationLab,
  ExperimentDashboard,
  ExperimentDecisionLog,
  CustomDataWorkbench,
  MultiIndustryCaseBank,
  N8nAutomationBlueprint,
  MoatDefensibilityTracker,
  MoRReadinessChecklist,
  StrategicLabsMini,
  FounderLabsDock,
  SystemSettingsPanel,
  SystemSOPRunbookPanel,
  AdvancedDelegationMatrixPanel,
  FeatureRegistryPanel,
  ReleaseReadinessPanel,
  SoftwareFactoryCatalogPanel,
  RobotDOMVisionPanel,
  PeopleTab,
  LocalAiApprenticeLabPanel,
  AiRobotUniversalCockpit,
  AutonomousFlywheelCockpit,
  UniversalProjectRobotDock,
  IntegrationHub,
  BuildMonitorPanel,
  MergeReadinessCenter,
  PRControlCenter,
  GitHubCIDoctorLauncher,
  DevHandoffCenter,
  ApprovedPrPanel,
  GitAssistantDaemonPanel,
  PatchDiffReviewCenter,
  ReleaseArtifactCenter,
  RollbackCenter,
  SandboxPatchWorkspace,
  AuditTrailPanel,
  ArtifactInspectorPanel,
  CIRecoveryQueue,
  CIRunInspectorPanel,
  ConfigHealthMonitor,
  ConnectorContractPanel,
  GitHubConnectorPanel,
  LocalToolsPanel,
  WebAiSyncPanel,
  SystemOverviewDaemonPanel,
  DevOpsReleaseHubPanel,
  DeveloperIntelligenceHubPanel,
  AIIntegrationHealthPanel,
  CEOOverviewPanel,
  ExecutiveBoardroomPanel,
  BusinessHubPanel,
  AIAssistantPanel,
  AIWorkforceSkillDirectory,
  InterAgentProtocolPanel,
  SwarmRelayOrchestratorPanel,
  AIWorkforceRobotAutomationBridge,
  AIWorkforcePatchReviewSessions,
  KnowledgeBaseTab,
  WebAccountingRoadmap,
  ProductIdeationLab,
  GameAndMLWorkbench,
  GameAssetStudioPanel,
  TaxAuditSimulator,
  CampaignsLab,
  ContentLab,
  DigitalStudioLab,
  SecurityControlCenter,
  CustomerConversionLab,
  PricingAndLTVLab,
  ReferralAndNPSLab,
  AgentKernelPanel,
  CapitalAllocationPanel,
  ZeroTouchLoopPanel,
} = WS;

// Sub-components remaining
const ApiConnectionHealthMatrix = React.lazy(() => import('../modules/system-settings/components/ApiConnectionHealthMatrix'));
const AiAgentControlCenter = React.lazy(() => import('../modules/command-center/components/AiAgentControlCenter'));
const FounderBurnoutMonitor = React.lazy(() => import('../modules/command-center/components/FounderBurnoutMonitor'));
const WeeklyExecutiveReportPanel = React.lazy(() => import('../modules/command-center/WeeklyExecutiveReportPanel'));
const AiCeoAutopilotPanel = React.lazy(() => import('../modules/command-center/AiCeoAutopilotPanel'));
const NorthStarMetricBuilder = React.lazy(() => import('../modules/command-center/components/NorthStarMetricBuilder'));
const OnboardingGuide = React.lazy(() => import('../modules/command-center/components/OnboardingGuide'));
const AutomationRulesPanel = React.lazy(() => import('../modules/ai-nhan-su/AutomationRulesPanel'));
const AIOperationsCenter = React.lazy(() => import('../modules/ai-nhan-su/AIOperationsCenter'));
const AdvancedAIEngine = React.lazy(() => import('../modules/ai-nhan-su/AdvancedAIEngine'));
const AIWorkforceMissionTrace = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMissionTrace'));
const A2AMailboxPanel = React.lazy(() => import('../modules/ai-nhan-su/A2AMailboxPanel'));
const AIDispatchPanel = React.lazy(() => import('../modules/ai-nhan-su/AIDispatchPanel'));
const WorkflowPanel = React.lazy(() => import('../modules/ai-nhan-su/WorkflowPanel'));
const AgentAssemblyBuilder = React.lazy(() => import('../modules/ai-nhan-su/AgentAssemblyBuilder'));
const AIWorkforceTaskBoard = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceTaskBoard'));
const ModelDispatchMatrix = React.lazy(() => import('../modules/ai-nhan-su/ModelDispatchMatrix'));
const AISettingsManager = React.lazy(() => import('../modules/ai-nhan-su/AISettingsManager'));
const AIVaultSecurityPanel = React.lazy(() => import('../modules/ai-nhan-su/AIVaultSecurityPanel'));
const MissionOperatorRunbookPanel = React.lazy(() => import('../modules/ai-nhan-su/MissionOperatorRunbookPanel'));
const MissionReleaseGatePanel = React.lazy(() => import('../modules/ai-nhan-su/MissionReleaseGatePanel'));
const MissionSnapshotExportPanel = React.lazy(() => import('../modules/ai-nhan-su/MissionSnapshotExportPanel'));
const MissionReviewNoteSavePanel = React.lazy(() => import('../modules/ai-nhan-su/MissionReviewNoteSavePanel'));
const RobotLabPanel = React.lazy(() => import('../modules/ai-nhan-su/RobotLabPanel'));
const AIWorkforceMobileCommandCenter = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMobileCommandCenter'));
const ProjectMemoryDecisionLog = React.lazy(() => import('../modules/analytics-models-sandbox/ProjectMemoryDecisionLog'));
const Analytics3DLab = React.lazy(() => import('../modules/analytics-models-sandbox/Analytics3DLab'));
const AIObservabilityDashboard = React.lazy(() => import('../modules/analytics-models-sandbox/AIObservabilityDashboard'));
const FinancialChartsModelPanel = React.lazy(() => import('../components/analytics/FinancialChartsModelPanel'));
const LiveThoughtStreamViewer = React.lazy(() => import('../components/shared/LiveThoughtStreamViewer'));
const AIOperationsDaemonPanel = React.lazy(() => import('../modules/ai-nhan-su/AIOperationsDaemonPanel'));
const AIWorkforceOpenClawReadiness = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceOpenClawReadiness'));
const VisualRobotWorkflowCanvas = React.lazy(() => import('../modules/ai-nhan-su/components/VisualRobotWorkflowCanvas'));
const WebAISchedulerPanel = React.lazy(() => import('../modules/ai-nhan-su/ai-assistant/WebAISchedulerPanel').then((module) => ({ default: module.WebAISchedulerPanel })));
const AIWorkforceMissionTemplates = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMissionTemplates'));
const AIWorkforceNextBackendActions = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceNextBackendActions'));
const AIWorkforceToolCatalog = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceToolCatalog'));
const AutomationRulesHealthPanel = React.lazy(() => import('../modules/ai-nhan-su/AutomationRulesHealthPanel'));
const Level6RobotSynthesizerPanel = React.lazy(() => import('../modules/ai-nhan-su/Level6RobotSynthesizerPanel'));
const MultiPlatformRobotSwarmPanel = React.lazy(() => import('../modules/ai-nhan-su/MultiPlatformRobotSwarmPanel'));
const RobotFleetAnalyticsPanel = React.lazy(() => import('../modules/ai-nhan-su/RobotFleetAnalyticsPanel'));
const SystemStatusPage = React.lazy(() => import('../modules/ai-nhan-su/ai-assistant/SystemStatusPage'));
const GameStudioBuilder = React.lazy(() => import('../modules/product-studio/GameStudioBuilder'));
const VaporwareSmokeTester = React.lazy(() => import('../modules/product-studio/components/VaporwareSmokeTester'));
const InternalAuditWorkspace = React.lazy(() => import('../modules/finance-accounting/InternalAuditWorkspace'));
const SyntheticMarketSimulatorPanel = React.lazy(() => import('../modules/marketing-growth/SyntheticMarketSimulatorPanel'));
const RealCustomerSubscriptionLedgerSub = React.lazy(() => import('../modules/sales-crm/components/RealCustomerSubscriptionLedger'));
const DistributionLeadBoard = React.lazy(() => import('../modules/sales-crm/components/DistributionLeadBoard'));
const PricingOfferBuilder = React.lazy(() => import('../modules/sales-crm/components/PricingOfferBuilder'));
const AccountingVietnam = React.lazy(() => import('../modules/finance-accounting/AccountingVietnam'));
const CostDashboard = React.lazy(() => import('../modules/ai-nhan-su/ai-assistant/CostDashboard'));
const FreeToolRobotPanel = React.lazy(() => import('../modules/ai-nhan-su/components/FreeToolRobotPanel'));
const ProductLaunchChecklist = React.lazy(() => import('../modules/marketing-growth/components/ProductLaunchChecklist'));
const AIWorkforceCommandCenter = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceCommandCenter'));
const AIWorkforceMissionControl = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceMissionControl'));
const AIWorkforceRuntimePanel = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforceRuntimePanel'));
const AICommandCenterHubPanel = React.lazy(() => import('../modules/ai-nhan-su/AICommandCenterHubPanel'));
const AutonomousSweAgentLoopPanel = React.lazy(() => import('../modules/ai-nhan-su/AutonomousSweAgentLoopPanel'));
const AIOutputQualityReview = React.lazy(() => import('../modules/ai-nhan-su/AIOutputQualityReview'));
const AIWorkforcePluginSecurityGuard = React.lazy(() => import('../modules/ai-nhan-su/AIWorkforcePluginSecurityGuard'));
const SelfHealingPatchGatePanel = React.lazy(() => import('../modules/dev-ops/SelfHealingPatchGatePanel'));
const SyntheticSurveyBuilder = React.lazy(() => import('../modules/marketing-growth/components/SyntheticSurveyBuilder'));
const AIVideoFactoryPanel = React.lazy(() => import('../modules/sales-crm/components/AIVideoFactoryPanel'));
const VideoMakerRoot = React.lazy(() => import('../modules/video-maker/ui/index'));
const AssetFoundryPanel = React.lazy(() => import('../modules/asset-foundry/AssetFoundryPanel'));
const EnterpriseControlCenterPanel = React.lazy(() => import('../components/enterprise/EnterpriseControlCenterPanel'));
const SalesCRMWorkspaceLive = React.lazy(() => import('../modules/sales-crm/SalesCRMWorkspace'));
const TelegramBotControlPanel = React.lazy(() => import('../modules/ai-nhan-su/TelegramBotControlPanel'));
const CashFlowForecastDashboard = React.lazy(() => import('../modules/finance-accounting/CashFlowForecastDashboard'));
const TaxFilingPanel = React.lazy(() => import('../modules/finance-accounting/TaxFilingPanel'));
const RBACManagementPanel = React.lazy(() => import('../modules/system-settings/RBACManagementPanel'));
const MultiFactoryDashboard = React.lazy(() => import('../modules/ai-nhan-su/MultiFactoryDashboard'));
const AutoReconciliationPanel = React.lazy(() => import('../modules/finance-accounting/AutoReconciliationPanel'));
const PredictiveAccountingPanel = React.lazy(() => import('../modules/finance-accounting/PredictiveAccountingPanel'));
const FactoryPerformanceDashboard = React.lazy(() => import('../modules/ai-nhan-su/FactoryPerformanceDashboard'));
const AgentROIDashboard = React.lazy(() => import('../modules/ai-nhan-su/AgentROIDashboard'));
const RevenueFlywheelPanel = React.lazy(() => import('../modules/sales-crm/RevenueFlywheelPanel'));
const AutoHarvestedInsightsPanel = React.lazy(() => import('../modules/knowledge-library/AutoHarvestedInsightsPanel'));
const AgentPerformanceReviewPanel = React.lazy(() => import('../modules/ai-nhan-su/AgentPerformanceReviewPanel'));
const MarketIntelligencePanel = React.lazy(() => import('../modules/marketing-growth/MarketIntelligencePanel'));
const FinancialIncidentPlaybookPanel = React.lazy(() => import('../modules/finance-accounting/FinancialIncidentPlaybookPanel'));
const BusinessAbTestingPanel = React.lazy(() => import('../modules/analytics-models-sandbox/BusinessAbTestingPanel'));
const PluginMarketplacePanel = React.lazy(() => import('../modules/system-settings/PluginMarketplacePanel'));
const ConstitutionalConsensusBoardPanel = React.lazy(() => import('../modules/command-center/ConstitutionalConsensusBoardPanel'));
const CEOCommandCenter = React.lazy(() => import('../components/command/CEOCommandCenter'));
const BlockersDashboard = React.lazy(() => import('../components/operations/BlockersDashboard'));
const DailyBlockersPanel = React.lazy(() => import('../components/operations/DailyBlockersPanel'));
const BudgetGovernorPanel = React.lazy(() => import('../components/control/BudgetGovernorPanel'));
const EmergencyKillSwitchPanel = React.lazy(() => import('../components/control/EmergencyKillSwitchPanel'));
const SelfHealingInfraPanel = React.lazy(() => import('../modules/system-settings/SelfHealingInfraPanel'));
const VirtualBranchManagerPanel = React.lazy(() => import('../modules/command-center/VirtualBranchManagerPanel'));
const AutonomousSelfMutationPanel = React.lazy(() => import('../modules/system-settings/AutonomousSelfMutationPanel'));
const EnterpriseDigitalTwinPanel = React.lazy(() => import('../modules/analytics-models-sandbox/EnterpriseDigitalTwinPanel'));
const GlobalLocalizationAdapterPanel = React.lazy(() => import('../modules/finance-accounting/GlobalLocalizationAdapterPanel'));
const SocialSwarmCampaignPanel = React.lazy(() => import('../modules/marketing-growth/SocialSwarmCampaignPanel'));
const TaxComplianceShieldPanel = React.lazy(() => import('../modules/finance-accounting/TaxComplianceShieldPanel'));
const NLToSqlDataPanel = React.lazy(() => import('../modules/analytics-models-sandbox/NLToSqlDataPanel'));
const AutonomousSupportPanel = React.lazy(() => import('../modules/sales-crm/AutonomousSupportPanel'));
const DynamicRepricingPanel = React.lazy(() => import('../modules/sales-crm/DynamicRepricingPanel'));
const SecurityPosturePanel = React.lazy(() => import('../modules/system-settings/SecurityPosturePanel'));
const InvestorRelationsPanel = React.lazy(() => import('../modules/finance-accounting/InvestorRelationsPanel'));
const VendorSettlementPanel = React.lazy(() => import('../modules/finance-accounting/VendorSettlementPanel'));
const SeoTopicalAuthorityPanel = React.lazy(() => import('../modules/marketing-growth/SeoTopicalAuthorityPanel'));
const TalentRecruitingPanel = React.lazy(() => import('../modules/ai-nhan-su/TalentRecruitingPanel'));
const IpPatentGuardPanel = React.lazy(() => import('../modules/system-settings/IpPatentGuardPanel'));
const EdgeRoutingHubPanel = React.lazy(() => import('../modules/system-settings/EdgeRoutingHubPanel'));
const ContractLifecyclePanel = React.lazy(() => import('../modules/documents-approval/ContractLifecyclePanel'));
const CustomerHealthScorePanel = React.lazy(() => import('../modules/sales-crm/CustomerHealthScorePanel'));
const LlmCostArbitragePanel = React.lazy(() => import('../modules/system-settings/LlmCostArbitragePanel'));
const TreasuryManagementPanel = React.lazy(() => import('../modules/finance-accounting/TreasuryManagementPanel'));
const VoiceHelpdeskPanel = React.lazy(() => import('../modules/sales-crm/VoiceHelpdeskPanel'));
const MultiCloudMeshPanel = React.lazy(() => import('../modules/system-settings/MultiCloudMeshPanel'));
const MaValuationPanel = React.lazy(() => import('../modules/finance-accounting/MaValuationPanel'));
const BrandReputationRadarPanel = React.lazy(() => import('../modules/marketing-growth/BrandReputationRadarPanel'));
const SocThreatHuntingPanel = React.lazy(() => import('../modules/system-settings/SocThreatHuntingPanel'));
const AgmGovernancePanel = React.lazy(() => import('../modules/command-center/AgmGovernancePanel'));
const GlobalVatReverseChargePanel = React.lazy(() => import('../modules/finance-accounting/GlobalVatReverseChargePanel'));
const AffiliateCommissionPanel = React.lazy(() => import('../modules/sales-crm/AffiliateCommissionPanel'));
const PromptSecurityFirewallPanel = React.lazy(() => import('../modules/system-settings/PromptSecurityFirewallPanel'));
const EsgCarbonAccountingPanel = React.lazy(() => import('../modules/finance-accounting/EsgCarbonAccountingPanel'));
const MultiChannelMarketingBotPanel = React.lazy(() => import('../modules/marketing-growth/MultiChannelMarketingBotPanel'));
const NpsCsatVoiceSentimentPanel = React.lazy(() => import('../modules/sales-crm/NpsCsatVoiceSentimentPanel'));
const ChaosEngineeringPanel = React.lazy(() => import('../modules/system-settings/ChaosEngineeringPanel'));
const FounderSecondBrainPanel = React.lazy(() => import('../modules/command-center/FounderSecondBrainPanel'));
const CryptoTreasuryWeb3Panel = React.lazy(() => import('../modules/finance-accounting/CryptoTreasuryWeb3Panel'));
const VideoProductionStudioPanel = React.lazy(() => import('../modules/marketing-growth/VideoProductionStudioPanel'));
const AiBonusEscrowPanel = React.lazy(() => import('../modules/ai-nhan-su/AiBonusEscrowPanel'));
const AiDevCopilotPanel = React.lazy(() => import('../modules/system-settings/AiDevCopilotPanel'));
const DbAutoShardingPanel = React.lazy(() => import('../modules/system-settings/DbAutoShardingPanel'));
const LoyaltyGamificationPanel = React.lazy(() => import('../modules/sales-crm/LoyaltyGamificationPanel'));
const VirtualAdvisoryCouncilPanel = React.lazy(() => import('../modules/command-center/VirtualAdvisoryCouncilPanel'));
const FounderMobileDashboardPanel = React.lazy(() => import('../modules/command-center/FounderMobileDashboardPanel'));
const VoiceCeoCommandPanel = React.lazy(() => import('../modules/command-center/VoiceCeoCommandPanel'));
const SubscriptionBillingPanel = React.lazy(() => import('../modules/finance-accounting/SubscriptionBillingPanel'));
const PlgConversionPanel = React.lazy(() => import('../modules/sales-crm/PlgConversionPanel'));
const MultiTenantOnboardingPanel = React.lazy(() => import('../modules/system-settings/MultiTenantOnboardingPanel'));
const PwaOfflineSyncPanel = React.lazy(() => import('../modules/system-settings/PwaOfflineSyncPanel'));
const SemanticRagSearchPanel = React.lazy(() => import('../modules/knowledge-library/SemanticRagSearchPanel'));
const PredictiveRevenuePanel = React.lazy(() => import('../modules/analytics-models-sandbox/PredictiveRevenuePanel'));
const AiCodeReviewPrPanel = React.lazy(() => import('../modules/dev-ops/AiCodeReviewPrPanel'));
const WebhookIntegrationHubPanel = React.lazy(() => import('../modules/system-settings/WebhookIntegrationHubPanel'));
const IaCCloudArchitectPanel = React.lazy(() => import('../modules/dev-ops/IaCCloudArchitectPanel'));
const AgentRedTeamingPanel = React.lazy(() => import('../modules/system-settings/AgentRedTeamingPanel'));
const CustomerDnaProfilingPanel = React.lazy(() => import('../modules/sales-crm/CustomerDnaProfilingPanel'));
const AiBoardDeckPanel = React.lazy(() => import('../modules/command-center/AiBoardDeckPanel'));
const AutonomousOkrPanel = React.lazy(() => import('../modules/command-center/AutonomousOkrPanel'));
const AiContractIntelligencePanel = React.lazy(() => import('../modules/system-settings/AiContractIntelligencePanel'));
const RevenueRecognitionPanel = React.lazy(() => import('../modules/finance-accounting/RevenueRecognitionPanel'));
const DataPrivacyPdpaPanel = React.lazy(() => import('../modules/system-settings/DataPrivacyPdpaPanel'));
const PartnerResellerPanel = React.lazy(() => import('../modules/sales-crm/PartnerResellerPanel'));
const TechDebtMigrationPanel = React.lazy(() => import('../modules/dev-ops/TechDebtMigrationPanel'));
const NoCodeBpaPanel = React.lazy(() => import('../modules/system-settings/NoCodeBpaPanel'));
const MarketLocalizationPanel = React.lazy(() => import('../modules/knowledge-library/MarketLocalizationPanel'));
const HyperPersonalizationPanel = React.lazy(() => import('../modules/marketing-growth/HyperPersonalizationPanel'));
const FeatureFlagsEntitlementPanel = React.lazy(() => import('../modules/product-studio/FeatureFlagsEntitlementPanel'));
const MultiVariatePricingPanel = React.lazy(() => import('../modules/sales-crm/MultiVariatePricingPanel'));
const CompetitiveWarRoomPanel = React.lazy(() => import('../modules/marketing-growth/CompetitiveWarRoomPanel'));
const B2bMarketplacePanel = React.lazy(() => import('../modules/product-studio/B2bMarketplacePanel'));
const CustomerSuccessAcademyPanel = React.lazy(() => import('../modules/knowledge-library/CustomerSuccessAcademyPanel'));
const BiDirectionalErpSyncPanel = React.lazy(() => import('../modules/system-settings/BiDirectionalErpSyncPanel'));
const CreditScoringCapitalPanel = React.lazy(() => import('../modules/finance-accounting/CreditScoringCapitalPanel'));
const EsgImpactMarketplacePanel = React.lazy(() => import('../modules/finance-accounting/EsgImpactMarketplacePanel'));
const AgentRevenueSharingPanel = React.lazy(() => import('../modules/ai-nhan-su/AgentRevenueSharingPanel'));
const PostQuantumVaultPanel = React.lazy(() => import('../modules/system-settings/PostQuantumVaultPanel'));
const PatentAutoDraftingPanel = React.lazy(() => import('../modules/system-settings/PatentAutoDraftingPanel'));
const VirtualDataRoomPanel = React.lazy(() => import('../modules/finance-accounting/VirtualDataRoomPanel'));
const IotEdgeScaleSyncPanel = React.lazy(() => import('../modules/finance-accounting/IotEdgeScaleSyncPanel'));
const BilingualVoiceBridgePanel = React.lazy(() => import('../modules/sales-crm/BilingualVoiceBridgePanel'));
const KnowledgeGraphMeshPanel = React.lazy(() => import('../modules/knowledge-library/KnowledgeGraphMeshPanel'));
const GeneticPromptMutationPanel = React.lazy(() => import('../modules/ai-nhan-su/GeneticPromptMutationPanel'));
const SatelliteOfflineMeshPanel = React.lazy(() => import('../modules/system-settings/SatelliteOfflineMeshPanel'));
const SpatialAccountingBoardroomPanel = React.lazy(() => import('../modules/command-center/SpatialAccountingBoardroomPanel'));
const SovereignTransferPricingPanel = React.lazy(() => import('../modules/finance-accounting/SovereignTransferPricingPanel'));
const DroneLidarInventoryPanel = React.lazy(() => import('../modules/finance-accounting/DroneLidarInventoryPanel'));
const ZeroKnowledgeAuditPanel = React.lazy(() => import('../modules/finance-accounting/ZeroKnowledgeAuditPanel'));
const OvernightYieldSweepPanel = React.lazy(() => import('../modules/finance-accounting/OvernightYieldSweepPanel'));
const SmartContractEscrowPanel = React.lazy(() => import('../modules/finance-accounting/SmartContractEscrowPanel'));
const MacroeconomicStressSimulatorPanel = React.lazy(() => import('../modules/analytics-models-sandbox/MacroeconomicStressSimulatorPanel'));
const SentientSingularityPanel = React.lazy(() => import('../modules/command-center/SentientSingularityPanel'));
const MarketDemandScannerPanel = React.lazy(() => import('../modules/marketing-growth/MarketDemandScannerPanel'));
const RevenueOrchestrationPanel = React.lazy(() => import('../modules/finance-accounting/RevenueOrchestrationPanel'));
const AutoLaunchPipelinePanel = React.lazy(() => import('../modules/product-studio/AutoLaunchPipelinePanel'));
const CrossAssetSynergyBusPanel = React.lazy(() => import('../modules/product-studio/CrossAssetSynergyBusPanel'));
const A11yAccessibilityAuditPanel = React.lazy(() => import('../modules/system-settings/A11yAccessibilityAuditPanel'));
const CoreWebVitalsOptimizationPanel = React.lazy(() => import('../modules/system-settings/CoreWebVitalsOptimizationPanel'));
const IsoSoftwareQualityBenchmarkPanel = React.lazy(() => import('../modules/dev-ops/IsoSoftwareQualityBenchmarkPanel'));
const GameQaBugDensityPanel = React.lazy(() => import('../modules/product-studio/GameQaBugDensityPanel'));
const VmafVideoQualityPanel = React.lazy(() => import('../modules/marketing-growth/VmafVideoQualityPanel'));
const MobileBuildPublishPanel = React.lazy(() => import('../modules/product-studio/MobileBuildPublishPanel'));
const GameStorePublishPanel = React.lazy(() => import('../modules/product-studio/GameStorePublishPanel'));
const OpenSourcePublishPanel = React.lazy(() => import('../modules/dev-ops/OpenSourcePublishPanel'));
const EdgeComputeRoutingPanel = React.lazy(() => import('../modules/system-settings/EdgeComputeRoutingPanel'));
const AgentConsensusVotingPanel = React.lazy(() => import('../modules/ai-nhan-su/AgentConsensusVotingPanel'));
const ContinuousPmfHeatmapPanel = React.lazy(() => import('../modules/product-studio/ContinuousPmfHeatmapPanel'));
const ApiFederationGatewayPanel = React.lazy(() => import('../modules/dev-ops/ApiFederationGatewayPanel'));
const ExecutiveEarphoneAudioBriefingPanel = React.lazy(() => import('../modules/command-center/ExecutiveEarphoneAudioBriefingPanel'));
const NotionObsidianKnowledgeBridgePanel = React.lazy(() => import('../modules/knowledge-base/NotionObsidianKnowledgeBridgePanel'));
const EnterpriseTelemetryStreamPanel = React.lazy(() => import('../modules/system-settings/EnterpriseTelemetryStreamPanel'));
const MultiFactoryGpuSchedulerPanel = React.lazy(() => import('../modules/ai-nhan-su/MultiFactoryGpuSchedulerPanel'));
const CompanyInABoxClonerPanel = React.lazy(() => import('../modules/command-center/CompanyInABoxClonerPanel'));
const VcInvestorMatcherPanel = React.lazy(() => import('../modules/sales-crm/VcInvestorMatcherPanel'));
const VisionFactorySurveillancePanel = React.lazy(() => import('../modules/system-settings/VisionFactorySurveillancePanel'));
const CrossChainLiquidityBridgePanel = React.lazy(() => import('../modules/system-settings/CrossChainLiquidityBridgePanel'));
const AgentCircuitBreakerPanel = React.lazy(() => import('../modules/dev-ops/AgentCircuitBreakerPanel'));
const OneClickDeployPanel = React.lazy(() => import('../modules/dev-ops/OneClickDeployPanel'));
const AiCodeDiffPanel = React.lazy(() => import('../modules/dev-ops/AiCodeDiffPanel'));
const SystemSelfHealingDoctorPanel = React.lazy(() => import('../modules/dev-ops/SystemSelfHealingDoctorPanel'));
const AgentLongTermMemoryPanel = React.lazy(() => import('../modules/knowledge-library/AgentLongTermMemoryPanel'));
const KnowledgeRagPipelinePanel = React.lazy(() => import('../modules/knowledge-library/KnowledgeRagPipelinePanel'));
const ContinuousLearningPanel = React.lazy(() => import('../modules/knowledge-library/ContinuousLearningPanel'));
const SearchGroundingPanel = React.lazy(() => import('../modules/knowledge-library/SearchGroundingPanel'));
const AutonomousEscalationPanel = React.lazy(() => import('../modules/command-center/AutonomousEscalationPanel'));
const CloudCostCreditsOptimizerPanel = React.lazy(() => import('../modules/system-settings/CloudCostCreditsOptimizerPanel'));
const WebRobotSessionGuardPanel = React.lazy(() => import('../modules/system-settings/WebRobotSessionGuardPanel'));
const AiMediaHybridConnectorsPanel = React.lazy(() => import('../modules/system-settings/AiMediaHybridConnectorsPanel'));
const FigmaCodeBridgePanel = React.lazy(() => import('../modules/system-settings/FigmaCodeBridgePanel'));


type Tone = 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
type CardConfig = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
  items: string[];
};
type StaticWorkspaceConfig = {
  title: string;
  description: string;
  chips: string[];
  cards: CardConfig[];
  compactNoticeOn?: string;
};


const DEFAULT_SUBTAB: Record<string, string> = Object.fromEntries(
  Object.entries(SUB_TABS_CONFIG).map(([key, tabs]) => [key, tabs[0]?.id || 'overview']),
);

const STATIC_WORKSPACES: Partial<Record<TabType, StaticWorkspaceConfig>> = {
  ceo_command: {
    title: 'Executive Control Center',
    description: 'Tổng quan chỉ số sức khỏe doanh nghiệp, danh mục phê duyệt và cảnh báo rủi ro vận hành.',
    chips: ['Tổng quan hôm nay', 'Cảnh báo rủi ro', 'Hộp phê duyệt'],
    compactNoticeOn: 'today',
    cards: [
      { eyebrow: 'Ưu tiên vận hành', title: 'Danh mục quyết định', description: 'Tập trung rà soát các điểm nghẽn tiến độ và phê duyệt ngân sách cấp cao.', icon: ClipboardList, tone: 'cyan', items: ['Quyết định sản phẩm', 'Duyệt khoản thu chi lớn', 'Ưu tiên chiến lược'] },
      { eyebrow: 'Tài chính & Dòng tiền', title: 'Sức khỏe tài chính', description: 'Giám sát chỉ số dòng tiền thực thu, ngân sách dự án và cảnh báo vượt hạn mức.', icon: TrendingUp, tone: 'emerald', items: ['Dòng tiền thuần', 'Công nợ quá hạn', 'Báo cáo quản trị'] },
      { eyebrow: 'Đội ngũ Agent AI', title: 'Nhiệm vụ đang thực thi', description: 'Giám sát tiến độ thực hiện nhiệm vụ tự trị của các agent AI toàn hệ thống.', icon: FolderKanban, tone: 'violet', items: ['Tác vụ đang chạy', 'Hàng đợi phê duyệt', 'Bằng chứng thực thi'] },
      { eyebrow: 'Quản trị rủi ro', title: 'Điểm kiểm soát', description: 'Cảnh báo tự động các rủi ro phát sinh về pháp lý, chứng từ và hạn mức.', icon: ShieldCheck, tone: 'amber', items: ['Kiểm soát chứng từ', 'Cảnh báo ngân sách', 'Dừng khẩn cấp'] },
    ],
  },
  product_studio: {
    title: 'Product Studio Workspace',
    description: 'Quản lý danh mục sản phẩm, lộ trình tính năng, phát hành và phản hồi khách hàng.',
    chips: ['Danh mục sản phẩm', 'Lộ trình phát triển', 'Bản phát hành'],
    compactNoticeOn: 'release',
    cards: [
      { eyebrow: 'Danh mục', title: 'Sản phẩm chủ lực', description: 'Theo dõi tiến độ phát triển các gói sản phẩm và tính năng chính.', icon: FolderKanban, tone: 'cyan', items: ['LedgerFlow OS', 'Phân hệ Kế toán VAS', 'Agent Assistant AI'] },
      { eyebrow: 'Lộ trình phát triển', title: 'Roadmap Sprint', description: 'Tập trung triển khai và kiểm thử dứt điểm từng cột mốc tính năng.', icon: Target, tone: 'emerald', items: ['Tối ưu UI/UX', 'Hoàn thiện API Gate', 'Kiểm thử khép kín'] },
      { eyebrow: 'Chất lượng & QC', title: 'Tiêu chuẩn phát hành', description: 'Đảm bảo giao diện chuẩn mực, tối ưu hiệu năng và an toàn mã nguồn.', icon: FileCheck2, tone: 'violet', items: ['Build ổn định 100%', 'Giao diện trực quan', 'Bảo mật kho khóa'] },
      { eyebrow: 'Phát hành', title: 'Release Center', description: 'Quản lý các bản phát hành nội bộ và môi trường thử nghiệm.', icon: Rocket, tone: 'amber', items: ['Local Preview', 'Bản phát hành chốt', 'Nhật ký thay đổi'] },
    ],
  },
  marketing_growth: {
    title: 'Marketing & Growth Engine',
    description: 'Điều phối chiến dịch tiếp thị, lịch sản xuất nội dung và đo lường phễu chuyển đổi.',
    chips: ['Chiến dịch tiếp thị', 'Lịch nội dung', 'Phễu chuyển đổi'],
    compactNoticeOn: 'content',
    cards: [
      { eyebrow: 'Chiến dịch', title: 'Chiến dịch đang chạy', description: 'Theo dõi mục tiêu tiếp thị, thông điệp truyền thông và tiến độ triển khai.', icon: Rocket, tone: 'cyan', items: ['Kênh truyền thông', 'Thông điệp cốt lõi', 'Chỉ số KPI'] },
      { eyebrow: 'Nội dung', title: 'Lịch biên tập nội dung', description: 'Quản lý danh mục bài viết, tài liệu sản phẩm và bài đăng đa kênh.', icon: Mail, tone: 'violet', items: ['Bài viết chuyên sâu', 'Video giới thiệu', 'Trang Landing Page'] },
      { eyebrow: 'Tăng trưởng', title: 'Chỉ số chuyển đổi', description: 'Đo lường hiệu quả thu hút khách hàng tiềm năng và tỷ lệ chuyển đổi thực tế.', icon: TrendingUp, tone: 'emerald', items: ['Leads mới', 'Tỷ lệ chuyển đổi', 'Phản hồi người dùng'] },
      { eyebrow: 'Chiến lược', title: 'Tối ưu hóa tiếp thị', description: 'Loại bỏ nội dung thừa, tập trung vào các thông điệp có tỷ lệ phản hồi cao nhất.', icon: ShieldCheck, tone: 'amber', items: ['Đo lường A/B', 'Tối ưu Call-to-Action', 'Phân tích ROI'] },
    ],
  },
  sales_crm: {
    title: 'Sales, Video Marketing & CRM Intelligence',
    description: 'Theo dõi cơ hội bán hàng, phễu chuyển đổi Lead, Video Tiếp thị Đa nền tảng (TikTok, Reels, YouTube), Quảng cáo Sản phẩm/Game nội bộ và Affiliate Marketing.',
    chips: ['Phễu bán hàng', 'Video Marketing (TikTok/Reels/Shorts)', 'Affiliate Revenue', 'Quảng cáo Sản phẩm/Game'],
    compactNoticeOn: 'followup',
    cards: [
      { eyebrow: 'Phễu bán hàng', title: 'Cơ hội kinh doanh', description: 'Phân loại và giám sát các cơ hội bán hàng theo từng giai đoạn phễu.', icon: BarChart3, tone: 'cyan', items: ['Leads tiềm năng', 'Đang đàm phán', 'Hợp đồng chốt'] },
      { eyebrow: 'Video & Affiliate', title: 'Tiếp thị Video Đa kênh', description: 'Đăng Video kiếm tiền AdSense/Creator Fund + kéo traffic dùng phần mềm & game + hoa hồng Affiliate.', icon: Rocket, tone: 'violet', items: ['Video TikTok / Reels / Shorts', 'Leads phần mềm & game nội bộ', 'Doanh thu Affiliate Marketing'] },
      { eyebrow: 'Chăm sóc', title: 'Lịch tương tác', description: 'Lịch hẹn nhắc nhở tư vấn, gửi báo giá và theo dõi phản hồi của khách hàng.', icon: UsersRound, tone: 'emerald', items: ['Lịch gọi tư vấn', 'Gửi báo giá bổ sung', 'Theo dõi thanh toán'] },
      { eyebrow: 'Dữ liệu CRM', title: 'Hồ sơ khách hàng sạch', description: 'Quản lý lịch sử tương tác và ghi chú giao dịch tập trung, chuẩn hóa.', icon: ShieldCheck, tone: 'amber', items: ['Lịch sử giao dịch', 'Ghi chú nhu cầu', 'Trạng thái tài khoản'] },
    ],
  },
  ai_factory: {
    title: 'AI Workforce Command Center',
    description: 'Điều phối, phân công và kiểm soát vận hành tự động của đội ngũ trợ lý AI.',
    chips: ['Đội ngũ Agent', 'Hàng đợi nhiệm vụ', 'Hệ thống an toàn'],
    compactNoticeOn: 'automation',
    cards: [
      { eyebrow: 'Đội ngũ Agent', title: 'Danh mục Trợ lý AI', description: 'Phân công nhiệm vụ chuyên biệt cho từng Agent: Phân tích, Kiểm soát, Soạn thảo.', icon: Bot, tone: 'violet', items: ['Phân công tác vụ', 'Theo dõi kết quả', 'Phê duyệt đầu ra'] },
      { eyebrow: 'Bảo mật & Safe-guard', title: 'Lớp kiểm soát an toàn', description: 'Đảm bảo các hành động quan trọng (xóa dữ liệu, gửi email, đẩy code) phải qua phê duyệt.', icon: ShieldCheck, tone: 'emerald', items: ['Duyệt trước khi thực thi', 'Dừng khẩn cấp', 'Mã hóa khóa API'] },
      { eyebrow: 'Hàng đợi', title: 'Tiến trình chạy ngầm', description: 'Theo dõi các tác vụ xử lý dữ liệu và tự động hóa đang vận hành ở backend.', icon: Sparkles, tone: 'cyan', items: ['Tiến trình đang chạy', 'Tác vụ hoàn thành', 'Xử lý ngoại lệ'] },
      { eyebrow: 'Minh bạch', title: 'Nhật ký thực thi', description: 'Lưu trữ nhật ký hoạt động và bằng chứng thực thi chi tiết của các Agent.', icon: FileCheck2, tone: 'amber', items: ['Nhật ký Audit Log', 'Bằng chứng thực thi', 'Minh bạch quy trình'] },
    ],
  },
};

function LoadingFallback() {
  return <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6" aria-label="Đang tải module"><Skeleton className="h-5 w-44" variant="text" /><Skeleton className="h-4 w-full" variant="text" /><Skeleton className="h-4 w-4/5" variant="text" /></div>;
}

function WorkspaceHero({ title, description, chips = [] }: { title: string; description: string; chips?: string[] }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/20 p-4 sm:p-5 text-left shadow-xl shadow-black/30 backdrop-blur-xl transition-all">
      {/* Dual ambient radial glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/15 to-purple-500/0 blur-2xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">LedgerFlow OS Enterprise</p>
          </div>
          {chips.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-indigo-300 shadow-sm">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-xs font-semibold leading-relaxed text-slate-300/90">{description}</p>
      </div>
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

function CompactModuleNotice() {
  return (
    <SimplePanelCard
      eyebrow="Đã tinh gọn"
      title="Nội dung nội bộ đã được ẩn khỏi giao diện chính"
      description="Prompt cho AI, checklist dài, log kiểm thử và hướng dẫn nội bộ không còn dàn trên màn hình. Khi cần kiểm tra sâu, mở panel chi tiết riêng."
      icon={ShieldCheck}
      status="Review mode"
      tone="slate"
      items={[
        'UI chỉ hiển thị trạng thái và hành động cần bấm',
        'Logic, log và prompt chạy ngầm hoặc nằm trong tài liệu',
        'Mỗi module giữ đúng mục đích nghiệp vụ chính',
        'Giảm chữ dài để review nhanh trên Replit/local',
      ]}
    />
  );
}

function StaticWorkspace({ config, subtab }: { config: StaticWorkspaceConfig; subtab: string }) {
  return (
    <div className="space-y-5">
      <WorkspaceHero title={config.title} description={config.description} chips={config.chips} />
      <CardGrid>
        {config.cards.map((card) => <SimplePanelCard key={card.title} {...card} />)}
      </CardGrid>
      {subtab === config.compactNoticeOn && <CompactModuleNotice />}
    </div>
  );
}

function CommandCenterWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'autopilot' || subtab === 'ceo_autopilot' || subtab === 'decision_cycle') return <AiCeoAutopilotPanel />;
  if (subtab === 'second_brain' || subtab === 'thoughts' || subtab === 'brain') return <FounderSecondBrainPanel />;
  if (subtab === 'advisory_council' || subtab === 'advisors' || subtab === 'council') return <VirtualAdvisoryCouncilPanel />;
  if (subtab === 'mobile_dashboard' || subtab === 'founder_kpi' || subtab === 'ceo_mobile') return <FounderMobileDashboardPanel />;
  if (subtab === 'voice_command' || subtab === 'voice_ceo' || subtab === 'voice') return <VoiceCeoCommandPanel />;
  if (subtab === 'board_deck' || subtab === 'investor_memo') return <AiBoardDeckPanel />;
  if (subtab === 'okr_engine' || subtab === 'autonomous_okr') return <AutonomousOkrPanel />;
  if (subtab === 'spatial_boardroom' || subtab === 'spatial_3d' || subtab === 'webxr') return <SpatialAccountingBoardroomPanel />;
  if (subtab === 'singularity' || subtab === 'sentient_singularity' || subtab === 'level8_agi') return <SentientSingularityPanel />;
  if (subtab === 'earphone_audio' || subtab === 'earphone' || subtab === 'whisper') return <ExecutiveEarphoneAudioBriefingPanel />;
  if (subtab === 'escalation_center' || subtab === 'escalation' || subtab === 'alerting') return <AutonomousEscalationPanel />;
  if (subtab === 'company_cloner' || subtab === 'cloner' || subtab === 'franchising') return <CompanyInABoxClonerPanel />;
  if (subtab === 'budget_governor' || subtab === 'governor') return <BudgetGovernorPanel />;
  if (subtab === 'kill_switch' || subtab === 'emergency_stop') return <EmergencyKillSwitchPanel />;
  if (subtab === 'agm_governance' || subtab === 'shareholders' || subtab === 'resolutions') return <AgmGovernancePanel />;
  if (subtab === 'boardroom' || subtab === 'consensus' || subtab === 'delphi') {
    return (
      <div className="space-y-5">
        <ConstitutionalConsensusBoardPanel />
      </div>
    );
  }
  if (subtab === 'branches' || subtab === 'franchise' || subtab === 'virtual_branches') {
    return (
      <div className="space-y-5">
        <VirtualBranchManagerPanel />
      </div>
    );
  }
  if (subtab === 'activity_stream' || subtab === 'pulse') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <UnifiedActivityStreamPanel />
      </div>
    );
  }
  if (subtab === 'dept_health' || subtab === 'health') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <DepartmentHealthPanel />
      </div>
    );
  }
  if (subtab === 'calendar' || subtab === 'operating_calendar') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <CompanyCalendarPanel />
      </div>
    );
  }
  if (subtab === 'overview' || subtab === 'today') {
    return (
      <div className="space-y-5">
        <CEOOverviewPanel />
      </div>
    );
  }
  if (subtab === 'autonomous_command') {
    return (
      <div className="space-y-5">
        <FounderControlPanel />
        <AiAgentControlCenter />
        <NorthStarMetricBuilder />
        <ExecutiveBoardroomPanel />
      </div>
    );
  }
  if (subtab === 'standup_rhythm') {
    return (
      <div className="space-y-5">
        <OnboardingGuide />
        <FounderBurnoutMonitor />
        <FounderLabsDock />
      </div>
    );
  }
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function ProductStudioWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'portfolio') return <WebAccountingRoadmap />;
  if (subtab === 'ideation') return <ProductIdeationLab />;
  if (subtab === 'games_ml') return <GameAndMLWorkbench />;
  if (subtab === 'game_builder') return <GameStudioBuilder />;
  if (subtab === 'game_assets') return <GameAssetStudioPanel />;
  if (subtab === 'smoke_test') return <VaporwareSmokeTester />;
  if (subtab === 'entitlements' || subtab === 'feature_flags') return <FeatureFlagsEntitlementPanel />;
  if (subtab === 'b2b_marketplace' || subtab === 'marketplace_modules') return <B2bMarketplacePanel />;
  if (subtab === 'asset_foundry') return <AssetFoundryPanel />;
  if (subtab === 'zero_touch' || subtab === 'commerce_loop' || subtab === 'revenue_loop') return <ZeroTouchLoopPanel />;
  if (subtab === 'auto_launch' || subtab === 'launchpad' || subtab === 'one_click_launch') return <AutoLaunchPipelinePanel />;
  if (subtab === 'synergy_bus' || subtab === 'cross_asset' || subtab === 'asset_bus') return <CrossAssetSynergyBusPanel />;
  if (subtab === 'game_qa' || subtab === 'bug_density' || subtab === 'playtest') return <GameQaBugDensityPanel />;
  if (subtab === 'mobile_publish' || subtab === 'app_store' || subtab === 'google_play') return <MobileBuildPublishPanel />;
  if (subtab === 'game_store' || subtab === 'steam' || subtab === 'itch_io') return <GameStorePublishPanel />;
  if (subtab === 'continuous_pmf_heatmap' || subtab === 'pmf_heatmap' || subtab === 'pmf' || subtab === 'sean_ellis') return <ContinuousPmfHeatmapPanel />;
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function KnowledgeLibraryWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'auto_harvest' || subtab === 'harvested' || subtab === 'insights') return <AutoHarvestedInsightsPanel />;
  if (subtab === 'semantic_search' || subtab === 'rag_search' || subtab === 'hybrid_search') return <SemanticRagSearchPanel />;
  if (subtab === 'market_localization' || subtab === 'i18n' || subtab === 'locales') return <MarketLocalizationPanel />;
  if (subtab === 'success_academy' || subtab === 'academy' || subtab === 'training') return <CustomerSuccessAcademyPanel />;
  if (subtab === 'knowledge_graph' || subtab === 'graph_mesh' || subtab === 'entity_graph') return <KnowledgeGraphMeshPanel />;
  if (subtab === 'notion_obsidian' || subtab === 'second_brain_sync' || subtab === 'obsidian') return <NotionObsidianKnowledgeBridgePanel />;
  if (subtab === 'agent_memory' || subtab === 'long_term_memory') return <AgentLongTermMemoryPanel />;
  if (subtab === 'knowledge_rag' || subtab === 'rag_pipeline') return <KnowledgeRagPipelinePanel />;
  if (subtab === 'continuous_learning' || subtab === 'learning_engine') return <ContinuousLearningPanel />;
  if (subtab === 'search_grounding' || subtab === 'grounded_search' || subtab === 'fact_check') return <SearchGroundingPanel />;
  const mode = subtab === 'rag_simulator'
    ? 'rag_simulator'
    : subtab === 'operating_layer'
    ? 'operating_layer'
    : subtab === 'inter_agent_protocol'
    ? 'inter_agent_protocol'
    : subtab === 'swarm_orchestrator'
    ? 'swarm_orchestrator'
    : 'library';
  return <KnowledgeBaseTab initialSubTab={mode} />;
}

function MarketingWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'video_production' || subtab === 'tiktok_studio' || subtab === 'capcut') return <VideoProductionStudioPanel />;
  if (subtab === 'marketing_bot' || subtab === 'broadcast' || subtab === 'whatsapp_bot' || subtab === 'telegram_bot') return <MultiChannelMarketingBotPanel />;
  if (subtab === 'brand_radar' || subtab === 'pr_radar' || subtab === 'reputation') return <BrandReputationRadarPanel />;
  if (subtab === 'seo' || subtab === 'seo_topical' || subtab === 'backlinks') return <SeoTopicalAuthorityPanel />;
  if (subtab === 'social_swarm' || subtab === 'video_campaigns' || subtab === 'reels') return <SocialSwarmCampaignPanel />;
  if (subtab === 'competitor_radar' || subtab === 'competitor' || subtab === 'battle_cards') return <MarketIntelligencePanel />;
  if (subtab === 'campaigns') return <div className="space-y-5"><CampaignsLab /><SyntheticMarketSimulatorPanel /></div>;
  if (subtab === 'content') return <ContentLab />;
  if (subtab === 'video_studio') return <DigitalStudioLab />;
  if (subtab === 'hyper_personalization' || subtab === 'personalization') return <HyperPersonalizationPanel />;
  if (subtab === 'war_room' || subtab === 'competitive_war_room') return <CompetitiveWarRoomPanel />;
  if (subtab === 'demand_scanner' || subtab === 'market_demand' || subtab === 'signals') return <MarketDemandScannerPanel />;
  if (subtab === 'vmaf_video' || subtab === 'vmaf' || subtab === 'video_quality') return <VmafVideoQualityPanel />;
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function SalesCRMWorkspace({ subtab, staticConfig }: { subtab: string; staticConfig: StaticWorkspaceConfig }) {
  if (subtab === 'voice_sentiment' || subtab === 'nps_csat' || subtab === 'sentiment') return <NpsCsatVoiceSentimentPanel />;
  if (subtab === 'affiliate_commission' || subtab === 'referrals' || subtab === 'commissions') return <AffiliateCommissionPanel />;
  if (subtab === 'helpdesk' || subtab === 'voice_ai' || subtab === 'call_center') return <VoiceHelpdeskPanel />;
  if (subtab === 'customer_health' || subtab === 'health_score' || subtab === 'churn') return <CustomerHealthScorePanel />;
  if (subtab === 'ai_bonus' || subtab === 'escrow_bonus') return <AiBonusEscrowPanel />;
  if (subtab === 'revenue_sharing' || subtab === 'creator_revenue') return <AgentRevenueSharingPanel />;
  if (subtab === 'genetic_prompts' || subtab === 'prompt_mutation' || subtab === 'genetic_evolution') return <GeneticPromptMutationPanel />;
  if (subtab === 'support' || subtab === 'customer_support' || subtab === 'deflection') return <AutonomousSupportPanel />;
  if (subtab === 'revenue_flywheel' || subtab === 'flywheel') return <RevenueFlywheelPanel />;
  if (subtab === 'live_pipeline') return <SalesCRMWorkspaceLive />;
  if (subtab === 'funnel_lab') return <CustomerConversionLab />;
  if (subtab === 'pricing_ltv') return <div className="space-y-5"><PricingAndLTVLab /><DynamicRepricingPanel /></div>;
  if (subtab === 'referral_nps') return <ReferralAndNPSLab />;
  if (subtab === 'loyalty_gamification' || subtab === 'loyalty' || subtab === 'gamification') return <LoyaltyGamificationPanel />;
  if (subtab === 'plg_conversion' || subtab === 'plg' || subtab === 'upsell_trigger') return <PlgConversionPanel />;
  if (subtab === 'customer_dna' || subtab === 'dna_profiling' || subtab === 'behavioral_segmentation') return <CustomerDnaProfilingPanel />;
  if (subtab === 'partner_reseller' || subtab === 'reseller' || subtab === 'channel_partners') return <PartnerResellerPanel />;
  if (subtab === 'pricing_optimization' || subtab === 'elasticity' || subtab === 'wtp') return <MultiVariatePricingPanel />;
  if (subtab === 'voice_bridge' || subtab === 'bilingual_voice' || subtab === 'intl_negotiation') return <BilingualVoiceBridgePanel />;
  if (subtab === 'vc_matcher' || subtab === 'pitch_deck' || subtab === 'investor_match') return <VcInvestorMatcherPanel />;
  return (
    <div className="space-y-6">
      <SalesCRMWorkspaceLive />
    </div>
  );
}

function FinanceWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'crypto_treasury' || subtab === 'web3' || subtab === 'stablecoins') return <CryptoTreasuryWeb3Panel />;
  if (subtab === 'subscription_billing' || subtab === 'billing' || subtab === 'dunning') return <SubscriptionBillingPanel />;
  if (subtab === 'revenue_recognition' || subtab === 'ifrs15' || subtab === 'deferred_revenue') return <RevenueRecognitionPanel />;
  if (subtab === 'credit_scoring' || subtab === 'working_capital' || subtab === 'underwriting') return <CreditScoringCapitalPanel />;
  if (subtab === 'carbon_offset' || subtab === 'esg_impact' || subtab === 'carbon_marketplace') return <EsgImpactMarketplacePanel />;
  if (subtab === 'vdr_room' || subtab === 'data_room' || subtab === 'due_diligence') return <VirtualDataRoomPanel />;
  if (subtab === 'iot_scale' || subtab === 'scale_sync' || subtab === 'rfid_gate') return <IotEdgeScaleSyncPanel />;
  if (subtab === 'transfer_pricing' || subtab === 'dtaa' || subtab === 'arm_length') return <SovereignTransferPricingPanel />;
  if (subtab === 'drone_lidar' || subtab === 'point_cloud' || subtab === 'volumetric_audit') return <DroneLidarInventoryPanel />;
  if (subtab === 'zk_audit' || subtab === 'zk_proof' || subtab === 'zk_snark') return <ZeroKnowledgeAuditPanel />;
  if (subtab === 'revenue_orchestrator' || subtab === 'revenue_loop' || subtab === 'zero_touch_revenue') return <RevenueOrchestrationPanel />;
  if (subtab === 'yield_sweep' || subtab === 'overnight_yield' || subtab === 'idle_cash') return <OvernightYieldSweepPanel />;
  if (subtab === 'smart_escrow' || subtab === 'escrow_settlement' || subtab === 'smart_contract') return <SmartContractEscrowPanel />;
  if (subtab === 'esg_carbon' || subtab === 'carbon' || subtab === 'sustainability') return <EsgCarbonAccountingPanel />;
  if (subtab === 'cross_border_vat' || subtab === 'reverse_charge' || subtab === 'vat_gst') return <GlobalVatReverseChargePanel />;
  if (subtab === 'ma_valuation' || subtab === 'mergers' || subtab === 'acquisitions') return <MaValuationPanel />;
  if (subtab === 'treasury' || subtab === 'yield_sweep' || subtab === 'bank_sweep') return <TreasuryManagementPanel />;
  if (subtab === 'capital_allocation' || subtab === 'treasury_controller' || subtab === 'dsge') return <CapitalAllocationPanel />;
  if (subtab === 'investors' || subtab === 'cap_table' || subtab === 'equity') return <InvestorRelationsPanel />;
  if (subtab === 'vendor_settlement' || subtab === 'supply_chain' || subtab === 'matching') return <VendorSettlementPanel />;
  if (subtab === 'tax_shield' || subtab === 'compliance_shield') return <TaxComplianceShieldPanel />;
  if (subtab === 'global_adapter' || subtab === 'multi_currency' || subtab === 'ifrs' || subtab === 'fx') return <GlobalLocalizationAdapterPanel />;
  if (subtab === 'incidents' || subtab === 'financial_incidents' || subtab === 'playbook') return <FinancialIncidentPlaybookPanel />;
  if (subtab === 'cashflow') return <RevenueDashboard />;
  if (subtab === 'cashflow_forecast') return <CashFlowForecastDashboard />;
  if (subtab === 'auto_reconciliation') return <AutoReconciliationPanel />;
  if (subtab === 'predictive_accounting') return <PredictiveAccountingPanel />;
  if (subtab === 'ledger') return <LedgerAccountingWorkspace />;
  if (subtab === 'tax_simulator') {
    return (
      <div className="space-y-6">
        <TaxFilingPanel />
        <TaxAuditSimulator />
      </div>
    );
  }
  return <RevenueDashboard />;
}


function AIWorkforceAdvancedWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'tasks' | 'factory' | 'release' | 'robot' | 'patch' | 'health'>('tasks');
  const [robotSubtab, setRobotSubtab] = useState<'skills' | 'bridge' | 'web_robot' | 'lab'>('bridge');
  const [tasksSubtab, setTasksSubtab] = useState<'board' | 'routing' | 'catalog' | 'probation' | 'recruiting' | 'ai_bonus' | 'mobile'>('board');

  return (
    <div className="space-y-5 text-left">
      {/* Streamlined Group Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setActiveGroup('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'tasks'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>📋 Nhiệm vụ, Routing &amp; Thử việc</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('factory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'factory'
              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>Software Factory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('release')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'release'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🛡️ Phê duyệt &amp; Release Gate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('robot')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'robot'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🤖 Skill &amp; Robot Suite</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('patch')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'patch'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔍 Audit &amp; Patch Log</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup('health')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'health'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>Health &amp; Readiness</span>
        </button>
      </div>

      {/* Active Panel Group Content */}
      {activeGroup === 'tasks' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setTasksSubtab('board')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tasksSubtab === 'board' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Bảng Nhiệm vụ Agent
            </button>
            <button
              onClick={() => setTasksSubtab('routing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tasksSubtab === 'routing' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Ma trận Định tuyến Model
            </button>
            <button
              onClick={() => setTasksSubtab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tasksSubtab === 'catalog' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Danh mục Công cụ &amp; Actions
            </button>
            <button
              onClick={() => setTasksSubtab('probation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tasksSubtab === 'probation' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🎓 Thử việc &amp; Đánh giá Năng lực
            </button>
            <button
              onClick={() => setTasksSubtab('recruiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tasksSubtab === 'recruiting' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🧑‍💼 Tuyển dụng &amp; Ứng viên
            </button>
            <button
              onClick={() => setTasksSubtab('ai_bonus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tasksSubtab === 'ai_bonus' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🏆 Quỹ Thưởng &amp; ESOP
            </button>
            <button
              onClick={() => setTasksSubtab('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tasksSubtab === 'mobile' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              📱 Mobile Command
            </button>
          </div>

          {tasksSubtab === 'board' && <AIWorkforceTaskBoard />}
          {tasksSubtab === 'routing' && <ModelDispatchMatrix />}
          {tasksSubtab === 'probation' && <AgentPerformanceReviewPanel />}
          {tasksSubtab === 'recruiting' && <TalentRecruitingPanel />}
          {tasksSubtab === 'ai_bonus' && <AiBonusEscrowPanel />}
          {tasksSubtab === 'mobile' && <AIWorkforceMobileCommandCenter />}
          {tasksSubtab === 'catalog' && (
            <div className="space-y-4">
              <AIWorkforceMissionTemplates />
              <AIWorkforceToolCatalog />
              <AIWorkforceNextBackendActions />
            </div>
          )}
        </div>
      )}

      {activeGroup === 'factory' && (
        <div className="space-y-5 animate-fade-in">
          <FactoryPerformanceDashboard />
          <MultiFactoryDashboard />
          <SoftwareFactoryCatalogPanel />
        </div>
      )}

      {activeGroup === 'release' && (
        <div className="space-y-5 animate-fade-in">
          <MissionReleaseGatePanel />
          <MissionOperatorRunbookPanel />
          <MissionSnapshotExportPanel />
          <MissionReviewNoteSavePanel />
          <AIWorkforceMissionTrace />
        </div>
      )}

      {activeGroup === 'robot' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setRobotSubtab('bridge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                robotSubtab === 'bridge' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              ⚡ Robot Automation Bridge &amp; Synthesizer
            </button>
            <button
              onClick={() => setRobotSubtab('skills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                robotSubtab === 'skills' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              📚 Thư viện Kỹ năng &amp; Fleet Analytics
            </button>
            <button
              onClick={() => setRobotSubtab('web_robot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                robotSubtab === 'web_robot' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🌐 OpenClaw Web Robot &amp; Multi-Platform
            </button>
            <button
              onClick={() => setRobotSubtab('lab')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                robotSubtab === 'lab' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              🤖 Robot Lab
            </button>
          </div>

          {robotSubtab === 'bridge' && (
            <div className="space-y-4">
              <AIWorkforceRobotAutomationBridge />
              <Level6RobotSynthesizerPanel />
            </div>
          )}
          {robotSubtab === 'skills' && (
            <div className="space-y-4">
              <AIWorkforceSkillDirectory />
              <RobotFleetAnalyticsPanel />
            </div>
          )}
          {robotSubtab === 'web_robot' && (
            <div className="space-y-4">
              <OpenClawWebRobotPanel />
              <MultiPlatformRobotSwarmPanel />
            </div>
          )}
          {robotSubtab === 'lab' && (
            <div className="space-y-4">
              <RobotLabPanel />
              <VisualRobotWorkflowCanvas />
            </div>
          )}
        </div>
      )}

      {activeGroup === 'patch' && (
        <div className="space-y-5 animate-fade-in">
          <AIWorkforcePatchReviewSessions />
        </div>
      )}

      {activeGroup === 'health' && (
        <div className="space-y-5 animate-fade-in">
          <WorldClassReadinessPanel />
          <AutomationRulesHealthPanel />
          <SystemStatusPage />
          <AdvancedAIEngine />
          <AIOperationsDaemonPanel />
          <AIWorkforceOpenClawReadiness />
          <WebAISchedulerPanel />
        </div>
      )}
    </div>
  );
}

function AIWorkforceWorkspace({ subtab }: { subtab: string }) {
  const [commandSubtab, setCommandSubtab] = useState<'assistant' | 'staff' | 'builder' | 'ops'>('assistant');

  if (subtab === 'gpu_scheduler' || subtab === 'factory_scheduler' || subtab === 'gpu_allocator') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <MultiFactoryGpuSchedulerPanel />
      </div>
    );
  }

  if (subtab === 'agent_consensus' || subtab === 'consensus' || subtab === 'swarm_voting') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <AgentConsensusVotingPanel />
      </div>
    );
  }

  if (subtab === 'recruiting' || subtab === 'talent' || subtab === 'hiring') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <TalentRecruitingPanel />
      </div>
    );
  }

  if (subtab === 'revenue_sharing' || subtab === 'creator_payout' || subtab === 'agent_marketplace') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <AgentRevenueSharingPanel />
      </div>
    );
  }

  if (subtab === 'ai_bonus') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <AiBonusEscrowPanel />
      </div>
    );
  }

  if (subtab === 'factory_performance') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <FactoryPerformanceDashboard />
      </div>
    );
  }

  if (subtab === 'agent_roi') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <AgentROIDashboard />
      </div>
    );
  }

  if (subtab === 'autonomous_flywheel') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <AutonomousFlywheelCockpit />
      </div>
    );
  }

  if (subtab === 'nexus_cockpit') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <AiRobotUniversalCockpit />
      </div>
    );
  }

  if (subtab === 'apprentice_lab') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <LocalAiApprenticeLabPanel />
      </div>
    );
  }

  if (subtab === 'automation') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <UniversalProjectRobotDock />
        <AutomationRulesPanel />
      </div>
    );
  }

  if (subtab === 'governance' || subtab === 'inter_agent_chat' || subtab === 'swarm_relay' || subtab === 'release' || subtab === 'advanced') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <WorkflowPanel />
        <AIDispatchPanel />
        <InterAgentProtocolPanel />
      </div>
    );
  }

  if (subtab === 'cost_dashboard') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <CostDashboard />
      </div>
    );
  }

  if (subtab === 'robot_workflow') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <FreeToolRobotPanel />
      </div>
    );
  }

  // command (Default)
  return (
    <div className="space-y-4 animate-fade-in text-left">
      <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 w-fit backdrop-blur-xl">
        <button
          onClick={() => setCommandSubtab('assistant')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            commandSubtab === 'assistant' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          🤖 Trợ lý CEO &amp; Prompt Runner
        </button>
        <button
          onClick={() => setCommandSubtab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            commandSubtab === 'staff' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          👥 Danh mục Đội ngũ AI Staff (PeopleTab)
        </button>
        <button
          onClick={() => setCommandSubtab('builder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            commandSubtab === 'builder' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          ⚙️ Lắp ráp Agent &amp; Cấu hình
        </button>
        <button
          onClick={() => setCommandSubtab('ops')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            commandSubtab === 'ops' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          🧭 Trung tâm Vận hành
        </button>
      </div>

      {commandSubtab === 'assistant' && <AIAssistantPanel />}
      {commandSubtab === 'staff' && <PeopleTab />}
      {commandSubtab === 'builder' && <AgentAssemblyBuilder />}
      {commandSubtab === 'ops' && <AIOperationsCenter />}
    </div>
  );
}

function AnalyticsSimulationsWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'market' | 'experiments' | 'deploy'>('market');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('market')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'market'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>📊 Mô phỏng Thị trường & A/B</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('experiments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'experiments'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🧪 Thí nghiệm & Quyết định</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('deploy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'deploy'
              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🚀 Dự toán & Triển khai</span>
        </button>
      </div>

      {activeGroup === 'market' && (
        <div className="space-y-5 animate-fade-in">
          <EnterpriseDigitalTwinPanel />
          <BusinessAbTestingPanel />
          <BusinessSimulationEngine />
          <ABSimulationLab />
          <MarketSurveySimulator />
        </div>
      )}
      {activeGroup === 'experiments' && (
        <div className="space-y-5 animate-fade-in">
          <NLToSqlDataPanel />
          <ExperimentDashboard />
          <ExperimentDecisionLog />
          <MoatDefensibilityTracker />
        </div>
      )}
      {activeGroup === 'deploy' && (
        <div className="space-y-5 animate-fade-in">
          <MoRReadinessChecklist />
          <N8nAutomationBlueprint />
          <StrategicLabsMini />
          <DeployBusiness />
          <BrowserSimulationPlanner />
          <FounderLabsDock embedded />
        </div>
      )}
    </div>
  );
}

function AnalyticsDataEngineeringWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'workbench' | 'science'>('workbench');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('workbench')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'workbench'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>💾 Workbench & Kỹ thuật Dữ liệu</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('science')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'science'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>📈 Dữ liệu Tài chính & ML</span>
        </button>
      </div>

      {activeGroup === 'workbench' && (
        <div className="space-y-5 animate-fade-in">
          <CustomDataWorkbench />
          <DataScienceEngineering />
        </div>
      )}
      {activeGroup === 'science' && (
        <div className="space-y-5 animate-fade-in">
          <FinancialDataScienceLab />
          <MultiIndustryCaseBank />
          <MLApplied />
        </div>
      )}
    </div>
  );
}

function AnalyticsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'ai_sandbox') {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <GeminiPlayground />
        <PromptPlayground />
      </div>
    );
  }
  if (subtab === 'simulations') return <AnalyticsSimulationsWorkspace />;
  if (subtab === 'predictive_revenue' || subtab === 'revenue_forecast' || subtab === 'arr_monte_carlo') return <PredictiveRevenuePanel />;
  if (subtab === 'macro_stress' || subtab === 'stress_test' || subtab === 'dsge_simulation') return <MacroeconomicStressSimulatorPanel />;
  if (subtab === 'data_workbench' || subtab === 'data_science') return <AnalyticsDataEngineeringWorkspace />;
  if (subtab === 'project_memory' || subtab === 'decision_log') return <ProjectMemoryDecisionLog />;
  // python_sandbox is default
  return (
    <div className="space-y-5 animate-fade-in text-left">
      <PythonSandbox />
      <FinancialChartsModelPanel />
      <ProjectMemoryDecisionLog />
    </div>
  );
}

function SettingsDevOpsWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'hub' | 'merge' | 'artifacts'>('hub');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('hub')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'hub'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🚀 Hub Phát hành & CI Doctor</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('merge')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'merge'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔀 Merge & Control PR</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('artifacts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'artifacts'
              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>📦 Artifacts & Dev Handoff</span>
        </button>
      </div>

      {activeGroup === 'hub' && (
        <div className="space-y-5 animate-fade-in">
          <AutonomousSelfMutationPanel />
          <DevOpsReleaseHubPanel />
          <DeveloperIntelligenceHubPanel />
          <BuildMonitorPanel />
          <GitHubCIDoctorLauncher />
        </div>
      )}
      {activeGroup === 'merge' && (
        <div className="space-y-5 animate-fade-in">
          <MergeReadinessCenter />
          <PRControlCenter />
          <ApprovedPrPanel />
          <GitAssistantDaemonPanel />
        </div>
      )}
      {activeGroup === 'artifacts' && (
        <div className="space-y-5 animate-fade-in">
          <ReleaseArtifactCenter />
          <ArtifactInspectorPanel />
          <DevHandoffCenter />
        </div>
      )}
    </div>
  );
}

function SettingsConnectorsWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'hub' | 'contracts' | 'marketplace'>('hub');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('hub')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'hub'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔌 Integration Hub & Connectors</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('contracts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'contracts'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🌐 Web AI & Connector Contracts</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('marketplace')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'marketplace'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🧩 Plugin Marketplace & Ecosystem</span>
        </button>
      </div>

      {activeGroup === 'hub' && (
        <div className="space-y-5 animate-fade-in">
          <IntegrationHub />
          <GitHubConnectorPanel />
          <LocalToolsPanel />
        </div>
      )}
      {activeGroup === 'contracts' && (
        <div className="space-y-5 animate-fade-in">
          <WebAiSyncPanel />
          <ConnectorContractPanel />
          <ConfigHealthMonitor />
        </div>
      )}
      {activeGroup === 'marketplace' && (
        <div className="space-y-5 animate-fade-in">
          <PluginMarketplacePanel />
        </div>
      )}
    </div>
  );
}

function SettingsSecurityWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'doctor' | 'vault' | 'ollama' | 'audit' | 'rbac' | 'self_healing'>('doctor');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('doctor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'doctor'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🩺 Master System Doctor</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('self_healing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'self_healing'
              ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40 shadow-sm shadow-teal-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🛠️ Tự Phục Hồi (Self-Healing)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('rbac')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'rbac'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>⚖️ Phân Quyền (RBAC)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('vault')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'vault'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔐 Key Vault & Cấu hình AI</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('ollama')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'ollama'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🦙 Ollama Offline Hub ($0)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'audit'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🛡️ Bảo mật & Audit Trail</span>
        </button>
      </div>

      {activeGroup === 'doctor' && (
        <div className="space-y-5 animate-fade-in">
          <WS.MasterSystemDoctorDashboard />
        </div>
      )}
      {activeGroup === 'self_healing' && (
        <div className="space-y-5 animate-fade-in">
          <SelfHealingInfraPanel />
        </div>
      )}
      {activeGroup === 'rbac' && (
        <div className="space-y-5 animate-fade-in">
          <RBACManagementPanel />
        </div>
      )}
      {activeGroup === 'vault' && (
        <div className="space-y-5 animate-fade-in">
          <AISettingsManager />
          <AIVaultSecurityPanel />
        </div>
      )}
      {activeGroup === 'ollama' && (
        <div className="space-y-5 animate-fade-in">
          <WS.OllamaLocalModelHubPanel />
        </div>
      )}
      {activeGroup === 'audit' && (
        <div className="space-y-5 animate-fade-in">
          <SecurityPosturePanel />
          <IpPatentGuardPanel />
          <EdgeRoutingHubPanel />
          <LlmCostArbitragePanel />
          <MultiCloudMeshPanel />
          <SocThreatHuntingPanel />
          <PromptSecurityFirewallPanel />
          <ChaosEngineeringPanel />
          <SecurityControlCenter />
          <AuditTrailPanel />
        </div>
      )}

    </div>
  );
}

function SettingsRecoveryWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'diff' | 'rollback'>('diff');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('diff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'diff'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔍 So sánh Patch Diff</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('rollback')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'rollback'
              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm shadow-rose-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔄 Rollback & Khôi phục CI</span>
        </button>
      </div>

      {activeGroup === 'diff' && (
        <div className="space-y-5 animate-fade-in">
          <PatchDiffReviewCenter />
          <SandboxPatchWorkspace />
        </div>
      )}
      {activeGroup === 'rollback' && (
        <div className="space-y-5 animate-fade-in">
          <RollbackCenter />
          <CIRecoveryQueue />
          <CIRunInspectorPanel />
        </div>
      )}
    </div>
  );
}

function SettingsDevOpsInfrastructureWorkspace() {
  const [activeGroup, setActiveGroup] = useState<'devops' | 'recovery'>('devops');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-border-primary">
        <button
          type="button"
          onClick={() => setActiveGroup('devops')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'devops'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>⚙️ Dev Ops & CI/CD</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup('recovery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeGroup === 'recovery'
              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm shadow-rose-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-900 border border-transparent'
          }`}
        >
          <span>🔄 Recovery & Rollback</span>
        </button>
      </div>

      {activeGroup === 'devops' && (
        <div className="space-y-5 animate-fade-in">
          <SettingsDevOpsWorkspace />
        </div>
      )}
      {activeGroup === 'recovery' && (
        <div className="space-y-5 animate-fade-in">
          <SettingsRecoveryWorkspace />
        </div>
      )}
    </div>
  );
}

function SettingsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'chaos_engineering' || subtab === 'fault_injection' || subtab === 'chaos') return <ChaosEngineeringPanel />;
  if (subtab === 'ai_dev_copilot' || subtab === 'refactor' || subtab === 'ast_copilot') return <AiDevCopilotPanel />;
  if (subtab === 'db_sharding' || subtab === 'sharding' || subtab === 'replicas') return <DbAutoShardingPanel />;
  if (subtab === 'pwa_offline' || subtab === 'offline_sync' || subtab === 'service_worker') return <PwaOfflineSyncPanel />;
  if (subtab === 'tenant_onboarding' || subtab === 'onboarding_pipeline' || subtab === 'tenant_setup') return <MultiTenantOnboardingPanel />;
  if (subtab === 'code_review_pr' || subtab === 'code_review' || subtab === 'pr_review') return <AiCodeReviewPrPanel />;
  if (subtab === 'webhook_hub' || subtab === 'webhooks' || subtab === 'zapier_make') return <WebhookIntegrationHubPanel />;
  if (subtab === 'iac_architect' || subtab === 'iac' || subtab === 'cloud_architect') return <IaCCloudArchitectPanel />;
  if (subtab === 'agent_red_team' || subtab === 'red_team' || subtab === 'jailbreak_test') return <AgentRedTeamingPanel />;
  if (subtab === 'contract_intelligence' || subtab === 'legal_risk' || subtab === 'contracts') return <AiContractIntelligencePanel />;
  if (subtab === 'privacy_pdpa' || subtab === 'gdpr' || subtab === 'dsar') return <DataPrivacyPdpaPanel />;
  if (subtab === 'tech_debt' || subtab === 'migration_roadmap') return <TechDebtMigrationPanel />;
  if (subtab === 'no_code_bpa' || subtab === 'bpa' || subtab === 'process_automation') return <NoCodeBpaPanel />;
  if (subtab === 'erp_sync' || subtab === 'misa_sync' || subtab === 'bi_directional_sync') return <BiDirectionalErpSyncPanel />;
  if (subtab === 'post_quantum' || subtab === 'quantum_vault' || subtab === 'fips203') return <PostQuantumVaultPanel />;
  if (subtab === 'patent_drafting' || subtab === 'ip_patent' || subtab === 'wipo') return <PatentAutoDraftingPanel />;
  if (subtab === 'satellite_mesh' || subtab === 'starlink' || subtab === 'offshore_mesh') return <SatelliteOfflineMeshPanel />;
  if (subtab === 'a11y_audit' || subtab === 'accessibility' || subtab === 'wcag') return <A11yAccessibilityAuditPanel />;
  if (subtab === 'web_vitals' || subtab === 'core_web_vitals' || subtab === 'lighthouse') return <CoreWebVitalsOptimizationPanel />;
  if (subtab === 'iso_quality' || subtab === 'iso25010' || subtab === 'software_quality') return <IsoSoftwareQualityBenchmarkPanel />;
  if (subtab === 'open_source' || subtab === 'npm' || subtab === 'docker_registry') return <OpenSourcePublishPanel />;
  if (subtab === 'edge_compute' || subtab === 'load_balancer' || subtab === 'anycast') return <EdgeComputeRoutingPanel />;
  if (subtab === 'api_federation' || subtab === 'graphql_supergraph' || subtab === 'federation') return <ApiFederationGatewayPanel />;
  if (subtab === 'telemetry_stream' || subtab === 'telemetry' || subtab === 'observability') return <EnterpriseTelemetryStreamPanel />;
  if (subtab === 'vision_surveillance' || subtab === 'rtsp_cam' || subtab === 'camera') return <VisionFactorySurveillancePanel />;
  if (subtab === 'cross_chain_liquidity' || subtab === 'rwa_yield' || subtab === 'liquidity_bridge') return <CrossChainLiquidityBridgePanel />;
  if (subtab === 'prompt_firewall' || subtab === 'guardrails' || subtab === 'llm_firewall') return <PromptSecurityFirewallPanel />;
  if (subtab === 'soc_threat' || subtab === 'threat_hunting' || subtab === 'cyber_soc') return <SocThreatHuntingPanel />;
  if (subtab === 'multi_cloud' || subtab === 'dr_mesh' || subtab === 'cloud_mesh') return <MultiCloudMeshPanel />;
  if (subtab === 'llm_arbitrage' || subtab === 'cost_arbitrage') return <LlmCostArbitragePanel />;
  if (subtab === 'marketplace' || subtab === 'plugins') return <PluginMarketplacePanel />;
  if (subtab === 'delegation_matrix') return <AdvancedDelegationMatrixPanel />;
  if (subtab === 'circuit_breaker' || subtab === 'breaker') return <AgentCircuitBreakerPanel />;
  if (subtab === 'code_diff' || subtab === 'diff_engine') return <AiCodeDiffPanel />;
  if (subtab === 'one_click_deploy' || subtab === 'deploy') return <OneClickDeployPanel />;
  if (subtab === 'self_healing_doctor' || subtab === 'system_doctor') return <SystemSelfHealingDoctorPanel />;
  if (subtab === 'cloud_cost' || subtab === 'credit_optimizer') return <CloudCostCreditsOptimizerPanel />;
  if (subtab === 'robot_session_guard' || subtab === 'session_guard') return <WebRobotSessionGuardPanel />;
  if (subtab === 'media_hybrid' || subtab === 'media_connectors') return <AiMediaHybridConnectorsPanel />;
  if (subtab === 'figma_bridge' || subtab === 'figma') return <FigmaCodeBridgePanel />;
  if (subtab === 'sop_runbook') return <SystemSOPRunbookPanel />;
  if (subtab === 'security') return <SettingsSecurityWorkspace />;
  if (subtab === 'connectors') return <SettingsConnectorsWorkspace />;
  if (subtab === 'dev_ops') return <SettingsDevOpsWorkspace />;
  if (subtab === 'recovery_ops') return <SettingsRecoveryWorkspace />;
  if (subtab === 'devops_infrastructure') return <SettingsDevOpsInfrastructureWorkspace />;
  if (subtab === 'readiness' || subtab === 'features') {
    return (
      <div className="space-y-5 animate-fade-in">
        <ReleaseReadinessPanel />
        <FeatureRegistryPanel />
        <AIIntegrationHealthPanel />
        <ApiConnectionHealthMatrix />
      </div>
    );
  }
  // general is default
  return (
    <div className="space-y-5 animate-fade-in">
      <SystemOverviewDaemonPanel />
      <SystemSettingsPanel />
    </div>
  );
}

function OperationsWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'industry_templates') {
    return (
      <div className="space-y-5">
        <ProjectPortfolioPanel />
        <ProcurementLogisticsPanel />
      </div>
    );
  }
  if (subtab === 'admin_ops') return <HRAdminPanel />;
  return <ProjectPortfolioPanel />;
}

function ProjectsDeliveryWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'blockers' || subtab === 'daily_blockers' || subtab === 'critical_path') {
    return <DailyBlockersPanel />;
  }
  if (subtab === 'industry_templates') {
    return (
      <div className="space-y-5">
        <WorkspaceHero
          title="Industry Templates Library"
          description="Thư viện mẫu phân hệ theo ngành (Xây dựng, Dịch vụ, Thương mại, Sản xuất) đóng gói chuẩn VAS."
          chips={['Construction', 'Service', 'Trading', 'Manufacturing']}
        />
        <IndustryTemplatePanel />
        <ProjectPortfolioPanel />
        <ProcurementLogisticsPanel />
      </div>
    );
  }
  if (subtab === 'admin_ops') {
    return (
      <div className="space-y-5">
        <WorkspaceHero
          title="Admin Ops & HR Operations"
          description="Giám sát vận hành hành chính, nhân sự triển khai dự án và quản lý tổ đội thuê ngoài."
          chips={['HR & Admin', 'Project Delivery', 'Labor Management']}
        />
        <HRAdminPanel />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Project Portfolio & Delivery"
        description="Quản lý dự án phát triển sản phẩm, lộ trình triển khai khách hàng, ngân sách dự toán và rủi ro tiến độ."
        chips={['Project Portfolio', 'Delivery Milestone', 'Budget Tracking']}
      />
      <ProjectPortfolioPanel />
    </div>
  );
}

function DocumentsApprovalWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'clm' || subtab === 'contracts' || subtab === 'redline') return <ContractLifecyclePanel />;
  if (subtab === 'audit') {
    return (
      <div className="space-y-5">
        <WorkspaceHero
          title="Kiểm soát hồ sơ"
          description="Kiểm tra chứng từ, bằng chứng nghiệp vụ, rủi ro phê duyệt và các điểm cần bổ sung."
          chips={['Hồ sơ', 'Audit', 'Risk']}
        />
        <InternalAuditWorkspace />
      </div>
    );
  }
  if (subtab === 'evidence') {
    return (
      <div className="space-y-5">
        <WorkspaceHero
          title="Audit trail & bằng chứng"
          description="Tập trung nhật ký kiểm soát, dấu vết thao tác và bằng chứng phục vụ phê duyệt hoặc phát hành."
          chips={['Audit trail', 'Evidence', 'Control']}
        />
        <AuditTrailPanel />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <WorkspaceHero
        title="Hồ sơ & Phê duyệt"
        description="Quản lý luồng duyệt chi phí, yêu cầu phê duyệt, hồ sơ cần kiểm tra và trạng thái xử lý."
        chips={['Phê duyệt', 'Chứng từ', 'Kiểm soát']}
      />
      <ApprovalWorkflow />
    </div>
  );
}

function LegacyWorkspace() {
  return (
    <div className="space-y-5">
      <WorkspaceHero title="Module đã được gom lại" description="Route cũ hoặc module thử nghiệm đã được ẩn khỏi giao diện chính để tránh rối. Hãy dùng các workspace chính ở thanh bên." chips={["Ẩn legacy", "Giao diện gọn", "Review mode"]} />
      <CompactModuleNotice />
    </div>
  );
}

interface WorkspaceRendererProps {
  activeSegment: TabType;
  activeRole?: RoleType;
  isSoloMode?: boolean;
  onNavigate?: (tab: TabType, subTab?: string) => void;
}

export default function WorkspaceRenderer({ activeSegment, activeRole = 'all' }: WorkspaceRendererProps) {
  const { t } = useLanguage();
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>(() => ({ ...DEFAULT_SUBTAB }));
  const [showAdvancedSubtabs, setShowAdvancedSubtabs] = useState(false);

  const { allSubTabs, visibleSubTabs, advancedCount } = useMemo(() => {
    const rawSubTabs = SUB_TABS_CONFIG[activeSegment] || [];
    const isTechRole = ['devops', 'agentops'].includes(activeRole);
    const isPowerUser = ['all', 'founder', 'admin'].includes(activeRole);
    const isFinanceRole = ['cfo', 'accountant', 'finance'].includes(activeRole);
    const filtered = rawSubTabs
      .filter((tab) => {
        // system_settings: hide dev_ops and recovery_ops from non-tech roles
        if (activeSegment === 'system_settings') {
          if (tab.id === 'dev_ops' || tab.id === 'recovery_ops') {
            return isPowerUser || isTechRole;
          }
        }
        // ai_factory: hide governance and advanced sub-tabs from non-power users
        if (activeSegment === 'ai_factory' && (tab.id === 'governance' || tab.id === 'advanced')) {
          return isPowerUser || isTechRole;
        }
        // product_studio: hide smoke_test from general non-tech/non-product roles
        if (activeSegment === 'product_studio' && tab.id === 'smoke_test') {
          return isPowerUser || isTechRole || activeRole === 'product_owner';
        }
        // finance_accounting: hide tax_simulator and audit from general non-finance roles
        if (activeSegment === 'finance_accounting' && (tab.id === 'tax_simulator' || tab.id === 'audit')) {
          return isPowerUser || isFinanceRole;
        }
        return true;
      })
      .map((tab) => {
        const translatedLabel = t(`subtab.${activeSegment}.${tab.id}`, tab.label);
        const tier = classifySubtabTier(tab, activeSegment);
        return { ...tab, label: translatedLabel, tier };
      });

    const core = filtered.filter((tab) => tab.tier === 'core');
    const advanced = filtered.filter((tab) => tab.tier === 'advanced');
    const dev = filtered.filter((tab) => tab.tier === 'dev');

    // Available tabs: exclude dev tabs for executive/standard roles unless tech role
    const availablePool = isTechRole ? filtered : filtered.filter((tab) => tab.tier !== 'dev');
    const availableAdvanced = isTechRole ? filtered.filter((tab) => tab.tier !== 'core') : advanced;

    const currentActiveId = activeSubTabs[activeSegment];
    const currentIsAdvanced = availableAdvanced.some((tab) => tab.id === currentActiveId);

    const visible = (showAdvancedSubtabs || currentIsAdvanced || core.length === 0) ? availablePool : core;

    return {
      allSubTabs: filtered,
      visibleSubTabs: visible,
      advancedCount: availableAdvanced.length,
    };
  }, [activeSegment, activeRole, activeSubTabs, showAdvancedSubtabs, t]);

  const validSubTabIds = useMemo(() => allSubTabs.map((tab) => tab.id), [allSubTabs]);
  const currentSubTabId = resolveWorkspaceSubTab(activeSegment, activeSubTabs[activeSegment], validSubTabIds) || visibleSubTabs[0]?.id || '';

  React.useEffect(() => {
    const match = window.location.hash.match(/\?subtab=([^&]+)/);
    if (!match?.[1]) return;
    const normalized = resolveWorkspaceSubTab(activeSegment, decodeURIComponent(match[1]), validSubTabIds);
    if (!normalized) return;
    setActiveSubTabs((prev) => (prev[activeSegment] === normalized ? prev : { ...prev, [activeSegment]: normalized }));
  }, [activeSegment, validSubTabIds]);

  const [, startTransition] = React.useTransition();

  const handleSubTabChange = (newSubTabId: string) => {
    const normalized = resolveWorkspaceSubTab(activeSegment, newSubTabId, validSubTabIds) || newSubTabId;
    startTransition(() => {
      setActiveSubTabs((prev) => ({ ...prev, [activeSegment]: normalized }));
    });
    window.location.hash = `/${activeSegment}?subtab=${normalized}`;
  };

  const staticConfig = STATIC_WORKSPACES[activeSegment];

  return (
    <div key={`${activeSegment}-${currentSubTabId}`} className="space-y-6 animate-fade-in transition-all duration-300">
      {allSubTabs.length > 1 && (
        <WorkspaceSubNavigation
          tabs={visibleSubTabs}
          activeTab={currentSubTabId}
          onChange={handleSubTabChange}
          onToggleAdvanced={() => setShowAdvancedSubtabs((prev) => !prev)}
          showAdvanced={showAdvancedSubtabs}
          advancedCount={advancedCount}
        />
      )}
      <Suspense fallback={<LoadingFallback />}>
        {staticConfig && !['ceo_command', 'ai_factory', 'marketing_growth', 'sales_crm', 'product_studio'].includes(activeSegment) && <StaticWorkspace config={staticConfig} subtab={currentSubTabId} />}
        {activeSegment === 'ceo_command' && staticConfig && <CommandCenterWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'product_studio' && staticConfig && <ProductStudioWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'knowledge_library' && <KnowledgeLibraryWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'marketing_growth' && staticConfig && <MarketingWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'sales_crm' && staticConfig && <SalesCRMWorkspace subtab={currentSubTabId} staticConfig={staticConfig} />}
        {activeSegment === 'ai_factory' && <AIWorkforceWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'finance_accounting' && <FinanceWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'projects_delivery' && <ProjectsDeliveryWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'documents_approval' && <DocumentsApprovalWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'analytics' && <AnalyticsWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'system_settings' && <SettingsWorkspace subtab={currentSubTabId} />}
        {activeSegment === 'operations' && <OperationsWorkspace subtab={currentSubTabId} />}
        {!staticConfig && !['knowledge_library', 'finance_accounting', 'projects_delivery', 'documents_approval', 'analytics', 'system_settings', 'ai_factory', 'marketing_growth', 'product_studio', 'sales_crm', 'operations'].includes(activeSegment) && <LegacyWorkspace />}
      </Suspense>
    </div>
  );
}
