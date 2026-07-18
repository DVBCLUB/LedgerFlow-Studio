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
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-black uppercase text-text-tertiary">{cat.label}</p>
          {cat.passed ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : <ShieldAlert className="h-4 w-4 text-rose-400" />}
        </div>
        <p className={`text-2xl font-black ${cat.passed ? 'text-emerald-300' : 'text-rose-300'}`}>{cat.score}<span className="text-sm text-slate-500">/100</span></p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full ${cat.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${cat.score}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-border-primary bg-slate-950/50 p-5 text-slate-100">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h2 className="text-lg font-black text-text-primary flex items-center"><Activity className="mr-2 h-5 w-5 text-blue-400" /> World-Class Readiness Scorecard</h2>
        <span className="text-xs text-text-tertiary">Last eval: {new Date(scorecard.lastEvaluatedAt).toLocaleTimeString()}</span>
      </div>

      <div className="mb-8 flex flex-col items-center justify-center">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-[8px] border-slate-800">
          <div 
            className="absolute inset-0 rounded-full border-[8px] border-transparent" 
            style={{
              borderColor: scorecard.overallScore === 100 ? '#10b981' : '#3b82f6',
              clipPath: `polygon(0 0, 100% 0, 100% ${scorecard.overallScore}%, 0 ${scorecard.overallScore}%)` 
            }}
          />
          <div className="text-center">
            <span className="text-3xl font-black text-white">{scorecard.overallScore}%</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-bold text-slate-300">Overall Readiness</p>
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
