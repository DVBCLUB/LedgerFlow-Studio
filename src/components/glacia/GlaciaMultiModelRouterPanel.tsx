/**
 * GlaciaMultiModelRouterPanel.tsx
 * ============================================================
 * GLACIA MULTI-MODEL ROUTER PANEL - Smart Model Diagnostics UI
 * ------------------------------------------------------------
 * Displays route diagnostics, allows testing model routing,
 * and shows capability-based model selection details.
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, Cpu, RefreshCw, Activity, DollarSign, Clock,
  Zap, Send, Terminal, Shield,
} from 'lucide-react';
import {
  multiModelDiagnostics,
  multiModelRoute,
} from '../../utils/glaciaOrchestrationApi';

export default function GlaciaMultiModelRouterPanel() {
  const [diagnostics, setDiagnostics] = useState<Record<string, any> | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'test'>('diagnostics');

  const loadDiagnostics = useCallback(async () => {
    try {
      const data = await multiModelDiagnostics();
      setDiagnostics(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (activeTab === 'diagnostics') loadDiagnostics();
  }, [activeTab, loadDiagnostics]);

  const handleTestRoute = async () => {
    if (!testInput.trim()) return;
    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await multiModelRoute({
        messages: [{ role: 'user', content: testInput }],
        taskType: 'general',
        options: { temperature: 0.7, maxTokens: 1024 },
      });
      setTestResult(res);
    } catch (err: any) {
      setTestError(err.message || 'Routing failed');
    } finally {
      setTestLoading(false);
    }
  };

  const renderDiagnostics = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-purple-400" /> Route Diagnostics
        </h3>
        <button type="button" onClick={loadDiagnostics} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      {!diagnostics ? (
        <p className="text-[11px] text-slate-500 text-center py-8">Loading diagnostics...</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(diagnostics).map(([capability, config]: [string, any]) => (
            <div key={capability} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  {capability.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.minTier === 'tier_flagship' ? 'bg-amber-900/30 text-amber-400' : config.minTier === 'tier_balanced' ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                  {config.minTier.replace('tier_', '')}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                <span>Max Tokens: <span className="text-slate-300">{config.maxTokens}</span></span>
                <span>Temp: <span className="text-slate-300">{config.temperature}</span></span>
                <span>Fallback: <span className="text-slate-300">{config.fallbackProviders?.join(', ') || 'none'}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );


  const renderTest = () => (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Test Input</label>
        <textarea value={testInput} onChange={e => setTestInput(e.target.value)}
          placeholder="Enter a message to test routing (e.g. 'generate a game')" rows={4}
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none" />
      </div>
      <button type="button" onClick={handleTestRoute} disabled={testLoading || !testInput.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-black text-xs transition-all disabled:opacity-50">
        {testLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Routing...</> : <><Send className="w-4 h-4" /> Test Route</>}
      </button>
      {testError && (
        <div className="p-3 rounded-xl bg-red-900/20 border border-red-800/40">
          <p className="text-[11px] text-red-300">{testError}</p>
        </div>
      )}
      {testResult && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Result</span>
            <span className="text-[10px] text-slate-500">{testResult.capabilityUsed}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {testResult.modelUsed}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {(testResult.latencyMs / 1000).toFixed(2)}s</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${testResult.estimatedCostUsd?.toFixed(4) || '0'}</span>
            {testResult.isCached && <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Cached</span>}
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 max-h-48 overflow-y-auto">
            <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-mono">{testResult.content?.substring(0, 1500)}{testResult.content?.length > 1500 ? '...' : ''}</pre>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800/60">
        {[
          { key: 'diagnostics', label: 'Diagnostics', icon: Activity },
          { key: 'test', label: 'Test Route', icon: Terminal },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as 'diagnostics' | 'test')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex-1 justify-center ${activeTab === tab.key ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'diagnostics' && renderDiagnostics()}
      {activeTab === 'test' && renderTest()}
    </div>
  );
}

