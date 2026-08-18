import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Share2,
  Users,
  Gamepad2,
  Package,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Activity,
  Terminal,
  Send,
  Download,
  Copy,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function AutonomousFlywheelCockpit() {
  const [activeTab, setActiveTab] = useState<'voice' | 'viral_lead' | 'playtest' | 'packager'>('voice');

  // 1. Voice Commander state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('Kiểm tra doanh thu và hóa đơn hôm nay');
  const [voiceResult, setVoiceResult] = useState<any | null>(null);

  // 2. Viral & Lead CRM state
  const [schedules, setSchedules] = useState<any[]>([]);
  const [leadName, setLeadName] = useState('Trần Hoàng Bách');
  const [leadEmail, setLeadEmail] = useState('bach.tran@techcorp.vn');
  const [leadPhone, setLeadPhone] = useState('0912345678');
  const [leadCompany, setLeadCompany] = useState('TechCorp Vietnam');
  const [leadBudget, setLeadBudget] = useState('15000000');
  const [leadResult, setLeadResult] = useState<any | null>(null);

  // 3. Playtest state
  const [gameTitle, setGameTitle] = useState('Cyber Ninja 2026');
  const [gameGenre, setGameGenre] = useState<'2d_platformer' | 'rpg_puzzle' | 'hyper_casual'>('2d_platformer');
  const [simulatedRuns, setSimulatedRuns] = useState(1000);
  const [playtestReport, setPlaytestReport] = useState<any | null>(null);

  // 4. Packager state
  const [appName, setAppName] = useState('LedgerFlow-Studio');
  const [version, setVersion] = useState('1.0.0');
  const [packagerManifest, setPackagerManifest] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/flywheel/publish/schedules').then((r) => r.json());
      if (res.success) setSchedules(res.schedules);
    } catch (err) {
      console.error('[Flywheel] load schedules error:', err);
    }
  }, []);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  // Voice recording simulation or Web Speech API
  const handleToggleRecord = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt không hỗ trợ Web Speech API trực tiếp, bạn có thể gõ văn bản và bấm gửi lệnh giọng nói.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        setIsRecording(false);
        void handleSendVoiceCommand(transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
    } else {
      setIsRecording(false);
      recognition.stop();
    }
  };

  const handleSendVoiceCommand = async (textToSend?: string) => {
    const transcript = textToSend || voiceTranscript;
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/flywheel/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      }).then((r) => r.json());
      if (res.success) setVoiceResult(res.result);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateInboundLead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flywheel/lead/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadName,
          email: leadEmail,
          phone: leadPhone,
          companyName: leadCompany,
          interestedProduct: 'software_os',
          monthlyBudgetVnd: Number(leadBudget),
          sourceChannel: 'tiktok',
          messageNote: 'Tôi muốn tích hợp AI và đối soát VietQR cho công ty phần mềm của mình.',
        }),
      }).then((r) => r.json());
      if (res.success) setLeadResult(res.result);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPlaytest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flywheel/game/playtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameTitle, genre: gameGenre, totalSimulatedRuns: simulatedRuns }),
      }).then((r) => r.json());
      if (res.success) setPlaytestReport(res.report);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePackagerManifest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flywheel/package/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          version,
          targets: ['windows_exe', 'android_apk', 'saas_web'],
        }),
      }).then((r) => r.json());
      if (res.success) setPackagerManifest(res.manifest);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-amber-500/20 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-rose-500/30 text-amber-300 border border-amber-500/40 shadow-inner">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Autonomous Flywheel Command Center</h2>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/30">
                Tự Vận Hành 95%
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Điều khiển qua giọng nói/Telegram, phân phối nội dung hút khách hàng, tự động playtest game và đóng gói 1-Click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 animate-pulse" /> Flywheel Active
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 w-fit backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('voice')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'voice' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mic className="h-4 w-4" /> 1. Voice-to-Command &amp; Telegram
        </button>
        <button
          onClick={() => setActiveTab('viral_lead')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'viral_lead' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="h-4 w-4" /> 2. Auto-Publisher &amp; CRM Lead Ingestion
        </button>
        <button
          onClick={() => setActiveTab('playtest')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'playtest' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="h-4 w-4" /> 3. AI Game Playtester (1000 Runs)
        </button>
        <button
          onClick={() => setActiveTab('packager')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'packager' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="h-4 w-4" /> 4. 1-Click Multi-Platform Packager
        </button>
      </div>

      {/* TAB 1: VOICE COMMANDER */}
      {activeTab === 'voice' && (
        <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Mic className="h-4 w-4 text-amber-400" /> Điều Khiển Doanh Nghiệp Bằng Giọng Nói Tiếng Việt &amp; Telegram Bot
            </h3>
            <span className="text-[11px] text-slate-400">Hỗ trợ Web Mic &amp; Telegram Voice Notes</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleRecord}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black transition cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-amber-600 text-white hover:bg-amber-500'
              }`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Đang lắng nghe... (Nói tiếng Việt)' : 'Bấm Nói Lệnh (Microphone)'}
            </button>
            <div className="flex-1 min-w-[280px] flex gap-2">
              <input
                type="text"
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder="Hoặc gõ lệnh: 'Kiểm tra doanh thu', 'Tạo kịch bản video', 'Playtest game'..."
                className="flex-1 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <button
                onClick={() => handleSendVoiceCommand()}
                disabled={loading || !voiceTranscript.trim()}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-black text-white hover:bg-slate-700 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {voiceResult && (
            <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300">Ý định: {voiceResult.intent} ({voiceResult.suggestedActionTitle})</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                  voiceResult.executionStatus === 'executed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  Trạng thái: {voiceResult.executionStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300">{voiceResult.executionResult?.message}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VIRAL AUTO-PUBLISHER & LEAD CRM */}
      {activeTab === 'viral_lead' && (
        <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Share2 className="h-4 w-4 text-cyan-400" /> Lịch Phân Phối Video Tự Động &amp; Hút Khách Hàng CRM
            </h3>
          </div>

          {/* Schedule list */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 block uppercase">Hàng đợi xuất bản đa kênh:</span>
            <div className="grid md:grid-cols-2 gap-3">
              {schedules.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border-secondary bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{s.title}</span>
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                      ~{s.viewsEstimated.toLocaleString()} views
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{s.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {s.channels.map((c: string) => (
                      <span key={c} className="rounded bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                        #{c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inbound Lead Simulator */}
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Mô phỏng Webhook Khách Hàng Tiềm Năng (AI Lead Scoring)
              </span>
              <button
                onClick={handleSimulateInboundLead}
                disabled={loading}
                className="rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-black text-white hover:bg-cyan-500 cursor-pointer disabled:opacity-50"
              >
                Gửi Lead Thử Nghiệm
              </button>
            </div>
            <div className="grid sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Tên khách..."
                className="rounded-lg border border-border-secondary bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="Email..."
                className="rounded-lg border border-border-secondary bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="SĐT..."
                className="rounded-lg border border-border-secondary bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                value={leadCompany}
                onChange={(e) => setLeadCompany(e.target.value)}
                placeholder="Công ty..."
                className="rounded-lg border border-border-secondary bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            {leadResult && (
              <div className="rounded-xl bg-slate-900 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-400">
                    Điểm AI: {leadResult.score}/100 ({leadResult.qualification})
                  </span>
                  <p className="text-[11px] text-slate-300">{leadResult.autoActionTaken}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  ✓ Đã lưu vào SQLite CRM
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PLAYTEST SIMULATOR */}
      {activeTab === 'playtest' && (
        <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-emerald-400" /> Robot AI Playtester &amp; Đo Độ Ổn Định FPS Game
            </h3>
            <button
              onClick={handleRunPlaytest}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
            >
              Chạy 1.000 Lượt Thử Nghiệm
            </button>
          </div>

          <div className="grid sm:grid-cols-12 gap-3">
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="Tên game..."
              className="sm:col-span-6 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
            />
            <select
              value={gameGenre}
              onChange={(e) => setGameGenre(e.target.value as any)}
              className="sm:col-span-6 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-white"
            >
              <option value="2d_platformer">2D Platformer</option>
              <option value="rpg_puzzle">RPG Puzzle</option>
              <option value="hyper_casual">Hyper Casual</option>
            </select>
          </div>

          {playtestReport && (
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-900 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tỷ lệ thắng (Winrate)</span>
                  <span className="text-lg font-black text-emerald-400">{playtestReport.winRatePercent}%</span>
                </div>
                <div className="rounded-xl bg-slate-900 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Thời gian qua màn trung bình</span>
                  <span className="text-lg font-black text-cyan-400">{playtestReport.averageClearTimeSec}s</span>
                </div>
                <div className="rounded-xl bg-slate-900 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ ổn định Framerate</span>
                  <span className="text-lg font-black text-purple-400">{playtestReport.fpsMetrics.averageFps} FPS ({playtestReport.fpsMetrics.framerateStabilityScore}/100)</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-300 block uppercase">💡 Đề xuất tự động cân bằng gameplay:</span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {playtestReport.autoTuningSuggestions.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: 1-CLICK MULTI-PLATFORM PACKAGER */}
      {activeTab === 'packager' && (
        <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-400" /> Đóng Gói Bộ Cài Đặt 1-Click (.EXE Windows, .APK Android &amp; Web)
            </h3>
            <button
              onClick={handleGeneratePackagerManifest}
              disabled={loading}
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white hover:bg-purple-500 cursor-pointer disabled:opacity-50"
            >
              Sinh Kịch Bản Đóng Gói
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Tên ứng dụng..."
              className="rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
            />
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Phiên bản..."
              className="rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          {packagerManifest && (
            <div className="rounded-2xl border border-purple-500/30 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300">Manifest: {packagerManifest.appName} v{packagerManifest.version}</span>
                <button
                  onClick={() => copyToClipboard(packagerManifest.automatedBatchScript, 'pkg_bat')}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied === 'pkg_bat' ? 'Đã sao chép!' : 'Copy File BUILD.bat'}
                </button>
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                {packagerManifest.targets.map((t: any) => (
                  <div key={t.target} className="rounded-xl bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase text-cyan-300 block">{t.target.replace('_', ' ')}</span>
                    <span className="text-xs font-mono text-white block">{t.outputArtifactName}</span>
                    <span className="text-[10px] text-slate-400">Thời gian ước tính: ~{t.estimatedBuildTimeSec}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
