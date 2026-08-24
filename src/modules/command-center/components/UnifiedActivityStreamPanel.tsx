import React, { useState, useEffect } from 'react';
import {
  Activity,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface ActivityItem {
  id: string;
  timestamp: string;
  eventType: string;
  department: string;
  urgency: 'critical' | 'high' | 'normal' | 'info';
  title: string;
  description: string;
  actor: string;
  isActionable: boolean;
  resolved: boolean;
}

export const UnifiedActivityStreamPanel: React.FC = () => {
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const url = `/api/dormant/activity-stream/history?department=${departmentFilter}&urgency=${urgencyFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.feed) {
        setFeed(data.feed);
      }
    } catch (err) {
      console.error('Failed to load activity stream', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [departmentFilter, urgencyFilter]);

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch('/api/dormant/activity-stream/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setFeed((prev) =>
          prev.map((item) => (item.id === id ? { ...item, resolved: true } : item))
        );
      }
    } catch (err) {
      console.error('Failed to resolve item', err);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge tone="rose">Khẩn cấp</Badge>;
      case 'high':
        return <Badge tone="amber">Ưu tiên cao</Badge>;
      case 'normal':
        return <Badge tone="cyan">Bình thường</Badge>;
      default:
        return <Badge tone="slate">Thông tin</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Unified Activity Stream (Dòng sự kiện thời gian thực)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tổng hợp và điều phối 35 loại sự kiện tự động xuyên suốt 12 phòng ban công ty
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">Mọi phòng ban</option>
            <option value="sales">Sales & CRM</option>
            <option value="finance">Tài chính & Thuế</option>
            <option value="delivery">Kỹ thuật & Delivery</option>
            <option value="ai_ops">AI Ops & Factory</option>
            <option value="system">Hạ tầng & Hệ thống</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">Mọi mức độ</option>
            <option value="critical">Khẩn cấp</option>
            <option value="high">Ưu tiên cao</option>
            <option value="normal">Bình thường</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchFeed}
            className="flex items-center gap-1 text-xs text-cyan-300 border-cyan-800/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {feed.map((item) => (
          <Card
            key={item.id}
            className={`p-4 transition-all duration-200 border ${
              item.resolved
                ? 'bg-slate-900/40 border-slate-800/80 opacity-80'
                : 'bg-slate-900/80 border-slate-700 hover:border-cyan-500/50 shadow-lg'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-100">{item.title}</span>
                    {getUrgencyBadge(item.urgency)}
                    <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.department}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(item.timestamp).toLocaleTimeString('vi-VN')} - {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Sparkles className="w-3 h-3" />
                      Thực hiện bởi: {item.actor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {item.isActionable && !item.resolved && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleResolve(item.id)}
                  className="flex items-center gap-1 text-xs shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác nhận xử lý</span>
                </Button>
              )}

              {item.resolved && (
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã hoàn tất
                </span>
              )}
            </div>
          </Card>
        ))}

        {feed.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
            <Info className="w-8 h-8 mx-auto text-slate-500 mb-2" />
            <p className="text-sm">Không có sự kiện nào khớp với bộ lọc hiện tại.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedActivityStreamPanel;
