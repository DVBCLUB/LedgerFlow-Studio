import React, { useState, useEffect } from 'react';
import { Zap, ChevronRight, AlertCircle, CheckCircle2, Check, ArrowRight, Database, DollarSign, Server, Award, TrendingUp, PlusCircle, Trash2, Edit, Save, Copy, Compass, HelpCircle } from 'lucide-react';

export const STREMY_NODES = [
  {
    id: 'stage_1',
    phase: 'GIAI ĐOẠN 1: Ý TƯỞNG SIÊU NGÁCH',
    title: 'Đánh Ngách Hẹp & Cực Mặn',
    goal: 'Giải quyết triệt để 1 rắc rối của tệp khách hàng cô đọng thay vì mơ làm ERP đa năng.',
    toolStack: ['Google Trends VN', 'Hội nhóm Facebook bán hàng', 'Lướt reviews 1-3 sao trên App Store / Steam', 'TikTok Search xu hướng'],
    guerillaHacks: [
      'Tìm kiếm từ khoá "ức chế", "vất vả", "bị sót bill" trong các cộng đồng kinh doanh online tự cứu hoặc game thủ Việt.',
      'Sử dụng AI Agent Growth Hacker phác hoạ tệp chân dung để hiểu cặn kẽ nỗi đau thực tế của họ trước khi viết bất kì dòng code nào.'
    ],
    actionChecklist: [
      'Nói chuyện / phỏng vấn trực tiếp tối thiểu 3 khách hàng tiềm năng về khó khăn của họ.',
      'Giới hạn danh sách tính năng (Scope) trong vòng tối đa 3 ngày code. Loại bỏ hoàn toàn 95% tính năng rườm rà.',
      'Định giá rẻ bằng đúng cốc nước mía / cốc cà phê vỉa hè để khách hàng không ngần ngại ấn nút nạp.'
    ],
    metric: 'Nỗi đau thị trường > 8.5/10 | Thời gian lập trình kì hạn < 5 ngày',
    details: 'Thay vì viết ra các tính năng chung chung cho mọi khách hàng, hãy tối ưu hóa hết mức để chỉ phục vụ một nhóm đặc biệt. Ví dụ: Phần mềm tự động gửi tin nhắn cảm ơn và hoá đơn cho người mua hàng bằng VietQR sau 3 giây hoặc mini game xe máy lách ổ gà khi ngập lụt.'
  },
  {
    id: 'stage_2',
    phase: 'GIAI ĐOẠN 2: LẬP TRÌNH ĐA NỀN TẢNG',
    title: 'Cross-Platform Với 1 Code Duy Nhất',
    goal: 'Compile nhanh gọn sang cả PC (Web/Desktop) lẫn Mobile với dung lượng siêu tối giản.',
    toolStack: ['Vite + React (Làm PWA)', 'Godot Engine 4 (Game nhẹ < 30MB, xuất Android/Desktop mượt bốc)', 'Tauri (Chuyển web-app thành app PC mộc mạc)', 'SQLite cục bộ / LocalStorage'],
    guerillaHacks: [
      'Tận dụng hoàn toàn AI Game & App Logic Coder để sinh mã nguồn thô cho SQLite, canvas WebGL hoặc GDScript mà không lo bí ý tưởng giải thuật.',
      'Ưu tiên thiết kế Offline-first để loại trừ gánh nặng server VPS đắt đỏ, giúp ứng dụng sống bền bỉ không tốn tiền bảo trì.'
    ],
    actionChecklist: [
      'Thiết lập khung sườn source code tương thích màn hình dọc di động lẫn nằm ngang PC.',
      'Tích hợp tính năng tự động lưu trữ tiến trình hoặc nhật ký giao dịch xuống cơ sở dữ liệu cục bộ.',
      'Rà soát triệt để dung lượng file build cuối. Nén chặt toàn bộ ảnh, tệp nhạc sang định dạng WebP, OGG cực nhẹ.'
    ],
    metric: 'Dung lượng bộ cài game < 25MB | Web-app tải trang dưới 1.5 giây',
    details: 'Giữ cho cấu trúc lập trình gãy góc và sạch bóng rườm rà. Bằng cách không sử dụng các framework quá nặng nề, bạn có thể triển khai thành công ứng dụng trên cả di động cấu hình yếu lẫn các dòng máy tính văn phòng.'
  },
  {
    id: 'stage_3',
    phase: 'GIAI ĐOẠN 3: ĐỘNG CƠ THANH TOÁN 0Đ',
    title: 'Tự Động Hoá Kế Toán Bằng VietQR',
    goal: 'Nhận nạp rút tự động và gán VIP tức thì mà không thất thoát 2.5% phí cho cổng thanh toán.',
    toolStack: ['Cổng API VietQR động (vietqr.io)', 'Webhook kiểm tra lịch sử giao dịch', 'Telegram Push Notification Bot', 'NodeJS Server chạy Serverless (Vercel/Render)'],
    guerillaHacks: [
      'Sinh QR động đính kèm mã đơn hàng duy nhất và số tiền chính xác, giúp khách chỉ cần mở app bank quét 1 chạm là tiền nhảy ngay.',
      'Dùng extension Chrome tự động sao cập sao kê hoặc viết Google App Script nhận email biến động số dư cực chuẩn.'
    ],
    actionChecklist: [
      'Thiết lập cấu trúc cú pháp chuyển tiền mẫu dạng viết liền không dấu để bóc tách nhanh (ví dụ: SEC_MEMBER_99K).',
      'Viết API xử lý webhook đầu nhận: Kiểm tra giao dịch trùng, xác minh số tiền khớp và gọi SQLite nâng hạng tài khoản khách tại chỗ.',
      'Định kỳ dọn dẹp các tệp nhật ký giao dịch không cần thiết để giữ trơn chu database.'
    ],
    metric: 'Chi phí vận hành cổng thanh toán = 0 VNĐ | Thời cấp quyền game/app < 5 giây',
    details: 'Bằng cách tự động hóa luồng kế toán qua VietQR NAPAS, bạn giải phóng bản thân khỏi việc ngồi dò sao kê tay bằng cách tự bóc tách thông báo giao dịch thông qua webhook serverless 0đ.'
  },
  {
    id: 'stage_4',
    phase: 'GIAI ĐOẠN 4: TIẾP THỊ LAN TRUYỀN HỢP LỆ',
    title: 'ASO Ngách & Video Ngắn TikTok',
    goal: 'Không tốn 1 đồng ngân sách chạy quảng cáo trả phí (Ads). Tận dụng tối đa phễu traffic tự nhiên.',
    toolStack: ['SEO Chợ ứng dụng Google Play / Steam', 'Quay màn hình / Capcut di động', 'Kênh Tiktok cá nhân / Short Reels', 'Hệ thống giới thiệu bạn bè nhận mã'],
    guerillaHacks: [
      'Nhấn mạnh giá trị sản phẩm rẻ như cốc trà đá vỉa hè (15k - 20k) nhưng giải toả ức chế khổng lồ để thúc đẩy mua hàng tích tắc.',
      'Chèn hệ thống Referral trực tiếp vào app: Khách hàng chia sẻ app được tặng thêm 7 ngày trải nghiệm VIP để tự lôi kéo khách mới.'
    ],
    actionChecklist: [
      'Tập trung tối ưu tiêu đề ASO chứa các thuật ngữ nỗi đau cốt lõi của khách để xếp hạng cao khi họ tìm kiếm.',
      'Tạo 5 kịch bản video ngắn và đăng tải đều đặn hằng ngày lặp lại thông điệp ngộ nghĩnh đi cùng link bio tải nhanh.',
      'Theo dõi các chỉ số tải trang và tỷ lệ chuyển đổi thanh toán để điều chỉnh vị trí đặt nút nạp hấp dẫn hơn.'
    ],
    metric: 'Chi phí tiếp thị (CAC) = 0 VNĐ | Tỷ lệ viral tự phát đạt > 110%',
    details: 'Thời buổi hiện tại cạnh tranh rất khốc liệt, khách hàng thường hoài nghi ứng dụng đắt tiền hoặc các dịch vụ đăng ký hàng tháng nặng nề. Mức giá rẻ hạt dẻ một lần cùng sự viral tự nhiên qua video ngắn là chìa khóa vàng giúp bạn chiến thắng.'
  }
];

interface StrategyTabProps {
  setActiveTab: (tab: 'ideas' | 'agents' | 'strategy') => void;
  setSelectedAgentId: (id: string) => void;
  setAgentUserInput: (input: string) => void;
  setAgentOutput: (output: string) => void;
}

