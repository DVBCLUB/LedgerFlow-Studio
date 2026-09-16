import { useCallback, useEffect, useState } from 'react';
import { Bot, Check, Inbox, RefreshCw, X, ShieldAlert, Sparkles, Mail } from 'lucide-react';

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
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Inbox className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Hộp Thư Giao Tiếp Tác Tử (A2A Swarm Mailbox)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Swarm Mesh
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Kênh liên lạc trực tiếp giữa các nhân viên AI. Duyệt quyền thực thi và phân luồng chỉ thị an toàn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {unread.length} Tin Chưa Đọc
            </span>
          </div>
        </div>
      </section>

      {/* Control Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-700/80 bg-slate-950 text-xs font-bold text-white outline-none focus:border-cyan-500 transition-colors"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.emoji} {e.name} · {e.binding.mode}{e.binding.provider ? `:${e.binding.provider}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => selected && loadMailbox(selected.roleId)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-700/80 bg-slate-950/80 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Tải lại</span>
          </button>
        </div>

        <button
          type="button"
          onClick={runShift}
          disabled={busy || !selected}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Bot className="h-3.5 w-3.5" />
          <span>{busy ? 'Đang chạy ca...' : '🤖 Chạy Ca Trực AI (Run Shift)'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 p-4 text-xs font-bold text-rose-200">
          {error}
        </div>
      )}

      {/* Messages Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-black text-white">Danh Sách Tin Nhắn A2A Trong Hộp Thư</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Agent Communications</span>
        </div>

        {messages.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">
            {busy ? 'Đang tải tin nhắn tác tử…' : 'Không có tin nào trong hộp thư của nhân viên này.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 sm:p-5 transition-colors ${
                  msg.status === 'escalated'
                    ? 'bg-rose-950/20 hover:bg-rose-900/30'
                    : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-white">
                    <span className="text-cyan-300">{msg.senderRole}</span>
                    <span className="text-slate-500">➔</span>
                    <span className="text-teal-300">{msg.recipientRole}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        msg.priority === 'urgent'
                          ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {msg.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        msg.status === 'completed'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : msg.status === 'escalated'
                          ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {msg.status}
                    </span>
                    {msg.approved && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
                        ✓ Đã duyệt
                      </span>
                    )}
                  </div>

                  {msg.status === 'unread' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decide(msg, true)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Check className="h-3 w-3" /> Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(msg, false)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-sm font-bold text-white">{msg.subject}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-400">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

