import React, { useState } from 'react';
import { ScrollText, Filter, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

interface AuditItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'executed' | 'rejected' | 'pending';
}

const INITIAL_LOGS: AuditItem[] = [
  {
    id: 'aud-101',
    timestamp: new Date().toLocaleTimeString(),
    actor: 'NeoDev (AI Agent)',
    action: 'scaffold_threejs_project',
    target: 'CyberDragon 3D Game',
    risk: 'LOW',
    status: 'executed',
  },
  {
    id: 'aud-102',
    timestamp: new Date().toLocaleTimeString(),
    actor: 'NovaGrowth (AI Agent)',
    action: 'generate_video_spec',
    target: 'Trailer 4K CyberDragon',
    risk: 'LOW',
    status: 'executed',
  },
  {
    id: 'aud-103',
    timestamp: new Date().toLocaleTimeString(),
    actor: 'Founder David Bao',
    action: 'ceo_deliberation_approval',
    target: 'Q4 Product Roadmap',
    risk: 'LOW',
    status: 'executed',
  },
];

export function FactoryAuditLogPanel() {
  const [logs] = useState<AuditItem[]>(INITIAL_LOGS);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const filteredLogs = logs.filter((l) => filterRisk === 'ALL' || l.risk === filterRisk);

  return (
    <div className="rounded-2xl border border-border-primary bg-slate-950/80 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between border-b border-border-secondary/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Nhật Ký Kiểm Toán Tự Động (Factory Audit Log)</h3>
            <p className="text-xs text-text-tertiary">Theo dõi toàn bộ thao tác máy và quyết định thực thi AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-text-tertiary" />
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="rounded-lg border border-border-secondary bg-slate-900 px-2.5 py-1 text-xs text-text-secondary focus:outline-none"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="LOW">Rủi ro Thấp (Low)</option>
            <option value="MEDIUM">Rủi ro Trung Bình</option>
            <option value="HIGH">Rủi ro Cao</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-border-secondary/40 overflow-hidden rounded-xl border border-border-secondary bg-slate-900/40">
        {filteredLogs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-3 text-xs hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" />
              </span>
              <div>
                <div className="font-semibold text-text-primary">
                  {log.action} &rarr; <span className="text-cyan-300">{log.target}</span>
                </div>
                <div className="text-[11px] text-text-tertiary">
                  Thực hiện bởi: <span className="font-medium text-text-secondary">{log.actor}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-text-tertiary">
                {log.timestamp}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                log.risk === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {log.risk}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FactoryAuditLogPanel;
