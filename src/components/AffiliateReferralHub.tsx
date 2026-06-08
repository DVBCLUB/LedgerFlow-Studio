import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Settings, 
  Link2, 
  DollarSign, 
  QrCode, 
  Copy, 
  CheckCircle, 
  TrendingUp, 
  FileSpreadsheet, 
  Share2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Gift
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface Partner {
  id: string;
  name: string;
  email: string;
  tier: 'promoter' | 'expert' | 'agency';
  clicks: number;
  signups: number;
  sales: number;
  totalEarnings: number;
  pendingPayout: number;
  bankAccount: string;
  bankName: string;
}

export default function AffiliateReferralHub() {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'portal_sim' | 'payouts' | 'analytics'>('config');
  const [notification, setNotification] = useState<string | null>(null);

  // Initial Partners Data
  const [partners, setPartners] = useState<Partner[]>([
    { id: 'REF-ANHNV', name: 'Nguyễn Văn Hải', email: 'hai.nguyen@saasgrowth.vn', tier: 'expert', clicks: 1240, signups: 180, sales: 24, totalEarnings: 12600000, pendingPayout: 3200000, bankAccount: '190345678234', bankName: 'Techcombank' },
    { id: 'REF-CHILET', name: 'Lê Thị Tuyết', email: 'tuyet.le@ketoanhanoi.com', tier: 'promoter', clicks: 420, signups: 68, sales: 8, totalEarnings: 3200000, pendingPayout: 1200000, bankAccount: '0011004562719', bankName: 'Vietcombank' },
    { id: 'REF-TRANQK', name: 'Trần Quốc Khánh', email: 'khanh.tran@accountingviet.vn', tier: 'agency', clicks: 3820, signups: 540, sales: 88, totalEarnings: 52800000, pendingPayout: 11500000, bankAccount: '1023456789', bankName: 'VietinBank' },
    { id: 'REF-MAILA', name: 'Mai Lan Anh', email: 'lananh.mai@freelance.vn', tier: 'promoter', clicks: 180, signups: 22, sales: 2, totalEarnings: 800000, pendingPayout: 0, bankAccount: '970422934523', bankName: 'MB Bank' },
    { id: 'REF-ADMINS', name: 'Trương Hoàng', email: 'hoang.truong@startupcoach.vn', tier: 'expert', clicks: 950, signups: 120, sales: 15, totalEarnings: 7500000, pendingPayout: 2500000, bankAccount: '045100028345', bankName: 'Vietcombank' },
  ]);

  // Form states for creating new partners
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerTier, setNewPartnerTier] = useState<'promoter' | 'expert' | 'agency'>('promoter');
  const [newPartnerBank, setNewPartnerBank] = useState('');
  const [newPartnerAcc, setNewPartnerAcc] = useState('');

  // Configuration settings
  const [cookieLife, setCookieLife] = useState<number>(30);
  const [commType, setCommType] = useState<'percent' | 'fixed'>('percent');
  const [commValue, setCommValue] = useState<number>(20);
  const [tierPercent, setTierPercent] = useState({
    promoter: 15,
    expert: 20,
    agency: 30
  });
  const [minPayout, setMinPayout] = useState<number>(200000);

  // Portal generator variables
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('REF-ANHNV');
  const [customPromoText, setCustomPromoText] = useState<string>('Bí quyết kết sổ kế toán cực nhanh cùng LedgerFlow Smart Hub! Giới thiệu nhận hoàn tiền mặt 20%.');

  // Trigger Notification
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim() || !newPartnerEmail.trim() || !newPartnerAcc.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin đối tác!');
      return;
    }

    const referralCode = `REF-${newPartnerName.substring(0, 5).toUpperCase().replace(/\s/g, '') || 'PARTNER'}-${Math.floor(100 + Math.random() * 900)}`;
    const newPartner: Partner = {
      id: referralCode,
      name: newPartnerName,
      email: newPartnerEmail,
      tier: newPartnerTier,
      clicks: 0,
      signups: 0,
      sales: 0,
      totalEarnings: 0,
      pendingPayout: 0,
      bankAccount: newPartnerAcc,
      bankName: newPartnerBank || 'Techcombank'
    };

    setPartners([newPartner, ...partners]);
    setSelectedPartnerId(referralCode);
    setNewPartnerName('');
    setNewPartnerEmail('');
    setNewPartnerAcc('');
    triggerNotification(`Đồng hành cùng ${newPartner.name} thành công! Mã Code liên kết: ${referralCode}`);
  };

  const handlePayoutAll = () => {
    const updated = partners.map(p => ({ ...p, pendingPayout: 0 }));
    setPartners(updated);
    triggerNotification('Đã ghi nhận thanh toán hoa hồng đồng loạt thành công! Trạng thái dư nợ hoa hồng đã về 0.');
  };

  const handleClearPartnerPayout = (id: string) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, pendingPayout: 0 } : p));
    triggerNotification(`Đã thanh toán thành công cho đối tác ${id}!`);
  };

  const selectedPartner = useMemo(() => {
    return partners.find(p => p.id === selectedPartnerId) || partners[0];
  }, [selectedPartnerId, partners]);

  const totalCalculatedMetrics = useMemo(() => {
    const clicks = partners.reduce((sum, p) => sum + p.clicks, 0);
    const signups = partners.reduce((sum, p) => sum + p.signups, 0);
    const sales = partners.reduce((sum, p) => sum + p.sales, 0);
    const earnings = partners.reduce((sum, p) => sum + p.totalEarnings, 0);
    const pending = partners.reduce((sum, p) => sum + p.pendingPayout, 0);

    return {
      clicks,
      signups,
      sales,
      earnings,
      pending,
      conversionRate: clicks > 0 ? parseFloat(((sales / clicks) * 100).toFixed(2)) : 0
    };
  }, [partners]);

  // Simulated Time-series data
  const chartData = [
    { day: '01/06', referrals: 4, earnings: 1400000, conversion: 2.1 },
    { day: '02/06', referrals: 6, earnings: 2100000, conversion: 2.2 },
    { day: '03/06', referrals: 9, earnings: 4200000, conversion: 2.8 },
    { day: '04/06', referrals: 8, earnings: 3800000, conversion: 2.5 },
    { day: '05/06', referrals: 12, earnings: 6200000, conversion: 3.1 },
    { day: '06/06', referrals: 15, earnings: 8500000, conversion: 3.6 },
    { day: '07/06', referrals: 18, earnings: 11200000, conversion: 3.9 }
  ];

  return (
    <div className="bg-[#050911]/80 backdrop-blur-md rounded-2xl border border-slate-900/80 shadow-2xl overflow-hidden text-slate-200">
      
      {/* Platform Banner Header */}
      <div className="p-6 border-b border-slate-900/60 bg-gradient-to-r from-emerald-950/20 via-slate-950 to-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black font-mono">
              PHÂN HỆ 5.12
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
              Affiliate &amp; Partner Network Builder
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Affiliate &amp; Referral Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Tự động hóa kênh tiếp thị liên kết (Partnership) để thúc đẩy lượng truy cập tự nhiên từ cộng đồng kế toán viên, tư vấn viên thuế và đại lý số.
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-900 self-stretch md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'config'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Định Cấu Hình Luật
          </button>
          <button
            onClick={() => setActiveSubTab('portal_sim')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'portal_sim'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Trình Giả Lập CTV Portal
          </button>
          <button
            onClick={() => setActiveSubTab('payouts')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'payouts'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Quy Trình Đối Soát VietQR
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Phân Tích Chuyển Đổi
          </button>
        </div>
      </div>

      {notification && (
        <div className="m-4 p-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-450 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="p-6">
        
        {/* SUB TAB 1: AFFILIATE CONFIG & RULES BUILDER */}
        {activeSubTab === 'config' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Left Column: Rule form */}
              <div className="md:col-span-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-900 space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-900 pb-2">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Quy Chế &amp; Cấp Bậc Commission</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold block">Thời gian hiệu lực của Cookie:</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={cookieLife}
                        onChange={(e) => setCookieLife(Number(e.target.value))}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                      >
                        <option value={15}>15 ngày (Tiêu chuẩn)</option>
                        <option value={30}>30 ngày (Khuyến nghị)</option>
                        <option value={60}>60 ngày (Ưu việt)</option>
                        <option value={90}>90 ngày (Cộng tác đặc biệt)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold block">Ngưỡng Thanh Toán Tối Thiểu (VND):</label>
                    <input
                      type="number"
                      value={minPayout}
                      onChange={(e) => setMinPayout(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white font-mono"
                      placeholder="VD: 200000"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] text-slate-400 font-bold block">Căn chỉnh tỷ lệ hoa hồng từng phân khúc cấp bậc:</label>
                  
                  <div className="grid sm:grid-cols-3 gap-3">
                    {/* Promoter (Nhỏ lẻ) */}
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-850 text-center">
                      <span className="text-[10px] text-slate-405 font-bold block">Promoter (Đại sứ nhỏ)</span>
                      <p className="text-[9px] text-slate-500 mb-1.5">Giới thiệu từ 1 - 5 khách</p>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={tierPercent.promoter}
                          onChange={(e) => setTierPercent({ ...tierPercent, promoter: Number(e.target.value) })}
                          className="w-12 text-center bg-slate-950 border border-slate-800 text-xs py-0.5 rounded text-emerald-400 font-bold font-mono"
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    </div>

                    {/* Expert (Chuyên nghiệp) */}
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-emerald-500/15 text-center">
                      <span className="text-[10px] text-emerald-450 font-bold block">Expert (Tư vấn viên)</span>
                      <p className="text-[9px] text-slate-500 mb-1.5">Giới thiệu từ 6 - 20 khách</p>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={tierPercent.expert}
                          onChange={(e) => setTierPercent({ ...tierPercent, expert: Number(e.target.value) })}
                          className="w-12 text-center bg-slate-950 border border-slate-800 text-xs py-0.5 rounded text-emerald-400 font-bold font-mono"
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    </div>

                    {/* Agency (Đại lý cấp cao) */}
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-850 text-center">
                      <span className="text-[10px] text-slate-405 font-bold block">Agency (Đại lý/Doanh nghiệp)</span>
                      <p className="text-[9px] text-slate-500 mb-1.5">Trực tiếp quản lý &gt;20 khách</p>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={tierPercent.agency}
                          onChange={(e) => setTierPercent({ ...tierPercent, agency: Number(e.target.value) })}
                          className="w-12 text-center bg-slate-950 border border-slate-800 text-xs py-0.5 rounded text-emerald-400 font-bold font-mono"
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/20 border border-emerald-900/20 rounded-xl text-[11px] text-slate-350 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-450 shrink-0 mt-0.5" />
                  <span>
                    Hệ thống sẽ lưu vết phiên (Session Cookie Tracking) theo địa chỉ IP kết hợp LocalStorage để đảm bảo tính minh bạch, hỗ trợ tối đa khi Publisher chia sẻ chéo Landing Page qua các diễn đàn kế toán.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => triggerNotification('Cập nhật luật thặng dư hoa hồng & cấu hình Session Cookie thành công!')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-550 text-xs text-center font-bold text-white rounded-lg transition-all"
                >
                  Lưu Thiết Lập &amp; Áp Dụng Toàn Hệ Thống
                </button>
              </div>

              {/* Right Column: Register partners manually */}
              <div className="md:col-span-1 bg-slate-950/40 p-5 rounded-2xl border border-slate-900 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block pb-2 border-b border-slate-900">
                  ➕ Đăng Ký Đối Tác VIP Thủ Công
                </span>

                <form onSubmit={handleCreatePartner} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Tên Đối Tác:</label>
                    <input
                      type="text"
                      placeholder="VD: Anh Phạm Kỳ Nam"
                      value={newPartnerName}
                      onChange={(e) => setNewPartnerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Email liên lạc:</label>
                    <input
                      type="email"
                      placeholder="VD: nam.pham@webketoan.vn"
                      value={newPartnerEmail}
                      onChange={(e) => setNewPartnerEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Ngân hàng &amp; Tài khoản nhận:</label>
                    <div className="flex gap-2">
                      <select
                        value={newPartnerBank}
                        onChange={(e) => setNewPartnerBank(e.target.value)}
                        className="bg-slate-905 border border-slate-800 rounded p-1 text-[11px] text-white"
                      >
                        <option value="Techcombank">TCB</option>
                        <option value="Vietcombank">VCB</option>
                        <option value="VietinBank">CTG</option>
                        <option value="MB Bank">MBB</option>
                        <option value="BIDV">BIDV</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Số tài khoản"
                        value={newPartnerAcc}
                        onChange={(e) => setNewPartnerAcc(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Cấp bậc bắt đầu:</label>
                    <select
                      value={newPartnerTier}
                      onChange={(e) => setNewPartnerTier(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                    >
                      <option value="promoter">Promoter ({tierPercent.promoter}%)</option>
                      <option value="expert">Expert ({tierPercent.expert}%)</option>
                      <option value="agency">Agency ({tierPercent.agency}%)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full p-2 bg-emerald-600 hover:bg-emerald-550 text-xs font-bold text-white rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Đăng Ký &amp; Tạo Nhúng Link
                  </button>
                </form>

                <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl leading-relaxed text-[10px] text-slate-400">
                  ⚠️ <strong>Lưu ý:</strong> Liên kết hoa hồng hạch toán sẽ tự kích hoạt ngay khi người dùng đăng ký trải nghiệm phần mềm qua đường dẫn giới thiệu đặc biệt.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUB TAB 2: PORTAL SIMULATOR FOR COLLABORATOR */}
        {activeSubTab === 'portal_sim' && (
          <div className="space-y-6">
            
            <div className="bg-slate-950/40 p-4 rounded-xl border border-emerald-900/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-550 uppercase font-black block font-mono">Quan Sát &amp; Lựa chọn CTV:</span>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.id} ({p.tier.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Tổng Click</span>
                  <span className="text-base font-bold font-mono text-white">{selectedPartner.clicks} Clicks</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Đã Chốt</span>
                  <span className="text-base font-bold font-mono text-emerald-400">{selectedPartner.sales} Hợp Đồng</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Đang Chờ Pay</span>
                  <span className="text-base font-bold font-mono text-amber-400">{selectedPartner.pendingPayout.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* Trình giả lập trang CTV của đối tác */}
            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <h4 className="text-xs font-extrabold text-white tracking-widest font-mono uppercase">
                    👥 TRÀN MÀN HÌNH ĐỐI TÁC (COLLABORATOR DASHBOARD DEMO)
                  </h4>
                </div>
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 p-1 px-2 rounded-lg font-mono">
                  Đang xem với tư cách: {selectedPartner.name}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-6">
                
                {/* Left widgets */}
                <div className="md:col-span-1 space-y-4">
                  
                  {/* Share code boxes */}
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850/60 space-y-3">
                    <span className="text-[10px] text-emerald-450 font-bold block uppercase tracking-wider">ĐƯỜNG DẪN TIẾP THỊ CHUYÊN BIỆT</span>
                    <p className="text-[11px] text-slate-400">Copy link này dán lên Facebook, Zalo, Tiktok cá nhân của bạn:</p>
                    
                    <div className="flex bg-slate-950 border border-slate-800 rounded overflow-hidden">
                      <input
                        type="text"
                        readOnly
                        value={`https://ledgerflow.vn?ref=${selectedPartner.id.toLowerCase()}`}
                        className="flex-1 bg-transparent border-none text-[10.5px] text-emerald-400 font-mono p-1.5 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://ledgerflow.vn?ref=${selectedPartner.id.toLowerCase()}`);
                          triggerNotification('Đã lưu link giới thiệu của CTV vào Clipboard!');
                        }}
                        className="p-1 px-3.5 bg-slate-900 hover:bg-slate-850 text-slate-350 text-[10px] border-l border-slate-800 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 italic">Mỗi lượt thanh toán mới từ link này sẽ tự động ghi có {selectedPartner.tier === 'promoter' ? tierPercent.promoter : selectedPartner.tier === 'expert' ? tierPercent.expert : tierPercent.agency}% hoa hồng trực tiếp cho bạn.</p>
                  </div>

                  {/* Share tools */}
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850/60 space-y-3">
                    <span className="text-[10px] text-slate-350 font-bold block uppercase tracking-wider">CHIA SẺ MAU CHÓNG (CAPTION ĐỊNH SẴN)</span>
                    <textarea
                      rows={4}
                      readOnly
                      value={`${customPromoText}\n\n👉 Cơ hội trải nghiệm phần mềm đối soát tốt nhất Việt Nam tại: https://ledgerflow.vn?ref=${selectedPartner.id.toLowerCase()}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10.5px] text-slate-300 resize-none font-sans"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${customPromoText}\n\n👉 Cơ hội trải nghiệm phần mềm đối soát tốt nhất Việt Nam tại: https://ledgerflow.vn?ref=${selectedPartner.id.toLowerCase()}`);
                        triggerNotification('Đã copy caption và link tiếp thị!');
                      }}
                      className="w-full p-2 bg-emerald-600 hover:bg-emerald-550 text-[10px] font-bold text-white rounded flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Copy Toàn Bộ Gói Bài Viết
                    </button>
                  </div>

                </div>

                {/* Right Area: Performance summary */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 text-center">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Độc giả Click</span>
                      <p className="text-xl font-mono font-bold text-white mt-1">{selectedPartner.clicks}</p>
                    </div>

                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 text-center">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Tài khoản Free</span>
                      <p className="text-xl font-mono font-bold text-sky-400 mt-1">{selectedPartner.signups}</p>
                    </div>

                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 text-center">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Hợp đồng mua</span>
                      <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{selectedPartner.sales}</p>
                    </div>

                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 text-center">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Tỷ lệ Chuyển Đổi</span>
                      <p className="text-xl font-mono font-bold text-amber-400 mt-1">
                        {selectedPartner.clicks > 0 ? ((selectedPartner.sales / selectedPartner.clicks) * 100).toFixed(1) : 0}%
                      </p>
                    </div>

                  </div>

                  <div className="bg-slate-900/20 p-5 rounded-xl border border-slate-850/75 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <span className="text-xs font-bold text-white">Chính Sách Đối Soát Thực Nhận</span>
                      <span className="text-[10px] text-slate-400 italic">Thanh toán tự động vào mùng 5 hàng tháng</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-2 bg-slate-950/40 rounded border border-slate-850">
                        <span className="text-xs text-slate-400">Tổng thu nhập trọn đời:</span>
                        <span className="text-xs font-bold text-white font-mono">{selectedPartner.totalEarnings.toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-emerald-950/20 rounded border border-emerald-500/10">
                        <span className="text-xs text-emerald-450">Hạn mức chờ chuyển khoản:</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">{selectedPartner.pendingPayout.toLocaleString('vi-VN')} VND</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-lg text-[10.5px] text-slate-400 border border-slate-850 space-y-1">
                      <p className="text-white font-bold">💳 Thông tin thụ hưởng đã đăng ký:</p>
                      <p>Ngân hàng nhận: <strong className="text-slate-200">{selectedPartner.bankName}</strong></p>
                      <p>Số tài khoản hạch toán: <strong className="text-slate-200 font-mono">{selectedPartner.bankAccount}</strong></p>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* SUB TAB 3: COMMISSION PAYOUTS - VIETQR AUTOMATION */}
        {activeSubTab === 'payouts' && (
          <div className="space-y-6">
            
            <div className="p-4 bg-emerald-950/15 border border-emerald-900/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  <Gift className="w-4 h-4 text-emerald-450" />
                  Quy trình chi trả Hoa Hồng nhanh gọn tích hợp VietQR
                </h4>
                <p className="text-[11px] text-slate-400">
                  Dễ dàng quét mã nhận tiền hạch toán tức thời, không lo nhầm lẫn số tài khoản hoặc số tiền.
                </p>
              </div>

              <button
                onClick={handlePayoutAll}
                className="p-2 px-4 bg-emerald-600 hover:bg-emerald-550 text-xs font-bold text-white rounded-lg transition-all"
              >
                Xác Nhận Toàn Bộ Đối Tác Đã Thực Nhận
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Table list of payout details */}
              <div className="lg:col-span-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2 text-[11px]">
                  <span className="font-bold text-slate-405">QUỸ CHỜ THANH TOÁN HOA HỒNG ({partners.filter(p => p.pendingPayout > 0).length} ĐỐI TÁC)</span>
                  <span className="text-emerald-400 font-bold">Tổng: {totalCalculatedMetrics.pending.toLocaleString('vi-VN')} VND</span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {partners.map(p => (
                    <div 
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all ${
                        p.pendingPayout > 0 
                          ? 'bg-slate-900/40 border-slate-800' 
                          : 'bg-slate-950/20 border-slate-900/40 opacity-70'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-white">{p.name} ({p.id})</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.email} | {p.bankName}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-505 block">Dư hoa hồng</span>
                          <span className={`text-xs font-bold font-mono ${p.pendingPayout > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {p.pendingPayout.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900 text-[10px]">
                        <span className="text-slate-500 font-mono">TK: {p.bankAccount}</span>
                        
                        <div className="flex gap-2">
                          {p.pendingPayout > 0 && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPartnerId(p.id);
                                  triggerNotification(`Đã tạo mã QR hạch toán thanh toán cho ${p.name}!`);
                                }}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded font-bold"
                              >
                                Xem VietQR
                              </button>
                              <button
                                onClick={() => handleClearPartnerPayout(p.id)}
                                className="px-2 py-0.5 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/20 rounded font-black"
                              >
                                Đã Trả
                              </button>
                            </>
                          )}
                          {p.pendingPayout === 0 && (
                            <span className="text-emerald-500 font-bold">✓ Đã Hoàn Tất</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code automation display */}
              <div className="lg:col-span-1 bg-slate-950/40 p-5 rounded-2xl border border-slate-900/80 flex flex-col justify-between space-y-4">
                
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase font-mono block">
                    ⚡ MÁY CONFIG VIETQR DÀNH CHO ADMIN
                  </span>
                  <h4 className="text-xs font-bold text-white">Mã QR Thanh Toán Nhanh Cho:</h4>
                  <p className="text-xs font-black text-emerald-400">{selectedPartner.name}</p>
                </div>

                {/* Display QR simulator */}
                <div className="bg-white p-3 rounded-xl max-w-[200px] mx-auto space-y-2 text-slate-905 flex flex-col items-center">
                  {selectedPartner.pendingPayout > 0 ? (
                    <>
                      <img 
                        src={`https://api.vietqr.io/image/970407-190345678234-77aV2F9.jpg?accountName=LEDGERFLOW%20COMMISSION&amount=${selectedPartner.pendingPayout}&addInfo=HOA%20HONG%2520${selectedPartner.id}`}
                        alt="Tecombank QR Code"
                        className="w-40 h-40 object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[9px] text-slate-500 font-mono font-bold block text-center uppercase">
                        Hỗ trợ Napas 247 | VietQR
                      </span>
                    </>
                  ) : (
                    <div className="w-40 h-40 bg-slate-150 rounded flex flex-col justify-center items-center text-center p-2 text-slate-500">
                      <CheckCircle className="w-8 h-8 text-emerald-600 mb-1" />
                      <p className="text-[10px] font-bold">Không còn nợ hoa hồng cho đối tác này</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Số Tiền Quét:</span>
                    <strong className="text-white font-mono">{selectedPartner.pendingPayout.toLocaleString('vi-VN')} VND</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Nội dung chuyển:</span>
                    <strong className="text-white font-mono text-[10px]">HOA HONG {selectedPartner.id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>TK Thụ hưởng:</span>
                    <strong className="text-white font-mono">{selectedPartner.bankAccount}</strong>
                  </div>
                </div>

                <p className="text-[9.5px] text-slate-500 text-center italic">
                  💡 Sau khi chuyển tiền thủ công thông qua thiết bị ngân hàng cá nhân, bấm &quot;Đã Trả&quot; bên cạnh đối tác để lưu lại lịch sử hạch toán.
                </p>

              </div>

            </div>
          </div>
        )}

        {/* SUB TAB 4: METRICS & CONVERSION ANALYTICS CHART */}
        {activeSubTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* KPI grid cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[10px] text-slate-505 uppercase block font-mono">TỔNG LƯỢT TRUY CẬP TRỎ</span>
                <p className="text-2xl font-black font-mono text-white">{totalCalculatedMetrics.clicks}</p>
                <span className="text-[9px] text-emerald-400">✓ 100% Traffic tự nhiên</span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[10px] text-slate-505 uppercase block font-mono">ĐĂNG KÝ TÌM HIỂU (SIGNUPS)</span>
                <p className="text-2xl font-black font-mono text-white">{totalCalculatedMetrics.signups}</p>
                <span className="text-[9px] text-indigo-400">Tỷ lệ đăng ký: {((totalCalculatedMetrics.signups / totalCalculatedMetrics.clicks) * 100).toFixed(1)}%</span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[10px] text-slate-505 uppercase block font-mono">DOANH SỐ ĐÃ CHỐT</span>
                <p className="text-2xl font-black font-mono text-emerald-400">{totalCalculatedMetrics.sales}</p>
                <span className="text-[9px] text-slate-400">Tỷ số chuyển đổi: {totalCalculatedMetrics.conversionRate}%</span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-1">
                <span className="text-[10px] text-slate-505 uppercase block font-mono">TỔNG HOA HỒNG CHI TRẢ</span>
                <p className="text-2xl font-black font-mono text-amber-400">{(totalCalculatedMetrics.earnings + totalCalculatedMetrics.pending).toLocaleString('vi-VN')}đ</p>
                <span className="text-[9px] text-slate-500">Giảm thiểu CAC &gt;45% so với ADS</span>
              </div>

            </div>

            {/* Recharts view */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-450" />
                  Biểu Đồ Xu Hướng Giới Thiệu &amp; Doanh Số (Tuần Gần Nhất)
                </h3>
                <span className="text-[10px] text-slate-500">Theo dõi thời gian thực</span>
              </div>

              <div className="h-68">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                    <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                    <YAxis stroke="#475569" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }} 
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      name="Doanh thu mang lại (VND)" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorEarnings)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3.5 bg-slate-900/30 rounded-xl border border-slate-850 text-xs text-slate-400 space-y-1">
                <strong className="text-white">💡 Đánh giá của CFO:</strong>
                <p>Kênh Affiliate đang chuyển biến cực tốt. Với chi phí nhượng quyền chỉ tính trên hợp đồng thành công (Zero-Risk Marketing), rủi ro dòng tiền bằng không. Khuyên nghị mở rộng chương trình cộng tác bằng cách đẩy mạnh chiến dịch tặng Ebook khi giới thiệu khách hàng mới.</p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
