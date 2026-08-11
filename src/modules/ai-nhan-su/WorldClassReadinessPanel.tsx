import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

interface ReadinessScorecard {
  overallScore: number;
  categories: {
    traceCoverage: { score: number; label: string; passed: boolean };
    evalCoverage: { score: number; label: string; passed: boolean };
    approvalGate: { score: number; label: string; passed: boolean };
    pluginSandbox: { score: number; label: string; passed: boolean };
    robotLab: { score: number; label: string; passed: boolean };
    staffModels: { score: number; label: string; passed: boolean };
  };
  lastEvaluatedAt: string;
}

export function WorldClassReadinessPanel() {
  const [scorecard, setScorecard] = useState<ReadinessScorecard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReadiness = async () => {
      setLoading(true);
      try {
        const res = await daemonFetch<{ success: boolean; scorecard: ReadinessScorecard }>('/api/ai-workforce/world-class-readiness');
        if (res.success && res.scorecard) {
          setScorecard(res.scorecard);
        }
      } catch (err) {
        console.error('Failed to load readiness scorecard', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchReadiness();
  }, []);

  if (!scorecard) {
    return <div className="rounded-3xl border border-border-primary bg-slate-950/50 p-5 text-slate-100"><p>Loading Scorecard...</p></div>;
  }

  const renderCategory = (key: keyof ReadinessScorecard['categories']) => {
    const cat = scorecard.categories[key];
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-full blur-xl -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150 ${cat.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <div className="mb-2 flex items-center justify-between relative z-10">
          <p className="text-[10px] font-black uppercase text-text-tertiary tracking-wider">{cat.label}</p>
          {cat.passed ? <ShieldCheck className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> : <ShieldAlert className="h-4 w-4 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />}
        </div>
        <p className={`text-2xl font-black relative z-10 tabular-nums ${cat.passed ? 'text-emerald-300 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-rose-300 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]'}`}>{cat.score}<span className="text-xs font-semibold text-slate-500">/100</span></p>
        
        {/* Sci-Fi Polygonal Progress Bar */}
        <div className="mt-4 h-1.5 w-full bg-slate-800 relative z-10 overflow-hidden flex">
          {Array.from({ length: 20 }).map((_, i) => {
            const isActive = (i + 1) * 5 <= cat.score;
            return (
              <div 
                key={i} 
                className={`h-full flex-1 mx-[0.5px] skew-x-[-20deg] ${isActive ? (cat.passed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]') : 'bg-slate-700/50'}`} 
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-sky-500/20 bg-slate-950/60 p-6 text-slate-100 backdrop-blur-xl relative overflow-hidden">
      {/* Sci-Fi Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row relative z-10 border-b border-sky-500/10 pb-4">
        <h2 className="text-xl font-black text-text-primary flex items-center tracking-wide"><Activity className="mr-3 h-6 w-6 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" /> WORLD-CLASS READINESS MATRIX</h2>
        <span className="text-[10px] font-black uppercase tracking-widest text-sky-500 bg-sky-500/10 px-3 py-1.5 rounded border border-sky-500/20">Last Sync: {new Date(scorecard.lastEvaluatedAt).toLocaleTimeString()}</span>
      </div>

      <div className="mb-10 flex flex-col items-center justify-center relative z-10">
        {/* Sci-Fi Gauge Meter */}
        <div className="relative flex h-40 w-40 items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border border-slate-800 border-dashed" />
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="6" />
            {/* Progress */}
            <circle 
              cx="50" cy="50" r="45" fill="none" 
              stroke="url(#scoreGrad)" 
              strokeWidth="6" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * scorecard.overallScore) / 100}
              strokeLinecap="round"
              filter="url(#glow)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="text-center z-10 relative">
            <span className="text-4xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{scorecard.overallScore}%</span>
          </div>
        </div>
        <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-sky-300">System Core Readiness</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {renderCategory('traceCoverage')}
        {renderCategory('evalCoverage')}
        {renderCategory('approvalGate')}
        {renderCategory('pluginSandbox')}
        {renderCategory('robotLab')}
        {renderCategory('staffModels')}
      </div>

      {scorecard.overallScore < 100 && (
        <div className="mt-6 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 flex items-start text-sm text-amber-200">
          <ShieldAlert className="mr-2 h-5 w-5 shrink-0" />
          <p><strong>Readiness Gap Detected:</strong> Some categories have not met the world-class threshold. Please improve trace logging, role evaluation coverage, or robot digital twin simulations.</p>
        </div>
      )}
    </div>
  );
}
