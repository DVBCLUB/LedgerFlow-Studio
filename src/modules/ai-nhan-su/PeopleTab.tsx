import { useState, useEffect, useRef, useCallback } from 'react';
import type { WorkCard, WorkStatus } from '../../types/agentOps';
import { useLocalStorageVersion, appendAgentOpsAudit } from './storage';
import { 
  Bot, Loader2, Play, CheckCircle2, XCircle, AlertTriangle, FileText, X, Layers, Send, Terminal, Sparkles, Copy, Trash2, HelpCircle, Database, ShieldAlert, AlertCircle, Cpu, Save, FileDown, BookOpen, Check, Edit2, Upload, PlusCircle, FileSpreadsheet, RotateCcw, Paperclip, Activity, Lock, ChevronDown, ChevronUp, UserCheck, Plus } from 'lucide-react';
import {
  editFile,
  applyEdit,
  type EditResult,
  fetchAgentRuns,
  createAgentRun,
  advanceAgentRun,
  approveAgentRunStep,
  stopAgentRun,
  setAgentRuntimeEmergencyStop,
  type AgentRun,
  type AgentRunStep,
  fetchWebAIProfiles,
  checkWebAIProfileSession,
  openWebAIProfileLogin,
  type WebAIProfile
} from '../../utils/assistantApi';
import { AI_AGENT_TASK_TEMPLATES } from '../../data/founderCompanyEnhancements';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const LEGACY_STAFF_KEY = 'ledgerflow-ai-staff-assignment-v1';
const SCRAPBOOK_KEY = 'fastrack_saved_snippets';
const watchedEvents = ['ledgerflow-aiops-card-updated', 'ledgerflow-ai-staff-updated', 'storage'];

const roleDirectory = [
  { name: 'AI Chief of Staff', mission: 'Điều phối hoạt động doanh nghiệp, standup, quy trình phê duyệt và ưu tiên chiến lược.', permission: 'MEDIUM', connectors: ['AI Gateway', 'Knowledge Library'], output: 'Daily brief, work order, risk summary' },
  { name: 'AI Dev', mission: 'Lập kế hoạch phát triển mã nguồn, tối ưu UI/UX, hỗ trợ GitOps và tự động hóa thử nghiệm.', permission: 'HIGH', connectors: ['GitHub', 'VS Code', 'CI Doctor'], output: 'Code plan, patch summary, PR checklist' },
  { name: 'AI Designer', mission: 'Thiết kế giao diện Company OS, flow trải nghiệm và quy chuẩn thiết kế hệ thống.', permission: 'MEDIUM', connectors: ['Knowledge Library'], output: 'Wireframe note, UI checklist' },
  { name: 'AI Marketer', mission: 'Điều phối chiến dịch marketing, lập lịch nội dung, tối ưu SEO và đo lường phễu chuyển đổi.', permission: 'LOW', connectors: ['Marketing workspace'], output: 'Campaign brief, copy draft' },
  { name: 'AI Accountant', mission: 'Xử lý chứng từ AI OCR, định khoản hạch toán VAS 200/133, tính thuế TNCN/GTGT/TNDN và soát xét sổ sách.', permission: 'MEDIUM', connectors: ['Finance & Accounting'], output: 'Báo cáo kiểm soát, bút toán VAS' },
  { name: 'AI Auditor', mission: 'Soát xét rủi ro chứng từ, quy trình kiểm soát nội bộ, phát hiện sai lệch và xây dựng ma trận rủi ro.', permission: 'MEDIUM', connectors: ['Analytics & Sandbox'], output: 'Audit finding, ma trận rủi ro' },
  { name: 'AI Data Analyst', mission: 'Phân tích chỉ số dòng tiền, KPI vận hành, phát hiện bất thường và dự báo xu hướng.', permission: 'MEDIUM', connectors: ['Analytics & Sandbox'], output: 'Insight card, dashboard metric' },
  { name: 'AI QA', mission: 'Kiểm thử chất lượng hệ thống, soát xét trước khi phát hành, giám sát CI và báo cáo độ ổn định.', permission: 'HIGH', connectors: ['CI Doctor', 'Risk & Release Audit'], output: 'QA checklist, release gate result' },
];

interface SavedSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  savedAt: string;
}

interface Message {
  role: 'user' | 'assistant' | 'error';
  text: string;
}

