import React, { useState } from 'react';
import {
  Mic,
  Send,
  Database,
  Code2,
  Table as TableIcon,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface NLQueryResponse {
  queryId: string;
  nlPrompt: string;
  generatedSql: string;
  explanation: string;
  suggestedChartType: string;
  dataRows: Array<Record<string, any>>;
  executionTimeMs: number;
  generatedAt: string;
}

export default function NLToSqlDataPanel() {
  const [prompt, setPrompt] = useState('Doanh thu tháng này theo từng khối kinh doanh');
  const [queryResult, setQueryResult] = useState<NLQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (queryText?: string) => {
    const textToRun = queryText || prompt;
    if (!textToRun.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/dormant/bi/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToRun }),
      });
      const data = await res.json();
      if (data?.success && data?.result) {
        setQueryResult(data.result);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-white">💬 Natural Language Voice-to-SQL Business Intelligence</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Read-Only Sandboxed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đặt câu hỏi bằng tiếng Việt tự nhiên để truy vấn cơ sở dữ liệu doanh nghiệp và xuất biểu đồ phân tích tức thì.
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Hỏi bất kỳ điều gì: Doanh thu theo khối, top 5 chi phí lớn nhất, v.v..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <button
          onClick={() => handleQuery()}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition disabled:opacity-50"
        >
          <Send className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
          <span>{loading ? 'Đang truy vấn...' : 'Truy Vấn'}</span>
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-slate-400 text-[11px] self-center">Gợi ý mẫu:</span>
        <button
          onClick={() => {
            setPrompt('Doanh thu tháng này theo từng khối kinh doanh');
            handleQuery('Doanh thu tháng này theo từng khối kinh doanh');
          }}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] cursor-pointer"
        >
          📊 Doanh thu theo khối
        </button>
        <button
          onClick={() => {
            setPrompt('Top 5 chi phí vận hành lớn nhất trong tháng');
            handleQuery('Top 5 chi phí vận hành lớn nhất trong tháng');
          }}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] cursor-pointer"
        >
          🔥 Top 5 chi phí GPU &amp; Cloud lớn nhất
        </button>
      </div>

      {/* Result Display */}
      {queryResult && (
        <div className="p-4 rounded-xl bg-black/40 border border-white/8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 italic">{queryResult.explanation}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              Thời gian thực thi: {queryResult.executionTimeMs}ms
            </span>
          </div>

          {/* Generated SQL */}
          <div className="p-3 rounded-lg bg-[#0a0a10] border border-white/5 font-mono text-[11px] text-cyan-300">
            <div className="text-[9px] text-slate-400 uppercase mb-1">Generated SQL Query:</div>
            {queryResult.generatedSql}
          </div>

          {/* Data Table Output */}
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/5 text-slate-400">
                <tr>
                  {Object.keys(queryResult.dataRows[0] || {}).map((col) => (
                    <th key={col} className="p-2.5 capitalize">{col.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {queryResult.dataRows.map((row, i) => (
                  <tr key={i} className="hover:bg-white/2">
                    {Object.values(row).map((val: any, vi) => (
                      <td key={vi} className="p-2.5 font-mono">
                        {typeof val === 'number' ? formatMoneyVN(val, ' đ') : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
