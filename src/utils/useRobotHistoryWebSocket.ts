/**
 * useRobotHistoryWebSocket.ts
 * ============================================================
 * React hook for connecting to the robot history WebSocket server.
 * Provides real-time robot execution history updates.
 */

import { useEffect, useRef, useCallback } from 'react';

const WS_BASE = 'ws://127.0.0.1:3000';

export interface RobotHistoryUpdateMessage {
  type: 'robot_history_update';
  entry: {
    id: string;
    toolType: string;
    summary: string;
    success: boolean;
    output: string;
    error?: string;
    executedAt: string;
  };
  timestamp: string;
}

interface UseRobotHistoryWebSocketOptions {
  onHistoryUpdate?: (data: RobotHistoryUpdateMessage) => void;
  enabled?: boolean;
}

export function useRobotHistoryWebSocket(options: UseRobotHistoryWebSocketOptions = {}) {
  const { onHistoryUpdate, enabled = true } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/robot-history`);

      ws.onopen = () => {
        console.log('[RobotHistoryWS] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'robot_history_update') {
            onHistoryUpdate?.(msg as RobotHistoryUpdateMessage);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        console.log('[RobotHistoryWS] Disconnected, reconnecting in 5s...');
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
      console.error('[RobotHistoryWS] Connection failed:', err);
      // Retry after 10s
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 10000);
    }
  }, [enabled, onHistoryUpdate]);

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
