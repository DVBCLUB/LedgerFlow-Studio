import { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Clock, Ban } from 'lucide-react';
import { daemonFetch } from '../../../utils/assistantApi';

interface WebAIProfileHealth {
  profileId: string;
  name: string;
  platform: 'chatgpt' | 'gemini' | 'claude' | 'deepseek';
  healthScore: number;
  status: 'leaseable' | 'cooldown' | 'blocked';
  lastError?: string;
  cooldownEndsAt?: string;
  retryRecommendation?: string;
}

export function WebAISchedulerPanel() {
  const [profiles, setProfiles] = useState<WebAIProfileHealth[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await daemonFetch<{ success: boolean; profiles: WebAIProfileHealth[] }>('/api/web-ai/scheduler/health');
      if (res.success && res.profiles) {
        setProfiles(res.profiles);
      }
    } catch (err) {
      console.error('Failed to fetch Web AI profile health', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfiles();
  }, []);

  return (
    <div className="rounded-3xl border border-border-primary bg-slate-950/50 p-5 text-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-text-primary">Web AI Scheduler & Reliability</h2>
        <button onClick={() => void fetchProfiles()} disabled={loading} className="rounded-xl border border-border-secondary bg-bg-surface px-3 py-2 text-xs font-black text-text-secondary disabled:opacity-50">
          <RefreshCw className={`inline h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {profiles.map(profile => (
          <div key={profile.profileId} className="flex flex-col gap-2 rounded-2xl border border-border-primary bg-slate-950/70 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black text-text-primary">{profile.name} <span className="ml-2 rounded bg-blue-500/20 px-2 py-0.5 text-[10px] uppercase text-blue-300">{profile.platform}</span></p>
              <div className="mt-2 text-xs">
                {profile.status === 'leaseable' && <span className="inline-flex items-center text-emerald-400"><ShieldCheck className="mr-1 h-3 w-3" /> Leaseable</span>}
                {profile.status === 'cooldown' && <span className="inline-flex items-center text-amber-400"><Clock className="mr-1 h-3 w-3" /> Cooldown</span>}
                {profile.status === 'blocked' && <span className="inline-flex items-center text-rose-400"><Ban className="mr-1 h-3 w-3" /> Blocked</span>}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-black ${profile.healthScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{profile.healthScore}/100</p>
              <p className="text-[10px] uppercase text-text-tertiary">Health Score</p>
            </div>
            {(profile.lastError || profile.cooldownEndsAt) && (
              <div className="mt-2 w-full rounded bg-slate-900 p-2 text-xs lg:mt-0 lg:w-auto">
                {profile.lastError && <p className="text-rose-400">Error: {profile.lastError}</p>}
                {profile.cooldownEndsAt && <p className="text-amber-400">Cooldown ends: {new Date(profile.cooldownEndsAt).toLocaleTimeString()}</p>}
                {profile.retryRecommendation && <p className="text-slate-400">Tip: {profile.retryRecommendation}</p>}
              </div>
            )}
          </div>
        ))}
        {profiles.length === 0 && <p className="text-sm text-text-tertiary">No profiles found.</p>}
      </div>
    </div>
  );
}
