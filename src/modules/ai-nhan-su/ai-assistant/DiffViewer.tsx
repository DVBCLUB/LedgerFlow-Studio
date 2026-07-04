import React from 'react';
import { Code2 } from 'lucide-react';

interface DiffViewerProps {
  diff: string;
}

export default function DiffViewer({ diff }: DiffViewerProps) {
  if (!diff) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-text-tertiary gap-2">
        <Code2 className="h-8 w-8 opacity-30" />
        <span className="text-xs font-semibold">Chưa có diff. Hãy chọn Edit một file trước.</span>
      </div>
    );
  }

  const lines = diff.split('\n');
  return (
    <div className="font-mono text-[11px] leading-5 overflow-x-auto">
      {lines.map((line, i) => {
        let cls = 'text-text-secondary';
        let bg = '';
        if (line.startsWith('+++') || line.startsWith('---')) {
          cls = 'text-text-secondary font-bold';
          bg = 'bg-bg-surface/60';
        } else if (line.startsWith('@@')) {
          cls = 'text-cyan-400 font-bold';
          bg = 'bg-cyan-950/40';
        } else if (line.startsWith('+')) {
          cls = 'text-emerald-400';
          bg = 'bg-emerald-950/30';
        } else if (line.startsWith('-')) {
          cls = 'text-rose-400';
          bg = 'bg-rose-950/30';
        }
        return (
          <div key={i} className={`px-3 py-0.5 ${bg} whitespace-pre`}>
            <span className={cls}>{line || ' '}</span>
          </div>
        );
      })}
    </div>
  );
}
