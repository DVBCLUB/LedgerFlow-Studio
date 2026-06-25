import { randomUUID } from 'node:crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type AuditCategory =
  | 'auth'
  | 'ai-key'
  | 'connector-write'
  | 'automation'
  | 'job'
  | 'import'
  | 'system';

export type ObservabilityContext = {
  correlationId?: string;
  actorId?: string;
  actorType?: 'user' | 'system' | 'agent' | 'connector';
  module?: string;
  route?: string;
  jobId?: string;
};

export type LogEvent = ObservabilityContext & {
  level: LogLevel;
  message: string;
  event: string;
  timestamp: string;
  details?: Record<string, unknown>;
};

export type AuditEvent = ObservabilityContext & {
  category: AuditCategory;
  action: string;
  result: 'success' | 'failure' | 'blocked' | 'pending';
  timestamp: string;
  target?: string;
  details?: Record<string, unknown>;
};

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(api[-_]?key|token|secret|password|passwd|credential|authorization|cookie|session|private[-_]?key|refresh[-_]?token|access[-_]?token)/i;

export function createCorrelationId(prefix = 'lf'): string {
  return `${prefix}_${randomUUID()}`;
}

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item));

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactSensitive(nested),
      ]),
    );
  }

  if (typeof value === 'string') {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`)
      .replace(/sk-[A-Za-z0-9_-]{12,}/g, REDACTED)
      .replace(/AIza[A-Za-z0-9_-]{20,}/g, REDACTED);
  }

  return value;
}

function safeJson(event: LogEvent | AuditEvent): string {
  return JSON.stringify(redactSensitive(event));
}

export function logEvent(level: LogLevel, event: string, message: string, context: ObservabilityContext = {}, details?: Record<string, unknown>): LogEvent {
  const payload: LogEvent = {
    ...context,
    correlationId: context.correlationId || createCorrelationId(),
    level,
    event,
    message,
    timestamp: new Date().toISOString(),
    details: details ? (redactSensitive(details) as Record<string, unknown>) : undefined,
  };

  const line = safeJson(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  return payload;
}

export function auditEvent(category: AuditCategory, action: string, result: AuditEvent['result'], context: ObservabilityContext = {}, details?: Record<string, unknown>): AuditEvent {
  const payload: AuditEvent = {
    ...context,
    correlationId: context.correlationId || createCorrelationId('audit'),
    category,
    action,
    result,
    timestamp: new Date().toISOString(),
    details: details ? (redactSensitive(details) as Record<string, unknown>) : undefined,
  };

  console.log(safeJson({ event: 'audit.event', ...payload }));
  return payload;
}
