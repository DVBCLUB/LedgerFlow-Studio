import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, RefreshCw, Loader2, Terminal } from 'lucide-react';
import {
  checkDaemonHealth,
  reindexCodebase,
  fetchAgentRoles,
  fetchAgentRoleById,
  type AssistantHealth
} from '../../utils/assistantApi';

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
    <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-slate-950/40 p-6 backdrop-blur-xl shadow-xl">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-violet-500/10 blur-2xl"></div>
      {syncNotice && (
        <div className={`mb-3 rounded-xl border px-3 py-2 text-[11px] font-bold ${
          syncNotice.kind === 'success'
            ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
            : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
        }`}>
          {syncNotice.text}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-4">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-400" />
            Trạm Điều Hành AI Nhân Sự &amp; Codebase (AI Agent Control Center)
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Giám sát trạng thái Local Daemon, quản lý vai trò AI Staff và đánh chỉ mục mã nguồn dự án.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${
            aiStatus.ok 
              ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30' 
              : 'text-rose-400 bg-rose-950/40 border border-rose-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.ok ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            {aiStatus.ok ? 'DAEMON ONLINE' : 'DAEMON OFFLINE'}
          </span>
          <button 
            onClick={pingDaemon}
            disabled={loadingHealth}
            className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Làm mới trạng thái"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Column 1: Daemon Info */}
        <div className="p-4 bg-slate-900/40 border border-slate-900/60 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Thông tin Daemon</div>
            {aiStatus.ok && healthInfo ? (
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold">Tên dịch vụ</div>
                  <div className="text-xs text-slate-200 font-bold">{healthInfo.service}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold">Phiên bản</div>
                  <div className="text-xs text-slate-200 font-bold">v{healthInfo.version}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold">Thư mục làm việc (Workspace)</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-full" title={healthInfo.workspaceRoot}>
                    {healthInfo.workspaceRoot}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4">
                Không có thông tin. Vui lòng chạy lệnh sau để khởi động daemon local:
                <code className="block mt-2 p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-emerald-400">
                  npm run assistant:start
                </code>
              </div>
            )}
          </div>
          
          {aiStatus.ok && (
            <button 
              onClick={openAIAssistant}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 bg-violet-600/90 hover:bg-violet-500 text-white text-xs font-black rounded-xl transition-all"
            >
              <Terminal className="h-3.5 w-3.5" />
              Mở AI Coding Panel
            </button>
          )}
        </div>

        {/* Column 2: Code Indexer (RAG) */}
        <div className="p-4 bg-slate-900/40 border border-slate-900/60 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Đánh chỉ mục mã nguồn (RAG)</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Quét và lưu trữ các tệp mã nguồn của dự án vào cơ sở dữ liệu TF-IDF cục bộ để cải thiện chất lượng tìm kiếm ngữ cảnh cho AI.
            </p>
            
            {indexResult && (
              <div className="mt-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[10px] text-slate-400 font-mono leading-5">{indexResult}</div>
              </div>
            )}
          </div>

          <button 
            onClick={runReindex}
            disabled={indexing || !aiStatus.ok}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-black rounded-xl transition-all"
          >
            {indexing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            )}
            {indexing ? 'Đang index mã nguồn...' : 'Đánh lại chỉ mục (Re-index)'}
          </button>
        </div>

        {/* Column 3: AI Roles Selector */}
        <div className="p-4 bg-slate-900/40 border border-slate-900/60 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Vai trò AI hoạt động</div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Đặt vai trò toàn cục cho AI Staff. Mọi câu lệnh code/system prompt sẽ được tùy biến cho vai trò tương ứng.
            </p>
            
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              disabled={!aiStatus.ok}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500/60 outline-none font-bold"
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
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:text-white disabled:opacity-40"
              title="Tải lại danh sách vai trò từ server"
            >
              <RefreshCw className={`h-3 w-3 ${loadingRoles ? 'animate-spin' : ''}`} /> Reload Roles
            </button>
          </div>

          <div className="mt-4 p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 font-semibold">Vai trò đang chọn: </span>
            <span className="text-[11px] text-violet-300 font-black">
              {selectedRole ? `${roles.find(r => r.id === selectedRole)?.emoji || '🤖'} ${selectedRole}` : '💻 AI Dev'}
            </span>
          </div>

          {selectedRole && (
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  System prompt đồng bộ từ server
                </div>
                <button
                  onClick={() => {
                    rolePromptNotifyRef.current = true;
                    setRolePromptTick((v) => v + 1);
                  }}
                  disabled={loadingRolePrompt || !aiStatus.ok}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-300 hover:text-white disabled:opacity-40"
                  title="Tải lại prompt từ server"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingRolePrompt ? 'animate-spin' : ''}`} /> Reload
                </button>
              </div>
              {loadingRolePrompt ? (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang tải prompt...
                </div>
              ) : (
                <pre className="max-h-24 overflow-auto whitespace-pre-wrap text-[10px] leading-5 text-slate-300">{selectedRolePrompt || 'Không tải được prompt cho role này.'}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
