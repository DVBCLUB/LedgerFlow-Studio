import React, { useEffect, useState } from 'react';
import { Activity, Bot, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface TelemetryEvent {
  id: string;
  time: string;
  type: 'finance' | 'ai' | 'devops' | 'system';
  message: string;
  badge: string;
}

const INITIAL_EVENTS: TelemetryEvent[] = [
  {
    id: 'evt-1',
    time: 'Vừa xong',
    type: 'finance',
    message: 'VietQR Auto-Match: Đã tự động đối soát +15.000.000đ từ MBBank',
    badge: 'VAS Accounting',
  },
  {
    id: 'evt-2',
    time: '1 phút trước',
    type: 'ai',
    message: 'AI CMO Agent: Đã xuất bản 3 chiến dịch SEO AI & tạo kịch bản Video',
    badge: 'Growth Engine',
  },
  {
    id: 'evt-3',
    time: '3 phút trước',
    type: 'devops',
    message: 'GitHub CI Doctor: Commit #f8e912 build xanh 100% (0 errors)',
    badge: 'CI/CD Active',
  },
  {
    id: 'evt-4',
    time: '5 phút trước',
    type: 'system',
    message: 'WebAssembly Python Node: Pyodide 3.12 sẵn sàng thực thi mã ngầm',
    badge: 'Python VM',
  },
];

export default function EnterpriseTelemetryStream() {
  const [events, setEvents] = useState<TelemetryEvent[]>(INITIAL_EVENTS);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Connect to live SSE stream if available
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/ai-workforce/stream');
      es.addEventListener('health', (e) => {
        try {
          const snapshot = JSON.parse(e.data);
          if (snapshot?.status) {
            setEvents((prev) => [
              {
                id: `evt_live_${Date.now()}`,
                time: 'Vừa xong',
                type: 'ai',
                message: `AI Workforce Hub: ${snapshot.totalEmployees || 5} nhân sự ảo đang hoạt động`,
                badge: 'Live Stream',
              },
              ...prev.slice(0, 5),
            ]);
          }
        } catch { /* ignore */ }
      });
    } catch { /* ignore */ }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (events.length || 1));
    }, 4500);

    return () => {
      clearInterval(timer);
      if (es) es.close();
    };
  }, [events.length]);

  const currentEvt = events[currentIndex];
  if (!currentEvt) return null;

  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-medium text-slate-300 backdrop-blur-md shadow-inner">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-black tracking-wider text-[10px] uppercase text-cyan-400">Realtime Stream</span>
      </div>
      <div className="h-3 w-[1px] bg-slate-800" />
      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-md">
        <span className="rounded-md bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-300 border border-slate-700">
          {currentEvt.badge}
        </span>
        <span className="text-slate-200 truncate">{currentEvt.message}</span>
      </div>
    </div>
  );
}
