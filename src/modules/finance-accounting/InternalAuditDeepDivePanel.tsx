import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, FileSearch, GitBranch, ShieldCheck } from 'lucide-react';
import {
  type AuditRiskSeverity,
  BENFORD_BASIC_GUIDE,
  CONTROL_EXCEPTION_PATTERNS,
  DUPLICATE_PAYMENT_RULES,
  INTERNAL_AUDIT_17_CYCLES,
  INTERNAL_AUDIT_ACCEPTANCE_CRITERIA,
  SME_AUDIT_PROGRAM_TEMPLATES,
  SME_OPERATIONAL_AUDIT_CHECKLISTS
} from '../../data/internalAuditDeepDive';

const severityClass: Record<AuditRiskSeverity, string> = {
  low: 'border-slate-500/20 bg-slate-500/5 text-text-primary',
  medium: 'border-warning/20 bg-warning/5 text-amber-100',
  high: 'border-orange-500/20 bg-orange-500/5 text-orange-100',
  critical: 'border-error/20 bg-error/5 text-rose-100'
};

const BulletList = ({ items, className = 'text-text-secondary' }: { items: string[]; className?: string }) => (
  <>{items.map((item) => <p key={item} className={`text-xs font-semibold leading-6 ${className}`}>* {item}</p>)}</>
);

