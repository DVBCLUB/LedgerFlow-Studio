import { useEffect } from 'react';
import type { PatchItem } from '../../types/agentOps';

type PatchEvent = {
  id: string;
  at: string;
  patchId: string;
  action: string;
  detail: string;
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeBranch(value?: string) {
  const name = value?.trim() || `fast-review-${Date.now()}`;
  return name.startsWith('ai/') ? name : `ai/${name}`;
}

function addEvent(patchId: string, action: string, detail: string) {
  const events = readLocal<PatchEvent[]>('ledgerflow_sandbox_patch_events_v1', []);
  writeLocal('ledgerflow_sandbox_patch_events_v1', [
    { id: `fast-route-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), patchId, action, detail },
    ...events
  ].slice(0, 160));
}

export function routeReadyFastReviewPatches() {
  const patches = readLocal<PatchItem[]>('ledgerflow_sandbox_patches_v1', []);
  if (!patches.length) return;

  const routedIds = readLocal<string[]>('ledgerflow_sandbox_routed_patch_ids_v1', []);
  const routed = new Set(routedIds);
  let changed = false;

  const next = patches.map((patch) => {
    if (patch.status !== 'Ready for Review Desk' || routed.has(patch.id)) return patch;
    if (patch.risk === 'BLOCKED') return patch;

    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
      sourceSandboxPatchId: patch.id,
      title: patch.title,
      repo: patch.repo,
      branchName: normalizeBranch(patch.branchName),
      summary: `${patch.summary ?? ''}\n\nFast Secure route: Review Desk is the single approval gate.\nPatch: ${patch.id}\nRisk: ${patch.risk ?? 'MEDIUM'}`,
      filePath: patch.filePath ?? patch.path ?? '',
      fileContent: patch.fileContent ?? ''
    }));

    routed.add(patch.id);
    changed = true;
    addEvent(patch.id, 'FAST_REVIEW_ROUTE', 'Ready patch was sent to Review Desk for one-step approval.');
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    return { ...patch, status: 'Sent' };
  });

  if (changed) {
    writeLocal('ledgerflow_sandbox_patches_v1', next);
    writeLocal('ledgerflow_sandbox_routed_patch_ids_v1', Array.from(routed));
  }
}

export function useFastReviewRouting() {
  useEffect(() => {
    routeReadyFastReviewPatches();
    const timer = window.setInterval(routeReadyFastReviewPatches, 1200);
    const onChanged = () => routeReadyFastReviewPatches();
    window.addEventListener('ledgerflow-sandbox-patches-changed', onChanged);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ledgerflow-sandbox-patches-changed', onChanged);
    };
  }, []);
}
