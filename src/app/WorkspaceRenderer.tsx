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


type Tone = 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
type WorkspaceSubtab = { id: string; label: string; icon?: LucideIcon };
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

const SUB_TABS_CONFIG: Record<string, readonly WorkspaceSubtab[]> = {
  ceo_command: [
    { id: 'overview', label: 'Tổng quan hôm nay', icon: Briefcase },
    { id: 'today', label: 'Việc cần quyết định', icon: Activity },
    { id: 'autonomous_command', label: 'Autonomous Command', icon: Bot },
    { id: 'standup_rhythm', label: 'Founder Rhythm', icon: ClipboardList },
    { id: 'boardroom', label: '⚖️ Hội Đồng Biểu Quyết', icon: Scale },
    { id: 'branches', label: '🏢 Chi Nhánh & Franchise', icon: GitBranch },
    { id: 'second_brain', label: '🧠 Founder Second-Brain', icon: Sparkles },
    { id: 'advisory_council', label: '🏛️ Hội Đồng Cố Vấn Chiến Lược', icon: Users2 },
    { id: 'mobile_dashboard', label: '📱 CEO Mobile Dashboard', icon: Activity },
    { id: 'voice_command', label: '🎤 Voice Command Center', icon: Mic },
    { id: 'board_deck', label: '📊 AI Board Deck & Investor Memo', icon: BarChart3 },
    { id: 'okr_engine', label: '🎯 Autonomous OKR & Strategic Execution', icon: Target },
    { id: 'spatial_boardroom', label: '🕶️ Spatial 3D Boardroom VR', icon: Sparkles },
    { id: 'singularity', label: '👑 The Sentient Singularity (100)', icon: Sparkles },
    { id: 'earphone_audio', label: '🎧 Executive Earphone Briefing (117)', icon: Headphones },
    { id: 'company_cloner', label: '🏢 Company-in-a-Box Cloner (121)', icon: Building2 },
  ],
  knowledge_library: [
    { id: 'library', label: 'Kho tri thức Gốc & SOP', icon: BookOpen },
    { id: 'rag_simulator', label: 'RAG Sandbox & Live Chat', icon: Database },
    { id: 'operating_layer', label: 'Operating Layer & Case Bank', icon: Network },
    { id: 'inter_agent_protocol', label: '💬 Inter-Agent Chat', icon: UsersRound },
    { id: 'swarm_orchestrator', label: '🤖 Swarm Relay & Robot Node', icon: Bot },
    { id: 'auto_harvest', label: '🧠 Thu Hoạch Tri Thức Tự Học', icon: Sparkles },
    { id: 'semantic_search', label: '🔍 Semantic RAG Search 2.0', icon: Search },
    { id: 'market_localization', label: '🌐 Bản Địa Hóa i18n & Đa Ngôn Ngữ', icon: Globe2 },
    { id: 'success_academy', label: '🎓 Học Viện Khách Hàng AI Academy', icon: GraduationCap },
    { id: 'knowledge_graph', label: '🧠 Đồ Thị Tri Thức Graph Mesh', icon: Network },
    { id: 'notion_obsidian', label: '🧠 Notion & Obsidian Bridge (118)', icon: BookOpen },
  ],
  product_studio: [
    { id: 'portfolio', label: '🗺️ Lộ trình SaaS & Product Roadmap', icon: FolderKanban },
    { id: 'ideation', label: '💡 Studio Ý tưởng & AI Feasibility', icon: Lightbulb },
    { id: 'games_ml', label: '🎮 Studio Game & ML Workbench', icon: Gamepad2 },
    { id: 'game_builder', label: '🛠️ Game Studio Builder', icon: Sparkles },
    { id: 'game_assets', label: '🎨 Xưởng Tài Sản Game AI (5-in-1)', icon: Sparkles },
    { id: 'smoke_test', label: '🧪 Vaporware & Smoke Test Lab', icon: TestTubeDiagonal },
    { id: 'entitlements', label: '📦 Feature Flags & Gating SaaS', icon: Award },
    { id: 'b2b_marketplace', label: '🛒 B2B App & Module Marketplace', icon: FolderKanban },
    { id: 'asset_foundry', label: '🏭 Asset Foundry (ADF)', icon: Sparkles },
    { id: 'zero_touch', label: '🔁 Zero-Touch Product-to-Revenue Loop', icon: Rocket },
    { id: 'auto_launch', label: '🚀 1-Click Auto Launch Pipeline (103)', icon: Rocket },
    { id: 'synergy_bus', label: '⚡ Cross-Asset Synergy Bus (104)', icon: Sparkles },
    { id: 'game_qa', label: '🎮 Game QA & Bug Density (108)', icon: Gamepad2 },
    { id: 'mobile_publish', label: '📱 Mobile Store Publish (110)', icon: Smartphone },
    { id: 'game_store', label: '🎮 Steam & Itch.io Store (111)', icon: Gamepad2 },
    { id: 'pmf_heatmap', label: '📊 Continuous PMF Heatmap (115)', icon: BarChart3 },
  ],
  marketing_growth: [
    { id: 'campaigns', label: '🚀 1. Chiến Dịch & Phễu Chuyển Đổi', icon: Rocket },
    { id: 'content', label: '✍️ 2. Nội Dung & SEO AI', icon: Mail },
    { id: 'video_studio', label: '🎬 3. Studio Video & Xuất Bản', icon: Film },
    { id: 'competitor_radar', label: '📡 4. Radar Đối Thủ & Battle Cards', icon: Target },
    { id: 'social_swarm', label: '🎬 5. Video Ngắn & Social Swarm', icon: Video },
    { id: 'seo', label: '🌐 6. SEO Topical Authority & Schema', icon: Globe2 },
    { id: 'brand_radar', label: '📡 7. Uy Tín Thương Hiệu & PR Radar', icon: Radio },
    { id: 'marketing_bot', label: '📡 8. Telegram & WhatsApp Broadcast', icon: Radio },
    { id: 'video_production', label: '🎬 9. Video Studio 9:16 & Auto-Publish', icon: Film },
    { id: 'hyper_personalization', label: '🎪 10. Hyper-Personalization 1-to-1', icon: Mail },
    { id: 'war_room', label: '🔬 11. War Room Đối Thủ & Intel', icon: Target },
    { id: 'demand_scanner', label: '📡 12. Quét Nhu Cầu Radar (101)', icon: Radio },
    { id: 'vmaf_video', label: '🎬 13. Netflix VMAF Quality (109)', icon: Film },
  ],
  sales_crm: [
    { id: 'live_pipeline', label: '🚀 Pipeline Live & AI Proposal', icon: Target },
    { id: 'revenue_flywheel', label: '⚡ Revenue Flywheel & Upsell', icon: TrendingUp },
    { id: 'funnel_lab', label: '🎯 Phễu Khách Hàng & Lead Scoring', icon: Target },
    { id: 'pricing_ltv', label: '💰 Báo Giá, Gói Đăng Ký & LTV', icon: BarChart3 },
    { id: 'referral_nps', label: '🤝 Đại Lý, Affiliate & NPS', icon: UsersRound },
    { id: 'support', label: '🎧 CSKH Tự Động & Hỗ Trợ 24/7', icon: UsersRound },
    { id: 'customer_health', label: '❤️ Điểm Sức Khỏe & Churn Risk', icon: HeartPulse },
    { id: 'helpdesk', label: '📞 Tổng Đài Thoại AI & Zalo OA', icon: PhoneCall },
    { id: 'affiliate_commission', label: '🤝 Đại Lý & Hoa Hồng 15%', icon: UsersRound },
    { id: 'voice_sentiment', label: '❤️ NPS, CSAT & Cảm Xúc Giọng Nói', icon: Smile },
    { id: 'loyalty_gamification', label: '🏆 Gamification & Điểm Thưởng Viral', icon: Award },
    { id: 'plg_conversion', label: '🚀 PLG Conversion & Upsell Trigger', icon: TrendingUp },
    { id: 'customer_dna', label: '🧬 Customer DNA Profiling 360°', icon: Sparkles },
    { id: 'partner_reseller', label: '🤝 Đại Lý & Đối Tác Bán Lại', icon: UsersRound },
    { id: 'pricing_optimization', label: '🧪 Tối Ưu Hóa Giá & Độ Co Giãn', icon: BarChart3 },
    { id: 'voice_bridge', label: '🎙️ Đàm Thoại Song Ngữ Quốc Tế', icon: PhoneCall },
    { id: 'vc_matcher', label: '💰 AI Pitch Deck & VC Matcher (122)', icon: DollarSign },
  ],
  finance_accounting: [
    { id: 'cashflow', label: '📈 1. Doanh Thu, Dòng Tiền & VietQR', icon: TrendingUp },
    { id: 'cashflow_forecast', label: '🔮 2. Dự Báo Dòng Tiền & Runway', icon: TrendingUp },
    { id: 'ledger', label: '📊 3. Sổ Cái & Báo Cáo VAS 200/133', icon: Database },
    { id: 'tax_simulator', label: '🛡️ 4. Quản Trị Thuế & Duyệt Chi Phí', icon: ShieldCheck },
    { id: 'incidents', label: '🚨 5. Sự Cố & Playbook Khẩn Cấp', icon: ShieldAlert },
    { id: 'global_adapter', label: '🌐 6. Chuẩn Kép IFRS / VAS & Đa Ngoại Tệ', icon: Globe2 },
    { id: 'tax_shield', label: '🛡️ 7. Thẩm Tra & Khiên Thuế TT80', icon: ShieldCheck },
    { id: 'vendor_settlement', label: '📦 8. Đối Soát Nhà Cung Cấp 3-Way', icon: Truck },
    { id: 'investors', label: '💼 9. Quan Hệ Nhà Đầu Tư & Cap Table', icon: UsersRound },
    { id: 'treasury', label: '🏦 10. Kho Bạc & Quét Lãi Suất 5.2%', icon: Landmark },
    { id: 'ma_valuation', label: '💼 11. M&A Pipeline & Định Giá', icon: Briefcase },
    { id: 'cross_border_vat', label: '🌐 12. Thuế Xuyên Biên Giới Reverse Charge', icon: Globe2 },
    { id: 'esg_carbon', label: '🌱 13. Kế Toán Carbon & ESG Net-Zero', icon: Leaf },
    { id: 'crypto_treasury', label: '🪙 14. Kho Bạc Crypto & Web3 Settlement', icon: Coins },
    { id: 'subscription_billing', label: '💳 15. Subscription Billing & Dunning', icon: CreditCard },
    { id: 'revenue_recognition', label: '💰 16. Phân Bổ Doanh Thu IFRS 15 / ASC 606', icon: BarChart3 },
    { id: 'credit_scoring', label: '🏦 17. Chấm Điểm Tín Dụng & Vốn Lưu Động', icon: Landmark },
    { id: 'carbon_offset', label: '🌍 18. Sàn Tín Chỉ Carbon & ESG Net-Zero', icon: Leaf },
    { id: 'vdr_room', label: '💼 19. Phòng Dữ Liệu Ảo VDR Series A', icon: Briefcase },
    { id: 'iot_scale', label: '📡 20. Cân Điện Tử & Cổng RFID Kho', icon: Activity },
    { id: 'transfer_pricing', label: '🌐 21. Thuế Chuyển Giá & DTAA', icon: Globe2 },
    { id: 'drone_lidar', label: '🚁 22. Drone LiDAR Kiểm Kê Bãi', icon: Activity },
    { id: 'zk_audit', label: '🛡️ 23. Kiểm Toán Bảo Mật zk-SNARKs', icon: ShieldCheck },
    { id: 'yield_sweep', label: '⚡ 24. Quét Lãi Suất Nhàn Rỗi Qua Đêm', icon: Landmark },
    { id: 'smart_escrow', label: '📜 25. Smart Contract Escrow EVM', icon: Coins },
    { id: 'capital_allocation', label: '🧮 26. Phân Bổ Vốn Tự Trị (DSGE + CCC)', icon: Coins },
    { id: 'revenue_orchestrator', label: '🔁 27. Điều Phối Doanh Thu Tự Trị (102)', icon: TrendingUp },
  ],
  projects_delivery: [
    { id: 'portfolio', label: 'Danh mục dự án', icon: FolderKanban },
    { id: 'industry_templates', label: 'Mẫu ngành', icon: Database },
    { id: 'admin_ops', label: 'Admin Ops', icon: UsersRound },
  ],
  documents_approval: [
    { id: 'approvals', label: 'Luồng phê duyệt', icon: CheckCircle },
    { id: 'audit', label: 'Kiểm soát hồ sơ', icon: ShieldCheck },
    { id: 'evidence', label: 'Audit trail', icon: FileCheck2 },
    { id: 'clm', label: '📑 Hợp Đồng & AI Redline (CLM)', icon: FileText },
  ],
  ai_factory: [
    { id: 'autonomous_flywheel', label: '🚀 Vòng Lặp Tự Vận Hành', icon: Zap },
    { id: 'nexus_cockpit', label: '⚡ AI-Robot Nexus & Studio', icon: Activity },
    { id: 'command', label: '🤖 Trợ lý CEO & Đội ngũ AI', icon: Bot },
    { id: 'apprentice_lab', label: '🎓 Học Việc Local AI & Mẫu Vàng', icon: GraduationCap },
    { id: 'automation', label: '🦾 Robot Tự Động Hóa & DOM Vision', icon: Activity },
    { id: 'governance', label: '🛡️ Quản Trị, Chat Liên AI & Giám Sát', icon: ShieldCheck },
    { id: 'recruiting', label: '🧑‍💼 Tuyển Dụng & Đánh Giá Ứng Viên', icon: UserCheck },
    { id: 'ai_bonus', label: '🏆 Quỹ Thưởng & ESOP Hiệu Suất AI', icon: Award },
    { id: 'revenue_sharing', label: '🤖 Chia Sẻ Doanh Thu AI Creator 70/30', icon: Coins },
    { id: 'genetic_prompts', label: '🧬 Đột Biến Prompt Di Truyền', icon: Sparkles },
    { id: 'agent_consensus', label: '🗳️ Multi-Agent BFT Consensus (114)', icon: UsersRound },
    { id: 'gpu_scheduler', label: '🎮 Multi-Factory GPU Scheduler (120)', icon: Cpu },
  ],
  analytics: [
    { id: 'python_sandbox', label: '🧪 1. Python & SQL Sandbox AI', icon: Code },
    { id: 'ai_sandbox', label: '🤖 2. Gemini Reasoning & Prompt Lab', icon: TestTubeDiagonal },
    { id: 'simulations', label: '📈 3. Mô Phỏng Doanh Nghiệp & A/B Test', icon: Target },
    { id: 'predictive_revenue', label: '🔮 4. Dự Báo Doanh Thu 90 Ngày AI', icon: TrendingUp },
    { id: 'macro_stress', label: '🌪️ 5. Stress Test Kinh Tế Vĩ Mô 10 Năm', icon: Target },
  ],
  system_settings: [
    { id: 'delegation_matrix', label: '⚖️ Phân Quyền & Giải Quyết Xung Đột AI', icon: Scale },
    { id: 'sop_runbook', label: '📖 Quy Trình Vận Hành (SOP)', icon: BookOpen },
    { id: 'general', label: 'Hệ thống & Cấu hình', icon: Settings },
    { id: 'security', label: 'Bảo mật & Phân quyền', icon: ShieldCheck },
    { id: 'connectors', label: 'Tích hợp & Kết nối', icon: Network },
    { id: 'dev_ops', label: 'GitOps & Phát hành', icon: Rocket },
    { id: 'recovery_ops', label: 'Bảo trì & Khôi phục', icon: FileCheck2 },
    { id: 'ip_guard', label: '📜 Bản Quyền & Cục SHTT', icon: Award },
    { id: 'edge_cdn', label: '🌍 Global Edge CDN Anycast', icon: Globe2 },
    { id: 'llm_arbitrage', label: '💰 LLM Cost Arbitrage & Token', icon: Cpu },
    { id: 'multi_cloud', label: '🌐 Multi-Cloud Mesh & DR RPO < 1s', icon: Cloud },
    { id: 'soc_threat', label: '🚨 SOC & Săn Lùng Nguy Cơ Zero-Day', icon: ShieldAlert },
    { id: 'prompt_firewall', label: '🔥 Tường Lửa Prompt & Guardrails', icon: ShieldCheck },
    { id: 'chaos_engineering', label: '⚡ Diễn Tập Sự Cố & Chaos Engineering', icon: Zap },
    { id: 'ai_dev_copilot', label: '💻 AI Dev Copilot & AST Refactor Hub', icon: Code },
    { id: 'db_sharding', label: '🗄️ DB Auto-Sharding & Active Replicas', icon: Database },
    { id: 'pwa_offline', label: '📶 PWA Offline Sync & Service Worker', icon: Wifi },
    { id: 'tenant_onboarding', label: '🌐 Multi-Tenant Onboarding Automation', icon: Users2 },
    { id: 'code_review_pr', label: '🤖 AI Code Review & PR Automation', icon: Code },
    { id: 'webhook_hub', label: '🔗 Webhook & Integration Hub (Zapier)', icon: Network },
    { id: 'iac_architect', label: '🏗️ IaC & Cloud Architecture Generator', icon: Rocket },
    { id: 'agent_red_team', label: '🛡️ AI Agent Red-Teaming & Jailbreak Shield', icon: ShieldCheck },
    { id: 'contract_intelligence', label: '💼 AI Contract Intelligence & Legal Risk', icon: FileCheck2 },
    { id: 'privacy_pdpa', label: '🔐 Bảo Mật Dữ Liệu & PDPA/GDPR', icon: ShieldCheck },
    { id: 'tech_debt', label: '🔭 Nợ Kỹ Thuật & Migration Roadmap', icon: Code },
    { id: 'no_code_bpa', label: '🔄 Tự Động Hóa Quy Trình No-Code (BPA)', icon: Zap },
    { id: 'erp_sync', label: '🔄 Đồng Bộ 2 Chiều ERP (MISA, Fast)', icon: Database },
    { id: 'post_quantum', label: '🛡️ Mã Hóa Hậu Lượng Tử (Kyber)', icon: ShieldCheck },
    { id: 'patent_drafting', label: '📜 Soạn Thảo Hồ Sơ Sáng Chế AI', icon: FileText },
    { id: 'satellite_mesh', label: '🛰️ Vệ Tinh Starlink & Mesh Xa Bờ', icon: Globe2 },
    { id: 'a11y_audit', label: '♿ WCAG 2.2 AA A11y (105)', icon: ShieldCheck },
    { id: 'web_vitals', label: '⚡ Core Web Vitals (106)', icon: Activity },
    { id: 'iso_quality', label: '🏆 ISO 25010 Benchmark (107)', icon: Award },
    { id: 'open_source', label: '📦 Open Source Registry (112)', icon: Package },
    { id: 'edge_compute', label: '🌐 Edge Compute & Load Balancer (113)', icon: Globe2 },
    { id: 'api_federation', label: '⚡ GraphQL Federation Gateway (116)', icon: Network },
    { id: 'telemetry_stream', label: '⚡ Real-Time Telemetry Stream (119)', icon: Activity },
    { id: 'vision_surveillance', label: '📸 AI Computer Vision Cam (123)', icon: Camera },
    { id: 'cross_chain_liquidity', label: '🪙 Cross-Chain RWA Yield (124)', icon: Coins },
  ],
  operations: [
    { id: 'portfolio', label: 'Project Portfolio', icon: FolderKanban },
    { id: 'industry_templates', label: 'Industry Templates', icon: Database },
    { id: 'admin_ops', label: 'Admin Ops', icon: UsersRound },
  ],
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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/20 p-6 text-left shadow-2xl shadow-black/40 backdrop-blur-xl transition-all">
      {/* Dual ambient radial glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/15 to-purple-500/0 blur-2xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">LedgerFlow OS Enterprise</p>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
        <p className="mt-2.5 max-w-3xl text-xs font-semibold leading-6 text-slate-300/90">{description}</p>
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-300 shadow-sm transition-transform hover:scale-105">
                {chip}
              </span>
            ))}
          </div>
        )}
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
  if (subtab === 'second_brain' || subtab === 'thoughts' || subtab === 'brain') return <FounderSecondBrainPanel />;
  if (subtab === 'advisory_council' || subtab === 'advisors' || subtab === 'council') return <VirtualAdvisoryCouncilPanel />;
  if (subtab === 'mobile_dashboard' || subtab === 'founder_kpi' || subtab === 'ceo_mobile') return <FounderMobileDashboardPanel />;
  if (subtab === 'voice_command' || subtab === 'voice_ceo' || subtab === 'voice') return <VoiceCeoCommandPanel />;
  if (subtab === 'board_deck' || subtab === 'investor_memo') return <AiBoardDeckPanel />;
  if (subtab === 'okr_engine' || subtab === 'autonomous_okr') return <AutonomousOkrPanel />;
  if (subtab === 'spatial_boardroom' || subtab === 'spatial_3d' || subtab === 'webxr') return <SpatialAccountingBoardroomPanel />;
  if (subtab === 'singularity' || subtab === 'sentient_singularity' || subtab === 'level8_agi') return <SentientSingularityPanel />;
  if (subtab === 'earphone_audio' || subtab === 'earphone' || subtab === 'whisper') return <ExecutiveEarphoneAudioBriefingPanel />;
  if (subtab === 'company_cloner' || subtab === 'cloner' || subtab === 'franchising') return <CompanyInABoxClonerPanel />;
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
  if (subtab === 'overview') {
    return (
      <div className="space-y-5">
        <BusinessHubPanel />
        <CEOOverviewPanel />
      </div>
    );
  }
  if (subtab === 'autonomous_command') {
    return (
      <div className="space-y-5">
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
  if (subtab === 'pmf_heatmap' || subtab === 'pmf' || subtab === 'sean_ellis') return <ContinuousPmfHeatmapPanel />;
  return <StaticWorkspace config={staticConfig} subtab={subtab} />;
}

function KnowledgeLibraryWorkspace({ subtab }: { subtab: string }) {
  if (subtab === 'auto_harvest' || subtab === 'harvested' || subtab === 'insights') return <AutoHarvestedInsightsPanel />;
  if (subtab === 'semantic_search' || subtab === 'rag_search' || subtab === 'hybrid_search') return <SemanticRagSearchPanel />;
  if (subtab === 'market_localization' || subtab === 'i18n' || subtab === 'locales') return <MarketLocalizationPanel />;
  if (subtab === 'success_academy' || subtab === 'academy' || subtab === 'training') return <CustomerSuccessAcademyPanel />;
  if (subtab === 'knowledge_graph' || subtab === 'graph_mesh' || subtab === 'entity_graph') return <KnowledgeGraphMeshPanel />;
  if (subtab === 'notion_obsidian' || subtab === 'second_brain_sync' || subtab === 'obsidian') return <NotionObsidianKnowledgeBridgePanel />;
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
        <RobotDOMVisionPanel />
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
        <A2AMailboxPanel />
        <AgentKernelPanel />
        <InterAgentProtocolPanel />
        <SwarmRelayOrchestratorPanel />
        <TelegramBotControlPanel />
        <AIWorkforceAdvancedWorkspace />
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
        <AIEcosystemArchitecture />
        <LiveThoughtStreamViewer />
      </div>
    );
  }
  if (subtab === 'simulations') return <AnalyticsSimulationsWorkspace />;
  if (subtab === 'predictive_revenue' || subtab === 'revenue_forecast' || subtab === 'arr_monte_carlo') return <PredictiveRevenuePanel />;
  if (subtab === 'macro_stress' || subtab === 'stress_test' || subtab === 'dsge_simulation') return <MacroeconomicStressSimulatorPanel />;
  // python_sandbox is default
  return (
    <div className="space-y-5 animate-fade-in text-left">
      <PythonSandbox />
      <CustomDataWorkbench />
      <ProjectMemoryDecisionLog />
      <Analytics3DLab />
      <AIObservabilityDashboard />
      <FinancialChartsModelPanel />
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
  if (subtab === 'sop_runbook') return <SystemSOPRunbookPanel />;
  if (subtab === 'security') return <SettingsSecurityWorkspace />;
  if (subtab === 'connectors') return <SettingsConnectorsWorkspace />;
  if (subtab === 'dev_ops') return <SettingsDevOpsWorkspace />;
  if (subtab === 'recovery_ops') return <SettingsRecoveryWorkspace />;
  // general is default
  return (
    <div className="space-y-5">
      <SystemOverviewDaemonPanel />
      <SystemSettingsPanel />
      <AIIntegrationHealthPanel />
      <ApiConnectionHealthMatrix />
      <ReleaseReadinessPanel />
      <FeatureRegistryPanel />
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
  onNavigate?: (tab: TabType, subTab?: string) => void;
}

export default function WorkspaceRenderer({ activeSegment, activeRole = 'all' }: WorkspaceRendererProps) {
  const { t } = useLanguage();
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>(() => ({ ...DEFAULT_SUBTAB }));
  const subTabs = useMemo(() => {
    const rawSubTabs = SUB_TABS_CONFIG[activeSegment] || [];
    const isTechRole = ['devops', 'agentops'].includes(activeRole);
    const isPowerUser = ['all', 'founder', 'admin'].includes(activeRole);
    const isFinanceRole = ['cfo', 'accountant', 'finance'].includes(activeRole);
    return rawSubTabs
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
        return { ...tab, label: translatedLabel };
      });
  }, [activeSegment, activeRole, t]);
  const validSubTabIds = useMemo(() => subTabs.map((tab) => tab.id), [subTabs]);
  const currentSubTabId = resolveWorkspaceSubTab(activeSegment, activeSubTabs[activeSegment], validSubTabIds) || subTabs[0]?.id || '';

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
      {subTabs.length > 1 && <WorkspaceSubNavigation tabs={subTabs} activeTab={currentSubTabId} onChange={handleSubTabChange} />}
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
