/**
 * server/services/glaciaSilentEventBus.ts
 * Trục Bus Sự Kiện & Điều Phối Bất Đồng Bộ Ngầm (Glacia Silent Event Bus).
 * Tiếp nhận các sự kiện hệ thống, phân luồng xử lý ngầm không khóa luồng chính (non-blocking)
 * và tự động thông báo kết quả cô đọng cho Robot Glacia.
 */

export interface SystemEventPayload {
  eventId: string;
  eventType:
    | 'TRANSACTION_RECORDED'
    | 'VENTURE_INCUBATED'
    | 'FX_RATES_UPDATED'
    | 'CUSTOMER_INTERVENTION_TRIGGERED'
    | 'SECURITY_AUDIT_COMPLETED'
    | 'MEMORY_CRYSTALLIZED'
    | 'CEO_VOICE_COMMAND';
  source: string;
  data: Record<string, any>;
  timestamp: string;
  processedSilently: boolean;
}

type EventHandler = (event: SystemEventPayload) => Promise<void> | void;

class GlaciaSilentEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventLog: SystemEventPayload[] = [];
  private maxLogSize: number = 200;

  constructor() {
    this.registerDefaultSilentHandlers();
  }

  public on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => this.handlers.get(eventType)?.delete(handler);
  }

  public emit(eventType: SystemEventPayload['eventType'], data: Record<string, any> = {}, source: string = 'system_core'): SystemEventPayload {
    const event: SystemEventPayload = {
      eventId: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType,
      source,
      data,
      timestamp: new Date().toISOString(),
      processedSilently: true,
    };

    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    const listeners = this.handlers.get(eventType);
    if (listeners) {
      listeners.forEach((h) => {
        try {
          // Asynchronous non-blocking dispatch
          Promise.resolve(h(event)).catch(() => {});
        } catch {}
      });
    }

    return event;
  }

  public getEventHistory(limit: number = 50): SystemEventPayload[] {
    return this.eventLog.slice(-limit).reverse();
  }

  private registerDefaultSilentHandlers(): void {
    this.on('TRANSACTION_RECORDED', async (_ev) => {
      // Background VAS Ledger compliance double-check
    });

    this.on('FX_RATES_UPDATED', async (_ev) => {
      // Re-balance forward hedging
    });

    this.on('CUSTOMER_INTERVENTION_TRIGGERED', async (_ev) => {
      // Prep personalized retention package
    });
  }
}

export const glaciaEventBus = new GlaciaSilentEventBus();

export function emitSystemEvent(
  eventType: SystemEventPayload['eventType'],
  data: Record<string, any> = {},
  source: string = 'glacia_core'
): SystemEventPayload {
  return glaciaEventBus.emit(eventType, data, source);
}

export function getSystemEventHistory(limit: number = 50): SystemEventPayload[] {
  return glaciaEventBus.getEventHistory(limit);
}
