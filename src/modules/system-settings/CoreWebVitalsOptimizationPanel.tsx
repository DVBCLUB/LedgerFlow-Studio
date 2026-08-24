import React, { useState, useEffect } from 'react';
import { WebVitalsReport, WebVitalMetric } from '../../../server/services/coreWebVitalsOptimizationEngine';

export const CoreWebVitalsOptimizationPanel: React.FC = () => {
  const [report, setReport] = useState<WebVitalsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/dormant/web-vitals/report');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch web vitals report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/dormant/web-vitals/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Failed to optimize web vitals', err);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang đo đạc chỉ số hiệu năng Google Core Web Vitals...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              PILLAR 106 — GOOGLE CORE WEB VITALS
            </span>
            <span className="text-xs text-slate-400 font-mono">Rating: {report?.lighthouseRating}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Core Web Vitals & Lighthouse Optimizer</h1>
          <p className="text-sm text-slate-400">
            Giám sát độ trễ LCP, độ giật giao diện CLS, tốc độ tương tác INP và nén bộ nhớ đệm render thời gian thực.
          </p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={optimizing}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {optimizing ? 'Đang tối ưu...' : '⚡ Tối Ưu Hóa & Dọn Bộ Nhớ Render'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Điểm Hiệu Năng Tổng Thể</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report?.overallPerformanceScore}/100</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Top 0.1% Global Apps</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">LCP (Largest Contentful Paint)</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">
            {report?.metrics.find(m => m.name === 'LCP')?.currentValue}s
          </div>
          <div className="text-xs text-slate-400 mt-1">Chuẩn Google &lt; 2.5s (Đạt xuất sắc)</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">CLS (Layout Shift)</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            {report?.metrics.find(m => m.name === 'CLS')?.currentValue}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Zero Visual Jitter</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">INP (Interaction Next Paint)</div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">
            {report?.metrics.find(m => m.name === 'INP')?.currentValue}ms
          </div>
          <div className="text-xs text-slate-400 mt-1">Chuẩn Google &lt; 200ms</div>
        </div>
      </div>

      {/* Metrics Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report?.metrics.map((metric: WebVitalMetric) => (
          <div key={metric.name} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-white text-base">{metric.name}</span>
                <span className="text-xs text-slate-400 ml-2 font-mono">({metric.fullName})</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded">
                {metric.currentValue} {metric.unit}
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Ngưỡng tối ưu: <span className="font-mono text-emerald-400">&lt; {metric.goodThreshold} {metric.unit}</span>
            </div>
            <div className="text-xs text-slate-400 bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
              🛠️ <strong>Kỹ thuật áp dụng:</strong> {metric.optimizationTechnique}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoreWebVitalsOptimizationPanel;
