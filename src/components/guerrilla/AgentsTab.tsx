import React, { useState } from 'react';
import { Cpu, ChevronRight, Sparkles, Terminal, Copy, Check, AlertCircle, BookOpen } from 'lucide-react';

export const AI_AGENTS = [
  {
    id: 'agent_dev',
    name: '💻 Game & App Logic Coder',
    description: 'Viết sạch mã nguồn game (GDScript, WebGL canvas), hạch toán, Chrome Extension hoặc script dọn dữ liệu thô (Pandas).',
    systemInstruction: 'Bạn là Senior Coding Agent chuyên biệt thiết kế micro-SaaS và mini-game di động/web trong tệp khép kín tối giản độc lực. Bạn viết code gọn gàng, súc mộc, đính kèm SQLite/cục bộ và các biện pháp tiết kiệm bộ nhớ, chi phí máy chủ serverless 0đ tối đa. Chỉ đưa ra code hoàn chỉnh kèm ghi chú giải thích ngắn gọn bằng tiếng Việt.',
    placeholder: 'Ví dụ: Hãy code cho tôi một controller di chuyển 2D cho nhân vật shipper bằng Godot Engine 4, tránh ổ gà rơi hố ga.',
    templates: [
      {
        label: '🎮 Godot 2D Shipper Controller',
        prompt: 'Hãy code script GDScript (Godot 4) cho nhân vật đi xe máy lách ổ gà bằng phím mũi tên hoặc chạm màn hình, có lý thuyết chuyển động, vận tốc và va chạm mẫu.'
      },
      {
        label: '🌐 Chrome Extension: Đối soát VietQR Web',
        prompt: 'Viết mã nguồn Javascript chèn vào mạng Chrome Extension để parse bảng lịch sử giao dịch HTML ngân hàng, lưu vào localStorage để kiểm tra hạch toán tự động.'
      },
      {
        label: '🧹 Pandas: Làm sạch data bán lẻ Việt',
        prompt: 'Viết mã python sử dụng pandas đọc từ excel đơn hàng hỗn loạn tại Việt Nam, lọc bỏ số điện thoại rác, chuẩn hóa tỉnh thành (Hồ Chí Minh, HN...) và xuất thành SQLite DB.'
      }
    ]
  },
  {
    id: 'agent_artist',
    name: '🎨 Art Prompt & Asset Architect',
    description: 'Chuyên gia thiết kế mỹ thuật & kiến trúc tài nguyên retro/pixel, chibi game hoặc flat UI mộc mạc nhất.',
    systemInstruction: 'Bạn là chuyên gia thiết kế tài nguyên đồ họa mini-game và flat UI cho solo founder. Bạn sẽ tạo ra các prompt recipe tỉ mỉ cho Midjourney, Stable Diffusion hoặc hướng dẫn thiết kế sprite-sheet, font chữ retro 8-bit và cách lắp ghép texture-atlas cực kỳ tối ưu dung lượng.',
    placeholder: 'Ví dụ: Tạo prompt vẽ skin "Shipper Ninja Ninja" phong cách pixel art 16x16.',
    templates: [
      {
        label: '👾 Skin Shipper Ninja Pixel Art',
        prompt: 'Tạo prompt vẽ bộ sprite sheet nhân vật Chibi Shipper Việt Nam đi xe cub, góc nhìn ngang 2D side-scroller, retro 16-bit pixel art, nền xanh trong suốt.'
      },
      {
        label: '🪙 Flat UI Gold & Voucher Icons',
        prompt: 'Tạo prompt Midjourney thiết kế trọn gói bento grid Icons 2D dạng vector phẳng cho game: đồng tiền vàng cổ Việt Nam, voucher trà sữa, xe máy xăng.'
      },
      {
        label: '🌆 Phố đi bộ ngập nước Parallax',
        prompt: 'Thiết kế concept và prompt background trò chơi chạy vô tận (infinite runner): Phố xá Sài Gòn mưa ngập nước, mờ ảo ánh đèn néon chiều tối.'
      }
    ]
  },
  {
    id: 'agent_vietqr',
    name: '💳 Auto-payment & Webhook Agent',
    description: 'Thiết kế luồng hạch toán, nạp rút tự động bằng quét VietQR hoặc ngân hàng không tốn chi phí ròng rã.',
    systemInstruction: 'Bạn là kiến trúc sư giải pháp tự động hóa tài chính và cổng thanh toán 0% phí tại Việt Nam. Bạn viết mã nguồn webhook và cung cấp giải pháp bóc tách thông báo chuyển khoản bằng bot Telegram (VietQR, MBBank, Techcombank, ACB) để kích hoạt vật phẩm game hoặc tài khoản SaaS tức thời mà không cần cổng thanh toán rườm rã.',
    placeholder: 'Ví dụ: Thiết kế code NodeJS nhận webhook từ Casso/Seapay giải quyết đối soát hóa đơn sỉ nạp 20.000đ.',
    templates: [
      {
        label: '⚡ NodeJS Webhook đối soát tự động',
        prompt: 'Viết mã Express NodeJS nhận payload webhook giao dịch VietQR ngân hàng, kiểm tra cú pháp "LF_MEMBER_XYZ", đối soát số tiền khớp rồi cập nhật cơ sở dữ liệu SQLite cục bộ.'
      },
      {
        label: '📲 Script Google App Script gửi TeleBot',
        prompt: 'Viết App Script cho Google Sheet khi có dòng sao kê nạp tiền ngân hàng mới sẽ lập tức gửi thông báo đẩy (push notifications) Telegram chứa số tiền và nội dung chuyển khoản.'
      },
      {
        label: '🏷️ Sinh ảnh VietQR động trên thiết bị',
        prompt: 'Viết mã JS React/HTML5 tạo nhanh QR thanh toán chuẩn VietQR có nạp sẵn số tiền và nội dung đơn hàng (dùng API vietqr.io hoặc tự vẽ bằng thư viện QR) để khách quét nạp trực tiếp.'
      }
    ]
  },
  {
    id: 'agent_growth_hacker',
    name: '📢 Indie Growth & Viral Specialist',
    description: 'Chuyên gia tiếp thị du kích Việt Nam, ASO chợ ứng dụng và khơi mào hiệu ứng truyền thông tự nhiên.',
    systemInstruction: 'Bạn là bậc thầy tiếp thị du kích và chuyên gia tăng trưởng tự nhiên vô biên chí. Bạn lập kế hoạch tiếp thị, tạo kịch bản video ngắn TikTok/Capcut, viết mô tả ứng dụng khoét sâu nỗi đau, tối ưu ASO cho Google Play/AppStore để bán hàng loạt giá cực rẻ thu MRR cao.',
    placeholder: 'Ví dụ: Lập kịch bản video TikTok 15 giây ra mắt game phi xe dọn rác ngập nước.',
    templates: [
      {
        label: '🎬 Kịch bản TikTok Viral giật gân',
        prompt: 'Hãy lập kịch bản video TikTok 15 giây cho game "Sài Gòn Rush", nhắm đúng cảnh kẹt xe ngập nước thực tế, thu hút 50.000 lượt cài đặt không tốn chi phí ads.'
      },
      {
        label: '📝 Bài mô tả ASO thọc sâu nỗi đau',
        prompt: 'Viết bài mô tả chuẩn SEO di động (Google Play) cho sản phẩm "VietQR Auto-Ledger" làm sao để các chủ shop online nhìn vào thấy ngay nỗi mất bill hằng ngày và bấm tải ngay.'
      },
      {
        label: '🎯 Thử thách "Mỗi ngày 1 nghìn đồng" viral',
        prompt: 'Xây dựng kế hoạch viral truyền miệng trên cách tính năng tích điểm, tặng quà hoặc mua vĩnh viễn với giá hạt dẻ kích thích khách hàng chia sẻ nhóm chat.'
      }
    ]
  }
];

