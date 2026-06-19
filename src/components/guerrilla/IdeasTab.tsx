import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  PlusCircle, 
  Sparkles, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Compass, 
  Activity, 
  ChevronRight, 
  Check, 
  Download, 
  Printer, 
  Copy,
  Zap,
  Cpu
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { UnexpectedIdea } from '../../types';
import Simulator from './Simulator';

const INITIAL_IDEAS: UnexpectedIdea[] = [
  {
    id: 'idea_saas_vietqr',
    title: 'VietQR Auto-Ledger - Đồng bộ đối soát shop online nhỏ',
    type: 'saas',
    nicheAudience: 'Chủ shop bán hàng facebook live, kinh doanh hộ cá thể không rành ERP nặng nề',
    pricePoint: 35000, // 35k/tháng
    speedRating: 9,
    costRating: 10,
    marketPain: 9,
    viralPotential: 8,
    description: 'Ứng dụng siêu nhỏ sử dụng Webhook ngân hàng tự do bóc tách cú pháp chuyển khoản VietQR, đối chiếu với trạng thái tồn kho rồi tự động gán nhãn trạng thái hạch toán thông qua bảng SQLite thô của Chrome Extension.',
    guerrillaScore: 9.2,
    createdAt: '2026-06-01',
    aiBlueprint: `### 🚀 BẢN THIẾT KẾ CHIẾN THUẬT DU KÍCH - VIETQR AUTO-LEDGER

## 1. DATA SCIENCE & BIG DATA (Trụ cột Dữ Liệu)
- **Star Schema Tối Giản**: Xây dựng bảng sự kiện \`fact_bank_transactions\` liên kết trực tiếp với bảng chiều khách hàng \`dim_orders\`.
- **Phân Tích Báo Cáo**: Dùng pandas lọc bỏ các giao dịch lỗi do nội dung chuyển khoản sai cấu trúc, gán nhãn tỷ lệ đối khớp tự động thành công (Auto-Match Rate).

## 2. BUSINESS ANALYSIS (Trụ cột Nghiệp Vụ)
- **Nỗi đau khách hàng**: Shop nhỏ bị trôi bill chuyển khoản, mất nhiều giờ ngồi dò sao kê tay trên app ngân hàng.
- **Quy trình tối giản**: Quét VietQR -> Tạo mã giao dịch duy nhất nhập vào mô tả chuyển khoản -> Webhook bắt giao dịch đẩy lên database -> Bot gửi tin nhắn xác nhận.

## 3. FINANCIAL ACCOUNTING (Trụ cột Kinh Tế & Chi Phí 0đ)
- **Giá bán rẻ số lượng lớn**: Chỉ **35.000đ/tháng** (bằng 1 cốc cà phê vỉa hè). Nhắm tới mục tiêu 2.050 cửa hàng sử dụng tạo ra **71.750.000 VNĐ MRR** ổn định.
- **Hạ tầng 0đ**: Lưu trữ database trên Supabase Free Tier, chạy backend trên Vercel Serverless. Chi phí vận hành máy chủ thực tế hàng tháng là 0 VNĐ.
- **Cổng thanh toán**: Tận dụng VietQR mở của SeABank/VietinBank để nhận tiền nạp tự động không tốn 1,5%-3% phí cổng trung gian như thẻ tín dụng.

## 4. PROGRAMMING STACK (Trụ cột Lập Trình Siêu Tốc)
- **Frontend/Backend**: Sử dụng React + Vite + Express cùng thư viện Tailwind CSS. Đóng gói thêm 1 Chrome Extension nhỏ để tự động parse sao kê thủ công trong web ngân hàng mà không cần API ngân hàng chính thống đắt đỏ.
- **Mốc thời gian đóng gói**: 5 ngày làm việc độc lập.

## 5. MACHINE LEARNING & AI INTEGRATION (Trụ Cột Thông Minh)
- **AI Phân Tích Thông Minh**: Tích hợp một model NLP phân cụm siêu nhẹ để phân nhóm tự động các nội dung khách ghi sai cú pháp (ví dụ: "chuc muong sinh nhat", "tra tien ao", "ck do giay") để gán đúng mã đơn hàng khả thi nhất. Thuật toán chạy suy luận trực tiếp trên client để giảm chi phí máy chủ AI.`
  },
  {
    id: 'idea_game_hcmc',
    title: 'Sài Gòn Rush: Kẹt Xe Không Lối Thoát',
    type: 'game',
    nicheAudience: 'Học sinh, sinh viên và dân văn phòng chơi xả stress trong lúc chờ kẹt xe tan tầm',
    pricePoint: 15000, // 15k mua vĩnh viễn không quảng cáo
    speedRating: 10,
    costRating: 9,
    marketPain: 8,
    viralPotential: 10,
    description: 'Game Hyper-casual 2D màn hình dọc, người chơi điều khiển shipper vượt qua bẫy hố ga, các rào chắn "lô cốt", bò thả trôi, đón nhận thời tiết mưa ngập nước vỉa hè để giật đồ ăn giao kịp giờ. Càng kẹt xe càng đông thách thức kịch bộc.',
    guerrillaScore: 9.3,
    createdAt: '2026-06-02',
    aiBlueprint: `### 🚀 BẢN THIẾT KẾ CHIẾN THUẬT DU KÍCH - SÀI GÒN RUSH

## 1. DATA SCIENCE & BIG DATA (Trụ cột Dữ Liệu)
- **Quản Trị Người Dùng**: Dùng SQLite lưu trữ số điểm kỷ lục địa phương, ghi nhận hành vi "va chạm" để vẽ biểu đồ phân phối khó dễ của các màn chơi (Difficulty Curve Analytics).

## 2. BUSINESS ANALYSIS (Trụ cột Nghiệp Vụ)
- **Nỗi đau**: Sự đồng điệu và giải trí tức thời. Game thủ giải trí nhanh trong 1-3 phút mà không cần suy nghĩ nặng nề.
- **Cơ chế giữ chân**: Tích haptic rung mạnh khi shipper đâm trúng ổ gà, sfX âm thanh tiếng còi xe inh ỏi thân thuộc của phố phường Việt Nam.

## 3. FINANCIAL ACCOUNTING (Trụ cột Kinh Tế & Chi Phí 0đ)
- **Giá bán thu hoạch**: Cho tải miễn phí có kèm quảng cáo interstitial xen kẽ nhẹ nhàng sau mỗi 4 lượt chơi. Người chơi có thể trả **15.000 VNĐ** một lần duy nhất để tắt quảng cáo vĩnh viễn và tặng skin "Shipper Ninja Gió".
- **Hạ tầng 0đ**: Game offline chạy trực tiếp trên thiết bị (Edge computing), sử dụng AdMob để gắn quảng cáo. Chi phí duy trì server là 0 VNĐ.

## 4. PROGRAMMING STACK (Trụ cột Lập Trình Siêu Tốc)
- **Engine**: Sử dụng Godot Engine hoặc Cocos Creator siêu nhẹ để compile bản Android/WebGL trong 6 ngày.
- **Tài Nguyên Asset**: Dùng AI Generation để tự vẽ nhân vật chibi và các background phố xá quận 1, quận 3.

## 5. MACHINE LEARNING & AI INTEGRATION (Trụ Cột Thông Minh)
- **Hệ Thống Tránh Hack**: Tích hợp một mạng nơ-ron hồi quy cực nhẹ (Sequential MLP) nạp On-device lưu trữ lịch sử vuốt màn hình để phân biệt giữa người chơi tay thật và auto-clicker gian lận điểm thưởng.`
  }
];

