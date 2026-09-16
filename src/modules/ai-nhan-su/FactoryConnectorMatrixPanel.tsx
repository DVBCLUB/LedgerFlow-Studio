import React from 'react';
import { Network, CheckCircle2, Shield, Radio, Terminal, Laptop } from 'lucide-react';

interface ConnectorItem {
  id: string;
  name: string;
  category: 'IDE / Editor' | 'Cloud AI Model' | 'Local / Open Engine';
  status: 'Ready' | 'Connected' | 'Standby';
  latencyMs: number;
}

const CONNECTORS: ConnectorItem[] = [
  { id: 'antigravity', name: 'Antigravity IDE Bridge', category: 'IDE / Editor', status: 'Connected', latencyMs: 12 },
  { id: 'cursor', name: 'Cursor Rules Connector', category: 'IDE / Editor', status: 'Ready', latencyMs: 15 },
  { id: 'claude-code', name: 'Claude Code CLI Agent', category: 'IDE / Editor', status: 'Connected', latencyMs: 24 },
  { id: 'vscode', name: 'VS Code Extension Bridge', category: 'IDE / Editor', status: 'Ready', latencyMs: 18 },
  { id: 'gemini', name: 'Google Gemini 2.5 Pro', category: 'Cloud AI Model', status: 'Connected', latencyMs: 180 },
  { id: 'deepseek', name: 'DeepSeek R1 / V3 Reasoning', category: 'Cloud AI Model', status: 'Connected', latencyMs: 210 },
  { id: 'bytedance', name: 'Doubao Vision 4K', category: 'Cloud AI Model', status: 'Connected', latencyMs: 165 },
  { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder ($0 Token)', category: 'Local / Open Engine', status: 'Connected', latencyMs: 8 },
  { id: 'free-blender', name: 'Blender 4.2 3D Native Robot', category: 'Local / Open Engine', status: 'Connected', latencyMs: 5 },
  { id: 'free-ffmpeg', name: 'FFmpeg 4K Hardware Pipeline', category: 'Local / Open Engine', status: 'Connected', latencyMs: 4 },
];

export function FactoryConnectorMatrixPanel() {
  return (
    <div className="rounded-2xl border border-border-primary bg-slate-950/80 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between border-b border-border-secondary/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Ma Trận Connector & Mô Hình (Connector Matrix)</h3>
            <p className="text-xs text-text-tertiary">Đấu nối toàn bộ công cụ IDE, mô hình AI và robot đồ họa / video</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
          <Radio className="h-3 w-3 animate-pulse" />
          10 Connectors Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CONNECTORS.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-border-secondary/60 bg-slate-900/40 p-3 hover:bg-slate-900/80 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-cyan-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-xs text-text-primary">{c.name}</div>
                <div className="text-[10px] text-text-tertiary">{c.category}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] text-text-tertiary">{c.latencyMs}ms</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FactoryConnectorMatrixPanel;
