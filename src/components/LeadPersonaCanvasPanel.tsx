import React, { useMemo, useState } from 'react';
import { BrainCircuit, ClipboardList, Copy, Loader2, Sparkles, Target } from 'lucide-react';
import {
  AI_QUALIFICATION_PROMPT,
  JTBD_FRAMEWORK,
  PERSONA_CANVAS_TEMPLATE,
} from '../data/leadScoringKnowledge';

type PersonaAnswers = Record<string, string>;

type AIChatResponse = {
  success?: boolean;
  text?: string;
  content?: string;
  output?: string;
  error?: string;
};

const defaultAnswers = PERSONA_CANVAS_TEMPLATE.reduce<PersonaAnswers>((acc, field) => {
  acc[field.id] = field.example;
  return acc;
}, {});

function buildOfflineQualification(leadContext: string) {
  return `**Lead Qualification — Offline Fallback**

**Fit score đề xuất:** 72/100

**Tóm tắt lead:**
${leadContext}

**Lý do có fit:**
- Có pain rõ liên quan đến báo cáo, kiểm soát dữ liệu hoặc vận hành marketing/sales.
- Persona có khả năng nhìn thấy ROI nếu demo dùng dữ liệu thật.
- Có thể gắn với Company OS thay vì bán như một phần mềm thay thế hệ thống hiện có.

**Rủi ro cần xác minh:**
- Ngân sách thật sự và quyền quyết định mua.
- Công cụ hiện tại đang dùng và mức độ sẵn sàng thay đổi quy trình.
- Lead có dữ liệu mẫu đủ để demo hay chưa.

**Next action:**
Gửi 1 câu hỏi discovery ngắn: “Hiện tại anh/chị mất bao lâu để tổng hợp báo cáo quan trọng nhất mỗi tuần, và ai là người cần xem báo cáo đó?”

**Human review:** Đây là bản fallback, không phải kết luận tự động. Sales/founder phải duyệt trước khi chấm điểm chính thức.`;
}

export default function LeadPersonaCanvasPanel() {
  const [answers, setAnswers] = useState<PersonaAnswers>(defaultAnswers);
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const leadContext = useMemo(
    () => PERSONA_CANVAS_TEMPLATE
      .map((field) => `${field.label}: ${answers[field.id] || field.example}`)
      .join('\n'),
    [answers]
  );

  const qualificationPrompt = useMemo(() => AI_QUALIFICATION_PROMPT(leadContext), [leadContext]);

  const runQualification = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: qualificationPrompt,
          systemInstruction:
            'Bạn là B2B SaaS sales strategist cho thị trường Việt Nam. Chấm lead theo persona/JTBD, nêu rõ giả định, không kết luận thay founder, không bịa dữ liệu, luôn có bước human review.',
          history: [],
          model: 'ai-assistant',
        }),
      });
      const data = (await response.json()) as AIChatResponse;
      const text = data.text ?? data.content ?? data.output ?? '';
      if (!response.ok || !text) {
        throw new Error(data.error || 'AI Gateway không trả nội dung');
      }
      setAiResult(text);
    } catch (err: unknown) {
      setAiResult(buildOfflineQualification(leadContext));
      setError(err instanceof Error ? err.message : 'Không gọi được AI Gateway, đã dùng bản offline fallback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
          Lead Scoring V2 · persona canvas + JTBD + AI qualification
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Persona Canvas & JTBD Qualification</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
          Panel phụ cho LeadScoringEngine theo spec Marketing Upgrade: gom persona, job-to-be-done,
          trigger mua, objection và bằng chứng cần thấy trước khi chấm điểm hoặc đẩy sale.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-300" />
            <h3 className="text-lg font-black text-white">Persona Canvas</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {PERSONA_CANVAS_TEMPLATE.map((field) => (
              <label key={field.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{field.label}</span>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{field.prompt}</p>
                <textarea
                  value={answers[field.id] ?? ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))}
                  className="mt-3 min-h-[92px] w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold leading-6 text-white outline-none focus:border-cyan-400"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-5">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-200" />
              <h3 className="text-lg font-black text-white">JTBD Library</h3>
            </div>
            <div className="mt-4 space-y-3">
              {JTBD_FRAMEWORK.map((jtbd) => (
                <article key={jtbd.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">{jtbd.productCue}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                    <span className="font-black text-white">Khi</span> {jtbd.when}, <span className="font-black text-white">tôi muốn</span> {jtbd.iWantTo}, <span className="font-black text-white">để</span> {jtbd.soICan}.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-cyan-300" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">AI qualification prompt</p>
              <h3 className="text-lg font-black text-white">Prompt chấm fit score</h3>
            </div>
          </div>
          <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-300">
            {qualificationPrompt}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runQualification}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Đang chấm...' : 'Chấm lead bằng AI'}
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(qualificationPrompt)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-200 hover:border-cyan-300/60 hover:text-cyan-200"
            >
              <Copy className="h-4 w-4" /> Copy prompt
            </button>
          </div>
          {error && <p className="mt-3 text-xs font-bold text-amber-200">AI fallback: {error}</p>}
        </div>

        <div className="lg:col-span-7 rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Generated qualification</p>
              <h3 className="mt-1 text-lg font-black text-white">Kết quả cần người duyệt</h3>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(aiResult)}
              disabled={!aiResult}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-200 hover:border-cyan-300/60 hover:text-cyan-200 disabled:opacity-40"
            >
              <Copy className="h-4 w-4" /> Copy result
            </button>
          </div>
          <pre className="mt-4 min-h-[360px] whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm font-semibold leading-7 text-slate-300">
            {aiResult || 'Nhấn “Chấm lead bằng AI” để tạo bản đánh giá fit score. Nếu AI Gateway chưa cấu hình, hệ thống tự tạo bản offline fallback.'}
          </pre>
        </div>
      </section>
    </div>
  );
}
