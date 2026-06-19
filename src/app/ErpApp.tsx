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
import ERPCommandCenter from '../modules/command-center/ERPCommandCenter';
import WorkspaceRenderer from './WorkspaceRenderer';
import { COMPANY_WORKSPACES, type TabType } from './companyNavigation';

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

const navigation: NavigationItem[] = COMPANY_WORKSPACES.map((item) => ({
  tab: item.tab,
  label: item.label,
  shortLabel: item.shortLabel,
  description: item.description,
  icon: IconMap[item.iconName] || Building2,
}));

const knownTabs = new Set(navigation.map((item) => item.tab));

function tabFromHash(): TabType {
  const value = window.location.hash.replace(/^#\/?/, '').split('?')[0] as TabType;
  return knownTabs.has(value) ? value : 'dashboard';
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

  const current = navigation.find((item) => item.tab === activeTab) ?? navigation[0];
  const filteredNavigation = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    if (!normalized) return navigation;
    return navigation.filter((item) => `${item.label} ${item.description}`.toLocaleLowerCase('vi-VN').includes(normalized));
  }, [query]);

  const navigate = (tab: TabType) => {
    window.location.hash = `/${tab}`;
    setActiveTab(tab);
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
            <button className="erp-user-button" title={session?.email}>
              <BriefcaseBusiness size={16} />
              <span>{session?.email?.split('@')[0] || 'Founder'}</span>
            </button>
          </div>
        </header>

        <main className="erp-content">
          {activeTab === 'dashboard' ? <ERPCommandCenter onNavigate={navigate} /> : <WorkspaceRenderer activeSegment={activeTab} />}
        </main>
      </div>
    </div>
  );
}
