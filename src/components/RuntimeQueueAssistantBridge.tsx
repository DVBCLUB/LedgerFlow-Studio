import { useEffect } from 'react';

type SessionItem = {
  id: string;
  title: string;
  kind?: string;
  status?: string;
  risk?: string;
  goal?: string;
};

type RuntimeSuggestion = {
  id: string;
  at: string;
  sourceSessionId: string;
  title: string;
  kind: string;
  risk: string;
  selectedSkill: string;
  nextAction: string;
  notes: string[];
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, payload: unknown) {
  localStorage.setItem(key, JSON.stringify(payload, null, 2));
}

function modeIsFast() {
  const mode = readLocal<{ mode?: string }>('ledgerflow_review_mode_v1', { mode: 'fast_secure' });
  return mode.mode !== 'strict_review';
}

function eligible(session: SessionItem, suggestions: RuntimeSuggestion[]) {
  if (!session.id || suggestions.some((item) => item.sourceSessionId === session.id)) return false;
  const status = (session.status || '').toLowerCase();
  return status.includes('queued') || status.includes('running') || status.includes('waiting') || status.includes('draft');
}

function skillFor(kind: string) {
  if (kind === 'CI Fix') return 'CI Doctor - Failure Triage';
  if (kind === 'Design') return 'AI Product Designer';
  if (kind === 'Data') return 'AI Data / Knowledge';
  return 'AI Code - Safe Patch Builder';
}

export default function RuntimeQueueAssistantBridge() {
  useEffect(() => {
    const sync = () => {
      if (!modeIsFast()) return;
      const sessions = readLocal<SessionItem[]>('ledgerflow_agent_sessions_v1', []);
      const suggestions = readLocal<RuntimeSuggestion[]>('ledgerflow_runtime_suggestions_v1', []);
      const next = sessions.find((session) => eligible(session, suggestions));
      if (!next) return;
      const kind = next.kind || 'Code';
      const item: RuntimeSuggestion = {
        id: `runtime-suggestion-${Date.now()}`,
        at: new Date().toLocaleString('vi-VN'),
        sourceSessionId: next.id,
        title: next.title || 'Runtime task',
        kind,
        risk: next.risk || 'UNKNOWN',
        selectedSkill: skillFor(kind),
        nextAction: 'Open Runtime tab, review suggestion, then send draft to Diff Review or Review Desk.',
        notes: [
          'Fast Secure keeps one final review at Review Desk.',
          'This bridge only prepares queue suggestions; it does not run terminal, browser, merge, or deploy.',
          'Security scans and backend guards still run before code leaves the app.'
        ]
      };
      writeLocal('ledgerflow_runtime_suggestions_v1', [item, ...suggestions].slice(0, 80));
      const events = readLocal<any[]>('ledgerflow_runtime_events_v1', []);
      writeLocal('ledgerflow_runtime_events_v1', [{ id: `runtime-event-${Date.now()}`, at: item.at, action: 'RUNTIME_SUGGESTION_CREATED', detail: `Prepared runtime suggestion for session ${next.id}.` }, ...events].slice(0, 120));
      window.dispatchEvent(new CustomEvent('ledgerflow-runtime-suggestion-created', { detail: item }));
    };

    sync();
    const interval = window.setInterval(sync, 5000);
    window.addEventListener('ledgerflow-review-desk-result', sync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('ledgerflow-review-desk-result', sync);
    };
  }, []);

  return null;
}
