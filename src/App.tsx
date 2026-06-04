import React, { useState, useEffect, Suspense } from 'react';
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
  RefreshCw
} from 'lucide-react';

import { loadDatabaseFromServer, saveDatabaseToServer } from './utils/dbSync';
import { 
  signInWithGoogleDrive, 
  logoutGoogleDrive, 
  backupToGoogleDrive, 
  restoreFromGoogleDrive, 
  auth as gdriveAuth,
  setCachedAccessToken
} from './utils/gdriveSync';
import { onAuthStateChanged, User } from 'firebase/auth';

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
  type TabType = 'dashboard' | 'advisory' | 'founder' | 'roadmap' | 'datascience' | 'prompts' | 'assistant' | 'custom_data' | 'architecture' | 'game_ml' | 'guerrilla' | 'accounting_vn' | 'ml_applied' | 'deploy_business';
  const [activeSegment, setActiveSegment] = useState<TabType>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Google Drive Persisted Sync States
  const [gdriveUser, setGdriveUser] = useState<User | null>(null);
  const [gdriveToken, setGdriveToken] = useState<string | null>(null);
  const [gdriveSyncStatus, setGdriveSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [gdriveLastSynced, setGdriveLastSynced] = useState<string | null>(null);
  const [gdriveMessage, setGdriveMessage] = useState<string | null>(null);

  // Listen to Google Drive OAuth authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(gdriveAuth, (user) => {
      setGdriveUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Connect Google Drive and perform immediate initial sync
  const handleConnectGoogleDrive = async () => {
    setGdriveSyncStatus('syncing');
    setGdriveMessage('Đang khởi động kết nối Google Sign-In...');
    try {
      const res = await signInWithGoogleDrive();
      setGdriveUser(res.user);
      setGdriveToken(res.accessToken);
      setGdriveSyncStatus('synced');
      setGdriveMessage('Đã kết nối kho lưu trữ Google Drive thành công!');
      
      // Attempt to immediately sync / backup the current client work!
      try {
        setGdriveMessage('Đang tải dữ liệu ban đầu lên Google Drive...');
        const backupRes = await backupToGoogleDrive(res.accessToken);
        if (backupRes.success) {
          setGdriveLastSynced(backupRes.lastSynced);
          setGdriveMessage('Đã tự động khởi tạo bản sao lưu "ledgerflow_backup.json"!');
        }
      } catch (backupErr) {
        console.warn('Initial backup skipped:', backupErr);
      }
    } catch (err: any) {
      setGdriveSyncStatus('error');
      setGdriveMessage(`Lỗi liên kết Drive: ${err.message || err}`);
    }
  };

  // Push LocalStorage state to Google Drive backup
  const handleBackupToDrive = async () => {
    let tokenToUse = gdriveToken;
    if (!tokenToUse) {
      // Prompt user to connect first or try to re-authenticate
      try {
        const res = await signInWithGoogleDrive();
        setGdriveToken(res.accessToken);
        setGdriveUser(res.user);
        tokenToUse = res.accessToken;
      } catch (err: any) {
        setGdriveSyncStatus('error');
        setGdriveMessage(`Không có quyền truy cập: ${err.message || err}`);
        return;
      }
    }

    setGdriveSyncStatus('syncing');
    setGdriveMessage('Đang chuẩn bị payload & truyền dữ liệu lên Google Drive...');
    try {
      const res = await backupToGoogleDrive(tokenToUse);
      if (res.success) {
        setGdriveSyncStatus('synced');
        setGdriveLastSynced(res.lastSynced);
        setGdriveMessage('Đã truyền & ghi đè Google Drive thành công!');
      } else {
        setGdriveSyncStatus('error');
        setGdriveMessage('Không thể lưu file sao lưu lên Google Drive.');
      }
    } catch (err: any) {
      setGdriveSyncStatus('error');
      setGdriveMessage(`Lỗi truyền dữ liệu: ${err.message || err}`);
    }
  };

  // Restore LocalStorage states from the user's Google Drive backup file
  const handleRestoreFromDrive = async () => {
    const confirmRestore = window.confirm(
      '⚠️ CẢNH BÁO AN TOÀN: Thao tác nạp lại từ Google Drive sẽ GHI ĐÈ hoán đổi hoàn toàn dữ liệu trong trình duyệt của bạn bằng bản sao lưu mới nhất. Bạn có chắc chắn muốn tiến hành không?'
    );
    if (!confirmRestore) return;

    let tokenToUse = gdriveToken;
    if (!tokenToUse) {
      try {
        const res = await signInWithGoogleDrive();
        setGdriveToken(res.accessToken);
        setGdriveUser(res.user);
        tokenToUse = res.accessToken;
      } catch (err: any) {
        setGdriveSyncStatus('error');
        setGdriveMessage(`Lỗi khôi phục: ${err.message || err}`);
        return;
      }
    }

    setGdriveSyncStatus('syncing');
    setGdriveMessage('Đang nạp file "ledgerflow_backup.json" từ Drive của bạn...');
    try {
      const res = await restoreFromGoogleDrive(tokenToUse);
      if (res.success && res.found) {
        setGdriveSyncStatus('synced');
        setGdriveMessage(res.message);
        alert('🎉 Phục hồi hoàn tất! Trang web sẽ tải lại ngay bây giờ để đồng bộ trạng thái mới nhất.');
        window.location.reload();
      } else {
        setGdriveSyncStatus('error');
        setGdriveMessage(res.message);
      }
    } catch (err: any) {
      setGdriveSyncStatus('error');
      setGdriveMessage(`Thất bại: ${err.message || err}`);
    }
  };

  // Sign out and clear cached credentials
  const handleLogoutDrive = async () => {
    try {
      await logoutGoogleDrive();
      setGdriveUser(null);
      setGdriveToken(null);
      setGdriveSyncStatus('idle');
      setGdriveMessage('Đã ngắt hoàn toàn kết nối Google Drive.');
    } catch (err: any) {
      console.error(err);
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
    { title: '⚖️ Hội Đồng Cố Vấn Khởi Nghiệp (Appraisal Report)', category: 'Phòng Chiến Lược', tab: 'advisory' as TabType, desc: 'Báo cáo thẩm định toàn diện phản hồi động từ 4 cố vấn Tech Lead, CFO, Product PM và Growth Hacker.' },
    { title: '0. Phòng Sản Phẩm Du Kích', category: 'Phân hệ phụ', tab: 'guerrilla' as TabType, desc: 'Setup kịch bản 0đ, sinh ý tưởng sản phẩm hóa dịch vụ dữ liệu cho thị trường Việt Nam.' },
    { title: '1. Cơ Hội Solo Founder & Tài Chính', category: 'Phân hệ phụ', tab: 'founder' as TabType, desc: 'Tính toán phân tích chi tiết tài chính, doanh thu MRR, chi phí hòa vốn cho Solo Founder.' },
    { title: '2. Tuần Tự A-Z Web Roadmap', category: 'Phân hệ phụ', tab: 'roadmap' as TabType, desc: 'Lộ trình phát triển hệ kế toán web toàn vẹn.' },
    { title: '3. Đa Ngành Data Science & FinLab', category: 'Phân hệ phụ', tab: 'datascience' as TabType, desc: 'Xây dựng đường truyền làm sạch dữ liệu tự động, audit toán học, Pandas.' },
    { title: '4. Bộ Kỹ Sư Prompt Chuyên Sâu', category: 'Phân hệ phụ', tab: 'prompts' as TabType, desc: 'Các câu lệnh mẫu thiết kế hạch toán chuyên môn kế toán Việt Nam.' },
    { title: '5. Trợ Lý AI Gemini Chatbot', category: 'Phân hệ phụ', tab: 'assistant' as TabType, desc: 'Chatbot đàm thoại, upload file sao kê ngân hàng PDF/CSV thực tế.' },
    { title: '6. Không Gian Dữ Liệu Tự Do', category: 'Phân hệ phụ', tab: 'custom_data' as TabType, desc: 'Trải nghiệm ghi chép sổ cái Nợ/Có, kiểm soát cân bằng kép.' },
    { title: '7. Sơ đồ AI & Quy trình thực hiện', category: 'Phân hệ phụ', tab: 'architecture' as TabType, desc: 'Bản vẽ hạ tầng liên kết Google Drive, Apps Script, Telegram và GitHub 0đ.' },
    { title: '8. Game Mobile & ML Labs', category: 'Phân hệ phụ', tab: 'game_ml' as TabType, desc: 'Khu vực thử nghiệm máy học tài chính và Game mô phỏng kinh tế.' },
    { title: '9. Kế Toán Thực Chiến VN', category: 'Phân hệ phụ', tab: 'accounting_vn' as TabType, desc: 'Nghị định 123 hóa đơn điện tử, Thông tư 200 hạch toán, đối soát ngân hàng và Benford.' },
    { title: '10. Machine Learning Thực Tế', category: 'Phân hệ phụ', tab: 'ml_applied' as TabType, desc: 'Ứng dụng AI API, tự train model nhỏ, dự báo chuỗi thời gian và AI trong Game.' },
    { title: '12. Phát Hành & Thương Mại Hóa', category: 'Phân hệ phụ', tab: 'deploy_business' as TabType, desc: 'Đăng ký kinh doanh, cổng thanh toán ngân hàng VietQR/Momo, DevOps pipeline.' },
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

                {/* 2. GOOGLE DRIVE CLOUD SYNC WIDGET */}
                <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-900/85 rounded-xl p-1 shrink-0">
                  {!gdriveUser ? (
                    <button
                      onClick={handleConnectGoogleDrive}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-650 hover:from-purple-600 hover:to-indigo-500 text-white px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer select-none"
                      title="Kết nối và đồng bộ hai chiều tệp sao lưu dữ liệu lên Google Drive cá nhân của bạn (Email: davidbao1704@gmail.com)"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-400 animate-pulse fill-current" viewBox="0 0 24 24">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
                      </svg>
                      <span>Drive Backup</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] text-slate-200 font-mono font-bold max-w-[120px] truncate" title={gdriveUser.email || 'davidbao1704@gmail.com'}>
                        {gdriveUser.email || 'davidbao1704@gmail.com'}
                      </span>
                      
                      <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
                        <button
                          onClick={handleBackupToDrive}
                          disabled={gdriveSyncStatus === 'syncing'}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                          title="Tải lên sao lưu LocalStorage lên Google Drive (nhấp để đồng bộ ngay)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </button>
                        <button
                          onClick={handleRestoreFromDrive}
                          disabled={gdriveSyncStatus === 'syncing'}
                          className="p-1 text-slate-400 hover:text-purple-400 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                          title="Tải về & Ghi đè khôi phục dữ liệu từ Google Drive về trình duyệt"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={handleLogoutDrive}
                          className="px-1 text-[9px] text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded font-black font-mono transition-colors cursor-pointer uppercase"
                          title="Ngắt kết nối Google Drive"
                        >
                          Off
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-900 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Persistent DB Mode</span>
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
                    Hệ thống hạch toán đa chiều hỗ trợ các chủ doanh nghiệp SME tại Việt Nam - <strong>giải pháp chuyển đổi dữ liệu, dọn sạch sao kê và xuất báo cáo P&amp;L tự động trong 10 phút</strong>. Sử dụng công cụ hạch toán kép Sandbox hoặc gọi trợ lý AI để phân loại tức khắc!
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 w-full md:w-auto mt-1 md:mt-0 pb-1.5 md:pb-0">
                <button 
                  onClick={() => setActiveSegment('custom_data')}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[11px] rounded-xl transition-all shadow-md shadow-purple-500/10 uppercase tracking-widest text-center flex-1 md:flex-initial cursor-pointer"
                >
                  Trải Nghiệm Sandbox
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* GOOGLE DRIVE SYNC CONSOLE CARD */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-[#0b1320] border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl"></div>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 w-fit">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="text-xs font-black text-emerald-400 tracking-widest uppercase font-mono">
                    Cầu Đồng Bộ Đám Mây Google Drive | GitHub Pages Readiness
                  </h3>
                </div>
                <h2 className="text-base font-black text-white tracking-tight">
                  Tích hợp Kho Dữ Liệu Hai Chiều (Email: <span className="text-purple-400">davidbao1704@gmail.com</span>)
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Giải pháp điện toán biên 0đ tối ưu riêng cho <strong>davidbao1704@gmail.com</strong> khi deploy ứng dụng tĩnh (Static Site) lên <strong>GitHub Pages</strong>. 
                  Hệ thống sử dụng luồng Google OAuth trực tiếp từ trình duyệt để ghi/đọc tệp <code className="text-amber-400 font-mono text-[11px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-bold">ledgerflow_backup.json</code> trên đám mây bảo mật của riêng bạn, bỏ qua nhu cầu duy trì máy chủ MySQL/Postgres đắt đỏ.
                </p>
                {gdriveMessage && (
                  <div className={`mt-3 py-2 px-3 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-2 ${
                    gdriveSyncStatus === 'error'
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-450'
                      : gdriveSyncStatus === 'syncing'
                      ? 'bg-purple-950/20 border-purple-900/30 text-purple-400 animate-pulse'
                      : 'bg-emerald-950/25 border-emerald-900/40 text-emerald-400'
                  }`}>
                    {gdriveSyncStatus === 'syncing' ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                    ) : gdriveSyncStatus === 'error' ? (
                      <span className="inline-block text-rose-500">❌</span>
                    ) : (
                      <span className="inline-block text-emerald-400">✓</span>
                    )}
                    <span>{gdriveMessage}</span>
                  </div>
                )}
              </div>

              {/* Sync Actions Grid */}
              <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-2.5 w-full lg:w-auto shrink-0 select-none">
                {!gdriveUser ? (
                  <button
                    onClick={handleConnectGoogleDrive}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-650 to-teal-600 hover:from-emerald-650 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-white fill-current animate-pulse" viewBox="0 0 24 24">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
                    </svg>
                    <span>Liên Kết Google Drive</span>
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full">
                    {/* Backup to Drive */}
                    <button
                      onClick={handleBackupToDrive}
                      disabled={gdriveSyncStatus === 'syncing'}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 border border-slate-800 text-slate-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Gửi Sao Lưu</span>
                    </button>

                    {/* Pull/Restore from Drive */}
                    <button
                      onClick={handleRestoreFromDrive}
                      disabled={gdriveSyncStatus === 'syncing'}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-950/40 hover:bg-purple-900/30 border border-purple-800/40 hover:border-purple-700/50 text-purple-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-purple-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Khôi Phục Bản Đè</span>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogoutDrive}
                      className="px-4 py-3 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 rounded-xl text-rose-450 text-xs font-black font-mono transition-all cursor-pointer"
                    >
                      ĐĂNG XUẤT
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* GitHub Pages Readiness guidelines */}
            <div className="mt-5 pt-5 border-t border-slate-900/80 grid md:grid-cols-3 gap-4 text-[11px] text-slate-400 font-medium">
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900/50 space-y-1">
                <span className="text-purple-400 font-semibold block">1. Sẵn Sàng Cho GitHub Pages</span>
                <p>Base path đã được tinh chỉnh thành dạng tương đối (<code className="text-slate-300">base: \'./\'</code>) giúp tải mượt toàn bộ asset ảnh, CSS, JS khi đưa lên GitHub Pages.</p>
              </div>
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900/50 space-y-1">
                <span className="text-emerald-400 font-semibold block">2. Lưu Trữ Tự Động Định Kỳ</span>
                <p>Hệ thống tự động sao lưu LocalStorage sang Google Drive khi có biến động dữ liệu quan trọng, tránh rủi ro mất mát chứng từ kế toán do trình duyệt dọn cookie.</p>
              </div>
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900/50 space-y-1">
                <span className="text-amber-450 font-semibold block">3. Kiểm Soát Tài Khoản</span>
                <p>Khuyên dùng email <strong className="text-slate-200 font-mono font-bold">davidbao1704@gmail.com</strong> trong OAuth popup để đồng bộ chính xác không gian sổ sách.</p>
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
                <option value="dashboard">⭐ Tổng quan (Command Center)</option>
                <option value="advisory">⚖️ Hội Đồng Cố Vấn (Báo cáo Thẩm định)</option>
                <option value="guerrilla">0. Phòng Sản Phẩm Du Kích (VIP)</option>
                <option value="founder">1. Phân Tích Cơ Hội Solo Founder &amp; Tài Chính</option>
                <option value="deploy_business">12. Phát Hành &amp; Thương Mại</option>
              </optgroup>
              <optgroup label="💻 KỸ THUẬT &amp; AI STACK" className="bg-slate-955 text-slate-200">
                <option value="roadmap">2. Tuần Tự Web Roadmap</option>
                <option value="datascience">3. Đa Ngành Data &amp; FinLab</option>
                <option value="architecture">7. Sơ đồ AI &amp; Hạ Tầng 0đ</option>
                <option value="ml_applied">10. Machine Learning Thực Tế</option>
              </optgroup>
              <optgroup label="📒 KẾ TOÁN &amp; THỰC NGHIỆM" className="bg-slate-955 text-slate-200">
                <option value="custom_data">6. Không Gian Dữ Liệu Tự Do</option>
                <option value="accounting_vn">9. Kế Toán Thực Chiến VN (VIP)</option>
                <option value="assistant">5. Trợ Lý AI Gemini Chatbot</option>
                <option value="prompts">4. Bộ Kỹ Sư Prompt Chuyên Sâu</option>
                <option value="game_ml">8. Game Mobile &amp; ML Labs</option>
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
                    <span>Tổng Quan (Dashboard)</span>
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
                    <span>Hội Đồng Cố Vấn</span>
                  </span>
                  <span className="bg-amber-500/15 text-amber-400 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase">5.9/10</span>
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
                    <span>0. Sản Phẩm Du Kích</span>
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-400 text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase">VIP</span>
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
                    <span>1. Phân Tích Cơ Hội</span>
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
                    <span>12. Thương Mại Hóa</span>
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
                    <span>2. Web Roadmap</span>
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
                    <span>3. Data Sci &amp; FinLab</span>
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
                    <span>7. Sơ đồ AI &amp; Hạ Tầng</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveSegment('ml_applied')}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    activeSegment === 'ml_applied'
                      ? 'bg-cyan-650 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-202 bg-slate-900/10 border-transparent hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>10. Machine Learning</span>
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
                    <span>6. Sổ Cái Sandbox</span>
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
                    <span>9. Kế Toán Thực Chiến</span>
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
                    <span>5. AI Trợ Lý Chatbot</span>
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
                    <span>4. Prompt Kế Toán</span>
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
                    <span>8. Game Mobile Lab</span>
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
