import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Database,
  FolderKanban,
  Menu,
  Rocket,
  Search,
  Settings,
  UsersRound,
  X,
  Command,
  UserCircle,
  Mic
} from 'lucide-react';
import { loadDatabaseFromServer, saveDatabaseToServer } from '../utils/dbSync';
import WorkspaceRenderer from './WorkspaceRenderer';
import { COMPANY_WORKSPACES, type TabType, type RoleType } from './companyNavigation';
import AgenticStatusBar from '../components/shared/AgenticStatusBar';
import GlobalCommandSpotlight from '../components/shared/GlobalCommandSpotlight';
import NeuralNotificationCenter from '../components/shared/NeuralNotificationCenter';

const IconMap: Record<string, typeof Building2> = {
  Building2,
  Database,
  BarChart3,
  UsersRound,
  CircleDollarSign,
  FolderKanban,
  Rocket,
  Bot,
  Settings,
};

const REDIRECT_MAP: Record<string, { tab: TabType; subTab?: string }> = {
  dashboard: { tab: 'ceo_command', subTab: 'overview' },
  knowledge: { tab: 'ceo_command', subTab: 'today' },
  advisory: { tab: 'finance_accounting', subTab: 'reports' },
  operations: { tab: 'product_studio', subTab: 'portfolio' },
  market_survey: { tab: 'marketing_growth', subTab: 'campaigns' },
  founder: { tab: 'product_studio', subTab: 'portfolio' },
  roadmap: { tab: 'product_studio', subTab: 'release' },
  datascience: { tab: 'analytics', subTab: 'data' },
  prompts: { tab: 'ai_factory', subTab: 'command' },
  assistant: { tab: 'ai_factory', subTab: 'command' },
  ai_staff: { tab: 'ai_factory', subTab: 'command' },
  custom_data: { tab: 'finance_accounting', subTab: 'ledger' },
  architecture: { tab: 'analytics', subTab: 'data' },
  game_ml: { tab: 'analytics', subTab: 'data' },
  guerrilla: { tab: 'product_studio', subTab: 'portfolio' },
  accounting_vn: { tab: 'finance_accounting', subTab: 'ledger' },
  ml_applied: { tab: 'analytics', subTab: 'data' },
  deploy_business: { tab: 'product_studio', subTab: 'release' },
  seo_strategy: { tab: 'marketing_growth', subTab: 'content' },
  audit_workspace: { tab: 'finance_accounting', subTab: 'approval' },
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
  approval_workflow: { tab: 'finance_accounting', subTab: 'approval' },
  financial_reports: { tab: 'finance_accounting', subTab: 'reports' },
  integration_hub: { tab: 'system_settings', subTab: 'integrations' },
  devops_hub: { tab: 'system_settings', subTab: 'devops' },
  control_room: { tab: 'system_settings', subTab: 'devops' },
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

export default function ErpApp() {
  const [activeTab, setActiveTab] = useState<TabType>(tabFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lf_erp_sidebar_collapsed') === '1');
  const [query, setQuery] = useState('');
  const activeRole: RoleType = 'all';

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
    const timer = setTimeout(async () => {
      try {
        await saveDatabaseToServer();
      } catch (err) {
        console.error('Failed to save database to server:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const navigation = useMemo(() => {
    return COMPANY_WORKSPACES.map((item) => ({
      tab: item.tab,
      label: item.label,
      shortLabel: item.shortLabel,
      description: item.description,
      icon: IconMap[item.iconName] || Building2,
    }));
  }, []);

  const current = useMemo(() => {
    return navigation.find((item) => item.tab === activeTab) ?? navigation[0] ?? {
      tab: 'ceo_command' as TabType,
      label: 'Trung tâm Điều hành',
      shortLabel: 'Điều hành',
      description: 'Toàn cảnh hôm nay, việc cần quyết định, rủi ro và hiệu suất vận hành.',
      icon: Building2,
    };
  }, [navigation, activeTab]);

  const filteredNavigation = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    if (!normalized) return navigation;
    return navigation.filter((item) => `${item.label} ${item.description}`.toLocaleLowerCase('vi-VN').includes(normalized));
  }, [query, navigation]);

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

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-300 font-sans selection:bg-indigo-500/30 flex">
      <GlobalCommandSpotlight />
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#09090b] border-r border-white/5 transition-all duration-300
          ${collapsed ? 'w-[68px]' : 'w-[260px]'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Area */}
        <div className={`flex items-center h-14 shrink-0 border-b border-white/5 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Command className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold text-white tracking-tight leading-none">LedgerFlow</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">OS Enterprise</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Area */}
        {!collapsed && (
          <div className="px-3 py-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Tìm không gian làm việc..." 
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-indigo-500/50 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 mt-2 scrollbar-thin scrollbar-thumb-white/10">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = item.tab === activeTab;
            return (
              <button
                key={item.tab}
                onClick={() => navigate(item.tab)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all group
                  ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!collapsed && (
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Area */}
        <div className="mt-auto border-t border-white/5 p-2">
          {!collapsed && (
            <div className="px-3 py-2 flex items-center gap-3 mb-2 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Local SQLite Sync</span>
            </div>
          )}
          <button 
            onClick={toggleCollapsed} 
            className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" /><span className="text-xs font-medium">Thu gọn menu</span></div>}
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-[260px]'}`}>
        
        {/* TOPBAR */}
        <header className="h-14 shrink-0 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            
            <nav className="flex items-center gap-2 text-xs font-medium">
              <span className="text-slate-500 hidden sm:inline-block">LedgerFlow OS</span>
              <span className="text-slate-600 hidden sm:inline-block">/</span>
              <span className="text-slate-400">{current.shortLabel}</span>
              <span className="text-slate-600">/</span>
              <span className="text-white">{current.label}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <AgenticStatusBar />
            <div className="flex items-center gap-2">
              <NeuralNotificationCenter />
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-inner" title="Giao tiếp Giọng nói với AI (Hold to speak)" onClick={() => alert('Đang lắng nghe: "Agent Marketing, báo cáo chiến dịch hôm nay"...')}>
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>
            <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <UserCircle className="w-5 h-5" />
              <span className="text-xs font-medium hidden sm:block">Solopreneur</span>
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            <WorkspaceRenderer activeSegment={activeTab} activeRole={activeRole} onNavigate={navigate} />
          </div>
        </main>

      </div>
    </div>
  );
}
