/**
 * server/services/glaciaFinancialBaselineEngine.ts
 * Động cơ Tính toán Baseline Tài chính & Chi tiêu Kế toán VAS 90 ngày cho Glacia.
 */

import fs from 'fs';
import path from 'path';

export interface CategoryBaseline {
  category: string;
  meanAmount: number;
  stdDev: number;
  minAmount: number;
  maxAmount: number;
  typicalTxCountPerWeek: number;
  sampleSize: number;
  lastUpdated: string;
}

export interface FinancialBaselineProfile {
  id: string;
  currency: string;
  updatedAt: string;
  categories: Record<string, CategoryBaseline>;
  knownVendors: Array<{
    vendorTaxId: string;
    vendorName: string;
    avgTxAmount: number;
    firstSeen: string;
    totalTransactions: number;
  }>;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const BASELINE_FILE = path.join(RUNTIME_DIR, 'glacia_financial_baseline.json');

const DEFAULT_BASELINES: Record<string, CategoryBaseline> = {
  office_supplies: {
    category: 'office_supplies',
    meanAmount: 3500000,
    stdDev: 1200000,
    minAmount: 500000,
    maxAmount: 10000000,
    typicalTxCountPerWeek: 3,
    sampleSize: 45,
    lastUpdated: new Date().toISOString(),
  },
  cloud_infrastructure: {
    category: 'cloud_infrastructure',
    meanAmount: 18000000,
    stdDev: 3500000,
    minAmount: 12000000,
    maxAmount: 30000000,
    typicalTxCountPerWeek: 1,
    sampleSize: 30,
    lastUpdated: new Date().toISOString(),
  },
  payroll_bonus: {
    category: 'payroll_bonus',
    meanAmount: 120000000,
    stdDev: 25000000,
    minAmount: 80000000,
    maxAmount: 200000000,
    typicalTxCountPerWeek: 1,
    sampleSize: 12,
    lastUpdated: new Date().toISOString(),
  },
  marketing_ads: {
    category: 'marketing_ads',
    meanAmount: 25000000,
    stdDev: 8000000,
    minAmount: 5000000,
    maxAmount: 60000000,
    typicalTxCountPerWeek: 4,
    sampleSize: 50,
    lastUpdated: new Date().toISOString(),
  },
  outsourcing_dev: {
    category: 'outsourcing_dev',
    meanAmount: 45000000,
    stdDev: 15000000,
    minAmount: 20000000,
    maxAmount: 90000000,
    typicalTxCountPerWeek: 2,
    sampleSize: 20,
    lastUpdated: new Date().toISOString(),
  },
};

export function loadFinancialBaseline(): FinancialBaselineProfile {
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      const data = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
      return data;
    }
  } catch (err) {
    console.warn('[GlaciaBaseline] Failed to load baseline, falling back to defaults');
  }

  const defaultProfile: FinancialBaselineProfile = {
    id: 'ledgerflow-vas-baseline-v1',
    currency: 'VND',
    updatedAt: new Date().toISOString(),
    categories: DEFAULT_BASELINES,
    knownVendors: [
      {
        vendorTaxId: '0100109106',
        vendorName: 'VIETTEL CLOUD SOLUTIONS',
        avgTxAmount: 18500000,
        firstSeen: '2025-01-10T00:00:00.000Z',
        totalTransactions: 14,
      },
      {
        vendorTaxId: '0312345678',
        vendorName: 'CONG TY CP THIET BI VAN PHONG SAO MAI',
        avgTxAmount: 4200000,
        firstSeen: '2025-02-01T00:00:00.000Z',
        totalTransactions: 8,
      },
    ],
  };

  saveFinancialBaseline(defaultProfile);
  return defaultProfile;
}

export function saveFinancialBaseline(profile: FinancialBaselineProfile): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GlaciaBaseline] Error saving baseline profile:', err);
  }
}

export function updateBaselineWithTransaction(category: string, amount: number, vendorTaxId?: string, vendorName?: string): void {
  const profile = loadFinancialBaseline();
  
  if (!profile.categories[category]) {
    profile.categories[category] = {
      category,
      meanAmount: amount,
      stdDev: amount * 0.2,
      minAmount: amount,
      maxAmount: amount,
      typicalTxCountPerWeek: 1,
      sampleSize: 1,
      lastUpdated: new Date().toISOString(),
    };
  } else {
    const cat = profile.categories[category];
    const n = cat.sampleSize;
    const oldMean = cat.meanAmount;
    const newMean = oldMean + (amount - oldMean) / (n + 1);
    
    cat.sampleSize = n + 1;
    cat.meanAmount = Math.round(newMean);
    cat.minAmount = Math.min(cat.minAmount, amount);
    cat.maxAmount = Math.max(cat.maxAmount, amount);
    cat.lastUpdated = new Date().toISOString();
  }

  if (vendorTaxId && vendorName) {
    const existing = profile.knownVendors.find(v => v.vendorTaxId === vendorTaxId);
    if (existing) {
      existing.totalTransactions += 1;
      existing.avgTxAmount = Math.round((existing.avgTxAmount * (existing.totalTransactions - 1) + amount) / existing.totalTransactions);
    } else {
      profile.knownVendors.push({
        vendorTaxId,
        vendorName,
        avgTxAmount: amount,
        firstSeen: new Date().toISOString(),
        totalTransactions: 1,
      });
    }
  }

  profile.updatedAt = new Date().toISOString();
  saveFinancialBaseline(profile);
}
