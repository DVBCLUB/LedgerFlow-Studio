import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  CornerDownLeft,
  X,
  Bot,
  Activity,
  Layers,
} from 'lucide-react';

interface CommandResult {
  commandId: string;
  originalText: string;
  parsedIntent: {
    intent: string;
    category: string;
    confidence: number;
    targetWorkspace: string;
    targetSubtab?: string;
    explanation: string;
  };
  executionStatus: string;
  suggestedFollowUps: string[];
}

interface NaturalLanguageCommandBarProps {
  onNavigate?: (workspace: string, subtab?: string) => void;
  className?: string;
}

export const NaturalLanguageCommandBar: React.FC<NaturalLanguageCommandBarProps> = ({
  onNavigate,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ text: string; category: string; description: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch smart suggestions on mount
    fetch('/api/dormant/nl-os/suggestions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.suggestions) {
          setSuggestions(data.suggestions);
        }
      })
      .catch(() => {
        // Fallback default suggestions if offline
        setSuggestions([
          { text: 'Chốt deal khách hàng Enterprise và kích hoạt bàn giao', category: 'Sales', description: 'Tự động mở ledger và sinh VietQR' },
          { text: 'Lập tờ khai thuế GTGT Q3/2026 và tính ưu đãi phần mềm', category: 'Finance', description: 'Chuẩn TT80 & giảm CIT 50%' },
          { text: 'Chạy kiểm tra toàn bộ vi dịch vụ và tự khắc phục lỗi', category: 'System', description: 'System Self-Healing Doctor' },
        ]);
      });
  }, []);

  const handleExecute = async (commandToRun?: string) => {
    const textToExecute = (commandToRun || query).trim();
    if (!textToExecute) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/dormant/nl-os/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandText: textToExecute }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Không thể thực thi câu lệnh.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối tới AI OS Router.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleJumpToWorkspace = () => {
    if (result && onNavigate) {
      onNavigate(result.parsedIntent.targetWorkspace, result.parsedIntent.targetSubtab);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center bg-slate-900/90 border border-cyan-500/30 rounded-xl shadow-2xl backdrop-blur-md px-4 py-3 text-white transition-all focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20">
        <div className="flex items-center gap-2 mr-3 text-cyan-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            AI OS Autopilot
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập mệnh lệnh điều hành tự động... (VD: 'Chốt deal 150tr', 'Lập báo cáo thuế Q3', 'Chạy kiểm tra hệ thống')"
          className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-400 focus:ring-0"
        />

        <div className="flex items-center gap-2 ml-2">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResult(null);
                setError(null);
              }}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleExecute()}
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Thực thi</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dropdown Suggestions & Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-lg p-4 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Result Card if executed */}
          {result && (
            <div className="mb-4 p-4 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold text-emerald-300 text-sm">
                    Lệnh đã được AI OS tiếp nhận và tự động điều phối!
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                  Độ tin cậy: {(result.parsedIntent.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-300">
                {result.parsedIntent.explanation}
              </p>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-cyan-800/40">
                <div className="flex items-center gap-2 text-xs text-cyan-200">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Workspace điều hướng: <strong>{result.parsedIntent.targetWorkspace}</strong></span>
                </div>
                {onNavigate && (
                  <button
                    onClick={handleJumpToWorkspace}
                    className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white font-medium underline"
                  >
                    <span>Mở ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Suggestions */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Lệnh điều hành gợi ý (Nhấn để chạy ngay)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item.text);
                    handleExecute(item.text);
                  }}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/40 text-left transition-all group"
                >
                  <Bot className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300">
                      {item.text}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Mẹo: Nhấn <strong>Enter</strong> để gửi lệnh, hoặc chọn câu lệnh gợi ý từ AI CEO.</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NaturalLanguageCommandBar;
