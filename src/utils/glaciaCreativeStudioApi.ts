/**
 * glaciaCreativeStudioApi.ts
 * ============================================================
 * GLACIA GAME, SOFTWARE & AI VIDEO STUDIO CLIENT SDK
 * ------------------------------------------------------------
 * Connects frontend UI to Glacia's creative engineering services:
 *  - generateGameProject: Generates playable HTML5/Canvas/Three.js games
 *  - generateSoftwareApp: Generates fullstack app blueprint & components
 *  - generateAiVideoProject: Generates 5-stage viral storyboard & FFmpeg script
 *  - fetchCreativePresets: Loads presets for games, software and videos
 * ============================================================
 */

export interface PlayableGameProject {
  id: string;
  title: string;
  genre: 'space_shooter' | 'cyber_platformer' | 'gem_collector_3d' | 'rpg_puzzle' | 'neon_runner';
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  targetFps: number;
  controls: {
    pc: string;
    mobile: string;
  };
  features: string[];
  standaloneHtmlBundle: string;
  sourceCode: {
    jsLogic: string;
    cssStyles: string;
    audioSynthJs: string;
  };
  stats: {
    estimatedLinesOfCode: number;
    audioSfxCount: number;
    particleSystemsCount: number;
  };
  createdAt: string;
}

export interface SoftwareAppBlueprint {
  id: string;
  appName: string;
  appType: 'saas_dashboard' | 'ai_tool_workbench' | 'crm_pipeline' | 'ecommerce_pos';
  description: string;
  techStack: string[];
  architectureOverview: string;
  components: Array<{
    name: string;
    filePath: string;
    codeSnippet: string;
  }>;
  apiEndpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    description: string;
  }>;
  createdAt: string;
}

export interface VideoStudioScene {
  sceneIndex: number;
  timecodeRange: string;
  durationSec: number;
  stageName: 'Hook' | 'Problem' | 'Solution' | 'Social Proof' | 'Call to Action';
  scriptVoiceover: string;
  onScreenCaption: string;
  brollVisualDescription: string;
  aiVideoGenPrompt: string;
  soundEffectCue?: string;
  transitionEffect: 'cut' | 'zoom_in' | 'cross_dissolve' | 'glitch' | 'slide_left';
}

export interface VideoProductionProject {
  id: string;
  title: string;
  topic: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  targetDurationSec: number;
  targetAudience: 'b2b_executives' | 'tech_founders' | 'general_public' | 'gamers';
  scenes: VideoStudioScene[];
  fullNarrationScript: string;
  ttsVoiceMeta: {
    language: string;
    suggestedVoiceModel: string;
    wordsPerMinute: number;
    totalWordCount: number;
  };
  ffmpegScript: {
    bashScript: string;
    powershellScript: string;
  };
  capCutTimelineJson: string;
  seoViralTags: string[];
  createdAt: string;
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${endpoint} failed (${res.status}): ${errorBody}`);
  }
  return res.json();
}

export async function fetchGamePresets(): Promise<{ gamePresets: any[]; softwarePresets: any[] }> {
  try {
    const res = await apiRequest<{ success: boolean; gamePresets: any[]; softwarePresets: any[] }>('/api/glacia/creative/game/presets');
    return { gamePresets: res.gamePresets, softwarePresets: res.softwarePresets };
  } catch {
    return {
      gamePresets: [
        { id: 'gem_3d', title: 'Glacia Crystal Odyssey 3D', genre: 'gem_collector_3d', description: 'Trò chơi thu thập pha lê ngọc bích 3D cùng robot Glacia' },
        { id: 'space_sh', title: 'Cyber Galaxy Defender', genre: 'space_shooter', description: 'Bảo vệ dải ngân hà với hạm đội AI vệ tinh' },
        { id: 'neon_run', title: 'Aurora Neon Runner', genre: 'neon_runner', description: 'Lướt sóng photon qua đường hầm lượng tử tốc độ cao' }
      ],
      softwarePresets: [
        { id: 'saas_crm', title: 'Next-Gen Autonomous CRM', appType: 'crm_pipeline', description: 'Hệ thống CRM tự động hóa đường ống bán hàng' },
        { id: 'ai_tool', title: 'Multi-Agent Code Generator', appType: 'ai_tool_workbench', description: 'Bàn làm việc lập trình cùng các AI Staff' }
      ]
    };
  }
}

export async function generateGameProject(params: {
  title?: string;
  genre?: string;
  themeDescription?: string;
}): Promise<PlayableGameProject> {
  try {
    const res = await apiRequest<{ success: boolean; project: PlayableGameProject }>('/api/glacia/creative/game/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.project;
  } catch {
    const title = params.title || 'Glacia Crystal Quest 3D';
    return {
      id: `game-${Date.now()}`,
      title,
      genre: (params.genre as any) || 'gem_collector_3d',
      description: params.themeDescription || 'Trò chơi WebGL 3D tương tác thế hệ mới vận hành độc lập.',
      canvasWidth: 800,
      canvasHeight: 600,
      targetFps: 60,
      controls: { pc: 'Phím WASD / Mũi tên để di chuyển, Space để nhảy, Chuột xoay góc nhìn', mobile: 'Cần gạt Joystick cảm ứng ảo trên màn hình' },
      features: ['3D Crystal Shaders', 'Dynamic Lighting', 'Glacia Companion AI', 'Acoustic Sound Synthesizer'],
      standaloneHtmlBundle: `<!DOCTYPE html><html><head><title>${title}</title><style>body{margin:0;background:#020617;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;}</style></head><body><div style="text-align:center;"><h2>🎮 ${title}</h2><p>Trò chơi 3D tương tác chạy trên nền Three.js</p></div></body></html>`,
      sourceCode: {
        jsLogic: '// Three.js Autonomous Engine\nconsole.log("Game Engine Ready");',
        cssStyles: 'body { margin: 0; background: #020617; overflow: hidden; }',
        audioSynthJs: '// Web Audio 8-bit Synthesizer',
      },
      stats: { estimatedLinesOfCode: 380, audioSfxCount: 6, particleSystemsCount: 2 },
      createdAt: new Date().toISOString(),
    };
  }
}

