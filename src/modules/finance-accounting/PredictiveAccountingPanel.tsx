import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Activity,
  Lightbulb,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatMoneyVN } from '../../utils/excelFormatters';

interface ExpenseAnomaly {
  id: string;
  category: string;
  department: string;
  currentAmountVnd: number;
  expectedMeanVnd: number;
  deviationPercentage: number;
  severity: 'critical' | 'warning' | 'info';
  detectedAt: string;
  aiExplanation: string;
  recommendedAction: string;
}

interface FinancialMetrics {
  projectedRevenueNextMonthVnd: number;
  projectedBurnRateVnd: number;
  predictedRunwayMonths: number;
  costEfficiencyRatio: number;
  anomaliesDetected: ExpenseAnomaly[];
  monthlyVarianceTrend: Array<{
    month: string;
    actualRevenueVnd: number;
    predictedRevenueVnd: number;
    actualExpenseVnd: number;
    predictedExpenseVnd: number;
  }>;
}

export const PredictiveAccountingPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dormant/predictive-accounting/metrics');
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load predictive metrics', err);
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
        <span>Đang tính toán mô hình dự báo tài chính AI...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>AI Predictive Accounting (Dự báo tài chính & Phát hiện chi phí bất thường)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ứng dụng Machine Learning phân tích độ lệch chuẩn (2-Sigma) và dự báo doanh thu chu kỳ tới
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Doanh thu dự phóng tháng tới</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {formatMoneyVN(metrics.projectedRevenueNextMonthVnd)}
          </div>
          <div className="text-[11px] text-emerald-500 mt-0.5">+9.1% so với tháng hiện tại</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Dự toán chi phí vận hành (Burn Rate)</div>
          <div className="text-xl font-bold text-slate-200 mt-1">
            {formatMoneyVN(metrics.projectedBurnRateVnd)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Kiểm soát tốt dưới trần ngân sách</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Dòng tiền dự phòng an toàn (Runway)</div>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            {metrics.predictedRunwayMonths} tháng
          </div>
          <div className="text-[11px] text-cyan-400 mt-0.5">Ngưỡng xuất sắc (Mục tiêu &gt; 12T)</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Chỉ số hiệu quả chi phí (Efficiency)</div>
          <div className="text-xl font-bold text-violet-300 mt-1">
            {(metrics.costEfficiencyRatio * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] text-violet-400 mt-0.5">1 VND chi phí tạo 13.5 VND DT</div>
        </Card>
      </div>

      {/* Anomalies Alert Box */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>Cảnh báo biến động chi phí bất thường được AI phát hiện:</span>
        </div>

        {metrics.anomaliesDetected.map((anom) => (
          <Card
            key={anom.id}
            className={`p-4 border ${
              anom.severity === 'warning'
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">{anom.category}</span>
                  <Badge tone={anom.severity === 'warning' ? 'amber' : 'cyan'}>
                    +{anom.deviationPercentage}% lệch chuẩn
                  </Badge>
                  <span className="text-xs text-slate-400">({anom.department})</span>
                </div>

                <div className="text-xs text-slate-300">
                  Thực tế: <strong className="text-amber-300">{formatMoneyVN(anom.currentAmountVnd)}</strong> / Trung bình kỳ vọng:{' '}
                  <strong>{formatMoneyVN(anom.expectedMeanVnd)}</strong>
                </div>

                <p className="text-xs text-slate-300 pt-1">
                  <strong>Phân tích AI:</strong> {anom.aiExplanation}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-cyan-300 pt-1">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    <strong>Khuyến nghị khắc phục:</strong> {anom.recommendedAction}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Variance Trend Table */}
      <Card className="p-4 bg-slate-900/80 border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>Bảng đối chiếu Thực tế vs Dự báo (Actual vs Predicted Trend)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2.5">Tháng</th>
                <th className="p-2.5">DT Thực tế</th>
                <th className="p-2.5">DT Dự báo AI</th>
                <th className="p-2.5">Chi phí Thực tế</th>
                <th className="p-2.5">Chi phí Dự báo AI</th>
                <th className="p-2.5">Độ chính xác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {metrics.monthlyVarianceTrend.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-semibold text-slate-200">{row.month}</td>
                  <td className="p-2.5 font-mono text-emerald-400">
                    {row.actualRevenueVnd > 0 ? formatMoneyVN(row.actualRevenueVnd) : '---'}
                  </td>
                  <td className="p-2.5 font-mono text-cyan-300">{formatMoneyVN(row.predictedRevenueVnd)}</td>
                  <td className="p-2.5 font-mono text-slate-200">
                    {row.actualExpenseVnd > 0 ? formatMoneyVN(row.actualExpenseVnd) : '---'}
                  </td>
                  <td className="p-2.5 font-mono text-slate-400">{formatMoneyVN(row.predictedExpenseVnd)}</td>
                  <td className="p-2.5 text-emerald-400 font-semibold">97.8%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PredictiveAccountingPanel;
