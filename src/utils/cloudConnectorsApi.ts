/**
 * src/utils/cloudConnectorsApi.ts
 * Frontend client cho Google Workspace / Microsoft 365 / Notion / n8n connectors
 * (route /api/dormant/integrations/*).
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface ConnectorTestDetails {
  [key: string]: unknown;
}

// ── Google Workspace ──
export function testGoogleWorkspace(): Promise<ConnectorTestDetails> {
  return request<{ success: boolean; details: ConnectorTestDetails }>(
    '/api/dormant/integrations/google-workspace/test'
  ).then((r) => r.details ?? {});
}
export function exportGoogleSheets(sheetName: string, headers: string[], rows: unknown[][]): Promise<string> {
  return request<{ success: boolean; filePath: string }>(
    '/api/dormant/integrations/google-workspace/sheets',
    { method: 'POST', body: JSON.stringify({ sheetName, headers, rows }) }
  ).then((r) => r.filePath);
}

// ── Microsoft 365 ──
export function testMicrosoft365(): Promise<ConnectorTestDetails> {
  return request<{ success: boolean; details: ConnectorTestDetails }>(
    '/api/dormant/integrations/microsoft-365/test'
  ).then((r) => r.details ?? {});
}
export function exportMicrosoftExcel(sheetName: string, headers: string[], rows: unknown[][]): Promise<string> {
  return request<{ success: boolean; filePath: string }>(
    '/api/dormant/integrations/microsoft-365/excel',
    { method: 'POST', body: JSON.stringify({ sheetName, headers, rows }) }
  ).then((r) => r.filePath);
}

// ── Notion ──
export function testNotion(): Promise<ConnectorTestDetails> {
  return request<{ success: boolean; details: ConnectorTestDetails }>(
    '/api/dormant/integrations/notion/test'
  ).then((r) => r.details ?? {});
}
export function createNotionPage(title: string, markdownContent: string): Promise<string> {
  return request<{ success: boolean; filePath: string }>(
    '/api/dormant/integrations/notion/page',
    { method: 'POST', body: JSON.stringify({ title, markdownContent }) }
  ).then((r) => r.filePath);
}

// ── n8n ──
export function testN8n(): Promise<ConnectorTestDetails> {
  return request<{ success: boolean; details: ConnectorTestDetails }>(
    '/api/dormant/integrations/n8n/test'
  ).then((r) => r.details ?? {});
}
export function triggerN8nWorkflow(workflowName: string, payload: Record<string, unknown>): Promise<string> {
  return request<{ success: boolean; message: string }>(
    '/api/dormant/integrations/n8n/trigger',
    { method: 'POST', body: JSON.stringify({ workflowName, payload }) }
  ).then((r) => r.message);
}
