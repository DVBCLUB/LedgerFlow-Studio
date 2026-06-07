import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import { STATS } from './data/stats';
import { BUSINESS_IDEAS } from './data/businessIdeas';
import { ENGINEERED_PROMPTS } from './data/prompts';
import { SQL_SCHEMAS } from './data/sqlSchemas';
import { 
  Briefcase, 
  Calendar, 
  Database, 
  Terminal, 
  Cpu, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  TrendingUp, 
  FileText,
  Compass,
  LayoutDashboard,
  Layers,
  Network,
  Gamepad2,
  Zap,
  Search,
  Command,
  X,
  Rocket,
  Award,
  ShieldCheck,
  Cloud,
  CloudOff,
  RefreshCw,
  Globe
} from 'lucide-react';

import { loadDatabaseFromServer, saveDatabaseToServer } from './utils/dbSync';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  syncToSupabase, 
  pullFromSupabase, 
  executeSimulatedWasmQuery, 
  getWasmSqlLogs, 
  pushWasmSqlLog, 
  SupabaseConfig,
  getSupabaseClientInstance,
  authenticateSupabaseUser
} from './utils/supabaseSync';

// Lazy loaded modules for aggressive split and performance
const SoloFounderBusiness = React.lazy(() => import('./components/SoloFounderBusiness'));
const WebAccountingRoadmap = React.lazy(() => import('./components/WebAccountingRoadmap'));
const DataScienceEngineering = React.lazy(() => import('./components/DataScienceEngineering'));
const PromptPlayground = React.lazy(() => import('./components/PromptPlayground'));
const GeminiPlayground = React.lazy(() => import('./components/GeminiPlayground'));
const CustomDataWorkbench = React.lazy(() => import('./components/CustomDataWorkbench'));
const AIEcosystemArchitecture = React.lazy(() => import('./components/AIEcosystemArchitecture'));
const GameAndMLWorkbench = React.lazy(() => import('./components/GameAndMLWorkbench'));
const GuerrillaProductHub = React.lazy(() => import('./components/GuerrillaProductHub'));
const AccountingVietnam = React.lazy(() => import('./components/AccountingVietnam'));
const MLApplied = React.lazy(() => import('./components/MLApplied'));
const DeployBusiness = React.lazy(() => import('./components/DeployBusiness'));
const CommandCenter = React.lazy(() => import('./components/CommandCenter'));
const AdvisoryBoardReport = React.lazy(() => import('./components/AdvisoryBoardReport'));
const MarketSurveySimulator = React.lazy(() => import('./components/MarketSurveySimulator'));
const GoogleKeywordStrategy = React.lazy(() => import('./components/GoogleKeywordStrategy'));

// Loading skeleton fallback for premium smooth layout
function LoadingFallback() {
  return (
    <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-900 shadow-xl space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-900 rounded-xl"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-900 rounded w-1/4"></div>
          <div className="h-3 bg-slate-900 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3 pt-4 border-t border-slate-900">
        <div className="h-3 bg-slate-900 rounded w-full"></div>
        <div className="h-3 bg-slate-900 rounded w-5/6"></div>
        <div className="h-3 bg-slate-900 rounded w-4/5"></div>
      </div>
      <div className="h-40 bg-slate-900/50 rounded-xl"></div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

function AppContent() {
  type TabType = 'dashboard' | 'advisory' | 'market_survey' | 'founder' | 'roadmap' | 'datascience' | 'prompts' | 'assistant' | 'custom_data' | 'architecture' | 'game_ml' | 'guerrilla' | 'accounting_vn' | 'ml_applied' | 'deploy_business' | 'seo_strategy';
  
  const navigate = useNavigate();
  const location = useLocation();
  const activeSegment = (location.pathname.replace(/^\//, '') as TabType) || 'dashboard';

  const setActiveSegment = (tab: TabType) => {
    navigate(`/${tab}`);
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Supabase & Offline WebAssembly state variables loaded from Zustand Store
  const {
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnonKey,
    setSupabaseAnonKey,
    supabaseTable,
    setSupabaseTable,
    userEmail,
    setUserEmail,
    isOfflineMode,
    setIsOfflineMode,
    supabaseSyncStatus,
    setSupabaseSyncStatus,
    supabaseMessage,
    setSupabaseMessage,
    supabaseLastSynced,
    setSupabaseLastSynced,
    toggleOfflineMode,
  } = useStore();

  const [supabasePassword, setSupabasePassword] = useState('');

  // WASM-SQLite Simulation Playground States
  const [sqlQueryInput, setSqlQueryInput] = useState('SELECT * FROM lf_db_transactions LIMIT 5;');
  const [sqlQueryResult, setSqlQueryResult] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [wasmLogs, setWasmLogs] = useState<string[]>([]);

  // Auto-load session email from Supabase Client when url & anonkey exist
  useEffect(() => {
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const client = getSupabaseClientInstance(supabaseUrl, supabaseAnonKey);
        if (client) {
          client.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user && session.user.email) {
              setUserEmail(session.user.email);
              localStorage.setItem('lf_user_email', session.user.email);
              pushWasmSqlLog(`[SUPABASE-AUTO] Khôi phục session user: ${session.user.email}`);
            }
          });
        }
      } catch (e) {
        console.warn("Failed auto session get:", e);
      }
    }
  }, [supabaseUrl, supabaseAnonKey]);

  // Periodically refresh WASM Execution Logs
  useEffect(() => {
    setWasmLogs(getWasmSqlLogs());
    const inst = setInterval(() => {
      setWasmLogs(getWasmSqlLogs());
    }, 1200);
    return () => clearInterval(inst);
  }, []);

  const handleUpdateSupabaseConfig = () => {
    saveSupabaseConfig({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      tableName: supabaseTable
    });
    localStorage.setItem('lf_user_email', userEmail);
    pushWasmSqlLog(`[CONFIG] Đã lưu thông số Supabase Cloud! URL: ${supabaseUrl || 'Chưa cấu hình'}`);
    alert('Đã cập nhật cấu hình Supabase thành công!');
  };

  const handleSupabaseSignUp = async () => {
    if (!supabaseUrl || !supabaseAnonKey || !userEmail || !supabasePassword) {
      alert('Vui lòng điền đầy đủ URL, Anon Key, Email và Mật khẩu để đăng ký tài khoản!');
      return;
    }
    setSupabaseSyncStatus('syncing');
    setSupabaseMessage('Đang đăng ký tài khoản trên Supabase Auth...');
    const result = await authenticateSupabaseUser({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      tableName: supabaseTable
    }, userEmail, supabasePassword, true);

    if (result.success) {
      setSupabaseSyncStatus('synced');
      setSupabaseMessage(result.message);
      alert('Đăng ký tài khoản mới thành công! Vui lòng xác thực tài khoản qua email gửi từ Supabase.');
    } else {
      setSupabaseSyncStatus('error');
      setSupabaseMessage(`Lỗi đăng ký: ${result.message}`);
    }
  };

  const handleSyncToSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      alert('Vui lòng cung cấp đầy đủ Supabase URL và Public Anon Key để đồng bộ đám mây!');
      return;
    }
    setSupabaseSyncStatus('syncing');
    setSupabaseMessage('Đang kết nối & xác thực tài khoản...');
    const res = await syncToSupabase({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      tableName: supabaseTable
    }, userEmail, supabasePassword);

    if (res.success) {
      setSupabaseSyncStatus('synced');
      setSupabaseLastSynced(new Date().toLocaleTimeString('vi-VN'));
      setSupabaseMessage('Đồng bộ dữ liệu của bạn lên Supabase (RLS Approved) thành công!');
    } else {
      setSupabaseSyncStatus('error');
      setSupabaseMessage(`Lỗi: ${res.message}`);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      alert('Vui lòng cung cấp đầy đủ Supabase URL và Public Anon Key để khôi phục!');
      return;
    }
    const yes = window.confirm('CẢNH BÁO: Thao tác này sẽ ghi đè LocalStorage hiện tại bằng dữ liệu từ Supabase. Bạn có chắc chắn không?');
    if (!yes) return;

    setSupabaseSyncStatus('syncing');
    setSupabaseMessage('Đang kéo dữ liệu từ tài khoản Supabase về...');
    const res = await pullFromSupabase({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      tableName: supabaseTable
    }, userEmail, supabasePassword);

    if (res.success) {
      if (res.found) {
        setSupabaseSyncStatus('synced');
        setSupabaseMessage(res.message);
        alert('🎉 Phục hồi dữ liệu và cập nhật Local Thừa hành thành công! Trang sẽ tải lại sau 1 giây.');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setSupabaseSyncStatus('idle');
        setSupabaseMessage('Không tìm thấy dòng dữ liệu nào liên kết với email này.');
        alert('Không tìm thấy dữ liệu sao lưu của email hoặc user này.');
      }
    } else {
      setSupabaseSyncStatus('error');
      setSupabaseMessage(`Lỗi: ${res.message}`);
    }
  };

  const handleToggleOfflineMode = () => {
    toggleOfflineMode();
    const nextVal = !isOfflineMode;
    pushWasmSqlLog(`[MODE] Đã chuyển đổi chế độ hoạt động: ${nextVal ? 'OFFLINE (Localhost SQLite WebAssembly)' : 'ONLINE (Multi-Cloud Core Sync)'}`);
  };

  const handleRunWasmSql = () => {
    try {
      const res = executeSimulatedWasmQuery(sqlQueryInput);
      setSqlQueryResult(res);
    } catch (err: any) {
      pushWasmSqlLog(`[WASM-SQL-ERROR] Lỗi thực thi dòng SQL: ${err.message || err}`);
    }
  };

  // Load database state from the Express server upon application boot
  useEffect(() => {
    async function initDB() {
      setSyncStatus('syncing');
      try {
        await loadDatabaseFromServer();
        setSyncStatus('synced');
        setLastSynced(new Date().toLocaleTimeString('vi-VN'));
      } catch (_) {
        setSyncStatus('error');
      }
    }
    initDB();
  }, []);

  // Automatically save current LocalStorage states to the server database on active tab changes
  useEffect(() => {
    const handleAutoSync = async () => {
      setSyncStatus('syncing');
      const success = await saveDatabaseToServer();
      if (success) {
        setSyncStatus('synced');
        setLastSynced(new Date().toLocaleTimeString('vi-VN'));
      } else {
        setSyncStatus('error');
      }
    };
    
    // Defer saving slightly to let LocalStorage write operations finish from previous user actions
    const timer = setTimeout(() => {
      handleAutoSync();
    }, 400);
    
    return () => clearTimeout(timer);
  }, [activeSegment]);

  const triggerManualSync = async () => {
    setSyncStatus('syncing');
    const success = await saveDatabaseToServer();
    if (success) {
      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString('vi-VN'));
    } else {
      setSyncStatus('error');
    }
  };

  // Handle Ctrl+K shortcut key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Build searchable indexes of the whole app ecosystems
  const searchIndex = [
    { title: '1. Tổng Quan (Command Center)', category: 'Phòng Chiến Lược', tab: 'dashboard' as TabType, desc: 'Bảng điều khiển trung tâm nghiên cứu chiến lược khởi nghiệp.' },
    { title: '2. Hội Đồng Cố Vấn Khởi Nghiệp (Appraisal Report)', category: 'Phòng Chiến Lược', tab: 'advisory' as TabType, desc: 'Báo cáo thẩm định toàn diện phản hồi động từ 4 cố vấn Tech Lead, CFO, Product PM và Growth Hacker.' },
    { title: '3.5. Chiến Lược SEO Từ Khóa (Google Search Focus)', category: 'Phòng Chiến Lược', tab: 'seo_strategy' as TabType, desc: 'Nghiên cứu từ khóa Google SEO, ánh xạ sản phẩm micro-SaaS tương thích, sinh landing page chuẩn SEO.' },
    { title: '3. Phòng Sản Phẩm Du Kích', category: 'Phân hệ phụ', tab: 'guerrilla' as TabType, desc: 'Setup kịch bản 0đ, sinh ý tưởng sản phẩm hóa dịch vụ dữ liệu cho thị trường Việt Nam.' },
    { title: '4. Cơ Hội Solo Founder & Tài Chính', category: 'Phân hệ phụ', tab: 'founder' as TabType, desc: 'Tính toán phân tích chi tiết tài chính, doanh thu MRR, chi phí hòa vốn cho Solo Founder.' },
    { title: '5. Phát Hành & Thương Mại Hóa', category: 'Phân hệ phụ', tab: 'deploy_business' as TabType, desc: 'Đăng ký kinh doanh, cổng thanh toán ngân hàng VietQR/Momo, DevOps pipeline.' },
    { title: '2. Tuần Tự A-Z Web Roadmap', category: 'Phân hệ phụ', tab: 'roadmap' as TabType, desc: 'Lộ trình phát triển hệ kế toán web toàn vẹn.' },
    { title: '3. Đa Ngành Data Science & FinLab', category: 'Phân hệ phụ', tab: 'datascience' as TabType, desc: 'Xây dựng đường truyền làm sạch dữ liệu tự động, audit toán học, Pandas.' },
    { title: '4. Bộ Kỹ Sư Prompt Chuyên Sâu', category: 'Phân hệ phụ', tab: 'prompts' as TabType, desc: 'Các câu lệnh mẫu thiết kế hạch toán chuyên môn kế toán Việt Nam.' },
    { title: '5. Trợ Lý AI Gemini Chatbot', category: 'Phân hệ phụ', tab: 'assistant' as TabType, desc: 'Chatbot đàm thoại, upload file sao kê ngân hàng PDF/CSV thực tế.' },
    { title: '6. Không Gian Dữ Liệu Tự Do', category: 'Phân hệ phụ', tab: 'custom_data' as TabType, desc: 'Trải nghiệm ghi chép sổ cái Nợ/Có, kiểm soát cân bằng kép.' },
    { title: '7. Sơ đồ AI & Quy trình thực hiện', category: 'Phân hệ phụ', tab: 'architecture' as TabType, desc: 'Bản vẽ hạ tầng Hybrid Offline-First (SQLite WASM) & Cloudflare Serverless 0đ.' },
    { title: '8. Game Mobile & ML Labs', category: 'Phân hệ phụ', tab: 'game_ml' as TabType, desc: 'Khu vực thử nghiệm máy học tài chính và Game mô phỏng kinh tế.' },
    { title: '9. Kế Toán Thực Chiến VN', category: 'Phân hệ phụ', tab: 'accounting_vn' as TabType, desc: 'Nghị định 123 hóa đơn điện tử, Thông tư 200 hạch toán, đối soát ngân hàng và Benford.' },
    { title: '10. Machine Learning Thực Tế', category: 'Phân hệ phụ', tab: 'ml_applied' as TabType, desc: 'Ứng dụng AI API, tự train model nhỏ, dự báo chuỗi thời gian và AI trong Game.' },
    // Business ideas
    ...BUSINESS_IDEAS.map(idea => ({
      title: idea.title,
      category: 'Ý Tưởng Du Kích',
      tab: 'guerrilla' as TabType,
      desc: `Mô hình: ${idea.priceModel}. Đối tượng khách hàng: ${idea.targetClient}`
    })),
    // SQL tables schemas
    ...SQL_SCHEMAS.map(schema => ({
      title: `Bảng ${schema.name}`,
      category: 'Lược Đồ SQL Database',
      tab: 'datascience' as TabType,
      desc: `${schema.description} (Dòng: ${schema.type})`
    })),
    // Engineered prompts index
    ...ENGINEERED_PROMPTS.map(p => ({
      title: p.vietnameseTitle,
      category: 'Prompt Kế toán',
      tab: 'prompts' as TabType,
      desc: `Vai trò: ${p.role}. Công cụ phù hợp: ${p.model}`
    }))
  ];

  // Filtering results
  const filteredResults = searchQuery.trim() === '' 
    ? [] 
    : searchIndex.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const stats = STATS;

  return (
    <div className="min-h-screen bg-[#03060c] font-sans antialiased text-slate-100 flex flex-col justify-between select-none">
      {/* GRID ACCENTS */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(139,92,246,0.06),transparent_60%)] bg-size-[48px_48px] before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] before:bg-[size:32px_32px]"></div>

      <div className="relative z-10">
        {/* HEADER BRANDING */}
        <header className="border-b border-slate-900 bg-[#060b13]/60 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 select-text">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="font-black text-white text-base tracking-wider font-mono">LF</span>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  LedgerFlow Studio
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-purple-400 border border-slate-800 rounded-full font-mono">REAL-TIME WORKBENCH v4_V26</span>
                </h1>
                <p className="text-slate-400 text-xs font-semibold">Hệ Thống Thực Chiến Kế Toán, Phân Tích Dữ Liệu Lớn & Sổ Sách Tùy Biến cho SME Việt Nam</p>
              </div>
            </div>

            {/* Platform status indicator with Search shortcut option */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 transition-all select-none cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-purple-400" />
                <span>Tìm kiếm</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-450 font-mono font-bold">
                  Ctrl+K
                </kbd>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. MÁY CHỦ SANDBOX BACKUP BUTTON */}
                <button
                  onClick={triggerManualSync}
                  disabled={syncStatus === "syncing"}
                  className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl text-[10.5px] font-semibold transition-all cursor-pointer select-none ${
                    syncStatus === "syncing"
                      ? "bg-purple-950/20 border-purple-800/50 text-purple-400"
                      : syncStatus === "error"
                      ? "bg-rose-950/30 border-rose-900/50 text-rose-450 hover:bg-rose-900/30"
                      : "bg-slate-950 hover:bg-slate-900 border-slate-900 hover:border-slate-800 text-slate-350"
                  }`}
                  title="Lưu dữ liệu hạch toán lên ổ cứng máy chủ Sandbox"
                >
                  {syncStatus === "syncing" ? (
                    <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
                  ) : syncStatus === "error" ? (
                    <CloudOff className="w-3 h-3 text-rose-500" />
                  ) : (
                    <Cloud className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>
                    {syncStatus === "syncing"
                      ? "Đang sao lưu server..."
                      : syncStatus === "error"
                      ? "Lỗi server"
                      : lastSynced
                      ? `Server ok (${lastSynced})`
                      : "Lưu Server"}
                  </span>
                </button>

                {/* 2. DUAL-ENGINE: OFFLINE LOCAL DB + SUPABASE CLOUD STATUS */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Local WASM Engine Selector */}
                  <button
                    onClick={handleToggleOfflineMode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer select-none border border-slate-900 ${
                      isOfflineMode 
                        ? 'bg-amber-950/45 text-amber-400 border-amber-900/50'
                        : 'bg-slate-950 hover:bg-slate-900 text-slate-400'
                    }`}
                    title="Nhấn để chuyển đổi giữa Offline Localhost (WebAssembly SQLite) và Đám Mây API"
                  >
                    <Terminal className="w-3 h-3 text-amber-400" />
                    <span>{isOfflineMode ? 'SQLite WASM (Offline)' : 'SQLite WASM (Local)'}</span>
                  </button>

                  {/* Supabase Status Indicator */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-bold border ${
                    supabaseUrl && supabaseAnonKey
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-900 text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${supabaseUrl && supabaseAnonKey ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                    <span>{supabaseUrl && supabaseAnonKey ? 'Supabase Connected' : 'Supabase Cloud (Offline)'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* STATS OVERVIEW */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 select-text">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-slate-950/60 p-4.5 rounded-xl border border-slate-900">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{stat.label}</span>
                <p className={`text-xl font-black mt-1 mb-0.5 ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-slate-400 font-medium">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* INTERACTIVE STUDY DISCLAIMER & MAP */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-gradient-to-r from-purple-950/20 via-[#0a0f1d] to-indigo-950/25 border border-purple-900/40 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl"></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    🎓 LedgerFlow Studio: AI-powered Financial Workbench
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-black rounded font-mono">FINANCIAL WORKBENCH</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl font-semibold">
                    Hệ thống hạch toán đa chiều hỗ trợ các chủ doanh nghiệp SME tại Việt Nam - <strong>giải pháp chuyển đổi dữ liệu, dọn sạch sao kê và xuất báo cáo P&amp;L tự động trong 10 phút</strong>. Sử dụng công cụ hạch toán kép Sandbox hoặc gọi trợ lý ảo AI để phân loại tức thì.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DUAL ENGINE METRICS: SUPABASE CLOUD + LOCALHOST SQLITE WEBASSEMBLY */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-[#0b1320] border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-purple-500/5 blur-3xl"></div>
            
            <div className="grid lg:grid-cols-12 gap-8">
              {/* LEFT ENG: SQLITE WEBASSEMBLY TERMINAL RUNTIME */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-450 animate-pulse"></span>
                      <h3 className="text-xs font-black text-amber-400 tracking-widest uppercase font-mono">
                        SQLite WebAssembly Engine (Localhost & Standalone Offline)
                      </h3>
                    </div>
                    <h2 className="text-sm font-black text-white tracking-tight">
                      Điện Toán Biên Sổ Sách - Tối Ưu Cho Local Trình Duyệt / Github Pages
                    </h2>
                  </div>
                  <button 
                    onClick={() => {
                      setSqlQueryInput('SELECT * FROM lf_db_transactions WHERE amount > 500000 LIMIT 5;');
                      pushWasmSqlLog('[WASM] Đã nạp truy vấn tiền tệ lớn dập mẫu!');
                    }}
                    className="text-[10px] bg-slate-900 hover:bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 font-mono font-bold transition-all cursor-pointer"
                  >
                    Mẫu SQL
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sqlQueryInput}
                      onChange={(e) => setSqlQueryInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                      placeholder="Nhập câu lệnh SQL truy vấn sổ sách..."
                    />
                    <button
                      onClick={handleRunWasmSql}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      CHẠY WASM
                    </button>
                  </div>

                  {/* Output Table */}
                  {sqlQueryResult ? (
                    <div className="bg-slate-950/85 border border-slate-900 rounded-xl p-3.5 max-h-[170px] overflow-auto">
                      <span className="text-[9px] text-amber-500 font-bold uppercase font-mono block mb-1.5 border-b border-slate-900 pb-1">RESULT SET (SQLite v3.42.0 WebAssembly)</span>
                      <table className="w-full text-left font-mono text-[10px] text-slate-300">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-900">
                            {sqlQueryResult.columns.map((col, i) => (
                              <th key={i} className="pb-1 text-amber-450">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlQueryResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-900/40 hover:bg-slate-900/30">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-1 max-w-[120px] truncate">{String(cell)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-slate-950/45 border border-slate-900 rounded-xl p-3 text-center text-[11px] text-slate-500 font-medium italic">
                      Chưa có truy vấn nào được kích hoạt. Hãy chạy SQL mẫu để xem tốc độ WebAssembly biên độ cao.
                    </div>
                  )}

                  {/* Logs terminal */}
                  <div className="bg-black/85 rounded-xl border border-slate-900 p-3 h-[100px] overflow-auto shadow-inner">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-black tracking-widest text-[#50fa7b] font-mono">SQLITE WASM LIVE TERMINAL</span>
                      <button 
                        onClick={() => {
                          pushWasmSqlLog('[WASM] Dọn sạch nhật ký giao dịch local.');
                        }}
                        className="text-[9px] text-slate-500 hover:text-rose-400 font-mono"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="font-mono text-[9.5px] text-slate-400 leading-relaxed space-y-1">
                      {wasmLogs.map((log, index) => (
                        <div key={index} className="truncate">
                          {log.startsWith('[WASM-LỖI]') || log.includes('ERROR') ? (
                            <span className="text-rose-500 font-bold">{log}</span>
                          ) : log.includes('SUCCESS') || log.includes('SUPABASE') ? (
                            <span className="text-emerald-400 font-bold">{log}</span>
                          ) : (
                            <span>{log}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT ENG: SUPABASE CLOUD BACKEND INTERFACES */}
              <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-6 lg:pt-0 lg:pl-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 className="text-xs font-black text-emerald-400 tracking-widest uppercase font-mono">
                      Supabase Cloud Sync Serverless
                    </h3>
                  </div>
                  <h2 className="text-sm font-black text-white tracking-tight">
                    Cầu Tích Hợp Đám Mây Sổ Sách Hai Chiều
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1">SUPABASE URL</label>
                      <input
                        type="text"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10.5px] font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                        placeholder="https://xxx.supabase.co"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1">ANON API KEY</label>
                      <input
                        type="password"
                        value={supabaseAnonKey}
                        onChange={(e) => setSupabaseAnonKey(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10.5px] font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                        placeholder="eyJhbGciOi..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1">TABLE NAME</label>
                      <input
                        type="text"
                        value={supabaseTable}
                        onChange={(e) => setSupabaseTable(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10.5px] font-mono text-slate-200 focus:outline-none"
                        placeholder="ledgerflow_vault"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1">EMAIL ĐĂNG KÍ SỔ</label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10.5px] font-mono text-slate-200 focus:outline-none"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono font-bold block mb-1">MẬT KHẨU AUTH (DÙNG CHO RLS POLICY BẢO MẬT)</label>
                      <input
                        type="password"
                        value={supabasePassword}
                        onChange={(e) => setSupabasePassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10.5px] font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                        placeholder="Nhập mật khẩu Supabase Auth để xác thực"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleUpdateSupabaseConfig}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-[10.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Lưu Cấu Hình
                    </button>

                    <button
                      onClick={handleSupabaseSignUp}
                      className="px-3.5 py-2.5 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/80 text-purple-300 font-bold text-[10.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Đăng Ký Mới
                    </button>

                    <button
                      onClick={handleSyncToSupabase}
                      disabled={supabaseSyncStatus === 'syncing'}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {supabaseSyncStatus === 'syncing' ? 'Đang gửi...' : 'Đăng Nhập & Sync'}
                    </button>

                    <button
                      onClick={handlePullFromSupabase}
                      disabled={supabaseSyncStatus === 'syncing'}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-950/80 hover:bg-purple-900/60 border border-purple-800 text-purple-200 font-extrabold text-[10.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Kéo Phục Hồi
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-900/80 rounded-xl space-y-1 text-[9.5px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5 text-amber-500 font-extrabold uppercase">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Hướng dẫn bảo mật Row Level Security (RLS)</span>
                    </div>
                    <p className="leading-relaxed">
                      Chạy câu lệnh SQL sau trong bảng điều khiển Supabase SQL Editor để bật chính sách RLS, ngăn chặn hành vi đọc trộm dữ liệu chéo:
                    </p>
                    <pre className="p-1.5 bg-slate-950 border border-slate-900 rounded text-slate-350 overflow-x-auto text-[8.5px]">
{`ALTER TABLE ${supabaseTable || 'ledgerflow_vault'} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mỗi user chỉ đọc ghi hạch toán của riêng mình"
ON ${supabaseTable || 'ledgerflow_vault'}
FOR ALL USING (auth.uid() = user_id);`}
                    </pre>
                  </div>

                  {supabaseMessage && (
                    <div className={`py-1.5 px-3 rounded-lg border text-[10px] font-bold font-mono flex items-center gap-1.5 ${
                      supabaseSyncStatus === 'error'
                        ? 'bg-rose-950/20 border-rose-905 text-rose-400'
                        : supabaseSyncStatus === 'syncing'
                        ? 'bg-purple-950/20 border-purple-900/30 text-purple-450 animate-pulse'
                        : 'bg-emerald-950/25 border-emerald-900/40 text-emerald-400'
                    }`}>
                      <span>{supabaseSyncStatus === 'syncing' ? 'ℹ️' : supabaseSyncStatus === 'error' ? '❌' : '✓'}</span>
                      <span>{supabaseMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Offline Deployment & Setup guidance */}
            <div className="mt-5 pt-5 border-t border-slate-900/80 grid md:grid-cols-3 gap-4 text-[11px] text-slate-400 font-medium">
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900/50 space-y-1">
                <span className="text-amber-450 font-semibold block flex items-center gap-1">
                  💻 1. Tối Ưu Tải Standalone Offline (Localhost)
                </span>
                <p>Khởi động chế độ SQLite WASM để chạy hoàn toàn cô lập 100% không dựa vào server đám mây, lưu dữ liệu trực tiếp trong cookie biên.</p>
              </div>
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900/50 space-y-1">
                <span className="text-emerald-400 font-semibold block flex items-center gap-1">
                  🌐 2. Deploy GitHub Pages Sẵn Sàng
                </span>
                <p>Base path đã tối ưu tương đối (<code className="text-[10px] text-slate-300 bg-slate-900 px-1 rounded">base: './'</code>) giúp hiển thị hoàn hảo tệp asset nhị phân tĩnh khi chạy tĩnh.</p>
              </div>
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900/50 space-y-1">
                <span className="text-purple-400 font-semibold block flex items-center gap-1">
                  ⚡ 3. Schema Khuyên Dùng Cho Supabase
                </span>
                <p>Tạo table <code className="text-emerald-400 font-mono">ledgerflow_vault</code> trên Supabase: <code className="text-amber-400">email text primary key</code>, <code className="text-amber-400">state_data jsonb</code>, <code className="text-amber-400">updated_at timestamp</code>.</p>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE CATEGORIZED SELECT NAVIGATION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 block lg:hidden select-text">
          <div className="bg-[#050911]/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-900/60 shadow-xl">
            <label className="text-[9px] text-slate-550 font-extrabold uppercase tracking-wider block mb-2 text-left font-mono">
              ⚡ Chuyển Tác Vụ Nhanh (Danh mục lớn)
            </label>
            <select
              value={activeSegment}
              onChange={(e) => setActiveSegment(e.target.value as TabType)}
              className="w-full bg-slate-950 border border-slate-850 text-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-purple-500"
            >
              <optgroup label="📊 CHIẾN LƯỢC &amp; KHỞI SỰ" className="bg-slate-950 text-slate-300">
                <option value="dashboard">1. Tổng Quan (Command Center)</option>
                <option value="advisory">2. Hội Đồng Cố Vấn (Báo cáo Thẩm định)</option>
                <option value="market_survey">3. Khảo Sát Giả Lập &amp; Ý Tưởng (NEW)</option>
                <option value="seo_strategy">3.5. Chiến Lược SEO Từ Khóa (NEW)</option>
                <option value="guerrilla">4. Sản Phẩm Du Kích (VIP)</option>
                <option value="founder">5. Phân Tích Cơ Hội Solo Founder &amp; Tài Chính</option>
                <option value="deploy_business">6. Thương Mại Hóa (Phát Hành)</option>
              </optgroup>
              <optgroup label="💻 KỸ THUẬT &amp; AI STACK" className="bg-slate-955 text-slate-200">
                <option value="roadmap">6. Tuần Tự Web Roadmap</option>
                <option value="datascience">7. Đa Ngành Data &amp; FinLab</option>
                <option value="architecture">8. Sơ đồ AI &amp; Hạ Tầng 0đ</option>
                <option value="ml_applied">9. Machine Learning Thực Tế</option>
                <option value="game_ml">10. Game Mobile &amp; ML Labs</option>
              </optgroup>
              <optgroup label="📒 KẾ TOÁN &amp; THỰC NGHIỆM" className="bg-slate-955 text-slate-200">
                <option value="custom_data">11. Không Gian Dữ Liệu Tự Do</option>
                <option value="accounting_vn">12. Kế Toán Thực Chiến VN (VIP)</option>
                <option value="assistant">13. Trợ Lý AI Gemini Chatbot</option>
                <option value="prompts">14. Bộ Kỹ Sư Prompt Chuyên Sâu</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* CORE CONTAINER */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-4 gap-8">
          {/* NAVIGATION SIDEBAR */}
          <section className="hidden lg:block lg:col-span-1 space-y-4 select-text">
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-905 space-y-4">
              {/* CATEGORY 1: QUẢN TRỊ & CHIẾN LƯỢC */}
              <div className="space-y-1">
                <span className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider block px-2 mb-1.5 font-mono">
                  📊 Chiến Lược &amp; Khởi Sự
                </span>
                
                <button
                  onClick={() => setActiveSegment('dashboard')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'dashboard'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-205 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-purple-400" />
                    <span>1. Tổng Quan (Dashboard)</span>
                  </span>
                  <span className="bg-purple-500/15 text-purple-405 text-purple-400 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none">NEW</span>
                </button>

                <button
                  onClick={() => setActiveSegment('advisory')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'advisory'
                      ? 'bg-purple-650 border-purple-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-205 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span>2. Hội Đồng Cố Vấn</span>
                  </span>
                  <span className="bg-amber-500/15 text-amber-400 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase">5.9/10</span>
                </button>

                <button
                  onClick={() => setActiveSegment('market_survey')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'market_survey'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-205 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span>3. Nghiên Cứu &amp; Khảo Sát</span>
                  </span>
                  <span className="bg-purple-500/15 text-purple-450 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase">NEW</span>
                </button>

                <button
                  onClick={() => setActiveSegment('guerrilla')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'guerrilla'
                      ? 'bg-emerald-650 border-emerald-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-205 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>3. Sản Phẩm Du Kích</span>
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-400 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase">VIP</span>
                </button>

                <button
                  onClick={() => setActiveSegment('seo_strategy')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'seo_strategy'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-205 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span>3.5. Chiến Lược SEO Từ Khóa</span>
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-400 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase">SEO</span>
                </button>

                <button
                  onClick={() => setActiveSegment('founder')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'founder'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    <span>4. Phân Tích Cơ Hội</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveSegment('deploy_business')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'deploy_business'
                      ? 'bg-emerald-650 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-emerald-400" />
                    <span>5. Thương Mại Hóa</span>
                  </span>
                </button>
              </div>

              {/* CATEGORY 2: KỸ THUẬT & TRÍ TUỆ NHÂN TẠO */}
              <div className="space-y-1">
                <span className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider block px-2 mb-1.5 font-mono">
                  💻 Kỹ Thuật &amp; AI Stack
                </span>

                <button
                  onClick={() => setActiveSegment('roadmap')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'roadmap'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>6. Web Roadmap</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveSegment('datascience')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'datascience'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span>7. Data Sci &amp; FinLab</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveSegment('architecture')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'architecture'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-450" />
                    <span>8. Sơ đồ AI &amp; Hạ Tầng</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveSegment('ml_applied')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'ml_applied'
                      ? 'bg-[#009bba] bg-cyan-650 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>9. Machine Learning</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveSegment('game_ml')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'game_ml'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-sky-400" />
                    <span>10. Game Mobile Lab</span>
                  </span>
                </button>
              </div>

              {/* CATEGORY 3: KẾ TOÁN & THỰC NGHIỆM CHUYÊN SÂU */}
              <div className="space-y-1">
                <span className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider block px-2 mb-1.5 font-mono">
                  📒 Kế Toán &amp; Thực Nghiệm
                </span>

                <button
                  onClick={() => setActiveSegment('custom_data')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'custom_data'
                      ? 'bg-purple-600 border-purple-505 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>11. Sổ Cái Sandbox</span>
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-400 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase font-mono">Active</span>
                </button>

                <button
                  onClick={() => setActiveSegment('accounting_vn')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'accounting_vn'
                      ? 'bg-amber-650 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>12. Kế Toán Thực Chiến</span>
                  </span>
                  <span className="bg-amber-500/15 text-amber-400 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase">VIP</span>
                </button>

                <button
                  onClick={() => setActiveSegment('assistant')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'assistant'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>13. AI Trợ Lý Chatbot</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveSegment('prompts')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'prompts'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>14. Prompt Kế Toán</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Helpful quick guide box */}
            <div className="bg-slate-950/65 p-4 rounded-xl border border-slate-900 text-xs text-slate-400 space-y-2.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Compass className="w-4 h-4 shrink-0" />
                <span>Hướng dẫn học tập nhanh:</span>
              </div>
              <p className="text-[11px] leading-relaxed font-semibold">
                Sử dụng các thẻ bên trái để tuần tự học tập sâu. 
                <br /><br />
                Đặc biệt thẻ <strong className="text-purple-450">Sơ đồ AI & Quy trình</strong> giúp hình dung kết nối vận hành vẹn toàn của 1 Solo Founder!
              </p>
            </div>
          </section>

          {/* ACTIVE WORKSPACE AREA with React Suspense wrapping */}
          <section className="lg:col-span-3 space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              {activeSegment === 'dashboard' && <CommandCenter />}
              {activeSegment === 'advisory' && <AdvisoryBoardReport />}
              {activeSegment === 'market_survey' && <MarketSurveySimulator />}
              {activeSegment === 'guerrilla' && <GuerrillaProductHub />}
              {activeSegment === 'founder' && <SoloFounderBusiness />}
              {activeSegment === 'roadmap' && <WebAccountingRoadmap />}
              {activeSegment === 'datascience' && <DataScienceEngineering />}
              {activeSegment === 'prompts' && <PromptPlayground />}
              {activeSegment === 'assistant' && <GeminiPlayground />}
              {activeSegment === 'custom_data' && <CustomDataWorkbench />}
              {activeSegment === 'architecture' && <AIEcosystemArchitecture />}
              {activeSegment === 'game_ml' && <GameAndMLWorkbench />}
              {activeSegment === 'accounting_vn' && <AccountingVietnam />}
              {activeSegment === 'ml_applied' && <MLApplied />}
              {activeSegment === 'deploy_business' && <DeployBusiness />}
              {activeSegment === 'seo_strategy' && <GoogleKeywordStrategy />}
            </Suspense>
          </section>
        </main>
      </div>

      {/* GLOBAL COMMAND PALETTE (CTRL+K SEARCH) OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4 transition-all">
          <div className="bg-[#0b101b] border border-slate-800/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-850 flex items-center gap-3 bg-slate-950/50">
              <Search className="w-5 h-5 text-purple-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Nhập tên module, bảng SQL, prompt, ý tưởng...(Ctrl+K để bật/tắt)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-slate-100 placeholder-slate-500 flex-1 outline-none font-medium"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="overflow-y-auto flex-1 p-2">
              {searchQuery.trim() === '' ? (
                // Helpful instruction list
                <div className="p-8 text-center space-y-3">
                  <Command className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-400">Gõ từ khóa để tìm kiếm toàn diện</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Mã nguồn, Lược đồ quan hệ SQL, Nghiệp vụ thuế Việt Nam, hay Bộ Kỹ Sư Prompt và Phân hệ đều được index nhanh chóng để bạn nhảy trang tức thì!
                  </p>
                  <div className="flex gap-2 justify-center pt-2 flex-wrap">
                    {['sao kê', 'thuế', 'docker', 'diagram', 'payroll'].map(token => (
                      <button
                        key={token}
                        onClick={() => setSearchQuery(token)}
                        className="px-2 py-1 bg-slate-900 border border-slate-800 text-[10px] rounded text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      >
                        #{token}
                      </button>
                    ))}
                  </div>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-500">
                  Không tìm thấy kết quả nào trùng khớp cho "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    Kết quả tìm được ({filteredResults.length})
                  </div>
                  {filteredResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveSegment(result.tab);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-3 bg-slate-900/10 hover:bg-purple-600/15 border border-transparent hover:border-purple-600/20 rounded-xl flex justify-between items-start gap-4 transition-all"
                    >
                      <div className="space-y-1 overflow-hidden min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {result.category}
                          </span>
                          <span className="text-xs font-black text-white truncate block">{result.title}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium truncate block leading-tight">
                          {result.desc}
                        </span>
                      </div>
                      <span className="text-[9.5px] font-bold text-purple-400 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded shrink-0 self-center">
                        Nhảy trang &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Control status */}
            <div className="p-3 bg-slate-950 border-t border-slate-850 flex justify-between items-center text-[10px] text-slate-500 font-bold">
              <span>Mẹo: Sử dụng phím <kbd className="bg-slate-900 px-1 py-0.5 rounded text-slate-400">Esc</kbd> để đóng</span>
              <span>LedgerFlow Search Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© 2026 LedgerFlow Studio Việt Nam. Toàn bộ giải pháp, lộ trình A-Z và Star Schema quản trị thuộc bản quyền vẹn toàn.</p>
        </div>
      </footer>
    </div>
  );
}
