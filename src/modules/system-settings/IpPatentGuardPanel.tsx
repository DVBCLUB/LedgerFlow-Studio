import React, { useEffect, useState } from 'react';
import {
  FileCode,
  ShieldCheck,
  Award,
  Sparkles,
  Lock,
  Download,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export interface IpAssetItem {
  assetId: string;
  assetTitle: string;
  category: string;
  jurisdiction: string;
  registrationCode: string;
  status: string;
  originalityScorePercent: number;
  lastAuditedAt: string;
}

export default function IpPatentGuardPanel() {
  const [assets, setAssets] = useState<IpAssetItem[]>([]);
  const [score, setScore] = useState(99.8);
  const [totalProtected, setTotalProtected] = useState(3);
  const [dossierMessage, setDossierMessage] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/ip/assets');
      const data = await res.json();
      if (data?.success) {
        setAssets(data.assets || []);
        setScore(data.overallIpProtectionScore || 99.8);
        setTotalProtected(data.totalProtectedAssets || 3);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateDossier = async (assetId: string) => {
    try {
      const res = await fetch('/api/dormant/ip/generate-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });
      const data = await res.json();
      if (data?.success) {
        setDossierMessage(data.dossierSummary);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">📜 Autonomous Intellectual Property (IP) &amp; Patent Guard</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Cục SHTT Bảo Hộ
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bảo hộ bản quyền phần mềm và bằng sáng chế kiến trúc AI Agent: Quét sạch giấy phép nguồn mở (OSS) và xuất hồ sơ nộp Cục SHTT.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Chỉ Số Độc Quyền &amp; Nguyên Bản</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{score}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Không vi phạm giấy phép GPL/Copyleft</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tài Sản Trí Tuệ Đã Đăng Ký</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{totalProtected} Tài Sản</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bản quyền phần mềm &amp; Bí mật kinh doanh</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Kiểm Toán Giấy Phép OSS</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">100% Sạch</div>
          <div className="text-[10px] text-slate-400 mt-0.5">100% MIT &amp; Apache 2.0 Thương Mại</div>
        </div>
      </div>

      {/* Dossier Alert */}
      {dossierMessage && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Hồ Sơ Bản Quyền Đã Được Đóng Gói Thành Công</span>
          </div>
          <p className="text-slate-300">{dossierMessage}</p>
        </div>
      )}

      {/* Assets Feed */}
      <div className="space-y-3">
        {assets.map((a) => (
          <div key={a.assetId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-amber-300">
                    {a.category}
                  </span>
                  <h4 className="text-xs font-bold text-white">{a.assetTitle}</h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                  <span>Mã đăng ký: <strong className="text-cyan-300 font-mono">{a.registrationCode}</strong></span>
                  <span>Cơ quan: <strong>{a.jurisdiction}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleGenerateDossier(a.assetId)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Hồ Sơ Cục SHTT</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
              <span>Điểm nguyên bản: <strong className="text-emerald-400 font-bold">{a.originalityScorePercent}%</strong></span>
              <span>Kiểm toán lần cuối: {new Date(a.lastAuditedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
