import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Target, 
  Plus, 
  Trash2, 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Mail, 
  Phone, 
  FileText, 
  RefreshCw,
  Search,
  Check,
  Zap,
  Briefcase,
  Users
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip 
} from 'recharts';

interface ScoringRule {
  id: string;
  event: string;
  category: 'behavior' | 'demographic' | 'engagement' | 'fit';
  points: number;
  decayDays: number;
  active: boolean;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  sector: 'service' | 'technology' | 'trade' | 'production';
  mrr: number; // triệu VND
  behaviorScore: number;
  fitScore: number;
  totalScore: number;
  temperature: 'hot' | 'warm' | 'cold';
  lastActivity: string;
  lastActivityDays: number;
  nextAction: string;
  actionType: 'call' | 'email' | 'proposal' | 'follow_up';
  icpMatch: number; // %
}

interface ActionTask {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  actionType: 'call' | 'email' | 'proposal' | 'follow_up';
  deadlineText: string;
  score: number;
  completed: boolean;
}

export default function LeadScoringEngine() {
  const { activeIdea } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'scoring_rules' | 'lead_board' | 'icp_matcher' | 'action_queue'>('scoring_rules');

  // --- TAB 1: SCORING RULES STATE ---
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([
    { id: 'r1', event: 'Xem chi tiết trang /pricing', category: 'behavior', points: 20, decayDays: 14, active: true },
    { id: 'r2', event: 'Nhấp mở Email chào mừng', category: 'engagement', points: 5, decayDays: 7, active: true },
    { id: 'r3', event: 'Nhấp liên kết Đăng ký Demo trực tiếp', category: 'behavior', points: 25, decayDays: 30, active: true },
    { id: 'r4', event: 'Tải bộ Excel mẫu hạch toán TT99', category: 'behavior', points: 15, decayDays: 21, active: true },
    { id: 'r5', event: 'Thuộc diện doanh nghiệp Công nghệ / SaaS', category: 'demographic', points: 10, decayDays: 0, active: true },
    { id: 'r6', event: 'Doanh thu hàng tháng ròng MRR > 50 triệu', category: 'fit', points: 20, decayDays: 0, active: true },
    { id: 'r7', event: 'Gửi phản hồi thư thắc mắc cho support', category: 'engagement', points: 8, decayDays: 14, active: true }
  ]);

  const [newRuleEvent, setNewRuleEvent] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<ScoringRule['category']>('behavior');
  const [newRulePoints, setNewRulePoints] = useState<number>(10);
  const [newRuleDecay, setNewRuleDecay] = useState<number>(7);

  // --- TAB 2 & 3: LEADS SEED DATABASE ---
  const [leads, setLeads] = useState<Lead[]>([
    { id: 'l1', name: 'Nguyễn Văn Hùng', company: 'TechSol VN', email: 'hung.nguyen@smetech.vn', phone: '0912345678', sector: 'technology', mrr: 120, behaviorScore: 50, fitScore: 37, totalScore: 87, temperature: 'hot', lastActivity: '2 giờ trước', lastActivityDays: 0, nextAction: 'Gửi bảng chào giá Premium', actionType: 'proposal', icpMatch: 95 },
    { id: 'l2', name: 'Trần Thị Mai', company: 'Spa Flora', email: 'mai.tran@spaflora.com', phone: '0987654321', sector: 'service', mrr: 45, behaviorScore: 35, fitScore: 27, totalScore: 62, temperature: 'warm', lastActivity: '1 ngày trước', lastActivityDays: 1, nextAction: 'Gọi điện giải đáp quyết toán', actionType: 'call', icpMatch: 75 },
    { id: 'l3', name: 'Phạm Minh Hoàng', email: 'hoang.pham@retailmart.vn', phone: '0903334445', company: 'Retail Mart HN', sector: 'trade', mrr: 210, behaviorScore: 40, fitScore: 45, totalScore: 85, temperature: 'hot', lastActivity: '4 giờ trước', lastActivityDays: 0, nextAction: 'Setup buổi Live Demo tài khoản', actionType: 'proposal', icpMatch: 90 },
    { id: 'l4', name: 'Lê Hoàng Yến', email: 'yen.le@woodcraft.vn', phone: '0918887776', company: 'Woodcraft VN', sector: 'production', mrr: 350, behaviorScore: 20, fitScore: 48, totalScore: 68, temperature: 'warm', lastActivity: '3 ngày trước', lastActivityDays: 3, nextAction: 'Nhắn Zalo tặng voucher', actionType: 'email', icpMatch: 82 },
    { id: 'l5', name: 'Vũ Đức Hải', email: 'hai.vu@teksol.io', phone: '0945556667', company: 'Teksol Automation', sector: 'technology', mrr: 85, behaviorScore: 55, fitScore: 32, totalScore: 87, temperature: 'hot', lastActivity: '20 phút trước', lastActivityDays: 0, nextAction: 'Chốt hợp đồng sáp nhập Ledger', actionType: 'proposal', icpMatch: 96 },
    { id: 'l6', name: 'Hoàng Anh Tuấn', email: 'tuan.ha@cateringco.com', phone: '0971231234', company: 'Catering Express', sector: 'service', mrr: 65, behaviorScore: 15, fitScore: 20, totalScore: 35, temperature: 'cold', lastActivity: '5 ngày trước', lastActivityDays: 5, nextAction: 'Gửi email hâm nóng newsletter', actionType: 'email', icpMatch: 52 },
    { id: 'l7', name: 'Đỗ Thùy Linh', email: 'linh.dt@agromart.vn', phone: '0969998887', company: 'Agromart Sài Gòn', sector: 'trade', mrr: 420, behaviorScore: 28, fitScore: 48, totalScore: 76, temperature: 'hot', lastActivity: '1 ngày trước', lastActivityDays: 1, nextAction: 'Gọi điện thoại hẹn tư vấn riêng', actionType: 'call', icpMatch: 88 },
    { id: 'l8', name: 'Nguyễn Bích Vy', email: 'vy.nb@cosmeticco.vn', phone: '0901235555', company: 'Mỹ phẩm An Vy', sector: 'service', mrr: 35, behaviorScore: 12, fitScore: 15, totalScore: 27, temperature: 'cold', lastActivity: '12 ngày trước', lastActivityDays: 12, nextAction: 'Theo dõi lại sau 30 ngày', actionType: 'follow_up', icpMatch: 45 }
  ]);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>('l1');
  const [leadFilterSector, setLeadFilterSector] = useState<'all' | 'service' | 'technology' | 'trade' | 'production'>('all');

  // --- TAB 3: ICP DESIGN FIT CRITERIA ---
  const [icpSectors, setIcpSectors] = useState<string[]>(['technology', 'trade', 'production']);
  const [icpMinMrr, setIcpMinMrr] = useState<number>(50);
  const [icpMaxMrr, setIcpMaxMrr] = useState<number>(300);
  const [icpCompanySize, setIcpCompanySize] = useState<'1-5' | '5-20' | '20-100' | '100+'>('5-20');
  const [icpTechSavviness, setIcpTechSavviness] = useState<'low' | 'medium' | 'high'>('high');

  // Dynamic activation to match activeIdea
  useEffect(() => {
    if (activeIdea) {
      const shortName = activeIdea.title.split(' - ')[0];
      const isGame = activeIdea.type === 'game';

      // Transform scoring rules event names
      setScoringRules(prev => prev.map(rule => {
        if (rule.id === 'r4') {
          return {
            ...rule,
            event: isGame ? `Tải bản chơi thử ${shortName}` : `Tải tài liệu dùng thử ${shortName}`,
          };
        }
        if (rule.id === 'r5') {
          return {
            ...rule,
            event: isGame ? `Khách hàng đam mê Game / Giải trí` : `Khách thuộc nhóm tệp ${activeIdea.nicheAudience}`,
          };
        }
        return rule;
      }));

      // Adjust ICP target metrics dynamically
      if (isGame) {
        setIcpSectors(['service', 'technology']);
        setIcpMinMrr(5); // Gamers/Indie budgets are lower
        setIcpMaxMrr(50);
        setIcpCompanySize('1-5'); // Individual gamers/micro teams
        setIcpTechSavviness('medium');
      } else {
        setIcpSectors(['technology', 'trade', 'production']);
        setIcpMinMrr(40);
        setIcpMaxMrr(450);
        setIcpCompanySize('5-20');
        setIcpTechSavviness('high');
      }
    }
  }, [activeIdea]);

  // --- TAB 4: TODAY ACTION TASKS ---
  const [actionTasks, setActionTasks] = useState<ActionTask[]>([
    { id: 't1', leadId: 'l1', leadName: 'Nguyễn Văn Hùng', company: 'TechSol VN', actionType: 'proposal', deadlineText: '1 giờ tới', score: 87, completed: false },
    { id: 't2', leadId: 'l3', leadName: 'Phạm Minh Hoàng', company: 'Retail Mart HN', actionType: 'proposal', deadlineText: '3 giờ tới', score: 85, completed: false },
    { id: 't3', leadId: 'l2', leadName: 'Trần Thị Mai', company: 'Spa Flora', actionType: 'call', deadlineText: 'Hôm nay', score: 62, completed: false },
    { id: 't4', leadId: 'l7', leadName: 'Đỗ Thùy Linh', company: 'Agromart Sài Gòn', actionType: 'call', deadlineText: 'Hôm nay', score: 76, completed: false },
    { id: 't5', leadId: 'l4', leadName: 'Lê Hoàng Yến', company: 'Woodcraft VN', actionType: 'email', deadlineText: 'Ngày mai', score: 68, completed: true }
  ]);

  // Handle addition of a scoring rule
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleEvent.trim()) return;

    const newRule: ScoringRule = {
      id: 'rule_' + Date.now(),
      event: newRuleEvent,
      category: newRuleCategory,
      points: newRulePoints,
      decayDays: newRuleDecay,
      active: true
    };

    setScoringRules([...scoringRules, newRule]);
    setNewRuleEvent('');
  };

  const toggleRuleActive = (id: string) => {
    setScoringRules(scoringRules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: string) => {
    setScoringRules(scoringRules.filter(r => r.id !== id));
  };

  // ICP toggles
  const handleIcpSectorToggle = (sectorName: string) => {
    if (icpSectors.includes(sectorName)) {
      setIcpSectors(icpSectors.filter(s => s !== sectorName));
    } else {
      setIcpSectors([...icpSectors, sectorName]);
    }
  };

  // Re-calculate mock ICP % fit score based on selected criteria
  const getRecalculatedIcpScore = (lead: Lead) => {
    let score = 30; // base score

    if (icpSectors.includes(lead.sector)) score += 25;
    if (lead.mrr >= icpMinMrr && lead.mrr <= icpMaxMrr) score += 25;
    if (icpTechSavviness === 'high' && lead.sector === 'technology') score += 15;
    if (icpTechSavviness === 'medium' && lead.sector === 'trade') score += 10;
    if (lead.mrr > icpMaxMrr) score += 10; // extra fitting for larger entities

    return Math.min(score, 100);
  };

  // Toggle tasks completion
  const handleToggleTask = (id: string) => {
    setActionTasks(actionTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Radar Chart data preparation for selected lead
  const getRadarChartData = () => {
    const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];
    const computedIcpScore = getRecalculatedIcpScore(selectedLead);

    return [
      { subject: 'Sự tương thích Ngành (Sector Fit)', Max: 100, 'Khách hàng': icpSectors.includes(selectedLead.sector) ? 100 : 30 },
      { subject: 'Khối lượng giao dịch (MRR)', Max: 100, 'Khách hàng': selectedLead.mrr >= icpMinMrr ? 90 : 40 },
      { subject: 'Hành vi trực tuyến (Web Behavior)', Max: 100, 'Khách hàng': selectedLead.behaviorScore * 1.8 },
      { subject: 'Mức độ Tương tác (CTR)', Max: 100, 'Khách hàng': selectedLead.behaviorScore * 1.4 },
      { subject: 'ICP Match %', Max: 100, 'Khách hàng': computedIcpScore },
    ];
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  return (
    <div className="bg-[#060b13]/80 border border-slate-900 rounded-3xl p-6 shadow-2xl relative select-text text-left" id="lead-scoring-engine-container">
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
              Lead Prioritization Engine (Slide 57 Benchmark)
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <Target className="w-5.5 h-5.5 text-amber-500" />
            Hệ Thống Phân Loại & Chấm Điểm Khách Hàng Tiềm Năng (SME Scoring)
          </h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-2xl">
            Tự động theo dõi hành vi, lọc sạch tệp Leads có chất lượng chuyển đổi đỉnh cao dựa trên điểm tương thích ICP và tạo tự động hàng đợi xử lý cuộc gọi hằng ngày.
          </p>
        </div>

        {/* SUB NAV BAR */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-900">
          {[
            { id: 'scoring_rules', label: 'Quy Tắc Điểm', icon: Sliders },
            { id: 'lead_board', label: 'Bảng Kanban', icon: Flame },
            { id: 'icp_matcher', label: 'Độ Khớp ICP', icon: Target },
            { id: 'action_queue', label: 'Hàng Đợi Ngày', icon: Zap },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-amber-600 text-white shadow-md' 
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

      {/* SUB-TABS BODY AREA */}

      {/* TAB 1: RULES BUILDER */}
      {activeSubTab === 'scoring_rules' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Form Creator Left */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  Engine Parameters
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sliders className="w-4.5 h-4.5 text-amber-500" />
                  Xây Dựng Quy Tắc Chấm Điểm
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Thiết lập điểm cộng cho các sự kiện hành động cụ thể hoặc điểm tương thích của tệp khách hàng.
                </p>
              </div>

              <form onSubmit={handleAddRule} className="space-y-3.5 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">TÊN SỰ KIỆN KÍCH HOẠT (TRIGGER EVENT):</label>
                  <input
                    type="text"
                    value={newRuleEvent}
                    onChange={e => setNewRuleEvent(e.target.value)}
                    placeholder="Ví dụ: Đăng ký xem webinar quyết toán thuế..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">PHÂN BIỆT:</label>
                    <select
                      value={newRuleCategory}
                      onChange={e => setNewRuleCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                    >
                      <option value="behavior">Hành vi (Behavior)</option>
                      <option value="engagement">Tương tác (Interaction)</option>
                      <option value="fit">Độ khớp ICP (Firmographic)</option>
                      <option value="demographic">Địa lý, Ngành nghề</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">ĐIỂM SỐ CỘNG (+):</label>
                    <select
                      value={newRulePoints}
                      onChange={e => setNewRulePoints(parseInt(e.target.value) || 5)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    >
                      <option value="5">+5 điểm (Thường)</option>
                      <option value="10">+10 điểm (Quan tâm)</option>
                      <option value="15">+15 điểm (Nâng cao)</option>
                      <option value="20">+20 điểm (Quan trọng)</option>
                      <option value="25">+25 điểm (Rất nóng)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">THỜI GIAN GIẢM NHIỆT ĐỘ ĐIỂM (DECAY DAYS):</label>
                  <select
                    value={newRuleDecay}
                    onChange={e => setNewRuleDecay(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="0">Không giảm nhiệt độ (Tích lũy vĩnh viễn)</option>
                    <option value="7">Giảm dần sau 7 ngày không hoạt động</option>
                    <option value="14">Giảm dần sau 14 ngày không hoạt động</option>
                    <option value="30">Giảm dần sau 30 ngày không hoạt động</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Đăng ký Quy Tắc
                </button>
              </form>
            </div>

            {/* Rules table Right */}
            <div className="lg:col-span-7 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Danh sách Quy tắc Chấm điểm Hoạt Động Doanh Nghiệp
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[10px] font-mono">
                      <th className="pb-3 pl-2">Sự kiện hành vi thu nạp</th>
                      <th className="pb-3">Phân loại</th>
                      <th className="pb-3 text-right">Cộng điểm (Weight)</th>
                      <th className="pb-3 text-right">Giảm nhiệt độ (Decay)</th>
                      <th className="pb-3 text-center">Trạng Thái</th>
                      <th className="pb-3 text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoringRules.map(r => (
                      <tr key={r.id} className="border-b border-slate-900/40 hover:bg-slate-900/20 transition-all">
                        <td className="py-2.5 pl-2 font-extrabold text-white text-[11.5px]">{r.event}</td>
                        <td className="py-2.5 uppercase font-mono text-[9px] font-black">
                          {r.category === 'behavior' && <span className="text-purple-400">behavior</span>}
                          {r.category === 'engagement' && <span className="text-sky-400">engagement</span>}
                          {r.category === 'fit' && <span className="text-emerald-400">fit</span>}
                          {r.category === 'demographic' && <span className="text-amber-400">demographic</span>}
                        </td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-emerald-450">
                          +{r.points} điểm
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-400">
                          {r.decayDays > 0 ? `${r.decayDays} ngày` : 'Mãi mãi'}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => toggleRuleActive(r.id)}
                            className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase font-mono ${
                              r.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-600 border border-slate-800'
                            }`}
                          >
                            {r.active ? 'Bật' : 'Tắt'}
                          </button>
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => deleteRule(r.id)}
                            className="p-1 text-slate-500 hover:text-rose-450 transition-all cursor-pointer"
                            title="Xóa quy tắc này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: LEAD KANBAN BOARD */}
      {activeSubTab === 'lead_board' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          
          {/* Main 3 Columns Kanban Board */}
          <div className="grid md:grid-cols-3 gap-5">
            
            {/* HOT LEADS BOARD */}
            <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center bg-red-950/20 border border-red-900/10 p-2.5 rounded-xl">
                <span className="flex items-center gap-1 font-black text-xs text-red-400 uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                  HOT CẦN GỌI NGAY (≥70đ)
                </span>
                <span className="bg-red-500/15 text-red-400 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full">
                  {leads.filter(l => l.totalScore >= 70).length} Leads
                </span>
              </div>
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {leads.filter(l => l.totalScore >= 70).map(lead => (
                  <div 
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      selectedLeadId === lead.id 
                        ? 'bg-amber-500/5 border-amber-500/30' 
                        : 'bg-slate-950 border-slate-900 hover:border-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-white text-xs block">{lead.name}</span>
                      <strong className="text-red-400 font-mono text-xs">{lead.totalScore}đ</strong>
                    </div>
                    <span className="text-[10px] text-slate-450 block font-semibold mt-0.5">{lead.company} ({lead.sector})</span>
                    
                    {/* Tiny Progress Indicator */}
                    <div className="h-1 w-full bg-slate-900 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${lead.totalScore}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-[9.5px]">
                      <span className="text-slate-500 font-mono">Hoạt động: {lead.lastActivity}</span>
                      <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-md font-mono uppercase text-[8px] font-bold">
                        {lead.actionType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WARM LEADS BOARD */}
            <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center bg-amber-950/20 border border-amber-900/10 p-2.5 rounded-xl">
                <span className="flex items-center gap-1 font-black text-xs text-amber-400 uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  WĂRM TRUNG TÍNH (40-69đ)
                </span>
                <span className="bg-amber-500/15 text-amber-400 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full">
                  {leads.filter(l => l.totalScore >= 40 && l.totalScore < 70).length} Leads
                </span>
              </div>
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {leads.filter(l => l.totalScore >= 40 && l.totalScore < 70).map(lead => (
                  <div 
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      selectedLeadId === lead.id 
                        ? 'bg-amber-500/5 border-amber-500/30' 
                        : 'bg-slate-950 border-slate-900 hover:border-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-white text-xs block">{lead.name}</span>
                      <strong className="text-amber-400 font-mono text-xs">{lead.totalScore}đ</strong>
                    </div>
                    <span className="text-[10px] text-slate-450 block font-semibold mt-0.5">{lead.company} ({lead.sector})</span>

                    {/* Tiny Progress Indicator */}
                    <div className="h-1 w-full bg-slate-900 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${lead.totalScore}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-[9.5px]">
                      <span className="text-slate-500 font-mono">Hoạt động: {lead.lastActivity}</span>
                      <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-md font-mono uppercase text-[8px] font-bold">
                        {lead.actionType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLD LEADS BOARD */}
            <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                <span className="flex items-center gap-1 font-black text-xs text-slate-400 uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-slate-500" />
                  COLD THEO DÕI THỬ THÁCH (&lt;40đ)
                </span>
                <span className="bg-slate-800 text-slate-400 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full">
                  {leads.filter(l => l.totalScore < 40).length} Leads
                </span>
              </div>
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {leads.filter(l => l.totalScore < 40).map(lead => (
                  <div 
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      selectedLeadId === lead.id 
                        ? 'bg-amber-500/5 border-amber-500/30' 
                        : 'bg-slate-950 border-slate-900 hover:border-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-white text-xs block">{lead.name}</span>
                      <strong className="text-slate-400 font-mono text-xs">{lead.totalScore}đ</strong>
                    </div>
                    <span className="text-[10px] text-slate-450 block font-semibold mt-0.5">{lead.company} ({lead.sector})</span>

                    {/* Tiny Progress Indicator */}
                    <div className="h-1 w-full bg-slate-900 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-slate-500 rounded-full" style={{ width: `${lead.totalScore}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-[9.5px]">
                      <span className="text-slate-500 font-mono">Hoạt động: {lead.lastActivity}</span>
                      <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md font-mono uppercase text-[8px] font-bold">
                        {lead.actionType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Deep Selected Lead Details Expandable Panel */}
          {selectedLead && (
            <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-3xl grid md:grid-cols-2 gap-5 animate-slide-in">
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
                    Hồ sơ chi tiết
                  </span>
                  <span className="text-xs font-black text-white">{selectedLead.name} 💎</span>
                </div>
                <h4 className="text-sm font-black text-white">{selectedLead.company} ({selectedLead.sector})</h4>
                
                <div className="grid sm:grid-cols-2 gap-3 font-mono text-[10.5px]">
                  <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                    <span className="text-slate-500 font-bold block">ĐIỆN THOẠI HÀNG NGÀY:</span>
                    <strong className="text-white flex items-center gap-1"><Phone className="w-3 h-3 text-amber-500" /> {selectedLead.phone}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                    <span className="text-slate-500 font-bold block">EMAIL GIAO DỊCH VÀ ĐỀ XUẤT:</span>
                    <strong className="text-white flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-purple-400" /> {selectedLead.email}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                    <span className="text-slate-500 font-bold block">QUY MÔ DOANH THU MRR:</span>
                    <strong className="text-emerald-450">{selectedLead.mrr} triệu VNĐ / m</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                    <span className="text-slate-500 font-bold block">TIỀN ĐỀ HÀNH ĐỘNG KẾ TIẾP:</span>
                    <strong className="text-amber-500">{selectedLead.nextAction}</strong>
                  </div>
                </div>
              </div>

              {/* Behavior breakdown visualization */}
              <div className="space-y-3 text-left">
                <span className="text-[9px] text-slate-500 font-black uppercase font-mono block">Breakdown phân bổ điểm số:</span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Điểm số hành vi trực tuyến (Web activities):</span>
                    <strong className="text-purple-400">+{selectedLead.behaviorScore} điểm</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Điểm firmographic tương thích (ICP fit):</span>
                    <strong className="text-sky-400">+{selectedLead.fitScore} điểm</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2 text-[12px]">
                    <span className="text-white font-extrabold">TỔNG ĐIỂM SỐ KÈM THỜI GIAN NHIỆT ĐỘ:</span>
                    <strong className="text-amber-500 font-black">{selectedLead.totalScore}đ</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: ICP PROFILE MATCH & RADAR CHART */}
      {activeSubTab === 'icp_matcher' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Left side setting profile parameters */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  ICP Fit Criteria
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sliders className="w-4.5 h-4.5 text-amber-500" />
                  Hồ Sơ Chân Dung Khách Hàng Lý Tưởng (ICP)
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Thiết lập các tiêu chí chuẩn về ngành nghề và doanh thu mong muốn để hệ thống đối sánh nhanh tỷ lệ tương thích.
                </p>
              </div>

              {/* Sectors toggles checkbox */}
              <div className="space-y-2.5">
                <label className="text-[10px] text-slate-400 font-bold block uppercase font-mono">1. Nhóm ngành mục tiêu chính:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'technology', label: '💻 Công nghệ & SaaS' },
                    { id: 'service', label: '🌸 Dịch vụ khách hàng' },
                    { id: 'trade', label: '📦 Bán buôn & Retail' },
                    { id: 'production', label: '⚙️ Vận tải & Sản xuất' },
                  ].map(sec => (
                    <div 
                      key={sec.id}
                      onClick={() => handleIcpSectorToggle(sec.id)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${
                        icpSectors.includes(sec.id) 
                          ? 'bg-amber-600/15 border-amber-500/40 text-amber-400' 
                          : 'bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-800'
                      }`}
                    >
                      {sec.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Slider for MRR range */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-[10px] font-bold uppercase font-mono text-slate-400">
                  <span>2. Ngưỡng Doanh thu MRR tối thiểu:</span>
                  <span className="text-amber-400 font-extrabold">{icpMinMrr} trđ / tháng</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={icpMinMrr}
                  onChange={e => setIcpMinMrr(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Tech Savviness Selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold block uppercase font-mono">3. Khả năng công nghệ của khách:</label>
                <div className="grid grid-cols-3 gap-2 text-[10.5px] font-bold font-mono">
                  {[
                    { key: 'low', label: 'Low-tech' },
                    { key: 'medium', label: 'Medium-tech' },
                    { key: 'high', label: 'High-tech' }
                  ].map(sav => (
                    <div
                      key={sav.key}
                      onClick={() => setIcpTechSavviness(sav.key as any)}
                      className={`p-2 rounded-xl border text-center cursor-pointer transition-all uppercase ${
                        icpTechSavviness === sav.key 
                          ? 'bg-amber-600/15 border-amber-500/40 text-amber-400' 
                          : 'bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-850'
                      }`}
                    >
                      {sav.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Lead vs ICP matching score and RADAR chart */}
            <div className="lg:col-span-7 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="text-left">
                  <h3 className="text-sm font-black text-white">Mô Phỏng Độ Khớp Hồ Sơ Khách Hàng (Radar)</h3>
                  <p className="text-[10px] text-slate-400">Chọn một khách hàng bên dưới để nghiên cứu chi tiết phân bổ độ bền tương thích.</p>
                </div>
                <select
                  value={selectedLeadId || ''}
                  onChange={e => setSelectedLeadId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white"
                >
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Radar visualization */}
                <div className="h-[240px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarChartData()}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={8} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                      <Radar name="Điểm khớp" dataKey="Khách hàng" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Match score table */}
                <div className="space-y-2 justify-center flex flex-col">
                  {selectedLead && (
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-3">
                      <span className="text-[9px] text-slate-500 font-black block uppercase font-mono">Báo cáo đánh giá ICP:</span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Tên khách tiềm năng:</span>
                        <strong className="text-white">{selectedLead.name}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Ngành nghề doanh nghiệp:</span>
                        <strong className="text-white uppercase font-mono">{selectedLead.sector}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[12px] border-t border-slate-900 pt-2">
                        <span className="text-slate-300 font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          TỶ LỆ KHỚP CHUẨN ICP:
                        </span>
                        <strong className="text-amber-500 text-lg font-mono">{getRecalculatedIcpScore(selectedLead)}%</strong>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 font-semibold text-center italic">
                    💡 Khách hàng trên {getRecalculatedIcpScore(selectedLead || leads[0]) >= 75 ? 'RẤT ĐÁNG GỌI NGAY - Phù hợp tuyệt đối' : 'Cần nuôi dưỡng thêm - Chưa đạt chuẩn ICP của bạn'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTION QUEUE TODAY */}
      {activeSubTab === 'action_queue' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          
          {/* Top queue summary stats */}
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">CÔNG VIỆC THÙ NGẠP HÔM NAY</span>
              <p className="text-lg font-mono font-black text-amber-500 mt-1">{actionTasks.length} nhiệm vụ</p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Cơ hội chốt giao dịch cực nóng</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">ĐÃ HOÀN THÀNH SỚM</span>
              <p className="text-lg font-mono font-black text-emerald-450 mt-1">{actionTasks.filter(t => t.completed).length} đã xong</p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Tối ưu tốc độ trả lời (response metrics)</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">LEADS GẤP CHƯA LIÊN LẠC</span>
              <p className="text-lg font-mono font-black text-red-500 mt-1">{actionTasks.filter(t => !t.completed && t.score >= 80).length} Hot Leads</p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Ưu tiên cuộc gọi trong khung giờ vàng</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">ỨNG BIẾN CUỘC GỌI MIỄN PHÍ</span>
              <p className="text-lg font-mono font-black text-purple-400 mt-1">2.4 phút / KH</p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Thời gian đàm thoại chào hàng đề xuất</span>
            </div>
          </div>

          {/* Table display Queue list with complete actions checking */}
          <div className="bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Khung việc Tác chiến Hàng ngày - Call, Demo - Sắp xếp theo mức độ gấp (Lead Score)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[10px] font-mono">
                    <th className="pb-3 pl-2">Hoàn Thành</th>
                    <th className="pb-3">Tên Khách Hàng / Hồ Sơ</th>
                    <th className="pb-3 text-center">Nhiệm vụ tác chiến</th>
                    <th className="pb-3 text-right">Mức độ gấp (Lead Score)</th>
                    <th className="pb-3 text-right">Khung thời gian (Deadline)</th>
                    <th className="pb-3 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {actionTasks.map(task => (
                    <tr 
                      key={task.id} 
                      className={`border-b border-slate-900/40 transition-all ${
                        task.completed ? 'bg-slate-950/15 opacity-60 line-through' : 'hover:bg-slate-900/20'
                      }`}
                    >
                      <td className="py-2.5 pl-2 text-center">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                            task.completed 
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                              : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                      </td>
                      <td className="py-2.5">
                        <span className="font-extrabold text-white text-[11.5px] block">{task.leadName}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block font-semibold">{task.company}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        {task.actionType === 'proposal' && (
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9.5px] font-black uppercase font-mono">
                            📂 Gửi Đề xuất giá
                          </span>
                        )}
                        {task.actionType === 'call' && (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9.5px] font-black uppercase font-mono">
                            📞 Gọi điện thoại
                          </span>
                        )}
                        {task.actionType === 'email' && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9.5px] font-black uppercase font-mono">
                            ✉️ Gửi Email tư vấn
                          </span>
                        )}
                        {task.actionType === 'follow_up' && (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[9.5px] font-black uppercase font-mono">
                            🔄 Theo dõi định kỳ
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono font-black text-amber-500">
                        {task.score}đ / 100đ
                      </td>
                      <td className="py-2.5 text-right font-mono text-[10.5px] text-slate-300 font-extrabold uppercase">
                        {task.deadlineText}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition-all text-[10px] font-extrabold uppercase font-mono cursor-pointer"
                        >
                          {task.completed ? 'Mở lại' : 'Xong'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
