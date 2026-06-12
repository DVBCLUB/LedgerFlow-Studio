import { useEffect, useRef } from 'react';

type ReviewDeskResult = {
  repo?: string;
  branch?: string;
  prNumber?: number;
  prUrl?: string;
  commitSha?: string;
  at?: string;
};

type BuildRecord = {
  id?: string;
  repo?: string;
  branch?: string;
  status?: string;
  workflowRunUrl?: string;
  artifactName?: string;
  artifactUrl?: string;
  notes?: string;
};

type ReleaseDraft = {
  id: string;
  version: string;
  source: string;
  status: 'Draft' | 'Building' | 'Ready for QA' | 'Failed';
  repo: string;
  branch: string;
  prNumber?: number | null;
  prUrl?: string | null;
  commitSha?: string | null;
  workflowRunUrl?: string | null;
  artifactName?: string | null;
  artifactUrl?: string | null;
  changelog: string;
  qaNotes: string;
  rollbackPlan: string;
  updatedAt: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeReviewResult(value: unknown): ReviewDeskResult | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const nested = data.result && typeof data.result === 'object' ? data.result as Record<string, unknown> : data;
  const pullRequest = nested.pullRequest && typeof nested.pullRequest === 'object' ? nested.pullRequest as Record<string, unknown> : {};
  const repo = String(nested.repo ?? data.repo ?? 'DVBCLUB/LedgerFlow-Studio');
  const branch = String(nested.branch ?? data.branch ?? '');
  const prNumber = Number(pullRequest.number ?? nested.prNumber ?? data.prNumber ?? 0) || undefined;
  const prUrl = String(pullRequest.htmlUrl ?? nested.prUrl ?? data.prUrl ?? '');
  const commitSha = String(nested.commitSha ?? data.commitSha ?? '');
  if (!branch && !prNumber) return null;
  return { repo, branch, prNumber, prUrl, commitSha, at: String(data.at ?? nested.at ?? '') };
}

function findBuildFor(review: ReviewDeskResult, builds: BuildRecord[]) {
  return builds.find((build) => build.branch && build.branch === review.branch) ?? builds[0];
}

function statusFromBuild(build?: BuildRecord): ReleaseDraft['status'] {
  if (!build?.status) return 'Draft';
  if (build.status === 'Success') return 'Ready for QA';
  if (build.status === 'Failed') return 'Failed';
  if (build.status === 'Running' || build.status === 'Queued') return 'Building';
  return 'Draft';
}

function makeReleaseDraft(review: ReviewDeskResult, build?: BuildRecord): ReleaseDraft {
  const now = new Date().toLocaleString('vi-VN');
  const safeBranch = review.branch || 'ai/unknown';
  const version = `ai-${safeBranch.replace(/^ai\//, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 32) || 'draft'}`;
  return {
    id: `release-${review.prNumber ?? safeBranch}-${review.commitSha ?? ''}`.replace(/[^a-zA-Z0-9-]/g, '-'),
    version,
    source: 'Review Desk / Build Monitor',
    status: statusFromBuild(build),
    repo: review.repo || build?.repo || 'DVBCLUB/LedgerFlow-Studio',
    branch: safeBranch,
    prNumber: review.prNumber ?? null,
    prUrl: review.prUrl || null,
    commitSha: review.commitSha || null,
    workflowRunUrl: build?.workflowRunUrl || null,
    artifactName: build?.artifactName || 'LedgerFlow-Hub-Windows-Download',
    artifactUrl: build?.artifactUrl || null,
    changelog: `Draft release tạo từ PR #${review.prNumber ?? '?'} trên branch ${safeBranch}.`,
    qaNotes: build?.notes || 'Chờ kiểm tra build/artifact và smoke test trước khi phát hành.',
    rollbackPlan: `Nếu bản từ ${safeBranch} lỗi, tạo revert/rollback PR từ Rollback Center.`,
    updatedAt: now
  };
}

export default function ReleaseDraftSyncBridge() {
  const lastKeyRef = useRef('');

  useEffect(() => {
    const sync = () => {
      const review = normalizeReviewResult(readJson<unknown>('ledgerflow_review_desk_last_result_v1', null));
      if (!review) return;
      const builds = readJson<BuildRecord[]>('ledgerflow_build_monitor_v1', []);
      const build = findBuildFor(review, builds);
      const draft = makeReleaseDraft(review, build);
      const key = `${draft.id}:${draft.status}:${draft.workflowRunUrl ?? ''}:${draft.artifactUrl ?? ''}`;
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      const current = readJson<ReleaseDraft[]>('ledgerflow_release_artifacts_v1', []);
      const next = [draft, ...current.filter((item) => item.id !== draft.id)].slice(0, 80);
      writeJson('ledgerflow_release_artifacts_v1', next);

      const events = readJson<unknown[]>('ledgerflow_release_events_v1', []);
      writeJson('ledgerflow_release_events_v1', [
        {
          id: `release-sync-${Date.now()}`,
          at: new Date().toLocaleString('vi-VN'),
          action: 'RELEASE_DRAFT_SYNCED',
          detail: `Đồng bộ release draft từ ${draft.branch} / PR #${draft.prNumber ?? '?'}.`,
          releaseId: draft.id
        },
        ...events
      ].slice(0, 120));
      window.dispatchEvent(new CustomEvent('ledgerflow-release-draft-synced', { detail: draft }));
    };

    sync();
    const timer = window.setInterval(sync, 2500);
    window.addEventListener('ledgerflow-build-monitor-sync', sync);
    window.addEventListener('ledgerflow-review-desk-result', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ledgerflow-build-monitor-sync', sync);
      window.removeEventListener('ledgerflow-review-desk-result', sync);
    };
  }, []);

  return null;
}
