import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  Menu,
  Mic,
  Moon,
  Rocket,
  Search,
  Settings,
  Sun,
  UsersRound,
  UserCircle,
  Smartphone,
  X,
} from 'lucide-react';
import { loadDatabaseFromServer, saveDatabaseToServer } from '../utils/dbSync';
import WorkspaceRenderer from './WorkspaceRenderer';
import { COMPANY_WORKSPACES, DEPARTMENTS, MODULES, type TabType, type RoleType } from './companyNavigation';
import { IconMap } from './iconRegistry';
import AgenticStatusBar from '../components/shared/AgenticStatusBar';
import { useTheme } from '../hooks/useTheme';
import { Suspense, lazy } from 'react';
import { LanguageProvider, useLanguage } from '../context';

export { IconMap };

const GlobalCommandSpotlight = lazy(() => import('../components/shared/GlobalCommandSpotlight'));
const NeuralNotificationCenter = lazy(() => import('../components/shared/NeuralNotificationCenter'));
const SoloFounderNavigation = lazy(() => import('../components/SoloFounderNavigation'));
const FastAICommandBar = lazy(() => import('../components/shared/FastAICommandBar'));
const UniversalCEOCommandPalette = lazy(() => import('../components/shared/UniversalCEOCommandPalette'));
const EnterpriseTelemetryStream = lazy(() => import('../components/shared/EnterpriseTelemetryStream'));
const OnboardingQuickTour = lazy(() => import('../components/shared/OnboardingQuickTour'));
const ApprovalToastSystem = lazy(() => import('../components/shared/ApprovalToastSystem'));
const MobileVibeDesktopBridgeDock = lazy(() => import('../components/shared/MobileVibeDesktopBridgeDock'));
const MobileVibeApp = lazy(() => import('../modules/mobile-vibe/MobileVibeApp'));


// Màu group cho sidebar departments
const DEPT_STYLES: Record<string, { label: string; color: string; bar: string; dot: string }> = {
  operate: { label: 'OPERATE', color: 'text-cyan-400', bar: '#06b6d4', dot: 'bg-cyan-400' },
  control: { label: 'CONTROL', color: 'text-emerald-400', bar: '#10b981', dot: 'bg-emerald-400' },
  tools:   { label: 'PLATFORM', color: 'text-violet-400', bar: '#8b5cf6', dot: 'bg-violet-400' },
};

const REDIRECT_MAP: Record<string, { tab: TabType; subTab?: string }> = {
  dashboard: { tab: 'ceo_command', subTab: 'overview' },
  operations: { tab: 'projects_delivery', subTab: 'portfolio' },
  knowledge: { tab: 'knowledge_library', subTab: 'library' },
  advisory: { tab: 'finance_accounting', subTab: 'reports' },
  market_survey: { tab: 'marketing_growth', subTab: 'campaigns' },
  founder: { tab: 'product_studio', subTab: 'portfolio' },
  roadmap: { tab: 'product_studio', subTab: 'portfolio' },
  datascience: { tab: 'analytics', subTab: 'data_engineering' },
  prompts: { tab: 'ai_factory', subTab: 'command' },
  assistant: { tab: 'ai_factory', subTab: 'command' },
  ai_staff: { tab: 'ai_factory', subTab: 'command' },
  custom_data: { tab: 'finance_accounting', subTab: 'ledger' },
  architecture: { tab: 'analytics', subTab: 'data' },
  game_ml: { tab: 'analytics', subTab: 'ai_sandbox' },
  guerrilla: { tab: 'product_studio', subTab: 'portfolio' },
  accounting_vn: { tab: 'finance_accounting', subTab: 'ledger' },
  ml_applied: { tab: 'analytics', subTab: 'data_engineering' },
  deploy_business: { tab: 'analytics', subTab: 'simulations' },
  seo_strategy: { tab: 'marketing_growth', subTab: 'content' },
  audit_workspace: { tab: 'documents_approval', subTab: 'audit' },
  python_sandbox: { tab: 'analytics', subTab: 'python_sandbox' },
  marketing_suite: { tab: 'marketing_growth', subTab: 'campaigns' },
  funnel_lab: { tab: 'marketing_growth', subTab: 'campaigns' },
  lead_scoring: { tab: 'sales_crm', subTab: 'pipeline' },
  zalo_hub: { tab: 'marketing_growth', subTab: 'content' },
  ltv_dashboard: { tab: 'sales_crm', subTab: 'pipeline' },
  pricing_lab: { tab: 'sales_crm', subTab: 'pipeline' },
  nps_manager: { tab: 'sales_crm', subTab: 'followup' },
  affiliate_hub: { tab: 'sales_crm', subTab: 'followup' },
  outbound_hub: { tab: 'sales_crm', subTab: 'pipeline' },
  advanced_ai: { tab: 'ai_factory', subTab: 'automation' },
  video_lab: { tab: 'marketing_growth', subTab: 'content' },
  marketing_growth_v2: { tab: 'marketing_growth', subTab: 'campaigns' },
  approval_workflow: { tab: 'documents_approval', subTab: 'approvals' },
  financial_reports: { tab: 'finance_accounting', subTab: 'reports' },
  integration_hub: { tab: 'system_settings', subTab: 'connectors' },
  devops_hub: { tab: 'system_settings', subTab: 'dev_ops' },
  control_room: { tab: 'system_settings', subTab: 'dev_ops' },
  growth_sales: { tab: 'marketing_growth', subTab: 'campaigns' },
  ai_staff_sandbox: { tab: 'ai_factory', subTab: 'command' },
};

