import React, { useState } from 'react';
import { Bot, Globe, CheckCircle2, DollarSign, Play, Sparkles, ExternalLink, Zap, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface WebRobotProfile {
  id: string;
  name: string;
  targetWebUrl: string;
  platformCategory: string;
  status: string;
  totalTasksExecuted: number;
  apiDollarsSavedUsd: number;
  lastActionAt: string;
}

export default function DirectWebRobotAutomationPanel() {
  const [robots, setRobots] = useState<WebRobotProfile[]>([
    {
      id: 'robot_tiktok_web',
      name: 'TikTok Studio Web Robot',
      targetWebUrl: 'https://tiktok.com/studio',
      platformCategory: 'tiktok_web',
      status: 'logged_in',
      totalTasksExecuted: 68,
      apiDollarsSavedUsd: 136.0,
      lastActionAt: 'Vừa xong',
    },
    {
      id: 'robot_youtube_web',
      name: 'YouTube Studio Web Robot',
      targetWebUrl: 'https://studio.youtube.com',
      platformCategory: 'youtube_web',
      status: 'logged_in',
      totalTasksExecuted: 94,
      apiDollarsSavedUsd: 188.0,
      lastActionAt: '15 phút trước',
    },
    {
      id: 'robot_runway_web',
      name: 'Runway ML Web Studio Robot',
      targetWebUrl: 'https://app.runwayml.com',
      platformCategory: 'runway_web',
      status: 'logged_in',
      totalTasksExecuted: 42,
      apiDollarsSavedUsd: 210.0,
      lastActionAt: '30 phút trước',
    },
    {
      id: 'robot_chatgpt_web',
      name: 'ChatGPT & Claude Web UI Robot',
      targetWebUrl: 'https://chatgpt.com',
      platformCategory: 'chatgpt_web',
      status: 'logged_in',
      totalTasksExecuted: 185,
      apiDollarsSavedUsd: 370.0,
      lastActionAt: '1 giờ trước',
    },
  ]);

  const [execStatus, setExecStatus] = useState<string | null>(null);

  const totalSavedUsd = robots.reduce((sum, r) => sum + r.apiDollarsSavedUsd, 0);

  const handleRunRobot = (robot: WebRobotProfile) => {
    setRobots((prev) =>
      prev.map((r) =>
        r.id === robot.id
          ? {
              ...r,
              totalTasksExecuted: r.totalTasksExecuted + 1,
              apiDollarsSavedUsd: Math.round((r.apiDollarsSavedUsd + 2.0) * 100) / 100,
              lastActionAt: 'Vừa xong',
            }
          : r
      )
    );

    setExecStatus(`Robot "${robot.name}" đã hoàn tất tự động hóa trực tiếp trên Web (${robot.targetWebUrl}). Tiết kiệm +$2.00 phí API!`);
    setTimeout(() => setExecStatus(null), 3500);
  };

  return (
    <Card className="p-5 bg-slate-900 border-cyan-500/20 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Bộ Điều Phối Robot Thao Tác Web Trực Tiếp (Direct Web RPA)
              <Badge variant="success">100% Zero-API Cost</Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Robot phần mềm tự động gõ prompt, nạp file, đăng bài trực tiếp trên giao diện Web thực tế.
            </p>
          </div>
        </div>

        {/* Total API Dollars Saved */}
        <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-emerald-400" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tổng Phí API Đã Tiết Kiệm</span>
            <span className="text-sm font-black text-emerald-400 font-mono">${totalSavedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
          </div>
        </div>
      </div>

      {execStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{execStatus}</span>
        </div>
      )}

      {/* Robot Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {robots.map((robot) => (
          <div
            key={robot.id}
            className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="cyan" className="text-[9px] font-mono">
                  <Globe className="w-3 h-3 inline mr-1" /> Web RPA
                </Badge>
                <Badge variant="success" className="text-[9px]">🟢 Logged-In Web</Badge>
              </div>

              <h4 className="text-xs font-bold text-white leading-snug">{robot.name}</h4>
              
              <a
                href={robot.targetWebUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] text-cyan-400 hover:underline flex items-center gap-1 font-mono truncate block"
              >
                <ExternalLink className="w-3 h-3 shrink-0" /> {robot.targetWebUrl}
              </a>

              <div className="p-2 bg-slate-900 rounded-lg text-[10px] text-slate-400 space-y-1 font-mono">
                <div>Đã thao tác: <strong className="text-white">{robot.totalTasksExecuted} lượt</strong></div>
                <div>Tiết kiệm API: <strong className="text-emerald-400">${robot.apiDollarsSavedUsd.toFixed(2)}</strong></div>
                <div>Lần chạy cuối: <span className="text-slate-300">{robot.lastActionAt}</span></div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => handleRunRobot(robot)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-1.5 flex items-center justify-center gap-1.5 mt-2"
            >
              <Play className="w-3.5 h-3.5" /> Chạy Robot Web Trực tiếp
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