export async function generateSoftwareApp(params: {
  appName?: string;
  appType?: string;
  description?: string;
}): Promise<SoftwareAppBlueprint> {
  try {
    const res = await apiRequest<{ success: boolean; blueprint: SoftwareAppBlueprint }>('/api/glacia/creative/software/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.blueprint;
  } catch {
    const appName = params.appName || 'LedgerFlow Autonomous App';
    return {
      id: `app-bp-${Date.now()}`,
      appName,
      appType: (params.appType as any) || 'saas_dashboard',
      description: params.description || 'Hệ thống ứng dụng tự động hoá quản trị thông minh.',
      techStack: ['React 18', 'TypeScript', 'TailwindCSS', 'Express REST API', 'SQLite Cache'],
      architectureOverview: 'Kiến trúc phân tầng Micro-Service Module kết nối trực tiếp với Glacia Autonomous Core.',
      components: [
        { name: 'DashboardShell', filePath: 'src/components/DashboardShell.tsx', codeSnippet: 'export function DashboardShell() { return <div className="p-6">Dashboard</div>; }' },
        { name: 'AnalyticsWidget', filePath: 'src/components/AnalyticsWidget.tsx', codeSnippet: 'export function AnalyticsWidget() { return <div className="card">Metrics</div>; }' },
      ],
      apiEndpoints: [
        { method: 'GET', path: '/api/v1/metrics', description: 'Lấy dữ liệu telemetry thời gian thực' },
        { method: 'POST', path: '/api/v1/actions/dispatch', description: 'Kích hoạt lệnh tự động hóa' },
      ],
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchVideoPresets(): Promise<any[]> {
  try {
    const res = await apiRequest<{ success: boolean; presets: any[] }>('/api/glacia/creative/video/presets');
    return res.presets;
  } catch {
    return [
      { id: 'b2b_explainer', topic: 'Giới thiệu Giải pháp AI B2B', aspectRatio: '16:9', targetAudience: 'b2b_executives' },
      { id: 'viral_reels', topic: 'Trình diễn Khả năng Tự trị của Glacia Robot', aspectRatio: '9:16', targetAudience: 'tech_founders' },
    ];
  }
}

export async function generateAiVideoProject(params: {
  topic?: string;
  aspectRatio?: string;
  targetAudience?: string;
}): Promise<VideoProductionProject> {
  try {
    const res = await apiRequest<{ success: boolean; project: VideoProductionProject }>('/api/glacia/creative/video/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.project;
  } catch {
    const topic = params.topic || 'Video Sản Phẩm LedgerFlow Studio';
    return {
      id: `vid-${Date.now()}`,
      title: topic,
      topic,
      aspectRatio: (params.aspectRatio as any) || '9:16',
      targetDurationSec: 60,
      targetAudience: (params.targetAudience as any) || 'tech_founders',
      scenes: [
        { sceneIndex: 1, timecodeRange: '00:00 - 00:05', durationSec: 5, stageName: 'Hook', scriptVoiceover: 'Bạn có biết công ty một người có thể vận hành tương đương 50 nhân sự nhờ AI?', onScreenCaption: 'TỰ TRỊ HOÀN TOÀN VỚI GLACIA AI', brollVisualDescription: 'Cận cảnh robot Glacia ngọc bích 3D phát sáng hào quang cực quang', aiVideoGenPrompt: 'Futuristic crystalline dragon anime companion glowing in cyan neon', transitionEffect: 'zoom_in' },
        { sceneIndex: 2, timecodeRange: '00:05 - 00:20', durationSec: 15, stageName: 'Problem', scriptVoiceover: 'Founder mất quá nhiều thời gian cho kế toán, vận hành và quản lý nhân sự rời rạc.', onScreenCaption: 'Gánh nặng vận hành đè nặng founder', brollVisualDescription: 'Màn hình máy tính với hàng chục tab trình duyệt và bảng tính excel rối rắm', aiVideoGenPrompt: 'Overwhelmed founder surrounded by floating data screens in dark room', transitionEffect: 'cross_dissolve' },
      ],
      fullNarrationScript: 'Bạn có biết công ty một người có thể vận hành tương đương 50 nhân sự nhờ AI? Hệ thống Glacia Robot tự động hóa toàn bộ.',
      ttsVoiceMeta: { language: 'vi-VN', suggestedVoiceModel: 'vi-VN-Standard-A', wordsPerMinute: 150, totalWordCount: 85 },
      ffmpegScript: { bashScript: '#!/bin/bash\nffmpeg -i input.mp4 -vf scale=1080:1920 output.mp4', powershellScript: 'ffmpeg -i input.mp4 -vf scale=1080:1920 output.mp4' },
      capCutTimelineJson: '{"version": 1, "tracks": []}',
      seoViralTags: ['#AICompany', '#SoloFounder', '#GlaciaRobot', '#LedgerFlow'],
      createdAt: new Date().toISOString(),
    };
  }
}

// --- Auto-Programmer Integration ---

export interface AutoProgramCreativeRequest {
  projectType: 'game' | 'software' | 'video';
  title?: string;
  description?: string;
  genre?: string;
  appType?: string;
  targetAudience?: string;
  aspectRatio?: string;
}

export interface AutoProgramCreativeResult {
  id: string;
  projectType: string;
  title: string;
  status: 'generating' | 'completed' | 'failed';
  content: string;
  modelUsed: string;
  capabilityUsed: string;
  latencyMs: number;
  estimatedCostUsd: number;
  createdAt: string;
  completedAt?: string;
}

/**
 * Generate a project using the Auto-Programmer (Multi-Model AI Router)
 * Supports: games, software apps, and video scripts
 */
export async function autoProgramGenerate(request: AutoProgramCreativeRequest): Promise<AutoProgramCreativeResult> {
  const res = await apiRequest<{ success: boolean; result: AutoProgramCreativeResult }>('/api/glacia/auto-program/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return res.result;
}

export async function autoProgramGetResult(id: string): Promise<AutoProgramCreativeResult | null> {
  const res = await apiRequest<{ success: boolean; result: AutoProgramCreativeResult }>(`/api/glacia/auto-program/result/${id}`);
  return res.result;
}

export async function autoProgramListSessions(projectType?: string): Promise<AutoProgramCreativeResult[]> {
  const params = projectType ? `?projectType=${projectType}` : '';
  const res = await apiRequest<{ success: boolean; sessions: AutoProgramCreativeResult[] }>(`/api/glacia/auto-program/sessions${params}`);
  return res.sessions;
}

export async function autoProgramGetStats(): Promise<{ totalSessions: number; byType: Record<string, number> }> {
  const res = await apiRequest<{ success: boolean; stats: { totalSessions: number; byType: Record<string, number> } }>('/api/glacia/auto-program/stats');
  return res.stats;
}

export async function autoProgramDeleteSession(id: string): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>(`/api/glacia/auto-program/session/${id}`, {
    method: 'DELETE',
  });
  return res.success;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 AUTONOMOUS CREATIVE GOAL GENERATOR CLIENT SDK
// ═══════════════════════════════════════════════════════════════════

export interface AutonomousCreativeGoal {
  id: string;
  title: string;
  category: 'game' | 'film' | '3d_character' | 'swe_app';
  description: string;
  trendRationale: string;
  targetAudience: string;
  estimatedEffortSec: number;
  swarmAssignments: Array<{
    agentId: string;
    agentName: string;
    role: string;
    taskTitle: string;
    status: 'pending' | 'working' | 'done';
  }>;
  status: 'proposed' | 'in_progress' | 'completed' | 'failed';
  artifactPayload?: any;
  createdAt: string;
  completedAt?: string;
}

export async function fetchAutonomousCreativeGoals(): Promise<AutonomousCreativeGoal[]> {
  const res = await apiRequest<{ success: boolean; goals: AutonomousCreativeGoal[] }>('/api/glacia/creative/goals/list');
  return res.goals || [];
}

export async function synthesizeAutonomousGoal(category?: string): Promise<AutonomousCreativeGoal> {
  const res = await apiRequest<{ success: boolean; goal: AutonomousCreativeGoal }>('/api/glacia/creative/goals/synthesize', {
    method: 'POST',
    body: JSON.stringify({ category }),
  });
  return res.goal;
}

export async function executeAutonomousGoalApi(goalId: string): Promise<AutonomousCreativeGoal> {
  const res = await apiRequest<{ success: boolean; goal: AutonomousCreativeGoal }>('/api/glacia/creative/goals/execute', {
    method: 'POST',
    body: JSON.stringify({ goalId }),
  });
  return res.goal;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 DISTRIBUTION & VIRTUAL CAST SDK
// ═══════════════════════════════════════════════════════════════════

export interface GameDistributionPackage {
  id: string;
  gameId: string;
  gameTitle: string;
  genre: string;
  version: string;
  pwaManifest: {
    name: string;
    short_name: string;
    start_url: string;
    display: string;
    background_color: string;
    theme_color: string;
    icons: Array<{ src: string; sizes: string; type: string }>;
  };
  desktopLauncherConfig: {
    appName: string;
    mainScript: string;
    window: { width: number; height: number; title: string; resizable: boolean };
  };
  pressKit: {
    headline: string;
    elevatorPitch: string;
    keyFeatures: string[];
    targetAudience: string;
    monetizationStrategy: string;
    recommendedPriceUsd: number;
    viralSocialHooks: string[];
  };
  storefrontMetadata: {
    itchIoTags: string[];
    steamGenreTags: string[];
    esrbRatingRecommendation: string;
    systemRequirements: {
      minimumCpu: string;
      minimumRam: string;
      gpu: string;
      storageMb: number;
    };
  };
  createdAt: string;
}

export interface VirtualCastMember {
  id: string;
  name: string;
  archetype: 'protagonist' | 'antagonist' | 'companion' | 'mentor' | 'mecha_boss';
  roleTitle: string;
  loreBackstory: string;
  visualSpecs: {
    heightMeters: number;
    primaryColorHex: string;
    secondaryColorHex: string;
    glowIntensity: number;
    polyCountEstimate: number;
    rigBonesCount: number;
  };
  animationClips: string[];
  blenderScriptSnippet: string;
}

export async function fetchDistributionPackages(): Promise<GameDistributionPackage[]> {
  const res = await apiRequest<{ success: boolean; packages: GameDistributionPackage[] }>('/api/glacia/creative/distribution/list');
  return res.packages || [];
}

export async function packageGameForDistribution(payload: { gameTitle: string; genre: string; gameId?: string }): Promise<GameDistributionPackage> {
  const res = await apiRequest<{ success: boolean; package: GameDistributionPackage }>('/api/glacia/creative/distribution/package', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.package;
}

export async function fetchVirtualCastRoster(): Promise<VirtualCastMember[]> {
  const res = await apiRequest<{ success: boolean; roster: VirtualCastMember[] }>('/api/glacia/creative/virtual-cast/roster');
  return res.roster || [];
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 LIVE STREAM & AI GAME DIRECTOR SDK
// ═══════════════════════════════════════════════════════════════════

export interface StreamChatMessage {
  id: string;
  sender: string;
  avatarColor: string;
  text: string;
  isDonation?: boolean;
  donationAmount?: number;
  currency?: string;
  timestamp: string;
}

export interface StreamHighlightClip {
  id: string;
  title: string;
  timestamp: string;
  durationSeconds: number;
  triggerEvent: 'boss_fight' | 'near_miss' | 'high_score' | 'donation_reaction' | 'epic_combo';
  streamerReaction: string;
  tiktokHook: string;
  ffmpegClipCommand: string;
}

export interface LiveStreamSession {
  id: string;
  channelName: string;
  streamTitle: string;
  currentViewerCount: number;
  peakViewerCount: number;
  totalDonationsUsd: number;
  status: 'live' | 'buffering' | 'ended';
  activeGameTitle: string;
  aiDirectorState: {
    intensityLevel: number;
    activeModifier: 'normal' | 'plasma_frenzy' | 'gravity_well' | 'boss_invasion' | 'hyper_speed';
    eventLog: Array<{ time: string; event: string }>;
  };
  recentChat: StreamChatMessage[];
  highlights: StreamHighlightClip[];
  currentGlaciaSpeech: string;
  currentEmotion: 'excited' | 'focused' | 'celebrating' | 'playful' | 'surprised';
}

export async function fetchLiveStreamSession(): Promise<LiveStreamSession> {
  const res = await apiRequest<{ success: boolean; session: LiveStreamSession }>('/api/glacia/creative/stream/session');
  return res.session;
}

export async function triggerLiveStreamEventApi(payload: {
  eventType: 'viewer_chat' | 'donation' | 'director_modifier' | 'capture_highlight';
  sender?: string;
  text?: string;
  amount?: number;
  modifier?: LiveStreamSession['aiDirectorState']['activeModifier'];
}): Promise<LiveStreamSession> {
  const res = await apiRequest<{ success: boolean; session: LiveStreamSession }>('/api/glacia/creative/stream/event', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.session;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 OPEN-SOURCE & FORUM MCP MINING SDK
// ═══════════════════════════════════════════════════════════════════

export type MiningSourceType = 
  | 'github_repos'
  | 'reddit_community'
  | 'stackoverflow_dev'
  | 'blender_artists_forum'
  | 'shadertoy_glsl'
  | 'huggingface_prompts'
  | 'devdocs_api';

export type KnowledgeCategory =
  | 'game_engine'
  | 'blender_3d'
  | 'ai_video'
  | 'webgl_shaders'
  | 'swe_architecture'
  | 'forum_practical_tips';

export interface McpMiningSource {
  id: string;
  name: string;
  type: MiningSourceType;
  category: KnowledgeCategory;
  endpointOrDomain: string;
  status: 'active' | 'synced' | 'indexing';
  totalSnippetsHarvested: number;
  lastMinedAt: string;
  trustScore: number;
  description: string;
}

export interface HarvestedKnowledgeSnippet {
  id: string;
  title: string;
  sourceType: MiningSourceType;
  sourceUrlOrAuthor: string;
  category: KnowledgeCategory;
  tags: string[];
  summary: string;
  practicalTips: string[];
  codeSnippet: string;
  executionEnvironment: 'browser_canvas' | 'three_js' | 'blender_bpy' | 'ffmpeg_cli' | 'react_ts' | 'node_express';
  performanceRating: '60FPS_optimized' | 'production_ready' | 'experimental';
  harvestedAt: string;
  mcpVectorIndexed: boolean;
}

export interface McpMiningHubState {
  totalSnippetsCount: number;
  zeroCostTokenSavingsUsd: number;
  lastAutonomousMiningRun: string;
  sources: McpMiningSource[];
  recentSnippets: HarvestedKnowledgeSnippet[];
}

export async function fetchMcpMiningState(): Promise<McpMiningHubState> {
  const res = await apiRequest<{ success: boolean; state: McpMiningHubState }>('/api/glacia/mcp-mining/status');
  return res.state;
}

export async function harvestOpenSourceKnowledgeApi(payload: {
  sourceType?: MiningSourceType;
  category?: KnowledgeCategory;
  customTopic?: string;
}): Promise<{
  success: boolean;
  harvestedCount: number;
  newSnippets: HarvestedKnowledgeSnippet[];
  distilledSkillLesson: string;
}> {
  const res = await apiRequest<{
    success: boolean;
    result: {
      success: boolean;
      harvestedCount: number;
      newSnippets: HarvestedKnowledgeSnippet[];
      distilledSkillLesson: string;
    };
  }>('/api/glacia/mcp-mining/harvest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 PROCEDURAL AUDIO & AI PLAYTEST BENCHMARK SDK
// ═══════════════════════════════════════════════════════════════════

export type MusicStyle = 'cyberpunk_synthwave' | 'chiptune_retro' | 'dark_ambient' | 'boss_battle_metal' | 'crystal_chill';
export type SoundEffectType = 'laser_beam' | 'plasma_explosion' | 'jump_boost' | 'coin_pickup' | 'glacia_powerup' | 'game_over';

export interface ProceduralAudioTrack {
  id: string;
  title: string;
  style: MusicStyle;
  tempoBpm: number;
  keyRoot: string;
  durationSeconds: number;
  generatedCodeSnippet: string;
  notesSequence: Array<{ note: string; freq: number; duration: number; time: number }>;
  sfxTriggers: Record<SoundEffectType, string>;
  createdAt: string;
}

export interface PlaytestBenchmarkResult {
  gameTitle: string;
  testedAt: string;
  funFactorScore: number;
  adrenalineCurveRating: 'calm' | 'balanced' | 'high_intensity' | 'insane';
  retentionPredictionPercentage: number;
  averageFpsBenchmark: number;
  aiPlaytestMetrics: {
    simulatedGamesPlayed: number;
    playerDeathPoints: Array<{ x: number; y: number; reason: string }>;
    recommendedFixes: string[];
  };
  geneticEvolutionAction: string;
}

export async function fetchProceduralAudioTracks(): Promise<ProceduralAudioTrack[]> {
  const res = await apiRequest<{ success: boolean; tracks: ProceduralAudioTrack[] }>('/api/glacia/creative/audio/tracks');
  return res.tracks || [];
}

export async function generateProceduralAudioTrackApi(payload: {
  style?: MusicStyle;
  tempoBpm?: number;
  customTitle?: string;
}): Promise<ProceduralAudioTrack> {
  const res = await apiRequest<{ success: boolean; track: ProceduralAudioTrack }>('/api/glacia/creative/audio/generate-track', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.track;
}

export async function runAiPlaytestBenchmarkApi(payload: {
  gameTitle?: string;
  targetDurationSeconds?: number;
}): Promise<PlaytestBenchmarkResult> {
  const res = await apiRequest<{ success: boolean; benchmark: PlaytestBenchmarkResult }>('/api/glacia/creative/game/playtest-benchmark', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.benchmark;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 MULTI-AGENT SWARM CINEMA & STORYBOARD STUDIO SDK
// ═══════════════════════════════════════════════════════════════════

export interface CinemaSceneStoryboard {
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  cameraSetup: {
    shotType: 'extreme_wide' | 'close_up' | 'dolly_zoom' | 'drone_orbit' | 'over_the_shoulder';
    movement: string;
    focalLengthMm: number;
  };
  lightingAndAtmosphere: {
    colorPaletteHex: string[];
    lightingMood: string;
    volumetricEffects: string;
  };
  characterDialogue: {
    speaker: string;
    dialogueText: string;
    emotionTone: string;
    visemeTimingCues: Array<{ time: number; viseme: string }>;
  };
  vfxAndShaderNotes: string;
  ffmpegFilterEffect: string;
  previewCanvasDataUrl?: string;
}

export interface MultiAgentCinemaProject {
  id: string;
  title: string;
  genre: 'sci_fi_cyberpunk' | 'fantasy_adventure' | 'tech_documentary' | 'action_thriller';
  logline: string;
  targetPlatform: 'tiktok_shorts' | 'youtube_cinematic' | 'game_cutscene';
  aspectRatio: '9:16' | '16:9';
  totalDurationSeconds: number;
  viralityPredictionScore: number;
  agentsContribution: {
    screenwriter: string;
    artDirector: string;
    voiceDirector: string;
    vfxSpecialist: string;
    producerAnalytics: string;
  };
  storyboardScenes: CinemaSceneStoryboard[];
  blenderSceneRenderScript: string;
  ffmpegMasterExportScript: string;
  createdAt: string;
}

export async function fetchCinemaProjects(): Promise<MultiAgentCinemaProject[]> {
  const res = await apiRequest<{ success: boolean; projects: MultiAgentCinemaProject[] }>('/api/glacia/creative/cinema/projects');
  return res.projects || [];
}

export async function generateCinemaProductionApi(payload: {
  title?: string;
  genre?: MultiAgentCinemaProject['genre'];
  targetPlatform?: MultiAgentCinemaProject['targetPlatform'];
  customConcept?: string;
}): Promise<MultiAgentCinemaProject> {
  const res = await apiRequest<{ success: boolean; project: MultiAgentCinemaProject }>('/api/glacia/creative/cinema/generate-production', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.project;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 "STANDING ON SHOULDERS OF GIANTS" SDK
// ═══════════════════════════════════════════════════════════════════

export type TechGiantId =
  | 'google_cloud_ai'
  | 'microsoft_github'
  | 'nvidia_omniverse'
  | 'meta_open_source'
  | 'blender_epic_games'
  | 'huggingface_hub'
  | 'anthropic_mcp';

export interface TechGiantConnector {
  id: TechGiantId;
  giantName: string;
  category: 'Cloud AI & Web' | 'DevOps & Code Engine' | 'Graphics & Compute' | 'Models & Frameworks' | '3D & Game Engine' | 'Open AI Hub' | 'Agent Protocols';
  logoBadge: string;
  status: 'connected' | 'online_ready' | 'zero_cost_unlimited' | 'hardware_accelerated';
  leveragedTechnologies: string[];
  zeroCostCapabilities: string[];
  bridgeProtocol: string;
  latencyMs: number;
  totalCallsRouted: number;
  costSavedUsd: number;
}

export interface GiantPowerInvocationResult {
  giantId: TechGiantId;
  action: string;
  timestamp: string;
  status: 'success' | 'simulated_ready';
  executionDetails: {
    technologyUsed: string;
    throughputSummary: string;
    generatedAssetOrCode: string;
    costIncurredUsd: number;
  };
  glaciaOrchestrationNote: string;
}

export async function fetchGiantsEcosystem(): Promise<TechGiantConnector[]> {
  const res = await apiRequest<{ success: boolean; giants: TechGiantConnector[] }>('/api/glacia/creative/giants/status');
  return res.giants || [];
}

export async function invokeGiantCapabilityApi(payload: {
  giantId: TechGiantId;
  actionName?: string;
  customParameters?: Record<string, any>;
}): Promise<GiantPowerInvocationResult> {
  const res = await apiRequest<{ success: boolean; result: GiantPowerInvocationResult }>('/api/glacia/creative/giants/invoke', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 GIANTS BEST-OF-BREED PRODUCTION PIPELINES SDK
// ═══════════════════════════════════════════════════════════════════

export type ProductionDomain = 'software' | 'game' | 'video';

export interface GiantToolItem {
  id: string;
  name: string;
  creatorGiant: string;
  domain: ProductionDomain;
  purpose: string;
  advantageSummary: string;
  zeroCostBenefit: string;
  executionSnippet: string;
}

export interface PipelineExecutionResult {
  domain: ProductionDomain;
  pipelineTitle: string;
  timestamp: string;
  toolsUsed: Array<{ name: string; giant: string; role: string }>;
  synthesizedCodeArtifact: string;
  exportFormat: string;
  executionMetrics: {
    estimatedFpsOrBuildTime: string;
    ramEfficiency: string;
    costUsd: number;
  };
  glaciaSynthesisLog: string;
}

export async function fetchGiantToolsCatalog(): Promise<GiantToolItem[]> {
  const res = await apiRequest<{ success: boolean; catalog: GiantToolItem[] }>('/api/glacia/creative/giant-pipelines/catalog');
  return res.catalog || [];
}

export async function executeGiantProductionPipelineApi(payload: {
  domain: ProductionDomain;
  projectName?: string;
  customRequirements?: string;
}): Promise<PipelineExecutionResult> {
  const res = await apiRequest<{ success: boolean; result: PipelineExecutionResult }>('/api/glacia/creative/giant-pipelines/execute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 MASTER INFINITE AUTONOMOUS CREATIVE LOOP SDK
// ═══════════════════════════════════════════════════════════════════

export interface AutonomousLoopStage {
  stepNumber: number;
  stageName: string;
  stageCode: 'goal' | 'mining' | 'giants' | 'synthesis' | 'audio' | 'playtest' | 'self_heal' | 'distribute';
  icon: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  summary: string;
  outputPayload?: any;
  durationMs: number;
}

export interface AutonomousCycleRun {
  cycleId: string;
  projectName: string;
  targetDomain: 'game' | 'video' | 'software';
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  stages: AutonomousLoopStage[];
  finalProductSummary: {
    title: string;
    description: string;
    funOrQualityScore: number;
    fpsOrBuildEfficiency: string;
    costUsd: number;
    exportPackage: string;
  };
  glaciaSingularityVerdict: string;
}

export interface AutonomousLoopEngineState {
  isLoopActive: boolean;
  activeCycle: AutonomousCycleRun | null;
  completedCyclesCount: number;
  totalHoursRun247: number;
  totalDollarsSaved: number;
  recentCycles: AutonomousCycleRun[];
}

export async function fetchAutonomousLoopStatus(): Promise<AutonomousLoopEngineState> {
  const res = await apiRequest<{ success: boolean; state: AutonomousLoopEngineState }>('/api/glacia/creative/autonomous-loop/status');
  return res.state;
}

export async function triggerAutonomousLoopCycleApi(payload?: {
  targetDomain?: 'game' | 'video' | 'software';
  customTitle?: string;
}): Promise<AutonomousCycleRun> {
  const res = await apiRequest<{ success: boolean; result: AutonomousCycleRun }>('/api/glacia/creative/autonomous-loop/trigger-cycle', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return res.result;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 TELEGRAM CREATIVE STUDIO MOBILE DISPATCHER SDK
// ═══════════════════════════════════════════════════════════════════

export interface NightShiftTaskLog {
  id: string;
  taskType: 'level_generation' | 'video_render' | 'mcp_harvesting' | 'self_healing';
  title: string;
  status: 'completed' | 'running';
  timestamp: string;
  metrics: string;
}

export interface TelegramCreativeDispatcherState {
  isNightShiftActive: boolean;
  nightShiftStartTime: string;
  nightShiftTasksCompleted: number;
  lastMorningReportSentAt: string | null;
  recentNightLogs: NightShiftTaskLog[];
}

export interface MorningReportPayload {
  reportDate: string;
  headline: string;
  markdownContent: string;
  stats: {
    nightCycles: number;
    mapsGenerated: number;
    videosRendered: number;
    costUsd: number;
    crashRate: string;
  };
}

export async function fetchTelegramDispatcherStatus(): Promise<TelegramCreativeDispatcherState> {
  const res = await apiRequest<{ success: boolean; state: TelegramCreativeDispatcherState }>('/api/glacia/creative/telegram-dispatcher/status');
  return res.state;
}

export async function simulateTelegramMobileCommandApi(payload: {
  text: string;
  chatId?: number;
}): Promise<{ handled: boolean; sentMessages: string[] }> {
  const res = await apiRequest<{ success: boolean; handled: boolean; sentMessages: string[] }>('/api/glacia/creative/telegram-dispatcher/simulate-mobile-command', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { handled: res.handled, sentMessages: res.sentMessages || [] };
}

export async function triggerMorningReportApi(): Promise<MorningReportPayload> {
  const res = await apiRequest<{ success: boolean; report: MorningReportPayload }>('/api/glacia/creative/telegram-dispatcher/trigger-morning-report', {
    method: 'POST',
  });
  return res.report;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 4 SWARM BLACKBOARD & CONSENSUS SDK
// ═══════════════════════════════════════════════════════════════════

export type SwarmAgentRole =
  | 'lead_architect'
  | 'webgl_game'
  | 'cgi_vfx'
  | 'fullstack_code'
  | 'qa_benchmarking';

export interface SwarmAgentMember {
  id: string;
  role: SwarmAgentRole;
  name: string;
  avatar: string;
  specialty: string;
  status: 'idle' | 'analyzing' | 'synthesizing' | 'reviewing' | 'voting';
  confidenceScore: number;
  lastContribution: string;
}

export interface BlackboardMemoryArtifact {
  id: string;
  key: string;
  authorRole: SwarmAgentRole;
  title: string;
  data: any;
  version: number;
  timestamp: string;
  status: 'draft' | 'proposed' | 'approved' | 'merged';
  votesCount: { approve: number; reject: number };
}

export interface SwarmTaskDAGNode {
  id: string;
  title: string;
  assignedRole: SwarmAgentRole;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed';
  outputArtifactKey?: string;
}

export interface SwarmConsensusSession {
  sessionId: string;
  projectGoal: string;
  targetDomain: 'game' | 'video' | 'software' | 'multiverse';
  agents: SwarmAgentMember[];
  dagNodes: SwarmTaskDAGNode[];
  blackboardArtifacts: BlackboardMemoryArtifact[];
  consensusRate: number;
  isConsensusReached: boolean;
  totalSwarmIterations: number;
  startedAt: string;
  completedAt: string | null;
  glaciaMasterOrchestrationNote: string;
}

export async function fetchSwarmBlackboardStatus(): Promise<SwarmConsensusSession> {
  const res = await apiRequest<{ success: boolean; session: SwarmConsensusSession }>('/api/glacia/creative/swarm-blackboard/status');
  return res.session;
}

export async function executeSwarmConsensusRunApi(payload?: {
  projectGoal?: string;
  targetDomain?: 'game' | 'video' | 'software' | 'multiverse';
}): Promise<SwarmConsensusSession> {
  const res = await apiRequest<{ success: boolean; session: SwarmConsensusSession }>('/api/glacia/creative/swarm-blackboard/execute-run', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return res.session;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 EVOLUTIONARY GENETIC CODE BREEDING SDK
// ═══════════════════════════════════════════════════════════════════

export interface GeneticCodeVariant {
  variantId: string;
  generation: number;
  name: string;
  mutationType: 'particle_density' | 'spatial_hash_tuning' | 'wgsl_shader_opt' | 'physics_precision' | 'render_batching';
  fitnessScore: number;
  metrics: {
    measuredFps: number;
    vramUsageMb: number;
    drawCalls: number;
    funScore: number;
  };
  sampleCodeSnippet: string;
  isEliteSurvivor: boolean;
  status: 'evaluated' | 'survived' | 'discarded';
}

export interface EvolutionaryExperimentSession {
  experimentId: string;
  targetObjective: string;
  currentGeneration: number;
  maxGenerations: number;
  populationSize: number;
  mutationRate: number;
  eliteSurvivorCount: number;
  population: GeneticCodeVariant[];
  bestVariantOverall: GeneticCodeVariant;
  evolutionHistory: Array<{
    generation: number;
    avgFitness: number;
    topFitness: number;
    mutationsApplied: number;
  }>;
  glaciaEvolutionVerdict: string;
  timestamp: string;
}

export async function fetchEvolutionaryStatus(): Promise<EvolutionaryExperimentSession> {
  const res = await apiRequest<{ success: boolean; state: EvolutionaryExperimentSession }>('/api/glacia/creative/evolutionary-genetic/status');
  return res.state;
}

export async function breedNextGenerationApi(payload?: {
  targetObjective?: string;
  customMutationRate?: number;
}): Promise<EvolutionaryExperimentSession> {
  const res = await apiRequest<{ success: boolean; state: EvolutionaryExperimentSession }>('/api/glacia/creative/evolutionary-genetic/breed-generation', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return res.state;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA LEVEL 5 STRATEGIC UNIVERSE & 90-DAY ROADMAP SDK
// ═══════════════════════════════════════════════════════════════════

export interface StrategicMilestone {
  milestoneId: string;
  phaseName: string;
  targetProduct: string;
  domain: 'game' | 'video' | 'software' | 'franchise';
  deliverables: string[];
  estimatedCostUsd: number;
  scheduledShifts: { dayShift: string; nightShift: string };
  targetFpsOrResolution: string;
  status: 'planned' | 'in_progress' | 'ready_for_release' | 'released';
  completionRate: number;
}

export interface StrategicUniverseRoadmap {
  roadmapId: string;
  franchiseTitle: string;
  visionStatement: string;
  targetDurationDays: number;
  totalMilestones: number;
  milestones: StrategicMilestone[];
  projectedMetrics: {
    totalStandaloneGames: number;
    totalCinematicEpisodes: number;
    totalSoftwareUtilities: number;
    cumulativeSavingsUsd: number;
    targetCrashRate: string;
  };
  glaciaStrategicGrandVision: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchStrategicRoadmapStatus(): Promise<StrategicUniverseRoadmap> {
  const res = await apiRequest<{ success: boolean; roadmap: StrategicUniverseRoadmap }>('/api/glacia/creative/strategic-roadmap/status');
  return res.roadmap;
}

export async function advanceRoadmapMilestoneApi(payload: {
  milestoneId: string;
  newStatus?: 'planned' | 'in_progress' | 'ready_for_release' | 'released';
  progressIncrement?: number;
}): Promise<StrategicUniverseRoadmap> {
  const res = await apiRequest<{ success: boolean; roadmap: StrategicUniverseRoadmap }>('/api/glacia/creative/strategic-roadmap/advance-milestone', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.roadmap;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA ON-DEVICE OFFLINE LLM ($0 TOKEN) SDK
// ═══════════════════════════════════════════════════════════════════

export interface LocalModelProfile {
  id: string;
  name: string;
  family: 'qwen' | 'llama' | 'phi' | 'deepseek';
  parameterSize: string;
  quantization: string;
  vramRequiredMb: number;
  tokensPerSecond: number;
  status: string;
  bestFor: string[];
}

export interface OfflineLlmEngineState {
  engineVersion: string;
  activeBackend: string;
  isNetworkAvailable: boolean;
  totalOfflineQueries: number;
  totalTokensGenerated: number;
  totalMoneySavedUSD: number;
  models: LocalModelProfile[];
}

export interface OfflineInferenceResponse {
  requestId: string;
  output: string;
  modelUsed: string;
  backendUsed: string;
  latencyMs: number;
  tokensGenerated: number;
  tokenCostUSD: number;
  isAirGapped: boolean;
  timestamp: string;
}

export async function fetchOfflineLlmStatus(): Promise<OfflineLlmEngineState> {
  const res = await apiRequest<{ success: boolean; status: OfflineLlmEngineState }>('/api/glacia/offline-llm/status');
  return res.status;
}

export async function runOfflineInferenceApi(payload: {
  prompt: string;
  taskType?: 'game_code' | 'video_script' | 'self_healing' | 'fast_chat';
  preferredModel?: string;
}): Promise<OfflineInferenceResponse> {
  const res = await apiRequest<{ success: boolean; result: OfflineInferenceResponse }>('/api/glacia/offline-llm/infer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.result;
}

export async function switchOfflineBackendApi(backend: string): Promise<OfflineLlmEngineState> {
  const res = await apiRequest<{ success: boolean; status: OfflineLlmEngineState }>('/api/glacia/offline-llm/backend', {
    method: 'POST',
    body: JSON.stringify({ backend }),
  });
  return res.status;
}

// ═══════════════════════════════════════════════════════════════════
// GLACIA PROCEDURAL 3D GAME & BOSS AI FSM SDK
// ═══════════════════════════════════════════════════════════════════

export interface ProceduralWorldData {
  worldId: string;
  biome: string;
  seed: number;
  gridDimensions: { width: number; height: number; depth: number };
  tiles: Array<{ x: number; y: number; z: number; tileType: string; colorHex: string; elevation: number }>;
  boss: {
    id: string;
    name: string;
    maxHealth: number;
    currentHealth: number;
    currentState: string;
    speed: number;
    attackPower: number;
    aoeRadius: number;
    behaviorTreeDescription: string;
  };
  threeJsSceneCode: string;
  generatedAt: string;
}

export async function generateProceduralGameWorldApi(payload?: {
  biome?: string;
  seed?: number;
}): Promise<ProceduralWorldData> {
  const res = await apiRequest<{ success: boolean; world: ProceduralWorldData }>('/api/glacia/procedural-game/generate', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return res.world;
}

export async function updateBossFsmTickApi(payload: {
  boss: ProceduralWorldData['boss'];
  playerDistance: number;
  playerIsAttacking: boolean;
}): Promise<{ tickResult: { nextState: string; actionMessage: string }; updatedBoss: ProceduralWorldData['boss'] }> {
  const res = await apiRequest<{
    success: boolean;
    tickResult: { nextState: string; actionMessage: string };
    updatedBoss: ProceduralWorldData['boss'];
  }>('/api/glacia/procedural-game/boss-fsm-tick', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
}

// ═══════════════════════════════════════════════════════════════════
// 🎭 3D AVATAR & CHARACTER STUDIO SDK
// ═══════════════════════════════════════════════════════════════════

export interface CharacterModel3DData {
  id: string;
  name: string;
  archetype: string;
  customization: {
    archetypeId: string;
    characterName: string;
    primaryColorHex: string;
    emissiveColorHex: string;
    armorMetallic: number;
    glowIntensity: number;
    weaponAttachment: string;
    auraParticleType: string;
    activeAnimation: string;
    lipSyncVisemePreset: string;
  };
  animationTimings: {
    idleDurationSec: number;
    attackSpeedSec: number;
    runCycleSec: number;
  };
  threeJsRenderCode: string;
  gltfExportBlueprint: {
    assetVersion: string;
    nodeCount: number;
    polyCount: number;
    materialsCount: number;
    isMobileOptimized: boolean;
  };
  createdAt: string;
}

export async function generate3DCharacterModelApi(options?: Record<string, any>): Promise<CharacterModel3DData> {
  const res = await apiRequest<{ success: boolean; character: CharacterModel3DData }>('/api/glacia/3d-character/generate', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
  return res.character;
}

// ═══════════════════════════════════════════════════════════════════
// 🎬 ONE-CLICK CINEMA SYNTHESIZER SDK
// ═══════════════════════════════════════════════════════════════════

export interface CinemaSynthesisData {
  id: string;
  title: string;
  originalIdea: string;
  genreStyle: string;
  aspectRatio: string;
  totalDurationSec: number;
  shots: Array<{
    shotNumber: number;
    stageName: string;
    durationSec: number;
    cameraMovement: string;
    scriptVoiceoverVi: string;
    captionTitle: string;
    visualPrompt: string;
    soundFxCue: string;
  }>;
  fullScriptNarration: string;
  webAudioSynthPreset: {
    chordsBpm: number;
    bassFreqHz: number;
    leadTone: string;
  };
  ffmpegRenderCommand: string;
  createdAt: string;
}

export async function synthesizeCinemaProjectApi(payload: {
  ideaPrompt: string;
  genreStyle?: string;
  aspectRatio?: string;
}): Promise<CinemaSynthesisData> {
  const res = await apiRequest<{ success: boolean; project: CinemaSynthesisData }>('/api/glacia/cinema/synthesize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.project;
}

// ═══════════════════════════════════════════════════════════════════
// 🎮 1-CLICK STANDALONE HTML GAME EXPORTER SDK
// ═══════════════════════════════════════════════════════════════════

export interface StandaloneHtmlGameExportData {
  exportId: string;
  gameTitle: string;
  filename: string;
  filesizeKb: number;
  htmlContent: string;
  exportedAt: string;
}

export async function exportStandaloneHtmlGameApi(payload: {
  gameTitle?: string;
  biome?: string;
  bossName?: string;
}): Promise<StandaloneHtmlGameExportData> {
  const res = await apiRequest<{ success: boolean; gameBundle: StandaloneHtmlGameExportData }>('/api/glacia/game/export-standalone', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return res.gameBundle;
}

// ═══════════════════════════════════════════════════════════════════
// 🎙️ REALTIME DUPLEX VOICE SDK
// ═══════════════════════════════════════════════════════════════════

export interface DuplexVoiceData {
  sessionId: string;
  state: string;
  language: string;
  voiceTone: string;
  averageLatencyMs: number;
  activeContextSummary: string;
  responseVoiceText?: string;
}

export async function sendDuplexVoiceQueryApi(payload: {
  sessionId?: string;
  userQuery: string;
}): Promise<DuplexVoiceData> {
  const res = await apiRequest<{ success: boolean; voiceSession: DuplexVoiceData }>('/api/glacia/duplex-voice/interact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.voiceSession;
}

// ═══════════════════════════════════════════════════════════════════
// 🧹 RUNTIME GARBAGE COLLECTOR & RAM OPTIMIZER SDK
// ═══════════════════════════════════════════════════════════════════

export interface RuntimeGarbageCollectionResult {
  filesRemovedCount: number;
  bytesFreed: number;
  logsCompactedCount: number;
  currentMemoryUsageMb: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  cleanedFiles: string[];
  cleanedAt: string;
}

export async function runRuntimeGarbageCollectorApi(): Promise<RuntimeGarbageCollectionResult> {
  const res = await apiRequest<{ success: boolean; stats: RuntimeGarbageCollectionResult }>('/api/glacia/system/garbage-collect', {
    method: 'POST',
  });
  return res.stats;
}













