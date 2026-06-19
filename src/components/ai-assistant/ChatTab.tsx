import React from 'react';
import { Bot, Cpu, Send, Loader2 } from 'lucide-react';
import { type WebAIProfile } from '../../utils/assistantApi';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed?: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatTabProps {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  chatLoading: boolean;
  sendChat: () => void;
  engineMode: 'api' | 'web_automation';
  setEngineMode: (val: 'api' | 'web_automation') => void;
  webPlatform: string;
  setWebPlatform: (val: string) => void;
  selectedProfileId: string;
  setSelectedProfileId: (val: string) => void;
  webAIProfiles: WebAIProfile[];
  headlessEnabled: boolean;
  setHeadlessEnabled: (val: boolean) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatTab({
  messages,
  chatInput,
  setChatInput,
  chatLoading,
  sendChat,
  engineMode,
  setEngineMode,
  webPlatform,
  setWebPlatform,
  selectedProfileId,
  setSelectedProfileId,
  webAIProfiles,
  headlessEnabled,
  setHeadlessEnabled,
  chatEndRef,
}: ChatTabProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role !== 'user' && (
              <div className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center ${
                msg.role === 'system' ? 'bg-violet-950/60 border border-violet-700/40' : 'bg-slate-800 border border-slate-700'
              }`}>
                <Bot className="h-3.5 w-3.5 text-violet-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-sm'
                : msg.isError
                  ? 'bg-rose-950/60 border border-rose-700/40 text-rose-300'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-bl-sm'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.modelUsed && (
                <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1">
                  <Cpu className="h-2.5 w-2.5" /> {msg.modelUsed}
                </div>
              )}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input controls */}
      <div className="px-3 pb-3 shrink-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded-xl border border-slate-900">
          <div className="flex items-center gap-1.5">
            <span className="font-black uppercase tracking-[0.12em] text-slate-500">Execution:</span>
            <select
              value={engineMode}
              onChange={e => setEngineMode(e.target.value as 'api' | 'web_automation')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none font-bold focus:border-violet-500"
            >
              <option value="api">API Local (AI Gateway)</option>
              <option value="web_automation">Browser Automation (Web AI)</option>
            </select>
          </div>
          {engineMode === 'web_automation' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-black uppercase tracking-[0.12em] text-slate-500">Platform:</span>
                <select
                  value={webPlatform}
                  onChange={e => setWebPlatform(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 outline-none font-bold focus:border-violet-500"
                >
                  <option value="chatgpt">ChatGPT</option>
                  <option value="gemini">Gemini</option>
                  <option value="claude">Claude</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="grok">Grok</option>
                  <option value="copilot">Copilot</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black uppercase tracking-[0.12em] text-slate-500">Tài khoản (Profile):</span>
                <select
                  value={selectedProfileId}
                  onChange={e => setSelectedProfileId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 outline-none font-bold focus:border-violet-500"
                >
                  <option value="">-- Mặc định --</option>
                  {webAIProfiles
                    .filter(p => p.platform === webPlatform.toLowerCase())
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  }
                </select>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={headlessEnabled}
                    onChange={e => setHeadlessEnabled(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-violet-500 focus:ring-violet-500 focus:ring-opacity-25"
                  />
                  <span className="font-black uppercase tracking-[0.12em] text-slate-500">Chạy ẩn (Headless)</span>
                </label>
              </div>
            </>
          )}
        </div>

        {engineMode === 'web_automation' && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-2.5 text-[10px] leading-5 text-violet-300 font-semibold">
            💡 <b>Lưu ý:</b> {selectedProfileId ? 'Đang chạy với Profile được chọn.' : 'Đang chạy với Profile mặc định.'} Cửa sổ Chrome tự động mở. Nếu chưa đăng nhập, vui lòng hoàn tất đăng nhập một lần để lưu session cookies.
          </div>
        )}

        <div className="flex gap-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-violet-500/60 transition-colors">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
            placeholder="Hỏi về code, kiến trúc, debug..."
            className="flex-1 bg-transparent px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none"
          />
          <button
            onClick={sendChat}
            disabled={chatLoading || !chatInput.trim()}
            className="px-3 text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
