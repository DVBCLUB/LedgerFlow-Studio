import { useEffect, useState } from 'react';
import type { ConnectorDefinition } from '../../../types/agentOps';
import { fetchIntegrations, testIntegrationConnector, type IntegrationConnector, type IntegrationEvent } from '../../../utils/integrationHubApi';
import { appendAgentOpsAudit, readLocalStorageArray, useLocalStorageVersion } from '../storage';
import { useConnectorPolicySync } from '../useConnectorPolicySync';

const CONNECTOR_KEYS = ['ledgerflow_connector_sdk_registry_v1', 'ledgerflow-connector-sdk-registry-v1'];

const fallbackPolicies = [
  { id: 'github', name: 'GitHub', category: 'Code', status: 'Registry API', risk: 'HIGH', purpose: 'Repo, pull request và CI context. Write action phải qua Approval Gate.', allowed: ['Read repo metadata', 'Read PR/CI status', 'Create draft after approval'], blocked: ['Write without approval', 'Auto merge'] },
  { id: 'vscode', name: 'VS Code / Cursor', category: 'Local', status: 'Deep link', risk: 'MEDIUM', purpose: 'Handoff prompt cho coding agent.', allowed: ['Open workspace', 'Copy handoff prompt'], blocked: ['Run command without founder'] },
  { id: 'google-workspace', name: 'Google Workspace', category: 'Docs', status: 'Planned', risk: 'MEDIUM', purpose: 'Docs, Sheets, Gmail, Calendar cho Company OS.', allowed: ['Prepare draft', 'Read approved data'], blocked: ['Send or share without approval'] },
  { id: 'ai-gateway', name: 'AI Gateway', category: 'Data', status: 'Active', risk: 'LOW', purpose: 'Router nhiều provider và fallback quota.', allowed: ['Generate in sandbox', 'Track usage'], blocked: ['Expose private config'] },
];

function readConnectors(): ConnectorDefinition[] {
  return readLocalStorageArray<ConnectorDefinition>(CONNECTOR_KEYS);
}

function badgeTone(value: string) {
  if (['LOW', 'connected', 'local', 'Active', 'success'].includes(value)) return 'border-emerald-400/40 text-emerald-200';
  if (['HIGH', 'error', 'Blocked'].includes(value)) return 'border-rose-400/40 text-rose-200';
  if (['manual', 'warning', 'MEDIUM'].includes(value)) return 'border-amber-400/40 text-amber-200';
  return 'border-cyan-400/40 text-cyan-200';
}

function connectorRisk(connector: IntegrationConnector): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (connector.category === 'devops' || connector.id === 'github') return 'HIGH';
  if (!connector.enabled || connector.status === 'planned') return 'MEDIUM';
  return 'LOW';
}

