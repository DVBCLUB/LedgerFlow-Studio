import React, { useState, useEffect } from 'react';
import { VisionSurveillanceOverview, CameraVisionStream } from '../../../server/services/visionFactorySurveillanceEngine';

export const VisionFactorySurveillancePanel: React.FC = () => {
  const [overview, setOverview] = useState<VisionSurveillanceOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [eventDesc, setEventDesc] = useState<string>('Quét kiện hàng xuất xưởng linh kiện AI #88');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/vision-surveillance/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch vision surveillance overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/dormant/vision-surveillance/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: 'cam-01', eventDescription: eventDesc })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to recognize vision event', err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang kết nối luồng Camera AI RTSP &amp; WebRTC Low-Latency...</p>
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
              PILLAR 123 — AI COMPUTER VISION &amp; RTSP SURVEILLANCE
            </span>
            <span className="text-xs text-slate-400 font-mono">Vision FPS: {overview?.averageVisionFps} FPS</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Real-Time RTSP/WebRTC AI Computer Vision Surveillance</h1>
          <p className="text-sm text-slate-400">
            Giám sát thị giác AI tại kho bãi và xưởng sản xuất: Nhận diện mã kiện hàng, phát hiện bất thường và kích hoạt định khoản kế toán tự động.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {simulating ? 'Đang nhận diện...' : '📸 Nhận Diện Thị Giác AI'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Camera Đang Truyền Luồng Trực Tiếp</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.totalActiveCamerasCount} Luồng Stream</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">WebRTC + RTSP Low Latency</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Sự Kiện Đồng Bộ Kế Toán Tự Động</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">
            {overview?.totalAutomatedLedgerSyncsCount.toLocaleString()} Sự kiện
          </div>
          <div className="text-xs text-slate-400 mt-1">Barcode &amp; Weighing Automation</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Độ Trễ Nhận Diện Thị Giác</div>
          <div className="text-sm font-bold text-white mt-2">&lt; 35ms / Frame (Edge TensorRT)</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">YOLOv10 + OCR Real-time</div>
        </div>
      </div>

      {/* Streams List */}
      <div className="space-y-4">
        {overview?.streams.map((s: CameraVisionStream) => (
          <div key={s.cameraId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono rounded">{s.streamProtocol}</span>
                <span className="text-base font-bold text-white">{s.cameraName}</span>
                <span className="text-xs text-slate-400">({s.locationZone})</span>
              </div>
              <div className="text-xs text-slate-300">
                Sự kiện gần nhất: <span className="text-teal-300 italic">{s.lastDetectedEvent}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Tốc độ: {s.detectionFps} FPS • Tổng {s.detectedEventsCount} sự kiện được xử lý
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                {s.healthStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisionFactorySurveillancePanel;
