/**
 * cloudWebhookCallbackDispatcher.ts
 * ============================================================
 * Cloud Webhook Realtime Callback Dispatcher for LedgerFlow OS.
 *
 * Receives lightweight async completion callbacks from Cloud APIs:
 *  - Runway ML / Pika: 4K Video render complete -> Returns MP4 URL
 *  - ElevenLabs: AI Voice generation complete -> Returns MP3 URL
 *  - GitHub Actions CI: Game PC/Mobile packaging complete -> Returns ZIP artifact URL
 *  - Encrypted storage in runtime/cloud_webhooks.local.enc.
 */

import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import { appendAuditEvent } from './auditLog.ts';
import { emitTelemetryEvent } from './agentTelemetryStream.ts';

export interface CloudWebhookEvent {
  id: string;
  provider: 'runway' | 'elevenlabs' | 'github_actions' | 'tiktok_api';
  eventType: 'video_rendered' | 'voice_synthesized' | 'game_built' | 'social_posted';
  title: string;
  artifactUrl: string;
  receivedAt: string;
  status: 'completed' | 'failed';
}

interface WebhookStore {
  events: Record<string, CloudWebhookEvent>;
}

let store: WebhookStore = { events: {} };
let writeQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('CLOUD_WEBHOOKS_FILE', 'cloud_webhooks.local.enc');
}

const PRESET_EVENTS: CloudWebhookEvent[] = [
  {
    id: 'wh_evt_001',
    provider: 'runway',
    eventType: 'video_rendered',
    title: 'TikTok Promo Video 30s Review Bàn phím Cơ',
    artifactUrl: 'https://cdn.runwayml.com/renders/v2_shorts_88912.mp4',
    receivedAt: '2 phút trước',
    status: 'completed',
  },
  {
    id: 'wh_evt_002',
    provider: 'elevenlabs',
    eventType: 'voice_synthesized',
    title: 'Giọng đọc AI Voiceover Tiếng Việt Kịch bản Phim ngắn',
    artifactUrl: 'https://api.elevenlabs.io/v1/audio/stream_77182.mp3',
    receivedAt: '10 phút trước',
    status: 'completed',
  },
  {
    id: 'wh_evt_003',
    provider: 'github_actions',
    eventType: 'game_built',
    title: 'Bản Build Windows Steam Game v1.2.4 (x64)',
    artifactUrl: 'https://github.com/solofounder/game/releases/v1.2.4.zip',
    receivedAt: '1 giờ trước',
    status: 'completed',
  },
];

async function loadStore(): Promise<WebhookStore> {
  const parsed = await readSecureJson<WebhookStore>(storageFile(), { events: {} });
  store = { events: parsed.events || {} };

  if (Object.keys(store.events).length === 0) {
    for (const evt of PRESET_EVENTS) {
      store.events[evt.id] = evt;
    }
    await saveStore();
  }

  return store;
}

async function saveStore(): Promise<void> {
  await writeSecureJson(storageFile(), store);
}

function queueSave(): void {
  const task = () => saveStore().catch(() => undefined);
  writeQueue = writeQueue.then(task, task);
}

loadStore().catch(() => undefined);

export async function listCloudWebhookEvents(): Promise<CloudWebhookEvent[]> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.events).length === 0) await loadStore();
  return Object.values(store.events);
}

export async function dispatchIncomingWebhook(
  provider: CloudWebhookEvent['provider'],
  eventType: CloudWebhookEvent['eventType'],
  title: string,
  artifactUrl: string
): Promise<CloudWebhookEvent> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.events).length === 0) await loadStore();

  const id = `wh_evt_${Date.now()}`;
  const evt: CloudWebhookEvent = {
    id,
    provider,
    eventType,
    title,
    artifactUrl,
    receivedAt: 'Vừa xong',
    status: 'completed',
  };

  store.events[id] = evt;
  queueSave();

  emitTelemetryEvent({
    category: 'agent_runtime',
    eventType: 'cloud_webhook_received',
    source: 'cloud_webhook_callback_dispatcher',
    summary: `Received webhook callback [${eventType}] for "${title}"`,
    payload: { id, provider, artifactUrl },
  });

  appendAuditEvent({
    actor: 'cloud-webhook',
    workspace: 'Cloud Bridge',
    action: 'webhook.received',
    target: id,
    risk: 'LOW',
    status: 'executed',
    summary: `Received cloud completion callback: ${title}`,
    evidence: { artifactUrl },
  }).catch(() => undefined);

  return evt;
}
