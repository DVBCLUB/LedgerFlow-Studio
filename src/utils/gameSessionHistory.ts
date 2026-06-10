export type GameSession = {
  id: string;
  gameId: string;
  gameLabel: string;
  playedAt: string;
  score: number;
  verdict: string;
  note?: string;
};

export const GAME_SESSION_HISTORY_KEY = 'ledgerflow-game-session-history-v1';

export const readGameSessions = (): GameSession[] => {
  try {
    const raw = localStorage.getItem(GAME_SESSION_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeGameSessions = (sessions: GameSession[]) => {
  localStorage.setItem(GAME_SESSION_HISTORY_KEY, JSON.stringify(sessions));
};

export const addGameSession = (session: Omit<GameSession, 'id' | 'playedAt'>) => {
  const next: GameSession = {
    ...session,
    id: `${session.gameId}-${Date.now()}`,
    playedAt: new Date().toISOString()
  };
  const sessions = [next, ...readGameSessions()].slice(0, 300);
  writeGameSessions(sessions);
  return sessions;
};

export const clearGameSessions = () => writeGameSessions([]);

export const summarizeGameSessions = (sessions: GameSession[]) => {
  const grouped = sessions.reduce<Record<string, GameSession[]>>((acc, session) => {
    acc[session.gameId] = acc[session.gameId] || [];
    acc[session.gameId].push(session);
    return acc;
  }, {});

  return Object.entries(grouped).map(([gameId, list]) => {
    const bestScore = Math.max(...list.map((item) => Number(item.score || 0)));
    const averageScore = list.reduce((sum, item) => sum + Number(item.score || 0), 0) / Math.max(list.length, 1);
    const latest = [...list].sort((a, b) => b.playedAt.localeCompare(a.playedAt))[0];
    return {
      gameId,
      gameLabel: latest?.gameLabel || gameId,
      attempts: list.length,
      bestScore,
      averageScore,
      latestVerdict: latest?.verdict || 'Chưa có verdict',
      latestPlayedAt: latest?.playedAt || ''
    };
  }).sort((a, b) => a.averageScore - b.averageScore);
};
