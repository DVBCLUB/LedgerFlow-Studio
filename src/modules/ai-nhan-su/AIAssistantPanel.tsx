import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, FileSearch, Activity, Loader2, RefreshCw, CircleDot, User, HardDrive, Users, Code2, Clock, GitCommit, Shield, Terminal, Zap, ArrowRight, Settings, ChevronDown, ChevronUp, DollarSign, FlaskConical, TrendingUp } from 'lucide-react';
import {
  checkDaemonHealth, editFile, applyEdit, rollbackFile, getApplyStatus,
  askAI, readFile, listBackups, getDiff,
  searchCodebase, reindexCodebase, fetchAgentRoles, fetchAgentRoleById,
  executeWebAI, fetchWebAIProfiles, createWebAIProfile, deleteWebAIProfile,
  previewWebAIExecution, approveWebAIExecution, dispatchAIFabric,
  type AssistantHealth, type EditResult, type FileContext,
  type BackupEntry, type AskResult, type SearchResultMatch,
  type WebAIProfile
} from '../../utils/assistantApi';

import ChatTab, { type ChatMessage } from './ai-assistant/ChatTab';
import EditTab from './ai-assistant/EditTab';
import ProfilesTab from './ai-assistant/ProfilesTab';
import DiffViewer from './ai-assistant/DiffViewer';
import AIOperationsSandbox from './ai-assistant/AIOperationsSandbox';
import ControlPlaneTab from './ai-assistant/ControlPlaneTab';
import BrowserRunbookTab from './ai-assistant/BrowserRunbookTab';
import AgentLoopMonitor from './ai-assistant/AgentLoopMonitor';
import MultiAgentMonitor from './ai-assistant/MultiAgentMonitor';
import CostDashboard from './ai-assistant/CostDashboard';
import SystemStatusPage from './ai-assistant/SystemStatusPage';
import ABTestPanel from './ai-assistant/ABTestPanel';
import AnalyticsDashboard from './ai-assistant/AnalyticsDashboard';
import AiPipelineViz from './ai-assistant/AiPipelineViz';
import AgentLiveTerminal from './ai-assistant/AgentLiveTerminal';
import UnifiedDashboard from './ai-assistant/UnifiedDashboard';

type PanelTab = 'chat' | 'edit' | 'diff' | 'backups' | 'status' | 'search' | 'profiles' | 'sandbox' | 'runbook' | 'agent_loop' | 'multi_agent' | 'cost' | 'system' | 'ab_test' | 'analytics' | 'pipeline' | 'terminal' | 'control' | 'overview';
type EngineMode = 'api' | 'web_automation' | 'fabric';

