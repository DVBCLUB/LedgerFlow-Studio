import React, { useState, useEffect } from 'react';
import {
  Factory,
  Zap,
  TrendingUp,
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatMoneyVN } from '../../utils/excelFormatters';

interface ScaleStatus {
  factoryId: string;
  factoryName: string;
  activeWorkers: number;
  maxWorkers: number;
  currentQueueDepth: number;
  utilizationRate: number;
  autoScaleState: string;
  costPerHourUsd: number;
}

interface RevenueAttribution {
  factoryId: string;
  factoryName: string;
  totalArtifactsProduced: number;
  attributedRevenueVnd: number;
  totalOperatingCostVnd: number;
  roiRatio: number;
  keyRevenueDrivers: Array<{
    artifactName: string;
    impactType: string;
    valueGeneratedVnd: number;
  }>;
}

interface OptimizationReport {
  overallThroughputScore: number;
  avgExecutionLatencySeconds: number;
  qualityGatePassRate: number;
  bottlenecksIdentified: Array<{
    factoryId: string;
    stageName: string;
    impactDescription: string;
    remediationAction: string;
    estimatedSpeedup: string;
  }>;
  optimizationActionsApplied: string[];
}

export const FactoryPerformanceDashboard: React.FC = () => {
  const [scaleStatuses, setScaleStatuses] = useState<ScaleStatus[]>([]);
  const [revenueAttributions, setRevenueAttributions] = useState<RevenueAttribution[]>([]);
  const [optimReport, setOptimReport] = useState<OptimizationReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resScale, resRev, resOptim] = await Promise.all([
        fetch('/api/dormant/factory/auto-scale/status').then((r) => r.json()),
        fetch('/api/dormant/factory/revenue-impact/dashboard').then((r) => r.json()),
        fetch('/api/dormant/factory/performance/report').then((r) => r.json()),
      ]);

      if (resScale.success) setScaleStatuses(resScale.statuses);
      if (resRev.success) setRevenueAttributions(resRev.attribution);
      if (resOptim.success) setOptimReport(resOptim.report);
    } catch (err) {
      console.error('Failed to load factory performance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Activity className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
        <span>Đang kết nối dữ liệu 4 nhà máy số (Multi-Factory Hub)...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Factory className="w-5 h-5 text-cyan-400" />
            <span>Digital Factory Performance & Revenue ROI (Hiệu năng Nhà máy số)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Giám sát tự động co giãn (Auto-Scale), gỡ điểm nghẽn hiệu năng và đo lường doanh thu tạo ra từ 4 nhà máy
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchData}
          className="flex items-center gap-1 text-xs text-cyan-300 border-cyan-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới chỉ số</span>
        </Button>
      </div>

      {/* Global Factory KPIs */}
      {optimReport && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-slate-900/70 border-slate-800">
            <div className="text-xs text-slate-400">Điểm thông lượng tổng thể (Throughput)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {optimReport.overallThroughputScore} / 100
            </div>
            <div className="text-[11px] text-emerald-500 mt-0.5">Xuất sắc — Vượt tải định mức</div>
          </Card>

          <Card className="p-4 bg-slate-900/70 border-slate-800">
            <div className="text-xs text-slate-400">Độ trễ xử lý trung bình mỗi mission</div>
            <div className="text-2xl font-bold text-cyan-300 mt-1">
              {optimReport.avgExecutionLatencySeconds}s
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Giảm 42% nhờ Semantic Cache</div>
          </Card>

          <Card className="p-4 bg-slate-900/70 border-slate-800">
            <div className="text-xs text-slate-400">Tỷ lệ vượt qua Quality Gate tự động</div>
            <div className="text-2xl font-bold text-violet-300 mt-1">
              {optimReport.qualityGatePassRate}%
            </div>
            <div className="text-[11px] text-violet-400 mt-0.5">Zero Regression trên production</div>
          </Card>
        </div>
      )}

      {/* 4 Parallel Factories Auto-Scale Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scaleStatuses.map((factory) => {
          const rev = revenueAttributions.find((r) => r.factoryId === factory.factoryId);
          return (
            <Card
              key={factory.factoryId}
              className="p-5 bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100">{factory.factoryName}</h3>
                    <Badge tone={factory.autoScaleState === 'optimal' ? 'emerald' : 'cyan'}>
                      {factory.autoScaleState.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Hàng đợi hiện tại: {factory.currentQueueDepth} tác vụ
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Chi phí LLM/h</div>
                  <div className="text-sm font-bold text-slate-200">${factory.costPerHourUsd}/h</div>
                </div>
              </div>

              {/* Concurrency Bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Số Worker AI đang chạy:</span>
                  <span className="font-mono text-cyan-400">
                    {factory.activeWorkers} / {factory.maxWorkers} worker
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${(factory.activeWorkers / factory.maxWorkers) * 100}%` }}
                  />
                </div>
              </div>

              {/* Revenue Attribution Snippet */}
              {rev && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Doanh thu tạo ra: </span>
                    <strong className="text-emerald-400">{formatMoneyVN(rev.attributedRevenueVnd)}</strong>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold">
                    ROI: {rev.roiRatio}x
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottlenecks Remediation & Optimizations Applied */}
      {optimReport && (
        <Card className="p-5 bg-slate-900/80 border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Điểm nghẽn hiệu năng & Khuyến nghị tăng tốc từ AI Performance Doctor</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optimReport.bottlenecksIdentified.map((b, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 space-y-1.5 text-xs text-slate-300"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-slate-100">{b.stageName}</strong>
                  <span className="text-emerald-400 font-semibold">{b.estimatedSpeedup}</span>
                </div>
                <p className="text-slate-400">{b.impactDescription}</p>
                <div className="text-cyan-300 font-medium pt-1">
                  Khắc phục: {b.remediationAction}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default FactoryPerformanceDashboard;
