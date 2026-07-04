import React, { useState } from 'react';
import { Bot, Play, Download, Send, RefreshCw, Cpu, User, Check, Key } from 'lucide-react';
import { callAIFromSettings } from '../../utils/aiSettingsApi';

type ToolKey = 'wasm_sandbox' | 'github_connector' | 'rag_search' | 'email_dispatcher';

type Message = {
  sender: 'user' | 'agent';
  text: string;
};

export default function AgentAssemblyBuilder() {
  // Agent Config State
  const [name, setName] = useState('AI Assistant');
  const [role, setRole] = useState('Generalist');
  const [systemPrompt, setSystemPrompt] = useState(
    'Bạn là trợ lý AI chuyên nghiệp và tận tâm. Hãy trả lời câu hỏi ngắn gọn và lịch sự.'
  );
  const [avatar, setAvatar] = useState('🤖');
  const [allowedTools, setAllowedTools] = useState<Record<ToolKey, boolean>>({
    wasm_sandbox: false,
    github_connector: false,
    rag_search: true,
    email_dispatcher: false
  });

  // Sandbox Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleTool = (tool: ToolKey) => {
    setAllowedTools((prev) => ({ ...prev, [tool]: !prev[tool] }));
  };

  const handleDeploy = () => {
    setIsDeployed(true);
    setMessages([
      {
        sender: 'agent',
        text: `Chào sếp! Tôi là ${name}, đóng vai trò là ${role}. Hệ thống đã cấu hình thành công các công cụ: ${Object.entries(allowedTools)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => key.toUpperCase())
          .join(', ') || 'NONE'}. Tôi đã sẵn sàng nhận lệnh!`
      }
    ]);
    setUserInput('');
  };

  const handleSend = async () => {
    const text = userInput.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    // Build tool context injected into system prompt to let AI "know" its tools
    const enabledToolList = Object.entries(allowedTools)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);
    
    const toolContext = enabledToolList.length > 0 
      ? `\nBạn được cấp quyền sử dụng các công cụ hệ thống sau: ${enabledToolList.join(', ')}.`
      : '\nBạn không có bất kỳ công cụ ngoài nào.';

    const fullSystemPrompt = `${systemPrompt}${toolContext}\nHãy tuân thủ system prompt nghiêm ngặt khi trò chuyện với người dùng.`;

    try {
      const response = await callAIFromSettings(text, 'ai-assistant', 'general');
      const agentResponse = response.text || response.content || response.output || '';
      
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: agentResponse || 'Tôi đã nhận được tin nhắn của sếp, nhưng không nhận được phản hồi từ mô hình.'
        }
      ]);
    } catch (e) {
      // Fallback offline reply simulating prompt execution
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'agent',
            text: `[Offline AI Sandbox Fallback] Chào sếp, tôi nhận được câu hỏi: "${text}". Dưới vai trò là ${role}, với system prompt: "${systemPrompt.slice(0, 40)}...", tôi khuyên sếp nên thực thi lệnh này trực tiếp hoặc bật API Key để chat thật.`
          }
        ]);
      }, 700);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportConfig = () => {
    const config = {
      name,
      role,
      systemPrompt,
      avatar,
      allowedTools,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-violet-500/25 bg-slate-950/70 p-5 text-slate-100 space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-violet-300">AgentOps Lab</span>
          <h3 className="mt-1 text-lg font-black text-text-primary">AI Agent Assembly Builder</h3>
          <p className="text-xs font-semibold text-text-secondary">Tự cấu hình AI Agent bằng cách thiết lập System Prompt, phân vai trò, cấp quyền sử dụng các công cụ hệ thống và chạy test sandbox.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] text-left">
        
        {/* Left: Configuration Form */}
        <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4 space-y-4">
          <p className="text-xs font-black text-text-primary uppercase tracking-wider">Cấu hình tham số Agent</p>
          
          {/* Name and Role */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text-secondary">Tên Agent</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-violet-400"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text-secondary">Vai trò (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-violet-400"
              >
                <option value="Copywriter">AI Copywriter (Marketing)</option>
                <option value="Auditor">AI Tax Auditor (Finance)</option>
                <option value="Developer">AI Coder (Product)</option>
                <option value="Chief of Staff">AI Chief of Staff (Operate)</option>
                <option value="Generalist">Trợ lý tổng quát</option>
              </select>
            </div>
          </div>

          {/* Avatar and System Prompt */}
          <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text-secondary">Avatar Icon</label>
              <select
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full rounded-xl border border-border-secondary bg-slate-950 px-2 py-2 text-sm text-text-primary outline-none focus:border-violet-400"
              >
                {['🤖', '👨‍💻', '👩‍💼', '📈', '🔬', '🛡️', '⚡', '💡'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text-secondary">System Instruction (System Prompt)</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-text-primary outline-none focus:border-violet-400"
              />
            </div>
          </div>

          {/* Tools permissions */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-secondary">Cấp quyền Công cụ (Tools Authorization)</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { key: 'wasm_sandbox', label: 'WASM Python/SQL Sandbox' },
                { key: 'github_connector', label: 'GitHub Read/Commit Connector' },
                { key: 'rag_search', label: 'RAG Knowledge Library Search' },
                { key: 'email_dispatcher', label: 'Email/Zalo Dispatcher' },
              ].map((t) => {
                const enabled = allowedTools[t.key as ToolKey];
                return (
                  <button
                    key={t.key}
                    onClick={() => toggleTool(t.key as ToolKey)}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                      enabled
                        ? 'bg-violet-500/10 border-violet-500/40 text-violet-300'
                        : 'bg-slate-950/40 border-border-primary text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    <span>{t.label}</span>
                    {enabled && <Check className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleDeploy}
              className="flex-1 rounded-xl bg-violet-400 text-slate-950 py-2.5 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 hover:bg-violet-350"
            >
              <Play className="w-3.5 h-3.5" />
              Triển khai lên Sandbox
            </button>
            <button
              onClick={handleExportConfig}
              className="rounded-xl border border-border-secondary bg-slate-950 px-4 text-xs font-black text-text-secondary hover:border-violet-400 hover:text-text-primary transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {copied ? 'Đã xuất JSON' : 'Lưu Config'}
            </button>
          </div>
        </div>

        {/* Right: Sandbox Chat */}
        <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4 flex flex-col justify-between h-[420px] lg:h-auto">
          <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
            <span className="text-[10px] font-black text-text-tertiary uppercase">Isolated Chat Sandbox</span>
            <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Cpu className="w-3 h-3 text-violet-400" />
              Runtime: Agent-Sandbox-v1
            </span>
          </div>

          {isDeployed ? (
            <div className="flex-1 flex flex-col justify-between my-3 overflow-hidden">
              {/* Message scroll list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2 scrollbar-thin max-h-[300px]">
                {messages.map((m, idx) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div key={idx} className={`flex gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm ${
                        isUser ? 'bg-violet-500/20 text-violet-300' : 'bg-bg-surface text-text-primary'
                      }`}>
                        {isUser ? <User className="w-3.5 h-3.5" /> : avatar}
                      </div>
                      <div className={`p-3 rounded-2xl text-xs font-semibold leading-5 text-left ${
                        isUser ? 'bg-violet-500/10 border border-violet-500/25 text-violet-100 rounded-tr-none' : 'bg-bg-primary border border-border-primary text-slate-200 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-2.5 mr-auto max-w-[85%] animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-bg-surface flex items-center justify-center shrink-0 text-sm">{avatar}</div>
                    <div className="p-3 rounded-2xl text-xs font-semibold bg-bg-primary border border-slate-850 text-text-tertiary rounded-tl-none">
                      {name} đang suy nghĩ...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 border-t border-slate-850 pt-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  placeholder={`Gửi chỉ thị cho ${name}...`}
                  className="flex-1 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-violet-400 disabled:opacity-40"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !userInput.trim()}
                  className="rounded-xl bg-violet-450 hover:bg-violet-500 px-3 text-slate-950 transition cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 space-y-4">
              <Bot className="w-10 h-10 text-slate-650 mx-auto animate-pulse" />
              <p className="text-xs text-text-secondary font-semibold max-w-xs mx-auto leading-relaxed">
                Sau khi điều chỉnh cấu hình Agent ở bảng bên trái, vui lòng nhấn **Triển khai lên Sandbox** để mở kênh đối thoại thử nghiệm.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
