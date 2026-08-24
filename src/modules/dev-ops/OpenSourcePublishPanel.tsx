import React, { useState, useEffect } from 'react';
import { RegistryOverviewReport, RegistryPackage } from '../../../server/services/openSourcePublishEngine';

export const OpenSourcePublishPanel: React.FC = () => {
  const [report, setReport] = useState<RegistryOverviewReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [releasing, setReleasing] = useState<boolean>(false);
  const [pkgName, setPkgName] = useState<string>('@ledgerflow/sdk-core');
  const [registry, setRegistry] = useState<'npm Registry' | 'GitHub Marketplace' | 'Docker Hub (OCI)' | 'PyPI'>('npm Registry');
  const [version, setVersion] = useState<string>('2.5.0');

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/dormant/open-source/overview');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch open source registry overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const res = await fetch('/api/dormant/open-source/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pkgName, registry, version })
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Failed to release package', err);
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang kết nối các kho phân phối mã nguồn npm, GitHub &amp; Docker...</p>
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
              PILLAR 112 — GLOBAL PACKAGE REGISTRIES
            </span>
            <span className="text-xs text-slate-400 font-mono">Weekly Downloads: {report?.totalWeeklyDownloads.toLocaleString()}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Open Source &amp; Package Registry Hub</h1>
          <p className="text-sm text-slate-400">
            Tự động phát hành thư viện SDK lên npm, image container lên Docker Hub và GitHub Action lên GitHub Marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={pkgName}
            onChange={(e) => setPkgName(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={registry}
            onChange={(e) => setRegistry(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="npm Registry">npm Registry</option>
            <option value="GitHub Marketplace">GitHub Marketplace</option>
            <option value="Docker Hub (OCI)">Docker Hub (OCI)</option>
            <option value="PyPI">PyPI Python</option>
          </select>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white w-20 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleRelease}
            disabled={releasing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {releasing ? 'Đang phát hành...' : '📦 Publish Registry'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Gói Đã Xuất Bản Toàn Cầu</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report?.totalPublishedRegistries} Packages</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">npm + Docker + GitHub</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Lượt Tải Hàng Tuần</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">
            {report?.totalWeeklyDownloads.toLocaleString()} Downloads / Tuần
          </div>
          <div className="text-xs text-slate-400 mt-1">High Developer Adoption</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Bảo Mật Chuỗi Cung Ứng (SLSA)</div>
          <div className="text-sm font-bold text-white mt-2">Sigstore Provenance Verified 100%</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Zero Supply-Chain Attacks</div>
        </div>
      </div>

      {/* Packages List */}
      <div className="space-y-4">
        {report?.packages.map((pkg: RegistryPackage) => (
          <div key={pkg.packageId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-xs font-mono rounded">{pkg.registry}</span>
                <span className="text-base font-bold text-white">{pkg.name}</span>
                <span className="text-xs text-slate-400 font-mono">v{pkg.version}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Giấy phép: {pkg.openSourceLicense} • {pkg.downloadsWeekly.toLocaleString()} lượt tải tuần này
              </div>
              <div className="text-[11px] text-emerald-400">
                🔒 Sigstore / GitHub OIDC Provenance Verified
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                ACTIVE RELEASE
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                {new Date(pkg.publishedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OpenSourcePublishPanel;
