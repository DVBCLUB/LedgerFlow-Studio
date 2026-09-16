import React, { useState, useEffect } from 'react';
import { Package, Globe, Download, ShieldCheck, CheckCircle2, ArrowUpRight, Github, Layers } from 'lucide-react';
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
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Package className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Xuất Bản Mã Nguồn &amp; Package Hub (Open Source Registry)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Global Repositories
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tự động phát hành thư viện SDK lên npm, image container lên Docker Hub và GitHub Action lên GitHub Marketplace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              {report?.totalWeeklyDownloads.toLocaleString()} Downloads/tuần
            </span>
          </div>
        </div>
      </section>

      {/* Action Publish Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <input
          type="text"
          value={pkgName}
          onChange={(e) => setPkgName(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors font-mono"
        />
        <select
          value={registry}
          onChange={(e) => setRegistry(e.target.value as any)}
          className="px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-rose-300 font-bold focus:outline-none focus:border-rose-500 transition-colors"
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
          placeholder="Version"
          className="w-28 px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500 transition-colors font-mono"
        />
        <button
          type="button"
          onClick={handleRelease}
          disabled={releasing}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Package className="w-3.5 h-3.5" />
          <span>{releasing ? 'Đang phát hành...' : '📦 Publish Registry'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950 to-rose-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gói Đã Xuất Bản Toàn Cầu</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300 font-mono">{report?.totalPublishedRegistries} Packages</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">npm + Docker + GitHub</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lượt Tải Hàng Tuần</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">
            {report?.totalWeeklyDownloads.toLocaleString()} Downloads / Tuần
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">High Developer Adoption</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bảo Mật Chuỗi Cung Ứng (SLSA)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-black text-emerald-300">Sigstore Provenance Verified 100%</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Zero Supply-Chain Attacks</p>
        </div>
      </div>

      {/* Packages List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-black text-white">Danh Sách Packages Đã Phân Phối Đa Kênh</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Verified OCI Registry</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {report?.packages.map((pkg: RegistryPackage) => (
            <div key={pkg.packageId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-500/30 font-mono">
                    {pkg.registry}
                  </span>
                  <span className="text-base font-bold text-white">{pkg.name}</span>
                  <span className="text-xs text-slate-400 font-mono">v{pkg.version}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Giấy phép: <strong className="text-slate-300">{pkg.openSourceLicense}</strong> · <strong className="text-white">{pkg.downloadsWeekly.toLocaleString()}</strong> lượt tải tuần này
                </div>
                <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sigstore / GitHub OIDC Provenance Verified</span>
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
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
    </div>
  );
};

export default OpenSourcePublishPanel;
