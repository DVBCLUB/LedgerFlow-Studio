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
} from 'lucide-react';
import { loadDatabaseFromServer, saveDatabaseToServer } from '../utils/dbSync';
import WorkspaceRenderer from './WorkspaceRenderer';
import { COMPANY_WORKSPACES, type TabType, type RoleType } from './companyNavigation';

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
      label: 'Command Center',
      shortLabel: 'Command',
      description: 'Việc hôm nay và cảnh báo chính',
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
    <div className={`erp-app ${collapsed ? 'erp-app--collapsed' : ''}`}>
      {sidebarOpen && <button className="erp-sidebar-backdrop" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}

      <aside className={`erp-sidebar ${sidebarOpen ? 'erp-sidebar--open' : ''}`}>
        <div className="erp-brand">
          <img src="/ledgerflow-icon.svg" alt="" className="erp-brand__logo" />
          {!collapsed && (
            <div className="min-w-0">
              <strong>LedgerFlow Hub</strong>
              <span>Solo local workspace</span>
            </div>
          )}
          <button className="erp-icon-button ml-auto lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu">
            <X size={18} />
          </button>
        </div>

        {!collapsed && (
          <label className="erp-sidebar-search">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm module" />
          </label>
        )}

        <nav className="erp-navigation" aria-label="Module chính">
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
          {!collapsed && <span className="erp-status"><i /> Local mode</span>}
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
          </div>
        </header>

        <main className="erp-content">
          <WorkspaceRenderer activeSegment={activeTab} activeRole={activeRole} onNavigate={navigate} />
        </main>
      </div>
    </div>
  );
}
