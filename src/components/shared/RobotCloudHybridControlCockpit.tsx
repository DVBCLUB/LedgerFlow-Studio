import React, { useState } from 'react';
import { Bot, Cloud, Zap, ShieldCheck, CheckCircle2, DollarSign, ArrowRightLeft, Radio } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export default function RobotCloudHybridControlCockpit() {
  const [sessions, setSessions] = useState([
    { id: 's_tiktok', name: 'TikTok Web Studio Robot', status: 'HEALTHY', saved: '$136.00' },
    { id: 's_youtube', name: 'YouTube Web Studio Robot', status: 'HEALTHY', saved: '$188.00' },
    { id: 's_runway', name: 'Runway ML Web Robot', status: 'HEALTHY', saved: '$210.00' },
    { id: 's_chatgpt', name: 'ChatGPT / Claude Web Robot', status: 'HEALTHY', saved: '$370.00' },
  ]);

  const [routerMode, setRouterMode] = useState<'smart' | 'web_first' | 'cloud_fast'>('smart');
  const [routeLog, setRouteLog] = useState<string | null>(null);

  const handleTestRoute = () => {
    setRouteLog('Bộ điều tuyến vừa chọn Web Robot (0% API Cost) để xử lý kịch bản mới!');
    setTimeout(() => setRouteLog(null), 3500);
  };

  return (
    <Card className="p-5 bg-slate-900 border-cyan-500/20 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ArrowRightLeft className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Bảng Điều Khiển Robot Web & Cloud Hybrid (Hybrid Control Cockpit)
              <Badge variant="purple">Smart Task Router</Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Tự động phái sinh giữa Web Robot (0% API cost) và Cloud API Render Tốc độ cao.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <Button
            size="sm"
            variant={routerMode === 'smart' ? 'primary' : 'outline'}
            onClick={() => setRouterMode('smart')}
            className="text-xs px-3 py-1"
          >
            🧠 Tự động Thông minh
          </Button>
          <Button
            size="sm"
            variant={routerMode === 'web_first' ? 'primary' : 'outline'}
            onClick={() => setRouterMode('web_first')}
            className="text-xs px-3 py-1"
          >
            🤖 Web RPA 0đ
          </Button>
        </div>
      </div>

      {routeLog && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{routeLog}</span>
        </div>
      )}

      {/* Grid: Web Sessions & Routing Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sessions.map((s) => (
          <div key={s.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{s.name}</span>
              <Badge variant="success" className="text-[9px]">🟢 Healthy Session</Badge>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Đã tiết kiệm:</span>
              <strong className="text-emerald-400">{s.saved}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs text-slate-300">
            Hệ thống đang duy trì <strong className="text-white">85% tác vụ qua Web RPA (0đ)</strong> và <strong className="text-white">15% qua Cloud API</strong>. Tổng số tiền API đã giữ lại: <span className="text-emerald-400 font-bold font-mono">$904.00 USD</span>.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleTestRoute}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-1.5 shrink-0"
        >
          <Zap className="w-3.5 h-3.5 mr-1" /> Chạy Thử Bộ Điều Tuyến
        </Button>
      </div>
    </Card>
  );
}