export default function StrategyTab({
  setActiveTab,
  setSelectedAgentId,
  setAgentUserInput,
  setAgentOutput
}: StrategyTabProps) {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('stage_1');
  const [strategySubTab, setStrategySubTab] = useState<'mindmap' | 'roadmap' | 'niches' | 'weapons' | 'rules' | 'proposal'>('mindmap');
  
  // States for the interactive, structured project proposal
  const [activeProposalPhase, setActiveProposalPhase] = useState<number>(0);
  const [readyMitigations, setReadyMitigations] = useState<string[]>([
    'mit_scope_1',
    'mit_scope_2',
    'mit_schedule_1',
    'mit_quality_1',
    'mit_tech_1',
    'mit_market_1'
  ]);
  const [simulatedScopeVelocity, setSimulatedScopeVelocity] = useState<number>(92);
  const [simulatedBudgetBurnRate, setSimulatedBudgetBurnRate] = useState<number>(80);
  const [simulatedBugRate, setSimulatedBugRate] = useState<number>(2);

  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('guerrilla_completed_steps');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const updated = prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId];
      try {
        localStorage.setItem('guerrilla_completed_steps', JSON.stringify(updated));
      } catch (e) {
        console.error('Lỗi lưu bước hoàn thành:', e);
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER INTRO */}
      <div className="bg-[#04080e]/90 border border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden font-sans">
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">STRATEGY COMMAND POST</span>
            <h2 className="text-base font-black text-text-primary uppercase mt-1">
              ⚔️ Kế Hoạch Tác Chiến Du Kích & Khai Thác Bản Địa
            </h2>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed max-w-4xl font-semibold">
              Tận dụng lợi thế liên ngành <strong className="text-emerald-400 font-bold">Kế toán + Kiểm toán + Tài chính + DA + BA + ML</strong> làm bộ lọc thiết kế và lập trình thông minh. Không đối đầu trực diện, đi nước đi ngách sắc lẹm, định giá rẻ tối đa.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl shrink-0">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Chi phí duy trì = 0 VNĐ | Tốc độ đóng gói &lt; 7 ngày</span>
          </div>
        </div>

        {/* STRATEGY SUB-TABS SELECTOR */}
        <div className="flex flex-wrap gap-2 border-t border-slate-900 mt-5 pt-4 select-none">
          {[
            { id: 'mindmap', label: '🗺️ 4 Bước Tăng Trưởng', desc: 'Sơ đồ chuỗi tác chiến' },
            { id: 'roadmap', label: '🛹 Lộ Trình 12 Bước Học & Code', desc: '12 Bước hành động cụ thể' },
            { id: 'niches', label: '🎯 Thị Trường Ngách Tận Bản', desc: '8 phân khúc tài chính & game' },
            { id: 'weapons', label: '⚔️ Kho Vũ Khí AI 0 VNĐ', desc: 'Tận dụng Free-tier tối đa' },
            { id: 'rules', label: '🛡️ Tối Thượng Luật & Rủi Ro', desc: '4 Nguyên tắc & 5 Cạm bẫy' },
            { id: 'proposal', label: '📋 Đề Xuất Lập Trình Tinh Gọn', desc: 'Sắp xếp Sprint, KPI & Rủi ro' }
          ].map((sub) => {
            const isSelected = strategySubTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setStrategySubTab(sub.id as any)}
                className={`px-4 py-2.5 rounded-xl transition-all border text-left flex-1 min-w-[160px] ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-950/30 to-slate-950 text-emerald-404 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                    : 'bg-slate-950/40 border-slate-900 text-text-secondary hover:text-slate-200 hover:bg-bg-primary/30'
                }`}
              >
                <div className="text-xs font-black">{sub.label}</div>
                <div className="text-[9px] font-semibold text-slate-505 mt-0.5">{sub.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {strategySubTab === 'mindmap' && (
        <>
          <div className="grid md:grid-cols-2 gap-6 font-sans">
            {/* Conventional Card */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 bg-opacity-70">
                  <AlertCircle className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-text-secondary">I. CON ĐƯỜNG TRUYỀN THỐNG (Khó sống sót)</h4>
                  <p className="text-[10px] text-text-tertiary font-bold">Thường dẫn tới cạn vốn của 95% Solo Founder ít ngân sách</p>
                </div>
              </div>
              
              <div className="space-y-3.5 text-xs text-text-secondary font-semibold leading-relaxed">
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-text-secondary block text-orange-300">💸 Chi Phí Ban Đầu Cực Lớn:</span>
                  <p className="text-[10.5px]">Phí thuê VPS khủng, mua licence database, cấu hình máy chủ SaaS rườm rà. Hệ thống âm tiền ngay khi chưa có người dùng đầu tiên.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-text-secondary block text-orange-300">🛑 Đưa Sản Phẩm Ra Chợ Quá Chậm:</span>
                  <p className="text-[10.5px]">Mất 3-6 tháng thiết kế đồ sộ để hoàn chỉnh dự án rườm rà. Đến khi triển khai thực tế thị trường đã đổi chiều, người dùng chối từ.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-text-secondary block text-orange-300">📉 Bẫy Tiếp Thị Trả Phí (Paid Ads):</span>
                  <p className="text-[10.5px]">Bơm tiền vào Google Ads / Facebook Ads đẩy lượt cài, nhưng doanh thu từ giá bán rẻ không gánh nổi phễu quảng cáo khốc liệt.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-slate-350 block text-orange-300">📊 Thu Phí Hằng Tháng Định Kỳ Cứng Nhắc:</span>
                  <p className="text-[10.5px]">Bắt người dùng trả phí định kỳ khiến họ đề phòng rất cao ở Việt Nam. Khâu thuyết phục vô cùng tốn thời gian và rớt phễu cực lẹ.</p>
                </div>
              </div>
            </div>

            {/* Guerrilla Card */}
            <div className="bg-gradient-to-br from-emerald-950/20 via-slate-950/40 to-emerald-950/20 border border-emerald-950/35 rounded-3xl p-5 space-y-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-2 border-b border-emerald-950/20 pb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-400">II. THIẾT YẾU DU KÍCH 0đ (Hiệu suất tuyệt đối)</h4>
                  <p className="text-[10px] text-emerald-505 font-bold">Giúp sống dẻo dai, bền bỉ và dễ hái tiền số đông</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-text-secondary">
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-emerald-300 block">💎 Chi Phí Vận Hành Tiệm Cận 0đ:</span>
                  <p className="text-[10.5px] leading-relaxed">Ưu tiên tối đa giải pháp Offline-first (lưu trữ SQLite/LocalStorage cục bộ). Tận dụng Vercel Serverless, Supabase Free Tier, Google App Script.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-emerald-300 block">⚡ Lập Trình Thần Tốc (MVP dưới 5 ngày):</span>
                  <p className="text-[10.5px] leading-relaxed">Chì giải quyết duy nhất 1 nỗi đau vàng (Pain Point). Lợi dụng AI đóng gói sạch mã nguồn thô đưa gấp ra thị trường đo lường.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-emerald-300 block">📣 Marketing Lan Truyền Hữu Cơ (No Ads Budget):</span>
                  <p className="text-[10.5px] leading-relaxed">Biến hành vi thực tế (kẹt xe lội nước, trôi bill shop nhỏ) thành kịch bản video ngắn TikTok bám sát tâm lý số đông để kéo traffic tự phát về.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-emerald-300 block">💰 Đóng Gói 'Rẻ Quên Sầu' (Tính mốc 15k - 49k):</span>
                  <p className="text-[10.5px] leading-relaxed">Giá bán chỉ bằng cốc cà phê vỉa hè hoặc ổ bánh mì ăn sáng mua đứt vĩnh viễn không quảng cáo. Triệt tiêu rào cản phòng bị tâm lý của người dùng.</p>
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE MINDMAP BOARD */}
          <div className="bg-[#04080d]/90 border border-slate-900 rounded-3xl p-5 shadow-xl space-y-5">
            <div>
              <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">INTERACTIVE ROADMAP & CHI QUYỀN</span>
              <h3 className="text-sm font-black text-text-primary uppercase mt-1">
                🗺️ Sơ Đồ Tư Duy Chuỗi Tác Chiến Tăng Trưởng 4 Giai Đoạn
              </h3>
              <p className="text-[11px] text-text-secondary font-medium leading-relaxed mt-1">
                Bấm chọn từng nốt sơ đồ dưới đây để bóc rã bộ giải pháp chi tiết đi cùng danh sách Check-list, công nghệ 0đ và bí thuật tối cao từ các AI Coach:
              </p>
            </div>

            {/* Mindmap Nodes Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none relative pt-2">
              {STREMY_NODES.map((node, nIdx) => {
                const isSelected = selectedStrategyId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedStrategyId(node.id)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-900 hover:border-border-primary'
                    }`}
                  >
                    {nIdx < 3 && (
                      <div className="hidden lg:block absolute top-1/2 -right-1 w-2.5 h-[1.5px] bg-bg-primary z-10"></div>
                    )}
                    
                    <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                      <span className="text-[8px] font-black font-mono text-emerald-400 tracking-wider block">
                        {node.phase}
                      </span>
                      <h4 className="text-xs font-black text-text-primary group-hover:text-emerald-300 transition-colors">
                        {node.title}
                      </h4>
                    </div>

                    <div className="mt-3 flex justify-center items-center gap-1">
                      {isSelected ? (
                        <span className="text-[8px] font-black bg-emerald-500 text-slate-900 px-2 py-0.5 rounded leading-none">
                          ĐANG XEM
                        </span>
                      ) : (
                        <span className="text-[8px] font-black text-text-tertiary group-hover:text-text-secondary transition-all">
                          XEM CHI TIẾT →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED NODE DETAILS VIEW */}
            {selectedStrategyId && (() => {
              const activeNode = STREMY_NODES.find(n => n.id === selectedStrategyId);
              if (!activeNode) return null;
              return (
                <div className="grid lg:grid-cols-12 gap-6 pt-2 items-start text-left">
                  <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-4">
                    <div>
                      <span className="text-[10px] font-mono font-black text-emerald-400 tracking-wider uppercase block">
                        📋 {activeNode.phase}
                      </span>
                      <h4 className="text-sm font-black text-text-primary mt-1">
                        🔑 {activeNode.title}
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed font-semibold">
                        {activeNode.goal}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10.5px] font-black text-emerald-300 flex items-center gap-1.5">
                        🛠️ CÔNG CỤ HOÀN TOÀN 0đ KHUYÊN DÙNG:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeNode.toolStack.map((tool, tIdx) => (
                          <span key={tIdx} className="bg-bg-primary text-text-secondary border border-border-primary text-[10px] font-bold px-2.5 py-1 rounded-lg">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#04080e]/80 p-3 rounded-xl border border-slate-900/60">
                      <span className="text-[10px] font-black text-emerald-404 tracking-wider block uppercase font-mono">
                        🎯 CHỈ SỐ MỤC TIÊU CỐT LÕI (KPI):
                      </span>
                      <p className="text-[11.5px] text-emerald-400 font-mono font-bold mt-1">
                        {activeNode.metric}
                      </p>
                    </div>

                    <div className="text-[11px] text-text-secondary font-semibold leading-relaxed border-t border-slate-900 pt-3">
                      <span className="font-black text-text-primary block mb-1">Mô tả định vị:</span>
                      {activeNode.details}
                    </div>
                  </div>

                  <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-4 min-h-[300px]">
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-text-primary uppercase tracking-wider block flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Danh sách hành động cụ thể (Sản xuất ngay)
                      </span>
                      <div className="space-y-2 pt-1">
                        {activeNode.actionChecklist.map((item, id) => (
                          <div key={id} className="flex items-start gap-2 text-[11px] text-text-secondary font-semibold leading-relaxed">
                            <span className="text-emerald-400 shrink-0 mt-0.5 font-mono font-black">{id + 1}.</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 bg-gradient-to-r from-emerald-950/20 to-transparent p-3.5 rounded-xl border border-emerald-950/30">
                      <span className="text-[11px] font-black text-emerald-404 uppercase tracking-wider block flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                        Bí thuật du kích (Guerilla Hacks)
                      </span>
                      <div className="space-y-2 pt-1">
                        {activeNode.guerillaHacks.map((item, id) => (
                          <div key={id} className="flex items-start gap-2 text-[10.5px] text-text-secondary font-semibold leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5 shadow shadow-emerald-500/50"></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 bg-[#04080e]/60 p-3 rounded-xl border border-slate-900/65">
                      <span className="text-[10px] font-black text-purple-400 uppercase block">
                        ⚙️ Gửi ý tưởng này đến AI Agents ngay:
                      </span>
                      <p className="text-[10px] text-slate-505 font-semibold leading-relaxed">
                        Bấm nút dưới để nạp nhanh prompt tương tác trực chiến với nhóm Agent tác chiến lập trình của bạn!
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('agents');
                          if (selectedStrategyId === 'stage_1') {
                            setSelectedAgentId('agent_growth_hacker');
                            setAgentUserInput('Hãy cùng tôi hoàn thành bản nháp ý tưởng sản phẩm siêu ngách (Micro-Niche Product) của tôi. Tôi muốn tìm kiếm 3 nỗi xúc động / bức xúc mãnh liệt nhất của người bán hàng trực tuyến cá nhân nhỏ tại Việt Nam liên quan đến thủ thuật hạch toán dòng tiền, trôi hóa đơn khi livestream.');
                          } else if (selectedStrategyId === 'stage_2') {
                            setSelectedAgentId('agent_dev');
                            setAgentUserInput('Code cho tôi toàn bộ bộ khung lớp JavaScript thuần (hoặc GDScript Godot) để duy trì sao lưu dữ liệu cục bộ an sau, có khả năng sao chép, phục hồi offline khi mất mạng.');
                          } else if (selectedStrategyId === 'stage_3') {
                            setSelectedAgentId('agent_vietqr');
                            setAgentUserInput('Hãy lập trình luồng mã nguồn NodeJS đối soát VietQR tự động, có phân tách cú pháp cú hích thanh toán bằng regex để mở khoá VIP không tốn chi phí ròng.');
                          } else {
                            setSelectedAgentId('agent_growth_hacker');
                            setAgentUserInput('Hãy lên cho tôi kế hoạch viết bài mô tả ASO chuẩn xác cho Google Play & chợ Steam. Nhắm trúng cụm từ khoá đặc biệt ít cạnh tranh nhưng có lượt tìm kiếm mặn nồng tại Việt Nam.');
                          }
                          setAgentOutput('');
                        }}
                        className="w-full mt-1.5 py-2.5 text-[10px] font-black uppercase bg-bg-primary hover:bg-emerald-950/20 text-slate-350 hover:text-emerald-400 border border-border-primary hover:border-emerald-500/30 rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Nạp prompts và mở "Biệt Đội AI Agent"
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* SUB-TAB 2: ROADMAP 12 STEPS */}
      {strategySubTab === 'roadmap' && (() => {
        const completedCount = completedSteps.length;
        const completionPercentage = Math.round((completedCount / 12) * 100);
        
        const ROADMAP_PHASES = [
          {
            title: '🌱 GIAI ĐOẠN 0 — NỀN MÓNG (1–3 THÁNG)',
            steps: [
              { id: 'step_1', name: 'Bước 1: Chọn 1 ngôn ngữ mộc & học chuyên sâu', desc: 'Chọn Python (nếu thiên về dữ liệu, ML/data app) hoặc JavaScript/TypeScript (nếu chuộng web + mobile web). Đừng dàn trải học song song cả hai.' },
              { id: 'step_2', name: 'Bước 2: Luyện kỹ năng Git & GitHub cơ bản', desc: 'Quản lý mã nguồn thô đưa lên GitHub hoàn toàn miễn phí. Đây là kỹ năng rèn luyện thiết thiết thực học ngay tuần đầu!' },
              { id: 'step_3', name: 'Bước 3: Rèn luyện trí óc dùng AI pair-programming', desc: 'Lợi dụng lực đẩy của Claude, Cursor AI, Windsurf hoặc Copilot để viết code cùng AI dọn sạch cú pháp rườm rà.' }
            ]
          },
          {
            title: '🚀 GIAI ĐOẠN 1 — SẢN PHẨM ĐẦU TAY (3–6 THÁNG)',
            steps: [
              { id: 'step_4', name: 'Bước 4: Đóng gói micro-app kế toán/tài chính nhỏ', desc: 'Khai thác lợi thế hiểu nghiệp vụ sâu để làm sổ thu chi cá nhân/SME, phân tích BCTC, dashboard kiểm toán nhỏ. Publish web miễn phí (Vercel/Netlify).' },
              { id: 'step_5', name: 'Bước 5: Tiếp cận framework phát triển game tối giản', desc: 'Học Godot Engine (Cực bốc cho PC + Mobile, nhẹ tưng dưới 25MB) hoặc Phaser.js (game chạy ngay trên Web HTML5 mượt mà).' },
              { id: 'step_6', name: 'Bước 6: Launch mini game đầu tiên', desc: 'Publish miễn phí lên itch.io lấy ý kiến phản hồi thực tiễn, không tốn bất cứ chi phí publisher hay ads nào.' }
            ]
          },
          {
            title: '📌 GIAI ĐOẠN 2 — MỞ RỘNG ĐA NỀN TẢNG (6–12 THÁNG)',
            steps: [
              { id: 'step_7', name: 'Bước 7: Thiết lập Cross-Platform Di Động', desc: 'Dùng Flutter (Dart) hoặc React Native để compile sang cả Android và iOS từ đúng 1 codebase duy nhất.' },
              { id: 'step_8', name: 'Bước 8: Đưa sản phẩm lên Chợ ứng dụng di động', desc: 'Ưu tiên nạp $25 một lần cho Google Play Store trước. Phiên bản Apple App Store ($99/năm) thì để sau khi có kinh nghiệm dồi dào.' },
              { id: 'step_9', name: 'Bước 9: Gài trí khôn Machine Learning tăng tầm giá trị', desc: 'Tích hợp tự phân loại giao dịch bằng NLP thô, dự báo dòng tiền chi tiêu ngắn hạn, hay cảnh báo hạch toán red flags.' }
            ]
          },
          {
            title: '💰 GIAI ĐOẠN 3 — THƯƠNG MẠI HÓA DU KÍCH (12–24 THÁNG)',
            steps: [
              { id: 'step_10', name: 'Bước 10: Rải file, bán sỉ trên đa chợ song song', desc: 'Bán trực tiếp qua itch.io, Google Play, Gumroad, Lemon Squeezy hoặc Web app tự phát của chính mình.' },
              { id: 'step_11', name: 'Bước 11: Định mức giá hời "rẻ nhưng nhiều" để hút khách', desc: 'Định giá siêu rẻ hạt dẻ từ $1 - $5 (15k đến 119k VND). Giảm ngưỡng quyết định mua của người Việt về không.' },
              { id: 'step_12', name: 'Bước 12: Độc chiêu - Template hoá codebase core', desc: 'Tách nhân gốc phần mềm kế toán hoặc game, nhân bản ra 10 ngách khác nhau chỉ trong 2 tuần bằng cách đổi logo, thay da (reskin).' }
            ]
          }
        ];

        return (
          <div className="space-y-6">
            {/* Visual Progress Header */}
            <div className="bg-[#03060c] p-6 rounded-3xl border border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono font-black text-emerald-404 uppercase tracking-widest block">LEARNING PROGRESS MONITOR</span>
                <h3 className="text-sm font-black text-text-primary uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Trình Đo Lường Tiến Độ Chiến Dịch Học & Hành (12 Bước)
                </h3>
                <p className="text-[11px] text-text-secondary font-semibold max-w-2xl leading-relaxed">
                  Đo lường các cột mốc thực thi để không bị lạc lối giữa rừng lý thuyết. Bấm tích trực tiếp để cập nhật thành tựu.
                </p>
              </div>
              <div className="w-full sm:w-auto shrink-0 space-y-2 text-right">
                <div className="flex justify-between sm:justify-end gap-2.5 text-xs font-extrabold">
                  <span className="text-text-secondary">Tiến độ chiến dịch:</span>
                  <span className="text-emerald-404 font-mono text-xs">{completedCount}/12 Bước ({completionPercentage}%)</span>
                </div>
                <div className="w-full sm:w-48 bg-bg-primary h-2 rounded-full overflow-hidden border border-border-primary">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                </div>
              </div>
            </div>

            {/* Vertical Stepper layout splitting into phase cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {ROADMAP_PHASES.map((phase, pIdx) => (
                <div key={pIdx} className="bg-slate-950/70 border border-slate-900 rounded-3xl p-5 space-y-3.5 relative text-left">
                  <div className="absolute right-4 top-4 text-[10px] font-mono font-bold text-slate-700">
                    PHASE 0{pIdx}
                  </div>
                  <h4 className="text-xs font-black text-text-primary border-b border-slate-900 pb-2.5 tracking-tight uppercase">
                    {pIdx === 0 && "🌱 "}
                    {pIdx === 1 && "🚀 "}
                    {pIdx === 2 && "📌 "}
                    {pIdx === 3 && "💰 "}
                    {phase.title}
                  </h4>
                  <div className="space-y-3 pt-1">
                    {phase.steps.map((st) => {
                      const isDone = completedSteps.includes(st.id);
                      return (
                        <div 
                          key={st.id} 
                          onClick={() => toggleStep(st.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex gap-3 relative overflow-hidden select-none ${
                            isDone 
                              ? 'bg-emerald-500/5 border-emerald-500/30' 
                              : 'bg-bg-primary/40 border-slate-850 hover:bg-bg-primary/80 hover:border-border-primary'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              isDone 
                                ? 'bg-emerald-500 border-emerald-400 text-slate-955' 
                                : 'border-border-secondary bg-slate-955'
                            }`}>
                              {isDone && <Check className="w-3 h-3 stroke-[4px]" />}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className={`text-[11px] font-black block transition-all ${
                              isDone ? 'text-emerald-400 line-through' : 'text-slate-200'
                            }`}>
                              {st.name}
                            </span>
                            <p className="text-[10px] text-text-secondary font-semibold leading-relaxed">
                              {st.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Technical prioritizing flow chart */}
            <div className="bg-[#04080d]/80 p-5 rounded-3xl border border-slate-900 space-y-4">
              <div className="text-left">
                <span className="text-[10px] font-mono font-black text-emerald-404 uppercase tracking-widest block">OPTIMIZED TECHNICAL LEARNING FLOW</span>
                <h3 className="text-sm font-black text-text-primary uppercase mt-1">
                  🛠️ Trật Tự Ưu Tiên Lĩnh Hội Công Nghệ Bậc Thầy
                </h3>
                <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-relaxed">
                  Bám sát sơ đồ phân kỳ này giúp bạn tích lũy kiến thức sâu hẹp, không lo bị ngập lụt lý thuyết mông lung:
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
                {[
                  { step: "1. Git & Github", tech: "Trực quan quản lý code", color: "border-blue-500/20 text-blue-404 bg-blue-955/5" },
                  { step: "2. Chọn 1 Ngôn Ngữ", tech: "JS/TS hoặc Python mộc", color: "border-purple-500/20 text-purple-404 bg-purple-955/5" },
                  { step: "3. Khung Web/Game", tech: "FastAPI / React / Godot", color: "border-indigo-500/20 text-indigo-404 bg-indigo-955/5" },
                  { step: "4. Deploy Đóng Gói", tech: "Vercel / itch.io / App", color: "border-emerald-500/20 text-emerald-404 bg-emerald-955/5" },
                  { step: "5. Cổng Thanh Toán", tech: "VietQR, PayOS, Telegram", color: "border-pink-500/20 text-pink-404 bg-pink-955/5" },
                  { step: "6. Trí Tuệ Nhân Tạo", tech: "NLP thô, ONNX, ML Model", color: "border-amber-500/20 text-amber-404 bg-amber-955/5" }
                ].map((stepObj, sidx) => (
                  <div key={sidx} className={`p-4 rounded-2xl border ${stepObj.color} text-center space-y-1 hover:border-border-secondary transition-all cursor-default`}>
                    <span className="text-[8px] font-mono font-black uppercase opacity-60">PHÂN ĐỒ 0{sidx + 1}</span>
                    <h4 className="text-[11px] font-black text-text-primary">{stepObj.step}</h4>
                    <p className="text-[9px] text-text-tertiary font-bold leading-tight">{stepObj.tech}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* SUB-TAB 3: NICHE CONCEPTS */}
      {strategySubTab === 'niches' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#060a12] via-emerald-950/20 to-purple-950/15 border border-slate-900 rounded-3xl p-6 relative overflow-hidden text-left">
            <span className="text-[10px] font-mono font-black text-emerald-404 uppercase tracking-widest block">HOW TO LEVERAGE YOUR SPECIALTIES</span>
            <h3 className="text-sm font-black text-text-primary mt-1 uppercase">
              🏆 Hào Sâu Bảo Vệ (Moat): Sự Giao Thoa Nghiệp Vụ Tài Chính & Kỹ Thuật
            </h3>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed max-w-4xl font-semibold">
              Các lập trình viên bên ngoài thường không biết nghiệp vụ kế toán, hóa đơn, hạch toán kép dán mác. Bạn là người am hiểu <strong className="text-emerald-400 font-bold">Kế toán, Kiểm toán tài vụ, BA, DA</strong> — hãy lấy đây làm lá chắn và vũ khí thượng tầng để thiết kế phần mềm sắc lẹm, giải quyết trúng bí bách thủ công tiềm ẩn của người dùng.
            </p>
          </div>

          <div className="space-y-3.5 text-left">
            <span className="text-xs font-black text-text-primary uppercase tracking-wider block">
              🎯 8 Ý Tưởng Thiết Kế Sản Phẩm Độc Đáo
            </span>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Kế toán SME Trực Chiến", label: "Hộ Kinh Doanh", goal: "Sổ sách thu chi mộc mạc, lọc hóa đơn tự động bằng Regex, báo cáo quý gọn gàng cho cơ sở bán sỉ lặt vặt.", moat: "Xử lý nghiệp vụ thuế, hạch toán giản đơn đúng chuẩn bản địa Việt Nam." },
                { title: "Trợ lý VN-Index & Định Giá", label: "Phân Tích Tài Chính", goal: "Dashboard nội bộ định giá DCF, bảng lọc chỉ số P/E, tự động lấy dữ liệu tài chính vĩ mô.", moat: "Nền tảng lý thuyết tài vụ chặt chẽ, tạo độ uy tín dữ liệu chân xác tuyệt đối." },
                { title: "Game Giáo dục Kinh tế cổ điển", label: "Game Giáo Dục", goal: "Phần mềm giả lập/mini game đấu trí dòng tiền, quiz kế toán sòng phẳng cho học sinh, sinh viên học thực nghiệm.", moat: "Xây dựng tình huống quản lý thực tế thú vị, dẹp bỏ lý thuyết suông." },
                { title: "Trợ thủ Kiểm Toán Chênh Lệch", label: "Kiểm Toán Trợ Lý", goal: "Tool tự động so sánh, đối chiếu chứng từ sỉ, phát hiện bất động luồng tiền.", moat: "Kênh nghiệm thực tế phát hiện sơ hở kiểm toán báo cáo của dân Big4 thực thụ." },
                { title: "Sổ Chi Tiêu Tinh Gọn Di Động", label: "Ngân Sách Cá Nhân", goal: "Dành riêng cho PC/Mobile, lưu trữ SQLite mọc, tự phân tích red-flags chi tiêu bằng logic AI thợ.", moat: "Hạ mức giá bán mua đứt cực thấp phá rào tâm lý e dè của người dùng phổ thông." },
                { title: "Sơ Đồ PRD & Mindmap Tool cho BA", label: "Business Analyst Tool", goal: "Addon/Web app vẽ Mindmap, gen sườn PRD tức tốc, gợi ý kịch bản test case cho BA thợ.", moat: "Nhắm trúng khó khăn thiết thực hàng ngày của BA/DA khi đối ứng khách hàng phức tạp." },
                { title: "Game Quản Lý Nông Trại Idle Realistic", label: "Game Mô Phỏng", goal: "Game mô phỏng vận hành nông trại có cơ tính lạm phát, khấu hao sòng phẳng.", moat: "Toán học phân phối dòng tiền tinh tế tạo trải nghiệm hấp dẫn sâu sắc (Game feel)." },
                { title: "Excel / Sheets Automation Addon", label: "Kế Toán Excel Tool", goal: "Extension/Macro gài tự động tra cứu mã số thuế, tính toán nhanh NPV, IRR, dọn sạch bảng tính.", moat: "Đón lõng thói quen làm việc hàng đêm với trang tính của hàng triệu dân văn phòng." }
              ].map((nc, id) => (
                <div key={id} className="bg-slate-950 p-4.5 rounded-2xl border border-slate-900 space-y-3 hover:border-border-primary transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono font-black text-emerald-400 px-2 py-0.5 border border-emerald-500/25 rounded-md bg-emerald-500/5 block">
                      {nc.label}
                    </span>
                    <span className="text-[10px] text-text-tertiary font-mono font-bold">Concept 0{id + 1}</span>
                  </div>
                  <h4 className="text-xs font-black text-text-primary">{nc.title}</h4>
                  <p className="text-[10px] text-text-secondary font-semibold leading-relaxed">
                    <strong className="text-slate-305 block mb-0.5">Sản phẩm:</strong>
                    {nc.goal}
                  </p>
                  <div className="pt-2 border-t border-slate-900 text-[10px] text-emerald-405 font-bold leading-normal">
                    <span className="text-text-tertiary font-semibold block mb-0.5">🛡️ Hào bảo vệ (Moat):</span>
                    {nc.moat}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution channels compared */}
          <div className="grid md:grid-cols-2 gap-6 pt-2 text-left">
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 space-y-4">
              <h4 className="text-xs font-black text-text-primary uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Bản Đồ Kênh Phân Phối Đa Chiều (Không Sót Kênh Nào)
              </h4>

              <div className="space-y-3.5 text-xs leading-relaxed font-semibold">
                <div className="bg-bg-primary/40 p-4 rounded-2xl border border-slate-850">
                  <span className="text-[10.5px] text-text-primary font-bold block">📱 Phân khúc Di Động (Mobile Android & iOS):</span>
                  <p className="text-[10px] text-text-secondary mt-1 leading-normal">
                    - Google Play Console: Phí $25 một lần duy nhất, duyệt thoáng hơn, tệp khách di động khổng lồ. Ưu tiên hàng đầu.
                    <br />- Apple App Store: Phí $99/năm, xét duyệt kỹ lưỡng. Chỉ nên tiến tới khi sản phẩm Android bắt đầu đem về dòng tiền thực chất.
                  </p>
                </div>

                <div className="bg-bg-primary/40 p-4 rounded-2xl border border-slate-850">
                  <span className="text-[10.5px] text-text-primary font-bold block">💻 Phân khúc Máy Tính (PC itch.io) & Chợ Mềm:</span>
                  <p className="text-[10px] text-text-secondary mt-1 leading-normal">
                    - itch.io: Miễn phí phát hành hoàn toàn. Cộng đồng game thủ cực kỳ cởi mở với lập trình viên indie. Cơ chế chọn % chia sẻ doanh thu siêu thấp dễ dãi.
                    <br />- Gumroad / Lemon Squeezy: Bán trực tiếp file cài đặt PC, bộ template, macro xịn. Thanh toán visa cực lẹ, chiết khấu chỉ từ 5-10%.
                    <br />- Web App tự chủ: Deploy lên Vercel/Netlify miễn phí, đấu nối PayOS nạp VietQR động, 0% chiết khấu trung gian, dòng tiền nạp về tài khoản ngân hàng lập tức!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-955 p-5 rounded-3xl border border-slate-900 space-y-4">
              <h4 className="text-xs font-black text-text-primary uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Thương Mại Hoá Bằng Triết Lý "Rẻ Mà Nhiều" (Volume Beats Margin)
              </h4>

              <div className="space-y-4 text-xs text-text-secondary leading-relaxed font-semibold">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-205 block font-bold">🛒 Giá bán siêu rẻ hạt dẻ ($1 – $5):</span>
                  <p className="text-[10px] text-slate-450">Set up mức mua đứt vĩnh viễn vặt từ 15k đến 119k VND. Biến chiêu mua sắm thành quyết định trong 3 giây không cần đắn đo của người bán hàng hay game thủ Việt.</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-205 block font-bold">🔄 Gói thuê bao subscription mini ($0.5–$1/tháng):</span>
                  <p className="text-[10px] text-slate-450">Tích hợp tiện ích thông báo, đồng bộ sao lưu đám mây cực rẻ ngang bình trà đá. Tạo lập MRR (doanh thu định kỳ tháng) bền vững tích lũy dần theo quy mô.</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-205 block font-bold">🎯 Chiến thuật "Xác Reskin - Da Khác":</span>
                  <p className="text-[10px] text-slate-450">Một khi có khung game idle nông trại ổn định, hãy nhân bản rồi dán cốt truyện nuôi cá, gom dọn rác xanh, RESKIN thần tốc 5 game mới trong vòng 1 tháng nhắm tới đa dạng từ khóa nhỏ.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AI WEAPONS */}
      {strategySubTab === 'weapons' && (
        <div className="space-y-6 text-left">
          <div className="bg-gradient-to-r from-emerald-950/20 via-[#060a12] to-slate-950 border border-slate-900 rounded-3xl p-5 relative overflow-hidden">
            <span className="text-[10px] font-mono font-black text-emerald-400 tracking-widest block">ZERO BUDGET AI TOOL STACK</span>
            <h3 className="text-sm font-black text-text-primary mt-1 uppercase">
              ⚔️ Kho Vũ Khí AI Khởi Nghiệp 0 VNĐ (Quay Vòng Hết Quota Free)
            </h3>
            <p className="text-xs text-slate-450 mt-1 leading-relaxed max-w-3xl font-semibold">
              Lợi dụng sự cạnh tranh khốc liệt giữa các gã khổng lồ công nghệ để lách quota miễn phí. Công cụ này nghẽn kịch khung, lập tức dời đô sang công cụ khác để duy trì chi phí ròng rã bằng 0 VNĐ:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Gemini API (Google AI)", role: "Bộ Não Xử Lý Payload", code: "free_tier_2b_tokens", desc: "Cấp quota 15 request/phút miễn phí vĩnh viễn. Rất phù hợp để phân tích, bóc tách cấu trúc hóa đơn phức tạp, regex hóa thông điệp Telegram." },
              { title: "Hugging Face ONNX Runtime", role: "Trí Khôn Chạy Trên Thiết Bị", code: "on_device_inference", desc: "Nạp các model NLP siêu nhỏ định dạng ONNX chạy trực tiếp trên trình duyệt hoặc app di động của khách hàng. Chi phí vận hành máy chủ = 0 VNĐ." },
              { title: "Stable Diffusion XL (SDXL)", role: "Art & Sprites Generator", code: "generation_free_apis", desc: "Tận dụng các API miễn phí của Segmind hoặc HF để vẽ hàng loạt ảnh chibi, nhân vật 2D, sprite sheets retro pixel chỉ bằng mô tả văn bản." },
              { title: "Telegram Bot API webhook", role: "Cầu Nối Đồng Bộ Nạp VIP", code: "realtime_push_0_cost", desc: "Không dùng server VPS đắt đỏ, gọi webhook của Google App Script để bot Telegram tự gửi báo cáo đối soát hóa đơn tức khắc về điện thoại." }
            ].map((wp, widx) => (
              <div key={widx} className="bg-slate-955 p-4 rounded-xl border border-slate-900 space-y-3 hover:border-border-primary transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono font-bold text-text-tertiary bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                    {wp.role}
                  </span>
                  <span className="text-[8.5px] font-mono font-black text-emerald-400 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/15 rounded">
                    {wp.code}
                  </span>
                </div>
                <h4 className="text-xs font-black text-text-primary">{wp.title}</h4>
                <p className="text-[10px] text-text-secondary font-semibold leading-relaxed">
                  {wp.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: RULES & TRAPS */}
      {strategySubTab === 'rules' && (
        <div className="grid md:grid-cols-2 gap-6 text-left">
          {/* Rules Card */}
          <div className="bg-slate-955 p-5 rounded-3xl border border-slate-900 space-y-4">
            <h4 className="text-xs font-black text-text-primary uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              4 Nguyên Tắc Lập Trình Tối Thượng (Tránh Cạm Bẫy)
            </h4>

            <div className="space-y-4 text-xs font-semibold leading-relaxed">
              <div className="space-y-1">
                <span className="text-emerald-404 font-bold text-[11px] block">1. Quy tắc scope nhỏ khép kín:</span>
                <p className="text-[10px] text-text-secondary">Không mở rộng tính năng theo thói quen ngẫu hứng. Mọi nỗ lực phải dồn vào việc đưa sản phẩm MVP thô ra thị trường đo lường phản hồi trong dưới 1 tuần.</p>
              </div>
              <div className="space-y-1">
                <span className="text-emerald-404 font-bold text-[11px] block">2. Ưu tiên offline-first tuyệt đối:</span>
                <p className="text-[10px] text-text-secondary">Dùng SQLite cục bộ hoặc LocalStorage để người dùng lưu tiến trình. Cắt bỏ 100% database Cloud đắt tiền ở giai đoạn đầu để solo founder không lo gánh nợ VPS.</p>
              </div>
              <div className="space-y-1">
                <span className="text-emerald-404 font-bold text-[11px] block">3. Code review sạch rác:</span>
                <p className="text-[10px] text-text-secondary">Tránh viết mã rườm rà. Lợi dụng AI dọn sạch các import lỗi thời, các console log rác trước khi compile đóng gói bundle nhằm tối ưu tối đa dung lượng tệp tải.</p>
              </div>
              <div className="space-y-1">
                <span className="text-emerald-404 font-bold text-[11px] block">4. Bảo mật JWT & Vault:</span>
                <p className="text-[10px] text-text-secondary">Không bao giờ lưu cứng API key của OpenAI hay Gemini trong code client-side. Phải nạp qua Vault bảo mật an toàn ở backend để chống rò rỉ phá hoại hóa đơn.</p>
              </div>
            </div>
          </div>

          {/* Traps Card */}
          <div className="bg-slate-955 p-5 rounded-3xl border border-slate-900 space-y-4">
            <h4 className="text-xs font-black text-rose-405 uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
              5 Cạm Bẫy Quen Thuộc Khiến Startup Chết Yểu
            </h4>

            <div className="space-y-4 text-xs font-semibold leading-relaxed">
              <div className="space-y-1">
                <span className="text-rose-455 font-bold text-[11px] block">1. Cạm bẫy mơ hồ (Feature Creep):</span>
                <p className="text-[10px] text-text-secondary">Xây dựng hàng tá tính năng phụ phức tạp mà thực tế 98% khách hàng không bao giờ bấm vào, dẫn tới trễ hạn ra mắt chợ hàng tháng trời.</p>
              </div>
              <div className="space-y-1">
                <span className="text-rose-455 font-bold text-[11px] block">2. Đốt tiền vào quảng cáo trả phí (Paid Ads):</span>
                <p className="text-[10px] text-text-secondary">Chạy Ads Facebook khi sản phẩm chưa đạt độ tối ưu giữ chân (Retention Metric), khiến tiền quảng cáo thâm hụt ví rất nhanh.</p>
              </div>
              <div className="space-y-1">
                <span className="text-rose-455 font-bold text-[11px] block">3. Bỏ bê khâu kiểm thử (QA/QC):</span>
                <p className="text-[10px] text-text-secondary">Deploy ứng dụng lỗi tràn lan khiến những người dùng đầu tiên giận dữ gỡ app và viết đánh giá 1 sao hủy diệt uy tín vĩnh viễn.</p>
              </div>
              <div className="space-y-1">
                <span className="text-rose-455 font-bold text-[11px] block">4. Thu phí thuê bao cứng nhắc (SaaS Trap):</span>
                <p className="text-[10px] text-text-secondary">Bắt khách trả phí hàng tháng ngay lập tức ở Việt Nam. Hãy chuyển sang bán Lifetime Deal (mua đứt vĩnh viễn) cực rẻ ở giai đoạn đầu để gom khách nhanh.</p>
              </div>
              <div className="space-y-1">
                <span className="text-rose-455 font-bold text-[11px] block">5. Lười Reskin nhân bản:</span>
                <p className="text-[10px] text-text-secondary">Không chịu reskin nhân bản codebase lõi ra nhiều ứng dụng ngách khác nhau. Đừng bỏ trứng vào duy nhất 1 giỏ ứng dụng mạo hiểm.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: PROPOSAL DETAILS */}
      {strategySubTab === 'proposal' && (
        <div className="space-y-6">
          {/* SECTION: INTERACTIVE GANTT TIMELINE SCHEDULE */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-6">
            <div className="text-left">
              <span className="text-[10px] font-mono font-black text-emerald-400 block uppercase tracking-widest">INTERACTIVE GANTT TIMELINE</span>
              <h4 className="text-sm font-black text-text-primary uppercase mt-1">
                📅 Sơ Đồ Tiến Độ Gantt & Kế Hoạch 5 Pha Tác Chiến
              </h4>
              <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-normal">
                Quy trình sản xuất phần mềm khép kín từ lúc phát ý tưởng đến bàn giao vận hành thực chiến. Bấm trực tiếp vào các thanh tiến độ bên dưới để xem báo cáo phân kỳ chi tiết:
              </p>
            </div>

            {/* Gantt Visual Bars Container */}
            <div className="space-y-3 bg-[#03060c] p-5 rounded-2xl border border-slate-900/60 font-sans text-left">
              {[
                { id: 0, label: 'Pha 1: Khởi động & Khảo Sát Phân Tích', duration: 'Tháng 0 - 2', pct: 'w-2/12', color: 'from-blue-500 to-indigo-600', icon: '🔍' },
                { id: 1, label: 'Pha 2: Thiết kế UI/UX & Code MVP', duration: 'Tháng 2 - 5', pct: 'w-5/12 ml-[16.6%]', color: 'from-amber-500 to-orange-600', icon: '💻' },
                { id: 2, label: 'Pha 3: Kiểm thử toàn diện & Hiệu chỉnh lỗi', duration: 'Tháng 5 - 7', pct: 'w-2/12 ml-[41.6%]', color: 'from-purple-500 to-pink-600', icon: '🛡' },
                { id: 3, label: 'Pha 4: Ra mắt thử nghiệm & ASO Chợ Di Động', duration: 'Tháng 7 - 9', pct: 'w-2/12 ml-[58.3%]', color: 'from-teal-500 to-emerald-600', icon: '🚀' },
                { id: 4, label: 'Pha 5: Khai thác thương mại & Reskin nhân bản', duration: 'Tháng 9 - 18', pct: 'w-9/12 ml-[75%]', color: 'from-emerald-500 to-green-600', icon: '💰' }
              ].map((phaseItem) => {
                const isActive = activeProposalPhase === phaseItem.id;
                return (
                  <div 
                    key={phaseItem.id}
                    onClick={() => setActiveProposalPhase(phaseItem.id)}
                    className={`group cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-bg-primary/60 p-2.5 rounded-xl border border-border-primary' 
                        : 'hover:bg-bg-primary/20 p-2.5 rounded-xl border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-bold gap-1 mb-1.5">
                      <span className={`${isActive ? 'text-emerald-404' : 'text-slate-205'} flex items-center gap-1.5`}>
                        <span>{phaseItem.icon}</span>
                        <span>{phaseItem.label}</span>
                      </span>
                      <span className="text-text-tertiary font-mono text-[11px]">{phaseItem.duration}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900 relative">
                      <div className={`h-full bg-gradient-to-r ${phaseItem.color} rounded-full transition-all duration-300 ${phaseItem.pct}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Details card for currently selected phase */}
            {(() => {
              const PHASE_DETAILS = [
                {
                  id: 0,
                  title: 'Pha 1: Khảo Sát Thị Trường & Phân Tích Nghiệp Vụ (Yêu Cầu Cơ Bản)',
                  time: 'Tháng 0 - 2 (Học mộc & Đóng khung PRD)',
                  role: 'Project Manager (PM), Business Analyst (BA), Technical Lead',
                  goals: 'Kiểm soát phạm vi dự án cốt lõi (Scope Lock) trước khi bắt tay viết dòng code đầu tiên. Đóng băng các câu chuyện người dùng để tránh rạn nứt cấu trúc về sau.',
                  tasks: [
                    'Khảo sát các sạp hàng, hội nhóm để tổng hợp 3 nỗi bực tức nóng bỏng nhất của tệp khách hàng mục tiêu.',
                    'Vẽ sơ đồ luồng dữ liệu thô (Data Flow Diagram) và thiết kế Star Schema SQLite trên máy tính cá nhân.',
                    'Viết tài liệu đặc tả PRD thu thu gọn, bóc tách chính xác những tính năng "buộc phải có" và loại hẳn tính năng "có cho đẹp".',
                    'Thiết lập cấu trúc thư mục Github chuẩn mực khoa học, dọn sạch code mẫu lỗi thời.'
                  ],
                  tools: 'ChatGPT, Perplexity Research, Figma, Git & GitHub repositories',
                  deliverable: 'Bản tài liệu đặc tả PRD kỹ thuật mộc + Bản vẽ Wireframe tương tác đen trắng tối giản.',
                  financialAdvice: 'Trong 60 ngày này, chi phí ròng hoạt động hoàn toàn bằng 0đ. Tận dụng tuyệt đối khối óc và công cụ AI miễn phí.'
                },
                {
                  id: 1,
                  title: 'Pha 2: Thiết Kế UI/UX Flat & Lập Trình Lõi MVP Bằng Agile/Sprint',
                  time: 'Tháng 2 - 5 (Code cường lực theo Sprint 2 tuần)',
                  role: 'Lead Developer, UI/UX Designer, DevOps Engineer',
                  goals: 'Xây dựng bộ xương cốt lõi chạy ổn định. Mọi chức năng phụ như cài đặt nâng cao, đổi hình nền v.v. đều bị tạm gác lại. Tập trung hoàn chỉnh module nghiệp vụ chính.',
                  tasks: [
                    'Lập trình module hạch toán dữ liệu thô hoặc cơ chế tương tác trò chơi 2D.',
                    'Thực thi kết nối Webhook thanh toán VietQR động để dòng tiền có thể đổ về tài khoản không cần chi chiết khấu cho bên thứ ba.',
                    'Đóng gói logic SQLite/Edge-computing chạy offline mượt mà không cần truy vấn máy chủ liên tục để bóp nghẹt chi phí VPS.',
                    'Tổ chức review mã nguồn (Code Review) cuối tuần để dọn sạch rác cú pháp và phòng ngừa rò rỉ bộ nhớ.'
                  ],
                  tools: 'React Native, Flutter, Godot 4, Cursor AI Code, PayOS SDKs',
                  deliverable: 'Bản build thô cục bộ (Local MVP Build) chạy trơn tru trên thiết bị giả lập.',
                  financialAdvice: 'Không thuê VPS đắt tiền giai đoạn này. Chạy thử nghiệm cục bộ hoàn toàn hoặc deploy lên Vercel Free-tier.'
                },
                {
                  id: 2,
                  title: 'Pha 3: Kiểm Thử Toàn Diện & Tinh Chỉnh Sản Phẩm (Hiệu Chỉnh Tinh Gọn)',
                  time: 'Tháng 5 - 7 (Diệt lỗi & Đo đạc độ bám sản phẩm)',
                  role: 'Tester / Quality Control (QC), QA Analyst, Core Developer',
                  goals: 'Đạt độ chín muồi ổn định kỹ thuật kỹ càng trước khi tung ra thị trường. Không để người dùng đầu tiên thất vọng vì ứng dụng liên tục treo cứng.',
                  tasks: [
                    'Tổ chức viết kịch bản kiểm thử (Test Cases) phủ kín 100% các dòng nghiệp vụ then chốt.',
                    'Mời 10-15 người dùng thân thiết trải nghiệm trước (Chương trình Beta Kín) nhằm thu thập phản hồi va chạm thực tế.',
                    'Đo lường thời gian đáp ứng API, tốc độ tải app dưới 3 giây và sút lỗi bộ nhớ đột ngột.',
                    'Xây dựng các câu thông báo lỗi thông minh hữu ích để người dùng tự khắc phục mà không cần hỗ trợ thủ công.'
                  ],
                  tools: 'Jest, Selenium, Firebase Crashlytics, Google Form Feedback',
                  deliverable: 'Cơ sở dữ liệu lỗi sạch (Zero-Bug Release-Candidate) + Sản phẩm đã được tối ưu hóa tốc độ tải.',
                  financialAdvice: 'Chi phí duy trì khoảng 100k-200k VND mua tên miền chính chủ (.vn hoặc .com). Mọi máy chủ test đều dùng hàng miễn phí.'
                },
                {
                  id: 3,
                  title: 'Pha 4: Ra Mắt Thử Nghiệm & ASO Lên Các Chợ Đa Kênh',
                  time: 'Tháng 7 - 9 (Rải file & Gài đặt marketing du kích)',
                  role: 'DevOps / IT Lead, Marketing Specialist, Solo Founder',
                  goals: 'Mở cửa rộng rãi để thu thập Traction (Lượng truy cập hữu cơ). Định vị đúng từ khóa ngách trên App Store nhằm biến lượt tìm kiếm tự nhiên thành người dùng.',
                  tasks: [
                    'Đăng ký tài khoản Google Play Console ($25 đóng một lần vĩnh viễn) để đẩy app lên store.',
                    'Tối ưu hóa công cụ tìm kiếm trên chợ (ASO) - Viết tiêu đề, mô tả chuẩn từ khóa ngách ít cạnh tranh.',
                    'Tạo các trang Landing Page đẹp bốc mặt giới thiệu sản phẩm để người dùng Web dễ dàng tải file hoặc dùng thử tức thì.',
                    'Thiết lập thông báo tự động (Push Notifications) khơi gợi người dùng quay lại ứng dụng mỗi ngày.'
                  ],
                  tools: 'Google Play Console, Vercel Production, CapCut, Buffer',
                  deliverable: 'Đường dẫn tải ứng dụng công khai sòng phẳng + Landing Page hoàn chỉnh đón khách.',
                  financialAdvice: 'Chi phí $25 làm vốn Google. Tuyệt đối không chi tiền chạy quảng cáo Facebook/Google Ads. Thay vào đó hãy tập trung sản xuất 3 video ngắn lên TikTok/Reels tự nhiên.'
                },
                {
                  id: 4,
                  title: 'Pha 5: Khai Thác Thương Mại, Pivot Linh Hoạt & Nhân Bản Codebase',
                  time: 'Tháng 9 - 18 (Gặt dòng tiền & Reskin thần tốc)',
                  role: 'Full-stack Product Team & Business Developer',
                  goals: 'Kiếm dòng tiền đều đặn tích tiểu thành đại. Sẵn sàng đổi hướng nếu phát hiện ngách mới bạo phát hơn nhờ bộ codebase gốc đã được mô-đun hóa sòng phẳng.',
                  tasks: [
                    'Kích hoạt cơ chế thanh toán mở gói VIP tự động bằng VietQR/PayOS động theo nguyên tắc "Rẻ nhưng nhiều".',
                    'Theo dõi chỉ số MRR (Doanh thu đều đặn hàng tháng) và tỷ lệ rời đi (Churn Rate) của ví khách để tối ưu trải nghiệm.',
                    'Thực hiện chiến thuật "Hồn Trương Ba Da Hàng Thịt" - đổi logo, thay da, bóc tách cấu trúc để reskin thành 5 app ngách khác nhau trong 2 tuần.',
                    'Phát triển hoàn thiện hệ thống phản hồi chăm sóc khách hàng tự động để giảm tải sức ép solo founder.'
                  ],
                  tools: 'PayOS Analytics, Google Sheets CRM, ElevenLabs AI Voice Support',
                  deliverable: 'Bộ 5 sản phẩm ngách phái sinh gặt hái dòng tiền song song trên chợ di động & web app.',
                  financialAdvice: 'Dùng chính dòng tiền thu hoạch của 100 khách hàng đầu tiên để bù vào chi phí duy trì VPS (khoảng $5/tháng). Dự án đạt mốc Hòa Vốn Kỹ Thuật.'
                }
              ];

              const currentPhase = PHASE_DETAILS[activeProposalPhase];

              return (
                <div className="bg-[#03060c] p-5 rounded-2xl border border-slate-900/80 space-y-4 text-left font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-3 gap-2">
                    <div>
                      <span className="text-[9px] font-mono font-black text-emerald-404 block uppercase tracking-wider">PHASE 0{currentPhase.id + 1} DETAILED REPORT</span>
                      <h5 className="text-xs font-black text-text-primary mt-0.5">{currentPhase.title}</h5>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-404 border border-emerald-500/20 px-2.5 py-1 rounded-md font-mono font-bold shrink-0">
                      ⏱️ {currentPhase.time}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5 text-xs text-text-secondary leading-relaxed font-semibold">
                    <div className="space-y-3 font-sans">
                      <div>
                        <span className="text-[10px] font-mono font-black text-text-tertiary uppercase block">👥 Nhân sự và vai trò chính:</span>
                        <p className="text-slate-350 font-bold mt-0.5">{currentPhase.role}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-black text-slate-550 uppercase block">🎯 Mục tiêu cốt lõi pha:</span>
                        <p className="mt-0.5 leading-relaxed">{currentPhase.goals}</p>
                      </div>
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                        <span className="text-[10px] font-mono font-black text-emerald-400 uppercase block">📦 Sản phẩm bàn giao (Deliverable):</span>
                        <p className="text-emerald-300 font-bold mt-0.5">{currentPhase.deliverable}</p>
                      </div>
                    </div>

                    <div className="space-y-3 font-sans">
                      <div>
                        <span className="text-[10px] font-mono font-black text-slate-550 uppercase block">🛠️ Nhiệm vụ thực thi quan trọng:</span>
                        <div className="space-y-1.5 pt-1">
                          {currentPhase.tasks.map((task, i) => (
                            <div key={i} className="flex items-start gap-2 text-[10.5px]">
                              <span className="text-emerald-405 font-bold font-mono">{i + 1}.</span>
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-900/60">
                        <span className="text-[10px] font-mono font-black text-purple-400 uppercase block">💡 Tư vấn tối ưu tài chính 0đ (Guerilla Way):</span>
                        <p className="text-[11px] text-purple-300 mt-0.5">{currentPhase.financialAdvice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* SECTION: KPI SIMULATOR & MONITORING DASHBOARD */}
          <div className="grid lg:grid-cols-12 gap-6 text-left">
            <div className="lg:col-span-8 bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-6">
              <div>
                <span className="text-[10px] font-mono font-black text-indigo-400 block uppercase tracking-widest">KPI DASHBOARD INTERACTIVE SIMULATOR</span>
                <h4 className="text-sm font-black text-text-primary uppercase mt-1">
                  📊 Trình Theo Dõi Chỉ Số Sức Khỏe Dự Án (FastWork Standard)
                </h4>
                <p className="text-[11px] text-text-secondary font-semibold mt-1">
                  Công thức chuẩn đan xen rủi ro định lượng nhằm giảm thiểu thất bại từ sớm. Di chuyển các thanh trượt bên phải để giả lập các biến số thực chiến và xem kết quả phân tích:
                </p>
              </div>

              {/* Simulator visual gauges */}
              {(() => {
                const rawSuccess = (simulatedScopeVelocity * 0.4) + (100 - (simulatedBudgetBurnRate - 100) * 0.3) - (simulatedBugRate * 4.5);
                const successFactorScore = Math.max(5, Math.min(100, Math.round(rawSuccess)));
                
                let ratingText = '';
                let ratingColor = '';
                let ratingDesc = '';
                let ratingRef = '';

                if (successFactorScore >= 80) {
                  ratingText = 'RẤT ĐÁNG HỨA HẸN (OPTIMAL)';
                  ratingColor = 'text-emerald-404 shadow-emerald-500/20';
                  ratingDesc = 'Hệ số rủi ro cực thấp. Quy trình phát triển Agile kết hợp kiểm soát của Scrum đang phát huy tác dụng tuyệt đối. Bạn sở hữu từ khóa ngách sâu, code gọn gàng không rác, dòng tiền thu hồi nhanh chống chết yểu!';
                  ratingRef = 'Theo khảo sát của Viện FMIT (2024), 85% startup tinh gọn áp dụng quy trình kiểm soát MVP đúng chuẩn sẽ cán mốc hòa vốn trong dưới 12 tháng.';
                } else if (successFactorScore >= 55) {
                  ratingText = 'ỔN ĐỊNH TRONG TẦM TAY (STABLE)';
                  ratingColor = 'text-amber-400 shadow-amber-500/20';
                  ratingDesc = 'Dự án ở mức an toàn trung bình. Tiến độ có chịu chút áp lực hoặc bug hệ thống còn lác đác. Hãy chú ý dọn dẹp lỗi hồi quy và thắt chặt phạm vi tránh tình trạng ôm đồm tính năng ngoài PRD.';
                  ratingRef = 'Khuyến nghị Base.vn (2023): Hãy áp dụng lập tức cuộc họp Sprint Retrospective cuối tuần để dọn sạch nút thắt cổ chai kỹ thuật.';
                } else {
                  ratingText = 'NGUY CƠ TAN VỠ CAO (CRITICAL)';
                  ratingColor = 'text-rose-450 shadow-rose-500/10 animated-pulse';
                  ratingDesc = 'Hệ số an toàn đang ở mức đỏ chuông báo động! Code bị rỉ lỗi hoặc ngân sách burnrate quá khốc liệt do thuê máy chủ quá đắt đỏ. Bạn cần dứt khoát bóc tách, đưa toàn bộ cơ sở dữ liệu về SQLite client mộc mạc và đóng băng scope!';
                  ratingRef = 'Quản trị rủi ro (Tạp chí Công Thương): Hãy kích hoạt lập tức kế hoạch ứng phó khẩn cấp, cắt giảm tính năng phụ để kéo dài tuổi thọ của ví.';
                }

                return (
                  <div className="space-y-4 font-sans">
                    <div className="bg-[#03060c] p-5 rounded-2xl border border-slate-900/70 flex flex-col sm:flex-row items-center gap-6 justify-between">
                      <div className="space-y-1.5 text-center sm:text-left">
                        <span className="text-[9px] font-mono font-black text-text-tertiary uppercase tracking-widest block">DỰ BÁO XÁC SUẤT CẬP BỜ THÀNH CÔNG</span>
                        <div className="text-xl font-black text-text-primary flex items-center justify-center sm:justify-start gap-2.5 font-sans">
                          <span>Factor Score:</span>
                          <span className={`font-mono text-2xl ${ratingColor}`}>{successFactorScore}%</span>
                        </div>
                        <span className={`text-xs font-black block tracking-tight ${ratingColor}`}>{ratingText}</span>
                        <p className="text-[10.5px] text-text-secondary font-semibold max-w-xl leading-relaxed mt-1">
                          {ratingDesc}
                        </p>
                        <p className="text-[9.5px] text-purple-400 font-bold border-t border-slate-900/60 pt-2 italic">
                          📚 {ratingRef}
                        </p>
                      </div>

                      <div className="shrink-0 relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="#0c1322" strokeWidth="9" fill="transparent" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            stroke={successFactorScore >= 80 ? '#34d399' : successFactorScore >= 55 ? '#fbbf24' : '#f87171'} 
                            strokeWidth="9" 
                            fill="transparent" 
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * successFactorScore) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-lg font-black text-text-primary font-mono">{successFactorScore}%</span>
                          <span className="text-[8px] font-mono font-black text-text-tertiary uppercase tracking-widest">HEALTH</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3.5 pt-2">
                      <div className="bg-bg-primary/30 p-3.5 rounded-xl border border-slate-900/80 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-black text-text-tertiary">
                          <span>TIẾN ĐỘ SPRINT</span>
                          <span className="text-blue-404 font-mono font-bold">{simulatedScopeVelocity}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div className="bg-blue-404 h-full transition-all duration-300" style={{ width: `${simulatedScopeVelocity}%` }}></div>
                        </div>
                        <span className="text-[9.5px] text-text-secondary font-bold block leading-relaxed">
                          {simulatedScopeVelocity >= 85 ? '🟢 Về đích vượt dự kiến.' : '🟡 Chậm trễ dây dưa 1-2 tuần.'}
                        </span>
                      </div>

                      <div className="bg-bg-primary/30 p-3.5 rounded-xl border border-slate-900/80 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-black text-text-tertiary">
                          <span>BURN-RATE VỐN</span>
                          <span className="text-amber-400 font-mono font-bold">{simulatedBudgetBurnRate}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${Math.min(100, (simulatedBudgetBurnRate / 150) * 100)}%` }}></div>
                        </div>
                        <span className="text-[9.5px] text-text-secondary font-bold block leading-relaxed">
                          {simulatedBudgetBurnRate <= 100 ? '🟢 Trong hạn mức dự chi.' : '🔴 Vượt quá ngân quỹ ròng!'}
                        </span>
                      </div>

                      <div className="bg-bg-primary/30 p-3.5 rounded-xl border border-slate-900/80 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-black text-text-tertiary">
                          <span>TỶ LỆ LỖI (BUG INDEX)</span>
                          <span className="text-purple-400 font-mono font-bold">{simulatedBugRate}/10</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div className="bg-purple-400 h-full transition-all duration-300" style={{ width: `${simulatedBugRate * 10}%` }}></div>
                        </div>
                        <span className="text-[9.5px] text-text-secondary font-bold block leading-relaxed">
                          {simulatedBugRate <= 3 ? '🟢 Mã nguồn sạch hoàn hảo.' : '🟡 Cần bổ sung test case diệt bọ.'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right side: Sliders to change parameters */}
            <div className="lg:col-span-4 bg-slate-950 p-6 rounded-3xl border border-slate-900 flex flex-col justify-between space-y-5">
              <div className="space-y-4 font-sans text-left">
                <span className="text-[10px] font-mono font-black text-emerald-404 block uppercase tracking-widest border-b border-slate-900 pb-2">
                  🛠️ THAM SỐ GIẢ LẬP
                </span>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-305">Năng suất Sprint (Velocity):</span>
                    <span className="text-blue-404 font-mono font-bold">{simulatedScopeVelocity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    value={simulatedScopeVelocity}
                    onChange={(e) => setSimulatedScopeVelocity(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-bg-primary h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-550 font-semibold block leading-tight">Mô tả độ nhanh hoàn thành nhiệm vụ và đóng băng scope của bạn.</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-305">Tỷ lệ tiêu hao vốn (Burn Rate):</span>
                    <span className="text-amber-400 font-mono font-bold">{simulatedBudgetBurnRate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={simulatedBudgetBurnRate}
                    onChange={(e) => setSimulatedBudgetBurnRate(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-bg-primary h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-550 font-semibold block leading-tight">Burnrate trên 100% nghĩa là bạn đang chi quá nhiều cho VPS/marketing.</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-305">Hệ số lỗi thừa (Bug Density):</span>
                    <span className="text-purple-400 font-mono font-bold">{simulatedBugRate}/10</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={simulatedBugRate}
                    onChange={(e) => setSimulatedBugRate(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-bg-primary h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-550 font-semibold block leading-tight">Tỷ lệ lỗi phát sinh sau khi deploy. Càng thấp chứng tỏ test càng kỹ dán mác.</span>
                </div>
              </div>

              <div className="bg-[#04080e] p-3 rounded-xl border border-slate-900 text-[10px] text-text-tertiary leading-relaxed font-semibold">
                <span className="text-text-primary block font-black mb-1">Mẹo tối ưu sức khỏe dự án:</span>
                Giữ <strong className="text-emerald-450 font-bold">Tiến độ &gt; 90%</strong>, <strong className="text-emerald-450 font-bold">Chi phí &lt; 90%</strong> và <strong className="text-emerald-450 font-bold">Bọ &lt; 2</strong> để đạt hệ chất lượng tối ưu tuyệt đối!
              </div>
            </div>
          </div>

          {/* SECTION: RISK MITIGATION MATRICES */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-4">
            <div className="text-left font-sans">
              <span className="text-[10px] font-mono font-black text-rose-400 block uppercase tracking-widest">PROJECT SHIELD — RISK MITIGATION CHECKLIST</span>
              <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2 mt-1">
                <h4 className="text-sm font-black text-text-primary uppercase flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                  Phòng Diệt 6 Nguy Cơ Đổ Vỡ Dự Án (Quy Trình Chuẩn Quốc Tế)
                </h4>
                {(() => {
                  const totalRisks = 6;
                  const preparesCount = readyMitigations.length;
                  const safetyIndex = Math.round((preparesCount / totalRisks) * 100);
                  return (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-xl font-sans font-black text-xs">
                      🛡️ Lực Cản Rủi Ro (Safety Index): {safetyIndex}%
                    </div>
                  );
                })()}
              </div>
              <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-normal font-sans">
                Quá trình quản trị rủi ro trải qua 5 bước: Lập chiến lược, Nhận diện rủi ro, Phân tích hậu quả, Đắp sẵn biện pháp ứng phó và Giám sát liên lục (Tạp chí Công Thương). Tích chọn các lá chắn bạn đã hoàn thành chuẩn bị bên dưới:
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans text-left">
              {[
                {
                  id: 'mit_scope_1',
                  title: '🚩 1. Nguy cơ phình to phạm vi (Scope Creep)',
                  desc: 'Mở rộng tính năng theo thói quen ngẫu hứng, gây hụt hơi về thời gian.',
                  remedy: 'Đóng băng PRD MVP dứt khoát. Chỉ chấp nhận tính năng mới khi phiên bản 1.0 hoàn thành thu hoạch.',
                  color: 'border-blue-500/20 bg-blue-955/5 text-blue-404'
                },
                {
                  id: 'mit_scope_2',
                  title: '⏰ 2. Trễ tiến độ kéo dài dây dưa',
                  desc: 'Thời lượng coding bị đội lên do gặp lỗi công nghệ, thiếu nhân sự.',
                  remedy: 'Sản xuất theo chu kỳ ngắn Sprint 2 tuần (Agile/Scrum). Có cuộc họp review định kỳ sửa đổi sai lệch tức thời.',
                  color: 'border-amber-500/20 bg-amber-955/5 text-amber-404'
                },
                {
                  id: 'mit_schedule_1',
                  title: '🪲 3. Suy hao chất lượng mã nguồn',
                  desc: 'Sản phẩm phát hành đầy rẫy bọ treo cứng gây mất uy tín ban đầu.',
                  remedy: 'Thiết lập danh mục Test Cases phủ kịch khung luồng nghiệp vụ. Thực hành code review kỹ lưỡng trước khi build.',
                  color: 'border-purple-500/20 bg-purple-955/5 text-purple-404'
                },
                {
                  id: 'mit_quality_1',
                  title: '🔥 4. Bẫy phụ thuộc công nghệ mới',
                  desc: 'Chọn framework quá khó, cộng đồng hỗ trợ quá bé, khó sửa lỗi.',
                  remedy: 'Ưu thế hóa ngôn ngữ mộc bám sâu vững chắc. Sử dụng cấu trúc modul hóa hoàn thiện để dễ hoán đổi.',
                  color: 'border-rose-500/20 bg-rose-955/5 text-rose-404'
                },
                {
                  id: 'mit_tech_1',
                  title: '🍂 5. Sai lệch thị trường (No Market Fit)',
                  desc: 'Xây dựng sản phẩm không ai muốn dùng, không ai thèm trả tiền.',
                  remedy: 'Ra mắt trước phiên bản Pilot cực gọn (Build-Measure-Learn). Thường xuyên thu lượm feedback thực tế xoay trục lẹ làng.',
                  color: 'border-teal-500/20 bg-teal-955/5 text-teal-404'
                },
                {
                  id: 'mit_market_1',
                  title: '🦴 6. Cạn kiệt dòng tiền duy trì',
                  desc: 'Máy chủ Cloud/VPS tính phí tích lũy vặt thọc thủng túi solo founder.',
                  remedy: 'Ưu tiên cơ chế lưu trữ cục bộ (Offline-first, SQLite). VPS chỉ đóng vai trò Webhook, chi phí duy trì tiến sát 0đ.',
                  color: 'border-sky-500/20 bg-sky-955/5 text-sky-455'
                }
              ].map((risk) => {
                const isChecked = readyMitigations.includes(risk.id);
                return (
                  <div 
                    key={risk.id}
                    onClick={() => {
                      setReadyMitigations(prev => 
                        prev.includes(risk.id) 
                          ? prev.filter(id => id !== risk.id) 
                          : [...prev, risk.id]
                      );
                    }}
                    className={`p-4.5 rounded-2xl border text-left cursor-pointer transition-all select-none relative overflow-hidden ${
                      isChecked 
                        ? 'bg-emerald-500/5 border-emerald-500/30' 
                        : 'bg-bg-primary/30 border-slate-900 hover:bg-bg-primary/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <span className={`${isChecked ? 'text-emerald-404 font-bold' : 'text-text-secondary'} font-bold text-xs`}>
                        {risk.title}
                      </span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-955' : 'border-slate-705 bg-slate-955'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-text-tertiary font-semibold mt-1 leading-normal">
                      {risk.desc}
                    </p>
                    <div className="pt-2.5 mt-2.5 border-t border-slate-900/60 text-[10px] text-slate-450 leading-relaxed font-semibold">
                      <strong className="text-emerald-403 block mb-0.5 font-bold">🛡️ Biện pháp ứng phó:</strong>
                      {risk.remedy}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION: BUILD-MEASURE-LEARN COMPASS GRAPH */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-4 text-left">
            <div>
              <span className="text-[10px] font-mono font-black text-purple-400 block uppercase tracking-widest">BUSINESS EXPERIMENT COMPASS</span>
              <h4 className="text-sm font-black text-text-primary uppercase mt-1">
                🏗️ Vòng Lặp Học Hỏi Tinh Gọn & Độc Chiêu Xoay Trục (Lean Startup - FMIT)
              </h4>
              <p className="text-[11px] text-text-secondary font-semibold mt-1 leading-relaxed">
                Đừng chỉ lập trình cắm đầu. Hãy lắng nghe từng chuyển động phản hồi thực địa từ nhóm khách đơn sơ nhất của bạn thông qua dòng tuần hoàn học hỏi tinh gọn:
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
              {[
                { step: "Sản Xuất (Build)", subtitle: "Chưng cất MVP", highlight: "Phát biểu chính xác PRD rút gọn trong 5 ngày.", desc: "Mã hóa luồng nghiệp vụ cốt lõi nhất không màu mè.", color: "border-blue-500/20 text-blue-404 bg-blue-955/5" },
                { step: "Đo lường (Measure)", subtitle: "Đo lường Traction", highlight: "Thống kê lượt cài đặt, đo tỉ lệ mở app hàng tuần.", desc: "Kiểm nghiệm kịch khung xem khách hàng thực tế có bực tức gỡ app.", color: "border-purple-500/20 text-purple-404 bg-purple-955/5" },
                { step: "Khảo sát (Learn)", subtitle: "Lắng nghe phản hồi", highlight: "Trực chiến email, chăm sóc khách trả lời sau 5 phút.", desc: "Chắt lọc mỏ vàng bài học từ 100 người dùng đầu tiên.", color: "border-teal-500/20 text-teal-404 bg-teal-955/5" },
                { step: "Xoay Trục (Pivot)", subtitle: "Điều hướng sắc lẹm", highlight: "Rũ bỏ tính năng thừa, nhân bản sang ngách béo bở khác.", desc: "Sẵn sàngReskin reskinreskin reskinreskin reskin codebase khi phát hiện ngách mới bạo phát.", color: "border-pink-500/20 text-pink-404 bg-pink-955/5" },
                { step: "Tăng trưởng (Scale)", subtitle: "Tích tiểu thành đại", highlight: "Duy trì MRR rẻ từ số lượng lớn khách hàng Việt.", desc: "Tăng trưởng traffic tự nhiên không đốt tiền Ads.", color: "border-emerald-500/20 text-emerald-404 bg-emerald-955/5" }
              ].map((comp, cidx) => (
                <div key={cidx} className={`p-4 rounded-2xl border ${comp.color} space-y-2 hover:border-border-primary transition-all cursor-default`}>
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-mono font-black uppercase opacity-60">VÒNG LẶP 0{cidx + 1}</span>
                    <h4 className="text-[11.5px] font-black text-text-primary">{comp.step}</h4>
                    <span className="text-[9.5px] font-bold block opacity-80">{comp.subtitle}</span>
                  </div>
                  <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">
                    {comp.desc}
                  </p>
                  <div className="pt-2 border-t border-slate-900 text-[9.5px] leading-normal font-bold">
                    <span className="text-text-tertiary font-semibold block mb-0.5">⚡ Hành động:</span>
                    {comp.highlight}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: Scrum Agile Standard metrics summary table */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-4 text-left">
            <div>
              <span className="text-[10px] font-mono font-black text-indigo-400 block uppercase tracking-widest">SCRUM STANDARDS & MAINTAINANCE</span>
              <h4 className="text-sm font-black text-text-primary uppercase mt-1">
                📈 Quy Chuẩn Scrum Agile & Kế Hoạch Bảo Trì Vận Hành Thực Tế
              </h4>
              <p className="text-[11px] text-text-secondary font-semibold mt-1">
                Để solo founder không bị quá tải khi dự án phát triển rộng lớn. Dưới đây là bảng đối sánh giữa quy trình làm việc mơ hồ với quy trình tác chiến du kích chuẩn khoa học:
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-900 rounded-2xl">
              <table className="w-full text-[11px] font-sans text-left border-collapse">
                <thead>
                  <tr className="bg-bg-primary border-b border-slate-850 text-slate-450 uppercase font-black tracking-wider text-[9px]/none">
                    <th className="p-4 py-3">Hạng mục kiểm soát</th>
                    <th className="p-4 py-3 text-rose-405">Lối mòn mơ hồ (Thất bại)</th>
                    <th className="p-4 py-3 text-emerald-404">Quy trình Du Kích (Thành công)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 font-semibold text-text-secondary">
                  <tr>
                    <td className="p-4 py-3 font-bold text-text-secondary">Hoạch định yêu cầu</td>
                    <td className="p-4 py-3 leading-normal">Nghĩ đâu viết code đó, liên tục thay đổi scope ngẫu hứng làm hụt hơi.</td>
                    <td className="p-4 py-3 leading-normal text-emerald-400/90 font-bold">Đóng khóa PRD MVP cực gọn, cam kết không phình to scope trong Sprint.</td>
                  </tr>
                  <tr>
                    <td className="p-4 py-3 font-bold text-text-secondary">Quản lý Tiến độ</td>
                    <td className="p-4 py-3 leading-normal">Mơ hồ về ngày ra mắt, coding dây dưa 3-6 tháng không ra sản phẩm.</td>
                    <td className="p-4 py-3 leading-normal text-emerald-400/90 font-bold">Chia nhỏ task theo chu kỳ Sprint 2 tuần. Đặt mốc launch MVP &lt; 7 ngày.</td>
                  </tr>
                  <tr>
                    <td className="p-4 py-3 font-bold text-text-secondary">Định vị thị trường</td>
                    <td className="p-4 py-3 leading-normal">Xây sản phẩm đa năng khổng lồ cho mọi người (ERP lớn), không ai thèm mua.</td>
                    <td className="p-4 py-3 leading-normal text-emerald-400/90 font-bold">Chọn rõ Moat (Kế toán/Kiểm toán/BA/ML) và tệp khách trong nước thiết thực nhất.</td>
                  </tr>
                  <tr>
                    <td className="p-4 py-3 font-bold text-text-secondary">Học tập kỹ thuật</td>
                    <td className="p-4 py-3 leading-normal">Thay đổi ngôn ngữ framework liên tục theo trào lưu bên ngoài.</td>
                    <td className="p-4 py-3 leading-normal text-emerald-400/90 font-bold">Lĩnh hội sâu sắc 1 ngôn ngữ thô, quản lý Git tốt và phòng lỗi crash bộ nhớ.</td>
                  </tr>
                  <tr>
                    <td className="p-4 py-3 font-bold text-text-secondary">Quản trị Rủi ro</td>
                    <td className="p-4 py-3 leading-normal">Không lên phương án dự phòng, dễ sập tiệm khi hụt tiền.</td>
                    <td className="p-4 py-3 leading-normal text-emerald-400/90 font-bold">Xác định 5 bước quản rủi ro (Scope, Schedule, Quality, Tech, Market, Budget).</td>
                  </tr>
                  <tr>
                    <td className="p-4 py-3 font-bold text-text-secondary">Giám sát hiệu suất</td>
                    <td className="p-4 py-3 leading-normal">Mơ hồ cảm tính, không dựa vào thước đo khoa học nào.</td>
                    <td className="p-4 py-3 leading-normal text-emerald-400/90 font-bold">Theo sát 5 KPI chuẩn mực (Velocity, Burnrate, Bug Rate, Satisfaction, ROI).</td>
                  </tr>
                  <tr>
                    <td className="p-4 py-3 font-bold text-text-secondary">Duy trì & Bàn giao</td>
                    <td className="p-4 py-3 leading-normal">Mặc kệ code sau khi hoàn thành, dễ bốc hơi uy tín khách hàng.</td>
                    <td className="p-4 py-3 leading-normal text-emerald-400/90 font-bold">Bản tài liệu mộc gọn, kế hoạch bảo dưỡng vá lỗi 6-12 tháng bảo hộ khách hàng lẻ.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Handoff and Maintenance Strategy Summary */}
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 flex flex-col justify-between space-y-4 font-sans text-left">
            <div className="space-y-3.5">
              <h4 className="text-xs font-black text-text-primary uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                Chiến Lược Bàn Giao Kỹ Thuật & Duy Trì Hệ Thống 6–12 Tháng
              </h4>

              <div className="space-y-3 text-xs leading-relaxed font-semibold">
                <div className="bg-[#03060c] p-3 rounded-xl border border-slate-900">
                  <span className="text-[11px] text-text-primary font-bold block">📦 1. Quy trình bàn giao mã nguồn & Thiết kế:</span>
                  <p className="text-[10px] text-slate-450 mt-1">
                    - Toàn bộ source code được gom gọn, chú thích hoàn chỉnh từng hàm chính.
                    <br />- Đính kèm file hướng dẫn cụ thể cách gõ lệnh deploy cục bộ và cấu hình tên miền trong 3 phút.
                  </p>
                </div>

                <div className="bg-[#03060c] p-3 rounded-xl border border-slate-900">
                  <span className="text-[11px] text-text-primary font-bold block">🔌 2. Kế hoạch bảo trì vá lỗi định kỳ:</span>
                  <p className="text-[10px] text-slate-450 mt-1">
                    - Cam kết 1-2 tuần rà soát lại các dòng thông tin ghi lỗi Firebase Crashlytics để vá bọ.
                    <br />- Cập nhật phiên bản thư viện cốt lõi định kỳ để tránh lỗ hổng bảo mật rình rập hại túi tiền người dùng.
                  </p>
                </div>

                <div className="bg-[#03060c] p-3 rounded-xl border border-slate-900">
                  <span className="text-[11px] text-text-primary font-bold block">🎧 3. Thiết lập phễu hỗ trợ chăm sóc khách:</span>
                  <p className="text-[10px] text-slate-450 mt-1">
                    - Tổ chức kênh Mailbox chăm sóc riêng biệt. 100% khiếu nại mua hàng/nhận VIP được hệ thống tự động phản hồi trong dưới 15 phút.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-950/20 text-purple-300 font-mono text-[9px] p-2.5 rounded-xl border border-purple-900/30 font-semibold leading-relaxed">
              🎓 Tham khảo nguyên văn quy trình chuẩn thiết kế, bảo trì của Base.vn, FastWork, MISA AMIS và Viện FMIT để thiết lập cơ sở lý thuyết chặt chẽ tuyệt đối!
            </div>
          </div>
        </div>
      )}

      {/* FINAL ADVICE CHEATSHEET */}
      <div className="bg-gradient-to-r from-purple-950/15 via-[#060a12] to-emerald-950/15 border border-border-primary p-5 rounded-3xl space-y-3.5 shadow-xl font-sans text-left">
        <h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-emerald-400 animate-pulse" />
          LỜI KHUYÊN DU KÍCH CHO SOLO FOUNDER KHỞI NGHIỆP 0 VNĐ - PC & MOBILE
        </h4>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-text-secondary leading-relaxed font-semibold">
          <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
            <span className="text-text-primary font-bold block text-sm">1. Nhỏ Giao diện tối giản</span>
            <p className="text-[10.5px]">Đừng viết tính năng "Có cũng tốt" (Nice-to-have). Chỉ viết tính năng "Không có không thể dùng" (Must-have). Sự cô đọng tối đa cho phép bạn tung bản beta siêu tốc thử nghiệm.</p>
          </div>
          <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
            <span className="text-text-primary font-bold block text-sm">2. Đè Bẹp Chi Phí VPS</span>
            <p className="text-[10.5px]">Máy chủ, VPS đắt đỏ là kẻ thù số một của Indie. Khi chưa có tiền mặt ròng, hãy ưu tiên lưu SQLite, LocalStorage cục bộ trên thiết bị của khách hàng (Edge Computing). Serverless chỉ dùng làm cầu nối Webhook nạp tiền.</p>
          </div>
          <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
            <span className="text-text-primary font-bold block text-sm">3. Lắng Nghe Khách Sát Sao</span>
            <p className="text-[10.5px]">Một người dùng mua phần mềm của bạn trả 15.000đ hay 35.000đ đều mang lại mỏ vàng bài học phản hồi. Trả lời mail/tin nhắn hỗ trợ của khách trong 5 phút để tạo tệp fan trung thành đầu tiên lan toả giới thiệu truyền miệng.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
