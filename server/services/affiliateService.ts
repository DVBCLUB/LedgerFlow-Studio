// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

function sb() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '');
}

export function generateReferralCode(partnerName: string): string {
  const base = partnerName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase() || 'PARTNR';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

export async function createReferralCode(userId: string, partnerName: string, partnerEmail = '', partnerType = 'Kế toán dịch vụ', commissionRate = 20, commissionType = 'recurring') {
  const code = generateReferralCode(partnerName);
  const { data, error } = await sb().from('referral_codes').insert({ user_id: userId, code, partner_name: partnerName, partner_email: partnerEmail, partner_type: partnerType, commission_rate: commissionRate, commission_type: commissionType }).select().single();
  if (error) throw error;
  return data;
}

export async function trackReferralEvent(code: string, eventType: string, details: any = {}) {
  const { data: codeData } = await sb().from('referral_codes').select('commission_rate,commission_type').eq('code', code).eq('is_active', true).single();
  if (!codeData) throw new Error(`Code không hợp lệ: ${code}`);
  const revenue = Number(details.revenueVND || 0);
  const commission = eventType === 'paid' ? Math.round(revenue * (Number(codeData.commission_rate || 0) / 100)) : 0;
  const { data, error } = await sb().from('referral_events').insert({ code, event_type: eventType, customer_email: details.customerEmail || null, product_name: details.productName || null, revenue_vnd: revenue, commission_vnd: commission, ip_address: details.ipAddress || null, metadata: details.metadata || {} }).select().single();
  if (error) throw error;
  return data;
}

export async function getReferralStats(userId: string) {
  const { data: codes } = await sb().from('referral_codes').select('code,partner_name,partner_type,partner_email,commission_rate,commission_type,is_active,created_at').eq('user_id', userId);
  if (!codes?.length) return { codes: [], totals: { clicks: 0, signups: 0, paid: 0, revenue: 0, pendingCommission: 0 } };
  const codeList = codes.map((c) => c.code);
  const { data: events } = await sb().from('referral_events').select('code,event_type,revenue_vnd,commission_vnd,commission_status').in('code', codeList);
  const byCode = codes.map((c) => {
    const ev = (events || []).filter((e) => e.code === c.code);
    return { ...c, clicks: ev.filter((e) => e.event_type === 'click').length, signups: ev.filter((e) => e.event_type === 'signup').length, paid: ev.filter((e) => e.event_type === 'paid').length, revenue: ev.reduce((s, e) => s + Number(e.revenue_vnd || 0), 0), pendingCommission: ev.filter((e) => e.commission_status === 'pending').reduce((s, e) => s + Number(e.commission_vnd || 0), 0) };
  });
  return { codes: byCode, totals: { clicks: byCode.reduce((s, c) => s + c.clicks, 0), signups: byCode.reduce((s, c) => s + c.signups, 0), paid: byCode.reduce((s, c) => s + c.paid, 0), revenue: byCode.reduce((s, c) => s + c.revenue, 0), pendingCommission: byCode.reduce((s, c) => s + c.pendingCommission, 0) } };
}
