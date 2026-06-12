import { useEffect } from 'react';

type WorkKind = 'Q&A' | 'Code' | 'Design' | 'Data' | 'Marketing' | 'Integration';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

type WorkCard = {
  id: string;
  title: string;
  kind: WorkKind;
  owner: string;
  status: 'Inbox' | 'Planning' | 'Waiting Approval' | 'Ready' | 'Done';
  risk: RiskLevel;
  request: string;
  plan: string[];
  tools: string[];
  approval: string;
  sourceSessionId?: string;
};

type AuditEntry = {
  id: string;
  at: string;
  action: string;
  cardId: string;
  detail: string;
};

type WorkboardPrefill = {
  title?: string;
  kind?: string;
  request?: string;
  sourceSessionId?: string;
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function normalizeKind(kind?: string): WorkKind {
  if (kind === 'Q&A' || kind === 'Code' || kind === 'Design' || kind === 'Data' || kind === 'Marketing' || kind === 'Integration') return kind;
  if (kind === 'CI Fix') return 'Code';
  return 'Code';
}

function riskFor(kind: WorkKind): RiskLevel {
  if (kind === 'Code' || kind === 'Integration') return 'HIGH';
  if (kind === 'Data' || kind === 'Design') return 'MEDIUM';
  return 'LOW';
}

function ownerFor(kind: WorkKind) {
  if (kind === 'Code') return 'AI Code / Dev Agent';
  if (kind === 'Design') return 'AI Thiết kế sản phẩm';
  if (kind === 'Marketing') return 'AI Marketing / Sales';
  if (kind === 'Data') return 'AI Dữ liệu / Tri thức';
  return 'AI Điều phối trưởng';
}

export default function SessionWorkboardBridge() {
  useEffect(() => {
    const syncPrefill = () => {
      const prefill = readLocal<WorkboardPrefill | null>('ledgerflow_aiops_workboard_prefill_v1', null);
      if (!prefill?.title?.trim() || !prefill?.request?.trim()) return;

      const cards = readLocal<WorkCard[]>('ledgerflow_aiops_cards_v1', []);
      if (prefill.sourceSessionId && cards.some((card) => card.sourceSessionId === prefill.sourceSessionId)) return;

      const kind = normalizeKind(prefill.kind);
      const risk = riskFor(kind);
      const cardId = `wb-session-${Date.now()}`;
      const card: WorkCard = {
        id: cardId,
        title: prefill.title.trim(),
        kind,
        owner: ownerFor(kind),
        status: risk === 'LOW' ? 'Inbox' : 'Waiting Approval',
        risk,
        request: prefill.request.trim(),
        plan: ['Đọc Context Pack', 'Lập kế hoạch nhỏ', 'Kiểm tra Tool Policy', 'Chờ founder duyệt nếu có rủi ro'],
        tools: kind === 'Code' ? ['Knowledge Library', 'Tool Policy', 'Review Desk', 'Build Monitor'] : kind === 'Integration' ? ['Integration Hub', 'Tool Policy', 'Review Desk'] : ['Knowledge Library', 'Sandbox'],
        approval: risk === 'LOW' ? 'Có thể xử lý trong sandbox.' : 'Cần founder review trước khi hành động ngoài sandbox.',
        sourceSessionId: prefill.sourceSessionId
      };

      const audit = readLocal<AuditEntry[]>('ledgerflow_aiops_audit_v1', []);
      const entry: AuditEntry = {
        id: `audit-${Date.now()}`,
        at: new Date().toLocaleString('vi-VN'),
        action: 'CARD_CREATED_FROM_SESSION',
        cardId,
        detail: `Tạo work card từ Agent Session ${prefill.sourceSessionId || 'unknown'}.`
      };

      localStorage.setItem('ledgerflow_aiops_cards_v1', JSON.stringify([card, ...cards]));
      localStorage.setItem('ledgerflow_aiops_audit_v1', JSON.stringify([entry, ...audit].slice(0, 120)));
      localStorage.removeItem('ledgerflow_aiops_workboard_prefill_v1');
      window.dispatchEvent(new CustomEvent('ledgerflow-aiops-workboard-card-created', { detail: { cardId, sourceSessionId: prefill.sourceSessionId } }));
    };

    window.addEventListener('ledgerflow-aiops-workboard-prefill', syncPrefill);
    syncPrefill();
    return () => window.removeEventListener('ledgerflow-aiops-workboard-prefill', syncPrefill);
  }, []);

  return null;
}
