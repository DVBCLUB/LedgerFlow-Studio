import React, { useMemo } from 'react';

type Interview = { painScore?: number; payScore?: number; evidenceScore?: number; persona?: string; pain?: string };
type Lead = { stage?: string; name?: string; persona?: string; paidSignal?: string; nextAction?: string };
type Decision = { experiment?: string; decision?: string; confidence?: number; evidence?: string; nextAction?: string; reviewDate?: string };
type Tool = { monthlyCost?: number; category?: string; decision?: string; name?: string; purpose?: string };

const readArray = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const avg = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.round(value));

export default function OnePageFounderReport() {
  const report = useMemo(() => {
    const interviews = readArray<Interview>('ledgerflow-persona-interviews-v1');
    const leads = readArray<Lead>('ledgerflow-distribution-leads-v1');
    const decisions = readArray<Decision>('ledgerflow-experiment-decisions-v1');
    const tools = readArray<Tool>('ledgerflow-tool-budget-ledger-v1');

    const painAvg = avg(interviews.map((item) => Number(item.painScore || 0)));
    const payAvg = avg(interviews.map((item) => Number(item.payScore || 0)));
    const evidenceAvg = avg(interviews.map((item) => Number(item.evidenceScore || 0)));
    const strongInterviews = interviews.filter((item) => Number(item.painScore || 0) >= 7 && Number(item.payScore || 0) >= 6).length;

    const paidLeads = leads.filter((item) => item.stage === 'Có tín hiệu trả tiền');
    const demoLeads = leads.filter((item) => ['Đã demo', 'Có tín hiệu trả tiền'].includes(item.stage || ''));
    const rejectedLeads = leads.filter((item) => item.stage === 'Loại / chưa phù hợp');

    const buildDecisions = decisions.filter((item) => item.decision === 'BUILD');
    const holdDecisions = decisions.filter((item) => item.decision === 'HOLD');
    const killDecisions = decisions.filter((item) => item.decision === 'KILL');
    const confidenceAvg = avg(decisions.map((item) => Number(item.confidence || 0)));

    const monthlyBurn = tools.reduce((sum, item) => sum + Number(item.monthlyCost || 0), 0);
    const cancelBurn = tools.filter((item) => item.decision === 'Cancel').reduce((sum, item) => sum + Number(item.monthlyCost || 0), 0);
    const reviewBurn = tools.filter((item) => item.decision === 'Review').reduce((sum, item) => sum + Number(item.monthlyCost || 0), 0);
    const topTools = [...tools].sort((a, b) => Number(b.monthlyCost || 0) - Number(a.monthlyCost || 0)).slice(0, 5);

    const validationScore = Math.max(0, Math.min(100, Math.round(
      painAvg * 2.2 + payAvg * 2.4 + evidenceAvg * 2 + paidLeads.length * 8 + buildDecisions.length * 4 - killDecisions.length * 3 - rejectedLeads.length * 2
    )));
    const burnRisk = monthlyBurn ? Math.round(((cancelBurn + reviewBurn) / monthlyBurn) * 100) : 0;
    const monthlyDecision = validationScore >= 70 && burnRisk < 35
      ? 'BUILD / DEMO THÁNG NÀY'
      : validationScore >= 45
        ? 'HOLD / TEST THÊM'
        : 'KILL HOẶC THU HẸP PHẠM VI';

    const focus = buildDecisions[0]?.experiment || paidLeads[0]?.name || 'Chọn 1 MVP nhỏ nhất để kiểm chứng paid signal';
    const killOrReduce = killDecisions[0]?.experiment || tools.find((item) => item.decision === 'Cancel')?.name || 'Không tăng scope khi chưa có paid signal rõ';

    return { interviews, leads, decisions, tools, painAvg, payAvg, evidenceAvg, strongInterviews, paidLeads, demoLeads, rejectedLeads, buildDecisions, holdDecisions, killDecisions, confidenceAvg, monthlyBurn, cancelBurn, reviewBurn, topTools, validationScore, burnRisk, monthlyDecision, focus, killOrReduce };
  }, []);

  const printReport = () => window.print();

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 print:border-slate-300 print:bg-white print:text-slate-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300 print:text-slate-600">One-Page Founder Report</p>
            <h2 className="mt-2 text-2xl font-black text-white print:text-slate-950">Báo cáo founder một trang</h2>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-400 print:text-slate-700">Tổng hợp nhanh để quyết định tháng này nên build gì, hold gì, kill gì và đang đốt bao nhiêu tiền tool.</p>
          </div>
          <button onClick={printReport} className="rounded-2xl border border-emerald-500/30 bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 print:hidden">In / Save PDF</button>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 print:border-slate-300 print:bg-white print:text-slate-950">
        <p className="text-[10px] font-black uppercase text-emerald-300 print:text-slate-600">Quyết định tháng</p>
        <h3 className="mt-2 text-2xl font-black text-white print:text-slate-950">{report.monthlyDecision}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 print:border-slate-300 print:bg-white"><p className="text-[10px] font-black uppercase text-slate-500">Validation score</p><p className="mt-2 text-3xl font-black">{report.validationScore}/100</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 print:border-slate-300 print:bg-white"><p className="text-[10px] font-black uppercase text-slate-500">Monthly tool burn</p><p className="mt-2 text-3xl font-black">{money(report.monthlyBurn)}đ</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 print:border-slate-300 print:bg-white"><p className="text-[10px] font-black uppercase text-slate-500">Burn risk</p><p className="mt-2 text-3xl font-black">{report.burnRisk}%</p></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 print:border-slate-300 print:bg-white print:text-slate-950">
          <h3 className="text-sm font-black text-white print:text-slate-950">1. Tín hiệu thị trường</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">Interview: {report.interviews.length} • Strong signal: {report.strongInterviews}</p>
          <p className="text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">Lead: {report.leads.length} • Demo: {report.demoLeads.length} • Paid signal: {report.paidLeads.length}</p>
          <p className="text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">Pain {report.painAvg.toFixed(1)} / Pay {report.payAvg.toFixed(1)} / Evidence {report.evidenceAvg.toFixed(1)}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 print:border-slate-300 print:bg-white print:text-slate-950">
          <h3 className="text-sm font-black text-white print:text-slate-950">2. Quyết định thí nghiệm</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">BUILD: {report.buildDecisions.length} • HOLD: {report.holdDecisions.length} • KILL: {report.killDecisions.length}</p>
          <p className="text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">Confidence trung bình: {report.confidenceAvg.toFixed(0)}%</p>
          <p className="text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">Focus: {report.focus}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 print:border-slate-300 print:bg-white print:text-slate-950">
          <h3 className="text-sm font-black text-white print:text-slate-950">3. Tool budget</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">Tổng burn: {money(report.monthlyBurn)}đ/tháng</p>
          <p className="text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">Cần review: {money(report.reviewBurn)}đ • Nên hủy: {money(report.cancelBurn)}đ</p>
          <div className="mt-3 space-y-2">
            {report.topTools.map((tool) => (
              <div key={`${tool.name}-${tool.monthlyCost}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold text-slate-300 print:border-slate-300 print:bg-white print:text-slate-700">
                {tool.name || 'Unnamed tool'} • {money(Number(tool.monthlyCost || 0))}đ • {tool.decision || 'Keep'}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 print:border-slate-300 print:bg-white print:text-slate-950">
          <h3 className="text-sm font-black text-white print:text-slate-950">4. Việc cần làm</h3>
          <div className="mt-3 space-y-2 text-xs font-semibold leading-6 text-slate-300 print:text-slate-700">
            <p>Build/demo: {report.focus}</p>
            <p>Hold: phỏng vấn thêm nếu paid signal chưa đủ rõ.</p>
            <p>Kill/giảm scope: {report.killOrReduce}</p>
            <p>Kiểm soát burn: xử lý tool Review/Cancel trước khi mua tool mới.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
