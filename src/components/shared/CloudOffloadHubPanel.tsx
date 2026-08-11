import React, { useState } from 'react';
import { Cloud, Cpu, HardDrive, Zap, CheckCircle2, Film, Mic, Gamepad2, Share2, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface CloudEndpoint {
  id: string;
  category: string;
  providerName: string;
  status: string;
  offloadedJobCount: number;
  localGpuSavingsPercent: number;
}

export default function CloudOffloadHubPanel() {
  const [endpoints, setEndpoints] = useState<CloudEndpoint[]>([
    {
      id: 'bridge_runway',
      category: 'Video AI',
      providerName: 'Runway ML & Midjourney Cloud Video API',
      status: 'connected',
      offloadedJobCount: 128,
      localGpuSavingsPercent: 100,
    },
    {
      id: 'bridge_elevenlabs',
      category: 'Voice AI',
      providerName: 'ElevenLabs Voice Synthesizer API',
      status: 'connected',
      offloadedJobCount: 312,
      localGpuSavingsPercent: 100,
    },
    {
      id: 'bridge_github_ci',
      category: 'Game Build',
      providerName: 'GitHub Actions & Cloud GPU Build Server',
      status: 'connected',
      offloadedJobCount: 45,
      localGpuSavingsPercent: 100,
    },
    {
      id: 'bridge_social_publisher',
      category: 'Social & Affiliate',
      providerName: 'TikTok, YouTube & Shopee Open API Gateway',
      status: 'connected',
      offloadedJobCount: 285,
      localGpuSavingsPercent: 100,
    },
  ]);

  const [offloadStatus, setOffloadStatus] = useState<string | null>(null);

  const handleTestOffload = (endpoint: CloudEndpoint) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.id === endpoint.id ? { ...e, offloadedJobCount: e.offloadedJobCount + 1 } : e))
    );
    setOffloadStatus(`Đã đẩy 1 tác vụ xử lý nặng sang ${endpoint.providerName}. Máy cục bộ của bạn giữ 100% tài nguyên CPU/GPU!`);
    setTimeout(() => setOffloadStatus(null), 3500);
  };

  return (
    <Card className="p-5 bg-slate-900 border-cyan-500/20 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cloud className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Trung tâm Kết nối & Giảm Tải Cloud (Cloud-Offload Hub)
              <Badge variant="cyan">Kiến trúc Siêu Nhẹ Máy</Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Đẩy 100% tác vụ nặng (Render Video, Synthesize Voice, Build Game) lên Cloud APIs chuyên dụng.
            </p>
          </div>
        </div>

        {/* Local Hardware Stats */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="text-center px-2 border-r border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">CPU Local</span>
            <span className="text-xs font-black text-emerald-400">1.6% (Siêu nhẹ)</span>
          </div>
          <div className="text-center px-2 border-r border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">RAM Heap</span>
            <span className="text-xs font-black text-cyan-400">~124 MB</span>
          </div>
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">GPU Local Saved</span>
            <span className="text-xs font-black text-purple-400">100% Cloud</span>
          </div>
        </div>
      </div>

      {offloadStatus && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{offloadStatus}</span>
        </div>
      )}

      {/* Endpoints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {endpoints.map((ep) => (
          <div
            key={ep.id}
            className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="cyan" className="text-[9px]">{ep.category}</Badge>
                <Badge variant="success" className="text-[9px]">🟢 100% Offloaded</Badge>
              </div>

              <h4 className="text-xs font-bold text-white leading-snug">{ep.providerName}</h4>
              <p className="text-[11px] text-slate-400">
                Đã xử lý Cloud: <strong className="text-white font-mono">{ep.offloadedJobCount} tác vụ</strong>
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => handleTestOffload(ep)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-1.5 flex items-center justify-center gap-1.5 mt-2"
            >
              <Zap className="w-3.5 h-3.5" /> Đẩy việc sang Cloud
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
