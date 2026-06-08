/**
 * Shared interface definitions for the Solo Founder ERP & Data Science Hub
 */

export interface SectorMetric {
  id: string;
  name: string;
  emoji: string;
  color: string; // 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'
  kpis: string[];
  risks: string[];
  dataTables: {
    name: string;
    description: string;
    columns: string[];
  }[];
  pandasSnippet: string;
}

export interface BusinessIdea {
  id: string;
  title: string;
  category: string;
  targetClient: string;
  priceModel: string;
  initialCost: number; // in VND
  monthlyFee: number; // in VND
  minViableFeatures: string[];
}

export interface WeekTask {
  week: number;
  phase: string;
  title: string;
  description: string;
  tasks: {
    id: string;
    text: string;
    subText?: string;
  }[];
  tip: string;
  completionVerify: string;
}

export interface SQLTable {
  name: string;
  type: 'fact' | 'dim' | 'other';
  description: string;
  columns: {
    name: string;
    type: string;
    constraints?: string;
    description: string;
  }[];
  sqlDef: string;
}

export interface FinancialForecastInput {
  setupFee: number;
  monthlyRevenue: number;
  targetClients: number;
  cac: number;
  itCost: number;
  miscCost: number;
  expansionRate: number;
}

export interface UnexpectedIdea {
  id: string;
  title: string;
  type: 'saas' | 'game' | 'utility';
  nicheAudience: string;
  pricePoint: number; // in VND
  speedRating: number; // 1-10
  costRating: number; // 1-10 (10 means very low cost)
  marketPain: number; // 1-10
  viralPotential: number; // 1-10
  description: string;
  guerrillaScore: number;
  aiBlueprint?: string;
  createdAt: string;
}

