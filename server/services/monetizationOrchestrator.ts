/**
 * monetizationOrchestrator.ts
 * ============================================================
 * Closes the money loop for the Asset Foundry:
 *
 *   - VietQR payment link (real dynamic QR image URL, no key needed)
 *   - Stripe Payment Link (real, gated on STRIPE_SECRET_KEY)
 *   - License-key delivery (issued + registered as an asset)
 *   - Sale recording (emits `asset.sale_received`, durable ledger)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { registerAsset } from './assetRegistry.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export interface VietQrInput {
  amountVnd?: number;
  addInfo?: string;
  accountNo?: string;
  bankCode?: string;
}

export interface VietQrResult {
  ok: boolean;
  url: string;
  accountNo: string;
  bankCode: string;
}

export interface StripePaymentLinkInput {
  amountUsd: number;
  title: string;
}

export interface StripePaymentLinkResult {
  ok: boolean;
  status: 'completed' | 'no_provider' | 'failed';
  url?: string;
  error?: string;
}

export interface LicenseKeyResult {
  ok: boolean;
  licenseKey: string;
  assetCid: string;
}

export interface SaleRecord {
  id: string;
  channel: 'vietqr' | 'stripe' | 'other';
  amountVnd?: number;
  amountUsd?: number;
  reference?: string;
  createdAt: string;
}

const SALES_FILE = () => resolveRuntimeDirPath('sales_registry.json');

// ─── VietQR ──────────────────────────────────────────────────────────────────

export function generateVietQrLink(input: VietQrInput = {}): VietQrResult {
  const bankCode = input.bankCode || 'MB';
  const accountNo = input.accountNo || process.env.VIETQR_ACCOUNT_NO || '0988888888';
  const params = new URLSearchParams();
  if (input.amountVnd) params.set('amount', String(input.amountVnd));
  if (input.addInfo) params.set('addInfo', input.addInfo);
  const qs = params.toString();
  const url = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact.png${qs ? `?${qs}` : ''}`;
  return { ok: true, url, accountNo, bankCode };
}

// ─── Stripe ──────────────────────────────────────────────────────────────────

export async function generateStripePaymentLink(input: StripePaymentLinkInput): Promise<StripePaymentLinkResult> {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key) {
    return { ok: false, status: 'no_provider', error: 'STRIPE_SECRET_KEY chưa cấu hình.' };
  }
  if (!input.amountUsd || input.amountUsd <= 0) return { ok: false, status: 'failed', error: 'amountUsd must be > 0' };

  try {
    const body = new URLSearchParams();
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][product_data][name]', input.title || 'LedgerFlow product');
    body.set('line_items[0][price_data][unit_amount]', String(Math.round(input.amountUsd * 100)));
    body.set('line_items[0][quantity]', '1');

    const res = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(30_000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || `Stripe HTTP ${res.status}`);
    return { ok: true, status: 'completed', url: json?.url };
  } catch (err: any) {
    return { ok: false, status: 'failed', error: err.message };
  }
}

// ─── License key ─────────────────────────────────────────────────────────────

export function issueLicenseKey(input: { productName?: string; customerEmail?: string; tier?: string } = {}): LicenseKeyResult {
  const product = (input.productName || 'ledgerflow').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const segment = crypto.randomBytes(4).toString('hex').toUpperCase();
  const licenseKey = `LF-${product}-${segment}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const doc = `LICENSE KEY\nProduct: ${input.productName || 'LedgerFlow'}\nTier: ${input.tier || 'Starter'}\nCustomer: ${input.customerEmail || 'unknown'}\nKey: ${licenseKey}\nIssued: ${new Date().toISOString()}`;
  const rec = registerAsset({
    kind: 'document',
    name: `license_${Date.now()}.txt`,
    mimeType: 'text/plain',
    bytes: Buffer.from(doc, 'utf8'),
    provenance: { source: 'monetizationOrchestrator', provider: 'license', prompt: input.customerEmail },
  });
  return { ok: true, licenseKey, assetCid: rec.cid };
}

// ─── Sale recording ──────────────────────────────────────────────────────────

export function recordSale(input: { channel: 'vietqr' | 'stripe' | 'other'; amountVnd?: number; amountUsd?: number; reference?: string }): SaleRecord {
  const sale: SaleRecord = {
    id: `sale_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    channel: input.channel,
    amountVnd: input.amountVnd,
    amountUsd: input.amountUsd,
    reference: input.reference,
    createdAt: new Date().toISOString(),
  };
  try {
    const file = SALES_FILE();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { sales: [] };
    const sales = Array.isArray(existing?.sales) ? existing.sales : [];
    sales.unshift(sale);
    fs.writeFileSync(file, JSON.stringify({ sales, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch {
    // best effort
  }
  void publishSystemEvent('asset.sale_received', 'monetizationOrchestrator', `Sale received via ${input.channel}`, {
    saleId: sale.id,
    channel: input.channel,
    amountVnd: input.amountVnd,
    amountUsd: input.amountUsd,
  });
  return sale;
}

export function listSales(limit = 50): SaleRecord[] {
  try {
    if (!fs.existsSync(SALES_FILE())) return [];
    const parsed = JSON.parse(fs.readFileSync(SALES_FILE(), 'utf8'));
    return (Array.isArray(parsed?.sales) ? parsed.sales : []).slice(0, limit);
  } catch {
    return [];
  }
}
