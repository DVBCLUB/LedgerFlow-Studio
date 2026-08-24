import React, { useState, useEffect } from 'react';
import { A11yAuditReport, A11yViolation } from '../../../server/services/a11yAccessibilityAuditEngine';

export const A11yAccessibilityAuditPanel: React.FC = () => {
  const [report, setReport] = useState<A11yAuditReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fixing, setFixing] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/dormant/a11y-audit/report');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch a11y report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleAutoFix = async () => {
    setFixing(true);
    try {
      const res = await fetch('/api/dormant/a11y-audit/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Failed to apply a11y auto fix', err);
    } finally {
      setFixing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang quét kiểm toán tiếp cận chuẩn quốc tế WCAG 2.2 AA...</p>
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
              PILLAR 105 — WCAG 2.2 LEVEL AA
            </span>
            <span className="text-xs text-slate-400 font-mono">Elements Scanned: {report?.totalElementsScanned}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Accessibility Audit (WCAG 2.2 AA)</h1>
          <p className="text-sm text-slate-400">
            Tự động kiểm tra độ tương phản màu sắc, ARIA roles, bàn phím điều hướng & thân thiện với trình đọc màn hình.
          </p>
        </div>

        <button
          onClick={handleAutoFix}
          disabled={fixing || report?.violations.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {fixing ? 'Đang sửa lỗi...' : '✨ Tự Động Sửa Lỗi A11y 100%'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Điểm Tuân Thủ Tiếp Cận</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report?.complianceScorePercent}%</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Tier-1 Global Rating</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Quy Chuẩn Quốc Tế</div>
          <div className="text-sm font-bold text-white mt-2">{report?.wcagLevel}</div>
          <div className="text-xs text-slate-400 mt-1">W3C Recommendation 2026</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Số Quy Tắc Đạt Chuẩn</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{report?.passedRulesCount}/48</div>
          <div className="text-xs text-slate-400 mt-1">Passing all critical gates</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Cảnh Báo Cần Khắc Phục</div>
          <div className={`text-2xl font-extrabold mt-1 ${report?.violations.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {report?.violations.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {report?.violations.length === 0 ? 'Zero Violations Detected' : 'Actionable Fixes Ready'}
          </div>
        </div>
      </div>

      {/* Violations List */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Danh Sách Các Vấn Đề Tiếp Cận (Accessibility Issues Log)
        </h2>

        {report?.violations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-emerald-900/40">
            <div className="text-emerald-400 font-bold text-base">🎉 Hoàn Toàn Đạt Chuẩn WCAG 2.2 Level AA!</div>
            <div className="text-xs text-slate-400 mt-1">Không phát hiện bất kỳ lỗi tương phản hoặc thiếu sót ARIA nào.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {report?.violations.map((violation: A11yViolation) => (
              <div key={violation.id} className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-lg space-y-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-mono rounded">
                      {violation.wcagCriterion}
                    </span>
                    <span className="text-sm font-semibold text-white">{violation.ruleId}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    violation.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {violation.severity.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-mono">Selector: {violation.componentSelector}</div>
                <div className="text-xs text-slate-400">{violation.failureSummary}</div>
                <div className="text-xs text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                  💡 <strong>Đề xuất khắc phục:</strong> {violation.suggestedFix}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default A11yAccessibilityAuditPanel;
