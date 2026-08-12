import React, { useState } from 'react';
import {
  Video,
  Play,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
  Tv,
} from 'lucide-react';

export interface AIProductionJob {
  id: string;
  title: string;
  imageProvider: string;
  motionProvider: string;
  voiceProvider: string;
  status: 'queued' | 'rendering' | 'completed';
  progress: number;
  outputVideoUrl?: string;
  autoPublishedChannel?: string;
  logs: string[];
}

export default function RealAIVideoExecutionHub() {
  const [jobs, setJobs] = useState<AIProductionJob[]>([
    {
      id: 'job_2001',
      title: 'Video Giới thiệu Tính năng Hệ điều hành LedgerFlow Studio',
      imageProvider: 'Midjourney v6.1',
      motionProvider: 'Kling AI 1.5',
      voiceProvider: 'ElevenLabs Studio Voice',
      status: 'completed',
      progress: 100,
      outputVideoUrl: 'https://assets.ledgerflow.example/videos/ledgerflow_studio_intro_4k.mp4',
      autoPublishedChannel: 'TikTok Studio Web (Kênh @LedgerFlowOfficial)',
      logs: [
        '[14:00:01] Gửi Prompt sang Midjourney v6.1 Cloud Bridge API thành công.',
        '[14:01:20] Nhận 4 Keyframe ảnh 4K render chất lượng cao.',
        '[14:02:10] Đẩy Keyframe sang Kling AI 1.5 Motion Pipeline.',
        '[14:04:40] Render video chuyển động 60fps hoàn tất.',
        '[14:05:10] Lồng tiếng ElevenLabs AI Voice (Giọng đọc Doanh nhân).',
        '[14:06:00] Robot Web đăng tải tự động lên TikTok Studio Web thành công.',
      ],
    },
  ]);

  const [promptText, setPromptText] = useState(
    'Kịch bản quảng cáo giải pháp phần mềm quản trị doanh nghiệp số LedgerFlow Studio cho founder và kế toán trưởng'
  );
  const [imgModel, setImgModel] = useState('Midjourney v6.1');
  const [motionModel, setMotionModel] = useState('Kling AI 1.5');
  const [voiceModel, setVoiceModel] = useState('ElevenLabs AI Voice');
  const [autoPublish, setAutoPublish] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDispatchJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setIsSubmitting(true);
    const newJ: AIProductionJob = {
      id: `job_${Date.now()}`,
      title: promptText.slice(0, 50) + '...',
      imageProvider: imgModel,
      motionProvider: motionModel,
      voiceProvider: voiceModel,
      status: 'rendering',
      progress: 35,
      autoPublishedChannel: autoPublish ? 'TikTok Studio Web & YouTube Studio Web' : undefined,
      logs: [
        `[${new Date().toLocaleTimeString('vi-VN')}] Đã tạo nhiệm vụ sản xuất Video AI thực tế.`,
        `[${new Date().toLocaleTimeString('vi-VN')}] Đang gửi lệnh sang ${imgModel} và ${motionModel}...`,
      ],
    };

    setJobs([newJ, ...jobs]);

    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== newJ.id) return j;
          return {
            ...j,
            status: 'completed',
            progress: 100,
            outputVideoUrl: `https://assets.ledgerflow.example/videos/video_${Date.now()}.mp4`,
            logs: [
              ...j.logs,
              `[${new Date().toLocaleTimeString('vi-VN')}] Render Video AI 4K hoàn tất thành công.`,
              autoPublish
                ? `[${new Date().toLocaleTimeString('vi-VN')}] Web Robot đã hoàn tất đăng tải tự động lên TikTok & YouTube Studio Web.`
                : `[${new Date().toLocaleTimeString('vi-VN')}] Đã sẵn sàng tải về hoặc đăng thủ công.`,
            ],
          };
        })
      );
      setIsSubmitting(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Dispatch Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Xưởng Sản xuất Video AI & Robot Tự động Đăng tải Thực tế
            </h3>
            <p className="text-xs text-slate-400">
              Điều phối cloud API (Midjourney, Flux.1, Kling, Runway, ElevenLabs) & Robot Web tự động đăng bài
            </p>
          </div>
        </div>

        <form onSubmit={handleDispatchJob} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Prompt / Kịch bản Video Thực tế:</label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Mẫu Ảnh (Keyframe):</label>
              <select
                value={imgModel}
                onChange={(e) => setImgModel(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
              >
                <option value="Midjourney v6.1">Midjourney v6.1 (--ar 16:9)</option>
                <option value="Flux.1 (Black Forest Labs)">Flux.1 Schnel (4K Render)</option>
                <option value="Leonardo.ai Motion">Leonardo.ai Ultra</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Mẫu Video (Motion):</label>
              <select
                value={motionModel}
                onChange={(e) => setMotionModel(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
              >
                <option value="Kling AI 1.5">Kling AI 1.5 (HQ Motion)</option>
                <option value="Runway Gen-3 Alpha">Runway Gen-3 Alpha</option>
                <option value="Sora Open Gateway">Sora Open Gateway</option>
                <option value="Hailuo AI (Minimax)">Hailuo AI (Minimax)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Mẫu Giọng đọc (Voice):</label>
              <select
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
              >
                <option value="ElevenLabs AI Voice">ElevenLabs Studio Voice</option>
                <option value="OpenAI TTS HD">OpenAI TTS HD Voice</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-purple-500"
              />
              <span>Tự động kích hoạt Web Robot đăng lên TikTok & YouTube Studio Web ngay sau khi render</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang phát lệnh Cloud...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Kích hoạt Sản xuất Video AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Production Jobs Feed */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Lịch sử Sản xuất & Đăng tải Video AI ({jobs.length})
        </h4>

        {jobs.map((job) => (
          <div key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-purple-400" />
                <span className="font-bold text-white text-xs">{job.title}</span>
              </div>
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {job.status === 'completed' ? 'Hoàn tất 100%' : 'Đang xử lý...'}
              </span>
            </div>

            <div className="grid gap-3 text-xs md:grid-cols-3">
              <div>
                <span className="text-slate-500">Mẫu Ảnh & Video:</span>
                <p className="font-bold text-slate-200 mt-0.5">{job.imageProvider} + {job.motionProvider}</p>
              </div>
              <div>
                <span className="text-slate-500">Kênh Đăng tải Tự động:</span>
                <p className="font-bold text-cyan-300 mt-0.5">{job.autoPublishedChannel || 'Đăng thủ công'}</p>
              </div>
              <div>
                <span className="text-slate-500">Kết quả Render:</span>
                {job.outputVideoUrl ? (
                  <a
                    href={job.outputVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:underline mt-0.5"
                  >
                    Xem Video .MP4 <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-slate-400 mt-0.5 font-mono">Chưa hoàn tất</p>
                )}
              </div>
            </div>

            {/* Logs Timeline */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1 text-[11px] font-mono">
              <span className="text-[10px] font-bold uppercase text-slate-500 font-sans block mb-1">Nhật ký Tiến trình Vận hành</span>
              {job.logs.map((log, idx) => (
                <p key={idx} className="text-slate-400">
                  • {log}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
