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
    <section className="space-y-4 text-text-primary">
      <div className="rounded-3xl border border-border-primary bg-bg-primary p-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-success">Monthly Review</p>
        <h2 className="mt-2 text-xl font-bold text-text-primary">Founder review tháng</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Tổng hợp interview, lead, decision và tool budget để quyết định tháng này nên BUILD, HOLD hay KILL. Đây là dashboard quản trị thử nghiệm, không thay thế kế toán chính thức.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Validation score</p><p className="mt-2 text-3xl font-bold text-text-primary">{snapshot.validationScore}/100</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Tool burn</p><p className="mt-2 text-3xl font-bold text-text-primary">{money(snapshot.monthlyBurn)}đ</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Paid signals</p><p className="mt-2 text-3xl font-bold text-text-primary">{snapshot.paidSignalLeads}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Recommendation</p><p className="mt-2 text-lg font-bold text-success">{snapshot.recommendation}</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-info/20 bg-info/5 p-5">
          <h3 className="text-sm font-bold text-text-primary">Research health</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">Interview: {snapshot.interviews.length} • Strong: {snapshot.strongInterviews}</p>
          <p className="text-xs font-semibold leading-6 text-text-secondary">Pain {snapshot.painAvg.toFixed(1)} / Pay {snapshot.payAvg.toFixed(1)} / Evidence {snapshot.evidenceAvg.toFixed(1)}</p>
        </div>
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
          <h3 className="text-sm font-bold text-text-primary">Commercial health</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">Lead: {snapshot.leads.length} • Demo: {snapshot.demoLeads} • Paid signal: {snapshot.paidSignalLeads}</p>
          <p className="text-xs font-semibold leading-6 text-text-secondary">Rejected: {snapshot.rejectedLeads}</p>
        </div>
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-5">
          <h3 className="text-sm font-bold text-text-primary">Decision & burn health</h3>
          <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">BUILD {snapshot.buildCount} • HOLD {snapshot.holdCount} • KILL {snapshot.killCount}</p>
          <p className="text-xs font-semibold leading-6 text-text-secondary">Risky burn: {money(snapshot.riskyBurn)}đ ({snapshot.burnRisk}%) • Cancel: {money(snapshot.cancelBurn)}đ</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-primary bg-bg-surface p-5">
        <h3 className="text-sm font-bold text-text-primary">Checklist hành động tháng này</h3>
        <div className="mt-3 grid gap-2">
          {snapshot.actions.map((action) => (
            <div key={action} className="rounded-xl border border-border-primary bg-bg-primary p-3 text-xs font-semibold leading-6 text-text-secondary">{action}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
