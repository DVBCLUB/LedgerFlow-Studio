import React, { useState, useEffect } from 'react';
import { Terminal, X, Code2, PenTool, Database, Compass, Bell } from 'lucide-react';

const LOGS_MOCK = [
  { id: 1, time: '10:45:02', model: 'GPT-4o', action: 'Phân tích yêu cầu Marketing từ User', type: 'info', icon: Terminal },
  { id: 2, time: '10:45:03', model: 'Router', action: 'Định tuyến tác vụ [Viết lách] sang Claude 3.5', type: 'system', icon: Compass },
  { id: 3, time: '10:45:08', model: 'Claude 3.5', action: 'Hoàn thành bản nháp bài đăng Facebook (Độ dài: 200 từ)', type: 'success', icon: PenTool },
  { id: 4, time: '10:45:09', model: 'Router', action: 'Định tuyến tác vụ [Tạo ảnh] sang Midjourney API', type: 'system', icon: Compass },
  { id: 5, time: '10:45:15', model: 'Cursor', action: 'Phát hiện lỗi syntax ở file config. Cố gắng tự sửa...', type: 'warning', icon: Code2 },
  { id: 6, time: '10:45:17', model: 'Cursor', action: 'Đã fix lỗi (Commit: a1b2c3d)', type: 'success', icon: Code2 },
  { id: 7, time: '10:46:00', model: 'Gemini 1.5', action: 'Đang index 12,000 dòng dữ liệu tài chính (32%)...', type: 'loading', icon: Database },
];

export default function NeuralNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<typeof LOGS_MOCK>([]);

  // Giả lập log chạy
  useEffect(() => {
    if (isOpen && logs.length === 0) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < LOGS_MOCK.length) {
          setLogs(prev => [...prev, LOGS_MOCK[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-bg-primary border border-border-secondary text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors shadow-inner" 
        title="Neural Comm Center (Logs)"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-error animate-pulse border border-bg-primary"></span>
      </button>

      {/* Drawer */}
      <div className={`fixed inset-0 z-[100] pointer-events-none ${isOpen ? '' : 'hidden'}`}>
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsOpen(false)}
        ></div>
        <div 
          className={`absolute top-0 right-0 h-full w-[400px] bg-[#0c0c0e] border-l border-white/10 shadow-2xl pointer-events-auto transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-primary bg-bg-primary/50">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-brand-light" />
              <div>
                <h3 className="text-sm font-bold text-text-primary">Neural Comm Center</h3>
                <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">Live Agent Logs</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary bg-white/5 p-1.5 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            {logs.map((log) => {
              const Icon = log.icon;
              let colorClass = 'text-text-secondary';
              let bgClass = 'bg-bg-primary border-border-secondary';
              
              if (log.type === 'system') { colorClass = 'text-indigo-400'; bgClass = 'bg-indigo-950/30 border-indigo-500/20'; }
              if (log.type === 'success') { colorClass = 'text-emerald-400'; bgClass = 'bg-emerald-950/30 border-emerald-500/20'; }
              if (log.type === 'warning') { colorClass = 'text-amber-400'; bgClass = 'bg-amber-950/30 border-amber-500/20'; }
              if (log.type === 'loading') { colorClass = 'text-blue-400'; bgClass = 'bg-blue-950/30 border-blue-500/20 animate-pulse'; }

              return (
                <div key={log.id} className={`p-3 rounded-lg border flex gap-3 ${bgClass}`}>
                  <div className="pt-0.5"><Icon className={`w-3.5 h-3.5 ${colorClass}`} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-bold ${colorClass}`}>[{log.model}]</span>
                      <span className="text-text-muted text-[10px]">{log.time}</span>
                    </div>
                    <div className="text-text-secondary leading-relaxed">{log.action}</div>
                  </div>
                </div>
              );
            })}
            {logs.length > 0 && logs.length < LOGS_MOCK.length && (
              <div className="flex items-center gap-2 text-text-muted p-2">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{animationDelay: '0.4s'}}></span>
                <span className="ml-2">Đang lắng nghe...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
