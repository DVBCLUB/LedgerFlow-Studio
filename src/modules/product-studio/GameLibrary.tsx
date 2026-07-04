import React, { useMemo, useState } from 'react';

type GameStatus = 'Idea' | 'Prototype' | 'Playtest' | 'Ready' | 'Paused';
type GameType = 'Audit' | 'Finance' | 'Product' | 'Document' | 'Accounting';

type GameItem = {
  id: string;
  title: string;
  type: GameType;
  learner: string;
  objective: string;
  mechanic: string;
  winCondition: string;
  dataset: string;
  nextBuildStep: string;
  status: GameStatus;
  learningValue: number;
  buildCost: number;
  replayValue: number;
};

const STORAGE_KEY = 'ledgerflow-game-library-v1';

const defaultGames: GameItem[] = [
  {
    id: 'audit-red-flag-game',
    title: 'Audit Red Flag Game',
    type: 'Audit',
    learner: 'Kế toán / kiểm toán viên mới',
    objective: 'Nhìn case đa ngành và phát hiện rủi ro, chứng từ cần kiểm tra.',
    mechanic: 'Chọn red flags + chứng từ đúng, hệ thống chấm điểm và giải thích.',
    winCondition: 'Đạt trên 75 điểm và không bỏ sót red flag high-risk.',
    dataset: 'Multi-Industry Case Bank',
    nextBuildStep: 'Thêm level theo ngành và lưu lịch sử điểm.',
    status: 'Ready',
    learningValue: 9,
    buildCost: 3,
    replayValue: 7
  },
  {
    id: 'cash-runway-game',
    title: 'Cash Runway Game',
    type: 'Finance',
    learner: 'Solo founder / chủ doanh nghiệp nhỏ',
    objective: 'Hiểu burn rate, runway, tool budget và quyết định cắt chi phí.',
    mechanic: 'Mỗi vòng chọn giữ/hủy tool, tăng giá, chạy pilot hoặc giảm scope.',
    winCondition: 'Runway trên 6 tháng và vẫn giữ được ít nhất 1 paid signal.',
    dataset: 'Finance Lab + Tool Budget',
    nextBuildStep: 'Tạo board 6 tháng với event ngẫu nhiên: refund, tool tăng giá, khách pilot.',
    status: 'Prototype',
    learningValue: 9,
    buildCost: 5,
    replayValue: 8
  },
  {
    id: 'pmf-decision-game',
    title: 'Product-Market Fit Decision Game',
    type: 'Product',
    learner: 'Founder dùng AI để build sản phẩm',
    objective: 'Tập ra quyết định BUILD / HOLD / KILL dựa trên lead, survey, content và paid signal.',
    mechanic: 'Người chơi đọc tín hiệu thị trường rồi chọn quyết định; bị phạt nếu build quá sớm.',
    winCondition: 'Chọn đúng quyết định theo validation score và không vượt burn risk.',
    dataset: 'Lead Board + Survey + A/B Simulation + Moat Tracker',
    nextBuildStep: 'Tạo 10 scenario từ localStorage lab hiện có.',
    status: 'Idea',
    learningValue: 8,
    buildCost: 4,
    replayValue: 8
  },
  {
    id: 'document-matching-game',
    title: 'Document Matching Game',
    type: 'Document',
    learner: 'Kế toán chứng từ / trợ lý kế toán',
    objective: 'Ghép nghiệp vụ với bộ chứng từ đúng và phát hiện thiếu chứng từ.',
    mechanic: 'Kéo/thả hoặc chọn chứng từ phù hợp cho từng nghiệp vụ.',
    winCondition: 'Ghép đúng 90% chứng từ và nêu được chứng từ còn thiếu.',
    dataset: 'Case Bank + Accounting documents',
    nextBuildStep: 'Thêm list chứng từ nhiễu và giải thích vì sao sai.',
    status: 'Idea',
    learningValue: 8,
    buildCost: 4,
    replayValue: 7
  },
  {
    id: 'cost-flow-game',
    title: 'Cost Flow Game',
    type: 'Accounting',
    learner: 'Kế toán sản xuất / xây dựng / dự án',
    objective: 'Hiểu luồng chi phí từ mua hàng, nhập kho, xuất dùng, phân bổ, tính giá thành.',
    mechanic: 'Chọn bước xử lý đúng cho từng chi phí; sai bước làm lệch giá vốn/lợi nhuận.',
    winCondition: 'Tính đúng cost flow và giải thích được điểm kiểm soát.',
    dataset: 'Multi-industry accounting cases',
    nextBuildStep: 'Tạo level thương mại, sản xuất, dịch vụ, xây dựng.',
    status: 'Idea',
    learningValue: 9,
    buildCost: 6,
    replayValue: 7
  }
];

const readGames = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultGames;
    return Array.isArray(parsed) ? parsed : defaultGames;
  } catch {
    return defaultGames;
  }
};

