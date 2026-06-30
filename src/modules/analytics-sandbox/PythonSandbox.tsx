import React, { useState, useEffect, useRef } from 'react';
import { Play, Terminal, BookOpen, CheckCircle, AlertCircle, Settings, HelpCircle, RefreshCw, Code2, Sparkles, FileCode, Copy, FolderOpen } from 'lucide-react';

type PyodideRuntime = {
  runPythonAsync: (code: string) => Promise<unknown>;
};

type LoadPyodide = (options: {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  indexURL: string;
}) => Promise<PyodideRuntime>;

const PYODIDE_LOCAL_BASE = '/vendor/pyodide/v0.26.2/full';
const PYODIDE_SCRIPT_ID = 'pyodide-runtime-script';

// Python Forensic Templates
const PY_TEMPLATES = {
  benford: `import math
import json

# Dữ liệu mẫu giao dịch sao kê của cửa hàng (triệu VND)
amounts = [120.5, 340.0, 15.0, 1100.2, 54.0, 312.5, 18.2, 22.0, 125.0, 115.0, 243.0, 89.0, 19.5, 134.0, 225.0, 1400.0, 124.0, 520.0, 12.0]

def analyze_benford(data_list):
    print("🚀 ĐANG KHỞI CHẠY THUẬT TOÁN FORENSIC BENFORD'S LAW...")
    counts = {str(i): 0 for i in range(1, 10)}
    valid_count = 0
    
    for val in data_list:
        clean_str = str(val).replace('.', '').replace('-', '').strip()
        if clean_str and clean_str[0] in counts:
            counts[clean_str[0]] += 1
            valid_count += 1
            
    if valid_count == 0:
        print("❌ Lỗi: Không phát hiện chữ số hợp lệ!")
        return
        
    print(f"Tổng số giao dịch phù hợp quét: {valid_count}")
    print("-" * 55)
    print(f"{'Chữ Số':<10} | {'Thực tế (%)':<15} | {'Kỳ vọng (%)':<15} | {'Lệch (Abs %)'}")
    print("-" * 55)
    
    for digit in range(1, 10):
        d_str = str(digit)
        actual_pct = (counts[d_str] / valid_count) * 100
        # Formula: log10(1 + 1/d)
        expected_pct = math.log10(1 + 1.0/digit) * 100
        deviation = abs(actual_pct - expected_pct)
        
        status = "⚠️ Lệch Lớn" if deviation > 8.0 else ""
        print(f"Digit [{d_str}]  | {actual_pct:<13.1f}% | {expected_pct:<13.1f}% | {deviation:<10.1f}% {status}")

analyze_benford(amounts)
`,
  altman: `# Thuật toán tính chỉ số Altman Z"-Score cho doanh nghiệp phi sản xuất SME (Altman 1995)
# Sử dụng 4 tỷ số tài chính then chốt để dự đoán nguy cơ phá sản trong 2 năm kế tiếp.

def compute_altman_z_score(working_capital, total_assets, retained_earnings, ebit, book_equity, total_liabilities):
    print("📈 ĐANG KIỂM ĐỊNH CHỈ SỐ ALTMAN Z-SCORE (SME PRIVATE NON-MANUFACTURING)...")
    print("-" * 65)
    
    # 1. Tỷ số X1 = Vốn lưu động / Tổng tài sản
    x1 = working_capital / total_assets
    # 2. Tỷ số X2 = Lợi nhuận giữ lại / Tổng tài sản
    x2 = retained_earnings / total_assets
    # 3. Tỷ số X3 = Lợi nhuận trước lãi vay & thuế (EBIT) / Tổng tài sản
    x3 = ebit / total_assets
    # 4. Tỷ số X4 = Giá trị sổ sách của Vốn chủ sở hữu / Tổng Nợ phải trả
    x4 = book_equity / total_liabilities
    
    # Công thức Altman Z" (1995)
    # Z" = 6.56 * X1 + 3.26 * X2 + 6.72 * X3 + 1.05 * X4
    z_score = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4
    
    print(f"Tỷ số X1 (Vốn lưu động / Tài sản)       : {x1:.3f}")
    print(f"Tỷ số X2 (Ln giữ lại / Tài sản)        : {x2:.3f}")
    print(f"Tỷ số X3 (EBIT / Tài sản)             : {x3:.3f}")
    print(f"Tỷ số X4 (Vốn chủ sở hữu / Nợ phải trả) : {x4:.3f}")
    print("-" * 65)
    print(f"🔥 ĐIỂM ALTMAN Z''-SCORE ĐẠT ĐƯỢC: {z_score:.2f}")
    
    # Đánh giá vùng rủi ro (Credit Risk Zones)
    # Z" > 2.90: Vùng An toàn (Safe Zone)
    # 1.10 < Z" <= 2.90: Vùng Xám (Grey Zone - Cảnh báo rủi ro)
    # Z" <= 1.10: Vùng Chưng cất Nguy kịch (Distress Zone - Nguy cơ phá sản cao)
    if z_score > 2.90:
        print("✅ KHÁCH QUAN: Vùng An toàn (Safe Zone). Sức khỏe tài chính SME vẹn toàn.")
    elif z_score > 1.10:
        print("⚠️ CẢNH BÁO: Vùng Xám (Grey Zone). Có dấu hiệu suy giảm dòng tiền, cần dọn dẹp chi phí.")
    else:
        print("🚨 BÁO ĐỘNG ĐỎ: Vùng Nguy kịch (Distress Zone). Rủi ro vỡ nợ cực cao trong 24 tháng!")

# Tham số SME mô phỏng (triệu VND)
compute_altman_z_score(
    working_capital=350,   # Tài sản ngắn hạn - Nợ ngắn hạn
    total_assets=1200,     # Tổng tài sản
    retained_earnings=180, # Lợi nhuận chưa phân phối tích lũy
    ebit=140,              # Lợi nhuận gộp trước thuế & lãi vay
    book_equity=400,       # Vốn chủ sở hữu sổ sách
    total_liabilities=800  # Nợ phải trả
)
`,
  cleaner: `# Trích xuất & Chuẩn hóa sao kê dòng tiền ngân hàng bị lỗi khoảng trắng và trống trường
import json

raw_bank_logs = [
    {"date": "2026-06-01  ", "descr": "  KHANH CHUYEN KHOAN TTIEN ", "amount": "  1500000 "},
    {"date": "2026-06-02", "descr": "RUT TIEN MAT QUY  ", "amount": "-1000000"},
    {"date": "  2026-06-03", "descr": " ", "amount": "342000"},
    {"date": "2026-06-04", "descr": "NOP THUE DOANH NGHIEP", "amount": " -520000"},
    {"date": "2026-06-05", "descr": "BAN GOI PRO LEDGERFLOW  ", "amount": "  299000  "}
]

def clean_and_normalize(logs):
    print("🧹 BẮT ĐẦU CHẠY PIPELINE CHUẨN HÓA DÒNG TIỀN NỘI ĐỊA...")
    cleaned = []
    
    for idx, row in enumerate(logs):
        dt = row.get("date", "").strip()
        desc = row.get("descr", "").strip()
        amt_str = row.get("amount", "").strip()
        
        # Nếu mô tả trống, bổ sung nhãn mặc định
        if not desc:
            desc = f"VÀO QUỸ KHÔNG RÕ NGUỒN #{idx}"
            
        try:
            val = float(amt_str)
        except ValueError:
            val = 0.0
            
        cleaned.append({
            "dong": idx + 1,
            "ngay": dt,
            "mieu_ta_sach": desc.upper(),
            "so_tien": val
        })
        
    print("-" * 65)
    print(f"{'Dòng':<5} | {'Ngày':<12} | {'Miêu Tả Hoàn Mỹ':<30} | {'Trị Giá (VND)'}")
    print("-" * 65)
    for c in cleaned:
        print(f"#{c['dong']:<4} | {c['ngay']:<12} | {c['mieu_ta_sach']:<30} | {c['so_tien']:,.0f} đ")

clean_and_normalize(raw_bank_logs)
`,
  payos: `import hmac
import hashlib
import json

# Khởi tạo dữ liệu mô phỏng nhận được từ cổng PayOS / Casso / SePay Webhook
payload = {
    "code": "00",
    "desc": "Thành công",
    "data": {
        "orderCode": 104820,
        "amount": 299000,
        "description": "LEDGERFLOW PRO BINH AN KHOE",
        "reference": "FT26372849120",
        "paymentLinkId": "pay_993a4bc82"
    }
}

# Key bí mật ký nhận webhook (Secret Key được cấp riêng trong dashboard cổng)
secret_key = "ledgerflow_vietnam_secret_key_123"

def build_sorted_string(data):
    # Quy tắc PayOS: Sắp xếp các khoá theo bảng chữ cái alphabet và nối chuỗi bằng toán tử &
    sorted_keys = sorted(data.keys())
    parts = []
    for k in sorted_keys:
        val = data[k]
        if isinstance(val, dict):
            val_str = json.dumps(val, separators=(',', ':'))
        else:
            val_str = str(val)
        parts.append(f"{k}={val_str}")
    return "&".join(parts)

def verify_webhook_signature(payload_data, received_sig, key):
    print("🛡️ BẮT ĐẦU KIỂM TRA CHỮ KÝ SỐ WEBHOOK PAYOS (HMAC-SHA256)...")
    print("-" * 65)
    
    target_data = payload_data.get("data", {})
    sign_raw_string = build_sorted_string(target_data)
    print(f"Chuỗi ký gốc (Sorted Signature String):\\n=> {sign_raw_string}")
    
    computed_signature = hmac.new(
        key.encode('utf-8'),
        sign_raw_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    print("-" * 65)
    print(f"Chữ ký số nhận được từ Header  : {received_sig}")
    print(f"Chữ ký số tính toán tại Server : {computed_signature}")
    
    is_valid = hmac.compare_digest(computed_signature, received_sig)
    if is_valid:
        print("\\n✅ THẨM ĐỊNH THÀNH CÔNG: Chữ ký hoàn toàn hợp lệ! Tiến hành tự động cộng số dư hạch toán.")
    else:
        print("\\n🚨 BÁO ĐỘNG ĐỎ: Chữ ký không trùng khớp! Có nguy cơ dữ liệu webhook giả mạo (Fake Webhook Injection Attack)!")

# Chữ ký hợp lệ mô phỏng được sinh trước với key bí mật tương ứng
valid_signature = "ec861df4001cf8d1d0c410ca31b239aeef4870bfbda8e2eafec30ee77b4759de"

print(">>> THỬ NGHIỆM KỊCH BẢN 1: Webhook thật từ cổng PayOS:")
verify_webhook_signature(payload, valid_signature, secret_key)

print("\\n" + "="*65 + "\\n")

print(">>> THỬ NGHIỆM KỊCH BẢN 2: Hacker cố tình giả mạo số tiền lên 2.990.000.000 đ để bypass paywall:")
fake_payload = json.loads(json.dumps(payload))
fake_payload["data"]["amount"] = 2990000000
verify_webhook_signature(fake_payload, valid_signature, secret_key)
`
};

