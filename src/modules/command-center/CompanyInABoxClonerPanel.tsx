import React, { useState, useEffect } from 'react';
import { CompanyClonerOverview, ClonedCompanyEntity } from '../../../server/services/companyInABoxClonerEngine';

export const CompanyInABoxClonerPanel: React.FC = () => {
  const [overview, setOverview] = useState<CompanyClonerOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cloning, setCloning] = useState<boolean>(false);
  const [brandName, setBrandName] = useState<string>('LedgerFlow Vietnam Franchise Hub');
  const [template, setTemplate] = useState<'Micro-SaaS Software' | 'Pixel Game Foundry' | 'Digital Video Production' | 'Accounting & Professional Services'>('Micro-SaaS Software');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/company-cloner/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch company cloner overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleClone = async () => {
    setCloning(true);
    try {
      const res = await fetch('/api/dormant/company-cloner/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, industryTemplate: template })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to clone company-in-a-box', err);
    } finally {
      setCloning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang tải dữ liệu nhân bản công ty con &amp; franchise...</p>
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
              PILLAR 121 — 60-SECOND COMPANY-IN-A-BOX
            </span>
            <span className="text-xs text-slate-400 font-mono">Readiness: {overview?.instantCloneReadinessScorePercent}%</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Company-in-a-Box Cloner &amp; Branch Franchising</h1>
          <p className="text-sm text-slate-400">
            Nhân bản toàn bộ hệ thống (Trang đích, Cổng thanh toán VietQR, AI Swarm, IFRS 15, Sản phẩm) thành một công ty con / chi nhánh độc lập chỉ trong 60 giây.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Micro-SaaS Software">Micro-SaaS Software</option>
            <option value="Pixel Game Foundry">Pixel Game Foundry</option>
            <option value="Digital Video Production">Digital Video Production</option>
            <option value="Accounting & Professional Services">Accounting &amp; Services</option>
          </select>
          <button
            onClick={handleClone}
            disabled={cloning}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {cloning ? 'Đang nhân bản...' : '🚀 1-Click Nhân Bản Công Ty'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Số Chi Nhánh / Công Ty Con</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.totalClonedSubsidiariesCount} Pháp nhân</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Autonomous Franchises</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Doanh Thu Run-Rate Hợp Nhất</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">${overview?.totalClonedRevenueRunRateUsd.toLocaleString()} / Năm</div>
          <div className="text-xs text-slate-400 mt-1">Multi-Entity Consolidation</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tốc Độ Nhân Bản &amp; Triển Khai</div>
          <div className="text-sm font-bold text-white mt-2">&lt; 60 Giây / Toàn Bộ Hệ Thống</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Zero Code &amp; Zero Human Setup</div>
        </div>
      </div>

      {/* Clones List */}
      <div className="space-y-4">
        {overview?.clones.map((c: ClonedCompanyEntity) => (
          <div key={c.companyId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-mono rounded">{c.industryTemplate}</span>
                <span className="text-base font-bold text-white">{c.brandName}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Tên miền: <span className="text-emerald-400">{c.domainName}</span> • {c.clonedModulesCount} modules kế thừa tự động
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-teal-300 font-mono">${c.monthlyRevenueEstUsd.toLocaleString()} / tháng</div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Khởi tạo: {new Date(c.deployedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyInABoxClonerPanel;
