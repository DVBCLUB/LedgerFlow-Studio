import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  EyeOff,
  FileText,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  WalletCards
} from 'lucide-react';
import {
  AI_ARCHITECTURE,
  AI_GUARDRAILS,
  AI_USE_CASES,
  COST_CONTROL_TIPS,
  PROMPT_TEMPLATES
} from '../data/advancedAIEngineKnowledge';

type AiTab = 'usecases' | 'guardrails' | 'prompts' | 'cost';

function redactSensitiveText(text: string) {
  return text
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL_DA_AN]')
    .replace(/\b0\d{9,10}\b/g, '[SDT_DA_AN]')
    .replace(/\b\d{10,13}\b/g, '[MST_STK_DA_AN]')
    .replace(/\b\d{1,3}([.,]\d{3}){2,}\b/g, '[SO_TIEN_CAN_KIEM_TRA]');
}

export default function AdvancedAIEngine() {
  const [tab, setTab] = useState<AiTab>('usecases');
  const [copied, setCopied] = useState<string | null>(null);
  const [rawText, setRawText] = useState('Thanh toán hóa đơn 000123 cho NCC MST 0312345678, số tiền 250.000.000, liên hệ anh A 0912345678, email ketoan@example.com.');

  const redacted = useMemo(() => redactSensitiveText(rawText), [rawText]);

  const aiPolicy = `CHÍNH SÁCH DÙNG AI TRONG KẾ TOÁN\n\n1. Không gửi dữ liệu nhạy cảm lên AI cloud nếu chưa ẩn thông tin.\n2. AI chỉ gợi ý, không tự duyệt thanh toán hoặc tự kết luận pháp lý.\n3. Mọi kết quả AI phải có confidence, lý do và trạng thái cần người kiểm tra.\n4. Prompt/output phải được lưu log để kiểm toán.\n5. Dữ liệu rủi ro cao phải chuyển kế toán trưởng duyệt.`;

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: AiTab; label: string }[] = [
    { id: 'usecases', label: 'Use cases' },
    { id: 'guardrails', label: 'Guardrails' },
    { id: 'prompts', label: 'Prompts' },
    { id: 'cost', label: 'Cost control' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-fuchsia-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-fuchsia-300">
              <Bot className="h-3.5 w-3.5" />
              Advanced AI Engine
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              AI cho kế toán: dùng đúng chỗ, kiểm soát rủi ro, không đốt quota
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này biến AI thành trợ lý kiểm tra dữ liệu Company OS và kế toán đa ngành, không phải người thay kế toán hoặc người duyệt.
              Trọng tâm là: dùng rule offline trước, ẩn dữ liệu nhạy cảm, bắt AI trả về cấu trúc rõ ràng,
              lưu log, và luôn có người duyệt cuối.
            </p>
          </div>

          <button
            onClick={() => copyText('policy', aiPolicy)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-fuchsia-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-fuchsia-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'policy' ? 'Đã copy' : 'Copy chính sách AI'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                tab === item.id
                  ? 'bg-fuchsia-400 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'usecases' && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {AI_USE_CASES.map((item) => (
              <div key={item.name} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <Sparkles className="mb-3 h-5 w-5 text-fuchsia-300" />
                <h2 className="text-sm font-black text-white">{item.name}</h2>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Input:</span> {item.input}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400"><span className="font-black text-slate-200">Output:</span> {item.output}</p>
                <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold leading-6 text-amber-100">
                  {item.guardrail}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Database className="h-4 w-4 text-cyan-300" />
              Kiến trúc AI an toàn
            </h2>
            <div className="grid gap-3 md:grid-cols-5">
              {AI_ARCHITECTURE.map((layer) => (
                <div key={layer.layer} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-xs font-black text-white">{layer.layer}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{layer.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'guardrails' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Guardrails bắt buộc
            </h2>
            <div className="space-y-3">
              {AI_GUARDRAILS.map((item) => (
                <div key={item.rule} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-black text-white">{item.rule}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <EyeOff className="h-4 w-4 text-rose-300" />
              Demo ẩn dữ liệu trước khi gửi AI
            </h2>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="h-36 w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-200 outline-none focus:border-fuchsia-400"
            />
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-emerald-200">
                <Lock className="h-4 w-4" />
                Bản đã ẩn
              </div>
              <p className="whitespace-pre-wrap text-xs font-semibold leading-6 text-slate-300">{redacted}</p>
            </div>
            <button
              onClick={() => copyText('redacted', redacted)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-emerald-400 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied === 'redacted' ? 'Đã copy' : 'Copy bản đã ẩn'}
            </button>
          </div>
        </section>
      )}

      {tab === 'prompts' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {PROMPT_TEMPLATES.map((template) => (
            <div key={template.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                <FileText className="h-4 w-4 text-fuchsia-300" />
                {template.title}
              </h2>
              <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-300">{template.prompt}</p>
              <button
                onClick={() => copyText(template.title, template.prompt)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-fuchsia-400 px-3 py-2 text-[11px] font-black text-slate-950"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied === template.title ? 'Đã copy' : 'Copy prompt'}
              </button>
            </div>
          ))}
        </section>
      )}

      {tab === 'cost' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <WalletCards className="h-4 w-4 text-emerald-300" />
              Cách không đốt quota AI
            </h2>
            <div className="space-y-3">
              {COST_CONTROL_TIPS.map((tip) => (
                <div key={tip} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p className="text-xs font-semibold leading-6 text-slate-300">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-rose-100">
              <ShieldAlert className="h-4 w-4" />
              Những việc cấm giao AI
            </h2>
            <div className="space-y-3 text-xs font-semibold leading-6 text-slate-300">
              <p>Không cho AI tự xóa dữ liệu kế toán.</p>
              <p>Không cho AI tự duyệt chi tiền.</p>
              <p>Không cho AI tự kết luận hồ sơ hợp lệ nếu thiếu chứng từ.</p>
              <p>Không gửi nguyên sao kê, CCCD, tài khoản ngân hàng lên cloud AI nếu chưa ẩn.</p>
              <p>Không để AI sửa nhiều module một lúc nếu chưa có test.</p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          Nguyên tắc cuối
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          AI Engine tốt nhất cho phần mềm kế toán không phải là AI trả lời dài nhất. Nó là hệ thống biết ẩn dữ liệu,
          biết hỏi theo schema, biết lưu log, biết chuyển người duyệt khi rủi ro cao, và biết dùng rule offline trước khi tốn API.
        </p>
      </section>
    </div>
  );
}
