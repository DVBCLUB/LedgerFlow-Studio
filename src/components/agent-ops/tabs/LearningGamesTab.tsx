import { useMemo, useState } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const GAMES_KEY = 'ledgerflow_learning_games_v1';

type GameArea = 'Tax' | 'Banking' | 'Fraud' | 'Runway' | 'Ops';
type GameStatus = 'Not Started' | 'Playing' | 'Reviewed' | 'Mastered';

type LearningGame = {
  id: string;
  title: string;
  area: GameArea;
  status: GameStatus;
  scenario: string;
  goal: string;
  score: number;
  lesson: string;
  createdAt: string;
  updatedAt: string;
};

const seedGames: LearningGame[] = [
  {
    id: 'game-tax-filing-simulator',
    title: 'Tax Filing Simulator',
    area: 'Tax',
    status: 'Not Started',
    scenario: 'Giả lập kiểm tra một bộ chứng từ trước khi kê khai thuế.',
    goal: 'Nhận diện thiếu hóa đơn, sai đối tượng, sai kỳ hoặc rủi ro thuế.',
    score: 0,
    lesson: 'Tách checklist thuế thành rule nhỏ, có bằng chứng trước khi duyệt.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'game-bank-reconciliation-race',
    title: 'Bank Reconciliation Race',
    area: 'Banking',
    status: 'Not Started',
    scenario: 'Giả lập đối chiếu sổ phụ ngân hàng với sổ kế toán.',
    goal: 'Tìm giao dịch lệch, phí ngân hàng, chuyển khoản treo, nhập trùng.',
    score: 0,
    lesson: 'Luôn đối chiếu theo ngày, số tiền, đối tượng và nội dung giao dịch.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'game-fraud-triangle-detective',
    title: 'Fraud Triangle Detective',
    area: 'Fraud',
    status: 'Not Started',
    scenario: 'Giả lập đọc một case có áp lực, cơ hội và hợp lý hóa gian lận.',
    goal: 'Tìm red flag và đề xuất control phòng ngừa.',
    score: 0,
    lesson: 'Rủi ro gian lận cần nhìn cả con người, quy trình và quyền truy cập.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'game-runway-survivor',
    title: 'Startup Runway Survivor',
    area: 'Runway',
    status: 'Not Started',
    scenario: 'Giả lập founder có ngân sách thấp, phải chọn việc nên làm trước.',
    goal: 'Ưu tiên việc tạo doanh thu, giảm burn, tránh phình scope.',
    score: 0,
    lesson: 'Mọi quyết định sản phẩm phải gắn với runway, evidence và next action.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const statuses: GameStatus[] = ['Not Started', 'Playing', 'Reviewed', 'Mastered'];
const areas: Array<'ALL' | GameArea> = ['ALL', 'Tax', 'Banking', 'Fraud', 'Runway', 'Ops'];

function statusTone(status: GameStatus) {
  if (status === 'Mastered') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Reviewed') return 'border-cyan-400/40 text-cyan-200';
  if (status === 'Playing') return 'border-amber-400/40 text-amber-200';
  return 'border-slate-700 text-slate-300';
}

function gameMarkdown(game: LearningGame) {
  return [
    `# Learning Game: ${game.title}`,
    '',
    `- Area: ${game.area}`,
    `- Status: ${game.status}`,
    `- Score: ${game.score}/100`,
    '',
    '## Scenario',
    game.scenario,
    '',
    '## Goal',
    game.goal,
    '',
    '## Lesson',
    game.lesson,
    '',
    '## Rule',
    'Simulation only. Do not post, file, send or book anything outside the app without founder approval.',
  ].join('\n');
}

export default function LearningGamesTab() {
  useLocalStorageVersion();
  const [filter, setFilter] = useState<'ALL' | GameArea>('ALL');
  const [title, setTitle] = useState('');
  const [area, setArea] = useState<GameArea>('Ops');
  const [scenario, setScenario] = useState('');
  const [goal, setGoal] = useState('');
  const [lesson, setLesson] = useState('');

  const games = readLocalStorageValue<LearningGame[]>(GAMES_KEY, seedGames);
  const visibleGames = useMemo(() => filter === 'ALL' ? games : games.filter((game) => game.area === filter), [filter, games]);
  const mastered = games.filter((game) => game.status === 'Mastered').length;
  const avgScore = games.length ? Math.round(games.reduce((sum, game) => sum + game.score, 0) / games.length) : 0;

  const saveGames = (next: LearningGame[]) => writeLocalStorageValue(GAMES_KEY, next);

  const addGame = () => {
    if (!title.trim() || !scenario.trim()) return;
    const now = new Date().toISOString();
    const game: LearningGame = {
      id: `game-${Date.now()}`,
      title: title.trim(),
      area,
      status: 'Not Started',
      scenario: scenario.trim(),
      goal: goal.trim() || 'Define a measurable learning outcome.',
      lesson: lesson.trim() || 'Capture the lesson after review.',
      score: 0,
      createdAt: now,
      updatedAt: now,
    };
    saveGames([game, ...games].slice(0, 200));
    appendAgentOpsAudit('LEARNING_GAME_CREATED', game.id, `${game.area} · ${game.title}`);
    setTitle('');
    setScenario('');
    setGoal('');
    setLesson('');
  };

  const updateGame = (game: LearningGame, patch: Partial<LearningGame>) => {
    const next = games.map((item) => item.id === game.id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
    saveGames(next);
    appendAgentOpsAudit('LEARNING_GAME_UPDATED', game.id, `${game.title} updated`);
  };

  const copyGame = async (game: LearningGame) => {
    await navigator.clipboard.writeText(gameMarkdown(game));
    appendAgentOpsAudit('LEARNING_GAME_COPIED', game.id, game.title);
  };

  return (
    <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Learning sandbox</p>
          <h3 className="mt-1 text-xl font-black text-white">Learning Games</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Game mô phỏng cho kế toán, kiểm soát, runway và vận hành. Chỉ học và sandbox, không hành động external.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-violet-300/40 px-3 py-1 text-violet-100">{games.length} games</span>
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{mastered} mastered</span>
          <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-cyan-100">avg {avgScore}/100</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên game / tình huống học" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <select value={area} onChange={(event) => setArea(event.target.value as GameArea)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-violet-300">
          {areas.filter((item) => item !== 'ALL').map((item) => <option key={item}>{item}</option>)}
        </select>
        <textarea value={scenario} onChange={(event) => setScenario(event.target.value)} placeholder="Scenario" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300 md:col-span-2" />
        <input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Goal" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <input value={lesson} onChange={(event) => setLesson(event.target.value)} placeholder="Lesson dự kiến" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <button onClick={addGame} className="rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/10 md:col-span-2">Thêm game</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {areas.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === item ? 'border-violet-300 text-violet-100' : 'border-slate-700 text-slate-300'}`}>{item}</button>)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleGames.map((game) => (
          <article key={game.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{game.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{game.area} · {new Date(game.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(game.status)}`}>{game.status}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{game.scenario}</p>
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
              <p>Goal: {game.goal}</p>
              <p className="mt-1">Lesson: {game.lesson}</p>
              <p className="mt-1 text-violet-200">Score: {game.score}/100</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status} onClick={() => updateGame(game, { status })} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-violet-300 hover:text-violet-100">{status}</button>)}
              {[25, 50, 75, 100].map((score) => <button key={score} onClick={() => updateGame(game, { score })} className="rounded-xl border border-cyan-300/40 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">{score}</button>)}
              <button onClick={() => copyGame(game)} className="rounded-xl border border-violet-300/50 px-3 py-2 text-[11px] font-black text-violet-100 hover:bg-violet-400/10">Copy game</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
