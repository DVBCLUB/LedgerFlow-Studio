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

// ─── Autonomous Enterprise Level 4 API Helpers ───────────────────────────────

export interface DailyStandupBriefing {
  id: string;
  date: string;
  ceoBrief: string;
  cfoFinancialStatus: string;
  ctoReleaseStatus: string;
  cmoGrowthStatus: string;
  vpProductRoadmapStatus: string;
  overallReadinessScore: number;
  markdownSummary: string;
  audioSpeechScript: string;
}

export function fetchDailyStandupBriefing(): Promise<DailyStandupBriefing> {
  return request<{ success: boolean; briefing: DailyStandupBriefing }>('/api/dormant/executive-boardroom/daily-standup').then((r) => r.briefing);
}

export function orchestrateClosedDeal(deal: {
  dealId: string;
  customerName: string;
  customerEmail?: string;
  amountVnd: number;
  productName: string;
  notes?: string;
}): Promise<{
  customerId: string;
  taskId: string;
  invoiceId: string;
  crossDeptRequestId: string;
}> {
  return request<{ success: boolean; result: any }>('/api/dormant/cross-dept/orchestrate-deal', {
    method: 'POST',
    body: JSON.stringify(deal),
  }).then((r) => r.result);
}

export function ingestLiveBankWebhook(payload: {
  transactionId?: string;
  amount: number;
  description: string;
  bank?: string;
}): Promise<any> {
  return request<{ success: boolean; result: any }>('/api/dormant/bank-webhook/ingest', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.result);
}

export function fetchLiveArchitectureMermaid(): Promise<string> {
  return request<{ success: boolean; mermaid: string }>('/api/dormant/doc-generator/architecture-mermaid').then((r) => r.mermaid);
}

// ─── Level 5 Full Autonomy Client Helpers ────────────────────────────────────

export function generateStandardEInvoiceXML(payload: any): Promise<any> {
  return request<{ success: boolean; eInvoice: any }>('/api/dormant/einvoice/generate-xml', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.eInvoice);
}

export function scanSubscriptionRenewals(subscriptions: any[], referenceDate?: string): Promise<any[]> {
  return request<{ success: boolean; recommendations: any[] }>('/api/dormant/subscriptions/scan-renewals', {
    method: 'POST',
    body: JSON.stringify({ subscriptions, referenceDate }),
  }).then((r) => r.recommendations);
}

export function parseVoiceEarphoneCommand(transcript: string): Promise<any> {
  return request<{ success: boolean; intentResult: any }>('/api/dormant/voice-earphone/parse', {
    method: 'POST',
    body: JSON.stringify({ transcript }),
  }).then((r) => r.intentResult);
}

export function createEncryptedCloudBackup(params: {
  sourceWorkspace?: string;
  targetCloudStorage?: string;
  dataPayload: Record<string, any>;
}): Promise<any> {
  return request<{ success: boolean; snapshot: any }>('/api/dormant/cloud-backup/create-snapshot', {
    method: 'POST',
    body: JSON.stringify(params),
  }).then((r) => r.snapshot);
}

export function restoreAndVerifyCloudBackup(snapshot: any, secret?: string): Promise<any> {
  return request<{ success: boolean; result: any }>('/api/dormant/cloud-backup/restore-verify', {
    method: 'POST',
    body: JSON.stringify({ snapshot, secret }),
  }).then((r) => r.result);
}


