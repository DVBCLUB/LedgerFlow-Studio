import { useState } from 'react';

const KEY = 'ledgerflow-game-studio-drafts-v1';
const TEMPLATES = ['quiz', 'flashcard', 'drag_drop', 'fill_blank', 'scenario'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

type GameTemplate = (typeof TEMPLATES)[number];
type GameLevel = (typeof LEVELS)[number];
type Difficulty = 'easy' | 'medium' | 'hard';

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: Difficulty;
};

type GameConfig = {
  id: string;
  title: string;
  topic: string;
  template: GameTemplate;
  level: GameLevel;
  questions: QuizQuestion[];
  createdAt: string;
  status: 'draft';
};

type AgentExecuteResponse = { output?: string; content?: string; text?: string };

const fallback: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Nợ 621 / Có 111 dùng khi nào?',
    options: ['Chi phí vật tư trực tiếp trả tiền mặt', 'Thu tiền khách hàng', 'Vay ngân hàng', 'Ghi nhận doanh thu'],
    correctAnswer: 'Chi phí vật tư trực tiếp trả tiền mặt',
    explanation: '621 là chi phí NVL trực tiếp, 111 là tiền mặt.',
    points: 10,
    difficulty: 'medium',
  },
];

function normalizeQuestions(raw: unknown): QuizQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const row = item as Partial<QuizQuestion>;
      if (!row.question) return null;
      return {
        id: String(row.id || `q${index + 1}`),
        question: String(row.question),
        options: Array.isArray(row.options) ? row.options.map(String) : [],
        correctAnswer: Array.isArray(row.correctAnswer) ? row.correctAnswer.map(String) : String(row.correctAnswer || ''),
        explanation: String(row.explanation || ''),
        points: Number(row.points || 10),
        difficulty: (['easy', 'medium', 'hard'].includes(String(row.difficulty)) ? row.difficulty : 'medium') as Difficulty,
      };
    })
    .filter((item): item is QuizQuestion => Boolean(item));
}

function loadSavedGames(): GameConfig[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed as GameConfig[] : [];
  } catch {
    return [];
  }
}

export default function GameStudioBuilder() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('Game học kế toán VAS');
  const [topic, setTopic] = useState('Định khoản chi phí công trình');
  const [template, setTemplate] = useState<GameTemplate>('quiz');
  const [level, setLevel] = useState<GameLevel>('beginner');
  const [questions, setQuestions] = useState<QuizQuestion[]>(fallback);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const prompt = `Tạo 5 câu hỏi ${template} về "${topic}" level ${level}, chuẩn VAS Việt Nam. Trả JSON array.`;
    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentRole: 'AI Game Dev', prompt, context: { topic, template, level } }),
      });
      const data = await res.json() as AgentExecuteResponse;
      const text = String(data.output || data.content || data.text || '').replace(/```json|```/g, '').trim();
      const parsed = normalizeQuestions(JSON.parse(text));
      if (parsed.length > 0) setQuestions(parsed);
    } catch {
      // Keep fallback/manual questions when AI output is unavailable or not valid JSON.
    } finally {
      setLoading(false);
      setStep(2);
    }
  }

  function save() {
    const config: GameConfig = { id: `game-${Date.now()}`, title, topic, template, level, questions, createdAt: new Date().toISOString(), status: 'draft' };
    localStorage.setItem(KEY, JSON.stringify([config, ...loadSavedGames()].slice(0, 50)));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ title, topic, template, level, questions }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledgerflow-game.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const current = questions[0] || fallback[0];

  return <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-5 text-slate-100">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Game Studio Lite</p><h3 className="mt-1 text-xl font-black text-white">Edu-game creator</h3><p className="mt-1 text-sm text-slate-400">Chọn template → AI gen câu hỏi → preview → lưu/export JSON.</p></div><div className="flex gap-2">{[1,2,3].map(n=><button key={n} onClick={()=>setStep(n as 1 | 2 | 3)} className={`rounded-xl border px-3 py-2 text-xs font-black ${step===n?'border-violet-200 text-violet-100':'border-slate-700 text-slate-300'}`}>Step {n}</button>)}</div></div>
    {step===1 && <div className="mt-4 grid gap-3 md:grid-cols-2"><input value={title} onChange={e=>setTitle(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"/><input value={topic} onChange={e=>setTopic(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"/><select value={template} onChange={e=>setTemplate(e.target.value as GameTemplate)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{TEMPLATES.map(item => <option key={item}>{item}</option>)}</select><select value={level} onChange={e=>setLevel(e.target.value as GameLevel)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{LEVELS.map(item => <option key={item}>{item}</option>)}</select><button onClick={generate} className="md:col-span-2 rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950">{loading?'Đang generate...':'Generate với AI Game Dev'}</button></div>}
    {step===2 && <div className="mt-4 space-y-3">{questions.map((q,i)=><article key={q.id||i} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><input value={q.question} onChange={e=>setQuestions(questions.map((x,idx)=>idx===i?{...x,question:e.target.value}:x))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"/><p className="mt-2 text-xs text-slate-400">Đáp án: {String(q.correctAnswer)} — {q.explanation}</p></article>)}<button onClick={()=>setStep(3)} className="rounded-2xl border border-violet-300/50 px-4 py-2 text-xs font-black text-violet-100">Preview</button></div>}
    {step===3 && <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm font-black text-white">{current.question}</p><div className="mt-3 space-y-2">{(current.options||[]).map(o=><button key={o} onClick={()=>setAnswer(o)} className={`block w-full rounded-xl border px-3 py-2 text-left text-xs ${answer===o?'border-violet-200 text-violet-100':'border-slate-700 text-slate-300'}`}>{o}</button>)}</div>{answer && <p className="mt-3 text-xs text-slate-300">Đáp án đúng: {String(current.correctAnswer)} — {current.explanation}</p>}</div><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm font-black text-white">Publish</p><p className="mt-2 text-xs text-slate-400">{questions.length} câu hỏi · {template} · {level}</p><div className="mt-4 flex gap-2"><button onClick={save} className="rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100">Lưu Library</button><button onClick={exportJson} className="rounded-xl bg-violet-300 px-3 py-2 text-xs font-black text-slate-950">Export JSON</button></div></div></div>}
  </section>;
}
