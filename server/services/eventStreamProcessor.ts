/**
 * eventStreamProcessor.ts
 * ============================================================
 * Event Stream Processor — real-time event processing
 * pipeline với filtering, transformation, aggregation,
 * và forwarding đến các sinks.
 *
 * Use cases: log processing, metric aggregation, alert triggering
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type EventStreamType = 'system_log' | 'ai_metric' | 'user_action' | 'file_event' | 'custom';

export interface StreamEvent {
  id: string;
  stream: string;
  type: EventStreamType;
  payload: Record<string, unknown>;
  timestamp: string;
  source: string;
}

export interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'regex' | 'exists';
  value: string;
}

export interface TransformRule {
  field: string;
  operation: 'extract' | 'rename' | 'add_prefix' | 'format_date' | 'to_number' | 'to_lowercase';
  params: Record<string, string>;
}

export interface AggregationRule {
  windowMs: number;          // Aggregation window
  groupBy: string[];         // Fields to group by
  aggregators: Array<{ field: string; function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct_count' }>;
}

export interface EventPipeline {
  id: string;
  name: string;
  description: string;
  streamFilter: string[];            // Stream names to process
  filters: FilterRule[];
  transforms: TransformRule[];
  aggregation: AggregationRule | null;
  sinks: EventSink[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventSink {
  type: 'file' | 'console' | 'in_memory' | 'http_forward';
  config: Record<string, string>;
}

export interface AggregatedBucket {
  key: string;
  values: Record<string, number>;
  count: number;
  windowStart: string;
  windowEnd: string;
}

// ─── Storage ────────────────────────────────────────────────────────
const PIPELINES_FILE = path.join(process.cwd(), 'event_pipelines.json');
const STREAM_BUFFER_FILE = path.join(process.cwd(), 'stream_events.json');

let pipelines: EventPipeline[] = [];
let streamEvents: StreamEvent[] = [];
const aggregationBuckets = new Map<string, AggregatedBucket[]>();

async function init(): Promise<void> {
  try {
    if (fs.existsSync(PIPELINES_FILE)) pipelines = JSON.parse(await fs.promises.readFile(PIPELINES_FILE, 'utf8'));
    if (fs.existsSync(STREAM_BUFFER_FILE)) streamEvents = JSON.parse(await fs.promises.readFile(STREAM_BUFFER_FILE, 'utf8'));
  } catch { }
}
init().catch(() => undefined);

async function savePipelines(): Promise<void> { await fs.promises.writeFile(PIPELINES_FILE, JSON.stringify(pipelines, null, 2), 'utf8'); }
async function saveEvents(): Promise<void> { await fs.promises.writeFile(STREAM_BUFFER_FILE, JSON.stringify(streamEvents.slice(-500), null, 2), 'utf8'); }

// ─── Core API ───────────────────────────────────────────────────────

export function createPipeline(input: {
  name: string; description?: string; streamFilter?: string[];
  filters?: FilterRule[]; transforms?: TransformRule[];
  aggregation?: AggregationRule | null; sinks?: EventSink[];
}): EventPipeline {
  const pipeline: EventPipeline = {
    id: `evp_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: input.name.slice(0, 100),
    description: input.description || '',
    streamFilter: input.streamFilter || ['*'],
    filters: input.filters || [],
    transforms: input.transforms || [],
    aggregation: input.aggregation || null,
    sinks: input.sinks || [{ type: 'in_memory', config: {} }],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  pipelines.push(pipeline);
  savePipelines().catch(() => undefined);
  return pipeline;
}

export function getPipeline(id: string): EventPipeline | undefined { return pipelines.find(p => p.id === id); }
export function listPipelines(): EventPipeline[] { return [...pipelines]; }

export function deletePipeline(id: string): boolean {
  const idx = pipelines.findIndex(p => p.id === id);
  if (idx < 0) return false;
  pipelines.splice(idx, 1);
  savePipelines().catch(() => undefined);
  return true;
}

export function publishEvent(
  stream: string,
  type: EventStreamType,
  payload: Record<string, unknown>,
  source = 'system',
): StreamEvent {
  const event: StreamEvent = {
    id: `ev_${Date.now()}_${randomUUID().slice(0, 6)}`,
    stream, type, payload,
    timestamp: new Date().toISOString(),
    source,
  };

  streamEvents.push(event);

  // Process through matching pipelines
  const matchingPipelines = pipelines.filter(p =>
    p.enabled &&
    (p.streamFilter.includes('*') || p.streamFilter.includes(stream))
  );

  for (const pipeline of matchingPipelines) {
    processEventThroughPipeline(event, pipeline);
  }

  if (streamEvents.length % 50 === 0) saveEvents().catch(() => undefined);
  return event;
}

function processEventThroughPipeline(event: StreamEvent, pipeline: EventPipeline): void {
  let currentPayload = { ...event.payload };

  // Step 1: Apply filters
  if (pipeline.filters.length > 0) {
    let passesAll = true;
    for (const filter of pipeline.filters) {
      const value = currentPayload[filter.field];
      switch (filter.operator) {
        case 'equals': passesAll = String(value) === filter.value; break;
        case 'contains': passesAll = String(value || '').includes(filter.value); break;
        case 'gt': passesAll = Number(value) > Number(filter.value); break;
        case 'lt': passesAll = Number(value) < Number(filter.value); break;
        case 'regex': try { passesAll = new RegExp(filter.value).test(String(value || '')); } catch { passesAll = false; } break;
        case 'exists': passesAll = value !== undefined && value !== null; break;
      }
      if (!passesAll) return; // Event filtered out
    }
  }

  // Step 2: Apply transforms
  for (const transform of pipeline.transforms) {
    switch (transform.operation) {
      case 'extract':
        if (typeof currentPayload[transform.field] === 'string') {
          const match = (currentPayload[transform.field] as string).match(new RegExp(transform.params.pattern || '.*'));
          currentPayload[transform.field] = match ? match[1] || match[0] : '';
        }
        break;
      case 'add_prefix':
        currentPayload[transform.field] = `${transform.params.prefix || ''}${currentPayload[transform.field] || ''}`;
        break;
      case 'to_number':
        currentPayload[transform.field] = Number(currentPayload[transform.field]) || 0;
        break;
      case 'to_lowercase':
        if (typeof currentPayload[transform.field] === 'string') {
          currentPayload[transform.field] = (currentPayload[transform.field] as string).toLowerCase();
        }
        break;
    }
  }

  // Step 3: Aggregation
  if (pipeline.aggregation) {
    const agg = pipeline.aggregation;
    const bucketKey = agg.groupBy.map(f => `${f}=${currentPayload[f]}`).join('|');
    const pipelineKey = `${pipeline.id}:${bucketKey}`;

    let buckets = aggregationBuckets.get(pipelineKey) || [];

    // Clean old buckets
    const cutoff = Date.now() - agg.windowMs;
    buckets = buckets.filter(b => new Date(b.windowEnd).getTime() > cutoff);

    // Find or create current window bucket
    const now = new Date();
    let bucket = buckets[buckets.length - 1];
    if (!bucket || new Date(bucket.windowEnd).getTime() <= now.getTime()) {
      bucket = {
        key: bucketKey,
        values: {},
        count: 0,
        windowStart: now.toISOString(),
        windowEnd: new Date(now.getTime() + agg.windowMs).toISOString(),
      };
      buckets.push(bucket);
    }

    bucket.count++;
    for (const ag of agg.aggregators) {
      const val = Number(currentPayload[ag.field]) || 0;
      switch (ag.function) {
        case 'count': bucket.values[`${ag.field}_${ag.function}`] = (bucket.values[`${ag.field}_${ag.function}`] || 0) + 1; break;
        case 'sum': bucket.values[`${ag.field}_${ag.function}`] = (bucket.values[`${ag.field}_${ag.function}`] || 0) + val; break;
        case 'max': bucket.values[`${ag.field}_${ag.function}`] = Math.max(bucket.values[`${ag.field}_${ag.function}`] || 0, val); break;
        case 'min': bucket.values[`${ag.field}_${ag.function}`] = Math.min(bucket.values[`${ag.field}_${ag.function}`] || Infinity, val); break;
      }
    }

    aggregationBuckets.set(pipelineKey, buckets);
  }

  // Step 4: Deliver to sinks
  for (const sink of pipeline.sinks) {
    deliverToSink(sink, { ...event, payload: currentPayload });
  }
}

function deliverToSink(sink: EventSink, event: StreamEvent): void {
  switch (sink.type) {
    case 'console':
      console.log(`[Stream:${event.stream}] ${event.type}: ${JSON.stringify(event.payload).slice(0, 200)}`);
      break;
    case 'file':
      const logFile = sink.config.filePath || path.join(process.cwd(), 'stream_output.log');
      fs.appendFileSync(logFile, `[${event.timestamp}] [${event.stream}] ${event.type}: ${JSON.stringify(event.payload)}\n`, 'utf8');
      break;
    case 'http_forward':
      if (sink.config.url) {
        fetch(sink.config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        }).catch(() => undefined);
      }
      break;
    case 'in_memory':
    default:
      break;
  }
}

export function listEvents(filter?: { stream?: string; type?: EventStreamType; limit?: number }): StreamEvent[] {
  let result = [...streamEvents];
  if (filter?.stream) result = result.filter(e => e.stream === filter.stream);
  if (filter?.type) result = result.filter(e => e.type === filter.type);
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return result.slice(0, filter?.limit || 200);
}

export function getAggregatedBuckets(pipelineId: string): AggregatedBucket[] {
  const result: AggregatedBucket[] = [];
  for (const [key, buckets] of aggregationBuckets) {
    if (key.startsWith(pipelineId)) result.push(...buckets);
  }
  return result;
}

export function getStreamStats(): { totalEvents: number; pipelineCount: number; activePipelines: number; activeAggregations: number } {
  return {
    totalEvents: streamEvents.length,
    pipelineCount: pipelines.length,
    activePipelines: pipelines.filter(p => p.enabled).length,
    activeAggregations: aggregationBuckets.size,
  };
}
