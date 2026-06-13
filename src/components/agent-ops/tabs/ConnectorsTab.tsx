import type { ConnectorDefinition } from '../../../types/agentOps';
import { readLocalStorageArray, useLocalStorageVersion } from '../storage';
import { useConnectorPolicySync } from '../useConnectorPolicySync';

const CONNECTOR_KEYS = ['ledgerflow_connector_sdk_registry_v1', 'ledgerflow-connector-sdk-registry-v1'];

const registryConnectors = [
  { id: 'github', name: 'GitHub', category: 'Code', status: 'Registry API', risk: 'HIGH', purpose: 'Branch, commit, pull request và CI context. Mọi write action phải qua Approval Gate.', allowed: ['Read repository metadata', 'Read PR/CI status', 'Create draft issue after approval'], blocked: ['Commit without approval', 'Merge PR automatically', 'Store token in source code'] },
  { id: 'vscode', name: 'VS Code / Cursor', category: 'Local', status: 'Deep link', risk: 'MEDIUM', purpose: 'Mở project local và handoff prompt cho AI coding agent.', allowed: ['Open local workspace', 'Copy handoff prompt'], blocked: ['Run terminal command without founder'] },
  { id: 'google-workspace', name: 'Google Workspace', category: 'Docs', status: 'Planned', risk: 'MEDIUM', purpose: 'Docs/Sheets/Gmail/Calendar connector cho Company OS.', allowed: ['Prepare draft', 'Read approved data'], blocked: ['Send email or share document without approval'] },
  { id: 'ai-gateway', name: 'AI Gateway', category: 'Data', status: 'Active', risk: 'LOW', purpose: 'Router nhiều provider, fallback theo quota và không hardcode key.', allowed: ['Generate text in sandbox', 'Track model used'], blocked: ['Expose API key'] },
];

function readConnectors(): ConnectorDefinition[] {
  return readLocalStorageArray<ConnectorDefinition>(CONNECTOR_KEYS);
}

function badgeTone(value: string) {
  if (value === 'LOW' || value === 'Active') return 'border-emerald-400/40 text-emerald-200';
  if (value === 'HIGH' || value === 'Blocked') return 'border-rose-400/40 text-rose-200';
  return 'border-cyan-400/40 text-cyan-200';
}

export default function ConnectorsTab() {
  useConnectorPolicySync();
  useLocalStorageVersion(['ledgerflow-connector-policy-synced', 'ledgerflow-connector-sdk-updated']);
  const connectors = readConnectors();
  return (
    <section className="rounded-3xl border border-cyan-400/35 bg-cyan-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Connector registry</p>
          <h3 className="mt-1 text-xl font-black text-white">Connectors & Policy</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Bản này biến Connectors từ placeholder thành policy board: thấy rõ risk, allowed/blocked actions và đường đi qua Approval Gate trước khi connector thực thi thật.</p>
        </div>
        <span className="rounded-full border border-cyan-300/35 px-3 py-1 text-xs font-black text-cyan-100">{registryConnectors.length} core · {connectors.length} local</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {registryConnectors.map((connector) => (
          <article key={connector.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{connector.name}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{connector.category} · {connector.status}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${badgeTone(connector.risk)}`}>{connector.risk}</span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{connector.purpose}</p>
            <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Allowed</p>
              {connector.allowed.map((item) => <p key={item} className="mt-1 text-[11px] font-semibold leading-4 text-slate-300">• {item}</p>)}
            </div>
            <div className="mt-2 rounded-xl border border-rose-400/20 bg-rose-400/5 p-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">Blocked</p>
              {connector.blocked.map((item) => <p key={item} className="mt-1 text-[11px] font-semibold leading-4 text-slate-300">• {item}</p>)}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
        <p className="text-sm font-black text-white">Local connector records</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">Dữ liệu cũ vẫn đọc từ ConnectorDefinition: allowedActions, blockedActions, approvalRequired và auditRequired.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {connectors.map((connector) => {
            const allowedActions = Array.isArray(connector.allowedActions) ? connector.allowedActions : [];
            const blockedActions = Array.isArray(connector.blockedActions) ? connector.blockedActions : [];
            return <article key={connector.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{connector.name || 'Legacy connector'}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{connector.category || 'Uncategorized'} · {connector.status || 'Planned'} · {connector.risk || 'MEDIUM'}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{connector.purpose || 'Imported from legacy connector registry storage.'}</p><p className="mt-2 text-[11px] font-bold text-cyan-200">{allowedActions.length} allowed · {blockedActions.length} blocked · approval {connector.approvalRequired ? 'yes' : 'no'} · audit {connector.auditRequired ? 'yes' : 'no'}</p></article>;
          })}
          {connectors.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có connector trong localStorage. Core policy ở trên vẫn cho founder thấy connector nào được phép/rủi ro.</p>}
        </div>
      </div>
    </section>
  );
}
