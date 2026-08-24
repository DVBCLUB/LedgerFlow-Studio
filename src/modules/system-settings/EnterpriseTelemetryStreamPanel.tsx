import React, { useState, useEffect } from 'react';
import { TelemetryStreamOverview, TelemetryStreamEvent } from '../../../server/services/enterpriseTelemetryStreamEngine';

export const EnterpriseTelemetryStreamPanel: React.FC = () => {
  const [overview, setOverview] = useState<TelemetryStreamOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [pulseText, setPulseText] = useState<string>('Kiểm thử xung nhịp giám sát Telemetry thời gian thực');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/telemetry-stream/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry stream overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePulse = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/dormant/telemetry-stream/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'agent_task_pulse', payloadSummary: pulseText })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to publish telemetry pulse', err);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang kết nối luồng Telemetry Stream &amp; WebSocket Hub...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              PILLAR 119 — REAL-TIME TELEMETRY STREAM
            </span>
            <span className="text-xs text-slate-400 font-mono">Status: {overview?.streamingStatus}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Real-Time Enterprise Telemetry Stream &amp; Observability</h1>
          <p className="text-sm text-slate-400">
            Kênh truyền dẫn dữ liệu thời gian thực (WebSocket &amp; SSE): Theo dõi từng luồng giao dịch, xung nhịp của các Agent và độ trễ toàn mạng.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={pulseText}
            onChange={(e) => setPulseText(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handlePulse}
            disabled={publishing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {publishing ? 'Đang phát...' : '⚡ Bắn Xung Telemetry'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tốc Độ Xử Lý Sự Kiện</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.eventsProcessedPerSec} Events / s</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Real-time Stream Engine</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Băng Thông Mạng Dữ Liệu</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{overview?.systemThroughputMbps} Mbps</div>
          <div className="text-xs text-slate-400 mt-1">Zero Latency Overhead</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Sự Kiện Đã Ghi Nhận</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            {overview?.totalEventsLoggedCount.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Audit &amp; Observability Log</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Giao Thức Kênh Truyền</div>
          <div className="text-sm font-bold text-amber-300 mt-2">WebSocket + Server-Sent Events (SSE)</div>
          <div className="text-xs text-slate-400 mt-1">Ultra-Low Latency Duplex</div>
        </div>
      </div>

      {/* Events Stream Feed */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Luồng Sự Kiện Trực Tuyến Thời Gian Thực (Live Stream Feed)
        </h2>

        <div className="space-y-3">
          {overview?.events.map((evt: TelemetryStreamEvent) => (
            <div key={evt.eventId} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs font-mono rounded uppercase">{evt.eventType.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-white">{evt.source}</span>
                </div>
                <div className="text-xs text-slate-300">{evt.payloadSummary}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-emerald-400 font-mono font-bold">{evt.latencyMs} ms</div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  {new Date(evt.timestamp).toLocaleTimeString('vi-VN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseTelemetryStreamPanel;
