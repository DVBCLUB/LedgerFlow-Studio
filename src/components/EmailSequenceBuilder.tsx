import React, { useMemo, useState } from 'react';
import { CalendarDays, Copy, Mail, Send, Sparkles } from 'lucide-react';
import {
  AI_EMAIL_PROMPT,
  EMAIL_METRICS_BENCHMARKS,
  EMAIL_SEQUENCES,
  type SequenceType,
} from '../data/emailSequenceKnowledge';

const toneOptions = [
  { id: 'formal', label: 'Chuyên nghiệp' },
  { id: 'conversational', label: 'Thân thiện' },
  { id: 'founder-personal', label: 'Founder cá nhân' },
] as const;

type Tone = (typeof toneOptions)[number]['id'];

export default function EmailSequenceBuilder() {
  const [sequenceId, setSequenceId] = useState<SequenceType>('welcome');
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
  const [persona, setPersona] = useState('Kế toán trưởng SME / founder Việt Nam cần kiểm soát vận hành gọn hơn');
  const [tone, setTone] = useState<Tone>('founder-personal');
  const [draftPrompt, setDraftPrompt] = useState('');

  const activeSequence = useMemo(
    () => EMAIL_SEQUENCES.find((sequence) => sequence.id === sequenceId) ?? EMAIL_SEQUENCES[0],
    [sequenceId]
  );

  const activeEmail = activeSequence.emails[Math.min(selectedEmailIndex, activeSequence.emails.length - 1)];

  const buildPrompt = () => {
    const prompt = AI_EMAIL_PROMPT({
      sequenceType: activeSequence.id,
      dayNumber: activeEmail.day,
      persona,
      mainGoal: activeEmail.goal,
      tone,
    });
    setDraftPrompt(prompt);
  };

  const copyPrompt = async () => {
    if (!draftPrompt) return;
    await navigator.clipboard?.writeText(draftPrompt);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
          Marketing Automation · local-first
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Email Sequence Builder</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
          Thiết kế welcome, activation, churn prevention và các drip sequence cho LedgerFlow.
          Component này chỉ tạo cấu trúc và prompt; gửi email thật phải qua công cụ/email provider riêng và có người duyệt.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Sequence</label>
            <select
              value={sequenceId}
              onChange={(event) => {
                setSequenceId(event.target.value as SequenceType);
                setSelectedEmailIndex(0);
                setDraftPrompt('');
              }}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400"
            >
              {EMAIL_SEQUENCES.map((sequence) => (
                <option key={sequence.id} value={sequence.id}>{sequence.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Persona</label>
            <textarea
              value={persona}
              onChange={(event) => setPersona(event.target.value)}
              className="mt-2 min-h-[92px] w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Tone</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {toneOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTone(item.id)}
                  className={`rounded-2xl px-3 py-2 text-xs font-black transition-colors ${
                    tone === item.id
                      ? 'bg-cyan-300 text-slate-950'
                      : 'border border-slate-800 text-slate-400 hover:border-cyan-400/50 hover:text-cyan-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={buildPrompt}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-950 hover:bg-cyan-200"
          >
            <Sparkles size={16} /> Tạo AI prompt cho email đang chọn
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">{activeSequence.trigger}</p>
              <h3 className="mt-1 text-xl font-black text-white">{activeSequence.name}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                {activeSequence.totalEmails} emails · {activeSequence.duration}
              </p>
            </div>
            <span className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
              {activeSequence.id}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {activeSequence.emails.map((email, index) => (
              <button
                key={`${activeSequence.id}-${email.day}-${email.subject}`}
                onClick={() => {
                  setSelectedEmailIndex(index);
                  setDraftPrompt('');
                }}
                className={`rounded-3xl border p-4 text-left transition-colors ${
                  selectedEmailIndex === index
                    ? 'border-cyan-300 bg-cyan-300/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-cyan-400/40'
                }`}
              >
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  <CalendarDays size={13} /> Day {email.day}
                </div>
                <p className="mt-2 text-sm font-black text-white">{email.subject}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{email.goal}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Selected email</p>
            <h3 className="mt-1 text-lg font-black text-white">Day {activeEmail.day}: {activeEmail.subject}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-400">{activeEmail.preheader}</p>
          </div>
          <span className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
            {activeEmail.cta}
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-200">
              <Mail size={15} /> Body structure
            </p>
            <ul className="space-y-2">
              {activeEmail.bodyStructure.map((line) => (
                <li key={line} className="flex gap-2 text-sm font-semibold leading-6 text-slate-300">
                  <Send size={14} className="mt-1 shrink-0 text-cyan-300" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Avoid if</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{activeEmail.avoidIf}</p>
          </div>
        </div>
      </section>

      {draftPrompt && (
        <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">AI draft prompt</p>
              <h3 className="mt-1 text-lg font-black text-white">Copy prompt qua /api/ai/chat hoặc AI assistant nội bộ</h3>
            </div>
            <button
              onClick={copyPrompt}
              className="flex items-center gap-2 rounded-2xl border border-violet-300/50 px-4 py-2 text-xs font-black text-violet-100 hover:bg-violet-300/10"
            >
              <Copy size={14} /> Copy prompt
            </button>
          </div>
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs font-semibold leading-6 text-slate-300">
            {draftPrompt}
          </pre>
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {EMAIL_METRICS_BENCHMARKS.map((item) => (
          <div key={item.metric} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm font-black text-white">{item.metric}</p>
            <p className="mt-2 text-xs font-bold text-cyan-200">Good: {item.goodFor}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Industry: {item.industry}</p>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">{item.note}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
