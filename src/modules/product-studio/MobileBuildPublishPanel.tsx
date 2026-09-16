import React, { useState, useEffect } from 'react';
import { Smartphone, Apple, CheckCircle2, ShieldCheck, Download, Package, ArrowUpRight } from 'lucide-react';
import { MobilePublishReport, MobileBuildArtifact } from '../../../server/services/mobileBuildPublishEngine';

export const MobileBuildPublishPanel: React.FC = () => {
  const [report, setReport] = useState<MobilePublishReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('LedgerFlow Mobile Companion');
  const [platform, setPlatform] = useState<'android_aab' | 'ios_ipa' | 'pwa_twa'>('android_aab');

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/dormant/mobile-publish/report');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch mobile publish report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/dormant/mobile-publish/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appTitle: appName, platform })
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Failed to trigger mobile publish', err);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang tải trạm đóng gói & xuất bản Google Play / App Store...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Smartphone className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Trạm Đóng Gói Ứng Dụng Di Động (Mobile App Store Pipeline)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Android &amp; iOS
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tự động đóng gói APK/AAB (Google Play) &amp; IPA (Apple App Store TestFlight), ký số chứng chỉ và đẩy metadata lên kho ứng dụng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              {report?.liveOnStoresCount} Live Packages
            </span>
          </div>
        </div>
      </section>

      {/* Action Publish Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <input
          type="text"
          placeholder="Tên ứng dụng di động..."
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as any)}
          className="px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-blue-300 font-mono focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="android_aab">Android App Bundle (.AAB)</option>
          <option value="ios_ipa">iOS TestFlight (.IPA)</option>
          <option value="pwa_twa">PWA Trusted Web Activity (TWA)</option>
        </select>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Package className="w-3.5 h-3.5" />
          <span>{publishing ? 'Đang đóng gói...' : '📱 Đóng Gói & Xuất Bản'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bản Build Đã Sẵn Sàng</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            {report?.totalBuildsCount} Bản Builds
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Signed &amp; Store-Ready</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kho Ứng Dụng Hỗ Trợ</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-indigo-300">
            Google Play + iOS + PWA
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Cross-platform auto-signing</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dung Lượng Tối Ưu TB</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">
            &lt; 20 MB
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Tree-shaken ProGuard Binary</p>
        </div>
      </div>

      {/* Builds List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-black text-white">Danh Sách Gói Cài Đặt Di Động Đã Xuất Bản (Artifact Registry)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Signed Binary Registry</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {report?.builds.map((b: MobileBuildArtifact) => (
            <div key={b.buildId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-500/30 font-mono">
                    {b.targetStore}
                  </span>
                  <span className="text-base font-bold text-white">{b.appTitle} (v{b.version})</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Bundle ID: <span className="text-blue-300">{b.bundleId}</span> · Kích thước: <strong className="text-white">{b.downloadSizeMb} MB</strong>
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate max-w-md">
                  Chữ ký số: {b.signedCertificateSha256}
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {b.buildStatus.replace(/_/g, ' ')}
                </span>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  {b.publishedAt ? new Date(b.publishedAt).toLocaleString('vi-VN') : 'Đang xử lý'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileBuildPublishPanel;

