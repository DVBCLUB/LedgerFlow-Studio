import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  Gauge,
  ShieldCheck,
  WalletCards
} from 'lucide-react';
import {
  COMMAND_CENTER_ALERTS,
  COMMAND_CENTER_KPIS,
  COMMAND_CENTER_REPORT_TEMPLATES,
  COMMAND_CENTER_WORKFLOWS
} from '../data/commandCenterKnowledge';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export default function CommandCenter() {
  const [copied, setCopied] = useState<string | null>(null);

  const dashboard = useMemo(() => {
    const plannedBudget = 8_500_000_000;
    const actualCost = 7_835_000_000;
    const advances = 920_000_000;
    const settled = 662_000_000;
    const missingDocs = 14;
    const totalFiles = 74;

    return {
      plannedBudget,
      actualCost,
      remainingBudget: plannedBudget - actualCost,
      advanceRatio: Math.round((settled / advances) * 100),
      missingDocRatio: Math.round((missingDocs / totalFiles) * 100),
      openAdvance: advances - settled
    };
  }, []);

  const bossBrief = `BÁO CÁO NHANH COMMAND CENTER\n\n1. Ngân sách còn lại: ${money(dashboard.remainingBudget)} VNĐ.\n2. Tỷ lệ hoàn ứng: ${dashboard.advanceRatio}%. Số tạm ứng còn treo: ${money(dashboard.openAdvance)} VNĐ.\n3. Tỷ lệ hồ sơ thiếu: ${dashboard.missingDocRatio}%.\n4. Việc cần xử lý: chặn khoản vượt ngân sách, nhắc hoàn ứng, kiểm tra VAT, đối chiếu quỹ dầu.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-300">
              <Gauge className="h-3.5 w-3.5" />
              Command Center
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Trung tâm chỉ huy kế toán công trình
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này chuyển từ bảng tổng hợp rời rạc thành màn hình điều hành cho sếp và kế toán:
              ngân sách, tạm ứng, hồ sơ thanh toán, hóa đơn VAT, vật tư, quỹ dầu và cảnh báo rủi ro.
              Dữ liệu bên dưới chạy offline để dùng được cả khi chưa nối API.
            </p>
          </div>

          <button
            onClick={() => copyText('bossBrief', bossBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'bossBrief' ? 'Đã copy báo cáo' : 'Copy báo cáo sếp'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <WalletCards className="mb-3 h-5 w-5 text-emerald-300" />
          <p className="text-[10px] font-black uppercase text-slate-500">Ngân sách còn lại</p>
          <p className="mt-2 text-xl font-black text-white">{money(dashboard.remainingBudget)} đ</p>
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Nếu còn dưới 10% thì chặn phát sinh ngoài kế hoạch.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <BarChart3 className="mb-3 h-5 w-5 text-purple-300" />
          <p className="text-[10px] font-black uppercase text-slate-500">Hoàn ứng</p>
          <p className="mt-2 text-xl font-black text-white">{dashboard.advanceRatio}%</p>
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Còn treo {money(dashboard.openAdvance)} đ cần bổ sung chứng từ.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <FileText className="mb-3 h-5 w-5 text-amber-300" />
          <p className="text-[10px] font-black uppercase text-slate-500">Hồ sơ thiếu</p>
          <p className="mt-2 text-xl font-black text-white">{dashboard.missingDocRatio}%</p>
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Ưu tiên lọc bộ hồ sơ thiếu hóa đơn, nghiệm thu, phiếu kho.</p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
          <AlertTriangle className="mb-3 h-5 w-5 text-rose-300" />
          <p className="text-[10px] font-black uppercase text-rose-300">Cảnh báo chính</p>
          <p className="mt-2 text-xl font-black text-white">Quỹ dầu</p>
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Đối chiếu phiếu cấp dầu, nhật trình xe/máy và định mức trước khi duyệt.</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            KPI điều hành
          </h2>
          <div className="space-y-3">
            {COMMAND_CENTER_KPIS.map((item) => (
              <div key={item.name} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{item.name}</h3>
                    <p className="mt-1 text-xs font-semibold leading-6 text-slate-400">{item.detail}</p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black text-emerald-300">{item.status}</span>
                </div>
                <code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-blue-300">{item.formula}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            Risk board
          </h2>
          <div className="space-y-3">
            {COMMAND_CENTER_ALERTS.map((alert) => (
              <div key={alert.title} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-amber-100">{alert.title}</h3>
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-300">{alert.level}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">Owner: {alert.owner}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{alert.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <ClipboardList className="h-4 w-4 text-purple-300" />
            Luồng xử lý từ phát sinh đến báo cáo sếp
          </h2>
          <div className="space-y-3">
            {COMMAND_CENTER_WORKFLOWS.map((step) => (
              <div key={step.step} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-black text-white">{step.step}</h3>
                  <p className="mt-1 text-xs font-semibold leading-6 text-slate-400">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <FileText className="h-4 w-4 text-cyan-300" />
            Mẫu báo cáo dùng ngay
          </h2>
          <div className="space-y-3">
            {COMMAND_CENTER_REPORT_TEMPLATES.map((template) => (
              <div key={template.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h3 className="text-sm font-black text-white">{template.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{template.body}</p>
                <button
                  onClick={() => copyText(template.title, template.body)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-emerald-400 hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === template.title ? 'Đã copy' : 'Copy mẫu'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Nguyên tắc vận hành
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Command Center không nên là nơi nhập liệu chi tiết. Nó là màn hình ra quyết định: cái gì được thanh toán,
          cái gì phải chặn, ai chịu trách nhiệm, và rủi ro nào cần báo sếp trong ngày. Các module khác cung cấp dữ liệu,
          còn màn hình này tổng hợp thành KPI, cảnh báo và checklist hành động.
        </p>
      </section>
    </div>
  );
}
