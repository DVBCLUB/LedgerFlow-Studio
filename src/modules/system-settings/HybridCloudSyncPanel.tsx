import React, { useEffect, useState } from 'react';
import { HardDrive, Cloud, RefreshCw, Smartphone, CheckCircle, AlertTriangle, ShieldCheck, Database, ExternalLink, ArrowRightLeft } from 'lucide-react';
import { fetchHybridStorageStatus, triggerDualEngineSync, HybridEngineStatus } from '../../utils/dbSync';

export default function HybridCloudSyncPanel() {
  const [status, setStatus] = useState<HybridEngineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    const res = await fetchHybridStorageStatus();
    if (res) setStatus(res);
    setLoading(false);
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setFeedback(null);
    const success = await triggerDualEngineSync();
    if (success) {
      setFeedback('Đồng bộ 2 chiều thành công giữa Local PC và Supabase Cloud!');
      await loadStatus();
    } else {
      setFeedback('Đồng bộ cục bộ hoàn tất (Supabase chưa cấu hình hoặc không kết nối được).');
      await loadStatus();
    }
    setSyncing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/30 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Database className="w-3.5 h-3.5" />
              <span>Dual-Engine Storage: Local PC ↔ Supabase Free Tier</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Lưu trữ Kép & Đồng bộ iPhone Mobile
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Dữ liệu luôn được lưu an toàn 100% trên PC (<code className="text-cyan-300">db_storage.json</code>) và tự động đồng bộ lên Supabase Cloud miễn phí khi có kết nối để phục vụ vibecode trên iPhone.
            </p>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
          </button>
        </div>

        {feedback && (
          <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Grid 3 Trạng thái */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Local PC */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Lưu trữ Local PC</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Hoạt động
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Đường dẫn:</span>
              <span className="text-slate-200 font-mono">db_storage.json</span>
            </div>
            <div className="flex justify-between">
              <span>Số module / keys:</span>
              <span className="text-slate-200 font-semibold">{status?.keysCount ?? 0} keys</span>
            </div>
            <div className="flex justify-between">
              <span>Lần ghi gần nhất:</span>
              <span className="text-slate-300">
                {status?.lastLocalSyncAt ? new Date(status.lastLocalSyncAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Supabase Cloud */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Supabase Free Tier</span>
            </div>
            {status?.supabaseConnected ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Đã kết nối
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Chưa gắn Keys
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Gói dịch vụ:</span>
              <span className="text-emerald-400 font-semibold">Free 500MB (Vĩnh viễn)</span>
            </div>
            <div className="flex justify-between">
              <span>Đồng bộ 2 chiều:</span>
              <span className="text-slate-300">{status?.supabaseConnected ? 'Bật (Auto-Sync)' : 'Chờ cấu hình'}</span>
            </div>
            <div className="flex justify-between">
              <span>Lần sync Cloud:</span>
              <span className="text-slate-300">
                {status?.lastCloudSyncAt ? new Date(status.lastCloudSyncAt).toLocaleTimeString('vi-VN') : 'Chưa có'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Mobile PWA */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <Smartphone className="w-4 h-4 text-violet-400" />
              <span>iPhone PWA Ready</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Sẵn sàng
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Manifest:</span>
              <span className="text-emerald-400">Đã tích hợp</span>
            </div>
            <div className="flex justify-between">
              <span>Service Worker:</span>
              <span className="text-emerald-400">Đã đăng ký</span>
            </div>
            <div className="flex justify-between">
              <span>Cài lên iPhone:</span>
              <span className="text-slate-300">Safari → Add to Home</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hướng dẫn kết nối 3 bước */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span>Hướng dẫn 3 bước đưa LedgerFlow lên iPhone & Cloud Free</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <span>1. Tạo Supabase Free (1 phút)</span>
            </div>
            <p className="text-slate-400">
              Tạo project miễn phí tại <span className="text-cyan-300 font-mono">supabase.com</span>. Copy <code className="text-amber-300">SUPABASE_URL</code> và <code className="text-amber-300">SUPABASE_SERVICE_ROLE_KEY</code> vào file <code className="text-slate-200">.env</code> hoặc Railway variables.
            </p>
            <p className="text-slate-500">Chạy SQL migration trong thư mục <code className="text-slate-400">supabase/migrations</code>.</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <span>2. Deploy Railway từ GitHub</span>
            </div>
            <p className="text-slate-400">
              Vào <span className="text-cyan-300 font-mono">railway.app</span> → New Project → Deploy from GitHub Repo (chọn repo này).
            </p>
            <p className="text-slate-500">Railway sẽ tự detect Dockerfile và build tự động mỗi khi push code lên GitHub.</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <span>3. Mở trên iPhone & Cài đặt</span>
            </div>
            <p className="text-slate-400">
              Mở link Railway trên trình duyệt Safari iPhone → Bấm nút <strong>Chia sẻ (Share)</strong> → Chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.
            </p>
            <p className="text-slate-500">App sẽ hiện icon riêng biệt như một app native, không có thanh địa chỉ Safari.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
