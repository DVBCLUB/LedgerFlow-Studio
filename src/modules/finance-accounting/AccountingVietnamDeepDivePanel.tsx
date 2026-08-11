import type React from 'react';
import { BookOpen, Calculator, CheckCircle2, FileText, GitBranch, ShieldCheck } from 'lucide-react';
import {
  ACCOUNTING_DEEP_DIVE_ACCEPTANCE,
  ACCOUNTING_VN_TEST_CASES,
  INVENTORY_METHOD_DECISION_TREE,
  INVENTORY_DECISION_PATHS,
  TT200_TT133_DECISION_RULES,
  VAT_RATE_REVIEW_RULES,
  VAT_SCENARIOS,
  VIETNAM_ACCOUNTING_DEEP_DIVE
} from '../../data/accountingVietnamDeepDive';

const formatVND = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}d`;

const BulletList = ({ items, className = 'text-text-secondary' }: { items: string[]; className?: string }) => (
  <>{items.map((item) => <p key={item} className={`text-xs font-semibold leading-6 ${className}`}>* {item}</p>)}</>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950 p-6 text-left shadow-2xl backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 ${className}`}>{children}</div>
);

export default function AccountingVietnamDeepDivePanel() {
  return (
    <section className="space-y-5 text-left select-none">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/20 p-6 text-left shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300 shadow-sm">
            <BookOpen className="h-3.5 w-3.5" /> Vietnam Accounting Deep Dive (VAS 133/200)
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">Chế độ Kế toán VAS 200/133, VAT & Xử lý Chứng từ</h2>
          <p className="mt-2.5 max-w-3xl text-xs font-semibold leading-6 text-slate-300/90">
            Hệ thống Kiểm soát Kế toán Việt Nam (VAS 200/133): Phân tích chứng từ thực tế, bút toán chuẩn và điểm soát xét rủi ro.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {VIETNAM_ACCOUNTING_DEEP_DIVE.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300">{item.id}</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            </div>
            <h3 className="text-sm font-black text-white">{item.title}</h3>
            <p className="mt-2 text-xs font-semibold leading-6 text-slate-300/80">{item.scope}</p>
            <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3.5 text-xs font-bold leading-6 text-cyan-200 backdrop-blur-sm">
              ✨ Mục tiêu: {item.learningGoal}
            </div>
            
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-sky-400 mb-1">📁 Hồ sơ cần đối chiếu</p>
                <BulletList items={item.documents} className="text-sky-200" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1">📝 Bút toán hạch toán VAS</p>
                <BulletList items={item.simulatedEntries} className="text-cyan-200" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">⚠️ Ngoại lệ kiểm soát</p>
                <BulletList items={item.redFlags} className="text-amber-200" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">✅ Điểm cần kiểm tra</p>
                <BulletList items={item.controlQuestions} className="text-emerald-200" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            <GitBranch className="h-4 w-4 text-info" /> TT200/133 decision rules
          </h3>
          <div className="space-y-3">
            {TT200_TT133_DECISION_RULES.map((item) => (
              <div key={item.signal} className="rounded-xl border border-border-primary bg-bg-primary p-4">
                <p className="text-xs font-bold leading-6 text-text-primary">{item.signal}</p>
                <p className="mt-3 text-[10px] font-bold uppercase text-info">TT200 fit</p>
                <p className="text-xs font-semibold leading-6 text-cyan-100">{item.tt200Fit}</p>
                <p className="mt-3 text-[10px] font-bold uppercase text-success">TT133 fit</p>
                <p className="text-xs font-semibold leading-6 text-emerald-100">{item.tt133Fit}</p>
                <p className="mt-3 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs font-bold leading-6 text-amber-100">
                  Reviewer: {item.reviewerQuestion}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            <ShieldCheck className="h-4 w-4 text-warning" /> VAT review rules
          </h3>
          <BulletList items={VAT_RATE_REVIEW_RULES} className="text-amber-100" />
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            <GitBranch className="h-4 w-4 text-purple-300" /> Inventory decision path
          </h3>
          <div className="space-y-3">
            {INVENTORY_DECISION_PATHS.map((item) => (
              <div key={item.question} className="rounded-xl border border-border-primary bg-bg-primary p-4">
                <p className="text-xs font-bold text-text-primary">{item.question}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-emerald-100">Yes: {item.yes}</p>
                <p className="mt-1 text-xs font-semibold leading-6 text-text-secondary">No: {item.no}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            <Calculator className="h-4 w-4 text-info" /> VAT 8% vs 10% scenario lab
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {VAT_SCENARIOS.map((item) => {
              const vatAmount = Math.round((item.baseAmount * item.vatRate) / 100);
              return (
                <div key={item.id} className="rounded-xl border border-border-primary bg-bg-primary p-4">
                  <p className="text-xs font-bold text-text-primary">{item.label}</p>
                  <p className="mt-2 text-[11px] font-semibold leading-5 text-text-secondary">Gia tri truoc thue: {formatVND(item.baseAmount)}</p>
                  <p className="mt-3 rounded-lg border border-info/20 bg-info/5 p-3 text-xs font-bold leading-6 text-cyan-100">
                    VAT {item.vatRate}% = {formatVND(vatAmount)}; tong thanh toan = {formatVND(item.baseAmount + vatAmount)}
                  </p>
                  <p className="mt-4 text-[10px] font-bold uppercase text-warning">Ghi chu can doc</p>
                  <BulletList items={item.notes} className="text-amber-100" />
                  <p className="mt-4 text-[10px] font-bold uppercase text-success">Checklist duyet</p>
                  <BulletList items={item.reviewChecklist} className="text-emerald-100" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
            <GitBranch className="h-4 w-4 text-purple-300" /> Decision tree ton kho
          </h3>
          <div className="space-y-3">
            {INVENTORY_METHOD_DECISION_TREE.map((item) => (
              <div key={item.method} className="rounded-xl border border-border-primary bg-bg-primary p-4">
                <p className="text-xs font-bold text-text-primary">{item.label}</p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-purple-200">{item.method}</p>
                <p className="mt-3 text-[10px] font-bold uppercase text-info">Phu hop khi</p>
                <BulletList items={item.bestFor} className="text-cyan-100" />
                <p className="mt-3 text-[10px] font-bold uppercase text-warning">Rui ro</p>
                <BulletList items={item.risks} className="text-amber-100" />
                <p className="mt-3 text-[10px] font-bold uppercase text-success">Kiem soat</p>
                <BulletList items={item.controlChecks} className="text-emerald-100" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
          <FileText className="h-4 w-4 text-info" /> SME / trading / services / construction test cases
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {ACCOUNTING_VN_TEST_CASES.map((item) => (
            <div key={item.id} className="rounded-xl border border-border-primary bg-bg-primary p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-info">{item.industry}</p>
                  <h4 className="mt-2 text-sm font-bold text-text-primary">{item.title}</h4>
                </div>
                <span className="rounded-full border border-border-secondary bg-bg-surface px-2 py-1 text-[10px] font-bold text-text-secondary">{item.id}</span>
              </div>
              <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{item.scenario}</p>
              <p className="mt-4 text-[10px] font-bold uppercase text-sky-300">Ho so can doi chieu</p>
              <BulletList items={item.documents} className="text-sky-100" />
              <p className="mt-4 text-[10px] font-bold uppercase text-success">Expected checks</p>
              <BulletList items={item.expectedChecks} className="text-emerald-100" />
              <p className="mt-4 text-[10px] font-bold uppercase text-info">But toan mo phong</p>
              <BulletList items={item.simulatedEntries} className="text-cyan-100" />
              <p className="mt-4 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs font-bold leading-6 text-amber-100">
                Reviewer decision: {item.reviewerDecision}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
          <ShieldCheck className="h-4 w-4 text-success" /> Boundary note
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <FileText className="mb-3 h-4 w-4 text-info" />
            <p className="text-xs font-bold leading-6 text-text-primary">Du lieu trong tab nay la mo phong offline-first, dung de hoc va thiet ke san pham.</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <ShieldCheck className="mb-3 h-4 w-4 text-warning" />
            <p className="text-xs font-bold leading-6 text-text-primary">Moi ngoai le kiem soat can nguoi phu trach kiem tra, khong tu ket luan thay nguoi duyet.</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <CheckCircle2 className="mb-3 h-4 w-4 text-success" />
            <p className="text-xs font-bold leading-6 text-text-primary">Khi dung vao ho so that, can doi chieu van ban hien hanh va policy da duoc phe duyet.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
          <CheckCircle2 className="h-4 w-4 text-success" /> Acceptance criteria
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ACCOUNTING_DEEP_DIVE_ACCEPTANCE.map((item) => (
            <div key={item} className="rounded-xl border border-success/20 bg-success/5 p-4">
              <p className="text-xs font-bold leading-6 text-emerald-100">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
