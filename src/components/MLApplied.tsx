// Version 2.0 - MLApplied (Machine Learning Ứng Dụng Thực Tế)
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Cpu, 
  Terminal, 
  Sparkles, 
  Copy, 
  Gamepad2, 
  Database,
  ArrowRight,
  GitBranch,
  Eye,
  Activity,
  Mic,
  MicOff,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MLApplied() {
  const [activeTab, setActiveTab] = useState<'layer1' | 'layer2' | 'layer3' | 'vision'>('layer1');
  const [copiedCodeFlag, setCopiedCodeFlag] = useState<string | null>(null);

  const triggerCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeFlag(key);
    setTimeout(() => setCopiedCodeFlag(null), 2000);
  };

  // --- TAB 1: Layer 1 Speech API Hook ---
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [parsedValue, setParsedValue] = useState<number | null>(null);

  const startVoiceRecognition = () => {
    // Check Web Speech API availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ Web Speech API. Vui lòng sử dụng Google Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'vi-VN';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
      setVoiceText('Đang lắng nghe giọng nói của bạn...');
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setVoiceText(transcript);
      parseAmountFromVoice(transcript);
    };

    rec.start();
  };

  const parseAmountFromVoice = (text: string) => {
    const t = text.toLowerCase();
    let multiplier = 1;
    if (t.includes('triệu')) multiplier = 1000000;
    else if (t.includes('nghìn') || t.includes('ngàn') || t.includes('k')) multiplier = 1000;

    // Extract numbers
    const match = t.match(/\d+/);
    if (match) {
      const num = parseInt(match[0]);
      setParsedValue(num * multiplier);
    } else {
      // Text parsing fallback simple strings
      if (t.includes('ba trăm năm mươi')) {
        setParsedValue(350000);
      } else if (t.includes('một triệu')) {
        setParsedValue(1000000);
      } else if (t.includes('năm mươi nghìn')) {
        setParsedValue(50000);
      } else {
        setParsedValue(null);
      }
    }
  };

  // --- TAB 2: Layer 2 Time series data simulation ---
  const timeSeriesData = [
    { day: "05/01", actual: 120, predicted: 110, limitLower: 90, limitUpper: 130 },
    { day: "05/02", actual: 140, predicted: 135, limitLower: 115, limitUpper: 155 },
    { day: "05/03", actual: 155, predicted: 150, limitLower: 130, limitUpper: 170 },
    { day: "05/04", actual: 190, predicted: 185, limitLower: 160, limitUpper: 210 },
    { day: "05/05", actual: 210, predicted: 220, limitLower: 195, limitUpper: 245 },
    { day: "05/06", actual: 180, predicted: 190, limitLower: 165, limitUpper: 215 },
    { day: "05/07", actual: 232, predicted: 240, limitLower: 210, limitUpper: 270 }
  ];

  // --- TAB 3: Layer 3 FSM Grid & Interactive ---
  const [fsmState, setFsmState] = useState<'idle' | 'patrol' | 'chase' | 'attack'>('idle');
  const [agentPos, setAgentPos] = useState({ r: 4, c: 1 });
  const [targetPos, setTargetPos] = useState({ r: 2, c: 6 });

  const fsmTriggers: Record<string, any> = {
    'idle': { desc: "Enemy đang đứng gác tại chỗ cũ. Đợi phát hiện khoảng cách...", next: "Bắt đầu tuần tra tự động" },
    'patrol': { desc: "Enemy di chuyển giữa các điểm lưới (1,1) -> (5,1) tuần tra.", next: "Phát hiện mục tiêu" },
    'chase': { desc: "Khoảng cách dưới 3 ô! Di chuyển bám đuổi khát máu phía người chơi.", next: "Sát thương cận chiến" },
    'attack': { desc: "Tiếp cận mốc 1 ô! Kích hoạt đòn đánh chém rực lửa.", next: "Mục tiêu chạy thoát" }
  };

  const handleNextFSMState = () => {
    if (fsmState === 'idle') setFsmState('patrol');
    else if (fsmState === 'patrol') {
      setAgentPos({ r: 3, c: 4 });
      setFsmState('chase');
    }
    else if (fsmState === 'chase') {
      setAgentPos({ r: 2, c: 5 });
      setFsmState('attack');
    }
    else if (fsmState === 'attack') {
      setAgentPos({ r: 5, c: 2 });
      setFsmState('patrol');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <section className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Machine Learning Ứng Dụng Thực Tế</h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Khai sinh trí tuệ nhân tạo thiết thực theo 3 tầng: Gọi API Vision OCR, tự Train Model kinh tế nhỏ, hay thiết kế giải thuật Game AI.
            </p>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('layer1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'layer1' ? 'bg-cyan-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tầng 1: Gọi API Trực Tiếp
          </button>
          <button
            onClick={() => setActiveTab('layer2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'layer2' ? 'bg-cyan-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tầng 2: Train Model Nhỏ
          </button>
          <button
            onClick={() => setActiveTab('layer3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'layer3' ? 'bg-cyan-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tầng 3: ML cho Game Dev
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vision' ? 'bg-cyan-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tầng 2+3: Computer Vision
          </button>
        </div>
      </section>

      {/* =================================== TAB 1: API TẦNG 1 =================================== */}
      {activeTab === 'layer1' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Ứng dụng nhanh không cần cài máy chủ GPU nặng
              </span>
              <h3 className="text-base font-black text-white">Tầng 1 - Kính Phóng Đại Trợ Lý Qua API AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Tại tầng này, solo founder tiếp cận trí tuệ nhân tạo một cách siêu tốc bằng cách sử dụng các API đằng sau của mô hình ngôn ngữ lớn (LLM) để trích xuất vật lý tài liệu hay phân lớp văn bản mà không phải tự tải mã thư viện PyTorch đồ sộ.
              </p>
            </div>

            {/* OCR segment */}
            <div className="space-y-2.5 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                OCR Hóa Đơn Trực Tuyến với Gemini Vision API
              </span>
              <p className="text-[11px] text-slate-300 leading-normal font-semibold">
                Sử dụng mô hình đa phương thức (Multimodal API) của Gemini để chụp hóa đơn, prompt mô hình chuyển đổi trực tiếp sang định dạng dữ liệu có cấu trúc JSON để nhập dòng tài chính.
              </p>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1.5">
                <span>TypeScript SDK - Structured parsing JSON</span>
                <button
                  onClick={() => triggerCopy(`async function extractInvoiceData(base64Image) {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Extract all invoice details. Format the output STRICTLY as JSON with fields: {vendor, amount, tax_rate, date, items[]}",
      model: "ai-assistant-pro",
      file: {
        mimeType: "image/jpeg",
        data: base64Image
      }
    })
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || "AI Gateway failed");
  const text = String(data.text || data.content || data.output || "{}").replace(/\\\`\\\`\\\`json|\\\`\\\`\\\`/g, "");
  return JSON.parse(text);
}`, 'ocr_ts')}
                  className="text-cyan-400 hover:text-cyan-300 font-extrabold uppercase cursor-pointer"
                >
                  {copiedCodeFlag === 'ocr_ts' ? "Đã chép!" : "Copy code"}
                </button>
              </div>
            </div>

            {/* Few shot classification bank note */}
            <div className="space-y-2 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <span className="text-xs font-black text-cyan-405 uppercase">Phân Loại Giao Dịch NLP Việt hóa (Few-shot prompting)</span>
              <p className="text-[11px] text-slate-300 leading-normal font-semibold">
                Nạp 5-10 mẫu chuyển khoản cực kỳ phong phú của người Việt rành hạch toán để AI phân loại chính xác các danh mục Chi phí / Thu nhập / Nội bộ của doanh nghiệp.
              </p>
            </div>
          </div>

          {/* Interactive Microphone parser fallback */}
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-black text-white flex items-center gap-1.5 leading-none">
              <Mic className="w-5 h-5 text-cyan-400" />
              Speech-to-Text Nhập Liệu Điểm Số
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Trải nghiệm Web Speech API tích hợp trực tiếp trên trình duyệt bằng cách ấn nút Microphone dưới đây, nói thử một số tiền tiếng Việt bằng giọng nói (Ví dụ: <strong>\"ba trăm năm mươi nghìn đồng\"</strong> hoặc <strong>\"một triệu đồng\"</strong>) để chương trình tự động trích lọc chuyển thành số thực tế hạch toán.
            </p>

            <div className="p-5 bg-slate-950 border border-slate-850 rounded-xl text-center space-y-4">
              <button
                onClick={startVoiceRecognition}
                className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-rose-600 border-rose-500 shadow-lg shadow-rose-500/20 text-white animate-pulse' 
                    : 'bg-cyan-650 border-cyan-550 text-white shadow-lg shadow-cyan-500/15 hover:bg-cyan-550'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Kết Quả Nhận Diện Giọng Nói</span>
                <p className="text-xs text-slate-200 font-bold italic min-h-[22px]">
                  {voiceText || "Vui lòng bấm mic và bắt đầu nói..."}
                </p>
              </div>

              {parsedValue !== null && (
                <div className="p-3.5 bg-cyan-950/20 border border-cyan-900/30 rounded-xl">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-cyan-400 block font-black">Giá trị số tiền quy đổi ròng</span>
                  <strong className="text-lg font-black text-cyan-400 font-mono">
                    {parsedValue.toLocaleString()} VNĐ
                  </strong>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 leading-normal font-semibold">
              * Mộc: Web Speech API hỗ trợ xử lý giọng tiếng Việt cực kỳ tự nhiên không đồng nghĩa tốn kém băng thông máy chủ Cloud AI ở xa.
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 2: TRAINING TẦNG 2 =================================== */}
      {activeTab === 'layer2' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="space-y-1.5">
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Sử dụng khi đã tích lũy trên 500 bản ghi dữ liệu
              </span>
              <h3 className="text-base font-black text-white">Tầng 2 - Huấn Luyện Các Mô Hình Dự Báo Nhỏ &amp; Churn</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Tại tầng này, solo founder tự tay lập trình huấn luyện các mô hình Machine Learning cổ điển (Logistic Regression, TF-IDF hay Facebook Prophet Time-series) trên mảng dữ liệu nội bộ sẵn có của mình. Những mô hình này hoạt động siêu tốc, kích thước siêu nhẹ (&lt;1MB) có thể chạy mọi hạ tầng rẻ tiền.
              </p>
            </div>

            {/* Pipeline list */}
            <div className="space-y-3">
              <div className="p-4.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-200 block border-b border-slate-900 pb-1.5">Phân loại giao dịch thô bằng Scikit-Learn</span>
                <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                  Chuyển hóa dữ liệu mô tả tiếng Việt thô thành biểu diễn vector rồi áp mô hình Logistic Regression nhằm tối ưu hóa chi phí máy chủ ròng.
                </p>
                <button
                  onClick={() => triggerCopy(`from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle

# 1. Vector hóa văn bản tiếng Việt có dấu
vectorizer = TfidfVectorizer(max_features=1000)
X_train_vector = vectorizer.fit_transform(raw_vietnamese_notes)

# 2. Huấn luyện Logistic Classifier mượt nhẹ cực nhanh
clf = LogisticRegression()
clf.fit(X_train_vector, labels)

# 3. Export model lưu xuống ổ đĩa nhẹ tênh
with open('transaction_model.pkl', 'wb') as f:
    pickle.dump((vectorizer, clf), f)`, 'sklearn_code')}
                  className="px-2 py-0.5 text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded cursor-pointer"
                >
                  {copiedCodeFlag === 'sklearn_code' ? "Đã COPY!" : "Copy code python"}
                </button>
              </div>

              {/* Churn Prediction block */}
              <div className="p-4.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-200 block border-b border-slate-900 pb-1.5">Dự báo rủi ro người dùng bỏ đi (Churn Prediction)</span>
                <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                  Theo dõi hoạt động: số ngày chưa đăng nhập lại, số lỗi giao dịch. Kích hoạt logistic regression cho xác suất churn từ 0-100%, trigger email báo động tự động nếu kết quả nhảy lên mốc trên 60%.
                </p>
              </div>
            </div>
          </div>

          {/* Time Series Charts Prediction */}
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <Activity className="w-5 h-5 text-cyan-405" />
              Dự Báo Doanh Thu (Time Series)
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Mô hình toán học chuỗi thời gian (Prophet) dự toán xu hướng dòng tiền ròng của cửa hàng trong 30 ngày tiếp theo bằng cách phân tách yếu tố chu kỳ Việt Nam (Bùng nổ mua hàng tết nguyên đán, ngày lễ mùng 8 tháng 3, ngày 20 tháng 10 hay Black Friday).
            </p>

            {/* Recharts chart line actual vs predicted */}
            <div className="h-[200px] w-full pt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#03060c', borderColor: '#1e293b' }} />
                  <Line type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={2.5} name="Sản lượng thực tế" />
                  <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeDasharray="5 5" name="Kỳ vọng dự báo" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-black block">Mã nguồn chạy Dự báo (Facebook Prophet Pipeline)</span>
              <pre className="text-[10px] font-mono text-slate-350 select-text overflow-x-auto max-h-[100px]">
{`from prophet import Prophet
# df chứa cột 'ds' (date) và 'y' (doanh thu)
model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
model.fit(df)
future = model.make_future_dataframe(periods=30)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 3: GAME AI TẦNG 3 =================================== */}
      {activeTab === 'layer3' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="space-y-1.5">
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Ứng dụng vào trong mã lập trình nhân vật
              </span>
              <h3 className="text-base font-black text-white">Tầng 3 - Cơ Chế Trí Tuệ Nhân Tạo Trong Game 2D/3D</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Tại mục này, nhà sáng lập tìm hiểu các giải thuật thông minh (FSM, A* Pathfinding, map ngẫu nhiên BSP hay thuật toán Q-Learning tự học) áp dụng trực tiếp trong Phaser.js hay Godot để enemy tự di chuyển né rào cản tinh diệu.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* BSP Procedural Generation */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  Sinh map ngẫu nhiên BSP
                </span>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Thuật toán <strong>Binary Space Partitioning (BSP)</strong> chia nhỏ liên hoàn mặt đáy thành các hình hộp chữ nhật để tạo phòng dungeon ngẫu nhiên độc đáo mà không gây lỗi chồng map.
                </p>
              </div>

              {/* Tensorflow Swipe recognizer */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-105 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  Nhận diện vuốt bằng Neural Net
                </span>
                <p className="text-[11px] text-slate-404 font-semibold leading-relaxed">
                  Sử dụng mạng nơ-ron tí hon của TensorFlow.js chạy offline gọn gàng trên mobile để classify cử chỉ vuốt tay (Left/Right/Circle) mượt mà kỳ lạ.
                </p>
              </div>
            </div>

            {/* Q-learning pseudocode */}
            <div className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>JavaScript Class - Phaser.js FSM State Machine Enemy</span>
                <button
                  onClick={() => triggerCopy(`class StateMachine {
  constructor(initialState) {
    this.state = initialState;
  }
  transition(newState) {
    console.log("FSM Transitioning to: " + newState);
    this.state = newState;
  }
}
class EnemyAI extends StateMachine {
  update(distanceToPlayer) {
    if (this.state === 'idle' && distanceToPlayer < 100) {
      this.transition('chase');
    } else if (this.state === 'chase' && distanceToPlayer < 20) {
      this.transition('attack');
    } else if (this.state === 'attack' && distanceToPlayer > 30) {
      this.transition('chase');
    }
  }
}`, 'fsm_js')}
                  className="text-cyan-400 font-bold hover:text-cyan-300"
                >
                  {copiedCodeFlag === 'fsm_js' ? "Đã COPY!" : "Copy code"}
                </button>
              </div>
              <pre className="text-[10px] font-mono text-slate-350 select-text overflow-x-auto max-h-[140px]">
{`class EnemyAI extends StateMachine {
  update(distanceToPlayer) {
    if (this.state === 'idle' && distanceToPlayer < 100) this.transition('chase');
    else if (this.state === 'chase' && distanceToPlayer < 20) this.transition('attack');
  }
}`}
              </pre>
            </div>
          </div>

          {/* Interactive FSM Simulator Visualizing FSM Grid 8x8 */}
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              Lập trình Enemy AI (FSM Grid)
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Trải nghiệm cơ chế FSM State Machine: Nhấn nút di chuyển để giả lập việc nhân vật solo tiến gần quái vật và xem trạng thái quyết định của quái vật tức thì.
            </p>

            {/* Grid 8x8 representation */}
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>Trạng thái Enemy hiện thời:</span>
                <span className="px-2.5 py-0.5 rounded uppercase text-[10.5px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse font-extrabold shadow">
                  {fsmState}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal italic font-semibold">{fsmTriggers[fsmState].desc}</p>

              {/* Grid drawing visual */}
              <div className="grid grid-cols-8 gap-1.5 bg-slate-900 p-2 border border-slate-800 rounded-xl text-center">
                {Array.from({ length: 8 }, (_, rIdx) => 
                  Array.from({ length: 8 }, (_, cIdx) => {
                    const row = rIdx + 1;
                    const col = cIdx + 1;
                    const isAgent = row === agentPos.r && col === agentPos.c;
                    const isTarget = row === targetPos.r && col === targetPos.c;
                    return (
                      <div 
                        key={`${row}-${col}`} 
                        className={`h-7 rounded-sm flex items-center justify-center text-[9px] font-bold ${
                          isAgent 
                            ? 'bg-rose-500 text-white shadow shadow-rose-500/30' 
                            : isTarget 
                            ? 'bg-sky-500 text-white shadow shadow-sky-500/30 animate-pulse' 
                            : 'bg-slate-950 border border-slate-850'
                        }`}
                      >
                        {isAgent ? "😈" : isTarget ? "👤" : ""}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleNextFSMState}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-550 text-white rounded-lg text-xs font-bold cursor-pointer font-sans shadow"
                >
                  {fsmTriggers[fsmState].next} &rarr;
                </button>
                <button
                  onClick={() => {
                    setFsmState('idle');
                    setAgentPos({ r: 4, c: 1 });
                  }}
                  className="px-3 bg-slate-900 border border-slate-800 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                  title="Đặt lại mô phỏng"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 4: COMPUTER VISION FOR APP =================================== */}
      {activeTab === 'vision' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Xử lý hình ảnh offline ngay tại rìa
              </span>
              <h3 className="text-base font-black text-white">Tầng 2+3 - Computer Vision cho Game &amp; Ứng Dụng Kế Toán</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Chào nhà sáng lập! Thay vì chuyển tiếp toàn bộ hình ảnh chụp lên máy chủ nước ngoài với chi phí cực lớn, bạn có thể nhúng trực tiếp các mô hình phát hiện vật thể (Object Detection), landmarks cơ thể (MediaPipe) hay bộ OCR offline chạy mượt mà ngay trên điện thoại khách hàng.
              </p>
            </div>

            {/* Comparison card details */}
            <div className="grid sm:grid-cols-3 gap-4.5 pt-2">
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-200">Face filter &amp; Gestures</span>
                <p className="text-[11px] text-slate-400 font-medium">
                  Sử dụng thư viện MediaPipe để dò tìm landmarks khuôn mặt hòng vẽ filter kính đeo hay phát hiện cử chỉ vẫy tay vút lẹ trong game di động AR.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-200">Tesseract.js Offline OCR</span>
                <p className="text-[11px] text-slate-400 font-medium">
                  Trình OCR tự lập chạy offline thẳng thừng trên trình duyệt qua JavaScript. Thích hợp cho tác vụ scan số hóa đơn cơ bản, dung lượng nặng tầm 2MB.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-200">TF.js Object Detect</span>
                <p className="text-[11px] text-slate-400 font-medium">
                  Nhận diện và dán nhãn các hộp vật thể (bounding box) đi qua ống kính camera điện thoại, kích hoạt các sự kiện đặc thù trong game di động.
                </p>
              </div>
            </div>

            {/* Code template for tesseract offline */}
            <div className="space-y-3 bg-slate-950 p-4.5 border border-slate-850 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>React TypeScript - Offline Tesseract.js OCR Setup</span>
                <button
                  onClick={() => triggerCopy(`import { createWorker } from 'tesseract.js';

async function performOfflineOCR(imageBlob) {
  const worker = await createWorker('vie'); // Nạp gói ngôn ngữ Tiếng Việt offline
  const ret = await worker.recognize(imageBlob);
  console.log("OCR text output: " + ret.data.text);
  await worker.terminate();
  return ret.data.text;
}`, 'tess_code')}
                  className="text-cyan-405 font-bold hover:text-white"
                >
                  {copiedCodeFlag === 'tess_code' ? "Đã COPY!" : "Copy code Setup"}
                </button>
              </div>
              <pre className="text-[10px] font-mono text-slate-350 select-text overflow-x-auto max-h-[140px]">
{`async function performOfflineOCR(imageBlob) {
  const worker = await createWorker('vie'); // Tiếng Việt
  const ret = await worker.recognize(imageBlob);
  await worker.terminate();
  return ret.data.text;
}`}
              </pre>
            </div>
          </div>

          {/* Guidelines info safety panel */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-black text-rose-450 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-5 h-5 text-cyan-400" />
              Nhắc nhỏ bảo mật và hiệu năng
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Khi xây dựng các tương tác liên quan đến camera của khách hàng trên browser/web:
            </p>
            <ul className="space-y-3 text-[11.5px] text-slate-400 font-bold pl-1">
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded bg-cyan-500 mt-1.5 shrink-0"></span>
                <span>Luôn khai báo quyền sử dụng Camera rõ ràng bảo mật trong file <strong className="text-slate-300">metadata.json</strong> của workspace.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded bg-cyan-500 mt-1.5 shrink-0"></span>
                <span>Tránh xử lý hình ảnh thô trực tiếp ở tần suất liên tục trên vòng lặp Main Loop của game để bảo vệ người dùng khỏi bị quá tải pin điện thoại.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
