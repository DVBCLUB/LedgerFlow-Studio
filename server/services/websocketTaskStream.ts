/**
 * websocketTaskStream.ts
 * ============================================================
 * WEBSOCKET TASK STREAM - Real-time Task Streaming Server
 * ------------------------------------------------------------
 * Streams Auto-Programmer and Multi-Model task progress,
 * results, and status updates to connected frontend clients
 * in real-time via WebSocket.
 * ============================================================
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'node:http';
import {
  authenticateWebSocketUpgrade,
  trackWebSocketConnection,
  validateIncomingWsMessage,
  type WebSocketClientContext,
} from './websocketAuth.ts';

let wss: WebSocketServer | null = null;

// ─── Message Types ─────────────────────────────────────────────────────────────

export interface TaskStreamMessage {
  type: 'task_progress' | 'task_completed' | 'task_failed' | 'task_log' | 'health';
  taskId?: string;
  projectType?: string;
  status?: string;
  progress?: number;
  content?: string;
  log?: string;
  modelUsed?: string;
  latencyMs?: number;
  timestamp: string;
}

// ─── Start Server ──────────────────────────────────────────────────────────────

export function startTaskStreamWebSocketServer(server: Server): void {
  if (wss) return;

  wss = new WebSocketServer({
    server,
    path: '/ws/task-stream',
    verifyClient: (info, callback) => {
      const auth = authenticateWebSocketUpgrade(info.req);
      if (!auth.allowed) {
        console.warn(`[TaskStreamWS] Connection rejected: ${auth.error}`);
        callback(false, auth.statusCode || 401, auth.error);
        return;
      }
      callback(true);
    },
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const auth = authenticateWebSocketUpgrade(req);
    const context: WebSocketClientContext = auth.context || {
      authenticated: false,
      clientIp: req.socket.remoteAddress || '127.0.0.1',
      connectedAt: Date.now(),
      messageCount: 0,
      lastMessageTimestamp: Date.now(),
    };

    const cleanupTrack = trackWebSocketConnection(context.clientIp);
    console.log(`[TaskStreamWS] Client connected: ${context.email || 'anon'} (${context.clientIp})`);

    // Send initial health check
    sendToClient(ws, {
      type: 'health',
      content: 'Task Stream WebSocket connected',
      timestamp: new Date().toISOString(),
    });

    ws.on('close', () => {
      cleanupTrack();
      console.log('[TaskStreamWS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[TaskStreamWS] Error:', err.message);
    });

    ws.on('message', (raw) => {
      const validation = validateIncomingWsMessage<{ type: string }>(raw, context);
      if (!validation.valid || !validation.data) {
        console.warn(`[TaskStreamWS] Invalid message from ${context.clientIp}: ${validation.error}`);
        return;
      }

      const msg = validation.data;
      // Handle ping/pong keepalive
      if (msg.type === 'ping') {
        sendToClient(ws, { type: 'health', content: 'pong', timestamp: new Date().toISOString() });
      }
    });
  });

  console.log('[TaskStreamWS] WebSocket server started on /ws/task-stream (Authenticated & Rate-Limited)');
}

// ─── Broadcast Functions ───────────────────────────────────────────────────────

export function broadcastTaskProgress(update: {
  taskId: string;
  projectType: string;
  status: string;
  progress: number;
  content?: string;
  modelUsed?: string;
}): void {
  if (!wss || wss.clients.size === 0) return;

  const msg: TaskStreamMessage = {
    type: 'task_progress',
    taskId: update.taskId,
    projectType: update.projectType,
    status: update.status,
    progress: update.progress,
    content: update.content,
    modelUsed: update.modelUsed,
    timestamp: new Date().toISOString(),
  };

  broadcast(msg);
}

export function broadcastTaskCompleted(update: {
  taskId: string;
  projectType: string;
  content: string;
  modelUsed: string;
  latencyMs: number;
}): void {
  if (!wss || wss.clients.size === 0) return;

  const msg: TaskStreamMessage = {
    type: 'task_completed',
    taskId: update.taskId,
    projectType: update.projectType,
    status: 'completed',
    progress: 100,
    content: update.content,
    modelUsed: update.modelUsed,
    latencyMs: update.latencyMs,
    timestamp: new Date().toISOString(),
  };

  broadcast(msg);
}

export function broadcastTaskFailed(update: {
  taskId: string;
  projectType: string;
  error: string;
}): void {
  if (!wss || wss.clients.size === 0) return;

  const msg: TaskStreamMessage = {
    type: 'task_failed',
    taskId: update.taskId,
    projectType: update.projectType,
    status: 'failed',
    progress: 0,
    content: update.error,
    timestamp: new Date().toISOString(),
  };

  broadcast(msg);
}

export function broadcastTaskLog(taskId: string, log: string): void {
  if (!wss || wss.clients.size === 0) return;

  const msg: TaskStreamMessage = {
    type: 'task_log',
    taskId,
    log,
    timestamp: new Date().toISOString(),
  };

  broadcast(msg);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sendToClient(ws: WebSocket, msg: TaskStreamMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(msg: TaskStreamMessage): void {
  const data = JSON.stringify(msg);
  wss!.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

export function stopTaskStreamWebSocketServer(): void {
  if (wss) {
    wss.close();
    wss = null;
  }
  console.log('[TaskStreamWS] WebSocket server stopped');
}

export function getTaskStreamWebSocketServer(): WebSocketServer | null {
  return wss;
}
