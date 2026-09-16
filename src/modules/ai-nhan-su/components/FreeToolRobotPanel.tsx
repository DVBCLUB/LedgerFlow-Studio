/**
 * FreeToolRobotPanel.tsx
 * ============================================================
 * Main panel for $0 Free Tool Robot Operator.
 * Provides access to Blender 3D, FFmpeg Video, and Graphic Design robots.
 * Includes persistent execution history loaded from backend API.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Box, Video, Image, Clock, CheckCircle2, XCircle, Trash2, Loader2, Download, FileCode, Database, FileSpreadsheet, Mail, FileText, GitBranch, Share2, TestTube, Beaker, Play, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import BlenderRobotControl from './BlenderRobotControl';
import FFmpegRobotControl from './FFmpegRobotControl';
import GraphicRobotControl from './GraphicRobotControl';
import { fetchExecutionHistory, clearExecutionHistoryApi, simulateRobotPlan, type ExecutionHistoryEntry, type SimulationResult } from '../../../utils/robotFreeToolApi';
import { useRobotHistoryWebSocket, type RobotHistoryUpdateMessage } from '../../../utils/useRobotHistoryWebSocket';

type RobotTab = 'blender' | 'ffmpeg' | 'graphic' | 'code' | 'data' | 'excel' | 'email' | 'pdf' | 'git' | 'social' | 'test';

interface TabConfig {
  id: RobotTab;
  label: string;
  icon: React.ReactNode;
  desc: string;
  category: 'media' | 'dev' | 'office';
}

const tabs: TabConfig[] = [
  // Media
  { id: 'blender', label: 'Blender 3D', icon: <Box className="h-4 w-4" />, desc: 'Tao nhan vat 3D, mo hinh, animation tu dong', category: 'media' },
  { id: 'ffmpeg', label: 'FFmpeg Video', icon: <Video className="h-4 w-4" />, desc: 'Ghep video, long tieng, chen phu de tu dong', category: 'media' },
  { id: 'graphic', label: 'Canva/Photopea', icon: <Image className="h-4 w-4" />, desc: 'Thiet ke banner, poster, UI graphics tu dong', category: 'media' },
  // Developer
  { id: 'code', label: 'Code Robot', icon: <FileCode className="h-4 w-4" />, desc: 'Tu dong generate, refactor, va optimize code', category: 'dev' },
  { id: 'data', label: 'Data Robot', icon: <Database className="h-4 w-4" />, desc: 'ETL, phan tich du lieu, generate bao cao', category: 'dev' },
  { id: 'git', label: 'Git Robot', icon: <GitBranch className="h-4 w-4" />, desc: 'Tu dong commit, merge, deploy qua Git', category: 'dev' },
  { id: 'test', label: 'Test Robot', icon: <TestTube className="h-4 w-4" />, desc: 'Chay unit test, integration test tu dong', category: 'dev' },
  // Office
  { id: 'excel', label: 'Excel Robot', icon: <FileSpreadsheet className="h-4 w-4" />, desc: 'Tu dong xu ly Excel, generate bang tinh', category: 'office' },
  { id: 'email', label: 'Email Robot', icon: <Mail className="h-4 w-4" />, desc: 'Tu dong gui email, campaign marketing', category: 'office' },
  { id: 'pdf', label: 'PDF Robot', icon: <FileText className="h-4 w-4" />, desc: 'Generate, merge, va xu ly PDF tu dong', category: 'office' },
  { id: 'social', label: 'Social Robot', icon: <Share2 className="h-4 w-4" />, desc: 'Tu dong dang bai, quan ly social media', category: 'office' },
];

export default function FreeToolRobotPanel() {
  const [activeTab, setActiveTab] = useState<RobotTab>('blender');
  const [history, setHistory] = useState<ExecutionHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket handler for real-time history updates
  const handleHistoryUpdate = useCallback((data: RobotHistoryUpdateMessage) => {
    setWsConnected(true);
    // Prepend new entry to history (newest first)
    setHistory(prev => {
      const updated = [data.entry as ExecutionHistoryEntry, ...prev];
      return updated.slice(0, 50); // Keep max 50
    });
  }, []);

  const { isConnected } = useRobotHistoryWebSocket({
    onHistoryUpdate: handleHistoryUpdate,
    enabled: true,
  });

  // Update wsConnected state from WebSocket connection status
  useEffect(() => {
    setWsConnected(isConnected);
  }, [isConnected]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const entries = await fetchExecutionHistory(50);
      if (entries) setHistory(entries);
    } catch { /* ignore */ }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
    // Fallback polling every 30s if WebSocket not connected
    const t = setInterval(() => {
      loadHistory();
    }, 30000);
    return () => clearInterval(t);
  }, [loadHistory]);

  const handleClearHistory = async () => {
    await clearExecutionHistoryApi();
    setHistory([]);
  };

  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async (entry: any) => {
    if (!entry) return;
    setSimulating(true);
    setSimulationResult(null);
    try {
      const plan = {
        id: entry.planSummary || entry.id || 'sim-plan',
        toolType: entry.toolType || 'blender',
        scriptContent: entry.scriptContent || '',
        scriptFile: entry.scriptFile || '',
        outputPath: entry.outputPath || '',
        estimatedDurationSec: 30,
      };
      const result = await simulateRobotPlan(plan as any);
      if (result) setSimulationResult(result);
    } catch { /* ignore */ }
    setSimulating(false);
  };

  const clearSimulation = () => {
    setSimulationResult(null);
    setSimulating(false);
  };

  const categoryOrder = ['media', 'dev', 'office'];
  const categoryLabels: Record<string, string> = { media: 'Media Production', dev: 'Developer Tools', office: 'Office Automation' };
  const groupedTabs = categoryOrder.map(cat => ({
    category: cat,
    label: categoryLabels[cat],
    tabs: tabs.filter(t => t.category === cat),
  })).filter(g => g.tabs.length > 0);

  const renderRobotPlaceholder = () => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab || ['blender', 'ffmpeg', 'graphic'].includes(tab.id)) return null;
    return (
      <div className="rounded-xl border border-indigo-800/20 bg-indigo-950/10 p-6 text-center">
        <div className="text-4xl mb-3 opacity-50">{tab.icon}</div>
        <h4 className="text-sm font-bold text-indigo-300 mb-1">{tab.label}</h4>
        <p className="text-[10px] text-text-tertiary mb-3">{tab.desc}</p>
        <p className="text-[9px] text-slate-500 italic">Robot này đang được phát triển. Sẽ sớm ra mắt!</p>
      </div>
    );
  };

  const renderSimulationPanel = () => {
    if (!simulationMode) return null;
    return (
      <div className="rounded-xl border border-amber-800/30 bg-amber-950/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-amber-300 uppercase flex items-center gap-1.5">
            <Beaker className="h-3.5 w-3.5" />
            Simulation Sandbox
          </span>
          <button
            onClick={() => { setSimulationMode(false); clearSimulation(); }}
            className="text-[9px] text-slate-500 hover:text-white"
          >
            Exit Sandbox
          </button>
        </div>
        {simulating && (
          <div className="text-center py-3 text-[10px] text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Simulating...
          </div>
        )}
        {simulationResult && (
          <div className="space-y-2">
            <div className="rounded-lg bg-slate-900/60 p-2">
              <div className="text-[9px] font-bold text-text-secondary mb-1">Output Preview</div>
              <pre className="text-[8px] text-slate-400 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                {simulationResult.outputPreview}
              </pre>
            </div>
            <div className="flex gap-2 text-[9px]">
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                Size: {simulationResult.estimatedFileSize}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                Duration: {simulationResult.estimatedDurationSec}s
              </span>
            </div>
            {simulationResult.warnings.length > 0 && (
              <div className="rounded-lg bg-rose-950/20 border border-rose-800/30 p-2">
                <div className="text-[9px] font-bold text-rose-300 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Warnings
                </div>
                <ul className="text-[8px] text-rose-400/80 space-y-0.5 list-disc list-inside">
                  {simulationResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-lg bg-emerald-950/20 border border-emerald-800/30 p-2">
              <div className="text-[9px] font-bold text-emerald-300 mb-1">Rollback Plan</div>
              <p className="text-[8px] text-emerald-400/80">{simulationResult.rollbackPlan}</p>
            </div>
          </div>
        )}
        {!simulating && !simulationResult && (
          <p className="text-[9px] text-slate-500 italic">
            Bật Simulation Mode và thực thi robot để xem output preview, warnings và rollback plan.
          </p>
        )}
      </div>
    );
  };

  const [historyFilter, setHistoryFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [historyPage, setHistoryPage] = useState(0);
  const HISTORY_PAGE_SIZE = 10;

  const filteredHistory = history.filter(e => {
    if (historyFilter === 'success') return e.success;
    if (historyFilter === 'failed') return !e.success;
    return true;
  });

  const paginatedHistory = filteredHistory.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE);
  const totalPages = Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ['id', 'toolType', 'summary', 'success', 'output', 'error', 'executedAt'];
    const rows = history.map(e =>
      headers.map(h => {
        const val = (e as any)[h] ?? '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot-execution-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (history.length === 0) return;
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot-execution-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-indigo-400" />
            Free Tool Robot Operator ($0)
          </h3>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            AI làm bộ não - Robot làm cánh tay. Tự động hóa với $0.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setSimulationMode(!simulationMode); if (!simulationMode) clearSimulation(); }}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${
              simulationMode
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                : 'border-border-primary bg-bg-primary text-text-secondary hover:border-amber-500'
            }`}
          >
            <Beaker className="h-3 w-3" />
            Sandbox
          </button>
          <button
            type="button"
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
            className="flex items-center gap-1.5 rounded-lg border border-border-primary bg-bg-primary px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:border-indigo-500 transition-colors cursor-pointer"
          >
            <Clock className="h-3 w-3 text-indigo-400" />
            History{history.length > 0 ? ` (${history.length})` : ''}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      {groupedTabs.map(group => (
        <div key={group.category}>
          <div className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5">{group.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {group.tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-[10px] text-slate-500 italic border-l-2 border-indigo-800/40 pl-3">
        {tabs.find(t => t.id === activeTab)?.desc}
      </p>

      {showHistory && (
        <div className="rounded-xl border border-indigo-800/30 bg-slate-950/60 p-3 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-indigo-400" />
              Execution History
              {wsConnected
                ? <span title="Real-time connected"><Wifi className="h-2.5 w-2.5 text-emerald-400" /></span>
                : <span title="Using polling fallback"><WifiOff className="h-2.5 w-2.5 text-slate-600" /></span>
              }
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={history.length === 0}
                className="flex items-center gap-1 text-[9px] text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Export as CSV"
              >
                <Download className="h-3 w-3" /> CSV
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                disabled={history.length === 0}
                className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Export as JSON"
              >
                <Download className="h-3 w-3" /> JSON
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-1 text-[9px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Clear All
              </button>
            </div>
          </div>

          {/* Filter & pagination */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              {(['all', 'success', 'failed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setHistoryFilter(f); setHistoryPage(0); }}
                  className={`text-[8px] px-1.5 py-0.5 rounded transition-colors ${
                    historyFilter === f
                      ? f === 'all' ? 'bg-indigo-800/30 text-indigo-300' : f === 'success' ? 'bg-emerald-800/30 text-emerald-300' : 'bg-rose-800/30 text-rose-300'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'success' ? 'Success' : 'Failed'}
                </button>
              ))}
            </div>
            <span className="text-[8px] text-slate-500">{filteredHistory.length} results</span>
          </div>

          {historyLoading && history.length === 0 && (
            <div className="text-center py-3 text-[10px] text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />Loading...
            </div>
          )}
          {!historyLoading && history.length === 0 && (
            <div className="text-center py-3 text-[10px] text-slate-600">Chua co lich su thuc thi. Hay chay robot de bat dau.</div>
          )}
          {paginatedHistory.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 py-1.5 border-b border-border-primary/40 last:border-0">
              <div className="mt-0.5 shrink-0">
                {entry.success
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  : <XCircle className="h-3.5 w-3.5 text-rose-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-secondary truncate">{entry.summary}</span>
                  <span className="text-[8px] text-slate-600 shrink-0 ml-2">
                    {entry.executedAt ? new Date(entry.executedAt).toLocaleTimeString() : ''}
                  </span>
                </div>
                {entry.error && <div className="text-[9px] text-rose-400/80 truncate mt-0.5">{entry.error}</div>}
                {entry.success && entry.output && (
                  <div className="text-[9px] text-text-tertiary truncate mt-0.5">{entry.output.slice(0, 100)}</div>
                )}
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <button
                onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                disabled={historyPage === 0}
                className="text-[8px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-[8px] text-slate-500">{historyPage + 1} / {totalPages}</span>
              <button
                onClick={() => setHistoryPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={historyPage >= totalPages - 1}
                className="text-[8px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {renderSimulationPanel()}

      <div className="animate-fade-in">
        {activeTab === 'blender' && <BlenderRobotControl onExecutionResult={simulationMode ? (entry) => handleSimulate(entry) : undefined} />}
        {activeTab === 'ffmpeg' && <FFmpegRobotControl onExecutionResult={simulationMode ? (entry) => handleSimulate(entry) : undefined} />}
        {activeTab === 'graphic' && <GraphicRobotControl onExecutionResult={simulationMode ? (entry) => handleSimulate(entry) : undefined} />}
        {renderRobotPlaceholder()}
      </div>
    </div>
  );
}
