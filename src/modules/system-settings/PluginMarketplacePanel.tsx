import React, { useEffect, useState } from 'react';
import {
  Puzzle,
  Download,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  Power,
} from 'lucide-react';

export interface PluginItem {
  id: string;
  name: string;
  version: string;
  type: string;
  description: string;
  author: string;
  enabled: boolean;
  trustLevel: 'trusted' | 'sandboxed' | 'signed';
  capabilitiesCount: number;
}

const DEFAULT_PLUGINS: PluginItem[] = [
  {
    id: 'plug_misa_xml_sync',
    name: 'MISA & AMIS Accounting Connector',
    version: '1.4.0',
    type: 'data_source',
    description: 'Tự động đồng bộ hóa đơn điện tử TT78 và dữ liệu kế toán hai chiều với hệ thống MISA SME.',
    author: 'LedgerFlow Official',
    enabled: true,
    trustLevel: 'trusted',
    capabilitiesCount: 4,
  },
  {
    id: 'plug_tiktok_ad_studio',
    name: 'TikTok Video Marketing Auto-Publisher',
    version: '2.1.0',
    type: 'tool',
    description: 'Tự động tạo video 15s dọc với CapCut engine và đăng tải trực tiếp lên TikTok Ads API.',
    author: 'LedgerFlow Growth Team',
    enabled: true,
    trustLevel: 'trusted',
    capabilitiesCount: 6,
  },
  {
    id: 'plug_vietqr_reconcile_pro',
    name: 'VietQR Multi-Bank Real-time Webhook Hub',
    version: '3.0.0',
    type: 'trigger',
    description: 'Nhận webhook biến động số dư từ 14 ngân hàng Việt Nam (MB, VCB, TCB) và gạch nợ tức thì.',
    author: 'LedgerFlow Fintech',
    enabled: true,
    trustLevel: 'trusted',
    capabilitiesCount: 5,
  },
  {
    id: 'plug_construction_bom_estimator',
    name: 'Construction & EPC Project BOM Estimator',
    version: '1.2.0',
    type: 'skill',
    description: 'Mẫu ngành xây dựng & dự án: Tự động bóc tách khối lượng và tính toán nghiệm thu từng giai đoạn.',
    author: 'Industry Template Lab',
    enabled: false,
    trustLevel: 'sandboxed',
    capabilitiesCount: 3,
  },
];

export default function PluginMarketplacePanel() {
  const [pluginsList, setPluginsList] = useState<PluginItem[]>(DEFAULT_PLUGINS);
  const [loading, setLoading] = useState(false);

  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/dormant/plugins/catalog');
      const data = await res.json();
      if (data?.success && data?.plugins) {
        setPluginsList(data.plugins);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const handleToggle = (id: string) => {
    setPluginsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">🧩 Plugin Extension Marketplace &amp; Ecosystem Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Hot-Pluggable Runtime
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mở rộng năng lực hệ điều hành công ty: Cài đặt và kích hoạt tức thì các connector kế toán, module marketing và AI skill packs.
          </p>
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pluginsList.map((plugin) => (
          <div
            key={plugin.id}
            className={`p-4 rounded-xl border transition space-y-3 ${
              plugin.enabled
                ? 'bg-white/4 border-white/10 hover:border-amber-500/30'
                : 'bg-black/30 border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{plugin.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">v{plugin.version}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tác giả: {plugin.author}</span>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  plugin.trustLevel === 'trusted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {plugin.trustLevel}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{plugin.description}</p>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <Layers className="w-3.5 h-3.5" />
                <span>{plugin.capabilitiesCount} Capabilities</span>
              </div>

              <button
                onClick={() => handleToggle(plugin.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  plugin.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{plugin.enabled ? 'ĐANG KÍCH HOẠT' : 'BẬT PLUGIN'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
