import { useEffect } from 'react';

type ExposureLevel = 'Clear' | 'Warning' | 'Blocked';

type ExposureFinding = {
  id: string;
  source: string;
  key: string;
  level: ExposureLevel;
  label: string;
  sample: string;
  at: string;
};

type ExposureReport = {
  id: string;
  at: string;
  mode: 'fast_secure';
  level: ExposureLevel;
  findings: ExposureFinding[];
  checkedKeys: string[];
  notes: string[];
};

const REPORT_KEY = 'ledgerflow_secret_exposure_report_v1';
const EVENT_KEY = 'ledgerflow_secret_exposure_events_v1';

const checkedKeys = [
  'ledgerflow_review_desk_prefill_v1',
  'ledgerflow_review_desk_multifile_prefill_v1',
  'ledgerflow_sandbox_patch_workspace_v1',
  'ledgerflow_patch_diff_review_bundles_v1',
  'ledgerflow_knowledge_library_v1',
  'ledgerflow_project_memory_v1',
  'ledgerflow_agent_sessions_v1'
];

const blockers = [
  /-----BEGIN\s+(RSA|OPENSSH|EC|DSA|PRIVATE)\s+KEY-----/i,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /(?:(?:refresh|access|id)_token|client_secret|private_key|api_key)\s*[:=]\s*["'][^"']{12,}["']/i
];

const warnings = [
  /\.env(\.|$|\/|\\)/i,
  /id_rsa|id_ed25519|\.pem|\.p12|\.key/i,
  /token|secret|password|credential|apikey|api_key/i,
  /firebase|github|openai|anthropic|gemini|groq|openrouter/i
];

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return localStorage.getItem(key);
  }
}

function stringifyPayload(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2).slice(0, 250000);
  } catch {
    return String(payload ?? '').slice(0, 250000);
  }
}

function maskSample(value: string) {
  return value
    .replace(/(github_pat_)[A-Za-z0-9_]+/g, '$1***MASKED***')
    .replace(/(ghp_)[A-Za-z0-9_]+/g, '$1***MASKED***')
    .replace(/(sk-)[A-Za-z0-9_-]+/g, '$1***MASKED***')
    .replace(/(AIza)[0-9A-Za-z_-]+/g, '$1***MASKED***')
    .replace(/(AKIA)[0-9A-Z]+/g, '$1***MASKED***')
    .replace(/(["']?(?:refresh|access|id)_token["']?\s*[:=]\s*["'])[^"']+(["'])/gi, '$1***MASKED***$2')
    .replace(/(["']?(?:client_secret|private_key|api_key)["']?\s*[:=]\s*["'])[^"']+(["'])/gi, '$1***MASKED***$2')
    .slice(0, 260);
}

function pushEvent(event: Omit<ExposureFinding, 'id' | 'at'>) {
  try {
    const current = JSON.parse(localStorage.getItem(EVENT_KEY) || '[]') as ExposureFinding[];
    const next: ExposureFinding = {
      ...event,
      id: `secret-event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toLocaleString('vi-VN')
    };
    localStorage.setItem(EVENT_KEY, JSON.stringify([next, ...current].slice(0, 200)));
    window.dispatchEvent(new CustomEvent('ledgerflow-secret-exposure-updated', { detail: next }));
  } catch {
    // Do not break the app because of audit logging.
  }
}

function buildReport(): ExposureReport {
  const findings: ExposureFinding[] = [];
  const at = new Date().toLocaleString('vi-VN');

  for (const key of checkedKeys) {
    const payload = readJson(key);
    if (!payload) continue;
    const text = stringifyPayload(payload);
    const lower = text.toLowerCase();

    blockers.forEach((pattern, index) => {
      const match = text.match(pattern);
      if (!match) return;
      findings.push({
        id: `finding-blocked-${key}-${index}`,
        source: 'SecretExposureGuardBridge',
        key,
        level: 'Blocked',
        label: 'Potential live secret detected',
        sample: maskSample(match[0]),
        at
      });
    });

    warnings.forEach((pattern, index) => {
      const match = lower.match(pattern);
      if (!match) return;
      findings.push({
        id: `finding-warning-${key}-${index}`,
        source: 'SecretExposureGuardBridge',
        key,
        level: 'Warning',
        label: 'Sensitive keyword or path detected',
        sample: maskSample(text.slice(Math.max(0, (match.index ?? 0) - 80), (match.index ?? 0) + 180)),
        at
      });
    });
  }

  const hasBlocked = findings.some((finding) => finding.level === 'Blocked');
  const hasWarning = findings.some((finding) => finding.level === 'Warning');

  return {
    id: `secret-report-${Date.now()}`,
    at,
    mode: 'fast_secure',
    level: hasBlocked ? 'Blocked' : hasWarning ? 'Warning' : 'Clear',
    findings,
    checkedKeys,
    notes: [
      'Fast Secure keeps AI coding convenient, but blocks likely live secrets before Review Desk/GitHub.',
      'Only masked samples are stored in this report.',
      'GitHub token and provider keys must stay backend-only or in local environment files that are never committed.'
    ]
  };
}

function syncReport() {
  const report = buildReport();
  const previousRaw = localStorage.getItem(REPORT_KEY);
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));

  if (report.level !== 'Clear') {
    const previous = previousRaw ? JSON.parse(previousRaw) as ExposureReport : null;
    const previousSignature = previous?.findings.map((finding) => `${finding.level}:${finding.key}:${finding.label}:${finding.sample}`).join('|');
    const nextSignature = report.findings.map((finding) => `${finding.level}:${finding.key}:${finding.label}:${finding.sample}`).join('|');
    if (previousSignature !== nextSignature) {
      for (const finding of report.findings.slice(0, 10)) {
        pushEvent({
          source: finding.source,
          key: finding.key,
          level: finding.level,
          label: finding.label,
          sample: finding.sample
        });
      }
    }
  }

  window.dispatchEvent(new CustomEvent('ledgerflow-secret-exposure-report', { detail: report }));
}

export default function SecretExposureGuardBridge() {
  useEffect(() => {
    syncReport();
    const timer = window.setInterval(syncReport, 2500);
    const onStorage = () => syncReport();
    window.addEventListener('storage', onStorage);
    window.addEventListener('ledgerflow-review-desk-prefill', syncReport as EventListener);
    window.addEventListener('ledgerflow-build-monitor-sync', syncReport as EventListener);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ledgerflow-review-desk-prefill', syncReport as EventListener);
      window.removeEventListener('ledgerflow-build-monitor-sync', syncReport as EventListener);
    };
  }, []);

  return null;
}
