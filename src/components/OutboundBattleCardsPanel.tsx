import React, { useMemo, useState } from 'react';
import { Copy, MessageSquare, ShieldCheck, Swords } from 'lucide-react';
import {
  AI_MESSAGE_VARIABLES,
  AI_OUTBOUND_MESSAGE_PROMPT,
  BATTLE_CARDS,
} from '../data/outboundSalesKnowledge';

export default function OutboundBattleCardsPanel() {
  const [persona, setPersona] = useState('Kế toán trưởng công ty xây dựng 30 người');
  const [pain, setPain] = useState('Mất 2 ngày gom báo cáo chi phí công trình');
  const [currentTool, setCurrentTool] = useState('Excel + Zalo + MISA');
  const [proofAsset, setProofAsset] = useState('Checklist hồ sơ thiếu và screenshot daily brief');
  const [cta, setCta] = useState('Anh/chị có muốn xem demo 15 phút bằng dữ liệu mẫu không?');

  const prompt = useMemo(
    () => AI_OUTBOUND_MESSAGE_PROMPT({ persona, pain, currentTool, proofAsset, cta }),
    [persona, pain, currentTool, proofAsset, cta]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-400/30 bg-indigo-400/10 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">
          Outbound V2 · battle cards + AI message variables
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Outbound Battle Cards</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-400">
          Panel phụ cho OutboundSalesHub theo spec Marketing Upgrade: so sánh đối thủ/cách làm hiện tại,
          định vị LedgerFlow là lớp Company OS bổ sung, và tạo prompt cá nhân hóa tin nhắn mà không spam.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {BATTLE_CARDS.map((card) => (
          <article key={card.competitor} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-indigo-400/30 bg-indigo-400/10 p-2 text-indigo-300">
                <Swords className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Competitor / current tool</p>
                <h3 className="mt-1 text-base font-black text-white">{card.competitor}</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-400">
              <p><span className="font-black text-emerald-300">Mạnh:</span> {card.theirStrength}</p>
              <p><span className="font-black text-amber-300">Điểm yếu:</span> {card.weakSpot}</p>
              <p><span className="font-black text-indigo-300">Góc LedgerFlow:</span> {card.ledgerFlowAngle}</p>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Message hook</p>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-200">{card.messageHook}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-300" />
            <h3 className="text-lg font-black text-white">AI Message Variables</h3>
          </div>
          <div className="mt-4 space-y-3">
            {AI_MESSAGE_VARIABLES.map((variable) => (
              <label key={variable.key} className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{variable.label}</span>
                <input
                  value={
                    variable.key === 'persona' ? persona :
                    variable.key === 'pain' ? pain :
                    variable.key === 'current_tool' ? currentTool :
                    variable.key === 'proof_asset' ? proofAsset : cta
                  }
                  onChange={(event) => {
                    if (variable.key === 'persona') setPersona(event.target.value);
                    if (variable.key === 'pain') setPain(event.target.value);
                    if (variable.key === 'current_tool') setCurrentTool(event.target.value);
                    if (variable.key === 'proof_asset') setProofAsset(event.target.value);
                    if (variable.key === 'cta') setCta(event.target.value);
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-indigo-400"
                />
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{variable.guidance}</p>
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl border border-indigo-400/30 bg-indigo-400/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">Ready-to-send AI prompt</p>
              <h3 className="mt-1 text-lg font-black text-white">Tin nhắn cá nhân hóa</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-2xl border border-slate-700 px-3 py-1 text-[10px] font-black uppercase text-slate-300">
              <ShieldCheck className="h-3 w-3" /> Human review required
            </span>
          </div>
          <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-300">
            {prompt}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(prompt)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-indigo-200"
          >
            <Copy className="h-4 w-4" /> Copy prompt
          </button>
        </div>
      </section>
    </div>
  );
}
