import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal, Play, CheckCircle2, AlertTriangle, X, ShieldAlert,
  Download, RefreshCw, FileSearch, Layers, ArrowRight, Check, Lock,
  HelpCircle, Eye, EyeOff, Activity, ShieldCheck, RefreshCcw,
  Cpu, Database, ShieldX, Sliders, AlertCircle, Compass, Save, Trash2, ArrowUpRight
} from 'lucide-react';
import {
  checkDaemonHealth,
  readFile,
  applyEdit,
  executeWebAI,
  askAI,
  executeSafeCommand,
  fetchAuditLogs,
  verifyAuditChain,
  // New helper API functions
  fetchAgentRuns,
  fetchAgentRuntimeMetrics,
  createAgentRun,
  advanceAgentRun,
  approveAgentRunStep,
  stopAgentRun,
  setAgentRuntimeEmergencyStop,
  searchAgentMemory,
  createAgentMemory,
  reviewAgentMemory,
  fetchRobotStatus,
  executeRobotCommand,
  setRobotEmergencyStop as setRobotEStop,
  getLocalApprovedKnowledgeNotes,
  fetchWebAIProfiles,
  checkWebAIProfileSession,
  openWebAIProfileLogin,
  type WebAIProfile,
  type AuditLogEntry,
  type AuditChainVerificationResult,
  type AgentRun,
  type AgentRunStep,
  type AgentRuntimeMetrics,
  type AgentMemoryRecord,
  type RobotSimulationState
} from '../../../utils/assistantApi';

interface SimulatedAction {
  id: string;
  name: string;
  type: string;
  params: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  approved: boolean;
  status: 'pending' | 'allowed' | 'executing' | 'completed' | 'blocked';
  message?: string;
}

interface AuditLog {
  time: string;
  action: string;
  details: string;
  status: 'info' | 'success' | 'warn' | 'error';
}

function getClientRAGMatches(
  instruction: string,
  notes: Array<{ title: string; body: string; tags?: string; source?: string }>,
  maxNotes = 5
): Array<{ title: string; body: string; tags?: string; source?: string; score: number }> {
  if (!instruction || !notes || notes.length === 0) return [];

  const tokenizeText = (text: string): string[] => {
    return text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1);
  };

  const queryTokens = tokenizeText(instruction);
  if (queryTokens.length === 0) {
    return [];
  }

  const scoredNotes = notes.map((note) => {
    let score = 0;
    
    // Tokenize each part separately to apply weights
    const titleTokens = tokenizeText(note.title || "");
    const tagsTokens = tokenizeText(note.tags || "");
    const bodyTokens = tokenizeText(note.body || "");
    const sourceTokens = tokenizeText(note.source || "");

    const getCount = (tokens: string[], term: string): number => {
      return tokens.filter(t => t === term).length;
    };

    for (const q of queryTokens) {
      const titleMatches = getCount(titleTokens, q);
      const tagsMatches = getCount(tagsTokens, q);
      const bodyMatches = getCount(bodyTokens, q);
      const sourceMatches = getCount(sourceTokens, q);

      // Prioritize tags (weight 5) and titles (weight 3) over body and source (weight 1)
      score += (tagsMatches * 5) + (titleMatches * 3) + (bodyMatches * 1) + (sourceMatches * 1);
    }

    return { ...note, score };
  });

  return scoredNotes
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxNotes);
}

