import React, { useState } from 'react';
import { FileSearch, Loader2, RefreshCw } from 'lucide-react';
import { searchCodebase, reindexCodebase, type SearchResultMatch } from '../../../utils/assistantApi';

interface SearchCodebaseTabProps {
  onEditFile: (relativePath: string) => void;
  pushNotice: (kind: 'success' | 'error', text: string) => void;
}

export default function SearchCodebaseTab({ onEditFile, pushNotice }: SearchCodebaseTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultMatch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [indexingLoading, setIndexingLoading] = useState(false);
  const [indexStats, setIndexStats] = useState<string>('');

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const matches = await searchCodebase(searchQuery.trim()) || [];
      setSearchResults(matches);
      pushNotice('success', `Tìm thấy ${matches.length} kết quả phù hợp.`);
    } catch (err: any) {
      pushNotice('error', `Lỗi tìm kiếm: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const runReindex = async () => {
    setIndexingLoading(true);
    setIndexStats('');
    try {
      const res = await reindexCodebase();
      setIndexStats(`Index thành công: ${res.totalFiles} files (${res.durationMs}ms)`);
      pushNotice('success', `Re-index thành công: ${res.totalFiles} files.`);
    } catch (err: any) {
      setIndexStats(`Lỗi reindex: ${err.message}`);
      pushNotice('error', `Lỗi reindex: ${err.message}`);
    } finally {
      setIndexingLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={runReindex}
            disabled={indexingLoading}
            className="px-3 py-2 bg-bg-primary hover:bg-bg-surface border border-border-primary hover:border-border-secondary text-xs font-bold text-text-secondary rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            title="Tải lại chỉ mục từ khóa của dự án"
          >
            {indexingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Re-index
          </button>
          <div className="flex-1 flex gap-2 bg-bg-primary border border-border-secondary rounded-xl overflow-hidden focus-within:border-violet-500/60 transition-colors">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
              placeholder="Tìm kiếm mã nguồn (TF-IDF)..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none"
            />
            <button
              onClick={runSearch}
              disabled={searchLoading || !searchQuery.trim()}
              className="px-3 text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
            >
              <FileSearch className="h-4 w-4" />
            </button>
          </div>
        </div>
        {indexStats && (
          <p className="text-[10px] font-mono text-text-tertiary">{indexStats}</p>
        )}
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {searchLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-tertiary">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            <span className="text-xs">Đang tìm kiếm...</span>
          </div>
        )}

        {!searchLoading && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-tertiary text-center">
            <FileSearch className="h-8 w-8 opacity-30" />
            <p className="text-xs font-semibold">Nhập từ khóa để tìm kiếm các file code liên quan trong toàn bộ dự án.</p>
          </div>
        )}

        {!searchLoading && searchResults.length > 0 && searchResults.map((match, idx) => (
          <div key={idx} className="bg-bg-primary/60 border border-border-primary/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 truncate font-mono">{match.relativePath}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-950/40 text-violet-300 border border-violet-800/40">
                Score: {match.score.toFixed(3)}
              </span>
            </div>
            {match.snippet && (
              <pre className="p-2 rounded bg-slate-950/80 border border-border-primary font-mono text-[10px] leading-4 text-text-secondary overflow-x-auto whitespace-pre">
                {match.snippet}
              </pre>
            )}
            <button
              onClick={() => onEditFile(match.relativePath)}
              className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Mở trong Edit →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
