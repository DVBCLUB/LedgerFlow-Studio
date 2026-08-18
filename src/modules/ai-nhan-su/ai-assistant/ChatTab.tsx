import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Cpu, Send, Loader2, Zap, LogIn, Copy, RotateCcw, ChevronDown, Check, FileText } from 'lucide-react';
import { openWebAIProfileLogin, type WebAIProfile } from '../../../utils/assistantApi';
import ArtifactViewerModal from './ArtifactViewerModal';

// ─── Markdown Renderer ─────────────────────────────────────────────────────────
// Defined at module level (not inside component) so it is never recreated on re-render.

// ─── Prompt Templates ─────────────────────────────────────────────────────────
const PROMPT_TEMPLATES = [
  { label: '🔍 Giải thích file này', value: 'Hãy đọc và giải thích chi tiết file này cho tôi, bao gồm mục đích, cách hoạt động và các điểm cần lưu ý.' },
  { label: '🧪 Viết Unit Test', value: 'Viết unit test đầy đủ cho module/function này, bao gồm các edge case và mock cần thiết.' },
  { label: '🔧 Review & Cải tiến Code', value: 'Review toàn bộ đoạn code này, chỉ ra các vấn đề về performance, security, readability và đề xuất cải tiến cụ thể.' },
  { label: '🐛 Debug lỗi này', value: 'Tôi đang gặp lỗi sau. Hãy phân tích nguyên nhân và đưa ra giải pháp cụ thể:\n\n[Dán lỗi vào đây]' },
  { label: '📝 Viết Documentation', value: 'Viết documentation đầy đủ (JSDoc/TSDoc) cho toàn bộ file này, bao gồm mô tả hàm, params, return value và ví dụ sử dụng.' },
  { label: '♻️ Refactor Code', value: 'Refactor đoạn code này để: (1) giảm độ phức tạp, (2) tăng khả năng tái sử dụng, (3) tuân thủ SOLID principles.' },
  { label: '⚡ Tối ưu Performance', value: 'Phân tích và tối ưu performance cho đoạn code này. Chỉ ra bottleneck và đề xuất giải pháp cụ thể với ví dụ code.' },
  { label: '🛡️ Kiểm tra Security', value: 'Kiểm tra toàn bộ bảo mật của code này. Tìm các lỗ hổng OWASP Top 10, injection, XSS, CSRF và đề xuất cách khắc phục.' },
  { label: '🏗️ Thiết kế Architecture', value: 'Thiết kế kiến trúc cho tính năng mới. Bao gồm sơ đồ component, data flow và các design pattern phù hợp.\n\n[Mô tả tính năng ở đây]' },
  { label: '🔄 Migration Code', value: 'Hãy giúp tôi migrate/convert đoạn code này sang công nghệ mới, giữ nguyên logic business:\n\n[Mô tả nguồn và đích]' },
] as const;

// ─── Slash Commands ──────────────────────────────────────────────────────────
const SLASH_COMMANDS = [
  {
    command: '/goal',
    label: '/goal — Chế độ Tự động hóa liên tục (Autonomous Mode)',
    description: 'AI tự động lập kế hoạch và thực thi liên tục đến khi đạt mục tiêu.',
    promptTemplate: '🎯 [MỤC TIÊU TỰ ĐỘNG]: Hãy tự động lập kế hoạch từng bước, giải quyết và sửa mã nguồn cho mục tiêu sau:\n\n'
  },
  {
    command: '/schedule',
    label: '/schedule — Đặt lịch & Hẹn giờ Tác vụ AI',
    description: 'Thiết lập hẹn giờ hoặc cron job chạy ngầm cho AI.',
    promptTemplate: '⏰ [ĐẶT LỊCH TÁC VỤ]: Hãy thiết lập tác vụ hẹn giờ chạy ngầm sau 60 giây để kiểm tra:\n\n'
  },
  {
    command: '/grill-me',
    label: '/grill-me — Phỏng vấn ngược lại người dùng (Plan Alignment)',
    description: 'AI sẽ đặt các câu hỏi trắc nghiệm để chốt phương án thiết kế trước khi sửa code.',
    promptTemplate: '❓ [PHỎNG VẤN THIẾT KẾ]: Đừng viết code ngay. Hãy đặt cho tôi 3-5 câu hỏi lựa chọn phương án (questionCard) để thống nhất kiến trúc trước!\n\n'
  },
  {
    command: '/learn',
    label: '/learn — Ghi nhớ Quy tắc & Tri thức Dự án mới',
    description: 'Lưu quy tắc hoặc bài học mới vào Knowledge Graph của phần mềm.',
    promptTemplate: '🧠 [GHI NHỚ TRI THỨC MỚI]: Hãy lưu quy chuẩn sau vào Knowledge Graph bộ nhớ dự án:\n\n'
  },
] as const;

