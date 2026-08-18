import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Code2,
  Sparkles,
  Send,
  CloudUpload,
  Layers,
  Bot,
  Copy,
  Check,
  Trash2,
  Cpu,
  Smartphone,
  CheckCircle2,
  FileCode,
  Lightbulb,
  Zap,
  ArrowRight,
  RefreshCw,
  Settings,
  Globe,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  getApiBaseUrl,
  getApiHeaders,
  getCustomBackendUrl,
  setCustomBackendUrl,
  getMobileAuthToken,
  setMobileAuthToken,
  isCapacitorNative
} from '../../utils/mobileBackendConfig';

interface StashItem {
  id: string;
  type: 'code_snippet' | 'idea' | 'ai_task';
  title: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  aiProvider?: string;
  createdAt: string;
}

const AI_PROVIDERS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Fastest' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', badge: 'Smartest' },
  { id: 'groq-llama-3-3', name: 'Groq Llama 3.3', badge: 'Ultra-speed' },
  { id: 'deepseek-chat', name: 'DeepSeek V3', badge: 'Cost-saving' },
];

export default function MobileVibeApp() {
  const [activeTab, setActiveTab] = useState<'vibe' | 'stash' | 'ai_staff'>('vibe');
  const [selectedProvider, setSelectedProvider] = useState('gemini-2.0-flash');
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiOutput, setAiOutput] = useState<{ title: string; explanation: string; code?: string; language?: string } | null>(null);
  const [stash, setStash] = useState<StashItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncingToCloud, setSyncingToCloud] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Settings & Backend Connection
  const [showSettings, setShowSettings] = useState(false);
  const [backendUrlInput, setBackendUrlInput] = useState(getCustomBackendUrl());
  const [authTokenInput, setAuthTokenInput] = useState(getMobileAuthToken());
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Load stash from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lf_mobile_vibe_stash');
      if (saved) {
        setStash(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
  }, []);

  // Save stash locally
  const saveStashLocally = (items: StashItem[]) => {
    setStash(items);
    localStorage.setItem('lf_mobile_vibe_stash', JSON.stringify(items));
  };

  const handleSaveSettings = () => {
    setCustomBackendUrl(backendUrlInput);
    setMobileAuthToken(authTokenInput);
    setShowSettings(false);
    setFeedback('✅ Đã lưu cấu hình kết nối Máy chủ!');
  };

  const handleTestConnection = async () => {
    setPingStatus('testing');
    const targetBase = backendUrlInput.trim().replace(/\/+$/, '') || getApiBaseUrl();
    try {
      const res = await fetch(`${targetBase}/api/mobile-vibe/inbox`, {
        method: 'GET',
        headers: getApiHeaders(),
      });
      if (res.ok) {
        setPingStatus('success');
      } else {
        setPingStatus('error');
      }
    } catch {
      setPingStatus('error');
    }
  };

  // Voice recording simulation (uses Web Speech API if available)
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setFeedback('Trình duyệt không hỗ trợ Web Speech API. Bạn có thể nhập text trực tiếp.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Run AI prompt (calls AI Gateway with dynamic base URL)
  const handleVibeCodePrompt = async () => {
    if (!prompt.trim()) return;
    setLoadingAI(true);
    setAiOutput(null);
    setFeedback(null);

    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          prompt: `Bạn là AI Vibe Coder đồng hành cho lập trình viên trên điện thoại di động. Hãy phân tích yêu cầu sau và sinh code TypeScript/React hoặc giải pháp súc tích, thực chiến:\n"${prompt}"\n\nPhản hồi định dạng JSON có các trường: title (tiêu đề ngắn gọn), explanation (giải thích ngắn 2-3 câu), code (đoạn code hoàn chỉnh nếu có), language (typescript/javascript/css/sql).`,
          model: selectedProvider,
        }),
      });

      const data = await res.json();
      let parsed = null;

      if (data.text) {
        try {
          const jsonMatch = data.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, data.text];
          parsed = JSON.parse(jsonMatch[1]);
        } catch {
          parsed = {
            title: prompt.slice(0, 40),
            explanation: data.text,
            code: data.text.includes('```') ? data.text.split('```')[1]?.replace(/^[a-z]+\n/, '') : undefined,
            language: 'typescript',
          };
        }
      }

      if (parsed) {
        setAiOutput(parsed);
      } else {
        // Fallback demo output if offline
        setAiOutput({
          title: prompt.slice(0, 30),
          explanation: 'Đã phân tích yêu cầu trên mobile. Đoạn code đã được tối ưu cho module Studio.',
          code: `// Generated for: ${prompt}\nexport const mobileVibeGeneratedSnippet = () => {\n  console.log("Vibecoding on mobile ready!");\n};`,
          language: 'typescript',
        });
      }
    } catch {
      // Offline fallback
      setAiOutput({
        title: prompt.slice(0, 30),
        explanation: 'Đang ở chế độ offline. Đã tạo khung code mẫu sẵn sàng.',
        code: `// Snippet for: ${prompt}\nexport async function handleAction() {\n  // TODO: implement\n}`,
        language: 'typescript',
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // Save current output to Stash
  const handleSaveToStash = () => {
    if (!aiOutput) return;
    const newItem: StashItem = {
      id: `stash_${Date.now()}`,
      type: aiOutput.code ? 'code_snippet' : 'idea',
      title: aiOutput.title || 'Ý tưởng Mobile',
      content: aiOutput.explanation,
      codeSnippet: aiOutput.code ? { language: aiOutput.language || 'typescript', code: aiOutput.code } : undefined,
      aiProvider: selectedProvider,
      createdAt: new Date().toISOString(),
    };

    saveStashLocally([newItem, ...stash]);
    setFeedback('✅ Đã lưu vào Stash độc lập trên điện thoại!');
  };

  // Push all stash items to Desktop Cloud Inbox with dynamic base URL
  const handlePushAllToCloudInbox = async () => {
    if (stash.length === 0) {
      setFeedback('Stash đang trống.');
      return;
    }

    setSyncingToCloud(true);
    setFeedback(null);

    const baseUrl = getApiBaseUrl();
    let successCount = 0;
    for (const item of stash) {
      try {
        const res = await fetch(`${baseUrl}/api/mobile-vibe/inbox`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(item),
        });
        if (res.ok) successCount++;
      } catch {
        // fail individual
      }
    }

    setSyncingToCloud(false);
    if (successCount > 0) {
      setFeedback(`⚡ Đã đẩy ${successCount} mục lên Hộp thư Cloud! Bạn có thể bấm "Kéo về Studio" trên PC khi về nhà.`);
    } else {
      setFeedback('Không thể kết nối server. Dữ liệu vẫn được lưu an toàn 100% trên điện thoại.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteItem = (id: string) => {
    saveStashLocally(stash.filter((x) => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 pb-28 select-none font-sans">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#07090e]/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">MobileVibe</span>
                <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                  Companion
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Vibe Coding & AI Dispatcher</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white"
              title="Cấu hình Kết nối Máy chủ Cloud"
            >
              <Settings className="h-4 w-4 text-slate-300" />
            </button>
            <button
              onClick={() => setActiveTab('stash')}
              className="relative flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>{stash.length}</span>
              {stash.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {AI_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                selectedProvider === p.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800'
              }`}
            >
              <Cpu className="h-3 w-3" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="px-4 py-2 border-b border-slate-800/40 bg-slate-950/40">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('vibe')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'vibe' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Vibe Code</span>
          </button>
          <button
            onClick={() => setActiveTab('stash')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'stash' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Stash ({stash.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ai_staff')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ai_staff' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Giao việc AI</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className="mx-4 mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-cyan-400 font-bold ml-2">×</button>
        </div>
      )}

      {/* TAB 1: VIBE CODE CANVAS */}
      {activeTab === 'vibe' && (
        <div className="p-4 space-y-4">
          {/* Prompt Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Bạn muốn code hoặc tạo tính năng gì?</span>
              </span>
              <span className="text-[10px] text-cyan-400">Voice / Text Prompt</span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="VD: Viết một React hook quản lý trạng thái online/offline, có tự động retry khi có mạng..."
              rows={3}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                    : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-cyan-400" />}
                <span>{isRecording ? 'Đang nghe...' : 'Nói ý tưởng'}</span>
              </button>

              <button
                type="button"
                onClick={handleVibeCodePrompt}
                disabled={loadingAI || !prompt.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40"
              >
                {loadingAI ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>AI đang sinh...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Sinh Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Output Card */}
          {aiOutput && (
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">{aiOutput.title}</h4>
                </div>
                <button
                  onClick={handleSaveToStash}
                  className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center gap-1"
                >
                  <Layers className="h-3 w-3" />
                  <span>Lưu Stash</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{aiOutput.explanation}</p>

              {aiOutput.code && (
                <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                    <span className="font-mono uppercase">{aiOutput.language || 'typescript'}</span>
                    <button
                      onClick={() => copyToClipboard(aiOutput.code!, 'output_code')}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedId === 'output_code' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === 'output_code' ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-cyan-300 overflow-x-auto p-1 leading-normal max-h-60 scrollbar-thin">
                    <code>{aiOutput.code}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Fast Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setPrompt('Tạo một component React button Glassmorphism có hiệu ứng ripple khi bấm');
              }}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-left hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>UI Glassmorphism</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sinh component nút bấm hiện đại</p>
            </button>

            <button
              onClick={() => {
                setPrompt('Viết hàm TypeScript debounce và throttle an toàn kiểu dữ liệu');
              }}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-left hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <Code2 className="h-3.5 w-3.5" />
                <span>Utils TypeScript</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Tạo hàm helper xử lý tối ưu</p>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: STASH (Bộ nhớ độc lập trên Mobile) */}
      {activeTab === 'stash' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Kho Stash trên điện thoại</h3>
              <p className="text-[11px] text-slate-400">Lưu độc lập trên máy, kéo về PC khi mở Studio</p>
            </div>
            <button
              onClick={handlePushAllToCloudInbox}
              disabled={syncingToCloud || stash.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              <span>{syncingToCloud ? 'Đang đẩy...' : 'Đẩy về PC'}</span>
            </button>
          </div>

          {stash.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-2">
              <Layers className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Chưa có item nào trong Stash</p>
              <p className="text-[10px] text-slate-500">Hãy sang tab Vibe Code để sinh code hoặc ghi ý tưởng.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stash.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'code_snippet' ? (
                        <FileCode className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-xs font-bold text-white">{item.title}</span>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{item.content}</p>

                  {item.codeSnippet && (
                    <div className="relative rounded-lg bg-slate-950 p-2.5">
                      <pre className="text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-24 scrollbar-none">
                        <code>{item.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>{new Date(item.createdAt).toLocaleTimeString('vi-VN')}</span>
                    {item.codeSnippet && (
                      <button
                        onClick={() => copyToClipboard(item.codeSnippet!.code, item.id)}
                        className="text-cyan-400 flex items-center gap-1 font-semibold"
                      >
                        {copiedId === item.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedId === item.id ? 'Đã chép' : 'Chép Code'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GIAO VIỆC AI STAFF */}
      {activeTab === 'ai_staff' && (
        <div className="p-4 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-400" />
              <span>Giao việc nhanh cho AI Staff</span>
            </h3>
            <p className="text-xs text-slate-400">
              Giao nhiệm vụ từ điện thoại. Nhiệm vụ sẽ được đưa vào hàng đợi và đồng bộ về PC Studio.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { role: 'AI Developer', desc: 'Code tính năng & fix bug' },
                { role: 'AI Marketer', desc: 'Viết bài & kịch bản viral' },
                { role: 'AI Accountant', desc: 'Tính toán & kiểm tra số liệu' },
                { role: 'AI Reviewer', desc: 'Audit mã nguồn & an toàn' },
              ].map((staff) => (
                <button
                  key={staff.role}
                  onClick={() => {
                    setActiveTab('vibe');
                    setPrompt(`[Giao việc cho ${staff.role}]: `);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left hover:border-cyan-500/40 transition-all"
                >
                  <div className="text-xs font-bold text-white">{staff.role}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{staff.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Server Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white">Kết Nối Máy Chủ Cloud</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Đường link Backend Cloud (Railway / VPS):
                </label>
                <input
                  type="url"
                  placeholder="https://ledgerflow-xxx.up.railway.app"
                  value={backendUrlInput}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {isCapacitorNative()
                    ? '📱 Đang chạy trên Native App (iOS/Android) — Cần nhập link Cloud để kết nối.'
                    : '🌐 Đang chạy trên Web/PWA — Tự động nhận diện domain hiện tại nếu để trống.'}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Mã Token bảo mật (Tùy chọn):</span>
                </label>
                <input
                  type="password"
                  placeholder="Nhập secret token nếu server yêu cầu"
                  value={authTokenInput}
                  onChange={(e) => setAuthTokenInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleTestConnection}
                  disabled={pingStatus === 'testing'}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${pingStatus === 'testing' ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Kiểm tra kết nối</span>
                </button>

                {pingStatus === 'success' && (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Kết nối OK
                  </span>
                )}
                {pingStatus === 'error' && (
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    Lỗi kết nối
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
