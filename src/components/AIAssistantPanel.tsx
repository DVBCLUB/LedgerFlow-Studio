import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, FileSearch, Activity, Loader2, RefreshCw, CircleDot, User, HardDrive,
  Code2, Clock, GitCommit, Shield, Terminal, Zap, ArrowRight
} from 'lucide-react';
import {
  checkDaemonHealth, editFile, applyEdit, rollbackFile,
  askAI, readFile, listBackups, getDiff,
  searchCodebase, reindexCodebase, fetchAgentRoles, fetchAgentRoleById,
  executeWebAI, fetchWebAIProfiles, createWebAIProfile, deleteWebAIProfile,
  type AssistantHealth, type EditResult, type FileContext,
  type BackupEntry, type AskResult, type SearchResultMatch,
  type WebAIProfile
} from '../utils/assistantApi';

import ChatTab, { type ChatMessage } from './ai-assistant/ChatTab';
import EditTab from './ai-assistant/EditTab';
import ProfilesTab from './ai-assistant/ProfilesTab';
import DiffViewer from './ai-assistant/DiffViewer';

type PanelTab = 'chat' | 'edit' | 'diff' | 'backups' | 'status' | 'search' | 'profiles';

export default function AIAssistantPanel() {
  const [tab, setTab] = useState<PanelTab>('chat');
  const [health, setHealth] = useState<AssistantHealth | null>(null);

  // Web AI execution settings state
  const [engineMode, setEngineMode] = useState<'api' | 'web_automation'>('api');
  const [webPlatform, setWebPlatform] = useState<string>('chatgpt');
  const [daemonError, setDaemonError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [syncNotice, setSyncNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: '🤖 **AI Coding Assistant** đã sẵn sàng!\n\nHãy hỏi bất kỳ câu hỏi nào về code, hoặc chuyển sang tab **Edit File** để AI sửa file trong workspace.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Edit state
  const [editFile_path, setEditFilePath] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editResult, setEditResult] = useState<EditResult | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [autoRepairEnabled, setAutoRepairEnabled] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultMatch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [indexingLoading, setIndexingLoading] = useState(false);
  const [indexStats, setIndexStats] = useState<string>('');

  // AI Roles state
  const [roles, setRoles] = useState<{ id: string; emoji: string; group: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRolePrompt, setSelectedRolePrompt] = useState('');
  const [rolePromptLoading, setRolePromptLoading] = useState(false);
  const [rolePromptTick, setRolePromptTick] = useState(0);
  const rolePromptNotifyRef = useRef(false);
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    try {
      return localStorage.getItem('lf_assistant_selected_role') || '';
    } catch {
      return '';
    }
  });

  // Diff state
  const [diffContent, setDiffContent] = useState('');
  const [diffLoading, setDiffLoading] = useState(false);

  // Backups state
  const [backupFile, setBackupFile] = useState('');
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);

  // Web AI Profiles state
  const [webAIProfiles, setWebAIProfiles] = useState<WebAIProfile[]>([]);
  const [webAIProfilesLoading, setWebAIProfilesLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePlatform, setNewProfilePlatform] = useState('chatgpt');
  const [headlessEnabled, setHeadlessEnabled] = useState(false);

  const pushNotice = useCallback((kind: 'success' | 'error', text: string) => {
    setSyncNotice({ kind, text });
  }, []);

  // ─── Ping daemon on mount ─────────────────────────────────────────────────
  const pingDaemon = useCallback(async () => {
    setChecking(true);
    setDaemonError(null);
    try {
      const h = await checkDaemonHealth();
      setHealth(h);
    } catch (err: any) {
      setDaemonError(err.message);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadRoles = useCallback(async (silent = false) => {
    setRolesLoading(true);
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
      setRolesLoading(false);
    }
  }, [pushNotice]);

  const loadWebAIProfiles = useCallback(async (silent = false) => {
    setWebAIProfilesLoading(true);
    try {
      const list = await fetchWebAIProfiles();
      setWebAIProfiles(list);
      if (!silent) {
        pushNotice('success', `Đã đồng bộ ${list.length} profile Web AI.`);
      }
    } catch (err: any) {
      if (!silent) {
        pushNotice('error', `Không tải được danh sách profile: ${err.message}`);
      }
    } finally {
      setWebAIProfilesLoading(false);
    }
  }, [pushNotice]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfilePlatform) return;
    try {
      await createWebAIProfile(newProfileName.trim(), newProfilePlatform);
      setNewProfileName('');
      pushNotice('success', `Đã tạo profile "${newProfileName}" thành công.`);
      await loadWebAIProfiles(true);
    } catch (err: any) {
      pushNotice('error', `Lỗi khi tạo profile: ${err.message}`);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa profile này? Mọi session cookies và dữ liệu duyệt web của profile sẽ bị xóa.')) return;
    try {
      await deleteWebAIProfile(id);
      pushNotice('success', 'Đã xóa profile.');
      if (selectedProfileId === id) {
        setSelectedProfileId('');
      }
      await loadWebAIProfiles(true);
    } catch (err: any) {
      pushNotice('error', `Lỗi khi xóa profile: ${err.message}`);
    }
  };

  useEffect(() => {
    pingDaemon();
    loadRoles(true);
    loadWebAIProfiles(true);
  }, [pingDaemon, loadRoles, loadWebAIProfiles]);

  useEffect(() => {
    let cancelled = false;

    const loadRolePrompt = async () => {
      if (!selectedRole) {
        setSelectedRolePrompt('');
        return;
      }

      setRolePromptLoading(true);
      try {
        const detail = await fetchAgentRoleById(selectedRole);
        if (!cancelled) {
          setSelectedRolePrompt(detail.systemPrompt || '');
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
          setRolePromptLoading(false);
        }
      }
    };

    loadRolePrompt();
    return () => {
      cancelled = true;
    };
  }, [selectedRole, rolePromptTick, pushNotice]);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = window.setTimeout(() => setSyncNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [syncNotice]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Chat ─────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      let answerText = '';
      let modelUsedText = '';
      if (engineMode === 'web_automation') {
        const webRes = await executeWebAI(question, webPlatform, undefined, selectedProfileId || undefined, headlessEnabled);
        answerText = webRes.text;
        modelUsedText = webRes.modelUsed;
      } else {
        const result: AskResult = await askAI(question, undefined, undefined);
        answerText = result.answer;
        modelUsedText = result.modelUsed;
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_a',
        role: 'assistant',
        content: answerText,
        modelUsed: modelUsedText,
        timestamp: new Date().toISOString()
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_e',
        role: 'assistant',
        content: `❌ Lỗi: ${err.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const runEdit = async () => {
    if (!editFile_path.trim() || !editInstruction.trim()) return;
    setEditLoading(true);
    setEditResult(null);
    setApplyResult(null);

    // Support multiple files split by comma
    const filesArray = editFile_path.split(',').map(f => f.trim()).filter(Boolean);

    try {
      let result: EditResult;
      if (engineMode === 'web_automation') {
        const webRes = await executeWebAI(
          `Hãy chỉnh sửa hoặc viết lại code cho file: ${filesArray.join(', ')}\nHướng dẫn chi tiết: ${editInstruction.trim()}\nHãy trả về code đầy đủ của file và đặt nó trong block code Markdown.`,
          webPlatform,
          filesArray,
          selectedProfileId || undefined,
          headlessEnabled
        );
        result = {
          ok: webRes.ok,
          file: filesArray[0],
          instruction: editInstruction.trim(),
          taskDetected: 'refactor',
          modelUsed: webRes.modelUsed,
          explanation: webRes.text,
          codeBlocks: webRes.codeBlocks,
          primaryCode: webRes.codeBlocks[0] || null,
          hasPendingSuggestion: webRes.hasPendingSuggestion,
          rawResponse: webRes.text,
        };
      } else {
        result = await editFile(filesArray, editInstruction.trim(), undefined, selectedRole || undefined);
      }

      setEditResult(result);
      // Auto-load diff if primary code available
      if (result.primaryCode) {
        try {
          const fileCtx = await readFile(filesArray[0]);
          const diffRes = await getDiff(filesArray[0], fileCtx.content, result.primaryCode.code);
          setDiffContent(diffRes.diff);
        } catch { /* diff is optional */ }
      }
    } catch (err: any) {
      setEditResult({ ok: false } as any);
      setApplyResult(`❌ ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const runApply = async () => {
    if (!editFile_path.trim()) return;
    setApplyLoading(true);
    setApplyResult(null);
    const filesArray = editFile_path.split(',').map(f => f.trim()).filter(Boolean);

    try {
      const result = await applyEdit(filesArray, 'auto', autoRepairEnabled, editInstruction);
      setApplyResult(`✅ ${result.message}`);
      setEditResult(null);
    } catch (err: any) {
      setApplyResult(`❌ ${err.message}`);
    } finally {
      setApplyLoading(false);
    }
  };

  const runRollback = async () => {
    if (!editFile_path.trim()) return;
    setRollbackLoading(true);
    const filesArray = editFile_path.split(',').map(f => f.trim()).filter(Boolean);

    try {
      const rollbacks = await Promise.all(
        filesArray.map(async (f) => {
          const res = await rollbackFile(f);
          return `${f}: ${res.message}`;
        })
      );
      setApplyResult(`↩️ Rolled back:\n${rollbacks.join('\n')}`);
      setEditResult(null);
    } catch (err: any) {
      setApplyResult(`❌ Rollback: ${err.message}`);
    } finally {
      setRollbackLoading(false);
    }
  };

  // ─── Code Search ─────────────────────────────────────────────────────────
  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const matches = await searchCodebase(searchQuery.trim());
      setSearchResults(matches);
      pushNotice('success', `Tìm thấy ${matches.length} kết quả phù hợp.`);
    } catch (err: any) {
      pushNotice('error', `Lỗi tìm kiếm: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const runReindex = async () => {
    setIndexingLoading(true);
    setIndexStats('');
    try {
      const res = await reindexCodebase();
      setIndexStats(`Index thành công: ${res.totalFiles} files (${res.durationMs}ms)`);
      pushNotice('success', `Re-index thành công: ${res.totalFiles} files.`);
    } catch (err: any) {
      setIndexStats(`Lỗi reindex: ${err.message}`);
      pushNotice('error', `Lỗi reindex: ${err.message}`);
    } finally {
      setIndexingLoading(false);
    }
  };

  // ─── Backups ─────────────────────────────────────────────────────────────
  const loadBackups = async () => {
    if (!backupFile.trim()) return;
    setBackupsLoading(true);
    try {
      const b = await listBackups(backupFile.trim());
      setBackups(b);
    } catch { setBackups([]); }
    finally { setBackupsLoading(false); }
  };

  // ─── Daemon offline state ─────────────────────────────────────────────────
  if (daemonError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center">
          <Bot className="h-8 w-8 text-rose-400" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white mb-2">Daemon chưa chạy</h3>
          <p className="text-slate-400 text-sm mb-4 max-w-sm">{daemonError}</p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left mb-4">
            <p className="text-xs text-slate-500 font-mono mb-2"># Mở terminal và chạy:</p>
            <p className="text-sm text-emerald-400 font-mono font-bold">npm run assistant:start</p>
          </div>
        </div>
        <button
          onClick={pingDaemon}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-black rounded-xl transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Thử kết nối lại
        </button>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Đang kết nối AI Coding Assistant...</p>
      </div>
    );
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat', icon: <Bot className="h-3.5 w-3.5" /> },
    { id: 'edit', label: 'Edit File', icon: <Bot className="h-3.5 w-3.5" /> },
    { id: 'profiles', label: 'Profiles', icon: <User className="h-3.5 w-3.5" /> },
    { id: 'search', label: 'Search Code', icon: <FileSearch className="h-3.5 w-3.5" /> },
    { id: 'diff', label: 'Diff', icon: <Code2 className="h-3.5 w-3.5" /> },
    { id: 'backups', label: 'Backups', icon: <HardDrive className="h-3.5 w-3.5" /> },
    { id: 'status', label: 'Status', icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-2xl border border-slate-800/60 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-violet-950/40 to-slate-950/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-white leading-none">AI Coding Assistant</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">
              {health ? `Daemon v${health.version} · ${health.workspaceRoot.split('\\').pop()}` : 'Connecting...'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-full">
            <CircleDot className="h-2.5 w-2.5 animate-pulse" /> LIVE
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-slate-800/60 shrink-0 bg-slate-950/40">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-t-lg border-b-2 transition-all ${
              tab === t.id
                ? 'text-violet-300 border-violet-500 bg-violet-950/30'
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {syncNotice && (
          <div className={`mx-4 mt-3 rounded-xl border px-3 py-2 text-[11px] font-bold ${
            syncNotice.kind === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
              : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
          }`}>
            {syncNotice.text}
          </div>
        )}

        {/* ── Chat Tab ──────────────────────────────────────────────── */}
        {tab === 'chat' && (
          <ChatTab
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatLoading={chatLoading}
            sendChat={sendChat}
            engineMode={engineMode}
            setEngineMode={setEngineMode}
            webPlatform={webPlatform}
            setWebPlatform={setWebPlatform}
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            webAIProfiles={webAIProfiles}
            headlessEnabled={headlessEnabled}
            setHeadlessEnabled={setHeadlessEnabled}
            chatEndRef={chatEndRef}
          />
        )}

        {/* ── Edit Tab ──────────────────────────────────────────────── */}
        {tab === 'edit' && (
          <EditTab
            engineMode={engineMode}
            setEngineMode={setEngineMode}
            webPlatform={webPlatform}
            setWebPlatform={setWebPlatform}
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            webAIProfiles={webAIProfiles}
            headlessEnabled={headlessEnabled}
            setHeadlessEnabled={setHeadlessEnabled}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            roles={roles}
            rolesLoading={rolesLoading}
            loadRoles={loadRoles}
            selectedRolePrompt={selectedRolePrompt}
            rolePromptLoading={rolePromptLoading}
            setRolePromptTick={setRolePromptTick}
            editFile_path={editFile_path}
            setEditFilePath={setEditFilePath}
            editInstruction={editInstruction}
            setEditInstruction={setEditInstruction}
            autoRepairEnabled={autoRepairEnabled}
            setAutoRepairEnabled={setAutoRepairEnabled}
            editLoading={editLoading}
            runEdit={runEdit}
            editResult={editResult}
            runApply={runApply}
            applyLoading={applyLoading}
            setEditResult={setEditResult}
            setApplyResult={setApplyResult}
            runRollback={runRollback}
            rollbackLoading={rollbackLoading}
            applyResult={applyResult}
            rolePromptNotifyRef={rolePromptNotifyRef}
          />
        )}

        {/* ── Profiles Tab ────────────────────────────────────────────── */}
        {tab === 'profiles' && (
          <ProfilesTab
            webAIProfiles={webAIProfiles}
            webAIProfilesLoading={webAIProfilesLoading}
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            newProfileName={newProfileName}
            setNewProfileName={setNewProfileName}
            newProfilePlatform={newProfilePlatform}
            setNewProfilePlatform={setNewProfilePlatform}
            handleCreateProfile={handleCreateProfile}
            handleDeleteProfile={handleDeleteProfile}
            loadWebAIProfiles={loadWebAIProfiles}
            pushNotice={pushNotice}
          />
        )}

        {/* ── Search Tab ──────────────────────────────────────────────── */}
        {tab === 'search' && (
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={runReindex}
                  disabled={indexingLoading}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                  title="Tải lại chỉ mục từ khóa của dự án"
                >
                  {indexingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Re-index
                </button>
                <div className="flex-1 flex gap-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-violet-500/60 transition-colors">
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runSearch()}
                    placeholder="Tìm kiếm mã nguồn (TF-IDF)..."
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none"
                  />
                  <button
                    onClick={runSearch}
                    disabled={searchLoading || !searchQuery.trim()}
                    className="px-3 text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
                  >
                    <FileSearch className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {indexStats && (
                <p className="text-[10px] font-mono text-slate-500">{indexStats}</p>
              )}
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {searchLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                  <span className="text-xs">Đang tìm kiếm...</span>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 text-center">
                  <FileSearch className="h-8 w-8 opacity-30" />
                  <p className="text-xs font-semibold">Nhập từ khóa để tìm kiếm các file code liên quan trong toàn bộ dự án.</p>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && searchResults.map((match, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate font-mono">{match.relativePath}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-950/40 text-violet-300 border border-violet-800/40">
                      Score: {match.score.toFixed(3)}
                    </span>
                  </div>
                  {match.snippet && (
                    <pre className="p-2 rounded bg-slate-950/80 border border-slate-800 font-mono text-[10px] leading-4 text-slate-400 overflow-x-auto whitespace-pre">
                      {match.snippet}
                    </pre>
                  )}
                  <button
                    onClick={() => {
                      setEditFilePath(match.relativePath);
                      setTab('edit');
                    }}
                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 font-bold"
                  >
                    Đưa vào Edit File <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Diff Tab ──────────────────────────────────────────────── */}
        {tab === 'diff' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 shrink-0">
              <div className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5" /> Unified Diff Preview
              </div>
              {diffLoading && <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />}
            </div>
            <div className="flex-1 overflow-auto">
              {diffContent ? (
                <DiffViewer diff={diffContent} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 p-8 text-center">
                  <Code2 className="h-10 w-10 opacity-20" />
                  <p className="text-xs font-semibold">Diff sẽ tự động xuất hiện sau khi bạn tạo đề xuất AI ở tab <strong className="text-slate-400">Edit File</strong>.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Backups Tab ───────────────────────────────────────────── */}
        {tab === 'backups' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                File để xem backups
              </label>
              <div className="flex gap-2">
                <input
                  value={backupFile}
                  onChange={e => setBackupFile(e.target.value)}
                  placeholder="server/services/aiRouter.ts"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-violet-500/60 outline-none font-mono"
                />
                <button
                  onClick={loadBackups}
                  disabled={backupsLoading}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors"
                >
                  {backupsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {backups.length === 0 && !backupsLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                <HardDrive className="h-8 w-8 opacity-30" />
                <p className="text-xs font-semibold text-center">Nhập đường dẫn file và nhấn tìm kiếm.<br />Backups được tạo tự động khi AI apply code.</p>
              </div>
            )}

            {backups.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {backups.length} backup(s) tìm thấy
                </div>
                {backups.map((b, i) => (
                  <div key={b.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 font-mono">#{i + 1} · {b.id.slice(0, 8)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.strategy === 'git-commit'
                          ? 'bg-violet-950/40 text-violet-400 border border-violet-700/40'
                          : 'bg-amber-950/40 text-amber-400 border border-amber-700/40'
                      }`}>
                        {b.strategy === 'git-commit' ? <><GitCommit className="h-2.5 w-2.5 inline mr-1" />git</> : <><HardDrive className="h-2.5 w-2.5 inline mr-1" />file</>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(b.createdAt).toLocaleString('vi-VN')}
                    </div>
                    {b.commitHash && (
                      <div className="text-[10px] text-violet-400 font-mono">{b.commitHash.slice(0, 12)}</div>
                    )}
                    {b.backupCopyPath && (
                      <div className="text-[10px] text-slate-500 font-mono truncate">{b.backupCopyPath}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Status Tab ────────────────────────────────────────────── */}
        {tab === 'status' && (
          <div className="p-4 space-y-4">
            {health && (
              <>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                    <Shield className="h-4 w-4" /> Daemon Status
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Service</div>
                      <div className="text-slate-200 font-bold">{health.service}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Version</div>
                      <div className="text-slate-200 font-bold">v{health.version}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] text-slate-500 font-semibold mb-0.5">Workspace Root</div>
                      <div className="text-slate-300 font-mono text-[10px] break-all">{health.workspaceRoot}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                    <Terminal className="h-4 w-4" /> Quick Commands
                  </div>
                  {[
                    { cmd: 'npm run assistant:start', desc: 'Khởi động daemon' },
                    { cmd: 'npm run assistant:cli -- status', desc: 'CLI status' },
                    { cmd: 'npm run assistant:cli -- chat', desc: 'Interactive REPL' },
                  ].map(({ cmd, desc }) => (
                    <div key={cmd} className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                      <code className="text-[10px] text-emerald-400 font-mono">{cmd}</code>
                      <span className="text-[10px] text-slate-500 shrink-0">{desc}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                    <Zap className="h-4 w-4" /> Cấu hình AI Keys
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    AI keys được quản lý tập trung tại <strong className="text-slate-300">LedgerFlow AI Settings</strong>.
                    Daemon dùng chung Key Vault và Multi-LLM Router với app chính.
                  </p>
                  <a
                    href="/#/ai_settings"
                    className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 font-bold transition-colors"
                  >
                    Mở AI Settings <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </>
            )}
            <button
              onClick={pingDaemon}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors border border-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới trạng thái
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
