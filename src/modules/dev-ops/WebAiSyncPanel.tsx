import React, { useState, useEffect } from 'react';
import { Bot, FileJson, UploadCloud, Trash2, PlayCircle, Eye, CheckCircle2, AlertCircle, ExternalLink, Clipboard, Check, FileText, Search, RefreshCw, X, HelpCircle, User, Plus } from 'lucide-react';
import { fetchBrowserSandboxDiagnostics } from '../../services/aiWorkforceRuntimeClient';
import { saveDatabaseToServer } from '../../utils/dbSync';
import { fetchWebAIProfiles, createWebAIProfile, deleteWebAIProfile } from '../../utils/assistantApi';

export interface WebConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  time?: number;
}

export interface WebConversation {
  id: string;
  title: string;
  source: 'chatgpt' | 'gemini' | 'manual';
  messages: WebConversationMessage[];
  importedAt: string;
  date?: string;
}

export interface ChromeProfile {
  id: string;
  name: string;
  folder: string;
  email: string;
}

export default function WebAiSyncPanel({ onChanged }: { onChanged?: () => void }) {
  const [conversations, setConversations] = useState<WebConversation[]>([]);
  const [activeTab, setActiveTab] = useState<'import' | 'list' | 'script'>('import');
  const [importType, setImportType] = useState<'chatgpt' | 'generic' | 'paste'>('chatgpt');

  // Chrome Profiles State Management
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  // State for creating new Chrome profile
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePlatform, setNewProfilePlatform] = useState('chatgpt');
  const [newProfileFolder, setNewProfileFolder] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const list = await fetchWebAIProfiles();
      setProfiles(list);
      
      const storedSelectedId = localStorage.getItem('lf_selected_profile_id');
      const matched = list.find(p => p.id === storedSelectedId);
      if (matched) {
        setSelectedProfileId(matched.id);
      } else if (list.length > 0) {
        setSelectedProfileId(list[0].id);
      } else {
        setSelectedProfileId('');
      }
    } catch (err: any) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfileId) {
      localStorage.setItem('lf_selected_profile_id', selectedProfileId);
    }
  }, [selectedProfileId]);
  
  // Raw text paste state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteSource, setPasteSource] = useState<'chatgpt' | 'gemini'>('chatgpt');
  
  // List view search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'chatgpt' | 'gemini' | 'manual'>('all');
  
  // Modal viewer state
  const [selectedChat, setSelectedChat] = useState<WebConversation | null>(null);

  // Status/Messages state
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load conversations from localStorage on boot
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lf_imported_conversations');
      if (raw) {
        setConversations(JSON.parse(raw) as WebConversation[]);
      }
    } catch (err) {
      console.error('Failed to load imported conversations:', err);
    }
  }, []);

  // Save conversations helper
  const saveConversations = async (updated: WebConversation[]) => {
    setConversations(updated);
    localStorage.setItem('lf_imported_conversations', JSON.stringify(updated));
    const success = await saveDatabaseToServer();
    if (success) {
      setMessage('Đã lưu trữ và đồng bộ hóa dữ liệu lên máy chủ thành công.');
      onChanged?.();
    } else {
      setError('Lưu local thành công nhưng đồng bộ server thất bại.');
    }
  };

  // Parser: ChatGPT Export conversations.json
  const parseChatGPTExport = (jsonContent: string): WebConversation[] => {
    const rawData = JSON.parse(jsonContent);
    if (!Array.isArray(rawData)) {
      throw new Error('Định dạng ChatGPT conversations.json phải là một mảng (Array).');
    }

    const parsed: WebConversation[] = [];
    for (const chat of rawData) {
      if (!chat.title || !chat.mapping) continue;
      
      const messages: WebConversationMessage[] = [];
      for (const nodeKey in chat.mapping) {
        const node = chat.mapping[nodeKey];
        if (node.message && node.message.author && node.message.content) {
          const role = node.message.author.role;
          if (role === 'user' || role === 'assistant') {
            const parts = node.message.content.parts;
            if (Array.isArray(parts) && parts.length > 0) {
              const text = parts
                .map((p) => (typeof p === 'string' ? p : p.text || ''))
                .join('\n')
                .trim();
              
              if (text) {
                messages.push({
                  role: role === 'user' ? 'user' : 'assistant',
                  text,
                  time: node.message.create_time || chat.create_time || Date.now() / 1000
                });
              }
            }
          }
        }
      }

      // Sort messages by timestamp
      messages.sort((a, b) => (a.time || 0) - (b.time || 0));

      if (messages.length > 0) {
        parsed.push({
          id: chat.id || `chat_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          title: chat.title,
          source: 'chatgpt',
          messages,
          importedAt: new Date().toISOString(),
          date: chat.create_time 
            ? new Date(chat.create_time * 1000).toLocaleDateString('vi-VN') 
            : new Date().toLocaleDateString('vi-VN')
        });
      }
    }
    return parsed;
  };

  // Parser: Generic JSON format
  const parseGenericJSON = (jsonContent: string): WebConversation[] => {
    const rawData = JSON.parse(jsonContent);
    if (!Array.isArray(rawData)) {
      throw new Error('Định dạng JSON chuẩn phải là mảng các cuộc hội thoại [{ title, messages: [] }].');
    }

    const parsed: WebConversation[] = [];
    for (const entry of rawData) {
      if (!entry.title || !Array.isArray(entry.messages)) continue;

      const messages: WebConversationMessage[] = entry.messages
        .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && m.text)
        .map((m: any) => ({
          role: m.role,
          text: String(m.text).trim()
        }));

      if (messages.length > 0) {
        parsed.push({
          id: entry.id || `gen_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          title: String(entry.title),
          source: entry.source === 'gemini' ? 'gemini' : entry.source === 'chatgpt' ? 'chatgpt' : 'manual',
          messages,
          importedAt: new Date().toISOString(),
          date: entry.date || new Date().toLocaleDateString('vi-VN')
        });
      }
    }
    return parsed;
  };

  // File Upload Drop Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let imported: WebConversation[] = [];

        if (importType === 'chatgpt') {
          imported = parseChatGPTExport(content);
        } else if (importType === 'generic') {
          imported = parseGenericJSON(content);
        }

        if (imported.length === 0) {
          throw new Error('Không tìm thấy cuộc hội thoại hợp lệ nào để nhập.');
        }

        // Merge and prevent duplicates by ID
        const existingIds = new Set(conversations.map((c) => c.id));
        const newChats = imported.filter((c) => !existingIds.has(c.id));
        
        if (newChats.length === 0) {
          setMessage('Tất cả các cuộc hội thoại trong file đã tồn tại trên hệ thống.');
          return;
        }

        const updated = [...newChats, ...conversations];
        await saveConversations(updated);
        setMessage(`Đã nhập thành công ${newChats.length} cuộc hội thoại mới.`);
      } catch (err: any) {
        setError(`Lỗi xử lý file: ${err.message || err}`);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Text Area Paste Handler
  const handleTextPasteImport = async () => {
    setError(null);
    setMessage(null);
    if (!pasteTitle.trim()) {
      setError('Vui lòng nhập tiêu đề cho cuộc hội thoại.');
      return;
    }
    if (!pasteText.trim()) {
      setError('Vui lòng dán nội dung cuộc hội thoại.');
      return;
    }

    try {
      // Very basic text segmenter. Split by standard indicators: "User:", "ChatGPT:", "Gemini:", "Assistant:", "Q:", "A:"
      const lines = pasteText.split('\n');
      const messages: WebConversationMessage[] = [];
      let currentRole: 'user' | 'assistant' | null = null;
      let currentText: string[] = [];

      const flushMessage = () => {
        if (currentRole && currentText.length > 0) {
          messages.push({
            role: currentRole,
            text: currentText.join('\n').trim()
          });
          currentText = [];
        }
      };

      for (const line of lines) {
        const trimmed = line.trim();
        const lower = trimmed.toLowerCase();

        // Check if line indicates role change
        if (lower.startsWith('user:') || lower.startsWith('q:') || lower.startsWith('hỏi:') || lower.startsWith('me:')) {
          flushMessage();
          currentRole = 'user';
          currentText.push(trimmed.slice(trimmed.indexOf(':') + 1));
        } else if (lower.startsWith('chatgpt:') || lower.startsWith('gemini:') || lower.startsWith('assistant:') || lower.startsWith('a:') || lower.startsWith('trả lời:')) {
          flushMessage();
          currentRole = 'assistant';
          currentText.push(trimmed.slice(trimmed.indexOf(':') + 1));
        } else if (currentRole) {
          currentText.push(line);
        } else if (trimmed !== '') {
          // If no prefix but has text, assume it's the user's initial prompt
          currentRole = 'user';
          currentText.push(line);
        }
      }
      flushMessage();

      if (messages.length === 0) {
        throw new Error('Không thể phân tích dòng hội thoại. Định dạng mẫu: \nUser: nội dung... \nChatGPT: câu trả lời...');
      }

      const newChat: WebConversation = {
        id: `paste_${Date.now()}`,
        title: pasteTitle.trim(),
        source: pasteSource,
        messages,
        importedAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('vi-VN')
      };

      const updated = [newChat, ...conversations];
      await saveConversations(updated);
      setPasteTitle('');
      setPasteText('');
      setMessage('Đã nhập thành công 1 cuộc hội thoại dán thủ công.');
      setActiveTab('list');
    } catch (err: any) {
      setError(err.message || 'Lỗi phân tích cú pháp dán.');
    }
  };

  // Delete Conversation Handler
  const handleDeleteChat = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc hội thoại đã nhập này?')) {
      const updated = conversations.filter((c) => c.id !== id);
      await saveConversations(updated);
      setMessage('Đã xóa cuộc hội thoại thành công.');
    }
  };

  // Filter and search logic
  const filteredChats = conversations.filter((chat) => {
    const matchesSource = sourceFilter === 'all' || chat.source === sourceFilter;
    const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.messages.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSource && matchesSearch;
  });

  const selectedProfObj = profiles.find((p) => p.id === selectedProfileId) || profiles[0] || { profileDir: 'Default', name: 'Default', platform: 'chatgpt' };
  const selectedFolder = selectedProfObj.profileDir;

  const puppeteerScript = `const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("🚀 Khởi chạy automation trích xuất hội thoại...");
  // Mở trình duyệt Chrome với profile: ${selectedProfObj.name} (${selectedProfObj.email})
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: process.env.APPDATA + "\\\\Google\\\\Chrome\\\\User Data\\\\" + "${selectedFolder.replace(/\\/g, '\\\\')}" // Đường dẫn Chrome Profile trên Windows
  });
  
  const page = await browser.newPage();
  await page.goto('https://chatgpt.com');
  console.log('💡 Vui lòng đăng nhập và truy cập ChatGPT. Script sẽ đợi bạn...');
  
  // Đợi cho đến khi thanh điều hướng của ChatGPT tải xong
  await page.waitForSelector('nav', { timeout: 120000 });
  
  // Trích xuất tiêu đề các chat ở thanh bên
  const chats = await page.evaluate(() => {
    const list = [];
    const elements = document.querySelectorAll('nav ol li a');
    elements.forEach((el, index) => {
      list.push({
        id: "local_sync_" + Date.now() + "_" + index,
        title: el.innerText.trim(),
        source: "chatgpt",
        messages: [
          { role: "user", text: "Cuộc hội thoại đồng bộ: " + el.innerText },
          { role: "assistant", text: "Để xem chi tiết cuộc hội thoại này, vui lòng sử dụng tính năng Export Data chính thức của ChatGPT hoặc tải extension." }
        ],
        date: new Date().toLocaleDateString("vi-VN")
      });
    });
    return list;
  });
  
  console.log(\`✅ Đã trích xuất \${chats.length} tiêu đề. Lưu vào file chatgpt_sync.json...\`);
  fs.writeFileSync('chatgpt_sync.json', JSON.stringify(chats, null, 2));
  await browser.close();
})();`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(puppeteerScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) return;
    try {
      const isPath = newProfileFolder.trim().includes('/') || newProfileFolder.trim().includes('\\');
      const customPath = isPath ? newProfileFolder.trim() : undefined;
      
      const newProf = await createWebAIProfile(
        newProfileName.trim(), 
        newProfilePlatform, 
        customPath
      );
      
      await loadProfiles();
      setSelectedProfileId(newProf.id);
      setNewProfileName('');
      setNewProfileFolder('');
      setNewProfileEmail('');
      setShowAddProfileForm(false);
      setMessage(`Đã tạo thành công profile "${newProfileName}" cho nền tảng ${newProfilePlatform}.`);
    } catch (err: any) {
      setError(`Lỗi khi tạo profile: ${err.message}`);
    }
  };

  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      alert('Phải giữ lại ít nhất 1 profile Chrome cấu hình.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa profile này? Mọi cookies lưu đăng nhập trong thư mục profile này sẽ bị xóa bỏ hoàn toàn.')) {
      try {
        await deleteWebAIProfile(id);
        await loadProfiles();
        setMessage('Đã xóa profile thành công.');
      } catch (err: any) {
        setError(`Lỗi khi xóa profile: ${err.message}`);
      }
    }
  };

  // Browser Sandbox (P2) State & Handlers
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [runTaskType, setRunTaskType] = useState<'chatgpt-scrape' | 'gemini-scrape' | 'claude-scrape' | 'deepseek-scrape' | 'general'>('chatgpt-scrape');
  const [actionUrl, setActionUrl] = useState('https://chatgpt.com');
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [apiFallbackExhausted, setApiFallbackExhausted] = useState(false);
  const [browserDiagnostics, setBrowserDiagnostics] = useState<any[]>([]);

  useEffect(() => {
    if (runTaskType === 'chatgpt-scrape') {
      setActionUrl('https://chatgpt.com');
    } else if (runTaskType === 'gemini-scrape') {
      setActionUrl('https://gemini.google.com');
    } else if (runTaskType === 'claude-scrape') {
      setActionUrl('https://claude.ai');
    } else if (runTaskType === 'deepseek-scrape') {
      setActionUrl('https://chat.deepseek.com');
    }
  }, [runTaskType]);

  const loadBrowserDiagnostics = React.useCallback(async () => {
    try {
      const payload = await fetchBrowserSandboxDiagnostics();
      setBrowserDiagnostics(payload.diagnostics || []);
    } catch {
      setBrowserDiagnostics([]);
    }
  }, []);

  useEffect(() => {
    loadBrowserDiagnostics();
  }, [loadBrowserDiagnostics]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeRunId) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/company-os/browser-sandbox/status/${activeRunId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.run) {
              setRunLogs(data.run.logs || []);
              setRunStatus(data.run.status);
              if (data.run.lastScreenshot) {
                setLastScreenshot(data.run.lastScreenshot);
              }
              
              if (data.run.status !== 'running') {
                setActiveRunId(null);
                setLastScreenshot(null);
                await loadBrowserDiagnostics();
                if (data.run.status === 'completed' && data.run.output && Array.isArray(data.run.output)) {
                  const imported: WebConversation[] = data.run.output;
                  const existingIds = new Set(conversations.map((c) => c.id));
                  const newChats = imported.filter((c) => !existingIds.has(c.id));
                  
                  if (newChats.length > 0) {
                    const updated = [...newChats, ...conversations];
                    setConversations(updated);
                    localStorage.setItem('lf_imported_conversations', JSON.stringify(updated));
                    await saveConversations(updated);
                    setMessage(`Đã đồng bộ thành công ${newChats.length} cuộc hội thoại mới từ Sandbox.`);
                    onChanged?.();
                  } else {
                    setMessage('Đồng bộ Sandbox thành công. Không có cuộc hội thoại nào mới.');
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error polling status:', e);
        }
      };
      
      timer = setInterval(poll, 1500);
      poll();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeRunId, conversations, loadBrowserDiagnostics]);

  const handleStartSandbox = async () => {
    setError(null);
    setMessage(null);
    setRunLogs(['[Khởi chạy] Đang gửi yêu cầu khởi tạo Browser Sandbox...']);
    setRunStatus('running');
    setLastScreenshot(null);
    
    try {
      const res = await fetch('/api/company-os/browser-sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileName: selectedProfObj.name,
          folder: selectedFolder,
          actionUrl,
          taskType: runTaskType,
          apiFallbackExhausted,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.runId) {
          setActiveRunId(data.runId);
        } else {
          throw new Error(data.error || 'Khởi chạy thất bại.');
        }
      } else {
        throw new Error('Lỗi kết nối máy chủ.');
      }
    } catch (err: any) {
      setRunStatus('failed');
      setLastScreenshot(null);
      setRunLogs((prev) => [...prev, `[Lỗi] ${err.message || err}`]);
      setError(`Không khởi chạy được Sandbox: ${err.message || err}`);
    }
  };

  const handleStopSandbox = async () => {
    if (!activeRunId) return;
    try {
      await fetch(`/api/company-os/browser-sandbox/stop/${activeRunId}`, { method: 'POST' });
      setActiveRunId(null);
      setRunStatus('cancelled');
      setLastScreenshot(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-200">
            <Bot className="h-4 w-4" /> ChatGPT & Gemini Web Sync
          </div>
          <h2 className="mt-3 text-xl font-black text-white">Đồng bộ tri thức từ Web Chat của bạn</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-400">
            LedgerFlow hỗ trợ nhập dữ liệu hội thoại đã trao đổi trên ChatGPT/Gemini để làm giàu tri thức local, phục vụ cho AI Agent viết code, làm nội dung và hạch toán kế toán.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'import' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Nhập dữ liệu
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all relative ${activeTab === 'list' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Hội thoại đã nhập
            {conversations.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-slate-950 border border-slate-850 text-violet-300 font-bold">
                {conversations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'script' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Script tự động (Code)
          </button>
        </div>
      </div>

      {/* Message and Error alerts */}
      {message && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 px-4 py-3 text-xs font-bold text-emerald-300 animate-pulse">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-emerald-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-800/40 bg-rose-950/20 px-4 py-3 text-xs font-bold text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* TAB 1: IMPORT PANEL */}
      {activeTab === 'import' && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Import Type Selector Cards */}
            <button
              onClick={() => setImportType('chatgpt')}
              className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.01] ${importType === 'chatgpt' ? 'border-violet-500 bg-violet-950/15' : 'border-slate-800 bg-slate-900/40 opacity-70'}`}
            >
              <FileJson className="h-7 w-7 text-emerald-400 mb-3" />
              <div className="text-xs font-black text-white">ChatGPT JSON Export</div>
              <p className="mt-1.5 text-[10px] font-semibold leading-5 text-slate-400">
                Nhập file `conversations.json` trích xuất trực tiếp từ gói dữ liệu của OpenAI.
              </p>
            </button>

            <button
              onClick={() => setImportType('generic')}
              className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.01] ${importType === 'generic' ? 'border-violet-500 bg-violet-950/15' : 'border-slate-800 bg-slate-900/40 opacity-70'}`}
            >
              <FileText className="h-7 w-7 text-sky-400 mb-3" />
              <div className="text-xs font-black text-white">Dữ liệu JSON Chuẩn</div>
              <p className="mt-1.5 text-[10px] font-semibold leading-5 text-slate-400">
                Nhập danh sách hội thoại tùy biến theo định dạng mẫu JSON [title, messages[]].
              </p>
            </button>

            <button
              onClick={() => setImportType('paste')}
              className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.01] ${importType === 'paste' ? 'border-violet-500 bg-violet-950/15' : 'border-slate-800 bg-slate-900/40 opacity-70'}`}
            >
              <Clipboard className="h-7 w-7 text-amber-400 mb-3" />
              <div className="text-xs font-black text-white">Dán văn bản thô</div>
              <p className="mt-1.5 text-[10px] font-semibold leading-5 text-slate-400">
                Tự dán hoặc sao chép nội dung chat thủ công phân đoạn từ trình duyệt.
              </p>
            </button>
          </div>

          {/* File Upload Mode (ChatGPT / Generic JSON) */}
          {importType !== 'paste' ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/20 p-8 text-center hover:border-violet-500 transition-all relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                id="file-upload-input"
              />
              <UploadCloud className="mx-auto h-12 w-12 text-slate-500" />
              <h3 className="mt-4 text-sm font-black text-white">Nhấp chọn hoặc kéo thả file JSON vào đây</h3>
              <p className="mt-1.5 text-xs text-slate-500">
                Chỉ chấp nhận file định dạng `.json` ({importType === 'chatgpt' ? 'conversations.json' : 'mẫu JSON hội thoại'}).
              </p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-[10.5px] font-bold text-slate-400">
                <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                <span>Cách lấy file: ChatGPT.com → Settings → Data Controls → Export Data (Đợi email tải zip).</span>
              </div>
            </div>
          ) : (
            /* Paste Text Mode */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest text-slate-400">Dán thủ công cuộc hội thoại</h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Tiêu đề cuộc hội thoại</label>
                  <input
                    type="text"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    placeholder="Ví dụ: Đối chiếu công nợ nhà cung cấp dầu"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Nền tảng gốc</label>
                  <select
                    value={pasteSource}
                    onChange={(e) => setPasteSource(e.target.value as 'chatgpt' | 'gemini')}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:border-violet-500"
                  >
                    <option value="chatgpt">OpenAI ChatGPT</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Nội dung hội thoại (Định dạng: User: ... / ChatGPT: ... hoặc Gemini: ...)
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={8}
                  placeholder={`User: Bạn hãy viết 1 SQL mẫu để tính tổng nợ theo từng công trình.\n\nChatGPT: Dưới đây là câu lệnh SQL truy vấn nhóm doanh số:\nSELECT project_name, SUM(amount) FROM lf_db_transactions GROUP BY project_name;`}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-[11px] text-slate-200 outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleTextPasteImport}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-black text-white transition-all cursor-pointer"
              >
                Nhập hội thoại
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIST VIEW */}
      {activeTab === 'list' && (
        <div className="mt-6 space-y-4">
          {/* Search and Filter controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tiêu đề hoặc nội dung tin nhắn..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3 text-xs font-bold text-white outline-none focus:border-violet-500"
              />
            </div>
            
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 outline-none focus:border-violet-500"
            >
              <option value="all">Tất cả nguồn</option>
              <option value="chatgpt">ChatGPT Export</option>
              <option value="gemini">Google Gemini</option>
              <option value="manual">Nhập thủ công</option>
            </select>
          </div>

          {/* Conversations table */}
          {filteredChats.length === 0 ? (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-center text-xs font-bold text-slate-500 italic">
              Chưa có dữ liệu nào khớp với bộ lọc tìm kiếm.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/35 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="p-3.5">Tiêu đề hội thoại</th>
                    <th className="p-3.5">Nguồn</th>
                    <th className="p-3.5">Số tin nhắn</th>
                    <th className="p-3.5">Ngày nhập</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredChats.map((chat) => (
                    <tr key={chat.id} className="text-xs font-semibold text-slate-300 hover:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-white max-w-[280px] truncate">{chat.title}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${
                          chat.source === 'chatgpt' 
                            ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-400' 
                            : chat.source === 'gemini' 
                            ? 'border-sky-900/40 bg-sky-950/20 text-sky-400' 
                            : 'border-amber-900/40 bg-amber-950/20 text-amber-400'
                        }`}>
                          {chat.source === 'chatgpt' ? 'ChatGPT' : chat.source === 'gemini' ? 'Gemini' : 'Thủ công'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{chat.messages.length} lượt</td>
                      <td className="p-3.5 text-slate-500">{chat.date || 'unknown'}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedChat(chat)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 hover:border-violet-500 hover:text-white"
                        >
                          <Eye className="h-3 w-3" /> Xem
                        </button>
                        <button
                          onClick={() => void handleDeleteChat(chat.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-950 bg-rose-950/20 px-2.5 py-1.5 text-rose-400 hover:bg-rose-900/25 hover:text-rose-200"
                        >
                          <Trash2 className="h-3 w-3" /> Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUTOMATION SCRIPT */}
      {activeTab === 'script' && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-4">
            <h3 className="text-xs font-black text-amber-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-300" /> Giải pháp điều khiển & Tự động hóa qua Chrome Session
            </h3>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">
              Để tránh các cơ chế chống bot (Cloudflare, Captcha) của ChatGPT và Gemini, LedgerFlow sử dụng giải pháp an toàn cục bộ: 
              Khởi chạy Puppeteer đính kèm trực tiếp vào session đăng nhập Chrome hiện có của bạn thông qua đường dẫn Profile cục bộ. 
              Bạn có thể linh hoạt chọn hoặc cấu hình các tài khoản Gmail/Chrome khác nhau để sinh mã script tương ứng hoặc chạy tự động hóa live ngay tại Dashboard.
            </p>
          </div>

          {/* Chrome Profiles List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Danh sách Profile Chrome & Gmail AI Chat</h3>
              <button
                type="button"
                onClick={() => setShowAddProfileForm(!showAddProfileForm)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-black text-slate-300 hover:text-white hover:border-violet-500 transition-all"
              >
                <Plus className="h-3.5 w-3.5 text-violet-400" />
                {showAddProfileForm ? 'Đóng form' : 'Thêm profile mới'}
              </button>
            </div>

            {showAddProfileForm && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4 animate-fadeIn">
                <div className="text-xs font-black text-white">Cấu hình Profile mới</div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Tên gợi nhớ</label>
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Ví dụ: Gmail cá nhân"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nền tảng Web AI</label>
                    <select
                      value={newProfilePlatform}
                      onChange={(e) => setNewProfilePlatform(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-violet-500"
                    >
                      <option value="chatgpt">ChatGPT</option>
                      <option value="gemini">Gemini</option>
                      <option value="claude">Claude</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="grok">Grok</option>
                      <option value="copilot">Copilot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Đường dẫn / Folder Path</label>
                    <input
                      type="text"
                      value={newProfileFolder}
                      onChange={(e) => setNewProfileFolder(e.target.value)}
                      placeholder="Bỏ trống nếu muốn tạo sandbox"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Gmail liên kết (nếu có)</label>
                    <input
                      type="email"
                      value={newProfileEmail}
                      onChange={(e) => setNewProfileEmail(e.target.value)}
                      placeholder="Ví dụ: my.email@gmail.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddProfile}
                    className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-black text-white transition-all"
                  >
                    Lưu Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProfileForm(false)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {profiles.map((p) => {
                const isSelected = selectedProfileId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    className={`relative rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between group hover:scale-[1.01] ${
                      isSelected 
                        ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-950/10' 
                        : 'border-slate-800 bg-slate-900/40 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-violet-400" />
                          <span className="text-xs font-black text-white">{p.name}</span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          p.status === 'ready' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' :
                          p.status === 'quota' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20' :
                          p.status === 'login_required' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20' :
                          'bg-slate-900 text-slate-400 border border-slate-850'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] font-semibold text-slate-400 truncate">
                        Platform: <span className="text-violet-300 font-bold uppercase">{p.platform}</span>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-slate-400 truncate" title={p.profileDir}>
                        Thư mục: <span className="font-mono text-[10px] text-slate-400">{p.profileDir}</span>
                      </div>
                      {p.quotaResetAt && (
                        <div className="mt-1 text-[9px] font-semibold text-amber-400">
                          Reset: {new Date(p.quotaResetAt).toLocaleTimeString('vi-VN')}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProfile(p.id, e)}
                      className="absolute bottom-3 right-3 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Xóa profile này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 text-[11px] font-semibold leading-5 text-slate-500">
              💡 <span className="font-black text-slate-400">Mẹo tìm thư mục Profile:</span> Mở Google Chrome, truy cập địa chỉ <code className="px-1.5 py-0.5 rounded bg-slate-950 text-violet-300 select-all">chrome://version</code> trên thanh địa chỉ, 
              và xem giá trị tại dòng <span className="font-bold text-slate-400">Profile Path</span> (Đường dẫn cấu hình). Tên thư mục nằm ở cuối cùng của đường dẫn (Ví dụ: <code className="text-violet-300">Default</code>, <code className="text-violet-300">Profile 1</code>, <code className="text-violet-300">Profile 2</code>, v.v.).
            </div>
          </div>

          {/* CONTROLLED BROWSER SANDBOX RUNNER (P2) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">
                  Controlled Browser Sandbox (P2)
                </div>
                <h3 className="text-xs font-black text-white mt-1">Trình Chạy Tự Động Hóa Live</h3>
              </div>
              
              {activeRunId ? (
                <button
                  type="button"
                  onClick={handleStopSandbox}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-black text-white transition-all animate-pulse"
                >
                  Dừng Sandbox
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSandbox}
                  disabled={!apiFallbackExhausted}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-black text-white transition-all cursor-pointer"
                >
                  Chạy Sandbox Live
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Mục tiêu cào dữ liệu</label>
                <select
                  value={runTaskType}
                  onChange={(e) => setRunTaskType(e.target.value as any)}
                  disabled={!!activeRunId}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:border-violet-500"
                >
                  <option value="chatgpt-scrape">Đăng nhập & Cào ChatGPT</option>
                  <option value="gemini-scrape">Đăng nhập & Cào Google Gemini</option>
                  <option value="claude-scrape">Đăng nhập & Cào Claude.ai</option>
                  <option value="deepseek-scrape">Đăng nhập & Cào DeepSeek Chat</option>
                  <option value="general">Duyệt Web Tự Do (60 giây)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Địa chỉ URL</label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  disabled={!!activeRunId}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 rounded-xl border border-amber-900/50 bg-amber-950/10 p-3 text-[11px] font-semibold text-amber-200">
              <input
                type="checkbox"
                checked={apiFallbackExhausted}
                onChange={(e) => setApiFallbackExhausted(e.target.checked)}
                disabled={!!activeRunId}
                className="mt-0.5"
              />
              <span>
                Xác nhận đã exhaust toàn bộ API provider/key trước khi dùng browser fallback.
              </span>
            </label>

            {browserDiagnostics.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Browser fallback diagnostics</div>
                <div className="space-y-2 text-[11px]">
                  {browserDiagnostics.map((row, idx) => (
                    <div key={`${row.host || 'host'}-${idx}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-slate-300">
                      <span className="font-black text-cyan-300">{row.host}</span>
                      <span>failures: {row.failures ?? 0}</span>
                      <span>reason: {row.reason || 'none'}</span>
                      <span className={row.cooldownActive ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {row.cooldownActive ? 'cooldown' : 'ready'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal Logs & Live Viewport View */}
            {(runLogs.length > 0 || runStatus) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                    <span>Trạng thái logs: <span className={`font-bold ${
                      runStatus === 'running' ? 'text-cyan-400' :
                      runStatus === 'completed' ? 'text-emerald-400' :
                      runStatus === 'failed' ? 'text-rose-400' : 'text-slate-400'
                    }`}>{runStatus?.toUpperCase()}</span></span>
                    {runStatus === 'running' && <span className="animate-spin text-cyan-400">⚡</span>}
                  </div>
                  <div className="rounded-xl bg-black p-4 font-mono text-[10.5px] leading-5 text-cyan-200 overflow-y-auto h-64 border border-slate-850">
                    {runLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('[Lỗi]') ? 'text-rose-400' : log.includes('[Khởi chạy]') ? 'text-cyan-300' : ''}>
                        {log}
                      </div>
                    ))}
                    {runStatus === 'running' && <div className="text-slate-500 animate-pulse">▋ Đang đợi logs...</div>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                    <span>Màn hình live viewport</span>
                    {runStatus === 'running' && <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
                  </div>
                  <div className="rounded-xl bg-slate-950 flex items-center justify-center h-64 border border-slate-850 overflow-hidden relative">
                    {lastScreenshot ? (
                      <img 
                        src={lastScreenshot} 
                        alt="Sandbox Viewport" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <div className="animate-pulse text-[11px] font-bold text-slate-500">
                          {runStatus === 'running' ? 'Đang kết nối luồng ảnh...' : 'Không có luồng ảnh hoạt động'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NodeJS Script Code Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Script NodeJS sinh động</span>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">Cấu hình cho profile: <span className="text-violet-300 font-bold">{selectedProfObj.name} ({selectedFolder})</span></p>
              </div>
              <button
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-black text-slate-300 hover:text-white hover:border-violet-500 transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Clipboard className="h-3.5 w-3.5" />}
                {copied ? 'Đã copy' : 'Copy code'}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-black/60 p-4 font-mono text-[10.5px] text-cyan-200 leading-5 max-h-96">{puppeteerScript}</pre>
          </div>
        </div>
      )}

      {/* CHAT TRANSCRIPT MODAL VIEWER */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-900 p-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Hội thoại nguồn: {selectedChat.source.toUpperCase()} (Ngày {selectedChat.date})
                </span>
                <h3 className="mt-1 text-sm font-black text-white">{selectedChat.title}</h3>
              </div>
              <button
                onClick={() => setSelectedChat(null)}
                className="rounded-xl border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-auto p-5 space-y-4">
              {selectedChat.messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-550">
                    {m.role === 'user' ? 'Bạn' : 'AI Trợ Lý'}
                  </span>
                  <div 
                    className={`rounded-2xl px-4 py-3 text-xs leading-6 font-semibold select-text whitespace-pre-wrap ${
                      m.role === 'user' 
                        ? 'bg-violet-600 text-white rounded-br-none' 
                        : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-850'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-900 p-4 flex justify-between gap-3 bg-slate-900/10">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    selectedChat.messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n\n')
                  ).then(() => {
                    alert('Đã sao chép toàn bộ hội thoại thô dạng text vào clipboard.');
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-black text-slate-350 hover:text-white"
              >
                <Clipboard className="h-4 w-4" /> Copy Text hội thoại
              </button>
              
              <button
                onClick={() => setSelectedChat(null)}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-black text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
