import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Calculator, 
  QrCode, 
  Workflow, 
  Coins, 
  Send,
  Zap,
  Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';

interface ZNSTemplate {
  id: string;
  name: string;
  type: 'transaction' | 'otp' | 'reminder' | 'promotion' | 'survey';
  content: string;
  variables: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  estimatedCost: number; // VNĐ / tin
  deliveryRate: number;  // %
}

interface OACampaign {
  id: string;
  name: string;
  targetSegment: string;
  audienceSize: number;
  messageType: 'broadcast' | 'zns' | 'chat';
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  openRate: number;
  clickRate: number;
  cost: number; // VNĐ
}

interface DeepLink {
  id: string;
  name: string;
  targetUrl: string;
  platform: 'oa_follow' | 'oa_chat' | 'mini_app' | 'payment_vietqr';
  shortCode: string;
  clickCount: number;
  createdAt: string;
}

export default function ZaloMarketingHub() {
  const { activeIdea } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'zns_builder' | 'oa_campaigns' | 'roi_calculator' | 'deeplink_gen' | 'mini_app'>('zns_builder');

  // --- TAB 1: ZNS TEMPLATE BUILDER STATE ---
  const [znsTemplates, setZnsTemplates] = useState<ZNSTemplate[]>([
    { id: 'z1', name: 'Nhắc Quyết Toán Hạng Thuế Hết Cấp', type: 'reminder', content: 'Kính gửi Anh/Chị {{ten_khach_hang}}, LedgerFlow Studio ghi nhận hóa đơn {{ma_don}} tổng trị giá {{so_tien}} VNĐ chuẩn bị đến hạn hạch toán VAT báo cáo quý. Xin vui lòng kiểm tra lại muộn nhất vào ngày {{ngay_han}}.', variables: ['ten_khach_hang', 'ma_don', 'so_tien', 'ngay_han'], status: 'approved', estimatedCost: 180, deliveryRate: 98.7 },
    { id: 'z2', name: 'OTP Đăng Ký Bảo Mật 2 Lớp', type: 'otp', content: 'Mã số xác thực LedgerFlow OTP của quý khách là {{ma_don}}. Mã này có hiệu lực sử dụng trong vòng 2 phút, tuyệt đối không cung cấp cho người khác.', variables: ['ma_don'], status: 'approved', estimatedCost: 120, deliveryRate: 99.5 },
    { id: 'z3', name: 'Ưu Đãi Gia Hạn Combo Premium Hè Q3', type: 'promotion', content: 'Chào {{ten_khach_hang}}, LedgerFlow tri ân tặng deal độc quyền giảm 30% khi thanh toán gói hạch toán {{ten_san_pham}}. Khám phá ngay cơ hội tiết kiệm tại hotline miễn phí.', variables: ['ten_khach_hang', 'ten_san_pham'], status: 'pending_approval', estimatedCost: 320, deliveryRate: 95.0 }
  ]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('z1');
  
  // Creation Form Input state
  const [newZnsName, setNewZnsName] = useState('');
  const [newZnsType, setNewZnsType] = useState<ZNSTemplate['type']>('reminder');
  const [newZnsContent, setNewZnsContent] = useState('');
  const [templatePlaceholderValue, setTemplatePlaceholderValue] = useState<Record<string, string>>({
    ten_khach_hang: 'Hoàng Anh Tuấn',
    ma_don: 'INV-2026-Q2',
    so_tien: '12,500,000',
    ngay_han: '15/06/2026',
    ten_san_pham: 'SME Premium Suite'
  });

  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // --- TAB 2: OA CAMPAIGN STATE ---
  const [oaCampaigns, setOacampaigns] = useState<OACampaign[]>([
    { id: 'oa1', name: 'Nhắc quyết toán thuế khóa Q2', targetSegment: 'SME Toàn quốc', audienceSize: 3420, messageType: 'broadcast', scheduledAt: '15/06/2026 09:00', status: 'scheduled', openRate: 84, clickRate: 18.5, cost: 1026000 },
    { id: 'oa2', name: 'Chào mừng thành viên miễn phí mới', targetSegment: 'Auto Register', audienceSize: 850, messageType: 'zns', scheduledAt: 'Thời gian thực (Web)', status: 'sent', openRate: 95, clickRate: 34.2, cost: 153000 },
    { id: 'oa3', name: 'Flash Sale Ngày Vàng Giảm 40%', targetSegment: 'Leads COLD & WARM', audienceSize: 5200, messageType: 'broadcast', scheduledAt: 'Chưa lên lịch', status: 'draft', openRate: 0, clickRate: 0, cost: 1560000 }
  ]);

  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignSegment, setNewCampaignSegment] = useState('SME Toàn quốc');
  const [newCampaignSize, setNewCampaignSize] = useState<number>(1000);
  const [newCampaignType, setNewCampaignType] = useState<OACampaign['messageType']>('broadcast');

  // --- TAB 3: ROI CALCULATOR SENSITIVITY ---
  const [smsUnitCost, setSmsUnitCost] = useState<number>(750); // VNĐ per SMS
  const [znsUnitCost, setZnsUnitCost] = useState<number>(180); // VNĐ per ZNS
  const [monthlyVolume, setMonthlyVolume] = useState<number>(10000); // tin gửi / tháng
  const [estSmsConv, setEstSmsConv] = useState<number>(2.5); // % conversion SMS
  const [estZnsConv, setEstZnsConv] = useState<number>(8.5); // % conversion ZNS
  const [avgTicketValue, setAvgTicketValue] = useState<number>(1.5); // triệu VNĐ

  // Dynamic values synchronization with selected activeIdea
  useEffect(() => {
    if (activeIdea) {
      const shortName = activeIdea.title.split(' - ')[0];
      setTemplatePlaceholderValue(prev => ({
        ...prev,
        ten_san_pham: shortName,
        so_tien: activeIdea.pricePoint.toLocaleString('vi-VN'),
      }));

      // Map average ticket value in ROI calculations
      setAvgTicketValue(parseFloat((activeIdea.pricePoint / 1000000).toFixed(3)) || 0.150);

      // Adjust campaigns to target our niche segments
      setOacampaigns(prev => prev.map(camp => {
        if (camp.id === 'oa3') {
          return {
            ...camp,
            name: `Flash Sale Ngày Vàng: ${shortName} (Giảm 40%)`,
            targetSegment: activeIdea.nicheAudience,
          };
        }
        return camp;
      }));
    }
  }, [activeIdea]);

  // --- TAB 4: DEEP CONNECTIONS & QR PRESET ---
  const [deeplinks, setDeeplinks] = useState<DeepLink[]>([
    { id: 'dl1', name: 'QR Quét Follow OA LedgerFlow', targetUrl: 'https://zalo.me/LedgerFlowStudio', platform: 'oa_follow', shortCode: 'LF_FOLLOW', clickCount: 1420, createdAt: '2026-05-15' },
    { id: 'dl2', name: 'Click Chat trực tiếp Chuyên viên Thuế', targetUrl: 'https://zalo.me/chat/LedgerTax', platform: 'oa_chat', shortCode: 'LF_CHATTTAX', clickCount: 685, createdAt: '2026-05-20' },
    { id: 'dl3', name: 'Link Mini App Tra Cứu Hoá Đơn', targetUrl: 'https://zalo.me/miniapp/billcheck', platform: 'mini_app', shortCode: 'LF_BILLMINI', clickCount: 932, createdAt: '2026-06-01' }
  ]);
  const [newDlName, setNewDlName] = useState('');
  const [newDlUrl, setNewDlUrl] = useState('');
  const [newDlPlatform, setNewDlPlatform] = useState<DeepLink['platform']>('oa_follow');

  // Helper variables insert
  const insertVariableChip = (variable: string) => {
    setNewZnsContent(prev => prev + ` {{${variable}}}`);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZnsName.trim() || !newZnsContent.trim()) return;

    // Detect variables in content text
    const varRegex = /\{\{(.*?)\}\}/g;
    const foundVars: string[] = [];
    let match;
    while ((match = varRegex.exec(newZnsContent)) !== null) {
      if (match[1] && !foundVars.includes(match[1])) {
        foundVars.push(match[1].trim());
      }
    }

    const estimatedCostsMap = {
      transaction: 180,
      otp: 120,
      reminder: 180,
      promotion: 320,
      survey: 200
    };

    const newTemp: ZNSTemplate = {
      id: 'tmp_' + Date.now(),
      name: newZnsName,
      type: newZnsType,
      content: newZnsContent,
      variables: foundVars,
      status: 'pending_approval',
      estimatedCost: estimatedCostsMap[newZnsType] || 200,
      deliveryRate: 97.5
    };

    setZnsTemplates([...znsTemplates, newTemp]);
    setSelectedTemplateId(newTemp.id);
    setNewZnsName('');
    setNewZnsContent('');
  };

  const deleteTemplate = (id: string) => {
    setZnsTemplates(znsTemplates.filter(t => t.id !== id));
  };

  // Live render of text placeholder replacing double curly brackets
  const renderMockPhoneMessage = (templateContent: string) => {
    let text = templateContent;
    Object.entries(templatePlaceholderValue).forEach(([vKey, vVal]) => {
      text = text.replaceAll(`{{${vKey}}}`, `<span class="bg-amber-500/20 text-amber-300 font-bold px-1 rounded font-mono">${vVal}</span>`);
    });
    return <p className="text-xs text-slate-300 leading-relaxed text-left whitespace-pre-line" dangerouslySetInnerHTML={{ __html: text }} />;
  };

  // Add campaign handler
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    const costs = {
      broadcast: 300, // VNĐ/tin
      zns: 180,
      chat: 0
    };

    const newCamp: OACampaign = {
      id: 'camp_' + Date.now(),
      name: newCampaignName,
      targetSegment: newCampaignSegment,
      audienceSize: newCampaignSize,
      messageType: newCampaignType,
      scheduledAt: '24 giờ tới (Scheduled)',
      status: 'scheduled',
      openRate: 0,
      clickRate: 0,
      cost: newCampaignSize * (costs[newCampaignType] || 180)
    };

    setOacampaigns([...oaCampaigns, newCamp]);
    setNewCampaignName('');
  };

  // ROI math calculator for comparison
  const smsTotalCost = (monthlyVolume * smsUnitCost); // VND
  const znsTotalCost = (monthlyVolume * znsUnitCost); // VND
  const saveDifference = smsTotalCost - znsTotalCost;

  const smsConversions = Math.round(monthlyVolume * (estSmsConv / 100));
  const znsConversions = Math.round(monthlyVolume * (estZnsConv / 100));

  const smsEstRevenue = smsConversions * avgTicketValue * 1000000; // VND
  const znsEstRevenue = znsConversions * avgTicketValue * 1000000; // VND

  const generateRoiGraphData = () => {
    return [
      { name: 'Phí chi trả (VND/month)', 'SMS truyền thông': smsTotalCost, 'Mạng Zalo ZNS': znsTotalCost },
      { name: 'Hạch toán Doanh thu (VND)', 'SMS truyền thông': smsEstRevenue, 'Mạng Zalo ZNS': znsEstRevenue }
    ];
  };

  // Deep Link Creation Handler
  const handleCreateDeeplink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDlName.trim() || !newDlUrl.trim()) return;

    const shortCode = 'Z_LINK_' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const newDl: DeepLink = {
      id: 'dl_' + Date.now(),
      name: newDlName,
      targetUrl: newDlUrl,
      platform: newDlPlatform,
      shortCode,
      clickCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setDeeplinks([...deeplinks, newDl]);
    setNewDlName('');
    setNewDlUrl('');
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  const currentTemplate = znsTemplates.find(t => t.id === selectedTemplateId) || znsTemplates[0];

  return (
    <div className="bg-[#060b13]/80 border border-slate-900 rounded-3xl p-6 shadow-2xl relative select-text text-left" id="zalo-marketing-hub-container">
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>

      {/* HEADER AREA */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
              Vietnamese Premium Social Channel 🇻🇳
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <MessageCircle className="w-5.5 h-5.5 text-blue-400" />
            Zalo Marketing & ZNS Automation Hub
          </h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-2xl">
            Tận dụng tài nguyên tiếp cận số 1 Việt Nam qua Zalo Notification Service (ZNS), lên kịch bản chăm sóc chu kỳ, tối ưu ROI gấp 4 lần so với tin nhắn SMS cổ điển.
          </p>
        </div>

        {/* SUB NAVIGATION */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-900">
          {[
            { id: 'zns_builder', label: 'ZNS Builder', icon: Smartphone },
            { id: 'oa_campaigns', label: 'OA Chiến Dịch', icon: Send },
            { id: 'roi_calculator', label: 'ROI Calculator', icon: Calculator },
            { id: 'deeplink_gen', label: 'QR & Deep Links', icon: QrCode },
            { id: 'mini_app', label: 'Zalo Mini App', icon: Workflow },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TABS INTERACTIVE BODY */}

      {/* TAB 1: ZNS TEMPLATE BUILDER & METRICS PREVIEW */}
      {activeSubTab === 'zns_builder' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Template Creator & Variables Insert */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  ZNS Template Spec
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-blue-400" />
                  Soạn Thảo Biểu Mẫu ZNS
                </h3>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">TÊN MẪU NHẬN DIỆN (NAME):</label>
                  <input
                    type="text"
                    value={newZnsName}
                    onChange={e => setNewZnsName(e.target.value)}
                    placeholder="Ví dụ: Xác nhận hóa đơn VAT xuất sớm..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="text-left">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">LOẠI BIỂU MẪU CẤP ĐỘ GIAO DỊCH:</label>
                  <select
                    value={newZnsType}
                    onChange={e => setNewZnsType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="reminder">Nhắc nhở hóa đơn, kỳ kê khai VAT (Reminder)</option>
                    <option value="otp">Mã xác thực bảo mật OTP bảo vệ dữ liệu (OTP)</option>
                    <option value="transaction">Chứng từ quyết toán giao dịch thành công (Transaction)</option>
                    <option value="promotion">Thông tin ưu đãi gói Premium (Promotion)</option>
                    <option value="survey">Khảo sát ý kiến chất lượng hỗ trợ (Survey)</option>
                  </select>
                </div>

                {/* Variable inserter chips */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase font-mono">Click chèn nhanh biến thể động:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['ten_khach_hang', 'ma_don', 'so_tien', 'ngay_han', 'ten_san_pham'].map(v => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => insertVariableChip(v)}
                        className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-650 hover:bg-slate-850 rounded text-[9.5px] font-mono text-purple-400 font-bold uppercase transition-all"
                      >
                        {"{{" + v + "}}"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content text Area */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">NỘI DUNG THƯ TRUYỀN TẢI:</label>
                  <textarea
                    rows={4}
                    value={newZnsContent}
                    onChange={e => setNewZnsContent(e.target.value)}
                    placeholder="Nhập nội dung mẫu ZNS chăm sóc khách VN. Nhớ kẹp dấu ngoặc kép đôi nếu sử dụng biến số..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white font-semibold leading-relaxed"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Gửi duyệt mẫu lên Zalo OA
                </button>
              </form>
            </div>

            {/* Smart Physical telephone live interactive mockup preview */}
            <div className="lg:col-span-4 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4.5 h-4.5 text-blue-400 animate-bounce" /> Mô Phỏng Tin Nhắn Zalo
              </h3>

              {/* Physical Container */}
              <div className="bg-[#0e1621] w-full max-w-[280px] mx-auto aspect-[9/18] rounded-[2.5rem] border-[6px] border-slate-900 shadow-xl overflow-hidden relative flex flex-col pt-4">
                {/* Speaker pill */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-950 rounded-full flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-900 rounded"></div>
                </div>

                {/* Zalo Header inside phone */}
                <div className="bg-[#0068ff] p-3 text-center text-xs font-bold text-white relative">
                  Màn hình Zalo OA
                </div>

                {/* Inside Body */}
                <div className="flex-1 bg-[#182533] p-3 space-y-3.5 overflow-y-auto">
                  {/* Ledgerflow OA identity tag card inside scroll */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white">L</div>
                    <span className="text-[9.5px] text-slate-400 font-bold">LedgerFlow Studio ✔</span>
                  </div>

                  {/* Message bubble */}
                  <div className="p-3 bg-[#182533] border border-slate-800 rounded-2xl relative shadow-md">
                    <div className="absolute top-1 right-2 w-max text-slate-500 text-[8.5px] font-mono">11:08</div>
                    <span className="text-[10px] font-extrabold text-[#0068ff] block uppercase tracking-wide font-mono mb-1.5">📜 THÔNG BÁO QUYẾT TOÁN THUẾ</span>
                    
                    {/* Render live text replacement */}
                    {renderMockPhoneMessage(currentTemplate?.content || '')}
                    
                    <div className="mt-3.5 pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[9px] text-[#0068ff] font-extrabold bg-[#0068ff]/10 px-1.5 py-0.5 rounded uppercase leading-none font-sans">Mua gói / Thử nghiệm</span>
                      <span className="text-[8px] text-slate-500">© LedgerFlow</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Static values slider controllers */}
              <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-2xl text-xs space-y-2">
                <span className="text-[9px] text-slate-500 font-black block uppercase font-mono">Cấu hình tham số xem trước:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div>
                    <label className="text-slate-400">Tên khách:</label>
                    <input 
                      type="text" 
                      value={templatePlaceholderValue.ten_khach_hang} 
                      onChange={e => setTemplatePlaceholderValue({ ...templatePlaceholderValue, ten_khach_hang: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded px-1 text-[9.5px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400">Số tiền:</label>
                    <input 
                      type="text" 
                      value={templatePlaceholderValue.so_tien} 
                      onChange={e => setTemplatePlaceholderValue({ ...templatePlaceholderValue, so_tien: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded px-1 text-[9.5px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* List templates Right side */}
            <div className="lg:col-span-3 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 flex flex-col space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Mẫu Đã Thiết Kế</h3>
              <div className="space-y-3.5 overflow-y-auto max-h-[360px] pr-1">
                {znsTemplates.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedTemplateId === t.id 
                        ? 'bg-blue-600/5 border-blue-500/40 text-blue-400' 
                        : 'bg-slate-950 border-slate-900 hover:border-slate-850 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-white truncate max-w-[120px]">{t.name}</span>
                      {t.status === 'approved' ? (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded uppercase font-black font-mono">Duyệt</span>
                      ) : (
                        <span className="text-[8px] bg-slate-800 text-slate-500 px-1 py-0.5 rounded uppercase font-black font-mono">Pending</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1.5 leading-normal">{t.content}</p>
                    <div className="flex justify-between items-center mt-3 text-[10px] font-mono">
                      <span>Phí: <strong>{t.estimatedCost} đ/tin</strong></span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(t.id);
                        }}
                        className="p-1 bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: OA CAMPAIGNS SCHEDULER & BAR CHART ANALYTICS */}
      {activeSubTab === 'oa_campaigns' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Creator form left */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  Zalo OA Kampagne
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Send className="w-4.5 h-4.5 text-blue-400" />
                  Gửi Tin Broadcast Rộng Rãi
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Lên kế hoạch và gửi đồng loạt các bản tin chúc Tết, bảng giá, VAT kỳ quý cho toàn bộ người dùng đã theo dõi Zalo OA.
                </p>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">TIÊU ĐỀ CHIẾN DỊCH (CAMPAIGN TITLE):</label>
                  <input
                    type="text"
                    value={newCampaignName}
                    onChange={e => setNewCampaignName(e.target.value)}
                    placeholder="Ví dụ: Flash sale mùng 5 tháng 5..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">ĐỐI TƯỢNG PHỄU (AUDIENCE TARGET):</label>
                  <input
                    type="text"
                    value={newCampaignSegment}
                    onChange={e => setNewCampaignSegment(e.target.value)}
                    placeholder="Ví dụ: SME doanh thu > 50 triệu..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">LOẠI TIN NHẤN:</label>
                    <select
                      value={newCampaignType}
                      onChange={e => setNewCampaignType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                    >
                      <option value="broadcast">Broadcast (Tin nhắn hàng loạt)</option>
                      <option value="zns">ZNS (Tin dịch vụ tự động)</option>
                      <option value="chat">Giao tiếp trực tiếp (Vô phí)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">SỐ LƯỢNG TIN GỬI:</label>
                    <input
                      type="number"
                      value={newCampaignSize}
                      onChange={e => setNewCampaignSize(parseInt(e.target.value) || 100)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Đặt lịch gửi hỏa tốc
                </button>
              </form>
            </div>

            {/* Table scheduler & charts right */}
            <div className="lg:col-span-8 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Trung tâm Quản lý Chiến dịch Tương tác Quốc gia
              </h3>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[10px] font-mono">
                      <th className="pb-3 pl-2">Chiến dịch OA</th>
                      <th className="pb-3">Xác định phân khúc</th>
                      <th className="pb-3 text-center">Gửi đi (Volume)</th>
                      <th className="pb-3 text-right">Chi phí ròng</th>
                      <th className="pb-3 text-right">Tỷ lệ mở (Open Rate)</th>
                      <th className="pb-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oaCampaigns.map(camp => (
                      <tr key={camp.id} className="border-b border-slate-900/40 hover:bg-slate-900/20 transition-all">
                        <td className="py-2.5 pl-2 font-extrabold text-white text-[11.5px]">{camp.name}</td>
                        <td className="py-2.5 font-bold text-indigo-400 uppercase font-mono text-[9.5px]">
                          {camp.targetSegment}
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-white">
                          {camp.audienceSize.toLocaleString()} người
                        </td>
                        <td className="py-2.5 text-right font-mono font-black text-purple-400">
                          {camp.cost > 0 ? `${(camp.cost / 1000).toFixed(0)}k đ` : '0đ (Hỗ trợ)'}
                        </td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-emerald-450">
                          {camp.openRate > 0 ? `${camp.openRate}%` : 'Chờ bắn'}
                        </td>
                        <td className="py-2.5 text-center">
                          {camp.status === 'sent' && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[9px] uppercase font-mono">Gửi xong</span>
                          )}
                          {camp.status === 'scheduled' && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold text-[9px] uppercase font-mono">Đã đặt lịch</span>
                          )}
                          {camp.status === 'draft' && (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-500 border border-slate-700 rounded font-bold text-[9px] uppercase font-mono">Nháp</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Campaign performance analysis */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans">BIỂU ĐỒ BÁO CÁO HIGH-LEVEL MỞ RỘNG (KPI OPEN VS CLICK RATE %)</h4>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={oaCampaigns.filter(c => c.openRate > 0)}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                      <YAxis stroke="#475569" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }} />
                      <Legend fontSize={10} wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="openRate" name="Tỷ lệ mở tin %" fill="#0068ff" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clickRate" name="Tỷ lệ click link %" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 3: ZNS VS SMS ROI CALCULATOR */}
      {activeSubTab === 'roi_calculator' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Calculation Controls Left */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  ROI Comparison
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Calculator className="w-4.5 h-4.5 text-blue-400" />
                  Thiết Lập Chênh Lệch Chi Phí
                </h3>
              </div>

              {/* Sliders sensitivity */}
              <div className="space-y-4 pt-1">
                
                {/* Monthly Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase font-mono text-slate-400">
                    <span>Số lượng tin gửi hàng tháng (Volume):</span>
                    <span className="text-blue-400 font-extrabold">{monthlyVolume.toLocaleString()} tin</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={monthlyVolume}
                    onChange={e => setMonthlyVolume(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Core units pricing */}
                <div className="grid grid-cols-2 gap-3 pb-2 font-mono text-[9.5px]">
                  <div>
                    <label className="text-slate-400 uppercase font-bold block mb-1">Đơn giá SMS (đ/tin):</label>
                    <input 
                      type="number" 
                      value={smsUnitCost}
                      onChange={e => setSmsUnitCost(parseInt(e.target.value) || 100)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 flex font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 uppercase font-bold block mb-1">Đơn giá Zalo (đ/tin):</label>
                    <input 
                      type="number" 
                      value={znsUnitCost}
                      onChange={e => setZnsUnitCost(parseInt(e.target.value) || 100)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 flex font-bold"
                    />
                  </div>
                </div>

                {/* Conversion expectation rates */}
                <div className="space-y-3 pt-2 border-t border-slate-900">
                  <h4 className="text-[10px] text-slate-450 uppercase font-mono font-bold">Chuyển đổi dự toán:</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>Conv. SMS %:</span>
                        <strong className="text-red-400">{estSmsConv}%</strong>
                      </div>
                      <input 
                        type="range" min="0.5" max="10" step="0.5" value={estSmsConv} 
                        onChange={e => setEstSmsConv(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>Conv. ZNS %:</span>
                        <strong className="text-emerald-400">{estZnsConv}%</strong>
                      </div>
                      <input 
                        type="range" min="1" max="25" step="0.5" value={estZnsConv} 
                        onChange={e => setEstZnsConv(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Ticket size */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold uppercase font-mono text-slate-400">
                    <span>Giá trị gói hàng hạch toán bình quân (tr VNĐ):</span>
                    <span className="text-amber-500 font-extrabold">{avgTicketValue} trđ</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={avgTicketValue}
                    onChange={e => setAvgTicketValue(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

              </div>
            </div>

            {/* Calculations & Chart outputs right side */}
            <div className="lg:col-span-7 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-6">
              
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[9px] text-slate-500 font-black uppercase font-mono block">CHI SMS TRUYỀN THỐNG</span>
                  <p className="text-base font-mono font-black text-rose-450 mt-1">{(smsTotalCost / 1000000).toFixed(1)} triệuđ</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[9px] text-slate-500 font-black uppercase font-mono block">CHI PHÝ ZALO ZNS</span>
                  <p className="text-base font-mono font-black text-emerald-400 mt-1">{(znsTotalCost / 1000000).toFixed(1)} triệuđ</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[9px] text-slate-500 font-black uppercase font-mono block">TIẾT KIỆM ĐẦU TƯ CỐ ĐỊNH</span>
                  <p className="text-base font-mono font-black text-blue-400 mt-1">{(saveDifference / 1000000).toFixed(1)} triệuđ ({((saveDifference / smsTotalCost)*100).toFixed(0)}%)</p>
                </div>
              </div>

              {/* Dynamic Feedback block */}
              <div className="p-3.5 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-left text-[11px] font-semibold leading-relaxed">
                <span className="text-[9px] text-slate-500 font-black uppercase font-mono block mb-1">Đối chiếu hiệu quả dòng chuyển đổi:</span>
                <p className="text-slate-300">
                  📈 Gửi <strong>{monthlyVolume.toLocaleString()} tin nhắn ZNS</strong> mang về khoảng <strong>{znsConversions} khách hàng mới</strong> ({estZnsConv}% conversion rate), tương ứng doanh thu lũy kế ước đạt <strong>{(znsEstRevenue / 1000000).toFixed(1)} triệu VNĐ</strong>.
                </p>
                <p className="text-slate-300 mt-1">
                  📉 Trong khi đó SMS truyền thống chỉ đem về <strong>{smsConversions} khách</strong> ({estSmsConv}%), tương ứng <strong>{(smsEstRevenue / 1000000).toFixed(1)} triệu VNĐ</strong> doanh thu đầu cuối.
                </p>
              </div>

              {/* Recharts chart */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">BIỂU ĐỒ BÁO CÁO PHÂN KHÚC: SMS VS ZALO ZNS</span>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={generateRoiGraphData()}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                      <YAxis stroke="#475569" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }} />
                      <Legend fontSize={10} wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="SMS truyền thông" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Mạng Zalo ZNS" fill="#0068ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 4: DEEP LINKS & QR GENERATOR */}
      {activeSubTab === 'deeplink_gen' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Form list left */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  Zalo Deep Connections
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <QrCode className="w-4.5 h-4.5 text-blue-400" />
                  Tạo QR Code & Đường truyền nội bộ
                </h3>
              </div>

              <form onSubmit={handleCreateDeeplink} className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">TIÊU ĐỀ LIÊN KẾT (LINK TITLE):</label>
                  <input
                    type="text"
                    value={newDlName}
                    onChange={e => setNewDlName(e.target.value)}
                    placeholder="Ví dụ: Link quét ưu đãi hội nhóm VIP..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">ĐƯỜNG DẪN ĐÍCH ĐẾN (TARGET URL):</label>
                  <input
                    type="url"
                    value={newDlUrl}
                    onChange={e => setNewDlUrl(e.target.value)}
                    placeholder="Ví dụ: https://zalo.me/LedgerflowHQ..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">KÊNH CHUYÊN BIỆT (PLATFORM CLASS):</label>
                  <select
                    value={newDlPlatform}
                    onChange={e => setNewDlPlatform(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="oa_follow">Follow Quan tâm Zalo Official Account</option>
                    <option value="oa_chat">Chat nói chuyện trực tiếp CSKH</option>
                    <option value="mini_app">Dẫn dắt thẳng vào Zalo Mini App shell</option>
                    <option value="payment_vietqr">Quét QR VietQR tích hợp nộp phí</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Khởi tạo QR Code & Link Tracker
                </button>
              </form>
            </div>

            {/* list display table and QR preview block right */}
            <div className="lg:col-span-7 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 grid sm:grid-cols-12 gap-5">
              
              <div className="sm:col-span-8 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Danh sách link nội bộ VN đang theo dõi</h3>
                
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {deeplinks.map(dl => (
                    <div key={dl.id} className="p-3 bg-slate-950 border border-slate-900 hover:border-slate-850 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 text-left flex-1 min-w-0">
                        <span className="font-extrabold text-white block truncate">{dl.name}</span>
                        <div className="flex items-center gap-1.5 font-mono text-[9px]">
                          <span className="text-slate-500">Short:</span>
                          <strong className="text-blue-400 selection:bg-blue-900">{dl.shortCode}</strong>
                          <span className="text-slate-600">| Clks:</span>
                          <strong className="text-emerald-400">{dl.clickCount}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyCode(dl.id, dl.targetUrl)}
                          className="p-1.5 bg-slate-900 hover:text-white border border-slate-850 rounded-lg transition-all cursor-pointer"
                          title="Sao chép link Zalo"
                        >
                          {copiedTextId === dl.id ? <Check className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                        <button
                          onClick={() => alert(`Mô phỏng: Tải ảnh QR Code chuẩn in ấn cho chiến dịch: ${dl.name}`)}
                          className="p-1.5 bg-slate-900 hover:text-white border border-slate-850 rounded-lg transition-all cursor-pointer"
                          title="Tải QR Code"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-450" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical QR preview card */}
              <div className="sm:col-span-4 bg-slate-950 p-4 border border-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center">
                <span className="text-[10px] text-slate-500 font-black uppercase block tracking-wider font-mono">BẢN IN QR PREVIEW</span>
                
                <div className="w-[140px] aspect-square bg-[#0e1621] border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-3 text-slate-500 relative">
                  <div className="absolute top-1 left-2 w-max text-slate-600 text-[8.5px] font-mono">QR Hỗ trợ</div>
                  <QrCode className="w-20 h-20 text-blue-400" />
                  <span className="text-[9px] text-white font-mono font-bold mt-1.5">LEDGERFLOW VN</span>
                </div>
                
                <span className="text-[10px] text-slate-400 leading-normal font-semibold">Tích hợp thư viện qrcode.js để xuất SVG/PNG thực tế hạch toán.</span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 5: MINI APP BLUEPRINT COMPOSITE FLOW */}
      {activeSubTab === 'mini_app' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Left side checklist */}
            <div className="lg:col-span-6 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  Vietnam Ecosystem Architecture
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Workflow className="w-4.5 h-4.5 text-blue-400" />
                  Quy Trình Triển Khai Zalo Mini App
                </h3>
              </div>

              {/* Steps timeline display */}
              <div className="space-y-3 text-xs leading-normal">
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1 text-left">
                  <strong className="text-white font-extrabold flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-blue-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black">1</span>
                    Xác lập Tài khoản Đối tác & OA
                  </strong>
                  <p className="text-slate-400 pl-5">Đăng ký Mini App ID của bạn trên Zalo Developer Network. Thực hiện liên kết dứt điểm với OA được tích hợp tick vàng doanh nghiệp.</p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1 text-left">
                  <strong className="text-white font-extrabold flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-blue-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black">2</span>
                    Xây dựng Giao diện (Zalo SDK)
                  </strong>
                  <p className="text-slate-400 pl-5">Thiết kế 5 màn hình cơ bản: Tra cứu Thuế, Báo biểu thuế VAT/CIT, Trực tuyến tư vấn kế toán, Cổng thanh toán VietQR kết hợp ví điện tử.</p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1 text-left">
                  <strong className="text-white font-extrabold flex items-center gap-1.5">
                    <span className="w-4 h-4 bg-blue-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black">4</span>
                    Cấu hình Webhook & Bảo mật
                  </strong>
                  <p className="text-slate-400 pl-5">Whitelist miền máy chủ LedgerFlow. Kích hạch webhook tự động phản hồi (Zalo Interactive Chat) gửi thông cáo báo biểu quý.</p>
                </div>
              </div>
            </div>

            {/* Right side flow diagrams in beautiful divs */}
            <div className="lg:col-span-6 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Luồng Truy Truyền Hành Vi & Dòng Tiền Phễu</h3>

              {/* CSS Blocks diagram */}
              <div className="space-y-3 font-mono text-[9.5px]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="w-full sm:w-1/3 p-3 bg-blue-900/10 border border-blue-500/30 rounded-xl text-center text-white font-bold">
                    [Zalo Official Account]<br />🎯 Điểm ranh giới thu hút
                  </div>
                  <div className="text-slate-600 text-center font-bold">➔</div>
                  <div className="w-full sm:w-1/3 p-3 bg-purple-900/10 border border-purple-500/30 rounded-xl text-center text-white font-bold">
                    [Mini App Shell SDK]<br />⚡ Giao diện truy vấn nhẹ
                  </div>
                  <div className="text-slate-600 text-center font-bold">➔</div>
                  <div className="w-full sm:w-1/3 p-3 bg-emerald-900/10 border border-emerald-500/30 rounded-xl text-center text-white font-bold">
                    [Cổng Thanh Toán VietQR]<br />💵 Thu ròng doanh thu
                  </div>
                </div>
              </div>

              {/* Estimate values */}
              <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-2xl max-w-xl mx-auto space-y-3.5 text-xs text-left">
                <span className="text-[10px] text-slate-500 font-black block uppercase font-mono">Bản dự thảo chi phí đầu tư (Tham khảo):</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <strong className="text-white block font-bold">💎 Gói Mini App Cơ bản:</strong>
                    <span className="text-emerald-450 font-mono font-bold">15 - 25 triệu VNĐ</span>
                    <span className="text-[9.5px] text-slate-500 block">Thời gian: 3 - 4 tuần</span>
                  </div>
                  <div className="space-y-0.5">
                    <strong className="text-white block font-bold">💎 Gói Mini App Nâng cao:</strong>
                    <span className="text-emerald-450 font-mono font-bold">35 - 60 triệu VNĐ</span>
                    <span className="text-[9.5px] text-slate-500 block">Kèm cổng VietQR & ví Momo</span>
                  </div>
                </div>

                {/* Prompt copier */}
                <div className="pt-3 border-t border-slate-900/80 space-y-2">
                  <span className="text-[10px] text-purple-400 font-extrabold uppercase font-mono">Sinh Prompt Để AI Code Mini App:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode('p1', 'Xây dựng một khung ứng dụng Zalo Mini App sử dụng HTML5/CSS3 và thư viện Zalo Mini App SDK để kết xuất trang tra cứu tờ khai thuế VAT/CIT miễn phí cho doanh nghiệp nhỏ. Tối ưu CSS theo phong cách tối giản màu sắc dark navy, bao gồm nút nộp phí tài khóa qua VietQR.')}
                    className="w-full py-2 bg-purple-600/15 border border-purple-500/30 hover:bg-purple-650 hover:text-white rounded-xl text-purple-300 text-xs font-bold uppercase transition-all"
                  >
                    🚀 {copiedTextId === 'p1' ? 'Đã sao chép prompt vào Clipboard!' : 'Sao chép prompt huấn luyện AI'}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
