import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Bell, Play, Pause, Plus, Trash2, Users, Sliders, Eye, TrendingUp, ShieldCheck, Workflow, Info, Sparkles, Smartphone, CheckCircle2, AlertCircle, GitFork, Target, LineChart, Coins, Scale, RefreshCw } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart as RechartsLineChart, 
  Line 
} from 'recharts';
import MarketingGrowthV2Workspace from './MarketingGrowthV2Workspace';

type MarketingSubTab = 'growth_v2' | 'campaigns' | 'builder' | 'segments' | 'ab_roi' | 'gdpr';

const marketingSubTabs: Array<{ id: MarketingSubTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'growth_v2', label: 'V2 Growth OS', icon: Sparkles },
  { id: 'campaigns', label: 'Bàn Điều Hành', icon: Target },
  { id: 'builder', label: 'Kịch Bản (Builder)', icon: Workflow },
  { id: 'segments', label: 'Phân Khúc KH', icon: Users },
  { id: 'ab_roi', label: 'A/B Test & ROI', icon: TrendingUp },
  { id: 'gdpr', label: 'Tuân Thủ GDPR/PDPA', icon: ShieldCheck },
];

// --- CUSTOM INTERFACES ---
interface Campaign {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  audienceSize: number;
  openRate: number; // in %
  ctr: number; // in %
  conversions: number;
  estimatedROI: number; // in %
  createdDate: string;
}

interface SegmentContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  sector: 'service' | 'technology' | 'trade' | 'production';
  mrr: number; // in million VND
  retentionScore: number; // 1-100
  gdprAccepted: boolean;
  registrationDate: string;
}

interface JourneyNode {
  id: string;
  type: 'trigger' | 'action' | 'delay' | 'condition';
  title: string;
  channel?: 'email' | 'sms' | 'push' | 'in_app';
  description: string;
  delayValue?: string;
  config?: string;
}

