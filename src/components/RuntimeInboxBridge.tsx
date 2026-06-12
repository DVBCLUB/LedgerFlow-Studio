import { useEffect } from 'react';

type AgentSession = {
  id: string;
  title: string;
  kind: 'CI Fix' | 'Code';
  status: 'Queued' | 'Running' | 'Waiting Approval' | 'Blocked' | 'Done';
  risk: 'MEDIUM' | 'HIGH';
  goal: string;
  createdAt: string;
  currentStepId: string;
  steps: Array<{ id: string; title: string; owner: string; tool: string; status: string; note: string }>;
};

type SessionEvent = { id: string; at: string; sessionId: string; action: string; detail: string };

type CiPackage = {
  repo?: string;
  branch?: string;
  prNumber?: number | null;
  runUrl?: string | null;
  workflowName?: string | null;
  conclusion?: string | null;
  prompt?: string;
};

const SESSIONS_KEY = 'ledgerflow_agent_sessions_v1';
const EVENTS_KEY = 'ledgerflow_agent_session_events_v1';
const CI_FIX_KEY = 'ledgerflow_ci_fix_package_v1';
const RUNTIME_INBOX_KEY = 'ledgerflow_runtime_inbox_seen_v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeEvent(sessionId: string, action: string, detail: string) {
  const events = readJson<SessionEvent[]>(EVENTS_KEY, []);
  const next = [{ id: `event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), sessionId, action, detail }, ...events].slice(0, 160);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
}

function makeCiSession(pkg: CiPackage): AgentSession {
  const title = `Fix CI${pkg.prNumber ? ` for PR #${pkg.prNumber}` : ''}`;
  const goal = [
    pkg.prompt || 'Phân tích lỗi CI và tạo patch sửa nhỏ nhất.',
    pkg.repo ? `Repo: ${pkg.repo}` : '',
    pkg.branch ? `Branch: ${pkg.branch}` : '',
    pkg.workflowName ? `Workflow: ${pkg.workflowName}` : '',
    pkg.conclusion ? `Conclusion: ${pkg.conclusion}` : '',
    pkg.runUrl ? `Run: ${pkg.runUrl}` : ''
  ].filter(Boolean).join('\n');

  return {
    id: `session-ci-${Date.now()}`,
    title,
    kind: 'CI Fix',
    status: 'Queued',
    risk: 'HIGH',
    goal,
    createdAt: new Date().toLocaleString('vi-VN'),
    currentStepId: 'context',
    steps: [
      { id: 'context', title: 'Gom lỗi CI', owner: 'CI Doctor', tool: 'CI Runs / CI Recovery', status: 'Todo', note: 'Đọc failed run/job/step đã được mask và gom context lỗi.' },
      { id: 'plan', title: 'Lập patch fix', owner: 'AI Code / Dev Agent', tool: 'Runtime / Skills', status: 'Todo', note: 'Đề xuất patch nhỏ nhất, không chạy shell thật.' },
      { id: 'diff', title: 'Diff Review', owner: 'AI Auditor', tool: 'Diff Review', status: 'Todo', note: 'Đưa patch nháp qua diff và secret guard.' },
      { id: 'review', title: 'Review Desk', owner: 'Founder', tool: 'Review Desk', status: 'Todo', note: 'Một lớp approve chính trước khi tạo Draft PR.' },
      { id: 'ci', title: 'Theo dõi lại CI', owner: 'CI Doctor', tool: 'CI Runs / Build Monitor', status: 'Todo', note: 'Kiểm tra lại sau khi PR fix được tạo.' }
    ]
  };
}

export default function RuntimeInboxBridge() {
  useEffect(() => {
    const sync = () => {
      const pkg = readJson<CiPackage | null>(CI_FIX_KEY, null);
      if (!pkg) return;

      const fingerprint = JSON.stringify({ repo: pkg.repo, branch: pkg.branch, prNumber: pkg.prNumber, runUrl: pkg.runUrl, workflowName: pkg.workflowName, conclusion: pkg.conclusion });
      const seen = readJson<string[]>(RUNTIME_INBOX_KEY, []);
      if (seen.includes(fingerprint)) return;

      const sessions = readJson<AgentSession[]>(SESSIONS_KEY, []);
      const session = makeCiSession(pkg);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify([session, ...sessions]));
      localStorage.setItem(RUNTIME_INBOX_KEY, JSON.stringify([fingerprint, ...seen].slice(0, 80)));
      writeEvent(session.id, 'RUNTIME_INBOX_CI_FIX_IMPORTED', 'Runtime tự nhận CI fix package thành session mới theo Fast Secure.');
      window.dispatchEvent(new CustomEvent('ledgerflow-runtime-inbox-synced', { detail: { sessionId: session.id } }));
    };

    sync();
    const timer = window.setInterval(sync, 2500);
    window.addEventListener('ledgerflow-ci-fix-package-created', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ledgerflow-ci-fix-package-created', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return null;
}
