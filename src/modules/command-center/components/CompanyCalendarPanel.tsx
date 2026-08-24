import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  FileText,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface RhythmEvent {
  id: string;
  title: string;
  type: string;
  scheduledTime: string;
  recurringPattern: string;
  assignedRoles: string[];
  status: 'upcoming' | 'in_progress' | 'completed';
  agendaItems: string[];
}

export const CompanyCalendarPanel: React.FC = () => {
  const [events, setEvents] = useState<RhythmEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dormant/operating-rhythm/schedule');
      const data = await res.json();
      if (data.success && data.schedule) {
        setEvents(data.schedule);
      }
    } catch (err) {
      console.error('Failed to load schedule', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch('/api/dormant/operating-rhythm/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: 'completed' } : e))
        );
      }
    } catch (err) {
      console.error('Failed to complete event', err);
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'tax_deadline':
        return <Badge tone="rose">Thuế & Pháp lý</Badge>;
      case 'daily_standup':
        return <Badge tone="cyan">Hàng ngày</Badge>;
      case 'weekly_review':
        return <Badge tone="violet">Hàng tuần</Badge>;
      case 'monthly_close':
        return <Badge tone="emerald">Khóa sổ tháng</Badge>;
      default:
        return <Badge tone="slate">Vận hành</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-violet-400" />
            <span>Company Operating Rhythm & Calendar (Lịch vận hành công ty)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Lịch trình tự động cho Daily Standup, Review hàng tuần, Hạn nộp thuế TT80 và Khóa sổ kế toán
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSchedule}
            className="flex items-center gap-1 text-xs text-violet-300 border-violet-800/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới lịch</span>
          </Button>
        </div>
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <Card
            key={event.id}
            className={`p-5 space-y-4 border transition-all duration-200 ${
              event.status === 'completed'
                ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                : 'bg-slate-900/80 border-slate-700 hover:border-violet-500/50 shadow-xl'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getEventBadge(event.type)}
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    {event.recurringPattern}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100">{event.title}</h3>
              </div>

              {event.status === 'completed' ? (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã hoàn thành
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
                  <Clock className="w-3.5 h-3.5" />
                  Sắp diễn ra
                </span>
              )}
            </div>

            {/* Time & Roles */}
            <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>
                  {new Date(event.scheduledTime).toLocaleDateString('vi-VN')} lúc{' '}
                  {new Date(event.scheduledTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>{event.assignedRoles.join(', ')}</span>
              </div>
            </div>

            {/* Agenda List */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Chương trình hành động (Agenda):
              </div>
              <ul className="space-y-1">
                {event.agendaItems.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-violet-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Action */}
            {event.status !== 'completed' && (
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleComplete(event.id)}
                  className="text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Xác nhận hoàn thành phiên</span>
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CompanyCalendarPanel;
