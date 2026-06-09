// Version 2.0 - AccountingVietnam (Kế toán Thực chiến Việt Nam)
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
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
  FileText,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Line, Legend } from 'recharts';

interface VNJournalEntry {
  id: string;
  date: string;
  descr: string;
  debitAcc: string;
  creditAcc: string;
  amount: number;
}

const XML_INVOICE_TEMPLATES = {
  valid_8pct: `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon Id="INV-2026-F99">
    <TTChung>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>C26TAA</KHHDon>
      <SHDon>0002840</SHDon>
      <NLap>2026-06-08</NLap>
      <DVTTe>VND</DVTTe>
    </TTChung>
    <NBan>
      <Ten>CÔNG TY TNHH PHẦN MỀM LEDGERFLOW VIỆT NAM</Ten>
      <MST>0110345678</MST>
      <DChi>72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh</DChi>
    </NBan>
    <NMua>
      <Ten>HỘ KINH DOANH CỬA HÀNG MINH PHÁT</Ten>
      <MST>8123456789</MST>
      <DChi>145 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh</DChi>
    </NMua>
    <DSHDBH>
      <HDonChiTiet>
        <STT>1</STT>
        <TenHVDV>Gói Micro-SaaS dọn dẹp đối soát sao kê ngân hàng tự động</TenHVDV>
        <DVT>Gói</DVT>
        <SLuong>1</SLuong>
        <DGia>3500000</DGia>
        <ThTien>3500000</ThTien>
        <TSuat>8%</TSuat>
      </HDonChiTiet>
    </DSHDBH>
    <TToan>
      <TgTCThue>3500000</TgTCThue>
      <TgTThue>280000</TgTThue>
      <TgTTTBSo>3780000</TgTTTBSo>
      <TgTTTBChu>Ba triệu bảy trăm tám mươi nghìn đồng chẵn</TgTTTBChu>
    </TToan>
  </DLHDon>
  <DSCKS>
    <Signature>
      <SigningTime>2026-06-08T12:30:15Z</SigningTime>
      <CertificateSerial>CA-9937402847-SHA256-VIETTEL</CertificateSerial>
      <Subject>MST: 0110345678 - CONG TY TNHH PHAN MEM LEDGERFLOW VIET NAM</Subject>
    </Signature>
  </DSCKS>
</HDon>`,

  invalid_mst: `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon Id="INV-2026-D32">
    <TTChung>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>C26TBB</KHHDon>
      <SHDon>0008510</SHDon>
      <NLap>2026-06-05</NLap>
      <DVTTe>VND</DVTTe>
    </TTChung>
    <NBan>
      <Ten>HỢP TÁC XÃ DỊCH VỤ CÔNG NGHỆ CHƯA ĐĂNG KÝ THUẾ</Ten>
      <MST>011-INVALID-MST-999</MST>
      <DChi>Toà nhà Central, Phường Thảo Điền, Thành phố Thủ Đức</DChi>
    </NBan>
    <NMua>
      <Ten>CÔNG TY TNHH PHẦN MỀM LEDGERFLOW VIỆT NAM</Ten>
      <MST>0110345678</MST>
      <DChi>72 Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh</DChi>
    </NMua>
    <DSHDBH>
      <HDonChiTiet>
        <STT>1</STT>
        <TenHVDV>Dịch vụ tư vấn giải pháp White-Label Ledger Hub</TenHVDV>
        <DVT>Tháng</DVT>
        <SLuong>1</SLuong>
        <DGia>45000000</DGia>
        <ThTien>45000000</ThTien>
        <TSuat>10%</TSuat>
      </HDonChiTiet>
    </DSHDBH>
    <TToan>
      <TgTCThue>45000000</TgTCThue>
      <TgTThue>4500000</TgTThue>
      <TgTTTBSo>49500000</TgTTTBSo>
      <TgTTTBChu>Bốn mươi chín triệu năm trăm nghìn đồng chẵn</TgTTTBChu>
    </TToan>
  </DLHDon>
  <DSCKS>
    <Signature>
      <SigningTime>2026-06-05T09:15:00Z</SigningTime>
      <CertificateSerial>CA-831034-BKAV-CA</CertificateSerial>
      <Subject>MST: 011-INVALID-MST-999 - HTX DICH VU CONG NGHE CHUE</Subject>
    </Signature>
  </DSCKS>
</HDon>`,

  math_error: `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon Id="INV-2026-X11">
    <TTChung>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>C26TCC</KHHDon>
      <SHDon>0000912</SHDon>
      <NLap>2026-06-07</NLap>
      <DVTTe>VND</DVTTe>
    </TTChung>
    <NBan>
      <Ten>CƠ MINH ĐIỆN VŨ HÙNG (CỦA HÀNG LẺ)</Ten>
      <MST>0110452331</MST>
      <DChi>12 Kim Mã, Kim Mã, Quận Ba Đình, Hà Nội</DChi>
    </NBan>
    <NMua>
      <Ten>CÔNG TY TNHH PHẦN MỀM LEDGERFLOW VIỆT NAM</Ten>
      <MST>0110345678</MST>
      <DChi>72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh</DChi>
    </NMua>
    <DSHDBH>
      <HDonChiTiet>
        <STT>1</STT>
        <TenHVDV>Cáp mạng CAT6 và thiết bị Switch 24-Port D-Link</TenHVDV>
        <DVT>Cái</DVT>
        <SLuong>2</SLuong>
        <DGia>1850000</DGia>
        <ThTien>3700000</ThTien>
        <TSuat>10%</TSuat>
      </HDonChiTiet>
    </DSHDBH>
    <TToan>
      <TgTCThue>3700000</TgTCThue>
      <TgTThue>370000</TgTThue>
      <TgTTTBSo>4500000</TgTTTBSo>
      <TgTTTBChu>Bốn triệu năm trăm nghìn đồng chẵn</TgTTTBChu>
    </TToan>
  </DLHDon>
  <DSCKS>
    <Signature>
      <SigningTime>2026-06-07T11:45:00Z</SigningTime>
      <CertificateSerial>CA-11234-FPT-CA</CertificateSerial>
      <Subject>MST: 0110452331 - CO MINH DIEN VU HUNG</Subject>
    </Signature>
  </DSCKS>
</HDon>`,

  missing_sig: `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon Id="INV-2026-S13">
    <TTChung>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>C26TDD</KHHDon>
      <SHDon>0002120</SHDon>
      <NLap>2026-06-06</NLap>
      <DVTTe>VND</DVTTe>
    </TTChung>
    <NBan>
      <Ten>CÔNG TY GIẢI PHÁP THANH TOÁN QR VIỆT NAM</Ten>
      <MST>0314455888</MST>
      <DChi>Lầu 12 Landmark 81, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh</DChi>
    </NBan>
    <NMua>
      <Ten>CÔNG TY TNHH PHẦN MỀM LEDGERFLOW VIỆT NAM</Ten>
      <MST>0110345678</MST>
      <DChi>72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh</DChi>
    </NMua>
    <DSHDBH>
      <HDonChiTiet>
        <STT>1</STT>
        <TenHVDV>Phí dịch vụ đối soát tự động tích hợp API VietQR Q2</TenHVDV>
        <DVT>Giao_dịch</DVT>
        <SLuong>1</SLuong>
        <DGia>1200000</DGia>
        <ThTien>1200000</ThTien>
        <TSuat>10%</TSuat>
      </HDonChiTiet>
    </DSHDBH>
    <TToan>
      <TgTCThue>1200000</TgTCThue>
      <TgTThue>120000</TgTThue>
      <TgTTTBSo>1320000</TgTTTBSo>
      <TgTTTBChu>Một triệu ba trăm hai mươi nghìn đồng chẵn</TgTTTBChu>
    </TToan>
  </DLHDon>
  <DSCKS>
    <!-- THIẾU CHỮ KÝ SỐ HOÀN TOÀN -->
  </DSCKS>
</HDon>`
};

