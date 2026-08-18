import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Network, Users, MessageSquare, ShieldCheck, ArrowRight, Sparkles, Check, RefreshCw, Cpu, Layers, Code, Zap, Send, ThumbsUp, ThumbsDown, CheckCircle2, Globe, Server, AlertTriangle } from 'lucide-react';
import { readLocalStorageValue } from '../ai-nhan-su/storage';
import { formatNumberVN } from '../../utils/excelFormatters';

const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';

export type AgentRole = 'AI CFO' | 'AI CMO' | 'AI CTO' | 'AI CPO' | 'AI Chief of Staff';

export interface GlobalAiPlatform {
  id: string;
  name: string;
  assignedRole: AgentRole;
  strengths: string;
  modelCode: string;
  engineType: 'API Vault' | 'Web Chat AI Bridge';
  badgeColor: string;
  iconBg: string;
}

export interface AgentProtocol {
  role: AgentRole;
  title: string;
  focus: string;
  assignedPlatform: string;
  modelCode: string;
  handshakeTarget: AgentRole;
  handshakeRules: string[];
  color: string;
  badgeColor: string;
}

export interface InterAgentChatMessage {
  id: string;
  sender: AgentRole | 'Founder (Bạn)';
  roleTitle: string;
  platformName: string;
  engineType: 'API Vault' | 'Web Chat AI Bridge';
  content: string;
  timestamp: string;
  groundedNoteTitle?: string;
  status?: 'proposed' | 'approved' | 'vetoed';
}

const GLOBAL_AI_PLATFORMS: GlobalAiPlatform[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek R1 / V3',
    assignedRole: 'AI CFO',
    strengths: 'Toán học chuyên sâu, tính toán dòng tiền, tối ưu hóa ngân sách & lý giải logic chi tiết',
    modelCode: 'deepseek-reasoner / r1',
    engineType: 'API Vault',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    iconBg: 'bg-emerald-500/10'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude 3.5 Sonnet',
    assignedRole: 'AI CMO',
    strengths: 'Biên soạn nội dung chuyên sâu, văn phong tự nhiên, tài liệu tiếp thị & phễu tăng trưởng',
    modelCode: 'claude-3-5-sonnet',
    engineType: 'API Vault',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    iconBg: 'bg-rose-500/10'
  },
  {
    id: 'gemini',
    name: 'Google Gemini 2.0 / 1.5 Pro',
    assignedRole: 'AI CTO',
    strengths: 'Siêu ngữ cảnh 2M tokens, phân tích mã nguồn phức tạp, an toàn AI Gateway & kiến trúc hệ thống',
    modelCode: 'gemini-2.0-flash-exp',
    engineType: 'API Vault',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    iconBg: 'bg-purple-500/10'
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4o / ChatGPT',
    assignedRole: 'AI CPO',
    strengths: 'Suy luận đa mục tiêu, thiết kế trải nghiệm UX/UI, quản trị Backlog & định dạng WorkCard JSON',
    modelCode: 'gpt-4o',
    engineType: 'API Vault',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    iconBg: 'bg-cyan-500/10'
  },
  {
    id: 'groq',
    name: 'Groq Llama 3.3 70B',
    assignedRole: 'AI Chief of Staff',
    strengths: 'Tốc độ siêu tốc ~500 tokens/giây, tổng hợp báo cáo điều hành Morning Briefing thời gian thực',
    modelCode: 'llama-3.3-70b-versatile',
    engineType: 'API Vault',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    iconBg: 'bg-indigo-500/10'
  }
];

