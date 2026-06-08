import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Mail, 
  Send, 
  Sparkles, 
  Copy, 
  CheckCircle, 
  FileText, 
  RefreshCw, 
  Users, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Zap,
  BarChart
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

interface CampaignTemplate {
  name: string;
  subject: string;
  body: string;
}

interface PreloadedScenario {
  id: string;
  title: string;
  targetAudience: string;
  productDesc: string;
  vibe: string;
}

export default function OutboundSalesHub() {
  const { activeIdea } = useStore();
  const [activeTab, setActiveTab] = useState<'generator' | 'analytics' | 'handbook'>('generator');
  const [productDesc, setProductDesc] = useState<string>(
    activeIdea?.description || 'Hệ thống tự động hóa hạch toán hóa đơn LedgerFlow Smart Hub - giúp kế toán trưởng tiết kiệm 90% thời gian dọn dẹp số liệu, tự báo cáo tức thì trong 3 giây cho lãnh đạo.'
  );
  const [targetAudience, setTargetAudience] = useState<string>(
    activeIdea?.nicheAudience || 'Kế toán trưởng doanh nghiệp thương mại / SME'
  );

  // Sync state when activeIdea changes dynamically
  useEffect(() => {
    if (activeIdea) {
      setProductDesc(activeIdea.description);
      setTargetAudience(activeIdea.nicheAudience);
    }
  }, [activeIdea]);
  const [channel, setChannel] = useState<'email' | 'linkedin' | 'zalo'>('email');
  const [vibe, setVibe] = useState<'professional' | 'win_win' | 'storytelling' | 'direct'>('win_win');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Custom AI modifications input
  const [refinementText, setRefinementText] = useState<string>('');
  
  // Generated Results
  const [generatedSubject, setGeneratedSubject] = useState<string>(
    'Giải phóng 90% thời can dọn dẹp báo cáo Excel mỗi tối cho [Tên Khách Hàng]'
  );
  const [generatedBody, setGeneratedBody] = useState<string>(
    `Thân gửi Anh/Chị [Tên Khách Hàng],\n\nTôi biết một Kế toán trưởng như Anh/Chị luôn phải đau đầu xử lý hàng trăm hóa đơn thô từ nhiều nguồn khác nhau, rồi mất thêm 2 tiếng mỗi đêm ngồi khớp số bằng Excel thủ công để chuẩn bị báo cáo cho giám đốc.\n\nHệ thống thông minh LedgerFlow được thiết kế dành riêng cho các kế toán trưởng bận rộn để giải quyết triệt để nỗi lo đó. Phần mềm tự động định dạng dữ liệu, dọn rác số liệu, và xuất báo cáo tài chính/quản trị cực kỳ trực quan chỉ trong đúng 3 giây.\n\nĐặc biệt, trong tuần này, chúng tôi đang dành tặng suất dùng thử hoàn toàn Miễn Phí 30 ngày cho các doanh nghiệp thương mại để trải nghiệm tính năng này.\n\nAnh/Chị có sẵn lòng dành ra 5 phút để nhận tài khoản thử nghiệm không? Chỉ cần phản hồi tin nhắn này và tôi sẽ hỗ trợ thiết lập tức thì.\n\nChúc Anh/Chị một tuần làm việc hiệu quả!\n\nTrân trọng,\n[Tên của Bạn]\nLedgerFlow Studio Việt Nam`
  );

  const [followUp1, setFollowUp1] = useState<string>(
    `Chào Anh/Chị [Tên Khách Hàng],\n\nTôi hiểu Anh/Chị đang bận rộn cân đối sổ sách giữa tuần. Tôi chỉ muốn chia sẻ một thống kê nhỏ: Hơn 150 đơn vị SME tại Việt Nam sử dụng LedgerFlow đã giảm tải 2 giờ lao động thừa mỗi tối của kế toán trưởng doanh thu và đưa sai số sổ sách về 0%.\n\nTôi rất vinh dự được thiết lập 5 phút demo trực quan qua Google Meet cho Anh/Chị vào thứ Năm hoặc thứ Sáu tuần này.\n\nChúc Anh/Chị tuần làm việc suôn sẻ!\n\nTrân trọng,\n[Tên của Bạn]`
  );

  const [followUp2, setFollowUp2] = useState<string>(
    `Anh/Chị [Tên Khách Hàng] thân mến,\n\nĐây là tin nhắn ngắn cuối cùng từ tôi để đề xuất giải pháp LedgerFlow giúp kết xuất báo cáo nhanh trong 3 giây. Nếu hiện tại chưa phải thời điểm thích hợp, tôi rất hiểu và hi vọng sẽ có dịp đồng hành cùng Anh/Chị trong những kỳ quyết toán sau.\n\nNếu Anh/Chị muốn lưu lại thông tin hay thử nghiệm bất kỳ lúc nào, hãy để lại phản hồi nhé.\n\nChúc doanh nghiệp của Anh/Chị luôn phát triển mạnh mẽ.\n\nTrân trọng,\n[Tên của Bạn]`
  );

  const [showStatus, setShowStatus] = useState<string | null>(null);

  // Preloaded Scenarios
  const scenarios: PreloadedScenario[] = [
    {
      id: 'scen-1',
      title: 'Giới thiệu dịch vụ Kế toán/Thuế trọn gói cho Solo Founder',
      targetAudience: 'Solo Founder đang bắt đầu khởi nghiệp',
      productDesc: 'Dịch vụ kế toán trọn gói chuyên nghiệp tối ưu thuế, cân đối dòng tiền, chỉ 990,000đ/tháng giúp founder an tâm 100% lo kinh doanh.',
      vibe: 'win_win'
    },
    {
      id: 'scen-2',
      title: 'Chào gói Data Science / FinLab cho doanh nghiệp SME',
      targetAudience: 'CEO / Quản lý tài chính doanh nghiệp sản xuất lẻ',
      productDesc: 'Giải pháp xây dựng Dashboard theo dõi dòng tiền và dự báo lãi lỗ tự động từ file Excel thô giúp doanh nghiệp giảm thất thoát dòng tiền.',
      vibe: 'professional'
    },
    {
      id: 'scen-3',
      title: 'Chào mời Cộng tác viên / Affiliate tham gia mạng lưới',
      targetAudience: 'Giảng viên giảng dạy kế toán / Freelancer kế toán',
      productDesc: 'Chương trình affiliate chiết khấu 25% trọn đời khi giới thiệu học viên thực hành trên LedgerFlow, nhận hoa hồng qua VietQR tự động.',
      vibe: 'storytelling'
    }
  ];

  const applyScenario = (scen: PreloadedScenario) => {
    setProductDesc(scen.productDesc);
    setTargetAudience(scen.targetAudience);
    setVibe(scen.vibe as any);
    triggerNotification(`Đã tải kịch bản: ${scen.title}`);
  };

  const triggerNotification = (msg: string) => {
    setShowStatus(msg);
    setTimeout(() => setShowStatus(null), 3000);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    triggerNotification(`Đã sao chép ${type} vào Clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Generate outbound sequence using real Gemini API
  const handleGenerateAI = async () => {
    setIsLoading(true);
    try {
      const systemInstruction = "Bạn là chuyên gia Outbound Copywriting và tư pháp tăng trưởng doanh nghiệp B2B hàng đầu tại Việt Nam. Sử dụng văn phong tiếng Việt tự nhiên, tinh tế, không sáo rỗng, tránh dịch thô cứng từ tiếng Anh.";
      const prompt = `Hãy thiết kế một kịch bản Outbound Outreach (Gieo mầm Sales) dành cho:
      - Sản phẩm/Giải pháp: "${productDesc}"
      - Đối tượng mục tiêu: "${targetAudience}"
      - Kênh tiếp cận: "${channel.toUpperCase()}"
      - Văn phong/Phong thái: "${vibe}" (professional: Lịch sự/Kính cẩn, win_win: Đôi bên cùng có lợi thực dụng, storytelling: Kể chuyện truyền cảm hứng, direct: Ngắn gọn đi thẳng vào đề).
      
      Yêu cầu sản xuất:
      1. Thiết kế 1 Tiêu đề (Subject) lôi cuốn, có tỷ lệ mở bấm cực cao.
      2. Viết 1 Bức thư chính (Main outreach pitch) thuyết phục, có lý do rõ ràng, gỡ rối nỗi đau (pain point), có lời kêu gọi hành động (Call To Action) nhẹ nhàng, không gây áp lực.
      3. Viết 1 Bức thư Follow-up 1 (Gửi sau 3 ngày) khéo léo, cung cấp thêm 1 số liệu hoặc giá trị để tăng độ tin cậy.
      4. Viết 1 Bức thư Follow-up 2 (Gửi sau 7 ngày) lịch sự, nhã nhặn, để ngỏ cơ hội liên hệ lại.

      Bạn hãy trả về nội dung theo cấu trúc phân tách rõ ràng XML hoặc JSON bằng tiếng Việt để tôi dễ sao chép. Hãy ghi rõ từng phần [TIÊU ĐỀ], [BỨC THƯ CHÍNH], [FOLLOW UP 1], [FOLLOW UP 2].`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          model: 'gemini-2.5-flash'
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Yêu cầu API thất bại');
      }

      const text = resData.text;
      parseAIOutput(text);
      triggerNotification('AI đã thiết kế kịch bản tiếp cận tối ưu thành công!');
    } catch (error: any) {
      console.error(error);
      triggerNotification('Lỗi kết nối API! Đã sử dụng kịch bản mẫu chất lượng cao.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refine existing copy
  const handleRefineAI = async () => {
    if (!refinementText.trim()) return;
    setIsLoading(true);
    try {
      const systemInstruction = "Bạn là trợ lý hiệu chỉnh tiếp thị Outbound tinh nhuệ của LedgerFlow Studio.";
      const prompt = `Tôi có kịch bản Outbound hiện tại như sau:
      - Tiêu đề hiện tại: "${generatedSubject}"
      - Nội dung hiện tại: "${generatedBody}"
      
      Hãy chỉnh sửa kịch bản này dựa trên yêu cầu sau: "${refinementText}".
      Hãy trả về phiên bản mới gồm TIÊU ĐỀ và NỘI DUNG CHÍNH.`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          model: 'gemini-2.5-flash'
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Yêu cầu API thất bại');
      }

      const text = resData.text;
      // Simple parsing or assign whole to body if structure is simple
      if (text.includes('[TIÊU ĐỀ]') || text.includes('Tiêu đề:')) {
        parseAIOutput(text);
      } else {
        setGeneratedBody(text);
      }
      setRefinementText('');
      triggerNotification('Đã hiệu chỉnh thông điệp theo ý muốn!');
    } catch (e) {
      triggerNotification('Không thể liên kết AI để hiệu chỉnh. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseAIOutput = (text: string) => {
    // Basic heuristics to split sections
    const subjectMatch = text.match(/(?:\[TIÊU ĐỀ\]|Tiêu đề|Subject):?\s*([^\n]+)/i);
    if (subjectMatch && subjectMatch[1]) {
      setGeneratedSubject(subjectMatch[1].replace(/[\[\]]/g, '').trim());
    }

    // Try to isolate main pitch
    const parts = text.split(/(?:\[BỨC THƯ CHÍNH\]|\[MAIN OUTREACH\]|\[FOLLOW UP 1\]|\[FOLLOW UP 2\]|Follow-up 1|Follow-up 2)/gi);
    if (parts.length > 1) {
      // Cleaner extraction
      if (parts[1]) setGeneratedBody(parts[1].trim());
      if (parts[2]) setFollowUp1(parts[2].trim());
      if (parts[3]) setFollowUp2(parts[3].trim());
    } else {
      setGeneratedBody(text);
    }
  };

  // Mock campaign analytics data
  const campaignPerformance = [
    { name: 'Kế toán dịch vụ', sent: 120, opened: 88, replied: 24, converted: 8 },
    { name: 'Solo Founder', sent: 230, opened: 165, replied: 42, converted: 14 },
    { name: 'Công ty SME nhỏ', sent: 95, opened: 58, replied: 15, converted: 4 },
    { name: 'Giảng viên CPA', sent: 45, opened: 41, replied: 18, converted: 6 },
  ];

  return (
    <div className="bg-[#050911]/80 backdrop-blur-md rounded-2xl border border-slate-900/80 shadow-2xl overflow-hidden text-slate-200">
      {/* HEADER BAR */}
      <div className="p-6 border-b border-slate-900 bg-gradient-to-r from-indigo-950/40 via-purple-950/10 to-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
              <Send className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">PREMIUM ADD-ON</span>
          </div>
          <h2 id="affiliate-hub-title" className="text-lg font-black tracking-tight flex items-center gap-2 text-white">
            5.13. Outbound Sales &amp; AI Outreach Hub 🇻🇳
          </h2>
          <p className="text-[11.5px] text-slate-400 leading-normal max-w-2xl font-medium">
            Tối ưu hóa các chiến dịch tiếp cận trực tiếp khách hàng (Cold Pitch) hỗ trợ phát triển lưu lượng truy cập ban đầu qua Email B2B và kênh LinkedIn xã hội cùng mô hình AI siêu tốc.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 self-start md:self-center shrink-0">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'generator' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Generator
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Báo Cáo Hiệu Quả
          </button>
          <button
            onClick={() => setActiveTab('handbook')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'handbook' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kinh Nghiệm Sát Sườn
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {showStatus && (
        <div className="bg-indigo-900 border-y border-indigo-500/50 px-4 py-2 text-center text-xs text-indigo-200 font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
          <Zap className="w-3.5 h-3.5 animate-bounce text-amber-400" />
          <span>{showStatus}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="p-6">
        {activeTab === 'generator' && (
          <div className="grid lg:grid-cols-5 gap-6">
            
            {/* COLUMN LEFT: INPUTS & SETTINGS */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Preloaded quick scenes */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1 font-mono">
                    <BookOpen className="w-3 h-3" /> CHỌN KỊCH BẢN MẪU NHANH
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Gợi ý 3 ngách</span>
                </div>
                <div className="space-y-1.5">
                  {scenarios.map((scen) => (
                    <button
                      key={scen.id}
                      onClick={() => applyScenario(scen)}
                      className="w-full text-left p-2 bg-slate-905 hover:bg-indigo-950/20 border border-slate-850 hover:border-indigo-850 rounded-lg text-[11px] font-bold text-slate-300 transition-all flex items-center justify-between"
                    >
                      <span className="truncate">{scen.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Pitch details form */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1 font-mono">
                  <Target className="w-3.5 h-3.5 text-indigo-400" /> THIẾT LẬP CHIẾN DỊCH OUTREACH
                </span>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-slate-400">1. Mô tả giải pháp / dịch vụ của bạn:</label>
                  <textarea
                    rows={4}
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Mô tả ngách, sản phẩm, SaaS hoặc dịch vụ hạch toán toán học đặc trưng..."
                    className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 text-slate-200 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-slate-400">2. Đối tượng mục tiêu tiếp cận:</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Ví dụ: Kế toán trưởng công ty thiết kế nội thất"
                    className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500 text-slate-200 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-slate-400 font-semibold">3. Kênh tiếp cận:</label>
                    <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-xl border border-slate-850">
                      {(['email', 'linkedin', 'zalo'] as const).map((chan) => (
                        <button
                          key={chan}
                          type="button"
                          onClick={() => setChannel(chan)}
                          className={`text-[10.5px] font-bold py-1.5 rounded-lg uppercase ${
                            channel === chan ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {chan}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-slate-400 font-semibold">4. Văn phong AI:</label>
                    <select
                      value={vibe}
                      onChange={(e) => setVibe(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 text-xs rounded-xl p-2 font-bold outline-none text-slate-300 focus:border-indigo-500"
                    >
                      <option value="professional">Lịch thiệp/Chuyên nghiệp</option>
                      <option value="win_win">Win-win thỏa thuận tài chính</option>
                      <option value="storytelling">Kể chuyện truyền cảm hứng</option>
                      <option value="direct">Trực diện vào đề tối giản</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGenerateAI}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>ĐANG THU THẬP &amp; PHÁT THẢO COPY...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>PHÁT THẢO KỊCH BẢN BẰNG GEMINI AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mini KPI tip */}
              <div className="bg-[#0b101b]/90 p-4 rounded-xl border border-slate-900 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px] text-slate-400 leading-normal">
                  <span className="text-white font-bold block">Nguyên tắc vàng tiếp cận lạnh (B2B):</span>
                  <p>Hãy viết ít nhất có thể về bản thân bạn, và nói 90% về nỗi đau và cơ hội của đối phương. Luôn kết thúc bằng một câu hỏi Yes/No cực kỳ dễ phản hồi.</p>
                </div>
              </div>

            </div>

            {/* COLUMN RIGHT: AI GENERATED OUTBOUND SEQUENCE PILES */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Template Body Card */}
              <div className="bg-[#080d17]/90 rounded-2xl border border-slate-900 overflow-hidden shadow-xl">
                {/* Visual Email Browser Mock Header */}
                <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/60" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    <span className="text-[10px] text-slate-500 font-mono ml-2 font-bold uppercase tracking-wider">
                      Email Outreach Previewer
                    </span>
                  </div>
                  <span className="bg-emerald-505 bg-emerald-600/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 border border-emerald-500/10 rounded uppercase font-mono">
                    VĂN BẢN TRUYỀN THÔNG ĐÃ TỐI ƯU
                  </span>
                </div>

                {/* Email Fields */}
                <div className="p-4 bg-slate-950/50 border-b border-slate-900 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Tiêu đề (Subject):</span>
                      <span className="text-indigo-300 font-bold">{generatedSubject}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(generatedSubject, 'Tiêu đề')}
                      className="text-slate-500 hover:text-white p-1 hover:bg-slate-900 rounded shrink-0 transition-all flex items-center gap-1 text-[10px] font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <div className="text-slate-500 flex justify-between text-[11px] pt-1">
                    <span>Đến: <code className="text-slate-400 font-mono">{targetAudience.replace(/\s+/g, '_').toLowerCase()}@domain.vn</code></span>
                    <span>Hạn gửi: <code className="text-indigo-400">Thứ Hai đầu tuần (Thời điểm Vàng)</code></span>
                  </div>
                </div>

                {/* Body Content editable area */}
                <div className="p-6 bg-slate-950/20 font-sans text-xs leading-relaxed text-slate-200">
                  <textarea
                    rows={12}
                    value={generatedBody}
                    onChange={(e) => setGeneratedBody(e.target.value)}
                    className="w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 leading-loose outline-none font-medium text-slate-100"
                  />
                  
                  <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">
                      💡 Mẹo: Bạn có thể chỉnh sửa trực tiếp nội dung trên trước khi sao chép
                    </span>
                    <button
                      onClick={() => handleCopy(generatedBody, 'Thư chính')}
                      className="px-4 py-1.5 bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-505 border-indigo-500/20 hover:border-indigo-500 rounded-lg text-[10.5px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao Chép Thư Chính</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI prompt Refinement tools */}
              <div className="bg-slate-950/80 p-4 border border-slate-900 rounded-2xl flex items-center gap-3">
                <input
                  type="text"
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  placeholder="Yêu cầu AI hiệu chỉnh lại (VD: 'Hãy làm ngắn gọn hơn và chuyển giọng hài hước vui vẻ'...)"
                  className="bg-slate-950 border border-slate-850 text-xs rounded-xl p-2.5 outline-none flex-1 font-medium focus:border-indigo-500"
                />
                <button
                  onClick={handleRefineAI}
                  disabled={isLoading || !refinementText.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black text-white cursor-pointer transition-colors shrink-0 disabled:opacity-40"
                >
                  Gửi AI
                </button>
              </div>

              {/* FOLLOW UP SEQUENCES GRID */}
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Follow up 1 (Day 3) */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-900/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[10px] font-black text-indigo-400 tracking-wider flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" /> FOLLOW-UP 1 (NGÀY 3)
                    </span>
                    <button
                      onClick={() => handleCopy(followUp1, 'Follow-up 1')}
                      className="text-slate-500 hover:text-indigo-400 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Sao chép
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={followUp1}
                    onChange={(e) => setFollowUp1(e.target.value)}
                    className="w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-[11px] leading-relaxed text-slate-300 font-medium"
                  />
                </div>

                {/* Follow up 2 (Day 7) */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-900/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" /> FOLLOW-UP 2 (NGÀY 7 - BREAKUP)
                    </span>
                    <button
                      onClick={() => handleCopy(followUp2, 'Follow-up 2')}
                      className="text-slate-500 hover:text-slate-400 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Sao chép
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={followUp2}
                    onChange={(e) => setFollowUp2(e.target.value)}
                    className="w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-[11px] leading-relaxed text-slate-300 font-medium"
                  />
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ANALYTICS DASHBOARD FOR EMAIL SENDING */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/80 space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Đã gửi tiếp cận</span>
                <p className="text-xl font-black text-white text-left">490 <span className="text-[10px] text-slate-500">doanh nghiệp</span></p>
                <span className="text-[9px] text-emerald-400 font-extrabold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +15% tuần này
                </span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/80 space-y-1">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">Tỷ lệ mở email (Open)</span>
                <p className="text-xl font-black text-indigo-300 text-left">71.8%</p>
                <span className="text-[9px] text-indigo-400 font-extrabold">Đạt chuẩn thế giới (Thường ~25%)</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/80 space-y-1">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">Phản hồi lịch hẹn (Replied)</span>
                <p className="text-xl font-black text-amber-300 text-left">20.2%</p>
                <span className="text-[9px] text-slate-500 font-semibold">Tương đương 99 phản hồi chất lượng</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/80 space-y-1">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">Chuyển đổi mua sỉ (Converted)</span>
                <p className="text-xl font-black text-emerald-400 text-left">32 <span className="text-[10px] text-slate-500">đối tác thành công</span></p>
                <span className="text-[9px] text-emerald-400 font-extrabold">Đem lại 215.000.000đ dòng tiền đầu</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Chart of Outreach channels */}
              <div className="lg:col-span-2 bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">BIỂU ĐỒ SOI HIỆU QUẢ THEO PHÂN KHÚC</span>
                  <p className="text-[11px] text-slate-400">Đo lường chi tiết Phân khúc gửi thực hiện chiến dịch quý 2</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={campaignPerformance}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="sent" name="Đã gửi tiếp cận" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="opened" name="Kế toán mở xem" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="replied" name="Đặt câu hỏi/Lịch hẹn" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="converted" name="Chuyển đổi mua" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Partners box */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono block">CHIẾN ĐỊCH GỞI TỰ ĐỘNG GẦN ĐƠN NHẤT</span>
                <div className="space-y-2.5">
                  {[
                    { company: 'Thành Tài Logistics SME', state: 'replied', text: 'Có hỏi về bảo mật SQLite và xuất báo cáo nội bộ sếp' },
                    { company: 'Cơ Khí Miền Nam Corp', state: 'sent', text: 'Đã hoàn thành gửii Thư chính buổi sáng' },
                    { company: 'Anh Khoa CPA Partner', state: 'converted', text: 'Đã thanh toán trọn năm, chuyển khoản qua VietQR' },
                    { company: 'Thời trang May Mặc Hải Lan', state: 'opened', text: 'Mở email 3 lần, đang chờ gửi follow up 1' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-905 border border-slate-850 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-white">{item.company}</span>
                        <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                          item.state === 'converted' ? 'bg-emerald-500/15 text-emerald-400' :
                          item.state === 'replied' ? 'bg-amber-500/15 text-amber-400' :
                          item.state === 'opened' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-500/15 text-slate-400'
                        }`}>
                          {item.state}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'handbook' && (
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 space-y-3">
              <span className="text-[20px] block">📧</span>
              <span className="text-xs font-black text-white block uppercase tracking-wide">Chiến thuật Tiêu đề (Subject Line)</span>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Đừng bao giờ hân hạnh giới thiệu hay nói về giải pháp của bạn trên tiêu đề. Hãy nói về 1 con số cụ thể, một khó khăn nhói lòng, hoặc 1 câu hỏi thẳng thắn. 
                <br /><br />
                Ví dụ: <strong>"Có phải [Tên Kế Toán] đang mất thêm 2 tiếng mỗi tối dọn sổ Excel?"</strong> đạt tỷ lệ mở xem thực tế lên tới 80% tại Việt Nam.
              </p>
            </div>

            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 space-y-3">
              <span className="text-[20px] block">⏱️</span>
              <span className="text-xs font-black text-white block uppercase tracking-wide">Thời Điểm Vàng Bấm Gửi</span>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Tránh xa các khoảng giờ thứ Sáu muộn, tối thứ Bảy hoặc sáng Chủ Nhật. Doanh nghiệp Việt Nam gỡ mail nhiều nhất vào lúc <strong>08:30 đến 09:30 sáng thứ Hai</strong> (để chuẩn bị giao ban) và <strong>14:00 đến 14:45 chiều thứ Ba</strong>.
                <br /><br />
                Hãy lên lịch gửi thư tiếp cận vào đúng các khung giờ này để email bay thẳng lên đầu hòm thư đối tác.
              </p>
            </div>

            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 space-y-3">
              <span className="text-[20px] block">🛡️</span>
              <span className="text-xs font-black text-white block uppercase tracking-wide">Vượt Ải Spam Filter</span>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Để tránh rơi vào mục "Quảng cáo" (Promotion) hay "Thư rác" (Spam), hãy cấu hình đầy đủ bản ghi SPF, DKIM, DMARC cho tên miền doanh nghiệp.
                <br /><br />
                Đồng thời, tuyệt đối tránh viết hoa toàn bộ ký tự tiêu đề hay chèn quá 1 liên kết vào trong email đầu tiên. Giữ thông điệp thô như một cuộc nói chuyện thân mật cá nhân.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
