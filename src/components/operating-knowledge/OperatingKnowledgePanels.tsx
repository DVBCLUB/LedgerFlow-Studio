import React from 'react';
import {
  AI_WORK_ORDER_LIBRARY,
  DECISION_LOG_TEMPLATES,
  LEDGERFLOW_BOUNDARY_STATEMENTS,
  OPERATING_CASE_BANK,
  VAS_KNOWLEDGE_PACKS,
} from '../../data/operatingKnowledgeLayer';

const BulletList = ({ items, className = 'text-slate-300' }: { items: string[]; className?: string }) => (
  <>{items.map((item) => <p key={item} className={`text-xs font-semibold leading-6 ${className}`}>• {item}</p>)}</>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left ${className}`}>{children}</div>
);

const SectionHeader = ({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) => (
  <Card className="border-cyan-500/20 bg-cyan-500/5">
    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">{eyebrow}</p>
    <h2 className="mt-2 text-lg font-black text-white">{title}</h2>
    <p className="mt-3 max-w-4xl text-xs font-semibold leading-6 text-slate-300">{desc}</p>
  </Card>
);

export function OperatingKnowledgeLayerPanel() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operating Knowledge Layer"
        title="Case Bank, VAS packs và boundary để LedgerFlow có chiều sâu nghiệp vụ"
        desc="Lớp này giúp mỗi module có input, xử lý, output và quyết định tiếp theo; tránh thêm màn hình rỗng hoặc định vị sai như ERP kế toán chính thức."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {OPERATING_CASE_BANK.map((item) => (
          <Card key={item.id}>
            <p className="text-[10px] font-black uppercase text-cyan-300">{item.domain} • Case Bank</p>
            <h3 className="mt-2 text-sm font-black text-white">{item.title}</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.scenario}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase text-cyan-300">Inputs</p>
                <BulletList items={item.inputs.slice(0, 4)} className="text-cyan-100" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-300">Output</p>
                <BulletList items={item.expectedOutput.slice(0, 4)} className="text-emerald-100" />
              </div>
            </div>
            <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-bold leading-6 text-rose-100">
              Red flag: {item.redFlags[0]}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {VAS_KNOWLEDGE_PACKS.map((pack) => (
          <Card key={pack.id}>
            <p className="text-[10px] font-black uppercase text-emerald-300">VAS Knowledge Pack</p>
            <h3 className="mt-2 text-sm font-black text-white">{pack.title}</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{pack.whenToUse}</p>
            <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Checklist</p>
            <BulletList items={pack.checklist.slice(0, 4)} className="text-cyan-100" />
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] font-bold leading-5 text-amber-100">{pack.disclaimer}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}

export function AIWorkOrderLibraryPanel() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="AI Work Order Library"
        title="Giao việc cho AI bằng input/output/approval rõ ràng"
        desc="Work order giúp agent chạy đúng vai trò, có tiêu chí nghiệm thu, và biết phần nào bắt buộc founder phê duyệt."
      />
      <section className="grid gap-4 lg:grid-cols-3">
        {AI_WORK_ORDER_LIBRARY.map((order) => (
          <Card key={order.id}>
            <p className="text-[10px] font-black uppercase text-violet-300">{order.id} • {order.role}</p>
            <h3 className="mt-2 text-sm font-black text-white">{order.useCase}</h3>
            <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Input</p>
            <BulletList items={order.input.slice(0, 4)} className="text-cyan-100" />
            <p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Output</p>
            <BulletList items={order.output.slice(0, 4)} className="text-emerald-100" />
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">
              Founder approve: {order.founderMustApprove.join(', ')}
            </p>
          </Card>
        ))}
      </section>
    </div>
  );
}

export function DecisionBoundaryPanel() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        {DECISION_LOG_TEMPLATES.map((template) => (
          <Card key={template.id}>
            <p className="text-[10px] font-black uppercase text-cyan-300">{template.decisionType}</p>
            <h3 className="mt-2 text-sm font-black text-white">Decision template</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{template.prompt}</p>
            <p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Evidence</p>
            <BulletList items={template.evidenceRequired.slice(0, 3)} className="text-emerald-100" />
            <p className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs font-bold leading-6 text-slate-200">Next: {template.nextStep}</p>
          </Card>
        ))}
      </section>
      <Card className="border-amber-500/20 bg-amber-500/5">
        <h2 className="text-sm font-black text-white">Boundary statements</h2>
        <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">
          Các cảnh báo này giữ sản phẩm đúng ranh giới: company OS, R&D và simulation environment; không tự nhận là ERP, tư vấn thuế/pháp lý hoặc kiểm toán viên thay thế.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <BulletList items={[...LEDGERFLOW_BOUNDARY_STATEMENTS]} className="text-amber-100" />
        </div>
      </Card>
    </div>
  );
}
