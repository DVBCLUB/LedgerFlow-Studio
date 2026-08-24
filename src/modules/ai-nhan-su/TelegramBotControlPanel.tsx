import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelegramBotStatus {
  configured: boolean;
  connected: boolean;
  mode: 'webhook' | 'polling' | 'unconfigured';
  botUsername?: string;
  chatId?: string;
  lastActivityAt?: string;
  pendingApprovals: number;
  messagesProcessed24h: number;
}

interface TelegramMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  from?: string;
  type: 'command' | 'approval' | 'notification' | 'text';
  status: 'sent' | 'delivered' | 'failed';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STATUS: TelegramBotStatus = {
  configured: false,
  connected: false,
  mode: 'unconfigured',
  pendingApprovals: 0,
  messagesProcessed24h: 0,
};

const SUPPORTED_COMMANDS = [
  { cmd: '/start', desc: 'Khởi động bot và xem hướng dẫn', icon: '🚀' },
  { cmd: '/status', desc: 'Kiểm tra trạng thái AI và hệ thống', icon: '📊' },
  { cmd: '/brief', desc: 'Daily Brief từ AI Chief of Staff', icon: '📋' },
  { cmd: '/approve <id>', desc: 'Duyệt một approval request đang chờ', icon: '✅' },
  { cmd: '/reject <id>', desc: 'Từ chối một approval request', icon: '❌' },
  { cmd: '/ask <câu hỏi>', desc: 'Hỏi AI bất kỳ điều gì', icon: '🤖' },
  { cmd: '/cash', desc: 'Xem tóm tắt dòng tiền hôm nay (AI CFO)', icon: '💰' },
  { cmd: '/leads', desc: 'Xem danh sách hot leads mới nhất', icon: '🔥' },
  { cmd: '/alerts', desc: 'Xem các cảnh báo đang chờ xử lý', icon: '🚨' },
  { cmd: '/run <mission>', desc: 'Kích hoạt mission cho AI agent', icon: '⚡' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TelegramBotControlPanel() {
  const [status, setStatus] = useState<TelegramBotStatus>(MOCK_STATUS);
  const [loading, setLoading] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [mode, setMode] = useState<'webhook' | 'polling'>('polling');
  const [activeTab, setActiveTab] = useState<'status' | 'commands' | 'config' | 'log'>('status');
  const [saved, setSaved] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dormant/telegram/status').catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        if (data.success) setStatus(data.status);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const sendTestNotification = async () => {
    if (!testMsg.trim()) return;
    setSendingTest(true);
    try {
      const res = await fetch('/api/dormant/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMsg, type: 'notification' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [{
          id: `msg_${Date.now()}`, direction: 'outbound', text: testMsg,
          timestamp: new Date().toISOString(), type: 'notification', status: 'sent',
        }, ...prev]);
        setTestMsg('');
      }
    } finally {
      setSendingTest(false);
    }
  };

  const saveConfig = async () => {
    try {
      const res = await fetch('/api/dormant/telegram/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId, mode }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        fetchStatus();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setSaved(false);
    }
  };

  const statusColor = status.connected ? 'text-emerald-400' : status.configured ? 'text-amber-400' : 'text-slate-500';
  const statusDot = status.connected ? 'bg-emerald-500' : status.configured ? 'bg-amber-500' : 'bg-slate-600';
  const statusLabel = status.connected ? 'Đang kết nối' : status.configured ? 'Đã cấu hình, chờ kết nối' : 'Chưa cấu hình';

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/20 flex items-center justify-center text-xl">✈️</div>
          <div>
            <h1 className="text-lg font-black text-white">Telegram Bot Control</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${statusDot} ${status.connected ? 'animate-pulse' : ''}`} />
              <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
              {status.botUsername && <span className="text-xs text-slate-600">· @{status.botUsername}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:bg-white/10 transition disabled:opacity-50"
        >
          {loading ? '⏳' : '🔄'} Làm mới
        </button>
      </div>

      {/* Alert if not configured */}
      {!status.configured && (
        <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/30 mb-6 flex items-start gap-3">
          <span className="text-amber-400 text-xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-400">Bot chưa được cấu hình</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Cần thêm <code className="bg-amber-950/50 px-1 rounded">TELEGRAM_BOT_TOKEN</code> và{' '}
              <code className="bg-amber-950/50 px-1 rounded">TELEGRAM_CHAT_ID</code> vào file{' '}
              <code className="bg-amber-950/50 px-1 rounded">.env</code>, hoặc cấu hình bên dưới.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 p-1.5 bg-white/3 rounded-xl border border-white/8 w-fit">
        {[
          { id: 'status', label: '📊 Trạng thái' },
          { id: 'commands', label: '📋 Lệnh' },
          { id: 'config', label: '⚙️ Cấu hình' },
          { id: 'log', label: '📨 Nhật ký' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === tab.id ? 'bg-[#2AABEE]/20 text-[#2AABEE]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Status ── */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Trạng thái', value: statusLabel, icon: status.connected ? '🟢' : '🔴', color: statusColor },
              { label: 'Chế độ', value: status.mode === 'unconfigured' ? 'Chưa cấu hình' : status.mode === 'polling' ? 'Polling (dev)' : 'Webhook (prod)', icon: '📡', color: 'text-slate-300' },
              { label: 'Approvals chờ', value: `${status.pendingApprovals}`, icon: '⏳', color: status.pendingApprovals > 0 ? 'text-amber-400' : 'text-slate-400' },
              { label: 'Tin nhắn 24h', value: `${status.messagesProcessed24h}`, icon: '💬', color: 'text-slate-300' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="p-4 rounded-2xl border border-white/8 bg-white/3">
                <p className="text-xl mb-1">{icon}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-600">{label}</p>
              </div>
            ))}
          </div>

          {/* Capabilities */}
          <div className="p-4 rounded-2xl border border-white/8 bg-white/3">
            <h3 className="text-sm font-bold text-slate-300 mb-3">🤖 Khả năng của Bot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                ['📋 Daily Brief tự động', 'Sáng mỗi ngày AI Chief of Staff gửi tóm tắt'],
                ['✅ Duyệt task qua điện thoại', 'Nhận và approve/reject agent tasks từ Telegram'],
                ['🚨 Cảnh báo real-time', 'Nhận ngay khi có threshold breach (tiền, hóa đơn...)'],
                ['💰 Báo cáo tài chính', 'Hỏi AI CFO về dòng tiền và doanh thu'],
                ['🔥 Hot lead notification', 'Thông báo ngay khi có lead mới qualify HOT'],
                ['🎯 Kích hoạt mission', 'Ra lệnh cho AI agents từ xa qua /run'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-2 p-2 rounded-lg bg-white/3">
                  <span className="text-xs font-semibold text-slate-300">{title}</span>
                  <p className="text-[10px] text-slate-500 hidden md:block">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Test Notification */}
          <div className="p-4 rounded-2xl border border-[#2AABEE]/20 bg-[#2AABEE]/5">
            <h3 className="text-sm font-bold text-[#2AABEE] mb-3">📤 Gửi thông báo test</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={testMsg}
                onChange={e => setTestMsg(e.target.value)}
                placeholder="Nội dung thông báo test..."
                onKeyDown={e => e.key === 'Enter' && sendTestNotification()}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#2AABEE]/50"
              />
              <button
                onClick={sendTestNotification}
                disabled={sendingTest || !testMsg.trim()}
                className="px-4 py-2 rounded-xl bg-[#2AABEE] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
              >
                {sendingTest ? '⏳' : '✈️ Gửi'}
              </button>
            </div>
            {!status.configured && (
              <p className="text-[10px] text-slate-600 mt-2">⚠️ Cần cấu hình bot token trước khi gửi</p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Commands ── */}
      {activeTab === 'commands' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-4">Danh sách lệnh bot hỗ trợ. Gửi qua Telegram sau khi cấu hình:</p>
          {SUPPORTED_COMMANDS.map(({ cmd, desc, icon }) => (
            <div key={cmd} className="flex items-start gap-3 p-3 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition">
              <span className="text-lg">{icon}</span>
              <div>
                <code className="text-sm text-[#2AABEE] font-mono">{cmd}</code>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Config ── */}
      {activeTab === 'config' && (
        <div className="space-y-4 max-w-xl">
          <div className="p-4 rounded-2xl border border-white/8 bg-white/3">
            <h3 className="text-sm font-bold text-slate-300 mb-4">⚙️ Cấu hình Telegram Bot</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Bot Token (từ @BotFather)</label>
                <input
                  type="password"
                  value={botToken}
                  onChange={e => setBotToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Chat ID (của CEO)</label>
                <input
                  type="text"
                  value={chatId}
                  onChange={e => setChatId(e.target.value)}
                  placeholder="-100xxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-violet-500/50"
                />
                <p className="text-[10px] text-slate-600 mt-1">Gửi /start cho @userinfobot để lấy Chat ID của bạn</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Chế độ</label>
                <div className="flex gap-2">
                  {([['polling', 'Polling (Dev)'], ['webhook', 'Webhook (Prod)']] as const).map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => setMode(val as 'polling' | 'webhook')}
                      className={`flex-1 py-2 rounded-xl border text-xs font-medium transition ${mode === val ? 'bg-[#2AABEE]/20 border-[#2AABEE]/40 text-[#2AABEE]' : 'border-white/10 bg-white/3 text-slate-500 hover:bg-white/8'}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={saveConfig}
                disabled={!botToken || !chatId}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2AABEE] to-blue-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition"
              >
                {saved ? '✅ Đã lưu thành công!' : '💾 Lưu cấu hình'}
              </button>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="p-4 rounded-2xl border border-white/8 bg-white/3">
            <h3 className="text-sm font-bold text-slate-300 mb-3">📖 Hướng dẫn nhanh</h3>
            <ol className="space-y-2 text-xs text-slate-400">
              {[
                'Mở Telegram, tìm @BotFather và gửi /newbot',
                'Đặt tên và username cho bot của bạn',
                'Copy Bot Token và dán vào ô trên',
                'Gửi /start cho bot mới tạo của bạn',
                'Tìm @userinfobot để lấy Chat ID',
                'Lưu cấu hình và test gửi thông báo',
              ].map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2AABEE]/20 text-[#2AABEE] text-[10px] flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ── Tab: Log ── */}
      {activeTab === 'log' && (
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <p className="text-3xl mb-3">📨</p>
              <p className="text-sm">Chưa có tin nhắn nào trong phiên này</p>
              <p className="text-xs mt-1">Gửi thông báo test để xem nhật ký</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl border text-sm ${
                  msg.direction === 'outbound'
                    ? 'border-[#2AABEE]/20 bg-[#2AABEE]/5 ml-8'
                    : 'border-white/8 bg-white/3 mr-8'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">
                    {msg.direction === 'outbound' ? '📤 Đã gửi' : '📥 Nhận'} · {msg.type}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                <p className="text-slate-300">{msg.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
