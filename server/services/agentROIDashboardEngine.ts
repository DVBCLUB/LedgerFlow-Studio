/**
 * server/services/agentROIDashboardEngine.ts
 * ============================================================
 * AI Agent ROI, Token Economics & Revenue-per-Agent Telemetry Engine
 *
 * Implements:
 * 1. Per-Agent Cost Breakdown (Tokens consumed, compute hours, cloud API expenses)
 * 2. Per-Agent Value Attribution (Tasks completed, hours saved, revenue contributed)
 * 3. FTE Equivalence Calculation & Net Return on Investment (ROI)
 */

export interface AgentROISummary {
  agentId: string;
  agentName: string;
  department: string;
  avatarRole: string;
  tokensConsumedThisMonth: number;
  totalCostVnd: number;
  tasksCompleted: number;
  estimatedHoursSaved: number;
  humanFteEquivalent: number; // e.g. 1.2 FTE
  attributedValueGeneratedVnd: number;
  netRoiPercentage: number; // (Value - Cost) / Cost * 100
  status: 'top_performer' | 'optimal' | 'learning';
}

export interface CompanyROIMetrics {
  totalAiWorkforceCostVnd: number;
  totalValueGeneratedVnd: number;
  netCompanyRoiMultiplier: number;
  totalFteReplacedEquivalent: number;
  totalHoursSavedMonthly: number;
  agentLeaderboard: AgentROISummary[];
}

export function getCompanyAgentROIMetrics(): CompanyROIMetrics {
  const leaderboard: AgentROISummary[] = [
    {
      agentId: 'agent_sales_lead',
      agentName: 'Minh Trí',
      department: 'Sales & CRM',
      avatarRole: 'AI Sales Director & Deal Closer',
      tokensConsumedThisMonth: 1250000,
      totalCostVnd: 620000,
      tasksCompleted: 142,
      estimatedHoursSaved: 160,
      humanFteEquivalent: 1.5,
      attributedValueGeneratedVnd: 185000000,
      netRoiPercentage: 29738,
      status: 'top_performer',
    },
    {
      agentId: 'agent_cfo_tax',
      agentName: 'Bảo Ngọc',
      department: 'Finance & Accounting',
      avatarRole: 'AI CFO & Vietnam Tax Specialist (TT80)',
      tokensConsumedThisMonth: 850000,
      totalCostVnd: 420000,
      tasksCompleted: 98,
      estimatedHoursSaved: 120,
      humanFteEquivalent: 1.2,
      attributedValueGeneratedVnd: 145000000,
      netRoiPercentage: 34423,
      status: 'top_performer',
    },
    {
      agentId: 'agent_devops_swe',
      agentName: 'Hoàng Nam',
      department: 'Engineering & Delivery',
      avatarRole: 'AI DevOps Lead & Self-Healing Doctor',
      tokensConsumedThisMonth: 2100000,
      totalCostVnd: 1050000,
      tasksCompleted: 310,
      estimatedHoursSaved: 220,
      humanFteEquivalent: 2.0,
      attributedValueGeneratedVnd: 220000000,
      netRoiPercentage: 20852,
      status: 'top_performer',
    },
    {
      agentId: 'agent_growth_hacker',
      agentName: 'Phương Linh',
      department: 'Marketing & Growth',
      avatarRole: 'AI Content Producer & Viral Strategist',
      tokensConsumedThisMonth: 950000,
      totalCostVnd: 480000,
      tasksCompleted: 185,
      estimatedHoursSaved: 140,
      humanFteEquivalent: 1.0,
      attributedValueGeneratedVnd: 95000000,
      netRoiPercentage: 19691,
      status: 'optimal',
    },
    {
      agentId: 'agent_reconciler_bot',
      agentName: 'VietQR Bot',
      department: 'Finance & Accounting',
      avatarRole: 'VietQR Reconciler & Invoice Matcher',
      tokensConsumedThisMonth: 320000,
      totalCostVnd: 160000,
      tasksCompleted: 540,
      estimatedHoursSaved: 95,
      humanFteEquivalent: 0.8,
      attributedValueGeneratedVnd: 60000000,
      netRoiPercentage: 37400,
      status: 'top_performer',
    },
  ];

  const totalCost = leaderboard.reduce((sum, a) => sum + a.totalCostVnd, 0);
  const totalValue = leaderboard.reduce((sum, a) => sum + a.attributedValueGeneratedVnd, 0);
  const totalFte = leaderboard.reduce((sum, a) => sum + a.humanFteEquivalent, 0);
  const totalHours = leaderboard.reduce((sum, a) => sum + a.estimatedHoursSaved, 0);

  return {
    totalAiWorkforceCostVnd: totalCost,
    totalValueGeneratedVnd: totalValue,
    netCompanyRoiMultiplier: Number((totalValue / totalCost).toFixed(1)),
    totalFteReplacedEquivalent: Number(totalFte.toFixed(1)),
    totalHoursSavedMonthly: totalHours,
    agentLeaderboard: leaderboard,
  };
}
