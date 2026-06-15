import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionStep, WorkCard, WorkKind, WorkStatus, RiskLevel } from '../types/agentOps';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase);
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

export interface WorkboardCardRow {
  id: string;
  user_id: string;
  title: string;
  kind: WorkKind;
  owner: string;
  ai_staff: string | null;
  status: WorkStatus;
  risk: RiskLevel;
  request: string | null;
  plan: string[] | null;
  tools: string[] | null;
  approval: string | null;
  steps: SessionStep[] | null;
  input: string | null;
  expected_output: string | null;
  acceptance_criteria: string | null;
  founder_review: string | null;
  deadline: string | null;
  created_at?: string;
  updated_at?: string;
}

export function workboardRowToCard(row: WorkboardCardRow): WorkCard {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    owner: row.owner,
    aiStaff: row.ai_staff || undefined,
    status: row.status,
    risk: row.risk,
    request: row.request || '',
    plan: row.plan || [],
    tools: row.tools || [],
    approval: row.approval || '',
    steps: row.steps || undefined,
    input: row.input || undefined,
    expectedOutput: row.expected_output || undefined,
    acceptanceCriteria: row.acceptance_criteria || undefined,
    founderReview: row.founder_review || undefined,
    deadline: row.deadline || undefined,
  };
}

export function workboardCardToRow(card: WorkCard, userId: string): Partial<WorkboardCardRow> {
  return {
    id: card.id,
    user_id: userId,
    title: card.title,
    kind: card.kind,
    owner: card.owner,
    ai_staff: card.aiStaff || null,
    status: card.status,
    risk: card.risk,
    request: card.request || null,
    plan: card.plan || [],
    tools: card.tools || [],
    approval: card.approval || null,
    steps: card.steps || [],
    input: card.input || null,
    expected_output: card.expectedOutput || null,
    acceptance_criteria: card.acceptanceCriteria || null,
    founder_review: card.founderReview || null,
    deadline: card.deadline || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchWorkboardCards(userId: string): Promise<WorkCard[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('workboard_cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as WorkboardCardRow[]).map(workboardRowToCard);
}

export async function upsertWorkboardCard(card: WorkCard, userId: string): Promise<WorkCard> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('workboard_cards')
    .upsert(workboardCardToRow(card, userId))
    .select('*')
    .single();

  if (error) throw error;
  return workboardRowToCard(data as WorkboardCardRow);
}