const knownTabs = new Set<TabType>(COMPANY_WORKSPACES.map((item) => item.tab));

function tabFromHash(): TabType {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const value = raw.split('?')[0];

  if (REDIRECT_MAP[value]) {
    const redirect = REDIRECT_MAP[value];
    window.location.hash = `/${redirect.tab}${redirect.subTab ? `?subtab=${redirect.subTab}` : ''}`;
    return redirect.tab;
  }

  return knownTabs.has(value as TabType) ? (value as TabType) : 'ceo_command';
}

function ErpAppContent() {
  const { language, setLanguage, t } = useLanguage();
  const [isMobileVibeMode, setIsMobileVibeMode] = useState(() => {
    const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    return raw === 'mobile' || raw === 'vibe' || raw.startsWith('mobile') || raw.startsWith('vibe');
  });

  useEffect(() => {
    const checkHash = () => {
      const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      setIsMobileVibeMode(raw === 'mobile' || raw === 'vibe' || raw.startsWith('mobile') || raw.startsWith('vibe'));
    };
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const [activeRole, setActiveRole] = useState<RoleType>(() => {
    try {
      return (localStorage.getItem('lf_active_role') as RoleType) || 'founder';
    } catch {
      return 'founder';
    }
  });
  const [activeTab, setActiveTab] = useState<TabType>(tabFromHash);
  const [isSoloMode, setIsSoloMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lf_erp_sidebar_collapsed') === '1');
  const [query, setQuery] = useState('');
  // Track which department groups are expanded
  // 'tools' dept (Nền tảng) is collapsed by default — only agentops/devops need it open on load
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('lf_erp_collapsed_depts');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { tools: true }; // hide "Nền tảng" by default
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { theme, toggle: toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const sync = () => setActiveTab(tabFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    async function initDB() {
      try {
        await loadDatabaseFromServer();
      } catch (err) {
        console.error('Failed to load database from server:', err);
      }
    }
    initDB();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const runSave = async () => {
        try {
          await saveDatabaseToServer();
        } catch (err) {
          console.error('Failed to save database to server:', err);
        }
      };
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => void runSave(), { timeout: 2000 });
      } else {
        void runSave();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const navigation = useMemo(() => {
    return COMPANY_WORKSPACES.map((item) => ({
      tab: item.tab,
      label: item.label,
      shortLabel: item.shortLabel,
      description: item.description,
      dept: MODULES.find((m) => m.tab === item.tab)?.dept ?? 'tools',
      icon: IconMap[item.iconName] || Building2,
      badgeColor: MODULES.find((m) => m.tab === item.tab)?.badgeColor,
    }));
  }, []);

  // Group navigation by department
  const groupedNavigation = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    return DEPARTMENTS.map((dept) => {
      const items = navigation
        .filter((item) => item.dept === dept.key)
        .filter((item) => !normalized || `${item.label} ${item.description}`.toLocaleLowerCase('vi-VN').includes(normalized));
      return { dept, items };
    }).filter((group) => group.items.length > 0);
  }, [query, navigation]);

  const current = useMemo(() => {
    return navigation.find((item) => item.tab === activeTab) ?? navigation[0] ?? {
      tab: 'ceo_command' as TabType,
      label: 'Trung tâm Điều hành',
      shortLabel: 'Điều hành',
      description: 'Toàn cảnh hôm nay, việc cần quyết định, rủi ro và hiệu suất vận hành.',
      dept: 'operate',
      icon: Building2,
    };
  }, [navigation, activeTab]);

  // Dynamic page title — updates on workspace change
  useEffect(() => {
    document.title = `${current.label} — LedgerFlow Studio`;
    return () => { document.title = 'LedgerFlow Studio'; };
  }, [current.label]);

  const navigate = (tab: TabType, subTab?: string) => {
    let resolvedTab = tab;
    let resolvedSubTab = subTab;

    if (REDIRECT_MAP[tab as string]) {
      const redirect = REDIRECT_MAP[tab as string];
      resolvedTab = redirect.tab;
      resolvedSubTab = redirect.subTab;
    }

    window.location.hash = `/${resolvedTab}${resolvedSubTab ? `?subtab=${resolvedSubTab}` : ''}`;
    setActiveTab(resolvedTab);
    setSidebarOpen(false);
  };

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      localStorage.setItem('lf_erp_sidebar_collapsed', value ? '0' : '1');
      return !value;
    });
  };

  const toggleDept = (key: string) => {
    setCollapsedDepts((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('lf_erp_collapsed_depts', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-300 font-sans selection:bg-indigo-500/30 flex">
      <Suspense fallback={null}>
        <GlobalCommandSpotlight />
        <UniversalCEOCommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={navigate}
        />
      </Suspense>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════
           SIDEBAR
          ═══════════════════════════════════════════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 transition-all duration-300
          ${collapsed ? 'w-[68px]' : 'w-[260px]'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #0a0d14 0%, #09090b 100%)' }}
      >
        {/* ── Brand Area ── */}
        <div className={`flex items-center h-14 shrink-0 border-b border-white/5 px-3 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center gap-2.5 truncate">
            {/* LF Monogram Logo */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                boxShadow: '0 0 12px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              <span className="text-white font-black text-[13px] tracking-tight select-none">LF</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span
                  className="text-sm font-bold tracking-tight leading-none"
                  style={{
                    background: 'linear-gradient(90deg, #ffffff 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  LedgerFlow
                </span>
                <span className="text-[10px] text-slate-600 uppercase tracking-[0.18em] mt-0.5 font-medium">
                  OS Enterprise
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              className="lg:hidden text-slate-500 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Search Area ── */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm không gian..."
                className="w-full border border-white/5 focus:border-indigo-500/40 rounded-lg pl-9 pr-14 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
              <kbd
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded select-none pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#4b5563', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                ⌃K
              </kbd>
            </div>
          </div>
        )}

        {/* ── Navigation (grouped by dept) ── */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {groupedNavigation.map(({ dept, items }) => {
            const deptStyle = DEPT_STYLES[dept.key] ?? DEPT_STYLES.tools;
            const isDeptCollapsed = collapsedDepts[dept.key] ?? false;

            return (
              <div key={dept.key} className="mb-1">
                {/* Group Header */}
                {!collapsed && (
                  <button
                    onClick={() => toggleDept(dept.key)}
                    className="w-full flex items-center justify-between px-2 py-1 mb-0.5 group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-3 rounded-full opacity-70"
                        style={{ background: deptStyle.bar }}
                      />
                      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${deptStyle.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                        {deptStyle.label}
                      </span>
                    </div>
                    {isDeptCollapsed
                      ? <ChevronDown className={`w-3 h-3 ${deptStyle.color} opacity-50`} />
                      : <ChevronUp className={`w-3 h-3 ${deptStyle.color} opacity-50`} />
                    }
                  </button>
                )}

                {/* Nav Items */}
                {!isDeptCollapsed && (
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = item.tab === activeTab;

                      return (
                        <button
                          key={item.tab}
                          onClick={() => {
                            navigate(item.tab as TabType);
                            setSidebarOpen(false);
                          }}
                          title={collapsed ? item.label : undefined}
                          className={`relative w-full flex items-center gap-3 rounded-xl text-left transition-all group ${
                            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'
                          } ${
                            active
                              ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-white font-semibold border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          {/* Active indicator bar */}
                          {active && (
                            <div
                              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-500"
                              style={{ boxShadow: '0 0 8px rgba(99,102,241,0.8)' }}
                            />
                          )}

                          <Icon
                            className={`relative w-4 h-4 shrink-0 transition-colors ${
                              active
                                ? 'text-indigo-400'
                                : 'text-slate-600 group-hover:text-slate-300'
                            }`}
                          />
                          {!collapsed && (
                            <span className="relative text-xs font-medium truncate">{item.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════
           MAIN WORKSPACE
          ═══════════════════════════════════════════════════ */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        collapsed ? 'lg:pl-[68px]' : 'lg:pl-[260px]'
      }`}>

        {/* ── TOPBAR ── */}
        <header
          className="h-16 shrink-0 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-30"
          style={{ background: 'rgba(9,9,11,0.85)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden text-slate-500 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick search button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t('action.search', 'Tìm kiếm lệnh hoặc tài liệu...')}</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-500">
                ⌃K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Enterprise Telemetry Stream Ticker */}
            <Suspense fallback={null}>
              <EnterpriseTelemetryStream />
            </Suspense>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/90 border border-white/10 text-[10px] font-bold shadow-sm">
              <span className="text-slate-500 uppercase tracking-wider">🌐</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
                className="bg-transparent text-indigo-300 font-black outline-none cursor-pointer text-[11px]"
              >
                <option value="vi" className="bg-slate-950 text-slate-200">🇻🇳 Tiếng Việt</option>
                <option value="en" className="bg-slate-950 text-slate-200">🇬🇧 English</option>
              </select>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border text-slate-500 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
              title={isDark ? t('nav.theme.light') : t('nav.theme.dark')}
              aria-label="Toggle theme"
            >
              {isDark
                ? <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-12" />
                : <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
              }
            </button>
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-white/10 text-[10px] font-bold shadow-sm">
              <span className="text-slate-500 uppercase tracking-wider">{t('nav.role', 'Vai trò:')}</span>
              <select
                value={activeRole}
                onChange={(e) => {
                  const nextRole = e.target.value as RoleType;
                  setActiveRole(nextRole);
                  try { localStorage.setItem('lf_active_role', nextRole); } catch {}
                }}
                className="bg-transparent text-indigo-300 font-black outline-none cursor-pointer text-[11px]"
              >
                <option value="founder" className="bg-slate-950 text-slate-200">{t('nav.role.founder')}</option>
                <option value="admin" className="bg-slate-950 text-slate-200">{t('nav.role.admin')}</option>
                <option value="cfo" className="bg-slate-950 text-slate-200">{t('nav.role.cfo')}</option>
                <option value="devops" className="bg-slate-950 text-slate-200">{t('nav.role.devops')}</option>
                <option value="product_owner" className="bg-slate-950 text-slate-200">{t('nav.role.product_owner')}</option>
                <option value="all" className="bg-slate-950 text-slate-200">{t('nav.role.all')}</option>
              </select>
            </div>
            <AgenticStatusBar />
            <div className="flex items-center gap-2">
              <Suspense
                fallback={
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 animate-pulse" />
                }
              >
                <NeuralNotificationCenter />
              </Suspense>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                title={t('nav.voice', 'Giao tiếp Giọng nói với AI (Hold to speak)')}
                onClick={() => alert('Đang lắng nghe: "Agent Marketing, báo cáo chiến dịch hôm nay"...')}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  window.location.hash = isMobileVibeMode ? '/ceo_command' : '/mobile';
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                  isMobileVibeMode
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/60 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10'
                }`}
                title="Bật/Tắt chế độ MobileVibe Companion cho điện thoại"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isMobileVibeMode ? 'Bản Desktop' : 'Mobile Vibe'}</span>
              </button>
            </div>

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            <button
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
            >
              <UserCircle className="w-5 h-5" />
              <span className="text-xs font-medium hidden sm:block">Solopreneur</span>
            </button>
          </div>
        </header>

        {/* ── Solo Founder Mode Navigation Bar ── */}
        <Suspense fallback={<div className="h-10 bg-slate-900 border-b border-slate-800 animate-pulse" />}>
          <SoloFounderNavigation
            activeTab={activeTab}
            onSelectTab={(tab) => navigate(tab)}
            isSoloMode={isSoloMode}
            onToggleSoloMode={(enabled) => setIsSoloMode(enabled)}
          />
        </Suspense>

        {/* ── CONTENT ── */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          <div className="max-w-[1600px] w-full mx-auto">
            {isMobileVibeMode ? (
              <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải MobileVibe Companion...</div>}>
                <MobileVibeApp />
              </Suspense>
            ) : (
              <WorkspaceRenderer activeSegment={activeTab} activeRole={activeRole} onNavigate={navigate} />
            )}
          </div>
        </main>
      </div>

      <Suspense fallback={null}>
        <GlobalCommandSpotlight />
        <FastAICommandBar />
        <OnboardingQuickTour />
        <ApprovalToastSystem />
        <MobileVibeDesktopBridgeDock />
      </Suspense>
    </div>
  );
}

export default function ErpApp() {
  return (
    <LanguageProvider>
      <ErpAppContent />
    </LanguageProvider>
  );
}
