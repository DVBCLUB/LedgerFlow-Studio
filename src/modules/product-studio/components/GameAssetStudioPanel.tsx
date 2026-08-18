import { useState, useEffect } from 'react';
import { Gamepad2, Sparkles, Volume2, ShieldCheck, CheckCircle2, XCircle, Play, Layers, Sword, BookOpen, Sliders } from 'lucide-react';

interface GameAssetBundle {
  id: string;
  gameId: string;
  assetName: string;
  category: string;
  genre: string;
  style: string;
  conceptArt: {
    prompt: string;
    negativePrompt: string;
    suggestedModel: string;
    aspectRatio: string;
    paletteColors: string[];
    description: string;
  };
  spriteSpec: {
    dimensions: string;
    frameAnimations: Array<{ animName: string; frameCount: number; loop: boolean }>;
    colorPalette: string[];
    gridCols: number;
    gridRows: number;
  };
  audioSpec: {
    sfxPrompt: string;
    bgmPrompt?: string;
    sfxCategory: string;
    webAudioSynthCode?: string;
  };
  dialogueAndLore: {
    loreSnippet: string;
    greetingDialogue: string;
    combatQuote?: string;
    defeatQuote?: string;
    questDialogue?: string;
  };
  statBalance: {
    tier: 'common' | 'rare' | 'epic' | 'legendary';
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    goldCost: number;
    craftingMaterials: Array<{ materialName: string; quantity: number }>;
  };
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: string;
}

