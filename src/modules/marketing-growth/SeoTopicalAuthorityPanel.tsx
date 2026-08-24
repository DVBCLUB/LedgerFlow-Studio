import React, { useEffect, useState } from 'react';
import {
  Search,
  Globe2,
  TrendingUp,
  Link,
  Code2,
  Sparkles,
  Layers,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

export interface SeoTopicCluster {
  clusterId: string;
  pillarKeyword: string;
  clusterSubtopics: string[];
  organicRankAvg: number;
  monthlySearchVolume: number;
  domainAuthorityScore: number;
  contentReadinessPercent: number;
}

export default function SeoTopicalAuthorityPanel() {
  const [clusters, setClusters] = useState<SeoTopicCluster[]>([]);
  const [totalVol, setTotalVol] = useState(0);
  const [authority, setAuthority] = useState(68);
  const [topRankCount, setTopRankCount] = useState(14);
  const [schemaJson, setSchemaJson] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/seo/topical-data');
      const data = await res.json();
      if (data?.success) {
        setClusters(data.clusters || []);
        setTotalVol(data.totalMonthlyVolume || 0);
        setAuthority(data.overallAuthorityScore || 68);
        setTopRankCount(data.topRankKeywordsCount || 14);
      }
    } catch {
      // fallback
    }
  };

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/dormant/seo/schema');
      const data = await res.json();
      if (data?.success) {
        setSchemaJson(data.schemaJson || '');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
    fetchSchema();
  }, []);

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black text-white">🌐 Autonomous SEO Topical Authority &amp; Backlink Graph Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Rank #1 Google
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Xây dựng cụm chủ đề Pillar-Cluster, sinh thẻ Schema JSON-LD cấu trúc và chiếm lĩnh top từ khóa tìm kiếm tự nhiên.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Lượng Tìm Kiếm Tự Nhiên / Tháng</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">
            {totalVol.toLocaleString()} Search/m
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Trải dài trên 3 cụm chủ đề cốt lõi</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Uy Tín Domain (Authority Score)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{authority}/100</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mạng lưới liên kết nội bộ hoàn hảo</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Từ Khóa Top 1 - 3 Google</div>
          <div className="text-2xl font-black text-purple-300 mt-1 font-mono">{topRankCount} Từ Khóa</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Chiếm trọn thị phần tìm kiếm B2B SaaS</div>
        </div>
      </div>

      {/* Topic Clusters Feed */}
      <div className="space-y-4">
        {clusters.map((c) => (
          <div key={c.clusterId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Cụm Chủ Đề Trọng Tâm (Pillar)</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{c.pillarKeyword}</h4>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Thứ hạng trung bình: Top {c.organicRankAvg}
                </span>
                <span className="text-slate-300 font-mono">
                  Volume: {c.monthlySearchVolume.toLocaleString()}/m
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Các Bài Viết Vệ Tinh (Cluster Subtopics):</span>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                {c.clusterSubtopics.map((sub, i) => (
                  <li key={i} className="p-2 rounded bg-white/5 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{sub}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Schema JSON-LD Preview */}
      {schemaJson && (
        <div className="p-4 rounded-xl bg-black/40 border border-white/8 space-y-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Thẻ Cấu Trúc JSON-LD Schema (SoftwareApplication)
            </h3>
          </div>
          <pre className="p-3 rounded-lg bg-[#0a0a10] border border-white/5 font-mono text-[11px] text-cyan-300 overflow-x-auto">
            {schemaJson}
          </pre>
        </div>
      )}
    </div>
  );
}
