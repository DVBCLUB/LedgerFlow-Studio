/**
 * AIWorkforceContext.tsx
 * ═══════════════════════════════════════════════════════════════
 * Background AI Workforce Context — chạy ngầm, không render UI giao diện.
 *
 * Quản lý trạng thái tập trung cho AI Workforce:
 *   - Polling /api/ai-workforce/health của server
 *   - SSE stream /api/ai-workforce/stream
 *   - Polling daemon 3001 cho Multi-Agent Swarms và Agentic Loops ngầm
 * ═══════════════════════════════════════════════════════════════
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { daemonFetch } from '../utils/assistantApi';

// ─── Types ──────────────────────────────────────────────────────

export interface AIBackgroundService {
  name: string;
  status: 'running' | 'idle' | 'error';
}

export interface AIWorkforceHealthSnapshot {
  ok: boolean;
  generatedAt: string;
  readinessGrade: string;
  readinessScore: number;
  activeRuns: number;
  pendingApprovals: number;
  blockedCount: number;
  totalQueued: number;
  lastAuditAction: string;
  lastAuditAt: string;
  backgroundServices: AIBackgroundService[];
}

// Multi-Agent Swarm Types
export interface SwarmTask {
  id: string;
  role: string;
  goal: string;
  priority: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'blocked';
  startedAt?: string;
  completedAt?: string;
  result?: {
    success: boolean;
    content: string;
  };
}

export interface SwarmPlan {
  id: string;
  goal: string;
  domain: string;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  tasks: SwarmTask[];
  createdAt: string;
  summary?: string;
}

// Agentic Loop Types
export interface AgenticLoopRun {
  id: string;
  loopId: string;
  status: 'running' | 'idle' | 'completed' | 'failed' | 'stopped';
  startedAt: string;
  completedAt?: string;
  currentStep?: string;
  stepsCount: number;
  error?: string;
}

export interface AIWorkforceState {
  /** Snapshot sức khỏe mới nhất từ backend */
  snapshot: AIWorkforceHealthSnapshot | null;
  /** Danh sách các Multi-Agent Swarm Plans */
  swarmPlans: SwarmPlan[];
  /** Danh sách các Agentic Loop runs ngầm */
  agenticLoops: AgenticLoopRun[];
  /** Hệ thống AI đang kết nối được không */
  connected: boolean;
  /** Đang fetch lần đầu */
  loading: boolean;
  /** Thời gian cập nhật gần nhất */
  lastSync: Date | null;
  /** Lỗi nếu có */
  error: string | null;
  /** Kích hoạt fetch ngay lập tức */
  refresh: () => void;
  /** Khởi chạy một Multi-Agent Swarm ngầm */
  runSwarm: (goal: string, domain?: string, parallel?: boolean) => Promise<SwarmPlan>;
  /** Kích hoạt một Background Loop tự trị ngầm */
  triggerLoop: (loopId: string, input?: Record<string, any>) => Promise<AgenticLoopRun>;
}

// ─── Defaults ───────────────────────────────────────────────────

const DEFAULT_STATE: AIWorkforceState = {
  snapshot: null,
  swarmPlans: [],
  agenticLoops: [],
  connected: false,
  loading: true,
  lastSync: null,
  error: null,
  refresh: () => {},
  runSwarm: async () => { throw new Error('Provider not initialized'); },
  triggerLoop: async () => { throw new Error('Provider not initialized'); },
};

const POLL_INTERVAL_MS = 30_000; // 30 giây
const INITIAL_DELAY_MS = 1_500;  // Delay nhỏ sau khi mount để tránh blocking render đầu

// ─── Context ────────────────────────────────────────────────────

const AIWorkforceContext = createContext<AIWorkforceState>(DEFAULT_STATE);

// ─── Provider ───────────────────────────────────────────────────