export default function GameAssetStudioPanel() {
  const [bundles, setBundles] = useState<GameAssetBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<GameAssetBundle | null>(null);
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('character');
  const [genre, setGenre] = useState('rpg');
  const [style, setStyle] = useState('pixel_16bit');
  const [customReq, setCustomReq] = useState('');
  const [preferLocal, setPreferLocal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadBundles = async () => {
    try {
      const res = await fetch('/api/game-asset/bundles').then((r) => r.json());
      if (res.success) {
        setBundles(res.bundles || []);
        if (res.bundles.length > 0 && !selectedBundle) {
          setSelectedBundle(res.bundles[0]);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadBundles();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      setError('Vui lòng nhập tên tài sản game.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/game-asset/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetName,
          category,
          genre,
          style,
          customRequirements: customReq,
          preferLocal,
        }),
      }).then((r) => r.json());

      if (res.success && res.bundle) {
        setBundles((prev) => [res.bundle, ...prev]);
        setSelectedBundle(res.bundle);
        setSuccessMsg(`Đã tạo thành công bộ tài sản 5-giai đoạn cho "${res.bundle.assetName}"!`);
        setAssetName('');
        setCustomReq('');
      } else {
        setError(res.error || 'Có lỗi xảy ra khi tạo tài sản game.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/game-asset/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, approvedBy: 'Game Studio Lead' }),
      }).then((r) => r.json());

      if (res.success && res.bundle) {
        setBundles((prev) => prev.map((b) => (b.id === id ? res.bundle : b)));
        if (selectedBundle?.id === id) setSelectedBundle(res.bundle);
      }
    } catch {
      // ignore
    }
  };

  const playSynthesizedSfx = (synthCode?: string) => {
    if (!synthCode) return;
    try {
      // eslint-disable-next-line no-eval
      const runFn = new Function(synthCode);
      runFn();
    } catch {
      // WebAudio preview fallback
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.25);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch {
        // audio disabled
      }
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/70 via-slate-900/80 to-purple-950/50 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/20 p-2.5 text-indigo-300 border border-indigo-500/30 shadow-inner">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                Pipeline AI Hạng Nhất
              </span>
              <span className="text-[10px] text-text-tertiary">Game Asset Production 5-in-1</span>
            </div>
            <h2 className="text-lg font-black text-white">Xưởng Sản Xuất Tài Sản Game Tự Động</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="rounded-xl bg-slate-950/80 px-3 py-1.5 text-slate-300 border border-border-primary">
            Tổng tài sản: <strong className="text-white">{bundles.length}</strong>
          </span>
          <span className="rounded-xl bg-emerald-500/10 px-3 py-1.5 text-emerald-300 border border-emerald-500/20">
            Đã duyệt: <strong className="text-emerald-200">{bundles.filter((b) => b.status === 'approved').length}</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Generator Form & Asset List */}
        <div className="space-y-5 lg:col-span-4">
          <form onSubmit={handleGenerate} className="rounded-2xl border border-border-primary bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center gap-2 font-black text-xs uppercase text-text-primary">
              <Sparkles className="h-4 w-4 text-violet-300" />
              <span>Khởi tạo tài sản Game mới</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary">Tên nhân vật / Vật phẩm</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="VD: Kiếm Băng Long Vực, Mage Lôi Điện..."
                className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-text-tertiary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-text-secondary">Danh mục</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-2.5 py-1.5 text-xs text-white">
                  <option value="character">Nhân vật (Hero)</option>
                  <option value="monster">Quái vật (Boss/Mob)</option>
                  <option value="item_weapon">Vũ khí / Trang bị</option>
                  <option value="environment">Môi trường / Map</option>
                  <option value="spell_fx">Phép thuật (Spell FX)</option>
                  <option value="npc_quest">NPC Nhiệm vụ</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-secondary">Thể loại Game</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)} className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-2.5 py-1.5 text-xs text-white">
                  <option value="rpg">RPG Nhập vai</option>
                  <option value="strategy">Chiến thuật (SLG)</option>
                  <option value="roguelike">Roguelike</option>
                  <option value="platformer">Platformer 2D</option>
                  <option value="casual">Casual / Puzzle</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary">Phong cách đồ họa</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-2.5 py-1.5 text-xs text-white">
                <option value="pixel_16bit">Pixel Art 16-bit Retro</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="dark_fantasy">Dark Fantasy U ám</option>
                <option value="anime_chibi">Anime Chibi Đáng yêu</option>
                <option value="voxel_3d">Voxel 3D Isometric</option>
                <option value="stylized_flat">Stylized Flat Vector</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary">Yêu cầu thiết kế đặc biệt</label>
              <textarea
                value={customReq}
                onChange={(e) => setCustomReq(e.target.value)}
                placeholder="VD: Cầm trượng phép phát sáng, có hiệu ứng đóng băng khi ra đòn..."
                className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-text-tertiary"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary cursor-pointer">
                <input type="checkbox" checked={preferLocal} onChange={(e) => setPreferLocal(e.target.checked)} />
                Dùng Ollama local ($0)
              </label>
              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-black text-white hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isGenerating ? 'Đang tạo bundle...' : 'Tạo Tài Sản Game'}
              </button>
            </div>

            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">{error}</div>}
            {successMsg && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">{successMsg}</div>}
          </form>

          {/* Bundle Registry List */}
          <div className="rounded-2xl border border-border-primary bg-slate-900/40 p-4 space-y-2.5">
            <h3 className="text-xs font-black uppercase text-text-primary">Thư viện Tài sản Game</h3>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {bundles.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBundle(b)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                    selectedBundle?.id === b.id
                      ? 'border-indigo-500/60 bg-indigo-500/15 text-white'
                      : 'border-border-primary bg-slate-950/60 text-text-secondary hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{b.assetName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                      b.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-text-tertiary">
                    <span>{b.category}</span>
                    <span>·</span>
                    <span>{b.style}</span>
                    <span>·</span>
                    <span className="capitalize font-semibold text-amber-300">{b.statBalance.tier}</span>
                  </div>
                </div>
              ))}
              {bundles.length === 0 && (
                <p className="text-[11px] text-text-tertiary italic text-center py-4">Chưa có tài sản nào. Hãy tạo tài sản đầu tiên ở trên!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 5-Stage Asset Bundle Details */}
        <div className="lg:col-span-8 space-y-4">
          {selectedBundle ? (
            <div className="space-y-4 rounded-2xl border border-border-primary bg-slate-950/80 p-5">
              {/* Top Details & Approval Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-primary pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">{selectedBundle.assetName}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      selectedBundle.statBalance.tier === 'legendary' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      selectedBundle.statBalance.tier === 'epic' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                      'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {selectedBundle.statBalance.tier}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {selectedBundle.category} · {selectedBundle.genre} · {selectedBundle.style}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedBundle.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedBundle.id, 'approved')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt Sản Xuất
                    </button>
                  )}
                  {selectedBundle.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="h-4 w-4" /> Đã duyệt bởi {selectedBundle.approvedBy}
                    </span>
                  )}
                </div>
              </div>

              {/* Stage 1: Concept Art & Palette */}
              <div className="rounded-xl border border-border-primary bg-slate-900/60 p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-indigo-300 uppercase">
                  <Layers className="h-4 w-4" />
                  <span>Giai đoạn 1: Concept Art &amp; Bảng màu</span>
                </div>
                <p className="text-xs text-slate-300">{selectedBundle.conceptArt.description}</p>
                <div className="rounded-lg bg-slate-950 p-2.5 text-xs font-mono text-cyan-300 border border-border-secondary select-all">
                  {selectedBundle.conceptArt.prompt}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-text-secondary">
                  <span>Model gợi ý: <strong className="text-white">{selectedBundle.conceptArt.suggestedModel}</strong></span>
                  <span>·</span>
                  <span>Bảng màu:</span>
                  <div className="flex items-center gap-1">
                    {selectedBundle.conceptArt.paletteColors.map((hex) => (
                      <span key={hex} className="h-4 w-4 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: hex }} title={hex} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stage 2: Sprite Animation Spec */}
              <div className="rounded-xl border border-border-primary bg-slate-900/60 p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-cyan-300 uppercase">
                  <Sliders className="h-4 w-4" />
                  <span>Giai đoạn 2: Đặc tả Sprite Sheet &amp; Animation</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary">
                    <span className="text-[10px] text-text-tertiary block">Kích thước Canvas</span>
                    <strong className="text-white">{selectedBundle.spriteSpec.dimensions} px</strong>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary">
                    <span className="text-[10px] text-text-tertiary block">Lưới Sprite</span>
                    <strong className="text-white">{selectedBundle.spriteSpec.gridCols} x {selectedBundle.spriteSpec.gridRows} frames</strong>
                  </div>
                  <div className="col-span-2 rounded-lg bg-slate-950 p-2 border border-border-secondary">
                    <span className="text-[10px] text-text-tertiary block">Animations</span>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {selectedBundle.spriteSpec.frameAnimations.map((anim) => (
                        <span key={anim.animName} className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">
                          {anim.animName} ({anim.frameCount}f)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 3: Audio SFX & WebAudio Synth */}
              <div className="rounded-xl border border-border-primary bg-slate-900/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-emerald-300 uppercase">
                    <Volume2 className="h-4 w-4" />
                    <span>Giai đoạn 3: Hiệu ứng Âm thanh &amp; Nhạc nền</span>
                  </div>
                  {selectedBundle.audioSpec.webAudioSynthCode && (
                    <button
                      onClick={() => playSynthesizedSfx(selectedBundle.audioSpec.webAudioSynthCode)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                    >
                      <Play className="h-3 w-3" /> Thử SFX Browser Synth
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-secondary">
                  <strong>SFX Prompt:</strong> {selectedBundle.audioSpec.sfxPrompt}
                </p>
                {selectedBundle.audioSpec.bgmPrompt && (
                  <p className="text-xs text-text-secondary">
                    <strong>BGM Prompt:</strong> {selectedBundle.audioSpec.bgmPrompt}
                  </p>
                )}
              </div>

              {/* Stage 4: Dialogue & Quest Lore */}
              <div className="rounded-xl border border-border-primary bg-slate-900/60 p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-amber-300 uppercase">
                  <BookOpen className="h-4 w-4" />
                  <span>Giai đoạn 4: Cốt truyện &amp; Lời thoại NPC</span>
                </div>
                <p className="text-xs italic text-slate-300">"{selectedBundle.dialogueAndLore.loreSnippet}"</p>
                <div className="grid sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary">
                    <span className="text-[10px] text-text-tertiary block">Lời chào</span>
                    <p className="text-white font-medium">"{selectedBundle.dialogueAndLore.greetingDialogue}"</p>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary">
                    <span className="text-[10px] text-text-tertiary block">Khi giao chiến</span>
                    <p className="text-rose-300 font-medium">"{selectedBundle.dialogueAndLore.combatQuote}"</p>
                  </div>
                </div>
              </div>

              {/* Stage 5: RPG Stat Balance */}
              <div className="rounded-xl border border-border-primary bg-slate-900/60 p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-purple-300 uppercase">
                  <Sword className="h-4 w-4" />
                  <span>Giai đoạn 5: Cân bằng Chỉ số &amp; Kinh tế Game</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary text-center">
                    <span className="text-[10px] text-text-tertiary block">Máu (HP)</span>
                    <strong className="text-emerald-400 text-sm">{selectedBundle.statBalance.hp}</strong>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary text-center">
                    <span className="text-[10px] text-text-tertiary block">Tấn công</span>
                    <strong className="text-rose-400 text-sm">{selectedBundle.statBalance.attack}</strong>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary text-center">
                    <span className="text-[10px] text-text-tertiary block">Phòng thủ</span>
                    <strong className="text-cyan-400 text-sm">{selectedBundle.statBalance.defense}</strong>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary text-center">
                    <span className="text-[10px] text-text-tertiary block">Tốc độ</span>
                    <strong className="text-amber-400 text-sm">{selectedBundle.statBalance.speed}</strong>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-2 border border-border-secondary text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-text-tertiary block">Giá Vàng</span>
                    <strong className="text-yellow-300 text-sm">{selectedBundle.statBalance.goldCost} G</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border-primary p-8 text-center text-text-tertiary">
              <p>Chọn một tài sản từ danh sách bên trái hoặc tạo tài sản mới để xem chi tiết 5 giai đoạn.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