export default function PythonSandbox() {
  const [pyodideLoaded, setPyodideLoaded] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [code, setCode] = useState<string>(PY_TEMPLATES.benford);
  const [stdout, setStdout] = useState<string>('>>> Nhấp "Xử Lý & Chạy Python" để thực thi mã nguồn 100% cục bộ ở đây...');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sysLogs, setSysLogs] = useState<string[]>([]);

  const pyodideRef = useRef<PyodideRuntime | null>(null);

  const pushSysLog = (msg: string) => {
    setSysLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Dynamically load Pyodide from vendored local assets for offline desktop builds.
  const initPyodide = async () => {
    if (pyodideLoaded || isInitializing) return;
    setIsInitializing(true);
    pushSysLog("Đang tải Pyodide WebAssembly VM theo chế độ local-first...");

    if (typeof window === 'undefined') {
      setIsInitializing(false);
      return;
    }

    // First check if the script tag is already in head
    let activePyodideBase = PYODIDE_LOCAL_BASE;
    let script = document.getElementById(PYODIDE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = PYODIDE_SCRIPT_ID;
      script.dataset.pyodideBase = activePyodideBase;
      script.src = `${activePyodideBase}/pyodide.js`;
      script.async = true;
      script.onerror = () => {
        if (!script) return;
        setIsInitializing(false);
        pushSysLog("Không thể tải Pyodide từ local asset. Kiểm tra public/vendor/pyodide/v0.26.2/full trước khi chạy sandbox.");
      };
      document.head.appendChild(script);
    } else {
      activePyodideBase = script.dataset.pyodideBase || PYODIDE_LOCAL_BASE;
    }

    const checkAndInit = setInterval(async () => {
      const loadPyodideGlobal = (window as Window & { loadPyodide?: LoadPyodide }).loadPyodide;
      if (loadPyodideGlobal) {
        clearInterval(checkAndInit);
        try {
          const runtimeBase = script?.dataset.pyodideBase || activePyodideBase;
          pushSysLog(`Pyodide runtime da nap xong tu ${runtimeBase}. Khoi tao nhan Python 3.12 VM...`);
          const py = await loadPyodideGlobal({
            indexURL: runtimeBase,
            stdout: (text: string) => {
              setStdout(prev => prev + text + '\n');
            },
            stderr: (text: string) => {
              setStdout(prev => prev + `[LỖI RUNTIME] ${text}\n`);
            }
          });
          pyodideRef.current = py;
          setPyodideLoaded(true);
          setIsInitializing(false);
          pushSysLog("🔥 Nhân WebAssembly Python đã chạy mượt mà ngay trên Trình duyệt của bạn!");
        } catch (err: any) {
          console.error("Pyodide compile error:", err);
          pushSysLog(`⚠️ Thất bại khi biên dịch Pyodide WebAssembly: ${err.message || err}`);
          setIsInitializing(false);
        }
      }
    }, 1500);

    // Guard timeout
    setTimeout(() => {
      clearInterval(checkAndInit);
      if (!pyodideLoaded && isInitializing) {
        setIsInitializing(false);
        pushSysLog("Thoi gian tai Pyodide vuot han muc. Kiem tra local asset trong public/vendor/pyodide/v0.26.2/full.");
      }
    }, 20000);
  };

  useEffect(() => {
    initPyodide();
  }, []);

  const selectTemplate = (key: keyof typeof PY_TEMPLATES) => {
    setCode(PY_TEMPLATES[key]);
    setStdout('>>> Sẵn sàng thực thi mẫu mã lệnh mới...');
  };

  const handleRunPython = async () => {
    if (!pyodideLoaded || !pyodideRef.current) {
      alert("Dong co Pyodide dang tai theo che do local-first. Vui long doi mot lat!");
      return;
    }

    setIsRunning(true);
    setStdout(''); // Clear console
    pushSysLog("Đang hạch toán mã lệnh Python vào WebAssembly sandbox...");

    try {
      const startTime = performance.now();
      // Execute the python string safely client-side
      await pyodideRef.current.runPythonAsync(code);
      const duration = (performance.now() - startTime).toFixed(1);
      pushSysLog(`✓ Chạy Python kết thúc thành công trong ${duration}ms.`);
    } catch (err: any) {
      setStdout(prev => prev + `\n❌ LỖI KHỞI CHẠY (COMPILE_OR_RUNTIME_ERROR):\n${err.message || String(err)}\n`);
      pushSysLog("✗ Mã lệnh Python xảy ra ngoại lệ!");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BLOCK */}
      <section className="bg-slate-950 border border-slate-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 select-text">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Code2 className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              Python Data Science Sandbox (Pyodide WebAssembly)
              <span className="bg-orange-600/15 border border-orange-500/25 text-orange-450 text-[9px] font-black px-2 py-0.5 rounded tracking-wide">Python 3.12 Local</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
              Trải nghiệm môi trường lập trình Python thực thi 100% an toàn trong trình duyệt của bạn mà không cần máy chủ (Sandbox Serverless). Thích hợp dọn dẹp big-data sao kê, tính điểm Altman rủi ro và xác thực Benford.
            </p>
          </div>
        </div>

        {/* Status engine display */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs font-bold leading-none shrink-0 self-start md:self-center">
          {pyodideLoaded ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-mono">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
              PYODIDE ENGINE V0.26 READY
            </span>
          ) : isInitializing ? (
            <span className="text-amber-400 flex items-center gap-1.5 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-455" />
              ĐANG NẠP ENGINE (~10MB WA)...
            </span>
          ) : (
            <span className="text-slate-405 flex items-center gap-1.5 font-sans">
              <AlertCircle className="w-4 h-4 text-slate-500" />
              CHỜ KHỞI ĐỘNG
            </span>
          )}
        </div>
      </section>

      {/* CORE WORKSPACE SECTION */}
      <div className="grid lg:grid-cols-12 gap-6 select-text text-xs font-semibold leading-relaxed">
        
        {/* Editor panel left */}
        <div className="lg:col-span-7 bg-[#040812] border border-slate-900 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-orange-405" />
              <span className="text-white font-black uppercase">Trình soạn thảo Python Script</span>
            </div>

            {/* Template Selector dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Chuyên đề:</span>
              <div className="flex gap-1 bg-slate-950 p-1 border border-slate-900 rounded-lg">
                <button
                  onClick={() => selectTemplate('benford')}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase rounded hover:text-white transition-all text-slate-400 cursor-pointer"
                >
                  Benford Law
                </button>
                <button
                  onClick={() => selectTemplate('altman')}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase rounded hover:text-white transition-all text-slate-400 cursor-pointer"
                >
                  Altman Z Score
                </button>
                <button
                  onClick={() => selectTemplate('cleaner')}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase rounded hover:text-white transition-all text-slate-400 cursor-pointer"
                >
                  Dọn sao kê
                </button>
                <button
                  onClick={() => selectTemplate('payos')}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase rounded hover:text-white transition-all text-slate-400 cursor-pointer"
                >
                  Ký Webhook (PayOS)
                </button>
              </div>
            </div>
          </div>

          {/* Textarea Editor simulation with mono lines */}
          <div className="relative font-mono rounded-xl border border-slate-900 overflow-hidden shadow-inner bg-slate-950 p-3 flex gap-3 h-[380px]">
            {/* Mock Line Numbers */}
            <div className="text-slate-600 text-right select-none text-[11px] font-medium border-r border-slate-900 pr-2.5 font-mono text-xs leading-5">
              {Array.from({ length: Math.max(25, code.split('\n').length) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input */}
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="flex-1 bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-5 select-text whitespace-pre overflow-auto scrollbar-thin scrollbar-thumb-slate-850"
              spellCheck="false"
              placeholder="# Viết mã lệnh Python của bạn ở đây..."
            />
          </div>

          {/* Navigation execution buttons */}
          <div className="flex justify-between items-center pt-1.5">
            <span className="text-[10px] text-slate-500 font-medium italic flex items-center gap-1">
              💡 Tips: Sử dụng lệnh print(biến) để hạch toán giá trị ra màn hình Terminal bên phải.
            </span>

            <button
              onClick={handleRunPython}
              disabled={isRunning || !pyodideLoaded}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-650 to-amber-600 hover:from-orange-550 hover:to-amber-500 text-white font-extrabold rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  Xử Lý &amp; Chạy Python
                </>
              )}
            </button>
          </div>
        </div>

        {/* Terminal output box right side */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Terminal stdout display */}
          <div className="bg-[#02050a] border border-slate-900 rounded-2xl p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5 mb-3 shrink-0">
              <span className="text-slate-400 font-black uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                Màn hình Terminal và Stdout
              </span>
              <button 
                onClick={() => setStdout('>>> Sổ lệnh sạch sẽ...')}
                className="text-slate-500 hover:text-slate-350 text-[10px] font-black uppercase cursor-pointer"
              >
                Clear
              </button>
            </div>

            <pre className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-950 font-mono text-xs leading-relaxed overflow-auto scrollbar-thin select-text text-emerald-300 min-h-[220px] max-h-[350px] whitespace-pre-wrap">
              {stdout}
            </pre>
          </div>

          {/* Background system log monitoring */}
          <div className="bg-[#040812] border border-slate-900 rounded-2xl p-5 h-[155px] shrink-0 flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900 pb-1.5 mb-2.5">
              ⚙️ Hệ thống Máy Chủ Ảo Cục Bộ (Wasm Orchestrator log)
            </span>
            <div className="flex-1 overflow-y-auto font-mono text-[9.5px] leading-relaxed text-slate-500 space-y-1.5 scrollbar-thin pr-1 select-text">
              {sysLogs.length === 0 ? (
                <div className="italic text-[10px]">Chờ tương tác...</div>
              ) : (
                sysLogs.map((lg, i) => (
                  <div key={i} className="text-slate-500">
                    {lg}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
