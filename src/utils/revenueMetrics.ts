import { categorizeSupabaseError, getSupabaseClientInstance, getSupabaseConfig } from './supabaseSync';

export type RevenueType = 'one_time' | 'subscription' | 'service';
export type RevenueStatus = 'active' | 'churned' | 'paused';
export type RevenuePeriod = 'monthly' | 'annual' | '';

export interface RevenueRecord {
  id: string;
  user_id?: string;
  product_name: string;
  customer_email?: string | null;
  amount_vnd: number;
  type: RevenueType;
  status: RevenueStatus;
  period?: RevenuePeriod | null;
  started_at?: string | null;
  ended_at?: string | null;
  source?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeCustomers: number;
  churnedThisMonth: number;
  newThisMonth: number;
  avgRevenuePerUser: number;
  ltv: number;
  cac: number;
}

export interface RevenueMonthPoint {
  month: string;
  revenue: number;
  recurring: number;
  oneTime: number;
  service: number;
}

export interface RevenueWriteInput {
  product_name: string;
  customer_email?: string;
  amount_vnd: number;
  type: RevenueType;
  status: RevenueStatus;
  period?: RevenuePeriod;
  started_at?: string;
  ended_at?: string;
  source?: string;
  notes?: string;
}

async function getRevenueClient(): Promise<{ client: any | null; userId?: string; error?: string }> {
  const config = getSupabaseConfig();
  if (!config?.url || !config?.anonKey) return { client: null, error: 'Chưa cấu hình Supabase URL/anon key.' };

  const client = await getSupabaseClientInstance(config.url, config.anonKey);
  if (!client) return { client: null, error: 'Không khởi tạo được Supabase client.' };

  const { data, error } = await client.auth.getUser();
  if (error || !data?.user?.id) return { client, error: 'Chưa đăng nhập Supabase Auth. Revenue Dashboard cần user_id để đọc/ghi theo RLS.' };

  return { client, userId: data.user.id };
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0)} ₫`;
}

export function calculateMetricsFromRecords(records: RevenueRecord[], month: string): RevenueMetrics {
  const activeSubscriptions = records.filter((record) => record.status === 'active' && record.type === 'subscription');
  const mrr = activeSubscriptions.reduce((sum, record) => {
    if (record.period === 'annual') return sum + Math.round(record.amount_vnd / 12);
    return sum + Number(record.amount_vnd || 0);
  }, 0);

  const thisMonthRecords = records.filter((record) => record.created_at?.startsWith(month) || record.started_at?.startsWith(month));
  const churned = records.filter((record) => record.status === 'churned' && record.ended_at?.startsWith(month));
  const activeCustomerEmails = new Set(activeSubscriptions.map((record) => record.customer_email || record.product_name).filter(Boolean));

  return {
    mrr,
    arr: mrr * 12,
    totalRevenue: thisMonthRecords.reduce((sum, record) => sum + Number(record.amount_vnd || 0), 0),
    activeCustomers: activeCustomerEmails.size,
    churnedThisMonth: churned.length,
    newThisMonth: thisMonthRecords.length,
    avgRevenuePerUser: activeCustomerEmails.size > 0 ? Math.round(mrr / activeCustomerEmails.size) : 0,
    ltv: mrr > 0 && churned.length > 0 ? Math.round(mrr / churned.length) : mrr * 12,
    cac: 0
  };
}

export function buildRevenueByMonth(records: RevenueRecord[], months = 12): RevenueMonthPoint[] {
  const today = new Date();
  const points: RevenueMonthPoint[] = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const key = currentMonthKey(date);
    const monthRecords = records.filter((record) => record.created_at?.startsWith(key) || record.started_at?.startsWith(key));

    points.push({
      month: key,
      revenue: monthRecords.reduce((sum, record) => sum + Number(record.amount_vnd || 0), 0),
      recurring: monthRecords.filter((record) => record.type === 'subscription').reduce((sum, record) => sum + Number(record.amount_vnd || 0), 0),
      oneTime: monthRecords.filter((record) => record.type === 'one_time').reduce((sum, record) => sum + Number(record.amount_vnd || 0), 0),
      service: monthRecords.filter((record) => record.type === 'service').reduce((sum, record) => sum + Number(record.amount_vnd || 0), 0)
    });
  }

  return points;
}

export async function listRevenueRecords(): Promise<{ data: RevenueRecord[]; error?: string }> {
  const { client, userId, error } = await getRevenueClient();
  if (!client || !userId) return { data: [], error };

  const { data, error: queryError } = await client
    .from('revenue_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (queryError) return { data: [], error: categorizeSupabaseError(queryError).message };
  return { data: data || [] };
}

export async function addRevenueRecord(input: RevenueWriteInput): Promise<{ data: RevenueRecord | null; error?: string }> {
  const { client, userId, error } = await getRevenueClient();
  if (!client || !userId) return { data: null, error };

  const payload = {
    user_id: userId,
    product_name: input.product_name.trim(),
    customer_email: input.customer_email?.trim() || null,
    amount_vnd: Math.round(Number(input.amount_vnd || 0)),
    type: input.type,
    status: input.status,
    period: input.period || null,
    started_at: input.started_at || new Date().toISOString().split('T')[0],
    ended_at: input.ended_at || null,
    source: input.source?.trim() || 'direct',
    notes: input.notes?.trim() || null
  };

  const { data, error: insertError } = await client.from('revenue_records').insert(payload).select('*').single();
  if (insertError) return { data: null, error: categorizeSupabaseError(insertError).message };
  return { data };
}
