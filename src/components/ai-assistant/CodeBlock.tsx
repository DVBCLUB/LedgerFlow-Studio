import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 my-2">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-200 transition-colors">
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] leading-5 text-slate-300 font-mono">{code}</pre>
    </div>
  );
}
