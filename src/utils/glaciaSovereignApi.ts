/**
 * src/utils/glaciaSovereignApi.ts
 * Frontend Client SDK cho Glacia Epoch 7 Sovereign Enterprise Nexus.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Sovereign API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── 1. Omni-Channel Sales Agent ──
export interface SalesConversation {
  conversationId: string;
  channel: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  interestProduct: string;
  status: string;
  estimatedDealValueVnd: number;
  messages: Array<{ sender: string; text: string; timestamp: string }>;
  updatedAt: string;
}

export interface OmniSalesMetrics {
  totalLeads: number;
  totalWonDeals: number;
  totalPipelineValueVnd: number;
  closedRevenueVnd: number;
  conversionRatePercent: number;
  channelDistribution: Record<string, number>;
}

export async function sendOmniChannelMessage(payload: {
  channel: string;
  senderId: string;
  senderName: string;
  text: string;
}): Promise<any> {
  return apiRequest('/api/glacia/omnichannel/message', {
    method: 'POST',
    body: JSON.stringify({ ...payload, receivedAt: new Date().toISOString() }),
  });
}

export async function fetchSalesConversations(channel?: string): Promise<SalesConversation[]> {
  const url = channel ? `/api/glacia/omnichannel/conversations?channel=${channel}` : '/api/glacia/omnichannel/conversations';
  const res = await apiRequest<{ success: boolean; conversations: SalesConversation[] }>(url);
  return res.conversations || [];
}

export async function fetchOmniSalesMetrics(): Promise<OmniSalesMetrics> {
  const res = await apiRequest<{ success: boolean; metrics: OmniSalesMetrics }>('/api/glacia/omnichannel/metrics');
  return res.metrics;
}

// ── 2. B2B Lead Harvester ──
export interface B2BCompanyLead {
  id: string;
  companyName: string;
  taxId: string;
  representative: string;
  email: string;
  phone: string;
  industry: string;
  city: string;
  stage: string;
}

export async function harvestB2BLeads(payload: { industry: string; targetCity: string; limit?: number }): Promise<any> {
  return apiRequest('/api/glacia/leads/harvest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchB2BLeads(): Promise<B2BCompanyLead[]> {
  const res = await apiRequest<{ success: boolean; leads: B2BCompanyLead[] }>('/api/glacia/leads/list');
  return res.leads || [];
}

export async function renderOutreachEmail(leadId: string, step: number = 1): Promise<{ subject: string; body: string; targetEmail: string }> {
  const res = await apiRequest<{ success: boolean; email: { subject: string; body: string; targetEmail: string } }>('/api/glacia/leads/outreach', {
    method: 'POST',
    body: JSON.stringify({ leadId, step }),
  });
  return res.email;
}

// ── 3. 3D World Gen Engine ──
export interface World3DSceneDescriptor {
  sceneId: string;
  sceneName: string;
  theme: string;
  terrain: { resolution: number; heightmapType: string; baseColor: string; wireframe: boolean };
  objects: Array<{ id: string; type: string; position: [number, number, number]; material: any }>;
  gltfExportManifest: { asset: any; meshesCount: number; estimatedByteSize: number };
  generatedAt: string;
}

export async function generate3DWorld(payload: { theme: string; sceneName?: string; objectCount?: number }): Promise<World3DSceneDescriptor> {
  const res = await apiRequest<{ success: boolean; scene: World3DSceneDescriptor }>('/api/glacia/world3d/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.scene;
}

export async function fetch3DWorlds(): Promise<World3DSceneDescriptor[]> {
  const res = await apiRequest<{ success: boolean; worlds: World3DSceneDescriptor[] }>('/api/glacia/world3d/list');
  return res.worlds || [];
}

// ── 4. Multi-Agent Executive Boardroom ──
export interface BoardroomSession {
  sessionId: string;
  strategicQuestion: string;
  convenedAt: string;
  debateTranscript: Array<{ advisorRole: string; advisorName: string; argumentText: string; sentiment: string }>;
  consensusVoting: { inFavor: number; opposed: number; neutral: number; verdict: string };
  executiveSummaryForCEO: string;
  suggestedActionItems: string[];
}

export async function conveneBoardroom(question: string): Promise<BoardroomSession> {
  const res = await apiRequest<{ success: boolean; session: BoardroomSession }>('/api/glacia/boardroom/convene', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
  return res.session;
}

export async function fetchBoardroomSessions(): Promise<BoardroomSession[]> {
  const res = await apiRequest<{ success: boolean; sessions: BoardroomSession[] }>('/api/glacia/boardroom/sessions');
  return res.sessions || [];
}

// ── 5. Self-Healing Infrastructure Watchdog ──
export interface SystemInfraHealth {
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL_HEALING';
  uptimeSeconds: number;
  memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number; externalMb: number };
  eventLoopLagMs: number;
  activeSocketsCount: number;
  databaseLockStatus: string;
  autoHealingHistory: Array<{ timestamp: string; triggerReason: string; actionTaken: string; freedMemoryMb?: number }>;
}

export async function fetchInfraHealth(): Promise<SystemInfraHealth> {
  const res = await apiRequest<{ success: boolean; health: SystemInfraHealth }>('/api/glacia/infra/health');
  return res.health;
}

export async function triggerEmergencyHeal(reason?: string): Promise<any> {
  return apiRequest('/api/glacia/infra/heal', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
