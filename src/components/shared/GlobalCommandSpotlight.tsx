import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, X, Bot, Sparkles, Building2, BarChart3, Database } from 'lucide-react';
import { COMPANY_WORKSPACES } from '../../app/companyNavigation';

export default function GlobalCommandSpotlight() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bật/tắt Spotlight bằng Ctrl+K hoặc Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (tab: string) => {
    window.location.hash = `/${tab}`;
    setIsOpen(false);
    setQuery('');
  };

  const handleSimulateAiAction = () => {
    alert('AI Agent đã nhận lệnh: ' + query);
    setIsOpen(false);
    setQuery('');
  };

  const normalizedQuery = query.toLowerCase();
  
  // Lọc workspace
  const matchedWorkspaces = COMPANY_WORKSPACES.filter(w => 
    w.label.toLowerCase().includes(normalizedQuery) || w.description.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => setIsOpen(false)}
      ></div>
      
      <div className="relative w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-indigo-500/10">
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <Search className="w-5 h-5 text-indigo-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chuyển trang, hoặc Ra lệnh cho AI..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-lg outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query) handleSimulateAiAction();
            }}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-white/10 text-slate-400 px-1.5 py-0.5 rounded">ESC</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
          {query.length > 2 && (
            <div className="mb-4">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">Hành động AI</div>
              <button 
                onClick={handleSimulateAiAction}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-indigo-500/10 flex items-center gap-3 group"
              >
                <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-md group-hover:bg-indigo-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Yêu cầu AI thực hiện: <span className="text-indigo-400">"{query}"</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">Lệnh sẽ được gửi tới Agentic Router</div>
                </div>
              </button>
            </div>
          )}

          <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">Không gian làm việc</div>
          {matchedWorkspaces.length > 0 ? (
            matchedWorkspaces.map(w => (
              <button 
                key={w.tab}
                onClick={() => handleNavigate(w.tab)}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/5 text-slate-400 rounded-md group-hover:text-white group-hover:bg-white/10 transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{w.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{w.description}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              Không tìm thấy module nào. Nhấn Enter để gửi truy vấn này cho AI.
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-mono bg-white/10 px-1 rounded text-[10px]">↑↓</span> Di chuyển
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono bg-white/10 px-1 rounded text-[10px]">Enter</span> Chọn / Ra lệnh
          </div>
        </div>
      </div>
    </div>
  );
}
