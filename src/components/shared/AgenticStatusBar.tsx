import React, { useState, useEffect } from 'react';
import { Activity, Cpu } from 'lucide-react';

export default function AgenticStatusBar() {
  const [pulse, setPulse] = useState(false);

  // Hiệu ứng nhấp nháy mô phỏng hoạt động AI ngầm
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default" title="Solopreneur AI Agentic Loop is active">
      <div className="relative flex h-2 w-2">
        {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
        <Cpu className="h-3 w-3 text-text-muted" />
        AI Engine Active
      </div>
    </div>
  );
}