export default function IdeasTab() {
  const { activeIdea, setActiveIdea } = useStore();
  const [ideas, setIdeas] = useState<UnexpectedIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(activeIdea?.id || '');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [viewMode, setViewMode] = useState<'markdown' | 'canvas'>('markdown');

  // Custom interactive weights for weighted dynamic Scoring formula
  const [weightAlpha, setWeightAlpha] = useState<number>(0.4);
  const [weightBeta, setWeightBeta] = useState<number>(0.4);
  const [weightGamma, setWeightGamma] = useState<number>(0.2);

  // New Idea Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<'saas' | 'game' | 'utility'>('saas');
  const [newNiche, setNewNiche] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(20000);
  const [newDesc, setNewDesc] = useState<string>('');
  
  // New Idea Ratings (1-10)
  const [newSpeed, setNewSpeed] = useState<number>(8);
  const [newCost, setNewCost] = useState<number>(9);
  const [newPain, setNewPain] = useState<number>(8);
  const [newViral, setNewViral] = useState<number>(7);

  // Edit Idea States
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editType, setEditType] = useState<'saas' | 'game' | 'utility'>('saas');
  const [editNiche, setEditNiche] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(20000);
  const [editDesc, setEditDesc] = useState<string>('');
  const [editSpeed, setEditSpeed] = useState<number>(8);
  const [editCost, setEditCost] = useState<number>(9);
  const [editPain, setEditPain] = useState<number>(8);
  const [editViral, setEditViral] = useState<number>(7);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('guerrilla_unexpected_ideas');
      if (stored) {
        const parsed = JSON.parse(stored);
        setIdeas(parsed);
        if (parsed.length > 0) {
          setSelectedIdeaId(parsed[0].id);
        }
      } else {
        localStorage.setItem('guerrilla_unexpected_ideas', JSON.stringify(INITIAL_IDEAS));
        setIdeas(INITIAL_IDEAS);
        setSelectedIdeaId(INITIAL_IDEAS[0].id);
      }
    } catch (e) {
      console.error('Lỗi tải ý tưởng: ', e);
      setIdeas(INITIAL_IDEAS);
      setSelectedIdeaId(INITIAL_IDEAS[0].id);
    }
  }, []);

  const saveToStorage = (updatedList: UnexpectedIdea[]) => {
    setIdeas(updatedList);
    try {
      localStorage.setItem('guerrilla_unexpected_ideas', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Lỗi lưu ý tưởng: ', e);
    }
  };

  // Keep global Zustand store in sync with local selectedIdeaId selection
  useEffect(() => {
    if (selectedIdeaId && ideas.length > 0) {
      const found = ideas.find(i => i.id === selectedIdeaId);
      if (found && found.id !== activeIdea?.id) {
        setActiveIdea(found as any);
      }
    }
  }, [selectedIdeaId, ideas, activeIdea, setActiveIdea]);

  // Score Calculation helper
  const calculateGuerrillaScore = (speed: number, cost: number, pain: number, viral: number) => {
    const devCost = (10 - speed) * 0.5 + (10 - cost) * 0.5;
    const score = (weightAlpha * pain) + (weightBeta * viral) - (weightGamma * devCost) + 2.0;
    return Number(Math.max(1.0, Math.min(10.0, score)).toFixed(1));
  };

  // Add unexpected idea
  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newNiche.trim() || !newDesc.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin cốt lõi!');
      return;
    }

    const calculatedScore = calculateGuerrillaScore(newSpeed, newCost, newPain, newViral);

    const newIdea: UnexpectedIdea = {
      id: `idea_${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      nicheAudience: newNiche.trim(),
      pricePoint: Number(newPrice),
      speedRating: newSpeed,
      costRating: newCost,
      marketPain: newPain,
      viralPotential: newViral,
      description: newDesc.trim(),
      guerrillaScore: calculatedScore,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newIdea, ...ideas];
    saveToStorage(updated);
    setSelectedIdeaId(newIdea.id);
    setShowAddForm(false);
    
    // Reset fields
    setNewTitle('');
    setNewNiche('');
    setNewPrice(30000);
    setNewDesc('');
    setNewSpeed(8);
    setNewCost(9);
    setNewPain(8);
    setNewViral(7);
  };

  // Delete idea
  const handleDeleteIdea = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xoá ý tưởng này không?')) return;
    const updated = ideas.filter(item => item.id !== id);
    saveToStorage(updated);
    if (selectedIdeaId === id && updated.length > 0) {
      setSelectedIdeaId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedIdeaId('');
    }
  };

  // Start editing an idea
  const handleStartEdit = (idea: UnexpectedIdea) => {
    setEditingIdeaId(idea.id);
    setShowAddForm(false);
    setEditTitle(idea.title);
    setEditType(idea.type);
    setEditNiche(idea.nicheAudience);
    setEditPrice(idea.pricePoint);
    setEditDesc(idea.description || '');
    setEditSpeed(idea.speedRating || 5);
    setEditCost(idea.costRating || 5);
    setEditPain(idea.marketPain || 5);
    setEditViral(idea.viralPotential || 5);
  };

  // Submit edits for idea
  const handleUpdateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdeaId) return;
    if (!editTitle.trim() || !editNiche.trim() || !editDesc.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin cốt lõi!');
      return;
    }

    const calculatedScore = calculateGuerrillaScore(editSpeed, editCost, editPain, editViral);

    const updated = ideas.map(item => {
      if (item.id === editingIdeaId) {
        return {
          ...item,
          title: editTitle.trim(),
          type: editType,
          nicheAudience: editNiche.trim(),
          pricePoint: Number(editPrice),
          speedRating: editSpeed,
          costRating: editCost,
          marketPain: editPain,
          viralPotential: editViral,
          description: editDesc.trim(),
          guerrillaScore: calculatedScore
        };
      }
      return item;
    });

    saveToStorage(updated);
    setEditingIdeaId(null);
  };

  // Call Gemini to generate Plan
  const handleGenerateBlueprint = async (idea: UnexpectedIdea) => {
    setLoadingAI(true);
    setErrorMsg('');
    try {
      const promptText = `Tôi có một ý tưởng phần mềm/nhạc/game bất chợt để xây dựng đánh thị trường ngách, bán với giá rẻ số lượng rộng lớn, theo phong cách "đơn giản hóa - du kích" tại Việt Nam.

Hãy giúp tôi xây dựng "KẾ HOẠCH TÁC CHIẾN 5 TRỤ CỘT" hoàn chỉnh nhất cho ý tưởng này:
- Tiêu đề ý tưởng: "${idea.title}"
- Thể loại: ${idea.type === 'saas' ? 'Micro-SaaS App' : idea.type === 'game' ? 'Mobile Indie Game' : 'Utility Script'}
- Tệp khách hàng ngách nhắm tới: "${idea.nicheAudience}"
- Giá bán sản phẩm: ${idea.pricePoint.toLocaleString('vi-VN')} VNĐ
- Mô tả ý tưởng gốc: "${idea.description}"

LẬP KẾ HOẠCH PHẢI GỒM 5 PHẦN TƯƠNG ĐỨNG VỚI 5 KỸ NĂNG TÔI ĐANG HỌC:
1. DATA SCIENCE & BIG DATA (Cách tổ chức Star Schema lưu hạch toán/game-feel log, dùng pandas dọn dẹp dữ liệu).
2. BUSINESS ANALYSIS (Nghiên cứu nghiệp vụ nỗi đau cụ thể của tệp ngách, quy trình xử lý tối thiểu).
3. FINANCIAL ACCOUNTING & PRICING (Mô hình kinh tế bán giá rẻ số lượng lớn, kế hoạch hạ tầng tối ưu vận hành 0đ không tốn chi phí ròng rã, thanh toán tự động VietQR/Momo 0% chiết khấu).
4. PROGRAMMING STACK (Lựa chọn Stack rút gọn nhất để một mình lập trình biên dịch nhanh nhất < 7 ngày như Vite React, SQLite cục bộ, Godot, Chrome Extension).
5. MACHINE LEARNING & AI INTEGRATION (Trí khôn AI bổ sung để tăng biên giá trị, khuyên dùng local ONNX hoặc gọi Gemini Free Tier tối giảm token).

Vui lòng viết súc tích, đanh thép bằng tiếng Việt, có chèn bình luận chuyên môn thực tế, định dạng markdown đẹp mắt với các tiêu đề rõ ràng để tôi tham khảo trực chiến triển khai.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: 'Bạn là siêu AI tham mưu tăng tốc khởi nghiệp cho Solo Founder và Indie Developer tại Việt Nam. Câu trả lời của bạn luôn bám sát tinh thần tác chiến du kích: Chi phí cực thấp, tốc độ nhanh, giải quyết nỗi đau cực mặn và hái tiền số lượng rộng lớn.'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const updated = ideas.map(item => {
          if (item.id === idea.id) {
            return { ...item, aiBlueprint: data.text || data.content || data.output || '' };
          }
          return item;
        });
        saveToStorage(updated);
      } else {
        if (data.isMissingKey || String(data.error || '').toLowerCase().includes('key')) {
          setErrorMsg('⚠️ Chưa cấu hình AI Gateway/Secrets. AI đang chạy bản mô phỏng tác chiến ngoại tuyến cho bạn súc tích dưới đây.');
          
          const fallback = `### 🚀 BẢN THIẾT KẾ CHIẾN THUẬT DU KÍCH MÔ PHỎNG: ${idea.title.toUpperCase()}

## 1. DATA SCIENCE & BIG DATA (Trụ cột Dữ Liệu)
- Thiết lập Star Schema với một bảng thực tế \`fact_product_usage\` thu hẹp các số liệu người dùng sử dụng tính năng và một bảng chiều \`dim_niche_users\`.
- Sử dụng Pandas chạy trên Streamlit Cloud miễn phí hằng ngày gửi báo cáo phễu chuyển đổi sử dụng tính năng yêu thích nhất của khách hàng ngách.

## 2. BUSINESS ANALYSIS (Trụ cột Nghiệp Vụ)
- Cô lập nhu cầu cốt lõi nhất của tệp khách hàng: "${idea.nicheAudience}". Loại bỏ tất cả 90% tính năng rườm rà của các ERP lớn, chỉ lập trình giải quyết 1 vấn đề một cách tự động, liền mạch nhất.

## 3. FINANCIAL ACCOUNTING (Kế hoạch giá rẻ với hạ tầng 0đ)
- Thiết lập định giá hời chỉ **${idea.pricePoint.toLocaleString('vi-VN')}đ** kích thích thanh toán một lần hoặc hàng tháng thoải mái.
- Hạ tầng máy chủ tối ưu tuyệt đối về 0đ: Vercel Hosting + Supabase sịn sò có sẵn để biên lợi nhuận thu về ròng rã tiệm cận 100%!
- Thiết kế hệ thống mã QR nạp tự động qua VietQR API rụng thông điệp trực tiếp vào Telegram nhóm chat một cách trơn tru.

## 4. PROGRAMMING STACK (Trực diện lập trình nhanh)
- Phát triển bằng React Vite cho web-app hay Godot Engine cho game 2D. 
- Thời gian đóng gói tối giản (MVP) giữ vững dưới 6 ngày để liên tục đưa ra thị trường đo lường phản hồi.

## 5. MACHINE LEARNING & AI INTEGRATION (Động cơ thông minh)
- Tích hợp gọi API bóc tách hình ảnh, đối chiếu tự động dùng mô hình Gemini 3.5 Flash miễn phí của Google, bảo mật token qua các biến môi trường an toàn.`;
          const updated = ideas.map(item => {
            if (item.id === idea.id) {
              return { ...item, aiBlueprint: fallback };
            }
            return item;
          });
          saveToStorage(updated);
        } else {
          setErrorMsg(data.error || 'Đường truyền bận, vui lòng thử lại sau ít phút.');
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Không thể kết nối đến máy chủ AI để xử lý.');
    } finally {
      setLoadingAI(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-black text-white mt-5 border-b border-slate-900 pb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-3 rounded bg-emerald-500 animate-pulse"></span>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-black text-emerald-404 mt-6 flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-emerald-500" />
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 pl-4 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow shadow-emerald-500/50"></span>
            <span className="text-slate-300 text-xs font-semibold leading-relaxed">{line.substring(2)}</span>
          </div>
        );
      }
      if (line.trim().match(/^\d+\.\s/)) {
        return (
          <div key={idx} className="flex items-start gap-2 pl-4 py-1 text-xs font-semibold text-slate-300">
            <span className="text-emerald-400 font-mono font-bold shrink-0">{line.match(/^\d+\./)?.[0]}</span>
            <span className="leading-relaxed">{line.replace(/^\d+\.\s/, '')}</span>
          </div>
        );
      }
      return line.trim() === '' ? <div key={idx} className="h-2"></div> : <p key={idx} className="text-slate-300 text-xs leading-relaxed font-semibold pl-1">{line}</p>;
    });
  };

  const renderLeanCanvas = (idea: UnexpectedIdea) => {
    const problemStr = `- Đối tượng "${idea.nicheAudience}" có những khó chịu lớn khi hạch toán.
- Khó khăn cốt lõi: "${idea.description}"
- Giải pháp truyền thống cực kỳ rườm rà, tốn hao nhân lực hoặc phí phần mềm thương mại đắt đỏ.`;

    const segmentsStr = `- Tệp mục tiêu: ${idea.nicheAudience} tại Việt Nam.
- Người dùng tiên phong: Các hộ kinh doanh bán lẻ, chủ shop livestream, coder tự kiếm thu nhập MRR tự động.`;

    const uvpStr = `- Mô hình vận hành tự động tinh gọn cao độ.
- Bản quyền chỉ ${Number(idea.pricePoint).toLocaleString('vi-VN')} VNĐ/tháng bằng 1 ly café vỉa hè, tạo MRR bền bỉ cho Solo Founder.`;

    const solutionStr = `- Mini-SaaS / Mini-Game gọn nhẹ xây dưới 7 ngày bằng Vite React hoặc Godot.
- Đồng bộ VietQR đối soát webhook đẩy thẳng thông tin tới Telegram không cần cổng trung gian.`;

    const channelsStr = `- Quảng bá du kích không đồng tại các diễn đàn kinh doanh, nhóm Facebook.
- Làm video ngắn TikTok kịch bản hài hước về bài toán thanh toán.
- App Store Optimization (ASO) thọc sâu tệp từ khóa rắc rối hằng ngày.`;

    const revenueStr = `- Thu MRR rẻ từ số đông: ${Number(idea.pricePoint).toLocaleString('vi-VN')} VNĐ nạp trực tiếp qua quét QR.
- Nhận tài trợ hiển thị danh mục liên kết.`;

    const costStr = `- Serverless Vercel, Supabase Free Tier bền bỉ đảm bảo chi phí máy chủ hàng tháng là 0đ.
- Chi phí cơ hội độc lập của Solo Founder là 0 VNĐ.`;

    const metricsStr = `- Tỷ lệ đối soát VietQR khớp thành công tự động.
- Lượt truy cập hoạt động hằng ngày (DAU).
- Định mức thời gian nạp VIP trong 3 giây.`;

    const advantageStr = `- Đóng gói thần tốc chưa đầy 1 tuần làm việc một mình làm chủ từ A-Z.
- Năng lực lai kết hợp Kế toán + Phân tích nghiệp vụ dữ liệu và Lập trình tạo sản phẩm siêu thực tế.`;

    return (
      <div className="grid md:grid-cols-5 gap-3.5 text-left font-sans">
        {/* Top row: 3 columns */}
        {/* Column 1: Problem & Key Metrics */}
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-all flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-black text-rose-405 uppercase tracking-widest block font-mono">⚠️ 1. Vấn đề (Problem)</span>
              <p className="text-[10.5px] text-slate-350 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{problemStr}</p>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-900">Niche Pain Points</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-all flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-black text-yellow-500 uppercase tracking-widest block font-mono">📏 4. Chỉ số then chốt</span>
              <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{metricsStr}</p>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Key Metrics</span>
          </div>
        </div>

        {/* Column 2: Solution & Channels */}
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-all flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest block font-mono">🛠️ 2. Giải pháp (Solution)</span>
              <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{solutionStr}</p>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Lean Solution</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-all flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest block font-mono">📢 5. Kênh tiếp thị</span>
              <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{channelsStr}</p>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Indie Channels</span>
          </div>
        </div>

        {/* Column 3: UVP */}
        <div className="md:col-span-1 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between hover:border-purple-500/25 transition-all">
          <div>
            <span className="text-[9.5px] font-black text-purple-405 uppercase tracking-widest block font-mono">⚡ 3. Giá trị độc nhất</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{uvpStr}</p>
          </div>
          <p className="text-[9px] text-purple-400 font-bold pt-1.5 border-t border-slate-950">Unique Value Prop</p>
        </div>

        {/* Column 4: Strategy Advantage */}
        <div className="md:col-span-1 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div>
            <span className="text-[9.5px] font-black text-blue-400 uppercase tracking-widest block font-mono">🚀 6. Lợi thế chiến lược</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{advantageStr}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Unfair Advantage</span>
        </div>

        {/* Column 5: Customer Segments */}
        <div className="md:col-span-1 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div>
            <span className="text-[9.5px] font-black text-sky-400 uppercase tracking-widest block font-mono">👥 9. Phân khúc khách</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{segmentsStr}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-bold block pt-1.5 border-t border-slate-950">Niche Segments</span>
        </div>

        {/* Bottom Row: Cost Structure & Revenue Streams */}
        <div className="md:col-span-2 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 hover:border-emerald-500/25 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[9.5px] font-black text-emerald-450 uppercase tracking-widest block font-mono">📉 8. Cơ cấu chi phí tối giản 0đ</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{costStr}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Cost Structure</span>
        </div>

        <div className="md:col-span-3 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 hover:border-emerald-500/25 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[9.5px] font-black text-indigo-400 uppercase tracking-widest block font-mono">📈 7. Dòng doanh thu MRR</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{revenueStr}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Revenue Streams</span>
        </div>
      </div>
    );
  };

  const currentIdea = ideas.find(item => item.id === selectedIdeaId);

  return (
    <>
      {/* SECTION B: GUERILLA SIMULATOR (HIGH VOLUME, LOW PRICE, ZERO-OPERATING COST) */}
      <Simulator />

      {/* CORE WORKSPACE: IDEAS HUB & RAPID BLUEPRINTEER */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: UNSAVED IDEAS LIST & CREATOR */}
        <div className="lg:col-span-5 bg-slate-950/60 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between shadow-lg space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-sans">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Sổ Ý Tưởng Bất Chợt ({ideas.length})
              </span>
              <button
                onClick={() => {
                  if (editingIdeaId) {
                    setEditingIdeaId(null);
                  } else {
                    setShowAddForm(!showAddForm);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                  showAddForm || editingIdeaId 
                    ? 'bg-rose-600/20 text-rose-405 border-rose-500/25'
                    : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow shadow-emerald-500/10'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showAddForm || editingIdeaId ? 'Đóng lại' : 'Ghi nhanh'}</span>
              </button>
            </div>

            {/* BỘ CÂN BẰNG TRỌNG SỐ Ý TƯỞNG */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <span className="text-[10.5px] font-black uppercase text-emerald-400 font-mono flex items-center gap-1.5 leading-none">
                  🎛️ Bộ Cân Bằng Trọng Số Ý Tưởng (Idea Fit Equalizer)
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                  Trang 4: Công thức Fit
                </span>
              </div>
              
              <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-center font-bold">
                <span className="text-purple-400">α (Pain)</span> &nbsp;+&nbsp; 
                <span className="text-sky-400">β (Gap / Viral)</span> &nbsp;-&nbsp; 
                <span className="text-orange-400">γ (Dev Cost)</span> &nbsp;+&nbsp; 2.0
              </div>

              <div className="space-y-3 text-[10px] font-black">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-350">
                    <span>Trọng số Tần Suất &amp; Cường Độ Nỗi Đau (α):</span>
                    <span className="text-purple-404 font-mono font-extrabold">{weightAlpha.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightAlpha}
                    onChange={(e) => setWeightAlpha(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-slate-955 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-350">
                    <span>Trọng số Điểm Lan Tỏa / Khoảng Trống (β):</span>
                    <span className="text-sky-400 font-mono font-extrabold">{weightBeta.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightBeta}
                    onChange={(e) => setWeightBeta(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 h-1 bg-slate-955 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-350 font-bold">
                    <span>Trọng số Gánh Nặng / Chi Phí Dev (γ):</span>
                    <span className="text-orange-400 font-mono font-extrabold">{weightGamma.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightGamma}
                    onChange={(e) => setWeightGamma(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-1 bg-slate-955 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* FORM TO EDIT OR ADD NEW IDEA */}
            {editingIdeaId !== null ? (
              <form onSubmit={handleUpdateIdea} className="bg-slate-900/65 p-4 rounded-2xl border border-emerald-500/25 space-y-3.5">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-tight flex items-center gap-1.5 border-b border-slate-850 pb-2">
                  <Edit className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Sửa Ý Tưởng: {editTitle}
                </h4>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Tên Ý tưởng (Sản phẩm/Game):</label>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Ví dụ: Tool xuất hóa đơn từ ảnh chụp hóa đơn xá xíu"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Loại hình:</label>
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="saas">Micro-SaaS App</option>
                      <option value="game">Mobile / Web Game</option>
                      <option value="utility">Mã nguồn / Excel Tool</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Thiết lập giá bán (VND):</label>
                    <input 
                      type="number"
                      value={editPrice}
                      onChange={e => setEditPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 px-2 py-1 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Khách hàng ngách cụ thể là ai?:</label>
                  <input 
                    type="text"
                    value={editNiche}
                    onChange={e => setEditNiche(e.target.value)}
                    placeholder="Ví dụ: Tài xế xe ôm, chủ quán lẩu bò, người bán tạp hóa vỉa hè"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Mô tả cơ chế hoạt động vắn tắt:</label>
                  <textarea 
                    rows={3}
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="Khách chụp ảnh hóa đơn tịt -> App gọi AI bóc ra text -> đẩy thành file Excel..."
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                {/* Score inputs */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9.5px] font-black text-slate-450 uppercase block tracking-wider mb-2">Đo lường Chỉ số tác chiến du kích (1 - 10)</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-400">
                    <div>
                      <label className="block mb-1 font-sans">⏱️ Tốc độ hoàn thiện (<span className="text-emerald-400 font-bold">{editSpeed}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={editSpeed} 
                        onChange={e => setEditSpeed(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-sans">💰 Khép chi phí 0đ (<span className="text-emerald-400 font-bold">{editCost}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={editCost} 
                        onChange={e => setEditCost(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-sans">🩹 Sát thương nỗi đau (<span className="text-emerald-400 font-bold">{editPain}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={editPain} 
                        onChange={e => setEditPain(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-sans">📢 Khả năng Viral lan toả (<span className="text-emerald-400 font-bold">{editViral}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={editViral} 
                        onChange={e => setEditViral(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingIdeaId(null)}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-xl"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow shadow-emerald-500/20"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            ) : showAddForm ? (
              <form onSubmit={handleAddIdea} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight flex items-center gap-1.5 border-b border-slate-850 pb-2">
                  <Sparkles className="w-4 h-4 text-yellow-405 animate-spin" />
                  Bắt Kịp Ý Tưởng Vừa Nảy Ra Rực Rỡ!
                </h4>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Tên Ý tưởng (Sản phẩm/Game):</label>
                  <input 
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Tool xuất hóa đơn từ ảnh chụp hóa đơn xá xíu"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Loại hình:</label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="saas">Micro-SaaS App</option>
                      <option value="game">Mobile / Web Game</option>
                      <option value="utility">Mã nguồn / Excel Tool</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Thiết lập giá bán (VND):</label>
                    <input 
                      type="number"
                      value={newPrice}
                      onChange={e => setNewPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 px-2 py-1 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Khách hàng ngách cụ thể là ai?:</label>
                  <input 
                    type="text"
                    value={newNiche}
                    onChange={e => setNewNiche(e.target.value)}
                    placeholder="Ví dụ: Tài xế xe ôm, chủ quán lẩu bò, người bán tạp hóa vỉa hè"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Mô tả cơ chế hoạt động vắn tắt:</label>
                  <textarea 
                    rows={3}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Khách chụp ảnh hóa đơn tịt -> App gọi AI bóc ra text -> đẩy thành file Excel..."
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                {/* Score inputs */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9.5px] font-black text-slate-450 uppercase block tracking-wider mb-2">Đo lường Chỉ số tác chiến du kích (1 - 10)</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-400">
                    <div>
                      <label className="block mb-1">⏱️ Tốc độ hoàn thiện (<span className="text-emerald-400 font-bold">{newSpeed}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={newSpeed} 
                        onChange={e => setNewSpeed(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">💰 Khép chi phí 0đ (<span className="text-emerald-400 font-bold">{newCost}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={newCost} 
                        onChange={e => setNewCost(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">🩹 Sát thương nỗi đau (<span className="text-emerald-400 font-bold">{newPain}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={newPain} 
                        onChange={e => setNewPain(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">📢 Khả năng Viral lan toả (<span className="text-emerald-400 font-bold">{newViral}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={newViral} 
                        onChange={e => setNewViral(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-xl"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow shadow-emerald-500/20"
                  >
                    Ghi lại
                  </button>
                </div>
              </form>
            ) : (
              /* IDEAS LIST */
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-900">
                {ideas.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIdeaId(item.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden select-none ${
                      selectedIdeaId === item.id
                        ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/20 shadow shadow-emerald-500/5'
                        : 'bg-slate-900/60 border-slate-850 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-md font-extrabold border ${
                            item.type === 'game' 
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                              : item.type === 'saas' 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {item.type === 'saas' ? 'Micro-SaaS' : item.type === 'game' ? 'Game Mobile' : 'Excel/Code'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{item.createdAt}</span>
                        </div>
                        <h4 className="text-xs font-black text-white mt-2 leading-tight block pr-14">{item.title}</h4>
                      </div>
                      
                      {/* Guerrilla Badge score */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-1 px-2.5 text-center shrink-0 min-w-[50px]">
                        <span className="text-[8px] text-slate-550 block font-bold leading-none uppercase">Score</span>
                        <span className="text-sm font-black text-emerald-400 font-mono tracking-tight block mt-0.5">{item.guerrillaScore}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2.5 truncate">
                      <span className="text-slate-500">Ngách: </span>{item.nicheAudience}
                    </p>

                    <div className="mt-3.5 pt-2 border-t border-slate-900/80 flex justify-between items-center text-[10.5px]/none">
                      <span className="text-slate-500 font-bold">Giá: <strong className="text-slate-200 font-mono">{item.pricePoint.toLocaleString('vi-VN')}đ</strong></span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                          }}
                          className="text-slate-500 hover:text-emerald-400 p-1 rounded transition-all"
                          title="Sửa ý tưởng"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIdea(item.id, e);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-all"
                          title="Xoá ý tưởng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {ideas.length === 0 && (
                  <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-slate-850/60 p-4">
                    <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Danh sách đang bỏ trống.</p>
                    <p className="text-[10px] text-slate-600 mt-1">Bấm "Ghi nhanh" ở trên để ghi lại ngay dòng ý kiến bất chợt của bạn!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QUICK PROMPT INJECT CARD */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-2.5">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Tư Duy Thực Chiến
            </span>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Kinh nghiệm từ các cao thủ đúc kết: Thị trường luôn có khoảng trống ngách khổng lồ. Việc kết hợp <strong>1 file Python dọn data đơn giản</strong> hay <strong>1 mini game đồ họa retro cực nhẹ</strong>, nạp tiền tự động qua quét QR, có thể mang lại dòng MRR thụ động vượt bậc so với việc theo đuổi các dự án triệu đô bất khả thi.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL STRATEGY BLUEPRINT GENERATED BY GEMINI */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between shadow-lg space-y-4 min-h-[500px]">
          {currentIdea ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Header Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4 border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                      Căn Cứ Tác Chiến: {currentIdea.title}
                    </h3>
                    <p className="text-[11px] text-slate-450 font-medium leading-relaxed mt-1">
                      Chi tiết ý tưởng gốc: <span className="text-slate-300 italic">"{currentIdea.description}"</span>
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleGenerateBlueprint(currentIdea)}
                      disabled={loadingAI}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow shadow-emerald-500/15 disabled:bg-slate-800 disabled:from-slate-800 disabled:to-slate-800 flex items-center gap-1.5 transition-all select-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                      <span>{currentIdea.aiBlueprint ? 'AI Vẽ lại bản đồ' : 'Gọi AI Thẩm định 5 Trụ Cột'}</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Dashboard for Guerrilla Index */}
                <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center font-semibold text-[10px]">
                  <div className="border-r border-slate-900">
                    <span className="text-slate-500 block text-[9px] font-black uppercase">Build Speed</span>
                    <span className="text-white block mt-0.5 font-bold font-mono">{currentIdea.speedRating}/10</span>
                  </div>
                  <div className="border-r border-slate-900">
                    <span className="text-slate-500 block text-[9px] font-black uppercase">Low Overhead</span>
                    <span className="text-emerald-400 block mt-0.5 font-bold font-mono">{currentIdea.costRating}/10</span>
                  </div>
                  <div className="border-r border-slate-900">
                    <span className="text-slate-500 block text-[9px] font-black uppercase">Niche Pain</span>
                    <span className="text-purple-400 block mt-0.5 font-bold font-mono">{currentIdea.marketPain}/10</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] font-black uppercase">Viral Metric</span>
                    <span className="text-sky-400 block mt-0.5 font-bold font-mono">{currentIdea.viralPotential}/10</span>
                  </div>
                </div>
              </div>

              {/* Central text content */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4.5 flex-1 overflow-y-auto max-h-[480px] scrollbar-thin scrollbar-thumb-slate-900">
                {loadingAI ? (
                  <div className="py-20 text-center space-y-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <Cpu className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">BỘ NÃO GEMINI ĐANG TƯ DUY TÁC CHIẾN...</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1 max-w-md mx-auto leading-relaxed">
                        Đang kết xuất bản kế hoạch chi tiết bám sát 5 kỹ nghệ: Khoa học dữ liệu lớn (DA), Nghiên cứu Nghiệp vụ (BA), Sổ sách Định giá rẻ (Finance), Coding siêu kịch bọc (dưới 7 ngày) và tích hợp Edge Machine Learning!
                      </p>
                    </div>

                    <div className="text-[9px] font-mono text-slate-500 space-y-1.5 pt-2 text-left max-w-sm mx-auto">
                      <div className="flex gap-2 items-center text-emerald-405">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Cường hóa tệp ngách: "{currentIdea.nicheAudience}"</span>
                      </div>
                      <div className="flex gap-2 items-center text-emerald-405">
                        <Check className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                        <span>Tổng hợp Star Schema & Trình hạch toán hóa đơn...</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="w-3.5 h-3.5 rounded bg-slate-900 block border border-slate-800"></span>
                        <span>Tính toán định mức vận hành 0 VNĐ trên Vercel...</span>
                      </div>
                    </div>
                  </div>
                ) : errorMsg ? (
                  <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/20 text-xs text-rose-300 space-y-2">
                    <div className="flex items-center gap-1 text-rose-400 font-black">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Lỗi kết nối hoặc hụt khoá</span>
                    </div>
                    <p className="font-semibold leading-relaxed">{errorMsg}</p>
                    
                    {currentIdea.aiBlueprint && (
                      <div className="pt-3 border-t border-slate-800/80 mt-2 space-y-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Kế hoạch mẫu phục vụ nghiên cứu:</span>
                        <div className="text-slate-355">{renderMarkdownText(currentIdea.aiBlueprint)}</div>
                      </div>
                    )}
                  </div>
                ) : currentIdea.aiBlueprint ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-900 mb-2">
                      <div className="flex items-center gap-1.5 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                        <button
                          onClick={() => setViewMode('markdown')}
                          className={`px-3 py-1 text-[10.5px] font-black rounded-md transition-all ${
                            viewMode === 'markdown'
                              ? 'bg-emerald-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sổ tay Tác Chiến (Markdown)
                        </button>
                        <button
                          onClick={() => setViewMode('canvas')}
                          className={`px-3 py-1 text-[10.5px] font-black rounded-md transition-all ${
                            viewMode === 'canvas'
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Lean Canvas (9 Ô)
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (!currentIdea.aiBlueprint) return;
                            const element = document.createElement("a");
                            const file = new Blob([`# KẾ HOẠCH TÁC CHIẾN DU KÍCH: ${currentIdea.title.toUpperCase()}\n\n${currentIdea.aiBlueprint}`], {type: 'text/markdown'});
                            element.href = URL.createObjectURL(file);
                            element.download = `ledgerflow_guerrilla_plan_${currentIdea.id}.md`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[9.5px] font-bold transition-all"
                          title="Tải tài liệu dạng Markdown về máy"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Xuất .MD</span>
                        </button>

                        <button
                          onClick={() => {
                            const printW = window.open('', '_blank');
                            if (!printW) {
                              alert("Mở khóa popup để in báo cáo!");
                              return;
                            }
                            printW.document.write(`
                              <html>
                                <head>
                                  <title>Sản phẩm du kích: ${currentIdea.title}</title>
                                  <style>
                                    body { font-family: "Segoe UI", sans-serif; color: #111; line-height: 1.6; padding: 40px; max-width: 800px; margin: auto; }
                                    h1 { border-bottom: 2px solid #000; padding-bottom: 8px; text-transform: uppercase; font-size: 20px; }
                                    .meta { background: #f9f9f9; padding: 12px; border-radius: 6px; font-size:12px; margin-bottom: 20px; }
                                    pre { background: #f5f5f5; padding: 18px; font-family: monospace; font-size:12.5px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ddd; }
                                    @media print { pre { border: none; background: transparent; padding: 0; } }
                                  </style>
                                </head>
                                <body>
                                  <h1>Bản Kế Hoạch Thẩm Định AI - ${currentIdea.title}</h1>
                                  <div class="meta">
                                    <p><strong>Khách hàng ngách:</strong> ${currentIdea.nicheAudience}</p>
                                    <p><strong>Mức giá đầu ra đề cử:</strong> ${currentIdea.pricePoint.toLocaleString('vi-VN')} VNĐ/tháng</p>
                                    <p><strong>Mô tả ý tưởng gốc:</strong> ${currentIdea.description}</p>
                                    <p><strong>Chỉ số Guerrilla Score:</strong> ${currentIdea.guerrillaScore}/10</p>
                                  </div>
                                  <div>
                                    <pre>${currentIdea.aiBlueprint}</pre>
                                  </div>
                                  <script>window.onload = function() { window.print(); }</script>
                                </body>
                              </html>
                            `);
                            printW.document.close();
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-[9.5px] font-bold transition-all"
                          title="In bản thẩm định đẹp đẽ"
                        >
                          <Printer className="w-3 h-3 text-purple-400" />
                          <span>In Báo Cáo</span>
                        </button>

                        <button
                          onClick={() => copyText(currentIdea.aiBlueprint || '', `bp_${currentIdea.id}`)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-[9.5px] font-bold transition-all"
                        >
                          {copiedId === `bp_${currentIdea.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {viewMode === 'canvas' ? (
                      renderLeanCanvas(currentIdea)
                    ) : (
                      <div className="space-y-3 select-text font-sans">
                        {renderMarkdownText(currentIdea.aiBlueprint)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 select-text">
                    <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl flex items-start gap-3.5">
                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase">
                          ⭐ THẨM ĐỊNH TỰ ĐỘNG BẰNG ĐĂNG BẢN LẬP LUẬN
                        </span>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed font-semibold">
                          Ý tưởng này chưa được kích hoạt bản lộ trình kỹ thuật đầy đủ. Bạn có thể bấm nút <strong className="text-emerald-400">"Gọi AI Thẩm định 5 Trụ Cột"</strong> ở trên để bóc tách mã nguồn và lược đồ Star Schema. Dưới đây là phân tích cấu trúc du kích tức thời:
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                        📊 Ma Trận Phân Tích SWOT Du Kích (Trang 4)
                      </span>
                      
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950 border border-emerald-950/20 rounded-xl space-y-1">
                          <span className="text-[9.5px] font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none block w-max uppercase">
                            S - Điểm Mạnh (Strengths)
                          </span>
                          <ul className="space-y-1.5 text-[10.5px] text-slate-400 pt-1 font-bold">
                            <li className="flex items-start gap-1">
                              <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                              <span>Tốc độ xây bản dựng siêu tốc (<strong className="text-white">{currentIdea.speedRating}/10</strong>).</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                              <span>Chi phí tối giản gánh nặng cực thấp (<strong className="text-white">{currentIdea.costRating}/10</strong>).</span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-3 bg-slate-950 border border-orange-950/20 rounded-xl space-y-1">
                          <span className="text-[9.5px] font-mono text-orange-400 font-extrabold bg-orange-500/10 px-1.5 py-0.5 rounded leading-none block w-max uppercase">
                            W - Điểm Yếu (Weaknesses)
                          </span>
                          <ul className="space-y-1.5 text-[10.5px] text-slate-400 pt-1 font-bold">
                            <li className="flex items-start gap-1">
                              <span className="text-orange-400 mt-1 shrink-0">•</span>
                              <span>Solo founder gánh vác cả kỹ thuật lẫn báo cáo thuế phức tạp.</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-orange-400 mt-1 shrink-0">•</span>
                              <span>Công nghệ rào cản mỏng, dễ bị clone nhanh ở giai đoạn đầu.</span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-3 bg-slate-950 border border-sky-950/20 rounded-xl space-y-1">
                          <span className="text-[9.5px] font-mono text-sky-400 font-extrabold bg-sky-500/10 px-1.5 py-0.5 rounded leading-none block w-max uppercase">
                            O - Cơ Hội (Opportunities)
                          </span>
                          <ul className="space-y-1.5 text-[10.5px] text-slate-400 pt-1 font-bold">
                            <li className="flex items-start gap-1">
                              <span className="text-sky-400 mt-1 shrink-0">+</span>
                              <span>Tệp ngách béo bở: <strong className="text-slate-300">"{currentIdea.nicheAudience}"</strong> mang nỗi đau lớn ({currentIdea.marketPain}/10).</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-sky-400 mt-1 shrink-0">+</span>
                              <span>Kênh lan tỏa organic TikTok, Reddit tiềm năng nhiều ({currentIdea.viralPotential}/10).</span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-3 bg-slate-950 border border-rose-950/20 rounded-xl space-y-1">
                          <span className="text-[9.5px] font-mono text-rose-455 font-extrabold bg-rose-500/10 px-1.5 py-0.5 rounded leading-none block w-max uppercase">
                            T - Thách Thức (Threats)
                          </span>
                          <ul className="space-y-1.5 text-[10.5px] text-slate-400 pt-1 font-bold">
                            <li className="flex items-start gap-1">
                              <span className="text-rose-455 mt-1 shrink-0">!</span>
                              <span>Rủi ro thanh tra thuế VAT quốc tế xuyên biên giới khi dùng Stripe đơn lẻ.</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-rose-455 mt-1 shrink-0">!</span>
                              <span>Sập phễu nếu không bảo toàn tỷ suất giữ chân người dùng (Retention).</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-purple-404 font-extrabold">TREND FORECASTER ENGINE</span>
                          <h4 className="text-xs font-black text-white">Chỉ Số Xu Hướng Dự Đoán</h4>
                        </div>
                        
                        <div className="space-y-2 py-1.5 border-y border-slate-900 border-dashed">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">Tỷ lệ trỗi dậy xu hướng:</span>
                            <span className="text-emerald-400 font-mono font-black">📈 84% (Cực Hot)</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">Khả năng Viral tự nhiên:</span>
                            <span className="text-sky-400 font-mono font-black">{(currentIdea.viralPotential * 10)}% (Khả quan)</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                          📌 Khuyên dùng: Triển khai chiến thuật <strong className="text-white">Build in public</strong> để tối đa hóa lượt theo dõi từ ngày T-14.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-emerald-400 font-extrabold">PRICING &amp; FINANCE STRATEGY (Page 6)</span>
                          <h4 className="text-xs font-black text-white">Định Giá Sản Phẩm Tác Chiến</h4>
                        </div>
                        
                        <div className="space-y-2 py-1.5 border-y border-slate-900 border-dashed">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400 font-semibold">Mức giá tương đối đề xuất:</span>
                            <span className="text-white font-mono font-black">{currentIdea.pricePoint.toLocaleString('vi-VN')}đ</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400 font-semibold">Phễu thu cốt lõi phù hợp:</span>
                            <span className="text-emerald-400 font-mono font-black">
                              {currentIdea.pricePoint < 50000 ? 'VietQR Nội Địa' : 'Hybrid VietQR + Paddle MoR'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                          🏷️ Ý tưởng quảng bá: Tặng gói trọn đời <strong className="text-white">Lifetime Deal (LTD)</strong> sớm để thu hút những nòng cốt đầu tiên.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-slate-950 to-purple-950/20 border border-slate-855 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-mono text-sky-400 font-extrabold uppercase">
                          🚀 PHỄU GIỮ CHÂN &amp; KHOÁ TỪ KHOÁ BAN ĐẦU (ASO &amp; RETENTION TRANG 6)
                        </span>
                        <span className="text-[8.5px] bg-[#0a1020] text-purple-400 px-2 py-0.5 rounded border border-purple-500/10 font-bold">
                          User Retention Signal
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                          <h5 className="text-[11px] font-black text-slate-200">🔍 Trụ Cột SEO Từ Khóa (ASO Keywords)</h5>
                          <p className="text-[10.2px] text-slate-400 leading-relaxed font-semibold">
                            Định hình tên app và tiêu đề ngách bám sát các từ khoá dài có lượng tìm kiếm thô nhưng độ cạnh tranh bằng 0 (Ví dụ: keyword dài đuôi <em className="text-emerald-400 font-bold">"kiểm tra hoá đơn ảo rủi ro..."</em>).
                          </p>
                        </div>

                        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                          <h5 className="text-[11px] font-black text-slate-200">📈 Chỉ Số Giữ Chân Bền Vững (Retention)</h5>
                          <p className="text-[10.2px] text-slate-400 leading-relaxed font-semibold">
                            Tập trung toàn lực để đạt tỷ số giữ chân <strong className="text-white">T+7 trên 25%</strong> bằng tính năng thông báo email tiện lợi, tránh việc tiêu hoang ngân sách tiếp thị vô bến bờ!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-32 text-center space-y-2">
              <Compass className="w-12 h-12 text-slate-700 mx-auto animate-spin" />
              <p className="text-sm text-slate-400 font-bold">Chưa chọn ý tưởng nào.</p>
              <p className="text-xs text-slate-500">Vui lòng nạp hoặc ghi nhanh 1 ý kiến ở danh mục bên trái để bắt đầu lập chiến thuật!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
