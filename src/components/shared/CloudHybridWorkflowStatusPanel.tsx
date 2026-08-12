import React, { useState } from 'react';
import { Cloud, Radio, CheckCircle2, DollarSign, ExternalLink, Zap, AlertTriangle, ShieldCheck, Film, Mic, Gamepad2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface WebhookCallbackItem {
  id: string;
  provider: string;
  title: string;
  artifactUrl: string;
  receivedAt: string;
}

export interface ProviderCreditItem {
  id: string;
  providerName: string;
  monthlyBudgetUsd: number;
  usedUsd: number;
  remainingUsd: number;
  usageRatio: number;
}

export default function CloudHybridWorkflowStatusPanel() {
  const [callbacks, setCallbacks] = useState<WebhookCallbackItem[]>([
    {
      id: 'wh_evt_001',
      provider: 'Runway ML Video API',
      title: 'TikTok Promo Video 30s Review Bàn phím Cơ',
      artifactUrl: 'runtime://media/shorts_88912.mp4',
      receivedAt: '2 phút trước',
    },
    {
      id: 'wh_evt_002',
      provider: 'ElevenLabs Voice API',
      title: 'Giọng đọc AI Voiceover Tiếng Việt Kịch bản Phim ngắn',
      artifactUrl: 'runtime://media/voiceover_77182.mp3',
      receivedAt: '10 phút trước',
    },
    {
      id: 'wh_evt_003',
      provider: 'GitHub Actions CI',
      title: 'Bản Build Windows Steam Game v1.2.4 (x64)',
      artifactUrl: 'https://github.com/solofounder/game/releases/v1.2.4.zip',
      receivedAt: '1 giờ trước',
    },
  ]);

  const [credits] = useState<ProviderCreditItem[]>([
    {
      id: 'prov_runway',
      providerName: 'Runway ML Video Render API',
      monthlyBudgetUsd: 100,
      usedUsd: 42.5,
      remainingUsd: 57.5,
      usageRatio: 0.425,
    },
    {
      id: 'prov_elevenlabs',
      providerName: 'ElevenLabs Voice Synthesizer API',
      monthlyBudgetUsd: 50,
      usedUsd: 18.2,
      remainingUsd: 31.8,
      usageRatio: 0.364,
    },
    {
      id: 'prov_llm_gateway',
      providerName: 'OpenAI / Claude LLM Gateway',
      monthlyBudgetUsd: 150,
      usedUsd: 65.0,
      remainingUsd: 85.0,
      usageRatio: 0.433,
    },
  ]);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSimulateWebhook = () => {
    const newId = `wh_evt_${Date.now()}`;
    const newItem: WebhookCallbackItem = {
      id: newId,
      provider: 'Runway ML Video API',
      title: 'Shorts 15s AI Movie Teaser (4K Render)',
      artifactUrl: `runtime://media/teaser_${Date.now()}.mp4`,
      receivedAt: 'Vừa xong',
    };
    setCallbacks((prev) => [newItem, ...prev]);
    setStatusMessage(`Đã nhận Callback Webhook từ Runway ML: Video MP4 mới đã sẵn sàng!`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <Card className="p-5 bg-slate-900 border-cyan-500/20 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Giám sát Tiến độ Cloud & Ngân sách API (Cloud Hybrid Workflow Status)
              <Badge variant="purple">Zero-Polling Webhooks</Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Nhận kết quả async từ Cloud APIs & Theo dõi hạn mức sử dụng API Credits.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleSimulateWebhook}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" /> Mô phỏng Webhook Callback
        </Button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Callbacks Feed & API Credits Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Webhook Callback Stream */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Nhật ký Nhận Callback Webhook Từ Cloud
          </h4>

          <div className="space-y-2.5">
            {callbacks.map((cb) => (
              <div
                key={cb.id}
                className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-cyan-400">{cb.provider}</span>
                    <Badge variant="success" className="text-[9px]">Completed ✓</Badge>
                  </div>
                  <h5 className="text-xs font-bold text-white">{cb.title}</h5>
                  <span className="text-[10px] text-slate-400 font-mono block">Nhận lúc: {cb.receivedAt}</span>
                </div>

                {cb.artifactUrl.startsWith('http') ? <a href={cb.artifactUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-cyan-300 border border-slate-800 text-xs flex items-center gap-1 font-semibold"><ExternalLink className="w-3.5 h-3.5" /> File</a> : <span className="p-2 rounded-lg bg-slate-900 text-cyan-300 border border-slate-800 text-xs flex items-center gap-1 font-semibold"><Film className="w-3.5 h-3.5" /> Local artifact</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Right: API Budget & Credits Progress */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Số dư & Hạn mức Ngân sách Cloud APIs
          </h4>

          <div className="space-y-3">
            {credits.map((cr) => (
              <div key={cr.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{cr.providerName}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${cr.usedUsd} / ${cr.monthlyBudgetUsd}
                  </span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(cr.usageRatio * 100, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Còn lại: <strong className="text-white font-mono">${cr.remainingUsd}</strong></span>
                  <span className="text-emerald-400 font-semibold">🟢 An toàn ({Math.round(cr.usageRatio * 100)}% đã dùng)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
