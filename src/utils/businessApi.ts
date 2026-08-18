export type BusinessEntityType = 'product' | 'lead' | 'customer' | 'deal' | 'campaign' | 'invoice' | 'task' | 'knowledge';

export interface BusinessEntity {
  id: string;
  type: BusinessEntityType;
  data: Record<string, unknown>;
  source: 'user' | 'ai' | 'workflow';
  createdAt: string;
  updatedAt: string;
}

export interface BusinessStats {
  total: number;
  byType: Record<string, number>;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function listBusinessEntities(type?: BusinessEntityType, limit = 100): Promise<BusinessEntity[]> {
  const q = type ? `?type=${encodeURIComponent(type)}&limit=${limit}` : `?limit=${limit}`;
  return request<{ success: boolean; entities: BusinessEntity[] }>(`/api/business${q}`).then((r) => r.entities);
}

export function upsertBusinessEntity(input: {
  id?: string;
  type: BusinessEntityType;
  data: Record<string, unknown>;
  source?: string;
}): Promise<BusinessEntity> {
  return request<{ success: boolean; entity: BusinessEntity }>('/api/business', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.entity);
}

export function persistAgentResult(input: {
  type: BusinessEntityType;
  data: Record<string, unknown>;
  source?: string;
  lesson?: { domain: string; title: string; content: string };
}): Promise<{ entity: BusinessEntity; lessonRecorded: boolean }> {
  return request<{ success: boolean; entity: BusinessEntity; lessonRecorded: boolean }>('/api/agent/persist', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => ({ entity: r.entity, lessonRecorded: r.lessonRecorded }));
}

export function deleteBusinessEntity(id: string): Promise<boolean> {
  return request<{ success: boolean }>(`/api/business/${encodeURIComponent(id)}`, { method: 'DELETE' }).then((r) => r.success);
}

export function setBusinessEntityStatus(id: string, status: 'approved' | 'rejected'): Promise<BusinessEntity> {
  return request<{ success: boolean; entity: BusinessEntity }>(
    `/api/business/${encodeURIComponent(id)}/${status === 'approved' ? 'approve' : 'reject'}`,
    { method: 'POST' }
  ).then((r) => r.entity);
}

export function getBusinessStats(): Promise<BusinessStats> {
  return request<{ success: boolean; stats: BusinessStats }>('/api/business/stats').then((r) => r.stats);
}
