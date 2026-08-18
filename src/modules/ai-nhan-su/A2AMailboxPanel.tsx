import { useCallback, useEffect, useState } from 'react';
import { Bot, Check, Inbox, RefreshCw, X } from 'lucide-react';

type A2AMessage = {
  id: string;
  threadId: string;
  senderRole: string;
  recipientRole: string;
  messageType: string;
  priority: 'normal' | 'high' | 'urgent';
  subject: string;
  body: string;
  status: 'unread' | 'read' | 'completed' | 'escalated';
  sentAt: string;
  approved?: boolean;
};

type Employee = {
  id: string;
  roleId: string;
  name: string;
  emoji: string;
  binding: { mode: string; provider?: string };
  costTier: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  const json = await res.json().catch(() => ({}));
  return json as T;
}

export default function A2AMailboxPanel() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<A2AMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selected = employees.find((e) => e.id === selectedId);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await api<{ employees: Employee[] }>('/api/agent/employees');
      setEmployees(data.employees || []);
      setSelectedId((cur) => cur || data.employees?.[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const loadMailbox = useCallback(async (roleId: string) => {
    setBusy(true);
    setError('');
    try {
      const data = await api<{ messages: A2AMessage[] }>(`/api/agent/a2a/mailbox/${encodeURIComponent(roleId)}`);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (selected?.roleId) void loadMailbox(selected.roleId);
  }, [selectedId, selected?.roleId, loadMailbox]);

  const decide = async (msg: A2AMessage, approve: boolean) => {
    if (!selected) return;
    await api(`/api/agent/a2a/${msg.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ recipientRole: selected.roleId, approve }),
    });
    await loadMailbox(selected.roleId);
  };

  const runShift = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/agent/employees/${selected.id}/shift`, { method: 'POST', body: JSON.stringify({}) });
      await loadMailbox(selected.roleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const unread = messages.filter((m) => m.status === 'unread');

  return (
    <section className="rounded-2xl border border-border-primary bg-slate-950/70 p-4 text-left">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">Hộp thư A2A (Nhân viên AI)</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border border-border-secondary bg-slate-900 px-3 py-1.5 text-xs font-bold text-text-primary"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.emoji} {e.name} · {e.binding.mode}{e.binding.provider ? `:${e.binding.provider}` : ''}
              </option>
            ))}
          </select>
          <button onClick={() => selected && loadMailbox(selected.roleId)} className="inline-flex items-center gap-1.5 rounded-xl border border-border-secondary bg-slate-900 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary">
            <RefreshCw className="h-3.5 w-3.5" /> Tải lại
          </button>
          <button onClick={runShift} disabled={busy || !selected} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-black text-slate-950 disabled:opacity-50">
            <Bot className="h-3.5 w-3.5" /> Chạy ca
          </button>
        </div>
      </div>

      {error && <div className="mb-3 rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100">{error}</div>}

      <div className="mb-2 flex items-center gap-3 text-[11px] font-bold text-text-tertiary">
        <span>{unread.length} chưa đọc</span>
        <span className="text-text-secondary">·</span>
        <span>Web chat chỉ chạy khi tin đã được Duyệt</span>
      </div>

      {messages.length === 0 && (
        <p className="py-6 text-center text-xs font-semibold text-text-tertiary">
          {busy ? 'Đang tải…' : 'Không có tin nào trong hộp thư của nhân viên này.'}
        </p>
      )}

      <div className="space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`rounded-xl border p-3 ${msg.status === 'escalated' ? 'border-rose-500/40 bg-rose-500/5' : 'border-border-primary bg-slate-900/60'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-text-primary">
                <span>{msg.senderRole} → {msg.recipientRole}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase ${msg.priority === 'urgent' ? 'border-rose-500/40 text-rose-300' : 'border-border-secondary text-text-tertiary'}`}>{msg.priority}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase ${msg.status === 'completed' ? 'border-emerald-500/40 text-emerald-300' : msg.status === 'escalated' ? 'border-rose-500/40 text-rose-300' : 'border-amber-500/40 text-amber-300'}`}>{msg.status}</span>
                {msg.approved && <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[9px] uppercase text-emerald-300">Đã duyệt</span>}
              </div>
              {msg.status === 'unread' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => decide(msg, true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-black text-emerald-200 hover:bg-emerald-500/30">
                    <Check className="h-3 w-3" /> Duyệt
                  </button>
                  <button onClick={() => decide(msg, false)} className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 px-2.5 py-1 text-[11px] font-black text-rose-200 hover:bg-rose-500/30">
                    <X className="h-3 w-3" /> Từ chối
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1.5 text-xs font-bold text-text-primary">{msg.subject}</p>
            <p className="mt-1 whitespace-pre-wrap text-[11px] font-semibold leading-5 text-text-secondary">{msg.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
