import React, { useState } from 'react';
import { Cloud, FileSpreadsheet, FileText, Zap, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  testGoogleWorkspace, exportGoogleSheets,
  testMicrosoft365, exportMicrosoftExcel,
  testNotion, createNotionPage,
  testN8n, triggerN8nWorkflow,
} from '../../utils/cloudConnectorsApi';

type ConnectorKey = 'google' | 'm365' | 'notion' | 'n8n';

interface ConnectorDef {
  key: ConnectorKey;
  name: string;
  icon: React.ElementType;
  desc: string;
}

const CONNECTORS: ConnectorDef[] = [
  { key: 'google', name: 'Google Workspace', icon: Cloud, desc: 'Xuất bảng tính Google Sheets (mô phỏng cục bộ).' },
  { key: 'm365', name: 'Microsoft 365', icon: FileSpreadsheet, desc: 'Xuất bảng tính Excel (mô phỏng cục bộ).' },
  { key: 'notion', name: 'Notion', icon: FileText, desc: 'Tạo trang Notion markdown (mô phỏng cục bộ).' },
  { key: 'n8n', name: 'n8n', icon: Zap, desc: 'Kích hoạt workflow n8n (mô phỏng cục bộ).' },
];

export default function CloudConnectorsPanel() {
  const [status, setStatus] = useState<Record<ConnectorKey, { loading: boolean; ok?: boolean; msg?: string }>>({
    google: { loading: false }, m365: { loading: false }, notion: { loading: false }, n8n: { loading: false },
  });

  const run = async (key: ConnectorKey, fn: () => Promise<string>) => {
    setStatus((p) => ({ ...p, [key]: { loading: true } }));
    try {
      const msg = await fn();
      setStatus((p) => ({ ...p, [key]: { loading: false, ok: true, msg } }));
    } catch (e: any) {
      setStatus((p) => ({ ...p, [key]: { loading: false, ok: false, msg: String(e?.message ?? e) } }));
    }
  };

  const test = (key: ConnectorKey) => {
    const fns: Record<ConnectorKey, () => Promise<string>> = {
      google: async () => `OK: ${JSON.stringify(await testGoogleWorkspace()).slice(0, 120)}`,
      m365: async () => `OK: ${JSON.stringify(await testMicrosoft365()).slice(0, 120)}`,
      notion: async () => `OK: ${JSON.stringify(await testNotion()).slice(0, 120)}`,
      n8n: async () => `OK: ${JSON.stringify(await testN8n()).slice(0, 120)}`,
    };
    void run(key, fns[key]);
  };

  const action = (key: ConnectorKey) => {
    const fns: Record<ConnectorKey, () => Promise<string>> = {
      google: async () => await exportGoogleSheets('LedgerFlow-Demo', ['Tên', 'Doanh thu'], [['SaaS', 1200000], ['Game', 800000]]),
      m365: async () => await exportMicrosoftExcel('LedgerFlow-Demo', ['Tên', 'Doanh thu'], [['SaaS', 1200000]]),
      notion: async () => await createNotionPage('LedgerFlow Báo cáo', '# Báo cáo\n- Doanh thu: 1.2M VND'),
      n8n: async () => await triggerN8nWorkflow('ledgerflow-sync', { source: 'company-os' }),
    };
    void run(key, fns[key]);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-white">Cloud Connectors</h3>
        <span className="text-[10px] text-slate-500">Mô phỏng cục bộ · /api/dormant/integrations</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CONNECTORS.map((c) => {
          const Icon = c.icon;
          const s = status[c.key];
          return (
            <div key={c.key} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-left">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white">{c.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-3">{c.desc}</p>
              <div className="flex gap-2">
                <button onClick={() => test(c.key)} disabled={s.loading} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-200 cursor-pointer disabled:opacity-50">
                  {s.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Test
                </button>
                <button onClick={() => action(c.key)} disabled={s.loading} className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-[11px] font-black text-white cursor-pointer disabled:opacity-50">
                  Chạy thử
                </button>
              </div>
              {s.msg && (
                <p className={`mt-2 text-[10px] flex items-start gap-1 ${s.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {s.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  {s.msg}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
