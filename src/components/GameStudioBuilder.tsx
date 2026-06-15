// @ts-nocheck
import { useState } from 'react';

const KEY = 'ledgerflow-game-studio-drafts-v1';
const fallback = [{ id: 'q1', question: 'Nợ 621 / Có 111 dùng khi nào?', options: ['Chi phí vật tư trực tiếp trả tiền mặt', 'Thu tiền khách hàng', 'Vay ngân hàng', 'Ghi nhận doanh thu'], correctAnswer: 'Chi phí vật tư trực tiếp trả tiền mặt', explanation: '621 là chi phí NVL trực tiếp, 111 là tiền mặt.', points: 10, difficulty: 'medium' }];

export default function GameStudioBuilder() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('Game học kế toán VAS');
  const [topic, setTopic] = useState('Định khoản chi phí công trình');
  const [template, setTemplate] = useState('quiz');
  const [level, setLevel] = useState('beginner');
  const [questions, setQuestions] = useState(fallback);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const prompt = `Tạo 5 câu hỏi ${template} về "${topic}" level ${level}, chuẩn VAS Việt Nam. Trả JSON array.`;
    try {
      const res = await fetch('/api/agents/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentRole: 'AI Game Dev', prompt, context: { topic, template, level } }) });
      const data = await res.json();
      const text = String(data.output || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) setQuestions(parsed);
    } catch {}
    setLoading(false);
    setStep(2);
  }

  function save() {
    const config = { id: `game-${Date.now()}`, title, topic, template, level, questions, createdAt: new Date().toISOString(), status: 'draft' };
    const old = JSON.parse(localStorage.getItem(KEY) || '[]');
    localStorage.setItem(KEY, JSON.stringify([config, ...old].slice(0, 50)));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ title, topic, template, level, questions }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ledgerflow-game.json'; a.click(); URL.revokeObjectURL(url);
  }

  const current = questions[0] || fallback[0];
  return <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-5 text-slate-100">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Game Studio Lite</p><h3 className="mt-1 text-xl font-black text-white">Edu-game creator</h3><p className="mt-1 text-sm text-slate-400">Chọn template → AI gen câu hỏi → preview → lưu/export JSON.</p></div><div className="flex gap-2">{[1,2,3].map(n=><button key={n} onClick={()=>setStep(n)} className={`rounded-xl border px-3 py-2 text-xs font-black ${step===n?'border-violet-200 text-violet-100':'border-slate-700 text-slate-300'}`}>Step {n}</button>)}</div></div>
    {step===1 && <div className="mt-4 grid gap-3 md:grid-cols-2"><input value={title} onChange={e=>setTitle(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"/><input value={topic} onChange={e=>setTopic(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"/><select value={template} onChange={e=>setTemplate(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option>quiz</option><option>flashcard</option><option>drag_drop</option><option>fill_blank</option><option>scenario</option></select><select value={level} onChange={e=>setLevel(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option>beginner</option><option>intermediate</option><option>advanced</option></select><button onClick={generate} className="md:col-span-2 rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950">{loading?'Đang generate...':'Generate với AI Game Dev'}</button></div>}
    {step===2 && <div className="mt-4 space-y-3">{questions.map((q,i)=><article key={q.id||i} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><input value={q.question} onChange={e=>setQuestions(questions.map((x,idx)=>idx===i?{...x,question:e.target.value}:x))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"/><p className="mt-2 text-xs text-slate-400">Đáp án: {String(q.correctAnswer)} — {q.explanation}</p></article>)}<button onClick={()=>setStep(3)} className="rounded-2xl border border-violet-300/50 px-4 py-2 text-xs font-black text-violet-100">Preview</button></div>}
    {step===3 && <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm font-black text-white">{current.question}</p><div className="mt-3 space-y-2">{(current.options||[]).map(o=><button key={o} onClick={()=>setAnswer(o)} className={`block w-full rounded-xl border px-3 py-2 text-left text-xs ${answer===o?'border-violet-200 text-violet-100':'border-slate-700 text-slate-300'}`}>{o}</button>)}</div>{answer && <p className="mt-3 text-xs text-slate-300">Đáp án đúng: {String(current.correctAnswer)} — {current.explanation}</p>}</div><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm font-black text-white">Publish</p><p className="mt-2 text-xs text-slate-400">{questions.length} câu hỏi · {template} · {level}</p><div className="mt-4 flex gap-2"><button onClick={save} className="rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100">Lưu Library</button><button onClick={exportJson} className="rounded-xl bg-violet-300 px-3 py-2 text-xs font-black text-slate-950">Export JSON</button></div></div></div>}
  </section>;
}
