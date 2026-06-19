import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Award, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Zap, 
  LineChart, 
  AlertTriangle, 
  Lightbulb, 
  ArrowRight,
  ClipboardList,
  Target,
  DollarSign,
  Activity,
  Maximize2
} from 'lucide-react';

interface ExpertOpinion {
  name: string;
  avatar: string;
  role: string;
  verdict: string;
  themeColor: string;
  avatarColor: string;
  strengths: string[];
  debts: string[];
  risks: string[];
  opportunities: string[];
}

export default function AdvisoryBoardReport() {
  // Persistence for 8 Priority Action Items
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ledgerflow_advisory_actions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return {
      action_1: false, // Core persona & module selection
      action_2: true,  // Real persistence setup (Cloud backup on container disk)
      action_3: true,  // Re-frame Disclaimer (Already implemented!)
      action_4: false, // Manual cash-flow initialization
      action_5: false, // Bundle splitting
      action_6: true,  // Aha moment introduction (VietQR parser sandbox tool)
      action_7: true,  // Build in Public launch (Social Kit Composer)
      action_8: true   // 3 Key Metrics setup (Pure Metrics Dashboard)
    };
  });

  const [activeExpert, setActiveExpert] = useState<'khoa' | 'ha' | 'viet' | 'dan'>('khoa');
  const [marginSimulatorRevenue, setMarginSimulatorRevenue] = useState<number>(30000000); // 30M VND
  const [marginSimulatorHours, setMarginSimulatorHours] = useState<number>(40); // 40 hours/month of founder time
  const [marginRatePerHour, setMarginRatePerHour] = useState<number>(200000); // 200,000 VND/hour

  // Toast state for interactive events
  const [adviceToast, setAdviceToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('ledgerflow_advisory_actions', JSON.stringify(checkedActions));
  }, [checkedActions]);

  const toggleAction = (key: string, label: string) => {
    setCheckedActions(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) {
        triggerToast(`🎉 Đã kích hoạt đề xuất: "${label}"`);
        playFeedbackSound();
      } else {
        triggerToast(`↩️ Đã hủy đánh giá đề xuất: "${label}"`);
      }
      return next;
    });
  };

  const triggerToast = (msg: string) => {
    setAdviceToast(msg);
    setTimeout(() => setAdviceToast(null), 3000);
  };

  const playFeedbackSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  };

  // --- Dynamic Score Calculations Based on Checked Recommendations ---
  const getDynamicScores = () => {
    let tech = 6.5;
    let prod = 5.5;
    let fin = 7.0;
    let mkt = 4.5;

    if (checkedActions.action_1) { prod += 1.5; mkt += 1.0; }
    if (checkedActions.action_2) { tech += 2.0; prod += 0.5; }
    if (checkedActions.action_3) { prod += 1.5; mkt += 1.5; } // Pre-implemented!
    if (checkedActions.action_4) { fin += 1.5; mkt += 1.0; }
    if (checkedActions.action_5) { tech += 1.0; prod += 0.5; }
    if (checkedActions.action_6) { prod += 1.0; mkt += 1.5; }
    if (checkedActions.action_7) { mkt += 2.0; }
    if (checkedActions.action_8) { fin += 1.0; tech += 0.5; }

    // Cap at 10.0
    const finalTech = Math.min(10.0, tech);
    const finalProd = Math.min(10.0, prod);
    const finalFin = Math.min(10.0, fin);
    const finalMkt = Math.min(10.0, mkt);
    const finalConsensus = Number(((finalTech + finalProd + finalFin + finalMkt) / 4).toFixed(1));

    return {
      tech: Number(finalTech.toFixed(1)),
      prod: Number(finalProd.toFixed(1)),
      fin: Number(finalFin.toFixed(1)),
      mkt: Number(finalMkt.toFixed(1)),
      consensus: finalConsensus
    };
  };

  const scores = getDynamicScores();

  // Calculation for CFO Margin Simulator
  const totalCostOfTime = marginSimulatorHours * marginRatePerHour;
  const netProfit = marginSimulatorRevenue - totalCostOfTime;
  const grossMarginPercentage = marginSimulatorRevenue > 0 
    ? Math.round((netProfit / marginSimulatorRevenue) * 100) 
    : 0;

  const { activeIdea } = useStore();

  // Experts database definitions
  const experts = useMemo<Record<'khoa' | 'ha' | 'viet' | 'dan', ExpertOpinion>>(() => {
    const defaultTitle = activeIdea ? activeIdea.title.split(' - ')[0] : 'LedgerFlow Smart Hub';
    const isGame = activeIdea?.type === 'game';
    const activePricing = activeIdea ? `${activeIdea.pricePoint.toLocaleString('vi-VN')} VNĐ` : '35.000 VNĐ';

    return {
      khoa: {
        name: 'Dr. Alistair K. Vance',
        avatar: '💻',
        role: 'Tech Lead / AI Architect (Lead of AI Systems & DevOps, ex-Google)',
        verdict: activeIdea 
          ? `⚙️ Đối với "${defaultTitle}", chúng ta có thể dựng hạ tầng hoàn chỉnh 0đ tận dụng SQLite WASM offline và Cloudflare Pages!`
          : '⚙️ Stack tốt, nhưng đang build một "bảo tàng" thay vì một "vũ khí" tác chiến thực sự.',
        themeColor: 'border-purple-500/35 bg-purple-500/5 text-purple-400',
        avatarColor: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
        strengths: [
          `Thiết kế sản phẩm "${defaultTitle}" tương thích hoàn hảo cho định dạng gọn nhẹ (micro-architecture).`,
          'React.lazy() + Suspense triển khai đúng quy chuẩn - split bundle tốt, UX chuyển nhạy.',
          'Hệ thống TypeScript strict giảm thiểu tối đa rủi ro phát sinh bug ngớ ngẩn ở kinh nghiệm thực chiến.',
          'Sử dụng proxy server trung gian bảo đảm an toàn API Key Gemini không bị phơi lộ ra bên ngoài.'
        ],
        debts: [
          'Dữ liệu hiện hoàn toàn phụ thuộc LocalStorage, rủi ro biến mất vĩnh viễn khi xóa bộ nhớ đệm trình duyệt.',
          'Chưa có kịch bản kiểm thử tự động (Vitest / Playwright) để bảo toàn đầu ra dữ liệu của thuật toán.',
          isGame 
            ? 'Cơ chế render canvas Game di động cần tối ưu hóa bằng RequestAnimationFrame để trắc địa FPS tốt hơn.' 
            : 'Các webhook ngân hàng chưa cấu hình luồng dự phòng (failover) phòng khi API nhà đài gián đoạn.'
        ],
        risks: [
          'Lộ quota API Gemini do thiếu throttle giới hạn truy vấn theo từng định lượng thiết bị người dùng.',
          'Thiếu cơ chế đồng bộ nền (background sync) khi kết nối mạng chập chờn.'
        ],
        opportunities: [
          isGame
            ? 'Sử dụng SQLite WASM để lưu lịch sử chơi offline của gamer, chỉ đồng bộ điểm cao (High Score) lên cơ sở dữ liệu.'
            : 'Xây dựng webhook xử lý biến động số dư ngân hàng VietQR/PayOS mộc mạc chỉ cần 150 dòng Javascript.',
          'Gemini 2.0 Flash cực kì rẻ có thể gánh vác trọn vẹn OCR phân tích sao kê Việt Nam ròng rã.'
        ]
      },
      ha: {
        name: 'Madame Helena Sterling, CFA',
        avatar: '📊',
        role: 'CFO / Global Finance Strategist (Ex-Goldman Sachs, Corporate Finance Veteran)',
        verdict: activeIdea
          ? `💰 Mức giá ${activePricing} nhắm tới tệp "${activeIdea.nicheAudience}" có biên lợi nhuận ròng lý tưởng!`
          : '💰 Mô hình tài chính tốt về lý thuyết - nhưng thiếu "người trả tiền thật" để chứng thực sản phẩm.',
        themeColor: 'border-emerald-500/35 bg-emerald-500/5 text-emerald-400',
        avatarColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        strengths: [
          isGame
            ? `Cách tiếp cận kinh doanh một lần/IAP với giá ${activePricing} tạo lực đẩy mua sắm bốc đồng (impulse buy) rất hiệu quả.`
            : 'Sử dụng VietQR làm bệ phóng thanh toán 0% chi phí trung gian (giúp nhà bán lẻ tiết kiệm 2~3%).',
          'Chi phí vận hành ban đầu tiệm cận 0đ nhờ tối ưu tài nguyên dải miễn phí của đám mây.',
          `Khả năng scale doanh thu phi tuyến tính do sản phẩm "${defaultTitle}" không đi kèm chi phí bản quyền nặng nề.`
        ],
        debts: [
          isGame
            ? `Doanh thu một lần từ "${defaultTitle}" chịu rủi ro bão hòa nhanh, cần thiết kế thêm vật phẩm ảo/subscription hằng tháng.`
            : `Định giá ${activePricing} yêu cầu quy mô khách hàng lớn (>500 shop) để đạt điểm hòa vốn CFO khuyến nghị.`,
          'Chưa tính toán khấu hao trang thiết bị và chi phí cơ hội của Solo Founder trong bảng cân đối.'
        ],
        risks: [
          'Khủng hoảng dòng tiền nếu dòng tiền gia công chiếm tỷ trọng lớn áp chế thời gian đầu tư cho sản phẩm chính.'
        ],
        opportunities: [
          'Mở gói dịch vụ đi kèm "Onboarding chất lượng cao" thu phí setup ban đầu để tăng giá trị trung bình trên mỗi đơn hàng (AOV).',
          isGame
            ? 'Bán gói quảng cáo tùy chọn hoặc tích hợp giải thưởng có thương hiệu tài trợ (Sponsored Game).'
            : 'Cung cấp hóa đơn điện tử tự động ghim trực tiếp với báo cáo thuế thu phí trọn gói 299K/tháng.'
        ]
      },
      viet: {
        name: 'Julian Mercer',
        avatar: '🧩',
        role: 'Product Director / UX Lead (Former Apple & Airbnb UX Strategist)',
        verdict: activeIdea
          ? `🧩 UX sản phẩm "${defaultTitle}" phải tối giản nhất hướng tới nhóm khách hàng "${activeIdea.nicheAudience}"!`
          : '🧩 UX/UI rất chuyên nghiệp - nhưng đang cố giải quyết 13 vấn đề cùng lúc, dễ làm người dùng xao nhãng.',
        themeColor: 'border-sky-500/35 bg-sky-500/5 text-sky-400',
        avatarColor: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
        strengths: [
          'Giao diện Dark theme sâu đồng dạng, độ tương phản sắc nét, phông Inter mềm mại hiện đại.',
          'Tính năng thanh tìm kiếm nhanh Ctrl+K mang đến trải nghiệm cao cấp khó tin cho một bộ công cụ nội địa.',
          'Kiến trúc bento-box hiện đại, thu gom dữ liệu trực quan rất dễ hấp thụ thị giác.'
        ],
        debts: [
          'Người dùng dễ rơi vào trạng thái bối rối trước quá nhiều thông số kỹ thuật (tech-larping) không cần thiết.',
          'Sự bất đồng bộ trong các luồng nghiệp vụ khi người dùng nhảy từ công cụ này sang công cụ khác trên web.'
        ],
        risks: [
          `Tệp khách hàng mục tiêu "${activeIdea?.nicheAudience || 'phổ thông'}" rất thiếu kiên nhẫn, họ sẽ rời đi nếu không thấy nút "Bắt đầu ngay" trong 5 giây đầu tiên.`
        ],
        opportunities: [
          'Cài đặt nút "One-Click Quick Start" để kích hoạt ngay một bộ dữ liệu demo sinh động.',
          isGame
            ? 'Đơn giản hóa cơ chế điều khiển tối đa trên cảm ứng di động, tăng kích cỡ nút bấm lên ít nhất 44px.'
            : 'Thiết kế mẫu VietQR động nổi bật ngay góc màn hình chính để chứng minh tính năng nạp tự động.'
        ]
      },
      dan: {
        name: 'Seraphina Kross',
        avatar: '🚀',
        role: 'Growth Hacker & Viral Architect (Go-To-Market Specialist, ex-Stripe)',
        verdict: activeIdea
          ? `🚀 Công thức thành công cho "${defaultTitle}" nằm ở việc chiếm lĩnh tệp ngách khách hàng "${activeIdea.nicheAudience}"!`
          : '🚀 Tư duy phát tán du kích rất sắc bám sát môi trường Việt Nam - nhưng cần thu gom tệp khách hàng hẹp.',
        themeColor: 'border-amber-500/35 bg-amber-500/5 text-amber-400',
        avatarColor: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        strengths: [
          isGame
            ? 'Game di động có khả năng lây lan lan truyền (viral potential) cao thông qua bảng xếp hạng xã hội.'
            : 'Nhắm mục tiêu vào Zalo OA giúp kết nối tức thì, tỷ lệ mở tin nhắn đạt 85% vượt xa Email truyền thống.',
          'Ý tưởng giải quyết nỗi đau trực diện của thị trường giúp gia tăng sự chuyển đổi tự nhiên qua giới thiệu truyền miệng.'
        ],
        debts: [
          'Quá tập trung xây dựng sản phẩm mà chưa có trang đích (Landing Page) bắt mắt để thu thập thông tin đăng ký sớm.',
          'Chưa khai thác sức mạnh của mạng lưới người có sức ảnh hưởng siêu nhỏ (KOC/Micro-influencer) có sẵn trong ngách này.'
        ],
        risks: [
          'Hiệu ứng rò rỉ dữ liệu hoặc chia sẻ lậu làm xói mòn tài nguyên máy chủ.'
        ],
        opportunities: [
          'Sử dụng chiến lược "Build in Public" trên Facebook Group và Threads để thu gom 100 khách hàng đầu tiên trong tuần đầu ra mắt.',
          isGame
            ? 'Cho phép thi đấu solo thách đấu bạn bè qua liên kết Zalo/Messenger để tạo làn sóng chơi tiếp sức.'
            : 'Cung cấp Widget check sao kê VietQR miễn phí nhúng vào các trang web bất kỳ để thu hút traffic ngược về trang chủ.'
        ]
      }
    };
  }, [activeIdea]);

  return (
    <div className="space-y-6">
      
      {/* ADVISORY TOAST */}
      {adviceToast && (
        <div className="fixed top-24 right-6 bg-purple-600 border border-purple-500 text-white font-black px-4.5 py-3 rounded-2xl shadow-2xl z-50 animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse animate-spin" />
          <span className="text-sm font-mono">{adviceToast}</span>
        </div>
      )}

      {/* HEADER BANNER OF THE COUNCIL REPORT */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0d1526] to-[#12203a] border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-purple-500/10 blur-3xl animate-pulse"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl"></div>

        <div className="space-y-3 relative z-10 select-text">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-black rounded-lg uppercase tracking-wider font-mono">
              ⚖️ HỘI ĐỒNG CỐ VẤN KHỞI NGHIỆP TRỰC TUYẾN
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black rounded-lg uppercase tracking-wider font-mono">
              LedgerFlow Studio v4_V26
            </span>
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black rounded-lg uppercase tracking-wider font-mono">
              Độc Lập · 4 Chuyên Gia
            </span>
          </div>

          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            📈 Báo Cáo Thẩm Định Toàn Diện &amp; Trình Mô Phỏng Đổi Khung Chiến Lược
          </h2>
          
          <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-4xl">
            Phân tích chuyên sâu từ 4 cố vấn hàng đầu trong ngành công nghiệp khởi nghiệp tại Việt Nam áp dụng lên <strong className="text-white">1.3MB mã nguồn</strong>. Thắt chặt nợ kỹ thuật, bóp nghẹt phễu hạch toán và bóc trần chiến thuật kinh doanh B2B thông minh có tương tác phản hồi động!
          </p>
        </div>
      </div>

      {/* INTERACTIVE SCORE PANEL - REACTS IN REAL TIME TO THE ITEM CHECKLIST */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 select-text">
        
        {/* Tech architecture score */}
        <div className="bg-[#040811] border border-slate-900 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[9.5px] font-black uppercase text-slate-500 font-mono block">Kiến trúc công nghệ</span>
          <p className="text-3xl font-black text-purple-400 font-mono">{scores.tech}</p>
          <span className="text-[10px] text-slate-500 font-bold block">
            {scores.tech >= 8.5 ? '💎 Vững như bàn thạch' : '⚠️ Potential khá, nợ lớn'}
          </span>
          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-900">
            <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${scores.tech * 10}%` }}></div>
          </div>
        </div>

        {/* Product strategy score */}
        <div className="bg-[#040811] border border-slate-900 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[9.5px] font-black uppercase text-slate-500 font-mono block">Sản phẩm (UX-IA)</span>
          <p className="text-3xl font-black text-sky-400 font-mono">{scores.prod}</p>
          <span className="text-[10px] text-slate-500 font-bold block">
            {scores.prod >= 8.0 ? '⚡ Sắc bén hội tụ' : '⚠️ Đang quá mỏng & rộng'}
          </span>
          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-900">
            <div className="bg-sky-500 h-full rounded-full transition-all duration-300" style={{ width: `${scores.prod * 10}%` }}></div>
          </div>
        </div>

        {/* Financial feasibility */}
        <div className="bg-[#040811] border border-slate-900 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[9.5px] font-black uppercase text-slate-500 font-mono block">Khả thi tài chính</span>
          <p className="text-3xl font-black text-emerald-400 font-mono">{scores.fin}</p>
          <span className="text-[10px] text-slate-500 font-bold block">
            {scores.fin >= 8.5 ? '👑 Cỗ máy in tiền ròng' : '⚠️ Thực tế cần validate'}
          </span>
          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-900">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${scores.fin * 10}%` }}></div>
          </div>
        </div>

        {/* Market readiness */}
        <div className="bg-[#040811] border border-slate-900 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[9.5px] font-black uppercase text-slate-500 font-mono block">Độ chín thị trường</span>
          <p className="text-3xl font-black text-rose-400 font-mono">{scores.mkt}</p>
          <span className="text-[10px] text-slate-500 font-bold block">
            {scores.mkt >= 8.5 ? '🚀 Sẵn sàng độc chiếm' : '⚠️ Chưa có launch page'}
          </span>
          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-900">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${scores.mkt * 10}%` }}></div>
          </div>
        </div>

        {/* Dynamic consensus score calculated live! */}
        <div className="bg-slate-900/65 border border-purple-900/25 rounded-2xl p-4 text-center space-y-1 col-span-2 lg:col-span-1 shadow-lg">
          <span className="text-[9.5px] font-black uppercase text-purple-400 font-mono block">Điểm chung Hội Đồng</span>
          <p className="text-3xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-purple-400 to-indigo-300">{scores.consensus}</p>
          <span className="text-[10px] text-purple-300 font-black block">
            {scores.consensus >= 8.5 ? '✨ PMF EXCELLENCE' : '🛠️ ĐỀ NGHỊ REFOCUS'}
          </span>
          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-800">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${scores.consensus * 10}%` }}></div>
          </div>
        </div>

      </div>

      {/* CORE EXPERT REVIEW CORNER TABS */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left tabs selector for experts */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-900 p-4 rounded-3xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-500 font-mono uppercase tracking-widest block px-2">CHỌN NGƯỜI THẨM ĐỊNH NỘI BỘ</span>
            
            <div className="space-y-1.5 font-sans">
              {[
                { id: 'khoa', name: 'Dr. Alistair K. Vance', role: 'Tech Lead / AI Architect', emoji: '💻', activeColor: 'bg-purple-950/50 border-purple-500/30 text-purple-300' },
                { id: 'ha', name: 'Madame Helena Sterling, CFA', role: 'CFO / Global Finance', emoji: '📊', activeColor: 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' },
                { id: 'viet', name: 'Julian Mercer', role: 'Product Director / UX Lead', emoji: '🧩', activeColor: 'bg-sky-950/50 border-sky-500/30 text-sky-400' },
                { id: 'dan', name: 'Seraphina Kross', role: 'Growth Lead / Viral Architect', emoji: '🚀', activeColor: 'bg-amber-950/50 border-amber-500/30 text-amber-300' }
              ].map(exp => (
                <button
                  key={exp.id}
                  onClick={() => setActiveExpert(exp.id as any)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    activeExpert === exp.id
                      ? exp.activeColor + ' shadow shadow-purple-500/5'
                      : 'border-transparent text-slate-400 bg-slate-900/10 hover:bg-slate-900/40 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl shrink-0">{exp.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[12.5px] font-black block">{exp.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">{exp.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-2xl text-[10.5px] leading-relaxed font-semibold text-slate-500 text-center">
            💡 <em>Nhận định tổng quan:</em> Hãy bổ sung tính năng lưu khóa an toàn (DB storage), tinh giản tệp giao diện mỏng và định vị sản phẩm giá trị gốc Việt Nam!
          </div>
        </div>

        {/* Right content display for the selected expert */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-900 p-6 rounded-3xl flex flex-col justify-between space-y-5">
          
          {/* Expert Title Block */}
          <div className="flex items-start gap-4 pb-4 border-b border-slate-900">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${experts[activeExpert].avatarColor} shrink-0`}>
              {experts[activeExpert].avatar}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">{experts[activeExpert].name}</h3>
              <p className="text-xs text-slate-400 font-bold leading-tight">{experts[activeExpert].role}</p>
              <div className={`text-[11px] font-black py-1 px-3 rounded-lg border inline-block select-text mt-1.5 ${experts[activeExpert].themeColor}`}>
                {experts[activeExpert].verdict}
              </div>
            </div>
          </div>

          {/* Core matrix of findings: Strengths, Debts, Risks, Opportunities */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            
            {/* Strengths */}
            <div className="p-4 bg-emerald-950/5 border border-emerald-900/20 rounded-2xl space-y-2">
              <span className="text-[9.5px] font-mono text-emerald-400 font-black tracking-widest block uppercase">
                ✓ ĐIỂM SÁNG / THẾ MẠNH (STRENGTHS)
              </span>
              <ul className="space-y-2 text-[11px] text-slate-400 font-semibold select-text">
                {experts[activeExpert].strengths.map((st, index) => (
                  <li key={index} className="flex gap-1.5 items-start">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Debts or Pitfalls */}
            <div className="p-4 bg-rose-950/5 border border-rose-900/20 rounded-2xl space-y-2">
              <span className="text-[9.5px] font-mono text-rose-400 font-black tracking-widest block uppercase">
                🚨 NỢ KỸ THUẬT / LỖ HỔNG (DEBTS &amp; PITFALLS)
              </span>
              <ul className="space-y-2 text-[11px] text-slate-400 font-semibold select-text">
                {experts[activeExpert].debts.map((st, index) => (
                  <li key={index} className="flex gap-1.5 items-start">
                    <span className="text-rose-400 font-bold shrink-0">▸</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Core risks */}
            <div className="p-4 bg-amber-950/5 border border-amber-900/20 rounded-2xl space-y-2">
              <span className="text-[9.5px] font-mono text-amber-400 font-black tracking-widest block uppercase">
                ⚠️ RỦI RO CHI TRẠNG (SYS RISKS)
              </span>
              <ul className="space-y-2 text-[11px] text-slate-400 font-semibold select-text">
                {experts[activeExpert].risks.map((st, index) => (
                  <li key={index} className="flex gap-1.5 items-start">
                    <span className="text-amber-400 font-bold shrink-0">!</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-4 bg-sky-950/5 border border-sky-900/20 rounded-2xl space-y-2">
              <span className="text-[9.5px] font-mono text-sky-400 font-black tracking-widest block uppercase">
                ⚡ CƠ HỘI ĐỘC CHUYỂN AI-NATIVE (OPPORTUNITIES)
              </span>
              <ul className="space-y-2 text-[11px] text-slate-400 font-semibold select-text">
                {experts[activeExpert].opportunities.map((st, index) => (
                  <li key={index} className="flex gap-1.5 items-start">
                    <span className="text-sky-400 font-bold shrink-0">⚡</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* CFO INTERACTIVE MARGIN CALCULATOR - INSIDE CFO PANEL */}
          {activeExpert === 'ha' && (
            <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span className="text-[10px] font-mono font-extrabold text-emerald-400 flex items-center gap-1">
                  📊 Trình Giả Lập Biên Lợi Nhuận Thực Tế (CFO Gross Margin Live Calculator)
                </span>
                <span className="text-[8px] bg-slate-950 px-2 py-0.5 rounded text-slate-550 border border-slate-850">
                  Trang 6: P&amp;L Analysis
                </span>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-3 text-xs leading-relaxed">
                {/* Revenue slider */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-bold block">MRR Doanh thu:</span>
                  <input
                    type="range"
                    min="5000000"
                    max="100000000"
                    step="5000000"
                    value={marginSimulatorRevenue}
                    onChange={(e) => setMarginSimulatorRevenue(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-emerald-400 font-black">{marginSimulatorRevenue.toLocaleString('vi-VN')} đ/tháng</span>
                </div>

                {/* Hours Slider */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-bold block">Thời gian tự code/tư vấn:</span>
                  <input
                    type="range"
                    min="10"
                    max="160"
                    step="10"
                    value={marginSimulatorHours}
                    onChange={(e) => setMarginSimulatorHours(parseInt(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-purple-400 font-black">{marginSimulatorHours} giờ/tháng</span>
                </div>

                {/* Self rate slider */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-bold block">Định giá giờ bản thân:</span>
                  <input
                    type="range"
                    min="100000"
                    max="1500000"
                    step="50000"
                    value={marginRatePerHour}
                    onChange={(e) => setMarginRatePerHour(parseInt(e.target.value))}
                    className="w-full accent-sky-500 h-1 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-sky-400 font-black">{marginRatePerHour.toLocaleString('vi-VN')}đ/giờ</span>
                </div>
              </div>

              {/* Simulation Result Block */}
              <div className="grid sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850 text-[11px] font-bold">
                <div className="space-y-1">
                  <span className="text-slate-500">CP cơ hội thời gian của bạn:</span>
                  <p className="text-white font-mono font-black">{totalCostOfTime.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-slate-500">Biên lợi nhuận ròng thật sự (Real Gross Margin):</span>
                  <p className={`font-mono font-black text-xs ${grossMarginPercentage >= 60 ? 'text-emerald-400' : grossMarginPercentage >= 30 ? 'text-amber-400' : 'text-rose-455'}`}>
                    {netProfit > 0 ? `${grossMarginPercentage}%` : `LỖ -${Math.abs(grossMarginPercentage)}%`}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ⚖️ ACTIONS FOR PERSISTENCE / CO-CONSENSUS (8 HÀNH ĐỘNG ƯU TIÊN) */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="border-b border-slate-900 pb-3 flex justify-between items-end">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-purple-400 font-black uppercase tracking-wider block">CONSENSUS ACTION INDEX (Hội đồng đồng thuận)</span>
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-1.5 font-sans">
              ⚖️ Sổ Tay Hành Động Chinh Phục PMF (8 Priority Actions Checklist)
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 font-bold text-right hidden sm:block">
            Tình trạng: {Object.values(checkedActions).filter(Boolean).length} / {Object.keys(checkedActions).length} đã hoàn tất
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              key: 'action_1', 
              num: 1, 
              title: 'Pivot 1 Module Trọng Tâm', 
              desc: 'Khoan thủng "Đối soát sao kê VietQR cho Shop Online" thay vì build 13 tab rộng mênh mông.',
              color: 'text-purple-400 border-purple-500/10'
            },
            { 
              key: 'action_2', 
              num: 2, 
              title: 'Thêm database luồng thật', 
              desc: 'Tích hợp đĩa cứng máy chủ tự động để đồng bộ sao lưu và phục hồi dữ liệu từ xa thay vì chỉ lưu LocalStorage cục bộ đơn sơ.',
              color: 'text-emerald-400 border-emerald-500/10'
            },
            { 
              key: 'action_3', 
              num: 3, 
              title: 'Re-brand định vị rạch ròi', 
              desc: 'Được thay thế từ "SANDBOX SIMULATOR" sang "AI-powered Financial Workbench" rực lửa!',
              color: 'text-sky-450 text-sky-400 border-sky-500/10'
            },
            { 
              key: 'action_4', 
              num: 4, 
              title: 'Kiếm dòng tiền thủ công', 
              desc: 'Lấy dòng tiền dịch vụ Controller (8-20M/tháng) nuôi công nghệ làm SaaS 2.0.',
              color: 'text-amber-400 border-amber-500/10'
            },
            { 
              key: 'action_5', 
              num: 5, 
              title: 'Thin bundle & subcommands', 
              desc: 'Tách biệt Game hoặc các mốc thí nghiệm thành subdomain rải rác tải nhẹ 5x.',
              color: 'text-pink-400 border-pink-500/10'
            },
            { 
              key: 'action_6', 
              num: 6, 
              title: 'Tạo Aha Moment tức khắc', 
              desc: 'Hiển thị luồng hạch toán Excel mượt bốc ngay trong 45 giây đầu khi khách ghé.',
              color: 'text-yellow-400 border-yellow-500/10'
            },
            { 
              key: 'action_7', 
              num: 7, 
              title: 'Chạy Build in Public VN', 
              desc: 'Công khai hành trình gọi vốn, số liệu doanh sớ thật hàng tuần gầy dựng uy tín độc lập.',
              color: 'text-rose-455 text-rose-400 border-rose-500/10'
            },
            { 
              key: 'action_8', 
              num: 8, 
              title: 'Tinh khiết 3 bộ metrics', 
              desc: 'Bỏ qua pageviews rác, duy nhất đo lường: Active users, real Doanh sớ và Retention T+30.',
              color: 'text-cyan-400 border-cyan-500/10'
            },
          ].map(action => {
            const isChecked = !!checkedActions[action.key];
            return (
              <div
                key={action.key}
                onClick={() => toggleAction(action.key, action.title)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3.5 select-none relative overflow-hidden ${
                  isChecked 
                    ? 'bg-purple-950/10 border-purple-500/35 shadow-lg' 
                    : 'bg-slate-900/35 border-slate-900/80 hover:bg-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-xs ${isChecked ? 'bg-purple-500 text-white shadow-md' : 'bg-slate-950 border border-slate-850 text-slate-400'}`}>
                      {action.num}
                    </span>
                    <span className="text-[12.5px] font-black text-white leading-none">
                      {action.title}
                    </span>
                  </div>
                  <div>
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-850 hover:border-purple-500"></div>
                    )}
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                  {action.desc}
                </p>

                {action.key === 'action_2' && (
                  <span className="absolute bottom-2 right-2 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black font-mono">
                    ĐỒNG BỘ ĐÁM MÂY
                  </span>
                )}

                {action.key === 'action_3' && (
                  <span className="absolute bottom-2 right-2 text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-black font-mono">
                    ĐÃ CÀI ĐẶT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
