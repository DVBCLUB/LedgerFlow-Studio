/**
 * src/utils/industryTemplateApi.ts
 * Frontend client cho Industry Template Engine
 * (server/services/industryTemplateEngine.ts, route /api/dormant/industry-templates/*).
 */

export type IndustryTemplateId = 'saas_software' | 'trading_ecommerce' | 'manufacturing' | 'services' | 'construction';

export interface IndustryAccountMapping {
  code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description: string;
}

export interface IndustryTemplateConfig {
  id: IndustryTemplateId;
  name: string;
  description: string;
  isDefault: boolean;
  primaryAccounts: IndustryAccountMapping[];
  defaultVoucherTypes: string[];
  keyMetrics: string[];
}

export interface BOMItem {
  itemId: string;
  itemName: string;
  quantityRequired: number;
  unitCostVnd: number;
}

export interface BOMCostResult {
  totalMaterialCostVnd: number;
  breakdown: Array<BOMItem & { subtotalVnd: number }>;
}

export interface ProgressBillingResult {
  totalContractValueVnd: number;
  completedPercent: number;
  progressBilledVnd: number;
  remainingVnd: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function listIndustryTemplates(): Promise<IndustryTemplateConfig[]> {
  return request<{ success: boolean; templates: IndustryTemplateConfig[] }>(
    '/api/dormant/industry-templates/list'
  ).then((r) => r.templates ?? []);
}

export function getIndustryTemplate(id: string): Promise<IndustryTemplateConfig> {
  return request<{ success: boolean; template: IndustryTemplateConfig }>(
    `/api/dormant/industry-templates/get/${encodeURIComponent(id)}`
  ).then((r) => r.template);
}

export function calculateBOMCost(bomItems: BOMItem[]): Promise<BOMCostResult> {
  return request<{ success: boolean; result: BOMCostResult }>(
    '/api/dormant/industry-templates/calculate-bom',
    { method: 'POST', body: JSON.stringify({ bomItems }) }
  ).then((r) => r.result);
}

export function calculateProgressBilling(
  totalContractValueVnd: number,
  completedPercent: number
): Promise<ProgressBillingResult> {
  return request<{ success: boolean; result: ProgressBillingResult }>(
    '/api/dormant/industry-templates/calculate-progress-billing',
    { method: 'POST', body: JSON.stringify({ totalContractValueVnd, completedPercent }) }
  ).then((r) => r.result);
}
