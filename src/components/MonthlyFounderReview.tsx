import React, { useMemo } from 'react';

type Interview = { painScore?: number; payScore?: number; evidenceScore?: number };
type Lead = { stage?: string };
type Decision = { decision?: string; confidence?: number };
type Tool = { monthlyCost?: number; category?: string; decision?: string; name?: string };

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

export default function MonthlyFounderReview() {
  const snapshot = useMemo(() => {
    const interviews = readArray<Interview>('ledgerflow-persona-interviews-v1');
    const leads = readArray<Lead>('ledgerflow-distribution-leads-v1');
    const decisions = readArray<Decision>('ledgerflow-experiment-decisions-v1');
    const tools = readArray<Tool>('ledgerflow-tool-budget-ledger-v1');

    const painAvg = avg(interviews.map((item) => Number(item.painScore || 0)));
    const payAvg = avg(interviews.map((item) => Number(item.payScore || 0)));
    const evidenceAvg = avg(interviews.map((item) => Number(item.evidenceScore || 0)));
    const strongInterviews = interviews.filter((item) => Number(item.painScore || 0) >= 7 && Number(item.payScore || 0) >= 6).length;

    const demoLeads = leads.filter((item) => ['Đã demo', 'Có tín hiệu trả tiền'].includes(item.stage || '')).length;
    const paidSignalLeads = leads.filter((item) => item.stage === 'Có tín hiệu trả tiền').length;
    const rejectedLeads = leads.filter((item) => item.stage === 'Loại / chưa phù hợp').length;

    const buildCount = decisions.filter((item) => item.decision === 'BUILD').length;
    const holdCount = decisions.filter((item) => item.decision === 'HOLD').length;
    const killCount = decisions.filter((item) => item.decision === 'KILL').length;
    const confidenceAvg = avg(decisions.map((item) => Number(item.confidence || 0)));

    const monthlyBurn = tools.reduce((sum, item) => sum + Number(item.monthlyCost || 0), 0);
    const riskyBurn = tools
      .filter((item) => ['Review', 'Cancel'].includes(item.decision || ''))
      .reduce((sum, item) => sum + Number(item.monthlyCost || 0), 0);
    const cancelBurn = tools
      .filter((item) => item.decision === 'Cancel')
      .reduce((sum, item) => sum + Number(item.monthlyCost || 0), 0);

    const validationScore = Math.max(0, Math.min(100, Math.round(
      painAvg * 2.2 + payAvg * 2.4 + evidenceAvg * 2 + paidSignalLeads * 8 + buildCount * 4 - killCount * 3 - rejectedLeads * 2
    )));

    const burnRisk = monthlyBurn ? Math.round((riskyBurn / monthlyBurn) * 100) : 0;
    const recommendation = validationScore >= 70 && burnRisk < 35
      ? 'BUILD / DEMO THÁNG NÀY'
      : validationScore >= 45
        ? 'HOLD / TEST THÊM'
        : 'KILL HOẶC THU HẸP PHẠM VI';

    const actions = [
      paidSignalLeads === 0 ? 'Chưa có paid signal: ưu tiên demo trực tiếp và hỏi giá.' : 'Có paid signal: gom objection và chốt MVP nhỏ nhất.',
      burnRisk >= 35 ? 'Chi phí tool rủi ro cao: xử lý Tool Cancel Plan trước khi build thêm.' : 'Tool burn tạm ổn: vẫn cần review định kỳ.',
      strongInterviews < 3 ? 'Cần thêm interview chất lượng trước khi tăng scope.' : 'Interview đủ tốt: chuyển insight thành experiment cụ thể.',
      buildCount === 0 ? 'Chưa có quyết định BUILD: chọn 1 experiment nhỏ để chạy.' : 'Đang có BUILD: đặt ngày review và tiêu chí dừng rõ ràng.'
    ];

    return { interviews, leads, decisions, tools, painAvg, payAvg, evidenceAvg, strongInterviews, demoLeads, paidSignalLeads, rejectedLeads, buildCount, holdCount, killCount, confidenceAvg, monthlyBurn, riskyBurn, cancelBurn, validationScore, burnRisk, recommendation, actions };
  }, []);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Monthly Review</p>
        <h2 className="mt-2 text-xl font-black text-white">Founder review tháng</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Tổng hợp interview, lead, decision và tool budget để quyết định tháng này nên BUILD, HOLD hay KILL. Đây là dashboard quản trị thử nghiệm, không thay thế kế toán chính thức.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Validation score</p><p className="mt-2 text-3xl font-black text-white">{snapshot.validationScore}/100</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Tool burn</p><p className="mt-2 text-3xl font-black text-white">{money(snapshot.monthlyBurn)}đ</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Paid signals</p><p className="mt-2 text-3xl font-black text-white">{snapshot.paidSignalLeads}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Recommendation</p><p className="mt-2 text-lg font-black text-emerald-300">{snapshot.recommendation}</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <h3 className="text-sm font-black text-white">Research health</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Interview: {snapshot.interviews.length} • Strong: {snapshot.strongInterviews}</p>
          <p className="text-xs font-semibold leading-6 text-slate-300">Pain {snapshot.painAvg.toFixed(1)} / Pay {snapshot.payAvg.toFixed(1)} / Evidence {snapshot.evidenceAvg.toFixed(1)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h3 className="text-sm font-black text-white">Commercial health</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Lead: {snapshot.leads.length} • Demo: {snapshot.demoLeads} • Paid signal: {snapshot.paidSignalLeads}</p>
          <p className="text-xs font-semibold leading-6 text-slate-300">Rejected: {snapshot.rejectedLeads}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h3 className="text-sm font-black text-white">Decision & burn health</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">BUILD {snapshot.buildCount} • HOLD {snapshot.holdCount} • KILL {snapshot.killCount}</p>
          <p className="text-xs font-semibold leading-6 text-slate-300">Risky burn: {money(snapshot.riskyBurn)}đ ({snapshot.burnRisk}%) • Cancel: {money(snapshot.cancelBurn)}đ</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-black text-white">Checklist hành động tháng này</h3>
        <div className="mt-3 grid gap-2">
          {snapshot.actions.map((action) => (
            <div key={action} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-slate-300">{action}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
