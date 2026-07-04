import type { ReactNode } from 'react';
import { CheckCircle2, Database, FileSpreadsheet, GitBranch, Search, ShieldCheck, Table2 } from 'lucide-react';
import {
  CUSTOM_DATA_SCHEMA_PREVIEWS,
  CUSTOM_DATA_WORKBENCH_ACCEPTANCE,
  EXPORT_SAFETY_CHECKLIST,
  PIVOT_SIMULATION_EXAMPLES,
  PIVOT_SIMULATION_TEMPLATES,
  QUERY_BUILDER_EXPLANATION_STEPS,
  QUERY_BUILDER_RECIPES
} from '../../data/customDataWorkbenchDeepDive';

const formatVND = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}d`;

const BulletList = ({ items, className = 'text-text-secondary' }: { items: string[]; className?: string }) => (
  <>{items.map((item) => <p key={item} className={`text-xs font-semibold leading-6 ${className}`}>* {item}</p>)}</>
);

const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-border-primary bg-bg-surface/70 p-5 ${className}`}>{children}</div>
);

export default function CustomDataWorkbenchDeepDivePanel() {
  return (
    <section className="space-y-5">
      <Card className="border-purple-500/20 bg-purple-500/5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-purple-300">
          <Database className="h-3.5 w-3.5" /> Custom Data Workbench Deep Dive
        </div>
        <h2 className="text-xl font-black text-text-primary">Schema preview, query builder va pivot simulation</h2>
        <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">
          Tab nay dung static data offline-first de giai thich cach bien cau hoi kinh doanh thanh schema, query va pivot. Du lieu mo phong tach khoi du lieu that.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {CUSTOM_DATA_SCHEMA_PREVIEWS.map((schema) => (
          <Card key={schema.id}>
            <p className="text-[10px] font-black uppercase tracking-wider text-purple-300">{schema.domain}</p>
            <h3 className="mt-2 text-sm font-black text-text-primary">{schema.title}</h3>
            <p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{schema.purpose}</p>

            <div className="mt-4 overflow-hidden rounded-xl border border-border-primary">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-950 text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 font-black">Column</th>
                    <th className="px-3 py-2 font-black">Type</th>
                    <th className="px-3 py-2 font-black">Required</th>
                    <th className="px-3 py-2 font-black">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                  {schema.columns.map((column) => (
                    <tr key={column.name}>
                      <td className="px-3 py-2 font-mono font-bold text-cyan-100">{column.name}</td>
                      <td className="px-3 py-2 font-bold text-slate-200">{column.type}</td>
                      <td className="px-3 py-2 font-bold text-text-secondary">{column.required ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 font-semibold leading-5 text-text-secondary">{column.businessMeaning} Example: {column.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase text-cyan-300"><Search className="h-3.5 w-3.5" />Business questions</p>
                <BulletList items={schema.recommendedQuestions} className="text-cyan-100" />
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />Quality checks</p>
                <BulletList items={schema.qualityChecks} className="text-emerald-100" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
          <GitBranch className="h-4 w-4 text-cyan-300" /> Query builder explanation flow
        </h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {QUERY_BUILDER_EXPLANATION_STEPS.map((step) => (
            <div key={step.id} className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
              <p className="text-xs font-black text-text-primary">{step.step}</p>
              <p className="mt-3 text-[10px] font-black uppercase text-cyan-300">User question</p>
              <p className="text-xs font-semibold leading-6 text-cyan-100">{step.userQuestion}</p>
              <p className="mt-3 text-[10px] font-black uppercase text-emerald-300">Builder action</p>
              <p className="text-xs font-semibold leading-6 text-emerald-100">{step.builderAction}</p>
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">
                Reviewer check: {step.reviewerCheck}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {QUERY_BUILDER_RECIPES.map((recipe) => (
          <Card key={recipe.id}>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">{recipe.sourceTable}</p>
            <h3 className="mt-2 text-sm font-black text-text-primary">{recipe.title}</h3>
            <p className="mt-3 text-xs font-bold leading-6 text-slate-200">{recipe.businessQuestion}</p>
            <p className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-semibold leading-6 text-cyan-100">{recipe.plainVietnamese}</p>
            <div className="mt-4 grid gap-3 text-[11px] font-semibold text-text-secondary">
              <p><span className="font-black text-slate-100">Select:</span> {recipe.selectFields.join(', ')}</p>
              <p><span className="font-black text-slate-100">Filter:</span> {recipe.filters.length ? recipe.filters.join(', ') : 'none'}</p>
              <p><span className="font-black text-slate-100">Group:</span> {recipe.groupBy.length ? recipe.groupBy.join(', ') : 'none'}</p>
              <p><span className="font-black text-slate-100">Sort:</span> {recipe.sortBy.length ? recipe.sortBy.join(', ') : 'none'}</p>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border-primary bg-slate-950 p-3 text-[11px] font-bold leading-5 text-purple-100">{recipe.sampleSql}</pre>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
          <Table2 className="h-4 w-4 text-amber-300" /> Pivot simulation sample matrices
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {PIVOT_SIMULATION_EXAMPLES.map((example) => (
            <div key={example.id} className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">{example.sourceDataset}</p>
              <h4 className="mt-2 text-sm font-black text-text-primary">{example.title}</h4>
              <div className="mt-4 overflow-hidden rounded-xl border border-border-primary">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-bg-primary text-text-secondary">
                    <tr>
                      <th className="px-3 py-2 font-black">Row</th>
                      <th className="px-3 py-2 font-black">Column</th>
                      <th className="px-3 py-2 font-black">Amount</th>
                      <th className="px-3 py-2 font-black">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {example.matrix.flatMap((row) =>
                      row.values.map((value) => (
                        <tr key={`${row.rowLabel}-${value.columnLabel}`}>
                          <td className="px-3 py-2 font-bold text-cyan-100">{row.rowLabel}</td>
                          <td className="px-3 py-2 font-bold text-purple-100">{value.columnLabel}</td>
                          <td className="px-3 py-2 font-mono font-bold text-emerald-100">{formatVND(value.amount)}</td>
                          <td className="px-3 py-2 font-semibold leading-5 text-text-secondary">{value.note}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Interpretation</p>
              <BulletList items={example.interpretation} className="text-cyan-100" />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {PIVOT_SIMULATION_TEMPLATES.map((pivot) => (
          <Card key={pivot.id}>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">{pivot.sourceDataset}</p>
            <h3 className="mt-2 flex items-center gap-2 text-sm font-black text-text-primary"><Table2 className="h-4 w-4 text-amber-300" />{pivot.title}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                <p className="text-[10px] font-black uppercase text-cyan-300">Rows</p>
                <BulletList items={pivot.rows} className="text-cyan-100" />
              </div>
              <div className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                <p className="text-[10px] font-black uppercase text-purple-300">Columns</p>
                <BulletList items={pivot.columns} className="text-purple-100" />
              </div>
              <div className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                <p className="text-[10px] font-black uppercase text-emerald-300">Values</p>
                <BulletList items={pivot.values} className="text-emerald-100" />
              </div>
              <div className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                <p className="text-[10px] font-black uppercase text-amber-300">Filters</p>
                <BulletList items={pivot.filters} className="text-amber-100" />
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-cyan-300"><GitBranch className="h-3.5 w-3.5" />Expected insights</p>
            <BulletList items={pivot.insights} className="text-cyan-100" />
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
          <ShieldCheck className="h-4 w-4 text-amber-300" /> Export safety checklist
        </h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {EXPORT_SAFETY_CHECKLIST.map((item) => (
            <div key={item.format} className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
              <p className="text-sm font-black text-text-primary">{item.format}</p>
              <p className="mt-3 text-[10px] font-black uppercase text-emerald-300">Safe when</p>
              <BulletList items={item.safeWhen} className="text-emerald-100" />
              <p className="mt-4 text-[10px] font-black uppercase text-cyan-300">Must check</p>
              <BulletList items={item.mustCheck} className="text-cyan-100" />
              <p className="mt-4 text-[10px] font-black uppercase text-rose-300">Avoid when</p>
              <BulletList items={item.avoidWhen} className="text-rose-100" />
              <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">
                Existing surface: {item.existingSurface}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
          <FileSpreadsheet className="h-4 w-4 text-emerald-300" /> Acceptance and export checklist
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {CUSTOM_DATA_WORKBENCH_ACCEPTANCE.map((item) => (
            <div key={item} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-bold leading-6 text-emerald-100">{item}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold leading-6 text-amber-100">
          Export Excel/PDF/CSV da co trong RDBMS va registered table tools hien huu; tab nay chi them checklist mo phong de khong thay doi luong export dang chay.
        </p>
      </Card>
    </section>
  );
}
