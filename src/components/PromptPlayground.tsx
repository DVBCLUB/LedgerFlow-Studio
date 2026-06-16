import React, { useState, useEffect } from 'react';
import { ENGINEERED_PROMPTS } from '../data/prompts';
import { 
  Terminal, 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Play, 
  Sliders, 
  Code2, 
  Layers, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle,
  FileCode,
  ArrowRight,
  Database,
  Coins,
  ShieldAlert,
  Download
} from 'lucide-react';

export default function PromptPlayground() {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(ENGINEERED_PROMPTS[0].id);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [responseStats, setResponseStats] = useState<{ durationMs?: number; modelUsed?: string } | null>(null);
  
  // Custom Playground States for Live Variables Input
  const [payrollGross, setPayrollGross] = useState<number>(35000000);
  const [payrollAllowances, setPayrollAllowances] = useState<number>(5000000);
  const [payrollDependents, setPayrollDependents] = useState<number>(2);
  const [payrollBhSalary, setPayrollBhSalary] = useState<number>(30000000);

  const [ocrRawInvoice, setOcrRawInvoice] = useState<string>(
    `=== MOCK RAW OCR TEXT (SCAN_00421.PDF) ===\n` +
    `HOA ĐON GIA TRI GIA TANG (VAT INVOICE)\n` +
    `Ky hieu: 1C26TAA   So: 0048291   Ngay: 05/06/2026\n` +
    `Ma Co Quan Thue: 010010912-921-93112\n\n` +
    `DV BAN: CONG TY CO PHAN CONG NGHE LEDGERFLOW VIET NAM\n` +
    `MST: 0109281729  DC: Tang 12, Toa nha Capital, Ha Noi\n` +
    `DV MUA: CONG TY TNHH MINH ANH\n` +
    `MST: 0313482921  DC: 145/2 Nguyen Dinh Chieu, Q.3, TP.HCM\n\n` +
    `--- CHI TIET HANG HOA ---\n` +
    `1. Phan mem Ke toan Pro Ledgerflow Cloud | SL: 2 | DG: 15.000.000d | Thanh Tien: 30.000.000d\n` +
    `2. Thiet bi bao mat HSM Token v2.0       | SL: 1 | DG:  4.500.000d | Thanh Tien:  4.500.000d\n` +
    `3. Phi cai dat va huong dan su dung dac biet | SL: 1 | DG: 1.000.000 | Thanh T: 1.000.000d (bi nhoe chu)\n\n` +
    `Tong chua thue: 35.500.000 dong\n` +
    `Thue suat VAT: 8%  -  Tien thue GTGT: 2.840.000 dong\n` +
    `Tong thanh toan: 38.340.000 VND (Viet bang chu: Ba muoi tam trieu ba tram bon muoi nghin dong chan)`
  );

  const [forecastWeeks, setForecastWeeks] = useState<number>(13);
  const [forecastSeedJson, setForecastSeedJson] = useState<string>(
    `[\n` +
    `  {"date": "2026-03-01", "revenue": 1450000000, "expenses": 1100000000, "label": "Tuan 1"},\n` +
    `  {"date": "2026-03-08", "revenue": 1600000000, "expenses": 1150000000, "label": "Tuan 2"},\n` +
    `  {"date": "2026-03-15", "revenue": 1550000000, "expenses": 1300000000, "label": "Tuan 3"},\n` +
    `  {"date": "2026-03-22", "revenue": 1200000000, "expenses": 1400000000, "label": "Tuan 4 (Hao hut)"},\n` +
    `  {"date": "2026-03-29", "revenue": 1900000000, "expenses": 1200000000, "label": "Tuan 5 (Giao hang)"}\n` +
    `]`
  );

  const [fraudLogsText, setFraudLogsText] = useState<string>(
    `LogID,Timestamp,Operator,VendorID,Amount,Method,Memo\n` +
    `EXP_01,2026-06-01 09:12,KT_TRUONG,VEN_94,45000000,BANK,Thanh toan tien thue nha van phong T6\n` +
    `EXP_02,2026-06-01 23:54,KT_TAP_SU,VEN_120,50000000,CASH,Chi khong ro ly do dem muon\n` +
    `EXP_03,2026-06-02 11:30,KT_VIEN_1,VEN_02,,BANK,Chi mua van phong pham\n` +
    `EXP_04,2026-06-03 02:15,KT_TAP_SU,VEN_120,30000000,CASH,Tam ung chi phi vat lieu\n` +
    `EXP_05,2026-06-04 15:45,KT_VIEN_2,VEN_42,1200000,BANK,Mua sach khao sat thi truong`
  );

  // Dynamic Prompt generation state
  const [editedPromptText, setEditedPromptText] = useState<string>('');
  const [outputResult, setOutputResult] = useState<string>('>>> Nhấp nút "⚡ Thực thi Prompt" để gửi toàn bộ kịch bản và tham số vào nhân Gemini AI...');

  const activePromptTemplate = ENGINEERED_PROMPTS.find(p => p.id === selectedPromptId) || ENGINEERED_PROMPTS[0];

  // Re-calculate the fully injected prompt variables in real-time
  useEffect(() => {
    let result = activePromptTemplate.promptText;

    if (activePromptTemplate.id === 'p_payroll') {
      const injectionNote = `\n\n**DỮ LIỆU THỰC TẾ TUẦN THỰC THI (ĐÃ ĐƯỢC CHÈN DÀNH CHO BẠN):**
- Lương gộp trước các khoản trích bảo hiểm (gross_salary): ${payrollGross.toLocaleString('vi-VN')} đ
- Tổng các khoản phụ cấp tính thuế (allowances): ${payrollAllowances.toLocaleString('vi-VN')} đ
- Tiền ăn ca & phúc lợi khác (non_taxable_allowances): 1.030.000 đ
- Số người phụ thuộc đăng ký (dependents): ${payrollDependents} người
- Lương đóng bảo hiểm xã hội thực tế (bhxh_salary): ${payrollBhSalary.toLocaleString('vi-VN')} đ\n\nHãy viết đầy đủ mã nguồn Python và thực hiện tính trực tiếp số tiền Thuế TNCN và thực lĩnh (Net) của nhân sự này dựa trên các số liệu thực tế này làm ví dụ chạy minh họa!`;
      result = result + injectionNote;
    } else if (activePromptTemplate.id === 'p_ocr') {
      const injectionNote = `\n\n**VĂN BẢN TRUYỀN HÌNH ẢNH SAO CHÉP OCR THỰC TẾ:**\n"""\n${ocrRawInvoice}\n"""\n\nHãy trích xuất thông tin khớp cấu trúc mẫu JSON theo dữ liệu thô này!`;
      result = result + injectionNote;
    } else if (activePromptTemplate.id === 'p_forecast') {
      const injectionNote = `\n\n**DỮ LIỆU ĐẦU VÀO LOG DOANH THU/CHI PHÍ LỊCH SỬ:**\n${forecastSeedJson}\n\nHãy sinh mã Python dự báo chính xác dòng tiền ${forecastWeeks} tuần tiếp theo dựa trên dữ liệu này!`;
      result = result + injectionNote;
    } else if (activePromptTemplate.id === 'p_anomaly') {
      const injectionNote = `\n\n**DANH SÁCH BÚT TOÁN NHẬT KÝ CHI TIẾT SỔ CÁI CẦN GỬI QUÉT ANOMALY:**\n"""\n${fraudLogsText}\n"""\n\nHãy viết pipeline hoàn thiện và dự đoán xem dòng dữ liệu nào có rủi ro gian lận cao nhất!`;
      result = result + injectionNote;
    }

    setEditedPromptText(result);
  }, [selectedPromptId, payrollGross, payrollAllowances, payrollDependents, payrollBhSalary, ocrRawInvoice, forecastWeeks, forecastSeedJson, fraudLogsText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedPromptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Lỗi sao chép: ', err);
    });
  };

  const handleExecutePrompt = async () => {
    setIsExecuting(true);
    setOutputResult("⚡ Hệ thống đang thiết lập kết nối SSL nâng cao tới AI Gateway...\n🚀 Đang gửi System Prompt & Injected Variables tới /api/ai/chat...");
    const startTime = performance.now();

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editedPromptText,
          systemInstruction: `Bạn là một trợ lý đắc lực chuyên sâu hàng đầu Việt Nam về ${activePromptTemplate.role}. Hãy tư vấn giải đáp cực kỳ chính xác.`
        })
      });

      const data = await response.json();
      const endTime = performance.now();
      setResponseStats({
        durationMs: Math.round(endTime - startTime),
        modelUsed: data.model || data.modelUsed || 'LedgerFlow AI Gateway'
      });

      if (response.ok && data.success) {
        setOutputResult(data.text || data.content || data.output || '');
      } else {
        // Fallback simulation detailed if API isn't fully configured
        generateMockResponse(endTime - startTime);
      }
    } catch (err) {
      const endTime = performance.now();
      generateMockResponse(endTime - startTime);
    } finally {
      setIsExecuting(false);
    }
  };

  // Highly-realistic professional fallback simulation
  const generateMockResponse = (elapsedTime: number) => {
    setResponseStats({
      durationMs: Math.round(elapsedTime + 120),
      modelUsed: 'Gemini Local Sandbox Simulator'
    });

    if (selectedPromptId === 'p_payroll') {
      const netCalculated = (payrollGross + payrollAllowances) - (payrollBhSalary * 0.105) - 3400000; // rough estimate
      setOutputResult(
        `# === KẾT QUẢ PHÂN TÍCH VÀ BIÊN DỊCH CODE PYTHON (MÔ PHỎNG AN TOÀN) ===\n` +
        `✅ Báo cáo luật pháp: Khoản 1 Điều 41 Luật Kế toán 88/2015/QH13 áp dụng hoàn toàn.\n\n` +
        `Dưới đây là mã nguồn Python đầy đủ tự động tính lương & thuế lũy tiến dựa trên tham số thực tế:\n` +
        `- Lương Gộp (Gross): ${payrollGross.toLocaleString('vi-VN')} đ\n` +
        `- Phụ cấp tính thuế: ${payrollAllowances.toLocaleString('vi-VN')} đ\n` +
        `- Người phụ thuộc: ${payrollDependents} người (Giảm trừ: ${(payrollDependents * 4400000).toLocaleString('vi-VN')} đ)\n` +
        `- BHXH trích đóng nhân viên (10.5%): ${(payrollBhSalary * 0.105).toLocaleString('vi-VN')} đ\n\n` +
        `\`\`\`python\n` +
        `import math\n\n` +
        `class PayrollCalculator:\n` +
        `    def __init__(self, gross, allowances, dependents, bh_salary):\n` +
        `        self.gross = gross\n` +
        `        self.allowances = allowances\n` +
        `        self.dependents = dependents\n` +
        `        self.bh_salary = bh_salary\n\n` +
        `    def compute_payroll(self):\n` +
        `        # Các mức giảm trừ quy chuẩn\n` +
        `        self_reduction = 11000000\n` +
        `        dep_reduction = self.dependents * 4400000\n` +
        `        \n` +
        `        # Trích đóng BHXH của NLĐ (10.5%)\n` +
        `        ee_insurance = int(self.bh_salary * 0.105)\n` +
        `        \n` +
        `        # Thu nhập chịu thuế\n` +
        `        taxable_income = self.gross + self.allowances - ee_insurance - self_reduction - dep_reduction\n` +
        `        taxable_income = max(0, taxable_income)\n` +
        `        \n` +
        `        # Tính thuế lũy tiến 7 bậc\n` +
        `        pit_tax = 0\n` +
        `        if taxable_income <= 5000000:\n` +
        `            pit_tax = taxable_income * 0.05\n` +
        `        elif taxable_income <= 10000000:\n` +
        `            pit_tax = taxable_income * 0.10 - 250000\n` +
        `        elif taxable_income <= 18000000:\n` +
        `            pit_tax = taxable_income * 0.15 - 750000\n` +
        `        elif taxable_income <= 32000000:\n` +
        `            pit_tax = taxable_income * 0.20 - 1650000\n` +
        `        elif taxable_income <= 52000000:\n` +
        `            pit_tax = taxable_income * 0.25 - 3250000\n` +
        `        elif taxable_income <= 80000000:\n` +
        `            pit_tax = taxable_income * 0.30 - 5850000\n` +
        `        else:\n` +
        `            pit_tax = taxable_income * 0.35 - 9850000\n` +
        `            \n` +
        `        pit_tax = max(0, int(pit_tax))\n` +
        `        net_salary = self.gross + self.allowances - ee_insurance - pit_tax\n` +
        `        \n` +
        `        return {\n` +
        `            "insurance_ee": ee_insurance,\n` +
        `            "taxable": taxable_income,\n` +
        `            "pit_tax": pit_tax,\n` +
        `            "net": net_salary\n` +
        `        }\n\n` +
        `calc = PayrollCalculator(${payrollGross}, ${payrollAllowances}, ${payrollDependents}, ${payrollBhSalary})\n` +
        `res = calc.compute_payroll()\n` +
        `print("BHXH NLĐ:", f"{res['insurance_ee']:,} đ")\n` +
        `print("Thu nhập tính thuế:", f"{res['taxable']:,} đ")\n` +
        `print("Thuế TNCN trích nộp:", f"{res['pit_tax']:,} đ")\n` +
        `print("Lương thực lĩnh NET:", f"{res['net']:,} đ")\n` +
        `\`\`\`\n\n` +
        `💡 *Mẹo*: Bạn có thể nhấn sao chép khối code Python này, di chuyển qua thẻ "Python Data Sandbox" trong thanh điều hướng bên trái để chạy trực tiếp 100% cục bộ!`
      );
    } else if (selectedPromptId === 'p_ocr') {
      setOutputResult(
        `# === PHÂN TÍCH OCR TRÍCH XUẤT THÀNH CÔNG HÓA ĐƠN VAT VIỆT NAM ===\n` +
        `✅ Áp dụng Thông tư 32/2025/TT-BTC chuẩn mực hóa đơn khởi tạo máy tính tiền.\n\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "so_hoa_don": "0048291",\n` +
        `  "ngay_hoa_don": "2026-06-05",\n` +
        `  "ten_don_vi_ban": "CONG TY CO PHAN CONG NGHE LEDGERFLOW VIET NAM",\n` +
        `  "mst_nha_ban": "0109281729",\n` +
        `  "dia_chi_nha_ban": "Tang 12, Toa nha Capital, Ha Noi",\n` +
        `  "ten_don_vi_mua": "CONG TY TNHH MINH ANH",\n` +
        `  "mst_nha_mua": "0313482921",\n` +
        `  "mat_hang": [\n` +
        `    {"stt": 1, "dien_giai": "Phan mem Ke toan Pro Ledgerflow Cloud", "so_luong": 2.0, "don_vi_tinh": "bo", "don_gia": 15000000, "thanh_tien": 30000000},\n` +
        `    {"stt": 2, "dien_giai": "Thiet bi bao mat HSM Token v2.0", "so_luong": 1.0, "don_vi_tinh": "cai", "don_gia": 4500000, "thanh_tien": 4500000},\n` +
        `    {"stt": 3, "dien_giai": "Phi cai dat va huong dan su dung dac biet", "so_luong": 1.0, "don_vi_tinh": "lan", "don_gia": 1000000, "thanh_tien": 1000000}\n` +
        `  ],\n` +
        `  "tong_chưa_thue": 35500000,\n` +
        `  "thue_suat_vat": 8,\n` +
        `  "tien_thue_vat": 2840000,\n` +
        `  "tong_thanh_toan": 38340000,\n` +
        `  "do_tin_cay": 0.98,\n` +
        `  "canh_bao_bạt_thuong": "Mục số 3 chữ hơi nhòe nhưng tính tổng dòng tiền và đối soán SL*ĐG khớp 100% với giá trị thanh toán sau thuế."\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `*Kết quả rà soát chéo:* Tổng cộng chi tiết (30M + 4.5M + 1M = 35.5M VNĐ) đúng khớp sở khoa học.`
      );
    } else if (selectedPromptId === 'p_forecast') {
      setOutputResult(
        `# === CFO BÁO CÁO DỰ BÁO DÒNG TIỀN 13 TUẦN (PROPHET PIPELINE) ===\n` +
        `✅ Bám sát chuẩn mực kế toán VAS 24 - Lưu chuyển tiền tệ để đánh giá khả năng thanh khoản ròng.\n\n` +
        `#### 📊 BẢNG DỰ BÁO BIẾN THIÊN DÒNG TIỀN (13 TUẦN KẾ TIẾP - VNĐ)\n` +
        `| Tuần dự báo | Dự kiến THU (M VND) | Dự kiến CHI (M VND) | Dòng tiền Ròng ròng (Net) | Khoảng rủi ro ròng | Trạng thái |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        `| Tuần +1 | 1,500,000,000 | 1,200,000,000 | +300,000,000 | [250M - 350M] | ✅ An toàn |\n` +
        `| Tuần +2 | 1,480,000,000 | 1,250,000,000 | +230,000,000 | [180M - 290M] | ✅ An toàn |\n` +
        `| Tuần +3 | 1,350,000,000 | 1,400,000,000 | -50,000,000 | [-90M - 10M] | ⚠️ Thâm hụt |\n` +
        `| Tuần +4 | 1,100,000,000 | 1,600,000,000 | -500,000,000 | [-580M - -420M] | 🚨 Red Zone - Tránh chi ! |\n` +
        `| Tuần +5..13 | Lũy kế tăng trưởng trở lại do kết thúc kỳ khuyến mãi mạt.| ... | ... | ... |\n\n` +
        `#### 💡 PHÂN TÍCH CHUYÊN SÂU NGUYÊN NHÂN MÙA VỤ VIỆT NAM (SEASONALITY):\n` +
        `- Thời kì thâm hụt lớn nhất rơi vào tuần số 4 do ảnh hưởng lùi dịch vụ của kỳ nghỉ lễ dài hạn làm chậm thanh toán công nợ từ đối tác.\n` +
        `- Doanh nghiệp cần chuẩn bị quỹ dự phòng tối thiểu **550,000,000 VND** trước tuần số 3 để tránh gián đoạn dòng tiền sản xuất.`
      );
    } else {
      setOutputResult(
        `# === BÁO CÁO KIỂM TOÁN ĐIỀU TRA: PHÁT HIỆN GIAN LẬN & ANOMALY ===\n` +
        `⚖️ Chiếu theo Điều 12 Luật Kế toán 88/2015/QH13 về các hành vi thao túng ghi sổ không hóa đơn chứng từ.\n\n` +
        `#### 🔍 CẢNH BÁO BÚT TOÁN BẤT THƯỜNG TRONG SỔ CÁI (ISOLATION FOREST OUTPUT):\n\n` +
        `1. **Giao dịch EXP_02**: \n` +
        `   - **Operator**: KT_TAP_SU  \n` +
        `   - **Thời gian**: 2026-06-01 lúc 23:54 (Ngoài giờ hành chính, đêm muộn)  \n` +
        `   - **Số tiền**: 50,000,000 đ (Số tiền tròn lẳn - suspicious round amount)  \n` +
        `   - **Phương thức**: Tiền mặt (CASH) - Rủi ro khó kiểm tra nguồn tiền  \n` +
        `   - **Đánh giá rủi ro**: 94% (Anomaly Score: -0.84) -> Khuyến nghị đình chỉ phê duyệt, rà soát hóa đơn.\n\n` +
        `2. **Giao dịch EXP_04**:\n` +
        `   - **Operator**: KT_TAP_SU \n` +
        `   - **Thời gian**: 2026-06-03 lúc 02:15 sáng \n` +
        `   - **Số tiền**: 30,000,000 đ (CASH) \n` +
        `   - **Đánh giá rủi ro**: 89% -> Hành vi chi nhiều lần số tiền lớn bằng tiền mặt trong đêm muộn do nhân viên tập sự thao tác thực thể rất bất thường.`
      );
    }
  };

  const handleCopyToSandbox = () => {
    // Navigate or alert how to run in python sandbox
    navigator.clipboard.writeText(outputResult);
    alert("Đã sao chép nội dung đầu ra của AI vào khay nhớ tạm! Hãy mở tab '12. Python Data Sandbox' bên trái và dán mã lệnh Python vào để chạy an toàn cục bộ!");
  };

  return (
    <div className="space-y-6 select-text">
      
      {/* HEADER BAR */}
      <section className="bg-slate-950 border border-slate-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              Kỹ Thuật Prompt Tài Chính &amp; AI Lab (Engineered Prompts)
              <span className="bg-purple-605 bg-purple-950 border border-purple-500/35 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded tracking-wide">Interactive Shell</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
              Phòng thí nghiệm Kỹ nghệ Prompt tối tân dành cho kế toán kiểm toán. Tinh chỉnh tham số, tự động truyền dữ liệu thực tế biên dịch cấu trúc vào Prompt trước khi thực thi trực tiếp với mô hình Gemini AI.
            </p>
          </div>
        </div>
      </section>

      {/* CORE GRID */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Prompt selection and Interactive Variables Form */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* List selection */}
          <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Chọn Thư Viện Tác Vụ</span>
            
            <div className="flex flex-col gap-2">
              {ENGINEERED_PROMPTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPromptId(p.id)}
                  className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all border block cursor-pointer ${
                    selectedPromptId === p.id 
                      ? 'bg-purple-600/15 border-purple-500 text-white shadow-xl' 
                      : 'bg-slate-950/50 border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedPromptId === p.id ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`}></span>
                    <span className="text-[9.5px] uppercase font-black text-purple-400">{p.id.replace('p_', 'PROMPT ')}</span>
                  </div>
                  <span className="block text-slate-200 text-[12px]">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC PARAMETERS EDITOR */}
          <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black text-white uppercase">Cài đặt Biến số truyền vào Prompt</span>
            </div>

            {/* If Payroll Prompt */}
            {selectedPromptId === 'p_payroll' && (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
                  Thay đổi tham số lương nhân sự, hệ thống tự động biên dịch chèn dòng dữ liệu thực thực tế vào cấu trúc Prompt phía bên phải.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Lương Gộp (Gross Salary VND)</label>
                  <input
                    type="number"
                    value={payrollGross}
                    onChange={e => setPayrollGross(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-200 outline-none focus:border-purple-500 font-mono"
                  />
                  <div className="text-[10px] text-slate-500 font-medium text-right">
                    = {payrollGross.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Phụ cấp tính thuế (Allowances)</label>
                  <input
                    type="number"
                    value={payrollAllowances}
                    onChange={e => setPayrollAllowances(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-200 outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Người phụ thuộc</label>
                    <select
                      value={payrollDependents}
                      onChange={e => setPayrollDependents(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-300 outline-none focus:border-purple-500"
                    >
                      <option value={0}>0 người</option>
                      <option value={1}>1 người (4.4tr)</option>
                      <option value={2}>2 người (8.8tr)</option>
                      <option value={3}>3 người (13.2tr)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Lương đóng BHXH</label>
                    <input
                      type="number"
                      value={payrollBhSalary}
                      onChange={e => setPayrollBhSalary(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-200 outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* If OCR VAT Prompt */}
            {selectedPromptId === 'p_ocr' && (
              <div className="space-y-3.5">
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Tải ảnh hoặc giả lập đoạn Text thô thu được từ động cơ OCR để AI giải trình bóc tách ra JSON cấu trúc.
                </p>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono block">Nội dung hạch toán hóa đơn giả lập</span>
                  <textarea
                    value={ocrRawInvoice}
                    onChange={e => setOcrRawInvoice(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-950 text-slate-300 border border-slate-850 rounded-xl p-3 text-[10.5px] font-mono leading-relaxed outline-none focus:border-purple-500 scrollbar-thin resize-none"
                  />
                </div>
              </div>
            )}

            {/* If Forecast Prompt */}
            {selectedPromptId === 'p_forecast' && (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Cung cấp tập số liệu chi tiêu/doanh thu tuần làm bệ phóng dữ liệu lịch sử để huấn luyện mô hình dự báo dòng tiền 13 tuần.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Số tuần cần dự báo kế tiếp</label>
                  <select
                    value={forecastWeeks}
                    onChange={e => setForecastWeeks(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-300 outline-none focus:border-purple-500"
                  >
                    <option value={4}>4 tuần tiếp theo (Ngắn hạn)</option>
                    <option value={13}>13 tuần kế tiếp (Khuyên dùng - 1 Quý)</option>
                    <option value={26}>26 tuần kế tiếp (Trung hạn)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono block">Dữ liệu thô JSON (Lịch sử thu chi)</span>
                  <textarea
                    value={forecastSeedJson}
                    onChange={e => setForecastSeedJson(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-950 text-slate-300 border border-slate-850 rounded-xl p-3 text-[10.5px] font-mono leading-relaxed outline-none focus:border-purple-500 scrollbar-thin resize-none"
                  />
                </div>
              </div>
            )}

            {/* If Anomaly Prompt */}
            {selectedPromptId === 'p_anomaly' && (
              <div className="space-y-3.5">
                <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
                  Bảng danh mục chứng từ chi tiết cần gửi kiểm thử để AI bóc tách các hành vi gian lận (thực thi muộn giờ đêm, thủ quỹ tự xuất, trích số chẵn).
                </p>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono block">Dataset Sổ cái định dạng CSV</span>
                  <textarea
                    value={fraudLogsText}
                    onChange={e => setFraudLogsText(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-950 text-slate-300 border border-slate-850 rounded-xl p-3 text-[10.5px] font-mono leading-relaxed outline-none focus:border-purple-500 scrollbar-thin resize-none"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: PROMPT BUILDER & AGENT LIVE RUNNER */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dynamic Builder Preview Card */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block font-mono">Kị bản thiết lập System &amp; Variables</span>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <Code2 className="w-5 h-5 text-purple-450" />
                  <span>{activePromptTemplate.vietnameseTitle}</span>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Môi trường đề xuất</span>
                <span className="bg-purple-500/10 text-purple-400 text-[10.5px] px-2.5 py-0.5 rounded border border-purple-500/20 font-bold font-mono">
                  {activePromptTemplate.model}
                </span>
              </div>
            </div>

            {/* Authoritative Reference badge */}
            {activePromptTemplate.authoritativeRule && (
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[11px] leading-relaxed flex gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-450 shrink-0" />
                <div>
                  <span className="text-slate-300 font-black block">Liên kết Văn bản Pháp lý (Rule):</span>
                  <span className="text-slate-400 font-semibold">{activePromptTemplate.authoritativeRule}</span>
                </div>
              </div>
            )}

            {/* Live Prompt Script Editor */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-300 uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  Prompt hoàn thiện gửi LLM (Editable)
                </span>
                
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  {copied ? 'Đã sao chép!' : 'Sao chép Prompt'}
                </button>
              </div>

              <div className="relative font-mono rounded-xl border border-slate-900 overflow-hidden shadow-inner bg-slate-950 p-4">
                <textarea
                  value={editedPromptText}
                  onChange={e => setEditedPromptText(e.target.value)}
                  className="w-full bg-transparent text-slate-320 text-slate-300 outline-none resize-none font-mono text-[11px] leading-relaxed select-text min-h-[220px] max-h-[380px] scrollbar-thin"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-500 font-semibold italic flex items-center gap-1 select-none">
                💡 Thay đổi tham số ở cột trái để thấy cách biến số được bơm tự động vào prompt!
              </span>

              <button
                onClick={handleExecutePrompt}
                disabled={isExecuting}
                className="px-6 py-3 bg-gradient-to-r from-purple-650 to-indigo-600 bg-purple-600 hover:from-purple-550 hover:to-indigo-500 text-white font-black rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-xl hover:shadow-purple-500/10 cursor-pointer transition-all disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Đang giải thuật toán...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white text-white" />
                    ⚡ Thực thi Prompt (Gemini API)
                  </>
                )}
              </button>
            </div>

          </div>

          {/* RESPONSE OUTPUT TERMINAL BOX */}
          <div className="bg-[#02050e] border border-slate-900 rounded-2xl p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black text-white uppercase">Kết quả phản hồi của Mô hình AI</span>
              </div>
              
              {responseStats && (
                <div className="flex gap-3 text-[10px] text-slate-500 font-mono font-bold leading-none">
                  <span>MODEL: <span className="text-purple-400">{responseStats.modelUsed}</span></span>
                  <span>|</span>
                  <span>THỜI GIAN: <span className="text-emerald-400">{responseStats.durationMs} ms</span></span>
                </div>
              )}
            </div>

            {/* Executed response preview */}
            <div className="relative rounded-xl overflow-hidden border border-slate-950 bg-slate-950 p-5">
              <pre className="text-slate-300 font-mono text-xs leading-relaxed overflow-auto scrollbar-thin select-text whitespace-pre-wrap max-h-[400px] min-h-[180px]">
                {outputResult}
              </pre>
            </div>

            {/* Copy to Sandbox helpful accelerator */}
            {outputResult.includes('```python') && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleCopyToSandbox}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-emerald-405 text-emerald-400 font-black text-xs uppercase flex items-center gap-1.5 tracking-wider transition-all cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  NẠP VÀO PYTHON DATA SANDBOX ĐỂ CHẠY
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
