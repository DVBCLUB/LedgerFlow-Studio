import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Heart, 
  Smile, 
  Frown, 
  Meh, 
  Search, 
  Send, 
  CheckCircle, 
  Mail, 
  Copy, 
  Trash2, 
  Calendar, 
  Star, 
  ExternalLink,
  MessageSquare,
  Workflow,
  Sparkles,
  Inbox
} from 'lucide-react';

interface FeedbackItem {
  id: number;
  author: string;
  company: string;
  score: number;
  content: string;
  category: 'positive' | 'neutral' | 'negative';
  date: string;
  approved: boolean;
}

export default function NPSReviewManager() {
  const { activeIdea } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'nps_survey' | 'sentiment_board' | 'testimonial_bank' | 'review_requests'>('nps_survey');

  // Shared state: dynamic feedbacks list
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([
    { id: 1, author: 'Anh Nguyễn Hoàng Minh', company: 'Đại lý Gạo sạch Minh Sang', score: 10, content: 'Bữa rà soát mã số thuế trước khi nộp tờ khai thuế GTGT siêu mượt. Đáng đồng tiền bát gạo!', category: 'positive', date: '2026-06-01', approved: true },
    { id: 2, author: 'Chị Lê Thị Tuyết', company: 'Hộ kinh doanh Thời trang Trẻ', score: 8, content: 'Giao diện tương đối dễ xài, xuất báo cáo Excel hạch toán đúng thông tư 88/80. Giá bản pro hơi nhỉnh xíu.', category: 'neutral', date: '2026-06-03', approved: true },
    { id: 3, author: 'Anh Trần Quốc Khánh', company: 'Công ty Cơ Điện Khánh An', score: 4, content: 'Hay bị trễ thông báo Zalo khi đồng bộ sao kê ngân hàng thủ công. Mong bên admin cập nhật tự động sớm.', category: 'negative', date: '2026-06-04', approved: false },
    { id: 4, author: 'Chị Mai Lan Anh', company: 'Café Acoustic Giai Điệu', score: 9, content: 'Trợ lý AI tư vấn tài chính rất thâm sâu, hỏi câu nào hạch toán kết sổ cái trả lời ro ro câu đó luôn á.', category: 'positive', date: '2026-06-05', approved: true },
    { id: 5, author: 'Admin Lê Hùng', company: 'Công ty Logistics Nam Phát', score: 7, content: 'Dùng ổn, thỉnh thoảng mở app hơi chậm tầm 3 giây trên điện thoại android.', category: 'neutral', date: '2026-06-06', approved: false },
    { id: 6, author: 'Chị Đỗ Thu Thảo', company: 'Lớp Học Tiếng Anh Thảo Đỗ', score: 3, content: 'Font chữ hơi nhỏ trên màn hình máy tính bảng khi đối soát báo cáo phân tich Benford.', category: 'negative', date: '2026-06-07', approved: false },
  ]);

  // Automated Trigger setup
  const [autoEmailTitle, setAutoEmailTitle] = useState<string>('Khảo sát hoàn tất - Nhận quà tri ân đặc quyền 🎁');
  const [autoEmailContent, setAutoEmailContent] = useState<string>('Chào {first_name},\n\nCảm ơn bạn rất nhiều vì đã chấm {nps_score} điểm cho LedgerFlow! Lòng tin của bạn là động lực lớn nhất của Solo Founder.\n\nHãy giúp mình viết một bài đánh giá nhanh trên Google Maps tại link: https://g.page/ledgerflow-vn/review để nhận ngay Ebook "Cơ chế Tối Ưu Thuế Cho Hộ Kinh Doanh" trị giá 1M VND nhé!');

  useEffect(() => {
    if (activeIdea) {
      const shortName = activeIdea.title.split(' - ')[0];
      const isGame = activeIdea.type === 'game';
      
      setFeedbacks([
        { 
          id: 1, 
          author: 'Anh Nguyễn Hoàng Minh', 
          company: isGame ? 'Hội Game thủ Sài Gòn' : 'Đại lý Gạo sạch Minh Sang', 
          score: 10, 
          content: isGame 
            ? `Bữa tải game "${shortName}" về chơi giải trí sau giờ làm việc siêu cuốn luôn. Đồ họa dễ thương quá trời!` 
            : `Mô-đun đối soát hoá đơn của "${shortName}" siêu mượt. Đáng đồng tiền bát gạo sau thuế!`, 
          category: 'positive', 
          date: '2026-06-01', 
          approved: true 
        },
        { 
          id: 2, 
          author: 'Chị Lê Thị Tuyết', 
          company: 'Hộ kinh doanh Thời trang Trẻ', 
          score: 8, 
          content: `Giao diện "${shortName}" tương đối dễ xài, tính năng hạch toán chuẩn chỉnh tự động hóa cao. Giá bản trọn gói hơi nhỉnh xíu nhưng hợp lý.`, 
          category: 'neutral', 
          date: '2026-06-03', 
          approved: true 
        },
        { 
          id: 3, 
          author: 'Anh Trần Quốc Khánh', 
          company: isGame ? 'Studio Sáng Tạo Hoạt Họa' : 'Công ty Cơ Điện Khánh An', 
          score: 4, 
          content: isGame 
            ? `Game "${shortName}" thỉnh thoảng hơi giật nhẹ khi chơi trên dòng máy cũ. Mong admin tối ưu hiệu năng.` 
            : `Hay bị trễ thông báo khi đối soát qua "${shortName}". Mong bên admin nâng cấp tự động hóa sớm.`, 
          category: 'negative', 
          date: '2026-06-04', 
          approved: false 
        },
        { 
          id: 4, 
          author: 'Chị Mai Lan Anh', 
          company: 'Café Acoustic Giai Điệu', 
          score: 9, 
          content: isGame 
            ? `Nhạc nền hay lắm nha, lối chơi của "${shortName}" cực kỳ vui nhộn, phù hợp xả stress!` 
            : `Bộ quản lý thu chi tiện ích của "${shortName}" rất thông minh, phân loại bằng AI dọn sạch sao kê cực kì nhanh chóng.`, 
          category: 'positive', 
          date: '2026-06-05', 
          approved: true 
        },
        { 
          id: 5, 
          author: 'Anh Lê Hùng', 
          company: 'Công ty Logistics Nam Phát', 
          score: 7, 
          content: `Ứng dụng dọn sao kê "${shortName}" dùng ổn, thỉnh thoảng mở app hơi chậm tầm 3 giây trên điện thoại android.`, 
          category: 'neutral', 
          date: '2026-06-06', 
          approved: false 
        },
        { 
          id: 6, 
          author: 'Chị Đỗ Thu Thảo', 
          company: 'Lớp Học Tiếng Anh Thảo Đỗ', 
          score: 3, 
          content: `Giao diện "${shortName}" hiển thị font chữ hơi nhỏ trên màn hình máy tính bảng khi đối soát báo cáo.`, 
          category: 'negative', 
          date: '2026-06-07', 
          approved: false 
        }
      ]);

      setAutoEmailContent(`Chào {first_name},\n\nCảm ơn bạn rất nhiều vì đã chấm {nps_score} điểm cho dự án "${shortName}" nhé! Lòng tin của bạn là động lực lớn nhất của Solo Founder.\n\nHãy giúp mình viết một bài đánh giá nhanh trên Google Maps tại link: https://g.page/ledgerflow-vn/review để nhận ngay quà lưu niệm đặc biệt dành riêng cho tệp khách hàng ${activeIdea.nicheAudience} trị giá 500K VND nhé!`);
    }
  }, [activeIdea]);

  // NPS Calculator values
  const npsCalculations = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) return { promoters: 0, passives: 0, detractors: 0, score: 0 };
    
    // Promoters (9-10), Passives (7-8), Detractors (0-6)
    const promoters = feedbacks.filter(f => f.score >= 9).length;
    const passives = feedbacks.filter(f => f.score >= 7 && f.score <= 8).length;
    const detractors = feedbacks.filter(f => f.score <= 6).length;

    const promotersPct = parseFloat(((promoters / total) * 100).toFixed(1));
    const passivesPct = parseFloat(((passives / total) * 100).toFixed(1));
    const detractorsPct = parseFloat(((detractors / total) * 100).toFixed(1));
    const score = Math.round(promotersPct - detractorsPct);

    return {
      promoters: promotersPct,
      passives: passivesPct,
      detractors: detractorsPct,
      score
    };
  }, [feedbacks]);

  // SUB TAB 1: NPS Simulator State
  const [simulatorScore, setSimulatorScore] = useState<number>(9);
  const [simulatorFeedback, setSimulatorFeedback] = useState<string>('');
  const [simulatorName, setSimulatorName] = useState<string>('');
  const [simulatorCompany, setSimulatorCompany] = useState<string>('');

  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateMockFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatorName.trim() || !simulatorFeedback.trim()) {
      alert('Vui lòng điền đủ tên và nội dung đánh giá!');
      return;
    }

    let cat: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (simulatorScore >= 9) cat = 'positive';
    else if (simulatorScore <= 6) cat = 'negative';

    const newItem: FeedbackItem = {
      id: Date.now(),
      author: simulatorName,
      company: simulatorCompany || 'KH Cá Nhân',
      score: simulatorScore,
      content: simulatorFeedback,
      category: cat,
      date: new Date().toISOString().split('T')[0],
      approved: false
    };

    setFeedbacks([newItem, ...feedbacks]);
    setSimulatorName('');
    setSimulatorCompany('');
    setSimulatorFeedback('');
    triggerNotification('Cảm ơn bạn! Phiếu khảo sát NPS giả lập đã được cập nhật vào Sentiment Kanban Board bên dưới!');
  };

  // Testimonial Bank approvals and copying
  const handleToggleApprove = (id: number) => {
    const updated = feedbacks.map(item => {
      if (item.id === id) {
        return { ...item, approved: !item.approved };
      }
      return item;
    });
    setFeedbacks(updated);
  };

  const handleCopyCode = (feedback: FeedbackItem) => {
    const code = `<!-- Testimonial Embed Card -->
<div class="border border-slate-200 p-4 rounded-xl shadow-sm">
  <div class="flex text-yellow-450 mb-1">★★★★★</div>
  <p class="text-xs text-slate-600 font-medium">"${feedback.content}"</p>
  <div class="text-xs font-bold text-slate-900 mt-2">${feedback.author}</div>
  <div class="text-[10px] text-slate-400">${feedback.company}</div>
</div>`;
    
    navigator.clipboard.writeText(code);
    triggerNotification('Đã sao chép mã nhúng (HTML Embed Code) vào Clipboard!');
  };

  // Automated Trigger setup

  return (
    <div className="bg-[#050911]/80 backdrop-blur-md rounded-2xl border border-slate-900/80 shadow-2xl overflow-hidden text-slate-200">
      
      {/* Banner / Header */}
      <div className="p-6 border-b border-slate-900/60 bg-gradient-to-r from-purple-950/20 via-slate-950 to-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-black font-mono">
              PHÂN HỆ 5.11
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
              NPS Surveys &amp; Social Proof Engine
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
            <Smile className="w-5 h-5 text-purple-400" />
            NPS &amp; Review Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Tự động thu thập ý kiến khách hàng (NPS), điều chế phân tích cảm xúc (Sentiment) thành các khối Testimonial uy tín để gia tăng tỷ lệ chuyển đổi bán hàng.
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-900 self-stretch md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('nps_survey')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'nps_survey'
                ? 'bg-purple-650 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            NPS Form &amp; Calculator
          </button>
          <button
            onClick={() => setActiveSubTab('sentiment_board')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'sentiment_board'
                ? 'bg-purple-650 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Kanban Cảm Xúc
          </button>
          <button
            onClick={() => setActiveSubTab('testimonial_bank')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'testimonial_bank'
                ? 'bg-purple-650 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Testimonial Bank
          </button>
          <button
            onClick={() => setActiveSubTab('review_requests')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'review_requests'
                ? 'bg-purple-650 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Tự Động Hóa Xin Review
          </button>
        </div>
      </div>

      {notification && (
        <div className="m-4 p-3 bg-purple-650/20 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="p-6">
        
        {/* SUB TAB 1: NPS LIVE SURVEY & METRICS CALCULATOR */}
        {activeSubTab === 'nps_survey' && (
          <div className="space-y-6">
            
            {/* Real-time statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Overall NPS */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-center space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black block font-mono">Điểm Số NPS Tổng</span>
                <p className={`text-3xl font-mono font-black ${npsCalculations.score >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {npsCalculations.score > 0 ? `+${npsCalculations.score}` : npsCalculations.score}
                </p>
                <span className="text-[9.5px] text-slate-400">
                  Phạm vi tốt: +30 đến +70%
                </span>
              </div>

              {/* Promoters */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-center space-y-1 border-b-2 border-b-emerald-500">
                <span className="text-[10px] text-slate-500 uppercase font-black block font-mono">Promoter (9-10đ)</span>
                <p className="text-2xl font-mono font-black text-emerald-450">{npsCalculations.promoters}%</p>
                <span className="text-[9px] text-slate-400">Khách phát tán truyền thống</span>
              </div>

              {/* Passives */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-center space-y-1 border-b-2 border-b-blue-500">
                <span className="text-[10px] text-slate-500 uppercase font-black block font-mono">Passive (7-8đ)</span>
                <p className="text-2xl font-mono font-black text-blue-400">{npsCalculations.passives}%</p>
                <span className="text-[9px] text-slate-400">Khách trung gian hài lòng bình thường</span>
              </div>

              {/* Detractors */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-center space-y-1 border-b-2 border-b-red-500">
                <span className="text-[10px] text-slate-500 uppercase font-black block font-mono">Detractor (0-6đ)</span>
                <p className="text-2xl font-mono font-black text-red-400">{npsCalculations.detractors}%</p>
                <span className="text-[9px] text-slate-400">Khách tiêu cực, có rủi ro rời đi</span>
              </div>

            </div>

            {/* Embedded Survey simulator */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900/80 max-w-2xl mx-auto space-y-4">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase font-mono block pb-2 border-b border-slate-900">
                👁️ Trình Giả Lập Form Khảo Sát NPS (Hiển thị phía khách hàng)
              </span>

              <form onSubmit={handleCreateMockFeedback} className="space-y-4">
                <div className="text-center py-2">
                  <h4 className="text-sm font-bold text-white">Bạn sẵn sàng giới thiệu LedgerFlow cho bạn bè hoặc cộng nghiệp với thang điểm từ 0 đến 10?</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Với 0 là &quot;Hoàn toàn không&quot; và 10 là &quot;Rất nhiệt tình giới thiệu&quot;</p>
                </div>

                {/* Score rating buttons */}
                <div className="flex gap-1.5 justify-center flex-wrap pb-4">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
                    let btnColor = 'bg-slate-900 hover:bg-slate-800 text-slate-400';
                    if (score === simulatorScore) {
                      if (score >= 9) btnColor = 'bg-emerald-600 text-white font-black scale-110 shadow-lg';
                      else if (score >= 7) btnColor = 'bg-blue-600 text-white font-black scale-110 shadow-lg';
                      else btnColor = 'bg-red-600 text-white font-black scale-110 shadow-lg';
                    }

                    return (
                      <button
                        type="button"
                        key={score}
                        onClick={() => setSimulatorScore(score)}
                        className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${btnColor}`}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold block">Họ và tên khách hàng:</label>
                    <input
                      type="text"
                      placeholder="VD: Anh Trịnh Xuân Việt"
                      value={simulatorName}
                      onChange={(e) => setSimulatorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold block">Tên doanh nghiệp / Hộ kinh doanh:</label>
                    <input
                      type="text"
                      placeholder="VD: Công ty TNHH Nam Việt"
                      value={simulatorCompany}
                      onChange={(e) => setSimulatorCompany(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-semibold block">Phản hồi cụ thể / mong muốn cải tiến:</label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả trải nghiệm của bạn khi sử dụng LedgerFlow để đối soát hóa đơn..."
                    value={simulatorFeedback}
                    onChange={(e) => setSimulatorFeedback(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full p-2.5 bg-purple-600 hover:bg-purple-550 text-xs font-bold text-white rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Gửi Đánh Giá Khảo Sát
                </button>
              </form>
            </div>

          </div>
        )}

        {/* SUB TAB 2: SENTIMENT KANBAN BOARD */}
        {activeSubTab === 'sentiment_board' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-purple-400" />
              Sentiment Analysis Board (Phân Tích Cảm Xúc Phản Hồi Khách Hàng)
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Column 1: Positive */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-900/30">
                  <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1 font-mono">
                    <Smile className="w-4 h-4 text-emerald-400" />
                    NHIỆT TÌNH (POSITIVE)
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-450 px-1.5 py-0.5 rounded font-bold font-mono">
                    {feedbacks.filter(f => f.category === 'positive').length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {feedbacks.filter(f => f.category === 'positive').map(item => (
                    <div key={item.id} className="p-3 bg-slate-900/30 border border-slate-805/40 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-350">{item.author}</span>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">★ {item.score}/10đ</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        &quot;{item.content}&quot;
                      </p>
                      <div className="flex justify-between items-center text-[9px] pt-1 border-t border-slate-900 text-slate-500 font-mono">
                        <span>{item.company}</span>
                        <button
                          onClick={() => handleToggleApprove(item.id)}
                          className={`px-1.5 py-0.5 rounded font-black ${
                            item.approved ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-slate-950 text-slate-400 border border-transparent'
                          }`}
                        >
                          {item.approved ? 'Đã duyệt' : 'Duyệt'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Neutral */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-blue-900/30">
                  <span className="text-xs font-extrabold text-blue-400 flex items-center gap-1 font-mono">
                    <Meh className="w-4 h-4 text-blue-400" />
                    TRUNG LẬP (NEUTRAL)
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-450 px-1.5 py-0.5 rounded font-bold font-mono">
                    {feedbacks.filter(f => f.category === 'neutral').length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {feedbacks.filter(f => f.category === 'neutral').map(item => (
                    <div key={item.id} className="p-3 bg-slate-900/30 border border-slate-805/40 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-350">{item.author}</span>
                        <span className="text-[10px] font-bold text-blue-400 font-mono">★ {item.score}/10đ</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        &quot;{item.content}&quot;
                      </p>
                      <div className="flex justify-between text-[9px] pt-1 border-t border-slate-900 text-slate-500 font-mono">
                        <span>{item.company}</span>
                        <span>Cần liên hệ hỗ trợ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Negative */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-red-900/30">
                  <span className="text-xs font-extrabold text-red-500 flex items-center gap-1 font-mono">
                    <Frown className="w-4 h-4 text-red-500" />
                    TIÊU CỰC (NEGATIVE)
                  </span>
                  <span className="text-[10px] bg-red-500/10 text-red-450 px-1.5 py-0.5 rounded font-bold font-mono">
                    {feedbacks.filter(f => f.category === 'negative').length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {feedbacks.filter(f => f.category === 'negative').map(item => (
                    <div key={item.id} className="p-3 bg-red-950/10 border border-red-900/20 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-350">{item.author}</span>
                        <span className="text-[10px] font-bold text-red-400 font-mono">★ {item.score}/10đ</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        &quot;{item.content}&quot;
                      </p>
                      <div className="flex justify-between text-[9px] pt-1 border-t border-slate-900/40 text-slate-500 font-mono">
                        <span>{item.company}</span>
                        <span className="text-red-400 font-bold uppercase">Nguy cơ rời bỏ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUB TAB 3: SOCIAL PROOF & TESTIMONIAL BANK */}
        {activeSubTab === 'testimonial_bank' && (
          <div className="space-y-6">
            <div className="p-2 bg-purple-950/15 border border-purple-900/30 p-4 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Testimonial Bank - Nơi trích xuất dẫn chứng Social Proof uy tín:</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Nhận diện tự động các khách hàng đóng góp khảo sát NPS có điểm hài lòng tuyệt đối (9 - 10) để đề xuất đưa lên giao diện Landing Page bán hàng.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {feedbacks.filter(f => f.score >= 9).map(item => (
                <div 
                  key={item.id}
                  className="p-5 bg-slate-950/40 rounded-xl border border-slate-900 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(st => (
                          <Star key={st} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase">
                        NPS Score {item.score}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium italic leading-relaxed">
                      &quot;{item.content}&quot;
                    </p>

                    <div className="pt-2 border-t border-slate-905">
                      <span className="text-xs font-bold text-white block">{item.author}</span>
                      <span className="text-[10px] text-slate-400 italic block">{item.company}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900/50">
                    <button
                      onClick={() => handleCopyCode(item)}
                      className="flex-1 p-2 bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-slate-200 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                      Sao chép Mã HTML Embed
                    </button>
                    <button
                      onClick={() => triggerNotification('Khảo sát Testimonial đã được đưa lên Website chính thức của LedgerFlow!')}
                      className="p-2 bg-purple-600 hover:bg-purple-550 text-[10px] font-bold text-white rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      Live Publish
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* SUB TAB 4: REVIEW REQUEST GENERATOR / AUTOMATION RULES */}
        {activeSubTab === 'review_requests' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Trigger list setup */}
              <div className="md:col-span-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4 text-xs font-semibold">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block pb-2 border-b border-slate-900">
                  ⚙️ Kích Hoạt Tự Động Hóa Review
                </span>

                <p className="text-[11px] text-slate-500 leading-normal font-normal">
                  Kịch bản chuyển giao tự động khi khách hàng hoàn thành tương tác có độ thỏa mãn cao được hệ thống ghi nhận.
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/40 border border-purple-500/20 rounded-lg flex items-start gap-2.5">
                    <input type="checkbox" defaultChecked className="mt-1 accent-purple-500" />
                    <div>
                      <span className="text-[10.5px] font-extrabold text-white">Chấm NPS Đạt &gt;= 9</span>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">Lập tức chờ 10 phút sau gửi Email &amp; Zalo mời viết đánh giá.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg flex items-start gap-2.5 opacity-55">
                    <input type="checkbox" className="mt-1 accent-purple-500" />
                    <div>
                      <span className="text-[10.5px] font-extrabold text-slate-400">Gia hạn thành công lần thứ 3</span>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">Xác nhận khách hàng tuyệt đối tin tưởng, tự động tặng Voucher giảm giá khi viết review.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl leading-relaxed text-[10px] text-slate-405 text-slate-400">
                  ⚡ <strong>Rule of thumb:</strong> Không bao giờ gửi yêu cầu viết review cho khách hàng chấm điểm dưới 8 để đảm bảo duy trì độ uy tín 5-sao cho thương hiệu!
                </div>
              </div>

              {/* Template editor layout (Col-span 2) */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5 font-mono">
                    <Workflow className="w-4 h-4 text-purple-400" />
                    Cấu Hình Chi Tiết Email Automation Template
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-bold block">Tiêu đề tiêu chuẩn:</label>
                      <input
                        type="text"
                        value={autoEmailTitle}
                        onChange={(e) => setAutoEmailTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded p-2.5 font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] text-slate-400 font-bold block">Nội dung thư điện tử:</label>
                        <span className="text-[9px] text-slate-500 font-mono">Placeholder khả dụng: &#123;first_name&#125;, &#123;nps_score&#125;</span>
                      </div>
                      <textarea
                        rows={6}
                        value={autoEmailContent}
                        onChange={(e) => setAutoEmailContent(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded p-2.5 font-mono leading-relaxed"
                      ></textarea>
                    </div>

                    <button
                      onClick={() => triggerNotification('Cấu hình chiến dịch Email Automation thành công! Đã lên lịch tự chạy.')}
                      className="w-full p-2.5 bg-purple-600 hover:bg-purple-550 font-bold text-xs text-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-center block cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Lưu Quy Trình Khơi Chiêu Review Tự Động
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
