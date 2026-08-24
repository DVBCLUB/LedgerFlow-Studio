import React, { useState, useEffect } from 'react';
import { KnowledgeBridgeOverview, KnowledgeSyncItem } from '../../../server/services/notionObsidianKnowledgeBridgeEngine';

export const NotionObsidianKnowledgeBridgePanel: React.FC = () => {
  const [overview, setOverview] = useState<KnowledgeBridgeOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/knowledge-bridge/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch knowledge bridge overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/dormant/knowledge-bridge/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to trigger knowledge sync', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang đồng bộ cầu nối tri thức Notion &amp; Obsidian Vault...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              PILLAR 118 — NOTION &amp; OBSIDIAN BRIDGE
            </span>
            <span className="text-xs text-slate-400 font-mono">Linked Entities: {overview?.totalLinkedEntitiesCount}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Universal Notion, Obsidian &amp; Markdown Second-Brain Bridge</h1>
          <p className="text-sm text-slate-400">
            Đồng bộ 2 chiều các tài liệu Markdown, cơ sở dữ liệu Notion và Obsidian Vault với Semantic Graph của LedgerFlow Studio.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {syncing ? 'Đang đồng bộ...' : '🔄 Đồng Bộ 2 Chiều Notion / Obsidian'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tài Liệu Đã Đồng Bộ</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.totalSyncedNotesCount} Documents</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Notion + Obsidian + Local .md</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Thực Thể Liên Kết Tri Thức</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">
            {overview?.totalLinkedEntitiesCount} Entities
          </div>
          <div className="text-xs text-slate-400 mt-1">Bi-directional Graph Links</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Trạng Thái Cầu Nối Tri Thức</div>
          <div className="text-sm font-bold text-white mt-2">{overview?.bridgeHealthStatus}</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Frontmatter &amp; Wikilinks Preserved</div>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {overview?.items.map((item: KnowledgeSyncItem) => (
          <div key={item.itemId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-mono rounded">{item.sourceType}</span>
                <span className="text-base font-bold text-white">{item.title}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Số từ: {item.wordCount.toLocaleString()} từ • {item.linkedEntitiesCount} thực thể liên kết ngữ nghĩa
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                {item.syncStatus}
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Đồng bộ lúc: {new Date(item.lastSyncedAt).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotionObsidianKnowledgeBridgePanel;
