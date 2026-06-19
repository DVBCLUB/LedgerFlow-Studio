import React, { useState, useEffect } from 'react';
import { 
  Bot, FileJson, UploadCloud, Trash2, PlayCircle, Eye, 
  CheckCircle2, AlertCircle, ExternalLink, Clipboard, 
  Check, FileText, Search, RefreshCw, X, HelpCircle
} from 'lucide-react';
import { saveDatabaseToServer } from '../utils/dbSync';

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

export default function WebAiSyncPanel({ onChanged }: { onChanged?: () => void }) {
  const [conversations, setConversations] = useState<WebConversation[]>([]);
  const [activeTab, setActiveTab] = useState<'import' | 'list' | 'script'>('import');
  const [importType, setImportType] = useState<'chatgpt' | 'generic' | 'paste'>('chatgpt');
  
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

  const puppeteerScript = `const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("🚀 Khởi chạy automation trích xuất hội thoại...");
  // Mở trình duyệt Chrome với profile hiện tại của bạn để dùng session cookies có sẵn
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: process.env.APPDATA + "\\\\Google\\\\Chrome\\\\User Data" // Đường dẫn Chrome Profile trên Windows
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
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-4">
            <h3 className="text-xs font-black text-amber-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-300" /> Lưu ý dành cho lập trình viên
            </h3>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">
              Direct Web scraping các hệ thống ChatGPT/Gemini có thể bị chặn bởi cơ chế Cloudflare chống bot.
              Tuy nhiên, bạn có thể tự khởi chạy một script Node.js trích xuất cục bộ (Local puppeteer script) 
              sử dụng Profile Chrome hiện có để đọc cookie session cá nhân, tự động trích xuất lịch sử và sinh ra file JSON nạp lại LedgerFlow.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Script NodeJS (Puppeteer + Chrome Profile)</span>
              <button
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10.5px] font-bold text-slate-400 hover:text-white"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}
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
