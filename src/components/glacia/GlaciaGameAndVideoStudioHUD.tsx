/**
 * GlaciaGameAndVideoStudioHUD.tsx
 * ============================================================
 * GLACIA WORLD-CLASS GAME PROGRAMMING & AI VIDEO PRODUCTION HUD
 * ------------------------------------------------------------
 * Interactive Creative & Engineering Cockpit:
 *  - Tab 1: Playable Game & Software Sandbox (Live 60FPS Iframe Canvas)
 *  - Tab 2: 5-Stage Multi-Scene AI Video Studio & FFmpeg Generator
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Gamepad2, Video, Sparkles, Play, Code2, Download, RefreshCw,
  Copy, Check, Volume2, Film, Layers, Smartphone, Monitor,
  Cpu, Zap, Trophy, ShieldCheck, ChevronRight, FileCode,
  Flame, Globe, Bot, Terminal, CheckCircle2, Clock, PlayCircle,
  Radio, MessageSquare, DollarSign, Heart, Gift, Share2, Eye, Sliders, Scissors,
  Database, Search, Bookmark, ExternalLink, Network, Music, Activity, Target, Disc3,
  Clapperboard, Camera, Palette, Mic2, Building2, Orbit, Dna, Compass, Users, Box
} from 'lucide-react';
import {
  fetchGamePresets,
  generateGameProject,
  generateSoftwareApp,
  fetchVideoPresets,
  generateAiVideoProject,
  fetchAutonomousCreativeGoals,
  synthesizeAutonomousGoal,
  executeAutonomousGoalApi,
  fetchDistributionPackages,
  packageGameForDistribution,
  fetchVirtualCastRoster,
  fetchLiveStreamSession,
  triggerLiveStreamEventApi,
  fetchMcpMiningState,
  harvestOpenSourceKnowledgeApi,
  fetchProceduralAudioTracks,
  generateProceduralAudioTrackApi,
  runAiPlaytestBenchmarkApi,
  fetchCinemaProjects,
  generateCinemaProductionApi,
  fetchGiantsEcosystem,
  invokeGiantCapabilityApi,
  fetchGiantToolsCatalog,
  executeGiantProductionPipelineApi,
  fetchAutonomousLoopStatus,
  triggerAutonomousLoopCycleApi,
  fetchTelegramDispatcherStatus,
  simulateTelegramMobileCommandApi,
  triggerMorningReportApi,
  fetchSwarmBlackboardStatus,
  executeSwarmConsensusRunApi,
  fetchEvolutionaryStatus,
  breedNextGenerationApi,
  fetchStrategicRoadmapStatus,
  advanceRoadmapMilestoneApi,
  fetchOfflineLlmStatus,
  runOfflineInferenceApi,
  switchOfflineBackendApi,
  generateProceduralGameWorldApi,
  updateBossFsmTickApi,
  generate3DCharacterModelApi,
  synthesizeCinemaProjectApi,
  exportStandaloneHtmlGameApi,
  sendDuplexVoiceQueryApi,
  type PlayableGameProject,
  type SoftwareAppBlueprint,
  type VideoProductionProject,
  type OfflineLlmEngineState,
  type OfflineInferenceResponse,
  type ProceduralWorldData,
  type CharacterModel3DData,
  type CinemaSynthesisData,
  type StandaloneHtmlGameExportData,
  type DuplexVoiceData,
  type AutonomousCreativeGoal,
  type GameDistributionPackage,
  type VirtualCastMember,
  type LiveStreamSession,
  type StreamChatMessage,
  type StreamHighlightClip,
  type McpMiningHubState,
  type McpMiningSource,
  type HarvestedKnowledgeSnippet,
  type ProceduralAudioTrack,
  type PlaytestBenchmarkResult,
  type MusicStyle,
  type MultiAgentCinemaProject,
  type CinemaSceneStoryboard,
  type TechGiantConnector,
  type GiantPowerInvocationResult,
  type TechGiantId,
  type GiantToolItem,
  type PipelineExecutionResult,
  type ProductionDomain,
  type AutonomousLoopStage,
  type AutonomousCycleRun,
  type AutonomousLoopEngineState,
  type TelegramCreativeDispatcherState,
  type NightShiftTaskLog,
  type MorningReportPayload,
  type SwarmConsensusSession,
  type SwarmAgentMember,
  type BlackboardMemoryArtifact,
  type SwarmTaskDAGNode,
  type EvolutionaryExperimentSession,
  type GeneticCodeVariant,
  type StrategicUniverseRoadmap,
  type StrategicMilestone,
} from '../../utils/glaciaCreativeStudioApi';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';

export default function GlaciaGameAndVideoStudioHUD() {
  const { speak, triggerReaction } = useGlacia();
  const [studioMode, setStudioMode] = useState<
    | 'game'
    | 'video'
    | 'singularity'
    | 'stream'
    | 'mcp_mining'
    | 'audio_lab'
    | 'cinema'
    | 'giants'
    | 'infinite_loop'
    | 'telegram_dispatcher'
    | 'swarm_blackboard'
    | 'evolutionary_genetic'
    | 'strategic_roadmap'
    | 'offline_engine'
    | 'procedural_arena'
    | 'character_lab'
    | 'cinema_synthesizer'
    | 'duplex_voice'
  >('character_lab');

  // Game & Software State
  const [gamePresets, setGamePresets] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('space_shooter');
  const [gameTitle, setGameTitle] = useState('Neon Stellar Defender 2026');
  const [gameTheme, setGameTheme] = useState('Game bắn phi thuyền arcade không gian vũ trụ với hiệu ứng hạt plasma');
  const [currentGame, setCurrentGame] = useState<PlayableGameProject | null>(null);
  const [currentApp, setCurrentApp] = useState<SoftwareAppBlueprint | null>(null);
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Video Studio State
  const [videoPresets, setVideoPresets] = useState<any[]>([]);
  const [videoTopic, setVideoTopic] = useState('Robot AI Tự Động Hóa Vận Hành Doanh Nghiệp 24/7');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [currentVideo, setCurrentVideo] = useState<VideoProductionProject | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState(false);

  // Level 5 Singularity State
  const [goals, setGoals] = useState<AutonomousCreativeGoal[]>([]);
  const [isSynthesizingGoal, setIsSynthesizingGoal] = useState(false);
  const [executingGoalId, setExecutingGoalId] = useState<string | null>(null);
  const [virtualCast, setVirtualCast] = useState<VirtualCastMember[]>([]);
  const [distributionPackages, setDistributionPackages] = useState<GameDistributionPackage[]>([]);
  const [isPackagingDist, setIsPackagingDist] = useState(false);
  const [activeSingularitySubTab, setActiveSingularitySubTab] = useState<'goals' | 'cast' | 'distribution'>('goals');
  const [selectedCast, setSelectedCast] = useState<VirtualCastMember | null>(null);

  // Level 5 Live Stream & AI Director State
  const [streamSession, setStreamSession] = useState<LiveStreamSession | null>(null);
  const [customChatInput, setCustomChatInput] = useState('');
  const [isTriggeringStreamEvent, setIsTriggeringStreamEvent] = useState(false);

  // Level 5 Open-Source & Forum MCP Mining State
  const [mcpState, setMcpState] = useState<McpMiningHubState | null>(null);
  const [isHarvestingMcp, setIsHarvestingMcp] = useState(false);
  const [customMiningTopic, setCustomMiningTopic] = useState('');
  const [selectedMcpSnippet, setSelectedMcpSnippet] = useState<HarvestedKnowledgeSnippet | null>(null);
  const [copiedMcpCode, setCopiedMcpCode] = useState(false);

  // Level 5 Procedural Audio & AI Playtest Benchmark State
  const [audioTracks, setAudioTracks] = useState<ProceduralAudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<ProceduralAudioTrack | null>(null);
  const [isGeneratingAudioTrack, setIsGeneratingAudioTrack] = useState(false);
  const [playtestBenchmark, setPlaytestBenchmark] = useState<PlaytestBenchmarkResult | null>(null);
  const [isRunningPlaytest, setIsRunningPlaytest] = useState(false);
  const [copiedAudioCode, setCopiedAudioCode] = useState(false);

  // Level 5 Swarm Cinema & Storyboard State
  const [cinemaProjects, setCinemaProjects] = useState<MultiAgentCinemaProject[]>([]);
  const [selectedCinemaProject, setSelectedCinemaProject] = useState<MultiAgentCinemaProject | null>(null);
  const [isGeneratingCinema, setIsGeneratingCinema] = useState(false);
  const [activeStoryboardSceneIndex, setActiveStoryboardSceneIndex] = useState(0);
  const [copiedBlenderScript, setCopiedBlenderScript] = useState(false);
  const [copiedCinemaFfmpeg, setCopiedCinemaFfmpeg] = useState(false);

  // Level 5 "Standing on Shoulders of Giants" Federation State
  const [giantsList, setGiantsList] = useState<TechGiantConnector[]>([]);
  const [selectedGiant, setSelectedGiant] = useState<TechGiantConnector | null>(null);
  const [isInvokingGiant, setIsInvokingGiant] = useState(false);
  const [invocationResult, setInvocationResult] = useState<GiantPowerInvocationResult | null>(null);
  const [copiedGiantCode, setCopiedGiantCode] = useState(false);

  // Level 5 Best-of-Breed Giant Tools Pipelines State
  const [activeGiantsSubTab, setActiveGiantsSubTab] = useState<'ecosystem' | 'pipelines'>('pipelines');
  const [selectedPipelineDomain, setSelectedPipelineDomain] = useState<ProductionDomain>('software');
  const [giantToolsCatalog, setGiantToolsCatalog] = useState<GiantToolItem[]>([]);
  const [pipelineExecutionResult, setPipelineExecutionResult] = useState<PipelineExecutionResult | null>(null);
  const [isExecutingPipeline, setIsExecutingPipeline] = useState(false);
  const [copiedPipelineArtifact, setCopiedPipelineArtifact] = useState(false);

  // Level 5 Master Infinite Autonomous Creative Loop State
  const [autonomousLoopState, setAutonomousLoopState] = useState<AutonomousLoopEngineState | null>(null);
  const [isTriggeringLoopCycle, setIsTriggeringLoopCycle] = useState(false);
  const [selectedLoopDomain, setSelectedLoopDomain] = useState<'game' | 'video' | 'software'>('game');

  // Level 5 Telegram Creative Studio Mobile Dispatcher State
  const [telegramDispatcherState, setTelegramDispatcherState] = useState<TelegramCreativeDispatcherState | null>(null);
  const [simulatedTelegramCommand, setSimulatedTelegramCommand] = useState('/singularity');
  const [simulatedChatResponses, setSimulatedChatResponses] = useState<string[]>([
    '🤖 Glacia Creative Studio Telegram Bot đã sẵn sàng nhận lệnh từ Founder David Bao!',
  ]);
  const [isSimulatingTelegram, setIsSimulatingTelegram] = useState(false);
  const [morningReport, setMorningReport] = useState<MorningReportPayload | null>(null);
  const [isLoadingMorningReport, setIsLoadingMorningReport] = useState(false);

  // Level 4 Swarm Blackboard State
  const [swarmSession, setSwarmSession] = useState<SwarmConsensusSession | null>(null);
  const [isExecutingSwarm, setIsExecutingSwarm] = useState(false);
  const [swarmCustomGoal, setSwarmCustomGoal] = useState('Vũ Trụ Không Gian Cyberpunk 3D Siêu Thực 60FPS');

  // Level 5 Evolutionary Genetic State
  const [evolutionarySession, setEvolutionarySession] = useState<EvolutionaryExperimentSession | null>(null);
  const [isBreedingGeneration, setIsBreedingGeneration] = useState(false);

  // Level 5 Strategic Roadmap State
  const [strategicRoadmap, setStrategicRoadmap] = useState<StrategicUniverseRoadmap | null>(null);
  const [isAdvancingMilestone, setIsAdvancingMilestone] = useState(false);

  // On-Device Offline LLM State
  const [offlineEngineState, setOfflineEngineState] = useState<OfflineLlmEngineState | null>(null);
  const [offlinePrompt, setOfflinePrompt] = useState('Tạo game arcade 3D WebGL với vòng lặp 60FPS và hệ thống va chạm SpatialHash');
  const [selectedOfflineModel, setSelectedOfflineModel] = useState('qwen2.5-coder-1.5b');
  const [offlineTaskType, setOfflineTaskType] = useState<'game_code' | 'video_script' | 'self_healing' | 'fast_chat'>('game_code');
  const [offlineResult, setOfflineResult] = useState<OfflineInferenceResponse | null>(null);
  const [isInferringOffline, setIsInferringOffline] = useState(false);

  // Procedural 3D World & Boss AI State
  const [proceduralWorld, setProceduralWorld] = useState<ProceduralWorldData | null>(null);
  const [selectedBiome, setSelectedBiome] = useState<string>('cyberpunk_neon_dungeon');
  const [worldSeed, setWorldSeed] = useState<number>(42);
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);
  const [bossFsmLog, setBossFsmLog] = useState<string[]>([]);
  const [isBossTicking, setIsBossTicking] = useState(false);

  // 3D Avatar & Character Studio State
  const [character3D, setCharacter3D] = useState<CharacterModel3DData | null>(null);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState('cyber_glacia_prime');
  const [characterCustomName, setCharacterCustomName] = useState('Glacia Sovereign 3D');
  const [charPrimaryColor, setCharPrimaryColor] = useState('#06b6d4');
  const [charEmissiveColor, setCharEmissiveColor] = useState('#38bdf8');
  const [charWeapon, setCharWeapon] = useState('laser_katana');
  const [charAnimation, setCharAnimation] = useState('idle');
  const [isGeneratingChar3D, setIsGeneratingChar3D] = useState(false);
  const [copiedChar3DCode, setCopiedChar3DCode] = useState(false);

  // 1-Click Cinema Synthesizer State
  const [cinemaIdeaPrompt, setCinemaIdeaPrompt] = useState('Glacia du hành qua trạm vũ trụ Cyberpunk bỏ hoang và thức tỉnh ma trận robot');
  const [cinemaGenreStyle, setCinemaGenreStyle] = useState('cyberpunk_scifi');
  const [cinemaAspectRatio, setCinemaAspectRatio] = useState('16:9');
  const [synthesizedCinema, setSynthesizedCinema] = useState<CinemaSynthesisData | null>(null);
  const [isSynthesizingCinema, setIsSynthesizingCinema] = useState(false);
  const [copiedCinemaCommand, setCopiedCinemaCommand] = useState(false);

  // Realtime Duplex Voice State
  const [duplexVoiceSession, setDuplexVoiceSession] = useState<DuplexVoiceData | null>(null);
  const [duplexVoiceInput, setDuplexVoiceInput] = useState('');
  const [isDuplexTalking, setIsDuplexTalking] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<Array<{ sender: 'user' | 'glacia'; text: string; time: string }>>([
    { sender: 'glacia', text: 'Dạ em chào anh David Bao! Em Glacia đang lắng nghe anh qua kênh đàm thoại giọng nói 2 chiều trực tiếp ạ!', time: 'Vừa xong' },
  ]);

  useEffect(() => {
    async function init() {
      try {
        const { gamePresets: gp } = await fetchGamePresets();
        setGamePresets(gp);
        const vp = await fetchVideoPresets();
        setVideoPresets(vp);

        const initialGoals = await fetchAutonomousCreativeGoals();
        setGoals(initialGoals);

        const cast = await fetchVirtualCastRoster();
        setVirtualCast(cast);
        if (cast.length > 0) setSelectedCast(cast[0]);

        const pkgs = await fetchDistributionPackages();
        setDistributionPackages(pkgs);

        const sess = await fetchLiveStreamSession();
        setStreamSession(sess);

        const mcp = await fetchMcpMiningState();
        setMcpState(mcp);
        if (mcp?.recentSnippets?.length > 0) setSelectedMcpSnippet(mcp.recentSnippets[0]);

        const tracks = await fetchProceduralAudioTracks();
        setAudioTracks(tracks);
        if (tracks.length > 0) setSelectedAudioTrack(tracks[0]);

        const cinProjects = await fetchCinemaProjects();
        setCinemaProjects(cinProjects);
        if (cinProjects.length > 0) setSelectedCinemaProject(cinProjects[0]);

        const gList = await fetchGiantsEcosystem();
        setGiantsList(gList);
        if (gList.length > 0) setSelectedGiant(gList[0]);

        const catalog = await fetchGiantToolsCatalog();
        setGiantToolsCatalog(catalog);

        const loopState = await fetchAutonomousLoopStatus();
        setAutonomousLoopState(loopState);

        const tgState = await fetchTelegramDispatcherStatus();
        setTelegramDispatcherState(tgState);

        const swarm = await fetchSwarmBlackboardStatus();
        setSwarmSession(swarm);

        const evo = await fetchEvolutionaryStatus();
        setEvolutionarySession(evo);

        const roadmap = await fetchStrategicRoadmapStatus();
        setStrategicRoadmap(roadmap);

        const offline = await fetchOfflineLlmStatus();
        setOfflineEngineState(offline);

        const world = await generateProceduralGameWorldApi({ biome: 'cyberpunk_neon_dungeon', seed: 42 });
        setProceduralWorld(world);

        // Auto generate initial sample game
        const initialGame = await generateGameProject({ genre: 'space_shooter' });
        setCurrentGame(initialGame);

        // Auto generate initial sample video
        const initialVideo = await generateAiVideoProject({ topic: vp[0]?.topic || videoTopic, aspectRatio: '9:16' });
        setCurrentVideo(initialVideo);
        // Auto generate initial 3D Character
        const initialChar = await generate3DCharacterModelApi({ archetypeId: 'cyber_glacia_prime' });
        setCharacter3D(initialChar);

        // Auto synthesize initial Cinema Project
        const initialCin = await synthesizeCinemaProjectApi({
          ideaPrompt: 'Glacia du hành qua trạm vũ trụ Cyberpunk bỏ hoang và thức tỉnh ma trận robot',
        });
        setSynthesizedCinema(initialCin);
      } catch (err) {
        console.error('Failed to init creative studio:', err);
      }
    }
    init();
  }, []);

  const handleGenerate3DCharacter = async (archetypeId?: string) => {
    if (isGeneratingChar3D) return;
    setIsGeneratingChar3D(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const char = await generate3DCharacterModelApi({
        archetypeId: archetypeId || selectedArchetypeId,
        characterName: characterCustomName,
        primaryColorHex: charPrimaryColor,
        emissiveColorHex: charEmissiveColor,
        weaponAttachment: charWeapon,
        activeAnimation: charAnimation,
      });
      setCharacter3D(char);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia vừa tạo mẫu nhân vật 3D ${char.name} thành công với ${char.gltfExportBlueprint.polyCount} đa giác và sẵn sàng xuất file 3D rồi ạ!`, 'celebrating');
    } catch (err) {
      console.error('Generate 3D character failed:', err);
    } finally {
      setIsGeneratingChar3D(false);
    }
  };

  const handleSynthesizeCinema = async () => {
    if (isSynthesizingCinema || !cinemaIdeaPrompt.trim()) return;
    setIsSynthesizingCinema(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const cin = await synthesizeCinemaProjectApi({
        ideaPrompt: cinemaIdeaPrompt,
        genreStyle: cinemaGenreStyle,
        aspectRatio: cinemaAspectRatio,
      });
      setSynthesizedCinema(cin);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia vừa chuyển đổi kịch bản "${cin.title}" thành 5 phân cảnh điện ảnh 4K hoàn chỉnh cùng lệnh render FFmpeg rồi ạ!`, 'celebrating');
    } catch (err) {
      console.error('Synthesize cinema failed:', err);
    } finally {
      setIsSynthesizingCinema(false);
    }
  };

  const handleExportStandaloneGame = async () => {
    try {
      triggerReaction('sparkle');
      glaciaAudio.playQuantumDispatch();
      const res = await exportStandaloneHtmlGameApi({
        gameTitle: currentGame?.title || gameTitle,
        biome: selectedBiome,
        bossName: proceduralWorld?.boss.name || 'Cyber Dragon Overlord',
      });
      const blob = new Blob([res.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia đã đóng gói toàn bộ game 3D thành 1 file HTML5 độc lập (${res.filesizeKb} KB) và tải xuống máy anh rồi ạ!`, 'celebrating');
    } catch (err) {
      console.error('Export standalone game failed:', err);
    }
  };

  const handleSendDuplexVoiceQuery = async (overrideQuery?: string) => {
    const q = overrideQuery || duplexVoiceInput;
    if (!q.trim() || isDuplexTalking) return;
    setIsDuplexTalking(true);
    setVoiceTranscripts((prev) => [...prev, { sender: 'user', text: q, time: 'Vừa xong' }]);
    setDuplexVoiceInput('');
    triggerReaction('listening');
    glaciaAudio.playCrystalChime(1046.5);
    try {
      const res = await sendDuplexVoiceQueryApi({
        sessionId: duplexVoiceSession?.sessionId,
        userQuery: q,
      });
      setDuplexVoiceSession(res);
      const responseText = res.responseVoiceText || `Dạ em đã nhận lệnh và đang thực thi cho anh: "${q}" ạ!`;
      setVoiceTranscripts((prev) => [...prev, { sender: 'glacia', text: responseText, time: 'Vừa xong' }]);
      triggerReaction('talking');
      speak(responseText, 'talking');
    } catch (err) {
      console.error('Duplex voice failed:', err);
    } finally {
      setIsDuplexTalking(false);
    }
  };

  const handleSimulateTelegram = async (overrideCmd?: string) => {
    const cmd = overrideCmd || simulatedTelegramCommand;
    if (isSimulatingTelegram || !cmd) return;
    setIsSimulatingTelegram(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    setSimulatedChatResponses((prev) => [...prev, `👤 Founder David Bao: ${cmd}`]);
    try {
      const res = await simulateTelegramMobileCommandApi({ text: cmd });
      if (res.sentMessages?.length > 0) {
        setSimulatedChatResponses((prev) => [...prev, ...res.sentMessages.map((m) => `🤖 Glacia: ${m}`)]);
      }
      const updatedState = await fetchTelegramDispatcherStatus();
      setTelegramDispatcherState(updatedState);
      triggerReaction('sparkle');
      glaciaAudio.playCrystalChime(1318.5);
    } catch (err) {
      console.error('Failed to simulate telegram command:', err);
    } finally {
      setIsSimulatingTelegram(false);
    }
  };

  const handleTriggerMorningReport = async () => {
    if (isLoadingMorningReport) return;
    setIsLoadingMorningReport(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const report = await triggerMorningReportApi();
      setMorningReport(report);
      setSimulatedChatResponses((prev) => [...prev, `🌅 [BẢN TIN SÁNG 6:00 AM]\n${report.markdownContent}`]);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia vừa gửi Bản tin Sáng 6:00 AM tóm tắt toàn bộ thành quả ca đêm qua Telegram cho anh rồi ạ!`, 'celebrating');
    } catch (err) {
      console.error('Failed to trigger morning report:', err);
    } finally {
      setIsLoadingMorningReport(false);
    }
  };

  const handleExecuteSwarm = async () => {
    if (isExecutingSwarm) return;
    setIsExecutingSwarm(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const res = await executeSwarmConsensusRunApi({ projectGoal: swarmCustomGoal });
      setSwarmSession(res);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! 5 AI Swarm Agents vừa đạt tỷ lệ đồng thuận ${res.consensusRate.toFixed(1)}% trên Blackboard cho dự án rồi ạ!`, 'celebrating');
    } catch (err) {
      console.error('Failed to execute swarm consensus:', err);
    } finally {
      setIsExecutingSwarm(false);
    }
  };

  const handleBreedGeneration = async () => {
    if (isBreedingGeneration) return;
    setIsBreedingGeneration(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const res = await breedNextGenerationApi();
      setEvolutionarySession(res);
      triggerReaction('sparkle');
      glaciaAudio.playCrystalChime(1567.98);
      speak(`Dạ anh David Bao ơi! Glacia vừa lai ghép thành công thế hệ F${res.currentGeneration} với biến thể vô địch "${res.bestVariantOverall.name}" đạt Fitness ${res.bestVariantOverall.fitnessScore}/100 ạ!`, 'sparkle');
    } catch (err) {
      console.error('Failed to breed generation:', err);
    } finally {
      setIsBreedingGeneration(false);
    }
  };

  const handleAdvanceMilestone = async (milestoneId: string) => {
    if (isAdvancingMilestone) return;
    setIsAdvancingMilestone(true);
    triggerReaction('sparkle');
    glaciaAudio.playCrystalChime(1318.5);
    try {
      const res = await advanceRoadmapMilestoneApi({ milestoneId, progressIncrement: 20 });
      setStrategicRoadmap(res);
      speak('Dạ! Glacia đã cập nhật tiến độ cột mốc chiến lược vũ trụ 90 ngày cho anh rồi ạ!', 'sparkle');
    } catch (err) {
      console.error('Failed to advance milestone:', err);
    } finally {
      setIsAdvancingMilestone(false);
    }
  };

  const handleRunOfflineInference = async () => {
    if (isInferringOffline || !offlinePrompt.trim()) return;
    setIsInferringOffline(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const res = await runOfflineInferenceApi({
        prompt: offlinePrompt,
        taskType: offlineTaskType,
        preferredModel: selectedOfflineModel,
      });
      setOfflineResult(res);
      const updatedState = await fetchOfflineLlmStatus();
      setOfflineEngineState(updatedState);
      triggerReaction('sparkle');
      glaciaAudio.playCrystalChime(1567.98);
      speak(`Dạ anh David Bao ơi! Glacia vừa hoàn tất suy luận On-Device 100% Offline với model ${res.modelUsed} chỉ mất ${res.latencyMs}ms và $0.00 Token Cost ạ!`, 'sparkle');
    } catch (err) {
      console.error('Failed to run offline inference:', err);
    } finally {
      setIsInferringOffline(false);
    }
  };

  const handleSwitchOfflineBackend = async (backend: string) => {
    try {
      const res = await switchOfflineBackendApi(backend);
      setOfflineEngineState(res);
      glaciaAudio.playCrystalChime(1046.5);
      speak(`Dạ! Glacia đã chuyển đổi backend On-Device sang ${backend.toUpperCase()} rồi ạ!`, 'focus');
    } catch (err) {
      console.error('Failed to switch offline backend:', err);
    }
  };

  const handleGenerateProceduralWorld = async () => {
    if (isGeneratingWorld) return;
    setIsGeneratingWorld(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const res = await generateProceduralGameWorldApi({ biome: selectedBiome, seed: worldSeed });
      setProceduralWorld(res);
      setBossFsmLog([`[KHỞI TẠO] Thế giới 3D Seed ${res.seed} (${res.biome}) đã sẵn sàng với 256 ô địa hình và Boss ${res.boss.name}!`]);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia đã sinh xong thế giới 3D Procedural vô tận ${res.biome} với Boss AI ${res.boss.name} rồi ạ!`, 'celebrating');
    } catch (err) {
      console.error('Failed to generate procedural world:', err);
    } finally {
      setIsGeneratingWorld(false);
    }
  };

  const handleBossFsmAction = async (action: 'approach' | 'retreat' | 'attack') => {
    if (!proceduralWorld || isBossTicking) return;
    setIsBossTicking(true);
    glaciaAudio.playQuantumDispatch();
    try {
      let distance = 10;
      let isAttacking = false;
      if (action === 'approach') distance = 5.5;
      if (action === 'retreat') distance = 14.0;
      if (action === 'attack') {
        distance = 3.0;
        isAttacking = true;
      }

      const res = await updateBossFsmTickApi({
        boss: proceduralWorld.boss,
        playerDistance: distance,
        playerIsAttacking: isAttacking,
      });

      setProceduralWorld((prev) => prev ? { ...prev, boss: res.updatedBoss } : null);
      setBossFsmLog((prev) => [res.tickResult.actionMessage, ...prev.slice(0, 19)]);
      glaciaAudio.playCrystalChime(1318.5);
    } catch (err) {
      console.error('Failed to update boss FSM:', err);
    } finally {
      setIsBossTicking(false);
    }
  };

  const handleTriggerAutonomousCycle = async (targetDomain?: 'game' | 'video' | 'software') => {
    if (isTriggeringLoopCycle) return;
    setIsTriggeringLoopCycle(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const res = await triggerAutonomousLoopCycleApi({ targetDomain: targetDomain || selectedLoopDomain });
      const updatedState = await fetchAutonomousLoopStatus();
      setAutonomousLoopState(updatedState);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia vừa hoàn tất chu trình tự trị 8 chặng khép kín cho ${res.projectName} với 96/100 điểm chất lượng và $0.00 chi phí ạ!`, 'celebrating');
    } catch (err) {
      console.error('Failed to trigger autonomous loop cycle:', err);
    } finally {
      setIsTriggeringLoopCycle(false);
    }
  };

  const handleExecuteGiantPipeline = async (domain: ProductionDomain) => {
    if (isExecutingPipeline) return;
    setIsExecutingPipeline(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const res = await executeGiantProductionPipelineApi({ domain });
      setPipelineExecutionResult(res);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia vừa hoàn tất tổng hợp và khởi tạo đường ống siêu công cụ ${domain.toUpperCase()} thành công với chi phí $0.00 ạ!`, 'celebrating');
    } catch (err) {
      console.error('Failed to execute giant pipeline:', err);
    } finally {
      setIsExecutingPipeline(false);
    }
  };

  const handleCopyPipelineArtifact = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPipelineArtifact(true);
    setTimeout(() => setCopiedPipelineArtifact(false), 2000);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleInvokeGiantCapability = async (giantId: TechGiantId, actionName?: string) => {
    if (isInvokingGiant) return;
    setIsInvokingGiant(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const res = await invokeGiantCapabilityApi({ giantId, actionName });
      setInvocationResult(res);
      const updatedGiants = await fetchGiantsEcosystem();
      setGiantsList(updatedGiants);
      const current = updatedGiants.find((g) => g.id === giantId);
      if (current) setSelectedGiant(current);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia vừa triệu hồi sức mạnh ${res.executionDetails.technologyUsed} thành công mà không tốn 1 xu chi phí ạ!`, 'celebrating');
    } catch (err) {
      console.error('Failed to invoke giant capability:', err);
    } finally {
      setIsInvokingGiant(false);
    }
  };

  const handleCopyGiantCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedGiantCode(true);
    setTimeout(() => setCopiedGiantCode(false), 2000);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleGenerateCinemaProduction = async (genre?: any, platform?: any, concept?: string) => {
    if (isGeneratingCinema) return;
    setIsGeneratingCinema(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const newCin = await generateCinemaProductionApi({
        genre,
        targetPlatform: platform,
        customConcept: concept,
      });
      setCinemaProjects((prev) => [newCin, ...prev]);
      setSelectedCinemaProject(newCin);
      setActiveStoryboardSceneIndex(0);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Swarm 5 AI vừa hoàn tất sản xuất bộ kịch bản & phân cảnh Storyboard cho phim: "${newCin.title}" với điểm Virality đạt ${newCin.viralityPredictionScore}% ạ!`, 'celebrating');
    } catch (err) {
      console.error('Failed to generate cinema production:', err);
    } finally {
      setIsGeneratingCinema(false);
    }
  };

  const handleCopyBlenderScript = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlenderScript(true);
    setTimeout(() => setCopiedBlenderScript(false), 2000);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleCopyCinemaFfmpeg = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCinemaFfmpeg(true);
    setTimeout(() => setCopiedCinemaFfmpeg(false), 2000);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleGenerateAudioTrack = async (style: MusicStyle) => {
    if (isGeneratingAudioTrack) return;
    setIsGeneratingAudioTrack(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const newTrack = await generateProceduralAudioTrackApi({ style });
      setAudioTracks((prev) => [newTrack, ...prev]);
      setSelectedAudioTrack(newTrack);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Dạ anh David Bao ơi! Glacia vừa sinh xong bản nhạc WebAudio phong cách ${style.replace('_', ' ')}: "${newTrack.title}" cho game rồi ạ!`, 'celebrating');
    } catch (err) {
      console.error('Failed to generate audio track:', err);
    } finally {
      setIsGeneratingAudioTrack(false);
    }
  };

  const handleRunPlaytestBenchmark = async () => {
    if (isRunningPlaytest) return;
    setIsRunningPlaytest(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const benchmark = await runAiPlaytestBenchmarkApi({
        gameTitle: currentGame?.title || 'Neon Stellar Defender 2026',
      });
      setPlaytestBenchmark(benchmark);
      triggerReaction('sparkle');
      glaciaAudio.playCrystalChime(1567.98);
      speak(`Dạ anh David Bao! AI Playtest đã chạy xong 50 trận mô phỏng với điểm Fun Factor đạt ${benchmark.funFactorScore}/100!`, 'sparkle');
    } catch (err) {
      console.error('Failed to run playtest benchmark:', err);
    } finally {
      setIsRunningPlaytest(false);
    }
  };

  const handleCopyAudioCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedAudioCode(true);
    setTimeout(() => setCopiedAudioCode(false), 2000);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleHarvestMcp = async (sourceType?: any, category?: any, topic?: string) => {
    if (isHarvestingMcp) return;
    setIsHarvestingMcp(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const res = await harvestOpenSourceKnowledgeApi({
        sourceType,
        category,
        customTopic: topic || customMiningTopic || undefined,
      });
      const updatedState = await fetchMcpMiningState();
      setMcpState(updatedState);
      if (res.newSnippets.length > 0) setSelectedMcpSnippet(res.newSnippets[0]);
      setCustomMiningTopic('');
      triggerReaction('sparkle');
      glaciaAudio.playCrystalChime(1567.98);
      speak(`Dạ anh David Bao ơi, em Glacia vừa cào và nạp xong tri thức thực chiến: "${res.distilledSkillLesson}" vào kho tri thức $0 Token rồi ạ!`, 'sparkle');
    } catch (err) {
      console.error('Failed to harvest MCP knowledge:', err);
    } finally {
      setIsHarvestingMcp(false);
    }
  };

  const handleCopyMcpCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedMcpCode(true);
    setTimeout(() => setCopiedMcpCode(false), 2000);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleSendStreamChat = async () => {
    if (!customChatInput.trim() || isTriggeringStreamEvent) return;
    setIsTriggeringStreamEvent(true);
    try {
      const updated = await triggerLiveStreamEventApi({
        eventType: 'viewer_chat',
        sender: 'DavidBao_Founder',
        text: customChatInput,
      });
      setStreamSession(updated);
      setCustomChatInput('');
      glaciaAudio.playCrystalChime(1046.5);
      speak(updated.currentGlaciaSpeech, 'playful');
    } catch (err) {
      console.error('Failed to send stream chat:', err);
    } finally {
      setIsTriggeringStreamEvent(false);
    }
  };

  const handleSendDonation = async (amount: number) => {
    if (isTriggeringStreamEvent) return;
    setIsTriggeringStreamEvent(true);
    triggerReaction('celebrating');
    glaciaAudio.playLevelUpFanfare();
    try {
      const updated = await triggerLiveStreamEventApi({
        eventType: 'donation',
        sender: 'DavidBao_Founder',
        amount,
        text: `Founder David Bao gửi tặng ${amount}$ tiếp thêm năng lượng cho Glacia!`,
      });
      setStreamSession(updated);
      speak(updated.currentGlaciaSpeech, 'celebrating');
    } catch (err) {
      console.error('Failed to send donation:', err);
    } finally {
      setIsTriggeringStreamEvent(false);
    }
  };

  const handleStreamModifier = async (modifier: LiveStreamSession['aiDirectorState']['activeModifier']) => {
    if (isTriggeringStreamEvent) return;
    setIsTriggeringStreamEvent(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const updated = await triggerLiveStreamEventApi({
        eventType: 'director_modifier',
        modifier,
      });
      setStreamSession(updated);
      speak(updated.currentGlaciaSpeech, 'focused');
    } catch (err) {
      console.error('Failed to update director modifier:', err);
    } finally {
      setIsTriggeringStreamEvent(false);
    }
  };

  const handleCaptureHighlight = async () => {
    if (isTriggeringStreamEvent) return;
    setIsTriggeringStreamEvent(true);
    triggerReaction('sparkle');
    glaciaAudio.playCrystalChime(1567.98);
    try {
      const updated = await triggerLiveStreamEventApi({
        eventType: 'capture_highlight',
      });
      setStreamSession(updated);
      speak(updated.currentGlaciaSpeech, 'sparkle');
    } catch (err) {
      console.error('Failed to capture highlight:', err);
    } finally {
      setIsTriggeringStreamEvent(false);
    }
  };

  const handleSynthesizeGoal = async (category?: string) => {
    if (isSynthesizingGoal) return;
    setIsSynthesizingGoal(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const newGoal = await synthesizeAutonomousGoal(category);
      setGoals((prev) => [newGoal, ...prev]);
      triggerReaction('celebrating');
      glaciaAudio.playCrystalChime(1318.5);
      speak(`Dạ anh David Bao ơi! Em Glacia vừa tự quét xu hướng và đề xuất mục tiêu sáng tạo mới: ${newGoal.title}!`, 'celebrating');
    } catch (err) {
      console.error('Failed to synthesize goal:', err);
    } finally {
      setIsSynthesizingGoal(false);
    }
  };

  const handleExecuteGoal = async (goalId: string) => {
    if (executingGoalId) return;
    setExecutingGoalId(goalId);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const updated = await executeAutonomousGoalApi(goalId);
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Glacia Swarm đã thực thi hoàn tất mục tiêu: ${updated.title}!`, 'celebrating');
    } catch (err) {
      console.error('Failed to execute goal:', err);
    } finally {
      setExecutingGoalId(null);
    }
  };

  const handlePackageCurrentGame = async () => {
    if (isPackagingDist || !currentGame) return;
    setIsPackagingDist(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();
    try {
      const pkg = await packageGameForDistribution({
        gameTitle: currentGame.title,
        genre: currentGame.genre,
        gameId: currentGame.id,
      });
      setDistributionPackages((prev) => [pkg, ...prev]);
      triggerReaction('celebrating');
      glaciaAudio.playLevelUpFanfare();
      speak(`Đã đóng gói hoàn tất bộ phân phối đa nền tảng (PWA, Desktop, Press Kit) cho game ${pkg.gameTitle}!`, 'celebrating');
    } catch (err) {
      console.error('Failed to package game:', err);
    } finally {
      setIsPackagingDist(false);
    }
  };

  const handleSelectGamePreset = (preset: any) => {
    setSelectedGenre(preset.genre);
    setGameTitle(preset.title);
    setGameTheme(preset.description);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleGenerateGame = async () => {
    if (isGeneratingGame) return;
    setIsGeneratingGame(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();

    try {
      const res = await generateGameProject({
        genre: selectedGenre,
        title: gameTitle,
        themeDescription: gameTheme,
      });
      setCurrentGame(res);
      triggerReaction('celebrating');
      glaciaAudio.playCrystalChime(1318.5);
      speak(`Dạ anh David Bao ơi, em Glacia đã lập trình xong tựa game ${res.title} rồi ạ! Anh chơi thử ngay trên màn hình nhé!`, 'celebrating');
    } catch (err) {
      console.error('Generate game failed:', err);
      triggerReaction('sad');
    } finally {
      setIsGeneratingGame(false);
    }
  };

  const handleGenerateSoftware = async () => {
    if (isGeneratingGame) return;
    setIsGeneratingGame(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();

    try {
      const res = await generateSoftwareApp({
        appName: 'Glacia Enterprise Cloud Platform',
        appType: 'saas_dashboard',
      });
      setCurrentApp(res);
      triggerReaction('sparkle');
      glaciaAudio.playCrystalChime(1318.5);
      speak(`Dạ em Glacia đã hoàn tất thiết kế kiến trúc và sinh mã nguồn cho ứng dụng ${res.appName} cho anh David Bao rồi ạ!`, 'sparkle');
    } catch (err) {
      console.error('Generate software failed:', err);
    } finally {
      setIsGeneratingGame(false);
    }
  };

  const handleDownloadGameHtml = () => {
    if (!currentGame) return;
    const blob = new Blob([currentGame.standaloneHtmlBundle], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentGame.title.toLowerCase().replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    glaciaAudio.playCrystalChime(1567.98);
  };

  const handleCopyCode = () => {
    if (!currentGame) return;
    navigator.clipboard.writeText(currentGame.standaloneHtmlBundle);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleGenerateVideo = async () => {
    if (isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();

    try {
      const res = await generateAiVideoProject({
        topic: videoTopic,
        aspectRatio,
        targetAudience: 'tech_founders',
      });
      setCurrentVideo(res);
      setActiveSceneIndex(0);
      triggerReaction('celebrating');
      glaciaAudio.playCrystalChime(1318.5);
      speak(`Dạ anh David Bao ơi, xưởng video Glacia đã sản xuất xong kịch bản 5 phân cảnh chuẩn viral cho chủ đề ${res.topic} rồi ạ!`, 'celebrating');
    } catch (err) {
      console.error('Generate video failed:', err);
      triggerReaction('sad');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handlePlaySceneAudio = (scene: any) => {
    speak(scene.scriptVoiceover, 'talking');
  };

  const handleCopyFfmpegScript = () => {
    if (!currentVideo) return;
    navigator.clipboard.writeText(currentVideo.ffmpegScript.powershellScript);
    setCopiedFfmpeg(true);
    setTimeout(() => setCopiedFfmpeg(false), 2000);
    glaciaAudio.playCrystalChime(1046.5);
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Navigation Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Xưởng Sáng Tạo Tự Trị (Game, Code & Video AI)
              </h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                $0 Cloud Cost
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Glacia tự động lập trình Game 60FPS chơi được ngay, xây dựng phần mềm Fullstack và sản xuất Video AI 5 phân cảnh
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setStudioMode('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'game'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>🎮 Lập Trình Game & App</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'video'
                ? 'bg-indigo-500 text-white font-black shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>🎬 Xưởng Sản Xuất Video AI</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('singularity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'singularity'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🔮 Level 5 Singularity (Tự Sinh Mục Tiêu)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('stream')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'stream'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>📺 Live Stream & AI Director</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('mcp_mining')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'mcp_mining'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>🌐 MCP & Tri Thức Mở ($0 Mining)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('audio_lab')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'audio_lab'
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-violet-300'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>🎵 WebAudio Synth & Playtest</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('cinema')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'cinema'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>🎬 Swarm Cinema (5-AI Studio)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('giants')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'giants'
                ? 'bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600 text-white font-black shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>🏛️ Liên Minh Người Khổng Lồ</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('infinite_loop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'infinite_loop'
                ? 'bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-300'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 animate-spin text-amber-300" />
            <span>♾️ Chu Trình Tự Trị Bất Tử (Master Singularity)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('telegram_dispatcher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'telegram_dispatcher'
                ? 'bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 text-slate-950 font-black shadow-lg shadow-sky-500/30 ring-1 ring-sky-300'
                : 'text-sky-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Điều Khiển Telegram Di Động (Ca Đêm 24/7)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('swarm_blackboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'swarm_blackboard'
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-slate-950 font-black shadow-lg shadow-orange-500/30 ring-1 ring-amber-300'
                : 'text-amber-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>🐝 Swarm Blackboard (Level 4 Standard)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('evolutionary_genetic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'evolutionary_genetic'
                ? 'bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-600 text-slate-950 font-black shadow-lg shadow-pink-500/30 ring-1 ring-pink-300'
                : 'text-pink-300 hover:text-white'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>🧬 Tiến Hóa Di Truyền F1/F2 (Level 5)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('strategic_roadmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'strategic_roadmap'
                ? 'bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-300'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🗺️ Chiến Lược Franchise 90 Ngày</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('offline_engine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'offline_engine'
                ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-1 ring-amber-300'
                : 'text-amber-300 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ AI Offline 100% ($0 Token)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('procedural_arena')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'procedural_arena'
                ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 font-black shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-300'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🏰 Bản Đồ 3D & Boss AI Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('character_lab')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'character_lab'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-black shadow-lg shadow-pink-500/30 ring-1 ring-pink-300'
                : 'text-pink-300 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>🎭 3D Avatar & Nhân Vật AI</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('cinema_synthesizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'cinema_synthesizer'
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 text-white font-black shadow-lg shadow-rose-500/30 ring-1 ring-amber-300'
                : 'text-amber-300 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 Phim AI 1-Click (Cinema)</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('duplex_voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              studioMode === 'duplex_voice'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-300'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>🎙️ Đàm Thoại Giọng Nói (Duplex)</span>
          </button>
        </div>
      </div>

      {/* ── MODE 1: GAME & SOFTWARE STUDIO ── */}
      {studioMode === 'game' && (
        <div className="space-y-6">
          {/* Game Presets Row */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Chọn Thể Loại Game Sẵn Có:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {gamePresets.map((p) => (
                <button
                  key={p.genre}
                  type="button"
                  onClick={() => handleSelectGamePreset(p)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedGenre === p.genre
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white truncate">{p.title}</h4>
                    <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                placeholder="Tên tựa game muốn tạo..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                value={gameTheme}
                onChange={(e) => setGameTheme(e.target.value)}
                placeholder="Mô tả bối cảnh và lối chơi..."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateGame}
                disabled={isGeneratingGame}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingGame ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGeneratingGame ? 'Glacia đang lập trình...' : 'Lập Trình Game Nhanh'}</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateSoftware}
                disabled={isGeneratingGame}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sinh App SaaS</span>
              </button>
            </div>
          </div>

          {/* Live Playable Sandbox Canvas Iframe */}
          {currentGame && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Khung Trải Nghiệm Chơi Game Trực Tiếp (Live 60FPS Sandbox)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    60 FPS
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSourceCode(!showSourceCode)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{showSourceCode ? 'Ẩn Code' : 'Xem Mã Nguồn'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Đã Sao Chép' : 'Sao Chép HTML'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadGameHtml}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải File .HTML Chơi Offline</span>
                  </button>
                </div>
              </div>

              {/* Sandboxed Game Iframe */}
              <div className="rounded-2xl border-2 border-cyan-500/40 overflow-hidden shadow-2xl shadow-cyan-500/10 bg-slate-950 h-[490px] relative">
                <iframe
                  title="Glacia Playable Game Sandbox"
                  srcDoc={currentGame.standaloneHtmlBundle}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* Controls guide */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span><strong>Điều khiển PC:</strong> {currentGame.controls.pc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span><strong>Mobile:</strong> {currentGame.controls.mobile}</span>
                </div>
              </div>

              {/* Source Code Viewer Toggle */}
              {showSourceCode && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                      <FileCode className="w-4 h-4" /> Mã Nguồn Hoàn Chỉnh (Single-File HTML5 + WebAudio SFX)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ~{currentGame.stats.estimatedLinesOfCode} lines • {currentGame.stats.audioSfxCount} WebAudio SFX
                    </span>
                  </div>
                  <pre className="max-h-60 overflow-y-auto p-3 rounded-xl bg-slate-900/80 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {currentGame.standaloneHtmlBundle}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Software Blueprint Display if Generated */}
          {currentApp && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-900 border border-indigo-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-black text-xs uppercase">
                  <Cpu className="w-4 h-4" />
                  <span>Kiến Trúc Phần Mềm: {currentApp.appName}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  {currentApp.appType}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{currentApp.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentApp.techStack.map((tech, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: AI VIDEO PRODUCTION STUDIO ── */}
      {studioMode === 'video' && (
        <div className="space-y-6">
          {/* Preset Topics */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Chọn Chủ Đề Video Mẫu:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {videoPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setVideoTopic(p.topic);
                    setAspectRatio(p.aspectRatio);
                    glaciaAudio.playCrystalChime(1046.5);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    videoTopic === p.topic
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white truncate">{p.topic}</h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {p.aspectRatio}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Creation Form */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={videoTopic}
                onChange={(e) => setVideoTopic(e.target.value)}
                placeholder="Nhập chủ đề video AI cần sản xuất..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-400"
              />
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">Tỷ lệ khung hình:</span>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                    aspectRatio === '9:16' ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  📱 9:16 (TikTok / Reels / Shorts)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                    aspectRatio === '16:9' ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  🖥️ 16:9 (YouTube Landscape)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingVideo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              <span>{isGeneratingVideo ? 'Đang sản xuất video...' : 'Sản Xuất Video AI Ngay'}</span>
            </button>
          </div>

          {/* Video Project Storyboard */}
          {currentVideo && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-indigo-400" />
                    Kịch Bản 5 Phân Cảnh Chuẩn Viral ({currentVideo.targetDurationSec} Giây)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                    {currentVideo.aspectRatio}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyFfmpegScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    {copiedFfmpeg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFfmpeg ? 'Đã Sao Chép Script' : 'Sao Chép FFmpeg $0 Script'}</span>
                  </button>
                </div>
              </div>

              {/* Scene Timeline Steps */}
              <div className="grid grid-cols-5 gap-2">
                {currentVideo.scenes.map((scene, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSceneIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeSceneIndex === idx
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20'
                        : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-indigo-300">Cảnh {scene.sceneIndex}</span>
                      <span className="font-mono text-slate-500">{scene.durationSec}s</span>
                    </div>
                    <div className="text-[11px] font-black text-white mt-1 truncate">{scene.stageName}</div>
                  </button>
                ))}
              </div>

              {/* Active Scene Detail Card */}
              {currentVideo.scenes[activeSceneIndex] && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-400 uppercase">
                        Cảnh {currentVideo.scenes[activeSceneIndex].sceneIndex}: {currentVideo.scenes[activeSceneIndex].stageName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({currentVideo.scenes[activeSceneIndex].timecodeRange})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlaySceneAudio(currentVideo.scenes[activeSceneIndex])}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe Thử Giọng Lồng Tiếng</span>
                    </button>
                  </div>

                  {/* Caption & Voiceover */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">🎙️ Lời Thoại Lồng Tiếng (Voiceover):</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        "{currentVideo.scenes[activeSceneIndex].scriptVoiceover}"
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">💬 Phụ Đề Nổi Trên Màn Hình (Captions):</span>
                      <p className="text-xs text-cyan-300 font-black">
                        {currentVideo.scenes[activeSceneIndex].onScreenCaption}
                      </p>
                    </div>
                  </div>

                  {/* Visual B-Roll and AI Prompt */}
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">🎬 Mô Tả Hình Ảnh B-Roll:</span>
                    <p className="text-[11px] text-slate-300">{currentVideo.scenes[activeSceneIndex].brollVisualDescription}</p>
                    <div className="pt-1 text-[10px] text-slate-400 font-mono">
                      <strong>AI Prompt:</strong> {currentVideo.scenes[activeSceneIndex].aiVideoGenPrompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODE 3: LEVEL 5 CREATIVE SINGULARITY & AUTONOMOUS GOAL SWARM ── */}
      {studioMode === 'singularity' && (
        <div className="space-y-6">
          {/* Hero Singularity Banner */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl shadow-amber-500/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sparkles className="w-32 h-32 text-amber-400" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
                    LEVEL 5 FULL GENERAL AUTONOMY (CREATIVE SINGULARITY)
                  </span>
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Tự Sinh Mục Tiêu Sáng Tạo & Điều Phối 5 AI Satellites 24/7</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Robot Glacia tự quét xu hướng Internet (Steam, TikTok, YouTube Shorts), tự nghĩ ra các tựa game và tập phim AI mới, tự phân rã công việc cho 5 AI chuyên gia và tự thực thi không cần Founder David Bao phải giao việc.
                </p>
              </div>

              {/* Quick Synthesis Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSynthesizeGoal('game')}
                  disabled={isSynthesizingGoal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>+ Tự Sinh Game Mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSynthesizeGoal('film')}
                  disabled={isSynthesizingGoal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-rose-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>+ Tự Sinh Phim AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSynthesizeGoal('3d_character')}
                  disabled={isSynthesizingGoal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>+ Dàn Cast 3D</span>
                </button>
              </div>
            </div>

            {/* Swarm Status Bar */}
            <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block">👾 NeoDev</span>
                <span className="text-slate-400">Game & Physics</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-purple-400 font-bold block">🎬 NovaDirector</span>
                <span className="text-slate-400">Phim & Storyboard</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-amber-400 font-bold block">🎭 AeroBlender</span>
                <span className="text-slate-400">3D Character Rig</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-emerald-400 font-bold block">🎧 VortexVFX</span>
                <span className="text-slate-400">Sound & FFmpeg</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-rose-400 font-bold block">🛡️ AegisSentinel</span>
                <span className="text-slate-400">Self-Healing QA</span>
              </div>
            </div>
          </div>

          {/* Singularity Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSingularitySubTab('goals')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSingularitySubTab === 'goals'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Mục Tiêu Tự Sinh ({goals.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSingularitySubTab('cast')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSingularitySubTab === 'cast'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Dàn Cast Ảo 3D ({virtualCast.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSingularitySubTab('distribution')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSingularitySubTab === 'distribution'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Trung Tâm Phân Phối ({distributionPackages.length})</span>
            </button>
          </div>

          {/* Sub-View 1: Autonomous Goals Feed */}
          {activeSingularitySubTab === 'goals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Danh Sách Dự Án Tự Sinh & Đang Triển Khai ({goals.length})</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Cập nhật theo chu kỳ Ca Ngày & Ca Đêm 24/7
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase font-mono ${
                          goal.category === 'game' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' :
                          goal.category === 'film' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                          goal.category === '3d_character' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                          'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {goal.category}
                        </span>
                        <h5 className="text-sm font-black text-white">{goal.title}</h5>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
                          goal.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                          goal.status === 'in_progress' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {goal.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {goal.status === 'in_progress' && <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />}
                          {goal.status === 'proposed' && <Clock className="w-3 h-3 text-slate-400" />}
                          <span className="uppercase font-mono">{goal.status}</span>
                        </span>

                        {goal.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleExecuteGoal(goal.id)}
                            disabled={executingGoalId === goal.id}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>{executingGoalId === goal.id ? 'Đang Thực Thi...' : 'Kích Hoạt Swarm'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{goal.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <strong className="text-amber-400">💡 Cơ sở xu hướng (Trend):</strong>{' '}
                        <span className="text-slate-300">{goal.trendRationale}</span>
                      </div>
                      <div>
                        <strong className="text-cyan-400">🎯 Khán giả mục tiêu:</strong>{' '}
                        <span className="text-slate-300">{goal.targetAudience}</span>
                      </div>
                    </div>

                    {/* Swarm Tasks Breakdown */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Phân Công Nhiệm Vụ 5 AI Satellites:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {goal.swarmAssignments.map((task, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[10px] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200">{task.agentName}</span>
                              <span className={`text-[9px] px-1 rounded ${
                                task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                                task.status === 'working' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-slate-800 text-slate-500'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            <p className="text-slate-400 line-clamp-2">{task.taskTitle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-View 2: Virtual 3D Cast Lab */}
          {activeSingularitySubTab === 'cast' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cast List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>Dàn Diễn Viên & Boss 3D Tự Trị ({virtualCast.length})</span>
                </h4>

                <div className="space-y-2">
                  {virtualCast.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedCast(member)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedCast?.id === member.id
                          ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-white">{member.name}</h5>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono">
                          {member.archetype}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{member.roleTitle}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cast Member Inspector */}
              <div className="lg:col-span-2 space-y-4">
                {selectedCast ? (
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
                          3D VIRTUAL BEING RIG SPECS
                        </span>
                        <h4 className="text-base font-black text-white">{selectedCast.name}</h4>
                        <p className="text-xs text-slate-400">{selectedCast.roleTitle}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shadow-md"
                          style={{ backgroundColor: selectedCast.visualSpecs.primaryColorHex }}
                        />
                        <span className="text-xs font-mono text-slate-300 font-bold">
                          {selectedCast.visualSpecs.heightMeters}m · {selectedCast.visualSpecs.rigBonesCount} Bones
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      {selectedCast.loreBackstory}
                    </p>

                    {/* Animation Clips */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Danh Sách Animation Clips (Nướng Khung Xương):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCast.animationClips.map((clip, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono text-cyan-300 font-bold"
                          >
                            🎬 {clip}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Blender Python Script Preview */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Kịch Bản Blender bpy Tự Động Sinh Mesh & Shader PBR:
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-40 scrollbar-thin">
                        <code>{selectedCast.blenderScriptSnippet}</code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    Chọn một diễn viên ảo để xem thông số 3D rig và kịch bản Blender.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-View 3: Autonomous Distribution Hub */}
          {activeSingularitySubTab === 'distribution' && (
            <div className="space-y-6">
              {/* Packaging Action Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Đóng Gói Đa Nền Tảng & Xuất Bản 1-Click (PWA, Desktop, Press Kit)</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    Tự động tạo tệp PWA Manifest, Electron Portable Launcher, Thông tin itch.io/Steam và Chiến dịch truyền thông TikTok/Shorts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePackageCurrentGame}
                  disabled={isPackagingDist || !currentGame}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isPackagingDist ? 'Đang Đóng Gói...' : 'Đóng Gói Game Hiện Tại'}</span>
                </button>
              </div>

              {/* Distribution Packages List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Gói Phân Phối Đã Biên Dịch Sẵn ({distributionPackages.length})</span>
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  {distributionPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {pkg.version}
                          </span>
                          <h5 className="text-sm font-black text-white">{pkg.gameTitle}</h5>
                          <span className="text-[11px] text-slate-400">({pkg.genre})</span>
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(pkg.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">{pkg.pressKit.elevatorPitch}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        {/* Features */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                          <strong className="text-cyan-400 block font-bold">✨ Điểm Nhấn Độc Đáo (Press Kit):</strong>
                          <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                            {pkg.pressKit.keyFeatures.map((feat, idx) => (
                              <li key={idx}>{feat}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Viral Hooks */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                          <strong className="text-amber-400 block font-bold">🔥 Tiêu Đề Lan Truyền (TikTok / Shorts):</strong>
                          <ul className="text-slate-300 space-y-1">
                            {pkg.pressKit.viralSocialHooks.map((hook, idx) => (
                              <li key={idx} className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 font-mono text-[10px]">
                                {hook}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Storefront Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400">Tags itch.io / Steam:</span>
                        {pkg.storefrontMetadata.itchIoTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 4: LEVEL 5 LIVE STREAM & AI GAME DIRECTOR ── */}
      {studioMode === 'stream' && (
        <div className="space-y-6">
          {/* Live Stream Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-purple-950/40 border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● ON AIR · 60FPS BROADCAST
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  {streamSession?.channelName || 'Glacia Quantum Studio Live'}
                </span>
              </div>
              <h3 className="text-base font-black text-white">{streamSession?.streamTitle}</h3>
              <p className="text-xs text-slate-300">
                Glacia tự động điều phối buổi phát sóng, tương tác với bình luận người xem, nhận donate và tự thay đổi độ khó màn chơi theo thời gian thực!
              </p>
            </div>

            {/* Stream Telemetry Stats */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 font-black text-sm">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{streamSession?.currentViewerCount.toLocaleString()}</span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase font-mono">Đang Xem</span>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-400 font-black text-sm">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>${streamSession?.totalDonationsUsd.toFixed(2)}</span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase font-mono">Doanh Thu Donate</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Virtual Stage & AI Director HUD (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Virtual Stage Viewport */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl p-6 min-h-[260px] flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">Tựa Game Đang Trực Tiếp:</span>
                    <span className="text-xs font-black text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                      🎮 {streamSession?.activeGameTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Trạng Thái: {streamSession?.currentEmotion.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Glacia Live Avatar & Speech Bubble */}
                <div className="my-6 flex items-start gap-4 p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 backdrop-blur">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/20 shrink-0">
                    🧊
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                      Glacia AI Streamer Voice TTS:
                    </span>
                    <p className="text-xs text-white font-medium leading-relaxed">
                      "{streamSession?.currentGlaciaSpeech}"
                    </p>
                  </div>
                </div>

                {/* Director Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                    AI Director Cường Độ: {streamSession?.aiDirectorState.intensityLevel}/10
                  </span>

                  <button
                    type="button"
                    onClick={handleCaptureHighlight}
                    disabled={isTriggeringStreamEvent}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-xs shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Trích Xuất Clip TikTok (15s)</span>
                  </button>
                </div>
              </div>

              {/* AI Game Director Modifier Controls */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Bảng Điều Khiển AI Director (Thay Đổi Môi Trường Game Real-Time)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Tự thích ứng theo nhịp độ stream</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: 'normal', label: 'Bình Thường', icon: '⚡' },
                    { key: 'plasma_frenzy', label: 'Bão Plasma', icon: '🔥' },
                    { key: 'gravity_well', label: 'Hố Trọng Lực', icon: '🌀' },
                    { key: 'boss_invasion', label: 'Boss Đột Kích', icon: '👾' },
                    { key: 'hyper_speed', label: 'Siêu Tốc Độ', icon: '🚀' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleStreamModifier(item.key as any)}
                      disabled={isTriggeringStreamEvent}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-50 ${
                        streamSession?.aiDirectorState.activeModifier === item.key
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base block mb-0.5">{item.icon}</span>
                      <span className="text-[10px] font-bold block">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Highlight Clips List */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    🎬 Video Highlights & Công Thức Clip TikTok ({streamSession?.highlights.length || 0}):
                  </h5>

                  <div className="space-y-2">
                    {streamSession?.highlights.map((clip) => (
                      <div
                        key={clip.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white">{clip.title}</span>
                          <span className="text-[10px] font-mono text-purple-400 font-bold">
                            {clip.durationSeconds}s · #{clip.triggerEvent}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-300 font-mono">{clip.tiktokHook}</p>
                        <p className="text-[10px] text-slate-400 font-mono bg-slate-900 p-1.5 rounded border border-slate-800 overflow-x-auto">
                          {clip.ffmpegClipCommand}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Chat & Donation Stream */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-4 h-[650px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Luồng Bình Luận Trực Tiếp ({streamSession?.recentChat.length || 0})</span>
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                    LIVE
                  </span>
                </div>

                {/* Chat Feed */}
                <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin">
                  {streamSession?.recentChat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                        msg.isDonation
                          ? 'bg-rose-950/40 border-rose-500/40 shadow-sm shadow-rose-500/10'
                          : 'bg-slate-950/60 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: msg.avatarColor }}
                          />
                          <span className="font-bold text-slate-200 text-[11px]">{msg.sender}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                      </div>

                      {msg.isDonation && (
                        <div className="inline-block px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-black font-mono text-[10px] mb-1">
                          🎁 DONATE ${msg.donationAmount?.toFixed(2)}
                        </div>
                      )}

                      <p className="text-slate-300 text-[11px]">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat & Donation Controls */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                {/* Donation Quick Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Donate:</span>
                  {[5, 10, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSendDonation(amt)}
                      disabled={isTriggeringStreamEvent}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-black text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
                    >
                      +${amt}
                    </button>
                  ))}
                </div>

                {/* Custom Chat Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendStreamChat();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={customChatInput}
                    onChange={(e) => setCustomChatInput(e.target.value)}
                    placeholder="Nhập tin nhắn bình luận giao lưu với Glacia..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={!customChatInput.trim() || isTriggeringStreamEvent}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 5: LEVEL 5 OPEN-SOURCE & FORUM MCP MINING HUB ── */}
      {studioMode === 'mcp_mining' && (
        <div className="space-y-6">
          {/* MCP Mining Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● MCP FEDERATION HARVESTER · LEVEL 5
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  {mcpState?.sources?.length || 6} Nguồn Mở & Diễn Đàn Thực Chiến Đang Kết Nối
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Trung Tâm Khai Thác MCP & Tri Thức Thực Chiến Nguồn Mở ($0 Cloud Cost)
              </h3>
              <p className="text-xs text-slate-300">
                Glacia tự động kết nối MCP tới GitHub Repos, Reddit r/gamedev, Blender Artists, Shadertoy và StackOverflow để cào code mẫu, tối ưu AST và đúc kết thành bài học thực tế cho bạn!
              </p>
            </div>

            {/* MCP Stats */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-400 font-black text-sm font-mono">
                  <Database className="w-3.5 h-3.5" />
                  <span>{mcpState?.totalSnippetsCount || 0}</span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase font-mono">Code Mẫu Đã Nạp</span>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 font-black text-sm font-mono">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>${mcpState?.zeroCostTokenSavingsUsd.toFixed(2)}</span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase font-mono">Tiết Kiệm Token $0</span>
              </div>
            </div>
          </div>

          {/* Quick Instant Mining Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Kích Hoạt Cào Tri Thức Tức Thì 1-Click (Instant MCP Mining):</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Tự động bóc tách AST & nạp Vector RAG</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleHarvestMcp('github_repos', 'game_engine', 'Mã nguồn game Three.js 60FPS và hệ thống va chạm không gian')}
                disabled={isHarvestingMcp}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-xs font-black text-white block">🐙 GitHub Trending Repos</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Cào game Three.js & vật lý Canvas</span>
              </button>

              <button
                type="button"
                onClick={() => handleHarvestMcp('reddit_community', 'forum_practical_tips', 'Kinh nghiệm tối ưu bộ nhớ AudioContext và cảm ứng đa điểm mobile')}
                disabled={isHarvestingMcp}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-xs font-black text-white block">💬 Reddit r/gamedev Forum</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Hút mẹo thực chiến & tối ưu 60FPS</span>
              </button>

              <button
                type="button"
                onClick={() => handleHarvestMcp('blender_artists_forum', 'blender_3d', 'Kịch bản Python bpy tự động tạo Armature và nướng hoạt ảnh')}
                disabled={isHarvestingMcp}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-xs font-black text-white block">🧊 Blender Artists Community</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Cào script Python bpy auto-rigging</span>
              </button>

              <button
                type="button"
                onClick={() => handleHarvestMcp('shadertoy_glsl', 'webgl_shaders', 'Shader bão plasma và hiệu ứng sấm sét hạt lượng tử')}
                disabled={isHarvestingMcp}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-xs font-black text-white block">⚡ Shadertoy & WebGL Hub</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Cào hiệu ứng shader plasma GLSL</span>
              </button>
            </div>

            {/* Custom Topic Miner Input */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={customMiningTopic}
                onChange={(e) => setCustomMiningTopic(e.target.value)}
                placeholder="Nhập chủ đề kỹ thuật / thư viện mở bạn muốn Glacia cào và nạp vào não ngay..."
                className="flex-1 w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleHarvestMcp(undefined, undefined, customMiningTopic)}
                disabled={!customMiningTopic.trim() || isHarvestingMcp}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isHarvestingMcp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isHarvestingMcp ? 'Đang Cào Dữ Liệu...' : '🚀 Cào & Nạp Vào Não $0'}</span>
              </button>
            </div>
          </div>

          {/* Harvested Knowledge Explorer & Code Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Snippets List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Kho Code & Bài Học Đã Thu Nhận ({mcpState?.recentSnippets?.length || 0}):</span>
                <span className="text-[10px] text-slate-500 font-mono">Đã xác thực AST 100%</span>
              </h4>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {mcpState?.recentSnippets?.map((snip) => (
                  <button
                    key={snip.id}
                    type="button"
                    onClick={() => setSelectedMcpSnippet(snip)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedMcpSnippet?.id === snip.id
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700 uppercase font-bold">
                        {snip.sourceType.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(snip.harvestedAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>

                    <h5 className="text-xs font-black text-white line-clamp-1">{snip.title}</h5>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{snip.summary}</p>

                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {snip.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Inspector & Forum Practical Tips (7 cols) */}
            <div className="lg:col-span-7">
              {selectedMcpSnippet ? (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-black uppercase">
                          {selectedMcpSnippet.performanceRating}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Môi trường: {selectedMcpSnippet.executionEnvironment}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white">{selectedMcpSnippet.title}</h4>
                      <span className="text-[10px] text-cyan-400 font-mono truncate block">
                        🔗 Nguồn: {selectedMcpSnippet.sourceUrlOrAuthor}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyMcpCode(selectedMcpSnippet.codeSnippet)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      {copiedMcpCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMcpCode ? 'Đã Copy' : 'Copy Code'}</span>
                    </button>
                  </div>

                  {/* Practical Forum Tips */}
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Kinh Nghiệm Thực Chiến Đúc Kết Từ Diễn Đàn:</span>
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {selectedMcpSnippet.practicalTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Code Snippet Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                        Mã Nguồn Mẫu Đã Tối Ưu AST ($0 Execution):
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">● Vector Indexed</span>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono overflow-x-auto max-h-[260px] leading-relaxed select-all">
                      <code>{selectedMcpSnippet.codeSnippet}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-500">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Chọn một bài học mã nguồn mẫu bên trái để kiểm tra chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 6: LEVEL 5 PROCEDURAL AUDIO SYNTH & AI PLAYTEST BENCHMARK ── */}
      {studioMode === 'audio_lab' && (
        <div className="space-y-6">
          {/* Audio Lab Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-fuchsia-950/40 border border-violet-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-violet-500 animate-ping" />
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● PROCEDURAL WEBAUDIO & AI PLAYTEST
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  $0 Cloud Assets · 0 Latency Sound Generation
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Xưởng Tạo Nhạc Game WebAudio & Trạm Chấm Điểm AI Playtest Tự Động
              </h3>
              <p className="text-xs text-slate-300">
                Glacia tự động tạo nhạc nền Cyberpunk, Chiptune 8-Bit và bộ hiệu ứng âm thanh Laser/Nổ qua WebAudio thuần, đồng thời chạy 50 trận giả lập Playtest để chấm điểm độ lôi cuốn (Fun Factor) cho game của bạn!
              </p>
            </div>

            {/* Benchmark Trigger Button */}
            <button
              type="button"
              onClick={handleRunPlaytestBenchmark}
              disabled={isRunningPlaytest}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-black text-xs shadow-lg shadow-violet-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {isRunningPlaytest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              <span>{isRunningPlaytest ? 'Đang Mô Phỏng 50 Trận...' : '🚀 Chạy AI Playtest Benchmark'}</span>
            </button>
          </div>

          {/* AI Playtest Benchmark Dashboard (if benchmark exists) */}
          {playtestBenchmark && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-violet-500/30 space-y-4 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Kết Quả AI Playtest Benchmark: {playtestBenchmark.gameTitle}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(playtestBenchmark.testedAt).toLocaleTimeString('vi-VN')}
                </span>
              </div>

              {/* Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {playtestBenchmark.funFactorScore}/100
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Điểm Fun Factor</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-xl font-black text-cyan-400 font-mono">
                    {playtestBenchmark.averageFpsBenchmark} FPS
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Hiệu Suất Thực Tế</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-xl font-black text-purple-400 font-mono">
                    {playtestBenchmark.retentionPredictionPercentage}%
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Dự Đoán Giữ Chân</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-sm font-black text-amber-400 font-mono uppercase">
                    {playtestBenchmark.adrenalineCurveRating}
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Nhịp Độ Căng Thẳng</span>
                </div>
              </div>

              {/* Recommended Fixes & Evolution Log */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-black text-violet-300 uppercase tracking-wider block">
                  💡 Đề Xuất Cân Bằng Tự Động Từ AI Playtest:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {playtestBenchmark.aiPlaytestMetrics.recommendedFixes.map((fix, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-cyan-400 font-mono pt-1">
                  ⚡ Hành Động Tiến Hóa: {playtestBenchmark.geneticEvolutionAction}
                </p>
              </div>
            </div>
          )}

          {/* Procedural Music Synthesizer Presets */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Sinh Bản Nhạc WebAudio Procedural Mới ($0 Asset):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {[
                { style: 'cyberpunk_synthwave', label: 'Cyberpunk Synth', bpm: '130 BPM', icon: '⚡' },
                { style: 'chiptune_retro', label: 'Retro 8-Bit Arcade', bpm: '140 BPM', icon: '👾' },
                { style: 'boss_battle_metal', label: 'Boss Battle Metal', bpm: '150 BPM', icon: '⚔️' },
                { style: 'crystal_chill', label: 'Quantum Crystal Chill', bpm: '110 BPM', icon: '🌌' },
                { style: 'dark_ambient', label: 'Dark Ambient Mystery', bpm: '90 BPM', icon: '🌑' },
              ].map((item) => (
                <button
                  key={item.style}
                  type="button"
                  onClick={() => handleGenerateAudioTrack(item.style as any)}
                  disabled={isGeneratingAudioTrack}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-violet-950/30 border border-slate-800 hover:border-violet-500/50 text-left transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[9px] font-mono text-violet-400 font-bold">{item.bpm}</span>
                  </div>
                  <h5 className="text-xs font-black text-white mt-1">{item.label}</h5>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Tracks & Sound FX Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tracks List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Danh Sách Bản Nhạc Đã Tạo ({audioTracks.length}):
              </h4>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {audioTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setSelectedAudioTrack(track)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedAudioTrack?.id === track.id
                        ? 'bg-violet-950/40 border-violet-500/60 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/50'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-violet-300 border border-slate-700 uppercase font-bold">
                        {track.style.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{track.tempoBpm} BPM</span>
                    </div>

                    <h5 className="text-xs font-black text-white line-clamp-1">{track.title}</h5>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">Tone: {track.keyRoot}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Track Details & Sound FX Pack (7 cols) */}
            <div className="lg:col-span-7">
              {selectedAudioTrack ? (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{selectedAudioTrack.title}</h4>
                      <span className="text-[10px] text-violet-400 font-mono">
                        {selectedAudioTrack.style.toUpperCase()} · {selectedAudioTrack.tempoBpm} BPM · Key: {selectedAudioTrack.keyRoot}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyAudioCode(selectedAudioTrack.generatedCodeSnippet)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      {copiedAudioCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAudioCode ? 'Đã Copy' : 'Copy Audio Engine'}</span>
                    </button>
                  </div>

                  {/* Sound FX Triggers Grid */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
                      🔊 Bộ Kích Hoạt Âm Thanh Tự Động (Procedural Sound FX Pack):
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(selectedAudioTrack.sfxTriggers).map(([k, v]) => (
                        <div key={k} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-violet-300 uppercase font-mono block">
                            #{k.replace('_', ' ')}:
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate block mt-0.5">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WebAudio Code Generator Snippet */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      Mã Nguồn WebAudio Engine Thuần ($0 Asset):
                    </span>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono overflow-x-auto max-h-[220px] leading-relaxed select-all">
                      <code>{selectedAudioTrack.generatedCodeSnippet}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-500">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Chọn một bản nhạc bên trái để kiểm tra chi tiết bộ âm thanh</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 7: LEVEL 5 MULTI-AGENT SWARM CINEMA & STORYBOARD STUDIO ── */}
      {studioMode === 'cinema' && (
        <div className="space-y-6">
          {/* Swarm Cinema Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● 5-AI SWARM CINEMA STUDIO
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  Screenplay · Art Direction · AI Dubbing · 3D Raytracing
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Xưởng Điện Ảnh Tự Trị Đa Tác Tử: Sản Xuất Phim AI & Phân Cảnh Storyboard
              </h3>
              <p className="text-xs text-slate-300">
                5 AI Satellites phối hợp đồng thời: Biên kịch 3 Hồi, Thiết kế góc máy Camera Dolly Zoom, Phối màu nghệ thuật, Đồng bộ khẩu hình Viseme và Lập trình kỹ xảo FFmpeg/Blender!
              </p>
            </div>

            {/* Virality Score Gauge & Generate Presets */}
            {selectedCinemaProject && (
              <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30 shrink-0">
                <div className="text-center pr-3 border-r border-slate-800">
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {selectedCinemaProject.viralityPredictionScore}%
                  </span>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Dự Đoán Viral</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-300 uppercase block font-mono">
                    {selectedCinemaProject.aspectRatio} · {selectedCinemaProject.totalDurationSeconds}s
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {selectedCinemaProject.storyboardScenes.length} Phân Cảnh Master
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Swarm Quick Production Presets */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Khởi Tạo Sản Xuất Phim AI Nhanh Bằng Swarm 5 Tác Tử:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { genre: 'sci_fi_cyberpunk', label: 'Cyberpunk Awakening 2026', platform: 'tiktok_shorts', icon: '⚡' },
                { genre: 'fantasy_adventure', label: 'Huyền Thoại Kiếm Vương & Tinh Thể', platform: 'tiktok_shorts', icon: '🐉' },
                { genre: 'tech_documentary', label: 'Kỷ Nguyên AI Singularity Level 5', platform: 'youtube_cinematic', icon: '🎬' },
              ].map((item) => (
                <button
                  key={item.genre}
                  type="button"
                  onClick={() => handleGenerateCinemaProduction(item.genre as any, item.platform as any)}
                  disabled={isGeneratingCinema}
                  className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[9px] font-mono text-amber-400 font-bold uppercase">{item.platform}</span>
                  </div>
                  <h5 className="text-xs font-black text-white mt-1.5">{item.label}</h5>
                </button>
              ))}
            </div>
          </div>

          {/* 5-Agent Contribution Matrix */}
          {selectedCinemaProject && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider block">
                👥 Phân Công Nhiệm Vụ Swarm 5 AI Satellites:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-cyan-400 uppercase font-mono block">
                    ✍️ Screenwriter Agent:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedCinemaProject.agentsContribution.screenwriter}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-pink-400 uppercase font-mono block">
                    🎨 Art Director Agent:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedCinemaProject.agentsContribution.artDirector}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase font-mono block">
                    🎙️ Voice Director Agent:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedCinemaProject.agentsContribution.voiceDirector}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-purple-400 uppercase font-mono block">
                    🎬 VFX Specialist Agent:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedCinemaProject.agentsContribution.vfxSpecialist}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-amber-400 uppercase font-mono block">
                    📈 Producer Analytics:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedCinemaProject.agentsContribution.producerAnalytics}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Storyboard Visualizer Station */}
          {selectedCinemaProject && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white">{selectedCinemaProject.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedCinemaProject.logline}</p>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyBlenderScript(selectedCinemaProject.blenderSceneRenderScript)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedBlenderScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBlenderScript ? 'Đã Copy bpy' : 'Script Blender 3D'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyCinemaFfmpeg(selectedCinemaProject.ffmpegMasterExportScript)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all cursor-pointer"
                  >
                    {copiedCinemaFfmpeg ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Film className="w-3.5 h-3.5" />}
                    <span>{copiedCinemaFfmpeg ? 'Đã Copy FFmpeg' : 'Lệnh Xuất FFmpeg'}</span>
                  </button>
                </div>
              </div>

              {/* Storyboard Scenes Stepper */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {selectedCinemaProject.storyboardScenes.map((scene, idx) => (
                  <button
                    key={scene.sceneNumber}
                    type="button"
                    onClick={() => setActiveStoryboardSceneIndex(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      activeStoryboardSceneIndex === idx
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Phân Cảnh #{scene.sceneNumber} ({scene.durationSeconds}s)
                  </button>
                ))}
              </div>

              {/* Active Storyboard Scene Detailed Card */}
              {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex] && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                  {/* Camera & Lighting Setup (6 cols) */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-cyan-400 uppercase font-mono flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" /> Thiết Kế Góc Máy & Chuyển Động:
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                          Lens {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].cameraSetup.focalLengthMm}mm
                        </span>
                      </div>
                      <p className="text-xs text-white font-medium">
                        {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].cameraSetup.movement}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Shot Type: #{selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].cameraSetup.shotType.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-pink-400 uppercase font-mono flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5" /> Bảng Màu & Ánh Sáng Thể Tích:
                        </span>
                        <div className="flex items-center gap-1">
                          {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].lightingAndAtmosphere.colorPaletteHex.map((c, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-white/20"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300">
                        {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].lightingAndAtmosphere.lightingMood}
                      </p>
                      <p className="text-[11px] text-slate-400 italic">
                        {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].lightingAndAtmosphere.volumetricEffects}
                      </p>
                    </div>
                  </div>

                  {/* Dialogue, Visemes & VFX (6 cols) */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                          <Mic2 className="w-3.5 h-3.5" /> Lồng Tiếng & Khẩu Hình Viseme:
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-bold">
                          {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].characterDialogue.speaker}
                        </span>
                      </div>
                      <p className="text-xs text-amber-200 font-serif italic bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        "{selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].characterDialogue.dialogueText}"
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] text-slate-500 font-mono">Visemes:</span>
                        {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].characterDialogue.visemeTimingCues.map((v, i) => (
                          <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {v.time}s: {v.viseme}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[11px] font-black text-purple-400 uppercase font-mono block">
                        ✨ Kỹ Xảo & Bộ Lọc FFmpeg Filter:
                      </span>
                      <p className="text-xs text-slate-300">
                        {selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].vfxAndShaderNotes}
                      </p>
                      <code className="text-[10px] text-cyan-400 font-mono block bg-slate-900 p-2 rounded-lg truncate">
                        -vf "{selectedCinemaProject.storyboardScenes[activeStoryboardSceneIndex].ffmpegFilterEffect}"
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODE 8: LEVEL 5 "STANDING ON SHOULDERS OF GIANTS" FEDERATION & TOOLS PIPELINE ── */}
      {studioMode === 'giants' && (
        <div className="space-y-6">
          {/* Giants Federation Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-purple-950/40 border border-sky-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-sky-400 animate-ping" />
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● SHOULDERS OF GIANTS FEDERATION
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Tận Dụng 100% Nền Tảng Công Nghệ Đỉnh Cao Thế Giới ($0 Cloud Cost)
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Liên Minh Siêu Công Cụ: Google, Microsoft, NVIDIA, Meta, Blender, Three.js & FFmpeg
              </h3>
              <p className="text-xs text-slate-300">
                Glacia đóng vai trò là "Nhạc Trưởng Tối Thượng" tổng hợp các công cụ tối ưu nhất của các gã khổng lồ để sản xuất <strong>Phần Mềm, Game 60FPS và Phim Video 4K</strong> với chi phí $0!
              </p>
            </div>

            {/* Savings & Routing Stats */}
            <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-sky-500/30 shrink-0">
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-emerald-400 font-mono">
                  ${giantsList.reduce((acc, g) => acc + g.costSavedUsd, 0).toFixed(1)}
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Tiết Kiệm $0</span>
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-300 uppercase block font-mono">
                  7 Trụ Cột Khổng Lồ
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {giantsList.reduce((acc, g) => acc + g.totalCallsRouted, 0).toLocaleString()} Lượt Điều Phối
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setActiveGiantsSubTab('pipelines')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeGiantsSubTab === 'pipelines'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-black shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ Xưởng Siêu Công Cụ (Phần Mềm · Game · Video)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGiantsSubTab('ecosystem')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeGiantsSubTab === 'ecosystem'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🌐 Toàn Cảnh 7 Trụ Cột Khổng Lồ</span>
            </button>
          </div>

          {/* SUBTAB 1: BEST-OF-BREED GIANTS PRODUCTION PIPELINES */}
          {activeGiantsSubTab === 'pipelines' && (
            <div className="space-y-5">
              {/* Domain Selector Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { domain: 'software', label: '💻 Phần Mềm Siêu Tốc', desc: 'Monaco Core · TypeScript AST · Vite · Electron Native' },
                  { domain: 'game', label: '🎮 Game 60FPS Đỉnh Cao', desc: 'Three.js WebGPU · Rapier Wasm · NVIDIA WGSL Shaders' },
                  { domain: 'video', label: '🎬 Phim & Video 4K', desc: 'Blender bpy Cycles · FFmpeg Graph · Viseme Lip-Sync' },
                ].map((item) => (
                  <button
                    key={item.domain}
                    type="button"
                    onClick={() => setSelectedPipelineDomain(item.domain as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPipelineDomain === item.domain
                        ? 'bg-sky-950/40 border-sky-500/60 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <h4 className="text-xs font-black text-white">{item.label}</h4>
                    <p className="text-[10px] text-sky-400 font-mono mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>

              {/* Execution Trigger Bar */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Đường Ống Sản Xuất: {selectedPipelineDomain.toUpperCase()} PIPELINE
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Glacia tự động kết hợp các công cụ tối ưu của Microsoft, Google, NVIDIA, Blender & FFmpeg.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteGiantPipeline(selectedPipelineDomain)}
                  disabled={isExecutingPipeline}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {isExecutingPipeline ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                  <span>{isExecutingPipeline ? 'Đang Tổng Hợp Siêu Công Cụ...' : '🚀 Khởi Tạo Đường Ống $0'}</span>
                </button>
              </div>

              {/* Pipeline Result Display (if executed) */}
              {pipelineExecutionResult && pipelineExecutionResult.domain === selectedPipelineDomain && (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/40 space-y-4 shadow-xl animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{pipelineExecutionResult.pipelineTitle}</h4>
                      <span className="text-[10px] text-sky-400 font-mono">
                        Định dạng xuất: {pipelineExecutionResult.exportFormat}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyPipelineArtifact(pipelineExecutionResult.synthesizedCodeArtifact)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      {copiedPipelineArtifact ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPipelineArtifact ? 'Đã Copy Mã Nguồn' : 'Copy Artifact'}</span>
                    </button>
                  </div>

                  {/* Metrics Gauges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-sm font-black text-cyan-400 font-mono block">
                        {pipelineExecutionResult.executionMetrics.estimatedFpsOrBuildTime}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">Hiệu Năng Dự Kiến</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-sm font-black text-purple-400 font-mono block">
                        {pipelineExecutionResult.executionMetrics.ramEfficiency}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">Tối Ưu Tài Nguyên</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-sm font-black text-emerald-400 font-mono block">
                        $0.00 USD (Miễn Phí 100%)
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">Chi Phí Hạ Tầng</span>
                    </div>
                  </div>

                  {/* Tools breakdown */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-slate-300 uppercase font-mono block">
                      🛠️ Các Siêu Công Cụ Đã Được Glacia Tích Hợp Đồng Bộ:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {pipelineExecutionResult.toolsUsed.map((tool, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-black text-amber-300 font-mono block">
                            {tool.giant}: {tool.name}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                            {tool.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Synthesized Code */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      Mã Nguồn Khung Hoàn Chỉnh Được Sinh Ra:
                    </span>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono overflow-x-auto max-h-[220px] leading-relaxed select-all">
                      <code>{pipelineExecutionResult.synthesizedCodeArtifact}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Tools Catalog Cards */}
              <div className="space-y-3">
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
                  Danh Mục Siêu Công Cụ Tối Ưu Cho Mảng {selectedPipelineDomain.toUpperCase()}:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {giantToolsCatalog
                    .filter((t) => t.domain === selectedPipelineDomain)
                    .map((tool) => (
                      <div key={tool.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700 uppercase font-bold">
                            {tool.creatorGiant}
                          </span>
                          <h4 className="text-xs font-black text-white mt-1.5">{tool.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{tool.purpose}</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                          <span className="text-[9px] text-emerald-400 uppercase font-mono font-bold block">
                            Đặc Quyền $0 Tận Dụng:
                          </span>
                          <p className="text-[10px] text-slate-300 leading-relaxed">{tool.zeroCostBenefit}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: 7 GIANTS ECOSYSTEM FEDERATION OVERVIEW */}
          {activeGiantsSubTab === 'ecosystem' && (
            <div className="space-y-6">
              {/* Invocation Result Modal/Banner (if exists) */}
              {invocationResult && (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/40 space-y-3 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Orbit className="w-4 h-4 text-sky-400 animate-spin" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Kết Quả Triệu Hồi Sức Mạnh: {invocationResult.executionDetails.technologyUsed}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      Chi Phí: $0.00 USD (Hạ Tầng Tối Ưu)
                    </span>
                  </div>

                  <p className="text-xs text-sky-200">{invocationResult.glaciaOrchestrationNote}</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                        Mã Nguồn / Asset Thực Thi Được Sinh Ra:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyGiantCode(invocationResult.executionDetails.generatedAssetOrCode)}
                        className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-cyan-200 font-mono cursor-pointer"
                      >
                        {copiedGiantCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedGiantCode ? 'Đã Copy' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono overflow-x-auto max-h-[180px] leading-relaxed select-all">
                      <code>{invocationResult.executionDetails.generatedAssetOrCode}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* 7 Giants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {giantsList.map((giant) => (
                  <div
                    key={giant.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      selectedGiant?.id === giant.id
                        ? 'bg-slate-900/90 border-sky-500/60 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50'
                        : 'bg-slate-950/70 hover:bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          {giant.logoBadge}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700 uppercase font-bold shrink-0">
                          {giant.latencyMs}ms · {giant.status.replace('_', ' ')}
                        </span>
                      </div>

                      <span className="text-[10px] text-sky-400 font-mono block uppercase font-bold">
                        #{giant.category}
                      </span>

                      {/* Technologies */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase font-mono font-bold block">
                          Công Nghệ Tận Dụng:
                        </span>
                        <ul className="space-y-0.5 text-[11px] text-slate-300">
                          {giant.leveragedTechnologies.slice(0, 3).map((tech, i) => (
                            <li key={i} className="flex items-center gap-1.5 truncate">
                              <span className="text-sky-400 text-xs">●</span>
                              <span className="truncate">{tech}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Zero cost highlights */}
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-1">
                        <span className="text-[9px] text-emerald-400 uppercase font-mono font-bold block">
                          Đặc Quyền $0 Tận Dụng:
                        </span>
                        <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-2">
                          {giant.zeroCostCapabilities[0]}
                        </p>
                      </div>
                    </div>

                    {/* Invocation Action Button */}
                    <button
                      type="button"
                      onClick={() => handleInvokeGiantCapability(giant.id)}
                      disabled={isInvokingGiant}
                      className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-sky-500/20 to-purple-500/20 hover:from-sky-500/30 hover:to-purple-500/30 border border-sky-500/30 hover:border-sky-500/60 text-sky-200 hover:text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isInvokingGiant && selectedGiant?.id === giant.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>Triệu Hồi Sức Mạnh $0</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 9: LEVEL 5 MASTER INFINITE AUTONOMOUS CREATIVE LOOP ── */}
      {studioMode === 'infinite_loop' && (
        <div className="space-y-6">
          {/* Master Singularity Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● LEVEL 5 FULL AUTONOMOUS SINGULARITY ACTIVE
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  Khép Kín Toàn Diện 8 Chặng (Zero Human Intervention)
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Động Cơ Chu Trình Sáng Tạo Tự Trị Bất Tử 24/7/365
              </h3>
              <p className="text-xs text-slate-300">
                Glacia tự động kết nối toàn bộ 8 chặng: từ tự phân tích xu hướng, cào tri thức mở MCP, tận dụng công cụ các gã khổng lồ, sinh mã nguồn/3D, tạo nhạc nền, AI Playtest 50 trận đến đóng gói xuất bản $0!
              </p>
            </div>

            {/* Telemetry Metrics */}
            <div className="flex items-center gap-3 bg-slate-950/90 p-3 rounded-2xl border border-emerald-500/30 shrink-0">
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-emerald-400 font-mono">
                  ${(autonomousLoopState?.totalDollarsSaved || 4860.0).toFixed(0)}
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Tiết Kiệm $0</span>
              </div>
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-cyan-400 font-mono">
                  {autonomousLoopState?.completedCyclesCount || 18}
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Chu Trình Xong</span>
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-300 uppercase block font-mono">
                  Vận Hành 24/7
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {autonomousLoopState?.totalHoursRun247 || 142.5}h · 0% Crash
                </span>
              </div>
            </div>
          </div>

          {/* Trigger Singularity Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">Lĩnh Vực Đích:</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                {[
                  { domain: 'game', label: '🎮 Game 3D 60FPS' },
                  { domain: 'video', label: '🎬 Phim & Teaser 4K' },
                  { domain: 'software', label: '💻 Phần Mềm Desktop OS' },
                ].map((item) => (
                  <button
                    key={item.domain}
                    type="button"
                    onClick={() => setSelectedLoopDomain(item.domain as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedLoopDomain === item.domain
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTriggerAutonomousCycle(selectedLoopDomain)}
              disabled={isTriggeringLoopCycle}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-600 hover:from-emerald-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isTriggeringLoopCycle ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Orbit className="w-4 h-4 text-slate-950 animate-spin" />
              )}
              <span>
                {isTriggeringLoopCycle
                  ? 'Đang Chạy Tự Trị 8 Chặng...'
                  : '🚀 Kích Hoạt Chu Trình Tự Trị (Level 5 Singularity Run)'}
              </span>
            </button>
          </div>

          {/* Active / Last Run 8-Stage Interactive Stepper */}
          {autonomousLoopState?.activeCycle && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>✨ Tiến Trình 8 Chặng Khép Kín:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {autonomousLoopState.activeCycle.projectName}
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Thời gian hoàn thành: {autonomousLoopState.activeCycle.totalDurationMs}ms · Chi phí: $0.00 USD
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                  100% Tự Động Hoàn Tất
                </span>
              </div>

              {/* 8-Stage Mesh Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {autonomousLoopState.activeCycle.stages.map((stage) => (
                  <div
                    key={stage.stepNumber}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-black text-white">
                        <span>{stage.icon}</span>
                        <span>#{stage.stepNumber} {stage.stageName}</span>
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400 font-bold">
                        {stage.durationMs}ms
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {stage.summary}
                    </p>

                    <div className="flex items-center gap-1 pt-1 border-t border-slate-900">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">
                        Đạt Chuẩn Tự Trị
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Product Output Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/40 space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Sản Phẩm Xuất Xưởng: {autonomousLoopState.activeCycle.finalProductSummary.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Gói Phát Hành: {autonomousLoopState.activeCycle.finalProductSummary.exportPackage}
                  </span>
                </div>

                <p className="text-xs text-emerald-200">
                  {autonomousLoopState.activeCycle.glaciaSingularityVerdict}
                </p>

                {/* Score and Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {autonomousLoopState.activeCycle.finalProductSummary.funOrQualityScore}/100
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono mt-0.5 block">
                      Độ Cuốn Hút (Fun/Quality)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-lg font-black text-cyan-400 font-mono">
                      {autonomousLoopState.activeCycle.finalProductSummary.fpsOrBuildEfficiency}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono mt-0.5 block">
                      Độ Mượt / Tốc Độ
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-lg font-black text-amber-300 font-mono">
                      $0.00 USD
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-mono mt-0.5 block">
                      Chi Phí Con Người & Server
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Cycles Log */}
          {autonomousLoopState?.recentCycles && autonomousLoopState.recentCycles.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                📋 Lịch Sử Các Chu Trình Sáng Tạo Tự Trị Gần Nhất:
              </span>

              <div className="space-y-2">
                {autonomousLoopState.recentCycles.map((cycle) => (
                  <div
                    key={cycle.cycleId}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">
                        {cycle.targetDomain === 'game' ? '🎮' : cycle.targetDomain === 'video' ? '🎬' : '💻'}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{cycle.projectName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(cycle.finishedAt).toLocaleTimeString('vi-VN')} · {cycle.totalDurationMs}ms · {cycle.stages.length} chặng
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {cycle.finalProductSummary.funOrQualityScore}/100 Điểm
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                        Thành Công
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 10: LEVEL 5 TELEGRAM MOBILE REMOTE DISPATCHER & NIGHT SHIFT ── */}
      {studioMode === 'telegram_dispatcher' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-sky-400 animate-ping" />
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● TELEGRAM MOBILE COMMAND & 24/7 NIGHT-SHIFT ACTIVE
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Điều Khiển Từ Xa Trên Điện Thoại & Báo Cáo Sáng 6:00 AM
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Trạm Điều Khiển Di Động Telegram & Tự Hành Ca Đêm
              </h3>
              <p className="text-xs text-slate-300">
                Founder David Bao có thể đi ngủ hoặc ra ngoài mà vẫn ra lệnh sản xuất game, video, chạy chu trình tự trị hoặc nhận bản tin tổng kết 6:00 AM trực tiếp qua Telegram!
              </p>
            </div>

            {/* Quick Actions & Telemetry */}
            <div className="flex items-center gap-3 bg-slate-950/90 p-3 rounded-2xl border border-blue-500/30 shrink-0">
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xs font-black text-emerald-400 font-mono block">
                  {telegramDispatcherState?.isNightShiftActive ? '🌙 23:00 - 06:00' : '☀️ Ca Ngày'}
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Trạng Thái Ca</span>
              </div>
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-cyan-400 font-mono">
                  {telegramDispatcherState?.nightShiftTasksCompleted || 42}
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Tác Vụ Đêm Xong</span>
              </div>
              <button
                type="button"
                onClick={handleTriggerMorningReport}
                disabled={isLoadingMorningReport}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoadingMorningReport ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Báo Cáo 6:00 AM</span>
              </button>
            </div>
          </div>

          {/* Mobile Simulator Console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Telegram Chat Simulator (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between min-h-[460px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Giả Lập Giao Diện Chat Telegram Di Động
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Bot: @LedgerFlowAssistantBot
                  </span>
                </div>

                {/* Quick Action Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
                    ⚡ Lệnh Nhanh 1-Click:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { cmd: '/game Không Gian Vũ Trụ Neon Plasma 60FPS', label: '🎮 /game (Tạo Game)' },
                      { cmd: '/video Robot AI Tự Động Hóa Vận Hành 24/7', label: '🎬 /video (Làm Phim)' },
                      { cmd: '/singularity', label: '♾️ /singularity (Chu Trình 8 Chặng)' },
                      { cmd: '/morningreport', label: '🌅 /morningreport (Bản Tin Sáng)' },
                      { cmd: '/nightshift', label: '🌙 /nightshift (Bật/Tắt Ca Đêm)' },
                      { cmd: '/glacia_creative_help', label: 'ℹ️ /help (Hướng Dẫn)' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSimulateTelegram(item.cmd)}
                        disabled={isSimulatingTelegram}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-[10px] font-mono text-sky-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Log Window */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 space-y-2.5 max-h-[250px] overflow-y-auto font-sans text-xs">
                  {simulatedChatResponses.map((msg, index) => {
                    const isUser = msg.startsWith('👤');
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                          isUser
                            ? 'ml-auto bg-blue-600/80 text-white rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none font-mono text-[11px]'
                        }`}
                      >
                        {msg}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={simulatedTelegramCommand}
                  onChange={(e) => setSimulatedTelegramCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSimulateTelegram();
                  }}
                  placeholder="Nhập lệnh Telegram: /game, /video, /singularity, /morningreport..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleSimulateTelegram()}
                  disabled={isSimulatingTelegram || !simulatedTelegramCommand}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {isSimulatingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Gửi Lệnh</span>
                </button>
              </div>
            </div>

            {/* Right: Morning Briefing Card & Night Shift Logs (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Morning Briefing Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Bản Tin Sáng 6:00 AM (Preview)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    Tự Động Gửi Telegram
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-h-[190px] overflow-y-auto">
                  {morningReport?.markdownContent || 'Đang cập nhật bản tin sáng tự động...'}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-xs font-black text-emerald-400 font-mono block">50 Maps</span>
                    <span className="text-[8px] text-slate-400 uppercase font-mono">Game Sinh Ra</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-xs font-black text-cyan-400 font-mono block">3 Videos</span>
                    <span className="text-[8px] text-slate-400 uppercase font-mono">Render 4K Xong</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-xs font-black text-amber-300 font-mono block">$0.00 USD</span>
                    <span className="text-[8px] text-slate-400 uppercase font-mono">Chi Phí Đêm</span>
                  </div>
                </div>
              </div>

              {/* Night Shift Task Logs */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
                  🌙 Nhật Ký Vận Hành Ca Đêm Gần Nhất:
                </span>
                <div className="space-y-1.5">
                  {(telegramDispatcherState?.recentNightLogs || []).map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <h5 className="text-[11px] font-bold text-white">{log.title}</h5>
                        <span className="text-[9px] text-slate-400 font-mono block">{log.metrics}</span>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold shrink-0">
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 11: LEVEL 4 SWARM BLACKBOARD & CONSENSUS PROTOCOL ── */}
      {studioMode === 'swarm_blackboard' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● LEVEL 4 INTERNATIONAL STANDARD: MULTI-AGENT SWARM
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Bộ Nhớ Chia Sẻ Blackboard & Giao Thức Đồng Thuận &gt;= 80%
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                5 AI Swarm Chuyên Trách Đồng Thuận & Hợp Nhất Mã Nguồn
              </h3>
              <p className="text-xs text-slate-300">
                Lead Architect, WebGL Game Engineer, CGI VFX Director, Fullstack Crafter và QA Sentinel cùng hội đàm và tự động giải quyết xung đột trên Blackboard.
              </p>
            </div>

            {/* Metrics & Action Button */}
            <div className="flex items-center gap-3 bg-slate-950/90 p-3 rounded-2xl border border-amber-500/30 shrink-0">
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-amber-400 font-mono">
                  {swarmSession?.consensusRate?.toFixed(1) || '98.4'}%
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Tỷ Lệ Đồng Thuận</span>
              </div>
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-cyan-400 font-mono">
                  5 Agents
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Biệt Đội Swarm</span>
              </div>
              <button
                type="button"
                onClick={handleExecuteSwarm}
                disabled={isExecutingSwarm}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isExecutingSwarm ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                <span>Triệu Hồi Hội Đàm Swarm</span>
              </button>
            </div>
          </div>

          {/* Goal Input & Verdict Note */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={swarmCustomGoal}
              onChange={(e) => setSwarmCustomGoal(e.target.value)}
              placeholder="Nhập mục tiêu sáng tạo cho Swarm hội đàm..."
              className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <span className="text-xs text-amber-300 font-mono">
              Quorum Yêu Cầu: 80% Phiếu Thuận
            </span>
          </div>

          {/* 5 Swarm Agents Grid */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Biệt Đội 5 AI Swarm Chuyên Trách (Level 4 Standard):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {(swarmSession?.agents || []).map((agent) => (
                <div key={agent.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{agent.avatar}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      {agent.confidenceScore}% Tin Cậy
                    </span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{agent.name}</h5>
                    <span className="text-[9px] text-amber-400 font-mono block">{agent.specialty}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 border-t border-slate-800/80 pt-1.5 line-clamp-2">
                    💡 {agent.lastContribution}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DAG Nodes & Blackboard Artifacts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Swarm DAG Dependency Nodes */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Bản Đồ Phụ Thuộc Tác Vụ (Task DAG Pipeline)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">
                  {swarmSession?.dagNodes?.length || 5} Giai Đoạn
                </span>
              </div>
              <div className="space-y-2">
                {(swarmSession?.dagNodes || []).map((node, idx) => (
                  <div key={node.id} className="p-3 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-white">{node.title}</h5>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Phụ trách: @{node.assignedRole} {node.dependencies.length > 0 ? `· Phụ thuộc: [${node.dependencies.join(', ')}]` : '· (Root Node)'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                      {node.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Blackboard Memory Artifacts */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Bộ Nhớ Blackboard & Phiếu Bầu Đồng Thuận
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  Shared Memory State
                </span>
              </div>
              <div className="space-y-2">
                {(swarmSession?.blackboardArtifacts || []).map((art) => (
                  <div key={art.id} className="p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white">{art.title}</h5>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-bold">
                        {art.status} (v{art.version})
                      </span>
                    </div>
                    <pre className="p-2 rounded-lg bg-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto">
                      {JSON.stringify(art.data, null, 2)}
                    </pre>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span>Tác giả: @{art.authorRole}</span>
                      <span className="text-emerald-400 font-bold">
                        👍 {art.votesCount.approve} Tán Thành · 👎 {art.votesCount.reject} Bác Bỏ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 12: LEVEL 5 EVOLUTIONARY GENETIC CODE & SHADER BREEDING ── */}
      {studioMode === 'evolutionary_genetic' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-slate-900 to-rose-950/40 border border-pink-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-pink-400 animate-ping" />
                <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● LEVEL 5 SINGULARITY: GENETIC CODE & SHADER BREEDING
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Tự Tiến Hóa Mã Nguồn & Chọn Giống F1/F2 Tối Ưu $0 Token
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Động Cơ Thuật Toán Di Truyền Tối Ưu Hóa Shaders & VRAM
              </h3>
              <p className="text-xs text-slate-300">
                Glacia tự động sinh đột biến (Mutation) và lai ghép (Crossover) các thuật toán Three.js/WGSL, chấm điểm Fitness để tìm ra giải pháp tối ưu nhất hành tinh!
              </p>
            </div>

            {/* Metrics & Action Button */}
            <div className="flex items-center gap-3 bg-slate-950/90 p-3 rounded-2xl border border-pink-500/30 shrink-0">
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-pink-400 font-mono">
                  Gen F{evolutionarySession?.currentGeneration || 2}
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Thế Hệ Hiện Tại</span>
              </div>
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {evolutionarySession?.bestVariantOverall?.fitnessScore || 98.6}/100
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Fitness Cao Nhất</span>
              </div>
              <button
                type="button"
                onClick={handleBreedGeneration}
                disabled={isBreedingGeneration}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 hover:from-fuchsia-400 hover:to-rose-400 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isBreedingGeneration ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Dna className="w-3.5 h-3.5" />}
                <span>Lai Ghép Thế Hệ Kế Tiếp</span>
              </button>
            </div>
          </div>

          {/* Elite Champion Card */}
          {evolutionarySession?.bestVariantOverall && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-pink-950/20 to-slate-900 border border-pink-500/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Biến Thể Quán Quân F{evolutionarySession.currentGeneration}: {evolutionarySession.bestVariantOverall.name}
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                  Fitness Score: {evolutionarySession.bestVariantOverall.fitnessScore}/100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm font-black text-emerald-400 font-mono block">
                    {evolutionarySession.bestVariantOverall.metrics.measuredFps} FPS
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">Tốc Độ Khung Hình</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm font-black text-cyan-400 font-mono block">
                    {evolutionarySession.bestVariantOverall.metrics.vramUsageMb} MB
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">VRAM Tiêu Thụ</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm font-black text-amber-300 font-mono block">
                    {evolutionarySession.bestVariantOverall.metrics.drawCalls} Call
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">Draw Calls</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm font-black text-fuchsia-400 font-mono block">
                    {evolutionarySession.bestVariantOverall.metrics.funScore}/100
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">Fun Factor Score</span>
                </div>
              </div>

              <pre className="p-3 rounded-xl bg-slate-950 text-[11px] font-mono text-pink-300 border border-slate-800 overflow-x-auto">
                {evolutionarySession.bestVariantOverall.sampleCodeSnippet}
              </pre>
            </div>
          )}

          {/* Population List */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Quần Thể Biến Thể Đang Được Đánh Giá Di Truyền:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(evolutionarySession?.population || []).map((v) => (
                <div key={v.variantId} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white">{v.name}</h5>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                      v.status === 'survived'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : v.status === 'evaluated'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {v.status} (Fitness: {v.fitnessScore})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>FPS: {v.metrics.measuredFps}</span>
                    <span>VRAM: {v.metrics.vramUsageMb}MB</span>
                    <span>Đột biến: {v.mutationType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 13: LEVEL 5 SELF-DIRECTED STRATEGIC UNIVERSE & 90-DAY ROADMAP ── */}
      {studioMode === 'strategic_roadmap' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-emerald-950/40 border border-teal-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400 animate-ping" />
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black tracking-widest font-mono uppercase">
                  ● LEVEL 5 SINGULARITY: 90-DAY STRATEGIC UNIVERSE ROADMAP
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Chiến Lược Tự Định Hướng Vũ Trụ Giải Trí & Franchise Đa Phần
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                {strategicRoadmap?.franchiseTitle || 'Vũ Trụ Thiên Hà Tinh Thể (Stellar Crystal Universe)'}
              </h3>
              <p className="text-xs text-slate-300">
                {strategicRoadmap?.visionStatement}
              </p>
            </div>

            {/* Projected Metrics */}
            <div className="flex items-center gap-3 bg-slate-950/90 p-3 rounded-2xl border border-teal-500/30 shrink-0">
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-emerald-400 font-mono">
                  ${strategicRoadmap?.projectedMetrics.cumulativeSavingsUsd || 14850}
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Tiết Kiệm $0 Cloud</span>
              </div>
              <div className="text-center pr-3 border-r border-slate-800">
                <span className="text-xl font-black text-cyan-400 font-mono">
                  {strategicRoadmap?.projectedMetrics.totalCinematicEpisodes || 12} Eps
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Series 4K</span>
              </div>
              <div className="text-center">
                <span className="text-xl font-black text-teal-300 font-mono">
                  {strategicRoadmap?.projectedMetrics.targetCrashRate || '0.00%'}
                </span>
                <span className="text-[9px] text-slate-400 block uppercase font-mono mt-0.5">Crash Rate</span>
              </div>
            </div>
          </div>

          {/* 3-Phase Milestones Stepper */}
          <div className="space-y-4">
            {(strategicRoadmap?.milestones || []).map((m) => (
              <div key={m.milestoneId} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest block">
                      {m.phaseName}
                    </span>
                    <h4 className="text-sm font-black text-white mt-0.5">{m.targetProduct}</h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {m.completionRate}% Hoàn Thành
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdvanceMilestone(m.milestoneId)}
                      disabled={isAdvancingMilestone || m.completionRate >= 100}
                      className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[10px] transition-all cursor-pointer disabled:opacity-40"
                    >
                      +20% Tiến Độ
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${m.completionRate}%` }}
                  />
                </div>

                {/* Deliverables & Shift Schedules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                      📦 Sản Phẩm Xuất Xưởng:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {m.deliverables.map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-1.5 text-xs font-mono">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      🕒 Phân Bổ Ca Vận Hành:
                    </span>
                    <p className="text-amber-300">☀️ Ca Ngày: {m.scheduledShifts.dayShift}</p>
                    <p className="text-cyan-300">🌙 Ca Đêm: {m.scheduledShifts.nightShift}</p>
                    <p className="text-emerald-400 pt-1">🎯 Chỉ Tiêu: {m.targetFpsOrResolution} · Chi Phí: $0.00 USD</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODE 14: ON-DEVICE LOCAL OFFLINE LLM ($0 VĨNH VIỄN) ── */}
      {studioMode === 'offline_engine' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Zap className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      Động Cơ AI On-Device Offline WebGPU ($0 Token vĩnh viễn)
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                        100% Air-Gapped Ready
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Chạy trực tiếp model cục bộ trên GPU/CPU máy tính Founder David Bao. Không gửi dữ liệu ra ngoài, chi phí $0.00!
                    </p>
                  </div>
                </div>

                {/* Backend Switcher */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono px-2">Backend:</span>
                  {(['webgpu_local', 'onnx_runtime', 'wasm_fallback'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleSwitchOfflineBackend(b)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        offlineEngineState?.activeBackend === b
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {b.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Tiết Kiệm Cloud API</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    ${(offlineEngineState?.totalMoneySavedUSD || 0).toFixed(2)} USD
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Tổng Truy Vấn Offline</span>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    {offlineEngineState?.totalOfflineQueries || 0} lần
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Token Cục Bộ Sinh Ra</span>
                  <span className="text-lg font-black text-cyan-300 font-mono">
                    {(offlineEngineState?.totalTokensGenerated || 0).toLocaleString()} tok
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Trạng Thái An Ninh</span>
                  <span className="text-xs font-black text-emerald-400 font-mono flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> AIR-GAPPED SECURE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Catalog Grid */}
          <div className="space-y-3">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              Danh Mục Model Cục Bộ Sẵn Sàng ($0 Hardware Acceleration):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(offlineEngineState?.models || []).map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedOfflineModel(m.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedOfflineModel === m.id
                      ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white">{m.name}</h5>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {m.parameterSize}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[10px] text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>Lượng tử hóa:</span>
                      <span className="text-slate-200">{m.quantization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VRAM Yêu cầu:</span>
                      <span className="text-cyan-300">{m.vramRequiredMb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tốc độ dự kiến:</span>
                      <span className="text-emerald-400">{m.tokensPerSecond} tok/s</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {m.bestFor.map((bf, idx) => (
                      <span key={idx} className="text-[8px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400">
                        {bf}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Offline Inference Studio */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Trạm Thử Nghiệm Suy Luận On-Device Không Cần Mạng
              </h4>
              {/* Task Type Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                {(
                  [
                    { id: 'game_code', label: '🎮 Sinh Code Game' },
                    { id: 'video_script', label: '🎬 Phân Cảnh Video' },
                    { id: 'self_healing', label: '🩺 Tự Vá Lỗi Code' },
                    { id: 'fast_chat', label: '💬 Phản Hồi Siêu Tốc' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setOfflineTaskType(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      offlineTaskType === t.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                value={offlinePrompt}
                onChange={(e) => setOfflinePrompt(e.target.value)}
                rows={3}
                placeholder="Nhập yêu cầu cần AI offline thực thi..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunOfflineInference}
                  disabled={isInferringOffline || !offlinePrompt.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-40"
                >
                  <Zap className={`w-4 h-4 ${isInferringOffline ? 'animate-spin' : 'fill-current'}`} />
                  <span>{isInferringOffline ? 'Đang Suy Luận WebGPU...' : 'Chạy Suy Luận Offline ($0 Cost)'}</span>
                </button>
              </div>
            </div>

            {/* Offline Result Output Box */}
            {offlineResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      ⚡ Hoàn thành trong {offlineResult.latencyMs}ms
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      · {offlineResult.tokensGenerated} tokens
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">
                      · Chi phí: ${offlineResult.tokenCostUSD.toFixed(4)}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Model: {offlineResult.modelUsed} ({offlineResult.backendUsed})
                  </span>
                </div>
                <pre className="text-xs font-mono text-slate-200 overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                  {offlineResult.output}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODE 15: PROCEDURAL 3D GAME & BOSS AI MATRIX ── */}
      {studioMode === 'procedural_arena' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    <Target className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      Trình Sinh Bản Đồ Procedural 3D & Ma Trận Boss AI FSM
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                        Seed-Driven Infinity
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Tự động tạo thế giới 3D đa tầng vô tận và điều khiển hành vi Boss AI theo cỗ máy trạng thái FSM thời gian thực.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateProceduralWorld}
                  disabled={isGeneratingWorld}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-40"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingWorld ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingWorld ? 'Đang Sinh 3D...' : '🎲 Sinh Thế Giới Mới'}</span>
                </button>
              </div>

              {/* Seed & Biome Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Hệ Sinh Thái (Biome):</span>
                  <select
                    value={selectedBiome}
                    onChange={(e) => setSelectedBiome(e.target.value)}
                    className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none font-bold"
                  >
                    <option value="cyberpunk_neon_dungeon">🌆 Cyberpunk Neon Dungeon</option>
                    <option value="space_void_nebula">🌌 Space Void Nebula</option>
                    <option value="crystal_glacier_vault">❄️ Crystal Glacier Vault</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Seed Thuật Toán:</span>
                  <input
                    type="number"
                    value={worldSeed}
                    onChange={(e) => setWorldSeed(parseInt(e.target.value) || 0)}
                    className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Quy Mô Ô Không Gian:</span>
                  <span className="text-xs font-black text-cyan-300 font-mono block pt-1">
                    {proceduralWorld?.gridDimensions.width}x{proceduralWorld?.gridDimensions.height}x{proceduralWorld?.gridDimensions.depth} ({proceduralWorld?.tiles.length} Ô Đất)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Boss AI Arena & FSM State Machine Tracker */}
          {proceduralWorld?.boss && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest block">
                    👑 Đấu Trường Boss AI (Finite State Machine):
                  </span>
                  <h4 className="text-sm font-black text-white mt-0.5">{proceduralWorld.boss.name}</h4>
                </div>

                {/* Boss State Pill */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">Trạng thái FSM:</span>
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full uppercase border ${
                    proceduralWorld.boss.currentState === 'ULTIMATE_ATTACK'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : proceduralWorld.boss.currentState === 'CHASE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : proceduralWorld.boss.currentState === 'EVADE'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {proceduralWorld.boss.currentState}
                  </span>
                </div>
              </div>

              {/* Boss Health Bar & Attributes */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Thanh Máu (HP):</span>
                  <span className="text-rose-400 font-bold">
                    {proceduralWorld.boss.currentHealth} / {proceduralWorld.boss.maxHealth}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(0, (proceduralWorld.boss.currentHealth / proceduralWorld.boss.maxHealth) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono pt-1">
                  <span>⚡ Sức Tấn Công: {proceduralWorld.boss.attackPower}</span>
                  <span>🏃 Tốc Độ Di Chuyển: {proceduralWorld.boss.speed}</span>
                  <span>💥 Bán Kính Chiêu AoE: {proceduralWorld.boss.aoeRadius}m</span>
                </div>
              </div>

              {/* Interactive Player Combat Simulator */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  🎮 Tương Tác Thử Nghiệm Phản Ứng Trí Tuệ Boss:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBossFsmAction('approach')}
                    disabled={isBossTicking}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all cursor-pointer"
                  >
                    🚶 Đi Lại Gần (5.5m - Kích hoạt Chase)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBossFsmAction('attack')}
                    disabled={isBossTicking}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all cursor-pointer"
                  >
                    ⚔️ Tấn Công Gây Sát Thương (Kích hoạt Evade/Ultimate)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBossFsmAction('retreat')}
                    disabled={isBossTicking}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all cursor-pointer"
                  >
                    🏃 Rút Lui Xa (14m - Kích hoạt Patrol)
                  </button>
                </div>

                {/* Live Combat Event Stream */}
                {bossFsmLog.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block">Nhật Ký Quyết Định FSM:</span>
                    <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[10px]">
                      {bossFsmLog.map((log, idx) => (
                        <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                          <span className="text-cyan-400">›</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 16: 3D CHARACTER & AVATAR LAB ── */}
      {studioMode === 'character_lab' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Palette className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      🎭 Xưởng Tạo Mẫu Nhân Vật 3D & Avatar AI (Level 5 Singularity)
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                        WebGL / GLTF Ready
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Thiết kế, tùy biến hình tượng nhân vật AI 3D, vũ khí neon, hào quang plasma và xuất file 3D cho Game & Phim AI.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerate3DCharacter()}
                  disabled={isGeneratingChar3D}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs transition-all cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-40"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingChar3D ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingChar3D ? 'Đang Tạo Hình 3D...' : '✨ Tạo Hình 3D Ngay'}</span>
                </button>
              </div>

              {/* Archetypes Selector Grid */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Chọn Hình Tượng Cốt Lõi (Archetypes):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {[
                    { id: 'cyber_glacia_prime', name: 'Glacia Sovereign', role: 'Autonomous Core', color: '#06b6d4', icon: '🤖' },
                    { id: 'valkyrie_warrior', name: 'Valkyrie Warrior', role: 'Melee Striker', color: '#8b5cf6', icon: '⚔️' },
                    { id: 'neon_mecha_titan', name: 'Mecha Titan', role: 'Heavy Tank', color: '#10b981', icon: '🛡️' },
                    { id: 'shadow_hacker', name: 'Shadow Hacker', role: 'Speed Infiltrator', color: '#f43f5e', icon: '🗡️' },
                    { id: 'stellar_mage', name: 'Stellar Mage', role: 'Matrix Caster', color: '#f59e0b', icon: '🔮' },
                  ].map((arch) => (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => {
                        setSelectedArchetypeId(arch.id);
                        handleGenerate3DCharacter(arch.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedArchetypeId === arch.id
                          ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-500/20 ring-1 ring-purple-400'
                          : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="text-lg">{arch.icon}</div>
                      <div className="text-xs font-black text-white mt-1">{arch.name}</div>
                      <div className="text-[10px] text-slate-400">{arch.role}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Customization & 3D Blueprint Inspector */}
          {character3D && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Customization Controls */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  Bảng Điều Khiển Tùy Biến (3D Rigging & Shaders)
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Tên Nhân Vật:</label>
                    <input
                      type="text"
                      value={characterCustomName}
                      onChange={(e) => setCharacterCustomName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Màu Giáp Chủ Đạo:</label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={charPrimaryColor}
                          onChange={(e) => setCharPrimaryColor(e.target.value)}
                          className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                        />
                        <span className="text-[11px] font-mono text-slate-300 uppercase">{charPrimaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Hào Quang Neon (Glow):</label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={charEmissiveColor}
                          onChange={(e) => setCharEmissiveColor(e.target.value)}
                          className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                        />
                        <span className="text-[11px] font-mono text-slate-300 uppercase">{charEmissiveColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Trang Bị Vũ Khí:</label>
                    <select
                      value={charWeapon}
                      onChange={(e) => setCharWeapon(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="laser_katana">🗡️ Laser Katana (Kiếm Plasma 60FPS)</option>
                      <option value="plasma_blaster">🔫 Plasma Blaster (Súng Xung Điện Từ)</option>
                      <option value="nano_shield">🛡️ Nano Shield (Khiên Từ Trường)</option>
                      <option value="cyber_staff">🔮 Cyber Staff (Gậy Ma Trận Thuật Toán)</option>
                      <option value="dual_daggers">⚔️ Dual Energy Daggers (Song Đao Tốc Độ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Động Tác Animation:</label>
                    <select
                      value={charAnimation}
                      onChange={(e) => setCharAnimation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="idle">🧍 Idle (Thở & Đứng Chuẩn Bị)</option>
                      <option value="run">🏃 Run Cycle (Chạy Tốc Độ Cao)</option>
                      <option value="attack">⚔️ Slash Attack (Chém Kiếm Plasma)</option>
                      <option value="cast_spell">🔮 Cast Spell (Khai Mở Ma Trận AI)</option>
                      <option value="dance">💃 Cyber Dance (Vũ Đạo Neon)</option>
                      <option value="talk">🗣️ Talk & Lip-Sync (Nói Chuyện Khớp Khẩu Hình)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerate3DCharacter()}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    🔄 Cập Nhật Render Nhân Vật 3D
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Visual Mesh & Code Blueprint */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Box className="w-4 h-4 text-purple-400" />
                        Đặc Tả Mô Hình 3D GLTF/Three.js ({character3D.name})
                      </h4>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                        {character3D.gltfExportBlueprint.polyCount} Polygons
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(character3D.threeJsRenderCode);
                          setCopiedChar3DCode(true);
                          setTimeout(() => setCopiedChar3DCode(false), 2000);
                          glaciaAudio.playCrystalChime(1046.5);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                      >
                        {copiedChar3DCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedChar3DCode ? 'Đã Copy' : 'Sao Chép Code'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(character3D, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${character3D.name.toLowerCase().replace(/\s+/g, '_')}_3d_blueprint.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          glaciaAudio.playLevelUpFanfare();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-xs font-bold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất File .JSON/.GLTF</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Mesh Specs Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Số Node Khung Xương</span>
                      <span className="text-sm font-black text-cyan-300">{character3D.gltfExportBlueprint.nodeCount} Bones</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Số Materials Shader</span>
                      <span className="text-sm font-black text-purple-300">{character3D.gltfExportBlueprint.materialsCount} Shaders</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Tối Ưu Mobile 60FPS</span>
                      <span className="text-sm font-black text-emerald-300">Đạt Chuẩn 100%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Animation Timings</span>
                      <span className="text-sm font-black text-amber-300">{character3D.animationTimings.idleDurationSec}s Cycle</span>
                    </div>
                  </div>

                  {/* Code View Block */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto">
                    <pre className="whitespace-pre-wrap leading-relaxed">
                      {character3D.threeJsRenderCode}
                    </pre>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2 mt-4">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Nhân vật này sẵn sàng nhúng trực tiếp vào các cảnh quay Video Studio hoặc màn chơi Game Arcade 3D của Studio.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 17: ONE-CLICK CINEMA SYNTHESIZER ── */}
      {studioMode === 'cinema_synthesizer' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Film className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      🎬 Trình Biên Kịch Phim AI 1-Click (Cinema Synthesizer)
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold">
                        5-Stage 4K Workflow
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Chuyển 1 câu ý tưởng thành kịch bản phân cảnh 4K, lời thuyết minh tiếng Việt và lệnh ghép phim FFmpeg tự động.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSynthesizeCinema}
                  disabled={isSynthesizingCinema}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs transition-all cursor-pointer shadow-lg shadow-rose-500/20 disabled:opacity-40"
                >
                  <Sparkles className={`w-4 h-4 ${isSynthesizingCinema ? 'animate-spin' : ''}`} />
                  <span>{isSynthesizingCinema ? 'Đang Sản Xuất Phim...' : '🚀 Biên Kịch Phim 1-Click'}</span>
                </button>
              </div>

              {/* Quick Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Câu Ý Tưởng Kịch Bản Phim:</label>
                  <input
                    type="text"
                    value={cinemaIdeaPrompt}
                    onChange={(e) => setCinemaIdeaPrompt(e.target.value)}
                    placeholder="Nhập 1 câu ý tưởng phim..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Phong Cách Thể Loại:</label>
                  <select
                    value={cinemaGenreStyle}
                    onChange={(e) => setCinemaGenreStyle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="cyberpunk_scifi">Cyberpunk Sci-Fi Tương Lai</option>
                    <option value="space_epic">Space Epic Sử Thi Không Gian</option>
                    <option value="anime_action">Anime Action Chiến Đấu</option>
                    <option value="hollywood_thriller">Hollywood Thriller Hồi Hộp</option>
                    <option value="tech_doc">Tech Doc Phim Tài Liệu</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Tỷ Lệ Khung Hình:</label>
                  <select
                    value={cinemaAspectRatio}
                    onChange={(e) => setCinemaAspectRatio(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="16:9">16:9 (Màn Ảnh Rộng / YouTube)</option>
                    <option value="9:16">9:16 (TikTok / Reels / Shorts)</option>
                    <option value="1:1">1:1 (Square Video Feed)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Storyboard 5 Scenes Display */}
          {synthesizedCinema && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-white uppercase">{synthesizedCinema.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    Tổng thời lượng: {synthesizedCinema.totalDurationSec} giây · 5 Phân cảnh điện ảnh · WebAudio Synth {synthesizedCinema.webAudioSynthPreset.chordsBpm} BPM
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      speak(synthesizedCinema.fullScriptNarration, 'talking');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-bold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Đọc Thuyết Minh Toàn Bộ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(synthesizedCinema.ffmpegRenderCommand);
                      setCopiedCinemaCommand(true);
                      setTimeout(() => setCopiedCinemaCommand(false), 2000);
                      glaciaAudio.playCrystalChime(1046.5);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    {copiedCinemaCommand ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCinemaCommand ? 'Đã Copy FFmpeg' : 'Sao Chép Lệnh Render'}</span>
                  </button>
                </div>
              </div>

              {/* 5 Scenes Carousel Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {synthesizedCinema.shots.map((shot) => (
                  <div key={shot.shotNumber} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                          Cảnh {shot.shotNumber} ({shot.durationSec}s)
                        </span>
                        <Camera className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <h5 className="text-xs font-black text-white">{shot.captionTitle}</h5>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">
                        "{shot.scriptVoiceoverVi}"
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-900">
                      <div className="text-[9px] text-slate-400 font-mono truncate">
                        🎥 Góc: {shot.cameraMovement}
                      </div>
                      <button
                        type="button"
                        onClick={() => speak(shot.scriptVoiceoverVi, 'talking')}
                        className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Nghe Cảnh Này</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 18: REALTIME DUPLEX VOICE INTERACTION ── */}
      {studioMode === 'duplex_voice' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    <Mic2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      🎙️ Đàm Thoại Giọng Nói Hai Chiều Tức Thì (Realtime Duplex Voice)
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono font-bold">
                        Latency &lt;150ms
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Kênh đàm thoại tự nhiên với Glacia, hỗ trợ ngắt lời tức thì (Barge-In) và điều biến ngữ điệu tiếng Việt thông minh.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Duplex Online
                  </span>
                </div>
              </div>

              {/* Audio Wave Visualizer Simulation */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-1 h-20">
                {[40, 65, 30, 85, 95, 45, 70, 100, 60, 40, 80, 90, 50, 75, 35, 90, 60, 40].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${isDuplexTalking ? h : Math.max(12, h * 0.25)}%` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-teal-500 to-cyan-400 transition-all duration-150"
                  />
                ))}
              </div>

              {/* Action Form */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={duplexVoiceInput}
                  onChange={(e) => setDuplexVoiceInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendDuplexVoiceQuery()}
                  placeholder="Nói hoặc nhập khẩu lệnh gửi tới Glacia..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-teal-400"
                />
                <button
                  type="button"
                  onClick={() => handleSendDuplexVoiceQuery()}
                  disabled={isDuplexTalking || !duplexVoiceInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-teal-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Mic2 className="w-4 h-4" />
                  <span>Gửi Khẩu Lệnh</span>
                </button>
              </div>

              {/* Quick Prompt Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-bold">Khẩu Lệnh Mẫu:</span>
                {[
                  'Báo cáo tiến độ ca đêm của Glacia',
                  'Tạo game 3D không gian vũ trụ mới',
                  'Biên kịch 1 thước phim khoa học viễn tưởng',
                  'Chuyển sang chế độ AI Offline $0 chi phí',
                ].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => handleSendDuplexVoiceQuery(cmd)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 text-[10px] font-bold cursor-pointer transition-all"
                  >
                    › {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conversation Timeline */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Dòng Thời Gian Hội Thoại (Live Voice Stream Transcripts):
            </span>
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {voiceTranscripts.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl flex items-start gap-3 ${
                    t.sender === 'user'
                      ? 'bg-slate-900 border border-slate-800 text-slate-200 ml-8'
                      : 'bg-teal-950/30 border border-teal-500/30 text-teal-100 mr-8'
                  }`}
                >
                  <div className="font-bold text-xs shrink-0">
                    {t.sender === 'user' ? '👤 Founder David Bao:' : '🤖 Robot Glacia:'}
                  </div>
                  <div className="text-xs leading-relaxed flex-1">{t.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


