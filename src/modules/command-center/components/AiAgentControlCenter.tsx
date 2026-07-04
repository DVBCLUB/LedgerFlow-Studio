import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, RefreshCw, Loader2, Terminal } from 'lucide-react';
import {
  checkDaemonHealth,
  reindexCodebase,
  fetchAgentRoles,
  fetchAgentRoleById,
  type AssistantHealth
} from '../../../utils/assistantApi';

export default function AiAgentControlCenter() {
  const [syncNotice, setSyncNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const pushNotice = useCallback((kind: 'success' | 'error', text: string) => {
    setSyncNotice({ kind, text });
  }, []);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = window.setTimeout(() => setSyncNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [syncNotice]);

  // AI Assistant Integration State
  const [aiStatus, setAiStatus] = useState<{ ok: boolean }>({ ok: false });
  const [healthInfo, setHealthInfo] = useState<AssistantHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [roles, setRoles] = useState<{ id: string; emoji: string; group: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRolePrompt, setSelectedRolePrompt] = useState('');
  const [loadingRolePrompt, setLoadingRolePrompt] = useState(false);
  const [rolePromptTick, setRolePromptTick] = useState(0);
  const rolePromptNotifyRef = useRef(false);
  
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    try {
      return localStorage.getItem('lf_assistant_selected_role') || '';
    } catch {
      return '';
    }
  });
  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<string>('');

  const pingDaemon = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const h = await checkDaemonHealth();
      setHealthInfo(h);
      setAiStatus({ ok: h.ok });
    } catch (err: any) {
      setAiStatus({ ok: false });
      setHealthInfo(null);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const runReindex = async () => {
    if (indexing) return;
    setIndexing(true);
    setIndexResult('');
    try {
      const res = await reindexCodebase();
      setIndexResult(`✓ Index thành công: ${res.totalFiles} files (${res.durationMs}ms)`);
    } catch (err: any) {
      setIndexResult(`✗ Lỗi: ${err.message}`);
    } finally {
      setIndexing(false);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedRole(val);
    localStorage.setItem('lf_assistant_selected_role', val);
    rolePromptNotifyRef.current = false;
  };

  const openAIAssistant = () => {
    const launcher = document.getElementById('ai-assistant-launcher-btn');
    if (launcher) {
      launcher.click();
    } else {
      window.location.hash = '#/ai_assistant';
    }
  };

  const loadRoles = useCallback(async (silent = false) => {
    setLoadingRoles(true);
    try {
      const roleList = await fetchAgentRoles();
      setRoles(roleList);
      if (!silent) {
        pushNotice('success', `Đã đồng bộ ${roleList.length} vai trò từ server.`);
      }
    } catch {
      if (!silent) {
        pushNotice('error', 'Không tải được danh sách vai trò từ server.');
      }
    } finally {
      setLoadingRoles(false);
    }
  }, [pushNotice]);

  useEffect(() => {
    pingDaemon();
    loadRoles(true);
  }, [pingDaemon, loadRoles]);

  useEffect(() => {
    let cancelled = false;

    const loadRolePrompt = async () => {
      if (!selectedRole) {
        setSelectedRolePrompt('');
        return;
      }

      setLoadingRolePrompt(true);
      try {
        const role = await fetchAgentRoleById(selectedRole);
        if (!cancelled) {
          setSelectedRolePrompt(role.systemPrompt || '');
          if (rolePromptNotifyRef.current) {
            pushNotice('success', `Đã đồng bộ system prompt cho role ${selectedRole}.`);
          }
        }
      } catch {
        if (!cancelled) {
          setSelectedRolePrompt('');
          if (rolePromptNotifyRef.current) {
            pushNotice('error', `Không tải được system prompt cho role ${selectedRole}.`);
          }
        }
      } finally {
        rolePromptNotifyRef.current = false;
        if (!cancelled) {
          setLoadingRolePrompt(false);
        }
      }
    };

    loadRolePrompt();
    return () => {
      cancelled = true;
    };
  }, [selectedRole, rolePromptTick, pushNotice]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent-secondary/20 bg-bg-primary p-6 backdrop-blur-xl shadow-xl">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-accent-secondary/10 blur-2xl"></div>
      {syncNotice && (
        <div className={`mb-3 rounded-xl border px-3 py-2 text-[11px] font-bold ${
          syncNotice.kind === 'success'
            ? 'border-success/30 bg-success/30 text-success'
            : 'border-error/30 bg-error/30 text-error'
        }`}>
          {syncNotice.text}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-primary pb-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent-secondary" />
            Trạm Điều Hành AI Nhân Sự &amp; Codebase (AI Agent Control Center)
          </h2>
          <p className="text-xs text-text-secondary mt-1 font-semibold">
            Giám sát trạng thái Local Daemon, quản lý vai trò AI Staff và đánh chỉ mục mã nguồn dự án.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${
            aiStatus.ok 
              ? 'text-success bg-success/40 border border-success/30' 
              : 'text-error bg-error/40 border border-error/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.ok ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            {aiStatus.ok ? 'DAEMON ONLINE' : 'DAEMON OFFLINE'}
          </span>
          <button 
            onClick={pingDaemon}
            disabled={loadingHealth}
            className="p-1 rounded-lg bg-bg-surface border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
            title="Làm mới trạng thái"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Column 1: Daemon Info */}
        <div className="p-4 bg-bg-surface border border-border-primary/60 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-text-muted tracking-wider mb-2">Thông tin Daemon</div>
            {aiStatus.ok && healthInfo ? (
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] text-text-muted font-semibold">Tên dịch vụ</div>
                  <div className="text-xs text-text-primary font-bold">{healthInfo.service}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted font-semibold">Phiên bản</div>
                  <div className="text-xs text-text-primary font-bold">v{healthInfo.version}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted font-semibold">Thư mục làm việc (Workspace)</div>
                  <div className="text-[10px] text-text-secondary font-mono truncate max-w-full" title={healthInfo.workspaceRoot}>
                    {healthInfo.workspaceRoot}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-text-secondary py-4">
                Không có thông tin. Vui lòng chạy lệnh sau để khởi động daemon local:
                <code className="block mt-2 p-2 bg-bg-primary border border-border-primary rounded font-mono text-[10px] text-success">
                  npm run assistant:start
                </code>
              </div>
            )}
          </div>
          
          {aiStatus.ok && (
            <button 
              onClick={openAIAssistant}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 bg-violet-600/90 hover:bg-accent-secondary text-text-primary text-xs font-bold rounded-xl transition-all"
            >
              <Terminal className="h-3.5 w-3.5" />
              Mở AI Coding Panel
            </button>
          )}
        </div>

        {/* Column 2: Code Indexer (RAG) */}
        <div className="p-4 bg-bg-surface border border-border-primary/60 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-text-muted tracking-wider mb-2">Đánh chỉ mục mã nguồn (RAG)</div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Quét và lưu trữ các tệp mã nguồn của dự án vào cơ sở dữ liệu TF-IDF cục bộ để cải thiện chất lượng tìm kiếm ngữ cảnh cho AI.
            </p>
            
            {indexResult && (
              <div className="mt-3 p-2.5 bg-bg-primary border border-border-primary rounded-xl">
                <div className="text-[10px] text-text-secondary font-mono leading-5">{indexResult}</div>
              </div>
            )}
          </div>

          <button 
            onClick={runReindex}
            disabled={indexing || !aiStatus.ok}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 bg-bg-surface hover:bg-bg-elevated disabled:opacity-40 border border-border-primary hover:border-border-secondary text-text-secondary text-xs font-bold rounded-xl transition-all"
          >
            {indexing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-secondary" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-text-secondary" />
            )}
            {indexing ? 'Đang index mã nguồn...' : 'Đánh lại chỉ mục (Re-index)'}
          </button>
        </div>

        {/* Column 3: AI Roles Selector */}
        <div className="p-4 bg-bg-surface border border-border-primary/60 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-text-muted tracking-wider mb-2">Vai trò AI hoạt động</div>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
              Đặt vai trò toàn cục cho AI Staff. Mọi câu lệnh code/system prompt sẽ được tùy biến cho vai trò tương ứng.
            </p>
            
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              disabled={!aiStatus.ok}
              className="w-full bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs text-text-primary focus:border-accent-secondary/60 outline-none font-bold"
            >
              <option value="">-- Mặc định (AI Dev) --</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.emoji} {r.id} ({r.group})
                </option>
              ))}
            </select>

            <button
              onClick={() => loadRoles(false)}
              disabled={loadingRoles || !aiStatus.ok}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border-secondary bg-bg-surface px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary disabled:opacity-40"
              title="Tải lại danh sách vai trò từ server"
            >
              <RefreshCw className={`h-3 w-3 ${loadingRoles ? 'animate-spin' : ''}`} /> Reload Roles
            </button>
          </div>

          <div className="mt-4 p-3 bg-bg-primary border border-border-primary rounded-xl text-center">
            <span className="text-[10px] text-text-muted font-semibold">Vai trò đang chọn: </span>
            <span className="text-[11px] text-violet-300 font-bold">
              {selectedRole ? `${roles.find(r => r.id === selectedRole)?.emoji || '🤖'} ${selectedRole}` : '💻 AI Dev'}
            </span>
          </div>

          {selectedRole && (
            <div className="mt-2 rounded-xl border border-border-primary bg-bg-primary p-2.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  System prompt đồng bộ từ server
                </div>
                <button
                  onClick={() => {
                    rolePromptNotifyRef.current = true;
                    setRolePromptTick((v) => v + 1);
                  }}
                  disabled={loadingRolePrompt || !aiStatus.ok}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-secondary bg-bg-surface px-2 py-1 text-[10px] font-bold text-text-secondary hover:text-text-primary disabled:opacity-40"
                  title="Tải lại prompt từ server"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingRolePrompt ? 'animate-spin' : ''}`} /> Reload
                </button>
              </div>
              {loadingRolePrompt ? (
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang tải prompt...
                </div>
              ) : (
                <pre className="max-h-24 overflow-auto whitespace-pre-wrap text-[10px] leading-5 text-text-secondary">{selectedRolePrompt || 'Không tải được prompt cho role này.'}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
