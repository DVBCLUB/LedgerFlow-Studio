import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemNode {
  id: string;
  name: string;
  category: 'core' | 'finance' | 'growth' | 'factory' | 'infrastructure';
  status: 'OPTIMAL' | 'ACTIVE' | 'IDLE' | 'ALERT';
  activeAgents: number;
  eventsProcessed: number;
  icon: string;
}

const SYSTEM_NODES: SystemNode[] = [
  { id: 'ceo_command', name: 'Command Center', category: 'core', status: 'OPTIMAL', activeAgents: 2, eventsProcessed: 142, icon: '👑' },
  { id: 'knowledge_rag', name: 'Knowledge & RAG', category: 'core', status: 'OPTIMAL', activeAgents: 3, eventsProcessed: 489, icon: '🧠' },
  { id: 'sales_crm', name: 'Sales CRM & Deals', category: 'growth', status: 'ACTIVE', activeAgents: 4, eventsProcessed: 215, icon: '💼' },
  { id: 'marketing_growth', name: 'Marketing & Funnels', category: 'growth', status: 'ACTIVE', activeAgents: 3, eventsProcessed: 178, icon: '🚀' },
  { id: 'finance_vas', name: 'Finance & VAS 200', category: 'finance', status: 'OPTIMAL', activeAgents: 3, eventsProcessed: 320, icon: '💰' },
  { id: 'swe_factory', name: 'Software Factory', category: 'factory', status: 'ACTIVE', activeAgents: 4, eventsProcessed: 612, icon: '🦾' },
  { id: 'video_maker', name: 'Video Production', category: 'factory', status: 'IDLE', activeAgents: 1, eventsProcessed: 88, icon: '🎬' },
  { id: 'game_studio', name: 'Game & ML Studio', category: 'factory', status: 'IDLE', activeAgents: 2, eventsProcessed: 94, icon: '🎮' },
  { id: 'self_healing', name: 'Self-Healing & CI', category: 'infrastructure', status: 'OPTIMAL', activeAgents: 3, eventsProcessed: 531, icon: '🩺' },
];

const STATUS_COLOR: Record<string, { badge: string; border: string; dot: string }> = {
  OPTIMAL: { badge: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  ACTIVE: { badge: 'bg-cyan-500/10 text-cyan-400', border: 'border-cyan-500/30', dot: 'bg-cyan-400 animate-pulse' },
  IDLE: { badge: 'bg-slate-500/10 text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' },
  ALERT: { badge: 'bg-red-500/10 text-red-400', border: 'border-red-500/30', dot: 'bg-red-400 animate-ping' },
};

export default function SystemOSStateMap() {
  const [nodes, setNodes] = useState<SystemNode[]>(SYSTEM_NODES);
  const [selectedNode, setSelectedNode] = useState<SystemNode | null>(null);
  const [livePulse, setLivePulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(p => p + 1);
      // Simulate real-time event counts incrementing
      setNodes(prev => prev.map(n => ({
        ...n,
        eventsProcessed: n.eventsProcessed + Math.floor(Math.random() * 2),
      })));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalAgentsActive = nodes.reduce((sum, n) => sum + n.activeAgents, 0);
  const totalEvents = nodes.reduce((sum, n) => sum + n.eventsProcessed, 0);

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-b from-[#0e0e16] to-[#09090b] border border-white/8 text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-xl">🌐</div>
          <div>
            <h2 className="text-base font-black text-white">Company OS Live Neural Topology</h2>
            <p className="text-xs text-slate-500">Mạng lưới liên kết 9 hệ thống phụ &amp; 25 AI Agents thời gian thực</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-semibold">{totalAgentsActive} AI Staff Live</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-violet-950/40 border border-violet-500/30 text-xs text-violet-300 font-semibold">
            ⚡ {totalEvents.toLocaleString()} Events
          </div>
        </div>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {nodes.map(node => {
          const cfg = STATUS_COLOR[node.status];
          const isSelected = selectedNode?.id === node.id;
          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-4 rounded-xl border bg-white/3 hover:bg-white/6 cursor-pointer transition-all ${
                isSelected ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-500/10' : cfg.border
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{node.icon}</span>
                  <p className="text-sm font-bold text-slate-200">{node.name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cfg.badge}`}>
                    {node.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-white/5">
                <span>🤖 {node.activeAgents} Agents</span>
                <span>⚡ {node.eventsProcessed} events</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Drawer */}
      {selectedNode && (
        <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 animate-fade-in flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedNode.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{selectedNode.name}</p>
              <p className="text-xs text-violet-300">Phân loại: {selectedNode.category} · Trạng thái: {selectedNode.status}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedNode(null)}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
