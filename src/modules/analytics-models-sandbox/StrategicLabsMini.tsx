import React from 'react';
import { PERSONA_LAB, FINANCE_LAB, DISTRIBUTION_ENGINE, GAME_EDUCATION_LAB, PAYMENT_DECISION_MATRIX } from '../../data/founderStrategicLabs';

const LabCard = ({ title, count, note }: { title: string; count: number; note: string }) => (
  <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
    <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Strategic Lab</p>
    <h3 className="mt-2 text-sm font-black text-text-primary">{title}</h3>
    <p className="mt-2 text-3xl font-black text-text-primary">{count}</p>
    <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{note}</p>
  </div>
);

export default function StrategicLabsMini() {
  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Founder Strategic Labs</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Phòng thí nghiệm chiến lược</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Bổ sung các mảng còn thiếu: persona mô phỏng, tài chính solo founder, kênh phân phối và game giáo dục. Đây là lớp nghiên cứu/chiến lược, không thay thế các mô hình mô phỏng hiện có.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <LabCard title="Persona Lab" count={PERSONA_LAB.length} note="Người dùng giả lập để khảo sát giả thuyết và pain point." />
        <LabCard title="Finance Lab" count={FINANCE_LAB.length} note="Burn rate, runway, MRR và gross margin cho solo founder." />
        <LabCard title="Payment Matrix" count={PAYMENT_DECISION_MATRIX.length} note="So sánh processor, MoR và thanh toán thủ công." />
        <LabCard title="Distribution Engine" count={DISTRIBUTION_ENGINE.length} note="Content, community research và demo-led selling." />
        <LabCard title="Game Education Lab" count={GAME_EDUCATION_LAB.length} note="Mini-game học tập theo tình huống và quyết định." />
      </div>
    </section>
  );
}