export interface ExtractedCodeFile {
  targetFile: string;
  code: string;
  language: string;
}

export function extractAllCodeBlocks(text: string): ExtractedCodeFile[] {
  const blocks: ExtractedCodeFile[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const language = match[1]?.toLowerCase() || 'typescript';
    const code = match[2].trim();
    const precedingText = text.substring(Math.max(0, match.index - 120), match.index);
    const pathMatch = precedingText.match(/(?:file|path|src)\s*:\s*([^\n\r]+)/i) || precedingText.match(/\/\/\s*([^\n\r]+\.(?:tsx|ts|js|jsx|css|json|py|sh))/i);
    const targetFile = pathMatch ? pathMatch[1].trim() : `src/app/Component_${blocks.length + 1}.${language === 'typescript' || language === 'tsx' ? 'tsx' : 'ts'}`;
    blocks.push({ targetFile, code, language });
  }

  return blocks;
}



/** Inline markdown — bold, italic, inline code */
function inlineMarkdown(text: string, baseKey: number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(__([^_]+)__)|(_([^_]+)_)/g;
  let last = 0;
  let match;
  let k = baseKey * 100;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={k++}>{text.slice(last, match.index)}</span>);
    }
    if (match[1]) {
      parts.push(<code key={k++} className="bg-slate-800 text-emerald-300 px-1 rounded text-[10px] font-mono">{match[1].slice(1, -1)}</code>);
    } else if (match[3]) {
      parts.push(<strong key={k++} className="font-black text-white">{match[3]}</strong>);
    } else if (match[5]) {
      parts.push(<em key={k++} className="italic text-slate-300">{match[5]}</em>);
    } else if (match[7]) {
      parts.push(<strong key={k++} className="font-black text-white">{match[7]}</strong>);
    } else if (match[9]) {
      parts.push(<em key={k++} className="italic text-slate-300">{match[9]}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/** Lightweight block markdown renderer — no external deps */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={key++} className="my-2 rounded-lg overflow-x-auto bg-slate-950 border border-white/10 p-3 text-[11px] leading-relaxed font-mono text-emerald-300 whitespace-pre">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1 ? 'text-sm font-black text-violet-300 mt-2 mb-1'
        : level === 2 ? 'text-xs font-black text-violet-200 mt-2 mb-0.5'
        : 'text-xs font-bold text-slate-200 mt-1';
      nodes.push(<div key={key++} className={cls}>{headingMatch[2]}</div>);
      i++;
      continue;
    }

    // Bullet list item
    const bulletMatch = line.match(/^\s*[-*+]\s+(.+)/);
    if (bulletMatch) {
      nodes.push(
        <div key={key++} className="flex gap-2 text-xs">
          <span className="text-violet-400 shrink-0 mt-0.5">•</span>
          <span>{inlineMarkdown(bulletMatch[1], key++)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list item
    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      nodes.push(
        <div key={key++} className="flex gap-2 text-xs">
          <span className="text-violet-400 shrink-0 font-bold">{numberedMatch[1]}.</span>
          <span>{inlineMarkdown(numberedMatch[2], key++)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="border-white/10 my-2" />);
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-1" />);
      i++;
      continue;
    }

    // Paragraph line with inline formatting
    nodes.push(
      <div key={key++} className="text-xs leading-relaxed">
        {inlineMarkdown(line, key++)}
      </div>
    );
    i++;
  }
  return nodes;
}

// ──────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed?: string;
  timestamp: string;
  isError?: boolean;
  runbookSessionId?: string;
  autonomousExecution?: {
    intentDomain: string;
    assignedAgent: string;
    agentEmoji: string;
    steps: Array<{ title: string; status: 'completed' | 'running' | 'queued' | 'failed' }>;
    autoAppliedFile?: string;
  };
  debateCard?: {
    proposerAgent: string;
    proposerIdea: string;
    criticAgent: string;
    criticFeedback: string;
    consensusOutput: string;
  };
  questionCard?: {
    question: string;
    options: string[];
    isMultiSelect?: boolean;
  };
}

interface ChatTabProps {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  chatLoading: boolean;
  sendChat: () => void;
  engineMode: 'api' | 'web_automation' | 'fabric';
  setEngineMode: (val: 'api' | 'web_automation' | 'fabric') => void;
  webPlatform: string;
  setWebPlatform: (val: string) => void;
  selectedProfileId: string;
  setSelectedProfileId: (val: string) => void;
  webAIProfiles: WebAIProfile[];
  headlessEnabled: boolean;
  setHeadlessEnabled: (val: boolean) => void;
  debateModeEnabled: boolean;
  setDebateModeEnabled: (val: boolean) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onApplyCode?: (file: string, code: string) => void;
}

export default function ChatTab({
  messages,
  chatInput,
  setChatInput,
  chatLoading,
  sendChat,
  engineMode,
  setEngineMode,
  webPlatform,
  setWebPlatform,
  selectedProfileId,
  setSelectedProfileId,
  webAIProfiles,
  headlessEnabled,
  setHeadlessEnabled,
  debateModeEnabled,
  setDebateModeEnabled,
  chatEndRef,
  onApplyCode,
}: ChatTabProps) {
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [artifactModal, setArtifactModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    onProceed?: () => void;
  }>({ isOpen: false, title: '', content: '' });
  const inputRef = useRef<HTMLInputElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K → focus chat input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Esc → close template dropdown
      if (e.key === 'Escape') setShowTemplates(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Close template dropdown on outside click ──────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (templatesRef.current && !templatesRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Copy message to clipboard ─────────────────────────────────────────────
  const handleCopy = useCallback(async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const el = document.createElement('textarea');
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  }, []);

  // ── Retry: re-fill input with user message and send ───────────────────────
  const handleRetry = useCallback((content: string) => {
    setChatInput(content);
    setTimeout(() => sendChat(), 50);
  }, [setChatInput, sendChat]);



  const getRecommendedPlatformAdvice = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'gemini': return '✨ Gemini: Phân tích kiến trúc & Codebase sâu';
      case 'chatgpt': return '✨ ChatGPT: Viết Code & Refactor đa ngôn ngữ';
      case 'claude': return '✨ Claude: Logic thuật toán & Đọc văn bản dài';
      case 'deepseek': return '✨ DeepSeek: Logic siêu tốc & Debug chuyên sâu';
      default: return '⚡ Tự động tối ưu mô hình theo tác vụ';
    }
  };

  const handleQuickLogin = async () => {
    setQuickLoginLoading(true);
    setLoginNotice(`Đang mở Chrome để đăng nhập ${webPlatform.toUpperCase()}... Hãy đăng nhập trên trình duyệt vừa mở và ĐÓNG nó lại khi hoàn tất!`);
    try {
      const id = selectedProfileId || 'default';
      const res = await openWebAIProfileLogin(id, webPlatform);
      if (res.ok) {
        setLoginNotice(`✓ Đã lưu session đăng nhập cho ${webPlatform.toUpperCase()}. Bạn có thể gửi câu hỏi ngay!`);
      } else {
        setLoginNotice(`❌ Lỗi đăng nhập: ${res.error || 'Chưa hoàn tất đăng nhập.'}`);
      }
    } catch (err: any) {
      setLoginNotice(`❌ Không mở được Chrome: ${err.message}`);
    } finally {
      setQuickLoginLoading(false);
    }
  };
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role !== 'user' && (
              <div className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center ${
                msg.role === 'system' ? 'bg-violet-950/60 border border-violet-700/40' : 'bg-slate-900 border border-white/10'
              }`}>
                <Bot className="h-4 w-4 text-violet-400" />
              </div>
            )}
            <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed group relative ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-sm shadow-md'
                : msg.isError
                  ? 'bg-rose-950/75 border border-rose-600/50 text-rose-100 shadow-xl'
                  : 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-bl-sm shadow-md'
            }`}>
              {/* World-Class Autonomous Robot Execution Card */}
              {msg.autonomousExecution && (
                <div className="mb-3 p-3 rounded-xl bg-slate-950/80 border border-violet-500/30 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-violet-300">
                      <span>{msg.autonomousExecution.agentEmoji}</span>
                      <span>HỆ THỐNG AI & ROBOT TỰ ĐỘNG VẬN HÀNH</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 uppercase">
                      {msg.autonomousExecution.intentDomain}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-300">
                    🤖 Agent phụ trách: <span className="text-cyan-300 font-black">{msg.autonomousExecution.assignedAgent}</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {msg.autonomousExecution.steps.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                        <span className={st.status === 'completed' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          {st.status === 'completed' ? '✓' : '🔄'}
                        </span>
                        <span className="font-mono">{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* World-Class Multi-Agent Debate & Consensus Card */}
              {msg.debateCard && (
                <div className="mb-3 p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <div className="flex items-center gap-2 text-xs font-black text-cyan-300">
                      <span>⚔️</span>
                      <span>DIỄN ĐÀN AI TỰ TRANH LUẬN & PHẢN BIỆN (MULTI-AGENT DEBATE)</span>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                      Consensus 100% Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/30 space-y-1">
                      <div className="font-bold text-violet-300 flex items-center gap-1">
                        <span>🤖</span> {msg.debateCard.proposerAgent} (Đề xuất)
                      </div>
                      <p className="text-slate-300 text-[10px] leading-relaxed">{msg.debateCard.proposerIdea}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1">
                      <div className="font-bold text-rose-300 flex items-center gap-1">
                        <span>🛡️</span> {msg.debateCard.criticAgent} (Phản biện)
                      </div>
                      <p className="text-rose-200 text-[10px] leading-relaxed">{msg.debateCard.criticFeedback}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                    <div className="font-bold text-emerald-300 text-[11px] flex items-center gap-1">
                      <span>⚖️</span> Phương án thống nhất sau tranh luận:
                    </div>
                    <p className="text-emerald-100 text-[10px] leading-relaxed font-medium">{msg.debateCard.consensusOutput}</p>
                  </div>
                </div>
              )}

              {/* Interactive Choice / Question Modal Card */}
              {msg.questionCard && (
                <div className="mb-3 p-3 rounded-2xl bg-violet-950/80 border border-violet-500/40 space-y-2.5 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-black text-violet-200 border-b border-violet-500/20 pb-2">
                    <span className="text-base">❓</span>
                    <span>{msg.questionCard.question}</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {msg.questionCard.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setChatInput(`Lựa chọn của tôi: ${opt}`);
                          setTimeout(() => sendChat(), 50);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-violet-600 text-slate-200 hover:text-white text-xs font-bold transition-all border border-white/10 flex items-center justify-between group cursor-pointer"
                      >
                        <span>{opt}</span>
                        <span className="text-[10px] opacity-60 group-hover:opacity-100 font-mono">Bấm để chọn ➔</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-0.5 leading-relaxed">{renderMarkdown(msg.content)}</div>

              {/* Multi-File Code Apply & Diff Card */}
              {msg.role === 'assistant' && !msg.isError && msg.content.includes('```') && (() => {
                const blocks = extractAllCodeBlocks(msg.content);
                if (blocks.length <= 1) return null;
                return (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-emerald-500/40 space-y-2 shadow-xl">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-300">
                        <span>⚡</span>
                        <span>Multi-File Diff Preview — Phát hiện {blocks.length} file thay đổi</span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {blocks.length} files
                      </span>
                    </div>
                    <div className="space-y-1">
                      {blocks.map((b, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-900/60 px-2 py-1.5 rounded-lg border border-white/5">
                          <span className="text-emerald-300 font-bold">📄 {b.targetFile}</span>
                          <span className="text-slate-400">({b.code.split('\n').length} dòng code)</span>
                        </div>
                      ))}
                    </div>
                    {onApplyCode && (
                      <button
                        type="button"
                        onClick={() => {
                          blocks.forEach(b => onApplyCode(b.targetFile, b.code));
                        }}
                        className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg transition-all shadow-md shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>⚡ Tự động áp dụng tất cả {blocks.length} file vào máy</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* World-Class Robot 1-Click Code Apply & Artifact Viewer Card */}
              {msg.role === 'assistant' && !msg.isError && msg.content.length > 150 && (
                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-2 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                    <Zap className="h-3 w-3 animate-pulse text-emerald-400" />
                    <span>Robot nhận diện báo cáo / khối mã nguồn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const match = msg.content.match(/(?:file|path|src)\s*:\s*([^\n\r]+)/i) || msg.content.match(/```(?:\w+)?\s*\n\/\/\s*([^\n\r]+)/);
                        const targetFile = match ? match[1].trim() : 'src/app/ErpApp.tsx';
                        const codeBlock = (msg.content.match(/```[\s\S]*?```/g) || [])[0]?.replace(/```\w*\n?|```/g, '') || msg.content;
                        setArtifactModal({
                          isOpen: true,
                          title: '📄 Kế hoạch & Báo cáo Artifact',
                          content: msg.content,
                          onProceed: onApplyCode ? () => onApplyCode(targetFile, codeBlock) : undefined,
                        });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-violet-950/80 hover:bg-violet-900 text-violet-200 text-[10px] font-bold rounded-lg border border-violet-500/30 transition-all cursor-pointer shadow-sm"
                    >
                      <FileText className="h-3 w-3 text-violet-400" />
                      <span>📄 Xem Artifact (Modal)</span>
                    </button>
                    {onApplyCode && msg.content.includes('```') && (
                      <button
                        type="button"
                        onClick={() => {
                          const match = msg.content.match(/(?:file|path|src)\s*:\s*([^\n\r]+)/i) || msg.content.match(/```(?:\w+)?\s*\n\/\/\s*([^\n\r]+)/);
                          const targetFile = match ? match[1].trim() : 'src/app/ErpApp.tsx';
                          const codeBlock = (msg.content.match(/```[\s\S]*?```/g) || [])[0]?.replace(/```\w*\n?|```/g, '') || msg.content;
                          onApplyCode(targetFile, codeBlock);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <span>⚡ Tự động áp dụng Code</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Interactive Quick Action Error Resolver Card */}
              {msg.isError && (
                <div className="mt-3 pt-2.5 border-t border-rose-800/40 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Hành động khắc phục nhanh:</span>
                  
                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    disabled={quickLoginLoading}
                    className="flex items-center gap-1 px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                  >
                    {quickLoginLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />}
                    <span>🔑 Mở Chrome đăng nhập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEngineMode('fabric')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Zap className="h-3 w-3" />
                    <span>⚡ Chuyển sang AI Fabric (Auto Fallback)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEngineMode('api')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 transition-colors"
                  >
                    <Cpu className="h-3 w-3 text-cyan-400" />
                    <span>Dùng API Gateway</span>
                  </button>
                </div>
              )}

              {msg.modelUsed && !msg.isError && (
                <div className="mt-1.5 text-[10px] text-text-tertiary flex items-center gap-1">
                  <Cpu className="h-2.5 w-2.5" /> {msg.modelUsed}
                </div>
              )}

              {/* Copy + Retry action buttons — visible on hover */}
              <div className="mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={() => handleCopy(msg.id, msg.content)}
                  title="Sao chép nội dung"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold transition-all border border-white/5"
                >
                  {copiedMsgId === msg.id
                    ? <><Check className="h-2.5 w-2.5 text-emerald-400" /><span className="text-emerald-400">Đã chép!</span></>
                    : <><Copy className="h-2.5 w-2.5" /><span>Sao chép</span></>}
                </button>
                {msg.role === 'user' && (
                  <button
                    type="button"
                    onClick={() => handleRetry(msg.content)}
                    disabled={chatLoading}
                    title="Gửi lại câu hỏi này"
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 text-[10px] font-bold transition-all border border-white/5 disabled:opacity-40"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /><span>Gửi lại</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-xl bg-violet-900/40 border border-violet-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Bot className="h-4 w-4 text-violet-300 animate-pulse" />
            </div>
            <div className="max-w-[85%] relative overflow-hidden rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 shadow-2xl">
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
              <div className="flex items-center gap-3 relative z-10">
                <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                <span className="text-xs font-bold text-violet-200 tracking-wide">AI đang tổng hợp dữ liệu...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input controls */}
      <div className="px-3 pb-3 shrink-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-secondary bg-bg-primary/40 p-2 rounded-xl border border-slate-900">
          <div className="flex items-center gap-1.5">
            <span className="font-black uppercase tracking-[0.12em] text-text-tertiary">Execution:</span>
            <select
              value={engineMode}
              onChange={e => setEngineMode(e.target.value as 'api' | 'web_automation' | 'fabric')}
              className="bg-slate-950 border border-border-primary rounded-lg px-2.5 py-1 text-xs text-text-secondary outline-none font-bold focus:border-violet-500"
            >
              <option value="api">API Local (AI Gateway)</option>
              <option value="web_automation">Browser Automation (Web AI)</option>
              <option value="fabric">⚡ AI Fabric (API→Web→Local)</option>
            </select>
          </div>
          {engineMode === 'fabric' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>Fabric Fallback: API → Web → Local</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-md hidden md:flex" title="Tự động nạp tri thức dự án từ Knowledge Graph">
                <span>🧠 Tri thức KI Auto-Enriched</span>
              </div>
            </div>
          )}
          {(engineMode === 'web_automation' || engineMode === 'fabric') && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-black uppercase tracking-[0.12em] text-text-tertiary">Platform:</span>
                <select
                  value={webPlatform}
                  onChange={e => setWebPlatform(e.target.value)}
                  className="bg-slate-950 border border-border-primary rounded-lg px-2.5 py-1 text-[10px] text-text-secondary outline-none font-bold focus:border-violet-500"
                >
                  <option value="chatgpt">ChatGPT</option>
                  <option value="gemini">Gemini</option>
                  <option value="claude">Claude</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="grok">Grok</option>
                  <option value="copilot">Copilot</option>
                </select>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md hidden lg:inline-block">
                  {getRecommendedPlatformAdvice(webPlatform)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black uppercase tracking-[0.12em] text-text-tertiary">Tài khoản (Profile):</span>
                <select
                  value={selectedProfileId}
                  onChange={e => setSelectedProfileId(e.target.value)}
                  className="bg-slate-950 border border-border-primary rounded-lg px-2.5 py-1 text-[10px] text-text-secondary outline-none font-bold focus:border-violet-500"
                >
                  <option value="">-- Mặc định --</option>
                  {(webAIProfiles || [])
                    .filter(p => p.platform === (webPlatform || '').toLowerCase())
                    .map(p => (
                      <option key={p.id} value={p.id} disabled={!p.enabled || p.status === 'quota'}>
                        {p.name} ({p.status})
                      </option>
                    ))
                  }
                </select>
                <button
                  type="button"
                  onClick={handleQuickLogin}
                  disabled={quickLoginLoading}
                  className="flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-text-primary text-[10px] font-bold rounded-md transition-colors"
                  title="Mở cửa sổ Chrome để đăng nhập tài khoản Web AI một lần"
                >
                  {quickLoginLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />}
                  <span>🔑 Đăng nhập Chrome</span>
                </button>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={debateModeEnabled}
                    onChange={e => setDebateModeEnabled(e.target.checked)}
                    className="rounded border-border-primary bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-opacity-25"
                  />
                  <span className="font-black uppercase tracking-[0.12em] text-cyan-400">⚔️ AI Tranh luận</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={headlessEnabled}
                    onChange={e => setHeadlessEnabled(e.target.checked)}
                    className="rounded border-border-primary bg-slate-950 text-violet-500 focus:ring-violet-500 focus:ring-opacity-25"
                  />
                  <span className="font-black uppercase tracking-[0.12em] text-text-tertiary">Chạy ẩn (Headless)</span>
                </label>
              </div>
            </>
          )}
        </div>

        {loginNotice && (
          <div className="rounded-xl border border-violet-500/40 bg-violet-950/40 p-2.5 text-[10px] leading-5 text-violet-200 font-semibold flex items-center justify-between gap-2">
            <span>{loginNotice}</span>
            <button onClick={() => setLoginNotice(null)} className="text-violet-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {engineMode === 'web_automation' && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-2.5 text-[10px] leading-5 text-violet-300 font-semibold flex items-center justify-between gap-2">
            <div>
              💡 <b>Tự động hóa Web AI:</b> {selectedProfileId ? 'Đang dùng Profile đã chọn.' : 'Đang dùng Profile mặc định.'} Nếu chưa từng đăng nhập tài khoản Google/Gemini/ChatGPT trên Chrome, vui lòng bấm nút <b>🔑 Đăng nhập Chrome</b> ở trên để thực hiện 1 lần.
            </div>
          </div>
        )}

        {/* Prompt Template Library */}
        <div ref={templatesRef} className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates(v => !v)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-violet-300 transition-colors px-1 py-0.5"
          >
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Prompt mẫu nhanh</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showTemplates ? 'rotate-180' : ''}`} />
          </button>
          {showTemplates && (
            <div className="absolute bottom-full left-0 mb-2 w-80 bg-slate-950 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
              <div className="px-3 py-2 border-b border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-wider">⚡ Chọn template — điền vào ô chat</div>
              <div className="max-h-64 overflow-y-auto">
                {PROMPT_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setChatInput(t.value);
                      setShowTemplates(false);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] text-slate-300 hover:bg-violet-950/60 hover:text-violet-200 transition-colors border-b border-white/5 last:border-0 font-medium"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Slash Commands Auto-Suggest Popup */}
        {showSlashMenu && (
          <div className="relative z-50">
            <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-slate-950 border border-violet-500/40 rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-white/10 text-[10px] font-black text-violet-300 uppercase tracking-wider flex items-center justify-between">
                <span>⚡ Slash Commands (/ Lệnh tắt nhanh)</span>
                <span className="text-[9px] text-slate-500">Bấm chọn hoặc gõ tiếp</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {SLASH_COMMANDS.map((cmd, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setChatInput(cmd.promptTemplate);
                      setShowSlashMenu(false);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-violet-950/70 hover:text-white transition-colors border-b border-white/5 last:border-0 flex flex-col gap-0.5 group cursor-pointer"
                  >
                    <div className="font-bold text-violet-300 group-hover:text-cyan-300">{cmd.label}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{cmd.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 bg-bg-primary border border-border-secondary rounded-xl overflow-hidden focus-within:border-violet-500/60 transition-colors">
          <input
            ref={inputRef}
            value={chatInput}
            onChange={e => {
              const val = e.target.value;
              setChatInput(val);
              setShowSlashMenu(val.startsWith('/') && val.length < 15);
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') setShowSlashMenu(false);
              if (e.key === 'Enter' && !e.shiftKey) sendChat();
            }}
            placeholder="Hỏi về code, kiến trúc, debug... (Gõ / để dùng lệnh tắt)"
            className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none"
          />
          <button
            onClick={sendChat}
            disabled={chatLoading || !chatInput.trim()}
            className="px-3 text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
            title="Gửi (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="text-[9px] text-slate-600 flex gap-3 px-1">
          <span><kbd className="bg-slate-800/80 border border-white/10 px-1 py-0.5 rounded text-[9px]">Enter</kbd> gửi</span>
          <span><kbd className="bg-slate-800/80 border border-white/10 px-1 py-0.5 rounded text-[9px] text-amber-400">/</kbd> lệnh tắt</span>
          <span><kbd className="bg-slate-800/80 border border-white/10 px-1 py-0.5 rounded text-[9px]">Ctrl+K</kbd> focus</span>
          <span><kbd className="bg-slate-800/80 border border-white/10 px-1 py-0.5 rounded text-[9px]">Esc</kbd> đóng</span>
        </div>
      </div>

      {/* Artifact Viewer Modal */}
      <ArtifactViewerModal
        isOpen={artifactModal.isOpen}
        onClose={() => setArtifactModal(prev => ({ ...prev, isOpen: false }))}
        title={artifactModal.title}
        content={artifactModal.content}
        onProceed={artifactModal.onProceed}
      />
    </div>
  );
}
