import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Database,
  FileCheck2,
  FolderKanban,
  LogOut,
  Menu,
  Network,
  PackageOpen,
  Search,
  Settings,
  UsersRound,
  X,
} from 'lucide-react';
import { useLocalAuth } from '../context/LocalAuthContext';
import { loadDatabaseFromServer, saveDatabaseToServer } from '../utils/dbSync';
import WorkspaceRenderer from './WorkspaceRenderer';
import { COMPANY_WORKSPACES, type TabType, type RoleType, MODULES, isDepartmentVisible } from './companyNavigation';

interface NavigationItem {
  tab: TabType;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Building2;
}

const IconMap: Record<string, typeof Building2> = {
  Building2,
  Database,
  PackageOpen,
  BarChart3,
  UsersRound,
  CircleDollarSign,
  FolderKanban,
  FileCheck2,
  Bot,
  Boxes,
  Network,
  Settings,
};

const REDIRECT_MAP: Record<string, { tab: TabType; subTab?: string }> = {
  dashboard: { tab: 'ceo_command', subTab: 'brief' },
  knowledge: { tab: 'ceo_command', subTab: 'library' },
  advisory: { tab: 'finance_accounting', subTab: 'runway_advisory' },
  market_survey: { tab: 'growth_sales', subTab: 'market_research' },
  founder: { tab: 'product_studio', subTab: 'ideas_moat' },
  roadmap: { tab: 'product_studio', subTab: 'tasks_progress' },
  datascience: { tab: 'ai_staff_sandbox', subTab: 'python_sql_datascience' },
  prompts: { tab: 'ai_staff_sandbox', subTab: 'prompt_labs' },
  assistant: { tab: 'ai_staff_sandbox', subTab: 'staff_assistants' },
  ai_staff: { tab: 'ai_staff_sandbox', subTab: 'staff_assistants' },
  custom_data: { tab: 'finance_accounting', subTab: 'ledger_accounting' },
  architecture: { tab: 'ai_staff_sandbox', subTab: 'ai_game_studio' },
  game_ml: { tab: 'ai_staff_sandbox', subTab: 'ai_game_studio' },
  guerrilla: { tab: 'product_studio', subTab: 'dev_hub' },
  accounting_vn: { tab: 'finance_accounting', subTab: 'ledger_accounting' },
  ml_applied: { tab: 'ai_staff_sandbox', subTab: 'ai_game_studio' },
  deploy_business: { tab: 'product_studio', subTab: 'deploy' },
  seo_strategy: { tab: 'growth_sales', subTab: 'campaign_funnel' },
  audit_workspace: { tab: 'finance_accounting', subTab: 'coso' },
  python_sandbox: { tab: 'ai_staff_sandbox', subTab: 'python_sql_datascience' },
  marketing_suite: { tab: 'growth_sales', subTab: 'campaign_funnel' },
  funnel_lab: { tab: 'growth_sales', subTab: 'campaign_funnel' },
  lead_scoring: { tab: 'growth_sales', subTab: 'leads_outreach' },
  zalo_hub: { tab: 'growth_sales', subTab: 'content_zalo' },
  ltv_dashboard: { tab: 'growth_sales', subTab: 'ltv_nps' },
  pricing_lab: { tab: 'growth_sales', subTab: 'pricing_lab' },
  nps_manager: { tab: 'growth_sales', subTab: 'ltv_nps' },
  affiliate_hub: { tab: 'growth_sales', subTab: 'affiliate' },
  outbound_hub: { tab: 'growth_sales', subTab: 'leads_outreach' },
  advanced_ai: { tab: 'ai_staff_sandbox', subTab: 'prompt_labs' },
  video_lab: { tab: 'growth_sales', subTab: 'video_creator' },
  marketing_growth_v2: { tab: 'growth_sales', subTab: 'campaign_funnel' },
  approval_workflow: { tab: 'finance_accounting', subTab: 'approval' },
  financial_reports: { tab: 'finance_accounting', subTab: 'reports' },
  integration_hub: { tab: 'system_settings', subTab: 'connections' },
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
  const { session, logout } = useLocalAuth();
  const [activeTab, setActiveTab] = useState<TabType>(tabFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lf_erp_sidebar_collapsed') === '1');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const sync = () => setActiveTab(tabFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Load database state from Express server upon boot
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

  // Automatically save current LocalStorage state to server database on active tab changes
  useEffect(() => {
    const handleAutoSync = async () => {
      try {
        await saveDatabaseToServer();
      } catch (err) {
        console.error('Failed to save database to server:', err);
      }
    };

    const timer = setTimeout(() => {
      handleAutoSync();
    }, 400);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const [activeRole, setActiveRole] = useState<RoleType>(() => {
    const saved = localStorage.getItem('lf_active_role');
    return (saved as RoleType) || 'all';
  });

  const navigation = useMemo(() => {
    return COMPANY_WORKSPACES
      .filter((item) => {
        const mod = MODULES.find((m) => m.tab === item.tab);
        return mod ? isDepartmentVisible(mod.dept, activeRole) : true;
      })
      .map((item) => ({
        tab: item.tab,
        label: item.label,
        shortLabel: item.shortLabel,
        description: item.description,
        icon: IconMap[item.iconName] || Building2,
      }));
  }, [activeRole]);

  const current = useMemo(() => {
    return navigation.find((item) => item.tab === activeTab) ?? navigation[0] ?? {
      tab: 'ceo_command' as TabType,
      label: 'CEO Command Center',
      shortLabel: 'Điều hành',
      description: 'Chiến lược, standup và tri thức RAG',
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

  // Redirect if current activeTab gets filtered out by the activeRole
  useEffect(() => {
    if (navigation.length > 0) {
      const hasTab = navigation.some((item) => item.tab === activeTab);
      if (!hasTab) {
        navigate(navigation[0].tab);
      }
    }
  }, [activeRole, navigation, activeTab]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      localStorage.setItem('lf_erp_sidebar_collapsed', value ? '0' : '1');
      return !value;
    });
  };

  return (
    <div className={`erp-app ${collapsed ? 'erp-app--collapsed' : ''}`}>
      {sidebarOpen && <button className="erp-sidebar-backdrop" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}

      <aside className={`erp-sidebar ${sidebarOpen ? 'erp-sidebar--open' : ''}`}>
        <div className="erp-brand">
          <img src="/ledgerflow-icon.svg" alt="" className="erp-brand__logo" />
          {!collapsed && (
            <div className="min-w-0">
              <strong>LedgerFlow Hub</strong>
              <span>Company OS</span>
            </div>
          )}
          <button className="erp-icon-button ml-auto lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu">
            <X size={18} />
          </button>
        </div>

        {!collapsed && (
          <label className="erp-sidebar-search">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm phân hệ" />
          </label>
        )}

        <nav className="erp-navigation" aria-label="Phân hệ chính">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = item.tab === activeTab;
            return (
              <button
                key={item.tab}
                type="button"
                className={`erp-navigation__item ${active ? 'is-active' : ''}`}
                onClick={() => navigate(item.tab)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!collapsed && (
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="erp-sidebar__footer">
          <button className="erp-navigation__item" onClick={logout} title={collapsed ? 'Đăng xuất' : undefined}>
            <LogOut size={18} />
            {!collapsed && <span><strong>Đăng xuất</strong><small>{session?.email}</small></span>}
          </button>
          <button className="erp-collapse-button" onClick={toggleCollapsed} aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}>
            {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Thu gọn menu</span></>}
          </button>
        </div>
      </aside>

      <div className="erp-workspace">
        <header className="erp-topbar">
          <button className="erp-icon-button lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">
            <Menu size={19} />
          </button>
          <div className="min-w-0">
            <p>LedgerFlow / {current.shortLabel}</p>
            <h1>{current.label}</h1>
          </div>
          <div className="erp-topbar__actions">
            <span className="erp-status"><i /> Dữ liệu local</span>
            <div className="erp-role-selector">
              <select
                value={activeRole}
                onChange={(e) => {
                  const val = e.target.value as RoleType;
                  localStorage.setItem('lf_active_role', val);
                  setActiveRole(val);
                }}
                className="erp-role-select"
                aria-label="Chọn vai trò hiển thị"
              >
                <option value="all">Chế độ: Toàn bộ</option>
                <option value="ceo">Chế độ: Ban điều hành</option>
                <option value="dev">Chế độ: Kỹ thuật / R&D</option>
                <option value="marketing">Chế độ: Growth & Sales</option>
              </select>
            </div>
            <button className="erp-user-button" title={session?.email}>
              <BriefcaseBusiness size={16} />
              <span>{session?.email?.split('@')[0] || 'Founder'}</span>
            </button>
          </div>
        </header>

        <main className="erp-content">
          <WorkspaceRenderer activeSegment={activeTab} onNavigate={navigate} />
        </main>
      </div>
    </div>
  );
}