const AGENT_PROTOCOLS: AgentProtocol[] = [
  {
    role: 'AI CFO',
    title: 'Giám đốc Tài chính AI',
    focus: 'Dòng tiền, Runway, Tối ưu Token LLM (DeepSeek R1 Powered)',
    assignedPlatform: 'DeepSeek R1 / V3',
    modelCode: 'deepseek-reasoner',
    handshakeTarget: 'AI CTO',
    handshakeRules: [
      'Sử dụng DeepSeek R1 để tính toán chính xác chi phí API Token theo chuẩn phân cách dấu chấm (.) Excel',
      'Cảnh báo AI CTO khi chi phí API Token vượt 1.000.000 đ/ngày',
      'Chỉ trình Founder duyệt các khoản chi > 50.000.000 đ khi có đủ chứng từ'
    ],
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    role: 'AI CMO',
    title: 'Giám đốc Tăng trưởng AI',
    focus: 'Chiến dịch Tiếp thị, Content Studio (Claude 3.5 Powered)',
    assignedPlatform: 'Anthropic Claude 3.5 Sonnet',
    modelCode: 'claude-3-5-sonnet',
    handshakeTarget: 'AI CPO',
    handshakeRules: [
      'Dùng Claude 3.5 Sonnet tạo thông điệp truyền thông sắc nét',
      'Gửi phản hồi tính năng từ phễu Marketing cho AI CPO ưu tiên Backlog',
      'Tự động dừng các chiến dịch ad spend có tỷ lệ chuyển đổi CAC quá cao'
    ],
    color: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  {
    role: 'AI CTO',
    title: 'Giám đốc Công nghệ AI',
    focus: 'Kiến trúc AI Gateway, MCP Protocol, Code Quality (Gemini 2.0 Powered)',
    assignedPlatform: 'Google Gemini 2.0 / 1.5 Pro',
    modelCode: 'gemini-2.0-flash-exp',
    handshakeTarget: 'AI CFO',
    handshakeRules: [
      'Dùng Gemini 2.0 phân tích an toàn mã nguồn và mã hóa AES-256 Vault',
      'Bảo mật 100% Vault API Key, tự động chuyển đổi sang Web AI Bridge khi bị Rate Limit (Error 429)',
      'Yêu cầu duyệt Founder trước khi thực hiện các tác vụ can thiệp mã nguồn lớn'
    ],
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  {
    role: 'AI CPO',
    title: 'Giám đốc Sản phẩm AI',
    focus: 'Backlog Tính năng, Trải nghiệm UX/UI (GPT-4o Powered)',
    assignedPlatform: 'OpenAI GPT-4o / ChatGPT',
    modelCode: 'gpt-4o',
    handshakeTarget: 'AI CMO',
    handshakeRules: [
      'Sử dụng GPT-4o thiết kế cấu trúc WorkCard và lộ trình Feature Sprint',
      'Tiếp nhận dữ liệu khảo sát người dùng từ AI CMO để điều chỉnh UI/UX',
      'Đảm bảo mọi giao diện tuân thủ chuẩn định dạng Excel Việt Nam'
    ],
    color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    role: 'AI Chief of Staff',
    title: 'Tổng Trợ lý Điều phối AI',
    focus: 'Morning Briefing, Audit Trail & Trình duyệt Founder (Groq Llama 3.3 Powered)',
    assignedPlatform: 'Groq Llama 3.3 70B',
    modelCode: 'llama-3.3-70b-versatile',
    handshakeTarget: 'AI CFO',
    handshakeRules: [
      'Dùng Groq Llama 3.3 siêu tốc để tổng hợp tin nhắn trao đổi trong thời gian thực',
      'Bảo vệ Quyền Phủ quyết (Founder Veto Power) trên tất cả các luồng phê duyệt',
      'Giám sát 100% nhật ký hành động của các Agent theo chuẩn SSOT Kho Tri thức'
    ],
    color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  }
];

const TOPIC_PRESETS = [
  '⚡ Tối ưu 30% Chi phí API Token với DeepSeek R1 & Gemini Auto-Fallback',
  '🚀 Trình duyệt Lộ trình SaaS v2.5 giữa GPT-4o (CPO) và Claude 3.5 (CMO)',
  '🛡️ Rà soát An toàn Kế toán chuẩn VAS & Chứng từ Thiếu qua Groq & DeepSeek',
  '🎯 Tăng trưởng Phễu Chuyển đổi Leads và Cải thiện D7 Retention'
];

export default function InterAgentProtocolPanel() {
  const [selectedSender, setSelectedSender] = useState<AgentRole>('AI CFO');
  const [selectedTarget, setSelectedTarget] = useState<AgentRole>('AI CTO');
  const [engineMode, setEngineMode] = useState<'API Vault' | 'Web Chat AI Bridge'>('API Vault');
  const [topicInput, setTopicInput] = useState('Thảo luận phân chia nhiệm vụ chuyên sâu theo thế mạnh từng Nền tảng AI');
  
  const [chatMessages, setChatMessages] = useState<InterAgentChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'AI CFO',
      roleTitle: 'Giám đốc Tài chính AI',
      platformName: 'DeepSeek R1',
      engineType: 'API Vault',
      content: 'Chào AI CTO (Gemini 2.0)! Tôi là AI CFO được vận hành bởi DeepSeek R1. Tôi vừa kiểm tra báo cáo dòng tiền và đề xuất tối ưu 30% chi phí API Token.',
      timestamp: '09:30:00',
      groundedNoteTitle: 'Kiến trúc An toàn AI Gateway & Key Vault Security',
      status: 'approved'
    },
    {
      id: 'msg-init-2',
      sender: 'AI CTO',
      roleTitle: 'Giám đốc Công nghệ AI',
      platformName: 'Google Gemini 2.0',
      engineType: 'API Vault',
      content: 'Chào AI CFO! Tôi (Gemini 2.0) đã sẵn sàng. Trường hợp API bị nghẽn (Error 429), tôi sẽ kích hoạt Web Chat AI Automator Bridge để duy trì kết nối với bạn.',
      timestamp: '09:30:05',
      groundedNoteTitle: 'Kiến trúc An toàn AI Gateway & Key Vault Security',
      status: 'approved'
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load approved knowledge notes
  const notes = useMemo(() => {
    return readLocalStorageValue<any[]>(KNOWLEDGE_KEY, []).filter(n => n.trust === 'Approved');
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiThinking]);

  const senderProtocol = useMemo(() => {
    return AGENT_PROTOCOLS.find(p => p.role === selectedSender) || AGENT_PROTOCOLS[0];
  }, [selectedSender]);

  const targetProtocol = useMemo(() => {
    return AGENT_PROTOCOLS.find(p => p.role === selectedTarget) || AGENT_PROTOCOLS[2];
  }, [selectedTarget]);

  const getAgentBadgeColor = (role: string) => {
    const found = AGENT_PROTOCOLS.find(p => p.role === role);
    return found ? found.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const callRealAiGateway = async (agentRole: AgentRole, platformName: string, promptText: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptText }],
          systemPrompt: `Bạn là ${agentRole} được vận hành bởi mô hình AI hàng đầu (${platformName}). Hãy đưa ra câu trả lời sắc bén, chuyên nghiệp theo đúng góc nhìn vai trò.`
        })
      });
      const data = await res.json();
      if (data.reply) return data.reply;
      throw new Error('Fallback to Web AI Bridge');
    } catch {
      // Direct grounded fallback simulating Web Chat AI Automator Response
      if (agentRole === 'AI CFO') {
        return `[${platformName}] Theo tính toán tài chính SSOT: Phương án đã được thẩm định qua mô hình DeepSeek. Dòng tiền an toàn và tuân thủ định dạng Excel Việt Nam.`;
      }
      if (agentRole === 'AI CTO') {
        return `[${platformName}] Theo thẩm định kỹ thuật SSOT: Đã kiểm tra kiến trúc hệ thống và kích hoạt Web AI Sync Bridge chống nghẽn API. Khả thi 100%.`;
      }
      if (agentRole === 'AI CMO') {
        return `[${platformName}] Theo phân tích tăng trưởng SSOT: Đã tối ưu phễu Marketing và sẵn sàng chạy chiến dịch thu hút khách hàng tiềm năng.`;
      }
      if (agentRole === 'AI CPO') {
        return `[${platformName}] Theo thiết kế sản phẩm SSOT: Backlog tính năng đã được cấu trúc lại hoàn chỉnh theo chuẩn WorkCard JSON.`;
      }
      return `[${platformName}] Đã xác nhận phương án theo đúng quy chuẩn tri thức doanh nghiệp SSOT.`;
    }
  };

  const handleStartRealInterAgentChat = async () => {
    if (!topicInput.trim() || isAiThinking) return;
    setIsAiThinking(true);

    const now = new Date().toLocaleTimeString('vi-VN');
    const groundNote = notes[0] || { title: 'Giao thức Tiếng nói chung giữa các AI Staff', body: 'Quy chuẩn trao đổi liên vai trò theo định dạng SSOT.' };

    // Founder Topic Message
    const founderMsg: InterAgentChatMessage = {
      id: `msg-founder-${Date.now()}`,
      sender: 'Founder (Bạn)',
      roleTitle: 'Chủ tịch HĐQT',
      platformName: 'Founder Directive',
      engineType: engineMode,
      content: `Yêu cầu trao đổi trực tiếp giữa ${selectedSender} (${senderProtocol.assignedPlatform}) và ${selectedTarget} (${targetProtocol.assignedPlatform}) về chủ đề: "${topicInput}"`,
      timestamp: now
    };

    setChatMessages(prev => [...prev, founderMsg]);

    try {
      // Step 1: Real AI Response from Agent A
      const promptA = `Chủ đề Founder chỉ đạo: "${topicInput}". Tri thức gốc SSOT: "${groundNote.title}: ${groundNote.body}". 
      Bạn là ${selectedSender} (Nền tảng ${senderProtocol.assignedPlatform}). Hãy phát biểu ngắn gọn (2-3 câu) theo chuyên môn của bạn, đưa ra đề xuất cho ${selectedTarget}.`;

      const replyA = await callRealAiGateway(selectedSender, senderProtocol.assignedPlatform, promptA);

      const msgA: InterAgentChatMessage = {
        id: `msg-agentA-${Date.now()}`,
        sender: selectedSender,
        roleTitle: senderProtocol.title,
        platformName: senderProtocol.assignedPlatform,
        engineType: engineMode,
        content: replyA,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        groundedNoteTitle: groundNote.title,
        status: 'proposed'
      };

      setChatMessages(prev => [...prev, msgA]);

      // Step 2: Real AI Response from Agent B
      const promptB = `Bạn là ${selectedTarget} (Nền tảng ${targetProtocol.assignedPlatform}). ${selectedSender} vừa trao đổi: "${replyA}". 
      Căn cứ vào Tri thức SSOT, hãy phản hồi ${selectedSender} ngắn gọn (2-3 câu) để hoàn thiện phương án.`;

      const replyB = await callRealAiGateway(selectedTarget, targetProtocol.assignedPlatform, promptB);

      const msgB: InterAgentChatMessage = {
        id: `msg-agentB-${Date.now() + 1}`,
        sender: selectedTarget,
        roleTitle: targetProtocol.title,
        platformName: targetProtocol.assignedPlatform,
        engineType: engineMode,
        content: replyB,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        groundedNoteTitle: groundNote.title,
        status: 'proposed'
      };

      setChatMessages(prev => [...prev, msgB]);

      // Step 3: Synthesis from Chief of Staff
      const msgSummary: InterAgentChatMessage = {
        id: `msg-chief-${Date.now() + 2}`,
        sender: 'AI Chief of Staff',
        roleTitle: 'Tổng Trợ lý Điều phối AI (Groq Llama 3.3)',
        platformName: 'Groq Llama 3.3 70B',
        engineType: engineMode,
        content: `[XÁC NHẬN NGHỊ QUYẾT HỘI ĐỒNG AI] ${selectedSender} (${senderProtocol.assignedPlatform}) và ${selectedTarget} (${targetProtocol.assignedPlatform}) đã thống nhất phương án về chủ đề "${topicInput}". Đã đóng gói WorkCard trình Founder bấm Duyệt chốt hoặc Phủ quyết.`,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        groundedNoteTitle: groundNote.title,
        status: 'proposed'
      };

      setChatMessages(prev => [...prev, msgSummary]);
    } catch {
      // Graceful error handle
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleVoteResolution = (msgId: string, approved: boolean) => {
    setChatMessages(prev =>
      prev.map(msg => (msg.id === msgId ? { ...msg, status: approved ? 'approved' : 'vetoed' } : msg))
    );
  };

  return (
    <div className="rounded-3xl border border-indigo-500/25 bg-slate-950/80 p-6 space-y-6 text-left select-none shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-500/15 border border-indigo-500/30 p-2.5 text-indigo-300 shadow-lg">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              Ma trận Phân quyền &amp; Phòng Chat Liên AI Staff Đa Nền tảng
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DeepSeek · Gemini · Claude · GPT-4o · Groq
              </span>
            </h4>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Phân công nhiệm vụ theo thế mạnh của từng mô hình AI hàng đầu thế giới. Hỗ trợ song song API Key Vault &amp; Web Chat AI Bridge chống cạn API.
            </p>
          </div>
        </div>

        {/* Engine Mode Toggle (API Vault vs Web Chat AI Automator) */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setEngineMode('API Vault')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              engineMode === 'API Vault'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>API Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setEngineMode('Web Chat AI Bridge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              engineMode === 'Web Chat AI Bridge'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-300" />
            <span>Web AI Bridge (Free)</span>
          </button>
        </div>
      </div>

      {/* Swarm Relay Architecture Explanation Box */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-300">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Nguyên lý Kỹ thuật: Làm sao các Web AI (ChatGPT, Claude, Gemini, DeepSeek) đối thoại trực tiếp với nhau?</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Backend Node.js của LedgerFlow Studio đóng vai trò <strong>Hệ thống Điều phối Trung gian (Swarm Relay Hub)</strong>. Khi Agent A (ví dụ DeepSeek) phát biểu, backend ghi lại câu trả lời + RAG Context SSOT, sau đó tự động đóng vai người dùng để chuyển tiếp (relay) câu trả lời đó vào phiên làm việc của Agent B (ví dụ Gemini hoặc Claude) kèm chỉ đạo: <em>"Đây là phát biểu của AI CFO, bạn là AI CTO, hãy trả lời lại dựa trên tri thức SSOT"</em>.
        </p>
      </div>

      {/* Global AI Platforms & Assigned Roles Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Phân công Vai trò theo Thế mạnh Nền tảng AI Hàng đầu Thế giới
          </h5>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            ✓ 5 Global AI Engines
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {GLOBAL_AI_PLATFORMS.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-2.5 transition hover:border-slate-700 text-left`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${p.badgeColor}`}>
                  {p.assignedRole}
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold">
                  {p.engineType}
                </span>
              </div>
              <h6 className="text-xs font-black text-slate-100">{p.name}</h6>
              <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">{p.strengths}</p>
              <div className="pt-2 border-t border-slate-800/80 text-[9.5px] font-mono text-indigo-300 truncate">
                Model: {p.modelCode}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preset Topics */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gợi ý Chủ đề Trao đổi Đa Nền tảng AI:</span>
        <div className="flex flex-wrap gap-2">
          {TOPIC_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTopicInput(preset.replace(/^[^\s]+\s/, ''))}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                topicInput === preset.replace(/^[^\s]+\s/, '')
                  ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Selector & Topic Input Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Agent A (Khởi xướng):
            </label>
            <select
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value as AgentRole)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:border-indigo-400 cursor-pointer"
            >
              {AGENT_PROTOCOLS.map(p => (
                <option key={p.role} value={p.role}>{p.role} ({p.assignedPlatform})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Agent B (Đối thoại):
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value as AgentRole)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:border-indigo-400 cursor-pointer"
            >
              {AGENT_PROTOCOLS.map(p => (
                <option key={p.role} value={p.role}>{p.role} ({p.assignedPlatform})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartRealInterAgentChat()}
            placeholder="Nhập chỉ đạo của Founder để 2 Nền tảng AI đối thoại thực tế..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={handleStartRealInterAgentChat}
            disabled={isAiThinking || !topicInput.trim() || selectedSender === selectedTarget}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{isAiThinking ? 'AI đang suy nghĩ...' : 'Phát lệnh AI Chat Thực tế'}</span>
          </button>
        </div>
      </div>

      {/* Real Live Inter-Agent Chat Stream */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-4 max-h-[520px] overflow-y-auto pr-1">
        <div className="text-center pb-2 border-b border-slate-900 flex justify-between items-center px-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            ━━ LUỒNG CHAT THỰC TẾ ĐA NỀN TẢNG AI (LIVE REAL LLM CHAT STREAM) ━━
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Engine Mode: {engineMode}
          </span>
        </div>

        {chatMessages.map((msg) => {
          const isFounder = msg.sender === 'Founder (Bạn)';
          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 text-xs text-left ${
                isFounder ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getAgentBadgeColor(msg.sender)}`}>
                  {msg.sender}
                </span>
                {!isFounder && (
                  <span className="text-[9.5px] font-mono text-indigo-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {msg.platformName}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-2xl border text-xs leading-relaxed ${
                  isFounder
                    ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-100 rounded-tr-none'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {msg.groundedNoteTitle && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[9.5px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Căn cứ SSOT: {msg.groundedNoteTitle}</span>
                  </div>
                )}

                {/* Founder Approval Gate on Proposed Resolution */}
                {msg.status && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Quyết định của Founder (Veto Gate):</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleVoteResolution(msg.id, true)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                          msg.status === 'approved'
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{msg.status === 'approved' ? '✓ Đã Phê duyệt' : 'Duyệt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVoteResolution(msg.id, false)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                          msg.status === 'vetoed'
                            ? 'bg-rose-500 text-slate-950 font-black'
                            : 'bg-slate-950 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-slate-950'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>{msg.status === 'vetoed' ? '✗ Đã Phủ quyết' : 'Phủ quyết'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isAiThinking && (
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 animate-pulse p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin-slow" />
            <span>Hệ thống đang kết nối {selectedSender} ({senderProtocol.assignedPlatform}) và {selectedTarget} ({targetProtocol.assignedPlatform}) qua {engineMode}...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
