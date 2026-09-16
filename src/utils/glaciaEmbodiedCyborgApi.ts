/**
 * src/utils/glaciaEmbodiedCyborgApi.ts
 * Frontend Client SDK cho Glacia Epoch 9 — The Omnipresent Embodied Cyborg.
 */

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Glacia Embodied Cyborg API error: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── 1. Embodied Screen Vision Pilot ──
export interface UiElementBoundingBox {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  shortcutHint?: string;
}

export interface ScreenPerceptionResult {
  scanId: string;
  activeApp: string;
  screenWidth: number;
  screenHeight: number;
  detectedElements: UiElementBoundingBox[];
  suggestedInteraction: {
    actionType: string;
    targetElementId: string;
    targetCoordinates: { x: number; y: number };
    payloadText?: string;
  };
  latencyMs: number;
  capturedAt: string;
}

export async function scanScreenVision(appName: string, hint?: string): Promise<ScreenPerceptionResult> {
  const res = await apiRequest<{ success: boolean; perception: ScreenPerceptionResult }>('/api/glacia/vision/scan', {
    method: 'POST',
    body: JSON.stringify({ appName, hint }),
  });
  return res.perception;
}

export async function fetchVisionScans(): Promise<ScreenPerceptionResult[]> {
  const res = await apiRequest<{ success: boolean; scans: ScreenPerceptionResult[] }>('/api/glacia/vision/scans');
  return res.scans || [];
}

// ── 2. 3D Game Architect ──
export interface LivingNpcEntity {
  id: string;
  name: string;
  role: string;
  dialogueGreeting: string;
  coordinates: [number, number, number];
  assignedQuest?: { questTitle: string; objective: string; xpReward: number };
}

export interface Interactive3DGameProject {
  gameId: string;
  title: string;
  theme: string;
  genre: string;
  npcs: LivingNpcEntity[];
  threeJsBootstrapCode: string;
  fpsTarget: number;
  createdAt: string;
}

export async function generate3DGame(theme: string, genre: string, title?: string): Promise<Interactive3DGameProject> {
  const res = await apiRequest<{ success: boolean; game: Interactive3DGameProject }>('/api/glacia/game3d/generate', {
    method: 'POST',
    body: JSON.stringify({ theme, genre, title }),
  });
  return res.game;
}

export async function fetch3DGames(): Promise<Interactive3DGameProject[]> {
  const res = await apiRequest<{ success: boolean; games: Interactive3DGameProject[] }>('/api/glacia/game3d/games');
  return res.games || [];
}

// ── 3. Real-Time Duplex Voice & Barge-In ──
export interface DuplexVoiceSession {
  sessionId: string;
  state: string;
  language: string;
  voiceTone: string;
  averageLatencyMs: number;
  totalBargeInsHandled: number;
  activeContextSummary: string;
  startedAt: string;
}

export async function startDuplexVoice(language?: string, voiceTone?: string): Promise<DuplexVoiceSession> {
  const res = await apiRequest<{ success: boolean; session: DuplexVoiceSession }>('/api/glacia/duplex/start', {
    method: 'POST',
    body: JSON.stringify({ language, voiceTone }),
  });
  return res.session;
}

export async function sendUserBargeIn(sessionId: string, userUtterance: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; bargeIn: any }>('/api/glacia/duplex/bargein', {
    method: 'POST',
    body: JSON.stringify({ sessionId, userUtterance }),
  });
  return res.bargeIn;
}

export async function fetchDuplexSessions(): Promise<DuplexVoiceSession[]> {
  const res = await apiRequest<{ success: boolean; sessions: DuplexVoiceSession[] }>('/api/glacia/duplex/sessions');
  return res.sessions || [];
}

// ── 4. AST Code Mutation & Evolution ──
export interface AstCodeMutationResult {
  mutationId: string;
  targetDescription: string;
  originalCode: string;
  mutatedCode: string;
  optimizationGoal: string;
  benchmarkComparison: {
    originalExecutionMs: number;
    mutatedExecutionMs: number;
    speedupPercentage: string;
    memorySavedKb: number;
  };
  isRegressionSafe: boolean;
  generatedAt: string;
}

export async function mutateCodeAst(code: string, goal: string): Promise<AstCodeMutationResult> {
  const res = await apiRequest<{ success: boolean; mutation: AstCodeMutationResult }>('/api/glacia/ast/mutate', {
    method: 'POST',
    body: JSON.stringify({ code, goal }),
  });
  return res.mutation;
}

export async function fetchAstMutations(): Promise<AstCodeMutationResult[]> {
  const res = await apiRequest<{ success: boolean; mutations: AstCodeMutationResult[] }>('/api/glacia/ast/mutations');
  return res.mutations || [];
}

// ── 5. P2P Swarm Sync Mesh ──
export interface SwarmPeerNode {
  peerId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  status: string;
  computeCapacityFlops: string;
  latencyMs: number;
}

export interface SwarmMeshTopology {
  localNodeId: string;
  activePeerCount: number;
  totalSwarmComputeCapacity: string;
  peers: SwarmPeerNode[];
  cryptoLedgerHash: string;
  lastMeshSyncAt: string;
}

export async function fetchSwarmTopology(): Promise<SwarmMeshTopology> {
  const res = await apiRequest<{ success: boolean; topology: SwarmMeshTopology }>('/api/glacia/swarm/topology');
  return res.topology;
}

export async function offloadSwarmJob(targetPeerId: string, jobType: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; job: any }>('/api/glacia/swarm/offload', {
    method: 'POST',
    body: JSON.stringify({ targetPeerId, jobType }),
  });
  return res.job;
}

export async function syncSwarmMesh(remotePeerId: string): Promise<any> {
  const res = await apiRequest<{ success: boolean; sync: any }>('/api/glacia/swarm/sync', {
    method: 'POST',
    body: JSON.stringify({ remotePeerId }),
  });
  return res.sync;
}
