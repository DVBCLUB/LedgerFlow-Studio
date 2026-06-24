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
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
        <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-black text-${color}-300`}>{score}</span>
        <span className="text-[10px] text-slate-500 mb-1">/100</span>
      </div>
      <div className={`mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden`}>
        <div className={`h-full rounded-full bg-${color}-500 transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color = 'slate' }: { label: string; value: string | number; icon?: any; color?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-900/30">
      {Icon && <Icon className={`h-3.5 w-3.5 text-${color}-400 shrink-0`} />}
      <span className="text-[10px] text-slate-500 flex-1">{label}</span>
      <span className="text-[10px] font-bold text-slate-300">{value}</span>
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

  if (loading) return <div className="p-4 text-center text-[10px] text-slate-500">Loading system overview...</div>;
  if (error || !overview) return <div className="p-4 text-center text-[10px] text-rose-400">{error || 'No data'}</div>;

  return (
    <div className="p-4 space-y-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
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
      {overview.topRecommendations.length > 0 && (
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/10 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300">Recommendations</span>
          </div>
          <div className="space-y-1">
            {overview.topRecommendations.map((rec, i) => (
              <div key={i} className="text-[9px] text-slate-400">{rec}</div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Core AI */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Cpu className="h-3 w-3" /> Core AI</div>
          <MiniStat label="AI Cost (30d)" value={`$${overview.cost.total30d.toFixed(4)}`} icon={TrendingUp} />
          <MiniStat label="Agents" value={`${overview.agents.completed} OK / ${overview.agents.failed} FAIL / ${overview.agents.running} RUN`} icon={Activity} />
          <MiniStat label="Memory Records" value={overview.memory.totalRecords} icon={BookOpen} />
          <MiniStat label="AI Gateway Reqs" value={overview.aiGateway.totalRequests} icon={Zap} />
          <MiniStat label="Gateway Latency" value={overview.aiGateway.avgLatency} icon={Clock} />
        </div>

        {/* Automation */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Zap className="h-3 w-3" /> Automation</div>
          <MiniStat label="RPA Scripts" value={overview.rpa.scripts} />
          <MiniStat label="File Watchers" value={`${overview.watchers.active}/${overview.watchers.rules} active`} />
          <MiniStat label="Workflows" value={`${overview.workflows.active}/${overview.workflows.total} active`} />
          <MiniStat label="Prompt Templates" value={overview.prompts.totalTemplates} />
          <MiniStat label="Notifications" value={overview.notifications.total} />
        </div>

        {/* Quality */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Quality</div>
          <MiniStat label="SAST Score" value={`${overview.sast.avgScore}/100`} />
          <MiniStat label="Code Review" value={`${overview.codeReview.total} reviews, ${overview.codeReview.approvedRate}% approved`} />
          <MiniStat label="Dep Health" value={`${overview.deps.avgHealth}/100`} />
          <MiniStat label="Config Drift" value={`${overview.configDrift.avgScore}/100`} />
          <MiniStat label="Decision Confidence" value={`${(overview.decisions.avgConfidence * 100).toFixed(0)}%`} />
        </div>

        {/* Knowledge */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-1"><BookOpen className="h-3 w-3" /> Knowledge</div>
          <MiniStat label="KB Articles" value={`${overview.knowledgeBase.totalArticles} (${overview.knowledgeBase.totalViews} views)`} />
          <MiniStat label="Vector Docs" value={`${overview.vectorStore.totalDocs} in ${overview.vectorStore.namespaces} ns`} />
          <MiniStat label="Fine-Tuning Pairs" value={`${overview.fineTuning.totalPairs} (${overview.fineTuning.goldPairs} gold)`} />
          <MiniStat label="Plugins" value={`${overview.plugins.loaded}/${overview.plugins.total} loaded`} />
          <MiniStat label="Prompt Runs" value={overview.prompts.totalRuns} />
        </div>
      </div>

      {/* Operations row */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Operations</div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center"><div className="text-sm font-bold text-emerald-400">{overview.jobQueue.completed}</div><div className="text-[8px] text-slate-600">Jobs Done</div></div>
          <div className="text-center"><div className="text-sm font-bold text-amber-400">{overview.jobQueue.running}</div><div className="text-[8px] text-slate-600">Jobs Running</div></div>
          <div className="text-center"><div className="text-sm font-bold text-rose-400">{overview.jobQueue.failed}</div><div className="text-[8px] text-slate-600">Jobs Failed</div></div>
          <div className="text-center"><div className="text-sm font-bold text-cyan-400">{overview.snapshots.total}</div><div className="text-[8px] text-slate-600">Snapshots</div></div>
        </div>
      </div>
    </div>
  );
}
