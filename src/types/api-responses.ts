/**
 * api-responses.ts
 * ============================================================
 * Strongly-typed API Response Interfaces for LedgerFlow Studio.
 * Replaces loose `any` types across UI panels and services.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface AIRoiSummary {
  totalTokensSaved: number;
  estimatedCostSavingsUSD: number;
  totalAgentExecutions: number;
  hoursSavedManualLabor: number;
  topPerformingAgent: string;
  calculatedAt: string;
}

export interface LiveBoardSnapshot {
  activeEmployeesCount: number;
  onDutyCount: number;
  inProbationCount: number;
  tasksCompletedToday: number;
  averageResponseLatencyMs: number;
  systemHealthScore: number;
  timestamp: string;
}

export interface CapacityForecast {
  currentLoadPercent: number;
  predictedPeakHour: string;
  recommendedWorkerCount: number;
  tokenConsumptionRatePerMin: number;
  bottlenecksIdentified: string[];
}

export interface CompetitorRadarItem {
  id: string;
  competitorName: string;
  targetMarket: string;
  pricingTier: string;
  keyFeatures: string[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastScannedAt: string;
}

export interface CompetitorBattleCard {
  competitorId: string;
  competitorName: string;
  advantages: string[];
  vulnerabilities: string[];
  killShotPitch: string;
  suggestedPricingDefense: string;
}

export interface OllamaLocalStatus {
  isInstalled: boolean;
  isRunning: boolean;
  version?: string;
  installedModelsCount: number;
  recommendedModels: Array<{
    name: string;
    size: string;
    ramRequired: string;
    domain: string;
    isInstalled: boolean;
  }>;
}

export interface VoiceCallTurnResult {
  speakerRole: string;
  spokenUserText: string;
  aiResponseText: string;
  suggestedActions: string[];
  audioBase64?: string;
  latencyMs: number;
}

export interface PrivacyAuditReport {
  scannedCharactersCount: number;
  piiItemsFoundCount: number;
  maskedFieldsDetected: string[];
  isVASCompliant: boolean;
  complianceScore: number;
  recommendations: string[];
}

export interface EmployeeKPICard {
  roleId: string;
  roleTitle: string;
  department: string;
  tasksCompleted: number;
  accuracyRate: number;
  averageExecutionTimeSec: number;
  status: 'active' | 'probation' | 'quarantined' | 'idle';
  lastActiveAt: string;
}

export interface PostMortemReport {
  id: string;
  incidentTitle: string;
  failedAgentId: string;
  occurredAt: string;
  resolvedAt?: string;
  rootCause: string;
  preventiveMeasures: string[];
  severity: 'P0' | 'P1' | 'P2' | 'P3';
}

export interface ProbationRecord {
  id: string;
  employeeId: string;
  candidateName: string;
  mentorRoleId: string;
  startedAt: string;
  benchmarkScores: Array<{
    testName: string;
    score: number;
    maxScore: number;
    notes?: string;
  }>;
  status: 'in_progress' | 'passed' | 'failed';
  evaluatorNote?: string;
}