const saveGames = (games: GameItem[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
const scoreGame = (game: GameItem) => Math.max(0, Math.min(100, Math.round(game.learningValue * 5 + game.replayValue * 4 - game.buildCost * 3 + (game.status === 'Ready' ? 20 : game.status === 'Playtest' ? 12 : game.status === 'Prototype' ? 8 : 0))));

export default function GameLibrary() {
  const [games, setGames] = useState<GameItem[]>(readGames);
  const [type, setType] = useState<'All' | GameType>('All');

  const visibleGames = useMemo(() => type === 'All' ? games : games.filter((game) => game.type === type), [games, type]);
  const summary = useMemo(() => {
    const ready = games.filter((game) => game.status === 'Ready').length;
    const prototype = games.filter((game) => ['Prototype', 'Playtest'].includes(game.status)).length;
    const avgScore = Math.round(games.reduce((sum, game) => sum + scoreGame(game), 0) / Math.max(games.length, 1));
    const nextGame = [...games].sort((a, b) => scoreGame(b) - scoreGame(a))[0];
    return { ready, prototype, avgScore, nextGame };
  }, [games]);

  const updateGame = (id: string, patch: Partial<GameItem>) => {
    const next = games.map((game) => game.id === id ? { ...game, ...patch } : game);
    setGames(next);
    saveGames(next);
  };

  const reset = () => {
    setGames(defaultGames);
    saveGames(defaultGames);
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Game Library</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Thư viện mini-game học kế toán, kiểm toán và founder finance</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">Biến Case Bank, Finance Lab, Lead Board và Simulation thành game học 2D đơn giản trước khi nghĩ tới game engine phức tạp.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Games</p><p className="mt-2 text-3xl font-black text-text-primary">{games.length}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Ready</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.ready}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Prototype/Playtest</p><p className="mt-2 text-3xl font-black text-cyan-300">{summary.prototype}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Avg game score</p><p className="mt-2 text-3xl font-black text-amber-300">{summary.avgScore}</p></div>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-300">Next best game</p>
            <h3 className="mt-2 text-lg font-black text-text-primary">{summary.nextGame?.title}</h3>
            <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{summary.nextGame?.nextBuildStep}</p>
          </div>
          <select value={type} onChange={(event) => setType(event.target.value as 'All' | GameType)} className="rounded-xl border border-border-primary bg-slate-950 px-3 py-3 text-xs font-bold text-text-primary">
            <option>All</option><option>Audit</option><option>Finance</option><option>Product</option><option>Document</option><option>Accounting</option>
          </select>
          <button onClick={reset} className="rounded-xl border border-border-secondary px-4 py-3 text-xs font-black text-text-secondary hover:border-emerald-400">Reset demo</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleGames.map((game) => {
          const score = scoreGame(game);
          const verdict = score >= 75 ? 'BUILD THIS GAME' : score >= 55 ? 'PROTOTYPE / TEST' : 'HOLD / REDUCE SCOPE';
          return (
            <div key={game.id} className="rounded-3xl border border-border-primary bg-bg-surface/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-cyan-300">{game.type}</p>
                  <h3 className="mt-1 text-lg font-black text-text-primary">{game.title}</h3>
                </div>
                <div className="rounded-2xl border border-border-primary bg-slate-950 px-4 py-3 text-right">
                  <p className="text-[10px] font-black uppercase text-text-tertiary">Game score</p>
                  <p className="text-2xl font-black text-emerald-300">{score}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-[10px] font-black uppercase text-text-tertiary">Status
                  <select value={game.status} onChange={(event) => updateGame(game.id, { status: event.target.value as GameStatus })} className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-bold text-text-primary">
                    <option>Idea</option><option>Prototype</option><option>Playtest</option><option>Ready</option><option>Paused</option>
                  </select>
                </label>
                <div className="rounded-xl border border-border-primary bg-slate-950 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Verdict</p><p className="mt-1 text-xs font-black text-amber-300">{verdict}</p></div>
              </div>

              <div className="mt-4 space-y-3 text-xs font-semibold leading-6 text-text-secondary">
                <p><span className="font-black text-text-primary">Learner:</span> {game.learner}</p>
                <p><span className="font-black text-text-primary">Objective:</span> {game.objective}</p>
                <p><span className="font-black text-text-primary">Mechanic:</span> {game.mechanic}</p>
                <p><span className="font-black text-text-primary">Win condition:</span> {game.winCondition}</p>
                <p><span className="font-black text-text-primary">Dataset:</span> {game.dataset}</p>
              </div>

              <label className="mt-4 block text-[10px] font-black uppercase text-text-tertiary">Next build step
                <textarea value={game.nextBuildStep} onChange={(event) => updateGame(game.id, { nextBuildStep: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs normal-case text-slate-200" />
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}