const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-border-primary bg-bg-surface p-5 ${className}`}>{children}</div>
);

export default function InternalAuditDeepDivePanel() {
  return (
    <section className="space-y-5">
      <Card className="border-success/20 bg-success/5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-success">
          <ShieldCheck className="h-3.5 w-3.5" /> Internal Audit Deep Dive
        </div>
        <h2 className="text-xl font-bold text-text-primary">Checklist nghiep vu SME, audit program va ngoai le kiem soat</h2>
        <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">
          Noi dung nay la lab mo phong offline-first. Cac diem can kiem tra va red flag chi ho tro sang loc, khong ket luan thay nguoi duyet ho so.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {INTERNAL_AUDIT_17_CYCLES.map((program) => (
          <Card key={program.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-success">{program.id}</p>
                <h3 className="mt-2 text-sm font-bold text-text-primary">{program.cycle}</h3>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${severityClass[program.severity]}`}>
                {program.severity}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{program.objective}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border-primary bg-bg-primary p-4">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-info"><ClipboardList className="h-3.5 w-3.5" />Pham vi</p>
                <BulletList items={program.scope} className="text-cyan-100" />
              </div>
              <div className="rounded-xl border border-border-primary bg-bg-primary p-4">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-purple-300"><FileSearch className="h-3.5 w-3.5" />Bang chung can lay</p>
                <BulletList items={program.evidence} className="text-purple-100" />
              </div>
            </div>

            <p className="mt-4 text-[10px] font-bold uppercase text-success">Diem can kiem tra</p>
            <BulletList items={program.procedures} className="text-emerald-100" />
            <p className="mt-4 text-[10px] font-bold uppercase text-warning">Ngoai le kiem soat can reviewer xem lai</p>
            <BulletList items={program.redFlags} className="text-amber-100" />
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
          <ClipboardList className="h-4 w-4 text-info" /> SME operational audit checklist
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {SME_OPERATIONAL_AUDIT_CHECKLISTS.map((item) => (
            <div key={item.id} className="rounded-xl border border-border-primary bg-bg-primary p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-info">{item.id}</p>
              <h4 className="mt-2 text-sm font-bold text-text-primary">{item.area}</h4>
              <p className="mt-3 rounded-lg border border-info/20 bg-info/5 p-3 text-xs font-bold leading-6 text-cyan-100">
                Control objective: {item.controlObjective}
              </p>
              <p className="mt-4 text-[10px] font-bold uppercase text-success">Checklist nghiep vu</p>
              <BulletList items={item.checklist} className="text-emerald-100" />
              <p className="mt-4 text-[10px] font-bold uppercase text-purple-300">Bang chung can lay</p>
              <BulletList items={item.evidence} className="text-purple-100" />
              <p className="mt-4 text-[10px] font-bold uppercase text-warning">Ngoai le mau</p>
              <BulletList items={item.exceptionExamples} className="text-amber-100" />
              <p className="mt-4 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs font-bold leading-6 text-amber-100">
                Reviewer prompt: {item.reviewerPrompt}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
          <FileSearch className="h-4 w-4 text-success" /> Audit program templates
        </h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {SME_AUDIT_PROGRAM_TEMPLATES.map((template) => (
            <div key={template.id} className="rounded-xl border border-border-primary bg-bg-primary p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-success">{template.id}</p>
              <h4 className="mt-2 text-sm font-bold text-text-primary">{template.name}</h4>
              <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{template.bestFor}</p>
              <p className="mt-4 text-[10px] font-bold uppercase text-info">Planning questions</p>
              <BulletList items={template.planningQuestions} className="text-cyan-100" />
              <p className="mt-4 text-[10px] font-bold uppercase text-success">Procedures</p>
              <BulletList items={template.procedures} className="text-emerald-100" />
              <p className="mt-4 text-[10px] font-bold uppercase text-purple-300">Sample strategy</p>
              <BulletList items={template.sampleStrategy} className="text-purple-100" />
              <p className="mt-4 text-[10px] font-bold uppercase text-warning">Expected output</p>
              <BulletList items={template.expectedOutput} className="text-amber-100" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
          <AlertTriangle className="h-4 w-4 text-warning" /> Control exception patterns
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {CONTROL_EXCEPTION_PATTERNS.map((pattern) => (
            <div key={pattern.id} className="rounded-xl border border-border-primary bg-bg-primary p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-warning">{pattern.id}</p>
                  <h4 className="mt-2 text-sm font-bold text-text-primary">{pattern.pattern}</h4>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${severityClass[pattern.severity]}`}>
                  {pattern.severity}
                </span>
              </div>
              <p className="mt-3 rounded-lg border border-error/20 bg-error/5 p-3 text-xs font-bold leading-6 text-rose-100">
                Control weakness: {pattern.controlWeakness}
              </p>
              <p className="mt-4 text-[10px] font-bold uppercase text-info">Data signals</p>
              <BulletList items={pattern.dataSignals} className="text-cyan-100" />
              <p className="mt-4 text-[10px] font-bold uppercase text-purple-300">Evidence to request</p>
              <BulletList items={pattern.evidenceToRequest} className="text-purple-100" />
              <p className="mt-4 rounded-lg border border-success/20 bg-success/5 p-3 text-xs font-bold leading-6 text-emerald-100">
                Reviewer action: {pattern.reviewerAction}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {DUPLICATE_PAYMENT_RULES.map((rule) => (
          <Card key={rule.id}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-info">Duplicate payment screen</p>
            <h3 className="mt-2 text-sm font-bold text-text-primary">{rule.name}</h3>
            <p className="mt-3 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs font-bold leading-6 text-amber-100">
              Mau can canh bao: {rule.warningPattern}
            </p>
            <p className="mt-4 text-[10px] font-bold uppercase text-info">Matching fields</p>
            <BulletList items={rule.matchingFields} className="text-cyan-100" />
            <p className="mt-4 text-[10px] font-bold uppercase text-purple-300">Test logic</p>
            <p className="text-xs font-semibold leading-6 text-purple-100">{rule.testLogic}</p>
            <p className="mt-4 text-[10px] font-bold uppercase text-success">Reviewer action</p>
            <p className="text-xs font-semibold leading-6 text-emerald-100">{rule.reviewerAction}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {BENFORD_BASIC_GUIDE.map((guide) => (
          <Card key={guide.digit}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Benford basic guide</p>
            <h3 className="mt-2 flex items-center gap-2 text-sm font-bold text-text-primary"><GitBranch className="h-4 w-4 text-purple-300" />Leading digit {guide.digit}</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{guide.expectedPattern}</p>
            <p className="mt-4 text-[10px] font-bold uppercase text-info">Use case</p>
            <p className="text-xs font-semibold leading-6 text-cyan-100">{guide.useCase}</p>
            <p className="mt-4 text-[10px] font-bold uppercase text-warning">Gioi han can ghi ro</p>
            <p className="text-xs font-semibold leading-6 text-amber-100">{guide.limitation}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
          <AlertTriangle className="h-4 w-4 text-warning" /> Boundary note
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="text-xs font-bold leading-6 text-text-primary">AI hoac rule chi danh dau ngoai le kiem soat, khong ket luan gian lan.</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="text-xs font-bold leading-6 text-text-primary">Bang chung can duoc doi chieu voi ho so goc va nguoi co tham quyen duyet.</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="text-xs font-bold leading-6 text-text-primary">Checklist nay la static data offline-first, phu hop de luyen audit program truoc khi co backend that.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary">
          <CheckCircle2 className="h-4 w-4 text-success" /> Acceptance criteria
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {INTERNAL_AUDIT_ACCEPTANCE_CRITERIA.map((item) => (
            <div key={item} className="rounded-xl border border-success/20 bg-success/5 p-4">
              <p className="text-xs font-bold leading-6 text-emerald-100">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
