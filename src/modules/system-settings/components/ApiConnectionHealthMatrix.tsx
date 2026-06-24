import React, { useState } from 'react';
import { Network, ShieldCheck, Play, HelpCircle, Activity, Key } from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'warning' | 'error';
  quota: string;
  expiry: string;
  latency: string;
}

const INITIAL_CONNECTIONS: Connection[] = [
  { id: 'gemini', name: 'Google Gemini API', provider: 'Google AI Studio', status: 'active', quota: '95% (Free Tier)', expiry: 'Không giới hạn', latency: '124ms' },
  { id: 'openai', name: 'OpenAI API (GPT-4o)', provider: 'OpenAI Developer', status: 'warning', quota: '$12.50 / $100', expiry: 'Còn 14 ngày', latency: '185ms' },
  { id: 'github', name: 'GitHub Actions & Issues API', provider: 'GitHub', status: 'active', quota: '4.250 / 5.000 requests', expiry: 'N/A', latency: '98ms' },
  { id: 'supabase', name: 'Supabase Database', provider: 'Supabase Cloud', status: 'active', quota: '12.5 MB / 500 MB', expiry: 'Không giới hạn', latency: '65ms' }
];

export default function ApiConnectionHealthMatrix() {
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [pinging, setPinging] = useState<string | null>(null);

  const handlePing = (id: string) => {
    setPinging(id);
    setTimeout(() => {
      setConnections(prev => prev.map(c => {
        if (c.id === id) {
          const randLatency = Math.round(50 + Math.random() * 150) + 'ms';
          return { ...c, latency: randLatency, status: 'active' };
        }
        return c;
      }));
      setPinging(null);
    }, 1000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-slate-500/10 text-slate-300 border border-slate-500/25 rounded-xl">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">API Connection Health Matrix</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Giám sát sức khỏe, tốc độ phản hồi và thời hạn các cổng kết nối API bên thứ ba.</p>
        </div>
      </div>

      <div className="space-y-4">
        {connections.map((c) => {
          let dotColor = 'bg-emerald-500';
          let borderColor = 'border-emerald-500/20';
          let textColor = 'text-emerald-300';
          
          if (c.status === 'warning') {
            dotColor = 'bg-amber-500';
            borderColor = 'border-amber-500/20';
            textColor = 'text-amber-300';
          } else if (c.status === 'error') {
            dotColor = 'bg-rose-500';
            borderColor = 'border-rose-500/20';
            textColor = 'text-rose-300';
          }

          return (
            <div key={c.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 relative">
                  <span className={`w-3.5 h-3.5 rounded-full block ${dotColor} ${c.status === 'active' ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{c.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-none">
                    Provider: {c.provider}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-xs text-left">
                <div>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Dung lượng sử dụng</span>
                  <span className="text-slate-300 font-bold block mt-1">{c.quota}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Thời hạn key</span>
                  <span className={`font-bold block mt-1 ${c.status === 'warning' ? 'text-amber-300' : 'text-slate-300'}`}>{c.expiry}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Độ trễ (Latency)</span>
                  <span className="text-slate-300 font-mono block mt-1">{c.latency}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={pinging === c.id}
                  onClick={() => handlePing(c.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 px-3 py-1.5 text-[10px] font-black text-slate-350 hover:text-white cursor-pointer transition-all disabled:opacity-50"
                >
                  <Activity className="w-3.5 h-3.5" />
                  {pinging === c.id ? 'Đang ping...' : 'Ping test'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-[9px] font-black text-emerald-400/90 border border-emerald-500/10 bg-emerald-500/5 p-2.5 rounded-lg">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Mô phỏng an toàn hệ thống, tự động gỡ lỗi cổng kết nối offline.</span>
      </div>
    </div>
  );
}
