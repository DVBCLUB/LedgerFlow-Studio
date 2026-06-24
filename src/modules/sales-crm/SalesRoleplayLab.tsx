import React, { useState, useEffect, useRef } from 'react';
import { User, Bot, Send, ShieldAlert, Award, Star, RefreshCw, MessageSquare } from 'lucide-react';
import { callAIFromSettings } from '../../utils/aiSettingsApi';

type PersonaKey = 'nam' | 'linh' | 'bach';

type PersonaConfig = {
  key: PersonaKey;
  name: string;
  role: string;
  avatar: string;
  initGreeting: string;
  painPoint: string;
  objections: string[];
  systemPrompt: string;
};

const PERSONAS: Record<PersonaKey, PersonaConfig> = {
  nam: {
    key: 'nam',
    name: 'Mr. Nam',
    role: 'Kế toán trưởng (Công ty thương mại)',
    avatar: '👨‍💼',
    initGreeting: 'Chào em, bên anh đang dùng phần mềm truyền thống rất ổn định. Anh nghe nói LedgerFlow chạy trên nền tảng đám mây và tích hợp AI. Anh lo ngại nhất là tính bảo mật. Dữ liệu tài chính mà lộ ra ngoài thì công ty anh sập. Phần mềm của em bảo mật thế nào?',
    painPoint: 'Lo ngại rò rỉ dữ liệu tài chính nội bộ, sợ hacker và nghi ngờ khả năng bảo mật của đám mây.',
    objections: [
      'Nhưng lưu dữ liệu trên cloud thì nhỡ bên em bị hack hoặc nhân viên của em lấy cắp dữ liệu thì sao?',
      'Bên anh có những giao dịch nội bộ rất nhạy cảm. Có cách nào chạy offline hoàn toàn trên server nội bộ của anh không?',
      'Nếu hệ thống của em bị sập trong kỳ quyết toán thuế thì bên em đền bù thiệt hại thế nào?'
    ],
    systemPrompt: 'Bạn là Mr. Nam, một Kế toán trưởng khó tính, đa nghi và giàu kinh nghiệm. Bạn rất quan tâm đến bảo mật dữ liệu tài chính, không tin tưởng đám mây dễ dàng. Hãy đối thoại ngắn gọn (2-3 câu), giữ thái độ hoài nghi và đòi hỏi giải pháp bảo mật rõ ràng. Không được dễ dàng đồng ý.'
  },
  linh: {
    key: 'linh',
    name: 'Ms. Linh',
    role: 'Founder (Marketing Agency)',
    avatar: '👩‍💻',
    initGreeting: 'Hi em, bên chị đang muốn tối ưu hóa quy trình. Nghe nói LedgerFlow Hub có các Agent AI có thể tự động viết bài, nghiên cứu từ khóa và làm báo cáo. Nhưng giá Pro của các em là 399K/tháng. Chị thấy hơi đắt so với việc thuê các bạn thực tập sinh. Em thuyết phục chị tại sao nên chi tiền nào?',
    painPoint: 'Tập trung tối ưu chi phí, muốn đong đếm được ROI ngay lập tức, muốn AI thay thế được nhân lực viết bài/marketing.',
    objections: [
      'Giá 399K/tháng tính ra một năm cũng gần 5 triệu. Nếu dùng AI của em thì chị có thể bớt được bao nhiêu nhân sự thực tập?',
      'Chị sợ các Agent AI viết bài nghe rất máy móc, khách hàng của chị đọc là biết ngay. Có cách nào huấn luyện AI viết theo tone giọng của thương hiệu chị không?',
      'Bên chị quy mô nhỏ, nhỡ tháng sau chị hết dự án thì có được tạm ngưng gói Pro mà không mất dữ liệu cũ không?'
    ],
    systemPrompt: 'Bạn là Ms. Linh, một nữ startup founder trẻ trung, thực dụng, nói năng nhanh nhẹn, luôn đặt câu hỏi về chi phí và lợi ích thực tế (ROI). Bạn muốn ép giá và đòi hỏi tính năng AI phải tạo ra bài viết có hồn. Trả lời ngắn gọn, thẳng thắn.'
  },
  bach: {
    key: 'bach',
    name: 'Mr. Bách',
    role: 'Giám đốc xưởng cơ khí chế tạo',
    avatar: '👨‍🏭',
    initGreeting: 'Chào cháu, chú năm nay hơn 50 rồi, quản lý xưởng cơ khí gia đình. Chú nghe con trai chú bảo giờ phải chuyển đổi số, dùng phần mềm quản lý đơn hàng với doanh thu. Nhưng chú nói thật, chú không rành mấy cái AI hay công nghệ đâu. Phức tạp quá là chú chịu. Phần mềm này dùng có dễ không cháu?',
    painPoint: 'Sợ công nghệ phức tạp, khó học, muốn được hỗ trợ cầm tay chỉ việc tận nơi và phần mềm giao diện siêu đơn giản.',
    objections: [
      'Chú nhìn mấy cái biểu đồ với dòng tiền hoa hết cả mắt. Có cách nào chú chỉ cần đọc giọng nói rồi phần mềm tự ghi nhận đơn hàng không?',
      'Nếu chú mua phần mềm này thì bên cháu có cử người xuống tận xưởng hướng dẫn trực tiếp cho chú và mấy bạn công nhân không?',
      'Chú quen ghi sổ tay rồi. Nhỡ mất mạng internet thì chú có xem lại được sổ sách đơn hàng cũ không cháu?'
    ],
    systemPrompt: 'Bạn là Mr. Bách, một giám đốc xưởng cơ khí lớn tuổi, nói chuyện mộc mạc, xưng "chú" gọi "cháu". Bạn rất sợ giao diện rắc rối và công nghệ AI xa vời. Bạn thích sự chân thành, hỗ trợ trực tiếp. Hãy đặt câu hỏi lo ngại về sự phức tạp.'
  }
};

