/**
 * costWebSocketServer.ts
 * ============================================================
 * WebSocket server for real-time cost updates and budget alerts.
 * Pushes cost snapshot changes and threshold alerts to connected clients.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'node:http';
import { getSnapshot } from './costObservability.ts';
import { getGovernorConfig } from './costGovernor.ts';
import {
  authenticateWebSocketUpgrade,
  trackWebSocketConnection,
  type WebSocketClientContext,
} from './websocketAuth.ts';

let wss: WebSocketServer | null = null;
let broadcastInterval: ReturnType<typeof setInterval> | null = null;
let lastAlertedPct = new Set<string>();

interface CostUpdateMessage {
  type: 'cost_update';
  totalCostUsd: number;
  byAgent: Record<string, { cost: number; calls: number; avgLatencyMs: number }>;
  byModel: Record<string, { cost: number; calls: number; tokens: number }>;
  recentCount: number;
  timestamp: string;
}

interface BudgetAlertMessage {
  type: 'budget_alert';
  level: 'warning' | 'critical' | 'exhausted';
  usagePct: number;
  spentUsd: number;
  capUsd: number;
  message: string;
  timestamp: string;
}

export function startCostWebSocketServer(server: Server): void {
  if (wss) return; // Already started

  wss = new WebSocketServer({
    server,
    path: '/ws/cost',
    verifyClient: (info, callback) => {
      const auth = authenticateWebSocketUpgrade(info.req);
      if (!auth.allowed) {
        console.warn(`[CostWS] Connection rejected: ${auth.error}`);
        callback(false, auth.statusCode || 401, auth.error);
        return;
      }
      callback(true);
    },
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const auth = authenticateWebSocketUpgrade(req);
    const clientIp = req.socket.remoteAddress || '127.0.0.1';
    const cleanupTrack = trackWebSocketConnection(clientIp);

    console.log(`[CostWS] Client connected: ${auth.context?.email || 'authenticated'} (${clientIp})`);

    // Send initial snapshot
    sendCostUpdate(ws);

    ws.on('close', () => {
      cleanupTrack();
      console.log('[CostWS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[CostWS] Error:', err.message);
    });
  });

  // Broadcast every 5 seconds
  broadcastInterval = setInterval(() => {
    if (!wss || wss.clients.size === 0) return;

    const snapshot = getSnapshot(30);
    const config = getGovernorConfig();
    const spent = snapshot.totalCostUsd;
    const cap = config.monthlyCapUsd;

    // Broadcast cost update
    const updateMsg: CostUpdateMessage = {
      type: 'cost_update',
      totalCostUsd: spent,
      byAgent: snapshot.byAgent,
      byModel: snapshot.byModel,
      recentCount: snapshot.recentRecords.length,
      timestamp: new Date().toISOString(),
    };

    const data = JSON.stringify(updateMsg);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });

    // Check budget thresholds and send alerts
    if (cap > 0 && config.enabled) {
      const usagePct = (spent / cap) * 100;
      const alertKey = `${Math.floor(usagePct / 5) * 5}`; // Group by 5% intervals

      // Alert at 50%, 80%, 95%
      const thresholds = [50, 80, 95];
      for (const threshold of thresholds) {
        if (usagePct >= threshold && !lastAlertedPct.has(`threshold_${threshold}`)) {
          lastAlertedPct.add(`threshold_${threshold}`);

          const level = threshold >= 95 ? 'exhausted' : threshold >= 80 ? 'critical' : 'warning';
          const alertMsg: BudgetAlertMessage = {
            type: 'budget_alert',
            level,
            usagePct: +usagePct.toFixed(1),
            spentUsd: spent,
            capUsd: cap,
            message: threshold >= 95
              ? `⚠️ Budget Exhausted: Đã dùng ${usagePct.toFixed(1)}% ($${spent.toFixed(2)}/$${cap}). Hạ cấp xuống tier free local.`
              : threshold >= 80
                ? `🔴 Budget Critical: Đạt ${usagePct.toFixed(1)}% ngưỡng ($${spent.toFixed(2)}/$${cap}). Hạ cấp từ flagship.`
                : `🟡 Budget Warning: Đã dùng ${usagePct.toFixed(1)}% ngân sách ($${spent.toFixed(2)}/$${cap}).`,
            timestamp: new Date().toISOString(),
          };

          const alertData = JSON.stringify(alertMsg);
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(alertData);
            }
          });
        }
      }

      // Reset alerts when usage drops below threshold (e.g., after reset)
      if (usagePct < 45) {
        lastAlertedPct.clear();
      }
    }
  }, 5000);

  console.log('[CostWS] WebSocket server started on /ws/cost');
}

function sendCostUpdate(ws: WebSocket): void {
  try {
    const snapshot = getSnapshot(30);
    const msg: CostUpdateMessage = {
      type: 'cost_update',
      totalCostUsd: snapshot.totalCostUsd,
      byAgent: snapshot.byAgent,
      byModel: snapshot.byModel,
      recentCount: snapshot.recentRecords.length,
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(msg));
  } catch (err) {
    console.error('[CostWS] Error sending initial update:', err);
  }
}

export function stopCostWebSocketServer(): void {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
  if (wss) {
    wss.close();
    wss = null;
  }
  lastAlertedPct.clear();
  console.log('[CostWS] WebSocket server stopped');
}

export function getCostWebSocketServer(): WebSocketServer | null {
  return wss;
}
