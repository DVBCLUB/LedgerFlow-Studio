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
  Award,
  BarChart3,
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
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Search className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Xếp Hạng Tìm Kiếm &amp; Cụm Chủ Đề (SEO Topical Authority Hub)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Rank #1 Google
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Xây dựng cụm chủ đề Pillar-Cluster, sinh thẻ Schema JSON-LD cấu trúc và chiếm lĩnh top từ khóa tìm kiếm tự nhiên.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {topRankCount} Từ Khóa Top 1 - 3
            </span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lượng Tìm Kiếm Tự Nhiên / Tháng</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">
            {totalVol.toLocaleString()} Search/m
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Trải dài trên 3 cụm chủ đề cốt lõi</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Uy Tín Domain (DA Score)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">{authority}/100</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">Mạng lưới liên kết nội bộ hoàn hảo</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Từ Khóa Top 1 - 3 Google</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">{topRankCount} Từ Khóa</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Chiếm trọn thị phần tìm kiếm B2B SaaS</p>
        </div>
      </div>

      {/* Topic Clusters Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-black text-white">Cụm Chủ Đề Trọng Tâm &amp; Bài Viết Vệ Tinh (Pillar-Cluster Graph)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Organic Dominance</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {clusters.map((c) => (
            <div key={c.clusterId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Cụm Chủ Đề Trọng Tâm (Pillar)</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{c.pillarKeyword}</h4>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black uppercase text-[10px] tracking-wider border border-emerald-500/30">
                    Thứ hạng TB: Top {c.organicRankAvg}
                  </span>
                  <span className="text-slate-300 font-mono">
                    Volume: <strong className="text-white">{c.monthlySearchVolume.toLocaleString()}/m</strong>
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Các Bài Viết Vệ Tinh (Cluster Subtopics):</span>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                  {c.clusterSubtopics.map((sub, i) => (
                    <li key={i} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schema JSON-LD Preview */}
      {schemaJson && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Thẻ Cấu Trúc JSON-LD Schema (SoftwareApplication)
            </h3>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
            {schemaJson}
          </pre>
        </div>
      )}
    </div>
  );
}

