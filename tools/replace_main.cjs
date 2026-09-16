const fs = require('fs');
const path = require('path');
const target = path.resolve(__dirname, '..', 'src', 'components', 'command', 'CEOCommandCenter.tsx');
let content = fs.readFileSync(target, 'utf-8');
const oldLen = content.length;
const start = content.indexOf('export default function CEOCommandCenter() {');
const end = content.lastIndexOf('\n}');
const newMain = `export default function CEOCommandCenter() {
  const [systemStatus, setSystemStatus] = useState('normal');
  const [statusLabel, setStatusLabel] = useState('All systems nominal');
  const [showEmergency, setShowEmergency] = useState(false);
  const [budgetCollapsed, setBudgetCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState({ overview: true, today: false });
  const [metrics, setMetrics] = useState(null);
  const { panelWidth, panelRef, handleRef, isResizing } = useResizablePanel({ minWidth: 280, maxWidth: 800, initialWidth: 420 });
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const m = await fetchAgentRuntimeMetrics();
        setMetrics(m);
        if (m?.emergencyStop) { setSystemStatus('critical'); setStatusLabel('EMERGENCY STOP ACTIVE'); setShowEmergency(true); }
        else if ((m?.activeRuns ?? 0) > 3) { setSystemStatus('warning'); setStatusLabel(m.activeRuns + ' active runs'); setShowEmergency(false); }
        else { setSystemStatus('normal'); setStatusLabel('All systems nominal'); setShowEmergency(false); }
      } catch { setSystemStatus('error'); setStatusLabel('Cannot connect to AI Daemon'); setShowEmergency(false); }
    };
    void checkHealth();
    const id = setInterval(checkHealth, 15000);
    return () => clearInterval(id);
  }, []);
  const activeRuns = metrics?.activeRuns ?? 0;
  const waiting = metrics?.waitingApproval ?? 0;
  const totalToday = metrics?.totalRuns ?? 0;
  const toggleSection = (key) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  return (
    <div ref={panelRef} className={\x60relative rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/20 p-5 shadow-2xl backdrop-blur-xl transition-all \x24{isResizing ? 'select-none' : ''}\x60} style={{ width: panelWidth }}>
      <div ref={handleRef} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 rounded-r-3xl transition-colors" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">CEO Command Center</h2>
            <StatusIndicator status={systemStatus} label={statusLabel} />
          </div>
        </div>
        {metrics && (
          <div className="flex items-center gap-2">
            {waiting > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">{waiting} pending</span>}
            {activeRuns > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{activeRuns} active</span>}
          </div>
        )}
      </div>
      <div className="space-y-3">
        <button type="button" onClick={() => toggleSection('overview')}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer">
          {expandedSections['overview'] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          System Overview
        </button>
        {expandedSections['overview'] && (
          <div className="space-y-3 animate-fade-in">
            {showEmergency && systemStatus === 'critical' && <EmergencyKillSwitchPanel active={true} onClose={() => setShowEmergency(false)} />}
            <BudgetGovernorPanel />
          </div>
        )}
        <button type="button" onClick={() => toggleSection('today')}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer">
          {expandedSections['today'] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Today's Priorities
        </button>
        {expandedSections['today'] && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-slate-400">No urgent items &mdash; all systems nominal</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-center">
                <p className="text-lg font-black text-indigo-400 tabular-nums">{activeRuns}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Active Runs</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-center">
                <p className="text-lg font-black text-emerald-400 tabular-nums">{totalToday}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Today Total</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`;
content = content.slice(0, start) + newMain + content.slice(end + 1);
fs.writeFileSync(target, content, 'utf-8');
console.log('Done!', oldLen, '->', content.length);
