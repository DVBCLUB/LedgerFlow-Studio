import type { ConnectorDefinition } from '../../../types/agentOps';
import { readLocalStorageArray } from '../storage';

const CONNECTOR_KEYS = ['ledgerflow_connector_sdk_registry_v1', 'ledgerflow-connector-sdk-registry-v1'];

function readConnectors(): ConnectorDefinition[] {
  return readLocalStorageArray<ConnectorDefinition>(CONNECTOR_KEYS);
}

export default function ConnectorsTab() {
  const connectors = readConnectors();
  return (
    <section className="rounded-3xl border border-cyan-400/35 bg-cyan-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Connector registry</p>
      <h3 className="mt-1 text-xl font-black text-white">Connectors & Policy</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">ConnectorDefinition đầy đủ là nguồn sự thật; policy dùng allowedActions và blockedActions trong cùng record, đọc cả key registry cũ.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {connectors.map((connector) => <article key={connector.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{connector.name}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{connector.category} · {connector.status} · {connector.risk}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{connector.purpose}</p><p className="mt-2 text-[11px] font-bold text-cyan-200">{connector.allowedActions.length} allowed · {connector.blockedActions.length} blocked</p></article>)}
        {connectors.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có connector trong localStorage.</p>}
      </div>
    </section>
  );
}
