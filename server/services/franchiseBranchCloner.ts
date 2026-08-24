/**
 * server/services/franchiseBranchCloner.ts
 * ============================================================
 * Multi-Tenant Virtual Branch & Franchise OS Cloner
 *
 * Implements Level 7 Enterprise Scalability:
 * 1. 1-Click Spin-up of Virtual Subsidiaries, Branches & Franchises
 * 2. Dedicated Isolated Swarms & Accounting Template (TT133, TT200, EPC Construction, B2B SaaS)
 * 3. Real-time Consolidated Financial Rollup to Parent Holding Company
 */

import { publishSystemEvent } from './crossSystemEventBus.ts';

export interface VirtualBranch {
  branchId: string;
  name: string;
  code: string;
  industryTemplate: 'B2B_SAAS' | 'CONSTRUCTION_EPC' | 'TRADING_DISTRIBUTION' | 'DIGITAL_AGENCY';
  accountingStandard: 'TT133_SME' | 'TT200_CORP' | 'IFRS_GLOBAL';
  status: 'ACTIVE' | 'PROVISIONING' | 'PAUSED';
  mrrVnd: number;
  activeAgentsCount: number;
  totalTransactionsCount: number;
  healthScore: number;
  createdAt: string;
}

let branchStore: VirtualBranch[] = [
  {
    branchId: 'br_hq_saas',
    name: 'LedgerFlow Headquarters (Core SaaS & AI OS)',
    code: 'LF-HQ',
    industryTemplate: 'B2B_SAAS',
    accountingStandard: 'TT200_CORP',
    status: 'ACTIVE',
    mrrVnd: 185000000,
    activeAgentsCount: 14,
    totalTransactionsCount: 1420,
    healthScore: 98,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    branchId: 'br_sub_construction',
    name: 'Chi nhánh EPC & Dự Án Xây Lắp Miền Nam',
    code: 'LF-EPC-S',
    industryTemplate: 'CONSTRUCTION_EPC',
    accountingStandard: 'TT200_CORP',
    status: 'ACTIVE',
    mrrVnd: 450000000,
    activeAgentsCount: 8,
    totalTransactionsCount: 860,
    healthScore: 95,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
  {
    branchId: 'br_sub_agency',
    name: 'Digital Growth & Media Lab Chi Nhánh Hà Nội',
    code: 'LF-MKT-HN',
    industryTemplate: 'DIGITAL_AGENCY',
    accountingStandard: 'TT133_SME',
    status: 'ACTIVE',
    mrrVnd: 95000000,
    activeAgentsCount: 6,
    totalTransactionsCount: 340,
    healthScore: 92,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
];

/**
 * Lấy toàn bộ danh sách các chi nhánh & công ty con
 */
export function getVirtualBranches(): {
  branches: VirtualBranch[];
  consolidatedMRRVnd: number;
  totalActiveAgents: number;
} {
  const consolidatedMRRVnd = branchStore.reduce((sum, b) => sum + b.mrrVnd, 0);
  const totalActiveAgents = branchStore.reduce((sum, b) => sum + b.activeAgentsCount, 0);

  return {
    branches: branchStore,
    consolidatedMRRVnd,
    totalActiveAgents,
  };
}

/**
 * Khởi tạo tức thì một Chi Nhánh / Công ty Con Ảo mới
 */
export function cloneVirtualBranch(input: {
  name: string;
  code: string;
  industryTemplate: VirtualBranch['industryTemplate'];
  accountingStandard: VirtualBranch['accountingStandard'];
}): VirtualBranch {
  const branchId = `br_${input.code.toLowerCase()}_${Date.now().toString(36)}`;

  const newBranch: VirtualBranch = {
    branchId,
    name: input.name,
    code: input.code.toUpperCase(),
    industryTemplate: input.industryTemplate,
    accountingStandard: input.accountingStandard,
    status: 'ACTIVE',
    mrrVnd: 0,
    activeAgentsCount: 4,
    totalTransactionsCount: 0,
    healthScore: 100,
    createdAt: new Date().toISOString(),
  };

  branchStore.push(newBranch);

  publishSystemEvent({
    eventType: 'organization.branch_cloned',
    source: 'FranchiseBranchCloner',
    department: 'general',
    payload: {
      branchId: newBranch.branchId,
      name: newBranch.name,
      template: newBranch.industryTemplate,
    },
  });

  return newBranch;
}
