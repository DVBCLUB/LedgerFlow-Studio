/**
 * useCostWebSocket.ts
 * ============================================================
 * React hook for connecting to the cost WebSocket server.
 * Provides real-time cost updates and budget alerts via toast notifications.
 */

import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const WS_BASE = 'ws://127.0.0.1:3000';

export interface CostUpdateMessage {
  type: 'cost_update';
  totalCostUsd: number;
  byAgent: Record<string, { cost: number; calls: number; avgLatencyMs: number }>;
  byModel: Record<string, { cost: number; calls: number; tokens: number }>;
  recentCount: number;
  timestamp: string;
}

export interface BudgetAlertMessage {
  type: 'budget_alert';
  level: 'warning' | 'critical' | 'exhausted';
  usagePct: number;
  spentUsd: number;
  capUsd: number;
  message: string;
  timestamp: string;
}

export type WsMessage = CostUpdateMessage | BudgetAlertMessage;

interface UseCostWebSocketOptions {
  onCostUpdate?: (data: CostUpdateMessage) => void;
  onBudgetAlert?: (data: BudgetAlertMessage) => void;
  enabled?: boolean;
}

export function useCostWebSocket(options: UseCostWebSocketOptions = {}) {
  const { onCostUpdate, onBudgetAlert, enabled = true } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/cost`);

      ws.onopen = () => {
        console.log('[CostWS] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);

          if (msg.type === 'cost_update') {
            onCostUpdate?.(msg);
          } else if (msg.type === 'budget_alert') {
            // Show toast notification
            const toastFn = msg.level === 'warning'
              ? toast
              : msg.level === 'critical'
                ? toast
                : toast;

            const emoji = msg.level === 'exhausted' ? '🚨' : msg.level === 'critical' ? '🔴' : '🟡';

            toastFn(
              `${emoji} ${msg.message}`,
              {
                duration: msg.level === 'exhausted' ? 10000 : 6000,
                style: {
                  background: msg.level === 'exhausted'
                    ? '#1a0a0a'
                    : msg.level === 'critical'
                      ? '#1a0a0a'
                      : '#0a1a0a',
                  border: msg.level === 'exhausted'
                    ? '1px solid #ef4444'
                    : msg.level === 'critical'
                      ? '1px solid #f97316'
                      : '1px solid #eab308',
                  color: '#e2e8f0',
                  fontSize: '12px',
                },
                icon: emoji,
              }
            );

            onBudgetAlert?.(msg);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        console.log('[CostWS] Disconnected, reconnecting in 5s...');
        // Auto reconnect
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[CostWS] Connection failed:', err);
      // Retry after 10s
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 10000);
    }
  }, [enabled, onCostUpdate, onBudgetAlert]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect: () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    },
    reconnect: connect,
  };
}
