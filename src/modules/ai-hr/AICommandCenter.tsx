import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Cpu, Send, Terminal, Play, Square, Activity, Brain, Zap, Shield, RefreshCw, Wifi, WifiOff, Settings, Trash2, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAIWorkforce } from '../../context/AIWorkforceContext';

// ─── Types ───────────────────────────────────────────────────────────
interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'error' | 'stopped';
  task?: string;
  lastActive?: string;
}

interface RobotStatus {
  connected: boolean;
  mode: 'manual' | 'auto' | 'emergency_stop';
  activeScripts: number;
}

interface Mission {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  agent?: string;
  createdAt: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// DEFAULT_AGENTS — chỉ dùng khi chưa có snapshot tử context
const DEFAULT_AGENTS: AgentStatus[] = [
  { id: '1', name: 'AI Gateway', status: 'idle', lastActive: '--' },
  { id: '2', name: 'Agent Runtime', status: 'idle', lastActive: '--' },
  { id: '3', name: 'Mission Queue', status: 'idle', lastActive: '--' },
  { id: '4', name: 'Observability', status: 'idle', lastActive: '--' },
];

const DEFAULT_MISSIONS: Mission[] = [];

// ─── Sub-components ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-slate-700 text-slate-300',
    running: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    error: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    stopped: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    pending: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    done: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    failed: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };
  const labels: Record<string, string> = {
    idle: 'Sẵn sàng',
    running: 'Đang chạy',
    error: 'Cần xử lý',
    stopped: 'Đã dừng',
    pending: 'Chờ phê duyệt',
    done: 'Hoàn tất',
    failed: 'Có rủi ro',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${colors[status] || colors.idle}`}>
      {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
      {labels[status] || status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-slate-400' }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      {sub && <div className="mt-1 text-[10px] font-semibold text-slate-500">{sub}</div>}
    </div>
  );
}

// ─── AI Chat Panel ───────────────────────────────────────────────────
function AIChatPanel({ daemonOnline }: { daemonOnline: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'Chào mừng đến Đội ngũ AI LedgerFlow. Gõ yêu cầu hoặc câu hỏi để bắt đầu.', timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('http://127.0.0.1:3001/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, stream: false }),
      });
      const data = await res.json();
      const reply = data?.text || data?.reply || (data?.ok === false ? `Lỗi: ${data.error || 'Không thể gọi AI'}` : 'Không có phản hồi.');
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date().toISOString() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Không kết nối được AI Daemon (port 3001). Hãy cấu hình API key trong mục Cài đặt AI.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">Trao đổi với AI</span>
          {daemonOnline ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Wifi className="h-3 w-3" /> Đang kết nối</span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-rose-400"><WifiOff className="h-3 w-3" /> Mất kết nối</span>
          )}
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="rounded-lg p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition"
          title="Xoá chat"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-5 ${
              msg.role === 'user'
                ? 'bg-violet-500/20 text-violet-100 border border-violet-500/30'
                : msg.role === 'system'
                  ? 'bg-slate-800/50 text-slate-400 italic border border-slate-700/50'
                  : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
            }`}>
              {msg.content}
              <div className="mt-1 text-[9px] text-slate-600">
                {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 bg-slate-800/80 border border-slate-700/50">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Giao việc cho AI... (vd: kiểm tra trạng thái hệ thống)"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 transition"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-violet-500/20 border border-violet-500/30 px-4 py-2.5 text-violet-300 hover:bg-violet-500/30 disabled:opacity-40 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Trạng thái AI', 'Tạo nhiệm vụ mới', 'Kiểm tra bảo mật', 'Chạy tự động hóa'].map(cmd => (
            <button
              key={cmd}
              onClick={() => setInput(cmd)}
              className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-2.5 py-1 text-[10px] text-slate-500 hover:text-slate-300 hover:border-slate-600/50 transition"
            >
              /{cmd.toLowerCase().replace(/\s+/g, '_')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Agent Control Panel ─────────────────────────────────────────────
function AgentControlPanel({ agents, onToggle }: { agents: AgentStatus[]; onToggle: (id: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
        <Cpu className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-black uppercase tracking-wider text-slate-300">Kiểm soát AI</span>
      </div>
      <div className="divide-y divide-slate-800/50">
        {agents.map(agent => (
          <div key={agent.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${
                agent.status === 'running' ? 'bg-emerald-400 animate-pulse' :
                agent.status === 'error' ? 'bg-rose-400' : 'bg-slate-600'
              }`} />
              <div>
                <div className="text-xs font-bold text-slate-200">{agent.name}</div>
                <div className="text-[10px] text-slate-500">{agent.task || 'Sẵn sàng'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.status} />
              <button
                onClick={() => onToggle(agent.id)}
                className={`rounded-lg p-1.5 transition ${
                  agent.status === 'running'
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
                title={agent.status === 'running' ? 'Dừng agent' : 'Khởi chạy agent'}
              >
                {agent.status === 'running' ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mission Queue ───────────────────────────────────────────────────
function MissionQueue({ missions }: { missions: Mission[] }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">Hàng đợi nhiệm vụ</span>
        </div>
        <span className="text-[10px] font-bold text-slate-500">{missions.length} nhiệm vụ</span>
      </div>
      <div className="divide-y divide-slate-800/50 max-h-[200px] overflow-y-auto">
        {missions.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-slate-500">
            Chưa có nhiệm vụ nào. Dùng chat để tạo nhiệm vụ mới.
          </div>
        ) : (
          missions.map(m => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <div className="text-xs font-semibold text-slate-300">{m.title}</div>
                <div className="text-[10px] text-slate-500">{m.agent || 'Chưa gán'} · {new Date(m.createdAt).toLocaleTimeString('vi-VN')}</div>
              </div>
              <StatusBadge status={m.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Quick Actions ───────────────────────────────────────────────────
function QuickActions() {
  const actions = [
    { icon: Play, label: 'Chạy tự động hóa', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20' },
    { icon: Brain, label: 'Cập nhật bộ nhớ', color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10 hover:bg-violet-500/20' },
    { icon: Zap, label: 'Quét nhanh', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10 hover:bg-amber-500/20' },
    { icon: Shield, label: 'Kiểm tra an toàn', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map(action => (
        <button
          key={action.label}
          className={`flex items-center gap-2 rounded-xl border ${action.border} ${action.bg} px-4 py-3 text-xs font-bold transition`}
        >
          <action.icon className={`h-4 w-4 ${action.color}`} />
          <span className={action.color}>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main AI Command Center ──────────────────────────────────────────
export default function AICommandCenter() {
  // Lấy trạng thái từ AIWorkforceContext (chạy ngầm)
  const { snapshot, connected, refresh } = useAIWorkforce();

  // Dựng agent list từ background services snapshot
  const [agents, setAgents] = useState<AgentStatus[]>(DEFAULT_AGENTS);
  const [missions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [robotStatus] = useState<RobotStatus>({ connected: false, mode: 'manual', activeScripts: 0 });

  // Cập nhật agent list khi snapshot thay đổi
  useEffect(() => {
    if (!snapshot?.backgroundServices?.length) return;
    setAgents(
      snapshot.backgroundServices.map((svc, i) => ({
        id: String(i + 1),
        name: svc.name,
        status: svc.status === 'running' ? 'running' :
               svc.status === 'error' ? 'error' : 'idle',
        lastActive: snapshot.lastAuditAt
          ? new Date(snapshot.lastAuditAt).toLocaleTimeString('vi-VN')
          : '--',
      }))
    );
  }, [snapshot]);

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a =>
      a.id === id ? { ...a, status: a.status === 'running' ? 'stopped' : 'running' as const, task: a.status === 'running' ? undefined : 'Đang thực thi...' } : a
    ));
  };

  const runningAgents = snapshot?.activeRuns ?? agents.filter(a => a.status === 'running').length;
  const daemonOnline = connected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Đội ngũ AI</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Giao việc, theo dõi và kiểm soát các agent AI vận hành doanh nghiệp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {daemonOnline ? (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-300">
              <Wifi className="h-3 w-3" /> Đang kết nối
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase text-rose-300">
              <WifiOff className="h-3 w-3" /> Mất kết nối
            </span>
          )}
          <button
            onClick={() => window.location.hash = '#/system_settings?subtab=general'}
            className="rounded-xl border border-slate-700 bg-slate-900/50 p-2 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition"
            title="Cài đặt AI"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Cpu} label="AI đang chạy" value={runningAgents} sub={`/ ${agents.length} tổng`} color="text-cyan-400" />
        <StatCard icon={Activity} label="Nhiệm vụ" value={snapshot?.totalQueued ?? missions.length} sub="trong hàng đợi" color="text-amber-400" />
        <StatCard icon={AlertTriangle} label="Chờ duyệt" value={snapshot?.pendingApprovals ?? 0} sub="cần phê duyệt" color="text-rose-400" />
        <StatCard icon={CheckCircle2} label="Grade" value={snapshot?.readinessGrade ?? '--'} sub={`điểm ${snapshot?.readinessScore ?? 0}/5`} color="text-emerald-400" />
        <StatCard icon={Shield} label="An toàn" value={robotStatus.mode === 'emergency_stop' ? 'Dừng' : 'An toàn'} sub={robotStatus.mode} color={robotStatus.mode === 'emergency_stop' ? 'text-rose-400' : 'text-cyan-400'} />
      </div>

      {/* Main Grid: Chat + Controls */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Chat (3 cols) */}
        <div className="lg:col-span-3">
          <AIChatPanel daemonOnline={daemonOnline} />
        </div>

        {/* Right: Controls (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <AgentControlPanel agents={agents} onToggle={toggleAgent} />
          <MissionQueue missions={missions} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Status Footer */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5">
        <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-500">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date().toLocaleTimeString('vi-VN')}</span>
          <span>Robot: {robotStatus.connected ? 'Đã kết nối' : 'Chưa kết nối'}</span>
          <span>Chế độ: {robotStatus.mode}</span>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1 rounded-lg p-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition"
        >
          <RefreshCw className="h-3 w-3" />
          Làm mới
        </button>
      </div>
    </div>
  );
}