export default function AIAssistantPanel() {
  const [tab, setTab] = useState<PanelTab>('chat');
  const [showDevTabs, setShowDevTabs] = useState(false);
  const [health, setHealth] = useState<AssistantHealth | null>(null);

  // Auto-expand developer tools when tab is set to a developer tab
  useEffect(() => {
    const devTabs: PanelTab[] = ['edit', 'profiles', 'search', 'diff', 'backups', 'status', 'runbook', 'agent_loop', 'multi_agent', 'cost', 'system', 'ab_test', 'analytics', 'pipeline', 'terminal'];
    if (devTabs.includes(tab)) {
      setShowDevTabs(true);
    }
  }, [tab]);

  // Web AI execution settings state
  const [engineMode, setEngineMode] = useState<EngineMode>('api');
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
  const [applyResult, setApplyResult] = useState<any | null>(null);
  const [applyProgress, setApplyProgress] = useState<any | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [autoRepairEnabled, setAutoRepairEnabled] = useState(false);
  const [captureScreenshot, setCaptureScreenshot] = useState(false);

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

  // Custom Glassmorphic Dialog Modal state
  const [activeModal, setActiveModal] = useState<{
    type: 'privacy' | 'quota';
    title: string;
    message: string;
    details?: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const showCustomConfirm = useCallback((
    type: 'privacy' | 'quota',
    title: string,
    message: string,
    details?: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setActiveModal({
        type,
        title,
        message,
        details,
        onConfirm: () => {
          setActiveModal(null);
          resolve(true);
        },
        onCancel: () => {
          setActiveModal(null);
          resolve(false);
        }
      });
    });
  }, []);

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
      try {
        const storedId = localStorage.getItem('lf_selected_profile_id');
        const matched = storedId ? list.find((profile) => profile.id === storedId) : undefined;
        if (matched) {
          setSelectedProfileId(matched.id);
          setWebPlatform(matched.platform);
        } else if (!selectedProfileId && list.length > 0) {
          setSelectedProfileId(list[0].id);
          setWebPlatform(list[0].platform);
        } else if (list.length === 0) {
          setSelectedProfileId('');
        }
      } catch {
        if (!selectedProfileId && list.length > 0) {
          setSelectedProfileId(list[0].id);
          setWebPlatform(list[0].platform);
        }
      }
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
  }, [pushNotice, selectedProfileId]);

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
    if (!selectedProfileId) return;
    const selected = webAIProfiles.find((profile) => profile.id === selectedProfileId);
    if (!selected || selected.platform !== webPlatform) setSelectedProfileId('');
  }, [selectedProfileId, webAIProfiles, webPlatform]);

  useEffect(() => {
    try {
      if (selectedProfileId) {
        localStorage.setItem('lf_selected_profile_id', selectedProfileId);
      }
    } catch {
      // Ignore persistence issues on localStorage.
    }
  }, [selectedProfileId]);

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

  const executeGuardedWebAI = async (prompt: string, file?: string | string[], captureScreenshot?: boolean): Promise<any> => {
    let currentProfileId = selectedProfileId || undefined;
    
    while (true) {
      try {
        const preview = await previewWebAIExecution(prompt, webPlatform, currentProfileId);
        if (preview.blocked) {
          const types = preview.findings.map((finding) => finding.type).join(', ');
          throw new Error(`Blocked: the prompt contains secrets (${types}). Remove them before using Web AI.`);
        }
        let approvalToken: string | undefined;
        if (preview.requiresApproval) {
          const findings = preview.findings.map((finding) => `${finding.type}: ${finding.count}`).join(', ');
          const confirmed = await showCustomConfirm(
            'privacy',
            'Xác nhận gửi dữ liệu nhạy cảm',
            `LedgerFlow phát hiện dữ liệu nhạy cảm sắp được truyền tải lên nền tảng Web ${webPlatform}.\n\nChi tiết phát hiện: ${findings}`,
            preview.redactedPreview
          );
          if (!confirmed) throw new Error('Web AI transmission was cancelled before sensitive data left the device.');
          approvalToken = (await approveWebAIExecution(preview.id, preview.fingerprint)).approvalToken;
        }
        
        return await executeWebAI(
          prompt,
          webPlatform,
          file,
          currentProfileId,
          headlessEnabled,
          false,
          preview.id,
          approvalToken,
          captureScreenshot
        );
      } catch (err: any) {
        if (err.isQuotaError && err.fallbackProfile) {
          const fallback = err.fallbackProfile;
          const currentName = currentProfileId ? (webAIProfiles.find(p => p.id === currentProfileId)?.name || currentProfileId) : "Default";
          const confirmed = await showCustomConfirm(
            'quota',
            'Hết lượt (Quota) - Xoay vòng tài khoản',
            `Tài khoản hiện tại "${currentName}" của bạn đã hết quota (lượt dùng) trên hệ thống Web ${webPlatform}.`,
            `LedgerFlow đề xuất chuyển tự động sang tài khoản dự phòng:\n👉 "${fallback.name}" (${fallback.platform})\n\nBạn có muốn chuyển tài khoản và thực thi lại tác vụ ngay không?`
          );
          if (confirmed) {
            setSelectedProfileId(fallback.id);
            currentProfileId = fallback.id;
            await loadWebAIProfiles(true);
            continue;
          }
        }
        throw err;
      }
    }
  };

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
      let runbookId: string | undefined;
      if (engineMode === 'fabric') {
        const fabricRes = await dispatchAIFabric({ text: question, webPlatform, profileId: selectedProfileId || undefined, localFallback: true });
        answerText = fabricRes.steps.find(s => s.status === 'success')?.contentPreview || 'Fabric exhausted all routes.';
        modelUsedText = fabricRes.modelUsed || 'fabric-all';
        if (fabricRes.status !== 'completed') {
          throw new Error(`AI Fabric exhausted all routes. Steps: ${fabricRes.steps.map(s => `${s.route}=${s.status}`).join(', ')}`);
        }
      } else if (engineMode === 'web_automation') {
        const webRes = await executeGuardedWebAI(question);
        answerText = webRes.text;
        modelUsedText = webRes.modelUsed;
        runbookId = (webRes as any).runbookSessionId;
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
        timestamp: new Date().toISOString(),
        runbookSessionId: runbookId,
      } as ChatMessage]);
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
        const promptText = `Hãy chỉnh sửa hoặc viết lại code cho file: ${filesArray.join(', ')}\nHướng dẫn chi tiết: ${editInstruction.trim()}\nHãy trả về code đầy đủ của file và đặt nó trong block code Markdown.`;
        const webRes = await executeGuardedWebAI(promptText, filesArray, captureScreenshot);
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
          screenshotPath: webRes.screenshotPath,
        } as any;
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
    setApplyProgress({ active: true, loop: 0, maxLoops: 2, status: 'checking', message: 'Đang khởi chạy tiến trình ghi file...' });
    const filesArray = editFile_path.split(',').map(f => f.trim()).filter(Boolean);

    const statusInterval = setInterval(async () => {
      try {
        const res = await getApplyStatus();
        if (res && res.success && res.progress) {
          setApplyProgress(res.progress);
        }
      } catch {
        // Ignore network polling failures
      }
    }, 1000);

    try {
      const result = await applyEdit(filesArray, 'auto', autoRepairEnabled, editInstruction);
      setApplyResult({
        success: true,
        message: result.message,
        applied: result.applied,
        results: result.results,
        repairStatus: result.repairStatus,
      });
      setEditResult(null);
    } catch (err: any) {
      setApplyResult({
        success: false,
        message: err.message,
      });
    } finally {
      clearInterval(statusInterval);
      setApplyLoading(false);
      setApplyProgress(null);
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
      setApplyResult({
        success: true,
        message: `↩️ Rolled back:\n${rollbacks.join('\n')}`,
      });
      setEditResult(null);
    } catch (err: any) {
      setApplyResult({
        success: false,
        message: `Rollback: ${err.message}`,
      });
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
          <h3 className="text-lg font-black text-text-primary mb-2">Daemon chưa chạy</h3>
          <p className="text-text-secondary text-sm mb-4 max-w-sm">{daemonError}</p>
          <div className="bg-bg-primary border border-border-primary rounded-xl p-4 text-left mb-4">
            <p className="text-xs text-text-tertiary font-mono mb-2"># Mở terminal và chạy:</p>
            <p className="text-sm text-emerald-400 font-mono font-bold">npm run assistant:start</p>
          </div>
        </div>
        <button
          onClick={pingDaemon}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-text-primary text-sm font-black rounded-xl transition-colors"
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
        <p className="text-text-secondary text-sm font-semibold">Đang kết nối AI Coding Assistant...</p>
      </div>
    );
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const CORE_TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Hội thoại & Ra lệnh', icon: <Bot className="h-3.5 w-3.5" /> },
    { id: 'overview', label: 'Tổng quan', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'control', label: 'AI Control Plane', icon: <Shield className="h-3.5 w-3.5" /> },
    { id: 'sandbox', label: 'AI Sandbox (Robot)', icon: <Terminal className="h-3.5 w-3.5" /> },
  ];

  const DEV_TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'edit', label: 'Edit File', icon: <Bot className="h-3 w-3" /> },
    { id: 'profiles', label: 'Profiles', icon: <User className="h-3 w-3" /> },
    { id: 'runbook', label: 'Runbook', icon: <Clock className="h-3 w-3" /> },
    { id: 'agent_loop', label: 'Agent Loop', icon: <RefreshCw className="h-3 w-3" /> },
    { id: 'multi_agent', label: 'Agents', icon: <Users className="h-3 w-3" /> },
    { id: 'cost', label: 'Cost', icon: <DollarSign className="h-3 w-3" /> },
    { id: 'system', label: 'System', icon: <Shield className="h-3 w-3" /> },
    { id: 'ab_test', label: 'A/B Test', icon: <FlaskConical className="h-3 w-3" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="h-3 w-3" /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Zap className="h-3 w-3" /> },
    { id: 'terminal', label: 'Terminal', icon: <Terminal className="h-3 w-3" /> },
    { id: 'search', label: 'Search Code', icon: <FileSearch className="h-3 w-3" /> },
    { id: 'diff', label: 'Diff', icon: <Code2 className="h-3 w-3" /> },
    { id: 'backups', label: 'Backups', icon: <HardDrive className="h-3 w-3" /> },
    { id: 'status', label: 'Status', icon: <Activity className="h-3 w-3" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-2xl border border-border-primary/60 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-gradient-to-r from-violet-950/40 to-slate-950/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Bot className="h-4 w-4 text-text-primary" />
          </div>
          <div>
            <div className="text-sm font-black text-text-primary leading-none">AI Coding Assistant</div>
            <div className="text-[10px] text-text-tertiary mt-0.5 font-semibold">
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
      <div className="flex flex-col border-b border-border-primary/60 shrink-0 bg-slate-950/40">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Core Tabs */}
          <div className="flex items-center gap-1.5">
            {CORE_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl transition-all border ${
                  tab === t.id
                    ? 'bg-violet-600/20 text-violet-300 border-violet-500/40 shadow-lg shadow-violet-500/5'
                    : 'text-text-secondary border-transparent hover:text-slate-200 hover:bg-bg-primary/40'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Developer Tools Toggle */}
          <button
            onClick={() => setShowDevTabs(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
              showDevTabs
                ? 'bg-bg-primary border-border-secondary text-violet-400'
                : 'border-transparent text-text-tertiary hover:text-text-secondary hover:bg-bg-primary/40'
            }`}
          >
            <Settings className={`h-3.5 w-3.5 transition-transform duration-300 ${showDevTabs ? 'rotate-45' : ''}`} />
            <span className="hidden sm:inline">Công cụ lập trình</span>
            {showDevTabs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Developer Tabs (Collapsible sub-row) */}
        {showDevTabs && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2 pt-1 border-t border-slate-900 bg-slate-950/60 transition-all duration-300">
            {DEV_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-bold rounded-lg border transition-all ${
                  tab === t.id
                    ? 'text-violet-300 border-violet-800 bg-violet-950/20'
                    : 'text-text-tertiary border-transparent hover:text-text-secondary hover:bg-bg-primary/20'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}
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
            captureScreenshot={captureScreenshot}
            setCaptureScreenshot={setCaptureScreenshot}
            editLoading={editLoading}
            runEdit={runEdit}
            editResult={editResult}
            runApply={runApply}
            applyLoading={applyLoading}
            applyProgress={applyProgress}
            setEditResult={setEditResult}
            setApplyResult={setApplyResult}
            runRollback={runRollback}
            rollbackLoading={rollbackLoading}
            applyResult={applyResult}
            rolePromptNotifyRef={rolePromptNotifyRef}
          />
        )}

        {/* ── Sandbox Tab ────────────────────────────────────────────── */}
        {tab === 'sandbox' && (
          <AIOperationsSandbox />
        )}

        {/* ── Overview Tab ────────────────────────────────────────────── */}
        {tab === 'overview' && <UnifiedDashboard />}

        {/* ── Control Plane Tab ───────────────────────────────────────── */}
        {tab === 'control' && (
          <ControlPlaneTab
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            setWebPlatform={setWebPlatform}
            loadWebAIProfiles={loadWebAIProfiles}
            pushNotice={pushNotice}
          />
        )}

        {/* ── Runbook Tab ────────────────────────────────────────────── */}
        {tab === 'runbook' && <BrowserRunbookTab />}

        {/* ── Agent Loop Tab ────────────────────────────────────────── */}
        {tab === 'agent_loop' && <AgentLoopMonitor />}

        {/* ── Multi-Agent Tab ──────────────────────────────────────── */}
        {tab === 'multi_agent' && <MultiAgentMonitor />}

        {/* ── Cost Tab ─────────────────────────────────────────────── */}
        {tab === 'cost' && <CostDashboard />}

        {/* ── System Status Tab ────────────────────────────────────── */}
        {tab === 'system' && <SystemStatusPage />}

        {/* ── A/B Test Tab ─────────────────────────────────────────── */}
        {tab === 'ab_test' && <ABTestPanel />}

        {/* ── Analytics Tab ────────────────────────────────────────── */}
        {tab === 'analytics' && <AnalyticsDashboard />}

        {/* ── Pipeline Tab ─────────────────────────────────────────── */}
        {tab === 'pipeline' && <AiPipelineViz />}

        {/* ── Terminal Tab ─────────────────────────────────────────── */}
        {tab === 'terminal' && <AgentLiveTerminal />}

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
                  className="px-3 py-2 bg-bg-primary hover:bg-bg-surface border border-border-primary hover:border-border-secondary text-xs font-bold text-text-secondary rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                  title="Tải lại chỉ mục từ khóa của dự án"
                >
                  {indexingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Re-index
                </button>
                <div className="flex-1 flex gap-2 bg-bg-primary border border-border-secondary rounded-xl overflow-hidden focus-within:border-violet-500/60 transition-colors">
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
                <p className="text-[10px] font-mono text-text-tertiary">{indexStats}</p>
              )}
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {searchLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-tertiary">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                  <span className="text-xs">Đang tìm kiếm...</span>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-tertiary text-center">
                  <FileSearch className="h-8 w-8 opacity-30" />
                  <p className="text-xs font-semibold">Nhập từ khóa để tìm kiếm các file code liên quan trong toàn bộ dự án.</p>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && searchResults.map((match, idx) => (
                <div key={idx} className="bg-bg-primary/60 border border-border-primary/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate font-mono">{match.relativePath}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-950/40 text-violet-300 border border-violet-800/40">
                      Score: {match.score.toFixed(3)}
                    </span>
                  </div>
                  {match.snippet && (
                    <pre className="p-2 rounded bg-slate-950/80 border border-border-primary font-mono text-[10px] leading-4 text-text-secondary overflow-x-auto whitespace-pre">
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
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary shrink-0">
              <div className="text-xs font-black text-text-secondary flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5" /> Unified Diff Preview
              </div>
              {diffLoading && <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />}
            </div>
            <div className="flex-1 overflow-auto">
              {diffContent ? (
                <DiffViewer diff={diffContent} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-text-tertiary p-8 text-center">
                  <Code2 className="h-10 w-10 opacity-20" />
                  <p className="text-xs font-semibold">Diff sẽ tự động xuất hiện sau khi bạn tạo đề xuất AI ở tab <strong className="text-text-secondary">Edit File</strong>.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Backups Tab ───────────────────────────────────────────── */}
        {tab === 'backups' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5">
                File để xem backups
              </label>
              <div className="flex gap-2">
                <input
                  value={backupFile}
                  onChange={e => setBackupFile(e.target.value)}
                  placeholder="server/services/aiRouter.ts"
                  className="flex-1 bg-bg-primary border border-border-secondary rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-violet-500/60 outline-none font-mono"
                />
                <button
                  onClick={loadBackups}
                  disabled={backupsLoading}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-text-primary rounded-xl transition-colors"
                >
                  {backupsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {backups.length === 0 && !backupsLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-tertiary">
                <HardDrive className="h-8 w-8 opacity-30" />
                <p className="text-xs font-semibold text-center">Nhập đường dẫn file và nhấn tìm kiếm.<br />Backups được tạo tự động khi AI apply code.</p>
              </div>
            )}

            {backups.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                  {backups.length} backup(s) tìm thấy
                </div>
                {backups.map((b, i) => (
                  <div key={b.id} className="bg-bg-primary/60 border border-border-primary rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-text-secondary font-mono">#{i + 1} · {b.id.slice(0, 8)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.strategy === 'git-commit'
                          ? 'bg-violet-950/40 text-violet-400 border border-violet-700/40'
                          : 'bg-amber-950/40 text-amber-400 border border-amber-700/40'
                      }`}>
                        {b.strategy === 'git-commit' ? <><GitCommit className="h-2.5 w-2.5 inline mr-1" />git</> : <><HardDrive className="h-2.5 w-2.5 inline mr-1" />file</>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(b.createdAt).toLocaleString('vi-VN')}
                    </div>
                    {b.commitHash && (
                      <div className="text-[10px] text-violet-400 font-mono">{b.commitHash.slice(0, 12)}</div>
                    )}
                    {b.backupCopyPath && (
                      <div className="text-[10px] text-text-tertiary font-mono truncate">{b.backupCopyPath}</div>
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
                <div className="bg-bg-primary/60 border border-border-primary rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                    <Shield className="h-4 w-4" /> Daemon Status
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] text-text-tertiary font-semibold mb-0.5">Service</div>
                      <div className="text-slate-200 font-bold">{health.service}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-tertiary font-semibold mb-0.5">Version</div>
                      <div className="text-slate-200 font-bold">v{health.version}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] text-text-tertiary font-semibold mb-0.5">Workspace Root</div>
                      <div className="text-text-secondary font-mono text-[10px] break-all">{health.workspaceRoot}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-primary/60 border border-border-primary rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-text-secondary">
                    <Terminal className="h-4 w-4" /> Quick Commands
                  </div>
                  {[
                    { cmd: 'npm run assistant:start', desc: 'Khởi động daemon' },
                    { cmd: 'npm run assistant:cli -- status', desc: 'CLI status' },
                    { cmd: 'npm run assistant:cli -- chat', desc: 'Interactive REPL' },
                  ].map(({ cmd, desc }) => (
                    <div key={cmd} className="flex items-center justify-between gap-2 bg-slate-950 border border-border-primary rounded-lg px-3 py-2">
                      <code className="text-[10px] text-emerald-400 font-mono">{cmd}</code>
                      <span className="text-[10px] text-text-tertiary shrink-0">{desc}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-bg-primary/60 border border-border-primary rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-text-secondary">
                    <Zap className="h-4 w-4" /> Cấu hình AI Keys
                  </div>
                  <p className="text-[11px] text-text-tertiary leading-relaxed">
                    AI keys được quản lý tập trung tại <strong className="text-text-secondary">LedgerFlow AI Settings</strong>.
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
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-bg-surface hover:bg-bg-surface-hover text-text-secondary text-xs font-bold rounded-xl transition-colors border border-border-secondary"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới trạng thái
            </button>
          </div>
        )}

        {/* Custom Glassmorphic Confirmation Modal */}
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <div className="flex w-full max-w-md flex-col rounded-3xl border border-border-primary bg-slate-950 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
                <span className="text-xl">
                  {activeModal.type === 'privacy' ? '🛡️' : '⚠️'}
                </span>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
                  {activeModal.title}
                </h3>
              </div>
              
              <div className="text-xs text-text-secondary leading-relaxed font-semibold whitespace-pre-wrap">
                {activeModal.message}
              </div>

              {activeModal.details && (
                <div className="bg-black/60 border border-slate-850 rounded-xl p-3 max-h-40 overflow-y-auto">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary block mb-1">Nội dung chi tiết:</span>
                  <pre className="font-mono text-[10px] text-cyan-300 leading-normal whitespace-pre-wrap break-all">
                    {activeModal.details}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={activeModal.onCancel}
                  className="px-4 py-2 rounded-xl border border-border-primary bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-slate-850 text-xs font-black transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={activeModal.onConfirm}
                  className={`px-4 py-2 rounded-xl text-text-primary text-xs font-black transition-all cursor-pointer ${
                    activeModal.type === 'privacy'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20'
                  }`}
                >
                  Đồng ý & Tiếp tục
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