export default function ConnectorsTab() {
  useConnectorPolicySync();
  useLocalStorageVersion(['ledgerflow-connector-policy-synced', 'ledgerflow-connector-sdk-updated']);
  const localConnectors = readConnectors();
  const [registry, setRegistry] = useState<IntegrationConnector[]>([]);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadRegistry = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await fetchIntegrations();
      setRegistry(data.connectors);
      setEvents(data.events);
      appendAgentOpsAudit('CONNECTOR_REGISTRY_LOADED', 'integrations', `${data.connectors.length} connectors · ${data.events.length} events`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Không đọc được integration registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRegistry();
  }, []);

  const testConnector = async (id: string) => {
    setTestingId(id);
    setApiError(null);
    try {
      const result = await testIntegrationConnector(id);
      setRegistry((current) => current.map((item) => item.id === id ? result.connector : item));
      setEvents(result.events);
      appendAgentOpsAudit('CONNECTOR_TESTED', id, result.connector.lastMessage || 'Connector tested.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test connector thất bại.';
      setApiError(message);
      appendAgentOpsAudit('CONNECTOR_TEST_FAILED', id, message);
    } finally {
      setTestingId(null);
    }
  };

  const copyHandoff = async (connector: IntegrationConnector) => {
    const markdown = [
      `# Connector Handoff: ${connector.title}`,
      '',
      `- ID: ${connector.id}`,
      `- Category: ${connector.category}`,
      `- Status: ${connector.status}`,
      `- Priority: ${connector.priority}`,
      `- Enabled: ${connector.enabled ? 'yes' : 'no'}`,
      `- Risk: ${connectorRisk(connector)}`,
      '',
      '## Notes',
      connector.notes,
      '',
      '## Capabilities',
      ...connector.capabilities.map((item) => `- ${item}`),
      '',
      '## Safety rule',
      '- Read/test is allowed in sandbox.',
      '- External write actions require Founder Approval Gate and audit evidence.',
    ].join('\n');
    await navigator.clipboard.writeText(markdown);
    appendAgentOpsAudit('CONNECTOR_HANDOFF_COPIED', connector.id, connector.title);
  };

  return (
    <section className="rounded-3xl border border-cyan-400/35 bg-cyan-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Connector registry</p>
          <h3 className="mt-1 text-xl font-black text-white">Connectors & Policy</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Đọc registry thật từ /api/integrations, vẫn có fallback local/policy khi backend chưa chạy. Write action luôn đi qua Approval Gate.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-cyan-300/35 px-3 py-1 text-cyan-100">{registry.length || fallbackPolicies.length} registry</span>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">{localConnectors.length} local</span>
          <button onClick={loadRegistry} className="rounded-full border border-cyan-300/45 px-3 py-1 text-cyan-100 hover:bg-cyan-400/10">{loading ? 'Đang tải...' : 'Refresh API'}</button>
        </div>
      </div>

      {apiError && <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs font-bold leading-5 text-amber-100">Backend registry chưa sẵn sàng hoặc lỗi API: {apiError}. Tab vẫn hiển thị fallback/local records.</p>}

      {registry.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {registry.map((connector) => {
            const risk = connectorRisk(connector);
            return (
              <article key={connector.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-white">{connector.title}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-400">{connector.category} · {connector.status} · {connector.priority}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${badgeTone(risk)}`}>{risk}</span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{connector.subtitle}</p>
                <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">{connector.notes}</p>
                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Capabilities</p>
                  {connector.capabilities.slice(0, 4).map((item) => <p key={item} className="mt-1 text-[11px] font-semibold leading-4 text-slate-300">• {item}</p>)}
                </div>
                {connector.lastMessage && <p className="mt-2 text-[11px] font-bold leading-5 text-cyan-100">Last check: {connector.lastMessage}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => testConnector(connector.id)} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">{testingId === connector.id ? 'Testing...' : 'Test'}</button>
                  <button onClick={() => copyHandoff(connector)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-cyan-300 hover:text-cyan-100">Copy handoff</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {fallbackPolicies.map((connector) => (
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
      )}

      <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black text-white">Registry events</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">Event log từ integration registry backend, dùng làm bằng chứng audit.</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-black text-slate-300">{events.length} events</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {events.slice(0, 6).map((event) => <p key={event.id} className={`rounded-xl border p-2 text-[11px] font-semibold leading-5 ${badgeTone(event.level)}`}><span className="font-black">{event.connectorId}</span> · {event.type} · {new Date(event.createdAt).toLocaleString('vi-VN')}<br />{event.message}</p>)}
          {events.length === 0 && <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs font-semibold text-slate-400">Chưa có event từ backend hoặc backend chưa chạy.</p>}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
        <p className="text-sm font-black text-white">Local connector records</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">Dữ liệu cũ vẫn đọc từ ConnectorDefinition: allowedActions, blockedActions, approvalRequired và auditRequired.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {localConnectors.map((connector) => {
            const allowedActions = Array.isArray(connector.allowedActions) ? connector.allowedActions : [];
            const blockedActions = Array.isArray(connector.blockedActions) ? connector.blockedActions : [];
            return <article key={connector.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{connector.name || 'Legacy connector'}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{connector.category || 'Uncategorized'} · {connector.status || 'Planned'} · {connector.risk || 'MEDIUM'}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{connector.purpose || 'Imported from legacy connector registry storage.'}</p><p className="mt-2 text-[11px] font-bold text-cyan-200">{allowedActions.length} allowed · {blockedActions.length} blocked · approval {connector.approvalRequired ? 'yes' : 'no'} · audit {connector.auditRequired ? 'yes' : 'no'}</p></article>;
          })}
          {localConnectors.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có connector trong localStorage. Registry API/policy fallback vẫn hiển thị phía trên.</p>}
        </div>
      </div>
    </section>
  );
}
