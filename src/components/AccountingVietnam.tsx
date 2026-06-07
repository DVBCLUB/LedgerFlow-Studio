// Version 2.0 - AccountingVietnam (Kế toán Thực chiến Việt Nam)
import React, { useState } from 'react';
import { 
  Receipt, 
  HelpCircle, 
  Search, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  ArrowRight,
  TrendingUp, 
  FileCode,
  DollarSign, 
  Calculator,
  Compass,
  Copy,
  FolderOpen,
  Folder,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Line, Legend } from 'recharts';

export default function AccountingVietnam() {
  const [activeTab, setActiveTab] = useState<'invoice' | 'chart_accounts' | 'bank_reconcile' | 'statements'>('invoice');
  const [copiedCodeFlag, setCopiedCodeFlag] = useState<string | null>(null);

  const triggerCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeFlag(key);
    setTimeout(() => setCopiedCodeFlag(null), 2000);
  };

  // --- TAB 1: INVOICE & TAX ---
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  
  const quizQuestions = [
    {
      q: "Theo Nghị định 123/2020/NĐ-CP, thời điểm lập hóa đơn điện tử đối với bán hàng hóa là khi nào?",
      options: [
        "Khi ký hợp đồng mua bán với khách hàng",
        "Thời điểm chuyển giao quyền sở hữu hoặc quyền sử dụng hàng hóa (không phân biệt đã thu được tiền hay chưa)",
        "Khi người mua thanh toán toàn bộ dòng tiền",
        "Tổng hợp vào ngày cuối cùng của tháng"
      ],
      correct: 1,
      explain: "Nghị định 123 quy định thời điểm lập hóa đơn đối với bán hàng hóa là thời điểm chuyển giao quyền sở hữu/sử dụng, không phân biệt đã thu được tiền hay chưa."
    },
    {
      q: "Ngưỡng doanh thu bắt buộc để hộ kinh doanh chuyển sang kê khai thuế theo phương pháp kê khai (thay vì khoán) là gì?",
      options: [
        "Doanh thu năm trước từ 100 triệu đồng trở xuống",
        "Có quy mô về doanh thu, lao động đáp ứng tiêu chí siêu nhỏ trở lên (Doanh thu thương mại dịch vụ từ 3 tỷ/năm hoặc nông lâm thủy sản từ 1 tỷ/năm)",
        "Tất cả hộ kinh doanh đều bắt buộc",
        "Chỉ áp dụng kinh doanh bất động sản"
      ],
      correct: 1,
      explain: "Hộ kinh doanh quy mô đáp ứng tiêu chuẩn doanh nghiệp siêu nhỏ bắt buộc nộp thuế theo phương pháp kê khai."
    },
    {
      q: "Hạn nộp tờ khai thuế GTGT theo phương pháp khấu trừ đối với doanh nghiệp kê khai theo tháng là ngày nào?",
      options: [
        "Chậm nhất là ngày 20 của tháng tiếp theo tháng phát sinh nghĩa vụ thuế",
        "Chậm nhất là ngày cuối cùng của tháng tiếp theo",
        "Chậm nhất là ngày 30 của quý tiếp theo",
        "Tự do lựa chọn ngày nộp"
      ],
      correct: 0,
      explain: "Theo Luật Quản lý Thuế số 38, thời hạn nộp hồ sơ kê khai thuế GTGT tháng chậm nhất là ngày 20 của tháng kế tiếp."
    }
  ];

  const handleSelectQuiz = (qIdx: number, oIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  // --- TAB 2: CHART OF ACCOUNTS (TT200) ---
  const [searchAccount, setSearchAccount] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({ "111": true, "112": true });

  const chartOfAccounts = [
    {
      code: "LOẠI 1", name: "TÀI SẢN NGẮN HẠN", isHeader: true,
      children: [
        { code: "111", name: "Tiền mặt", children: ["1111: Tiền Việt Nam", "1112: Ngoại tệ", "1113: Vàng tiền tệ"] },
        { code: "112", name: "Tiền gửi Ngân hàng", children: ["1121: Tiền Việt Nam gửi ngân hàng", "1122: Ngoại tệ gửi ngân hàng"] },
        { code: "131", name: "Phải thu của khách hàng", children: ["1311: Phải thu khách hàng ngắn hạn", "1312: Phải thu khách hàng dài hạn"] },
        { code: "152", name: "Nguyên liệu, vật liệu", children: [] },
        { code: "156", name: "Hàng hóa", children: ["1561: Giá mua hàng hóa", "1562: Chi phí mua hàng hóa"] }
      ]
    },
    {
      code: "LOẠI 2", name: "TÀI SẢN DÀI HẠN", isHeader: true,
      children: [
        { code: "211", name: "Tài sản cố định hữu hình", children: ["2111: Nhà cửa, vật kiến trúc", "2112: Máy móc, thiết bị", "2113: Phương tiện vận tải"] },
        { code: "214", name: "Hao mòn tài sản cố định" }
      ]
    },
    {
      code: "LOẠI 3", name: "NỢ PHẢI TRẢ", isHeader: true,
      children: [
        { code: "331", name: "Phải trả cho người bán", children: ["3311: Phải trả người bán ngắn hạn", "3312: Phải trả người bán dài hạn"] },
        { code: "333", name: "Thuế và các khoản phải nộp Nhà nước", children: ["3331: Thuế GTGT đầu ra", "3332: Thuế tiêu thụ đặc biệt", "3334: Thuế thu nhập doanh nghiệp"] }
      ]
    },
    {
      code: "LOẠI 4", name: "VỐN CHỦ SỞ HỮU", isHeader: true,
      children: [
        { code: "411", name: "Vốn đầu tư của chủ sở hữu", children: ["4111: Vốn góp của chủ sở hữu", "4112: Thặng dư vốn cổ phần"] },
        { code: "421", name: "Lợi nhuận sau thuế chưa phân phối", children: ["4211: Lợi nhuận chưa phân phối năm trước", "4212: Lợi nhuận chưa phân phối năm nay"] }
      ]
    }
  ];

  const toggleAccount = (code: string) => {
    setExpandedAccounts(prev => ({ ...prev, [code]: !prev[code] }));
  };

  // --- TAB 3: BANK RECONCILIATION & BENFORD ---
  const [rawAmounts, setRawAmounts] = useState<string>("342000, 310500, 1500000, 120500, 890000, 540000, 1100000, 150000, 315000, 220000, 195000, 680000, 150000, 180000, 250000, 120000, 1400000");
  const [benfordFlags, setBenfordFlags] = useState<{ digit: number; actual: number; expected: number }[]>([]);

  const handleAnalyzeBenford = () => {
    const list = rawAmounts.split(/[\s,]+/).map(x => x.replace(/[^0-9]/g, '')).filter(x => x.length > 0);
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    let total = 0;

    for (const num of list) {
      const firstDigit = parseInt(num[0]);
      if (firstDigit >= 1 && firstDigit <= 9) {
        counts[firstDigit]++;
        total++;
      }
    }

    const calculatedFlags = Array.from({ length: 9 }, (_, i) => {
      const digit = i + 1;
      const actualPct = total > 0 ? (counts[digit] / total) * 100 : 0;
      const expectedPct = Math.log10(1 + 1 / digit) * 100;
      return {
        digit,
        actual: parseFloat(actualPct.toFixed(1)),
        expected: parseFloat(expectedPct.toFixed(1))
      };
    });

    setBenfordFlags(calculatedFlags);
  };

  // Cash flow simulation dataset of daily balances for Recharts
  const bankCashFlowData = [
    { day: "01", Thu: 240, Chi: 180, balance: 600 },
    { day: "05", Thu: 320, Chi: 220, balance: 700 },
    { day: "10", Thu: 150, Chi: 90, balance: 760 },
    { day: "15", Thu: 480, Chi: 350, balance: 890 },
    { day: "20", Thu: 110, Chi: 260, balance: 740 },
    { day: "25", Thu: 520, Chi: 140, balance: 1120 },
    { day: "30", Thu: 290, Chi: 410, balance: 1000 }
  ];

  // --- TAB 4: FINANCIAL RATIOS CALCULATOR ---
  const [revenue, setRevenue] = useState<number>(1200);   // triệu VNĐ
  const [cogs, setCogs] = useState<number>(750);
  const [opex, setOpex] = useState<number>(220);
  const [assets, setAssets] = useState<number>(1800);
  const [liabilities, setLiabilities] = useState<number>(850);
  const [inventory, setInventory] = useState<number>(200);

  const ebit = revenue - cogs - opex;
  const netIncome = ebit * 0.8; // Giả định Thuế TNDN 20%
  const equity = assets - liabilities;

  // Ratios
  const currentRatio = liabilities > 0 ? (assets / liabilities).toFixed(2) : "0";
  const quickRatio = liabilities > 0 ? ((assets - inventory) / liabilities).toFixed(2) : "0";
  const roe = equity > 0 ? ((netIncome / equity) * 100).toFixed(1) : "0";
  const grossMargin = revenue > 0 ? (((revenue - cogs) / revenue) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <section className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Kế Toán Thực Chiến Việt Nam</h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Khám phá thực tiễn Nghị định 123 hóa đơn điện tử, Thông tư 200, dọn sạch sao kê và tính toán tỷ lệ tài chính SME.
            </p>
          </div>
        </div>

        {/* TABS DECORATOR */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invoice' ? 'bg-orange-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hóa Đơn &amp; Thuế
          </button>
          <button
            onClick={() => setActiveTab('chart_accounts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chart_accounts' ? 'bg-orange-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hệ Thống TK (TT200)
          </button>
          <button
            onClick={() => setActiveTab('bank_reconcile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bank_reconcile' ? 'bg-orange-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đối Soát &amp; Benford
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'statements' ? 'bg-orange-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Báo Cáo Tài Chính
          </button>
        </div>
      </section>

      {/* =================================== TAB 1: INVOICE & TAX =================================== */}
      {activeTab === 'invoice' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Nghị định 123/2020/NĐ-CP &amp; Thông tư 78
              </span>
              <h3 className="text-base font-black text-white">Quản Trị Quy Trình Hóa Đơn Điện Tử</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Nghị định 123 thiết lập kỷ nguyên hóa đơn điện tử bắt buộc tại Việt Nam. Toàn bộ giao dịch bán hàng hóa, cung cấp dịch vụ yêu cầu phải lập hóa đơn tức thời để tránh rủi ro phạt hành chính thuế rất nặng từ Ủy ban thuế.
              </p>
            </div>

            {/* VAT 8% vs 10% */}
            <div className="space-y-3 bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider">Phân biệt thuế suất GTGT 8% vs 10% (Chính sách gia hạn giảm thuế)</h4>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="font-bold text-orange-400">Ngành được giảm thuế còn 8%</span>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Đa số ngành sản xuất công nghiệp, tiêu dùng thương mại, du lịch, ăn uống, gia công phần cứng cơ bản.
                  </p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="font-bold text-slate-300">Ngành ngoại lệ (Giữ nguyên 10%)</span>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Viễn thông, Công nghệ thông tin (phần mềm), Hoạt động tài chính, Ngân hàng, Chứng khoán, Bảo hiểm, Bất động sản và kim loại quý.
                  </p>
                </div>
              </div>
            </div>

            {/* XML Invoice extraction sample */}
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-xl border border-slate-850">
                <span className="text-[10.5px] font-mono text-slate-400 flex items-center gap-1.5 font-bold">
                  <FileCode className="w-4 h-4 text-orange-400" />
                  Mã Python: Class Parse XML Hóa đơn thuế Việt Nam
                </span>
                <button
                  onClick={() => triggerCopy(`import xml.etree.ElementTree as ET

def parse_vietnam_xml_invoice(xml_string):
    """
    Parse hóa đơn điện tử XML (định dạng chuẩn của Tổng cục Thuế Việt Nam)
    Trích xuất: MST người bán, tên đơn vị, tổng tiền trước thuế, thuế suất VAT
    """
    root = ET.fromstring(xml_string)
    
    # Namespace chuẩn của TCT
    ns = {'tct': 'http://xml.tct.gdt.gov.vn'}
    
    # Trích xuất dữ liệu
    seller_node = root.find('.//NDHDon/NBan', ns)
    seller_mst = seller_node.find('MST', ns).text if seller_node is not None else "Không tìm thấy"
    seller_name = seller_node.find('Ten', ns).text if seller_node is not None else "Không tìm thấy"
    
    amount_before_tax = float(root.find('.//DSCVDVu/Tổng_Tiền_Chưa_Thuế', ns).text or 0)
    tax_rate = root.find('.//DSCVDVu/Thuế_Suất', ns).text or "10%"
    
    print(f"MST Bán: {seller_mst} | Doanh nghiệp: {seller_name}")
    print(f"Tổng trị giá trước thuế: {amount_before_tax:,.0f} VND | Thuế suất: {tax_rate}")
    
    return {
        "mst_ban": seller_mst,
        "ten_ban": seller_name,
        "amount": amount_before_tax,
        "tax": tax_rate
    }`, 'xml_code')}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold text-orange-405 bg-orange-500/10 border border-orange-500/20 rounded-lg cursor-pointer"
                >
                  {copiedCodeFlag === 'xml_code' ? "Đã sao chép!" : "Copy code"}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-[10.5px] font-mono text-slate-300 rounded-xl leading-relaxed select-text border border-slate-900 overflow-x-auto max-h-[180px]">
{`import xml.etree.ElementTree as ET

def parse_vietnam_xml_invoice(xml_string):
    root = ET.fromstring(xml_string)
    ns = {'tct': 'http://xml.tct.gdt.gov.vn'}
    seller_node = root.find('.//NDHDon/NBan', ns)
    seller_mst = seller_node.find('MST', ns).text if seller_node is not None else "Không tìm thấy"
    amount_before_tax = float(root.find('.//DSCVDVu/Tổng_Tiền_Chưa_Thuế', ns).text or 0)
    return {"mst": seller_mst, "amount": amount_before_tax}`}
              </pre>
            </div>
          </div>

          {/* Interactive Quiz container */}
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <HelpCircle className="w-5 h-5 text-orange-400" />
                Kiểm Tra Nghiệp Vụ Kê Khai Thuế GTGT
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">Trả lời 3 câu hỏi trắc nghiệm dưới đây để kích hoạt phản hồi giải tích chuẩn!</p>
            </div>

            <div className="space-y-4">
              {quizQuestions.map((item, qIdx) => (
                <div key={qIdx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-orange-400 font-mono">CÂU HỎI {qIdx + 1}</span>
                  <p className="text-xs text-slate-200 font-bold leading-relaxed">{item.q}</p>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {item.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectQuiz(qIdx, oIdx)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs leading-relaxed font-semibold border transition-all cursor-pointer ${
                          quizAnswers[qIdx] === oIdx
                            ? 'bg-orange-600/10 border-orange-505 text-white shadow shadow-orange-500/10'
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {showQuizResult && (
                    <div className={`p-2.5 rounded-lg text-[11px] font-semibold ${
                      quizAnswers[qIdx] === item.correct 
                        ? 'bg-emerald-950/15 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-950/15 text-rose-400 border border-rose-500/20'
                    }`}>
                      {quizAnswers[qIdx] === item.correct ? "✅ Chính xác! " : "❌ Chưa chính xác. "}
                      {item.explain}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowQuizResult(true)}
              className="w-full py-3 bg-orange-600 hover:bg-orange-550 text-white rounded-xl text-xs font-bold transition-all shadow shadow-orange-500/15 cursor-pointer block text-center"
            >
              Nộp Bài &amp; Xem Thuyết Minh Đối Soát
            </button>
          </div>
        </div>
      )}

      {/* =================================== TAB 2: CHART OF ACCOUNTS (TT200) =================================== */}
      {activeTab === 'chart_accounts' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Interactive Account mapping */}
          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Sơ Đồ Cây Tài Khoản Thông tư 200/2014/TT-BTC</h3>
                <p className="text-[11px] text-slate-400 font-semibold text-left">Click vào các tài khoản cấp 1 để mở rộng xem chi tiết tài khoản cấp 2.</p>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm tài khoản theo số/tên..."
                  value={searchAccount}
                  onChange={e => setSearchAccount(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 w-full sm:w-[220px]"
                />
              </div>
            </div>

            {/* Tree hierarchy viewport */}
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3.5 max-h-[400px] overflow-y-auto index-tree scrollbar-thin scrollbar-thumb-slate-800">
              {chartOfAccounts.map((group, groupIdx) => {
                const filteredChildren = group.children?.filter(child => 
                  child.code.includes(searchAccount) || child.name.toLowerCase().includes(searchAccount.toLowerCase())
                ) || [];

                if (searchAccount && filteredChildren.length === 0) return null;

                return (
                  <div key={groupIdx} className="space-y-2">
                    <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5 text-orange-500" />
                      {group.code} — {group.name}
                    </span>

                    <div className="pl-3.5 space-y-1.5 border-l border-slate-900">
                      {(searchAccount ? filteredChildren : group.children || []).map((account, accIdx) => (
                        <div key={accIdx} className="space-y-1.5">
                          <button
                            onClick={() => toggleAccount(account.code)}
                            className="w-full text-left flex justify-between items-center text-xs font-bold text-slate-300 hover:text-white py-1 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-orange-400 font-mono text-[11px] font-extrabold">[{account.code}]</span>
                              <span>{account.name}</span>
                            </span>
                            {account.children && account.children.length > 0 && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                {expandedAccounts[account.code] ? "Thu gọn [-]" : `Mở rộng (${account.children.length}) [+]`}
                              </span>
                            )}
                          </button>

                          {account.children && account.children.length > 0 && expandedAccounts[account.code] && (
                            <div className="pl-6 space-y-1 my-1">
                              {account.children.map((sub, sIdx) => {
                                const [subCode, subName] = sub.split(': ');
                                return (
                                  <div key={sIdx} className="text-[11px] text-slate-450 font-medium py-0.5 flex items-center gap-1.5 font-mono">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0"></span>
                                    <strong className="text-orange-450">{subCode}</strong>
                                    <span className="font-sans font-semibold text-slate-400">{subName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Database double entry SQL script */}
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max">
                Chuẩn Định Dạng DB Kế Toán
              </span>
              <h3 className="text-base font-black text-white">Schema double-entry định khoản</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Chào solo founder! Để xây dựng lõi phần mềm kế toán, việc lập trình mô hình Bút Toán Kép (Double-entry journaling) chuẩn tắc là chìa khóa vàng. Dưới đây là schema PostgreSQL thực tế hỗ trợ ràng buộc chặt chẽ Có - Nợ.
              </p>

              <div className="space-y-2.5 bg-slate-950 border border-slate-850 p-4 rounded-xl">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>SQL DDL - Journal Entries Table</span>
                  <button
                    onClick={() => triggerCopy(`-- Schema PostgreSQL chuẩn bút toán kép kế toán
CREATE TABLE chart_of_accounts (
  account_code VARCHAR(15) PRIMARY KEY, -- Ví dụ: '1111', '1121'
  account_name VARCHAR(150) NOT NULL,
  account_type VARCHAR(30) CHECK(account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense'))
);

CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  reference_no VARCHAR(50) UNIQUE, -- Số hóa đơn/chứng từ gốc
  posted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_lines (
  id SERIAL PRIMARY KEY,
  entry_id INT REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_code VARCHAR(15) REFERENCES chart_of_accounts(account_code),
  debit_amount BIGINT DEFAULT 0 CHECK (debit_amount >= 0),  -- Nợ (BIGINT tránh số lẻ float)
  credit_amount BIGINT DEFAULT 0 CHECK (credit_amount >= 0), -- Có
  CONSTRAINT check_at_least_one CHECK (debit_amount > 0 OR credit_amount > 0)
);`, 'sql_code')}
                    className="text-[9.5px] uppercase font-bold text-orange-400 cursor-pointer hover:text-white"
                  >
                    {copiedCodeFlag === 'sql_code' ? "Đã chép!" : "Copy SQL"}
                  </button>
                </div>
                <pre className="text-[10.5px] font-mono text-slate-300 leading-relaxed select-text overflow-x-auto max-h-[150px]">
{`CREATE TABLE journal_lines (
  id SERIAL PRIMARY KEY,
  entry_id INT REFERENCES journal_entries(id),
  account_code VARCHAR(15) REFERENCES chart_of_accounts,
  debit_amount BIGINT DEFAULT 0,  -- Số tiền ghi Nợ
  credit_amount BIGINT DEFAULT 0 -- Số tiền ghi Có
);`}
                </pre>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-900/60 pt-3">
              * Lưu ý: Trong kế toán chuẩn, <strong>Tổng Số Tiền Ghi NỢ luôn bằng Tổng Số Tiền Ghi CÓ</strong> đối với một Bút toán để cân bảng đối chiếu.
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 3: BANK RECONCILIATION & BENFORD =================================== */}
      {activeTab === 'bank_reconcile' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Xử lý đối soát sao kê tự động
              </span>
              <h3 className="text-base font-black text-white">Bank Reconciliation &amp; Benford Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Hàm Python Pandas giúp dọn dẹp dòng dữ liệu sao kê ngân hàng thô (ví dụ VCB có chứa dấu phân cách nghìn chấm và ký tự "VND"), loại bỏ rác văn bản để ghép nối ledger nội bộ, giúp bạn thực hiện bank reconciliation nhanh chóng.
              </p>
            </div>

            {/* Pandas reconciliation cleaning Python Code */}
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-xl border border-slate-850">
                <span className="text-[10.5px] font-mono pr-2 text-slate-400 font-bold flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-orange-400" />
                  Mã Python Pandas: Clean VCB Statement &amp; Merge ledger
                </span>
                <button
                  onClick={() => triggerCopy(`import pandas as pd
import re

def clean_vcb_statement(bank_csv_path, ledger_csv_path):
    # Đọc file sao kê ngân hàng VCB thô
    df_bank = pd.read_csv(bank_csv_path)
    
    # 1. Định nghĩa regex dọn dẹp số tiền (Dọn 2.000.000, 150.000đ, VND...)
    def clean_amount(val):
      if pd.isna(val): return 0
      # Xóa toàn bộ ký tự ngoại trừ số để giữ nguyên VNĐ
      cleaned = re.sub(r'[^\\d]', '', str(val))
      return int(cleaned) if cleaned else 0

    df_bank['cleaned_amount'] = df_bank['So_Tien_Giao_Dich'].apply(clean_amount)
    
    # 2. Match Regex nội dung chuyển khoản phổ biến tìm mã đơn hàng ID
    # Ví dụ: "CK: NAP TIEN CODES_920392, ID_32890" -> Extract '32890'
    def extract_order_id(note):
      match = re.search(r'(ID_|codes_)\\s*([0-9]+)', str(note), re.IGNORECASE)
      return match.group(2) if match else None
      
    df_bank['detected_order_id'] = df_bank['Noi_Dung_CK'].apply(extract_order_id)
    
    # 3. Kết hợp với sổ cái nội bộ (ledger) để phát hiện chênh lệch đối soát
    df_ledger = pd.read_csv(ledger_csv_path)
    merged = pd.merge(df_bank, df_ledger, left_on='detected_order_id', right_on='order_id', how='outer', suffixes=('_bank', '_internal'))
    
    # Làm nổi bật chênh lệch lệch số tiền
    unmatched = merged[merged['cleaned_amount'] != merged['internal_amount']]
    return unmatched`, 'reconcile_code')}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold text-orange-405 bg-orange-500/10 border border-orange-500/20 rounded-lg cursor-pointer"
                >
                  {copiedCodeFlag === 'reconcile_code' ? "Đã sao chép!" : "Copy code"}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-[10.5px] font-mono text-slate-300 rounded-xl leading-relaxed select-text border border-slate-900 overflow-x-auto max-h-[160px]">
{`def clean_amount(val):
    cleaned = re.sub(r'[^\\d]', '', str(val))
    return int(cleaned) if cleaned else 0
df_bank['cleaned_amount'] = df_bank['So_Tien'].apply(clean_amount)`}
              </pre>
            </div>

            {/* Recharts Cashflow graph visualizer */}
            <div className="space-y-2 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Biểu đồ dòng tiền ngân hàng đối soát theo ngày (triệu VNĐ)</span>
              <div className="h-[220px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bankCashFlowData}>
                    <defs>
                      <linearGradient id="colorThu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorChi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#03060c', borderColor: '#1e293b' }} />
                    <Area type="monotone" dataKey="Thu" stroke="#10b981" fillOpacity={1} fill="url(#colorThu)" name="Tổng thu ròng" />
                    <Area type="monotone" dataKey="Chi" stroke="#ef4444" fillOpacity={1} fill="url(#colorChi)" name="Tổng chi ròng" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive Benford Detector */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Benford's Law Fraud Flag
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Nhập danh sách tổng số tiền hạch toán ròng của bạn bên dưới (mỗi số cách nhau bằng dấu phẩy) để kiểm tra kiểm định xem tần suất phân phối chữ số đầu tiên có khớp kỳ vọng định lý Benford hay không. Chữ số đầu bị lệch quá mức thường chỉ ra bút toán khống ngẫu nhiên.
            </p>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={rawAmounts}
                onChange={e => setRawAmounts(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-orange-500 font-semibold"
              ></textarea>
              
              <button
                onClick={handleAnalyzeBenford}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-550 text-white rounded-xl text-xs font-bold shadow cursor-pointer block text-center"
              >
                Phân tích Kiểm định Benford
              </button>
            </div>

            {/* Displaying actual vs expected representation */}
            {benfordFlags.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono block">📊 Phân phối Chữ số Đầu (Thực tế vs Kỳ vọng)</span>
                
                <div className="h-[185px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={benfordFlags} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="digit" stroke="#64748b" fontSize={10} name="Chữ số đầu" />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#03060c', borderColor: '#1e293b', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Bar dataKey="actual" fill="#ea580c" name="Thực tế %" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expected" fill="#475569" name="Kỳ vọng %" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono block pt-1">Chi tiết tỷ lệ kiểm soát (%)</span>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850">
                  {benfordFlags.map((val) => (
                    <div key={val.digit} className="space-y-1.5 text-xs font-semibold font-mono">
                      <div className="flex justify-between items-center text-[11px]">
                        <span>Chữ số [{val.digit}] :</span>
                        <span className="text-[10.5px]">
                          Thực tế: <strong className="text-orange-400">{val.actual}%</strong> vs Kỳ vọng: <strong className="text-slate-400">{val.expected}%</strong>
                        </span>
                      </div>
                      <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        {/* Actual progress indicator */}
                        <div className="absolute left-0 top-0 bottom-0 h-full bg-orange-500 rounded-full z-10" style={{ width: `${Math.min(val.actual * 3, 100)}%` }}></div>
                        {/* Expected dot identifier */}
                        <div className="absolute top-0 bottom-0 w-2.5 h-2.5 bg-slate-500 rounded-full border border-slate-950 z-20" style={{ left: `${Math.min(val.expected * 3, 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================== TAB 4: THREE CORE STATEMENTS =================================== */}
      {activeTab === 'statements' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Income statement, balance sheet, cashflow guides */}
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Ba báo cáo tài chính hạch toán cốt lõi
              </span>
              <h3 className="text-base font-black text-white">Sơ Đồ Bố Trí Template Doanh Nghiệp SME</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Tại Việt Nam, các mô hình khởi nghiệp và đơn vị nhỏ thường bắt đầu với 3 báo cáo tài trợ xương sống:
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {/* Income statement */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <span className="text-xs font-black text-slate-200 border-b border-slate-900 pb-1.5 block">1. Báo cáo KQKD (P&amp;L)</span>
                <ul className="space-y-1.5 text-[11px] text-slate-400 font-semibold font-mono pl-1">
                  <li>(+) Doanh thu bán hàng</li>
                  <li>(-) Giá vốn hàng bán (COGS)</li>
                  <li className="text-orange-400">(=) Lợi nhuận gộp ròng</li>
                  <li>(-) Chi phí QLDN &amp; BH</li>
                  <li className="text-emerald-400">(=) EBIT (Lợi nhuận gộp trước thuế)</li>
                  <li>(-) Thuế suất TNDN (20%)</li>
                  <li className="text-white font-bold">(=) Lợi nhuận sau thuế</li>
                </ul>
              </div>

              {/* Balance sheet */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <span className="text-xs font-black text-slate-200 border-b border-slate-900 pb-1.5 block">2. Bảng Cân Đối (Balance Sheet)</span>
                <ul className="space-y-1.5 text-[11px] text-slate-400 font-semibold font-mono pl-1">
                  <li>[TÀI SẢN (Assets)]</li>
                  <li>+ Tiền mặt &amp; Tiền gửi ngân hàng</li>
                  <li>+ Hàng tồn kho</li>
                  <li>+ Tài sản cố định (TSCĐ)</li>
                  <li className="text-orange-400">[NGUỒN VỐN (Equity + Liab)]</li>
                  <li>+ Nợ phải trả (Vay ngắn/dài hạn)</li>
                  <li>+ Vốn góp chủ sở hữu</li>
                  <li className="text-white font-bold">Ràng buộc: Tài sản = Nợ + Vốn</li>
                </ul>
              </div>

              {/* Cash flow */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <span className="text-xs font-black text-slate-200 border-b border-slate-900 pb-1.5 block">3. Lưu Chuyển Tiền Tệ (Cash Flow)</span>
                <ul className="space-y-1.5 text-[11px] text-slate-400 font-semibold font-mono pl-1">
                  <li>Phương pháp Gián tiếp (Indirect):</li>
                  <li>(+) Lợi nhuận sau thuế ròng</li>
                  <li>(+) Khấu hao tài sản cố định</li>
                  <li>(+/-) Thay đổi vốn lưu động</li>
                  <li className="text-orange-400">== Dòng tiền kinh doanh (CFO)</li>
                  <li>== Dòng tiền đầu tư (CFI)</li>
                  <li>== Dòng tiền tài chính (CFF)</li>
                  <li className="text-white font-bold">== Tiền thuần tăng/giảm</li>
                </ul>
              </div>
            </div>

            {/* Working capital diagram */}
            <div className="p-4.5 bg-orange-955/10 border border-orange-900/20 rounded-xl space-y-2">
              <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-orange-405" />
                Working Capital Cycle (Chu kỳ vốn lưu động kinh doanh)
              </h4>
              <p className="text-xs text-slate-400 leading-normal font-semibold">
                Tiền mặt gửi Ngân hàng &rarr; Nhập Hàng tồn kho &rarr; Khách chưa thanh toán (Phải thu khách hàng) &rarr; Thu hồi dòng tiền mượt mà &rarr; Tiền mặt. Rút ngắn thời gian thu hồi công nợ giúp solo founder tránh bị kiệt nguồn tài chính cục bộ.
              </p>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <Calculator className="w-5 h-5 text-orange-400" />
              SME Financial Health Calculator
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Nhập các chỉ số vốn cơ bản của shop dưới đây (đơn vị: triệu VNĐ) để AI tự động trân quý cập nhật và xếp hạng tỷ suất tài chính rủi ro tương ứng.
            </p>

            <div className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Doanh thu bán hàng:</label>
                <input
                  type="number"
                  value={revenue}
                  onChange={e => setRevenue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Giá vốn hàng bán (COGS):</label>
                <input
                  type="number"
                  value={cogs}
                  onChange={e => setCogs(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Tổng tài sản (Assets):</label>
                <input
                  type="number"
                  value={assets}
                  onChange={e => setAssets(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Nợ phải trả (Liabilities):</label>
                <input
                  type="number"
                  value={liabilities}
                  onChange={e => setLiabilities(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                />
              </div>
            </div>

            {/* Calculations Output panel */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                <span>Tỷ số thanh toán hiện thời (Current):</span>
                <span className="text-orange-400 font-extrabold">{currentRatio}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(parseFloat(currentRatio) * 35, 100)}%` }}></div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                <span>Tỷ suất lợi nhuận gộp:</span>
                <span className="text-orange-400 font-extrabold">{grossMargin}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(parseFloat(grossMargin), 100)}%` }}></div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                <span>Hiệu suất tài chính ROE ròng:</span>
                <span className="text-orange-400 font-extrabold">{roe}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(parseFloat(roe) * 3, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
