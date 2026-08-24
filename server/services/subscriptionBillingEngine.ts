export interface SubscriptionPlan { id: string; name: string; priceVnd: number; billingCycle: 'monthly' | 'quarterly' | 'annual'; features: string[]; }
export interface Subscription { id: string; tenantName: string; plan: string; status: 'active' | 'past_due' | 'suspended' | 'cancelled'; mrrVnd: number; nextBillingDate: string; failedAttempts: number; }
export interface BillingData { subscriptions: Subscription[]; plans: SubscriptionPlan[]; totalMrrVnd: number; pastDueCount: number; mrrWaterfall: { label: string; vnd: number }[]; }
export interface ChargeResult { success: boolean; subscriptionId: string; invoiceRef: string; amountVnd: number; vietQrUrl: string; tt78InvoiceId: string; processedAt: string; }
export interface DunningResult { success: boolean; subscriptionId: string; action: 'retried' | 'downgraded' | 'suspended'; nextAttemptAt: string | null; notified: boolean; }

export function getSubscriptionBillingData(): BillingData {
  const plans: SubscriptionPlan[] = [
    { id: 'starter', name: 'Starter', priceVnd: 990_000, billingCycle: 'monthly', features: ['1 user', '100 invoices/thang', 'VietQR basic'] },
    { id: 'growth', name: 'Growth', priceVnd: 2_990_000, billingCycle: 'monthly', features: ['5 users', 'Khong gioi han hoa don', 'AI Swarm 3 agents', 'TT200 Ledger'] },
    { id: 'enterprise', name: 'Enterprise', priceVnd: 9_900_000, billingCycle: 'monthly', features: ['Khong gioi han users', 'Full AI Suite 52 tru cot', 'Custom RBAC', 'SLA 99.99%'] },
  ];
  const subscriptions: Subscription[] = [
    { id: 'sub_001_vingroup', tenantName: 'Vingroup Digital', plan: 'enterprise', status: 'active', mrrVnd: 9_900_000, nextBillingDate: '2026-09-01', failedAttempts: 0 },
    { id: 'sub_002_techvn', tenantName: 'Tech Viet Nam JSC', plan: 'growth', status: 'active', mrrVnd: 2_990_000, nextBillingDate: '2026-09-05', failedAttempts: 0 },
    { id: 'sub_003_delta', tenantName: 'Delta Corp', plan: 'growth', status: 'past_due', mrrVnd: 2_990_000, nextBillingDate: '2026-08-21', failedAttempts: 2 },
    { id: 'sub_004_mekong', tenantName: 'Mekong SME', plan: 'starter', status: 'active', mrrVnd: 990_000, nextBillingDate: '2026-09-10', failedAttempts: 0 },
  ];
  return {
    subscriptions,
    plans,
    totalMrrVnd: subscriptions.filter(s => s.status === 'active').reduce((acc, s) => acc + s.mrrVnd, 0),
    pastDueCount: subscriptions.filter(s => s.status === 'past_due').length,
    mrrWaterfall: [
      { label: 'MRR Ky Truoc', vnd: 12_200_000 },
      { label: 'New Subscriptions', vnd: 2_990_000 },
      { label: 'Expansions', vnd: 1_500_000 },
      { label: 'Contractions', vnd: -500_000 },
      { label: 'Churn', vnd: -990_000 },
      { label: 'MRR Hien Tai', vnd: 15_200_000 },
    ],
  };
}

export function processRecurringCharge(subscriptionId: string): ChargeResult {
  return {
    success: true,
    subscriptionId,
    invoiceRef: 'INV-' + Date.now().toString(36).toUpperCase(),
    amountVnd: 2_990_000,
    vietQrUrl: 'https://vietqr.io/pay/sub_' + subscriptionId,
    tt78InvoiceId: 'HD' + Date.now().toString().slice(-8),
    processedAt: new Date().toISOString(),
  };
}

export function handleFailedPayment(subscriptionId: string): DunningResult {
  return {
    success: true,
    subscriptionId,
    action: 'retried',
    nextAttemptAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    notified: true,
  };
}
