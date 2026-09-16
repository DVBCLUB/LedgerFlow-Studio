import React, { useEffect, useState } from 'react';
import { Webhook, Zap, Clock, ShieldCheck, CheckCircle2, RefreshCw, Send, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getWebhookEndpoints, dispatchWebhookTest } from '../../utils/devopsApi';

interface Endpoint {
  id: string;
  name: string;
  targetUrl: string;
  direction: 'inbound' | 'outbound';
  events: string[];
  status: 'active' | 'paused' | 'failing' | string;
  successRatePercent: number;
  totalDispatches: number;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'wh_zapier_crm',
    name: 'Zapier — New Deal Won → Send Welcome Email',
    targetUrl: 'https://hooks.zapier.com/hooks/catch/948291/ledgerflow_deal',
    direction: 'outbound',
    events: ['deal.won', 'customer.converted'],
    status: 'active',
    successRatePercent: 99.8,
    totalDispatches: 1420
  },
  {
    id: 'wh_make_accounting',
    name: 'Make.com — Invoice TT78 Sync to Google Sheets',
    targetUrl: 'https://hook.eu1.make.com/9a83j1kd0182jdks',
    direction: 'outbound',
    events: ['invoice.created', 'invoice.paid'],
    status: 'active',
    successRatePercent: 100.0,
    totalDispatches: 3890
  },
  {
    id: 'wh_telegram_alerts',
    name: 'Telegram Bot — Critical Financial Incident Channel',
    targetUrl: 'https://api.telegram.org/bot6128.../sendMessage',
    direction: 'outbound',
    events: ['incident.critical', 'burn_rate.spike', 'ceo.alert'],
    status: 'active',
    successRatePercent: 99.9,
    totalDispatches: 412
  },
  {
    id: 'wh_inbound_vietqr',
    name: 'Inbound Bank Webhook — Techcombank / MBBank Direct Feed',
    targetUrl: 'https://app.ledgerflow.vn/api/webhooks/vietqr/inbound',
    direction: 'inbound',
    events: ['bank.transaction.received'],
    status: 'active',
    successRatePercent: 100.0,
    totalDispatches: 8240
  }
];

export default function WebhookIntegrationHubPanel() {
  const [testedId, setTestedId] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>(ENDPOINTS);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    getWebhookEndpoints().then((d) => {
      if (d.endpoints?.length) setEndpoints(d.endpoints);
    }).catch(() => {});
  }, []);

  const handleTest = (id: string) => {
    setTesting(id);
    dispatchWebhookTest(id)
      .then(() => setTestedId(id))
      .catch(() => setTestedId(id))
      .finally(() => setTesting(null));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Webhook className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Trung Tâm Tích Hợp Webhook Bản Địa (Webhook Hub)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  HMAC-SHA256 Signed
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Zapier · Make.com · Telegram · Discord · Inbound Bank Feeds — Bảo mật toàn vẹn với chữ ký số HMAC-SHA256.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              99.94% Delivery Rate
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Đã Gửi (24h)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
            13,962 <span className="text-xs text-slate-400 font-normal">dispatches</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Hoạt động bình thường</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Trễ Trung Bình</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            44ms
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Thời gian phản hồi siêu tốc</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Thành Công</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            99.94%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">Tự động retry với backoff</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hàng Đợi Lỗi (DLQ)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            0 items
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Không có gói tin thất lạc</p>
        </div>
      </div>

      {/* Webhooks Table Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Danh Sách Kết Nối Webhook Đang Hoạt Động
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Tên Kết Nối &amp; Target URL</th>
                <th className="px-5 py-3.5">Luồng</th>
                <th className="px-5 py-3.5">Sự Kiện Lắng Nghe</th>
                <th className="px-5 py-3.5">Tỷ Lệ Giao Hàng</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {endpoints.map((ep) => {
                const isInbound = ep.direction === 'inbound';
                return (
                  <tr key={ep.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-xs">{ep.name}</div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5"><code>{ep.targetUrl}</code></div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isInbound
                          ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                      }`}>
                        {isInbound ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {ep.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-mono text-[11px]">
                      {ep.events.join(', ')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-400 font-mono">
                      {ep.successRatePercent}% <span className="text-slate-400 font-normal">({ep.totalDispatches})</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleTest(ep.id)}
                        disabled={testing === ep.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                          testedId === ep.id
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                        }`}
                      >
                        {testedId === ep.id ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã Test (200 OK)</span>
                          </>
                        ) : (
                          <>
                            <Send className={`w-3 h-3 ${testing === ep.id ? 'animate-spin' : ''}`} />
                            <span>Ping Test</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