export default function AccountingVietnam() {
  const { activeIdea } = useStore();
  const [activeTab, setActiveTab] = useState<'invoice' | 'chart_accounts' | 'bank_reconcile' | 'double_entry' | 'statements' | 'tt99_transition' | 'e_invoice_t78'>('invoice');
  const [copiedCodeFlag, setCopiedCodeFlag] = useState<string | null>(null);

  // --- DOUBLE ENTRY STATE ENGINE & LOCAL STORAGE SYNC ---
  const [journalEntries, setJournalEntries] = useState<VNJournalEntry[]>(() => {
    const saved = localStorage.getItem('lf_vn_journal_entries');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      { id: 'j1', date: '2026-06-01', descr: 'Chủ sở hữu góp vốn thành lập Công ty bằng tiền gửi ngân hàng', debitAcc: '112', creditAcc: '411', amount: 500000000 },
      { id: 'j2', date: '2026-06-03', descr: 'Rút tiền gửi ngân hàng về nhập quỹ tiền mặt tại két sắt', debitAcc: '111', creditAcc: '112', amount: 50000000 },
      { id: 'j3', date: '2026-06-05', descr: 'Mua lô hàng hóa linh kiện nhập kho chưa thanh toán nhà phân phối', debitAcc: '156', creditAcc: '331', amount: 120000000 },
      { id: 'j4', date: '2026-06-06', descr: 'Bán phần mềm Bản Quyền thu tiền gửi ngân hàng Vietcombank', debitAcc: '112', creditAcc: '511', amount: 150000000 },
      { id: 'j5', date: '2026-06-06', descr: 'Xuất kho hạch toán giá vốn hàng tương ứng cho lô hàng công nghệ bán đi', debitAcc: '632', creditAcc: '156', amount: 80000000 }
    ];
  });

  const [entryDescr, setEntryDescr] = useState('');
  const [entryDebit, setEntryDebit] = useState('111');
  const [entryCredit, setEntryCredit] = useState('112');
  const [entryAmount, setEntryAmount] = useState<number>(10000000);
  const [entryAiPrompt, setEntryAiPrompt] = useState('');
  const [aiParsing, setAiParsing] = useState(false);

  // Live synchronizer with activeIdea of useStore
  useEffect(() => {
    if (activeIdea) {
      setJournalEntries(prev => {
        const hasCustomJ4 = prev.some(e => e.id === 'j4' && e.descr.includes(activeIdea.title.split(' - ')[0]));
        if (hasCustomJ4) return prev; // Avoid infinite loops

        return prev.map(entry => {
          if (entry.id === 'j4') {
            const shortName = activeIdea.title.split(' - ')[0];
            return {
              ...entry,
              descr: `Doanh thu bán sản phẩm: ${shortName} (qua cổng VietQR tự động)`,
              amount: activeIdea.pricePoint * 320 // assume 320 purchases
            };
          }
          return entry;
        });
      });

      // Prefill formulation area for rapid testing
      const shortName = activeIdea.title.split(' - ')[0];
      setEntryDescr(`Khách hàng thanh toán phí sử dụng dịch vụ: ${shortName}`);
      setEntryAmount(activeIdea.pricePoint);
      setEntryDebit('112'); // Bank (Tiền gửi ngân hàng)
      setEntryCredit('511'); // Revenue (Doanh thu bán hàng & CCDV)
    }
  }, [activeIdea]);

  // --- STATE FOR TT99 TRANSITION SIMULATOR ---
  const [tt99SearchQuery, setTt99SearchQuery] = useState('');
  const [tt99ActiveCategory, setTt99ActiveCategory] = useState<'all' | 'asset' | 'liability' | 'equity' | 'expense' | 'revenue'>('all');
  const [openingAccCode, setOpeningAccCode] = useState('138_bcc');
  const [openingAmt, setOpeningAmt] = useState<number>(250000000);
  const [openingStatusMsg, setOpeningStatusMsg] = useState<string>('');
  const [complianceName, setComplianceName] = useState('Chi phí tư vấn & thành lập văn phòng LedgerFlow');
  const [complianceType, setComplianceType] = useState('setup_cost');
  const [complianceValue, setComplianceValue] = useState<number>(150000000);
  const [complianceAmortMonths, setComplianceAmortMonths] = useState<number>(24);

  // Expanded TT99 Interactive states (Slide 20, 48, 54)
  const [warrantyRevenue, setWarrantyRevenue] = useState<number>(4500000000);
  const [warrantyRate, setWarrantyRate] = useState<number>(2.5);
  const [warrantyStatusMsg, setWarrantyStatusMsg] = useState<string>('');
  const [revalCurrencyAmt, setRevalCurrencyAmt] = useState<number>(15000);
  const [revalBookRate, setRevalBookRate] = useState<number>(25000);
  const [revalClosingRate, setRevalClosingRate] = useState<number>(25350);
  const [revalAccountType, setRevalAccountType] = useState<string>('1122');
  const [revalStatusMsg, setRevalStatusMsg] = useState<string>('');
  const [completedStages, setCompletedStages] = useState<number[]>([0, 2]);
  const [activeRoadmapDetail, setActiveRoadmapDetail] = useState<number | null>(0);

  // Bond & Principal/Agent additional states (Slide 31, 32, 46)
  const [bondParVal, setBondParVal] = useState<number>(100000000);
  const [bondCost, setBondCost] = useState<number>(90000000);
  const [bondTerm, setBondTerm] = useState<number>(12);
  const [bondAmortMonths, setBondAmortMonths] = useState<number>(6);
  const [bondCoupon, setBondCoupon] = useState<number>(5);
  const [bondStatusMsg, setBondStatusMsg] = useState<string>('');

  const [agentControlGoods, setAgentControlGoods] = useState<boolean>(true);
  const [agentPriceDiscretion, setAgentPriceDiscretion] = useState<boolean>(false);
  const [agentInventoryRisk, setAgentInventoryRisk] = useState<boolean>(false);
  const [agentStatusMsg, setAgentStatusMsg] = useState<string>('');

  // Global Minimum Tax states (Pillar Two - Slide 15 / TK 82112)
  const [gmtProfit, setGmtProfit] = useState<number>(50000000000);
  const [gmtCoveredTax, setGmtCoveredTax] = useState<number>(4000000000);
  const [gmtStatusMsg, setGmtStatusMsg] = useState<string>('');

  // --- COMPLIANCE INVOICE VALIDATOR STATES ---
  const [xmlText, setXmlText] = useState<string>(XML_INVOICE_TEMPLATES.valid_8pct);
  const [xmlValidatorStatusMsg, setXmlValidatorStatusMsg] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('lf_vn_journal_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  const handleAddOpeningToLedger = () => {
    let descr = "";
    let debitAcc = "";
    let creditAcc = "";
    
    if (openingAccCode === '138_bcc') {
      descr = `[Dọn Sổ Đầu Kỳ TT99] Chuyển dọn số dư TK 138-BCC sang TK 2281`;
      debitAcc = "2281";
      creditAcc = "138";
    } else if (openingAccCode === '2413_deferred') {
      descr = `[Dọn Sổ Đầu Kỳ TT99] Chuyển số dư sửa chữa lớn TK 2413 sang TK 2414`;
      debitAcc = "2414";
      creditAcc = "2413";
    } else if (openingAccCode === '3388_dividend') {
      descr = `[Dọn Sổ Đầu Kỳ TT99] Phân tách nghĩa vụ cổ tức TK 3388 sang TK 332`;
      debitAcc = "3388";
      creditAcc = "332";
    } else if (openingAccCode === '441_cap') {
      descr = `[Dọn Sổ Đầu Kỳ TT99] Hòa nguồn vốn XDCB bãi bỏ TK 441 sang TK 4118`;
      debitAcc = "441";
      creditAcc = "4118";
    } else if (openingAccCode === '466_fund') {
      descr = `[Dọn Sổ Đầu Kỳ TT99] Kết chuyển kinh phí đã hình thành TSCĐ bãi bỏ TK 466 sang TK 4118`;
      debitAcc = "466";
      creditAcc = "4118";
    } else if (openingAccCode === '412_fx_diff') {
      descr = `[Dọn Sổ Đầu Kỳ TT99] Chuyển dọn dứt điểm tỷ giá TK 412 sang lợi nhuận giữ lại TK 4211`;
      debitAcc = "412";
      creditAcc = "4211";
    }

    const newEntry: VNJournalEntry = {
      id: 'tt99_' + Date.now(),
      date: '2026-01-01',
      descr,
      debitAcc,
      creditAcc,
      amount: openingAmt
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    setOpeningStatusMsg(`Đã tạo bút toán chuyển tiếp đầu kỳ vào Sổ Nhật Ký Tác Chiến thành công!`);
    setTimeout(() => setOpeningStatusMsg(''), 5000);
  };

  const handleAddWarrantyToLedger = () => {
    const provAmount = Math.round(warrantyRevenue * (warrantyRate / 100));
    const newEntry: VNJournalEntry = {
      id: 'tt99_warranty_' + Date.now(),
      date: '2026-06-30',
      descr: `[TT99 Dự Phòng] Trích lập dự phòng bảo hành công trình xây lắp dựa trên doanh thu thực tế`,
      debitAcc: '641', // TT99 uses 641 directly (Chi phí bán hàng) instead of 627 in TT200
      creditAcc: '352', // Dự phòng phải trả (Dự phòng bảo hành công trình)
      amount: provAmount
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    setWarrantyStatusMsg(`Đã tạo bút toán trích lập dự phòng (Nợ 641/Có 352) số tiền ${provAmount.toLocaleString()}đ thành công! (Slide 48)`);
    setTimeout(() => setWarrantyStatusMsg(''), 5000);
  };

  const handleAddRevalToLedger = () => {
    if (revalAccountType === '131_provided_for') {
      setRevalStatusMsg(`⚠️ Lỗi tuân thủ TT99: Khoản phải thu đã lập dự phòng thì TUYỆT ĐỐI KHÔNG ĐƯỢC CHO PHÉP ĐÁNH GIÁ LẠI. (Slide 20)`);
      setTimeout(() => setRevalStatusMsg(''), 7000);
      return;
    }

    const diff = Math.round(revalCurrencyAmt * (revalClosingRate - revalBookRate));
    if (diff === 0) {
      setRevalStatusMsg(`Tỷ giá khớp nhau không sinh lệch dòng tiền đánh giá.`);
      setTimeout(() => setRevalStatusMsg(''), 4000);
      return;
    }

    let debitAcc = "";
    let creditAcc = "";
    let absDiff = Math.abs(diff);
    let descr = "";

    if (revalAccountType === '1122') {
      if (diff > 0) {
        descr = `[TT99 Tỷ Giá] Lãi đánh giá lại số dư tiền gửi ngân hàng ngoại tệ (Trực tiếp Có 515)`;
        debitAcc = "112";
        creditAcc = "515"; // TT99 directly maps to 515, completely bypassing TK 413 (unless special corporate group rules apply)
      } else {
        descr = `[TT99 Tỷ Giá] Lỗ đánh giá lại số dư tiền gửi ngân hàng ngoại tệ (Trực tiếp Nợ 635)`;
        debitAcc = "635";
        creditAcc = "112";
      }
    } else if (revalAccountType === '131_normal') {
      if (diff > 0) {
        descr = `[TT99 Tỷ Giá] Lãi đánh giá lại khoản phải thu khách hàng ngoại tệ (Trực tiếp Có 515)`;
        debitAcc = "131";
        creditAcc = "515";
      } else {
        descr = `[TT99 Tỷ Giá] Lỗ đánh giá lại khoản phải thu khách hàng ngoại tệ (Trực tiếp Nợ 635)`;
        debitAcc = "635";
        creditAcc = "131";
      }
    } else if (revalAccountType === '331_normal') {
      // For payables, rate increase means loss
      if (diff > 0) {
        descr = `[TT99 Tỷ Giá] Lỗ đánh giá lại khoản phải trả người bán ngoại tệ do tỷ giá tăng (Trực tiếp Nợ 635)`;
        debitAcc = "635";
        creditAcc = "331";
      } else {
        descr = `[TT99 Tỷ Giá] Lãi đánh giá lại khoản phải trả người bán ngoại tệ do tỷ giá giảm (Trực tiếp Có 515)`;
        debitAcc = "331";
        creditAcc = "515";
      }
    }

    const newEntry: VNJournalEntry = {
      id: 'tt99_reval_' + Date.now(),
      date: '2026-06-30',
      descr,
      debitAcc,
      creditAcc,
      amount: absDiff
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    setRevalStatusMsg(`Đã hạch toán trực tiếp khoản ${absDiff.toLocaleString()}đ vào TK ${diff > 0 ? 'Lãi 515' : 'Lỗ 635'} thành công! (Bỏ hẳn trung gian TK 413 - Slide 15)`);
    setTimeout(() => setRevalStatusMsg(''), 6000);
  };

  const handleAddBondToLedger = () => {
    const interestAmt = Math.round(bondParVal * (bondCoupon / 100) * (bondAmortMonths / bondTerm));
    const isDiscount = bondCost < bondParVal;
    const isPremium = bondCost > bondParVal;
    
    const diffVal = Math.abs(bondParVal - bondCost);
    const amortAmt = Math.round(diffVal * (bondAmortMonths / bondTerm));

    const newEntries: VNJournalEntry[] = [];

    // 1. Accrued coupon interest entry
    if (interestAmt > 0) {
      newEntries.push({
        id: 'tt99_bond_interest_' + Date.now() + '_1',
        date: '2026-06-30',
        descr: `[TT99 Trái Phiếu] Trích ghi nhận lãi dồn tích danh nghĩa (Mệnh giá ${bondParVal.toLocaleString()}đ * Lãi suất ${bondCoupon}%)`,
        debitAcc: '138',
        creditAcc: '515',
        amount: interestAmt
      });
    }

    // 2. Amortization portion entry
    if (amortAmt > 0) {
      if (isDiscount) {
        newEntries.push({
          id: 'tt99_bond_amort_' + Date.now() + '_2',
          date: '2026-06-30',
          descr: `[TT99 Trái Phiếu] Phân bổ chiết khấu làm tăng giá trị ghi sổ nợ TK 128 (Slide 32)`,
          debitAcc: '128',
          creditAcc: '515',
          amount: amortAmt
        });
      } else if (isPremium) {
        newEntries.push({
          id: 'tt99_bond_amort_' + Date.now() + '_2',
          date: '2026-06-30',
          descr: `[TT99 Trái Phiếu] Phân bổ phụ trội làm giảm trừ doanh thu tài chính nợ TK 515 (Slide 31)`,
          debitAcc: '515',
          creditAcc: '128',
          amount: amortAmt
        });
      }
    }

    if (newEntries.length === 0) {
      setBondStatusMsg(`Không có khoản phân bổ hoặc lãi phát sinh.`);
      setTimeout(() => setBondStatusMsg(''), 4000);
      return;
    }

    setJournalEntries(prev => [...newEntries, ...prev]);
    const amortLabel = isDiscount ? `Lãi do phân bổ Chiết khấu: ${amortAmt.toLocaleString()}đ (Nợ 128/Có 515)` : isPremium ? `Giảm trừ doanh thu do kỳ phân bổ Phụ trội: ${amortAmt.toLocaleString()}đ (Nợ 515/Có 128)` : 'Bản mệnh giá bằng giá gốc';
    setBondStatusMsg(`Đã tạo ${newEntries.length} bút toán hạch toán đầu tư trái phiếu thành công! (Lãi dồn tích: ${interestAmt.toLocaleString()}đ, ${amortLabel})`);
    setTimeout(() => setBondStatusMsg(''), 8000);
  };

  const handleAddGmtToLedger = () => {
    const etr = gmtProfit > 0 ? (gmtCoveredTax / gmtProfit) : 0;
    if (etr >= 0.15) {
      setGmtStatusMsg(`Thuế suất thực tế (ETR) đã đạt ${(etr * 100).toFixed(2)}% (≥ 15%). Không phát sinh nghĩa vụ Thuế bổ sung tối thiểu toàn cầu.`);
      setTimeout(() => setGmtStatusMsg(''), 6000);
      return;
    }

    const topUpTaxRate = 0.15 - etr;
    const topUpTaxAmt = Math.round(gmtProfit * topUpTaxRate);

    if (topUpTaxAmt <= 0) {
      setGmtStatusMsg(`Không có khoản Thuế bổ sung nào được hạch toán.`);
      setTimeout(() => setGmtStatusMsg(''), 4000);
      return;
    }

    const newEntry: VNJournalEntry = {
      id: 'tt99_gmt_' + Date.now(),
      date: '2026-06-30',
      descr: `[TT99-82112] Trích lập Thuế TNDN bổ sung tối thiểu toàn cầu (Lợi nhuận ròng ${gmtProfit.toLocaleString()}đ, ETR ${(etr * 100).toFixed(2)}%, Thuế suất bổ sụng ${(topUpTaxRate * 100).toFixed(2)}%)`,
      debitAcc: '82112',
      creditAcc: '3334',
      amount: topUpTaxAmt
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    setGmtStatusMsg(`Đã tạo bút toán trích lập Thuế thu nhập bổ sung thành công! Thuế suất bổ sung: ${(topUpTaxRate * 100).toFixed(2)}%, Phụ đóng: ${topUpTaxAmt.toLocaleString()}đ (Nợ 82112 / Có 3334)`);
    setTimeout(() => setGmtStatusMsg(''), 8000);
  };

  // Local helper to parse Vietnamese accounting requests
  const suggestVASAccountsLocally = (text: string) => {
    const norm = text.toLowerCase().trim();
    let debit = '111';
    let credit = '112';
    let amount = 10000000;

    const matchedAmt = norm.match(/(\d+[\d\s.,]*)(đ|vnd|triệu|tr|m|k|usd)?/);
    if (matchedAmt) {
      let numStr = matchedAmt[1].replace(/[\s.,]/g, '');
      let num = parseFloat(numStr) || 0;
      if (norm.includes('triệu') || norm.includes('tr')) {
        num = num * 1000000;
      } else if (norm.includes('nghìn') || norm.includes('k') || norm.includes('ngàn')) {
        num = num * 1000;
      }
      if (num > 0 && num < 1000000 && !norm.includes('triệu') && !norm.includes('tr') && !norm.includes('k')) {
        num = num * 1000000; // auto upscale small raw float count
      }
      if (num > 1000) amount = num;
    }

    if (norm.includes('rút tiền') || (norm.includes('tiền mặt') && norm.includes('gửi'))) {
      debit = '111';
      credit = '112';
    } else if (norm.includes('nộp tiền') || norm.includes('nộp vào') || norm.includes('gửi vào')) {
      debit = '112';
      credit = '111';
    } else if (norm.includes('góp vốn') || norm.includes('chủ sở hữu')) {
      debit = norm.includes('mặt') ? '111' : '112';
      credit = '411';
    } else if (norm.includes('bán') || norm.includes('thu tiền') || norm.includes('doanh thu') || norm.includes('phần mềm')) {
      debit = norm.includes('mặt') ? '111' : '112';
      credit = '511';
    } else if (norm.includes('giá vốn') || norm.includes('kho hàng') || norm.includes('xuất kho')) {
      debit = '632';
      credit = '156';
    } else if (norm.includes('mua') || norm.includes('nhập kho') || norm.includes('vật liệu')) {
      debit = '156';
      credit = norm.includes('chưa trả') || norm.includes('nợ') ? '331' : (norm.includes('mặt') ? '111' : '112');
    } else if (norm.includes('trả tiền nợ') || norm.includes('trả người bán')) {
      debit = '331';
      credit = norm.includes('mặt') ? '111' : '112';
    }

    return { debit, credit, amount };
  };

  const handleAiSuggestDoubleEntry = async () => {
    if (!entryAiPrompt) {
      alert('Vui lòng nhập nghiệp vụ bằng chữ trước (Ví dụ: Rút ngân hàng nhập quỹ 30tr)!');
      return;
    }
    setAiParsing(true);
    let suggestion = suggestVASAccountsLocally(entryAiPrompt);

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Bạn là Trợ lý phân tích định khoản kép cao cấp theo Thông tư 200/133 Việt Nam.
Hãy phân tích nghiệp vụ kế toán thực tế: "${entryAiPrompt}"
Hãy trích xuất:
1. Mô tả ngắn gọn nghiệp vụ (descr)
2. Mã tài khoản Nợ (debitAcc, ví dụ: 111, 112, 131, 156, 331, 411, 511, 632)
3. Mã tài khoản Có (creditAcc, ví dụ: 111, 112, 131, 156, 331, 411, 511, 632)
4. Số tiền trị giá (amount, đơn vị VND)

Đầu ra bắt buộc là một JSON duy nhất định dạng:
{"descr": "Mô tả", "debitAcc": "mã", "creditAcc": "mã", "amount": số_tiền}
Tuyệt đối không chèn lý thuyết trước hoặc sau!`
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const text = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(text);
        if (parsed && parsed.debitAcc && parsed.creditAcc) {
          setEntryDescr(parsed.descr || entryAiPrompt);
          setEntryDebit(parsed.debitAcc);
          setEntryCredit(parsed.creditAcc);
          setEntryAmount(Number(parsed.amount) || suggestion.amount);
        }
      } else {
        setEntryDescr(entryAiPrompt.toUpperCase());
        setEntryDebit(suggestion.debit);
        setEntryCredit(suggestion.credit);
        setEntryAmount(suggestion.amount);
      }
    } catch (_) {
      setEntryDescr(entryAiPrompt.toUpperCase());
      setEntryDebit(suggestion.debit);
      setEntryCredit(suggestion.credit);
      setEntryAmount(suggestion.amount);
    } finally {
      setAiParsing(false);
    }
  };

  const handleAddJournalEntry = () => {
    if (!entryDescr) {
      alert('Vui lòng điền diễn giải nghiệp vụ!');
      return;
    }
    if (entryDebit === entryCredit) {
      alert('Nguyên tắc kế toán kép: Tài khoản Nợ và tài khoản Có phải khác nhau!');
      return;
    }
    const createdEntry: VNJournalEntry = {
      id: 'j_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      descr: entryDescr,
      debitAcc: entryDebit,
      creditAcc: entryCredit,
      amount: Number(entryAmount) || 0
    };
    setJournalEntries(prev => [createdEntry, ...prev]);
    setEntryDescr('');
    setEntryAiPrompt('');
  };

  const handleDeleteEntry = (id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  };

  // --- Dynamic computing trial balance accounts ---
  const computeTrialBalance = () => {
    const defaultAccs = [
      { code: '111', name: 'Tiền mặt', type: 'asset' },
      { code: '112', name: 'Tiền gửi ngân hàng', type: 'asset' },
      { code: '156', name: 'Hàng hóa', type: 'asset' },
      { code: '331', name: 'Phải trả cho người bán', type: 'liability' },
      { code: '411', name: 'Vốn đầu tư của CSH', type: 'equity' },
      { code: '511', name: 'Doanh thu bán hàng', type: 'revenue' },
      { code: '632', name: 'Giá vốn hàng bán', type: 'expense' }
    ];

    return defaultAccs.map(acc => {
      const netDebit = journalEntries.filter(e => e.debitAcc === acc.code).reduce((sum, curr) => sum + curr.amount, 0);
      const netCredit = journalEntries.filter(e => e.creditAcc === acc.code).reduce((sum, curr) => sum + curr.amount, 0);
      
      let endingDebit = 0;
      let endingCredit = 0;

      if (acc.type === 'asset' || acc.type === 'expense') {
        const bal = netDebit - netCredit;
        if (bal > 0) endingDebit = bal;
        else endingCredit = Math.abs(bal);
      } else {
        const bal = netCredit - netDebit;
        if (bal > 0) endingCredit = bal;
        else endingDebit = Math.abs(bal);
      }

      return {
        ...acc,
        debitVol: netDebit,
        creditVol: netCredit,
        endDeb: endingDebit,
        endCre: endingCredit
      };
    });
  };

  const trialBalanceList = computeTrialBalance();
  const totalDebitVol = trialBalanceList.reduce((acc, curr) => acc + curr.debitVol, 0);
  const totalCreditVol = trialBalanceList.reduce((acc, curr) => acc + curr.creditVol, 0);
  const totalEndDeb = trialBalanceList.reduce((acc, curr) => acc + curr.endDeb, 0);
  const totalEndCre = trialBalanceList.reduce((acc, curr) => acc + curr.endCre, 0);

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

  // --- TAB 4: FINANCIAL RATIOS CALCULATOR & TAX SIMULATOR ---
  const [revenue, setRevenue] = useState<number>(1200);   // triệu VNĐ
  const [cogs, setCogs] = useState<number>(750);
  const [opex, setOpex] = useState<number>(220);
  const [assets, setAssets] = useState<number>(1800);
  const [liabilities, setLiabilities] = useState<number>(850);
  const [inventory, setInventory] = useState<number>(200);
  const [taxVatIn, setTaxVatIn] = useState<number>(15); // triệu VNĐ
  const [taxType, setTaxType] = useState<'technology' | 'service' | 'trade' | 'production'>('technology');
  const [taxNonDeductible, setTaxNonDeductible] = useState<number>(10); // triệu VNĐ
  const [taxActiveSubTab, setTaxActiveSubTab] = useState<'health' | 'tax_sim'>('health');

  const ebit = revenue - cogs - opex;
  const taxProfitBeforeAdjustment = Math.max(0, ebit);
  const taxableIncome = Math.max(0, taxProfitBeforeAdjustment + taxNonDeductible);
  const citPayable = taxableIncome * 0.20;
  const netIncome = Math.max(-500, ebit - citPayable);
  const equity = Math.max(1, assets - liabilities);

  // Ratios
  const currentRatio = liabilities > 0 ? (assets / liabilities).toFixed(2) : "0";
  const quickRatio = liabilities > 0 ? ((assets - inventory) / liabilities).toFixed(2) : "0";
  const roe = equity > 0 ? ((netIncome / equity) * 100).toFixed(1) : "0";
  const grossMargin = revenue > 0 ? (((revenue - cogs) / revenue) * 100).toFixed(1) : "0";

  // VAT calculations
  const vatOutput = revenue * 0.1;
  const vatPayableDeductible = Math.max(0, vatOutput - taxVatIn);
  const directRate = taxType === 'technology' ? 0.05 : taxType === 'service' ? 0.05 : taxType === 'trade' ? 0.01 : 0.03;
  const vatPayableDirect = revenue * directRate;

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
              activeTab === 'invoice' ? 'bg-orange-655 bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hóa Đơn &amp; Thuế
          </button>
          <button
            onClick={() => setActiveTab('chart_accounts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chart_accounts' ? 'bg-orange-655 bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hệ Thống TK (TT200)
          </button>
          <button
            onClick={() => setActiveTab('bank_reconcile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bank_reconcile' ? 'bg-orange-655 bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đối Soát &amp; Benford
          </button>
          <button
            onClick={() => setActiveTab('double_entry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'double_entry' ? 'bg-orange-655 bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mô phỏng Định khoản kép
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'statements' ? 'bg-orange-655 bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Báo Cáo Tài Chính
          </button>
          <button
            onClick={() => setActiveTab('tt99_transition')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tt99_transition' ? 'bg-orange-655 bg-orange-600/90 text-white shadow' : 'text-orange-400/90 hover:text-orange-350 bg-orange-500/5'
            }`}
          >
            🚀 Chuyển Đổi TT99 (Mới)
          </button>
          <button
            onClick={() => setActiveTab('e_invoice_t78')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'e_invoice_t78' ? 'bg-orange-655 bg-orange-600 text-white shadow' : 'text-orange-400/90 hover:text-white bg-orange-500/5'
            }`}
          >
            🔍 Thẩm Định HĐĐT (TT78)
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

      {/* =================================== TAB: DOUBLE ENTRY BOOKKEEPING SIMULATOR =================================== */}
      {activeTab === 'double_entry' && (
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Main Journal Entry Input and List */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Journal Entry input card */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-fit">
                Hệ thống hạch toán định khoản kế toán kép
              </span>
              <h3 className="text-base font-black text-white">Bút toán Nhật ký chung Kép (VAS - Thông tư 200)</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Sử dụng trợ lý AI định khoản nhanh bằng chữ hoặc tự chọn tài khoản Nợ/Có. Hệ thống tự động đẩy dữ liệu sang Sổ cái phát sinh và tính toán Bảng cân đối thử nghiệm (Trial Balance).
              </p>

              {/* AI helper box */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3">
                <span className="text-[10px] text-orange-450 font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Trợ Lý Định Khoản VAS-AI (Offline &amp; LLM Powered)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={entryAiPrompt}
                    onChange={e => setEntryAiPrompt(e.target.value)}
                    placeholder="Ví dụ: Nộp tiền mặt vào Ngân hàng Vietcombank 25 triệu đồng..."
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-200 outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleAiSuggestDoubleEntry}
                    disabled={aiParsing}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer disabled:opacity-55"
                  >
                    {aiParsing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Đang phân tích...
                      </>
                    ) : (
                      'Định Khoản AI'
                    )}
                  </button>
                </div>
              </div>

              {/* Form entries inputs */}
              <div className="grid sm:grid-cols-12 gap-4 pt-2">
                <div className="sm:col-span-5 space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Diễn giải nghiệp vụ</label>
                  <input
                    type="text"
                    value={entryDescr}
                    onChange={e => setEntryDescr(e.target.value)}
                    placeholder="Diễn giải chi tiết nội dung giao dịch..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-200 outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Nợ TK (Debit)</label>
                  <select
                    value={entryDebit}
                    onChange={e => setEntryDebit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-250 outline-none focus:border-orange-500"
                  >
                    <option value="111">111 - Tiền mặt</option>
                    <option value="112">112 - Ngân hàng</option>
                    <option value="156">156 - Hàng hóa</option>
                    <option value="331">331 - Phải trả NB</option>
                    <option value="411">411 - Vốn CSH</option>
                    <option value="511">511 - Doanh thu</option>
                    <option value="632">632 - Giá vốn hàng</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Có TK (Credit)</label>
                  <select
                    value={entryCredit}
                    onChange={e => setEntryCredit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-250 outline-none focus:border-orange-500"
                  >
                    <option value="111">111 - Tiền mặt</option>
                    <option value="112">112 - Ngân hàng</option>
                    <option value="156">156 - Hàng hóa</option>
                    <option value="331">331 - Phải trả NB</option>
                    <option value="411">411 - Vốn CSH</option>
                    <option value="511">511 - Doanh thu</option>
                    <option value="632">632 - Giá vốn hàng</option>
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Số tiền (VND)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={entryAmount}
                      onChange={e => setEntryAmount(Number(e.target.value))}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-200 outline-none focus:border-orange-500 font-mono text-right"
                    />
                    <button
                      onClick={handleAddJournalEntry}
                      className="px-4 bg-orange-600 hover:bg-orange-555 text-white font-black rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Thống kê
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* List of general ledger journal entries */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div className="space-y-1">
                  <span className="text-xs font-black text-white uppercase block">Bảng Chi Tiết Nhật Ký Chung trong tài khóa</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">Hiển thị các giao dịch kinh tế phát sinh đã định khoản kép</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Bạn có chắc chắn muốn xóa sạch sổ nhật ký chung không?")) {
                      setJournalEntries([]);
                    }
                  }}
                  className="px-2.5 py-1 text-[10px] font-black border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all rounded"
                >
                  Dọn Sạch Sổ
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono font-semibold">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase">
                      <th className="py-2.5">Ngày</th>
                      <th className="py-2.5 pl-2">Diễn giải nghiệp vụ</th>
                      <th className="py-2.5 text-center">Nợ TK</th>
                      <th className="py-2.5 text-center">Có TK</th>
                      <th className="py-2.5 text-right pr-2">Số tiền hạch toán</th>
                      <th className="py-2.5 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {journalEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                          Không có bút toán nào trong sổ nhật ký. Vui lòng thêm giao dịch mới!
                        </td>
                      </tr>
                    ) : (
                      journalEntries.map(e => (
                        <tr key={e.id} className="hover:bg-slate-900/30 transition-all text-[11px]">
                          <td className="py-3 text-slate-400">{e.date}</td>
                          <td className="py-3 pl-2 text-slate-200 line-clamp-1 max-w-[280px] truncate" title={e.descr}>
                            {e.descr}
                          </td>
                          <td className="py-3 text-center text-emerald-400 font-black">{e.debitAcc}</td>
                          <td className="py-3 text-center text-amber-500 font-black">{e.creditAcc}</td>
                          <td className="py-3 text-right text-slate-100 pr-2 font-mono">
                            {e.amount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteEntry(e.id)}
                              className="text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Trial Balance */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 rounded-full font-bold uppercase tracking-wider block w-fit font-mono">
                Bảng Cân Đối Phát Sinh
              </span>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                Trial Balance (TT200)
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Khi các định khoản tuân thủ nguyên tắc kép, tổng bên Nợ luôn luôn bằng tổng bên Có. Sổ kế toán chuẩn chỉnh.
              </p>

              {/* Verified Badge */}
              <div className="bg-slate-900/70 border border-slate-850 rounded-xl p-3 flex items-center justify-between gap-3 text-[11.5px] font-bold">
                <span className="text-slate-300">Tính cân đối (Debit = Credit):</span>
                {totalDebitVol === totalCreditVol && totalDebitVol > 0 ? (
                  <span className="text-emerald-400 font-black flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ĐÃ CÂN ĐỐI
                  </span>
                ) : (
                  <span className="text-rose-455 text-rose-400 font-black flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    CHƯA CÓ PHÁT SINH
                  </span>
                )}
              </div>

              {/* Trial Balance List */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-12 text-[10px] text-slate-500 border-b border-slate-900 pb-1.5 uppercase font-mono font-bold leading-none">
                  <div className="col-span-3">TK</div>
                  <div className="col-span-4 text-right">Phát sinh Nợ</div>
                  <div className="col-span-5 text-right">Phát sinh Có</div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-auto scrollbar-thin scrollbar-thumb-slate-850 pr-1">
                  {trialBalanceList.map(acc => (
                    <div key={acc.code} className="grid grid-cols-12 text-xs font-mono font-semibold text-slate-300 border-b border-slate-950 pb-1.5">
                      <div className="col-span-3">
                        <span className="text-slate-100 font-black block">{acc.code}</span>
                        <span className="text-[9.5px] text-slate-500 font-sans block truncate w-[80px]" title={acc.name}>
                          {acc.name}
                        </span>
                      </div>
                      <div className="col-span-4 text-right pr-1 font-bold text-emerald-400">
                        {acc.debitVol > 0 ? acc.debitVol.toLocaleString('vi-VN') : '0'}
                      </div>
                      <div className="col-span-5 text-right font-bold text-amber-500">
                        {acc.creditVol > 0 ? acc.creditVol.toLocaleString('vi-VN') : '0'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Balance footer */}
                <div className="grid grid-cols-12 text-xs font-mono font-black text-slate-100 pt-2 border-t border-slate-900 leading-none">
                  <div className="col-span-3 text-[10px] uppercase font-sans">TỔNG CỘNG:</div>
                  <div className="col-span-4 text-right text-emerald-455 pr-1 font-mono">
                    {totalDebitVol.toLocaleString('vi-VN')}
                  </div>
                  <div className="col-span-5 text-right text-amber-500 font-mono">
                    {totalCreditVol.toLocaleString('vi-VN')}
                  </div>
                </div>

                {/* Closing balances verification details */}
                <div className="mt-4 pt-3 border-t border-slate-900 space-y-2 text-[11px] font-semibold">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block pb-1">BẢNG SỐ DƯ CUỐI KỲ</span>
                  
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Số dư bên Nợ:</span>
                    <strong className="text-emerald-400 font-mono">{totalEndDeb.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Số dư bên Có:</span>
                    <strong className="text-amber-500 font-mono">{totalEndCre.toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>

              </div>

            </div>

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

          {/* Interactive Calculator & Tax Simulator */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 text-left">
                <Calculator className="w-4.5 h-4.5 text-orange-400" />
                Sổ Tay Tác Chiến Thuế & Chỉ Số
              </h3>
              
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setTaxActiveSubTab('health')}
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${
                    taxActiveSubTab === 'health' 
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Chỉ số
                </button>
                <button
                  onClick={() => setTaxActiveSubTab('tax_sim')}
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${
                    taxActiveSubTab === 'tax_sim' 
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Thuế SME
                </button>
              </div>
            </div>

            {taxActiveSubTab === 'health' ? (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-450 font-semibold leading-relaxed text-left">
                  Nhập các chỉ số hoạt động cơ bản dưới đây (đơn vị: triệu VNĐ) để hệ thống tự động cập nhật và phân cấp rủi ro dòng tiền ròng.
                </p>

                <div className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                  <div className="text-left">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Doanh thu bán hàng:</label>
                    <input
                      type="number"
                      value={revenue}
                      onChange={e => setRevenue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div className="text-left">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Giá vốn hàng bán (COGS):</label>
                    <input
                      type="number"
                      value={cogs}
                      onChange={e => setCogs(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div className="text-left">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Tổng tài sản (Assets):</label>
                    <input
                      type="number"
                      value={assets}
                      onChange={e => setAssets(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div className="text-left">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Nợ phải trả (Liabilities):</label>
                    <input
                      type="number"
                      value={liabilities}
                      onChange={e => setLiabilities(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Calculations Output panel */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                    <span className="font-sans font-semibold">Thanh toán hiện thời (Current):</span>
                    <span className="text-orange-400 font-extrabold">{currentRatio}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(parseFloat(currentRatio) * 35, 100)}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                    <span className="font-sans font-semibold">Tỷ suất lợi nhuận gộp:</span>
                    <span className="text-orange-400 font-extrabold">{grossMargin}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(parseFloat(grossMargin), 100)}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                    <span className="font-sans font-semibold">ROE ròng (Sau Thuế TNDN):</span>
                    <span className="text-orange-400 font-extrabold">{roe}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(parseFloat(roe) * 3, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-450 font-semibold leading-relaxed text-left">
                  Phép tính mô phỏng nghĩa vụ Thuế Giá trị gia tăng (GTGT) & Thuế thu nhập doanh nghiệp (TNDN) tạm tính cho SME tại Việt Nam.
                </p>

                <div className="space-y-3 bg-slate-950 p-3.5 border border-slate-850 rounded-xl space-y-2.5">
                  <div className="text-left">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Loại hình & Thuế suất tính trực tiếp:</label>
                    <select
                      value={taxType}
                      onChange={e => setTaxType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-bold"
                    >
                      <option value="technology">Công nghệ / Phần mềm (Dòng trực tiếp: 5% GTGT)</option>
                      <option value="service">Dịch vụ thường (Dòng trực tiếp: 5% GTGT)</option>
                      <option value="trade">Thương mại, bán lẻ (Dòng trực tiếp: 1% GTGT)</option>
                      <option value="production">Sản xuất vận tải dệt may (Dòng trực tiếp: 3% GTGT)</option>
                    </select>
                  </div>

                  <div className="text-left">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Thuế GTGT đầu vào được khấu trừ (tr đ):</label>
                    <input
                      type="number"
                      value={taxVatIn}
                      onChange={e => setTaxVatIn(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div className="text-left">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Chi phí KHÔNG được trừ khi tính TNDN (tr đ):</label>
                    <input
                      type="number"
                      value={taxNonDeductible}
                      onChange={e => setTaxNonDeductible(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-500 font-semibold block mt-0.5 leading-normal">
                      Ví dụ: Phạt thuế, lương không đóng BHXH, chi quảng cáo mập mờ...
                    </span>
                  </div>
                </div>

                {/* Simulated Tax Outputs */}
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2.5 font-mono text-[10.5px] text-left">
                  <div className="border-b border-slate-900 pb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block mb-1.5">1. SƯ SO SÁNH THUẾ GTGT PHẢI NỘP</span>
                    <div className="flex justify-between items-center text-slate-350 mb-1">
                      <span>Theo PP Khấu trừ (10%):</span>
                      <strong className="text-white">{vatPayableDeductible.toFixed(1)} tr đ</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-350">
                      <span>Theo PP Trực tiếp:</span>
                      <strong className="text-white">{vatPayableDirect.toFixed(1)} tr đ</strong>
                    </div>
                    <span className="text-[9px] text-orange-400 font-sans block mt-1.5">
                      👉 Khuyên khích: Chọn phương pháp <strong>{vatPayableDeductible < vatPayableDirect ? 'Khấu trừ' : 'Trực tiếp'}</strong> để tối ưu hơn {Math.abs(vatPayableDeductible - vatPayableDirect).toFixed(1)} trđ.
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block mb-1.5">2. ƯỚC TÍNH THUẾ TNDN (TẠM TÍNH 20%)</span>
                    <div className="flex justify-between items-center text-slate-350">
                      <span>Lợi nhuận sổ sách (EBIT):</span>
                      <span>{ebit.toFixed(1)} tr đ</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-350">
                      <span>Thu nhập tính thuế (đã loại trừ):</span>
                      <span className="text-orange-400">{taxableIncome.toFixed(1)} tr đ</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-white font-extrabold border-t border-slate-900 pt-1">
                      <span>Thuế TNDN phải nộp:</span>
                      <span className="text-orange-500">{citPayable.toFixed(1)} tr đ</span>
                    </div>
                  </div>
                </div>

                {/* Optimizations */}
                {taxNonDeductible > 0 && (
                  <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[9.5px] text-amber-300 leading-normal text-left font-semibold">
                    ⚠️ <strong>Nhắc nhở quyết toán:</strong> Khoản chi phí không được trừ trị giá <strong>{taxNonDeductible} tr đ</strong> làm bạn tốn thêm <strong className="text-orange-400">{(taxNonDeductible * 0.2).toFixed(1)} trđ</strong> tiền thuế TNDN phạt bổ sung thực nộp. Hãy gom đủ chứng từ hóa đơn đỏ hợp pháp của năm tài khóa nay dứt điểm!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================== TAB 6: TT99/2025/TT-BTC TRANSITION =================================== */}
      {activeTab === 'tt99_transition' && (
        <div className="space-y-6">
          {/* Header Alert card */}
          <div className="bg-slate-950 border border-orange-500/20 p-6 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="w-40 h-40 text-orange-400" />
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Thay Thế Thông Tư 200/2014
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Hiệu Kỳ Pháp Lý 2026
                  </span>
                </div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
                  KỶ NGUYÊN MỚI Chuyển Đổi Sang Thông tư 99/2025/TT-BTC
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold max-w-4xl text-left">
                  Bắt đầu từ năm tài chính <strong>01/01/2026</strong>, Chế độ Kế toán Doanh nghiệp Việt Nam chính thức chuyển mình từ <i>Thông tư 200/2014/TT-BTC</i> sang <i>Thông tư 99/2025/TT-BTC</i>. Hệ thống tăng tính tự chủ hoạt động, bối hợp thông lệ quốc tế, siết chặt điều kiện vốn hóa tài sản chờ phân bổ (242) và bổ sung Thuế tối thiểu toàn cầu (82112).
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDE: ACCOUNT DICTIONARY & COMPLIANCE LAB */}
            <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
              
              {/* ACC DICTIONARY SUBTAB */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <FolderOpen className="w-4.5 h-4.5 text-orange-400" />
                      1. Từ Điển Biến Động Tài Khoản (TT200 sang TT99)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold text-left">Tra cứu tất cả tài khoản bị hủy bỏ, đổi tên, thêm mới, hoặc bỏ cấu trúc cấp 2.</p>
                  </div>

                  {/* Search input to quickly query change list */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm mã hoặc tên TK..."
                      value={tt99SearchQuery}
                      onChange={e => setTt99SearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 w-full sm:w-[180px]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2.5" />
                  </div>
                </div>

                {/* Categories selector block */}
                <div className="flex flex-wrap gap-1">
                  {(['all', 'asset', 'liability', 'equity', 'expense', 'revenue'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTt99ActiveCategory(cat)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        tt99ActiveCategory === cat 
                          ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' 
                          : 'bg-slate-950 text-slate-500 border border-transparent hover:text-slate-300'
                      }`}
                    >
                      {cat === 'all' ? 'Tất cả' : cat === 'asset' ? 'Tài Sản' : cat === 'liability' ? 'Nợ Phải Trả' : cat === 'equity' ? 'Vốn CSH' : cat === 'expense' ? 'Chi Phí (6-8)' : 'Thu Nhập (5-7)'}
                    </button>
                  ))}
                </div>

                {/* Rendered map of changed accounts */}
                <div className="grid sm:grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-1">
                  {([
                    { code: '111, 112, 113, 153, 155, 156, 211', type: 'no_sub', cat: 'asset', oldName: 'Tiền mặt, Tiền gửi, Hàng hóa, TSCĐ hữu hình...', newName: 'Ủy quyền mở rộng cấp 2', descr: 'Bỏ sự bắt buộc đối với hệ thống tài khoản cấp 2. Doanh nghiệp tự xây dựng để nâng cao tính phản ứng nhanh nhạy.' },
                    { code: '161', type: 'remove', cat: 'asset', oldName: 'Chi sự nghiệp', newName: 'BỊ BÃI BỎ', descr: 'Không còn tiếp tục duy trì tài khoản này. Số dư tất toán đầu năm 2026.' },
                    { code: '215', type: 'add', cat: 'asset', oldName: '(Thiếu tài khoản riêng biệt)', newName: 'Tài sản sinh học', descr: 'Áp dụng tiệm cận IAS 41. Theo dõi cây lâu năm lấy sản phẩm, súc vật làm việc, cây trồng.' },
                    { code: '2295', type: 'add', cat: 'asset', oldName: '(Thiếu tài khoản)', newName: 'Dự phòng tổn thất tài sản sinh học', descr: 'Nhằm đánh giá trích lập suy giảm tài sản sinh học nông nghiệp.' },
                    { code: '2413', type: 'rename', cat: 'asset', oldName: 'Sửa chữa lớn TSCĐ', newName: 'Sửa chữa, bảo dưỡng định kỳ TSCĐ', descr: 'Đổi thuật ngữ chuẩn hóa về tính chất định kỳ của các dự án kiểm thử bảo trì.' },
                    { code: '2414', type: 'add', cat: 'asset', oldName: '(Gộp chung trong 2413)', newName: 'Nâng cấp, cải tạo TSCĐ', descr: 'Tách biệt hẳn chi phí cải tạo nâng cấp làm tăng nguyên giá và chi phí sửa dưỡng bảo dưỡng.' },
                    { code: '242', type: 'rename', cat: 'asset', oldName: 'Chi phí trả trước', newName: 'Chi phí chờ phân bổ', descr: 'Thay thế thuật ngữ cũ để sát bản chất dòng tiền. Kèm lệnh cấm tuyệt đối vốn hóa một số chi phí.' },
                    { code: '244', type: 'rename', cat: 'asset', oldName: 'Cầm cố, thế chấp, ký quỹ, ký cược', newName: 'Ký quỹ, ký cược', descr: 'Lược bỏ cụm từ Cầm cố thế chấp cho nhẹ tên gọi.' },
                    { code: '332', type: 'add', cat: 'liability', oldName: '(Nằm chung trong 3388)', newName: 'Phải trả cổ tức, lợi nhuận', descr: 'Nâng cấp lên tài khoản cấp 1 để trình bày riêng rẽ chỉ tiêu bên nợ phải trả.' },
                    { code: '333', type: 'rename', cat: 'liability', oldName: 'Thuế và các khoản phải nộp Nhà nước', newName: 'Thuế và các khoản phải nộp dài hạn', descr: 'Bổ sung thêm chỉ tiêu Mã số 333 dài hạn trên báo cáo tóm tắt.' },
                    { code: '3387', type: 'rename', cat: 'liability', oldName: 'Doanh thu chưa thực hiện', newName: 'Doanh thu chờ phân bổ', descr: 'Thay đổi cách gọi đồng điều với Chi phí chờ phân bổ (242).' },
                    { code: '4112', type: 'rename', cat: 'equity', oldName: 'Thặng dư vốn cổ phần', newName: 'Thặng dư vốn', descr: 'Tinh gọn danh từ.' },
                    { code: '417', type: 'remove', cat: 'equity', oldName: 'Quỹ hỗ trợ sắp xếp doanh nghiệp', newName: 'BỊ BÃI BỎ', descr: 'Không còn tồn tại. Doanh nghiệp di dời số dư đóng số đầu năm.' },
                    { code: '419', type: 'rename', cat: 'equity', oldName: 'Cổ phiếu quỹ', newName: 'Cổ phiếu mua lại của chính mình', descr: 'Đổi tên gọi để phản ánh chính xác bản chất sở hữu.' },
                    { code: '441', type: 'remove', cat: 'equity', oldName: 'Nguồn vốn đầu tư xây dựng cơ bản', newName: 'BỊ BÃI BỎ', descr: 'Hủy bỏ tài khoản. Kết chuyển số dư sang Vốn khác đầu năm 2026 (TK 4118).' },
                    { code: '461, 466', type: 'remove', cat: 'equity', oldName: 'Nguồn kinh phí sự nghiệp / TSCĐ hình thành', newName: 'BỊ BÃI BỎ', descr: 'Xóa tài khoản tương quan, tất toán hoặc đưa về Vốn khác chủ sở hữu (4118).' },
                    { code: '631', type: 'remove', cat: 'expense', oldName: 'Giá thành sản xuất', newName: 'BỊ BÃI BỎ', descr: 'Loại bỏ mô hình tính giá thành trung gian này, dồn thẳng hạch toán.' },
                    { code: '6275, 6415, 6425', type: 'add', cat: 'expense', oldName: '(Chưa chi tiết tài khoản)', newName: 'Thuế, phí và lệ phí', descr: 'Bổ sung tài khoản nhỏ chi tiết phản ánh chi phí thuế bảo trì môi trường, lệ phí môn bài vào hoạt động.' },
                    { code: '82112', type: 'add', cat: 'expense', oldName: '(Chưa có luật tương đồng)', newName: 'Thuế thu nhập bổ sung (Tối thiểu toàn cầu)', descr: 'Tạo tài khoản mới để hạch toán phần thuế đóng bù của Tập đoàn đa quốc gia.' }
                  ]
                    .filter(x => {
                      if (tt99ActiveCategory !== 'all' && x.cat !== tt99ActiveCategory) return false;
                      if (tt99SearchQuery) {
                        const low = tt99SearchQuery.toLowerCase();
                        return x.code.toLowerCase().includes(low) || 
                               x.oldName.toLowerCase().includes(low) || 
                               x.newName.toLowerCase().includes(low) ||
                               x.descr.toLowerCase().includes(low);
                      }
                      return true;
                    })
                    .map((item, index) => (
                      <div key={index} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between hover:border-orange-500/20 transition-all">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-black text-orange-400">[{item.code}]</span>
                            <span className={`text-[9.5px] uppercase font-bold px-2 py-0.5 rounded-md ${
                              item.type === 'add' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              item.type === 'remove' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              item.type === 'rename' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {item.type === 'add' ? 'Thêm mới' : item.type === 'remove' ? 'Bãi bỏ' : item.type === 'rename' ? 'Đổi tên gọi' : 'Bỏ cấp 2'}
                            </span>
                          </div>
                          
                          <div className="text-[11px] font-semibold text-slate-300">
                            <span className="text-slate-500 line-through mr-1 font-medium">{item.oldName}</span>
                            <span className="text-slate-200">➔ {item.newName}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed text-left opacity-90">{item.descr}</p>
                        </div>
                      </div>
                    )))}
                </div>
              </div>

              {/* COMPLIANCE AUDIT LAB MODULE (SLIDE 35) */}
              <div className="border-t border-slate-900 pt-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-orange-400" />
                    2. Phòng Thí Nghiệm Thẩm Định Chi Phí Chờ Phân Bổ (TK 242)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold text-left">
                    Nhập chi phí đầu tư kinh doanh dự kiến của bạn để thuật toán của chuyên gia kiểm toán PwC tự động đánh giá quyền năng trích phân bổ theo chuẩn quốc gia TT99 (Có bị cấm treo tài sản phân bổ?).
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 p-4 bg-slate-950/80 border border-slate-850 rounded-xl">
                  {/* Interactive input fields */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Tên khoản chi phí dự kiến:</label>
                      <input
                        type="text"
                        value={complianceName}
                        onChange={e => setComplianceName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-semibold"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Giá trị khoản chi (VNĐ):</label>
                        <input
                          type="number"
                          value={complianceValue}
                          onChange={e => setComplianceValue(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-semibold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Chu kỳ dự kiến (Tháng):</label>
                        <input
                          type="number"
                          value={complianceAmortMonths}
                          onChange={e => setComplianceAmortMonths(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-semibold font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Nhóm bản chất nghiệp vụ đầu tư:</label>
                      <select
                        value={complianceType}
                        onChange={e => setComplianceType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-200"
                      >
                        <option value="setup_cost">Chi phí thành lập Công ty (Ví dụ: Đăng ký, khánh thành...)</option>
                        <option value="pre_operating_ads">Chi phí quảng cáo, sự kiện truyền thông trước hoạt động</option>
                        <option value="research_phase">Chi phí nghiên cứu R&amp;D (Giai đoạn nghiên cứu ý tưởng)</option>
                        <option value="privatization_goodwill">Lợi thế thương mại cổ phần hóa doanh nghiệp nhà nước</option>
                        <option value="installment_interest">Phần lãi mua tài sản trả chậm, trả góp hàng tháng</option>
                        <option value="normal_it_server">Mua sắm cơ sở hạ tầng (Máy chủ vật lý, Server, Máy tính Công ty)</option>
                        <option value="periodic_maintenance">Chi phí sửa chữa lớn, đại tu, bảo dưỡng định kỳ TSCĐ nhà xưởng</option>
                      </select>
                    </div>
                  </div>

                  {/* Immediate Audit Result Evaluation Card */}
                  {(() => {
                    const checkResult = (type: string, value: number, period: number) => {
                      switch (type) {
                        case 'setup_cost':
                          return {
                            allowed: false,
                            rule: "Điều 242 - Slide 35 PwC Chuyên Đề TT99",
                            status: "🔴 KHÔNG ĐƯỢC PHÉP VỐN HÓA (CẤM TREO TK 242)",
                            advice: "Khoản chi này theo TT99 phải được ghi nhận ngay 100% vào chi phí hoạt động sản xuất kinh doanh ngay trong kỳ phát sinh. Không được treo tài sản phân bổ dãn 3 năm như TT200.",
                            impactEbitda: -value,
                            oldEntry: `Nợ TK 242: ${value.toLocaleString()} | Có TK 112: ${value.toLocaleString()}`,
                            newEntry: `Nợ TK 642 (Chi phí QLDN): ${value.toLocaleString()} | Có TK 112: ${value.toLocaleString()}`,
                            recommend: "Đối với startup/SME, việc đưa thẳng chi phí thành lập vào TK 642 trong năm đầu sẽ làm suy giảm nhẹ EBIT kỳ đầu nhưng tối ưu hóa hoàn toàn chi phí quyết toán thuế thực tế trung thực của năm đó, tránh bị cơ quan Thuế xuất toán về sau."
                          };
                        case 'pre_operating_ads':
                          return {
                            allowed: false,
                            rule: "Điều 242 - Slide 35 PwC Chuyên Đề TT99",
                            status: "🔴 KHÔNG ĐƯỢC PHÉP VỐN HÓA (CẤM TREO TK 242)",
                            advice: "Toàn bộ tiền tổ chức sự kiện, quảng bá thương mại khi chưa khánh thành bắt buộc phải hạch toán thẳng vào Chi phí Bán hàng (TK 641), không được phép lấy lý do để phân bổ dần các kỳ sau.",
                            impactEbitda: -value,
                            oldEntry: `Nợ TK 242: ${value.toLocaleString()} | Có TK 112: ${value.toLocaleString()}`,
                            newEntry: `Nợ TK 641 (Chi phí Bán hàng): ${value.toLocaleString()} | Có TK 112: ${value.toLocaleString()}`,
                            recommend: "Hãy lập kế hoạch ngân sách truyền thông từng giai đoạn để tránh dồn chi phí bán hàng quá sâu vào một kỳ gây sốc báo cáo tài chính."
                          };
                        case 'research_phase':
                          return {
                            allowed: false,
                            rule: "Mục 4. Thuyết minh BCTC - Slide 35 & IAS 38",
                            status: "🔴 KHÔNG ĐƯỢC PHÉP VỐN HÓA",
                            advice: "Chi phí giai đoạn nghiên cứu ban đầu của dự án R&D tuyệt đối không được coi là tài sản chờ phân bổ vô hình. Bắt buộc kết chuyển 100% thẳng sang Chi phí phát triển quản lý doanh nghiệp (TK 642).",
                            impactEbitda: -value,
                            oldEntry: `Nợ TK 242 | Có TK 152, 112`,
                            newEntry: `Nợ TK 642 (Chi phí QLDN) | Có TK 152, 112: ${value.toLocaleString()}`,
                            recommend: "Ranh giới giữa Nghiên cứu (Research) và Phát triển (Development) là rất mỏng manh. Hãy ghi biên bản họp hội đồng kỹ thuật chứng minh rõ dự án nếu muốn tiếp tục được xem xét vốn hóa dở dang công nghệ."
                          };
                        case 'privatization_goodwill':
                          return {
                            allowed: false,
                            rule: "Quy định Chuyển tiếp nguồn vốn - Slide 35",
                            status: "🔴 CẤM GHI NHẬN TÀI SẢN PHÂN BỔ",
                            advice: "Lợi thế kinh doanh khi chuyển đổi hình thức công ty nhà nước cũ không được đưa treo TK 242.",
                            impactEbitda: -value,
                            oldEntry: `Nợ TK 242 | Có TK 411`,
                            newEntry: `Giảm trực tiếp nguồn vốn tương ứng của chủ sở hạ tầng.`,
                            recommend: "Nghiên cứu kỹ cơ chế thanh lý tài sản bồi hoàn nhà nước dứt điểm."
                          };
                        case 'installment_interest':
                          return {
                            allowed: false,
                            rule: "Chuẩn mực Kế toán Công cụ tài chính - Slide 35",
                            status: "🔴 CẤM TREO TK 242",
                            advice: "Tiền lãi suất mua xe ô tô, thiết bị trả góp dứt khoát phải tính vào Chi phí tài chính (TK 635) trong kỳ phát sinh tính theo phương pháp lãi suất thực tế.",
                            impactEbitda: -value,
                            oldEntry: `Nợ TK 242 - Lãi trả trước để phân bổ dần | Có TK 331`,
                            newEntry: `Nợ TK 635 (Chi phí tài chính) | Có TK 112, 331: ${value.toLocaleString()}`,
                            recommend: "Tối ưu hóa các chính sách đàm phán mua thẳng hoặc ký kết hợp đồng cho thuê tài chính ngắn hạn."
                          };
                        case 'normal_it_server':
                          return {
                            allowed: true,
                            rule: "Slide 36 - Tài sản hữu hình thông lệ",
                            status: "🟢 ĐƯỢC PHÉP GHI NHẬN TÀI SẢN (VỐN HÓA)",
                            advice: "Mua máy chủ máy tính công nghệ là tài sản phục vụ số hóa lâu dài, đáp ứng tiêu chí tài sản độc lập nên hạch toán Nợ TK 211 (Hoặc Nợ TK 242 nếu dưới 30 triệu đồng để phân bổ dần trong 12-24 tháng).",
                            impactEbitda: 0,
                            oldEntry: `Nợ TK 211 / Có TK 331: ${value.toLocaleString()}`,
                            newEntry: `Nợ TK 211 / Có TK 331: ${value.toLocaleString()} (Vẫn tiếp tục trích khấu hao mượt mà)`,
                            recommend: "Đây là chi phí tài sản hữu hình thông thường được phép ghi nhận và kiểm toán viên hoàn toàn chấp nhận theo thông lệ."
                          };
                        case 'periodic_maintenance':
                          return {
                            allowed: true,
                            rule: "Slide 36 - Đại tu & Bảo dưỡng định kỳ",
                            status: "🟢 ĐƯỢC PHÉP TRÍCH TRƯỚC / PHÂN BỔ",
                            advice: "Chi phí bảo dưỡng lớn định kỳ của máy móc, thiết bị được phép ghi nhận vào TK 242 để phân bổ đều hàng tháng, đảm bảo đồ thị chi phí sản xuất hoạt động được bình ổn một cách khoa học.",
                            impactEbitda: 0,
                            oldEntry: `Nợ TK 242 - Chi phí trả trước | Có TK 112`,
                            newEntry: `Nợ TK 242 (Chi phí chờ phân bổ) | Có TK 112: ${value.toLocaleString()}`,
                            recommend: "Đổi thuật ngữ hạch toán từ Chi phí trả trước sang Chi phí chờ phân bổ theo đúng mẫu biểu mới."
                          };
                        default:
                          return { allowed: true, status: "", rule: "", advice: "", impactEbitda: 0, oldEntry: "", newEntry: "", recommend: "" };
                      }
                    };

                    const audit = checkResult(complianceType, complianceValue, complianceAmortMonths);

                    return (
                      <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[9.5px] uppercase font-black tracking-widest text-slate-500 block">Kết quả Thẩm định Kiểm toán:</span>
                          <span className={`text-[12px] font-black block tracking-tight ${audit.allowed ? 'text-emerald-400' : 'text-red-400'}`}>
                            {audit.status}
                          </span>
                          <div className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                            <strong>Khung pháp lý:</strong> {audit.rule}
                          </div>
                          <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed text-left opacity-90">{audit.advice}</p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <span className="text-[9px] uppercase font-black text-slate-400 block">Sự Khác Biệt Trong Bút Toán Ghi Sổ:</span>
                          <div className="space-y-1.5 font-mono text-[9px] text-left">
                            <div className="bg-slate-950 p-2 rounded text-slate-400">
                              <span className="text-slate-500 font-bold block mb-0.5">Xưa (Thông tư 200/2014):</span>
                              {audit.oldEntry}
                            </div>
                            <div className="bg-slate-950 p-2 border border-orange-500/15 rounded text-orange-400">
                              <span className="text-orange-550 font-bold block mb-0.5">Nay (Thông tư 99/2025):</span>
                              {audit.newEntry}
                            </div>
                          </div>
                          
                          <div className="p-3 bg-slate-950 text-[10px] text-slate-400 font-semibold border-l-2 border-orange-500 leading-normal">
                            👉 <strong>Khuyên dùng:</strong> {audit.recommend}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* COMPLIANCE AUDIT LAB MODULE (SLIDE 48) - WARRANTY PROVISIONS */}
              <div className="border-t border-slate-900 pt-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 text-left">
                    <FileText className="w-4.5 h-4.5 text-orange-400" />
                    3. Máy Tính Dự Phòng Bảo Hành Công Trình Xây Lắp (TK 3522)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold text-left">
                    Theo <strong>Thông tư 99 (Slide 48)</strong>, trích lập dự phòng bảo hành công trình xây dựng phải tính vào Chi phí bán hàng (TK 641) thay vì đưa vào TK 627 (Chi phí sản xuất chung) như TT200 xưa. Mọi hoàn nhập dư thừa cuối kỳ cũng bắt buộc ghi giảm chi phí bán hàng chứ không đưa vào TK 711.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 p-4 bg-slate-950/80 border border-slate-850 rounded-xl">
                  {/* Interactive inputs */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1 text-left">Doanh thu công trình xây dựng (VNĐ):</label>
                      <input
                        type="number"
                        value={warrantyRevenue}
                        onChange={e => setWarrantyRevenue(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-semibold"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={() => setWarrantyRevenue(1000000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          1 Tỷ
                        </button>
                        <button
                          onClick={() => setWarrantyRevenue(5000000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          5 Tỷ
                        </button>
                        <button
                          onClick={() => setWarrantyRevenue(10000000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          10 Tỷ
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1 text-left">Tỷ lệ bảo hành cam kết (%):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={warrantyRate}
                        onChange={e => setWarrantyRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-semibold font-mono"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAddWarrantyToLedger}
                        className="w-full py-2 bg-emerald-600/90 hover:bg-emerald-555 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Trích Lập Kế Toán Nhật Ký
                      </button>
                      {warrantyStatusMsg && (
                        <div className="mt-2 text-[10px] text-emerald-400 font-bold text-center">
                          {warrantyStatusMsg}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual Comparison Cards */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2.5 text-left">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Số tiền dự phòng: <span className="text-orange-400 font-mono">{(Math.round(warrantyRevenue * (warrantyRate / 100))).toLocaleString()}đ</span></span>
                      
                      <div className="space-y-2 text-[10px] font-medium font-mono text-left">
                        <div className="bg-slate-950 p-2 rounded border border-red-500/10">
                          <span className="text-red-400 font-bold block text-[9px] mb-1">Xưa (Thông tư 200/2014):</span>
                          Nợ TK 627 (Chi phí sản xuất chung) <br />
                          Có TK 3522: {(Math.round(warrantyRevenue * (warrantyRate / 100))).toLocaleString()}đ
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-emerald-500/15">
                          <span className="text-emerald-400 font-bold block text-[9px] mb-1">Nay (Thông tư 99/2025):</span>
                          Nợ TK 641 (Chi phí bán hàng - 6414) <br />
                          Có TK 3522: {(Math.round(warrantyRevenue * (warrantyRate / 100))).toLocaleString()}đ
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-2.5 border border-slate-850 rounded-lg text-[9.5px] leading-relaxed text-slate-400 font-semibold text-left">
                      💡 <strong>Nguyên nhân thay đổi:</strong> Doanh nghiệp xây lắp có trách nhiệm bảo hành đối với thành phẩm cung cấp tới khách hàng. Hướng dẫn TT99 xem nghĩa vụ này nằm trong hoạt động tiêu thụ kinh doanh hàng hóa (TK 641) tương đương bản chất của dịch vụ kiểm soát bảo lưu độc lập của IFRS 15.
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPLIANCE AUDIT LAB MODULE (SLIDE 20) - FOREIGN EXCHANGE DIFFERENCES */}
              <div className="border-t border-slate-900 pt-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 text-left">
                    <TrendingUp className="w-4.5 h-4.5 text-orange-400" />
                    4. Mô Phỏng Đánh Giá Lại Tỷ Giá Ngoại Tệ Cuối Kỳ (Slide 20)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold text-left">
                    Phục vụ đợt khóa sổ báo cáo tài chính. Trực tiếp so khớp tài khoản ngoại tệ, tính biên độ lãi/lỗ tỷ giá để tự động định khoản, kiểm thử quy trình <strong>bỏ hẳn tài khoản trung gian 413</strong> của TT99.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 p-4 bg-slate-950/80 border border-slate-850 rounded-xl">
                  {/* Inputs */}
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5 text-left">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Số lượng ngoại tệ (USD):</label>
                        <input
                          type="number"
                          value={revalCurrencyAmt}
                          onChange={e => setRevalCurrencyAmt(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-semibold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Tỷ giá gốc sổ sách (đ/USD):</label>
                        <input
                          type="number"
                          value={revalBookRate}
                          onChange={e => setRevalBookRate(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-semibold font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-left">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Tỷ giá khóa sổ (đ/USD):</label>
                        <input
                          type="number"
                          value={revalClosingRate}
                          onChange={e => setRevalClosingRate(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-semibold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Bản chất Tài khoản:</label>
                        <select
                          value={revalAccountType}
                          onChange={e => setRevalAccountType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] text-white font-bold tracking-tight"
                        >
                          <option value="1122">Tiền gửi ngân hàng bằng ngoại tệ (1122)</option>
                          <option value="131_normal">Khoản Phải thu Khách hàng bằng ngoại tệ (131)</option>
                          <option value="331_normal">Khoản Phải trả Người bán bằng ngoại tệ (331)</option>
                          <option value="131_provided_for">Nợ Phải thu ngoại tệ ĐÃ LẬP DỰ PHÒNG 100%</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={handleAddRevalToLedger}
                        className="w-full py-2 bg-orange-600/90 hover:bg-orange-555 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Ghi Nhận Lãi/Lỗ Tỷ Giá Trực Tiếp
                      </button>
                      {revalStatusMsg && (
                        <div className="mt-2 text-[10.5px] text-orange-400 font-bold text-center leading-normal">
                          {revalStatusMsg}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculations and analysis result */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                    {(() => {
                      const bookVal = revalCurrencyAmt * revalBookRate;
                      const closingVal = revalCurrencyAmt * revalClosingRate;
                      const isGain = revalAccountType === '331_normal' ? (closingVal < bookVal) : (closingVal > bookVal);
                      const rawDiff = closingVal - bookVal;
                      const absDiffValue = Math.abs(rawDiff);

                      return (
                        <div className="space-y-3 text-left">
                          <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-slate-800 pb-2.5 font-bold text-left">
                            <div>
                              <span className="text-slate-500 block">Giá trị gốc sổ sách:</span>
                              <span className="text-slate-300 font-mono text-xs">{bookVal.toLocaleString()} đ</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Giá trị đánh giá lại:</span>
                              <span className="text-slate-300 font-mono text-xs">{closingVal.toLocaleString()} đ</span>
                            </div>
                          </div>

                          {revalAccountType === '131_provided_for' ? (
                            <div className="py-2.5 px-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10.5px] rounded-lg leading-relaxed font-bold text-left">
                              ❌ TUYỆT ĐỐI CẤM ĐÁNH GIÁ LẠI: <br />
                              <span className="font-semibold text-slate-300 mt-1 block">Slide 20 ghi rõ: "Không đánh giá lại các khoản phải thu đã lập dự phòng" nhằm đảm bảo kiểm toán lành mạnh, trung thực nhất.</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wide">
                                <span className="text-slate-400">Kết quả đánh giá:</span>
                                <span className={isGain ? 'text-emerald-400' : 'text-red-400'}>
                                  {isGain ? `🟢 LÃI TỶ GIÁ (+${absDiffValue.toLocaleString()} đ)` : `🔴 LỖ TỶ GIÁ (-${absDiffValue.toLocaleString()} đ)`}
                                </span>
                              </div>

                              <div className="text-[10px] space-y-1.5 font-medium leading-relaxed font-mono text-left">
                                <div className="bg-slate-950 p-2 rounded text-slate-400">
                                  <span className="text-slate-500 font-bold block text-[9.5px]">Đường đi của TT200 (Qua trung gian):</span>
                                  Nợ/Có TK 413 (Chênh lệch tỷ giá) ➔ sau đó mới kết chuyển ghi vào TK {isGain ? '515' : '635'} khi khóa sổ.
                                </div>
                                <div className="bg-slate-950 p-2 border border-orange-500/20 rounded text-orange-400">
                                  <span className="text-orange-550 font-bold block text-[9.5px]">Đường đi trực tiếp của TT99 (Tối giản):</span>
                                  {isGain ? (
                                    <span>Nợ TK {revalAccountType === '331_normal' ? '331' : revalAccountType === '1122' ? '112' : '131'} / Có TK 515: {absDiffValue.toLocaleString()}đ</span>
                                  ) : (
                                    <span>Nợ TK 635 / Có TK {revalAccountType === '331_normal' ? '331' : revalAccountType === '1122' ? '112' : '131'}: {absDiffValue.toLocaleString()}đ</span>
                                  )}
                                  <span className="text-[9px] text-slate-500 block mt-1">(Bỏ chốt trung gian TK 413 giúp kế toán nhàn hạ, kiểm toán rà soát tức thời!)</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* COMPLIANCE AUDIT LAB MODULE (SLIDE 32) - HTM BOND AMORTIZATION */}
              <div className="border-t border-slate-900 pt-6 space-y-4 font-sans">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 text-left">
                    <TrendingUp className="w-4.5 h-4.5 text-orange-400" />
                    5. Phân Bổ Chiết Khấu / Phụ Trội Đầu Tư Trái Phiếu HTM (TK 128 - Slide 32)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold text-left leading-normal">
                    Theo <strong>Thông tư 99 (Slide 31 & 32)</strong>, thay vị giữ nguyên giá gốc của trái phiếu nắm giữ đến ngày đáo hạn (HTM), kế toán bắt buộc phải trích phân bổ định kỳ phần phụ trội/chiết khấu trực tiếp vào Doanh thu tài chính (TK 515) để phản ánh đúng giá trị ghi sổ thực tế theo thời gian nắm giữ ròng.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 p-4 bg-slate-950/80 border border-slate-850 rounded-xl">
                  {/* Inputs */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5 text-left">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Mệnh giá (VND):</label>
                        <input
                          type="number"
                          value={bondParVal}
                          onChange={e => setBondParVal(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Giá mua thực tế (VND):</label>
                        <input
                          type="number"
                          value={bondCost}
                          onChange={e => setBondCost(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-left">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Kỳ hạn (Tháng):</label>
                        <input
                          type="number"
                          value={bondTerm}
                          onChange={e => setBondTerm(parseInt(e.target.value) || 12)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Tháng đã giữ:</label>
                        <input
                          type="number"
                          value={bondAmortMonths}
                          onChange={e => setBondAmortMonths(parseInt(e.target.value) || 6)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Lãi coupon (%/nă):</label>
                        <input
                          type="number"
                          value={bondCoupon}
                          onChange={e => setBondCoupon(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAddBondToLedger}
                        className="w-full py-2 bg-emerald-600/90 hover:bg-emerald-555 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Trích Lãi & Phân Bổ Kế Toán
                      </button>
                      {bondStatusMsg && (
                        <div className="mt-2 text-[10px] text-emerald-400 font-bold text-center leading-normal">
                          {bondStatusMsg}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculations and analysis result */}
                  <div className="space-y-3 text-left">
                    {(() => {
                      const diffVal = bondParVal - bondCost;
                      const isDiscount = diffVal > 0;
                      const isPremium = diffVal < 0;
                      const absDiff = Math.abs(diffVal);
                      const amortAmt = Math.round(absDiff * (bondAmortMonths / bondTerm));
                      const interestAmt = Math.round(bondParVal * (bondCoupon / 100) * (bondAmortMonths / bondTerm));

                      let tt200BookVal = bondCost;
                      let tt99BookVal = isDiscount ? (bondCost + amortAmt) : (bondCost - amortAmt);

                      return (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2 text-[10px] flex flex-col justify-between h-full font-mono">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-slate-400 font-sans">Loại hình Trái phiếu:</span>
                            <span className={`font-black uppercase px-2 py-0.5 rounded text-[9px] ${
                              isDiscount ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' : 
                              isPremium ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : 
                              'bg-slate-950 text-slate-405'
                            }`}>
                              {isDiscount ? `CÓ CHIẾT KHẤU (${absDiff.toLocaleString()}đ)` : isPremium ? `CÓ PHỤ TRỘI (${absDiff.toLocaleString()}đ)` : 'MỆNH GIÁ GỐC'}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-slate-300 font-semibold p-1">
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-sans">Lãi dồn tích (Nợ 138/Có 515):</span>
                              <span className="font-mono text-white text-xs">{interestAmt.toLocaleString()}đ</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-sans">Chiết khấu phân bổ đợt này:</span>
                              <span className="font-mono text-orange-400 text-xs">
                                {isDiscount ? `+${amortAmt.toLocaleString()}đ (Tăng gốc)` : isPremium ? `-${amortAmt.toLocaleString()}đ (Giảm gốc)` : '0đ'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                            <div className="bg-slate-950 p-2 rounded text-center">
                              <span className="text-[9px] text-slate-500 font-bold block font-sans">Ghi sổ xưa TT200:</span>
                              <span className="font-mono text-slate-400 text-[11px] font-semibold line-through">{tt200BookVal.toLocaleString()}đ</span>
                            </div>
                            <div className="bg-slate-950 p-2 rounded text-center border border-emerald-500/15">
                              <span className="text-[9px] text-emerald-400 font-bold block font-sans font-black">Ghi sổ nay TT99 (Slide 32):</span>
                              <span className="font-mono text-emerald-300 text-xs font-extrabold">{tt99BookVal.toLocaleString()}đ</span>
                            </div>
                          </div>

                          <div className="text-[8.5px] leading-relaxed text-slate-500 font-medium font-sans pt-1">
                            💡 Phân bổ chiết khấu định kỳ định khoản dồn tích sẽ nâng dần giá trị ghi sổ của trái phiếu lên tiệm cận mệnh giá gốc khi đáo hạn ròng.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* COMPLIANCE AUDIT LAB MODULE (SLIDE 46) - REVENUE AGENT VS PRINCIPAL DETERMINATOR */}
              <div className="border-t border-slate-900 pt-6 space-y-4 font-sans">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 text-left">
                    <HelpCircle className="w-4.5 h-4.5 text-orange-400" />
                    6. Ma Trận Chẩn Đoán Doanh Thu: Vai trò Chủ Thể vs Đại Lý (Slide 46)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold text-left leading-normal">
                    Xác định vai trò của công ty bạn đối với hợp đồng để tuân thủ <strong>Thông tư 99</strong> về nguyên tắc ghi nhận doanh thu: Ghi nhận Gộp (Gross) ở vai trò Chủ thể hay ghi nhận Ròng hoa hồng (Net) ở vai trò Đại lý.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-4">
                  <div className="space-y-2.5">
                    {/* Question 1 */}
                    <div className="flex items-center justify-between gap-4 p-2.5 bg-slate-900 border border-slate-850 rounded-lg">
                      <div className="text-left leading-normal max-w-[70%]">
                        <span className="text-[10.5px] font-extrabold text-slate-250 block">1. Kiểm soát nội dung hàng hóa trước bàn giao:</span>
                        <span className="text-[9.5px] text-slate-400 font-semibold">Doanh nghiệp có quyền sở hữu, kiểm soát hoặc chỉ định hàng hóa/dịch vụ trước khi chuyển giao?</span>
                      </div>
                      <button
                        onClick={() => setAgentControlGoods(!agentControlGoods)}
                        className={`text-[10px] font-black px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                          agentControlGoods ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        {agentControlGoods ? 'Có (Yes)' : 'Không (No)'}
                      </button>
                    </div>

                    {/* Question 2 */}
                    <div className="flex items-center justify-between gap-4 p-2.5 bg-slate-900 border border-slate-850 rounded-lg">
                      <div className="text-left leading-normal max-w-[70%]">
                        <span className="text-[10.5px] font-extrabold text-slate-250 block">2. Tự chủ định đoạt biểu giá bán lẻ:</span>
                        <span className="text-[9.5px] text-slate-400 font-semibold">Doanh nghiệp có quyền quyết định, thương thảo và áp định mức tỷ lệ giá bán trực tiếp đến khách hàng?</span>
                      </div>
                      <button
                        onClick={() => setAgentPriceDiscretion(!agentPriceDiscretion)}
                        className={`text-[10px] font-black px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                          agentPriceDiscretion ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        {agentPriceDiscretion ? 'Có (Yes)' : 'Không (No)'}
                      </button>
                    </div>

                    {/* Question 3 */}
                    <div className="flex items-center justify-between gap-4 p-2.5 bg-slate-900 border border-slate-850 rounded-lg">
                      <div className="text-left leading-normal max-w-[70%] font-sans">
                        <span className="text-[10.5px] font-extrabold text-slate-250 block">3. Chịu hoàn toàn rủi ro tồn kho, hao hụt bãi:</span>
                        <span className="text-[9.5px] text-slate-400 font-semibold">Doanh nghiệp chịu rủi ro tồn trữ, lỗi hư thối hỏng hoặc nguy cơ trả lại hàng từ khâu vận chuyển?</span>
                      </div>
                      <button
                        onClick={() => setAgentInventoryRisk(!agentInventoryRisk)}
                        className={`text-[10px] font-black px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                          agentInventoryRisk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        {agentInventoryRisk ? 'Có (Yes)' : 'Không (No)'}
                      </button>
                    </div>
                  </div>

                  {/* Diagnosis scorecard */}
                  {(() => {
                    const score = (agentControlGoods ? 1 : 0) + (agentPriceDiscretion ? 1 : 0) + (agentInventoryRisk ? 1 : 0);
                    const isPrincipal = score >= 2;

                    return (
                      <div className={`p-4 rounded-xl border text-left space-y-2 ${
                        isPrincipal 
                          ? 'bg-blue-500/5 border-blue-500/20 text-blue-300' 
                          : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                      }`}>
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="flex items-center gap-1.5 uppercase font-sans">
                            <Compass className="w-4 h-4 text-orange-400" />
                            ĐÁNH GIÁ CHUYÊN MÔN: KẾT LUẬN LÀ {isPrincipal ? 'CHỦ THỂ (PRINCIPAL)' : 'ĐẠI LÝ (AGENT)'}
                          </span>
                          <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800 text-slate-300">
                            Quyền kiểm soát: {score}/3
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                          {isPrincipal 
                            ? '👉 GHI NHẬN DOANH THU GỘP (GROSS SALES - TK 511): Đơn vị kiểm soát và chịu nghĩa vụ chính đối với sản phẩm. Doanh nghiệp ghi sổ 100% doanh thu niêm yết từ hoá đơn, đồng thời hạch toán giá vốn hàng bán tương ứng ở TK 632 ròng.'
                            : '👉 GHI NHẬN DOANH THU RÒNG (NET COMMISSION - TK 511): Đơn vị chỉ kết nối thu hộ hoa hồng dịch vụ trung gian. Toàn bộ doanh số thu hộ thực phẩm/sản phẩm phải ghi Có tài khoản công nợ của bên uỷ thác (TK 331), chỉ được treo doanh thu phần phí hoa hồng thực thâu.'
                          }
                        </p>

                        <div className="bg-slate-950/80 p-2.5 border border-slate-900 rounded font-mono text-[9px] text-slate-400">
                          <strong>Bút toán mẫu phù hợp TT99:</strong> <br />
                          {isPrincipal 
                            ? '• Doanh thu: Nợ TK 131, 112 / Có TK 511 | Có TK 3331  ||• Giá vốn: Nợ TK 632 / Có TK 156'
                            : '• Trung gian: Nợ TK 131, 112 / Có TK 331 (Phần thu hộ), Có TK 511 (Mức hoa hồng thực), Có TK 3331 (Thuế)'
                          }
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* COMPLIANCE AUDIT LAB MODULE (SLIDE 15) - GLOBAL MINIMUM TAX (TK 82112) */}
              <div className="border-t border-slate-900 pt-6 space-y-4 font-sans text-left">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 text-left">
                    <ShieldCheck className="w-4.5 h-4.5 text-orange-400" />
                    7. Trích Lập Thuế Thu Nhập Doanh Nghiệp Bổ Sung (TK 82112 - Slide 15)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold text-left leading-normal">
                    Theo quy định mới liên kết thuế tối thiểu toàn cầu trong <strong>Thông tư 99/2025/TT-BTC (Slide 15 &amp; 40)</strong>, các tập đoàn đa quốc gia có nghĩa vụ nộp thuế bổ sung (ETR &lt; 15%) phải hạch toán chi tiết vào tài khoản riêng biệt mới hoạt động: <strong>Tài khoản 82112</strong> (Thuế thu nhập doanh nghiệp bổ sung), đối ứng Có TK 3334.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 p-4 bg-slate-950/80 border border-slate-850 rounded-xl">
                  {/* Inputs */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1 text-left">Lợi nhuận GloBI điều chỉnh của Đơn vị ở VN (VNĐ):</label>
                      <input
                        type="number"
                        value={gmtProfit}
                        onChange={e => setGmtProfit(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-semibold"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={() => setGmtProfit(10000000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          10 Tỷ
                        </button>
                        <button
                          onClick={() => setGmtProfit(50000000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          50 Tỷ
                        </button>
                        <button
                          onClick={() => setGmtProfit(200000000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          200 Tỷ
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-slate-400 block mb-1 text-left">Thuế thu nhập doanh nghiệp đã nộp thực tế (VND):</label>
                      <input
                        type="number"
                        value={gmtCoveredTax}
                        onChange={e => setGmtCoveredTax(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-semibold"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={() => setGmtCoveredTax(500000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          500 Tr
                        </button>
                        <button
                          onClick={() => setGmtCoveredTax(2000000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          2 Tỷ
                        </button>
                        <button
                          onClick={() => setGmtCoveredTax(10000000000)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] rounded border border-slate-800 font-bold cursor-pointer"
                        >
                          10 Tỷ
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleAddGmtToLedger}
                        className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-555 hover:to-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Trích Lập Thuế Bổ Sung
                      </button>
                      {gmtStatusMsg && (
                        <div className="mt-2 text-[10px] text-emerald-400 font-bold text-center bg-slate-900 p-2 border border-slate-800 rounded leading-normal">
                          {gmtStatusMsg}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculations Output */}
                  <div className="space-y-3 flex flex-col justify-between">
                    {(() => {
                      const etr = gmtProfit > 0 ? (gmtCoveredTax / gmtProfit) : 0;
                      const hasTopUp = etr < 0.15;
                      const topUpRate = hasTopUp ? (0.15 - etr) : 0;
                      const topUpAmt = Math.round(gmtProfit * topUpRate);

                      return (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-3.5 text-left font-mono text-[10px] h-full flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase text-slate-500 block">Đánh giá Trụ cột 2 (Pillar Two):</span>
                            
                            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-850">
                              <span className="text-slate-400 font-sans">Thuế suất thực tế (ETR):</span>
                              <span className={`text-[12px] font-black font-mono ${hasTopUp ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {(etr * 100).toFixed(2)} %
                              </span>
                            </div>

                            <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-850">
                              <span className="text-slate-400 font-sans">Bị đóng bù thuế (Top-Up):</span>
                              <span className={`text-[12px] font-black font-mono ${hasTopUp ? 'text-amber-400' : 'text-slate-400'}`}>
                                {hasTopUp ? 'CÓ (ETR < 15%)' : 'KHÔNG (An toàn)'}
                              </span>
                            </div>

                            {hasTopUp && (
                              <div className="p-2 bg-amber-500/5 rounded border border-amber-500/10 text-[9.5px] leading-relaxed text-slate-300">
                                <span className="font-sans font-bold text-amber-400 block mb-0.5">Mức chênh thuế nộp thêm:</span>
                                Lấy tối thiểu <strong>15%</strong> - {(etr * 100).toFixed(2)}% = <strong className="text-orange-400 font-mono">{(topUpRate * 100).toFixed(2)}%</strong> <br />
                                Thuế tối thiểu bổ sung cần đóng: <strong className="text-orange-400">{topUpAmt.toLocaleString()} đ</strong>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Hạch toán mới (Thông tư 99):</span>
                            <div className="bg-slate-950 p-2 rounded text-orange-400 border border-orange-500/15 leading-relaxed text-[9px]">
                              {hasTopUp ? (
                                <>
                                  <strong>Nợ TK 82112</strong> (Chi phí Thuế TNDN bổ sung): {topUpAmt.toLocaleString()}đ <br />
                                  <strong>Có TK 3334</strong> (Thuế thu nhập doanh nghiệp): {topUpAmt.toLocaleString()}đ
                                </>
                              ) : (
                                <span className="text-slate-505 font-sans">Không phát sinh bút toán (ETR an toàn vượt mức tối thiểu 15%)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: OPENING BALANCE TRANSFER SANDBOX */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max">
                  Slide 52 PwC Corporate Transition
                </span>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <RefreshCw className="w-5 h-5 text-orange-400" />
                  3. Hộp Cát Chuyển Số Dư Đầu Kỳ 01/01/2026
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed text-left">
                  Mô phỏng đợt chuyển đổi dọn sổ cuối năm 2025 sang đầu kỳ 2026. Lựa chọn tài khoản xưa và nạp số dư thực tế của bạn để sinh bút toán dọn dẹp kết chuyển nguồn dứt điểm.
                </p>
              </div>

              <div className="space-y-4 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Tài khoản TT200 còn số dư cuối năm 2025:</label>
                  <select
                    value={openingAccCode}
                    onChange={e => setOpeningAccCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="138_bcc">TK 1388 — Vốn góp hợp đồng BCC không đồng kiểm soát</option>
                    <option value="2413_deferred">TK 2413 — Sửa chữa lớn TSCĐ đang hoàn thành dở dang</option>
                    <option value="3388_dividend">TK 3388 — Phần chi trả cổ tức, lợi nhuận cho cổ đông</option>
                    <option value="441_cap">TK 441 — Nguồn vốn đầu tư xây dựng cơ bản</option>
                    <option value="466_fund">TK 466 — Nguồn kinh phí hình thành tài sản cố định</option>
                    <option value="412_fx_diff">TK 412 — Chênh lệch đánh giá lại tỷ giá thời điểm chuyển tiếp</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Giá trị số dư thực tế (VNĐ):</label>
                  <input
                    type="number"
                    value={openingAmt}
                    onChange={e => setOpeningAmt(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-semibold font-mono"
                  />
                </div>

                {/* Simulated relocator results */}
                {(() => {
                  let text = "";
                  let targetAcc = "";
                  let description = "";
                  if (openingAccCode === '138_bcc') {
                    targetAcc = "2281";
                    description = "Chuyển số dư khoản góp vốn BCC không đồng kiểm soát (đang theo dõi ở Tài khoản 138) sang Tài khoản 2281 (Đầu tư ngoài khác) để phản ánh đúng bản chất đầu tư chứ không để gom trong các khoản phải thu.";
                  } else if (openingAccCode === '2413_deferred') {
                    targetAcc = "2414 | 242";
                    description = "Chi phí sửa chữa lớn dở dang chuyển sang TK 2414 nếu là chi phí cải tạo nâng cấp làm tăng nguyên giá, hoặc đưa sang TK 242 nếu là các khoản sửa chữa bảo dưỡng cấu phần để chuẩn bị phân bổ sau.";
                  } else if (openingAccCode === '3388_dividend') {
                    targetAcc = "332";
                    description = "Chuyển toàn bộ dư nợ phải trả lợi nhuận cổ tức tại 338 sang tài khoản chuyên môn độc lập là Tài khoản 332 (Phải trả cổ tức, lợi nhuận) giúp minh bạch báo cáo nợ công nợ theo Slide 10.";
                  } else if (openingAccCode === '441_cap') {
                    targetAcc = "4118 (Vốn chủ sở hữu khác)";
                    description = "Bãi bỏ tài khoản 441. Chuyển số dư tích lũy dọn dẹp hòa vào Tài khoản 4118 (Vốn khác của chủ sở hữu) tại thời điểm mở sổ ngày 01/01/2026.";
                  } else if (openingAccCode === '466_fund') {
                    targetAcc = "4118 (Vốn chủ sở hữu khác)";
                    description = "Bãi bỏ tài khoản 466. Kinh phí đã đầu tư mua sắm TSCĐ kết dọn hoàn toàn sang dòng vốn chủ gốc dời về Tài khoản 4118 theo quy định chuyển tiếp dọn sổ.";
                  } else if (openingAccCode === '412_fx_diff') {
                    targetAcc = "4211 (Lợi nhuận năm trước)";
                    description = "Chênh lệch tiền ngoại tệ hạch toán kết thúc kỳ chuyển tiếp dời nợ/có tự động dứt điểm vào Tài khoản 4211 (Lợi nhuận chưa phân phối năm trước) sau khi tiến hành thuyết minh lý do cụ thể.";
                  }

                  return (
                    <div className="space-y-3 pt-3 border-t border-slate-900">
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg text-[10.5px] space-y-1 text-slate-350">
                        <div className="flex justify-between items-center text-[10px] font-black text-rose-450 uppercase mb-1">
                          <span>Hướng dẫn dọn sổ ngày 01/01/2026:</span>
                        </div>
                        <p className="font-semibold leading-relaxed text-left text-slate-300 pr-1">{description}</p>
                        <div className="mt-2.5 flex items-center justify-between bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-200">
                          <span>Đích đến mới:</span> 
                          <span className="text-orange-400 font-extrabold text-sm">TK {targetAcc}</span>
                        </div>
                      </div>

                      {/* simulated double-entry journal coupon */}
                      <div className="p-3 bg-slate-900 border border-orange-500/15 rounded-xl space-y-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 text-left block">Phiếu hạch toán chuyển đổi tự động:</span>
                        <div className="font-mono text-[10px] text-slate-300 space-y-1">
                          <div className="flex justify-between">
                            <span>Nợ TK {targetAcc}</span>
                            <span className="text-emerald-400 font-bold">{openingAmt.toLocaleString()} đ</span>
                          </div>
                          <div className="flex justify-between pl-4 text-slate-400">
                            <span>Có TK {openingAccCode.split('_')[0]}</span>
                            <span>{openingAmt.toLocaleString()} đ</span>
                          </div>
                        </div>
                      </div>

                      {/* Add opening balance journal direct in state database */}
                      <button
                        onClick={handleAddOpeningToLedger}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-550 text-white rounded-xl text-xs font-bold transition-all shadow shadow-orange-500/15 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileCode className="w-4 h-4 shrink-0" />
                        Ghi thẳng vào Sổ Nhật Ký Tác Chiến
                      </button>

                      {openingStatusMsg && (
                        <div className="text-[10px] text-emerald-400 text-center font-bold animate-pulse bg-emerald-500/10 border border-emerald-500/20 py-1.5 rounded-lg">
                          ✨ {openingStatusMsg}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* PwC 7-STEP COMPLIANCE ROADMAP (SLIDE 54) */}
              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4.5 space-y-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider block">
                      Slide 54 PwC Audit Roadmap
                    </span>
                    <span className="text-xs font-black text-orange-400 font-mono">
                      {Math.round((completedStages.length / 7) * 100)}% Sẵn Sàng
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5 text-left mt-1">
                    <ShieldCheck className="w-4 h-4 text-orange-400" />
                    Lộ Trình 7 Bước Chuẩn Bị TT99 (PwC Best Practices)
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold leading-normal text-left">
                    Nhấp chọn từng mốc để xem chi tiết hướng dẫn từ kiểm toán viên PwC và hoàn thành cột mốc tương ứng.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(completedStages.length / 7) * 100}%` }}
                  ></div>
                </div>

                {/* Interactive checkboxes */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    "Xây dựng CoA (Hệ thống TK) nội bộ tích hợp riêng TT99",
                    "Rà soát điều chỉnh các chính sách vốn hóa, trích khấu hao",
                    "Đào tạo e-learning kiến thức & kỹ năng chuyển đổi TT99",
                    "Kiểm thử ERP, nâng cấp sơ đồ cơ sở dữ liệu số ngày 01/01/2026",
                    "Thực hiện dọn dẹp, tất toán dứt điểm TK bãi bỏ (441, 466, 161)",
                    "Xây dựng bộ mẫu biểu báo cáo tài chính tóm tắt, dòng tiền mới",
                    "Tham chiếu, đánh giá rủi ro Thuế tối thiểu toàn cầu (TK 82112)"
                  ].map((stageText, idx) => {
                    const isCompleted = completedStages.includes(idx);
                    const isActive = activeRoadmapDetail === idx;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          setActiveRoadmapDetail(idx);
                          if (isCompleted) {
                            setCompletedStages(prev => prev.filter(x => x !== idx));
                          } else {
                            setCompletedStages(prev => [...prev, idx]);
                          }
                        }}
                        className={`p-2 rounded-lg border text-[10px] font-semibold flex items-start gap-2 cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-orange-500/5 border-orange-500/30 text-white' 
                            : isCompleted 
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                              : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded mt-0.5 border flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'border-slate-700'
                        }`}>
                          {isCompleted && "✓"}
                        </div>
                        <span className="leading-tight text-left">{idx + 1}. {stageText}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Active Stage Detailed Tactical Advice */}
                {activeRoadmapDetail !== null && (() => {
                  const details = [
                    {
                      title: "1. Xây dựng CoA (Hệ thống TK) nội bộ riêng TT99",
                      tip: "Tách nhỏ tài khoản chi phí để theo dõi chi tiết (ví dụ: chia tiết khoản cho TK 641, 642, tách các chi phí không đầy đủ hóa đơn đỏ để loại trừ quyết toán thuế dễ dàng). Xóa bỏ hoàn toàn các TK bãi bỏ như 161, 441, 466, 631 khỏi sơ đồ phần mềm."
                    },
                    {
                      title: "2. Điểu chỉnh chính sách vốn hóa & khấu hao",
                      tip: "Rà soát toàn bộ tài sản vô hình và chi phí chờ phân bổ (TK 242). Nghiêm cấm vốn hóa tiền thuê văn phòng ngắn hạn dồn cục, chi phí quảng cáo và nghiên cứu ý tưởng ban đầu (bắt buộc kết chuyển vào chi phí sản xuất kinh doanh trong kỳ hoạt động)."
                    },
                    {
                      title: "3. Đào tạo e-learning cập nhật TT99",
                      tip: "Triển khai các tài liệu tự đào tạo nội bộ về điểm mới của Thông tư 99/2025/TT-BTC. Tập trung sự thay đổi dòng tiền tài sản dọn dẹp, quy tắc loại các TK lỗi thời và phương pháp kê khai thuế tối thiểu bổ sung cho tập đoàn."
                    },
                    {
                      title: "4. Kiểm thử kết nối ERP & Database ngày 01/01/2026",
                      tip: "Nâng cấp kỹ thuật và sơ đồ cơ sở dữ liệu Ledger. Tổ chức chạy mô phỏng dọn dẹp số dư rác và kết chuyển dứt điểm nguồn vốn, tỷ giá ngày đầu năm. Đảm bảo Bảng Cân Đối không bị đứt chuỗi công thức đồng bộ."
                    },
                    {
                      title: "5. Tất toán dứt điểm TK bãi bỏ (441, 466, 161)",
                      tip: "Kế toán trưởng chỉ đạo hạch toán đưa số dư các tài khoản bãi bỏ về 0đ. Kết chuyển nguồn vốn xây dựng cơ bản (TK 441) và kinh phí TSCĐ (TK 466) về Tài khoản 4118 (Vốn chủ sở hữu khác) để đóng sổ năm cũ an toàn."
                    },
                    {
                      title: "6. Cơ cấu lại Biểu mẫu Báo cáo tài chính mới",
                      tip: "Thiết lập các báo cáo tài chính tóm tắt P&L và Dòng tiền tệ theo form chuẩn hệ quy chiếu TT99 của Bộ Tài Chính. Tương thích trực tiếp dữ liệu thô kết xuất để tổng hợp nộp cơ quan Thuế nhanh nhất."
                    },
                    {
                      title: "7. rà soát rủi ro Thuế tối thiểu toàn cầu (TK 82112)",
                      tip: "Phân tích xem công ty mẹ hoặc đơn vị thành viên có doanh thu hợp nhất đạt ngưỡng 750 triệu EUR trở lên không. Tính toán ETR (Thuế thực tế) tại Việt Nam và trích hạch toán thuế tối thiểu bổ sung (Nợ 82112/Có 333) nếu ETR dưới 15%."
                    }
                  ];
                  const currentDetail = details[activeRoadmapDetail];
                  return (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-left space-y-1.5 animate-fade-in">
                      <div className="flex items-center gap-1 text-[9px] text-amber-400 font-extrabold uppercase font-sans">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        Chi tiết lộ trình (PwC Best Practice)
                      </div>
                      <p className="text-[10px] font-black text-white leading-normal">{currentDetail?.title}</p>
                      <p className="text-[10px] text-slate-300 leading-normal font-semibold">{currentDetail?.tip}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Training and Transition Note */}
              <div className="p-4 bg-orange-955/10 border border-orange-950/20 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-orange-400" />
                  PwC's Academy: Khóa Học Đào Tạo TT99
                </span>
                <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed text-left">
                  PwC Việt Nam hợp tác chặt chẽ cùng các doanh nghiệp tập đoàn lớn để cung cấp khóa học đào tạo e-learning và dịch vụ hỗ trợ chuyển đổi dọn dẹp hệ thống phần mềm kế toán sang Thông tư 99/2025/TT-BTC một cách an toàn nhất! (Slide 56)
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =================================== TAB 7: E-INVOICE VALIDATOR (CIRCULAR 78 / DECREE 123) =================================== */}
      {activeTab === 'e_invoice_t78' && (() => {
        // Safe parsing with built-in DOMParser inside an IIFE to restrict scope safely
        let doc: Document | null = null;
        let parseError = '';
        try {
          const parser = new window.DOMParser();
          doc = parser.parseFromString(xmlText, 'text/xml');
          if (doc.getElementsByTagName('parsererror').length > 0) {
            parseError = 'Lỗi cú pháp XML. Vui lòng kiểm tra lại cấu trúc đóng mở các thẻ XML.';
          }
        } catch (e) {
          parseError = 'Trình duyệt không hỗ trợ phân tích XML thô.';
        }

        const getTagVal = (parent: Element | Document | null, name: string): string => {
          if (!parent) return '';
          const el = parent.getElementsByTagName(name)[0];
          return el ? (el.textContent || '').trim() : '';
        };

        const nbanNode = doc ? doc.getElementsByTagName('NBan')[0] : null;
        const nmuaNode = doc ? doc.getElementsByTagName('NMua')[0] : null;
        const ttoanNode = doc ? doc.getElementsByTagName('TToan')[0] : null;
        const ttchungNode = doc ? doc.getElementsByTagName('TTChung')[0] : null;
        const sigNode = doc ? doc.getElementsByTagName('Signature')[0] : null;

        // Header
        const shDon = getTagVal(ttchungNode, 'SHDon');
        const khmshDon = getTagVal(ttchungNode, 'KHMSHDon');
        const khhDon = getTagVal(ttchungNode, 'KHHDon');
        const nLap = getTagVal(ttchungNode, 'NLap');
        const dvtTe = getTagVal(ttchungNode, 'DVTTe') || 'VND';

        // Entities
        const sellerName = getTagVal(nbanNode, 'Ten');
        const sellerMst = getTagVal(nbanNode, 'MST');
        const sellerAddr = getTagVal(nbanNode, 'DChi');

        const buyerName = getTagVal(nmuaNode, 'Ten');
        const buyerMst = getTagVal(nmuaNode, 'MST');
        const buyerAddr = getTagVal(nmuaNode, 'DChi');

        // Items Extraction
        const items: any[] = [];
        if (doc) {
          const itemElements = doc.getElementsByTagName('HDonChiTiet');
          for (let i = 0; i < itemElements.length; i++) {
            const el = itemElements[i];
            items.push({
              stt: getTagVal(el, 'STT'),
              name: getTagVal(el, 'TenHVDV'),
              dvt: getTagVal(el, 'DVT'),
              sLuong: parseFloat(getTagVal(el, 'SLuong')) || 0,
              dGia: parseFloat(getTagVal(el, 'DGia')) || 0,
              thTien: parseFloat(getTagVal(el, 'ThTien')) || 0,
              tSuat: getTagVal(el, 'TSuat')
            });
          }
        }

        // Financial summary
        const totalBeforeTax = parseFloat(getTagVal(ttoanNode, 'TgTCThue')) || 0;
        const totalTax = parseFloat(getTagVal(ttoanNode, 'TgTThue')) || 0;
        const totalPayable = parseFloat(getTagVal(ttoanNode, 'TgTTTBSo')) || 0;
        const totalPayableWords = getTagVal(ttoanNode, 'TgTTTBChu');

        // Compliance Auditing calculations
        const signatureExists = !!sigNode && getTagVal(sigNode, 'CertificateSerial').length > 0;
        const signingTime = sigNode ? getTagVal(sigNode, 'SigningTime') : '';
        const certSerial = sigNode ? getTagVal(sigNode, 'CertificateSerial') : '';
        const certSubject = sigNode ? getTagVal(sigNode, 'Subject') : '';

        // MST checkers
        const cleanMst = (mst: string) => mst.replace(/[^\d-]/g, '');
        const isMstValid = (mst: string) => {
          const c = cleanMst(mst);
          return /^\d{10}$/.test(c) || /^\d{10}-\d{3}$/.test(c);
        };

        const isSellerMstOk = isMstValid(sellerMst);
        const isBuyerMstOk = buyerMst ? isMstValid(buyerMst) : true; // Buyer can be individual with no MST

        // Math test
        const computedBeforeTaxSum = items.reduce((acc, it) => acc + it.thTien, 0);
        const hasMathBeforeTaxDiscrepancy = Math.abs(computedBeforeTaxSum - totalBeforeTax) > 10;
        const expectedPayable = totalBeforeTax + totalTax;
        const hasMathPayableDiscrepancy = Math.abs(expectedPayable - totalPayable) > 10;

        const passesAudit = !parseError && signatureExists && isSellerMstOk && isBuyerMstOk && !hasMathBeforeTaxDiscrepancy && !hasMathPayableDiscrepancy;

        return (
          <div className="space-y-6 mt-6 animate-fade-in text-left">
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                    THÔNG TƯ 78/2021/TT-BTC &amp; NGHỊ ĐỊNH 123/2020/NĐ-CP
                  </span>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    🛡️ Hệ Thống Thẩm Định Hóa Đơn Điện Tử Quốc Gia (XML Sandbox)
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-4xl">
                    Hệ thống trích xuất dữ liệu, định cấu trúc thẻ XML hóa đơn điện tử theo đặc tả kỹ thuật của Tổng Cục Thuế Việt Nam, tự động hóa hạch toán đối chiếu với sổ sách kế toán kép chỉ trong tích tắc.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start lg:self-center">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border ${
                    passesAudit 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {passesAudit ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ĐẠT CHUẨN KÊ KHAI (HỢP LỆ)
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
                        CẢNH BÁO RỦI RO THUẾ
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Grid 2 Columns */}
              <div className="grid lg:grid-cols-12 gap-6 pt-2">
                
                {/* Column 1: XML Input & Presets */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10.5px] text-slate-400 font-bold block uppercase font-mono tracking-wider">
                      Chọn kịch bản hóa đơn mô phỏng:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setXmlText(XML_INVOICE_TEMPLATES.valid_8pct);
                          setXmlValidatorStatusMsg('Đã nạp Hóa đơn Dịch vụ số hợp lệ (VAT 8% giảm giá theo Nghị định 72)');
                        }}
                        className={`px-2 py-2 rounded-xl border text-[10.5px] font-black leading-tight text-left transition-all cursor-pointer ${
                          xmlText === XML_INVOICE_TEMPLATES.valid_8pct
                            ? 'bg-sky-500/15 border-sky-550 text-sky-400'
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                        }`}
                      >
                        ✅ Mẫu 01: Chuẩn 8% VAT
                      </button>

                      <button
                        onClick={() => {
                          setXmlText(XML_INVOICE_TEMPLATES.invalid_mst);
                          setXmlValidatorStatusMsg('Đã nạp kịch bản Hóa đơn lỗi định dạng Mã Số Thuế (MST) người bán.');
                        }}
                        className={`px-2 py-2 rounded-xl border text-[10.5px] font-black leading-tight text-left transition-all cursor-pointer ${
                          xmlText === XML_INVOICE_TEMPLATES.invalid_mst
                            ? 'bg-rose-500/15 border-rose-550 text-rose-400'
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                        }`}
                      >
                        ⚠️ Mẫu 02: Lỗi Sai MST
                      </button>

                      <button
                        onClick={() => {
                          setXmlText(XML_INVOICE_TEMPLATES.math_error);
                          setXmlValidatorStatusMsg('Đã nạp kịch bản lỗi sai lệch số liệu toán học giữa tổng tiền gốc và thuế VAT.');
                        }}
                        className={`px-2 py-2 rounded-xl border text-[10.5px] font-black leading-tight text-left transition-all cursor-pointer ${
                          xmlText === XML_INVOICE_TEMPLATES.math_error
                            ? 'bg-amber-500/15 border-amber-550 text-amber-400'
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                        }`}
                      >
                        🧮 Mẫu 03: Sai lệch Số Liệu
                      </button>

                      <button
                        onClick={() => {
                          setXmlText(XML_INVOICE_TEMPLATES.missing_sig);
                          setXmlValidatorStatusMsg('Đã nạp kịch bản Hóa đơn thiếu Chữ ký số (Signature) pháp lý.');
                        }}
                        className={`px-2 py-2 rounded-xl border text-[10.5px] font-black leading-tight text-left transition-all cursor-pointer ${
                          xmlText === XML_INVOICE_TEMPLATES.missing_sig
                            ? 'bg-purple-500/15 border-purple-550 text-purple-400'
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                        }`}
                      >
                        🔏 Mẫu 04: Chưa Ký Số
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] text-slate-450 font-bold uppercase font-mono tracking-wider">
                        Mã Nguồn XML Hóa Đơn Thô:
                      </label>
                      <span className="text-[9px] text-slate-500 font-mono">Dựa trên TT78 XML Schema</span>
                    </div>
                    <textarea
                      value={xmlText}
                      onChange={(e) => {
                        setXmlText(e.target.value);
                        setXmlValidatorStatusMsg('Đã cập nhật thay đổi XML thủ công. Hệ thống tự động re-parse...');
                      }}
                      className="w-full h-[320px] bg-slate-950 border border-slate-900 rounded-xl p-3 text-[10px] font-mono text-cyan-400/90 leading-relaxed focus:border-slate-800 focus:outline-none selection:bg-cyan-950"
                      spellCheck={false}
                      placeholder="Nhập mã nguồn XML hóa đơn cần thẩm định..."
                    />
                  </div>

                  {xmlValidatorStatusMsg && (
                    <div className="p-2.5 bg-sky-500/5 border border-sky-500/10 rounded-xl text-[10px] text-sky-400 font-semibold leading-relaxed">
                      💡 {xmlValidatorStatusMsg}
                    </div>
                  )}
                </div>

                {/* Column 2: Extracted Data & Compliance Reports */}
                <div className="lg:col-span-8 flex flex-col space-y-4">
                  {parseError ? (
                    <div className="p-10 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                      <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">Mã Lỗi Phân Tích Cú Pháp XML</h4>
                      <p className="text-xs text-slate-400 leading-normal max-w-sm font-semibold">
                        {parseError}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden flex-1 min-h-[480px] grid grid-rows-12">
                      
                      {/* Sub-Header Tabs inside Column 2 */}
                      <div className="row-span-1 border-b border-slate-900 px-5 flex items-center justify-between text-xs font-bold my-auto py-3 bg-slate-950">
                        <span className="text-white">BẢN THẨM ĐỊNH CHI TIẾT TỔNG CỤC THUẾ</span>
                        <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1.5">
                          <span>MÃ TRA CỨU HĐĐT:</span>
                          <strong className="text-white font-black">LF-F9937402847</strong>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="row-span-11 p-5 overflow-y-auto space-y-5 text-xs">
                        
                        {/* Audit checklists */}
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-mono">Bảng Kiểm Định Tuân Thủ Pháp Lý:</h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            
                            {/* Check item 1 */}
                            <div className={`p-3 border rounded-xl flex items-start gap-2.5 ${
                              signatureExists 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : 'bg-rose-500/5 border-rose-550'
                            }`}>
                              <span className={`p-1.5 rounded-lg text-xs leading-none shrink-0 ${
                                signatureExists ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                              }`}>
                                {signatureExists ? '🟢' : '🔴'}
                              </span>
                              <div className="space-y-0.5 text-left">
                                <span className="font-extrabold text-white block">Xác thực Chữ ký số (Digital Stamp)</span>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                  {signatureExists 
                                    ? `Chứng thư PKI hợp lệ. Serial: ${certSerial.substring(0, 16)}...` 
                                    : 'Thiếu hoặc lỗi chữ ký số của người bán. Hóa đơn không có giá trị khai thuế.'}
                                </p>
                              </div>
                            </div>

                            {/* Check item 2 */}
                            <div className={`p-3 border rounded-xl flex items-start gap-2.5 ${
                              isSellerMstOk 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : 'bg-rose-500/5 border-rose-550'
                            }`}>
                              <span className={`p-1.5 rounded-lg text-xs leading-none shrink-0 ${
                                isSellerMstOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                              }`}>
                                {isSellerMstOk ? '🟢' : '🔴'}
                              </span>
                              <div className="space-y-0.5 text-left">
                                <span className="font-extrabold text-white block">Mã số thuế Người bán (MST)</span>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                  {isSellerMstOk 
                                    ? `MST: ${sellerMst} hợp chuẩn cấu trúc General Department of Taxation.` 
                                    : `Sai định dạng MST người bán (${sellerMst}). Yêu cầu cấu trúc 10 hoặc 13 chữ số.`}
                                </p>
                              </div>
                            </div>

                            {/* Check item 3 */}
                            <div className={`p-3 border rounded-xl flex items-start gap-2.5 ${
                              !hasMathBeforeTaxDiscrepancy 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : 'bg-rose-500/5 border-rose-550'
                            }`}>
                              <span className={`p-1.5 rounded-lg text-xs leading-none shrink-0 ${
                                !hasMathBeforeTaxDiscrepancy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                              }`}>
                                {!hasMathBeforeTaxDiscrepancy ? '🟢' : '🔴'}
                              </span>
                              <div className="space-y-0.5 text-left">
                                <span className="font-extrabold text-white block">Đối chiếu số tiền trước thuế</span>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                  {!hasMathBeforeTaxDiscrepancy 
                                    ? `Trùng khớp 100% giữa tổng chi tiết hàng hoá và thẻ tổng toán (${totalBeforeTax.toLocaleString()}đ)`
                                    : `Lệch số liệu! Tổng hàng hoá là ${computedBeforeTaxSum.toLocaleString()}đ nhưng thẻ reported là ${totalBeforeTax.toLocaleString()}đ.`}
                                </p>
                              </div>
                            </div>

                            {/* Check item 4 */}
                            <div className={`p-3 border rounded-xl flex items-start gap-2.5 ${
                              !hasMathPayableDiscrepancy 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : 'bg-rose-500/5 border-rose-550'
                            }`}>
                              <span className={`p-1.5 rounded-lg text-xs leading-none shrink-0 ${
                                !hasMathPayableDiscrepancy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                              }`}>
                                {!hasMathPayableDiscrepancy ? '🟢' : '🔴'}
                              </span>
                              <div className="space-y-0.5 text-left">
                                <span className="font-extrabold text-white block">Hạch toán số tiền phải thanh toán</span>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                  {!hasMathPayableDiscrepancy 
                                    ? `Tổng cộng thanh toán khớp hoàn toàn gốc + VAT tax (${totalPayable.toLocaleString()}đ).`
                                    : `Thất thoát hoặc thừa thãi! Gốc + VAT là ${expectedPayable.toLocaleString()}đ nhưng thẻ đòi tiền là ${totalPayable.toLocaleString()}đ.`}
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Invoice Visualization Layout (Vietnamese Style PDF print simulation) */}
                        <div className="space-y-2 text-left">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-mono">Bản Thể Hiện Hóa Đơn Trực Quan (Invoice PDF Preview):</span>
                          
                          <div className="bg-[#fcfbf9] border border-stone-200 text-stone-900 rounded-2xl p-5 shadow-inner space-y-4 font-sans max-w-full">
                            <div className="grid grid-cols-12 gap-2 border-b border-stone-300 pb-4">
                              <div className="col-span-8 flex items-start gap-2 text-left">
                                <div className="w-10 h-10 bg-amber-600/10 border border-amber-600/30 rounded-xl flex items-center justify-center text-lg shrink-0 font-bold text-amber-700">
                                  HĐ
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className="font-black text-[12px] text-[indigo-950] tracking-tight text-stone-950">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h4>
                                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">MẪU CỦA TỔNG CỤC THUẾ VIỆT NAM</p>
                                </div>
                              </div>
                              <div className="col-span-4 text-right space-y-0.5 text-[10px] font-semibold text-stone-700">
                                <div className="flex justify-between">
                                  <span>Mẫu số:</span>
                                  <strong className="font-bold text-stone-950">{khmshDon || '1'}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ký hiệu:</span>
                                  <strong className="font-bold text-stone-950">{khhDon || 'C26TAA'}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Số hđ:</span>
                                  <strong className="font-black text-rose-650 text-[11px]">{shDon || '0000000'}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ngày lập:</span>
                                  <strong className="font-bold text-stone-950">{nLap || '---'}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Seller vs Buyer details */}
                            <div className="grid sm:grid-cols-2 gap-4 text-[10.5px] border-b border-stone-300 pb-4">
                              <div className="space-y-1 text-left">
                                <span className="text-[9px] font-black text-amber-800 tracking-wider uppercase block font-sans">ĐƠN VỊ CUNG CẤP TRỰC TIẾP (SELLER)</span>
                                <strong className="font-bold text-stone-950 block leading-tight">{sellerName || '---'}</strong>
                                <p className="text-stone-600"><span className="text-stone-450 font-bold">Mã Số Thuế:</span> <strong className="text-stone-900 font-extrabold">{sellerMst || '---'}</strong></p>
                                <p className="text-stone-500 leading-normal">{sellerAddr || '---'}</p>
                              </div>

                              <div className="space-y-1 text-left border-t sm:border-t-0 sm:border-l border-stone-200 pt-3 sm:pt-0 sm:pl-4">
                                <span className="text-[9px] font-black text-blue-800 tracking-wider uppercase block font-sans">ĐƠN VỊ MUA HÀNG HẠCH TOÁN (BUYER)</span>
                                <strong className="font-bold text-stone-950 block leading-tight">{buyerName || '---'}</strong>
                                <p className="text-stone-600"><span className="text-stone-450 font-bold">Mã Số Thuế:</span> <strong className="text-stone-900 font-extrabold">{buyerMst || 'Không bắt buộc'}</strong></p>
                                <p className="text-stone-500 leading-normal">{buyerAddr || '---'}</p>
                              </div>
                            </div>

                            {/* Itemized Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[10px] text-stone-700 leading-relaxed border-collapse">
                                <thead>
                                  <tr className="border-b border-stone-300 text-stone-900 uppercase font-black text-[9px] tracking-wider">
                                    <th className="py-2.5 w-10">STT</th>
                                    <th className="py-2.5">Tên Sản Phẩm / Dịch Vụ</th>
                                    <th className="py-2.5 w-12 text-center">ĐVT</th>
                                    <th className="py-2.5 w-12 text-center">SL</th>
                                    <th className="py-2.5 text-right w-24">Đơn Giá</th>
                                    <th className="py-2.5 text-right w-24">Thành Tiền</th>
                                    <th className="py-2.5 text-right w-12">Tax</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200">
                                  {items.length === 0 ? (
                                    <tr>
                                      <td colSpan={7} className="py-4 text-center text-stone-400 font-semibold italic">Không phát hiện chi tiết dòng sản phẩm</td>
                                    </tr>
                                  ) : (
                                    items.map((it, idx) => (
                                      <tr key={idx} className="hover:bg-stone-50 text-stone-900 font-medium">
                                        <td className="py-2.5 text-stone-400 font-mono font-bold">{it.stt || (idx + 1)}</td>
                                        <td className="py-2.5 font-bold text-stone-950 text-left leading-normal">{it.name}</td>
                                        <td className="py-2.5 text-center text-stone-600 font-bold">{it.dvt}</td>
                                        <td className="py-2.5 text-center text-stone-900 font-mono font-bold">{it.sLuong}</td>
                                        <td className="py-2.5 text-right text-stone-900 font-mono">{it.dGia.toLocaleString()}</td>
                                        <td className="py-2.5 text-right text-stone-950 font-mono font-bold">{it.thTien.toLocaleString()}</td>
                                        <td className="py-2.5 text-right text-emerald-700 font-mono font-extrabold">{it.tSuat}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Aggregates block */}
                            <div className="grid grid-cols-12 gap-3 pt-3 border-t border-stone-300 text-[10.5px]">
                              <div className="col-span-7 text-left space-y-1">
                                <span className="text-[8.5px] font-black text-stone-400 block tracking-wider uppercase font-sans">Lời văn thanh toán (Amount in words):</span>
                                <p className="text-stone-700 font-black italic first-letter:uppercase">"{totalPayableWords || '---'}"</p>
                              </div>
                              <div className="col-span-5 text-right space-y-1 text-stone-700 font-semibold">
                                <div className="flex justify-between">
                                  <span>Cộng tiền hàng:</span>
                                  <strong className="text-stone-950 font-mono">{totalBeforeTax.toLocaleString()}đ</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tiền thuế GTGT:</span>
                                  <strong className="text-stone-950 font-mono">{totalTax.toLocaleString()}đ</strong>
                                </div>
                                <div className="flex justify-between border-t border-stone-200 pt-1 text-stone-950 text-[11.5px] font-extrabold">
                                  <span className="text-stone-900 font-bold">Tổng thanh toán:</span>
                                  <strong className="text-rose-700 font-mono">{totalPayable.toLocaleString()}đ</strong>
                                </div>
                              </div>
                            </div>

                            {/* Signature Stamp box simulation */}
                            <div className="flex justify-between pt-4 gap-2 text-[10px]">
                              <div className="text-center w-max">
                                <span className="text-stone-400 block font-bold">Người mua hàng</span>
                                <span className="text-stone-450 italic mt-2.5 block text-[9px]">(Ký, ghi rõ họ tên)</span>
                              </div>
                              <div className="text-center w-max pr-3">
                                <span className="text-stone-400 block font-bold">Người bán hàng</span>
                                <span className="text-stone-450 italic block text-[9px] mb-1.5">(Ký điện tử bởi phát hành)</span>
                                
                                {signatureExists ? (
                                  <div className="p-2 border-2 border-red-550 bg-red-50 text-red-700 rounded-lg text-center leading-normal max-w-[210px] space-y-0.5 animate-pulse shrink-0">
                                    <strong className="font-black text-[9.5px] block uppercase text-red-800 tracking-wider">KÝ ĐIỆN TỬ HỢP LỆ</strong>
                                    <p className="text-[8px] font-mono text-left block leading-normal truncate">CN: {certSubject || '---'}</p>
                                    <p className="text-[8px] font-mono text-left block leading-none">Serial: {certSerial.substring(0, 16)}...</p>
                                    <p className="text-[8px] font-mono text-left block leading-none">Time: {signingTime}</p>
                                  </div>
                                ) : (
                                  <div className="p-2.5 border border-dashed border-stone-350 text-stone-450 rounded-lg text-center leading-normal italic text-[9px]">
                                    Chưa được ký số phát hành
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
