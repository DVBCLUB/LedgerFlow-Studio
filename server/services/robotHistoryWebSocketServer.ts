/**
 * robotHistoryWebSocketServer.ts
 * ============================================================
 * WebSocket server for real-time robot execution history updates.
 * Pushes new execution entries to connected clients as they occur.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'node:http';
import {
  authenticateWebSocketUpgrade,
  trackWebSocketConnection,
} from './websocketAuth.ts';

let wss: WebSocketServer | null = null;

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

export function startRobotHistoryWebSocketServer(server: Server): void {
  if (wss) return; // Already started

  wss = new WebSocketServer({
    server,
    path: '/ws/robot-history',
    verifyClient: (info, callback) => {
      const auth = authenticateWebSocketUpgrade(info.req);
      if (!auth.allowed) {
        console.warn(`[RobotHistoryWS] Connection rejected: ${auth.error}`);
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

    console.log(`[RobotHistoryWS] Client connected: ${auth.context?.email || 'authenticated'} (${clientIp})`);

    ws.on('close', () => {
      cleanupTrack();
      console.log('[RobotHistoryWS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[RobotHistoryWS] Error:', err.message);
    });
  });

  console.log('[RobotHistoryWS] WebSocket server started on /ws/robot-history (Authenticated & Rate-Limited)');
}

export function broadcastRobotHistoryUpdate(entry: {
  id: string;
  toolType: string;
  summary: string;
  success: boolean;
  output: string;
  error?: string;
  executedAt: string;
}): void {
  if (!wss || wss.clients.size === 0) return;

  const msg: RobotHistoryUpdateMessage = {
    type: 'robot_history_update',
    entry,
    timestamp: new Date().toISOString(),
  };

  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export function stopRobotHistoryWebSocketServer(): void {
  if (wss) {
    wss.close();
    wss = null;
  }
  console.log('[RobotHistoryWS] WebSocket server stopped');
}

export function getRobotHistoryWebSocketServer(): WebSocketServer | null {
  return wss;
}
