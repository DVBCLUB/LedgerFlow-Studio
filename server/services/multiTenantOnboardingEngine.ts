export interface OnboardingStep { id: string; label: string; status: 'done' | 'in_progress' | 'pending'; completedAt: string | null; }
export interface TenantOnboarding { tenantId: string; tenantName: string; plan: string; progressPercent: number; steps: OnboardingStep[]; assignedCsmAgent: string; startedAt: string; estimatedCompletionAt: string; }
export interface OnboardingPipelineData { pipeline: TenantOnboarding[]; averageCompletionDays: number; completionRatePercent: number; activeTenants: number; }
export interface OnboardingLaunchResult { success: boolean; tenantId: string; workspaceUrl: string; aiWelcomeCallScheduledAt: string; dataImportJobId: string; onboardingSequenceId: string; }

export function getOnboardingPipeline(): OnboardingPipelineData {
  const makeSteps = (completedCount: number): OnboardingStep[] => {
    const labels = ['Tao workspace', 'Import du lieu Excel/MISA', 'Cau hinh RBAC', 'Demo AI Swarm', 'Welcome Call AI', 'Go-live Check'];
    return labels.map((label, i) => ({
      id: 'step_' + (i + 1),
      label,
      status: i < completedCount ? 'done' : i === completedCount ? 'in_progress' : 'pending',
      completedAt: i < completedCount ? new Date(Date.now() - (completedCount - i) * 86400000).toISOString() : null,
    }));
  };
  return {
    pipeline: [
      { tenantId: 'ten_001', tenantName: 'ABC Logistics VN', plan: 'enterprise', progressPercent: 83, steps: makeSteps(5), assignedCsmAgent: 'AI-CSM-Minh', startedAt: '2026-08-15T09:00:00Z', estimatedCompletionAt: '2026-08-25T18:00:00Z' },
      { tenantId: 'ten_002', tenantName: 'XYZ Retail Group', plan: 'growth', progressPercent: 50, steps: makeSteps(3), assignedCsmAgent: 'AI-CSM-Lan', startedAt: '2026-08-19T10:00:00Z', estimatedCompletionAt: '2026-08-27T18:00:00Z' },
      { tenantId: 'ten_003', tenantName: 'Delta SaaS Co', plan: 'growth', progressPercent: 17, steps: makeSteps(1), assignedCsmAgent: 'AI-CSM-Tung', startedAt: '2026-08-22T08:00:00Z', estimatedCompletionAt: '2026-08-30T18:00:00Z' },
    ],
    averageCompletionDays: 7.4,
    completionRatePercent: 94.2,
    activeTenants: 3,
  };
}

export function launchOnboardingSequence(tenantId: string): OnboardingLaunchResult {
  return {
    success: true,
    tenantId,
    workspaceUrl: 'https://app.ledgerflow.vn/w/' + tenantId,
    aiWelcomeCallScheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    dataImportJobId: 'IMPORT-' + tenantId.toUpperCase() + '-' + Date.now().toString(36),
    onboardingSequenceId: 'ONB-' + Date.now().toString(36).toUpperCase(),
  };
}
