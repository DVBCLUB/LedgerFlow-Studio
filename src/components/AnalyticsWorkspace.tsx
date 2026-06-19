import { useState } from 'react';
import { BarChart3, FlaskConical } from 'lucide-react';
import FounderLabsDock from './FounderLabsDock';
import GameAndMLWorkbench from './GameAndMLWorkbench';

type AnalyticsView = 'analytics' | 'labs';

export default function AnalyticsWorkspace() {
  const [view, setView] = useState<AnalyticsView>('analytics');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setView('analytics')}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold ${view === 'analytics' ? 'border-cyan-700 bg-cyan-950/50 text-cyan-100' : 'border-slate-800 bg-slate-900 text-slate-400'}`}
        >
          <BarChart3 className="h-4 w-4" /> Phân tích & mô hình
        </button>
        <button
          type="button"
          onClick={() => setView('labs')}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold ${view === 'labs' ? 'border-emerald-700 bg-emerald-950/50 text-emerald-100' : 'border-slate-800 bg-slate-900 text-slate-400'}`}
        >
          <FlaskConical className="h-4 w-4" /> Founder Labs
        </button>
      </div>
      {view === 'analytics' ? <GameAndMLWorkbench /> : <FounderLabsDock embedded />}
    </div>
  );
}
