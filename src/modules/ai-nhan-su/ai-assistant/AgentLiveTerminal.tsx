import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, PlayCircle, StopCircle, Download, Trash2, Plus, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react';

const DAEMON = 'http://127.0.0.1:3001';

interface LogEntry { ts: string; text: string; type: string; }

export default function AgentLiveTerminal() {
  const [logs, setLogs] = useState<Array<{ connectionId: string; entries: LogEntry[] }>>([]);
  const [connections, setConnections] = useState<Array<{ id: string; url: string; status: string }>>([]);
  const [newUrl, setNewUrl] = useState('/api/agentic-loop/run');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const eventSources = useRef<Map<string, EventSource>>(new Map());

  const connect = useCallback((url: string) => {
    const cid = `conn_${Date.now()}`;
    const fullUrl = `${DAEMON}${url.startsWith('/') ? url : '/' + url}`;

    setConnections(prev => [...prev, { id: cid, url, status: 'connecting' }]);
    setLogs(prev => [...prev, { connectionId: cid, entries: [] }]);

    // Since SSE isn't natively supported, poll the health endpoint as real-time feed
    const es = new EventSource(fullUrl);
    es.onopen = () => {
      setConnections(prev => prev.map(c => c.id === cid ? { ...c, status: 'connected' } : c));
    };
    es.onmessage = (event) => {
      const entry: LogEntry = { ts: new Date().toLocaleTimeString(), text: event.data, type: 'info' };
      setLogs(prev => prev.map(l => l.connectionId === cid ? { ...l, entries: [...l.entries, entry].slice(-200) } : l));
    };
    es.onerror = () => {
      setConnections(prev => prev.map(c => c.id === cid ? { ...c, status: 'error' } : c));
    };
    eventSources.current.set(cid, es);
  }, []);

  const disconnect = useCallback((cid: string) => {
    const es = eventSources.current.get(cid);
    if (es) { es.close(); eventSources.current.delete(cid); }
    setConnections(prev => prev.map(c => c.id === cid ? { ...c, status: 'disconnected' } : c));
  }, []);

  // Auto-poll for agent loop status as "live" feed
  const [autoUrls] = useState(['/api/agentic-loop/runs', '/api/observer/reports?limit=1', '/api/cost/snapshot']);
  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const [autoActive, setAutoActive] = useState(true);

  useEffect(() => {
    if (!autoActive) return;
    const poll = async () => {
      const results: Record<string, any> = {};
      for (const url of autoUrls) {
        try {
          const r = await fetch(`${DAEMON}${url}`).then(r => r.json()).catch(() => null);
          results[url] = r;
        } catch { }
      }
      setLiveData(prev => ({ ...prev, ...results }));
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [autoActive]);

  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-emerald-400" /> Live Agent Terminal
          </h3>
          <p className="text-[10px] text-text-tertiary mt-0.5">Real-time agent output, live system feed, interactive console</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setAutoActive(!autoActive)} className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-bold ${autoActive ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' : 'border-border-primary bg-bg-primary text-text-tertiary'}`}>
            {autoActive ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
            {autoActive ? 'Live 3s' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Quick connect bar */}
      <div className="flex gap-1.5 shrink-0">
        <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="/api/endpoint" className="flex-1 bg-bg-primary border border-border-primary rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 placeholder-slate-700 font-mono outline-none focus:border-emerald-500/60" />
        <button onClick={() => connect(newUrl)} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-text-primary text-[10px] font-bold rounded-lg flex items-center gap-1">
          <Plus className="h-3 w-3" /> Connect
        </button>
      </div>

      {/* Live data cards */}
      <div className="grid grid-cols-3 gap-1.5 shrink-0">
        {autoUrls.map(url => {
          const data = liveData[url];
          const key = url.split('/').pop() || url;
          let value = '—';
          if (data) {
            if (data.runs) value = `${data.runs.length} runs`;
            else if (data.metrics) value = `${data.metrics.completed} OK / ${data.metrics.failed} FAIL`;
            else if (data.snapshot) value = `$${(data.snapshot.totalCostUsd || 0).toFixed(4)}`;
            else if (data.recent) value = `${data.recent.length} reports`;
          }
          return (
            <div key={url} className="rounded-lg border border-border-primary bg-slate-950/60 px-2 py-1.5">
              <div className="text-[8px] text-slate-600 font-mono">{key}</div>
              <div className="text-[10px] font-bold text-emerald-300">{value}</div>
            </div>
          );
        })}
      </div>

      {/* Connection panels */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {connections.map(conn => {
          const isOpen = expanded.has(conn.id);
          const logEntries = logs.find(l => l.connectionId === conn.id)?.entries || [];
          return (
            <div key={conn.id} className="rounded-xl border border-border-primary bg-slate-950/80 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-bg-primary/80 cursor-pointer hover:bg-bg-primary/50" onClick={() => { const s = new Set(expanded); s.has(conn.id) ? s.delete(conn.id) : s.add(conn.id); setExpanded(s); }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-emerald-400 animate-pulse' : conn.status === 'error' ? 'bg-rose-400' : conn.status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-[10px] font-bold text-text-secondary truncate">{conn.url}</span>
                  <span className="text-[8px] text-slate-600">{logEntries.length} events</span>
                </div>
                <div className="flex items-center gap-1">
                  {conn.status === 'connected' && <button onClick={e => { e.stopPropagation(); disconnect(conn.id); }} className="p-0.5 rounded hover:bg-rose-900/30"><StopCircle className="h-3 w-3 text-rose-400" /></button>}
                  {isOpen ? <ChevronUp className="h-3 w-3 text-text-tertiary" /> : <ChevronDown className="h-3 w-3 text-text-tertiary" />}
                </div>
              </div>
              {isOpen && (
                <div className="max-h-64 overflow-y-auto bg-slate-950 p-2 font-mono text-[9px] leading-relaxed">
                  {logEntries.length === 0 && <div className="text-slate-600 text-center py-4">Waiting for events...</div>}
                  {logEntries.map((e, i) => (
                    <div key={i} className="flex gap-2 hover:bg-bg-primary/30 px-1 rounded">
                      <span className="text-slate-600 shrink-0">{e.ts}</span>
                      <span className={e.type === 'error' ? 'text-rose-400' : e.type === 'warn' ? 'text-amber-400' : 'text-text-secondary'}>
                        {e.text.slice(0, 500)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {connections.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-[10px] text-text-tertiary">
            <div className="text-center space-y-1">
              <Terminal className="h-6 w-6 mx-auto text-slate-700" />
              <div>Connect to an endpoint to see live output</div>
              <div className="text-[9px] text-slate-600">Try /api/agentic-loop/runs or run an agent loop first</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-1.5 shrink-0 flex-wrap">
        {[
          { label: 'Loop Status', url: '/api/agentic-loop/runs' },
          { label: 'Observer', url: '/api/observer/reports?limit=3' },
          { label: 'Cost Snapshot', url: '/api/cost/snapshot' },
          { label: 'Trigger Events', url: '/api/triggers/events?limit=10' },
          { label: 'Sandbox Sessions', url: '/api/sandbox/sessions' },
          { label: 'Threads', url: '/api/threads' },
          { label: 'Skills', url: '/api/skills' },
        ].map(item => (
          <button key={item.url} onClick={() => connect(item.url)} className="rounded-full border border-border-primary bg-bg-primary px-2.5 py-1 text-[8px] font-bold text-text-secondary hover:border-emerald-500/40 hover:text-emerald-300">
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
