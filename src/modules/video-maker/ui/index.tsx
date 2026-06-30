import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Video, Settings2, Cpu } from 'lucide-react';

export default function VideoMakerPanel() {
  const [status, setStatus] = useState<string>('Loading...');
  const [engine, setEngine] = useState<string>('');

  useEffect(() => {
    fetch('/api/video-maker/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus(data.status);
          setEngine(data.engine);
        } else {
          setStatus('Failed to load status');
        }
      })
      .catch((err) => {
        setStatus(`Error: ${err.message}`);
      });
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-6 text-slate-100">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-300/20">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300">
              Auto-Registered Dynamic Module
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">Video Creator Studio</h1>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              Thiết kế video marketing, review sản phẩm và AI Voiceover tự động bằng AI Agent.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-violet-400" /> Trạng thái Backend
            </h3>
            <div className="space-y-1.5 text-xs">
              <p className="text-slate-400">
                Status: <span className="font-bold text-emerald-400">{status}</span>
              </p>
              <p className="text-slate-400">
                Engine: <span className="font-bold text-cyan-300">{engine || 'None'}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 col-span-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" /> Tác vụ AI Video Creator
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nhập ý tưởng sản phẩm dưới dạng prompt hoặc văn bản kịch bản, AI Agent của bạn sẽ tự động phân tích tính năng, tạo kịch bản phân cảnh, sinh giọng đọc (text-to-speech) và ghép nối thành video clip demo.
            </p>
            <button className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-600 active:scale-95">
              <Play className="h-3.5 w-3.5 fill-white" /> Tạo Video Demo mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
