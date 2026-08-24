import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Sparkles,
  Award,
  Users,
  Clock,
  Zap,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatMoneyVN, formatNumberVN } from '../../utils/excelFormatters';

interface AgentROISummary {
  agentId: string;
  agentName: string;
  department: string;
  avatarRole: string;
  tokensConsumedThisMonth: number;
  totalCostVnd: number;
  tasksCompleted: number;
  estimatedHoursSaved: number;
  humanFteEquivalent: number;
  attributedValueGeneratedVnd: number;
  netRoiPercentage: number;
  status: 'top_performer' | 'optimal' | 'learning';
}

interface CompanyROIMetrics {
  totalAiWorkforceCostVnd: number;
  totalValueGeneratedVnd: number;
  netCompanyRoiMultiplier: number;
  totalFteReplacedEquivalent: number;
  totalHoursSavedMonthly: number;
  agentLeaderboard: AgentROISummary[];
}

export const AgentROIDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CompanyROIMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dormant/agent-roi/metrics');
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load agent ROI metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Activity className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
        <span>Đang tổng hợp dữ liệu Token Economics & ROI của đội ngũ AI Staff...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>AI Workforce ROI & Token Economics (Hiệu quả Đầu tư AI Staff)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Đo lường chi phí Token LLM so với giá trị kinh tế tạo ra và số lượng nhân sự tương đương (FTE)
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchMetrics}
          className="flex items-center gap-1 text-xs text-slate-300 border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Tỷ suất hoàn vốn tổng thể (ROI)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {metrics.netCompanyRoiMultiplier}x
          </div>
          <div className="text-[11px] text-emerald-500 mt-0.5">Mỗi 1 VND chi phí tạo ra {metrics.netCompanyRoiMultiplier} VND</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Giá trị kinh tế tạo ra trong tháng</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1">
            {formatMoneyVN(metrics.totalValueGeneratedVnd)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Từ 5 AI Staff nòng cốt</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Tổng chi phí Token LLM & Hạ tầng</div>
          <div className="text-2xl font-bold text-slate-200 mt-1">
            {formatMoneyVN(metrics.totalAiWorkforceCostVnd)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">&lt; 1% tổng doanh thu</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Quy mô nhân sự tương đương (FTE)</div>
          <div className="text-2xl font-bold text-violet-300 mt-1">
            {metrics.totalFteReplacedEquivalent} FTE
          </div>
          <div className="text-[11px] text-violet-400 mt-0.5">Tiết kiệm {metrics.totalHoursSavedMonthly} giờ làm việc/tháng</div>
        </Card>
      </div>

      {/* AI Leaderboard Table */}
      <Card className="p-5 bg-slate-900/80 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Bảng xếp hạng hiệu năng AI Agent (Agent Leaderboard)</span>
          </h3>
          <span className="text-xs text-slate-400">Sắp xếp theo giá trị kinh tế đóng góp</span>
        </div>

        <div className="space-y-3">
          {metrics.agentLeaderboard.map((agent, idx) => (
            <div
              key={agent.agentId}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
                  #{idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{agent.agentName}</span>
                    <Badge tone={agent.status === 'top_performer' ? 'emerald' : 'cyan'}>
                      {agent.department}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{agent.avatarRole}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-right w-full md:w-auto">
                <div>
                  <div className="text-slate-400">Nhiệm vụ xong:</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{agent.tasksCompleted} tasks</div>
                </div>

                <div>
                  <div className="text-slate-400">Chi phí Token:</div>
                  <div className="font-mono text-slate-300 mt-0.5">{formatMoneyVN(agent.totalCostVnd)}</div>
                </div>

                <div>
                  <div className="text-slate-400">Tương đương FTE:</div>
                  <div className="font-semibold text-violet-300 mt-0.5">{agent.humanFteEquivalent} FTE</div>
                </div>

                <div>
                  <div className="text-slate-400">Giá trị tạo ra:</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {formatMoneyVN(agent.attributedValueGeneratedVnd)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AgentROIDashboard;