interface LegacyStaffTask {
  id: string;
  aiStaff: string;
  role: string;
  task: string;
  input: string;
  expectedOutput: string;
  acceptanceCriteria: string;
  deadline: string;
  status: 'Backlog' | 'Assigned' | 'In Review' | 'Approved' | 'Rejected';
  founderReview: string;
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeCards(cards: WorkCard[]) {
  localStorage.setItem(CARD_KEY, JSON.stringify(cards));
  window.dispatchEvent(new CustomEvent('ledgerflow-aiops-card-updated'));
  window.dispatchEvent(new CustomEvent('ledgerflow-ai-staff-updated'));
}

function staffStatusToWorkStatus(status: LegacyStaffTask['status']): WorkStatus {
  if (status === 'Approved') return 'Done';
  if (status === 'In Review') return 'Waiting Approval';
  if (status === 'Assigned') return 'Ready';
  return 'Inbox';
}

function legacyStaffToCard(task: LegacyStaffTask): WorkCard {
  return {
    id: task.id,
    title: task.task,
    kind: 'Ops',
    owner: task.role,
    status: staffStatusToWorkStatus(task.status),
    risk: 'MEDIUM',
    request: task.input || task.task,
    plan: [task.expectedOutput || 'Legacy staff output', task.acceptanceCriteria || 'Founder review required'],
    tools: ['AI Staff Assignment'],
    approval: task.founderReview || 'Legacy staff task imported for display.',
    aiStaff: task.aiStaff,
    role: task.role,
    task: task.task,
    input: task.input,
    expectedOutput: task.expectedOutput,
    acceptanceCriteria: task.acceptanceCriteria,
    founderReview: task.founderReview,
    deadline: task.deadline
  };
}

function readStaffCards(): WorkCard[] {
  const cards = readLocal<WorkCard[]>(CARD_KEY, []);
  const legacyTasks = readLocal<LegacyStaffTask[]>(LEGACY_STAFF_KEY, []);
  const staffCards = cards.filter((card) => card.aiStaff || card.acceptanceCriteria || card.founderReview);
  const migratedLegacyCards = legacyTasks.map(legacyStaffToCard).filter((legacyCard) => !staffCards.some((card) => card.id === legacyCard.id));
  return [...staffCards, ...migratedLegacyCards];
}

interface LintErrorHighlight {
  file: string;
  line: number;
  col?: number;
  message: string;
  severity: 'error' | 'warning';
}

function parseLintErrors(errorsString: string): LintErrorHighlight[] {
  if (!errorsString) return [];
  const lines = errorsString.split('\n');
  const results: LintErrorHighlight[] = [];
  
  for (const line of lines) {
    // 1. TypeScript Match: src/file.tsx(10,5): error TS1234: message
    const tsMatch = line.match(/([a-zA-Z0-9_\-\.\/\\\s]+)\((\d+),(\d+)\):\s+(error|warning)\s+([^:]+):\s+(.*)/i);
    if (tsMatch) {
      results.push({
        file: tsMatch[1].trim(),
        line: parseInt(tsMatch[2], 10),
        col: parseInt(tsMatch[3], 10),
        severity: tsMatch[4].toLowerCase() === 'warning' ? 'warning' : 'error',
        message: `${tsMatch[5]}: ${tsMatch[6].trim()}`,
      });
      continue;
    }
    
    // 2. ESLint Match: d:\path\file.tsx:10:5  error  message
    const eslintMatch = line.match(/(?:[a-zA-Z]:)?([a-zA-Z0-9_\-\.\/\\\s]+):(\d+):(\d+)\s+(error|warning)\s+(.*)/i);
    if (eslintMatch) {
      results.push({
        file: eslintMatch[1].trim(),
        line: parseInt(eslintMatch[2], 10),
        col: parseInt(eslintMatch[3], 10),
        severity: eslintMatch[4].toLowerCase() === 'warning' ? 'warning' : 'error',
        message: eslintMatch[5].trim(),
      });
    }
  }
  return results;
}

export default function PeopleTab() {
  useLocalStorageVersion(watchedEvents);

  // Layout and view states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScrapbook, setShowScrapbook] = useState(true);
  const [showProfilesCheck, setShowProfilesCheck] = useState(false);
  const [draft, setDraft] = useState({ aiStaff: '', role: '', task: '', acceptanceCriteria: '' });

  // AI Workforce Operations execution states
  const [executingCard, setExecutingCard] = useState<WorkCard | null>(null);
  const [execRole, setExecRole] = useState('');
  const [execInputFile, setExecInputFile] = useState('');
  const [execPrompt, setExecPrompt] = useState('');
  const [execAutoRepair, setExecAutoRepair] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [applyingAI, setApplyingAI] = useState(false);
  const [aiOutput, setAiOutput] = useState<EditResult | null>(null);
  const [applyResult, setApplyResult] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // Puppeteer profiles chẩn đoán states
  const [webAIProfiles, setWebAIProfiles] = useState<WebAIProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [checkingProfileId, setCheckingProfileId] = useState<string | null>(null);
  const [loggingInProfileId, setLoggingInProfileId] = useState<string | null>(null);

  // New Agent Runtime integration states
  const [executionMode, setExecutionMode] = useState<'single' | 'multistep'>('single');
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [runStepsLoading, setRunStepsLoading] = useState(false);
  const [advancingRun, setAdvancingRun] = useState(false);
  const [approvingStep, setApprovingStep] = useState(false);
  const [stoppingRun, setStoppingRun] = useState(false);
  const [estopLoading, setEstopLoading] = useState(false);
  const [approvalPhraseInput, setApprovalPhraseInput] = useState('');

  // Chat & Playground states
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Xin chào Solo Founder! Tôi là Trợ lý AI Kế toán & Khoa học Dữ liệu thực chiến. Tôi có thể giúp bạn tạo lược đồ database mới, viết mã phân tích pandas chuẩn, hoặc thiết kế mô hình dự báo dòng tiền. Hãy chọn một mẫu nhanh bên dưới, kéo thả trực tiếp tệp PDF/CSV sao kê hóa đơn, hoặc viết câu hỏi của riêng bạn nhé!'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scrapbook states
  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>([]);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');

  // Model & Connection status states
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [keyStatus, setKeyStatus] = useState<{ usingCustomKey: boolean; keyName: string; isProReady: boolean } | null>(null);
  const [daemonStatus, setDaemonStatus] = useState<{ online: boolean; message: string }>({ online: false, message: 'Đang kết nối...' });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadWebAIProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const list = await fetchWebAIProfiles();
      setWebAIProfiles(list);
    } catch (err) {
      console.error("Failed to load Web AI profiles in people tab:", err);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  const handleCheckProfileSession = async (profileId: string, platform: string) => {
    setCheckingProfileId(profileId);
    addLog(`Check Session profile ID: ${profileId}...`);
    try {
      const res = await checkWebAIProfileSession(profileId, platform);
      setWebAIProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: res.status as any, lastError: res.error } : p));
      addLog(`Kiểm tra session profile ${profileId}: ${res.status}${res.error ? ` - Lỗi: ${res.error}` : ''}`);
    } catch (err: any) {
      addLog(`Lỗi kiểm tra session: ${err.message}`);
      alert(`Lỗi kiểm tra session: ${err.message}`);
    } finally {
      setCheckingProfileId(null);
    }
  };

  const handleOpenProfileLogin = async (profileId: string, platform: string) => {
    setLoggingInProfileId(profileId);
    addLog(`Đang mở cửa sổ Chrome đăng nhập cho profile ID: ${profileId}...`);
    try {
      const res = await openWebAIProfileLogin(profileId, platform);
      setWebAIProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: res.status as any, lastError: res.error } : p));
      addLog(`Hoàn tất phiên đăng nhập profile ${profileId}. Trạng thái: ${res.status}`);
    } catch (err: any) {
      addLog(`Lỗi mở cửa sổ đăng nhập: ${err.message}`);
      alert(`Lỗi mở đăng nhập: ${err.message}`);
    } finally {
      setLoggingInProfileId(null);
    }
  };

  // Load Saved Snippets, API Status & Daemon Health
  useEffect(() => {
    // Scroll to chat end
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    loadWebAIProfiles();
    // Load Scrapbook
    try {
      const saved = localStorage.getItem(SCRAPBOOK_KEY);
      if (saved) setSavedSnippets(JSON.parse(saved));
    } catch (e) {
      console.error('Lỗi tải sổ tay code: ', e);
    }
    
    // Check local daemon health & gateway status
    fetch('/api/ai/preflight')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const report = data.report;
          setKeyStatus({
            usingCustomKey: Boolean(report?.stats?.enabledKeys),
            keyName: report?.summary || 'AI Gateway',
            isProReady: Boolean(report?.ok)
          });
          setDaemonStatus({ online: true, message: 'Cổng Gateway hoạt động ổn định' });
        } else {
          setDaemonStatus({ online: false, message: 'Daemon phản hồi lỗi' });
        }
      })
      .catch(err => {
        console.error("Lỗi lấy trạng thái API: ", err);
        setDaemonStatus({ online: false, message: 'Không kết nối được daemon local (Port 3001)' });
      });
  }, []);

  const saveSnippetsToStorage = (updated: SavedSnippet[]) => {
    setSavedSnippets(updated);
    try {
      localStorage.setItem(SCRAPBOOK_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Lỗi lưu trữ sổ tay code: ', e);
    }
  };

  const handleSaveToScrapbook = (title: string, code: string, rawLang: string) => {
    const lang = rawLang.toLowerCase() || 'txt';
    const cleanLang = lang.includes('py') ? 'py' : lang.includes('sql') ? 'sql' : lang.includes('js') ? 'js' : 'txt';
    
    if (savedSnippets.some(s => s.code.trim() === code.trim())) {
      alert('Đoạn code này đã được lưu trước đó trong Sổ tay!');
      return;
    }

    const newSnippet: SavedSnippet = {
      id: `snippet_${Date.now()}`,
      title,
      code: code.trim(),
      language: cleanLang,
      savedAt: new Date().toLocaleDateString('vi-VN')
    };

    const updated = [newSnippet, ...savedSnippets];
    saveSnippetsToStorage(updated);
    
    const toast = document.getElementById('scrapbook-toast');
    if (toast) {
      toast.classList.remove('opacity-0');
      toast.classList.add('opacity-100');
      setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
      }, 2500);
    }
  };

  const handleDeleteSnippet = (id: string) => {
    const updated = savedSnippets.filter(s => s.id !== id);
    saveSnippetsToStorage(updated);
    if (editingSnippetId === id) setEditingSnippetId(null);
  };

  const handleStartEdit = (snippet: SavedSnippet) => {
    setEditingSnippetId(snippet.id);
    setEditTitle(snippet.title);
    setEditCode(snippet.code);
  };

  const handleSaveEdit = () => {
    const updated = savedSnippets.map(s => {
      if (s.id === editingSnippetId) {
        return { ...s, title: editTitle, code: editCode };
      }
      return s;
    });
    saveSnippetsToStorage(updated);
    setEditingSnippetId(null);
  };

  const handleDownloadSnippet = (snippet: SavedSnippet) => {
    const blob = new Blob([snippet.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${snippet.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${snippet.language}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = (snippet: SavedSnippet) => {
    const lines = snippet.code.split('\n').map((line, idx) => ({
      'Số Dòng': idx + 1,
      'Nội dung mã lệnh bản thảo': line
    }));
    const worksheet = XLSX.utils.json_to_sheet(lines);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schema_Script');
    XLSX.writeFile(workbook, `${snippet.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xlsx`);
  };

  const handleExportPDF = (snippet: SavedSnippet) => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`LEDGERFLOW BLUEPRINT: ${snippet.title.toUpperCase()}`, 12, 14);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Ngay xuat: ${snippet.savedAt} - Nguon: LedgerFlow Studio Sandbox`, 12, 20);
    doc.line(10, 24, 200, 24);

    const docLines = doc.splitTextToSize(snippet.code, 180);
    let y = 30;
    for (const line of docLines) {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 12, y);
      y += 4.5;
    }
    doc.save(`${snippet.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`);
  };

  const preSets = [
    {
      title: 'Sinh schema SQLite',
      prompt: 'Hãy thiết kế lược đồ bảng database SQLITE của bảng "fixed_assets" (tài sản cố định) và "asset_depreciation_logs" (bảng khấu hao) cho phần mềm kế toán Việt Nam. Cột tiền dùng kiểu INTEGER làm tròn chuẩn, các cột ngày làm kiểu TEXT ISO8601, có chỉ rõ PRIMARY KEY và REFERENCES khóa ngoại chi tiết.'
    },
    {
      title: 'Viết Code Pandas',
      prompt: 'Viết một đoạn code Python sử dụng thư viện pandas để đọc file Excel "invoices.xlsx" chứa các hóa đơn đầu vào kế toán. Hãy làm sạch định dạng tiền tệ có dấu phẩy hoặc chữ "đ", lọc ra các hóa đơn có thuế suất VAT vướng mắc (không bằng 0, 5, 8, 10%), và nhóm lại tính tổng số tiền trước thuế.'
    },
    {
      title: 'Thuế TNCN Bậc thang',
      prompt: 'Viết một hàm Python tính toán thuế TNCN (Thu nhập cá nhân) lũy tiến từng phần theo quy định mới nhất của Việt Nam. Đầu vào là thu nhập chịu thuế sau khi đã giảm trừ gia cảnh.'
    }
  ];

  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'Màn hội thoại đã được đặt lại thành công! Tôi sẵn sàng tiếp nhận các nghiệp vụ phân tích dữ liệu và thiết kế schema kế toán mới của bạn.'
      }
    ]);
    setUploadedFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("⚠️ Quy định: Tốc độ upload tối đa là 10MB để giảm tải cho Sandbox.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      const rawBase64 = base64String.split(',')[1];
      setUploadedFile({
        name: file.name,
        mimeType: file.type || (file.name.endsWith('.csv') ? 'text/csv' : 'application/pdf'),
        data: rawBase64
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() && !uploadedFile) return;

    let finalPrompt = textToSend;
    if (uploadedFile && !textToSend.trim()) {
      finalPrompt = `Tôi vừa tải tệp tin sao kê "${uploadedFile.name}". Hãy phân tích mẫu sao kê tài chính này chuẩn xác theo chế độ kế toán ban hành và generate đoạn code Python Pandas làm sạch đối soát tương ứng.`;
    }

    const newUserMessage: Message = { role: 'user', text: finalPrompt };
    const currentHistory = [...messages];

    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setLoading(true);

    const controller = new AbortController();
    setAbortController(controller);
    setIsStreaming(true);

    setMessages(prev => [...prev, { role: 'assistant', text: 'Gemini đang chuẩn bị dữ liệu...' }]);

    try {
      const payload = {
        prompt: finalPrompt,
        history: currentHistory,
        systemInstruction: 'Bạn là một chuyên gia lập trình kế toán tin cậy và nhà khoa học dữ liệu người Việt Nam. Câu trả lời của bạn luôn bám sát nghiệp vụ thực tế, luôn khuyên dùng kiểu dữ liệu chuẩn (INTEGER cho tiền tệ VND để tránh sai hạch toán), giải giải thích súc tích, chuyên sâu và trả về các đoạn code sạch dạng markdown ```sql, ```python, ```js, có kèm bình luận tiếng Việt.',
        file: uploadedFile ? { mimeType: uploadedFile.mimeType, data: uploadedFile.data } : undefined,
        model: selectedModel
      };

      setUploadedFile(null); // Clear file slot

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.isRateLimit) {
          throw new Error("RATE_LIMIT: " + (errorData.error || "Bạn đã đạt giới hạn 15 yêu cầu/phút."));
        } else if (errorData.isMissingKey || String(errorData.error || '').toLowerCase().includes('key')) {
          throw new Error("MISSING_KEY");
        } else {
          throw new Error(errorData.error || "Lỗi xử lý luồng (SSE Stream).");
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error("Luồng ReadableStream không hỗ trợ.");

      let accumText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decodedText = decoder.decode(value, { stream: true });
        const lines = decodedText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonText = line.substring(6).trim();
            if (jsonText === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonText);
              const chunkText = parsed.text || parsed.content;
              if (chunkText) {
                accumText += chunkText;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = { role: 'assistant', text: accumText };
                  }
                  return updated;
                });
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (err) {
              // Ignore partial packets
            }
          }
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.name === 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].text === 'Gemini đang chuẩn bị dữ liệu...') {
            return updated.slice(0, -1);
          }
          return updated;
        });
      } else if (err.message === "MISSING_KEY") {
        const simTxt = getSimulationText(finalPrompt);
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { role: 'assistant', text: simTxt };
          }
          return [
            ...updated.slice(0, -1),
            { 
              role: 'error', 
              text: `⚠️ [Thông báo từ hệ thống]: Bạn chưa cấu hình AI Gateway/Secrets. Để lấy kết quả thật, hãy thiết lập khóa trong AI Vault. Dưới đây là kết quả mô phỏng từ Sandbox:` 
            },
            { role: 'assistant', text: simTxt }
          ];
        });
      } else {
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: 'error',
              text: `❌ Kết nối bị gián đoạn: ${err.message || "Lỗi giao tiếp daemon."}`
            };
          }
          return updated;
        });
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const getSimulationText = (prompt: string): string => {
    const p = prompt.toLowerCase();
    if (p.includes('schema') || p.includes('sqlite') || p.includes('assets')) {
      return `Dưới đây là thiết kế lược đồ SQLite tối giản cho nghiệp vụ tài sản cố định:
\`\`\`sql
CREATE TABLE fixed_assets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code      TEXT UNIQUE NOT NULL,       -- Mã TSCĐ
  asset_name      TEXT NOT NULL,              -- Tên xe, máy móc
  purchase_date   TEXT NOT NULL,              -- Ngày mua (YYYY-MM-DD)
  original_cost   INTEGER NOT NULL,           -- Nguyên giá (VNĐ)
  useful_life     INTEGER NOT NULL,           -- Số tháng khấu hao
  status          TEXT DEFAULT 'active'       -- active / liquidated
);

CREATE TABLE asset_depreciation_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id        INTEGER REFERENCES fixed_assets(id),
  dep_period      TEXT NOT NULL,              -- Kỳ trích YYYY-MM
  monthly_amount  INTEGER NOT NULL,           -- Mức trích tháng (VNĐ)
  book_value      INTEGER NOT NULL            -- Giá trị còn lại ròng
);
\`\`\`
- Sử dụng INTEGER thay vì float tránh sai lệch tiền lẻ của VAS.`;
    }
    return `Đoạn mã Python làm sạch đối soát sao kê:
\`\`\`python
import pandas as pd
df = pd.read_excel('invoices.xlsx')
# Chuẩn hóa tiền VND
df['so_tien_sach'] = df['so_tien'].replace(r'[^\d]', '', regex=True).astype(int)
print(df.groupby('danh_muc')['so_tien_sach'].sum())
\`\`\``;
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Render markdown parser with integrated scrapbook buttons
  const renderMessageContent = (msgText: string) => {
    const parts = msgText.split(/(```[a-zA-Z]*\n[\s\S]*?\n```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```([a-zA-Z0-9-]*)\n([\s\S]*?)\n?```/);
        const lang = match ? match[1] : 'code';
        const code = match ? match[2] : part.slice(3, -3);
        const codeBlockId = `block_${index}`;

        return (
          <div key={index} className="my-3.5 rounded-2xl border border-border-primary bg-slate-950 overflow-hidden font-mono text-[11px] select-text">
            <div className="flex justify-between items-center px-4 py-2.5 bg-bg-primary border-b border-slate-850">
              <span className="text-[10px] uppercase font-black text-text-secondary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-violet-500 animate-pulse"></span>
                Ngôn ngữ: {lang}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveToScrapbook(`Code trích từ AI (${lang})`, code, lang)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-border-primary text-purple-400 hover:text-purple-300 rounded-xl text-[10px] transition-all font-sans font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu Sổ Tay
                </button>
                <button
                  onClick={() => copyText(code, codeBlockId)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-border-primary text-text-secondary hover:text-text-primary rounded-xl text-[10px] transition-all font-sans cursor-pointer"
                >
                  {copiedId === codeBlockId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold font-mono">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-medium max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {code}
            </pre>
          </div>
        );
      } else {
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-2 text-text-secondary leading-relaxed text-xs">
            {lines.map((line, lIdx) => {
              if (line.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-xs font-black text-text-primary mt-4 border-b border-slate-900 pb-1 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded bg-purple-500"></span>
                    {line.replace('### ', '')}
                  </h4>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-sm font-black text-purple-400 mt-5 border-l-2 border-purple-500 pl-2">
                    {line.replace('## ', '')}
                  </h3>
                );
              }
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-3.5 select-text py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow shadow-purple-500/50"></span>
                    <span className="font-semibold text-text-secondary">{line.substring(2)}</span>
                  </div>
                );
              }
              return line.trim() === '' ? <div key={lIdx} className="h-1.5"></div> : <p key={lIdx} className="select-text font-medium text-text-secondary">{line}</p>;
            })}
          </div>
        );
      }
    });
  };

  // Agent ops execution controls
  const staffCards = readStaffCards();

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setTerminalLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const startExecution = (card: WorkCard) => {
    setExecutingCard(card);
    setExecRole(card.role || card.aiStaff || '');
    setExecInputFile(card.input || 'src/App.tsx');
    setExecPrompt(card.task || card.title || '');
    setExecAutoRepair(false);
    setAiOutput(null);
    setApplyResult(null);
    setStatusMsg('');
    setTerminalLogs([]);
    setExecutionMode('single');
    setCurrentRun(null);
    setApprovalPhraseInput('');
    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString('vi-VN');
      setTerminalLogs([
        `[${timestamp}] READY: Đã thiết lập phòng thực thi cho nhân sự AI [${card.role || card.aiStaff || 'AI Dev'}].`,
        `[${timestamp}] CONFIG: Tệp đích sửa đổi: ${card.input || 'src/App.tsx'}.`,
        `[${timestamp}] SYSTEM: Đợi Founder nhấn nút 'Bắt đầu Thực Thi' để truyền prompt...`
      ]);
    }, 100);
  };

  // --- Multi-Step Agent Runtime Handlers ---
  const startAgentRuntimeRun = async () => {
    if (!executingCard || !execPrompt.trim()) return;
    setRunningAI(true);
    setStatusMsg('');
    setCurrentRun(null);
    addLog(`INITIALIZING AGENT RUNTIME: Đang khởi tạo phiên chạy Agent đa bước trên server...`);

    const daemonRoleMap: Record<string, string> = {
      'AI Chief of Staff': 'Chief of Staff',
      'AI Dev': 'AI Dev',
      'AI Designer': 'AI Designer',
      'AI Marketer': 'AI Marketer',
      'AI Accountant': 'AI Accountant',
      'AI Auditor': 'AI Auditor',
      'AI Data Analyst': 'AI Analyst',
      'AI QA': 'AI QA'
    };

    const daemonRole = daemonRoleMap[execRole] || execRole;

    try {
      const goal = `${execPrompt.trim()} (Tệp chỉnh sửa: ${execInputFile})`;
      addLog(`CREATING RUN: Gửi mục tiêu chạy đến server cho vai trò: ${daemonRole}...`);
      
      const newRun = await createAgentRun(goal, {
        maxSteps: 6,
        plannerMode: 'auto'
      });

      setCurrentRun(newRun);
      addLog(`RUN CREATED: Mã tiến trình: ${newRun.id}. Tình trạng: ${newRun.status}.`);
      addLog(`PLAN: ${newRun.plannerSummary}`);

      addLog(`STEP 1: Bắt đầu tiến hành bước lập kế hoạch đầu tiên...`);
      const advanced = await advanceAgentRun(newRun.id);
      setCurrentRun(advanced);
      addLog(`RUN STATUS: Tiến trình chuyển sang: ${advanced.status}.`);
    } catch (err: any) {
      const errMsg = `❌ Lỗi khởi chạy Runtime: ${err.message}`;
      setStatusMsg(errMsg);
      addLog(`ERROR: Khởi chạy Runtime thất bại: ${err.message}`);
    } finally {
      setRunningAI(false);
    }
  };

  const handleAdvanceAgentStep = async () => {
    if (!currentRun) return;
    setAdvancingRun(true);
    setStatusMsg('');
    addLog(`ADVANCING: Phát lệnh thực thi bước tiếp theo cho run [${currentRun.id}]...`);
    try {
      const nextState = await advanceAgentRun(currentRun.id);
      setCurrentRun(nextState);
      addLog(`RUN UPDATED: Tình trạng: ${nextState.status}.`);
      
      if (nextState.status === 'completed') {
        setStatusMsg(`✅ Tiến trình hoàn thành xuất sắc! Đã ghi nhận các kết quả tri thức.`);
        const allCards = readLocal<WorkCard[]>(CARD_KEY, []);
        const updatedCards = allCards.map((c) => {
          if (executingCard && c.id === executingCard.id) {
            return {
              ...c,
              status: 'Done' as const,
              founderReview: 'Approved',
              approval: `Approved through Agent Runtime Run: ${nextState.id}`
            };
          }
          return c;
        });
        writeCards(updatedCards);
      }
    } catch (err: any) {
      setStatusMsg(`❌ Lỗi chạy bước: ${err.message}`);
      addLog(`ERROR: Chạy bước thất bại: ${err.message}`);
    } finally {
      setAdvancingRun(false);
    }
  };

  const handleApproveAgentStep = async (stepId: string, fingerprint: string) => {
    if (!currentRun || !approvalPhraseInput.trim()) return;
    if (approvalPhraseInput !== 'APPROVE AGENT STEP') {
      alert('Nhập không đúng cụm từ: APPROVE AGENT STEP');
      return;
    }
    setApprovingStep(true);
    setStatusMsg('');
    addLog(`APPROVING STEP: Gửi chữ ký phê duyệt Maker-Checker cho bước [${stepId}]...`);
    try {
      const nextState = await approveAgentRunStep(currentRun.id, stepId, fingerprint, approvalPhraseInput);
      setCurrentRun(nextState);
      setApprovalPhraseInput('');
      addLog(`STEP APPROVED: Phê duyệt thành công. Tình trạng run: ${nextState.status}.`);
      
      if (nextState.status === 'completed') {
        setStatusMsg(`✅ Tiến trình hoàn thành xuất sắc sau phê duyệt.`);
        const allCards = readLocal<WorkCard[]>(CARD_KEY, []);
        const updatedCards = allCards.map((c) => {
          if (executingCard && c.id === executingCard.id) {
            return {
              ...c,
              status: 'Done' as const,
              founderReview: 'Approved',
              approval: `Approved & completed with runtime run: ${nextState.id}`
            };
          }
          return c;
        });
        writeCards(updatedCards);
      }
    } catch (err: any) {
      setStatusMsg(`❌ Lỗi phê duyệt bước: ${err.message}`);
      addLog(`ERROR: Phê duyệt bước thất bại: ${err.message}`);
    } finally {
      setApprovingStep(false);
    }
  };

  const handleStopAgentRun = async () => {
    if (!currentRun) return;
    setStoppingRun(true);
    addLog(`STOPPING RUN: Gửi yêu cầu dừng tiến trình ${currentRun.id}...`);
    try {
      const nextState = await stopAgentRun(currentRun.id, 'Founder manually stopped this run in workspace.');
      setCurrentRun(nextState);
      addLog(`RUN STOPPED: Đã dừng tiến trình. Tình trạng: ${nextState.status}.`);
    } catch (err: any) {
      setStatusMsg(`❌ Không dừng được run: ${err.message}`);
    } finally {
      setStoppingRun(false);
    }
  };

  const handleEmergencyStop = async () => {
    setEstopLoading(true);
    addLog(`EMERGENCY STOP: ĐANG KÍCH HOẠT NÚT DỪNG KHẨN CẤP TOÀN HỆ THỐNG...`);
    try {
      await setAgentRuntimeEmergencyStop(true, 'Founder emergency stop in people workspace.');
      addLog(`EMERGENCY STOP ACTIVE: Toàn bộ tiến trình chạy ngầm đã bị dừng khẩn cấp.`);
      if (currentRun) {
        const nextState = await advanceAgentRun(currentRun.id).catch(() => null);
        if (nextState) setCurrentRun(nextState);
      }
    } catch (err: any) {
      setStatusMsg(`❌ Lỗi dừng khẩn cấp: ${err.message}`);
    } finally {
      setEstopLoading(false);
    }
  };

  const runAIStaffTask = async () => {
    if (!executingCard || !execPrompt.trim()) return;
    setRunningAI(true);
    setAiOutput(null);
    setApplyResult(null);
    setStatusMsg('');
    
    addLog(`INITIALIZED: Bắt đầu giao việc cho ${execRole}...`);
    addLog(`PARSING CONTEXT: Đang phân tích mã nguồn tệp tin [${execInputFile}]...`);

    const daemonRoleMap: Record<string, string> = {
      'AI Chief of Staff': 'Chief of Staff',
      'AI Dev': 'AI Dev',
      'AI Designer': 'AI Designer',
      'AI Marketer': 'AI Marketer',
      'AI Accountant': 'AI Accountant',
      'AI Auditor': 'AI Auditor',
      'AI Data Analyst': 'AI Analyst',
      'AI QA': 'AI QA'
    };

    const daemonRole = daemonRoleMap[execRole] || execRole;
    
    try {
      const filesArray = execInputFile.split(',').map(f => f.trim()).filter(Boolean);
      addLog(`DAEMON CALL: Gửi yêu cầu RAG tự động sửa đổi đến daemon local...`);
      
      const result = await editFile(
        filesArray.length > 0 ? filesArray : ['src/App.tsx'],
        execPrompt.trim(),
        undefined,
        daemonRole || undefined
      );

      setAiOutput(result);
      if (result.ok) {
        addLog(`COMPLETED: AI đã lập phương án xử lý thành công! Nhận về ${result.codeBlocks.length} khối mã đề xuất.`);
        if (result.explanation) {
          addLog(`EXPLANATION RECEIVED: Báo cáo giải pháp sẵn sàng.`);
        }
      } else {
        setStatusMsg('❌ AI Staff phản hồi lỗi hoặc không tạo được đề xuất.');
        addLog(`ERROR: AI phản hồi lỗi logic.`);
      }
    } catch (err: any) {
      const errMsg = `❌ Lỗi kết nối AI: ${err.message}`;
      setStatusMsg(errMsg);
      addLog(`FATAL ERROR: Không kết nối được với Daemon AI. Hãy chắc chắn daemon đang chạy.`);
    } finally {
      setRunningAI(false);
    }
  };

  const approveAIStaffTask = async () => {
    if (!executingCard || !aiOutput) return;
    setApplyingAI(true);
    setStatusMsg('');
    const filesArray = execInputFile.split(',').map(f => f.trim()).filter(Boolean);
    addLog(`APPROVING: Founder phê duyệt thay đổi. Đang áp dụng patch lên ổ đĩa...`);
    
    try {
      const applyResult = await applyEdit(
        filesArray.length > 0 ? filesArray : ['src/App.tsx'],
        'auto',
        execAutoRepair,
        execPrompt
      );
      
      addLog(`WRITE SUCCESS: Đã ghi đè mã nguồn thành công!`);
      if (applyResult.repairStatus) {
        addLog(`TSC COMPILER INTEGRITY: Compiler check loops: ${applyResult.repairStatus.loops}. Status ok: ${applyResult.repairStatus.ok}`);
      }

      setStatusMsg(`✅ Phê duyệt thành công! ${applyResult.message}`);
      appendAgentOpsAudit('Approve AI Task', executingCard.id, `Approved & Applied changes by ${execRole}. Files: ${filesArray.join(', ')}`);
      
      // Update Card Status to Done
      const allCards = readLocal<WorkCard[]>(CARD_KEY, []);
      const updatedCards = allCards.map((c) => {
        if (executingCard && c.id === executingCard.id) {
          return {
            ...c,
            status: 'Done' as const,
            founderReview: 'Approved',
            approval: 'Approved & Applied by Founder.'
          };
        }
        return c;
      });
      writeCards(updatedCards);
      
      setTimeout(() => {
        setExecutingCard(null);
      }, 2500);
    } catch (err: any) {
      setStatusMsg(`❌ Lỗi apply: ${err.message}`);
      addLog(`APPLY ERROR: Ghi đè tệp tin thất bại hoặc lỗi Auto-Repair: ${err.message}`);
    } finally {
      setApplyingAI(false);
    }
  };

  const rejectAIStaffTask = () => {
    if (!executingCard) return;
    setStatusMsg('❌ Đã từ chối và hủy bỏ đề xuất.');
    addLog(`REJECTED: Từ chối đề xuất của nhân viên AI. Resetting workspace...`);
    appendAgentOpsAudit('Reject AI Task', executingCard.id, `Rejected proposal by ${execRole}.`);
    
    const allCards = readLocal<WorkCard[]>(CARD_KEY, []);
    const updatedCards = allCards.map((c) => {
      if (executingCard && c.id === executingCard.id) {
        return {
          ...c,
          founderReview: 'Rejected',
          approval: 'Rejected by Founder.'
        };
      }
      return c;
    });
    writeCards(updatedCards);
    
    setTimeout(() => {
      setExecutingCard(null);
    }, 1800);
  };

  const assignRole = (roleName: string) => {
    const role = roleDirectory.find((item) => item.name === roleName);
    if (!role) return;
    setDraft({
      aiStaff: role.name,
      role: role.name,
      task: `${role.name}: Giao việc xử lý tính năng...`,
      acceptanceCriteria: `Quyền: ${role.permission}. Connector: ${role.connectors.join(', ')}. Sản phẩm bắt buộc: ${role.output}.`,
    });
    setShowAddForm(true);
  };

  const addAssignment = () => {
    if (!draft.aiStaff.trim() || !draft.task.trim()) return;
    const cards = readLocal<WorkCard[]>(CARD_KEY, []);
    const card: WorkCard = {
      id: `staff-${Date.now()}`,
      title: draft.task.trim(),
      kind: 'Ops',
      owner: draft.role.trim() || draft.aiStaff.trim(),
      status: 'Inbox',
      risk: draft.acceptanceCriteria.includes('HIGH') ? 'HIGH' : 'MEDIUM',
      request: draft.task.trim(),
      plan: [draft.acceptanceCriteria.trim() || 'Founder review required'],
      tools: ['AI Staff Assignment', 'Approval Gate', 'Workboard'],
      approval: 'Founder review required before marking done.',
      aiStaff: draft.aiStaff.trim(),
      role: draft.role.trim() || draft.aiStaff.trim(),
      task: draft.task.trim(),
      acceptanceCriteria: draft.acceptanceCriteria.trim(),
      founderReview: 'Pending'
    };
    writeCards([card, ...cards]);
    setDraft({ aiStaff: '', role: '', task: '', acceptanceCriteria: '' });
    setShowAddForm(false);
  };

  return (
    <div 
      className="grid lg:grid-cols-4 gap-6 select-none text-slate-100" 
      onDragOver={handleDragOver} 
      onDragLeave={handleDragLeave} 
      onDrop={handleDrop}
    >
      {/* ── LEFT SIDEBAR (Width 25-30%) ── */}
      <div className="lg:col-span-1 space-y-4">
        {/* Module Title & Daemon Status Check */}
        <div className="bg-bg-primary/60 p-4.5 rounded-2xl border border-border-primary space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">AI Staff Control Hub</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${daemonStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
              <span className="text-[9px] font-bold text-text-secondary">{daemonStatus.online ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <h3 className="text-base font-black text-text-primary">AI Operations Workspace</h3>
          <p className="text-[10px] font-semibold leading-relaxed text-text-secondary">{daemonStatus.message}</p>
        </div>

        {/* AI Workforce Directory list with pulse online status indicators */}
        <div className="bg-bg-primary/60 p-4.5 rounded-2xl border border-border-primary space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider">Đội Ngũ Nhân Sự AI ({roleDirectory.length})</span>
            <Bot className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850">
            {roleDirectory.map((role) => (
              <article 
                key={role.name} 
                className="group rounded-xl border border-slate-850 bg-slate-950/70 p-2.5 transition-all hover:border-purple-500/20 hover:bg-bg-primary/30"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-lg bg-purple-900/20 border border-purple-500/20 flex items-center justify-center font-bold text-xs text-purple-400">
                        {role.name.split(' ').pop()?.slice(0,2)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-950 animate-pulse"></span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-text-primary leading-normal group-hover:text-purple-300 transition-colors">{role.name}</p>
                      <p className="text-[9px] text-text-tertiary font-bold leading-none">{role.permission} · {role.connectors[0]}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => assignRole(role.name)}
                    className="p-1 rounded bg-bg-primary hover:bg-purple-600 border border-border-primary text-[10px] text-text-secondary hover:text-text-primary font-bold transition-all shrink-0 cursor-pointer"
                    title="Giao việc mới"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* SOP Task Templates */}
        <div className="bg-bg-primary/60 p-4.5 rounded-2xl border border-border-primary space-y-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider">Mẫu Nhiệm Vụ SOP AI Staff</span>
            <Sparkles className="w-4 h-4 text-purple-400 font-bold" />
          </div>
          <div className="grid gap-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850">
            {AI_AGENT_TASK_TEMPLATES.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDraft({
                    aiStaff: item.agent,
                    role: item.agent,
                    task: item.task,
                    acceptanceCriteria: `Mô tả: ${item.prompt}\nTiêu chí duyệt: ${item.acceptance.join(', ')}`
                  });
                  setShowAddForm(true);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-purple-850 text-[11px] font-bold text-slate-350 hover:text-text-primary transition-all flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <span>
                  <strong className="text-purple-400">{item.agent}:</strong> {item.task}
                </span>
                <Plus className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Assignment Form */}
        {showAddForm ? (
          <div className="bg-bg-primary/60 p-4.5 rounded-2xl border border-purple-500/30 space-y-3.5 relative animate-fade-in">
            <button 
              onClick={() => setShowAddForm(false)} 
              className="absolute top-3 right-3 text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-purple-400 font-black uppercase tracking-wider block">Giao Việc Cho AI Staff</span>
            <div className="space-y-2">
              <input 
                className="w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs text-text-primary placeholder-slate-600 focus:outline-none" 
                placeholder="Nhân sự AI" 
                value={draft.aiStaff} 
                onChange={(e) => setDraft({ ...draft, aiStaff: e.target.value })} 
              />
              <input 
                className="w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs text-text-primary placeholder-slate-600 focus:outline-none" 
                placeholder="Vai trò" 
                value={draft.role} 
                onChange={(e) => setDraft({ ...draft, role: e.target.value })} 
              />
              <input 
                className="w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs text-text-primary placeholder-slate-600 focus:outline-none" 
                placeholder="Nhiệm vụ (Tóm tắt)" 
                value={draft.task} 
                onChange={(e) => setDraft({ ...draft, task: e.target.value })} 
              />
              <textarea 
                className="w-full min-h-[60px] rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs text-text-primary placeholder-slate-600 focus:outline-none resize-none" 
                placeholder="Quy định chất lượng / Output mong đợi..." 
                value={draft.acceptanceCriteria} 
                onChange={(e) => setDraft({ ...draft, acceptanceCriteria: e.target.value })} 
              />
            </div>
            <button 
              onClick={addAssignment} 
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-2 text-xs font-black text-text-primary transition-all cursor-pointer shadow-lg shadow-purple-600/10"
            >
              Kích Hoạt Assignment
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-border-primary bg-slate-950/40 hover:bg-bg-primary/30 p-3 rounded-2xl text-xs font-black text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-purple-400" />
            Tạo Assignment nhiệm vụ mới
          </button>
        )}

        {/* Active Task Queue */}
        <div className="bg-bg-primary/60 p-4.5 rounded-2xl border border-border-primary space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider">Nhiệm Vụ AI Đang Chạy ({staffCards.length})</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850">
            {staffCards.map((card) => (
              <article 
                key={card.id} 
                onClick={() => startExecution(card)}
                className={`rounded-xl border p-3 flex flex-col justify-between cursor-pointer transition-all ${
                  executingCard?.id === card.id 
                    ? 'border-purple-500 bg-purple-600/5' 
                    : 'border-slate-850 bg-slate-950/70 hover:border-border-primary'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="text-xs font-black text-text-primary line-clamp-2">{card.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-tight shrink-0 border ${
                      card.status === 'Done'
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/20'
                        : card.status === 'Waiting Approval'
                          ? 'bg-amber-950/30 text-amber-400 border-amber-800/20'
                          : 'bg-bg-primary text-text-secondary border-border-primary'
                    }`}>
                      {card.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[9px] font-bold text-text-tertiary">
                    Phân vai: <strong className="text-text-secondary">{card.aiStaff ?? card.owner}</strong>
                  </p>
                </div>
              </article>
            ))}
            {staffCards.length === 0 && (
              <p className="text-center py-6 text-[10px] text-slate-600 font-bold">Chưa có nhiệm vụ nào.</p>
            )}
          </div>
        </div>

        {/* Code Scrapbook (Sổ tay Code) listing with Excel/PDF export & raw download actions */}
        <div className="bg-bg-primary/60 rounded-2xl border border-border-primary overflow-hidden">
          <button 
            onClick={() => setShowScrapbook(!showScrapbook)}
            className="w-full flex items-center justify-between px-4.5 py-3.5 bg-slate-950/20 hover:bg-slate-950/40 text-[10px] text-text-secondary hover:text-text-primary font-black uppercase tracking-wider cursor-pointer transition-colors border-b border-slate-850"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Sổ tay Code ({savedSnippets.length})
            </span>
            {showScrapbook ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showScrapbook && (
            <div className="p-3.5 space-y-3 max-h-[300px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-850">
              {savedSnippets.length === 0 ? (
                <p className="text-center py-6 text-[10px] text-slate-600 font-bold">Không có bản thảo nào. Nhấn "Lưu Sổ Tay" trong hội thoại để lưu.</p>
              ) : (
                savedSnippets.map((snippet) => (
                  <div key={snippet.id} className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl space-y-2">
                    {editingSnippetId === snippet.id ? (
                      <div className="space-y-2 animate-fade-in">
                        <input 
                          type="text" 
                          value={editTitle} 
                          onChange={e => setEditTitle(e.target.value)} 
                          className="w-full bg-bg-primary border border-slate-850 text-[11px] px-2 py-1 text-text-primary rounded font-bold outline-none" 
                        />
                        <textarea 
                          rows={4} 
                          value={editCode} 
                          onChange={e => setEditCode(e.target.value)} 
                          className="w-full bg-bg-primary border border-slate-850 text-[10px] font-mono p-2 text-slate-350 rounded font-semibold outline-none resize-none" 
                        />
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setEditingSnippetId(null)} className="text-[9px] px-2 py-0.5 bg-bg-surface text-text-secondary rounded cursor-pointer">Hủy</button>
                          <button onClick={handleSaveEdit} className="text-[9px] px-2 py-0.5 bg-purple-650 text-text-primary rounded font-bold cursor-pointer">Lưu</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-mono bg-purple-950/20 text-purple-400 border border-purple-900/30 px-2 py-0.5 rounded font-black">{snippet.language}</span>
                          <span className="text-[9px] text-slate-600 font-bold">{snippet.savedAt}</span>
                        </div>
                        <h4 className="text-[11px] font-black text-text-secondary mt-2.5 truncate">{snippet.title}</h4>
                        
                        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-900 justify-end">
                          <button onClick={() => handleStartEdit(snippet)} className="p-1 bg-bg-primary hover:bg-slate-850 border border-slate-850 rounded-lg text-text-secondary hover:text-text-primary transition-all text-[9px] font-bold cursor-pointer flex items-center gap-0.5"><Edit2 className="w-2.5 h-2.5 text-purple-400" /> Sửa</button>
                          <button onClick={() => handleDownloadSnippet(snippet)} className="p-1 bg-bg-primary hover:bg-slate-850 border border-slate-850 rounded-lg text-text-secondary hover:text-text-primary transition-all text-[9px] font-bold cursor-pointer" title="File thô"><FileDown className="w-3 h-3 text-sky-400" /></button>
                          <button onClick={() => handleExportExcel(snippet)} className="p-1 bg-bg-primary hover:bg-slate-850 border border-slate-850 rounded-lg text-text-secondary hover:text-text-primary transition-all text-[9px] font-bold cursor-pointer" title="Báo cáo Excel"><FileSpreadsheet className="w-3 h-3 text-emerald-400" /></button>
                          <button onClick={() => handleExportPDF(snippet)} className="p-1 bg-bg-primary hover:bg-slate-850 border border-slate-850 rounded-lg text-text-secondary hover:text-text-primary transition-all text-[9px] font-bold cursor-pointer" title="Xuất PDF"><FileText className="w-3 h-3 text-rose-500" /></button>
                          <button onClick={() => handleDeleteSnippet(snippet.id)} className="p-1 text-slate-600 hover:text-rose-550 cursor-pointer" title="Xóa"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT MAIN PANEL (Split-Pane Architecture) ── */}
      <div className="lg:col-span-3 grid lg:grid-cols-12 gap-4 h-[calc(100vh-6rem)]">
        {/* PANEL 1: Workspace Execution (Trái - 5/12) */}
        <div className="lg:col-span-5 space-y-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850 h-full relative">
        {/* DRAG AND DROP OVERLAY FEEDBACK */}
        {isDragging && (
          <div className="absolute inset-0 bg-purple-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center border-2 border-dashed border-purple-500 rounded-xl animate-fade-in">
            <Upload className="w-14 h-14 text-purple-400 animate-bounce mb-3" />
            <p className="text-sm font-black text-text-primary">Thả tệp sao kê ngân hàng CSV/PDF vào đây!</p>
            <p className="text-xs text-purple-300 mt-1">Dữ liệu sẽ được nạp tức thì vào bộ kiểm soát phân tích đa phương tiện.</p>
          </div>
        )}

        {/* State A: Tasks execution interface active */}
        {executingCard ? (
          <div className="bg-bg-primary/60 border border-border-primary rounded-2xl p-6 shadow-2xl relative transition-all duration-300 space-y-5">
            <button 
              onClick={() => setExecutingCard(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-slate-200 hover:bg-bg-surface transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-650/20 border border-purple-500/30 flex items-center justify-center">
                <Terminal className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-text-primary flex items-center gap-2 font-sans">
                  Trình Thực Thi Nhiệm Vụ AI Staff
                  <span className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 text-[9px] font-black uppercase tracking-wider border border-purple-500/25">
                    {executionMode === 'single' ? 'Single Gate' : 'Multi Runtime'}
                  </span>
                </h4>
                <p className="text-[10px] text-text-tertiary font-bold font-sans">Nhiệm vụ: {executingCard.title}</p>
              </div>
            </div>

            {/* Execution Mode Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => {
                  setExecutionMode('single');
                  setAiOutput(null);
                  setCurrentRun(null);
                  setStatusMsg('');
                  setTerminalLogs([
                    `[${new Date().toLocaleTimeString('vi-VN')}] SWITCH: Chuyển sang chế độ Chỉnh sửa nhanh (Single-Step).`
                  ]);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  executionMode === 'single'
                    ? 'bg-purple-600 text-text-primary shadow-md'
                    : 'text-text-secondary hover:text-slate-200'
                }`}
              >
                Mô phỏng Edit (Single-Step)
              </button>
              <button
                type="button"
                onClick={() => {
                  setExecutionMode('multistep');
                  setAiOutput(null);
                  setCurrentRun(null);
                  setStatusMsg('');
                  setTerminalLogs([
                    `[${new Date().toLocaleTimeString('vi-VN')}] SWITCH: Chuyển sang chế độ chạy Đa Bước (Agent Runtime).`
                  ]);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  executionMode === 'multistep'
                    ? 'bg-purple-600 text-text-primary shadow-md'
                    : 'text-text-secondary hover:text-slate-200'
                }`}
              >
                Chạy Đa Bước (Agent Runtime)
              </button>
            </div>

            {/* Config Fields Form */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1.5 font-sans">Nhân sự AI phụ trách</label>
                <select
                  value={execRole}
                  onChange={e => setExecRole(e.target.value)}
                  className="w-full bg-slate-950 border border-border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-secondary font-bold outline-none focus:border-purple-500 cursor-pointer"
                >
                  {roleDirectory.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1.5 font-sans">Tệp mã nguồn chỉnh sửa (Input File)</label>
                <input
                  value={execInputFile}
                  onChange={e => setExecInputFile(e.target.value)}
                  placeholder="Ví dụ: src/App.tsx, src/main.tsx"
                  className="w-full bg-slate-950 border border-border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-secondary font-mono outline-none focus:border-purple-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1.5 font-sans font-bold">Yêu cầu cụ thể của Founder (Prompt)</label>
                <textarea
                  value={execPrompt}
                  onChange={e => setExecPrompt(e.target.value)}
                  rows={3}
                  placeholder="Nhập yêu cầu cụ thể để AI Staff thực thi..."
                  className="w-full bg-slate-950 border border-border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-secondary outline-none focus:border-purple-500 resize-none font-semibold leading-relaxed"
                />
              </div>

              {executionMode === 'single' && (
                <div className="md:col-span-2 flex items-center justify-between bg-slate-950/40 border border-slate-850 rounded-xl p-3.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-350">Tự động sửa lỗi biên dịch (Auto-Repair Compiler Check)</span>
                    <span className="text-[10px] text-slate-550 mt-0.5 font-sans">Tự động chạy `tsc` kiểm soát lỗi để sửa mã nếu biên dịch thất bại.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={execAutoRepair}
                      onChange={e => setExecAutoRepair(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-650 peer-checked:after:bg-white"></div>
                  </label>
                </div>
              )}
            </div>

            {/* Interactive Console logs */}
            <div className="bg-slate-950 rounded-2xl border border-slate-850 p-4 space-y-2.5 font-mono text-[10px] select-text">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Output Console Logs
                </span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-bg-primary text-purple-400 font-black">DAEMON: ACTIVE</span>
              </div>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-900 text-text-secondary leading-relaxed font-medium">
                {terminalLogs.length === 0 ? (
                  <p className="text-slate-600 italic font-sans">Bấm 'Thực thi' để chạy AI Agent và ghi nhận luồng logs...</p>
                ) : (
                  terminalLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('ERROR') ? 'text-rose-450 font-bold' : log.includes('COMPLETED') || log.includes('SUCCESS') || log.includes('RUN STATUS: completed') ? 'text-emerald-450 font-bold' : log.includes('waiting_approval') ? 'text-amber-400 font-bold animate-pulse' : 'text-text-secondary'}>
                      {log}
                    </div>
                  ))
                )}
                {runningAI && (
                  <div className="flex items-center gap-2 text-purple-400 animate-pulse font-bold mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
                    <span>Đang xử lý gói token...</span>
                  </div>
                )}
              </div>
            </div>

            {/* MODE 1: SINGLE-STEP ACTIONS */}
            {executionMode === 'single' && (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={runAIStaffTask}
                    disabled={runningAI || !execPrompt.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-text-primary text-xs font-black rounded-xl transition-all shadow-lg shadow-purple-600/10 cursor-pointer"
                  >
                    {runningAI ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-text-primary" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {runningAI ? 'AI Staff đang viết bản vá mã nguồn...' : 'Thực thi ngay'}
                  </button>
                  <button
                    onClick={() => setExecutingCard(null)}
                    className="px-5 py-3 bg-bg-surface hover:bg-bg-surface-hover text-text-secondary text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>

                {/* Suggested changes code blocks */}
                {aiOutput && (
                  <div className="mt-5 border-t border-slate-850 pt-5 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-450 font-sans">
                      <CheckCircle2 className="h-4.5 w-4.5" /> Hoàn tất kế hoạch phân tích. Bản vá đề xuất bên dưới:
                    </div>
                    
                    {aiOutput.explanation && (
                      <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-350 leading-relaxed font-sans font-semibold">
                        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-text-secondary" /> Báo cáo / Giải thích thiết lập của AI
                        </div>
                        <div className="whitespace-pre-line leading-relaxed text-text-secondary">{aiOutput.explanation}</div>
                      </div>
                    )}

                    {aiOutput.codeBlocks && aiOutput.codeBlocks.length > 0 && (
                      <div className="space-y-3.5">
                        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest font-sans">Danh sách tệp tin thay đổi đề xuất</div>
                        {aiOutput.codeBlocks.map((block, idx) => (
                          <div key={idx} className="relative rounded-2xl border border-slate-850 bg-slate-950 overflow-hidden font-mono text-[11px] select-text">
                            <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-850 bg-bg-primary">
                              <span className="text-[10px] font-black text-text-secondary font-mono tracking-wider">{block.targetFile || `file_block_${idx+1}`}</span>
                              <span className="text-[9px] font-bold text-text-tertiary uppercase">{block.language}</span>
                            </div>
                            <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-medium max-h-[300px] overflow-y-auto">{block.code}</pre>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Review Gate & Checklist */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
                        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-1.5 font-sans">
                          <UserCheck className="h-4 w-4 text-sky-400" /> QC Checklist (Founder Gate)
                        </div>
                        <ul className="space-y-2 text-xs text-slate-350 font-bold font-sans">
                          <li className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-slate-805 text-purple-600 bg-slate-950 h-4 w-4" />
                            <span>Xác nhận code logic đạt yêu cầu</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-slate-805 text-purple-600 bg-slate-950 h-4 w-4" />
                            <span>TypeScript pass (Auto-Repair checked)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded border-slate-805 text-purple-600 bg-slate-950 h-4 w-4" />
                            <span>Sao lưu (Git/Local backup) an toàn</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
                        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-1.5 font-sans">
                          <ShieldAlert className="h-4 w-4 text-amber-500" /> Risk Evaluation
                        </div>
                        <div className="space-y-2.5 text-xs font-sans">
                          <div className="flex items-center gap-2">
                            <span className="text-text-tertiary text-[10px] font-black uppercase tracking-wider">Mức độ rủi ro: </span>
                            <span className={`font-black uppercase px-2.5 py-0.5 rounded-full text-[9px] border ${
                              executingCard.risk === 'HIGH' 
                                ? 'bg-rose-950/30 text-rose-400 border-rose-800/25' 
                                : 'bg-amber-950/30 text-amber-450 border-amber-800/25'
                            }`}>
                              {executingCard.risk}
                            </span>
                          </div>
                          <p className="text-text-secondary font-semibold leading-relaxed">
                            Bạn đồng ý ghi đè trực tiếp thay đổi này lên hệ thống local chứ? Hành động này có thể được rollback sau đó.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Founder Gate Actions */}
                    <div className="flex gap-2.5 pt-2">
                      <button
                        onClick={approveAIStaffTask}
                        disabled={applyingAI}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-650 disabled:opacity-40 text-text-primary text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-700/10 cursor-pointer"
                      >
                        {applyingAI ? (
                          <Loader2 className="h-4.5 w-4.5 animate-spin text-text-primary" />
                        ) : (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        )}
                        {applyingAI ? 'Đang áp dụng bản vá code...' : 'Phê duyệt & Áp dụng (Overwrites Files)'}
                      </button>
                      
                      <button
                        onClick={rejectAIStaffTask}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-950/60 hover:bg-rose-900 border border-rose-850 hover:border-rose-750 text-rose-350 text-xs font-black rounded-xl transition-all cursor-pointer"
                      >
                        <XCircle className="h-4.5 w-4.5" />
                        Từ chối & Hủy bỏ đề xuất
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MODE 2: MULTI-STEP AGENT RUNTIME */}
            {executionMode === 'multistep' && (
              <div className="space-y-4 font-sans">
                {currentRun === null ? (
                  <div className="flex gap-2">
                    <button
                      onClick={startAgentRuntimeRun}
                      disabled={runningAI || !execPrompt.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-text-primary text-xs font-black rounded-xl transition-all shadow-lg shadow-purple-600/10 cursor-pointer font-sans"
                    >
                      {runningAI ? <Loader2 className="h-4.5 w-4.5 animate-spin text-text-primary" /> : <Cpu className="h-4 w-4" />}
                      {runningAI ? 'Khởi tạo Kế hoạch đa bước...' : 'Khởi tạo & Chạy Đa Bước (Agent Runtime)'}
                    </button>
                    <button
                      onClick={() => setExecutingCard(null)}
                      className="px-5 py-3 bg-bg-surface hover:bg-bg-surface-hover text-text-secondary text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in font-sans">
                    {/* Live Progress Status Box */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-850 p-4 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <div>
                          <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider block">Tiến trình chạy Agent</span>
                          <span className="text-[9px] text-text-secondary font-mono font-semibold">{currentRun.id}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          currentRun.status === 'completed'
                            ? 'bg-emerald-950/40 text-emerald-450 border-emerald-800/35'
                            : currentRun.status === 'failed'
                              ? 'bg-rose-950/40 text-rose-455 border-rose-800/35'
                              : currentRun.status === 'stopped'
                                ? 'bg-bg-primary text-slate-450 border-border-primary'
                                : currentRun.status === 'waiting_approval'
                                  ? 'bg-amber-950/40 text-amber-450 border-amber-800/35 animate-pulse'
                                  : 'bg-purple-950/40 text-purple-400 border-purple-800/35 animate-pulse'
                        }`}>
                          {currentRun.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold leading-relaxed text-slate-350">
                        <strong className="text-text-tertiary font-black uppercase tracking-wider text-[9px] block mb-1">Mục tiêu / Kế hoạch tổng quan:</strong>
                        {currentRun.plannerSummary}
                      </div>

                      {/* Steps Checklist */}
                      <div className="space-y-2 mt-2">
                        {currentRun.steps.map((step, idx) => (
                          <div key={step.id} className="bg-bg-primary/65 border border-slate-850 p-3 rounded-xl space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="font-bold text-slate-200">
                                {idx + 1}. {step.title}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                                step.status === 'completed'
                                  ? 'bg-emerald-950/20 text-emerald-450 border-emerald-900/20'
                                  : step.status === 'failed'
                                    ? 'bg-rose-950/20 text-rose-400 border-rose-900/20'
                                    : step.status === 'waiting_approval'
                                      ? 'bg-amber-950/20 text-amber-450 border-amber-900/20 animate-pulse'
                                      : 'bg-slate-950 text-text-tertiary border-slate-900'
                              }`}>
                                {step.status}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-450 space-y-1">
                              <p><strong className="text-text-tertiary font-sans">Công cụ:</strong> <code className="text-text-secondary font-mono">{step.toolId}</code> (Rủi ro: <span className="font-bold text-text-secondary">{step.risk}</span>)</p>
                              {step.observation && (
                                <p className="text-cyan-300 bg-slate-950/50 border border-slate-900 p-2 rounded-lg font-mono text-[9px] leading-relaxed">
                                  <strong className="text-text-tertiary">Quan sát:</strong> {step.observation}
                                </p>
                              )}
                            </div>

                            {/* Step Approval Maker-Checker Input */}
                            {step.status === 'waiting_approval' && (
                              <div className="mt-3 p-3.5 bg-amber-950/30 border border-amber-900/40 rounded-xl space-y-2.5 animate-fade-in">
                                <div className="text-[9px] font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Bắt buộc ký số của Founder (Maker-Checker)
                                </div>
                                <div className="text-[9px] font-mono text-slate-450 leading-relaxed select-all">
                                  Fingerprint: <span className="text-amber-300/80">{step.approvalFingerprint}</span>
                                </div>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={approvalPhraseInput}
                                    onChange={e => setApprovalPhraseInput(e.target.value)}
                                    placeholder="Gõ chính xác: APPROVE AGENT STEP"
                                    className="w-full bg-slate-950 border border-border-primary rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-800 outline-none focus:border-amber-500 font-mono"
                                  />
                                  <button
                                    onClick={() => handleApproveAgentStep(step.id, step.approvalFingerprint || '')}
                                    disabled={approvingStep || approvalPhraseInput !== 'APPROVE AGENT STEP'}
                                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-550 disabled:opacity-40 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    {approvingStep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    Ký duyệt & Cho phép Agent chạy tiếp
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Generated Artifacts list */}
                      {currentRun.artifacts && currentRun.artifacts.length > 0 && (
                        <div className="mt-4 border-t border-slate-900 pt-3 space-y-2">
                          <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block font-sans">Bằng chứng & Sản phẩm thu được (Evidence)</span>
                          <div className="space-y-1.5">
                            {currentRun.artifacts.map((art) => (
                              <div key={art.id} className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl text-[10px] space-y-1 font-mono">
                                <div className="flex items-center justify-between text-text-tertiary font-bold border-b border-slate-900 pb-1">
                                  <span>{art.type}</span>
                                  <span>{art.id}</span>
                                </div>
                                <p className="text-slate-350 leading-relaxed font-sans">{art.summary}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        {['planned', 'running', 'waiting_approval'].includes(currentRun.status) && (
                          <button
                            onClick={handleAdvanceAgentStep}
                            disabled={advancingRun || approvingStep || currentRun.steps.some(s => s.status === 'waiting_approval')}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-550 disabled:opacity-40 text-text-primary text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                          >
                            {advancingRun ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            Chạy bước kế tiếp (Advance)
                          </button>
                        )}

                        {['planned', 'running', 'waiting_approval'].includes(currentRun.status) && (
                          <button
                            onClick={handleStopAgentRun}
                            disabled={stoppingRun}
                            className="px-4 py-3 bg-bg-surface hover:bg-bg-surface-hover text-text-secondary text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-sans"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-450" />
                            Dừng Run
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setExecutingCard(null);
                            setCurrentRun(null);
                          }}
                          className="px-4 py-3 bg-bg-primary hover:bg-slate-850 text-text-secondary text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-850 font-sans"
                        >
                          Đóng
                        </button>
                      </div>

                      {/* Flashing Emergency Stop Button */}
                      {['planned', 'running', 'waiting_approval'].includes(currentRun.status) && (
                        <button
                          onClick={handleEmergencyStop}
                          disabled={estopLoading}
                          className="w-full py-2.5 bg-rose-650 hover:bg-rose-600 text-text-primary text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-500 animate-pulse uppercase tracking-wider font-sans"
                        >
                          <ShieldAlert className="w-4 h-4 text-text-primary" />
                          Founder Emergency Stop (Tắt toàn hệ thống)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {statusMsg && (
              <div className={`rounded-xl p-3.5 text-xs font-black whitespace-pre-line border animate-fade-in ${
                statusMsg.startsWith('✅') ? 'bg-emerald-950/40 border-emerald-800/35 text-emerald-300' : 'bg-rose-950/40 border-rose-800/35 text-rose-455'
              }`}>
                {statusMsg}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 font-bold border border-dashed border-slate-850 rounded-2xl bg-slate-950/30">
            <Layers className="w-12 h-12 mb-4 text-slate-800" />
            <p>Chưa có tiến trình nào đang chạy.</p>
            <p className="text-[10px] font-normal mt-1">Chọn nhiệm vụ từ danh sách bên trái để theo dõi Workspace.</p>
          </div>
        )}
        </div>

        {/* PANEL 2: Chat AI Client (Phải - 7/12) */}
        <div className="lg:col-span-7 h-full min-w-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850 flex flex-col">
          {/* State B: General multi-turn chat client active */}
          <div className="bg-bg-primary/60 border border-border-primary rounded-2xl p-5 flex-1 flex flex-col justify-between relative min-h-[600px] min-w-0 overflow-hidden">
            
            {/* Scrapbook toast success indicator */}
            <div id="scrapbook-toast" className="opacity-0 transition-opacity duration-300 pointer-events-none absolute right-12 top-24 bg-emerald-500/20 text-emerald-450 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/30 shadow-lg z-50 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Đã lưu đoạn mã vào Sổ tay Code!
            </div>

            {/* Workspace Ribbon Menu */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shrink-0"></span>
                <span className="text-xs font-black text-slate-100 uppercase tracking-wider whitespace-nowrap">
                  💬 Chat AI Streaming
                </span>
                {keyStatus && (
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-tight border shrink-0 ${
                    keyStatus.usingCustomKey 
                      ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' 
                      : 'bg-amber-500/15 border-amber-500/25 text-amber-400'
                  }`}>
                    {keyStatus.usingCustomKey ? '🟢 Pro Quota' : '🟡 Free Quota'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                {/* Model Selector dropdown */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase font-mono shrink-0">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-slate-950 border border-border-primary rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold outline-none cursor-pointer focus:border-purple-500 max-w-[200px] truncate"
                  >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Siêu tốc)</option>
                    <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Exp (Thông thái)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Phân tích sâu)</option>
                  </select>
                </div>

                <button 
                  onClick={handleNewChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-border-primary rounded-xl text-slate-400 hover:text-text-primary hover:border-border-secondary transition-all text-xs font-bold cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Chat List Scroll Area */}
            <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1.5 scrollbar-thin scrollbar-thumb-slate-850 flex-1 min-h-[350px] mt-4 select-text">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl text-xs space-y-3 border ${
                    msg.role === 'user' 
                      ? 'bg-purple-650/10 border-purple-500/15 ml-12 text-slate-200' 
                      : msg.role === 'error'
                      ? 'bg-rose-500/5 border-rose-500/15 mr-12 text-rose-400 font-semibold shadow shadow-rose-500/5'
                      : 'bg-slate-950 border-slate-850 mr-12 text-text-secondary shadow'
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <span className="font-black tracking-wider uppercase text-[10px] text-text-tertiary font-mono">
                      {msg.role === 'user' ? '👤 Solo Founder Query' : msg.role === 'error' ? '🚨 System Report' : '🤖 Gemini AI Expert Partner'}
                    </span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyText(msg.text, `msg_${idx}`)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-bg-primary hover:bg-slate-850 border border-border-primary rounded text-text-secondary hover:text-text-primary transition-all text-[10px] font-bold cursor-pointer"
                      >
                        {copiedId === `msg_${idx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-450" />
                            <span className="text-emerald-455 font-black font-mono">Đã chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy all</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {msg.role === 'assistant' ? renderMessageContent(msg.text) : msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="p-4 mr-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-xs text-slate-200 flex items-center gap-3 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                  <span className="font-black tracking-wide font-sans relative z-10">Gemini đang tạo câu trả lời và stream từng hạt token...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Presets Horizontal Pills */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 my-2 scrollbar-none min-w-0">
              <span className="text-[10px] font-black text-purple-400 uppercase font-mono tracking-wider shrink-0">⚡ Mẫu nhanh:</span>
              {preSets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserInput(preset.prompt);
                    handleSend(preset.prompt);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>

            {/* File Indicator */}
            {uploadedFile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/15 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold self-start my-1.5 max-w-full">
                <FileText className="w-4 h-4 shrink-0 text-purple-400" />
                <span className="truncate max-w-[200px]">{uploadedFile.name}</span>
                <button 
                  onClick={() => setUploadedFile(null)}
                  className="text-slate-450 hover:text-rose-500 font-extrabold ml-1.5 px-1 bg-bg-primary/30 rounded-full cursor-pointer leading-none"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Chat Input form area */}
            <div className="border-t border-slate-850 pt-3 flex items-center gap-2 min-w-0">
              <label 
                className="flex items-center justify-center p-3 bg-slate-950 hover:bg-bg-primary border border-slate-850 hover:border-border-secondary transition-colors rounded-xl text-xs text-text-secondary font-black cursor-pointer shrink-0"
                title="Đính kèm tệp CSV/PDF"
              >
                <Paperclip className="w-4.5 h-4.5 text-purple-400" />
                <input
                  type="file"
                  accept=".csv,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(userInput); }}
                placeholder={uploadedFile ? `Bấm gửi hoặc viết thêm ghi chú cho tệp ${uploadedFile.name}...` : "Nhập câu hỏi hoặc yêu cầu cho AI (Ví dụ: Thiết kế schema hóa đơn VAT...)"}
                disabled={loading}
                className="flex-1 min-w-0 bg-slate-950 border border-slate-850 px-4 py-3 rounded-xl text-xs text-text-primary placeholder-slate-600 focus:outline-none focus:border-purple-500 font-semibold shadow-inner"
              />
              
              {isStreaming ? (
                <button
                  onClick={() => abortController?.abort()}
                  className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-text-primary rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-500/20 cursor-pointer animate-pulse shrink-0"
                >
                  <span className="w-2.5 h-2.5 bg-white rounded-xs shrink-0"></span>
                  <span>Dừng</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSend(userInput)}
                  disabled={loading || (!userInput.trim() && !uploadedFile)}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-bg-surface disabled:text-slate-600 text-text-primary rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
