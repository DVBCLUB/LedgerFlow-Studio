import React, { useState, useEffect } from 'react';
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
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              PILLAR 110 — MOBILE APP STORE PIPELINE
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Packages: {report?.liveOnStoresCount}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Mobile Build & Store Publish</h1>
          <p className="text-sm text-slate-400">
            Tự động đóng gói APK/AAB (Google Play) &amp; IPA (Apple App Store TestFlight), ký số chứng chỉ và đẩy metadata lên kho ứng dụng.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="android_aab">Android (.AAB)</option>
            <option value="ios_ipa">iOS (.IPA)</option>
            <option value="pwa_twa">PWA (TWA)</option>
          </select>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {publishing ? 'Đang đóng gói...' : '📱 Đóng Gói & Xuất Bản'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Bản Build Đã Sẵn Sàng</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report?.totalBuildsCount}</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Signed &amp; Store-Ready</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Kho Ứng Dụng Hỗ Trợ</div>
          <div className="text-sm font-bold text-white mt-2">Google Play + Apple App Store + PWA</div>
          <div className="text-xs text-slate-400 mt-1">Cross-platform auto-signing</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Dung Lượng Tối Ưu Trung Bình</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">&lt; 20 MB</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Tree-shaken ProGuard Binary</div>
        </div>
      </div>

      {/* Builds List */}
      <div className="space-y-4">
        {report?.builds.map((b: MobileBuildArtifact) => (
          <div key={b.buildId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono rounded uppercase">{b.targetStore}</span>
                <span className="text-base font-bold text-white">{b.appTitle} (v{b.version})</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">Bundle ID: {b.bundleId} • Kích thước: {b.downloadSizeMb} MB</div>
              <div className="text-[11px] text-slate-500 font-mono">Chữ ký số: {b.signedCertificateSha256}</div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
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
  );
};

export default MobileBuildPublishPanel;
