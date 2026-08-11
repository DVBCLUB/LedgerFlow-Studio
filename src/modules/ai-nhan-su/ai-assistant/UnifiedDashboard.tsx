import React, { useEffect, useState } from 'react';
import { BarChart3, Zap, Shield, BookOpen, Cpu, AlertTriangle, TrendingUp, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

const DAEMON = 'http://127.0.0.1:3001';

interface SystemOverview {
  generatedAt: string;
  cost: { total30d: number; dailyAvg: number; modelCount: number };
  memory: { totalRecords: number; shortTerm: number; longTerm: number };
  agents: { completed: number; failed: number; running: number };
  rpa: { scripts: number; executions: number; cronActive: number };
  watchers: { rules: number; active: number; totalEvents: number };
  workflows: { total: number; active: number };
  chains: { total: number };
  aiGateway: { totalRequests: number; successRate: string; avgLatency: string; circuitsOpen: number };
  decisions: { totalTraces: number; avgConfidence: number };
  sast: { avgScore: number; totalFindings: number };
  codeReview: { total: number; avgScore: number; approvedRate: number };
  deps: { avgHealth: number };
  configDrift: { avgScore: number };
  fineTuning: { totalPairs: number; goldPairs: number };
  plugins: { total: number; loaded: number; invocations: number };
  knowledgeBase: { totalArticles: number; totalViews: number };
  vectorStore: { namespaces: number; totalDocs: number };
  prompts: { totalTemplates: number; totalRuns: number; avgSuccessRate: number };
  content: { totalAssets: number; totalWords: number };
  snapshots: { total: number; totalSizeMB: number };
  notifications: { total: number; byChannel: Record<string, number> };
  jobQueue: { queued: number; running: number; completed: number; failed: number };
  eventStreams: { pipelineCount: number; totalEvents: number };
  apiTests: { totalSuites: number; totalTestCases: number };
  logs: { avgHealth: number };
  healthScore: number;
  automationScore: number;
  qualityScore: number;
  knowledgeScore: number;
  topRecommendations: string[];
}

function ScoreCard({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const color = score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'rose';
  return (
    <div className={`rounded-xl border border-${color}-800/40 bg-${color}-950/20 p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-text-secondary uppercase tracking-wider">{label}</span>
        <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-black text-${color}-300`}>{score}</span>
        <span className="text-[10px] text-text-tertiary mb-1">/100</span>
      </div>
      <div className={`mt-2 h-1.5 rounded-full bg-bg-surface overflow-hidden`}>
        <div className={`h-full rounded-full bg-${color}-500 transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color = 'slate' }: { label: string; value: string | number; icon?: any; color?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-bg-primary/30">
      {Icon && <Icon className={`h-3.5 w-3.5 text-${color}-400 shrink-0`} />}
      <span className="text-[10px] text-text-tertiary flex-1">{label}</span>
      <span className="text-[10px] font-bold text-text-secondary">{value}</span>
    </div>
  );
}

export default function UnifiedDashboard() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${DAEMON}/api/system/overview`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setOverview(data.overview);
        else setError('Failed to fetch overview');
      })
      .catch(() => setError('Cannot reach daemon'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-center text-[10px] text-text-tertiary">Loading system overview...</div>;
  if (error || !overview) return <div className="p-4 text-center text-[10px] text-rose-400">{error || 'No data'}</div>;

  return (
    <div className="p-4 space-y-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-cyan-400" /> Unified System Overview
        </h3>
        <span className="text-[8px] text-slate-600">{new Date(overview.generatedAt).toLocaleTimeString()}</span>
      </div>

      {/* 4 Score Cards */}
      <div className="grid grid-cols-4 gap-2">
        <ScoreCard label="Health" score={overview.healthScore} icon={Activity} />
        <ScoreCard label="Automation" score={overview.automationScore} icon={Zap} />
        <ScoreCard label="Quality" score={overview.qualityScore} icon={Shield} />
        <ScoreCard label="Knowledge" score={overview.knowledgeScore} icon={BookOpen} />
      </div>

      {/* Recommendations */}
      {(overview.topRecommendations?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/10 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300">Recommendations</span>
          </div>
          <div className="space-y-1">
            {overview.topRecommendations?.map((rec, i) => (
              <div key={i} className="text-[9px] text-text-secondary">{rec}</div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Core AI */}
        <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Cpu className="h-3 w-3" /> Core AI</div>
          <MiniStat label="AI Cost (30d)" value={`$${overview.cost?.total30d?.toFixed(4) || '0.0000'}`} icon={TrendingUp} />
          <MiniStat label="Agents" value={`${overview.agents?.completed || 0} OK / ${overview.agents?.failed || 0} FAIL / ${overview.agents?.running || 0} RUN`} icon={Activity} />
          <MiniStat label="Memory Records" value={overview.memory?.totalRecords || 0} icon={BookOpen} />
          <MiniStat label="AI Gateway Reqs" value={overview.aiGateway?.totalRequests || 0} icon={Zap} />
          <MiniStat label="Gateway Latency" value={overview.aiGateway?.avgLatency || '0ms'} icon={Clock} />
        </div>

        {/* Automation */}
        <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Zap className="h-3 w-3" /> Automation</div>
          <MiniStat label="RPA Scripts" value={overview.rpa?.scripts || 0} />
          <MiniStat label="File Watchers" value={`${overview.watchers?.active || 0}/${overview.watchers?.rules || 0} active`} />
          <MiniStat label="Workflows" value={`${overview.workflows?.active || 0}/${overview.workflows?.total || 0} active`} />
          <MiniStat label="Prompt Templates" value={overview.prompts?.totalTemplates || 0} />
          <MiniStat label="Notifications" value={overview.notifications?.total || 0} />
        </div>

        {/* Quality */}
        <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Quality</div>
          <MiniStat label="SAST Score" value={`${overview.sast?.avgScore || 0}/100`} />
          <MiniStat label="Code Review" value={`${overview.codeReview?.total || 0} reviews, ${overview.codeReview?.approvedRate || 0}% approved`} />
          <MiniStat label="Dep Health" value={`${overview.deps?.avgHealth || 0}/100`} />
          <MiniStat label="Config Drift" value={`${overview.configDrift?.avgScore || 0}/100`} />
          <MiniStat label="Decision Confidence" value={`${((overview.decisions?.avgConfidence || 0) * 100).toFixed(0)}%`} />
        </div>

        {/* Knowledge */}
        <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-1"><BookOpen className="h-3 w-3" /> Knowledge</div>
          <MiniStat label="KB Articles" value={`${overview.knowledgeBase?.totalArticles || 0} (${overview.knowledgeBase?.totalViews || 0} views)`} />
          <MiniStat label="Vector Docs" value={`${overview.vectorStore?.totalDocs || 0} in ${overview.vectorStore?.namespaces || 0} ns`} />
          <MiniStat label="Fine-Tuning Pairs" value={`${overview.fineTuning?.totalPairs || 0} (${overview.fineTuning?.goldPairs || 0} gold)`} />
          <MiniStat label="Plugins" value={`${overview.plugins?.loaded || 0}/${overview.plugins?.total || 0} loaded`} />
          <MiniStat label="Prompt Runs" value={overview.prompts?.totalRuns || 0} />
        </div>
      </div>

      {/* Operations row */}
      <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
        <div className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-2">Operations</div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center"><div className="text-sm font-bold text-emerald-400">{overview.jobQueue?.completed || 0}</div><div className="text-[8px] text-slate-600">Jobs Done</div></div>
          <div className="text-center"><div className="text-sm font-bold text-amber-400">{overview.jobQueue?.running || 0}</div><div className="text-[8px] text-slate-600">Jobs Running</div></div>
          <div className="text-center"><div className="text-sm font-bold text-rose-400">{overview.jobQueue?.failed || 0}</div><div className="text-[8px] text-slate-600">Jobs Failed</div></div>
          <div className="text-center"><div className="text-sm font-bold text-cyan-400">{overview.snapshots?.total || 0}</div><div className="text-[8px] text-slate-600">Snapshots</div></div>
        </div>
      </div>
    </div>
  );
}
