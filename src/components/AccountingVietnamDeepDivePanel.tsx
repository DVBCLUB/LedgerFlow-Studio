import { BookOpen, Calculator, CheckCircle2, GitBranch } from 'lucide-react';
import {
  ACCOUNTING_DEEP_DIVE_ACCEPTANCE,
  INVENTORY_METHOD_DECISION_TREE,
  VAT_SCENARIOS,
  VIETNAM_ACCOUNTING_DEEP_DIVE
} from '../data/accountingVietnamDeepDive';

const BulletList = ({ items, className = 'text-slate-300' }: { items: string[]; className?: string }) => (
  <>{items.map((item) => <p key={item} className={`text-xs font-semibold leading-6 ${className}`}>• {item}</p>)}</>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 ${className}`}>{children}</div>
);

export default function AccountingVietnamDeepDivePanel() {
  return (
    <section className="space-y-5">
      <Card className="border-cyan-500/20 bg-cyan-500/5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300">
          <BookOpen className="h-3.5 w-3.5" /> Vietnam Accounting Deep Dive
        </div>
        <h2 className="text-xl font-black text-white">Thông tư 200/133, VAT, hàng tồn kho và tạm ứng/hoàn ứng</h2>
        <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">
          Lớp học mô phỏng chuyên sâu cho kế toán Việt Nam: nghiệp vụ, chứng từ, bút toán mẫu, rủi ro và checklist kiểm soát.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {VIETNAM_ACCOUNTING_DEEP_DIVE.map((item) => (
          <Card key={item.id}>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">{item.standard} • {item.difficulty}</p>
            <h3 className="mt-2 text-sm font-black text-white">{item.title}</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.summary}</p>
            <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Ví dụ xử lý</p>
            <BulletList items={item.journalExamples} className="text-cyan-100" />
            <p className="mt-4 text-[10px] font-black uppercase text-amber-300">Rủi ro</p>
            <BulletList items={item.risks} className="text-amber-100" />
            <p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Checklist</p>
            <BulletList items={item.checklist} className="text-emerald-100" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><Calculator className="h-4 w-4 text-cyan-300" />VAT scenario lab</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {VAT_SCENARIOS.map((item) => (
              <div key={item.scenario} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-black text-white">{item.scenario}</p>
                <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-400">Loại: {item.supplyType}</p>
                <p className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">Gợi ý: {item.suggestedRate}</p>
                <p className="mt-3 text-[11px] font-semibold leading-5 text-amber-100">{item.controlNote}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><GitBranch className="h-4 w-4 text-purple-300" />Decision tree tồn kho</h3>
          <div className="space-y-3">
            {INVENTORY_METHOD_DECISION_TREE.map((item) => (
              <div key={item.condition} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-black text-white">{item.condition}</p>
                <p className="mt-2 text-xs font-bold leading-6 text-purple-100">Phương pháp: {item.recommendedMethod}</p>
                <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-400">{item.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Acceptance criteria</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ACCOUNTING_DEEP_DIVE_ACCEPTANCE.map((item) => (
            <div key={item} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-bold leading-6 text-emerald-100">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
