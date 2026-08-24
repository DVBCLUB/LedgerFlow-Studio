import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface DepartmentHealth {
  departmentId: string;
  departmentName: string;
  overallScore: number;
  status: 'optimal' | 'stable' | 'attention_needed' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  keyMetrics: Array<{
    name: string;
    value: string;
    target: string;
    isHealthy: boolean;
  }>;
  correlationInsights: string[];
}

interface EvolutionProposal {
  id: string;
  workflowName: string;
  department: string;
  originalCondition: string;
  proposedMutation: string;
  rationale: string;
  expectedImprovement: string;
  status: 'pending_approval' | 'promoted' | 'rejected';
  confidenceScore: number;
}

export const DepartmentHealthPanel: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentHealth[]>([]);
  const [proposals, setProposals] = useState<EvolutionProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDepts, resProps] = await Promise.all([
        fetch('/api/dormant/department-health/reports').then((r) => r.json()),
        fetch('/api/dormant/self-evolving/proposals').then((r) => r.json()),
      ]);

      if (resDepts.success) setDepartments(resDepts.reports);
      if (resProps.success) setProposals(resProps.proposals);
    } catch (err) {
      console.error('Failed to load department health', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveProposal = async (id: string) => {
    try {
      const res = await fetch('/api/dormant/self-evolving/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setProposals((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'promoted' } : p))
        );
      }
    } catch (err) {
      console.error('Failed to approve evolution proposal', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Activity className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
        <span>Đang tổng hợp điểm sức khỏe 5 phòng ban và đề xuất tự tiến hóa...</span>
      </div>
    );
  }

  const averageCompanyHealth = (
    departments.reduce((sum, d) => sum + d.overallScore, 0) / (departments.length || 1)
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>360° Department Health & Self-Evolving Workflows</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Đánh giá sức khỏe toàn diện 5 phòng ban và các đề xuất tự động tiến hóa quy trình vận hành
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Điểm sức khỏe công ty:</div>
            <div className="text-xl font-bold text-emerald-400">{averageCompanyHealth} / 100</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            className="flex items-center gap-1 text-xs text-slate-300 border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 5 Department Health Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <Card
            key={dept.departmentId}
            className="p-5 bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-100">{dept.departmentName}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge tone={dept.status === 'optimal' ? 'emerald' : 'amber'}>
                    {dept.status === 'optimal' ? 'Tối ưu' : 'Ổn định'}
                  </Badge>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Đang tăng trưởng
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">{dept.overallScore}</div>
                <div className="text-[10px] text-slate-400">/ 100 điểm</div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              {dept.keyMetrics.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">{m.name}:</span>
                  <span className="font-semibold text-slate-100">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Insights */}
            {dept.correlationInsights.length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300">
                <span className="text-cyan-300 font-medium">Nhận định AI: </span>
                {dept.correlationInsights[0]}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Self-Evolving Workflows Section */}
      <Card className="p-5 bg-slate-900/80 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>Đề xuất tự tiến hóa quy trình (Self-Evolving Workflow Proposals)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Hệ thống AI tự động đề xuất sửa đổi quy tắc dựa trên dữ liệu vận hành thực tế
          </span>
        </div>

        <div className="space-y-3">
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-violet-500/40 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">{prop.workflowName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800 font-mono">
                    {prop.department}
                  </span>
                </div>

                {prop.status === 'promoted' ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã áp dụng vào hệ thống
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApproveProposal(prop.id)}
                    className="text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Duyệt & Nâng cấp Quy trình</span>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400">
                  <span className="text-rose-400 font-semibold block mb-1">Quy tắc cũ:</span>
                  {prop.originalCondition}
                </div>
                <div className="p-2.5 rounded bg-violet-950/30 border border-violet-800/40 text-violet-200">
                  <span className="text-emerald-400 font-semibold block mb-1">Đề xuất tiến hóa:</span>
                  {prop.proposedMutation}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-300 pt-1">
                <div>
                  <strong className="text-slate-400">Cơ sở dữ liệu: </strong>
                  {prop.rationale}
                </div>
                <div className="text-emerald-400 font-medium shrink-0">
                  Hiệu quả: {prop.expectedImprovement}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DepartmentHealthPanel;
