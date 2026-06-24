import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Plus,
  RefreshCw,
  Shield,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Zap,
} from 'lucide-react';

// ─── Types (mirrors automationRuleEngine.ts) ───────────────────────────────

interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value?: string | number | boolean;
}

interface AutomationAction {
  type: string;
  params: Record<string, unknown>;
  requiresApproval: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerEvent: string;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}

interface RuleExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  eventType: string;
  conditionResult: boolean;
  actionsExecuted: string[];
  actionsSkipped: string[];
  status: 'success' | 'partial' | 'failed' | 'condition_not_met';
  error?: string;
  executedAt: string;
  durationMs: number;
}

const EVENT_TYPES = [
  'pipeline.completed', 'pipeline.failed',
  'agent.run.completed', 'agent.run.failed',
  'agent.step.approval_required',
  'workflow.completed', 'workflow.failed', 'workflow.escalated',
  'transaction.detected', 'robot.emergency_stop',
  'daily.trigger', 'weekly.trigger', 'custom',
];

const ACTION_TYPES = [
  'log_event', 'send_notification', 'update_status',
  'start_pipeline', 'start_workflow', 'create_agent_run', 'webhook_post',
];

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
  partial: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
  failed: 'bg-rose-500/15 text-rose-300 border border-rose-500/20',
  condition_not_met: 'bg-slate-500/15 text-slate-400 border border-slate-600/20',
};

const STATUS_LABELS: Record<string, string> = {
  success: '✅ Thành công', partial: '⚠️ Một phần', failed: '❌ Thất bại', condition_not_met: '— Điều kiện không khớp',
};

// ─── New Rule Form ────────────────────────────────────────────────────────────

function NewRuleForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState(EVENT_TYPES[0]);
  const [actionType, setActionType] = useState(ACTION_TYPES[0]);
  const [actionMessage, setActionMessage] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setResult('❌ Vui lòng nhập tên rule.'); return; }
    setSaving(true); setResult(null);
    try {
      const res = await fetch('/api/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          enabled: true,
          triggerEvent,
          conditions: [],
          conditionLogic: 'AND',
          actions: [{
            type: actionType,
            params: { message: actionMessage || name, level: 'info' },
            requiresApproval,
          }],
        }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (res.ok && data.id) {
        setResult(`✅ Rule "${name}" đã tạo.`);
        setName(''); setDescription(''); setActionMessage('');
        onCreated();
      } else {
        setResult(`❌ ${data.error || 'Lỗi tạo rule'}`);
      }
    } catch {
      setResult('❌ Lỗi kết nối server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 space-y-4">
      <h3 className="text-sm font-black uppercase tracking-wider text-cyan-200 flex items-center gap-2">
        <Plus className="h-4 w-4" /> Tạo Automation Rule mới
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-black text-slate-400 mb-1">Tên rule *</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" placeholder="VD: Thông báo khi pipeline thất bại" />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 mb-1">Trigger Event</label>
          <select value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
            {EVENT_TYPES.map((et) => <option key={et} value={et}>{et}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-black text-slate-400 mb-1">Mô tả</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" placeholder="Mô tả ngắn về rule này" />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 mb-1">Action</label>
          <select value={actionType} onChange={(e) => setActionType(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
            {ACTION_TYPES.map((at) => <option key={at} value={at}>{at}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 mb-1">Message / Params</label>
          <input value={actionMessage} onChange={(e) => setActionMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" placeholder="Nội dung thông báo hoặc params" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} className="accent-amber-400" />
        <span className="text-xs font-bold text-amber-300">Action cần founder duyệt trước khi thực thi</span>
      </label>
      <div className="flex items-center gap-3">
        <button onClick={() => void handleSave()} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2 text-xs font-black text-slate-950 disabled:opacity-50 hover:bg-cyan-300 transition-colors">
          <Zap className="h-3.5 w-3.5" /> {saving ? 'Đang lưu…' : 'Tạo Rule'}
        </button>
        {result && <p className="text-sm font-bold text-slate-300">{result}</p>}
      </div>
    </div>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────────

function RuleCard({ rule, onToggle, onDelete }: { rule: AutomationRule; onToggle: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all ${rule.enabled ? 'border-slate-700 bg-slate-900/70' : 'border-slate-800 bg-slate-950/50 opacity-60'}`}>
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => void onToggle()} title={rule.enabled ? 'Tắt rule' : 'Bật rule'}>
          {rule.enabled ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5 text-slate-500" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-black text-white truncate">{rule.name}</span>
            <span className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-black text-cyan-300">{rule.triggerEvent}</span>
          </div>
          <p className="text-xs text-slate-500 truncate">{rule.description || '—'}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-500">Kích hoạt</p>
            <p className="text-sm font-black text-white">{rule.triggerCount}</p>
          </div>
          <button onClick={() => setExpanded((v) => !v)} className="text-slate-500 hover:text-white transition-colors">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <button onClick={() => void onDelete()} className="text-slate-600 hover:text-rose-400 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Actions ({rule.actions.length})</p>
            {rule.actions.map((action, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 mt-1">
                <span className="text-xs font-black text-cyan-300">{action.type}</span>
                {action.requiresApproval && <Shield className="h-3 w-3 text-amber-400" title="Cần approval" />}
                <span className="text-xs text-slate-500 truncate">{JSON.stringify(action.params)}</span>
              </div>
            ))}
          </div>
          {rule.lastTriggeredAt && (
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Lần cuối: {new Date(rule.lastTriggeredAt).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AutomationRulesPanel() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<RuleExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, logsRes] = await Promise.all([
        fetch('/api/automation-rules'),
        fetch('/api/automation-rules/logs?limit=30'),
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json() as AutomationRule[]);
      if (logsRes.ok) setLogs(await logsRes.json() as RuleExecutionLog[]);
      setError(null);
    } catch {
      setError('Không thể tải Automation Rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleToggle = async (rule: AutomationRule) => {
    try {
      await fetch(`/api/automation-rules/${rule.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      await fetchData();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa rule này?')) return;
    try {
      await fetch(`/api/automation-rules/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch { /* ignore */ }
  };

  const enabledCount = rules.filter((r) => r.enabled).length;
  const recentSuccesses = logs.filter((l) => l.status === 'success').length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-amber-950/20 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Zap className="h-3.5 w-3.5" /> Automation Rules Engine
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Quy tắc Tự động hóa</h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              {enabledCount} rules đang hoạt động · {recentSuccesses} lần thực thi thành công gần đây
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => void fetchData()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:text-white transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> {showNewForm ? 'Đóng form' : 'Tạo Rule mới'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {(['rules', 'logs'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${activeTab === t ? 'bg-amber-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}>
              {t === 'rules' ? `Rules (${rules.length})` : `Execution Log (${logs.length})`}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {showNewForm && (
        <NewRuleForm onCreated={() => { setShowNewForm(false); void fetchData(); }} />
      )}

      {/* ── Rules Tab ──────────────────────────────────────────────────────────── */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-500 animate-pulse">Đang tải…</div>
          ) : rules.length === 0 ? (
            <div className="py-12 text-center text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/50">
              <Zap className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <p>Chưa có automation rule nào. Tạo rule đầu tiên ở trên.</p>
            </div>
          ) : (
            rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onToggle={() => void handleToggle(rule)}
                onDelete={() => void handleDelete(rule.id)}
              />
            ))
          )}
        </div>
      )}

      {/* ── Execution Log Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/50">
              Chưa có lịch sử thực thi.
            </div>
          ) : logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${STATUS_STYLES[log.status] || ''}`}>
                  {STATUS_LABELS[log.status] || log.status}
                </span>
                <span className="text-xs font-black text-slate-300">{log.ruleName}</span>
                <span className="text-[10px] text-slate-500">{log.eventType}</span>
                <span className="ml-auto text-[10px] text-slate-500">{log.durationMs}ms</span>
              </div>
              {log.actionsExecuted.length > 0 && (
                <p className="text-[10px] text-emerald-400 font-bold">✅ Executed: {log.actionsExecuted.join(', ')}</p>
              )}
              {log.actionsSkipped.length > 0 && (
                <p className="text-[10px] text-slate-500 font-bold">⏭ Skipped: {log.actionsSkipped.join(', ')}</p>
              )}
              {log.error && <p className="text-[10px] text-rose-400 font-bold">Error: {log.error}</p>}
              <p className="text-[10px] text-slate-600 mt-1">{new Date(log.executedAt).toLocaleString('vi-VN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
