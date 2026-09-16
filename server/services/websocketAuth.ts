/**
 * websocketAuth.ts
 * ============================================================
 * Centralized WebSocket Security & Authentication Guard
 * ------------------------------------------------------------
 * Enforces:
 * 1. Handshake authentication (Cookie, Bearer token, query token, API token)
 * 2. Local/Desktop dev loop compatibility
 * 3. Connection rate-limiting per IP
 * 4. Message rate-limiting per connection
 * 5. Incoming message schema validation
 * ============================================================
 */

import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';
import { validateSessionToken, SESSION_COOKIE_NAME, type LocalRole } from './localAuth.ts';

export interface WebSocketClientContext {
  authenticated: boolean;
  email?: string;
  role?: LocalRole;
  clientIp: string;
  connectedAt: number;
  messageCount: number;
  lastMessageTimestamp: number;
}

// Map tracking active IP connections to prevent connection flooding
const activeIpConnections = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 30;

// Message rate limit: 60 messages per second per client
const MESSAGE_RATE_LIMIT_PER_SEC = 60;
const MAX_PAYLOAD_BYTES = 64 * 1024; // 64KB

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((part) => {
      const separator = part.indexOf('=');
      if (separator < 0) return [part.trim(), ''];
      return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1))];
    })
  );
}

function extractToken(req: IncomingMessage): string | null {
  // 1. From Cookie
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[SESSION_COOKIE_NAME]) {
    return cookies[SESSION_COOKIE_NAME];
  }

  // 2. From Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 3. From URL query string (?token=...)
  if (req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (token) return token.trim();
    } catch {
      // Ignore malformed URL
    }
  }

  // 4. From Sec-WebSocket-Protocol header (common WebSocket auth pattern)
  const protocols = req.headers['sec-websocket-protocol'];
  if (protocols) {
    const parts = protocols.split(',').map((p) => p.trim());
    const authPart = parts.find((p) => p.startsWith('token.'));
    if (authPart) return authPart.replace(/^token\./, '');
  }

  return null;
}

function isLocalAddress(ip: string): boolean {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

/**
 * Authenticate and authorize a WebSocket connection attempt during HTTP upgrade.
 */
export function authenticateWebSocketUpgrade(req: IncomingMessage): {
  allowed: boolean;
  context?: WebSocketClientContext;
  error?: string;
  statusCode?: number;
} {
  const clientIp = getClientIp(req);

  // 1. Connection limit per IP
  const currentCount = activeIpConnections.get(clientIp) || 0;
  if (currentCount >= MAX_CONNECTIONS_PER_IP) {
    return {
      allowed: false,
      error: `Too many active WebSocket connections from ${clientIp}`,
      statusCode: 429,
    };
  }

  // 2. Extract token
  const token = extractToken(req);

  if (token) {
    // Check API token
    const configuredApiToken = process.env.LEDGERFLOW_API_TOKEN;
    if (configuredApiToken && token === configuredApiToken) {
      return {
        allowed: true,
        context: {
          authenticated: true,
          email: 'automation@ledgerflow.local',
          role: 'automation',
          clientIp,
          connectedAt: Date.now(),
          messageCount: 0,
          lastMessageTimestamp: Date.now(),
        },
      };
    }

    // Check signed session
    const session = validateSessionToken(token);
    if (session) {
      return {
        allowed: true,
        context: {
          authenticated: true,
          email: session.email,
          role: session.role,
          clientIp,
          connectedAt: Date.now(),
          messageCount: 0,
          lastMessageTimestamp: Date.now(),
        },
      };
    }
  }

  // 3. Fallback for Desktop App or Localhost Development
  // In Electron Desktop or local development without remote exposure, allow loopback access
  const isDesktop = process.env.ELECTRON_DESKTOP === 'true';
  const isDev = process.env.NODE_ENV !== 'production';

  if (isLocalAddress(clientIp) && (isDesktop || isDev)) {
    return {
      allowed: true,
      context: {
        authenticated: true,
        email: 'davidbao1704@gmail.com', // Owner context in local desktop
        role: 'owner',
        clientIp,
        connectedAt: Date.now(),
        messageCount: 0,
        lastMessageTimestamp: Date.now(),
      },
    };
  }

  return {
    allowed: false,
    error: 'WebSocket authentication required: Invalid or missing session token',
    statusCode: 401,
  };
}

/**
 * Register connection lifecycle to track active connections per IP.
 */
export function trackWebSocketConnection(clientIp: string): () => void {
  const count = activeIpConnections.get(clientIp) || 0;
  activeIpConnections.set(clientIp, count + 1);

  return () => {
    const updated = (activeIpConnections.get(clientIp) || 1) - 1;
    if (updated <= 0) {
      activeIpConnections.delete(clientIp);
    } else {
      activeIpConnections.set(clientIp, updated);
    }
  };
}

/**
 * Validate incoming WebSocket message against rate limits and payload schema.
 */
export function validateIncomingWsMessage<T = any>(
  raw: unknown,
  context: WebSocketClientContext
): { valid: boolean; data?: T; error?: string } {
  const now = Date.now();

  // Rate limiting check
  if (now - context.lastMessageTimestamp < 1000) {
    context.messageCount++;
    if (context.messageCount > MESSAGE_RATE_LIMIT_PER_SEC) {
      return { valid: false, error: 'Rate limit exceeded (max 60 messages/sec)' };
    }
  } else {
    context.messageCount = 1;
    context.lastMessageTimestamp = now;
  }

  // Size limit check
  const rawStr = typeof raw === 'string' ? raw : raw instanceof Buffer ? raw.toString('utf8') : String(raw);
  if (rawStr.length > MAX_PAYLOAD_BYTES) {
    return { valid: false, error: `Payload too large (max ${MAX_PAYLOAD_BYTES} bytes)` };
  }

  // Parse JSON
  try {
    const parsed = JSON.parse(rawStr);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid message: must be a JSON object' };
    }
    if (typeof (parsed as any).type !== 'string') {
      return { valid: false, error: 'Invalid message schema: missing "type" string property' };
    }
    return { valid: true, data: parsed as T };
  } catch (err: any) {
    return { valid: false, error: `Malformed JSON message: ${err?.message || 'unknown'}` };
  }
}
