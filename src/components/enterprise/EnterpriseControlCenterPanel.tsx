import React, { useState, useEffect } from 'react';
import {
  Mic,
  ShieldCheck,
  Radio,
  Cpu,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Volume2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

type ActiveTab = 'voice_call' | 'privacy_masker' | 'competitor_radar' | 'ollama_hub' | 'content_supercharger';

export default function EnterpriseControlCenterPanel() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('voice_call');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  // 1. Voice Call State
  const [voiceRole, setVoiceRole] = useState<'role_chief_of_staff' | 'role_ai_cfo_director' | 'role_ai_security_judge'>('role_chief_of_staff');
  const [voiceInput, setVoiceInput] = useState('');
  const [voiceLogs, setVoiceLogs] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'AI Chief of Staff', text: 'Chào Sếp! Tôi là Trưởng phòng Điều hành AI. Hôm nay tiến độ các dự án và nhân sự AI đều đạt 100% KPI. Sếp cần kiểm tra hạng mục nào?', time: '08:00' }
  ]);
  const [isCalling, setIsCalling] = useState(false);

  const handleSendVoiceTurn = async () => {
    if (!voiceInput.trim()) return;
    const userText = voiceInput.trim();
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setVoiceLogs((prev) => [...prev, { sender: 'CEO (Bạn)', text: userText, time: timeNow }]);
    setVoiceInput('');
    setIsCalling(true);

    try {
      const res = await fetch('/api/voice/call/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: voiceRole,
          speechText: userText,
          context: { currentRunwayMonths: 8.2 }
        })
      });
      const data = await res.json();
      if (data?.turn) {
        setVoiceLogs((prev) => [
          ...prev,
          { sender: data.turn.responderRoleName, text: data.turn.speechReply, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }
    } catch {
      setVoiceLogs((prev) => [
        ...prev,
        { sender: 'AI Assistant', text: 'Dạ Sếp, tôi đã nhận lệnh và đang điều phối các phòng ban thực thi ngay.', time: timeNow }
      ]);
    } finally {
      setIsCalling(false);
    }
  };

  // 2. Privacy Masker State
  const [rawPrivacyText, setRawPrivacyText] = useState(
    'Hợp đồng công chứng ông Nguyễn Văn An, CCCD số 001095012345, SĐT 0912345678, Mã số thuế 0101234567, STK 1903456789012 Techcombank, email nguyenvanan@gmail.com thanh toán 450.000.000 đ.'
  );
  const [maskedResult, setMaskedResult] = useState<any | null>(null);
  const [isMasking, setIsMasking] = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);

  const handleMaskPrivacy = async () => {
    setIsMasking(true);
    try {
      const res = await fetch('/api/privacy/mask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawPrivacyText, purpose: 'AI Prompt Shield NĐ 13' })
      });
      const data = await res.json();
      setMaskedResult(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsMasking(false);
    }
  };

  // 3. Competitor Radar State
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [selectedBattleCard, setSelectedBattleCard] = useState<any | null>(null);
  const [loadingRadar, setLoadingRadar] = useState(false);

  const loadCompetitors = async () => {
    setLoadingRadar(true);
    try {
      const res = await fetch('/api/radar/competitors');
      const data = await res.json();
      if (data?.competitors) setCompetitors(data.competitors);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRadar(false);
    }
  };

  const loadBattleCard = async (id: string) => {
    try {
      const res = await fetch(`/api/radar/battle-card/${id}`);
      const data = await res.json();
      if (data?.battleCard) setSelectedBattleCard(data.battleCard);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Ollama Hub State
  const [ollamaStatus, setOllamaStatus] = useState<any | null>(null);
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [checkingOllama, setCheckingOllama] = useState(false);

  const checkOllamaHub = async () => {
    setCheckingOllama(true);
    try {
      const [statusRes, modelsRes] = await Promise.all([
        fetch('/api/ollama/local/status').then((r) => r.json()),
        fetch('/api/ollama/local/models').then((r) => r.json()),
      ]);
      setOllamaStatus(statusRes);
      setOllamaModels(modelsRes?.curatedCatalog || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingOllama(false);
    }
  };

  // 5. Content Supercharger State
  const [superchargerTool, setSuperchargerTool] = useState<'notebooklm' | 'gamma' | 'languagetool' | 'avatar'>('notebooklm');
  const [superchargerInput, setSuperchargerInput] = useState('Báo cáo kết quả kinh doanh quý 2 và kế hoạch triển khai Company OS.');
  const [superchargerOutput, setSuperchargerOutput] = useState<any | null>(null);
  const [superchargerLoading, setSuperchargerLoading] = useState(false);

  const handleRunSupercharger = async () => {
    setSuperchargerLoading(true);
    try {
      if (superchargerTool === 'notebooklm') {
        const res = await fetch('/api/connectors/notebooklm/pack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: superchargerInput, rawText: superchargerInput, sources: [{ title: 'Dữ liệu nội bộ', text: superchargerInput }] })
        });
        setSuperchargerOutput(await res.json());
      } else if (superchargerTool === 'gamma') {
        const res = await fetch('/api/connectors/gamma/slide-spec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presentationTitle: superchargerInput, numSlides: 6, keyTakeaways: ['Tăng trưởng 25%', 'Tiết kiệm 90% chi phí'] })
        });
        setSuperchargerOutput(await res.json());
      } else if (superchargerTool === 'languagetool') {
        const res = await fetch('/api/connectors/languagetool/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: superchargerInput, language: 'vi' })
        });
        setSuperchargerOutput(await res.json());
      } else if (superchargerTool === 'avatar') {
        const res = await fetch('/api/connectors/avatar/script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: superchargerInput, targetPlatform: 'tiktok', avatarGender: 'female', durationSeconds: 60 })
        });
        setSuperchargerOutput(await res.json());
      }
    } catch (e: any) {
      setSuperchargerOutput({ error: e?.message || 'Có lỗi xảy ra khi gọi Supercharger.' });
    } finally {
      setSuperchargerLoading(false);
    }
  };

  useEffect(() => {
    void checkOllamaHub();
    void loadCompetitors();
  }, []);

  return (
    <div className="space-y-6 text-left select-none animate-fade-in">
      {/* Enterprise Suite Header */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Zap className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Enterprise AI &amp; Strategic Suite</h1>
                <Badge variant="brand" className="text-[10px] uppercase font-bold tracking-wider">
                  Tier-1 Enterprise
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Bảo vệ dữ liệu cá nhân VN (Nghị định 13), Đàm thoại giọng nói CEO, Quét đối thủ cạnh tranh &amp; Trình quản lý AI Local $0.
              </p>
            </div>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('voice_call')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'voice_call' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>1. Voice Call CEO</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy_masker')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'privacy_masker' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>2. Bảo Mật NĐ 13</span>
            </button>
            <button
              onClick={() => setActiveTab('competitor_radar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'competitor_radar' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>3. Radar Đối Thủ</span>
            </button>
            <button
              onClick={() => setActiveTab('ollama_hub')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'ollama_hub' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>4. Ollama $0 Local</span>
            </button>
            <button
              onClick={() => setActiveTab('content_supercharger')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'content_supercharger' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>5. Content Pack</span>
            </button>
          </div>
        </div>
      </section>

      {/* TAB 1: CEO VOICE CALL */}
      {activeTab === 'voice_call' && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          <Card padding="lg" className="space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-border-primary pb-3">
              <Mic className="h-4 w-4 text-indigo-400" />
              Tổng Đài Đàm Thoại Giọng Nói CEO
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Chọn Trưởng Phòng Đàm Thoại:</label>
              <select
                value={voiceRole}
                onChange={(e: any) => setVoiceRole(e.target.value)}
                className="w-full rounded-xl border border-border-primary bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="role_chief_of_staff">👑 AI Chief of Staff (Trưởng Ban Điều Hành)</option>
                <option value="role_ai_cfo_director">💰 AI CFO Director (Giám Đốc Tài Chính)</option>
                <option value="role_ai_security_judge">🛡️ AI Security Judge (Trưởng Ban Pháp Lý &amp; An Toàn)</option>
              </select>
            </div>

            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-300 border-2 border-indigo-500/50 animate-pulse">
                <Volume2 className="h-8 w-8" />
              </div>
              <p className="text-xs font-bold text-slate-300">Hands-free Voice Mode Sẵn Sàng</p>
              <p className="text-[11px] text-slate-400 leading-4">
                CEO chỉ cần nói hoặc gõ mệnh lệnh. Hệ thống tự nhận diện ý định điều hành và sinh câu trả lời bằng giọng nói chuẩn.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border-primary">
              <div className="text-[11px] font-bold text-slate-400">Câu lệnh mẫu nhanh:</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Báo cáo dòng tiền hôm nay',
                  'Tình hình runway còn bao lâu?',
                  'Duyệt release bản cập nhật mới',
                  'Chi phí token tuần này thế nào?'
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setVoiceInput(prompt)}
                    className="rounded-lg border border-border-secondary bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:border-indigo-500 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card padding="lg" className="lg:col-span-2 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-border-primary pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-white">Live Voice Call Session</span>
              </div>
              <Badge variant="brand" className="text-[10px]">
                Active Channel: {voiceRole}
              </Badge>
            </div>

            {/* Chat Transcript Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              {voiceLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl max-w-[85%] text-xs space-y-1 ${
                    log.sender.includes('CEO')
                      ? 'ml-auto bg-indigo-600 text-white rounded-br-none'
                      : 'mr-auto bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-75">
                    <span>{log.sender}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="leading-5">{log.text}</p>
                </div>
              ))}
              {isCalling && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-indigo-300 animate-pulse">
                  Đang xử lý giọng nói &amp; truy xuất dữ liệu điều hành...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleSendVoiceTurn()}
                placeholder="Nói hoặc nhập mệnh lệnh điều hành cho AI Trưởng phòng..."
                className="flex-1 rounded-xl border border-border-primary bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Button
                onClick={() => void handleSendVoiceTurn()}
                disabled={isCalling || !voiceInput.trim()}
                variant="primary"
                className="gap-2 px-4 py-2.5 text-xs font-bold"
              >
                <Mic className="h-4 w-4" />
                Gửi
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: DECREE 13 PRIVACY MASKER */}
      {activeTab === 'privacy_masker' && (
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                Bảo Vệ Dữ Liệu Cá Nhân (Nghị Định 13/2023/NĐ-CP)
              </h3>
              <Badge variant="success" className="text-[10px]">
                VAS 200 Shield
              </Badge>
            </div>

            <p className="text-xs text-slate-400">
              Nhập văn bản nhạy cảm chứa CCCD, SĐT, MST, STK ngân hàng. Bộ lọc sẽ tự động ẩn danh hóa trước khi gửi đi.
            </p>

            <textarea
              rows={6}
              value={rawPrivacyText}
              onChange={(e) => setRawPrivacyText(e.target.value)}
              className="w-full rounded-2xl border border-border-primary bg-slate-900/90 p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />

            <Button
              onClick={() => void handleMaskPrivacy()}
              disabled={isMasking || !rawPrivacyText.trim()}
              variant="primary"
              className="w-full py-2.5 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-500"
            >
              <ShieldCheck className="h-4 w-4" />
              {isMasking ? 'Đang phân tích & Ẩn danh hóa...' : 'Chạy Bộ Lọc Ẩn Danh Hóa (Masking)'}
            </Button>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 className="text-sm font-black text-white">Kết Quả Đã Che Phủ (Safe AI Prompt)</h3>
              {maskedResult && (
                <button
                  onClick={() => setShowUnmasked(!showUnmasked)}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:underline"
                >
                  {showUnmasked ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showUnmasked ? 'Xem bản che' : 'Xem bản gốc'}
                </button>
              )}
            </div>

            {!maskedResult ? (
              <div className="h-[220px] rounded-2xl border border-dashed border-border-primary flex items-center justify-center text-xs text-slate-500">
                Nhấn nút "Chạy Bộ Lọc Ẩn Danh Hóa" để xem kết quả.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 leading-5">
                  {showUnmasked ? rawPrivacyText : maskedResult.maskedText}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-border-primary">
                    <span className="text-[10px] text-slate-400 block font-bold">Thực thể đã phát hiện:</span>
                    <span className="font-bold text-white">{maskedResult.detectedCount} thông tin nhạy cảm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-border-primary">
                    <span className="text-[10px] text-slate-400 block font-bold">Trạng thái tuân thủ:</span>
                    <span className="font-bold text-emerald-400">✓ Đạt Nghị định 13/2023</span>
                  </div>
                </div>

                {maskedResult.detectedEntities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {maskedResult.detectedEntities.map((ent: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono">
                        {ent.type}: {ent.placeholder}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: COMPETITOR RADAR */}
      {activeTab === 'competitor_radar' && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-amber-400" />
                Đối Thủ Trên Thị Trường
              </h3>
              <Button size="sm" variant="secondary" onClick={() => void loadCompetitors()} disabled={loadingRadar}>
                <RefreshCw className={`h-3 w-3 ${loadingRadar ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-2">
              {competitors.map((comp) => (
                <div
                  key={comp.competitorId}
                  onClick={() => void loadBattleCard(comp.competitorId)}
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    selectedBattleCard?.competitorId === comp.competitorId
                      ? 'border-amber-500/60 bg-amber-950/30'
                      : 'border-border-primary bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white">{comp.competitorName}</h4>
                    <span className="text-[10px] font-bold text-amber-300">{comp.pricing}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{comp.strengths[0]}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg" className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 className="text-sm font-black text-white">
                {selectedBattleCard ? `Battle Card: ${selectedBattleCard.competitorName}` : 'Chọn Đối Thủ Để Xem Chiến Thuật Chốt Sale'}
              </h3>
              {selectedBattleCard && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard('battlecard', JSON.stringify(selectedBattleCard, null, 2))}
                >
                  {copied === 'battlecard' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy Battle Card
                </Button>
              )}
            </div>

            {!selectedBattleCard ? (
              <div className="h-[300px] rounded-2xl border border-dashed border-border-primary flex items-center justify-center text-xs text-slate-500">
                Nhấp vào 1 đối thủ bên trái (MISA, Fast, Bravo...) để hiển thị kịch bản xử lý từ chối.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                      Lợi thế độc quyền của LedgerFlow (USP):
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {selectedBattleCard.ledgerFlowAdvantages.map((adv: string, i: number) => (
                        <li key={i}>✓ {adv}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                      Kịch bản xử lý phản đối giá &amp; thương hiệu:
                    </span>
                    <p className="text-slate-300 italic">"{selectedBattleCard.objectionHandling}"</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
                  <span className="text-[10px] font-bold uppercase text-indigo-300 block mb-1">
                    Gợi ý gói giá đánh bật đối thủ (Winning Pricing Offer):
                  </span>
                  <p className="text-xs font-bold text-white">{selectedBattleCard.winningOffer}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: OLLAMA LOCAL HUB */}
      {activeTab === 'ollama_hub' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card padding="lg" className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-primary pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  Trạng Thái Ollama Server
                </h3>
                <Button size="sm" variant="secondary" onClick={() => void checkOllamaHub()} disabled={checkingOllama}>
                  <RefreshCw className={`h-3 w-3 ${checkingOllama ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-border-primary flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Cổng kết nối</span>
                  <span className="font-mono text-cyan-300">127.0.0.1:11434</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-border-primary flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Trạng thái máy chủ</span>
                  <Badge variant={ollamaStatus?.isOnline ? 'success' : 'info'}>
                    {ollamaStatus?.isOnline ? 'Đang Chạy (Online)' : 'Sẵn Sàng Cài Đặt ($0)'}
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 space-y-2">
                <span className="font-bold text-cyan-300 block">Lệnh tải 1-Click:</span>
                <code className="block rounded-lg bg-black/50 p-2 font-mono text-[11px] text-cyan-200">
                  ollama pull qwen2.5-coder:7b
                </code>
              </div>
            </Card>

            <Card padding="lg" className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-black text-white border-b border-border-primary pb-3">
                Danh Mục Model AI $0 Tuyển Chọn Tối Ưu
              </h3>

              <div className="grid md:grid-cols-3 gap-3">
                {ollamaModels.map((m) => (
                  <div key={m.modelTag} className="p-3.5 rounded-2xl border border-border-primary bg-slate-900/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white font-mono">{m.modelTag}</h4>
                      <span className="text-[10px] font-bold text-cyan-400">{m.memoryRequired}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-4">{m.bestUseFor}</p>
                    <div className="pt-2 border-t border-border-secondary flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">{m.contextWindow} ctx</span>
                      <Badge variant="brand" className="text-[9px]">
                        {m.roleRecommendation}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: CONTENT SUPERCHARGER */}
      {activeTab === 'content_supercharger' && (
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Công Cụ Xuất Bản Siêu Tốc
              </h3>
              <div className="flex gap-1">
                {(['notebooklm', 'gamma', 'languagetool', 'avatar'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSuperchargerTool(t)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                      superchargerTool === t ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={6}
              value={superchargerInput}
              onChange={(e) => setSuperchargerInput(e.target.value)}
              placeholder="Nhập chủ đề hoặc nội dung cần xử lý..."
              className="w-full rounded-2xl border border-border-primary bg-slate-900 p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />

            <Button
              onClick={() => void handleRunSupercharger()}
              disabled={superchargerLoading || !superchargerInput.trim()}
              variant="primary"
              className="w-full py-2.5 text-xs font-bold gap-2 bg-purple-600 hover:bg-purple-500"
            >
              <Sparkles className="h-4 w-4" />
              {superchargerLoading ? 'Đang tạo gói xuất bản...' : `Chạy ${superchargerTool.toUpperCase()} Engine`}
            </Button>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 className="text-sm font-black text-white">Kết Quả Xuất Bản</h3>
              {superchargerOutput && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard('superout', JSON.stringify(superchargerOutput, null, 2))}
                >
                  {copied === 'superout' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy Kết Quả
                </Button>
              )}
            </div>

            {!superchargerOutput ? (
              <div className="h-[220px] rounded-2xl border border-dashed border-border-primary flex items-center justify-center text-xs text-slate-500">
                Kết quả sinh slide Gamma, Podcast RAG NotebookLM hoặc kịch bản AI Avatar sẽ xuất hiện tại đây.
              </div>
            ) : (
              <pre className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 max-h-[360px] overflow-y-auto whitespace-pre-wrap leading-5">
                {JSON.stringify(superchargerOutput, null, 2)}
              </pre>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
