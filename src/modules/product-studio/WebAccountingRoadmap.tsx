import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Copy, Database, GitBranch, Layers, LockKeyhole, Rocket, ShieldCheck, Workflow } from 'lucide-react';
import {
  ACCOUNTING_WEB_MODULES,
  BUILD_PHASES,
  LOW_COST_STACK,
  ROLE_MATRIX,
  TEST_CHECKLIST
} from '../../data/webAccountingRoadmapKnowledge';
import Drawer from '../../components/ui/Drawer';

type RoadmapTab = 'modules' | 'phases' | 'security' | 'testing';

export default function WebAccountingRoadmap() {
  const [tab, setTab] = useState<RoadmapTab>('modules');
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<typeof BUILD_PHASES[0] | null>(null);

  const executivePlan = useMemo(() => {
    return `LỘ TRÌNH BUILD ACCOUNTING TEMPLATE WEB\n\n1. Làm MVP local-first: chi phí, tạm ứng, hoàn ứng, hóa đơn, hồ sơ và phê duyệt.\n2. Chuẩn hóa database: dự án/sản phẩm, NCC/khách hàng, nhân sự, chứng từ, phát sinh.\n3. Thêm workflow duyệt: nháp, thiếu hồ sơ, chờ duyệt, đã duyệt, đã thanh toán.\n4. Thêm cảnh báo: vượt ngân sách, tạm ứng treo, sai VAT, thiếu hồ sơ hoặc ngoại lệ vượt hạn mức.\n5. Làm dashboard sếp: ngân sách, dòng tiền, công nợ, hồ sơ thiếu, rủi ro thuế.\n6. Đóng gói hybrid: web, PWA, desktop; chỉ bật cloud/API khi có nhu cầu thật.`;
  }, []);

  const copyPlan = async () => {
    await navigator.clipboard.writeText(executivePlan);
    setCopied('plan');
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: RoadmapTab; label: string }[] = [
    { id: 'modules', label: 'Modules' },
    { id: 'phases', label: 'Build phases' },
    { id: 'security', label: 'Roles & stack' },
    { id: 'testing', label: 'Test plan' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-border-primary bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-indigo-300">
              <Rocket className="h-3.5 w-3.5" />
              Web Accounting Roadmap
            </div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">
              Lộ trình build accounting template web
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
              Module này không chỉ là checklist code. Nó là bản đồ sản phẩm: cần phân hệ nào, database nào,
              ai được nhập/sửa/duyệt, workflow thanh toán ra sao, test thế nào và triển khai tiết kiệm thế nào.
              Mục tiêu là giúp người làm kế toán kiểm soát được phần mềm do AI viết.
            </p>
          </div>

          <button
            onClick={copyPlan}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-indigo-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'plan' ? 'Đã copy' : 'Copy lộ trình'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-indigo-400 text-slate-950'
                  : 'border border-border-primary bg-bg-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'modules' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ACCOUNTING_WEB_MODULES.map((module) => (
            <div key={module.name} className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Database className="h-5 w-5 text-indigo-300" />
                <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-text-secondary">Core module</span>
              </div>
              <h2 className="text-sm font-black text-text-primary">{module.name}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{module.goal}</p>
              <code className="mt-3 block rounded-xl border border-border-primary bg-slate-950 p-3 text-[11px] font-bold leading-5 text-indigo-300">{module.tables}</code>
            </div>
          ))}
        </section>
      )}

      {tab === 'phases' && (
        <section className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-white/10 px-1" style={{ scrollbarGutter: 'stable' }}>
          {BUILD_PHASES.map((phase, index) => {
            // Assign some mock status for visual variety
            const statusColor = index < 2 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                               index === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                               'bg-slate-800 text-slate-400 border-border-primary';
            const statusText = index < 2 ? 'Hoàn thành' : index === 2 ? 'Đang chạy' : 'Sắp tới';

            return (
              <div key={phase.phase} className="shrink-0 w-[320px] rounded-2xl border border-border-primary bg-bg-surface/50 flex flex-col max-h-[600px] overflow-hidden shadow-lg shadow-black/20">
                {/* Column Header */}
                <div className="p-4 border-b border-border-primary/60 bg-slate-950/40 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-black text-text-primary">
                    <Workflow className="h-4 w-4 text-indigo-400" />
                    {phase.phase.split('.')[0]} {/* Just the number/short title */}
                  </h2>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {statusText}
                  </span>
                </div>
                
                {/* Column Body (Cards) */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-[#09090b]/40">
                  {/* Output Card */}
                  <div 
                    onClick={() => setSelectedPhase(phase)}
                    className="bg-slate-900 border border-white/5 rounded-xl p-4 shadow-sm cursor-pointer hover:border-indigo-500/30 hover:shadow-indigo-500/5 transition-all group relative"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-500" />
                        <span className="w-1 h-1 rounded-full bg-slate-500" />
                        <span className="w-1 h-1 rounded-full bg-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 mb-2">{phase.phase.substring(phase.phase.indexOf('.') + 2)}</h3>
                    <p className="text-[11px] font-medium leading-relaxed text-slate-400">{phase.output}</p>
                    
                    {/* Fake assignee/meta */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[8px] font-bold text-indigo-300">AI</div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">P{index + 1}</span>
                    </div>
                  </div>

                  {/* Risk Card */}
                  <div className="bg-amber-950/20 border border-amber-500/10 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] font-medium leading-relaxed text-amber-200/70">{phase.risk}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {tab === 'security' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <LockKeyhole className="h-4 w-4 text-rose-300" />
              Phân quyền tối thiểu
            </h2>
            <div className="space-y-3">
              {ROLE_MATRIX.map((role) => (
                <div key={role.role} className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-text-primary">{role.role}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-emerald-300">Được làm: {role.can}</p>
                  <p className="mt-1 text-xs font-semibold leading-6 text-rose-300">Không được: {role.cannot}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <Layers className="h-4 w-4 text-cyan-300" />
              Stack tiết kiệm
            </h2>
            <div className="space-y-3">
              {LOW_COST_STACK.map((item) => (
                <div key={item.layer} className="rounded-xl border border-border-primary bg-slate-950/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-text-primary">{item.layer}</h3>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] font-black text-cyan-300">{item.choice}</span>
                  </div>
                  <p className="text-xs font-semibold leading-6 text-text-secondary">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'testing' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <ClipboardList className="h-4 w-4 text-emerald-300" />
              Checklist test nghiệp vụ
            </h2>
            <div className="space-y-3">
              {TEST_CHECKLIST.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-border-primary bg-slate-950/70 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p className="text-xs font-semibold leading-6 text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-primary">
              <GitBranch className="h-4 w-4 text-purple-300" />
              Lệnh kiểm tra build
            </h2>
            <pre className="rounded-xl border border-border-primary bg-slate-950 p-4 text-[11px] font-bold leading-7 text-purple-300">{`npm run check:hybrid
npm run build
npm run desktop:dist
npm run check:hybrid:release`}</pre>
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Quy tắc quản lý AI code
              </h3>
              <p className="text-xs font-semibold leading-6 text-text-secondary">
                Mỗi lần chỉ giao AI sửa một module, không cho xóa script kiểm tra, không cho viết lại toàn bộ app.
                Sau mỗi lượt phải chạy build và ghi rõ file đã sửa.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Drawer for Issue Detail */}
      <Drawer
        isOpen={!!selectedPhase}
        onClose={() => setSelectedPhase(null)}
        title="Chi tiết Phase"
      >
        {selectedPhase && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 mb-1">Tên Phase</h3>
              <p className="text-base text-slate-200">{selectedPhase.phase}</p>
            </div>
            
            <div className="rounded-xl bg-slate-900/50 border border-white/5 p-4">
              <h3 className="text-sm font-bold text-slate-400 mb-2">Mục tiêu & Output</h3>
              <p className="text-sm leading-relaxed text-slate-300">{selectedPhase.output}</p>
            </div>

            <div className="rounded-xl bg-amber-950/20 border border-amber-500/10 p-4">
              <h3 className="text-sm font-bold text-amber-500/80 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Rủi ro & Cảnh báo
              </h3>
              <p className="text-sm leading-relaxed text-amber-200/80">{selectedPhase.risk}</p>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-bold text-slate-400 mb-3">Activity</h3>
              <div className="flex gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <span className="text-indigo-300 font-bold text-xs">AI</span>
                </div>
                <div>
                  <p className="text-slate-300"><span className="font-bold text-white">AI Agent</span> đã tự động phân tích rủi ro cho phase này.</p>
                  <span className="text-xs text-slate-500">2 giờ trước</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
