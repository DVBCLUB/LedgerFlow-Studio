/**
 * GlaciaAutoProgrammerPanel.tsx
 * ====================================================================
 * GLACIA AUTO-PROGRAMMER PANEL - Autonomous Code Generation UI
 * -------------------------------------------------------------------
 * Generates complete playable games, software blueprints, and
 * video production scripts using the Multi-Model AI Router.
 * ====================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, Gamepad2, Code2, Video, Wand2, Loader2, CheckCircle2,
  XCircle, Clock, Cpu, DollarSign, RefreshCw, Trash2, List,
  BarChart3, FileCode,
} from 'lucide-react';
import {
  autoProgramGenerate,
  autoProgramListSessions,
  autoProgramGetStats,
  autoProgramDeleteSession,
} from '../../utils/glaciaOrchestrationApi';

type ProjectType = 'game' | 'software' | 'video';

const PROJECT_TYPE_CONFIG = {
  game: { label: 'Game', icon: Gamepad2, color: '#14b8a6', placeholder: 'e.g. space_shooter' },
  software: { label: 'Software', icon: Code2, color: '#38bdf8', placeholder: 'e.g. saas_dashboard' },
  video: { label: 'Video', icon: Video, color: '#c084fc', placeholder: 'e.g. product_launch' },
};


export default function GlaciaAutoProgrammerPanel() {
  const [projectType, setProjectType] = useState<'game' | 'software' | 'video'>('game');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [appType, setAppType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('generate');

  const loadSessions = useCallback(async () => {
    try {
      const data = await autoProgramListSessions();
      setSessions(data || []);
    } catch { }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await autoProgramGetStats();
      setStats(data);
    } catch { }
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions') loadSessions();
    if (activeTab === 'stats') loadStats();
  }, [activeTab, loadSessions, loadStats]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await autoProgramGenerate({
        projectType,
        title: title || undefined,
        description: description || undefined,
        genre: genre || undefined,
        appType: appType || undefined,
        targetAudience: targetAudience || undefined,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await autoProgramDeleteSession(id);
      loadSessions();
    } catch { }
  };
  const renderGenerateForm = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Object.entries(PROJECT_TYPE_CONFIG).map(([key, cfg]) => (
          <button key={key} type="button" onClick={() => setProjectType(key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${projectType === key ? 'bg-slate-800 text-white border border-slate-600' : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-600'}`}
          ><cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />{cfg.label}</button>
        ))}
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder={`Enter ${projectType} title...`}
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe your project..." rows={3}
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
      </div>
      {projectType === 'game' && (
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Genre</label>
          <input type="text" value={genre} onChange={e => setGenre(e.target.value)}
            placeholder={PROJECT_TYPE_CONFIG.game.placeholder}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
        </div>
      )}
      {projectType === 'software' && (
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">App Type</label>
          <input type="text" value={appType} onChange={e => setAppType(e.target.value)}
            placeholder={PROJECT_TYPE_CONFIG.software.placeholder}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
        </div>
      )}
      {projectType === 'video' && (
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Target Audience</label>
          <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
            placeholder={PROJECT_TYPE_CONFIG.video.placeholder}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
        </div>
      )}
      <button type="button" onClick={handleGenerate} disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-black text-xs transition-all disabled:opacity-50">
        {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4" /> Generate {PROJECT_TYPE_CONFIG[projectType].label}</>}
      </button>
      {error && (
        <div className="p-3 rounded-xl bg-red-900/20 border border-red-800/40 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-300">{error}</p>
        </div>
      )}
      {result && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">{result.title}</span>
            </div>
            <span className="text-[10px] text-slate-500">{result.capabilityUsed}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {result.modelUsed}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {(result.latencyMs / 1000).toFixed(2)}s</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${result.estimatedCostUsd?.toFixed(4) || '0'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 max-h-60 overflow-y-auto">
            <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-mono">{result.content?.substring(0, 2000)}{result.content && result.content.length > 2000 ? '...' : ''}</pre>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <FileCode className="w-3 h-3" /><span>ID: {result.id}</span>
            <span className="ml-auto">{result.createdAt ? new Date(result.createdAt).toLocaleString() : ''}</span>
          </div>
        </div>
      )}
    </div>
  );


  const renderSessions = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <List className="w-3.5 h-3.5 text-teal-400" /> Sessions ({sessions.length})
        </h3>
        <button type="button" onClick={loadSessions} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-8">No sessions yet.</p>
      ) : (
        sessions.map((session: any) => (
          <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              {React.createElement((PROJECT_TYPE_CONFIG as any)[session.projectType]?.icon || Bot, {
                className: 'w-4 h-4',
                style: { color: (PROJECT_TYPE_CONFIG as any)[session.projectType]?.color || '#14b8a6' }
              })}
              <div>
                <p className="text-xs font-bold text-white">{session.name || session.id}</p>
                <p className="text-[10px] text-slate-500">{session.projectType} - {session.results?.length || 0} results</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${session.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' : session.status === 'failed' ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400'}`}>
                {session.status}
              </span>
              <button type="button" onClick={() => handleDeleteSession(session.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-teal-400" /> Statistics
        </h3>
        <button type="button" onClick={loadStats} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <p className="text-[10px] text-slate-400 font-medium mb-1">Total Sessions</p>
            <p className="text-2xl font-black text-white font-mono">{stats.totalSessions}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <p className="text-[10px] text-slate-400 font-medium mb-1">Project Types</p>
            <div className="space-y-1 mt-2">
              {Object.entries(stats.byType || {}).map(([type, count]: [string, any]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{type}</span>
                  <span className="text-xs font-bold text-white">{String(count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800/60">
        {[
          { key: 'generate', label: 'Generate', icon: Wand2 },
          { key: 'sessions', label: 'Sessions', icon: List },
          { key: 'stats', label: 'Stats', icon: BarChart3 },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex-1 justify-center ${activeTab === tab.key ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'generate' && renderGenerateForm()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'stats' && renderStats()}
    </div>
  );
}

