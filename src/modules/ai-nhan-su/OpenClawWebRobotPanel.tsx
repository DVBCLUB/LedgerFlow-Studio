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
    setLoading(true);
    setMessage(null);
    try {
      const res = await daemonFetch('/api/openclaw/web-robot/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          approvalPhrase
        })
      });
      setMessage({ type: 'success', text: 'Execution Complete' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Execution failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border-primary bg-slate-950/50 p-5 text-slate-100">
      <h2 className="mb-4 text-lg font-black text-text-primary flex items-center"><Bot className="mr-2 h-5 w-5 text-cyan-400" /> OpenClaw Web Robot Consensus</h2>
      
      {message && (
        <div className={`mb-4 rounded-xl border p-3 text-sm font-bold ${message.type === 'error' ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handlePreflight} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Target Web AI Profile</label>
          <select value={profile} onChange={e => setProfile(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-sm text-slate-200">
            <option value="chatgpt_default">ChatGPT Default</option>
            <option value="gemini_advanced">Gemini Advanced</option>
            <option value="claude_opus">Claude Opus</option>
            <option value="deepseek_coder">DeepSeek Coder</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">Robot Instruction</label>
          <textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-sm text-slate-200" placeholder="e.g. Move to x:100, y:200 and grip." />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={consensusMode} onChange={e => setConsensusMode(e.target.checked)} className="h-4 w-4" />
          <span className="text-sm font-semibold flex items-center"><Users className="mr-1 h-4 w-4 text-slate-400" /> Enable Multi-Agent Consensus (3 profiles)</span>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={executionMode} onChange={e => setExecutionMode(e.target.checked)} className="h-4 w-4" />
          <span className="text-sm font-semibold flex items-center">Execute Lab Robot Mode</span>
        </div>

        <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 flex items-center">
          <Code2 className="mr-2 h-4 w-4" /> {loading ? 'Generating...' : 'Generate Preflight Plan'}
        </button>
      </form>

      {plan && (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="mb-3 text-md font-bold">Preflight Analysis</h3>
          
          <div className="space-y-3">
            {plan.riskLevel === 'HIGH' && (
              <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 flex items-start text-sm text-amber-200">
                <ShieldAlert className="mr-2 h-5 w-5 shrink-0" />
                <p><strong>High Risk Commands Detected:</strong> This plan contains move/grip/calibrate commands. Approval phrase required.</p>
              </div>
            )}
            
            {plan.riskLevel === 'BLOCKED' && (
              <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-300">
                <strong>Plan Blocked:</strong> Safety violations detected in the generated plan.
              </div>
            )}
            
            {plan.consensusReached !== undefined && (
              <div className={`rounded-xl border p-3 text-sm font-bold ${plan.consensusReached ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/50 bg-rose-500/10 text-rose-300'}`}>
                {plan.consensusReached ? "Consensus Reached" : "Consensus Failed"}
              </div>
            )}

            <pre className="overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-300 max-h-48">
              {JSON.stringify(plan.commands, null, 2)}
            </pre>

            {executionMode && plan.riskLevel !== 'BLOCKED' && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                {plan.riskLevel === 'HIGH' && (
                  <input 
                    type="text"
                    placeholder="Type 'APPROVE ROBOT SIMULATION'" 
                    value={approvalPhrase}
                    onChange={e => setApprovalPhrase(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 p-2 text-sm text-slate-200"
                  />
                )}
                <button 
                  onClick={() => void handleExecute()}
                  disabled={loading}
                  className={`rounded-xl px-4 py-2 text-sm font-bold flex items-center disabled:opacity-50 ${plan.riskLevel === 'HIGH' ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {plan.riskLevel === 'HIGH' ? 'SEND TO WEB AI (DANGEROUS)' : 'Execute Plan'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