type Message = {
  id: string;
  sender: 'user' | 'client';
  text: string;
};

type AuditResult = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string;
};

export default function SalesRoleplayLab() {
  const [activeKey, setActiveKey] = useState<PersonaKey>('nam');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation when changing Persona
  useEffect(() => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'client',
        text: PERSONAS[activeKey].initGreeting
      }
    ]);
    setAuditResult(null);
    setUserInput('');
  }, [activeKey]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = userInput.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    const persona = PERSONAS[activeKey];
    const conversationHistory = [...messages, userMsg]
      .map((m) => `${m.sender === 'user' ? 'Người bán' : persona.name}: ${m.text}`)
      .join('\n');

    const prompt = `Lịch sử cuộc hội thoại bán hàng B2B:\n${conversationHistory}\n\nHãy tiếp tục đóng vai ${persona.name} (${persona.role}) để phản hồi lại tin nhắn cuối cùng của Người bán hàng. Hãy giữ vững sự khó tính, chất vấn và phản đối (Objection) dựa trên mối lo ngại lớn nhất của bạn: "${persona.painPoint}". Trả lời ngắn gọn, tối đa 3 câu.`;

    try {
      // API call to local gateway
      const response = await callAIFromSettings(prompt, 'ai-assistant', 'sales');
      
      const clientText = response.text || response.content || response.output || '';
      
      if (!clientText) {
        throw new Error('Empty AI response');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `c-${Date.now()}`,
          sender: 'client',
          text: clientText
        }
      ]);
    } catch (error) {
      // Deterministic Fallback if offline / API error
      setTimeout(() => {
        const userTurnCount = messages.filter(m => m.sender === 'user').length;
        const fallbackText = persona.objections[userTurnCount % persona.objections.length] || 
          'Anh thấy giải pháp này chưa thực sự giải quyết được lo ngại của anh. Bên em còn cam kết nào thiết thực hơn không?';

        setMessages((prev) => [
          ...prev,
          {
            id: `c-fallback-${Date.now()}`,
            sender: 'client',
            text: `[Offline AI Mode] ${fallbackText}`
          }
        ]);
      }, 600);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudit = async () => {
    if (messages.length < 3 || isAuditing) return;
    setIsAuditing(true);
    setAuditResult(null);

    const persona = PERSONAS[activeKey];
    const conversation = messages
      .map((m) => `${m.sender === 'user' ? 'Người bán' : persona.name}: ${m.text}`)
      .join('\n');

    const prompt = `Phân tích cuộc đối thoại bán hàng B2B sau đây:\n${conversation}\n\nHãy đóng vai Chuyên gia Đào tạo Sales B2B, đánh giá khả năng xử lý rào cản từ chối (objections) của Người bán đối với khách hàng ${persona.name} (mối lo ngại: ${persona.painPoint}).
Trả về kết quả phân tích theo cấu trúc JSON sau đây (không kèm markdown block nào khác ngoài JSON):
{
  "score": [Điểm số từ 0 đến 100],
  "strengths": ["[Ưu điểm 1]", "[Ưu điểm 2]"],
  "weaknesses": ["[Nhược điểm 1]", "[Nhược điểm 2]"],
  "suggestions": "[Lời khuyên ngắn gọn để cải thiện và chốt deal]"
}`;

    try {
      const response = await callAIFromSettings(prompt, 'ai-assistant', 'sales');
      const textResult = response.text || response.content || response.output || '';
      
      // Attempt to parse JSON
      const jsonStart = textResult.indexOf('{');
      const jsonEnd = textResult.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = textResult.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr) as AuditResult;
        setAuditResult(parsed);
      } else {
        throw new Error('Not JSON');
      }
    } catch (e) {
      // Rule-based deterministic auditing fallback
      setTimeout(() => {
        const fullChatText = messages.map(m => m.text).join(' ').toLowerCase();
        let score = 50;
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        // Check for positive keywords based on persona
        if (activeKey === 'nam') {
          if (fullChatText.includes('mã hóa') || fullChatText.includes('bảo mật') || fullChatText.includes('on-premise') || fullChatText.includes('cam kết')) {
            score += 25;
            strengths.push('Đã đề cập đến các tính năng bảo mật dữ liệu, giải pháp mã hóa hoặc cam kết lưu trữ.');
          } else {
            weaknesses.push('Chưa trấn an được khách hàng về chứng chỉ bảo mật hoặc tùy chọn chạy offline.');
          }
        } else if (activeKey === 'linh') {
          if (fullChatText.includes('hoàn tiền') || fullChatText.includes('tiết kiệm') || fullChatText.includes('dùng thử') || fullChatText.includes('roi')) {
            score += 20;
            strengths.push('Đưa ra được cam kết hoàn tiền hoặc làm rõ khả năng tiết kiệm chi phí vận hành.');
          } else {
            weaknesses.push('Chưa làm nổi bật được giá trị ROI vượt trội so với chi phí Pro 399K.');
          }
        } else { // Mr Bách
          if (fullChatText.includes('hướng dẫn') || fullChatText.includes('đơn giản') || fullChatText.includes('tận nơi') || fullChatText.includes('giúp chú')) {
            score += 25;
            strengths.push('Xưng hô lễ phép, đưa ra cam kết hỗ trợ trực tiếp tại xưởng cơ khí.');
          } else {
            weaknesses.push('Giải thích tính năng quá nhiều thuật ngữ công nghệ phức tạp khiến khách hàng e ngại.');
          }
        }

        if (messages.length > 5) {
          score += 10;
          strengths.push('Duy trì được cuộc đối thoại dài và kiên trì bám đuổi.');
        }

        setAuditResult({
          score: Math.min(95, score),
          strengths: strengths.length > 0 ? strengths : ['Giao tiếp lịch sự, phản hồi nhanh chóng.'],
          weaknesses: weaknesses.length > 0 ? weaknesses : ['Cần đào sâu hơn vào việc giải quyết rào cản giá cả/bảo mật thay vì chỉ giới thiệu tính năng.'],
          suggestions: `Lời khuyên cho cuộc gọi tiếp theo với ${persona.name}: Tập trung trực tiếp vào nỗi đau lớn nhất của họ (${persona.painPoint}). Đề xuất gửi một bản demo riêng để chạy thử không rủi ro.`
        });
      }, 800);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-sky-500/25 bg-slate-950/70 p-5 text-slate-100 space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-sky-300">Sales Center</span>
          <h3 className="mt-1 text-lg font-black text-white">B2B Sales Objection Roleplay Lab</h3>
          <p className="text-xs font-semibold text-slate-400">Chọn một khách hàng khó tính, nhắn tin thuyết phục vượt qua rào cản và chạy chấm điểm tỷ lệ chốt Deal.</p>
        </div>
      </div>

      {/* Persona Selectors */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.values(PERSONAS)).map((p) => {
          const isActive = activeKey === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setActiveKey(p.key)}
              className={`rounded-2xl border p-4 text-left cursor-pointer transition flex gap-3 items-center ${
                isActive
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-md shadow-sky-500/5'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900/70'
              }`}
            >
              <span className="text-2xl">{p.avatar}</span>
              <div>
                <strong className="text-xs block text-white font-black">{p.name}</strong>
                <span className="text-[10px] text-slate-500 font-bold block">{p.role}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] text-left">
        
        {/* Chat Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 flex flex-col h-[460px] justify-between">
          <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase">Đối thoại với {PERSONAS[activeKey].name}</span>
            <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">B2B Negotiation</span>
          </div>

          {/* Messages scrollarea */}
          <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 scrollbar-thin">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} className={`flex gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm ${
                    isUser ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-white'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : PERSONAS[activeKey].avatar}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs font-semibold leading-5 ${
                    isUser ? 'bg-sky-500/10 border border-sky-500/25 text-sky-100 rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex gap-2.5 mr-auto max-w-[85%] animate-pulse">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-sm">
                  {PERSONAS[activeKey].avatar}
                </div>
                <div className="p-3 rounded-2xl text-xs font-semibold bg-slate-900 border border-slate-850 text-slate-500 rounded-tl-none">
                  {PERSONAS[activeKey].name} đang gõ phản hồi...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input control */}
          <div className="border-t border-slate-850 pt-3 flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading || messages.length > 10}
              placeholder={messages.length > 10 ? "Đã đạt giới hạn cuộc gọi thử." : "Viết câu trả lời thuyết phục của bạn..."}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-sky-400 disabled:opacity-40"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !userInput.trim() || messages.length > 10}
              className="rounded-xl bg-sky-500 hover:bg-sky-600 px-3 text-slate-950 transition cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audit Scorecard */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 flex flex-col justify-between h-[460px]">
          <div>
            <div className="border-b border-slate-850 pb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase">Báo cáo đánh giá năng lực Sales</span>
            </div>

            {auditResult ? (
              <div className="mt-4 space-y-4 text-xs font-semibold animate-fade-in">
                {/* Score */}
                <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-bold">Tỷ lệ chốt Deal (Win Rate):</span>
                  <span className={`text-xl font-black flex items-center gap-1 ${
                    auditResult.score >= 75 ? 'text-emerald-400' : auditResult.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    <Award className="w-5 h-5" />
                    {auditResult.score}%
                  </span>
                </div>

                {/* Strengths */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">Ưu điểm thuyết phục</span>
                  <ul className="space-y-1 pl-1">
                    {auditResult.strengths.map((str, idx) => (
                      <li key={idx} className="text-slate-300 leading-5">✓ {str}</li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">Điểm cần cải thiện</span>
                  <ul className="space-y-1 pl-1">
                    {auditResult.weaknesses.map((weak, idx) => (
                      <li key={idx} className="text-slate-400 leading-5">✗ {weak}</li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-sky-400 font-black uppercase tracking-wider block">Khuyến nghị chốt deal</span>
                  <p className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 text-slate-300 leading-5">{auditResult.suggestions}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Nói chuyện tối thiểu 2 lượt tin nhắn và nhấn nút **Đánh giá cuộc gọi** bên dưới để phân tích hiệu suất thuyết phục của bạn.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleAudit}
            disabled={isAuditing || messages.length < 3}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-black text-slate-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAuditing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                AI đang thẩm định hội thoại...
              </span>
            ) : 'Đánh giá cuộc gọi Sales'}
          </button>
        </div>

      </div>
    </div>
  );
}
