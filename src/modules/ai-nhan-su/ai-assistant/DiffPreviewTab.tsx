import React from 'react';
import { Code2, Loader2 } from 'lucide-react';
import DiffViewer from './DiffViewer';

interface DiffPreviewTabProps {
  diffContent: string;
  diffLoading: boolean;
}

export default function DiffPreviewTab({ diffContent, diffLoading }: DiffPreviewTabProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary shrink-0">
        <div className="text-xs font-black text-text-secondary flex items-center gap-1.5">
          <Code2 className="h-3.5 w-3.5" /> Unified Diff Preview
        </div>
        {diffLoading && <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />}
      </div>
      <div className="flex-1 overflow-auto">
        {diffContent ? (
          <DiffViewer diff={diffContent} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-tertiary p-8 text-center">
            <Code2 className="h-10 w-10 opacity-20" />
            <p className="text-xs font-semibold">
              Diff sẽ tự động xuất hiện sau khi bạn tạo đề xuất AI ở tab <strong className="text-text-secondary">Edit File</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
