import React, { useEffect, useState, useCallback } from 'react';
import { Network, RefreshCw, Zap, BrainCircuit, Users, Database, Shield, Container, Activity, Search } from 'lucide-react';

const DAEMON = 'http://127.0.0.1:3001';

interface PipelineNode {
  id: string; label: string; type: string; status: boolean | string; detail: string;
}

export default function AiPipelineViz() {
  const [nodes, setNodes] = useState<PipelineNode[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const results: PipelineNode[] = [];

    const checks: Array<{ id: string; label: string; type: string; url: string; isBool?: boolean }> = [
      { id: 'daemon', label: 'Daemon', type: 'core', url: `${DAEMON}/health` },
      { id: 'fabric', label: 'AI Fabric', type: 'core', url: `${DAEMON}/health` },
      { id: 'observer', label: 'Observer', type: 'core', url: `${DAEMON}/api/observer/health` },
      { id: 'agent-loop', label: 'Agent Loop', type: 'agent', url: `${DAEMON}/api/agentic-loop/runs` },
      { id: 'multi-agent', label: 'Multi-Agent', type: 'agent', url: `${DAEMON}/api/multi-agent/plans` },
      { id: 'memory', label: 'Memory', type: 'knowledge', url: `${DAEMON}/api/memory/stats` },
      { id: 'knowledge-graph', label: 'Knowledge Graph', type: 'knowledge', url: `${DAEMON}/api/knowledge/stats` },
      { id: 'rag', label: 'Search/RAG', type: 'knowledge', url: `${DAEMON}/health` },
      { id: 'sandbox', label: 'Sandbox', type: 'infra', url: `${DAEMON}/api/sandbox/sessions` },
      { id: 'triggers', label: 'Triggers', type: 'infra', url: `${DAEMON}/api/triggers/rules` },
      { id: 'cost', label: 'Cost Tracker', type: 'infra', url: `${DAEMON}/api/cost/snapshot` },
      { id: 'ab-test', label: 'A/B Evaluator', type: 'quality', url: `${DAEMON}/api/ab-test/runs` },
      { id: 'feedback', label: 'Feedback', type: 'quality', url: `${DAEMON}/api/feedback/stats` },
      { id: 'security', label: 'Security Audit', type: 'security', url: `${DAEMON}/health` },
      { id: 'curator', label: 'Curator', type: 'knowledge', url: `${DAEMON}/api/curator/status` },
      { id: 'handoff', label: 'Handoff', type: 'agent', url: `${DAEMON}/api/handoff/list` },
      { id: 'docs', label: 'Doc Generator', type: 'quality', url: `${DAEMON}/api/docs/status` },
    ];

    const res = await Promise.all(checks.map(c => fetch(c.url).then(r => r.json()).catch(() => null)));

    const lookup: Record<string, any> = {};
    checks.forEach((c, i) => { lookup[c.id] = res[i]; });

    function ok(val: any): boolean { return val?.ok === true; }

    // Core layer
    results.push({ id: 'daemon', label: 'Daemon', type: 'core', status: ok(lookup.daemon) as boolean, detail: 'Port 3001' });
    results.push({ id: 'fabric', label: 'AI Fabric', type: 'core', status: ok(lookup.fabric) as boolean, detail: 'API→Web→Local' });
    results.push({ id: 'observer', label: 'Observer', type: 'core', status: lookup.observer?.health?.running || false, detail: lookup.observer?.health?.running ? '30s interval' : 'Stopped' });

    // Agent layer
    const loopMetrics = lookup['agent-loop']?.metrics;
    results.push({ id: 'agent-loop', label: 'Agent Loop', type: 'agent', status: ok(lookup['agent-loop']), detail: `${loopMetrics?.completed || 0} done, ${loopMetrics?.failed || 0} failed` });
    results.push({ id: 'multi-agent', label: 'Multi-Agent', type: 'agent', status: ok(lookup['multi-agent']), detail: `${lookup['multi-agent']?.plans?.length || 0} orchestrations` });
    results.push({ id: 'handoff', label: 'Handoff', type: 'agent', status: ok(lookup.handoff), detail: '6 agents' });

    // Knowledge layer
    const memStats = lookup.memory?.stats;
    results.push({ id: 'memory', label: 'Memory', type: 'knowledge', status: ok(lookup.memory), detail: `${memStats?.totalRecords || 0} records` });
    results.push({ id: 'knowledge-graph', label: 'Knowledge Graph', type: 'knowledge', status: ok(lookup['knowledge-graph']), detail: `${lookup['knowledge-graph']?.stats?.totalNodes || 0} nodes` });
    results.push({ id: 'rag', label: 'Search/RAG', type: 'knowledge', status: ok(lookup.rag), detail: 'Code+Memory+Graph' });
    results.push({ id: 'curator', label: 'Curator', type: 'knowledge', status: ok(lookup.curator), detail: lookup.curator?.running ? 'Running' : 'Manual' });

    // Infrastructure
    results.push({ id: 'sandbox', label: 'Sandbox', type: 'infra', status: ok(lookup.sandbox), detail: `${lookup.sandbox?.sessions?.length || 0} sessions` });
    results.push({ id: 'triggers', label: 'Triggers', type: 'infra', status: ok(lookup.triggers), detail: `${lookup.triggers?.stats?.enabledRules || 0}/${lookup.triggers?.stats?.totalRules || 0} enabled` });
    results.push({ id: 'cost', label: 'Cost Tracker', type: 'infra', status: ok(lookup.cost), detail: `$${(lookup.cost?.snapshot?.totalCostUsd || 0).toFixed(4)}` });

    // Quality
    results.push({ id: 'ab-test', label: 'A/B Evaluator', type: 'quality', status: ok(lookup['ab-test']), detail: `${lookup['ab-test']?.runs?.length || 0} runs` });
    results.push({ id: 'feedback', label: 'Feedback', type: 'quality', status: ok(lookup.feedback), detail: `${lookup.feedback?.stats?.total || 0} entries` });
    results.push({ id: 'docs', label: 'Doc Generator', type: 'quality', status: ok(lookup.docs), detail: `${lookup.docs?.generated?.length || 0} docs` });

    // Security
    results.push({ id: 'security', label: 'Security Audit', type: 'security', status: ok(lookup.security), detail: 'Ready' });

    setNodes(results);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 8000); return () => clearInterval(t); }, [refresh]);

  const layers = ['core', 'agent', 'knowledge', 'infra', 'quality', 'security'];
  const layerLabels: Record<string, string> = { core: 'Core Pipeline', agent: 'Agent Layer', knowledge: 'Knowledge & Memory', infra: 'Infrastructure', quality: 'Quality Assurance', security: 'Security' };
  const layerIcons: Record<string, any> = { core: Zap, agent: BrainCircuit, knowledge: Database, infra: Container, quality: Activity, security: Shield };

  function isUp(n: PipelineNode): boolean { return n.status === true || n.status === 'OK'; }
  function statusColor(n: PipelineNode): string {
    if (n.status === true || n.status === 'OK') return 'border-emerald-500/30 bg-emerald-950/20';
    if (typeof n.status === 'string' && n.status.startsWith('DEGRADED')) return 'border-amber-500/30 bg-amber-950/20';
    return 'border-rose-500/30 bg-rose-950/20';
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <Network className="h-4 w-4 text-violet-400" /> AI Pipeline DAG
          </h3>
          <p className="text-[10px] text-text-tertiary mt-0.5">Topology toàn bộ hệ thống AI — real-time status từng node</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-border-primary bg-bg-primary px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:border-violet-500">
          <RefreshCw className="h-3 w-3" /> Refresh 8s
        </button>
      </div>

      {loading && <div className="text-center py-6 text-xs text-text-tertiary">Loading topology...</div>}

      {layers.map(layer => {
        const layerNodes = nodes.filter(n => n.type === layer);
        if (layerNodes.length === 0) return null;
        const Icon = layerIcons[layer] || Zap;
        const allUp = layerNodes.every(isUp);
        return (
          <div key={layer} className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3 w-3 text-text-tertiary" />
              <span className="text-[9px] font-black uppercase text-text-tertiary tracking-wide">{layerLabels[layer]}</span>
              <span className={`text-[8px] font-bold ${allUp ? 'text-emerald-400' : 'text-amber-400'}`}>
                {allUp ? 'ALL OK' : 'DEGRADED'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {layerNodes.map((node, i) => (
                <span key={node.id} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all ${statusColor(node)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isUp(node) ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span className="text-text-secondary">{node.label}</span>
                  <span className="text-[8px] text-text-tertiary">{node.detail}</span>
                </span>
              ))}
              {/* Arrows between nodes */}
              {layerNodes.length > 1 && (
                <span className="text-[8px] text-slate-700 self-center">
                  {layerNodes.map((_, i) => i < layerNodes.length - 1 ? ' → ' : '').join('')}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Flow diagram */}
      <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3 overflow-x-auto">
        <div className="text-[10px] font-black text-text-secondary uppercase mb-2">Data Flow</div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-text-tertiary flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-border-primary text-text-secondary">User Query</span>
          <span>→</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-500/20 text-blue-300">AI Fabric</span>
          <span>→</span>
          <span className="px-1.5 py-0.5 rounded bg-violet-950/40 border border-violet-500/20 text-violet-300">RAG/Search</span>
          <span>→</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 text-cyan-300">Agent Loop</span>
          <span>→</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-300">Memory</span>
          <span>→</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-amber-300">Cost</span>
          <span>→</span>
          <span className="px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-500/20 text-rose-300">Observer</span>
          <span>→</span>
          <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-border-primary text-text-secondary">Result</span>
        </div>
      </div>
    </div>
  );
}
