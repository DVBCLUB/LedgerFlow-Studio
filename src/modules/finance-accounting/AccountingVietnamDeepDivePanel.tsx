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

const BulletList = ({ items, className = 'text-slate-300' }: { items: string[]; className?: string }) => (
  <>{items.map((item) => <p key={item} className={`text-xs font-semibold leading-6 ${className}`}>* {item}</p>)}</>
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
        <h2 className="text-xl font-black text-white">Thong tu 200/133, VAT, hang ton kho va tam ung/hoan ung</h2>
        <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">
          Lop mo phong chuyen sau cho ke toan Viet Nam: chung tu, but toan mau, diem can kiem tra va ngoai le can nguoi duyet cuoi xac nhan.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {VIETNAM_ACCOUNTING_DEEP_DIVE.map((item) => (
          <Card key={item.id}>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">{item.id}</p>
            <h3 className="mt-2 text-sm font-black text-white">{item.title}</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.scope}</p>
            <p className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">
              Muc tieu hoc: {item.learningGoal}
            </p>
            <p className="mt-4 text-[10px] font-black uppercase text-sky-300">Ho so can doi chieu</p>
            <BulletList items={item.documents} className="text-sky-100" />
            <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">But toan mo phong</p>
            <BulletList items={item.simulatedEntries} className="text-cyan-100" />
            <p className="mt-4 text-[10px] font-black uppercase text-amber-300">Ngoai le kiem soat</p>
            <BulletList items={item.redFlags} className="text-amber-100" />
            <p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Diem can kiem tra</p>
            <BulletList items={item.controlQuestions} className="text-emerald-100" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <GitBranch className="h-4 w-4 text-cyan-300" /> TT200/133 decision rules
          </h3>
          <div className="space-y-3">
            {TT200_TT133_DECISION_RULES.map((item) => (
              <div key={item.signal} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-bold leading-6 text-slate-200">{item.signal}</p>
                <p className="mt-3 text-[10px] font-black uppercase text-cyan-300">TT200 fit</p>
                <p className="text-xs font-semibold leading-6 text-cyan-100">{item.tt200Fit}</p>
                <p className="mt-3 text-[10px] font-black uppercase text-emerald-300">TT133 fit</p>
                <p className="text-xs font-semibold leading-6 text-emerald-100">{item.tt133Fit}</p>
                <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">
                  Reviewer: {item.reviewerQuestion}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <ShieldCheck className="h-4 w-4 text-amber-300" /> VAT review rules
          </h3>
          <BulletList items={VAT_RATE_REVIEW_RULES} className="text-amber-100" />
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <GitBranch className="h-4 w-4 text-purple-300" /> Inventory decision path
          </h3>
          <div className="space-y-3">
            {INVENTORY_DECISION_PATHS.map((item) => (
              <div key={item.question} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-black text-white">{item.question}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-emerald-100">Yes: {item.yes}</p>
                <p className="mt-1 text-xs font-semibold leading-6 text-slate-300">No: {item.no}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <Calculator className="h-4 w-4 text-cyan-300" /> VAT 8% vs 10% scenario lab
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {VAT_SCENARIOS.map((item) => {
              const vatAmount = Math.round((item.baseAmount * item.vatRate) / 100);
              return (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs font-black text-white">{item.label}</p>
                  <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-400">Gia tri truoc thue: {formatVND(item.baseAmount)}</p>
                  <p className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">
                    VAT {item.vatRate}% = {formatVND(vatAmount)}; tong thanh toan = {formatVND(item.baseAmount + vatAmount)}
                  </p>
                  <p className="mt-4 text-[10px] font-black uppercase text-amber-300">Ghi chu can doc</p>
                  <BulletList items={item.notes} className="text-amber-100" />
                  <p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Checklist duyet</p>
                  <BulletList items={item.reviewChecklist} className="text-emerald-100" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <GitBranch className="h-4 w-4 text-purple-300" /> Decision tree ton kho
          </h3>
          <div className="space-y-3">
            {INVENTORY_METHOD_DECISION_TREE.map((item) => (
              <div key={item.method} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-black text-white">{item.label}</p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-purple-200">{item.method}</p>
                <p className="mt-3 text-[10px] font-black uppercase text-cyan-300">Phu hop khi</p>
                <BulletList items={item.bestFor} className="text-cyan-100" />
                <p className="mt-3 text-[10px] font-black uppercase text-amber-300">Rui ro</p>
                <BulletList items={item.risks} className="text-amber-100" />
                <p className="mt-3 text-[10px] font-black uppercase text-emerald-300">Kiem soat</p>
                <BulletList items={item.controlChecks} className="text-emerald-100" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
          <FileText className="h-4 w-4 text-cyan-300" /> SME / trading / services / construction test cases
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {ACCOUNTING_VN_TEST_CASES.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">{item.industry}</p>
                  <h4 className="mt-2 text-sm font-black text-white">{item.title}</h4>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-300">{item.id}</span>
              </div>
              <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.scenario}</p>
              <p className="mt-4 text-[10px] font-black uppercase text-sky-300">Ho so can doi chieu</p>
              <BulletList items={item.documents} className="text-sky-100" />
              <p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Expected checks</p>
              <BulletList items={item.expectedChecks} className="text-emerald-100" />
              <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">But toan mo phong</p>
              <BulletList items={item.simulatedEntries} className="text-cyan-100" />
              <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">
                Reviewer decision: {item.reviewerDecision}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
          <ShieldCheck className="h-4 w-4 text-emerald-300" /> Boundary note
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <FileText className="mb-3 h-4 w-4 text-cyan-300" />
            <p className="text-xs font-bold leading-6 text-slate-200">Du lieu trong tab nay la mo phong offline-first, dung de hoc va thiet ke san pham.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <ShieldCheck className="mb-3 h-4 w-4 text-amber-300" />
            <p className="text-xs font-bold leading-6 text-slate-200">Moi ngoai le kiem soat can nguoi phu trach kiem tra, khong tu ket luan thay nguoi duyet.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-300" />
            <p className="text-xs font-bold leading-6 text-slate-200">Khi dung vao ho so that, can doi chieu van ban hien hanh va policy da duoc phe duyet.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Acceptance criteria
        </h3>
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