interface AgentsTabProps {
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  agentUserInput: string;
  setAgentUserInput: (input: string) => void;
  agentOutput: string;
  setAgentOutput: (output: string) => void;
}

export default function AgentsTab({
  selectedAgentId,
  setSelectedAgentId,
  agentUserInput,
  setAgentUserInput,
  agentOutput,
  setAgentOutput
}: AgentsTabProps) {
  const [loadingAgent, setLoadingAgent] = useState<boolean>(false);
  const [agentError, setAgentError] = useState<string>( '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleTriggerAgent = async () => {
    if (!agentUserInput.trim()) return;
    setLoadingAgent(true);
    setAgentError('');
    const selectedAgent = AI_AGENTS.find(a => a.id === selectedAgentId);
    if (!selectedAgent) return;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: agentUserInput,
          systemInstruction: selectedAgent.systemInstruction
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAgentOutput(data.text || data.content || data.output || '');
      } else {
        if (data.isMissingKey || String(data.error || '').toLowerCase().includes('key')) {
          setAgentError('⚠️ Chưa cấu hình AI Gateway/Secrets. Agent đang kích hoạt chế độ tư duy ngoại tuyến siêu tốc.');
          
          let fallbackResult = '';
          if (selectedAgentId === 'agent_dev') {
            fallbackResult = `### 💻 [CHẾ ĐỘ NGOẠI TUYẾN] KẾT QUẢ PHÁT TRIỂN GAME & CODE

Yêu cầu nhận được: **"${agentUserInput}"**

**1. Kiến trúc tối ưu & Giải pháp**:
- Tải trọng tối giản, chạy offline trên thiết bị khách hàng để giảm hóa đơn server VPS về 0đ.
- Phục vụ tệp khách hàng Việt Nam ngách di động với SQLite làm dữ liệu và LocalStorage làm bộ nhớ đệm.

**2. Đoạn mã hạch toán nguồn mẫu rút gọn (Copy-paste ngay)**:
\`\`\`javascript
// Script hạch toán offline tự động VietQR hời nhất
async function processVietQRpayment(transactionContent, amountPaid) {
  console.log("💎 Đang phân rã giao dịch nhận tiền:", transactionContent);
  const codeRegex = /LF[A-Z0-9\\_]+/i;
  const match = transactionContent.match(codeRegex);
  
  if (match) {
    const orderCode = match[0].toUpperCase();
    console.log("✅ Đã phát hiện đơn hàng cần kích hoạt:", orderCode);
    
    // Gửi tín hiệu về SQLite hạch toán không tốn phí 
    return {
      status: "APPROVED",
      orderId: orderCode,
      amount: amountPaid,
      processingTime: new Date().toISOString()
    };
  }
  return { status: "MANUAL_CHECK", reason: "Sai cú pháp" };
}
\`\`\`

*Cảnh báo: Hãy thiết lập provider key trong AI Vault/Secrets của Studio để cho phép AI Agent thiết kế các hệ thống code phức tạp hơn!*`;
          } else if (selectedAgentId === 'agent_artist') {
            fallbackResult = `### 🎨 [CHẾ ĐỘ NGOẠI TUYẾN] PROMPT RECIPE MỸ THUẬT SIÊU ĐẸP

Yêu cầu nhận được: **"${agentUserInput}"**

**1. Công thức thiết kế tài nguyên (Asset Recipe)**:
- **Tối ưu Game Feel**: Quy chuẩn hóa frame size cực mịn 16x16 hoặc 32x32 pixel để giảm thiểu bộ nhớ RAM khi chơi Web HTML5.
- **Tone màu chỉ định**: Cozy Retro ấm áp pha lẫn màu đèn đường Neon ban đêm tại đô thị Việt Nam.

**2. Prompt mẫu dùng vẽ bằng Midjourney / SDXL**:
> \`vietnamese traditional street setup, game design sprite sheet, clean 16-bit pixel art of chibi elements, seamless vector texture asset, transparent background --v 6.0\`

*Hãy nạp tài khoản API Key để Agent sáng tạo thêm các thiết kế chuyển động animation mượt mà!*`;
          } else if (selectedAgentId === 'agent_vietqr') {
            fallbackResult = `### 💳 [CHẾ ĐỘ NGOẠI TUYẾN] GIẢI PHÁP WEBHOOK & TỰ ĐỘNG HOÁ VIETQR

Yêu cầu nhận được: **"${agentUserInput}"**

**1. Sơ đồ xử lý không cần trung gian thanh toán**:
- Khách quét mã VietQR -> Tiền đổ về SeABank/MB -> SeAPay đẩy tín hiệu Telegram API -> Bot NodeJS trên máy chủ 0đ Vercel phân tích đối khớp nợ -> Kích hoạt tiền vàng hoặc phần mềm tức khắc.

**2. Đoạn mã sinh QR Code động cực gọn**:
\`\`\`javascript
// Desktop offline: render QR locally with a bundled QR encoder.
function buildVietQRPayload(bankId, accountNo, amount, info) {
  const cleanInfo = String(info).replace(/[^a-zA-Z0-9_\\\\s]/g, "").trim();
  return {
    bankId,
    accountNo,
    amount,
    addInfo: cleanInfo,
    reviewRequired: true
  };
}
\`\`\`

*Vui lòng tích hợp thêm khóa để lập trình trọn vẹn luồng bảo mật JWT đối soát!*`;
          } else {
            fallbackResult = `### 📢 [CHẾ ĐỘ NGOẠI TUYẾN] KỊCH BẢN MARKETING TĂNG TRƯỞNG DU KÍCH VN

Yêu cầu nhận được: **"${agentUserInput}"**

**1. Chiến thuật thu hút không tốn 1 đồng quảng cáo**:
- Sản phẩm rẻ chỉ từ **10.000đ - 35.000đ** rất dễ đưa ra quyết định mua hàng. Hãy làm kịch bản TikTok so sánh giá trị sản phẩm với 1 cốc cà phê vỉa hè để tạo viral.

**2. Mẫu Kịch bản Video Tiktok 15s**:
- **0-3s (Mở đầu sốc)**: "Thề, đúng 1 cốc trà đá mà cứu tôi khỏi 4 tiếng làm báo cáo tay mỗi tối... dại gì không thử?"
- **3-9s (Chứng minh)**: Quay trực diện thao tác kéo chọn file, bấm 1 cái hiện ra QR chuyển tiền, quét xong nhận file sạch bóng xịn sò.
- **9-15s (Kêu gọi)**: Link download ngách miễn phí ở bio. Mua vĩnh viễn không quảng cáo giá bằng ổ bánh mì!`;
          }
          setAgentOutput(fallbackResult);
        } else {
          setAgentError(data.error || 'Dịch vụ bận, vui lòng thử lại sau ít phút.');
        }
      }
    } catch (e) {
      console.error(e);
      setAgentError('Không thể kết nối API AI hoặc máy chủ bị tắt nghẽn.');
    } finally {
      setLoadingAgent(false);
    }
  };

  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-black text-white mt-5 border-b border-slate-900 pb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-3 rounded bg-emerald-500 animate-pulse"></span>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-black text-emerald-404 mt-6 flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-emerald-500" />
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 pl-4 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow shadow-emerald-500/50"></span>
            <span className="text-slate-300 text-xs font-semibold leading-relaxed">{line.substring(2)}</span>
          </div>
        );
      }
      if (line.trim().match(/^\d+\.\s/)) {
        return (
          <div key={idx} className="flex items-start gap-2 pl-4 py-1 text-xs font-semibold text-slate-300">
            <span className="text-emerald-400 font-mono font-bold shrink-0">{line.match(/^\d+\./)?.[0]}</span>
            <span className="leading-relaxed">{line.replace(/^\d+\.\s/, '')}</span>
          </div>
        );
      }
      return line.trim() === '' ? <div key={idx} className="h-2"></div> : <p key={idx} className="text-slate-300 text-xs leading-relaxed font-semibold pl-1">{line}</p>;
    });
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-stretch">
      {/* LEFT PANEL: SELECTOR AGENTS ROSTER & TEMPLATES */}
      <div className="lg:col-span-12 xl:col-span-5 bg-gradient-to-b from-[#060a12]/90 to-slate-950 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between shadow-lg space-y-4">
        <div className="space-y-4">
          <div className="border-b border-slate-900 pb-2.5">
            <span className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-sans">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Bục Chỉ Huy Biệt Đội AI Agent ({AI_AGENTS.length})
            </span>
            <p className="text-[10.5px] text-slate-400 mt-1 font-semibold leading-relaxed">
              Bấm chọn Agent có nghiệp vụ phù hợp để yêu cầu Code, Thiết kế Prompt Chibi, hoặc xây cổng VietQR auto-ledger tức khắc:
            </p>
          </div>

          {/* AGENT CARDS LIST */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {AI_AGENTS.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    setAgentUserInput(agent.templates[0].prompt);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden select-none ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-500/5'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{agent.name}</span>
                    {isSelected && (
                      <span className="bg-emerald-500/15 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded leading-none border border-emerald-500/20">
                        ON DUYỆT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold mt-1.5">
                    {agent.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* PRESETS PROMPT FOR CURRENT AGENT */}
          {selectedAgentId && (
            <div className="space-y-2 bg-[#04080e]/60 p-3 rounded-2xl border border-slate-850">
              <span className="text-[10px] font-black text-emerald-400 tracking-wider block">
                ⭐ Mẫu prompts tối ưu nạp sẵn (Bấm nạp nhanh):
              </span>
              
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {AI_AGENTS.find(a => a.id === selectedAgentId)?.templates.map((tpl, tidx) => (
                  <button
                    key={tidx}
                    type="button"
                    onClick={() => setAgentUserInput(tpl.prompt)}
                    className="text-left w-full text-[10.5px] font-bold text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/20 p-2 rounded-xl transition-all border border-transparent hover:border-emerald-950/40 flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">👉 {tpl.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* INTERACTIVE TEXT INPUT AREA */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono tracking-wider">
              Mệnh lệnh tác chiến cho Agent:
            </label>
            <textarea
              rows={3}
              value={agentUserInput}
              onChange={e => setAgentUserInput(e.target.value)}
              placeholder={AI_AGENTS.find(a => a.id === selectedAgentId)?.placeholder || 'Nhập yêu cầu...'}
              className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 font-semibold"
            />
          </div>

          <button
            onClick={handleTriggerAgent}
            disabled={loadingAgent || !agentUserInput.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500"
          >
            {loadingAgent ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Agent đang bóc tách phân nguồn lập trình...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Kích Hoạt Agent - Kết Xuất Tài Nguyên!</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: LIVE AGENT LOGS & CONSOLE TERMINAL OUTPUT */}
      <div className="lg:col-span-12 xl:col-span-7 bg-[#04080d]/80 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between shadow-lg space-y-4 min-h-[500px]">
        <div className="flex-1 flex flex-col justify-between space-y-3">
          {/* Virtualized Terminal Console Header */}
          <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-900">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute"></span>
              <span className="text-[10.5px] font-mono font-black text-slate-300 uppercase tracking-widest">
                AI-AGENTS-SANDBOX.sh
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 font-bold">
              {loadingAgent ? (
                <span className="text-emerald-400 animate-pulse">⚙️ COMPILING PROMPT RECIPES...</span>
              ) : (
                <span>● CLIENT CONNECTED | PORT: 3000</span>
              )}
            </div>
          </div>

          {/* Main output element */}
          <div className="bg-slate-950/60 p-4.5 rounded-2xl border border-slate-900/90 flex-1 overflow-y-auto max-h-[520px] scrollbar-thin scrollbar-thumb-slate-900 select-text">
            {loadingAgent ? (
              <div className="py-24 text-center space-y-6">
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                  <Cpu className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono">
                    ⚙️ TRUY VẤN MÔ HÌNH TRỰC CHIẾN...
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Đang định hình Star Schema dữ liệu, dọn dẹp các tệp, đóng gói script bypass trung gian thanh toán và lên nòng kịch bản tiếp thị...
                  </p>
                </div>

                <div className="text-[9.5px] font-mono text-slate-405 space-y-2 text-left max-w-xs mx-auto bg-[#04080e] p-3 rounded-xl border border-slate-900">
                  <p className="flex items-center gap-2"><span className="text-emerald-505">▶</span> npx ant-agent-runner init</p>
                  <p className="flex items-center gap-2 text-emerald-400"><span className="text-emerald-505 animate-pulse">●</span> Loading Agent System Instruction System...</p>
                  <p className="flex items-center gap-2 text-slate-500"><span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span> Lập trình thuật toán tối giản Việt Nam...</p>
                </div>
              </div>
            ) : agentError ? (
              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-amber-300 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-400 font-black font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Thông báo ngoại tuyến</span>
                </div>
                <p className="font-semibold leading-relaxed">{agentError}</p>

                {agentOutput && (
                  <div className="pt-3 border-t border-slate-900/80 mt-2 space-y-3">
                    <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Kế hoạch nạp mẫu ngoại tuyến:</span>
                    <div className="text-slate-300 font-sans">{renderMarkdownText(agentOutput)}</div>
                  </div>
                )}
              </div>
            ) : agentOutput ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-900 mb-2 font-sans">
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    AGENT SOURCE-REPLY VALIDATED
                  </span>
                  <button
                    onClick={() => copyText(agentOutput, 'active_agent_out')}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-850 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold transition-all shadow"
                  >
                    {copiedId === 'active_agent_out' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy mã / prompts</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 font-sans select-text">
                  {renderMarkdownText(agentOutput)}
                </div>
              </div>
            ) : (
              <div className="py-28 text-center space-y-3 max-w-sm mx-auto">
                <BookOpen className="w-12 h-12 text-slate-700 mx-auto" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight">Khu Vực Xuất Hoạt Cảnh</h4>
                <p className="text-[10.5px] text-slate-500 leading-relaxed font-semibold">
                  Chưa kích hoạt agent nào. Vui lòng bấm chọn một Agent, nạp mẫu prompts hoặc viết yêu cầu của bạn ở bảng điều khiển bên trái rồi bấm <strong>"Kích Hoạt Agent"</strong> để thu hoạch kết quả hoàn mỹ!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Interactive agent feedback system footer info */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900 text-[10.5px] font-semibold text-slate-400 leading-relaxed flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p>
            <strong>Mẹo du kích:</strong> Hãy tận dụng tối đa <strong>Game & App Logic Coder</strong> để nhận các mã nguồn thô của SQLite, Web, hoặc GDScript, sau đó dán vào code editor để chạy thử và hoàn chỉnh game mộc mạc trong đúng 5-7 ngày!
          </p>
        </div>
      </div>
    </div>
  );
}
