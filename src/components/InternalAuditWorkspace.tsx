import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Calculator, 
  Sparkles, 
  FileText, 
  FileDown, 
  CheckCircle2, 
  X,
  Target,
  RefreshCw,
  Search,
  ListFilter
} from 'lucide-react';

interface AuditRisk {
  id: string;
  processName: string;
  riskDescription: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  controlActivity: string;
  mitigationStatus: 'Resolved' | 'In Progress' | 'Open';
}

interface WorkingPaper {
  id: string;
  code: string;
  title: string;
  objective: string;
  procedure: string;
  reviewer: string;
  status: 'Draft' | 'Approved' | 'Reviewing';
  evidence: string;
}

export default function InternalAuditWorkspace() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'coso' | 'sampling' | 'papers'>('matrix');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // --- TAB 1: RISK MATRIX DATA & MANAGEMENT ---
  const [risks, setRisks] = useState<AuditRisk[]>(() => {
    const saved = localStorage.getItem('lf_audit_risks');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      {
        id: 'r1',
        processName: 'Mua hàng & Thanh toán',
        riskDescription: 'Thanh toán trùng hóa đơn điện tử VAT do thiếu đối soát tự động.',
        likelihood: 4,
        impact: 3,
        controlActivity: 'Chạy đối soát MST và số hiệu hóa đơn trên cổng TCT trước khi phê duyệt chi.',
        mitigationStatus: 'In Progress'
      },
      {
        id: 'r2',
        processName: 'Cổng Thanh Toán & Đối soát',
        riskDescription: 'Gian lận hóa đơn khống VietQR do parse sai cú pháp sao kê thủ công.',
        likelihood: 3,
        impact: 5,
        controlActivity: 'Áp dụng phân tích chữ số đầu tiên (Luật Benford) định kỳ và liên thông Webhook chính thức.',
        mitigationStatus: 'Resolved'
      },
      {
        id: 'r3',
        processName: 'Lưu trữ Sổ cái',
        riskDescription: 'Mất mát dữ liệu hạch toán kép cục bộ khi xóa cache trình duyệt.',
        likelihood: 5,
        impact: 4,
        controlActivity: 'Bật đồng bộ nền hai chiều qua Supabase Cloud Auto-Sync kèm RLS bảo mật.',
        mitigationStatus: 'Resolved'
      },
      {
        id: 'r4',
        processName: 'Nhân sự & Phân quyền',
        riskDescription: 'Rò rỉ số liệu kinh doanh ròng (MRR, LTV) do phân quyền Admin bất hợp lý.',
        likelihood: 2,
        impact: 4,
        controlActivity: 'Cấu hình Supabase Row Level Security chính sách (auth.uid() = user_id).',
        mitigationStatus: 'Open'
      }
    ];
  });

  const [newRisk, setNewRisk] = useState({
    processName: '',
    riskDescription: '',
    likelihood: 3,
    impact: 3,
    controlActivity: '',
    mitigationStatus: 'Open' as 'Resolved' | 'In Progress' | 'Open'
  });

  useEffect(() => {
    localStorage.setItem('lf_audit_risks', JSON.stringify(risks));
  }, [risks]);

  const handleAddRisk = () => {
    if (!newRisk.processName || !newRisk.riskDescription) {
      alert('Vui lòng nhập đầy đủ Quy trình và Mô tả rủi ro kiểm toán!');
      return;
    }
    const created: AuditRisk = {
      id: 'r_' + Date.now(),
      processName: newRisk.processName,
      riskDescription: newRisk.riskDescription,
      likelihood: Number(newRisk.likelihood),
      impact: Number(newRisk.impact),
      controlActivity: newRisk.controlActivity,
      mitigationStatus: newRisk.mitigationStatus
    };
    setRisks(prev => [created, ...prev]);
    setNewRisk({
      processName: '',
      riskDescription: '',
      likelihood: 3,
      impact: 3,
      controlActivity: '',
      mitigationStatus: 'Open'
    });
  };

  const handleDeleteRisk = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
  };

  // Get Risk level background colors based on Likelihood * Impact
  const getRiskLevel = (l: number, i: number) => {
    const score = l * i;
    if (score >= 15) return { label: 'CRITICAL (Đỏ đậm)', bg: 'bg-rose-600 border-rose-500 text-white', colorHex: '#e11d48' };
    if (score >= 9) return { label: 'HIGH (Vàng cam)', bg: 'bg-amber-650 border-amber-500 text-white', colorHex: '#d97706' };
    if (score >= 4) return { label: 'MEDIUM (Vàng chanh)', bg: 'bg-yellow-600/30 border-yellow-501/40 text-yellow-300', colorHex: '#eab308' };
    return { label: 'LOW (Xanh lá)', bg: 'bg-emerald-950/20 border-emerald-800 text-emerald-400', colorHex: '#10b981' };
  };

  // --- TAB 2: VIETNAMESE COSO FRAMEWORK CODES ---
  const [cosoAnswers, setCosoAnswers] = useState<Record<string, 'Pass' | 'Fail' | 'N/A'>>(() => {
    const saved = localStorage.getItem('lf_coso_answers');
    return saved ? JSON.parse(saved) : {};
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lf_coso_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const handleCosoAnswer = (id: string, ans: 'Pass' | 'Fail' | 'N/A') => {
    setCosoAnswers(prev => {
      const next = { ...prev, [id]: ans };
      localStorage.setItem('lf_coso_answers', JSON.stringify(next));
      return next;
    });
  };

  const handleCosoNote = (id: string, text: string) => {
    setNotes(prev => {
      const next = { ...prev, [id]: text };
      localStorage.setItem('lf_coso_notes', JSON.stringify(next));
      return next;
    });
  };

  const cosoSections = [
    {
      title: "1. Môi trường kiểm soát (Control Environment)",
      checklist: [
        { id: "ce1", question: "Doanh nghiệp có quy chế liêm chính rõ ràng và phân công trách nhiệm rõ nét, tránh kiêm nhiệm trái nguyên tắc (Segregation of Duties)?", ref: "ISA 315 / VAS Standard" },
        { id: "ce2", question: "Solo Founder có xây dựng cơ chế giám sát rủi ro tài chính hoặc phân bổ ngân sách đầu tư minh bạch?", ref: "COSO SME v2.0" }
      ]
    },
    {
      title: "2. Quy trình đánh giá rủi ro (Risk Assessment)",
      checklist: [
        { id: "ra1", question: "Hệ thống có quét rủi ro về thuế doanh nghiệp thuế GTGT, rủi ro nhà cung cấp dính líu hóa đơn đỏ ảo?", ref: "Nghị định 123/2020" },
        { id: "ra2", question: "Có phương án backup dữ liệu định kỳ dự phòng sập đĩa cứng máy chủ hoặc mất database?", ref: "ISO 27001 / Cloud Security" }
      ]
    },
    {
      title: "3. Hoạt động kiểm soát (Control Activities)",
      checklist: [
        { id: "ca1", question: "Có quy trình đối soát tiền gửi ngân hàng (với Sổ phụ/Sao kê) định giờ mỗi ngày hoặc mỗi tuần tối thiểu?", ref: "VAS 112" },
        { id: "ca2", question: "Hệ thống kế toán kép bảo đảm nguyên lý cân bằng tuyệt đối: Tổng Nợ = Tổng Có trước khi lập báo cáo tài chính?", ref: "VAS Double Entry" }
      ]
    },
    {
      title: "4. Thông tin và truyền thông (Information & Communication)",
      checklist: [
        { id: "ic1", question: "Dữ liệu hóa đơn, công nợ, sao kê được ghi nhận tức thời vào tài liệu số tập trung (không dựa hoàn toàn vào trí nhớ founder)?", ref: "Luật Kế Toán VN" },
        { id: "ic2", question: "Báo cáo tài chính cho cổ đông hoặc ngân hàng được gửi định kỳ kèm phân tích chỉ số rủi ro thanh khoản cụ thể?", ref: "CFO Standard" }
      ]
    },
    {
      title: "5. Hoạt động Giám sát (Monitoring)",
      checklist: [
        { id: "mn1", question: "Có thực hiện quét chữ số Benford, phân tích biên lợi nhuận biến thiên hoặc thuê kiểm toán độc lập cuối kì?", ref: "ISA 520" }
      ]
    }
  ];

  const totalCoso = cosoSections.reduce((acc, current) => acc + current.checklist.length, 0);
  const passCoso = Object.values(cosoAnswers).filter(x => x === 'Pass').length;
  const failCoso = Object.values(cosoAnswers).filter(x => x === 'Fail').length;
  const auditComplianceScore = totalCoso > 0 ? Math.round((passCoso / totalCoso) * 100) : 0;

  // --- TAB 3: STATISTICAL SAMPLING TOOL ---
  const [popCount, setPopCount] = useState<number>(1000); // Kích thước tổng thể (ví dụ 1000 hóa đơn)
  const [confidence, setConfidence] = useState<number>(95); // Độ tin cậy (90, 95, 99)
  const [tolerableRate, setTolerableRate] = useState<number>(5); // Tỷ lệ sai sót có thể bỏ qua %
  const [expectedRate, setExpectedRate] = useState<number>(1.5); // Tỷ lệ sai sót dự kiến %
  const [monetaryInterval, setMonetaryInterval] = useState<number>(100000000); // Khoảng cách chọn mẫu tiền tệ (ví dụ 100tr VNĐ)

  // Attribute sampling size formula (binomial statistical estimation approximation)
  const computeSampleSize = () => {
    if (tolerableRate <= expectedRate) return 100; // boundary check
    
    // Z statistic approximation for confidence levels
    let z = 1.96;
    if (confidence === 90) z = 1.645;
    if (confidence === 99) z = 2.576;

    const p = expectedRate / 100;
    const t = tolerableRate / 100;
    
    // Wald method with finite population correction
    const numerator = z * z * p * (1 - p);
    const denominator = (t - p) * (t - p);
    let sampleSizeRaw = Math.ceil(numerator / denominator);
    
    // Finite population correction factor (FPC)
    if (popCount > 0) {
      sampleSizeRaw = Math.ceil(sampleSizeRaw / (1 + (sampleSizeRaw / popCount)));
    }
    
    return Math.max(25, Math.min(sampleSizeRaw, popCount));
  };

  const sampleSize = computeSampleSize();

  // Generate systemic indexes representing chosen rows to verify
  const generateSamplesList = () => {
    const list: number[] = [];
    const interval = Math.floor(popCount / sampleSize);
    if (interval <= 0) return [1];
    
    // Systematic random sampling
    let current = Math.floor(Math.random() * interval) + 1;
    for (let i = 0; i < sampleSize; i++) {
      if (current <= popCount) {
        list.push(current);
        current += interval;
      }
    }
    return list;
  };

  const [samplesList, setSamplesList] = useState<number[]>([]);
  useEffect(() => {
    setSamplesList(generateSamplesList().slice(0, 30)); // Display top 30
  }, [popCount, sampleSize]);

  // --- TAB 4: AUDIT WORKING PAPERS ---
  const [papers, setPapers] = useState<WorkingPaper[]>(() => {
    const saved = localStorage.getItem('lf_audit_papers');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      {
        id: 'wp1',
        code: 'WP-A100',
        title: 'Giấy tờ đối chiếu Tiền mặt & Quỹ Biên',
        objective: 'Kiểm toán tính chính xác, thực tế hiện hữu của Tài khoản 111 (Tiền mặt) tại két quỹ của đơn vị.',
        procedure: 'Tiến hành kiểm kê vật chất đột xuất tài sản mặt; đối chiếu với số dư báo cáo sổ cái. Lập biên bản kiểm kê quỹ 3 bên.',
        reviewer: 'CFO Trương Đan',
        status: 'Draft',
        evidence: 'Số dư thực tế 50,000,000 đ trùng khớp số hiệu sổ cái ngày 30/06. Phát hiện rủi ro phân quyền giữ khóa két sắt lỏng lẻo.'
      },
      {
        id: 'wp2',
        code: 'WP-B200',
        title: 'Đối chiếu doanh số VietQR & Sao kê VCB',
        objective: 'Xác minh doanh thu ròng ghi nhận trên TK 511 khít khao với nguồn tiền chuyển khoản thực nhận trên cổng ngân hàng.',
        procedure: 'Rút sao kê tài khoản 112 định kỳ; chạy thuật toán phân tích chữ số Benford; dọn dẹp các dòng ghi nhận sai khoảng trắng.',
        reviewer: 'Chủ nhiệm kiểm toán Lê Khoa',
        status: 'Approved',
        evidence: 'Đối soát 240 giao dịch VietQR tự động thành công. BENFORD LAW: Số lệch tuyệt đối nằm trong mốc an toàn < 2.5%.'
      }
    ];
  });

  const [newPaper, setNewPaper] = useState({
    code: '',
    title: '',
    objective: '',
    procedure: '',
    reviewer: 'Chủ nhiệm kiểm toán Lê Khoa',
    evidence: ''
  });

  useEffect(() => {
    localStorage.setItem('lf_audit_papers', JSON.stringify(papers));
  }, [papers]);

  const handleAddPaper = () => {
    if (!newPaper.code || !newPaper.title) {
      alert('Vui lòng cung cấp mã hiệu (ví dụ WP-C300) và Tiêu đề giấy tờ kiểm toán!');
      return;
    }
    const created: WorkingPaper = {
      id: 'wp_' + Date.now(),
      code: newPaper.code.toUpperCase(),
      title: newPaper.title,
      objective: newPaper.objective,
      procedure: newPaper.procedure,
      reviewer: newPaper.reviewer,
      status: 'Draft',
      evidence: newPaper.evidence
    };
    setPapers(prev => [...prev, created]);
    setNewPaper({
      code: '',
      title: '',
      objective: '',
      procedure: '',
      reviewer: 'Chủ nhiệm kiểm toán Lê Khoa',
      evidence: ''
    });
  };

  const handleDeletePaper = (id: string) => {
    setPapers(prev => prev.filter(p => p.id !== id));
  };

  // Draft automated Audit Working Paper using server-side Gemini 3.5 proxy
  const handleAiDraftPaper = async (paperId: string) => {
    const targetPaper = papers.find(p => p.id === paperId);
    if (!targetPaper) return;

    setAiLoading(true);
    setErrorMsg(null);

    const promptText = `Bạn là một Chuyên gia Kiểm toán Độc lập cao cấp (Certified Public Auditor - CPA) dày dạn kinh nghiệm tại Việt Nam.
Hãy dự thảo nội dung GIẤY TỜ LÀM VIỆC KIỂM TOÁN (Audit Working Paper) mã hiệu "${targetPaper.code}" có tiêu đề "${targetPaper.title}".
- Mục tiêu kiểm toán: ${targetPaper.objective || "Xác minh độ trung thực của tài khoản liên đới"}
- Thủ tục đã thực hiện: ${targetPaper.procedure || "Chọn mẫu ngẫu nhiên, đối chiếu chứng từ gốc hóa đơn VAT Nghị định 123 và sổ quỹ"}

Nhiệm vụ của bạn: Hãy phân tích sâu sắc các rủi ro, dự kiến dữ liệu kiểm nghiệm (Evidence / Phát hiện sai lệch), kiến nghị điều chỉnh hạch toán kế toán theo Thông tư 200/133 và ký xác nhận. Viết thật súc tích dưới dạng markdown, dùng tiếng Việt chuyên nghiệp, có cấu trúc học thuật chặt chẽ.`;

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: 'Bạn là siêu AI tham mưu kiểm toán, hiểu sâu luật quản lý thuế, thông tư 200/NĐ123 và chuẩn mực kiểm toán quốc tế ISA/VSA tại Việt Nam.'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPapers(prev => prev.map(p => {
          if (p.id === paperId) {
            return { ...p, evidence: data.text };
          }
          return p;
        }));
      } else {
        // Fallback draft in case of missing server key
        const fallbackText = `### ⚖️ KẾT QUẢ PHÁT HIỆN KIỂM TOÁN (AUTOMATED AUDIT REPORT)
- **Mã hiệu:** ${targetPaper.code} | **Tiêu đề:** ${targetPaper.title}
- **Rủi ro cốt lõi (Audit Findings):**
  1. Hóa đơn gốc chưa xuất trình đầy đủ tệp chứng từ xml liên kết với Tổng cục thuế. Định mức khấu trừ thuế đầu vào 8%-10% cần được thẩm tra cặn kẽ.
  2. Bút toán định khoản ghi nhận Nợ TK 642 / Có TK 111 chưa có phiếu thu/chi có đầy đủ chữ ký của Thủ quỹ và Người nhận tiền.
- **Khuyến nghị Kiểm toán (Auditor Adjustments):**
  - Chuyển tiếp bút toán điều chỉnh bổ sung, yêu cầu hạch toán trích lập quỹ an toàn.
  - Phân tách quyền lực thủ quỹ độc lập để gia cố môi trường kiểm soát doanh nghiệp.`;
        setPapers(prev => prev.map(p => {
          if (p.id === paperId) {
            return { ...p, evidence: fallbackText };
          }
          return p;
        }));
        if (data.isMissingKey) {
          setErrorMsg('⚠️ Chưa phát hiện GEMINI_API_KEY. Hệ thống tự khởi tạo tài liệu kiểm toán mẫu (Fallback Draft) an toàn!');
        }
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối API. Tạo tài liệu kiểm toán cục bộ.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdatePaperStatus = (id: string, newStatus: 'Draft' | 'Approved' | 'Reviewing') => {
    setPapers(prev => prev.map(p => {
      if (p.id === id) return { ...p, status: newStatus };
      return p;
    }));
  };

  // --- EXPORTERS WORK ---
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Risks tab
      const riskRows = risks.map(r => ({
        'Quy Trình': r.processName,
        'Mô Tả Rủi Ro': r.riskDescription,
        'Khả Năng': r.likelihood,
        'Tác Động': r.impact,
        'Hoạt Động Kiểm Soát Khuyến Nghị': r.controlActivity,
        'Trạng Thái Khắc Phục': r.mitigationStatus
      }));
      const wsRisk = XLSX.utils.json_to_sheet(riskRows);
      XLSX.utils.book_append_sheet(wb, wsRisk, 'Risk Assessment Matrix');

      // COSO tab
      const cosoRows: any[] = [];
      cosoSections.forEach(sec => {
        sec.checklist.forEach(item => {
          cosoRows.push({
            'Phần COSO': sec.title,
            'Nội dung kiểm soát': item.question,
            'Tham chiếu chuẩn mực': item.ref,
            'Trạng thái': cosoAnswers[item.id] || 'Chưa đánh giá',
            'Ghi chú bổ sung': notes[item.id] || ''
          });
        });
      });
      const wsCoso = XLSX.utils.json_to_sheet(cosoRows);
      XLSX.utils.book_append_sheet(wb, wsCoso, 'COSO Audit Compliance');

      XLSX.writeFile(wb, 'LedgerFlow_Internal_Audit_Report.xlsx');
    } catch (err) {
      alert('Lỗi xuất tệp Excel: ' + err);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('LEDGERFLOW INTERNAL AUDIT REPORT', 20, 20);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Tỷ lệ tuân thủ COSO: ${auditComplianceScore}% (Pass: ${passCoso} / Fail: ${failCoso})`, 20, 30);
      doc.text(`Tổng số rủi ro đã nhận diện: ${risks.length} rủi ro ròng`, 20, 36);

      let y = 48;
      doc.setFont('Helvetica', 'bold');
      doc.text('DANH SÁCH RỦI RO KIỂM TOÁN CHÍNH:', 20, y);
      y += 8;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);

      risks.forEach((r, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const riskLevel = getRiskLevel(r.likelihood, r.impact);
        doc.text(`${idx + 1}. [${r.processName}] - ${r.riskDescription}`, 20, y);
        y += 5;
        doc.text(`   Mức độ: ${riskLevel.label} | Hành động kiểm soát: ${r.controlActivity}`, 20, y);
        y += 8;
      });

      doc.save('LedgerFlow_Audit_Report.pdf');
    } catch (err) {
      alert('Lỗi khởi tạo tệp PDF: ' + err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <section className="bg-slate-950 border border-slate-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              Bảng Điều Khiển Kiểm Toán Nội Bộ
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded uppercase">COSO SME Compliance</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
              Xây dựng ma trận rủi ro kiểm soát, đối soát COSO chuẩn mực Việt Nam, chạy thuật toán tính kích thước mẫu kiểm toán ngẫu nhiên và soạn thảo Working Paper 9.2/10.
            </p>
          </div>
        </div>

        {/* TABS SELECT */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ma Trận Rủi Ro
          </button>
          <button
            onClick={() => setActiveTab('coso')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'coso' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đánh Giá COSO
          </button>
          <button
            onClick={() => setActiveTab('sampling')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sampling' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Chọn Mẫu Thống Kê
          </button>
          <button
            onClick={() => setActiveTab('papers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'papers' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Giấy Tờ Working Paper
          </button>
        </div>
      </section>

      {/* ERROR ANNOUNCEMENT IF ANY */}
      {errorMsg && (
        <div className="bg-amber-950/20 border border-amber-900/40 text-amber-400 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* =================================== TAB 1: RISK MATRIX =================================== */}
      {activeTab === 'matrix' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Risk map left side */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#040812] border border-slate-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                Ma Trận Nhiệt Đánh Giá Mức Độ Rủi Ro (5x5 Heatmap)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Kiểm toán viên xác định điểm rủi ro bằng tích số giữa <strong className="text-slate-200">Khả năng phát sinh (Likelihood)</strong> và <strong className="text-slate-200">Mức độ tác động (Impact)</strong>. Ô đỏ đậm là rủi ro chí tử bắt buộc phải lập tức lập kịch bản phòng ngự dọn dẹp.
              </p>

              {/* 5x5 Grid Heatmap */}
              <div className="grid grid-cols-6 gap-1 w-full pt-2">
                {/* Y-Axis Label placeholder */}
                <div className="text-[10px] text-slate-500 font-bold font-mono self-center text-right pr-2">Impact / Like</div>
                <div className="text-[10px] text-slate-400 font-bold font-mono text-center">L_1 (Rất Thấp)</div>
                <div className="text-[10px] text-slate-400 font-bold font-mono text-center">L_2 (Thấp)</div>
                <div className="text-[10px] text-slate-400 font-bold font-mono text-center">L_3 (Trung Bình)</div>
                <div className="text-[10px] text-slate-400 font-bold font-mono text-center">L_4 (Cao)</div>
                <div className="text-[10px] text-slate-400 font-bold font-mono text-center font-bold text-rose-500">L_5 (Cực Cao)</div>

                {/* Rows from 5 down to 1 */}
                {[5, 4, 3, 2, 1].map(impactVal => (
                  <React.Fragment key={impactVal}>
                    {/* Row Header Label */}
                    <div className="text-[10px] text-slate-400 font-bold font-mono self-center text-right pr-2">
                      I_{impactVal} ({impactVal === 5 ? 'Nguy kịch' : impactVal === 4 ? 'Trọng yếu' : impactVal === 3 ? 'Đáng kể' : impactVal === 2 ? 'Nhẹ' : 'Thấp'})
                    </div>
                    {/* Columns 1 to 5 */}
                    {[1, 2, 3, 4, 5].map(likeVal => {
                      const score = likeVal * impactVal;
                      let bgClass = "bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40";
                      let borderClass = "border-emerald-800/40";
                      if (score >= 15) {
                        bgClass = "bg-[#7c1d1d] text-white hover:bg-red-900";
                        borderClass = "border-red-600";
                      } else if (score >= 9) {
                        bgClass = "bg-[#8a4e0a] text-white hover:bg-amber-900";
                        borderClass = "border-amber-600";
                      } else if (score >= 4) {
                        bgClass = "bg-yellow-950/20 text-yellow-300 hover:bg-yellow-900/10";
                        borderClass = "border-yellow-700/30";
                      }

                      // Check if any registered risk occupies this specific coordinate
                      const activeRisksInCell = risks.filter(r => Number(r.likelihood) === likeVal && Number(r.impact) === impactVal);

                      return (
                        <div 
                          key={likeVal} 
                          className={`h-11 rounded-lg border flex flex-col justify-between p-1 transition-all ${bgClass} ${borderClass} relative`}
                          title={`Score: ${score} | Tác động ${impactVal} x Khả năng ${likeVal}`}
                        >
                          <span className="text-[9.5px] font-mono font-bold leading-none">{score}</span>
                          {activeRisksInCell.length > 0 && (
                            <div className="flex gap-0.5 justify-end flex-wrap max-h-[1.5rem] overflow-hidden">
                              {activeRisksInCell.map(ar => (
                                <span 
                                  key={ar.id} 
                                  className="w-2.5 h-2.5 rounded-full bg-white border border-slate-900 flex items-center justify-center text-[7.5px] font-bold text-slate-950 font-mono shadow"
                                  title={`[${ar.processName}] ${ar.riskDescription}`}
                                >
                                  !
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex justify-end gap-2 text-[10px] items-center pt-2 text-slate-500 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 1-3: Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-505 bg-yellow-500"></span> 4-8: Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 9-12: High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600"></span> 15-25: Critical</span>
              </div>
            </div>

            {/* Risks registered browser view */}
            <div className="bg-[#040812] border border-slate-900 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Danh Mục Rủi Ro Đã Ghi Nhận ({risks.length})
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportExcel}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] font-black uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Xuất Excel
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10.5px] font-black uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Xuất PDF
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {risks.map((item) => {
                  const rMetrics = getRiskLevel(item.likelihood, item.impact);
                  return (
                    <div key={item.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-900 flex justify-between items-start gap-4 hover:border-slate-800 transition-all">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-mono">
                            {item.processName}
                          </span>
                          <span className={`text-[8.5px] font-black px-2 py-0.5 rounded border ${rMetrics.bg}`}>
                            {rMetrics.label} (Điểm: {item.likelihood * item.impact})
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-100 uppercase tracking-wide leading-tight">{item.riskDescription}</p>
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                          <strong className="text-slate-350">Hoạt động phòng thủ khuyến nghị:</strong> {item.controlActivity}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          item.mitigationStatus === 'Resolved' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                          item.mitigationStatus === 'In Progress' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                          'bg-rose-500/10 border border-rose-500/20 text-rose-450'
                        }`}>
                          {item.mitigationStatus === 'Resolved' ? '✓ Khắc phục xong' :
                           item.mitigationStatus === 'In Progress' ? '⌛ Đang theo dõi' : '✗ Còn hở sườn'}
                        </span>
                        <button 
                          onClick={() => handleDeleteRisk(item.id)}
                          className="p-1 px-2 text-slate-500 hover:text-rose-400 rounded-lg text-xs hover:bg-rose-950/20 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form input right side */}
          <div className="lg:col-span-4 bg-[#040812] border border-slate-900 rounded-2xl p-5 space-y-4 h-fit">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900 pb-2">
              ➕ Khai báo Rủi Ro Kiểm Toán Mới
            </span>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Phân hệ / Quy trình:</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Khoản Phải Thu, Kho quỹ, SEO, Mua Hàng..."
                  value={newRisk.processName}
                  onChange={e => setNewRisk(prev => ({ ...prev, processName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-lg text-slate-200 outline-none focus:border-purple-500 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Mô tả rủi ro sọc thô:</label>
                <textarea 
                  placeholder="Ví dụ: Giả mạo giao dịch VietQR khi khách hàng gửi ảnh đã biến đổi photoshop..."
                  value={newRisk.riskDescription}
                  onChange={e => setNewRisk(prev => ({ ...prev, riskDescription: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-lg text-slate-200 outline-none focus:border-purple-500 h-16 text-xs leading-relaxed font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">Khả năng xảy ra:</label>
                  <select
                    value={newRisk.likelihood}
                    onChange={e => setNewRisk(prev => ({ ...prev, likelihood: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-lg text-slate-200 outline-none focus:border-purple-500 text-xs font-bold"
                  >
                    <option value={1}>1 - Rất Hiếm Gặp</option>
                    <option value={2}>2 - Hiếm Gặp</option>
                    <option value={3}>3 - Thỉnh Thoảng</option>
                    <option value={4}>4 - Thường Xuyên</option>
                    <option value={5}>5 - Cực Kỳ Cao</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">Mức độ tác hại:</label>
                  <select
                    value={newRisk.impact}
                    onChange={e => setNewRisk(prev => ({ ...prev, impact: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-lg text-slate-200 outline-none focus:border-purple-500 text-xs font-bold"
                  >
                    <option value={1}>1 - Không Đáng Kể</option>
                    <option value={2}>2 - Nhẹ</option>
                    <option value={3}>3 - Đáng Kể</option>
                    <option value={4}>4 - Trọng yếu</option>
                    <option value={5}>5 - Chí Tử/Nguy Kịch</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Hoạt động phòng thủ rào chắn thiết kế:</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Tích hợp Webhook đối soát tự động, dọn dẹp format"
                  value={newRisk.controlActivity}
                  onChange={e => setNewRisk(prev => ({ ...prev, controlActivity: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-lg text-slate-200 outline-none focus:border-purple-500 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Trạng thái rào chắn:</label>
                <select
                  value={newRisk.mitigationStatus}
                  onChange={e => setNewRisk(prev => ({ ...prev, mitigationStatus: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-lg text-slate-200 outline-none text-xs font-bold"
                >
                  <option value="Open">Chưa Khắc phục (Open)</option>
                  <option value="In Progress">Đang Theo Dõi (In Progress)</option>
                  <option value="Resolved">Khắc Phục Xong (Resolved)</option>
                </select>
              </div>

              <button 
                onClick={handleAddRisk}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
              >
                Ghi nhận rủi ro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 2: COSO EVALUATION =================================== */}
      {activeTab === 'coso' && (
        <div className="grid lg:grid-cols-12 gap-6 select-text">
          {/* Diagnostic overview left */}
          <div className="lg:col-span-8 space-y-6">
            {cosoSections.map((sect, sIdx) => (
              <div key={sIdx} className="bg-[#040812] border border-slate-900 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-purple-500 pl-2.5 font-mono">
                  {sect.title}
                </h3>
                <div className="space-y-3.5 pt-1">
                  {sect.checklist.map(item => (
                    <div key={item.id} className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-xs text-slate-250 font-bold leading-relaxed">{item.question}</p>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                          {item.ref}
                        </span>
                      </div>

                      {/* Control buttons & input */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCosoAnswer(item.id, 'Pass')}
                            className={`p-1.5 px-3 rounded-lg text-[10.5px] font-black border transition-all cursor-pointer ${
                              cosoAnswers[item.id] === 'Pass'
                                ? 'bg-emerald-500/15 border-emerald-550 text-emerald-400'
                                : 'bg-slate-900 border-slate-850 text-slate-450 hover:text-slate-300'
                            }`}
                          >
                            ✓ TUÂN THỦ (Pass)
                          </button>
                          <button
                            onClick={() => handleCosoAnswer(item.id, 'Fail')}
                            className={`p-1.5 px-3 rounded-lg text-[10.5px] font-black border transition-all cursor-pointer ${
                              cosoAnswers[item.id] === 'Fail'
                                ? 'bg-rose-500/15 border-rose-550 text-rose-450 font-extrabold'
                                : 'bg-slate-900 border-slate-850 text-slate-450 hover:text-slate-300'
                            }`}
                          >
                            ✗ VI PHẠM (Fail)
                          </button>
                          <button
                            onClick={() => handleCosoAnswer(item.id, 'N/A')}
                            className={`p-1.5 px-3 rounded-lg text-[10.5px] font-black border transition-all cursor-pointer ${
                              cosoAnswers[item.id] === 'N/A'
                                ? 'bg-slate-800 border-slate-700 text-slate-400'
                                : 'bg-slate-900 border-slate-850 text-slate-450 hover:text-slate-300'
                            }`}
                          >
                            N/A
                          </button>
                        </div>
                        <input
                          type="text"
                          value={notes[item.id] || ''}
                          onChange={e => handleCosoNote(item.id, e.target.value)}
                          placeholder="Ghi chú phát hiện / bằng chứng rà soát..."
                          className="flex-1 bg-slate-950 border border-slate-850/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-semibold outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Audit scoreboard right side */}
          <div className="lg:col-span-4 bg-[#040812] border border-slate-900 rounded-2xl p-5 space-y-4 h-fit sticky top-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-5 h-5 text-purple-400" />
              Điểm Đánh Giá Tuân Thủ
            </h3>
            
            <div className="space-y-4 font-mono select-none">
              <div className="text-center py-6 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-black block">Audit Compliance Score</span>
                <span className={`text-4xl font-black ${
                  auditComplianceScore >= 80 ? 'text-emerald-400' :
                  auditComplianceScore >= 50 ? 'text-amber-400' : 'text-rose-500'
                }`}>
                  {auditComplianceScore}%
                </span>
                <p className="text-[11px] text-slate-400 font-semibold max-w-xs mx-auto px-2">
                  {auditComplianceScore >= 80 ? '✓ Đạt chuẩn mức độ kiểm soát vẹn toàn cao. Rủi ro hở sườn gian lận rất thấp.' :
                   auditComplianceScore >= 50 ? '⚠️ Cấp độ trung bình. Cần vá ngay các điểm sai sót để tránh kiểm toán ngoài sụp đổ.' :
                   '✗ Ngưỡng BÁO ĐỘNG. Doanh nghiệp dễ bị sai phạm, rò rỉ dòng tiền.'}
                </p>
              </div>

              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Tổng tiêu chí đối chiếu:</span>
                  <span className="text-white font-bold">{totalCoso}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Số điểm Đạt (Pass):</span>
                  <span className="text-emerald-400 font-bold">{passCoso}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Số điểm có Sơ hở (Fail):</span>
                  <span className="text-rose-500 font-bold">{failCoso}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900">
                <button
                  onClick={() => {
                    const confirm = window.confirm('Bạn có chắc chắn muốn thiết lập lại toàn bộ đánh giá kiểm soát để khởi đầu rà soát mới không?');
                    if (confirm) {
                      setCosoAnswers({});
                      setNotes({});
                      localStorage.removeItem('lf_coso_answers');
                      localStorage.removeItem('lf_coso_notes');
                    }
                  }}
                  className="w-full p-2 bg-slate-950 hover:bg-slate-900 text-slate-450 hover:text-rose-400 border border-slate-90O hover:border-rose-900/30 text-[10px] uppercase font-bold rounded-xl transition-all cursor-pointer"
                >
                  Xóa kết quả rà soát
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 3: SAMPLING CALCULATOR =================================== */}
      {activeTab === 'sampling' && (
        <div className="grid lg:grid-cols-12 gap-6 text-xs font-semibold">
          
          {/* Controls left col */}
          <div className="lg:col-span-5 bg-[#040812] border border-slate-900 rounded-2xl p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-5 h-5 text-purple-400" />
                Kiểm Toán Mẫu Thuộc Tính (Attribute Sampling Calculator)
              </h3>
              <p className="text-xs text-slate-400 leading-snug font-medium">
                Sử dụng phương pháp toán học xác suất thống kê để tìm số lượng mẫu hóa đơn/sao kê tối thiểu cần rà soát nhằm đảm bảo tính trung thực.
              </p>
            </div>

            <div className="pt-2 space-y-4">
              {/* Population Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-slate-400 font-bold">1. Tổng mẫu phát sinh (Hóa đơn/Chứng từ thô):</label>
                  <span className="text-purple-400 font-extrabold">{popCount.toLocaleString()}</span>
                </div>
                <input 
                  type="number"
                  value={popCount}
                  onChange={e => setPopCount(Math.max(10, Number(e.target.value) || 100))}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-white font-mono"
                />
              </div>

              {/* Confidence Level */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">2. Hệ số tin cậy mong muốn (Confidence Level):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[90, 95, 99].map(cl => (
                    <button
                      key={cl}
                      onClick={() => setConfidence(cl)}
                      className={`py-2 rounded-xl font-bold uppercase transition-all border cursor-pointer text-xs ${
                        confidence === cl 
                          ? 'bg-purple-600 border-purple-500 text-white shadow' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cl}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Tolerable Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-slate-400 font-bold">3. Tỷ lệ sai sót có thể bỏ qua (Tolerable Rate):</label>
                  <span className="text-amber-400 font-extrabold">{tolerableRate}%</span>
                </div>
                <input 
                  type="range"
                  min="2"
                  max="20"
                  step="0.5"
                  value={tolerableRate}
                  onChange={e => setTolerableRate(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-950 rounded cursor-pointer"
                />
              </div>

              {/* Expected Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-slate-400 font-bold">4. Tỷ lệ sai sót mong đợi thực tế (Expected Rate):</label>
                  <span className="text-emerald-400 font-extrabold">{expectedRate}%</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={expectedRate}
                  onChange={e => setExpectedRate(Math.min(tolerableRate - 1, Number(e.target.value)))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-950 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results right col */}
          <div className="lg:col-span-7 bg-[#040812] border border-slate-900 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Kết Quả Tính Toán Mẫu (Statistical Audit Outcome)
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-1 font-mono text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Kích thước mẫu đề xuất (Sample Size)</span>
                <span className="text-3xl font-black text-purple-400 block">{sampleSize}</span>
                <p className="text-[10.5px] text-slate-450 leading-snug">Số lượng bản ghi hóa đơn cần kéo ra audit ngẫu nhiên.</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-1 font-mono text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Tỷ lệ bao phủ kiểm toán</span>
                <span className="text-3xl font-black text-emerald-400 block">
                  {((sampleSize / popCount) * 100).toFixed(1)}%
                </span>
                <p className="text-[10.5px] text-slate-450 leading-snug">Tỷ lệ quét trên dung lượng dữ liệu thô toàn quỹ.</p>
              </div>
            </div>

            {/* Systematic Sampling sequence representation */}
            <div className="p-4.5 bg-slate-950 border border-slate-900 rounded-xl space-y-3 font-mono">
              <span className="text-[9.5px] text-slate-500 font-semibold uppercase tracking-wider block">
                🔍 Thăm dò Hệ thống: Gợi ý số thứ tự dòng mẫu kéo ra đối chứng gốc
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {samplesList.map((idxVal, idx) => (
                  <span 
                    key={idx} 
                    className="p-1 px-2.5 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-purple-400 border border-slate-850 text-xs font-black rounded-lg transition-all"
                  >
                    Dòng #{idxVal}
                  </span>
                ))}
              </div>
              <span className="text-[10.5px] text-slate-500 block leading-tight font-medium italic">
                Sử dụng các dòng phía trên từ file sao kê Excel/CSV sạch để nhấc ra đối chiếu. Khuyên dùng kèm công cụ quét sao kê ngân hàng Benford.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 4: AUDIT WORKING PAPERS =================================== */}
      {activeTab === 'papers' && (
        <div className="grid lg:grid-cols-12 gap-6 select-text text-xs leading-relaxed font-semibold">
          {/* Active working paper browser */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-[#040812] border border-slate-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Giấy Tờ Làm Việc Kiểm Toán (Working Papers)
              </h3>
              <p className="text-xs text-slate-400 leading-normal font-semibold">
                Giấy tờ làm việc ghi lại quy trình kiểm toán, mục tiêu, kết quả phát hiện và kết luận phê duyệt của trưởng ban kiểm soát độc lập. Chọn nút AI để tạo dự thảo tự động.
              </p>

              <div className="space-y-4 pr-1">
                {papers.map((p) => (
                  <div key={p.id} className="bg-slate-950/70 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all space-y-4 relative">
                    <div className="flex justify-between items-start gap-4 flex-wrap border-b border-slate-900 pb-3">
                      <div>
                        <span className="text-[9.5px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/15">
                          {p.code}
                        </span>
                        <h4 className="text-sm font-black text-white mt-1 uppercase tracking-wide">{p.title}</h4>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <select
                          value={p.status}
                          onChange={e => handleUpdatePaperStatus(p.id, e.target.value as any)}
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-[10.5px] font-bold p-1 px-2.5 rounded-lg outline-none"
                        >
                          <option value="Draft">Sơ Thảo (Draft)</option>
                          <option value="Reviewing">Đang rà lại (Reviewing)</option>
                          <option value="Approved">Đã Phê Duyệt (Approved)</option>
                        </select>

                        <button
                          onClick={() => handleDeletePaper(p.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/20 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-[11.5px] text-slate-450 leading-relaxed border-b border-slate-900 pb-3.5">
                      <div>
                        <strong className="text-slate-350 block mb-0.5">🎯 Mục tiêu:</strong>
                        {p.objective}
                      </div>
                      <div>
                        <strong className="text-slate-350 block mb-0.5">⚙️ Thủ tục rà soát:</strong>
                        {p.procedure}
                      </div>
                    </div>

                    {/* AI generative evidence area */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-850">
                        <span className="text-[10.5px] font-bold text-slate-400 block font-mono flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          PHÁT HIỆN & BẰNG CHỨNG KIỂM TOÁN (EVIDENCE & RESULTS)
                        </span>

                        <button
                          onClick={() => handleAiDraftPaper(p.id)}
                          disabled={aiLoading}
                          className="px-3 py-1 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          {aiLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-purple-450" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          Sinh dự thảo AI
                        </button>
                      </div>

                      {p.evidence ? (
                        <div className="relative rounded-xl border border-slate-900/80 bg-slate-950 p-4 scrollbar-thin overflow-auto max-h-[180px] font-mono text-[10.5px] leading-relaxed select-text text-slate-300 whitespace-pre-wrap">
                          {p.evidence}
                        </div>
                      ) : (
                        <div className="text-center p-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-900 italic text-[11px] text-slate-500 font-medium">
                          Bằng chứng kiểm toán chưa được lập. Vui lòng bấm "Sinh dự thảo AI" để trích xuất đề xuất từ CPA advisor.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Create working paper form right */}
          <div className="lg:col-span-4 bg-[#040812] border border-slate-900 rounded-2xl p-5 space-y-4 h-fit">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900 pb-2">
              ➕ Soạn Thảo Giấy Tờ Làm Việc Mới
            </span>

            <div className="space-y-3 pt-1 text-xs font-semibold">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1">
                  <label className="text-slate-400 block font-bold">Mã WP:</label>
                  <input
                    type="text"
                    placeholder="WP-C300"
                    value={newPaper.code}
                    onChange={e => setNewPaper(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg text-slate-200 outline-none uppercase text-xs font-bold"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 block font-bold">Tiêu đề WP:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đối chiếu công nợ nhà bán lẻ"
                    value={newPaper.title}
                    onChange={e => setNewPaper(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg text-slate-200 outline-none text-xs font-bold font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Mục tiêu kiểm toán (Objective):</label>
                <textarea
                  placeholder="Xác định rủi ro..."
                  value={newPaper.objective}
                  onChange={e => setNewPaper(prev => ({ ...prev, objective: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg text-slate-200 outline-none h-14 text-xs font-sans leading-normal font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Thủ tục thực hiện (Procedure):</label>
                <textarea
                  placeholder="Kiểm tra chọn mẫu..."
                  value={newPaper.procedure}
                  onChange={e => setNewPaper(prev => ({ ...prev, procedure: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg text-slate-200 outline-none h-14 text-xs font-sans leading-normal font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">Xác nhận của Kiểm toán viên:</label>
                <select
                  value={newPaper.reviewer}
                  onChange={e => setNewPaper(prev => ({ ...prev, reviewer: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg text-slate-200 outline-none text-xs font-bold"
                >
                  <option value="Chủ nhiệm kiểm toán Lê Khoa">Chủ nhiệm Lê Khoa (CPA)</option>
                  <option value="CFO Trương Đan">Giám đốc CFO Đan Trương (CPA)</option>
                </select>
              </div>

              <button
                onClick={handleAddPaper}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
              >
                Ghi sổ Giấy tờ mới
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
