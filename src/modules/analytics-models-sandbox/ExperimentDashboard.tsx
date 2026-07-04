import React, { useMemo } from 'react';

type Interview = { painScore?: number; payScore?: number; evidenceScore?: number };
type Lead = { stage?: string };
type Decision = { decision?: 'BUILD' | 'HOLD' | 'KILL'; confidence?: number };

const readList = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const avg = (values: number[]) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
};

const MetricCard = ({ label, value, note }: { label: string; value: string | number; note: string }) => (
  <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
    <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Experiment metric</p>
    <p className="mt-2 text-3xl font-black text-text-primary">{value}</p>
    <h3 className="mt-2 text-sm font-black text-text-primary">{label}</h3>
    <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{note}</p>
  </div>
);

export default function ExperimentDashboard() {
  const data = useMemo(() => {
    const interviews = readList<Interview>('ledgerflow-persona-interviews-v1');
    const leads = readList<Lead>('ledgerflow-distribution-leads-v1');
    const decisions = readList<Decision>('ledgerflow-experiment-decisions-v1');

    const strongInterviews = interviews.filter((item) => ((item.painScore ?? 0) + (item.payScore ?? 0) + (item.evidenceScore ?? 0)) / 3 >= 75).length;
    const paidSignalLeads = leads.filter((item) => item.stage === 'Có tín hiệu trả tiền').length;
    const demoLeads = leads.filter((item) => item.stage === 'Đã demo' || item.stage === 'Có tín hiệu trả tiền').length;
    const buildCount = decisions.filter((item) => item.decision === 'BUILD').length;
    const holdCount = decisions.filter((item) => item.decision === 'HOLD').length;
    const killCount = decisions.filter((item) => item.decision === 'KILL').length;

    const avgPain = avg(interviews.map((item) => Number(item.painScore ?? 0)));
    const avgPay = avg(interviews.map((item) => Number(item.payScore ?? 0)));
    const avgEvidence = avg(interviews.map((item) => Number(item.evidenceScore ?? 0)));
    const avgConfidence = avg(decisions.map((item) => Number(item.confidence ?? 0)));

    const validationScore = Math.min(100, Math.round(avgPain * 0.25 + avgPay * 0.25 + avgEvidence * 0.2 + paidSignalLeads * 10 + buildCount * 5 - killCount * 3));
    const verdict = validationScore >= 75 ? 'BUILD / DEMO' : validationScore >= 45 ? 'HOLD / TEST THÊM' : 'NO-GO TẠM THỜI';

    return { interviews, leads, decisions, strongInterviews, paidSignalLeads, demoLeads, buildCount, holdCount, killCount, avgPain, avgPay, avgEvidence, avgConfidence, validationScore, verdict };
  }, []);

  return (
    <section className="space-y-5 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Founder Experiment Dashboard</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Bảng điều hành thử nghiệm</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Tổng hợp dữ liệu localStorage từ Persona Interview, Distribution Lead Board và Experiment Decision Log để founder ra quyết định BUILD / HOLD / KILL. Đây là dashboard điều hành giả lập, không phải báo cáo tài chính chính thức.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Validation score" value={`${data.validationScore}/100`} note={`Kết luận hiện tại: ${data.verdict}`} />
        <MetricCard label="Persona interviews" value={data.interviews.length} note={`Strong signals: ${data.strongInterviews}; Pain avg: ${data.avgPain}`} />
        <MetricCard label="Distribution leads" value={data.leads.length} note={`Demo: ${data.demoLeads}; Paid signal: ${data.paidSignalLeads}`} />
        <MetricCard label="Experiment decisions" value={data.decisions.length} note={`BUILD ${data.buildCount} / HOLD ${data.holdCount} / KILL ${data.killCount}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <p className="text-[10px] font-black uppercase text-cyan-300">Research health</p>
          <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">Pain avg: {data.avgPain} • Pay avg: {data.avgPay} • Evidence avg: {data.avgEvidence}</p>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">Nếu evidence thấp hơn pain/pay, chưa nên build lớn; tiếp tục phỏng vấn và demo nhỏ.</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-[10px] font-black uppercase text-emerald-300">Commercial health</p>
          <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">Paid signals: {data.paidSignalLeads} • Demo leads: {data.demoLeads}</p>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">Có tín hiệu trả tiền mới được nâng ưu tiên build. Không lấy lượt xem hoặc lời khen làm bằng chứng bán hàng.</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-[10px] font-black uppercase text-amber-300">Decision health</p>
          <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">Avg confidence: {data.avgConfidence} • Verdict: {data.verdict}</p>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-text-tertiary">Mỗi quyết định phải có evidence, owner và next action để tránh AI build lan man.</p>
        </div>
      </div>
    </section>
  );
}
