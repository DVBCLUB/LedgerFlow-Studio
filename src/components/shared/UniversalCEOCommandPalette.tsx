import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  Code,
  Command,
  CornerDownLeft,
  FileCheck2,
  FolderKanban,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Scale,
  Zap,
  X,
} from 'lucide-react';
import { COMPANY_WORKSPACES, type TabType } from '../../app/companyNavigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType, subTab?: string) => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  action: () => void;
  badge?: string;
}

export default function UniversalCEOCommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (tab: TabType, subTab?: string) => {
    onNavigate(tab, subTab);
    onClose();
  };

  const allItems: CommandItem[] = [
    // Core Workspaces
    ...COMPANY_WORKSPACES.map((ws) => ({
      id: `nav-${ws.tab}`,
      category: 'Phân hệ Doanh nghiệp',
      title: ws.label,
      subtitle: ws.description,
      icon: Briefcase,
      action: () => handleSelect(ws.tab),
      badge: 'Chuyển phân hệ',
    })),

    // Fast CEO Actions
    {
      id: 'act-python',
      category: 'Hành động Nhanh',
      title: '🧪 Chạy Python & SQL Sandbox AI',
      subtitle: 'Mở môi trường WebAssembly Python 3.12 phân tích dữ liệu',
      icon: Code,
      action: () => handleSelect('analytics', 'python_sandbox'),
      badge: 'Chạy ngầm',
    },
    {
      id: 'act-ai-agent',
      category: 'Hành động Nhanh',
      title: '🤖 Ra lệnh cho Đội ngũ AI Staff',
      subtitle: 'Giao việc cho AI CMO, CFO, Dev hoặc Tester',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'command'),
      badge: 'AI Swarm',
    },
    {
      id: 'act-game-asset',
      category: 'Hành động Nhanh',
      title: '🎮 Xưởng Tài Sản Game AI 5-in-1',
      subtitle: 'Sinh Concept Art, Sprite Sheet, SFX Synth, Lore NPC & Bảng cân bằng chỉ số',
      icon: Sparkles,
      action: () => handleSelect('product_studio', 'game_assets'),
      badge: 'Game Studio',
    },
    {
      id: 'act-video-pipeline',
      category: 'Hành động Nhanh',
      title: '🎬 Xưởng Sản Xuất Video Đa Kênh (5 Giai Đoạn)',
      subtitle: 'Kịch bản từng giây, Voiceover Cues, DaVinci/CapCut Edit Brief & Thumbnail Viral',
      icon: Rocket,
      action: () => handleSelect('marketing_growth', 'video_studio'),
      badge: 'Video Maker',
    },
    {
      id: 'act-dynamic-router',
      category: 'Hành động Nhanh',
      title: '📊 Dynamic Adaptive AI Router & LLM-Judge',
      subtitle: 'Tối ưu chi phí $0 (Ollama/Free tier), đo latency & feedback loop chất lượng',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'governance'),
      badge: 'AI Core',
    },
    {
      id: 'act-autonomous-flywheel',
      category: 'Hành động Nhanh',
      title: '🚀 Vòng Lặp Tự Vận Hành 95% (Autonomous Flywheel)',
      subtitle: 'Voice-to-Command tiếng Việt, tự động phân phối đa kênh, playtest game & đóng gói 1-click',
      icon: Zap,
      action: () => handleSelect('ai_factory', 'autonomous_flywheel'),
      badge: 'Flywheel',
    },
    {
      id: 'act-nexus-cockpit',
      category: 'Hành động Nhanh',
      title: '⚡ AI-Robot Universal Nexus & Studio Command',
      subtitle: 'Bộ não AI trung tâm, robot trung gian, cầu nối IDE (Cursor/Antigravity) & Studio 3 mảng',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'nexus_cockpit'),
      badge: 'Nexus Core',
    },
    {
      id: 'act-apprentice-lab',
      category: 'Hành động Nhanh',
      title: '🎓 Local AI Apprentice & Distillation Lab',
      subtitle: 'Ma trận chuyên gia Frontier, thu thập mẫu vàng và xuất dataset huấn luyện',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'apprentice_lab'),
      badge: 'Local AI SFT',
    },
    {
      id: 'act-delegation-matrix',
      category: 'Hành động Nhanh',
      title: '⚖️ Ma Trận Phân Quyền & Giải Quyết Xung Đột AI',
      subtitle: 'Chuẩn Amazon Least-Privilege, DeepMind Consensus & Netflix Blast-Radius Isolation',
      icon: Scale,
      action: () => handleSelect('system_settings', 'delegation_matrix'),
      badge: 'RBAC IAM',
    },
    {
      id: 'act-sop-runbooks',
      category: 'Hành động Nhanh',
      title: '📖 Quy Trình Vận Hành Chuẩn (SOP & Runbooks)',
      subtitle: '5 trụ cột quy trình vận hành, điểm tuân thủ & diễn tập sự cố khẩn cấp 1-click',
      icon: BookOpen,
      action: () => handleSelect('system_settings', 'sop_runbook'),
      badge: 'SOP Core',
    },
    {
      id: 'act-self-healing-patch',
      category: 'Hành động Nhanh',
      title: '🛡️ Autonomous Code Self-Healing & PR Gate',
      subtitle: 'Robot tự chẩn đoán lỗi, viết atomic patch & 1-Click Approve Gate',
      icon: ShieldCheck,
      action: () => handleSelect('system_settings', 'dev_ops'),
      badge: 'Self-Healing',
    },
    {
      id: 'act-vietqr',
      category: 'Hành động Nhanh',
      title: '📈 Kiểm tra Dòng tiền & VietQR',
      subtitle: 'Xem nhật ký khớp nối thanh toán tự động',
      icon: BarChart3,
      action: () => handleSelect('finance_accounting', 'cashflow'),
      badge: 'Kế toán VAS',
    },
    {
      id: 'act-ci-doctor',
      category: 'Hành động Nhanh',
      title: '🔌 Thẻ Phê duyệt Release & GitHub CI Doctor',
      subtitle: 'Duyệt bản build xanh và kiểm tra trạng thái CI/CD',
      icon: ShieldCheck,
      action: () => handleSelect('system_settings', 'dev_ops'),
      badge: 'DevOps Gate',
    },
    {
      id: 'act-token-budget',
      category: 'Hành động Nhanh',
      title: '🔐 Hạn mức API & AI Key Vault',
      subtitle: 'Kiểm soát ngân sách token API của đội ngũ AI',
      icon: Settings,
      action: () => handleSelect('system_settings', 'security'),
      badge: 'Bảo mật',
    },
  ];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems;

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/80 ring-1 ring-white/10">
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3.5 bg-slate-950/60">
          <Search className="h-5 w-5 text-indigo-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder="Gõ lệnh hoặc tìm phân hệ... (VD: Python Sandbox, Duyệt chi phí, VietQR)"
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={onClose}
            className="ml-2 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">
              Không tìm thấy lệnh hoặc phân hệ khớp với "{query}". Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Esc</kbd> để đóng.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                        isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{item.title}</span>
                        {item.badge && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-lg border border-indigo-500/30">
                      <span>Chọn</span>
                      <CornerDownLeft className="h-3 w-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-4 py-2.5 text-[10px] font-medium text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↑↓</kbd> Di chuyển
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↵</kbd> Thực thi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Esc</kbd> Đóng
            </span>
          </div>
          <div className="flex items-center gap-1 text-indigo-400 font-bold">
            <Command className="h-3 w-3" />
            <span>Universal CEO Command OS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
