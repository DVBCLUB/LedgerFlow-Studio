export type IntegrationStatus = 'connected' | 'local' | 'manual' | 'planned' | 'error';
export type IntegrationCategory = 'ai' | 'devops' | 'workspace' | 'accounting' | 'documents' | 'automation' | 'data';
export type IntegrationPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface IntegrationConnector {
  id: string;
  title: string;
  subtitle: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  priority: IntegrationPriority;
  enabled: boolean;
  url?: string;
  localCommand?: string;
  notes: string;
  capabilities: string[];
  quickActions: Array<{ label: string; href?: string; hash?: string }>;
  lastCheckedAt?: string;
  lastMessage?: string;
}

export interface IntegrationEvent {
  id: string;
  connectorId: string;
  type: 'status' | 'test' | 'config' | 'handoff' | 'note';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  createdAt: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export async function fetchIntegrations(): Promise<{ connectors: IntegrationConnector[]; events: IntegrationEvent[] }> {
  const data = await readJson<{ success: true; connectors: IntegrationConnector[]; events: IntegrationEvent[] }>(await fetch('/api/integrations'));
  return { connectors: data.connectors, events: data.events };
}

export async function updateIntegrationConnector(
  id: string,
  patch: Partial<Pick<IntegrationConnector, 'enabled' | 'status' | 'priority' | 'url' | 'localCommand' | 'notes'>>,
): Promise<IntegrationConnector> {
  const data = await readJson<{ success: true; connector: IntegrationConnector }>(
    await fetch(`/api/integrations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  );
  return data.connector;
}

export async function testIntegrationConnector(id: string): Promise<{ connector: IntegrationConnector; events: IntegrationEvent[] }> {
  const data = await readJson<{ success: true; connector: IntegrationConnector; events: IntegrationEvent[] }>(
    await fetch(`/api/integrations/${encodeURIComponent(id)}/test`, { method: 'POST' }),
  );
  return { connector: data.connector, events: data.events };
}

export async function appendIntegrationEvent(
  id: string,
  input: { type?: IntegrationEvent['type']; level?: IntegrationEvent['level']; message: string },
): Promise<IntegrationEvent> {
  const data = await readJson<{ success: true; event: IntegrationEvent }>(
    await fetch(`/api/integrations/${encodeURIComponent(id)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
  return data.event;
}

export async function fetchIntegrationEvents(limit = 100): Promise<IntegrationEvent[]> {
  const data = await readJson<{ success: true; events: IntegrationEvent[] }>(await fetch(`/api/integrations/events?limit=${limit}`));
  return data.events;
}

export async function clearIntegrationEvents(): Promise<void> {
  await readJson<{ success: true }>(await fetch('/api/integrations/events', { method: 'DELETE' }));
}