export default function MarketingSuite() {
  const [activeSubTab, setActiveSubTab] = useState<MarketingSubTab>('campaigns');

  // --- MOCK DATABASE AND INITIAL STATE ---
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: 'c1', name: 'Chào mừng Solo Founder - Welcome Drip 1', channel: 'email', status: 'active', audienceSize: 1250, openRate: 68.5, ctr: 22.4, conversions: 280, estimatedROI: 185, createdDate: '2026-05-15' },
    { id: 'c2', name: 'Nhắc nhở giỏ hàng trống - Cart Abandonded Out', channel: 'push', status: 'active', audienceSize: 850, openRate: 85.0, ctr: 41.2, conversions: 350, estimatedROI: 320, createdDate: '2026-06-01' },
    { id: 'c3', name: 'Flash Sale SME - Phiên quyết toán tháng 6', channel: 'sms', status: 'scheduled', audienceSize: 3400, openRate: 98.2, ctr: 12.5, conversions: 342, estimatedROI: 145, createdDate: '2026-06-05' },
    { id: 'c4', name: 'Giới thiệu tính năng LedgerFlow Premium 4.0', channel: 'in_app', status: 'draft', audienceSize: 5000, openRate: 100, ctr: 31.0, conversions: 0, estimatedROI: 0, createdDate: '2026-06-07' },
    { id: 'c5', name: 'Chiến dịch tri ân khách hàng lâu năm 2026', channel: 'email', status: 'completed', audienceSize: 920, openRate: 74.1, ctr: 18.2, conversions: 167, estimatedROI: 240, createdDate: '2026-04-10' }
  ]);

  const [contacts, setContacts] = useState<SegmentContact[]>([
    { id: 'ct1', name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@smetech.vn', phone: '0912345678', sector: 'technology', mrr: 120, retentionScore: 92, gdprAccepted: true, registrationDate: '2026-01-10' },
    { id: 'ct2', name: 'Trần Thị Mai', email: 'mai.tran@spaflora.com', phone: '0987654321', sector: 'service', mrr: 45, retentionScore: 78, gdprAccepted: true, registrationDate: '2026-02-15' },
    { id: 'ct3', name: 'Phạm Minh Hoàng', email: 'hoang.pham@retailmart.vn', phone: '0903334445', sector: 'trade', mrr: 210, retentionScore: 64, gdprAccepted: false, registrationDate: '2026-03-01' },
    { id: 'ct4', name: 'Lê Hoàng Yến', email: 'yen.le@woodcraft.vn', phone: '0918887776', sector: 'production', mrr: 350, retentionScore: 85, gdprAccepted: true, registrationDate: '2026-03-12' },
    { id: 'ct5', name: 'Vũ Đức Hải', email: 'hai.vu@teksol.io', phone: '0945556667', sector: 'technology', mrr: 85, retentionScore: 95, gdprAccepted: true, registrationDate: '2026-04-05' },
    { id: 'ct6', name: 'Hoàng Anh Tuấn', email: 'tuan.ha@cateringco.com', phone: '0971231234', sector: 'service', mrr: 65, retentionScore: 50, gdprAccepted: false, registrationDate: '2026-04-20' },
    { id: 'ct7', name: 'Đỗ Thùy Linh', email: 'linh.dt@agromart.vn', phone: '0969998887', sector: 'trade', mrr: 420, retentionScore: 72, gdprAccepted: true, registrationDate: '2026-05-02' }
  ]);

  // --- CAMPAIGN BUILDER NODES ---
  const [journeyNodes, setJourneyNodes] = useState<JourneyNode[]>([
    { id: 'n1', type: 'trigger', title: 'Điểm Kích Hoạt Hành Trình (Trigger)', description: 'Đăng ký tài khoản Solo Founder mới thành công' },
    { id: 'n2', type: 'action', title: 'Gửi Email Chào Mừng (Welcome)', channel: 'email', description: 'Gửi Mail Chào mừng kèm bộ 15 mẫu Template hạch toán TT200/99 miễn phí' },
    { id: 'n3', type: 'delay', title: 'Thời Gian Chờ (Delay)', description: 'Chờ phản hồi trong vòng 3 ngày' },
    { id: 'n4', type: 'condition', title: 'Điều Kiện Rẽ Nhánh (Option Fork)', description: 'Nếu người dùng chưa khởi tạo sổ sách đầu tiên?' },
    { id: 'n5', type: 'action', title: 'Gửi SMS Nhắc Nhở Đăng Nhập', channel: 'sms', description: 'Gửi SMS nhắc nhở nhận mã dùng thử Premium dứt điểm' }
  ]);

  // --- DIALOG & FORM STATES ---
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignChannel, setNewCampaignChannel] = useState<'email' | 'sms' | 'push' | 'in_app'>('email');
  const [templatePlaceholder, setTemplatePlaceholder] = useState('Chủ doanh nghiệp');
  const [liveTemplateText, setLiveTemplateText] = useState('Xin chào {{Tên}}, Chào mừng bạn đến với LedgerFlow! Bạn đã đăng ký thành công tài khoản dịch vụ {{Lĩnh_vực}} với định mức doanh thu MRR trên {{MRR_muc}}tr VNĐ. Hãy nhấp ngay liên kết để nhận báo cáo quyết toán tự động!');

  // --- SECTOR SEGMENTATION SLIDERS ---
  const [filterSector, setFilterSector] = useState<'all' | 'service' | 'technology' | 'trade' | 'production'>('all');
  const [filterMinMrr, setFilterMinMrr] = useState<number>(0);
  const [filterGdprOnly, setFilterGdprOnly] = useState<boolean>(false);
  const [filteredContacts, setFilteredContacts] = useState<SegmentContact[]>(contacts);

  // --- A/B ROI PARAMS ---
  const [abAudienceSize, setAbAudienceSize] = useState<number>(10000);
  const [abOpenRateA, setAbOpenRateA] = useState<number>(22.5); // %
  const [abOpenRateB, setAbOpenRateB] = useState<number>(31.4); // %
  const [abConversionRateA, setAbConversionRateA] = useState<number>(2.4); // %
  const [abConversionRateB, setAbConversionRateB] = useState<number>(4.8); // %
  const [abAverageOrderVal, setAbAverageOrderVal] = useState<number>(3.5); // Triệu VNĐ
  const [abCampaignCost, setAbCampaignCost] = useState<number>(12); // Triệu VNĐ

  // --- GDPR COMPLIANCE ACTIONS ---
  const [consentLogs, setConsentLogs] = useState([
    { ip: '113.190.231.42', time: '2026-06-08 09:22:15', email: 'hung.nguyen@smetech.vn', consentType: 'Double Opt-in Newsletter', status: 'Approved' },
    { ip: '42.113.155.89', time: '2026-06-08 09:41:03', email: 'mai.tran@spaflora.com', consentType: 'Accept Privacy Policy V2', status: 'Approved' },
    { ip: '27.72.61.12', time: '2026-06-08 10:05:44', email: 'yen.le@woodcraft.vn', consentType: 'Web Marketing Cookies', status: 'Approved' },
    { ip: '14.226.40.75', time: '2026-06-08 10:11:10', email: 'linh.dt@agromart.vn', consentType: 'Double Opt-in SMS Alert', status: 'Approved' }
  ]);

  // Search Engine & Sync Filters
  useEffect(() => {
    let result = contacts;
    if (filterSector !== 'all') {
      result = result.filter(c => c.sector === filterSector);
    }
    result = result.filter(c => c.mrr >= filterMinMrr);
    if (filterGdprOnly) {
      result = result.filter(c => c.gdprAccepted === true);
    }
    setFilteredContacts(result);
  }, [filterSector, filterMinMrr, filterGdprOnly, contacts]);

  // Handle template placeholders
  const getRenderedText = () => {
    return liveTemplateText
      .replace(/{{Tên}}/g, templatePlaceholder || 'Quý khách')
      .replace(/{{Lĩnh_vực}}/g, 'Công nghệ & Fintech')
      .replace(/{{MRR_muc}}/g, '50');
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    const newCamp: Campaign = {
      id: 'c_' + Date.now(),
      name: newCampaignName,
      channel: newCampaignChannel,
      status: 'draft',
      audienceSize: filteredContacts.length > 0 ? filteredContacts.length : 1500,
      openRate: 0,
      ctr: 0,
      conversions: 0,
      estimatedROI: 0,
      createdDate: new Date().toISOString().split('T')[0]
    };

    setCampaigns([newCamp, ...campaigns]);
    setNewCampaignName('');
    setShowAddCampaign(false);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus: Campaign['status'] = c.status === 'active' ? 'paused' : (c.status === 'paused' || c.status === 'draft' ? 'active' : c.status);
        return { 
          ...c, 
          status: nextStatus,
          openRate: c.openRate === 0 ? 45.5 : c.openRate,
          ctr: c.ctr === 0 ? 15.2 : c.ctr
        };
      }
      return c;
    }));
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const handleAddBuilderNode = (type: JourneyNode['type']) => {
    const nodeId = 'node_' + Date.now();
    let title = 'Hành động mới';
    let description = 'Cấu hình chi tiết hành động';
    let channel: Campaign['channel'] | undefined;

    if (type === 'action') {
      title = 'Gửi tin nhắn đa kênh (Push)';
      channel = 'push';
      description = 'Gửi thông báo đẩy về điện thoại hoặc trình duyệt người dùng';
    } else if (type === 'delay') {
      title = 'Độ Trễ Chờ Đợt (Wait Delay)';
      description = 'Tạm dừng hành trình 2 ngày trước bước tiếp theo';
    } else if (type === 'condition') {
      title = 'Nhánh Ràng Buộc Kiểm Tra (Check)';
      description = 'Nếu khách hàng click link CRM trong email?';
    }

    const newNode: JourneyNode = {
      id: nodeId,
      type,
      title,
      channel,
      description
    };

    setJourneyNodes([...journeyNodes, newNode]);
  };

  const removeBuilderNode = (id: string) => {
    setJourneyNodes(prev => prev.filter(n => n.id !== id));
  };

  // ROI Calculator Calculations
  const calculatedTrafficA = abAudienceSize;
  const calculatedTrafficB = abAudienceSize;

  const totalOpensA = Math.round(calculatedTrafficA * (abOpenRateA / 100));
  const totalOpensB = Math.round(calculatedTrafficB * (abOpenRateB / 100));

  const conversionsA = Math.round(totalOpensA * (abConversionRateA / 100));
  const conversionsB = Math.round(totalOpensB * (abConversionRateB / 100));

  const estRevenueA = conversionsA * abAverageOrderVal;
  const estRevenueB = conversionsB * abAverageOrderVal;

  const roiA = abCampaignCost > 0 ? ((estRevenueA - abCampaignCost) / abCampaignCost) * 105 : 0;
  const roiB = abCampaignCost > 0 ? ((estRevenueB - abCampaignCost) / abCampaignCost) * 115 : 0;

  const abChartData = [
    { name: 'Khách Đọc Tin (Mở)', Variant_A: totalOpensA, Variant_B: totalOpensB },
    { name: 'Khách Mua (Conversions)', Variant_A: conversionsA, Variant_B: conversionsB },
    { name: 'Doanh Thu (triệu đ)', Variant_A: estRevenueA, Variant_B: estRevenueB },
  ];

  return (
    <div className="bg-[#060b13]/80 border border-slate-900 rounded-3xl p-6 shadow-2xl relative select-text" id="marketing-platform-suite">
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>

      {/* COMPONENT HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
              Campaign & Growth Lab (Slide 56 Benchmark)
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <Workflow className="w-5.5 h-5.5 text-purple-400" />
            Hệ Thống Tự Động Hóa & Tác Chiến Marketing SME
          </h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-2xl">
            Tối ưu hóa các điểm tiếp xúc khách hàng bằng trình lập kịch bản Automation Journey, gửi tin đa kênh theo phân đoạn dữ liệu thông minh và giám sát tuân thủ bảo mật dữ liệu GDPR/PDPA.
          </p>
        </div>

        {/* SUBNAV BAR */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-905">
          {marketingSubTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-purple-600 text-white shadow-md' 
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

      {activeSubTab === 'growth_v2' && (
        <div className="mt-6 animate-fade-in">
          <MarketingGrowthV2Workspace />
        </div>
      )}

      {/* TAB 1: GENERAL CAMPAIGNS MONITOR BOARD */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6 mt-6 animate-fade-in">
          
          {/* STATS STRIP */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 text-left">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">DOANH THU THỰC TẾ CHIẾN DỊCH</span>
              <p className="text-xl font-mono font-black text-emerald-450 mt-1">452.4M VNĐ</p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Tăng trưởng 22.4% so với quý trước</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 text-left">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block font-mono">TỶ LỆ CLICK TRUNG BÌNH (CTR)</span>
              <p className="text-xl font-mono font-black text-purple-400 mt-1">25.06%</p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Benchmark cao gấp 1.8 lần tiêu chuẩn</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 text-left">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block font-mono">SỐ LƯỢNG KHÁCH ĐÃ CHUYỂN ĐỔI</span>
              <p className="text-xl font-mono font-black text-amber-500 mt-1">1,139 Users</p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Từ 5 kịch bản tự động hóa chính thức</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 text-left">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block font-mono">TỶ LỆ BẬT NHẬN TIN (OPT-IN STATUS)</span>
              <p className="text-xl font-mono font-black text-blue-450 mt-1">82.1%</p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Yêu cầu hoàn thành Opt-in 2 lớp an toàn</span>
            </div>
          </div>

          {/* DUAL WORKSPACE SPLIT */}
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: ACTIVE CAMPAIGNS LIST */}
            <div className="lg:col-span-8 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Đo Đoàn Giao Dịch & Chiến Dịch Hiện Có</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Bảng theo dõi và vận hành bật/tắt các chiến dịch marketing đang triển khai.</p>
                </div>
                <button
                  onClick={() => setShowAddCampaign(true)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Tạo Chiến Dịch
                </button>
              </div>

              {/* Show Add Campaign Form */}
              {showAddCampaign && (
                <form onSubmit={handleCreateCampaign} className="p-4 bg-slate-950 border border-purple-900/40 rounded-2xl space-y-3.5 text-left animate-slide-in">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Thiết lập thông số cho Chiến dịch mới</h4>
                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">TÊN CHIẾN DỊCH KHỞI CHẠY:</label>
                      <input 
                        type="text" 
                        value={newCampaignName}
                        onChange={e => setNewCampaignName(e.target.value)}
                        placeholder="Ví dụ: Flash Sale Trung Thu SME..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">KÊNH TRUYỀN TẢI CHÍNH:</label>
                      <select 
                        value={newCampaignChannel}
                        onChange={e => setNewCampaignChannel(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="email">Email Marketing (Độ tin cậy cao)</option>
                        <option value="push">Push Notification (Thời gian thực)</option>
                        <option value="sms">SMS Marketing (Kêu gọi chuyển đổi gấp)</option>
                        <option value="in_app">In-App Banner (Tương tác trong app)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddCampaign(false)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-slate-400 rounded-xl hover:text-white"
                    >
                      Bỏ qua
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-500"
                    >
                      Lưu và Tạo nháp
                    </button>
                  </div>
                </form>
              )}

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-350 min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase text-[10px] font-mono">
                      <th className="pb-3 pl-2">Tên Chiến Dịch / Hành Động</th>
                      <th className="pb-3">Kênh tin</th>
                      <th className="pb-3">Trạng Thái</th>
                      <th className="pb-3 text-right">Tệp tiếp cận</th>
                      <th className="pb-3 text-right">CTR / Mở</th>
                      <th className="pb-3 text-right">Chuyển đổi</th>
                      <th className="pb-3 text-right pr-2">Ước tính ROI</th>
                      <th className="pb-3 text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="border-b border-slate-900/50 hover:bg-slate-900/20 transition-all">
                        <td className="py-3.5 pl-2">
                          <span className="font-extrabold text-white text-xs block">{camp.name}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Khởi tạo: {camp.createdDate}</span>
                        </td>
                        <td className="py-3.5 uppercase text-[10px] font-black font-mono">
                          {camp.channel === 'email' && <span className="text-sky-400 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>}
                          {camp.channel === 'sms' && <span className="text-amber-500 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> SMS</span>}
                          {camp.channel === 'push' && <span className="text-emerald-400 flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Push</span>}
                          {camp.channel === 'in_app' && <span className="text-purple-400 flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> In-App</span>}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                            camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' :
                            camp.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            camp.status === 'completed' ? 'bg-slate-800 text-slate-400' :
                            'bg-slate-950 text-slate-500 border border-slate-900'
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-white">
                          {camp.audienceSize.toLocaleString()} đ.tượng
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold">
                          {camp.status === 'draft' ? '—' : (
                            <div className="space-y-0.5">
                              <span className="text-white block">{camp.ctr}% CTR</span>
                              <span className="text-[10px] text-slate-500 block">Mở: {camp.openRate}%</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-emerald-450">
                          {camp.status === 'draft' ? '—' : `${camp.conversions} KH`}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-amber-400 pr-2">
                          {camp.status === 'draft' ? '—' : `+${camp.estimatedROI}%`}
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => toggleCampaignStatus(camp.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                camp.status === 'active' 
                                  ? 'bg-amber-950/20 border-amber-900/40 text-amber-400 hover:bg-amber-905' 
                                  : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400 hover:bg-emerald-905'
                              }`}
                              title={camp.status === 'active' ? 'Tạm dừng chiến dịch' : 'Kích hoạt ngay'}
                            >
                              {camp.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => deleteCampaign(camp.id)}
                              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-450 hover:text-rose-400 hover:border-rose-900/30 transition-all cursor-pointer"
                              title="Xóa chiến dịch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE VISUAL MOBILE MOCKUP TEMPLATER */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-3xl p-5 space-y-4">
              <div className="space-y-1 text-left">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  Live Preview Engine
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Eye className="w-4.5 h-4.5 text-amber-400" />
                  Thiết Kế Mẫu Tin Đa Kênh
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Soạn thảo nội dung và kiểm tra cách khách hàng tiếp cận trực tiếp trên smartphone.
                </p>
              </div>

              {/* TEMPLATE EDITOR INGREDIENTS */}
              <div className="space-y-3 pt-2">
                <div className="text-left">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">Ký tự Đóng thế ({"{{Tên}}"}):</label>
                  <input
                    type="text"
                    value={templatePlaceholder}
                    onChange={e => setTemplatePlaceholder(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    placeholder="Nguyễn Văn A..."
                  />
                </div>

                <div className="text-left">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">Nội dung tin nhắn gốc (Placeholders allowed):</label>
                  <textarea
                    rows={4}
                    value={liveTemplateText}
                    onChange={e => setLiveTemplateText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono leading-normal"
                    placeholder="Viết tin nhắn của bạn..."
                  />
                  <span className="text-[9px] text-slate-500 leading-normal block mt-1 font-semibold">
                    Bạn có thể gắn các thẻ tự động: <code className="text-amber-400 font-mono font-bold">{`{{Tên}}`}</code>, <code className="text-amber-400 font-mono font-bold">{`{{Lĩnh_vực}}`}</code>, <code className="text-amber-400 font-mono font-bold">{`{{MRR_muc}}`}</code>.
                  </span>
                </div>
              </div>

              {/* LIVE SMARTPHONE PREVIEW WINDOW */}
              <div className="pt-2">
                <div className="w-[240px] h-[400px] border-[5px] border-slate-800 rounded-[32px] mx-auto bg-slate-950 p-3.5 relative shadow-inner flex flex-col justify-between">
                  {/* Top phone camera hole */}
                  <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto absolute top-1.5 left-1/2 -ml-8"></div>

                  {/* Mock content container depending on selected notification style */}
                  <div className="pt-4 flex-1 space-y-3 overflow-hidden text-left font-sans select-none">
                    
                    {/* Top status bar */}
                    <div className="flex justify-between items-center text-[8px] text-slate-600 font-extrabold uppercase px-1">
                      <span>9:41 AM</span>
                      <span className="text-emerald-400">● 5G LTE</span>
                    </div>

                    {/* Main banner app popup */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5 animate-pulse relative shadow-lg">
                      <div className="flex items-center justify-between text-[8px] border-b border-slate-950 pb-1 text-slate-500">
                        <span className="font-extrabold flex items-center gap-1 text-purple-400">
                          <Workflow className="w-2.5 h-2.5 text-purple-400" />
                          LedgerFlow Direct
                        </span>
                        <span>vừa xong</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-200 font-semibold break-words">
                        {getRenderedText()}
                      </p>
                      
                      {/* Swipe button */}
                      <span className="text-[8px] text-purple-400 font-extrabold block text-center pt-1 border-t border-slate-950">
                        👉 Nhấp để kích hoạt mở quà tặng
                      </span>
                    </div>

                    {/* Secondary system screen decor to be visually pleasing */}
                    <div className="opacity-15 space-y-2 pt-2 border-t border-slate-900/60 font-mono">
                      <div className="h-3 w-1/2 bg-slate-850 rounded"></div>
                      <div className="h-2 w-full bg-slate-850 rounded"></div>
                      <div className="h-2 w-full bg-slate-850 rounded"></div>
                    </div>
                  </div>

                  {/* Bottom rounded home bar indicator */}
                  <div className="w-20 h-1 bg-slate-800 rounded-full mx-auto mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE CUSTOM JOURNEY BUILDER */}
      {activeSubTab === 'builder' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Workflow className="w-4.5 h-4.5 text-purple-400" />
              Bản Sơ Đồ Thiết Kế Kịch Bản Tự Động Hóa (Journey Builder)
            </h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Xây dựng phễu chăm sóc khách hàng bằng cách kết nối các quy trình phản hồi động. Nhấn các tùy chọn phía dưới để thêm bộ lọc mới vào bản vẽ.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button 
                onClick={() => handleAddBuilderNode('action')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                + Thêm Gửi Push/SMS
              </button>
              <button 
                onClick={() => handleAddBuilderNode('delay')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                + Thêm Chờ Đợi Delay
              </button>
              <button 
                onClick={() => handleAddBuilderNode('condition')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                + Thiết lập Ràng buộc/Check
              </button>
              <button 
                onClick={() => setJourneyNodes([
                  { id: 'n1', type: 'trigger', title: 'Trigger khởi điểm', description: 'Giao dịch phát sinh trên sổ sách' },
                ])}
                className="px-3 py-1.5 bg-rose-950/20 border border-rose-900/30 text-rose-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-950/40 ml-auto"
              >
                Dọn Sơ Đồ
              </button>
            </div>
          </div>

          {/* VISUAL PIPELINE GRAPHS */}
          <div className="bg-[#040810] border border-slate-900 rounded-3xl p-6 relative overflow-x-auto min-h-[400px] flex flex-col justify-start items-center">
            
            {/* BACKGROUND DECORATIVE GRID */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

            {journeyNodes.map((node, index) => (
              <React.Fragment key={node.id}>
                
                {/* NODE CARD DESCRIPTION */}
                <div className={`w-[290px] md:w-[350px] rounded-2xl border p-4.5 relative z-15 shadow-xl transition-all hover:scale-[1.02] ${
                  node.type === 'trigger' 
                    ? 'bg-gradient-to-r from-emerald-950/80 to-[#071311] border-emerald-500/30 text-emerald-300' 
                    : node.type === 'action'
                    ? 'bg-slate-950 border-purple-500/20 text-slate-200'
                    : node.type === 'delay'
                    ? 'bg-[#151006] border-amber-500/20 text-amber-300 font-mono'
                    : 'bg-indigo-950/25 border-indigo-500/20 text-indigo-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-black font-mono block text-slate-500 mb-1">
                        BƯỚC CHỈ TIÊU {index + 1} • {node.type.toUpperCase()}
                      </span>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        {node.type === 'trigger' && <Play className="w-3.5 h-3.5 text-emerald-400" />}
                        {node.type === 'action' && <Mail className="w-3.5 h-3.5 text-purple-400" />}
                        {node.type === 'delay' && <Info className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                        {node.type === 'condition' && <GitFork className="w-3.5 h-3.5 text-blue-500" />}
                        {node.title}
                      </h4>
                    </div>

                    {index > 0 && (
                      <button 
                        onClick={() => removeBuilderNode(node.id)}
                        className="text-slate-500 hover:text-rose-400 transition-all cursor-pointer p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 mt-2.5 leading-normal font-semibold">
                    {node.description}
                  </p>

                  {/* Customizable Config input inside visual builder */}
                  <div className="mt-3 pt-3 border-t border-slate-900/80 space-y-2">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase font-mono block">Cú pháp cấu hình trực quan:</span>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-900 rounded p-1 text-[10px] text-slate-350 font-mono focus:outline-none"
                      placeholder="Nhập logic lọc..."
                      defaultValue={node.type === 'delay' ? 'WAIT FOR 3 DAYS' : node.type === 'condition' ? 'IF ClickedURL IS TRUE' : 'DEFAULT'}
                    />
                  </div>
                </div>

                {/* GRAPH CONNECTOR DOWN ARROW */}
                {index < journeyNodes.length - 1 && (
                  <div className="my-4 flex flex-col items-center justify-center relative">
                    <div className="h-8 w-0.5 bg-gradient-to-b from-purple-500/40 to-indigo-500/40"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500/60 -mt-1 relative animate-bounce"></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ADVANCED SEGMENTATION ENGINE */}
      {activeSubTab === 'segments' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDE: CONTROLS & SLIDERS */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  SME Database Filters
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sliders className="w-4.5 h-4.5 text-emerald-400" />
                  Môi Trường Lọc Phân Khúc
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Thiết lập các tiêu chí lọc để phân tách tập khách hàng mục tiêu cho chiến dịch marketing.
                </p>
              </div>

              {/* CONTROLS */}
              <div className="space-y-4">
                {/* Sector Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block uppercase font-mono">1. Nhóm ngành hoạt động:</label>
                  <select
                    value={filterSector}
                    onChange={e => setFilterSector(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="all">Tất cả ngành nghề</option>
                    <option value="service">Dịch vụ, Spa, Nhà hàng B2C</option>
                    <option value="technology">Công nghệ, micro-SaaS, Freelance</option>
                    <option value="trade">Thương mại, Bán buôn, Dropship B2B</option>
                    <option value="production">Sản xuất vận tải nội địa</option>
                  </select>
                </div>

                {/* MRR Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase font-mono text-slate-400">
                    <span>2. Mức Doanh thu ròng tối thiểu (MRR):</span>
                    <span className="text-emerald-400">{filterMinMrr} triệu VNĐ</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="20"
                    value={filterMinMrr}
                    onChange={e => setFilterMinMrr(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600">
                    <span>0đ</span>
                    <span>150trđ</span>
                    <span>300trđ</span>
                    <span>400trđ+</span>
                  </div>
                </div>

                {/* GDPR filter checkbox */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                  <input
                    type="checkbox"
                    id="filter-gdpr-only"
                    checked={filterGdprOnly}
                    onChange={e => setFilterGdprOnly(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-0"
                  />
                  <label htmlFor="filter-gdpr-only" className="text-[10px] text-slate-405 text-slate-400 font-bold uppercase block font-mono cursor-pointer">
                    Chỉ lọc khách hàng đã đồng ý GDPR Opt-in
                  </label>
                </div>
              </div>

              {/* METRICS BOX */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2 text-left text-xs font-semibold">
                <span className="text-[9px] text-slate-500 font-black block uppercase font-mono">Bảng Quy Chi Phí Chiến Dịch Đầu Người (Sim)</span>
                <div className="flex justify-between font-mono text-[10.5px]">
                  <span className="text-slate-400">Tệp tiếp cận ròng:</span>
                  <strong className="text-white">{filteredContacts.length} / {contacts.length} Users</strong>
                </div>
                <div className="flex justify-between font-mono text-[10.5px]">
                  <span className="text-slate-400">Chi phí đầu tư ước tính:</span>
                  <strong className="text-emerald-450">{(filteredContacts.length * 1500).toLocaleString('vi-VN')} VNĐ</strong>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: TABLE WITH COMPACT LIST OF REGISTERED USERS */}
            <div className="lg:col-span-8 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Kết quả Sắp xếp Danh sách Khách hàng ({filteredContacts.length} người dùng phù hợp)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[10px] font-mono">
                      <th className="pb-3 pl-2">Khách hàng</th>
                      <th className="pb-3">Hồ sơ Email & Sđt</th>
                      <th className="pb-3 text-center">Ngành nghề</th>
                      <th className="pb-3 text-right">Doanh thu ròng MRR</th>
                      <th className="pb-3 text-right">Giữ chân (Score)</th>
                      <th className="pb-3 text-center pr-2">GDPR status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(c => (
                      <tr key={c.id} className="border-b border-slate-900/40 hover:bg-slate-900/20 transition-all">
                        <td className="py-2.5 pl-2 font-extrabold text-white">{c.name}</td>
                        <td className="py-2.5 font-mono text-[10.5px] text-slate-400">
                          <div>{c.email}</div>
                          <div className="text-[9px] text-slate-600 mt-0.5">{c.phone}</div>
                        </td>
                        <td className="py-2.5 text-center font-bold text-slate-300">
                          {c.sector === 'technology' && '💻 Công nghệ'}
                          {c.sector === 'service' && '🌸 Dịch vụ'}
                          {c.sector === 'trade' && '📦 Thương mại'}
                          {c.sector === 'production' && '⚙️ Sản xuất'}
                        </td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-white">
                          {c.mrr} trđ
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          <span className={`text-xs ${c.retentionScore > 80 ? 'text-emerald-450' : c.retentionScore > 60 ? 'text-amber-500' : 'text-rose-400'}`}>
                            {c.retentionScore}%
                          </span>
                        </td>
                        <td className="py-2.5 text-center pr-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase font-mono ${
                            c.gdprAccepted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-505' : 'bg-rose-950/30 text-rose-450 border border-rose-900/30'
                          }`}>
                            {c.gdprAccepted ? 'Opt-in' : 'No Opt'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredContacts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center italic text-slate-500 leading-normal">
                          ⚠️ Không tìm thấy người dùng nào phù hợp với các tiêu chí lọc. Hãy điều chỉnh thanh trượt MRR để có tập kết quả cao hơn!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: A/B TESTING ENGINE & ROI CALCULATION DESIGN */}
      {activeSubTab === 'ab_roi' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* LEFT CONTROLS PANEL */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  A/B Testing Simulator
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <LineChart className="w-4.5 h-4.5 text-purple-400" />
                  Môi Trường Đo Phản Hồi Độc Lập
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Thiết lập mẫu kiểm thử Đa biến nội dung cho Variant A (Thông thường) và Variant B (Kèm đề xuất cá nhân hóa) để tính toán ROI thực nghiệm.
                </p>
              </div>

              {/* INPUT CONTROLS */}
              <div className="space-y-3.5 pt-2">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">Quy mô Tệp khách:</label>
                    <input
                      type="number"
                      value={abAudienceSize}
                      onChange={e => setAbAudienceSize(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">Định mức Đầu tư (tr đ):</label>
                    <input
                      type="number"
                      value={abCampaignCost}
                      onChange={e => setAbCampaignCost(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-purple-405 text-purple-400 font-mono block">1. ĐỌC TIN (OPEN RATE RATE %)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Mẫu A (Chữ viết):</label>
                      <input
                        type="number"
                        value={abOpenRateA}
                        step="0.5"
                        onChange={e => setAbOpenRateA(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Mẫu B (Cá nhân hóa):</label>
                      <input
                        type="number"
                        value={abOpenRateB}
                        step="0.5"
                        onChange={e => setAbOpenRateB(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-xs text-white font-mono text-purple-400 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-amber-500 font-mono block">2. MUA HÀNG (CONVERSION RATE %)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Mẫu A:</label>
                      <input
                        type="number"
                        value={abConversionRateA}
                        step="0.1"
                        onChange={e => setAbConversionRateA(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Mẫu B (Ưu đãi động):</label>
                      <input
                        type="number"
                        value={abConversionRateB}
                        step="0.1"
                        onChange={e => setAbConversionRateB(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-xs text-white font-mono text-amber-400 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">3. Ước tính Giá trị Đơn trung bình (Triệu VNĐ):</label>
                  <input
                    type="number"
                    value={abAverageOrderVal}
                    step="0.5"
                    onChange={e => setAbAverageOrderVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono font-extrabold"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: PERFORMANCE CHARTS & ROI BOXES */}
            <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Đối chiếu Dòng doanh thu &amp; Hiệu ứng nâng cấp (Variant A vs Variant B)
              </h3>

              {/* Chart container */}
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={abChartData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Variant_A" fill="#475569" radius={[4, 4, 0, 0]} name="Mẫu Thường (A)" />
                    <Bar dataKey="Variant_B" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Cá nhân hóa (B)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ROI DUAL COMPARISON OUTLINE */}
              <div className="grid grid-cols-2 gap-4 font-mono text-left">
                <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 font-black block uppercase font-mono">KẾT QUẢ MẪU A (GỐC)</span>
                  <div className="text-sm font-black text-slate-350">{estRevenueA.toFixed(1)}M đ doanh thu</div>
                  <div className="text-xs font-bold text-slate-400">ROI đạt: <span className="text-white">+{roiA.toFixed(0)}%</span></div>
                </div>

                <div className="bg-purple-950/20 border border-purple-900/35 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] text-purple-400 font-black block uppercase font-mono">KẾT QUẢ MẪU B (MỚI)</span>
                  <div className="text-sm font-black text-purple-300">{estRevenueB.toFixed(1)}M đ doanh thu</div>
                  <div className="text-xs font-bold text-purple-400">ROI đạt: <span className="text-amber-400 font-extrabold">+{roiB.toFixed(0)}%</span></div>
                </div>
              </div>

              {/* STATISTICAL SIGNIFICANCE SUMMARY */}
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-1 text-left text-xs leading-relaxed">
                <span className="text-[9px] text-indigo-400 font-black block uppercase font-mono">🌟 Phân tích từ Growth Analyst</span>
                <p className="text-[11px] text-slate-300 font-semibold leading-normal">
                  Chỉ số chuyển đổi mẫu B vượt trội tới <strong className="text-amber-400">{((conversionsB - conversionsA) / (conversionsA || 1) * 100).toFixed(0)}%</strong>. 
                  Bằng cách áp dụng kịch bản cá nhân hóa tự động, bạn có thể bù đắp chi phí quảng cáo, tăng doanh số MRR hữu cơ lên thêm <strong className="text-emerald-400">{(estRevenueB - estRevenueA).toFixed(1)} triệu VNĐ</strong> mà không cần tăng ngân sách tệp danh mục đầu tư!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GDPR & PDPA COMPLIANCE HUB */}
      {activeSubTab === 'gdpr' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDE: INSTRUCTIONS & CHEAT SHEET */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-sky-505 bg-sky-500/10 text-sky-400 border border-sky-550 border-sky-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  GDPR & PDPA Standard ISO
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Scale className="w-4.5 h-4.5 text-sky-450 text-sky-400" />
                  Chốt chặn Tuân Thủ Pháp Lý Người dùng
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Đảm bảo các quy trình marketing thu hút khách hàng hợp pháp tại thị trường Việt Nam &amp; quốc tế (EU/Asia-East GDPR).
                </p>
              </div>

              {/* POLICIES TO ENABLE */}
              <div className="space-y-3 pt-2 font-semibold">
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-205">
                    <span className="w-2 h-2 rounded-full bg-emerald-450 block"></span>
                    <span>1. Cơ chế Double Opt-in (Xác thực 2 lớp)</span>
                  </div>
                  <p className="text-[10.5px] text-slate-450 leading-relaxed pl-4 font-semibold">
                    Khi người dùng mới điền form, hệ thống gửi email xác nhận trước khi đưa vào tệp khai thác quảng cáo chính thức.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-205">
                    <span className="w-2 h-2 rounded-full bg-emerald-450 block"></span>
                    <span>2. Cơ chế Unsubscribe Một Chạm (Opt-out)</span>
                  </div>
                  <p className="text-[10.5px] text-slate-450 leading-relaxed pl-4 font-semibold">
                    Toàn bộ mẫu tin gửi đi bắt buộc chứa thẻ <code className="text-[9.5px] text-slate-300 bg-slate-900 px-1 italic">/Unsubscribe</code> giúp người dùng thu hồi quyền chia sẻ số điện thoại nhanh chóng.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-105">
                    <span className="w-2 h-2 rounded-full bg-amber-400 block"></span>
                    <span>3. Quyền Yêu Cầu Xóa Bỏ Vĩnh Viễn</span>
                  </div>
                  <p className="text-[10.5px] text-slate-450 leading-relaxed pl-4 font-semibold">
                    Khách hàng được phép gửi yêu cầu tự động rút thông tin nhạy cảm để dọn dẹp bộ nhớ cơ sở dữ liệu rác triệt để.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: LIVE PROOF OF CONSENT COMPLIANCE LOG TABLE */}
            <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Nhật Ký Lưu Trữ Minh Chứng Chấp Thuận (Proof of Consent Logs)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Lưu trữ minh bạch mã IP, địa chỉ email và thời gian người dùng xác nhận Opt-in để bảo vệ doanh nghiệp trước các kiểm toán pháp lý tài sinh.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newLog = {
                      ip: '113.185.122.' + Math.floor(Math.random() * 254),
                      time: new Date().toISOString().replace('T', ' ').split('.')[0],
                      email: 'guest.' + Math.floor(Math.random() * 1000) + '@enterprise.vn',
                      consentType: 'Cookies Marketing Banner',
                      status: 'Approved'
                    };
                    setConsentLogs([newLog, ...consentLogs]);
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-350 font-bold uppercase rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Tạo log giả lập
                </button>
              </div>

              {/* LOG TABLE */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-slate-350 min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[9px] font-mono">
                      <th className="pb-3 pl-2">Địa Chỉ IP</th>
                      <th className="pb-3">Thời điểm (UTC)</th>
                      <th className="pb-3">Hồ Sơ Email</th>
                      <th className="pb-3">Hệ thống chấp thuận</th>
                      <th className="pb-3 text-center pr-2">Kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consentLogs.map((log, index) => (
                      <tr key={index} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition-all font-mono text-[10.5px]">
                        <td className="py-2.5 pl-2 font-bold text-amber-500">{log.ip}</td>
                        <td className="py-2.5 text-slate-400">{log.time}</td>
                        <td className="py-2.5 text-slate-300 font-sans font-semibold">{log.email}</td>
                        <td className="py-2.5 text-slate-400 font-sans font-semibold">{log.consentType}</td>
                        <td className="py-2.5 text-center pr-2 font-sans font-bold text-emerald-450">
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px]">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-1 text-left text-xs leading-relaxed">
                <span className="text-[9.5px] text-amber-400 font-black block uppercase font-mono">⚠️ Chú ý bảo mật dữ liệu khách hàng</span>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                  Dữ liệu được mã hóa hai lớp và sao lưu hoàn toàn lên các nút Supabase Cloud (với Row-Level-Security). Hãy chắc chắn rằng bạn không gửi thông tin quảng bá không mong muốn hay spam tin nhắn để tránh bị nhà mạng chặn dịch vụ và xử phạt hành văn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
