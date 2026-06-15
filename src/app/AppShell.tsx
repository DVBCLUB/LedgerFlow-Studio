import React, { Suspense, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  FileText,
  Layers,
  LayoutDashboard,
  Menu,
  Network,
  Package,
  Settings,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import {
  getLegacyRoute,
  getModule,
  getModuleByRoute,
  ModuleDefinition,
  ModuleGroup,
  moduleRegistry,
} from './moduleRegistry';

const groups: ModuleGroup[] = ['Operate', 'Build', 'Sell', 'Control', 'Extend'];

const iconMap = {
  'layout-dashboard': LayoutDashboard,
  package: Package,
  'trending-up': TrendingUp,
  users: Users,
  'book-open': BookOpen,
  briefcase: Briefcase,
  bot: Bot,
  'file-text': FileText,
  'bar-chart-3': BarChart3,
  network: Network,
  settings: Settings,
  layers: Layers,
};

function LoadingFallback() {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        <p className="text-sm font-medium text-slate-200">Đang tải workspace...</p>
        <p className="mt-1 text-xs text-slate-500">LedgerFlow Studio module shell</p>
      </div>
    </div>
  );
}

function ModuleIcon({ module }: { module: ModuleDefinition }) {
  const Icon = iconMap[module.icon as keyof typeof iconMap] ?? LayoutDashboard;
  return <Icon className="h-4 w-4" />;
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fallbackModule = getModule('command-center') ?? moduleRegistry[0];
  const activeModule = getModuleByRoute(location.pathname) ?? fallbackModule;
  const legacyRoute = getLegacyRoute(location.pathname);
  const ActiveComponent = legacyRoute?.component ?? activeModule.component;

  const groupedModules = useMemo(
    () =>
      groups
        .map((group) => ({
          group,
          modules: moduleRegistry.filter((module) => module.group === group),
        }))
        .filter((section) => section.modules.length > 0),
    [],
  );

  const handleNavigate = (module: ModuleDefinition) => {
    navigate(module.hashRoute);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-800 bg-slate-950/95 transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <button
                type="button"
                onClick={() => handleNavigate(fallbackModule)}
                className="text-left"
              >
                <div className="text-sm font-semibold tracking-wide text-cyan-300">LedgerFlow</div>
                <div className="text-xs text-slate-500">Company OS</div>
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-md border border-slate-800 p-2 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 lg:hidden"
                aria-label="Đóng menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {groupedModules.map((section) => (
                <div key={section.group} className="mb-5">
                  <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {section.group}
                  </div>
                  <div className="space-y-1">
                    {section.modules.map((module) => {
                      const selected = module.id === activeModule.id && !legacyRoute;
                      return (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => handleNavigate(module)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
                            selected
                              ? 'border border-cyan-400/50 bg-cyan-400/10 text-cyan-100'
                              : 'border border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-md ${
                              selected ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            <ModuleIcon module={module} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{module.labelVi}</span>
                            <span className="block truncate text-xs text-slate-500">{module.label}</span>
                          </span>
                          {module.badge ? (
                            <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                              {module.badge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu nền"
          />
        ) : null}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-md border border-slate-800 p-2 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 lg:hidden"
                aria-label="Mở menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-semibold text-slate-100">
                    {legacyRoute?.label ?? activeModule.labelVi}
                  </h1>
                  {legacyRoute ? (
                    <span className="rounded border border-slate-700 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Legacy route
                    </span>
                  ) : (
                    <span className="rounded border border-cyan-400/30 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-cyan-300">
                      {activeModule.status}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {legacyRoute ? 'Route cũ được giữ để không mất màn hình hiện có.' : activeModule.tags?.join(' / ')}
                </p>
              </div>
            </div>
          </header>

          <section className="px-4 py-5 lg:px-6">
            <Suspense fallback={<LoadingFallback />}>
              <ActiveComponent />
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
}
