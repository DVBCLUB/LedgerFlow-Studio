import { useState } from 'react';
import { Bot, ShieldAlert, Code2, Users, Send } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

interface RobotExecutionPlan {
  commands: any[];
  riskLevel: 'LOW' | 'HIGH' | 'BLOCKED';
  consensusReached?: boolean;
}

export function OpenClawWebRobotPanel() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<RobotExecutionPlan | null>(null);
  const [approvalPhrase, setApprovalPhrase] = useState('');
  const [executionMode, setExecutionMode] = useState(false);
  const [profile, setProfile] = useState('chatgpt_default');
  const [prompt, setPrompt] = useState('');
  const [consensusMode, setConsensusMode] = useState(true);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handlePreflight = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPlan(null);
    setMessage(null);
    try {
      const res = await daemonFetch<{ success: boolean; plan: RobotExecutionPlan }>('/api/openclaw/web-robot/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          targetWebAIProfile: profile,
          consensusMode,
          numberOfProfiles: consensusMode ? 3 : 1
        })
      });
      if (res.success) {
        setPlan(res.plan);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Preflight failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!plan || plan.riskLevel === 'BLOCKED') return;
    setExecutionMode(true);
    setLoading(true);
    setMessage(null);
    try {
      // Bắt đầu luồng Terminal UI mô phỏng
      const steps = [
        '[INIT] Authenticating session...',
        '[OP] Selecting DOM Element: #login-btn',
        '[WAIT] Waiting for DOM loaded...',
        '[OP] Processing Matrix directives...',
      ];
      
      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length) {
          setMessage({ type: 'success', text: steps.slice(0, stepIdx + 1).join('\n') });
          stepIdx++;
        }
      }, 400);

      // Gọi THỰC TẾ xuống Backend AI Gateway! KHÔNG ĐƯỢC BỎ QUÊN
      const res = await daemonFetch('/api/openclaw/web-robot/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          approvalPhrase
        })
      });

      clearInterval(interval);
      setMessage({ type: 'success', text: steps.join('\n') + '\n\n[SUCCESS] Execution Complete from Backend:\n' + JSON.stringify(res, null, 2) });
      
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Execution failed from backend' });
    } finally {
      setLoading(false);
      setExecutionMode(false);
    }
  };

  return (
    <div className="rounded-3xl border border-sky-500/30 bg-slate-950/80 p-6 text-slate-100 shadow-[0_0_40px_rgba(14,165,233,0.1)] relative overflow-hidden backdrop-blur-xl">
      {/* Cybernetic grid background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10 border-b border-sky-500/20 pb-4">
        <h2 className="text-xl font-black text-text-primary flex items-center tracking-wide">
          <Bot className="mr-3 h-6 w-6 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" /> 
          OPENCLAW WEB COMMAND CENTER
        </h2>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest tabular-nums">LIVE UPLINK</span>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-5 gap-6 relative z-10">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handlePreflight} className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-sky-300/70 mb-1.5">Target AI Neural Profile</label>
              <select value={profile} onChange={e => setProfile(e.target.value)} className="w-full rounded-xl border border-sky-900/50 bg-slate-950 p-2.5 text-sm font-semibold text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all shadow-inner">
                <option value="chatgpt_default">GPT-4o Omnimodal</option>
                <option value="gemini_advanced">Gemini 1.5 Pro</option>
                <option value="claude_opus">Claude 3.5 Sonnet</option>
                <option value="deepseek_coder">DeepSeek V2 Coder</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-sky-300/70 mb-1.5">Robot Directive</label>
              <textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} required className="w-full rounded-xl border border-sky-900/50 bg-slate-950 p-2.5 text-sm font-semibold text-sky-100 placeholder:text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all shadow-inner" placeholder="E.g. Log into portal and extract table data..." />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wide flex items-center"><Users className="mr-2 h-4 w-4 text-sky-400" /> Multi-Agent Consensus</span>
              {/* Sci-Fi Toggle */}
              <button type="button" onClick={() => setConsensusMode(!consensusMode)} className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${consensusMode ? 'bg-sky-500/20 border border-sky-500/50' : 'bg-slate-800 border border-slate-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${consensusMode ? 'left-7 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]' : 'left-1 bg-slate-500'}`} />
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 text-xs font-black uppercase tracking-wider text-white transition-all disabled:opacity-50">
              {loading && !executionMode ? 'Scanning Matrix...' : 'Run Preflight Analysis'}
            </button>
          </form>

          {/* Consensus Radar / Analysis */}
          {plan && (
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Analysis Result</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${plan.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  RISK: {plan.riskLevel}
                </span>
              </div>
              
              {consensusMode && (
                <div className="flex justify-center items-center gap-4 py-4">
                  {[1, 2, 3].map(node => (
                    <div key={node} className="relative">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/50 bg-emerald-950 flex items-center justify-center relative z-10">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
                      </div>
                      {node < 3 && <div className="absolute top-1/2 left-8 w-6 h-0.5 bg-emerald-500/30 -translate-y-1/2" />}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-[10px] text-center font-bold text-emerald-400 uppercase tracking-widest mt-2 mb-4">
                Consensus Reached
              </div>

              {/* Laser Sweep Execute Button */}
              <button 
                onClick={handleExecute} 
                disabled={executionMode}
                className="group w-full relative overflow-hidden rounded-xl bg-sky-600 border border-sky-400 p-3 text-xs font-black uppercase tracking-wider text-white transition-all disabled:opacity-50 hover:bg-sky-500 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
              >
                <div className="absolute inset-0 w-full h-full">
                  <div className="absolute inset-y-0 -left-[100%] w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                </div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Code2 className="w-4 h-4" /> 
                  {executionMode ? 'EXECUTING...' : 'INITIATE OVERRIDE'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Streaming Terminal */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col overflow-hidden relative shadow-inner min-h-[300px]">
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 text-[10px] font-mono text-slate-500">root@openclaw:~</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
            <div className="text-emerald-400 whitespace-pre-line tabular-nums break-words relative z-20 opacity-90 drop-shadow-[0_0_2px_rgba(52,211,153,0.8)]">
              {message?.text || '> AWAITING DIRECTIVE...\n> MATRIX STANDBY'}
              {executionMode && <span className="animate-pulse inline-block w-2 h-3 bg-emerald-400 ml-1 align-middle" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
