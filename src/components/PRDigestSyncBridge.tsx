import { useEffect, useRef } from 'react';

type ReviewDeskResult = {
  repo?: string;
  prNumber?: number;
  pullNumber?: number;
  number?: number;
  branch?: string;
  prUrl?: string;
  pullRequest?: {
    number?: number;
    htmlUrl?: string;
  };
};

type PrDigestEvent = {
  id: string;
  at: string;
  action: string;
  detail: string;
  repo?: string;
  prNumber?: number;
};

const REVIEW_RESULT_KEY = 'ledgerflow_review_desk_last_result_v1';
const DIGEST_KEY = 'ledgerflow_pr_digest_last_v1';
const EVENTS_KEY = 'ledgerflow_pr_digest_events_v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function extractPrNumber(result: ReviewDeskResult | null): number | null {
  if (!result) return null;
  return result.prNumber ?? result.pullNumber ?? result.number ?? result.pullRequest?.number ?? null;
}

function normalizeReviewResult(raw: unknown): ReviewDeskResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as { result?: ReviewDeskResult; repo?: string; prNumber?: number; pullRequest?: { number?: number; htmlUrl?: string } };
  if (value.result) return { ...value.result, repo: value.result.repo ?? value.repo };
  return value as ReviewDeskResult;
}

function pushEvent(event: Omit<PrDigestEvent, 'id' | 'at'>) {
  const events = readJson<PrDigestEvent[]>(EVENTS_KEY, []);
  const next: PrDigestEvent = {
    id: `pr-digest-${Date.now()}`,
    at: new Date().toLocaleString('vi-VN'),
    ...event
  };
  localStorage.setItem(EVENTS_KEY, JSON.stringify([next, ...events].slice(0, 120)));
}

export default function PRDigestSyncBridge() {
  const lastKeyRef = useRef('');

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const rawResult = readJson<unknown>(REVIEW_RESULT_KEY, null);
      const result = normalizeReviewResult(rawResult);
      const repo = result?.repo || 'DVBCLUB/LedgerFlow-Studio';
      const prNumber = extractPrNumber(result);
      if (!repo || !prNumber) return;

      const syncKey = `${repo}#${prNumber}`;
      const existing = readJson<{ repo?: string; prNumber?: number; syncedAt?: string } | null>(DIGEST_KEY, null);
      if (lastKeyRef.current === syncKey || (existing?.repo === repo && existing?.prNumber === prNumber)) return;

      try {
        const response = await fetch(`/api/integrations/github/prs/${prNumber}/digest?repo=${encodeURIComponent(repo)}`);
        const payload = await response.json();
        if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Không đọc được PR digest.');
        if (cancelled) return;

        const digest = payload?.result ?? payload;
        localStorage.setItem(DIGEST_KEY, JSON.stringify({
          repo,
          prNumber,
          source: 'Review Desk auto-sync',
          syncedAt: new Date().toLocaleString('vi-VN'),
          digest
        }));
        lastKeyRef.current = syncKey;
        pushEvent({ action: 'PR_DIGEST_SYNCED', detail: `Đã tự đồng bộ PR digest cho PR #${prNumber}.`, repo, prNumber });
        window.dispatchEvent(new CustomEvent('ledgerflow-pr-digest-synced', { detail: { repo, prNumber, digest } }));
      } catch (error) {
        if (cancelled) return;
        pushEvent({ action: 'PR_DIGEST_SYNC_FAILED', detail: error instanceof Error ? error.message : 'Không đọc được PR digest.', repo, prNumber });
      }
    };

    sync();
    const interval = window.setInterval(sync, 5000);
    const onReviewResult = () => {
      lastKeyRef.current = '';
      sync();
    };
    window.addEventListener('ledgerflow-review-desk-result', onReviewResult);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('ledgerflow-review-desk-result', onReviewResult);
    };
  }, []);

  return null;
}
