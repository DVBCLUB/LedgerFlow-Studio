/**
 * GlaciaPluginMarketplacePanel.tsx
 * ============================================================
 * GLACIA PLUGIN MARKETPLACE (Priority 1 & 2)
 * ------------------------------------------------------------
 * Plugin Hot Reloader + Marketplace Catalog UI
 * - Hot Reload Controls (Start/Stop/Configure)
 * - Plugin Catalog Browser
 * - Install/Uninstall plugins
 * - Plugin reload buttons
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu, RefreshCw, Play, Square, Settings, Download, Trash2,
  RotateCcw, Package, Search, CheckCircle, XCircle,
  Loader2
} from 'lucide-react';
import {
  getHotReloadStatus,
  startHotReload,
  stopHotReload,
  configureHotReload,
  forceReloadPlugin,
  reloadAllPlugins,
  getPluginCatalog,
  installPlugin,
  uninstallPlugin,
} from '../../utils/glaciaOrchestrationApi';

export default function GlaciaPluginMarketplacePanel() {

  const [hrStatus, setHrStatus] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: string; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pollInterval, setPollInterval] = useState(5000);
  const [autoReload, setAutoReload] = useState(true);
  const [reloading, setReloading] = useState<string | null>(null);

  const showMsg = (type: string, text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [status, cat] = await Promise.all([
        getHotReloadStatus(),
        getPluginCatalog()
      ]);
      setHrStatus(status);
      setCatalog(cat);
      if (status?.config) {
        setPollInterval(status.config.pollIntervalMs || 5000);
        setAutoReload(status.config.autoReload ?? true);
      }
    } catch (err) {
      console.error('Failed to load plugin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStartHotReload = async () => {
    try { await startHotReload(); showMsg("success", "Hot Reload started"); await loadData(); }
    catch (err: any) { showMsg('error', err.message); }
  };

  const handleStopHotReload = async () => {
    try { await stopHotReload(); showMsg("success", "Hot Reload stopped"); await loadData(); }
    catch (err: any) { showMsg('error', err.message); }
  };

  const handleConfigure = async () => {
    try {
      await configureHotReload({ pollIntervalMs: pollInterval, autoReload });
      showMsg("success", "Hot Reload configured");
      await loadData();
    } catch (err: any) { showMsg('error', err.message); }
  };

  const handleReloadPlugin = async (pluginId: string) => {
    setReloading(pluginId);
    try {
      const result = await forceReloadPlugin(pluginId);
      if (result.success) showMsg("success", "Plugin " + pluginId + " reloaded");
      else showMsg('error', result.error || 'Reload failed');
    } catch (err: any) { showMsg('error', err.message); }
    finally { setReloading(null); }
  };

  const handleReloadAll = async () => {
    try {
      const result = await reloadAllPlugins();
      showMsg('success', 'Reloaded ' + result.success + ' plugins, ' + result.failed + ' failed');
    } catch (err: any) { showMsg('error', err.message); }
  };

  const handleInstall = async (item: any) => {
    try {
      await installPlugin(item.id, item.name, item.description, item.capabilities);
      showMsg('success', item.name + ' installed');
      await loadData();
    } catch (err: any) { showMsg('error', err.message); }
  };

  const handleUninstall = async (pluginId: string) => {
    try {
      const success = await uninstallPlugin(pluginId);
      if (success) { showMsg("success", "Plugin " + pluginId + " uninstalled"); await loadData(); }
      else { showMsg('error', 'Uninstall failed'); }
    } catch (err: any) { showMsg('error', err.message); }
  };

  const filteredCatalog = catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        <span className="ml-2 text-xs text-slate-400">Loading plugins...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {actionMsg && (
        <div className={"p-3 rounded-xl border text-xs font-bold " + (
          actionMsg.type === 'success'
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
        )}>
          {actionMsg.type === "success" ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
          {actionMsg.text}
        </div>
      )}

      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Plugin Hot Reloader
          </h3>
          <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (
            hrStatus?.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-400"
          )}>
            {hrStatus?.enabled ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] text-slate-400">Monitored</p>
            <p className="text-sm font-black text-white font-mono">{hrStatus?.monitoredPlugins || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] text-slate-400">Poll Interval</p>
            <p className="text-sm font-black text-white font-mono">{pollInterval}ms</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] text-slate-400">Auto Reload</p>
            <p className="text-sm font-black text-white font-mono">{autoReload ? "ON" : "OFF"}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] text-slate-400">Watch Dir</p>
            <p className="text-[9px] font-bold text-slate-300 truncate">{hrStatus?.config.watchDir || "plugins/"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!hrStatus?.enabled ? (
            <button type="button" onClick={handleStartHotReload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer">
              <Play className="w-3 h-3" /> Start Hot Reload
            </button>
          ) : (
            <button type="button" onClick={handleStopHotReload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition-all cursor-pointer">
              <Square className="w-3 h-3" /> Stop Hot Reload
            </button>
          )}
          <button type="button" onClick={handleReloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer">
            <RefreshCw className="w-3 h-3" /> Reload All
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1">
            <Settings className="w-3 h-3" /> Configuration
          </h4>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">Poll Interval (ms)</label>
              <input type="number" value={pollInterval} onChange={(e) => setPollInterval(Number(e.target.value))}
                className="w-24 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[9px] text-slate-500">Auto Reload</label>
              <input type="checkbox" checked={autoReload} onChange={(e) => setAutoReload(e.target.checked)}
                className="rounded bg-slate-800 border-slate-600 text-cyan-500" />
            </div>
            <button type="button" onClick={handleConfigure}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer">
              <Settings className="w-3 h-3" /> Apply
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-purple-400" /> Plugin Marketplace
            <span className="text-[10px] text-slate-500 font-normal">({filteredCatalog.length})</span>
          </h3>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search plugins..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 pl-7 pr-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-[11px] placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredCatalog.map((plugin) => (
            <div key={plugin.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-white">{plugin.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{plugin.description}</p>
                </div>
                <span className={"text-[9px] font-bold px-1.5 py-0.5 rounded-full " + (
                  plugin.loaded ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-400"
                )}>
                  {plugin.loaded ? "Loaded" : "Available"}
                </span>
              </div>

              {plugin.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {plugin.capabilities.map((cap: any) => (
                    <span key={cap} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{cap}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-1.5">
                {plugin.loaded ? (
                  <>
                    <button type="button" onClick={() => handleReloadPlugin(plugin.id)} disabled={reloading === plugin.id}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50">
                      {reloading === plugin.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                      Reload
                    </button>
                    <button type="button" onClick={() => handleUninstall(plugin.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[10px] font-bold transition-all cursor-pointer">
                      <Trash2 className="w-2.5 h-2.5" /> Uninstall
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => handleInstall(plugin)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all cursor-pointer">
                    <Download className="w-2.5 h-2.5" /> Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCatalog.length === 0 && (
          <div className="text-center py-6">
            <Package className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No plugins found</p>
          </div>
        )}
      </div>
    </div>
  );
}