export function AIWorkforceProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<AIWorkforceHealthSnapshot | null>(null);
  const [swarmPlans, setSwarmPlans] = useState<SwarmPlan[]>([]);
  const [agenticLoops, setAgenticLoops] = useState<AgenticLoopRun[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-workforce/health', {
        credentials: 'include',
        signal: AbortSignal.timeout(10_000),
      });
      if (!mountedRef.current) return;
      if (!res.ok) {
        setConnected(false);
        setError(`HTTP ${res.status}`);
        return;
      }
      const data = await res.json() as { success?: boolean; snapshot?: AIWorkforceHealthSnapshot; error?: string };
      if (!mountedRef.current) return;
      if (data?.success && data?.snapshot) {
        setSnapshot(data.snapshot);
        setConnected(data.snapshot.ok ?? true);
        setLastSync(new Date());
        setError(null);
      } else {
        setConnected(false);
        setError(data?.error ?? 'Unknown response');
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const fetchSwarmAndLoops = useCallback(async () => {
    try {
      const swarmRes = await daemonFetch<{ ok: boolean; plans: SwarmPlan[] }>('/api/multi-agent/plans').catch(() => null);
      const loopsRes = await daemonFetch<{ ok: boolean; runs: AgenticLoopRun[] }>('/api/agentic-loop/runs').catch(() => null);
      
      if (!mountedRef.current) return;
      if (swarmRes?.ok) {
        setSwarmPlans(swarmRes.plans || []);
      }
      if (loopsRes?.ok) {
        setAgenticLoops(loopsRes.runs || []);
      }
    } catch {
      // Ignore background daemon fetching errors to prevent UI toast spam
    }
  }, []);

  const startSSEStream = useCallback(() => {
    if (typeof EventSource === 'undefined' || sseRef.current) return;
    try {
      const es = new EventSource('/api/ai-workforce/stream');
      sseRef.current = es;
      es.addEventListener('health', (event: Event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse((event as MessageEvent<string>).data) as AIWorkforceHealthSnapshot;
          setSnapshot(data);
          setConnected(data.ok ?? true);
          setLastSync(new Date());
          setError(null);
          setLoading(false);
        } catch { /* ignore parse error */ }
      });
      es.addEventListener('ping', () => {
        if (mountedRef.current) setLastSync(new Date());
      });
      es.onerror = () => {
        es.close();
        sseRef.current = null;
      };
    } catch {
      sseRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    void fetchSnapshot();
    void fetchSwarmAndLoops();
  }, [fetchSnapshot, fetchSwarmAndLoops]);

  const runSwarm = useCallback(async (goal: string, domain = 'general', parallel = true) => {
    const res = await daemonFetch<{ ok: boolean; plan: SwarmPlan }>('/api/multi-agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, domain, parallel }),
    });
    void fetchSwarmAndLoops();
    return res.plan;
  }, [fetchSwarmAndLoops]);

  const triggerLoop = useCallback(async (loopId: string, input: Record<string, any> = {}) => {
    const res = await daemonFetch<{ ok: boolean; run: AgenticLoopRun }>('/api/agentic-loop/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loopId, input }),
    });
    void fetchSwarmAndLoops();
    return res.run;
  }, [fetchSwarmAndLoops]);

  useEffect(() => {
    mountedRef.current = true;
    const initTimer = setTimeout(() => {
      void fetchSnapshot();
      void fetchSwarmAndLoops();
      startSSEStream();
      intervalRef.current = setInterval(() => {
        void fetchSnapshot();
        void fetchSwarmAndLoops();
      }, POLL_INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [fetchSnapshot, fetchSwarmAndLoops, startSSEStream]);

  return (
    <AIWorkforceContext.Provider value={{
      snapshot,
      swarmPlans,
      agenticLoops,
      connected,
      loading,
      lastSync,
      error,
      refresh,
      runSwarm,
      triggerLoop
    }}>
      {children}
    </AIWorkforceContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────

/**
 * useAIWorkforce — Hook để đọc trạng thái AI workforce ngầm.
 */
export function useAIWorkforce(): AIWorkforceState {
  return useContext(AIWorkforceContext);
}

/** Số lượng agents đang active */
export function useAIWorkforceActiveCount(): number {
  return useAIWorkforce().snapshot?.activeRuns ?? 0;
}

/** Số lượng nhiệm vụ chờ phê duyệt */
export function useAIWorkforcePendingApprovals(): number {
  return useAIWorkforce().snapshot?.pendingApprovals ?? 0;
}