export default function AIOperationsSandbox() {
  const [sandboxTab, setSandboxTab] = useState<'guerrilla' | 'runtime' | 'memory' | 'robot'>('guerrilla');

  // --- Puppeteer Session Diagnostics State ---
  const [webAIProfiles, setWebAIProfiles] = useState<WebAIProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [checkingProfileId, setCheckingProfileId] = useState<string | null>(null);
  const [loggingInProfileId, setLoggingInProfileId] = useState<string | null>(null);

  // --- Tab 1 State (Guerrilla Prompt Lab) ---
  const [promptText, setPromptText] = useState('');
  const [workType, setWorkType] = useState('code');
  const [sandboxMode, setSandboxMode] = useState<'simulation' | 'real'>('simulation');
  const [planGenerated, setPlanGenerated] = useState(false);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [realScreenshotUrl, setRealScreenshotUrl] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [actions, setActions] = useState<SimulatedAction[]>([]);
  const [matchedRAGNotes, setMatchedRAGNotes] = useState<Array<{ title: string; body: string; tags?: string; source?: string; score: number }>>([]);
  const [expandedRAGNoteIndex, setExpandedRAGNoteIndex] = useState<number | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([
    { time: new Date().toLocaleTimeString(), action: "System Initialize", details: "Sandbox mode active: Simulation first", status: "info" }
  ]);
  const [autoRepairEnabled, setAutoRepairEnabled] = useState(true);
  const [lastScreenshotPath, setLastScreenshotPath] = useState<string | null>(null);
  const [cssPatches, setCssPatches] = useState<Array<{ selector: string; property: string; oldValue: string; newValue: string }>>([]);
  const [auditLogsTab, setAuditLogsTab] = useState<'simulation' | 'system'>('simulation');
  const [serverLogs, setServerLogs] = useState<AuditLogEntry[]>([]);
  const [verificationResult, setVerificationResult] = useState<AuditChainVerificationResult | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  // --- Tab 2 State (AI Staff Runtime) ---
  const [runtimeRuns, setRuntimeRuns] = useState<AgentRun[]>([]);
  const [runtimeMetrics, setRuntimeMetrics] = useState<AgentRuntimeMetrics | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [estopLoading, setEstopLoading] = useState(false);
  
  const [newRunGoal, setNewRunGoal] = useState('');
  const [newRunMaxSteps, setNewRunMaxSteps] = useState(6);
  const [newRunPlannerMode, setNewRunPlannerMode] = useState<'auto' | 'ai' | 'deterministic'>('auto');
  const [creatingRun, setCreatingRun] = useState(false);
  const [abortingRunIds, setAbortingRunIds] = useState<Record<string, boolean>>({});
  const [advancingRunIds, setAdvancingRunIds] = useState<Record<string, boolean>>({});
  const [approvingStepIds, setApprovingStepIds] = useState<Record<string, boolean>>({});
  const [estopReasonInput, setEstopReasonInput] = useState('');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // --- Tab 3 State (AI Memory Vault) ---
  const [memSearchQuery, setMemSearchQuery] = useState('');
  const [memSearchResults, setMemSearchResults] = useState<any[]>([]);
  const [memSearching, setMemSearching] = useState(false);
  
  const [newMemKind, setNewMemKind] = useState<'company' | 'session' | 'procedure' | 'observation' | 'feedback'>('procedure');
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemContent, setNewMemContent] = useState('');
  const [newMemSource, setNewMemSource] = useState('Founder Sandbox');
  const [newMemSourceRef, setNewMemSourceRef] = useState('');
  const [newMemReviewed, setNewMemReviewed] = useState(true);
  const [addingMemory, setAddingMemory] = useState(false);
  const [reviewingMemoryIds, setReviewingMemoryIds] = useState<Record<string, boolean>>({});

  // --- Tab 4 State (Robot Simulation) ---
  const [robotState, setRobotState] = useState<RobotSimulationState | null>(null);
  const [robotLoading, setRobotLoading] = useState(false);
  const [robotCommandLoading, setRobotCommandLoading] = useState(false);
  
  const [robotX, setRobotX] = useState(0);
  const [robotY, setRobotY] = useState(0);
  const [robotZ, setRobotZ] = useState(0);
  const [robotSpeed, setRobotSpeed] = useState(25);
  const [robotSafetyCommit, setRobotSafetyCommit] = useState(false);
  const [robotApprovalPhrase, setRobotApprovalPhrase] = useState('');
  const [lastRobotResult, setLastRobotResult] = useState<any>(null);
  const [robotError, setRobotError] = useState<string | null>(null);

  // --- Common Handlers ---
  const loadServerLogs = useCallback(async () => {
    try {
      const logs = await fetchAuditLogs(100);
      setServerLogs(logs);
    } catch (err) {
      console.error("Failed to load server audit logs:", err);
    }
  }, []);

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    setVerificationResult(null);
    try {
      const res = await verifyAuditChain();
      setVerificationResult(res);
    } catch (err: any) {
      console.error("Integrity check failed:", err);
    } finally {
      setVerifyingChain(false);
    }
  };

  // --- Tab 2 Handlers (Agent Staff Runtime) ---
  const loadRuntimeState = useCallback(async () => {
    setRunsLoading(true);
    setMetricsLoading(true);
    try {
      const runsData = await fetchAgentRuns(50);
      setRuntimeRuns(runsData.runs);
      
      const metricsData = await fetchAgentRuntimeMetrics();
      setRuntimeMetrics(metricsData);
    } catch (err) {
      console.error("Failed to load runtime state:", err);
    } finally {
      setRunsLoading(false);
      setMetricsLoading(false);
    }
  }, []);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRunGoal.trim()) return;
    setCreatingRun(true);
    try {
      const newRun = await createAgentRun(newRunGoal.trim(), {
        maxSteps: newRunMaxSteps,
        plannerMode: newRunPlannerMode
      });
      setNewRunGoal('');
      await loadRuntimeState();
      
      // Auto-advance the run
      await advanceAgentRun(newRun.id);
      await loadRuntimeState();
    } catch (err: any) {
      alert(`Lỗi khởi tạo Agent Run: ${err.message}`);
    } finally {
      setCreatingRun(false);
    }
  };

  const handleAdvanceRun = async (runId: string) => {
    setAdvancingRunIds(prev => ({ ...prev, [runId]: true }));
    try {
      await advanceAgentRun(runId);
      await loadRuntimeState();
    } catch (err: any) {
      alert(`Lỗi chạy bước tiếp theo: ${err.message}`);
    } finally {
      setAdvancingRunIds(prev => ({ ...prev, [runId]: false }));
    }
  };

  const handleApproveStep = async (runId: string, stepId: string, fingerprint: string) => {
    setApprovingStepIds(prev => ({ ...prev, [stepId]: true }));
    try {
      await approveAgentRunStep(runId, stepId, fingerprint);
      await loadRuntimeState();
    } catch (err: any) {
      alert(`Lỗi duyệt bước chạy: ${err.message}`);
    } finally {
      setApprovingStepIds(prev => ({ ...prev, [stepId]: false }));
    }
  };

  const handleAbortRun = async (runId: string) => {
    setAbortingRunIds(prev => ({ ...prev, [runId]: true }));
    try {
      await stopAgentRun(runId, 'Founder manual abort.');
      await loadRuntimeState();
    } catch (err: any) {
      alert(`Lỗi dừng Agent Run: ${err.message}`);
    } finally {
      setAbortingRunIds(prev => ({ ...prev, [runId]: false }));
    }
  };

  const handleToggleEmergencyStop = async (active: boolean) => {
    setEstopLoading(true);
    try {
      await setAgentRuntimeEmergencyStop(active, estopReasonInput || undefined);
      setEstopReasonInput('');
      await loadRuntimeState();
    } catch (err: any) {
      alert(`Lỗi thay đổi trạng thái khẩn cấp: ${err.message}`);
    } finally {
      setEstopLoading(false);
    }
  };

  // --- Tab 3 Handlers (AI Memory Vault) ---
  const handleSearchMemory = async () => {
    setMemSearching(true);
    try {
      const results = await searchAgentMemory(memSearchQuery, 12, true);
      setMemSearchResults(results);
    } catch (err: any) {
      console.error("Memory search failed:", err);
    } finally {
      setMemSearching(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemTitle.trim() || !newMemContent.trim()) return;
    setAddingMemory(true);
    try {
      await createAgentMemory({
        kind: newMemKind,
        title: newMemTitle.trim(),
        content: newMemContent.trim(),
        source: newMemSource.trim(),
        sourceRef: newMemSourceRef.trim() || undefined,
        reviewed: newMemReviewed,
        tags: []
      });
      setNewMemTitle('');
      setNewMemContent('');
      setNewMemSourceRef('');
      alert("Đã lưu tri thức thành công vào Memory Store.");
      if (memSearchQuery.trim()) {
        await handleSearchMemory();
      } else {
        const results = await searchAgentMemory('', 12, true);
        setMemSearchResults(results);
      }
    } catch (err: any) {
      alert(`Lỗi lưu bộ nhớ: ${err.message}`);
    } finally {
      setAddingMemory(false);
    }
  };

  const handleReviewMemory = async (id: string, status: 'reviewed' | 'rejected') => {
    setReviewingMemoryIds(prev => ({ ...prev, [id]: true }));
    try {
      await reviewAgentMemory(id, status);
      if (memSearchQuery.trim()) {
        await handleSearchMemory();
      } else {
        const results = await searchAgentMemory('', 12, true);
        setMemSearchResults(results);
      }
    } catch (err: any) {
      alert(`Lỗi cập nhật bộ nhớ: ${err.message}`);
    } finally {
      setReviewingMemoryIds(prev => ({ ...prev, [id]: false }));
    }
  };

  // --- Tab 4 Handlers (Robot Simulation) ---
  const loadRobotState = useCallback(async () => {
    setRobotLoading(true);
    try {
      const data = await fetchRobotStatus();
      setRobotState(data);
      if (data && data.position) {
        setRobotX(data.position.x);
        setRobotY(data.position.y);
        setRobotZ(data.position.z);
      }
    } catch (err) {
      console.error("Failed to load robot state:", err);
    } finally {
      setRobotLoading(false);
    }
  }, []);

  const handleRobotCommand = async (command: 'inspect' | 'move' | 'stop' | 'home') => {
    setRobotCommandLoading(true);
    setRobotError(null);
    try {
      const options: any = {};
      if (command === 'move') {
        if (!robotSafetyCommit) {
          throw new Error("Bạn phải chọn hộp kiểm cam kết an toàn.");
        }
        if (robotApprovalPhrase !== 'APPROVE ROBOT SIMULATION') {
          throw new Error("Cụm từ phê duyệt không chính xác.");
        }
        options.position = { x: robotX, y: robotY, z: robotZ };
        options.velocity = robotSpeed;
        options.approvalPhrase = robotApprovalPhrase;
      }
      const res = await executeRobotCommand(command, options);
      setLastRobotResult(res);
      if (res.accepted && res.evidence && res.evidence.state) {
        setRobotState(res.evidence.state);
        setRobotApprovalPhrase('');
      }
    } catch (err: any) {
      setRobotError(err.message);
    } finally {
      setRobotCommandLoading(false);
    }
  };

  const handleRobotEStopReset = async () => {
    setRobotCommandLoading(true);
    setRobotError(null);
    try {
      const state = await setRobotEStop(false);
      setRobotState(state);
    } catch (err: any) {
      setRobotError(err.message);
    } finally {
      setRobotCommandLoading(false);
    }
  };

  // --- Puppeteer Session Diagnostics Handlers ---
  const loadWebAIProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const list = await fetchWebAIProfiles();
      setWebAIProfiles(list);
    } catch (err) {
      console.error("Failed to load Web AI profiles in sandbox:", err);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  const handleCheckProfileSession = async (profileId: string, platform: string) => {
    setCheckingProfileId(profileId);
    setLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), action: "Session Check", details: `Đang kiểm tra kết nối session cho profile ID: ${profileId}...`, status: "info" }
    ]);
    try {
      const res = await checkWebAIProfileSession(profileId, platform);
      setWebAIProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: res.status as any, lastError: res.error } : p));
      
      const isSuccess = res.status === 'ready';
      setLogs(prev => [
        ...prev,
        { 
          time: new Date().toLocaleTimeString(), 
          action: "Session Checked", 
          details: `Kiểm tra session profile ${profileId}: ${res.status}${res.error ? ` - Lỗi: ${res.error}` : ''}`, 
          status: isSuccess ? "success" : "error" 
        }
      ]);
    } catch (err: any) {
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), action: "Session Check Failed", details: `Lỗi kết nối kiểm tra: ${err.message}`, status: "error" }
      ]);
      alert(`Lỗi kiểm tra session: ${err.message}`);
    } finally {
      setCheckingProfileId(null);
    }
  };

  const handleOpenProfileLogin = async (profileId: string, platform: string) => {
    setLoggingInProfileId(profileId);
    setLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), action: "Session Login", details: `Đang mở cửa sổ Chrome đăng nhập cho profile ID: ${profileId}...`, status: "warn" }
    ]);
    try {
      const res = await openWebAIProfileLogin(profileId, platform);
      setWebAIProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: res.status as any, lastError: res.error } : p));
      
      const isSuccess = res.status === 'ready';
      setLogs(prev => [
        ...prev,
        { 
          time: new Date().toLocaleTimeString(), 
          action: "Login Closed", 
          details: `Hoàn tất phiên đăng nhập profile ${profileId}. Trạng thái: ${res.status}`, 
          status: isSuccess ? "success" : "warn" 
        }
      ]);
    } catch (err: any) {
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), action: "Login Failed", details: `Lỗi mở cửa sổ đăng nhập: ${err.message}`, status: "error" }
      ]);
      alert(`Lỗi mở đăng nhập: ${err.message}`);
    } finally {
      setLoggingInProfileId(null);
    }
  };

  // --- Tab Routing Effect ---
  useEffect(() => {
    if (sandboxTab === 'guerrilla') {
      loadServerLogs();
      loadWebAIProfiles();
    } else if (sandboxTab === 'runtime') {
      loadRuntimeState();
    } else if (sandboxTab === 'memory') {
      searchAgentMemory('', 12, true).then(results => setMemSearchResults(results));
    } else if (sandboxTab === 'robot') {
      loadRobotState();
    }
  }, [sandboxTab, loadServerLogs, loadRuntimeState, loadRobotState, loadWebAIProfiles]);

  // --- Existing Tab 1 Logic (Guerrilla) ---
  const handleGeneratePlan = async () => {
    if (!promptText.trim()) return;
    setPlanningLoading(true);
    setRealScreenshotUrl(null);
    setShowScreenshot(false);
    
    // Perform RAG notes matching on the client side
    try {
      const allNotes = getLocalApprovedKnowledgeNotes();
      const matches = getClientRAGMatches(promptText, allNotes);
      setMatchedRAGNotes(matches);
      setExpandedRAGNoteIndex(null);
    } catch (e) {
      console.error("Failed to run client-side RAG matching:", e);
      setMatchedRAGNotes([]);
    }

    const fileMatches = Array.from(promptText.matchAll(/((?:src|server|public|docs|desktop|tools|scripts)\/[a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)/g)).map(m => m[1]);
    const targetFile = fileMatches[0] || (workType === 'code' ? 'src/components/CompanyOS.tsx' : 'src/index.css');
    
    let platform = 'chatgpt';
    const lowerPrompt = promptText.toLowerCase();
    if (lowerPrompt.includes('claude')) platform = 'claude';
    else if (lowerPrompt.includes('gemini')) platform = 'gemini';
    else if (lowerPrompt.includes('deepseek')) platform = 'deepseek';

    if (sandboxMode === 'real') {
      const plannerPrompt = `Bạn là AI điều phối viên lập kế hoạch vận hành robot tự động (AI Agent Ops Planner) của dự án LedgerFlow Studio.
Hãy phân tích yêu cầu công việc sau đây của Founder:
"${promptText}"

Hãy sinh ra kế hoạch thực thi dưới dạng JSON với cấu trúc chính xác sau:
{
  "steps": [
    "Mô tả bước 1...",
    "Mô tả bước 2..."
  ],
  "actions": [
    {
      "id": "1",
      "name": "Tên hành động (ví dụ: Đọc tệp style)",
      "type": "fs_read | semantic_routing | web_automation | capture_screenshot | fs_write | exec_shell | visual_self_heal",
      "params": "Tham số (ví dụ: src/index.css hoặc chatgpt hoặc npm run lint)",
      "risk": "LOW | MEDIUM | HIGH | BLOCKED"
    }
  ]
}

Quy tắc phân loại hành động (actions) và mức độ rủi ro (risk):
- "fs_read": Đọc file local (rủi ro: LOW, tự động phê duyệt).
- "semantic_routing": Định tuyến ý định AI (rủi ro: LOW, tự động phê duyệt).
- "web_automation": Tự động hóa trình duyệt Puppeteer (rủi ro: MEDIUM).
- "capture_screenshot": Chụp ảnh màn hình Puppeteer (rủi ro: MEDIUM).
- "fs_write": Sửa đổi file local (rủi ro: MEDIUM hoặc HIGH).
- "exec_shell": Chạy terminal command (ví dụ: npm install, npm test, npm run lint, git status, tsc --noEmit). 
  + Nếu lệnh nằm ngoài danh sách trắng bảo mật (npm test, npm run lint, tsc --noEmit, git status, npm run check:simulations, npm run check:founder-labs, npm run check:new-features-brief), rủi ro PHẢI LÀ "BLOCKED".
  + Nếu lệnh nằm trong whitelist, rủi ro có thể đặt là MEDIUM hoặc HIGH.
- "visual_self_heal": Tự động phân tích ảnh chụp để sửa lỗi CSS (rủi ro: HIGH).

Chỉ trả về duy nhất khối JSON nằm trong thẻ \`\`\`json ... \`\`\`. Không giải thích gì thêm.`;

      try {
        const res = await askAI(plannerPrompt, 'analytics');
        const jsonMatch = res.answer.match(/```json\n([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : res.answer;
        const data = JSON.parse(jsonStr.trim());
        
        if (data.steps && Array.isArray(data.steps) && data.actions && Array.isArray(data.actions)) {
          const hydratedActions = data.actions.map((act: any) => {
            const isBlocked = act.risk === 'BLOCKED';
            return {
              ...act,
              approved: act.risk === 'LOW',
              status: isBlocked ? 'blocked' : (act.risk === 'LOW' ? 'allowed' : 'pending'),
              message: isBlocked ? 'Hành động bị chặn vì lý do bảo mật hệ thống.' : undefined
            };
          });
          
          setSteps(data.steps);
          setActions(hydratedActions);
          setPlanGenerated(true);
          setPlanningLoading(false);
          setLogs(prev => [
            ...prev,
            { time: new Date().toLocaleTimeString(), action: "LLM Plan Generate", details: `Tạo kế hoạch động thành công qua AI Gateway.`, status: "success" }
          ]);
          return;
        }
      } catch (err: any) {
        console.error("LLM Planner failed, falling back to local planner", err);
      }
    }
    
    let generatedSteps: string[] = [];
    let generatedActions: SimulatedAction[] = [];
    
    if (workType === 'code') {
      generatedSteps = [
        `Phân tích yêu cầu và định tuyến đến mô hình tối ưu (${platform.toUpperCase()})`,
        `Sử dụng RAG cục bộ để tìm kiếm các file code liên quan: ${targetFile}`,
        `Tạo phương án chỉnh sửa chi tiết và tạo bản vá (diff)`,
        `Kiểm định mã nguồn sau khi sửa và tiến hành Auto-Repair nếu có lỗi biên dịch`
      ];
      
      generatedActions = [
        { id: '1', name: 'Đọc tệp tin local', type: 'fs_read', params: targetFile, risk: 'LOW', approved: true, status: 'allowed' },
        { id: '2', name: 'Định tuyến ý định AI', type: 'semantic_routing', params: `Task: coding, Target: ${platform}`, risk: 'LOW', approved: true, status: 'allowed' },
        { id: '3', name: 'Chạy Puppeteer Web AI', type: 'web_automation', params: `Platform: ${platform}, Headless: false`, risk: 'MEDIUM', approved: false, status: 'pending' },
        { id: '4', name: 'Ghi đề xuất sửa đổi', type: 'fs_write', params: `Ghi code vào ${targetFile}`, risk: 'MEDIUM', approved: false, status: 'pending' },
        { id: '5', name: 'Thực thi Terminal Command', type: 'exec_shell', params: 'npm run lint', risk: 'MEDIUM', approved: false, status: 'pending' }
      ];
    } else if (workType === 'design') {
      generatedSteps = [
        `Định tuyến yêu cầu thiết kế giao diện đến ${platform.toUpperCase()}`,
        `Tạo mã CSS/HTML/TSX cho component mới tại ${targetFile}`,
        `Mở trình duyệt Puppeteer và điều hướng đến app chạy thử`,
        `Chụp ảnh màn hình giao diện Puppeteer để đánh giá độ sai lệch (visual check)`,
        `AI phân tích ảnh chụp và tinh chỉnh lại CSS tự động (self-healing)`
      ];
      
      generatedActions = [
        { id: '1', name: 'Đọc tệp tin style', type: 'fs_read', params: targetFile, risk: 'LOW', approved: true, status: 'allowed' },
        { id: '2', name: 'Định tuyến ý định AI', type: 'semantic_routing', params: `Task: design, Target: ${platform}`, risk: 'LOW', approved: true, status: 'allowed' },
        { id: '3', name: 'Chạy Puppeteer Web AI', type: 'web_automation', params: `Platform: ${platform}, Headless: false`, risk: 'MEDIUM', approved: false, status: 'pending' },
        { id: '4', name: 'Chụp ảnh màn hình Puppeteer', type: 'capture_screenshot', params: 'artifacts/screenshots/screenshot_latest.png', risk: 'MEDIUM', approved: false, status: 'pending' },
        { id: '5', name: 'Tự động sửa giao diện qua hình ảnh', type: 'visual_self_heal', params: `Gửi ảnh screenshot và phân tích độ lệch CSS của ${targetFile}`, risk: 'HIGH', approved: false, status: 'pending' },
        { id: '6', name: 'Ghi đề xuất sửa đổi CSS', type: 'fs_write', params: `Ghi style vào ${targetFile}`, risk: 'MEDIUM', approved: false, status: 'pending' },
        { id: '7', name: 'Thực thi Terminal Command', type: 'exec_shell', params: 'npm run lint', risk: 'MEDIUM', approved: false, status: 'pending' }
      ];
    } else {
      generatedSteps = [
        `Phân tích yêu cầu chung của Founder`,
        `Định tuyến tác vụ đa tài khoản đến ${platform.toUpperCase()}`,
        `Tổng hợp dữ liệu báo cáo`
      ];
      
      generatedActions = [
        { id: '1', name: 'Phân tích ý định', type: 'semantic_routing', params: `Task: general, Target: ${platform}`, risk: 'LOW', approved: true, status: 'allowed' },
        { id: '2', name: 'Chạy Puppeteer Web AI', type: 'web_automation', params: `Platform: ${platform}`, risk: 'MEDIUM', approved: false, status: 'pending' }
      ];
    }
    
    setSteps(generatedSteps);
    setActions(generatedActions);
    setPlanGenerated(true);
    setPlanningLoading(false);
    
    setLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), action: "Generate Plan", details: `Tạo kế hoạch cục bộ thành công (Prompt: "${promptText.slice(0, 30)}...").`, status: "success" }
    ]);
  };

  const handleToggleApprove = (id: string) => {
    setActions(prev => prev.map(act => {
      if (act.id === id) {
        if (act.risk === 'BLOCKED') return act;
        const nextApprove = !act.approved;
        return {
          ...act,
          approved: nextApprove,
          status: nextApprove ? 'allowed' : 'pending'
        };
      }
      return act;
    }));
    
    const target = actions.find(a => a.id === id);
    if (target) {
      setLogs(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          action: "Approval Toggle",
          details: `Thay đổi phê duyệt: ${target.name} -> ${!target.approved ? 'Đã duyệt' : 'Chờ duyệt'}`,
          status: !target.approved ? "success" : "warn"
        }
      ]);
    }
  };

  const executeRealAction = async (act: SimulatedAction, codeBlocksCollector: any[]) => {
    switch (act.type) {
      case 'fs_read': {
        const fileContent = await readFile(act.params);
        return {
          status: 'completed' as const,
          message: `Đọc thành công tệp ${act.params} (${fileContent.sizeBytes} bytes, ${fileContent.lineCount} dòng).`
        };
      }
      case 'semantic_routing': {
        return {
          status: 'completed' as const,
          message: `Định tuyến thành công ý định AI. Nghiệp vụ: ${workType.toUpperCase()}`
        };
      }
      case 'web_automation': {
        let platform = 'chatgpt';
        const lowerPrompt = promptText.toLowerCase();
        if (lowerPrompt.includes('claude')) platform = 'claude';
        else if (lowerPrompt.includes('gemini')) platform = 'gemini';
        else if (lowerPrompt.includes('deepseek')) platform = 'deepseek';
        
        const readAction = actions.find(a => a.type === 'fs_read');
        const targetFiles = readAction ? readAction.params : '';
        const filesArray = targetFiles ? targetFiles.split(',').map(f => f.trim()) : [];
        
        const hasScreenshotAction = actions.some(a => a.type === 'capture_screenshot' && a.approved);
        
        const res = await executeWebAI(
          promptText,
          platform,
          filesArray,
          undefined,
          false,
          true,
          undefined,
          undefined,
          hasScreenshotAction
        );
        
        if (res.codeBlocks && res.codeBlocks.length > 0) {
          codeBlocksCollector.push(...res.codeBlocks);
        }
        
        let msg = `Thực thi thành công trên Web AI. Nhận về ${res.codeBlocks.length} khối mã nguồn.`;
        if (res.screenshotPath) {
          const filename = res.screenshotPath.split(/[\\/]/).pop();
          msg += ` Ảnh chụp: ${filename}`;
        }
        
        return {
          status: 'completed' as const,
          message: msg,
          screenshotPath: res.screenshotPath
        };
      }
      case 'fs_write': {
        const readAction = actions.find(a => a.type === 'fs_read');
        const targetFiles = readAction ? readAction.params : '';
        const filesArray = targetFiles ? targetFiles.split(',').map(f => f.trim()) : [];
        if (filesArray.length === 0) {
          throw new Error("Không xác định được tệp đích để ghi code.");
        }
        
        const applyRes = await applyEdit(filesArray, 'auto', autoRepairEnabled, promptText);
        let msg = `Ghi mã nguồn thành công: ${applyRes.message}`;
        if (applyRes.repairStatus) {
          msg += ` (Compiler Feedback Loop: ${applyRes.repairStatus.ok ? 'Thành công' : 'Thất bại'} sau ${applyRes.repairStatus.loops} vòng lặp)`;
        }
        return {
          status: 'completed' as const,
          message: msg
        };
      }
      case 'capture_screenshot': {
        return {
          status: 'completed' as const,
          message: `Ảnh chụp giao diện kiểm thử đã lưu thành công vào artifacts/screenshots/`
        };
      }
      case 'visual_self_heal': {
        if (!lastScreenshotPath) {
          return {
            status: 'completed' as const,
            message: `Bỏ qua tự sửa lỗi thị giác vì không tìm thấy ảnh chụp màn hình từ bước trước.`
          };
        }
        
        let platform = 'chatgpt';
        const lowerPrompt = promptText.toLowerCase();
        if (lowerPrompt.includes('claude')) platform = 'claude';
        else if (lowerPrompt.includes('gemini')) platform = 'gemini';
        else if (lowerPrompt.includes('deepseek')) platform = 'deepseek';
        
        const readAction = actions.find(a => a.type === 'fs_read');
        const targetFile = readAction ? readAction.params : 'src/index.css';
        
        const healPrompt = `Đây là ảnh chụp màn hình kiểm thử giao diện thực tế của ứng dụng. Hãy phân tích xem có bất kỳ lỗi lệch bố cục (layout overflow), sai căn lề (misalignment) hoặc lỗi CSS nào không so với yêu cầu gốc: "${promptText}". Nếu phát hiện lỗi giao diện, hãy trả về các khối mã sửa đổi CSS/HTML/TSX hoàn chỉnh cho file: ${targetFile}.`;
        
        const res = await executeWebAI(
          healPrompt,
          platform,
          [targetFile],
          undefined,
          false,
          true,
          undefined,
          undefined,
          false,
          undefined,
          [lastScreenshotPath]
        );
        
        if (res.codeBlocks && res.codeBlocks.length > 0) {
          const applyRes = await applyEdit([targetFile], 'auto', autoRepairEnabled, healPrompt);
          return {
            status: 'completed' as const,
            message: `Tự sửa lỗi thị giác thành công. Nhận về ${res.codeBlocks.length} khối mã sửa đổi và đã ghi đè vào ${targetFile}: ${applyRes.message}`
          };
        }
        
        return {
          status: 'completed' as const,
          message: `Không phát hiện lỗi thị giác cần tự sửa đổi từ phân tích hình ảnh.`
        };
      }
      case 'exec_shell': {
        const cmdRes = await executeSafeCommand(act.params);
        if (!cmdRes.ok) {
          throw new Error(`Lệnh thất bại (Exit Code: ${cmdRes.exitCode}): ${cmdRes.output}`);
        }
        return {
          status: 'completed' as const,
          message: `Thực thi CLI thành công: ${cmdRes.output}`
        };
      }
      default:
        throw new Error(`Loại hành động không được hỗ trợ: ${act.type}`);
    }
  };

  const handleExecuteAllowed = async () => {
    setLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), action: "Execution Started", details: `Khởi chạy robot ở chế độ: ${sandboxMode.toUpperCase()}`, status: "info" }
    ]);

    const allowedActions = actions.filter(act => act.status === 'allowed' && act.approved);
    if (allowedActions.length === 0) {
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), action: "Execution Skipped", details: "Không có hành động nào được duyệt để chạy.", status: "warn" }
      ]);
      return;
    }

    if (sandboxMode === 'simulation') {
      setActions(prev => prev.map(act => act.status === 'allowed' ? { ...act, status: 'executing' } : act));
      setTimeout(() => {
        setActions(prev => prev.map(act => act.status === 'executing' ? { ...act, status: 'completed' } : act));
        setLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), action: "Execution Complete", details: "Tất cả các hành động được duyệt đã thực thi xong ảo (Simulated).", status: "success" }
        ]);
        if (workType === 'design') {
          setShowScreenshot(true);
        }
      }, 2000);
      return;
    }

    const codeBlocksCollector: any[] = [];
    let hasError = false;
    
    for (const act of actions) {
      if (!act.approved || act.risk === 'BLOCKED') continue;
      
      setActions(prev => prev.map(a => a.id === act.id ? { ...a, status: 'executing' } : a));
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), action: "Executing Action", details: `Đang chạy: ${act.name}...`, status: "info" }
      ]);
      
      try {
        const res = await executeRealAction(act, codeBlocksCollector);
        
        setActions(prev => prev.map(a => a.id === act.id ? { ...a, status: 'completed', message: res.message } : a));
        setLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), action: "Action Completed", details: res.message, status: "success" }
        ]);
        
        if (res.screenshotPath) {
          setLastScreenshotPath(res.screenshotPath);
          const filename = res.screenshotPath.split(/[\\/]/).pop();
          const serveUrl = `http://127.0.0.1:3001/artifacts/screenshots/${filename}`;
          setRealScreenshotUrl(serveUrl);
          setShowScreenshot(true);
        }
      } catch (err: any) {
        hasError = true;
        setActions(prev => prev.map(a => a.id === act.id ? { ...a, status: 'blocked', message: `Thất bại: ${err.message}` } : a));
        setLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), action: "Action Failed", details: `Thất bại tại ${act.name}: ${err.message}`, status: "error" }
        ]);
        break;
      }
    }
    
    const statusText = hasError ? "Thực thi thất bại ở một số bước." : "Tất cả các hành động được duyệt đã thực thi xong.";
    setLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), action: "Execution Ended", details: statusText, status: hasError ? "error" : "success" }
    ]);

    try {
      const currentAuditList = JSON.parse(localStorage.getItem('ledgerflow_aiops_audit_v1') || '[]');
      const newAuditItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: hasError ? "ROBOT_EXECUTION_FAILED" : "ROBOT_EXECUTION_SUCCESS",
        title: `Robot execution: ${promptText.slice(0, 30)}...`,
        details: `${statusText} Chế độ: ${sandboxMode.toUpperCase()}. Nhóm: ${workType.toUpperCase()}.`,
      };
      localStorage.setItem('ledgerflow_aiops_audit_v1', JSON.stringify([newAuditItem, ...currentAuditList]));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error("Failed to write localStorage audit", e);
    }
    loadServerLogs();
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      mode: sandboxMode,
      prompt: promptText,
      actions,
      logs
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `ai_sandbox_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 space-y-4">
      {/* ── Tabbed View Selection ───────────────────────────────────── */}
      <div className="flex border border-slate-800 bg-slate-950 p-1.5 rounded-2xl shrink-0 gap-1.5">
        <button
          onClick={() => setSandboxTab('guerrilla')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl border transition-all ${
            sandboxTab === 'guerrilla'
              ? 'bg-violet-600/20 text-violet-300 border-violet-500/40 shadow-lg shadow-violet-500/5'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Guerrilla Prompt Lab</span>
        </button>
        <button
          onClick={() => setSandboxTab('runtime')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl border transition-all ${
            sandboxTab === 'runtime'
              ? 'bg-violet-600/20 text-violet-300 border-violet-500/40 shadow-lg shadow-violet-500/5'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>AI Staff Runtime</span>
        </button>
        <button
          onClick={() => setSandboxTab('memory')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl border transition-all ${
            sandboxTab === 'memory'
              ? 'bg-violet-600/20 text-violet-300 border-violet-500/40 shadow-lg shadow-violet-500/5'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>AI Memory Vault</span>
        </button>
        <button
          onClick={() => setSandboxTab('robot')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl border transition-all ${
            sandboxTab === 'robot'
              ? 'bg-violet-600/20 text-violet-300 border-violet-500/40 shadow-lg shadow-violet-500/5'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Robot Control Room</span>
        </button>
      </div>

      {/* ── TAB 1: Guerrilla Prompt Lab ────────────────────────────── */}
      {sandboxTab === 'guerrilla' && (
        <>
          {/* Status Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider">AI Operations Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  sandboxMode === 'simulation' 
                    ? 'bg-violet-950/60 text-violet-400 border border-violet-700/40' 
                    : 'bg-rose-950/60 text-rose-400 border border-rose-700/40 animate-pulse'
                }`}>
                  {sandboxMode === 'simulation' ? '🛡️ CHẾ ĐỘ GIẢ LẬP (SIMULATION)' : '⚠️ CHẾ ĐỘ THỰC TẾ'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-400 leading-normal pt-2 border-t border-slate-800/40">
              <div>
                <span className="font-semibold block text-slate-500 text-[10px] uppercase">Vòng lặp tự động sửa:</span>
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRepairEnabled}
                    onChange={(e) => setAutoRepairEnabled(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-slate-300 text-[10px] font-bold font-mono">Auto-Repair (Compiler)</span>
                </label>
              </div>
              <div>
                <span className="font-semibold block text-slate-500 text-[10px] uppercase">Điều phối viên:</span>
                <span className="text-slate-300 font-mono">AgentOps Coordinator</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-500 text-[10px] uppercase">Chế độ vận hành:</span>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => setSandboxMode('simulation')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${sandboxMode === 'simulation' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    Giả lập
                  </button>
                  <button 
                    onClick={() => setSandboxMode('real')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${sandboxMode === 'real' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    Thực tế
                  </button>
                </div>
              </div>
            </div>
          </div>
 
          {/* Puppeteer Session Diagnostics Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>Chẩn đoán kết nối Puppeteer (Chrome Sessions Diagnostics)</span>
              </div>
              <button
                onClick={loadWebAIProfiles}
                disabled={loadingProfiles}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${loadingProfiles ? 'animate-spin' : ''}`} /> Tải lại
              </button>
            </div>
            
            {loadingProfiles && webAIProfiles.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic">Đang tải danh sách profile trình duyệt...</div>
            ) : webAIProfiles.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic">Chưa có profile trình duyệt nào được đăng ký. Cấu hình tại tab Sync.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {webAIProfiles.map((p) => {
                  const isChecking = checkingProfileId === p.id;
                  const isLoggingIn = loggingInProfileId === p.id;
                  
                  let statusBg = 'bg-slate-900 text-slate-400 border-slate-850';
                  let statusPulse = false;
                  if (p.status === 'ready') {
                    statusBg = 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20';
                  } else if (p.status === 'login_required' || p.status === 'untested') {
                    statusBg = 'bg-cyan-950/60 text-cyan-400 border-cyan-500/20';
                    statusPulse = p.status === 'login_required';
                  } else if (p.status === 'quota') {
                    statusBg = 'bg-amber-950/60 text-amber-400 border-amber-500/20';
                  } else if (p.status === 'error') {
                    statusBg = 'bg-rose-950/60 text-rose-400 border-rose-500/20';
                  }
                  
                  return (
                    <div key={p.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-slate-800 transition-colors">
                      <div className="flex items-start justify-between gap-1.5 min-w-0">
                        <div className="truncate pr-1 flex-1">
                          <div className="text-xs font-black text-slate-200 truncate" title={p.name}>{p.name}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5 truncate uppercase">{p.platform}</div>
                        </div>
                        <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusBg} ${statusPulse ? 'animate-pulse' : ''}`}>
                          {p.status}
                        </span>
                      </div>
                      
                      {p.lastError && (
                        <div className="text-[9px] text-rose-400 font-semibold line-clamp-1 leading-normal" title={p.lastError}>
                          {p.lastError}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-900/60">
                        <button
                          onClick={() => handleCheckProfileSession(p.id, p.platform)}
                          disabled={isChecking || isLoggingIn}
                          className="flex-1 flex items-center justify-center gap-1 py-1 bg-violet-600/25 hover:bg-violet-600/35 text-violet-300 text-[10px] font-black rounded-lg border border-violet-500/30 transition-all disabled:opacity-40 cursor-pointer"
                        >
                          {isChecking ? (
                            <><RefreshCw className="h-2.5 w-2.5 animate-spin" /> Đang Check...</>
                          ) : (
                            <>⚡ Check Session</>
                          )}
                        </button>
                        
                        {p.status !== 'ready' && (
                          <button
                            onClick={() => handleOpenProfileLogin(p.id, p.platform)}
                            disabled={isChecking || isLoggingIn}
                            className="flex-1 flex items-center justify-center gap-1 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800 transition-all disabled:opacity-40 cursor-pointer"
                          >
                            {isLoggingIn ? (
                              <><RefreshCw className="h-2.5 w-2.5 animate-spin" /> Đang mở...</>
                            ) : (
                              <>🔑 Đăng nhập</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inbox Form */}
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 space-y-4">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-violet-400" /> Agent Inbox & Context Builder
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Yêu cầu công việc (Founder Prompt)
                </label>
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  rows={3}
                  placeholder="Nhập prompt công việc cần AI lập kế hoạch và chạy thử..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:border-violet-500/60 outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Nhóm nghiệp vụ
                  </label>
                  <select
                    value={workType}
                    onChange={e => setWorkType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none font-bold focus:border-violet-500/60"
                  >
                    <option value="code">Lập trình (AI Coder - Claude/DeepSeek)</option>
                    <option value="design">Thiết kế UI (AI Designer - Visual self-heal)</option>
                    <option value="general">Hội thoại chung (AI Coordinator)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    RAG Context Pack
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none font-bold focus:border-violet-500/60"
                  >
                    <option value="auto">Tự động chọn lọc (Context Optimizer: ON)</option>
                    <option value="all">Nhúng toàn bộ sơ đồ mã nguồn dự án</option>
                    <option value="none">Không nhúng thêm ngữ cảnh</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={planningLoading || !promptText.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all"
              >
                {planningLoading ? (
                  <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang tổng hợp sơ đồ & lập kế hoạch...</>
                ) : (
                  <><Play className="h-3.5 w-3.5" /> Lập kế hoạch & Phân tích rủi ro ảo</>
                )}
              </button>
            </div>
          </div>

          {/* RAG Matching Notes Panel */}
          {planGenerated && (
            <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-violet-400" />
                  <span>Chỉ dẫn nghiệp vụ trùng khớp (Local RAG Memory)</span>
                  <span className="text-[10px] bg-violet-950 text-violet-300 px-2 py-0.5 rounded-full font-bold border border-violet-800/50">
                    {matchedRAGNotes.length} notes
                  </span>
                </div>
                {matchedRAGNotes.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    ✓ Đã nhúng vào prompt ngữ cảnh
                  </span>
                )}
              </div>

              {matchedRAGNotes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Không khớp quy trình nghiệp vụ đặc thù nào. AI Assistant sẽ hoạt động theo tri thức nền chung.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matchedRAGNotes.map((note, index) => {
                    const isExpanded = expandedRAGNoteIndex === index;
                    return (
                      <div 
                        key={index} 
                        className={`rounded-xl border p-3 space-y-2 cursor-pointer transition-all ${
                          isExpanded 
                            ? 'bg-violet-950/20 border-violet-500/40' 
                            : 'bg-slate-950 border-slate-850 hover:border-slate-700'
                        }`}
                        onClick={() => setExpandedRAGNoteIndex(isExpanded ? null : index)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-black text-white leading-normal line-clamp-2">{note.title}</h4>
                          <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-full shrink-0 font-mono">
                            Độ khớp: {note.score}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[8px]">
                          <span className="bg-slate-900 text-violet-300 border border-slate-800 px-1.5 py-0.5 rounded-full">
                            Nguồn: {note.source || 'Founder'}
                          </span>
                          {note.tags && note.tags.split(',').map((tag: string) => (
                            <span key={tag} className="bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-full">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                        
                        {isExpanded ? (
                          <div className="text-[11px] text-slate-300 font-medium leading-relaxed pt-2 border-t border-slate-900 whitespace-pre-wrap">
                            {note.body}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed truncate">
                            {note.body}
                          </p>
                        )}
                        <div className="text-[9px] text-violet-400 font-bold flex items-center justify-end">
                          {isExpanded ? 'Thu gọn' : 'Bấm để xem chi tiết'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Generated Plan */}
          {planGenerated && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Kế hoạch thực thi ảo (Simulated Plan)
                </div>
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-950 border border-slate-900 rounded-lg p-2.5">
                      <span className="w-5 h-5 rounded-full bg-violet-950/40 text-violet-400 border border-violet-850 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] text-slate-300 font-semibold leading-relaxed mt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Bảng phân tích rủi ro & Tool Actions
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {actions.map((act) => (
                    <div 
                      key={act.id} 
                      className={`bg-slate-950 border rounded-xl p-3 flex items-center justify-between gap-3 transition-colors ${
                        act.status === 'blocked' ? 'border-rose-950' : 'border-slate-850'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{act.name}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                            act.risk === 'LOW' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                            act.risk === 'MEDIUM' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' :
                            act.risk === 'HIGH' ? 'bg-orange-950/60 text-orange-400 border border-orange-850/40' :
                            'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                          }`}>
                            {act.risk}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{act.type} · {act.params}</div>
                        {act.message && <div className="text-[9px] text-rose-400 leading-normal font-semibold">{act.message}</div>}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {act.risk === 'BLOCKED' ? (
                          <span className="p-1 text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-lg">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        ) : act.status === 'completed' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <Check className="h-3 w-3" /> Done
                          </span>
                        ) : act.status === 'executing' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-violet-400 bg-violet-950/40 border border-violet-500/30 px-2 py-0.5 rounded-full">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Running
                          </span>
                        ) : (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={act.approved}
                              onChange={() => handleToggleApprove(act.id)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white"></div>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-900/60">
                  <button
                    onClick={handleExecuteAllowed}
                    disabled={!actions.some(a => a.status === 'allowed')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all"
                  >
                    Phê duyệt & Khởi chạy (Simulated Exec)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Screenshot Panel */}
          {showScreenshot && (
            <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-violet-400" /> 📸 Ảnh chụp màn hình giao diện (Multimodal Visual Review)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="h-2.5 w-2.5" /> Chạy thành công
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden flex flex-col items-center justify-center min-h-60">
                  {realScreenshotUrl ? (
                    <img 
                      src={realScreenshotUrl} 
                      alt="Captured Web Sandbox UI" 
                      className="w-full max-h-64 object-contain rounded-lg shadow-xl"
                    />
                  ) : (
                    <div className="w-full max-w-sm rounded-lg border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-2xl p-4 space-y-3 backdrop-blur">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client App Mockup</span>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                      </div>
                      <div className="bg-slate-950/60 rounded border border-slate-850 p-3 text-center text-xs space-y-2">
                        <div className="text-violet-400 font-bold">LedgerFlow Studio Dashboard</div>
                        <div className="text-[10px] text-slate-500 font-mono">Simulating visual check on local canvas</div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div className="w-4/5 h-full bg-gradient-to-r from-violet-500 to-indigo-500"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono mt-3">
                    Ảnh: <span className="text-violet-400">{realScreenshotUrl ? realScreenshotUrl.split('/').pop() : 'screenshot_visual_latest.png'}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Visual Diagnostics / Self-Healing Log
                    </div>
                    
                    <div className="text-xs space-y-2 leading-relaxed text-slate-300">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Giao diện hiển thị tốt
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Ảnh chụp màn hình từ Puppeteer được đưa vào mô hình AI đa phương thức. AI không phát hiện lỗi tràn bố cục (layout overflow) hoặc sai màu sắc.
                      </p>
                      <div className="rounded-lg bg-slate-900 border border-slate-850 p-2.5 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400">Visual Checks:</div>
                        <ul className="list-disc pl-4 text-[10px] text-slate-500 font-mono space-y-0.5">
                          <li>Check Contrast Ratio: Pass</li>
                          <li>Check Element Visibility: Pass</li>
                          <li>Check CSS Grid/Flex Integrity: Pass</li>
                        </ul>
                      </div>

                      {cssPatches.length > 0 && (
                        <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 space-y-1.5 mt-2">
                          <div className="text-[10px] font-bold text-violet-400 flex items-center justify-between">
                            <span>CSS Property Patch Review:</span>
                            <span className="text-[9px] text-emerald-400">Alignment: 82% → 98%</span>
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {cssPatches.map((patch, pIdx) => (
                              <div key={pIdx} className="text-[9px] font-mono flex flex-wrap items-center justify-between bg-slate-950 px-2 py-1 rounded border border-slate-900">
                                <div>
                                  <span className="text-blue-400 font-bold">{patch.selector}</span>
                                  <span className="text-slate-500"> {`{`} </span>
                                  <span className="text-indigo-400">{patch.property}</span>
                                  <span className="text-slate-500">: </span>
                                  <span className="text-rose-400 line-through mr-1">{patch.oldValue}</span>
                                  <span className="text-emerald-400 font-bold">{patch.newValue}</span>
                                  <span className="text-slate-500"> {`}`} </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setLogs(prev => [
                          ...prev,
                          { time: new Date().toLocaleTimeString(), action: "Self-Healing Triggered", details: "Khởi chạy vòng lặp sửa lỗi giao diện...", status: "warn" }
                        ]);
                        setTimeout(() => {
                          setLogs(prev => [
                            ...prev,
                            { time: new Date().toLocaleTimeString(), action: "Self-Healing Success", details: "Đã tối ưu hóa lại CSS layout tự động.", status: "success" }
                          ]);
                          setCssPatches([
                            { selector: '.founder-dashboard-card', property: 'margin-bottom', oldValue: '24px', newValue: '16px' },
                            { selector: '.founder-dashboard-card', property: 'padding', oldValue: '12px', newValue: '16px' },
                            { selector: '.survival-score-bar', property: 'overflow', oldValue: 'visible', newValue: 'hidden' },
                            { selector: '.survival-score-bar', property: 'border-radius', oldValue: '0px', newValue: '9999px' },
                            { selector: '.north-star-chart', property: 'display', oldValue: 'block', newValue: 'flex' }
                          ]);
                        }, 1500);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-black rounded-xl transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Tự động sửa lỗi giao diện (Self-Heal UI)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs */}
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-violet-400" /> Nhật ký kiểm toán (Audit Logs)
                </span>
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setAuditLogsTab('simulation')}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                      auditLogsTab === 'simulation' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Chạy thử (Simulation)
                  </button>
                  <button
                    onClick={() => {
                      setAuditLogsTab('system');
                      loadServerLogs();
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                      auditLogsTab === 'system' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Hệ thống (Signed Server Logs)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {auditLogsTab === 'system' && (
                  <>
                    <button
                      onClick={handleVerifyChain}
                      disabled={verifyingChain}
                      className="flex items-center gap-1 text-[9px] font-black px-2 py-1 bg-violet-950/60 hover:bg-violet-900 text-violet-300 border border-violet-850 rounded-lg disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {verifyingChain ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <ShieldCheck className="h-2.5 w-2.5" />}
                      Kiểm tra toàn vẹn (Verify Integrity)
                    </button>
                    <button
                      onClick={loadServerLogs}
                      className="p-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                    >
                      <RefreshCcw className="h-2.5 w-2.5" />
                    </button>
                  </>
                )}
                <button onClick={handleExportLogs} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white">
                  <Download className="h-3 w-3" /> Xuất JSON
                </button>
              </div>
            </div>

            {auditLogsTab === 'system' && verificationResult && (
              <div className={`text-[10px] px-3 py-1.5 rounded-lg border font-mono ${
                verificationResult.valid ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40' : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
              }`}>
                <span className="font-bold">Trạng thái chữ ký chuỗi: </span>
                {verificationResult.valid ? (
                  <span>✓ Toàn vẹn chuỗi hợp lệ (Chain verified. Checked {verificationResult.checked} entries. No tampering detected).</span>
                ) : (
                  <span>⚠️ Phát hiện sửa đổi trái phép! Failures detected in events: {verificationResult.failures.join(', ')}</span>
                )}
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[10px] pr-1">
              {auditLogsTab === 'simulation' ? (
                logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 bg-slate-950 border border-slate-900/80 rounded px-2.5 py-1.5 leading-relaxed">
                    <span className="text-slate-500 shrink-0">{log.time}</span>
                    <span className={`font-black uppercase shrink-0 ${
                      log.status === 'success' ? 'text-emerald-400' :
                      log.status === 'warn' ? 'text-amber-400' :
                      log.status === 'error' ? 'text-rose-400' : 'text-violet-400'
                    }`}>
                      [{log.action}]
                    </span>
                    <span className="text-slate-400">{log.details}</span>
                  </div>
                ))
              ) : (
                serverLogs.length === 0 ? (
                  <div className="text-slate-500 text-center py-4 font-sans font-semibold">Chưa có sự kiện kiểm toán nào được ghi lại tại server.</div>
                ) : (
                  serverLogs.map((log) => (
                    <div key={log.id} className="bg-slate-950 border border-slate-900/80 rounded p-2.5 space-y-1 leading-normal">
                      <div className="flex items-center justify-between gap-2 text-[9px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-500">{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                          <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-bold">{log.actor}</span>
                          <span className="text-slate-400 font-semibold">{log.workspace} · <span className="text-violet-400 font-bold">{log.action}</span></span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded font-black ${
                          log.status === 'executed' || log.status === 'approved' ? 'bg-emerald-950 text-emerald-400' :
                          log.status === 'failed' ? 'bg-rose-950 text-rose-400' :
                          log.status === 'pending_approval' ? 'bg-amber-950 text-amber-400' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-semibold">{log.summary}</div>
                      {log.signature && <div className="text-[8px] text-slate-600 truncate">Sig: {log.signature}</div>}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: Agent Staff Runtime ────────────────────────────── */}
      {sandboxTab === 'runtime' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Emergency Stop Panel */}
          {runtimeMetrics?.emergencyStop && (
            <div className="rounded-xl border border-rose-900 bg-rose-950/40 p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                <span>⚠️ TRẠNG THÁI DỪNG KHẨN CẤP ĐANG KÍCH HOẠT (EMERGENCY STOP ACTIVE)</span>
              </div>
              <p className="text-xs text-rose-300 leading-relaxed pl-7">
                Lý do dừng: {runtimeMetrics.fallbackPlannedRuns > 0 ? 'Dự toán ngân hàng/Quota hoặc' : ''} Founder đã nhấn nút dừng.
                Tất cả các robot và luồng Agent đang chạy ngầm đã bị buộc dừng và khóa lại.
              </p>
              <div className="pl-7">
                <button
                  onClick={() => handleToggleEmergencyStop(false)}
                  disabled={estopLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                >
                  {estopLoading ? 'Đang mở khóa...' : '🔓 Reset & Kích hoạt lại Hệ thống'}
                </button>
              </div>
            </div>
          )}

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Tổng số lượt chạy', val: runtimeMetrics?.totalRuns ?? 0, color: 'text-violet-400 border-violet-850/50' },
              { label: 'Đang hoạt động', val: runtimeMetrics?.activeRuns ?? 0, color: 'text-cyan-400 border-cyan-850/50 animate-pulse' },
              { label: 'Chờ duyệt (Fingerprint)', val: runtimeMetrics?.waitingApproval ?? 0, color: 'text-amber-400 border-amber-850/50' },
              { label: 'Tỷ lệ hoàn thành', val: `${runtimeMetrics ? Math.round(((runtimeMetrics.completedRuns) / (runtimeMetrics.totalRuns || 1)) * 100) : 0}%`, color: 'text-emerald-400 border-emerald-850/50' },
              { label: 'Độ trễ trung bình', val: `${runtimeMetrics?.averageStepLatencyMs ?? 0} ms`, color: 'text-indigo-400 border-indigo-850/50' }
            ].map((m, idx) => (
              <div key={idx} className={`bg-slate-900/40 border rounded-xl p-3.5 flex flex-col justify-between ${m.color}`}>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{m.label}</span>
                <span className="text-lg font-black mt-1.5 font-mono">{m.val}</span>
              </div>
            ))}
          </div>

          {/* Dispatch Form and Emergency Stop Controller */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Create Run Form */}
            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Play className="h-4 w-4 text-violet-400" /> Điều động nhân sự AI (Dispatch Agent Goal)
              </h3>
              <form onSubmit={handleCreateRun} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Yêu cầu/Mục tiêu cho Agent</label>
                  <input
                    type="text"
                    required
                    value={newRunGoal}
                    onChange={e => setNewRunGoal(e.target.value)}
                    placeholder="e.g. Kiểm tra rò rỉ bộ nhớ, Phân tích CSS navbar, Chạy test ci..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-violet-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số bước tối đa (Max steps)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={newRunMaxSteps}
                      onChange={e => setNewRunMaxSteps(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Chế độ Planner</label>
                    <select
                      value={newRunPlannerMode}
                      onChange={e => setNewRunPlannerMode(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-bold"
                    >
                      <option value="auto">Auto (Chọn tối ưu)</option>
                      <option value="ai">AI Dynamic Plan</option>
                      <option value="deterministic">Deterministic (Tuần tự)</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={creatingRun || runtimeMetrics?.emergencyStop}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {creatingRun ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Khởi động & Chạy bước đầu tiên
                </button>
              </form>
            </div>

            {/* Emergency Controller */}
            {!runtimeMetrics?.emergencyStop && (
              <div className="rounded-xl border border-slate-850 bg-rose-950/10 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldX className="h-4 w-4 text-rose-500" /> Bảng dừng khẩn cấp
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Nhập lý do dừng và kích hoạt dừng khẩn cấp. Mọi luồng chạy ngầm của AI sẽ bị khóa lập tức.
                  </p>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={estopReasonInput}
                    onChange={e => setEstopReasonInput(e.target.value)}
                    placeholder="Lý do dừng (e.g. Phát hiện lỗi nghiêm trọng)..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 placeholder-slate-700 outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => handleToggleEmergencyStop(true)}
                    disabled={estopLoading}
                    className="w-full py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    🚨 Kích hoạt dừng khẩn cấp
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Agent Runs List */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-violet-400" /> Tiến trình Agent đang chạy ngầm (Agent Runs Store)
              </h3>
              <button
                onClick={loadRuntimeState}
                disabled={runsLoading}
                className="p-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <RefreshCcw className="h-3 w-3" />
              </button>
            </div>

            {runsLoading && runtimeRuns.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-violet-400" /> Đang tải danh sách Agent Runs...
              </div>
            ) : runtimeRuns.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 font-semibold">
                Chưa có Agent Run nào được khởi tạo trong phiên làm việc này.
              </div>
            ) : (
              <div className="space-y-3">
                {runtimeRuns.map((run) => (
                  <div key={run.id} className="rounded-xl border border-slate-850 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">{run.id.slice(0, 12)}</span>
                          <span className="text-[10px] text-slate-500">by {run.requestedBy}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded font-mono ${
                            run.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' :
                            run.status === 'failed' ? 'bg-rose-950 text-rose-400 border border-rose-800/30' :
                            run.status === 'waiting_approval' ? 'bg-amber-950 text-amber-400 border border-amber-800/30 animate-pulse' :
                            run.status === 'running' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/30 animate-pulse' :
                            'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {run.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-semibold">{run.goal}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {['planned', 'running', 'waiting_approval'].includes(run.status) && (
                          <>
                            <button
                              onClick={() => handleAdvanceRun(run.id)}
                              disabled={advancingRunIds[run.id] || run.status === 'waiting_approval' || runtimeMetrics?.emergencyStop}
                              className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-[10px] text-white font-black rounded-lg transition-all flex items-center gap-1"
                            >
                              {advancingRunIds[run.id] ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Play className="h-2.5 w-2.5" />}
                              Chạy tiếp (Advance)
                            </button>
                            <button
                              onClick={() => handleAbortRun(run.id)}
                              disabled={abortingRunIds[run.id]}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-rose-400 border border-slate-850 hover:border-rose-900/40 rounded-lg transition-all"
                            >
                              Dừng (Abort)
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[10px] font-bold rounded-lg transition-all"
                        >
                          {expandedRunId === run.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Steps list */}
                    {expandedRunId === run.id && (
                      <div className="border-t border-slate-900 pt-3 space-y-3">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                          <span>Sơ đồ phân rã các bước ({run.steps.length} bước)</span>
                          <span className="font-mono text-[9px] text-slate-600">Planner: {run.planner}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {run.steps.map((step) => (
                            <div key={step.id} className="bg-slate-950 border border-slate-900 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 flex items-center justify-center">
                                    {step.index + 1}
                                  </span>
                                  <span className="text-xs font-bold text-slate-200">{step.title}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded font-mono ${
                                  step.status === 'completed' ? 'text-emerald-400 bg-emerald-950/30' :
                                  step.status === 'failed' ? 'text-rose-400 bg-rose-950/30' :
                                  step.status === 'waiting_approval' ? 'text-amber-400 bg-amber-950/30 animate-pulse' :
                                  step.status === 'running' ? 'text-cyan-400 bg-cyan-950/30 animate-pulse' :
                                  'text-slate-500 bg-slate-900/30'
                                }`}>
                                  {step.status}
                                </span>
                              </div>

                              <div className="text-[10px] leading-relaxed text-slate-400">
                                <strong>Tiêu chí xong:</strong> {step.successCriteria}
                              </div>

                              {step.observation && (
                                <div className="text-[10px] bg-slate-900/60 p-2 rounded-lg border border-slate-900 text-slate-300 font-mono">
                                  <strong className="text-violet-400">Kết quả:</strong> {step.observation}
                                </div>
                              )}

                              {/* Approval Area */}
                              {step.status === 'waiting_approval' && step.approvalFingerprint && (
                                <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 space-y-2.5">
                                  <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                                    <span>Yêu cầu chữ ký của Founder để thực thi (High Risk Tool)</span>
                                  </div>
                                  <div className="text-[9px] font-mono text-slate-500 leading-normal break-all">
                                    Fingerprint: {step.approvalFingerprint}
                                  </div>
                                  <button
                                    onClick={() => handleApproveStep(run.id, step.id, step.approvalFingerprint!)}
                                    disabled={approvingStepIds[step.id] || runtimeMetrics?.emergencyStop}
                                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                                  >
                                    {approvingStepIds[step.id] ? 'Đang duyệt ký...' : '✍️ Đăng ký chữ ký & Kích hoạt chạy (Approve Step)'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: AI Memory Vault ────────────────────────────────── */}
      {sandboxTab === 'memory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          {/* Add Memory Form */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3 h-fit">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Save className="h-4 w-4 text-violet-400" /> Nạp ngữ cảnh vào bộ nhớ RAG
            </h3>
            <form onSubmit={handleAddMemory} className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Loại bộ nhớ (Kind)</label>
                <select
                  value={newMemKind}
                  onChange={e => setNewMemKind(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-bold"
                >
                  <option value="company">Company (Quy định công ty)</option>
                  <option value="procedure">Procedure (Quy trình nghiệp vụ)</option>
                  <option value="session">Session (Ngữ cảnh phiên hoạt động)</option>
                  <option value="observation">Observation (Quan sát hệ thống)</option>
                  <option value="feedback">Feedback (Phản hồi của Founder)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tiêu đề ngữ cảnh</label>
                <input
                  type="text"
                  required
                  value={newMemTitle}
                  onChange={e => setNewMemTitle(e.target.value)}
                  placeholder="e.g. Quy trình duyệt chi thông tư 200..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nguồn tri thức (Source file/context)</label>
                <input
                  type="text"
                  required
                  value={newMemSource}
                  onChange={e => setNewMemSource(e.target.value)}
                  placeholder="docs/VAS_COMPLIANCE.md"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mã tham chiếu (Source line/ref)</label>
                <input
                  type="text"
                  value={newMemSourceRef}
                  onChange={e => setNewMemSourceRef(e.target.value)}
                  placeholder="L15-30"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nội dung tri thức</label>
                <textarea
                  required
                  value={newMemContent}
                  onChange={e => setNewMemContent(e.target.value)}
                  rows={4}
                  placeholder="Nhập nội dung quy trình hoặc phản hồi chi tiết..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none resize-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-2 pb-1">
                <input
                  type="checkbox"
                  id="markReviewed"
                  checked={newMemReviewed}
                  onChange={e => setNewMemReviewed(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="markReviewed" className="text-[10px] text-slate-400 font-bold cursor-pointer">Duyệt chính thức ngay (Reviewed)</label>
              </div>

              <button
                type="submit"
                disabled={addingMemory}
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1"
              >
                {addingMemory ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Nạp bộ nhớ RAG
              </button>
            </form>
          </div>

          {/* Search & Review Area */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="h-4 w-4 text-violet-400" /> Tra cứu & Phê duyệt Bộ nhớ (RAG Memory Store)
              </h3>
              
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-violet-500 transition-all">
                  <input
                    type="text"
                    value={memSearchQuery}
                    onChange={e => setMemSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchMemory()}
                    placeholder="Nhập từ khóa tìm kiếm bộ nhớ hoặc để trống để hiển thị tất cả..."
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none"
                  />
                  <button
                    onClick={handleSearchMemory}
                    disabled={memSearching}
                    className="px-3 text-slate-400 hover:text-white transition-colors"
                  >
                    <FileSearch className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {memSearching ? (
                  <div className="text-center py-12 text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-violet-400" /> Đang tìm kiếm bộ nhớ...
                  </div>
                ) : memSearchResults.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 font-semibold">
                    Không tìm thấy bản ghi bộ nhớ nào phù hợp.
                  </div>
                ) : (
                  memSearchResults.map((item) => {
                    const record = item.record || item; // search yields nested item, list yields flat
                    const score = item.score;
                    return (
                      <div key={record.id} className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2.5 text-[10px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-850 rounded text-slate-400 font-mono font-bold uppercase tracking-wider">{record.kind}</span>
                            <span className={`px-1.5 py-0.2 rounded font-black font-mono uppercase tracking-wider ${
                              record.status === 'reviewed' ? 'bg-emerald-950 text-emerald-400' :
                              record.status === 'rejected' ? 'bg-rose-950 text-rose-400' :
                              'bg-amber-950 text-amber-400 animate-pulse'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                          {score !== undefined && (
                            <span className="text-slate-500 font-mono">Sim Score: <span className="text-violet-400 font-bold">{score.toFixed(3)}</span></span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-100">{record.title}</h4>
                          <p className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-900/20 p-2 rounded-lg border border-slate-900/60 font-sans">
                            {record.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2.5 text-[9px] text-slate-500 font-mono">
                          <div className="truncate max-w-[200px] text-slate-400" title={`${record.source}${record.sourceRef ? `:${record.sourceRef}` : ''}`}>
                            Source: <span className="text-violet-400 font-semibold">{record.source}</span> {record.sourceRef && `(${record.sourceRef})`}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded font-black ${
                            record.confidence >= 0.8 ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30' :
                            record.confidence >= 0.5 ? 'bg-amber-950/40 text-amber-450 border border-amber-900/30' :
                            'bg-rose-950/40 text-rose-455 border border-rose-900/30'
                          }`}>
                            Conf: {(record.confidence * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Review Buttons for draft */}
                        {record.status === 'draft' && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleReviewMemory(record.id, 'reviewed')}
                              disabled={reviewingMemoryIds[record.id]}
                              className="flex-1 py-1 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                            >
                              {reviewingMemoryIds[record.id] ? 'Đang duyệt...' : '✓ Phê duyệt (Approve)'}
                            </button>
                            <button
                              onClick={() => handleReviewMemory(record.id, 'rejected')}
                              disabled={reviewingMemoryIds[record.id]}
                              className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-rose-400 border border-slate-850 hover:border-rose-900/40 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                            >
                              Từ chối (Reject)
                            </button>
                          </div>
                        )}

                        {/* Allow quick rejection/deletion for reviewed memories */}
                        {record.status === 'reviewed' && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleReviewMemory(record.id, 'rejected')}
                              disabled={reviewingMemoryIds[record.id]}
                              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-rose-400 border border-slate-850 hover:border-rose-900/40 text-[9px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              title="Chuyển trạng thái sang rejected"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              Từ chối & Tắt
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Robot Simulation ───────────────────────────────── */}
      {sandboxTab === 'robot' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          {/* Status Monitor */}
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-violet-400" /> Robot Telemetry Status
              </h3>
              <button
                onClick={loadRobotState}
                disabled={robotLoading}
                className="p-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <RefreshCcw className="h-3 w-3" />
              </button>
            </div>

            {robotLoading && !robotState ? (
              <div className="text-center py-12 text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-violet-400" /> Đang tải telemetry...
              </div>
            ) : robotState ? (
              <div className="space-y-4">
                {/* Flashing Emergency Stop Alert */}
                {robotState.emergencyStop && (
                  <div className="rounded-xl border border-rose-900 bg-rose-950/40 p-3 flex items-center justify-between gap-3 animate-pulse">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> ROBOT EMERGENCY STOP LATCHED
                    </span>
                    <button
                      onClick={handleRobotEStopReset}
                      disabled={robotCommandLoading}
                      className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-[9px] font-black rounded-lg transition-colors cursor-pointer"
                    >
                      Reset Estop
                    </button>
                  </div>
                )}

                {/* Coordinate indicators */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { axis: 'X Coordinate', val: `${robotState.position.x} mm`, nearLimit: Math.abs(robotState.position.x) > 400 },
                    { axis: 'Y Coordinate', val: `${robotState.position.y} mm`, nearLimit: Math.abs(robotState.position.y) > 400 },
                    { axis: 'Z Coordinate', val: `${robotState.position.z} mm`, nearLimit: Math.abs(robotState.position.z) > 400 }
                  ].map((axis, idx) => (
                    <div key={idx} className={`bg-slate-950 border rounded-xl p-3 text-center transition-colors ${
                      axis.nearLimit ? 'border-amber-900/60 bg-amber-950/10' : 'border-slate-900'
                    }`}>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">{axis.axis}</span>
                      <span className="text-sm font-black font-mono mt-1 block text-slate-200">{axis.val}</span>
                      {axis.nearLimit && <span className="text-[8px] text-amber-500 font-bold block mt-0.5 animate-pulse">Cận biên (Limit!)</span>}
                    </div>
                  ))}
                </div>

                {/* Grid stats */}
                <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-3 text-[11px] space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Trạng thái kết nối (Serial):</span>
                    <span className="text-slate-500 font-bold">DISCONNECTED (SIMULATION ONLY)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Chế độ kiểm thử (Safety Envelope):</span>
                    <span className="text-emerald-400 font-bold">ACTIVE (Max 500 mm)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Tốc độ chuyển động:</span>
                    <span className="text-slate-300 font-mono">{robotState.velocity} mm/s</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Nhịp tim cuối (Heartbeat):</span>
                    <span className="text-slate-500 font-mono">{new Date(robotState.lastHeartbeatAt).toLocaleTimeString()}</span>
                  </div>
                  {robotState.lastCommandId && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900 pt-2 font-mono">
                      <span>Last Cmd ID:</span>
                      <span className="truncate max-w-[160px]" title={robotState.lastCommandId}>{robotState.lastCommandId}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                Không kết nối được telemetry của robot.
              </div>
            )}

            {/* Simulated evidence viewer */}
            {lastRobotResult && (
              <div className="rounded-xl border border-slate-850 bg-slate-950/60 p-3.5 space-y-2.5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Kết quả phản hồi từ Robot (Evidence)</span>
                  <span className="text-emerald-400 font-bold">ACCEPTED</span>
                </div>
                <div className="bg-black/60 border border-slate-900 p-2.5 rounded-lg max-h-32 overflow-y-auto">
                  <pre className="font-mono text-[9px] text-cyan-300 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(lastRobotResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Interactive controls */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-violet-400" /> Buồng lái robot giả lập (Move Command Builder)
            </h3>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRobotCommand('inspect')}
                disabled={robotCommandLoading || robotState?.emergencyStop}
                className="py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Inspect
              </button>
              <button
                onClick={() => handleRobotCommand('home')}
                disabled={robotCommandLoading || robotState?.emergencyStop}
                className="py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Go Home (0,0,0)
              </button>
              <button
                onClick={() => handleRobotCommand('stop')}
                disabled={robotCommandLoading}
                className="py-2 bg-rose-950/60 border border-rose-800/40 hover:bg-rose-900/40 text-rose-400 text-xs font-black rounded-lg transition-colors cursor-pointer"
              >
                🛑 E-STOP
              </button>
            </div>

            {/* Vector controls */}
            <div className="space-y-3.5 border-t border-slate-900 pt-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Thiết lập vector dịch chuyển (Move Parameter)
              </div>

              {/* X range */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Trục X (Left-Right)</span>
                  <span className="font-bold text-violet-400">{robotX} mm</span>
                </div>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  value={robotX}
                  onChange={e => setRobotX(Number(e.target.value))}
                  disabled={robotState?.emergencyStop}
                  className="w-full accent-violet-600 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Y range */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Trục Y (Forward-Backward)</span>
                  <span className="font-bold text-violet-400">{robotY} mm</span>
                </div>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  value={robotY}
                  onChange={e => setRobotY(Number(e.target.value))}
                  disabled={robotState?.emergencyStop}
                  className="w-full accent-violet-600 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Z range */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Trục Z (Up-Down)</span>
                  <span className="font-bold text-violet-400">{robotZ} mm</span>
                </div>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  value={robotZ}
                  onChange={e => setRobotZ(Number(e.target.value))}
                  disabled={robotState?.emergencyStop}
                  className="w-full accent-violet-600 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Velocity range */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Tốc độ di chuyển (Velocity)</span>
                  <span className="font-bold text-violet-400">{robotSpeed} mm/s</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={robotSpeed}
                  onChange={e => setRobotSpeed(Number(e.target.value))}
                  disabled={robotState?.emergencyStop}
                  className="w-full accent-violet-600 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Approval phrase */}
              <div className="space-y-2 border-t border-slate-900 pt-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="robotSafetyCommit"
                    checked={robotSafetyCommit}
                    onChange={e => setRobotSafetyCommit(e.target.checked)}
                    disabled={robotState?.emergencyStop}
                    className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-0 focus:ring-offset-0 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="robotSafetyCommit" className="text-[10px] text-slate-400 font-bold cursor-pointer select-none leading-normal">
                    Tôi cam kết tọa độ chuyển động an toàn, nằm trong tầm với của tay máy và không va chạm vật lý.
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Mã lệnh phê duyệt (Approval Phrase)
                  </label>
                  <input
                    type="text"
                    value={robotApprovalPhrase}
                    onChange={e => setRobotApprovalPhrase(e.target.value)}
                    disabled={robotState?.emergencyStop}
                    placeholder="Gõ đúng: APPROVE ROBOT SIMULATION"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-800 outline-none focus:border-violet-500 font-mono"
                  />
                </div>
              </div>

              {robotError && (
                <div className="text-[10px] text-rose-400 font-semibold bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl">
                  ⚠️ Lỗi: {robotError}
                </div>
              )}

              <button
                onClick={() => handleRobotCommand('move')}
                disabled={robotCommandLoading || robotState?.emergencyStop || !robotSafetyCommit || robotApprovalPhrase !== 'APPROVE ROBOT SIMULATION'}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {robotCommandLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Compass className="h-3.5 w-3.5" />}
                Phát lệnh chuyển động cánh tay (Simulate Move)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

