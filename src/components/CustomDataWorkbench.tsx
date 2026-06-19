import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import CustomDataWorkbenchDeepDivePanel from './CustomDataWorkbenchDeepDivePanel';
import { 
  Database, 
  Terminal, 
  Settings, 
  Plus, 
  Check, 
  Trash2, 
  Copy, 
  FileText, 
  Sparkles, 
  Table, 
  RefreshCw, 
  Code, 
  Briefcase, 
  FileDown, 
  Upload, 
  AlertCircle,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Activity,
  User,
  Coins,
  ShieldCheck
} from 'lucide-react';

interface ParsedTable {
  id: string;
  tableName: string;
  description: string;
  columns: { name: string; type: string; constraints?: string; description: string }[];
  rows: Record<string, any>[];
  sqlDef: string;
}

interface LFUser {
  id: string;
  fullName: string;
  role: 'Solo Founder' | 'Kế toán trưởng' | 'Lead Developer' | 'QA Engineer';
  email: string;
  status: 'Active' | 'Inactive';
}

interface LFProject {
  id: string;
  name: string;
  platform: 'Web App' | 'WebGL Game' | 'Mobile App' | 'Desktop App';
  status: 'GDD' | 'Prototype' | 'Beta' | 'Release';
  budget: number;
  ownerId: string;
  createdAt: string;
}

interface LFTransaction {
  id: string;
  projectId: string;
  amount: number;
  type: 'Thu' | 'Chi';
  gateway: 'VietQR' | 'MoMo' | 'Stripe' | 'Tiền mặt';
  date: string;
}

interface LFAsset {
  id: string;
  filename: string;
  type: 'PNG Image' | 'Binary Model' | 'Excel Sheet' | 'YAML Config' | 'CJS Bundle';
  size: number;
  projectId: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Từ năm 2022-2026, chính phủ hỗ trợ giảm thuế GTGT đầu vào từ 10% xuống 8% cho nhiều nhóm ngành (Trừ chứng khoán, viễn thông, CNTT...). Khi dọn dẹp cột 'vat_rate' từ hóa đơn thô chứa các giá trị '8%', '10%' và rỗng, lập trình viên kế toán nên xử lý thế nào là chuẩn nhất?",
    options: [
      "Mặc định chuyển tất cả về 10% để kê khai thuế cho nhanh chóng.",
      "Làm sạch khoảng trắng, chuẩn hóa thành kiểu số nguyên rọc (8 hoặc 10). Nếu giá trị rỗng hoặc định dạng sai lệch, gán mặc định dựa trên diện mặt hàng và ghi nhận cảnh báo kiểm toán.",
      "Bỏ qua hoàn toàn dòng đó không phân tích nữa để tránh mất thời gian xử lý chuỗi."
    ],
    correctIdx: 1,
    explanation: "Chính xác tuyệt đối! Việc chuẩn hóa thành kiểu số nguyên tinh chuẩn (8 hoặc 10) giúp tính toán nhân nhẩm tự động số tiền thuế chính xác. Đối với các dòng bị rỗng, lập trình viên cần thiết lập fallback thông minh dựa vào danh mục mô tả mặt hàng ban đầu."
  },
  {
    question: "Tại sao lệnh Pandas bột phát dạng 'df[\"amount\"].astype(int)' lại thường xuyên vấp lỗi ValueError khi phân tích tệp sao kê ngân hàng VCB thô tại Việt Nam?",
    options: [
      "Vì hệ thống máy tính máy chủ Việt Nam không tương thích cấu trúc định dạng với nền tảng Python.",
      "Vì dữ liệu tiền tệ thô thường chứa các ký tự đặc biệt phân tách (như dấu '.' hoặc ','), chữ cái 'đ', 'VND', khoảng trắng bọc ngoài, hoặc ô rỗng (NaN). Cần dùng Regex làm sạch trước.",
      "Vì Python chỉ hỗ trợ số tiền nhỏ dưới một triệu, không hỗ trợ định lượng tiền tệ quy mô Việt Nam đồng lên tới hàng tỷ."
    ],
    correctIdx: 1,
    explanation: "Chuẩn xác! Cột dữ liệu tiền VNĐ thô cực kỳ lộn xộn, điển hình là '15.500.000 đ' hay ' 3,500,000'. Trình dọn dẹp dữ liệu phải bóc tách tất cả ký hiệu phi số bằng regex hoặc chuỗi lọc trước khi ép sang Int64."
  },
  {
    question: "Trong nghiệp vụ thiết lập Sổ cái (General Ledger) cho công ty Việt Nam, khi nhận dòng tiền thanh toán dịch vụ bằng Chuyển khoản, bút toán định khoản kế toán kép ghi nhận thế nào?",
    options: [
      "Ghi nhận tăng tài sản tiền gửi: Ghi Nợ TK 112 (Tiền gửi ngân hàng) / Ghi Có TK 511 (Doanh thu bán hàng).",
      "Ghi nhận giảm dòng vốn: Ghi Có TK 112 (Tiền gửi ngân hàng) / Ghi Nợ TK 632 (Giá vốn hàng bán).",
      "Ghi nhận tăng nợ xấu: Ghi Có TK 331 (Phải trả người bán) / Ghi Nợ TK 131 (Phải thu khách hàng)."
    ],
    correctIdx: 0,
    explanation: "Tuyệt vời! Theo quy tắc kế toán kép Việt Nam (Thông tư 200/133), phát sinh tăng tài khoản tài sản (111, 112) ghi bên Nợ, còn phát sinh tăng doanh thu (511) ghi bên Có."
  },
  {
    question: "Mã tài khoản kế toán nào đại diện diện cho 'Giá vốn hàng bán' (Cost of Goods Sold - COGS) làm căn cứ đối chuẩn chênh lệch lãi gộp cho Solo Founder Việt Nam?",
    options: [
      "Tài khoản 511 (Doanh thu)",
      "Tài khoản 642 (Chi phí quản lý doanh nghiệp)",
      "Tài khoản 632 (Giá vốn hàng bán)"
    ],
    correctIdx: 2,
    explanation: "Chính xác! Tài khoản 632 ghi nhận toàn bộ giá vốn của hàng hóa, sản phẩm hoặc dịch vụ đã tiêu thụ trong kỳ, trực tiếp làm nền tính Biên lợi nhuận gộp cùng TK 511."
  },
  {
    question: "Thiết kế Star Schema (Mô hình sao) phân tách Fact (Mã hóa đơn) và Dimension (Mã tài khoản, Ngày tháng) nhằm giải quyết mục tiêu cốt lõi gì cho hệ thống quản trị?",
    options: [
      "Giúp sơ đồ trông phức tạp hơn để gây ấn tượng với các nhà đầu tư.",
      "Tối ưu hóa hiệu năng truy vấn SQL SELECT tổng hợp khối lượng lớn (như tính MRR, ARR, dòng tiền), cô lập thay đổi dữ liệu danh mục thô, và giúp việc bảo trì Sổ độc lập thuận tiện.",
      "Là quy chế pháp lý bắt buộc tuyệt đối do Bộ Tài chính bắt Solo Founder khai báo."
    ],
    correctIdx: 1,
    explanation: "Chất lượng cao! Phân rã dữ liệu thành các chiều đo lường (Fact) và chiều mô tả (Dimension) là phương pháp vàng giúp triệt tiêu trễ cơ sở dữ liệu lớn và thiết kế BI Dashboard mượt mà."
  }
];

const PIPELINE_STEPS = [
  {
    title: "1. Raw Source Logs",
    desc: "Sao kê VCB thô lộn xộn, hóa đơn đỏ VAT XML, Log POS bán lẻ.",
    icon: Upload,
    status: "Đầu vào dạng rác",
    focus: "Phát sinh từ hoạt động thực tế. Dữ liệu thô thường chứa lỗi dán dòng, khoảng trắng bọc đầu đuôi, thiếu hụt cột, và lộn xộn định dạng ngày giờ.",
    vietStandard: "Hóa đơn giá trị gia tăng điện tử (e-Invoice), Phiếu thu chi, Sao kê ngân hàng."
  },
  {
    title: "2. ELT & Pandas Clean",
    desc: "Bóc chuỗi regex, lọc trùng lặp bản ghi, bẫy dòng rỗng xử lý NaN.",
    icon: RefreshCw,
    status: "Trình chuẩn hóa ròng",
    focus: "Mã Python Pandas hoặc JS dọn dẹp chuỗi biến động số dư, ép chuỗi tiền '12.000.000đ' thành số 12000000 nguyên bản, ghép múi giờ UTC+7 tiêu chuẩn.",
    vietStandard: "Đối chiếu mã hóa số kiểm soát theo mẫu hóa đơn Tổng cục Thuế."
  },
  {
    title: "3. Double-Entry Auto",
    desc: "Công cụ phân loại tự động định khoản tài khoản kép Nợ - Có.",
    icon: Layers,
    status: "Bút toán định khoản",
    focus: "Ánh xạ từ mô tả nội dung thô (như 'Thu tien bill' -> Auto Ghi Nợ TK 112 / Có TK 511 hoặc 131) giúp quy đổi dữ liệu dẹt thương mại thành kế toán kép chuẩn.",
    vietStandard: "Hệ thống tài khoản ròng theo Thông tư 200/133 của Bộ Tài chính Việt Nam."
  },
  {
    title: "4. DW Fact & Dim tables",
    desc: "Quét Star Schema, chạy SQL SELECT tính Lãi gộp / Cơ cấu chi phí.",
    icon: Database,
    status: "Cất kho & Phân tích",
    focus: "Lưu dữ liệu cân bằng vào bảng Fact chính thức kết nối bảng Dimension (bảng Khách hàng, bảng Tài khoản). Người dùng trực tiếp gõ SQL SELECT kiểm định báo cáo.",
    vietStandard: "Báo cáo kết quả hoạt động KD (B02-DN), Báo cáo Lưu chuyển tiền tệ (B03-DN)."
  }
];

export default function CustomDataWorkbench() {
  const [tableName, setTableName] = useState<string>('custom_invoices');
  const [tableDesc, setTableDesc] = useState<string>('Bảng chứa tài liệu hóa đơn tự nhập phục vụ kiểm toán nội bộ.');
  const [rawText, setRawText] = useState<string>(`so_hoa_don,ngay_giao_dich,noi_dung,tri_gia,thue_suat
HD-2026-001,2026-05-15,Mua gạch ốp lát Vietceramic,12000000,10
HD-2026-002,2026-05-18,Nhập cát san lấp đợt 2,35000000,8
HD-2026-003,2026-05-20,Chi tiếp khách hàng dự án Hà Nội,4500000,0
HD-2026-004,2026-05-22,Mua máy tính văn phòng Asus,18500000,10
HD-2026-005,2026-05-25,Thuê nhân công dọn dẹp vệ sinh,11000000,KK`);
  
  const [inputType, setInputType] = useState<'csv' | 'json'>('csv');
  const [parsedData, setParsedData] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [registeredTables, setRegisteredTables] = useState<ParsedTable[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'sql' | 'pandas' | 'prompt'>('sql');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Workspace sub-tabs (PHÂN HỆ 1: RAW DATA CLEAN / PHÂN HỆ 2: RDBMS MANAGER)
  const [workspaceMode, setWorkspaceMode] = useState<'parser' | 'rdbms' | 'deepdive'>('parser');
  const [activeDbTab, setActiveDbTab] = useState<'users' | 'projects' | 'transactions' | 'assets'>('projects');

  // Relational Local DB
  const [dbUsers, setDbUsers] = useState<LFUser[]>(() => {
    try {
      const saved = localStorage.getItem('lf_db_users');
      return saved ? JSON.parse(saved) : [
        { id: 'user-1', fullName: "Nguyễn Solo Founder", role: 'Solo Founder', email: "founder@ledgerflow.vn", status: 'Active' },
        { id: 'user-2', fullName: "Lê Kế Toán", role: 'Kế toán trưởng', email: "accounting@ledgerflow.vn", status: 'Active' },
        { id: 'user-3', fullName: "Trần Dev", role: 'Lead Developer', email: "dev@ledgerflow.vn", status: 'Active' }
      ];
    } catch (_) {
      return [];
    }
  });

  const [dbProjects, setDbProjects] = useState<LFProject[]>(() => {
    try {
      const saved = localStorage.getItem('lf_db_projects');
      return saved ? JSON.parse(saved) : [
        { id: 'proj-1', name: "LedgerFlow Studio Dashboard", platform: 'Web App', status: 'Beta', budget: 150000000, ownerId: 'user-1', createdAt: '2026-05-01' },
         { id: 'proj-2', name: "Flappy Bird ML AI Game", platform: 'WebGL Game', status: 'Release', budget: 45000000, ownerId: 'user-3', createdAt: '2026-05-10' },
        { id: 'proj-3', name: "VietNam Taxes Toolkit", platform: 'Mobile App', status: 'Prototype', budget: 75000000, ownerId: 'user-2', createdAt: '2026-05-15' }
      ];
    } catch (_) {
      return [];
    }
  });

  const [dbTransactions, setDbTransactions] = useState<LFTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('lf_db_transactions');
      return saved ? JSON.parse(saved) : [
        { id: 'tx-1', projectId: 'proj-1', amount: 120000000, type: 'Thu', gateway: 'Stripe', date: '2026-05-01' },
        { id: 'tx-2', projectId: 'proj-2', amount: 15000000, type: 'Thu', gateway: 'VietQR', date: '2026-05-15' },
        { id: 'tx-3', projectId: 'proj-1', amount: 24000500, type: 'Chi', gateway: 'Tiền mặt', date: '2026-05-18' },
        { id: 'tx-4', projectId: 'proj-3', amount: 8500000, type: 'Chi', gateway: 'MoMo', date: '2026-05-22' }
      ];
    } catch (_) {
      return [];
    }
  });

  const [dbAssets, setDbAssets] = useState<LFAsset[]>(() => {
    try {
      const saved = localStorage.getItem('lf_db_assets');
      return saved ? JSON.parse(saved) : [
        { id: 'asset-1', filename: "hero_banner.png", type: 'PNG Image', size: 2048, projectId: 'proj-1' },
        { id: 'asset-2', filename: "nn_weights.bin", type: 'Binary Model', size: 40960, projectId: 'proj-2' },
        { id: 'asset-3', filename: "tax_schedule_2026.xlsx", type: 'Excel Sheet', size: 512, projectId: 'proj-3' }
      ];
    } catch (_) {
      return [];
    }
  });

  // DB Sync Effect
  useEffect(() => {
    localStorage.setItem('lf_db_users', JSON.stringify(dbUsers));
  }, [dbUsers]);

  useEffect(() => {
    localStorage.setItem('lf_db_projects', JSON.stringify(dbProjects));
  }, [dbProjects]);

  useEffect(() => {
    localStorage.setItem('lf_db_transactions', JSON.stringify(dbTransactions));
  }, [dbTransactions]);

  useEffect(() => {
    localStorage.setItem('lf_db_assets', JSON.stringify(dbAssets));
  }, [dbAssets]);

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Convert projects to worksheet
      const projectsWS = XLSX.utils.json_to_sheet(dbProjects.map(p => ({
        "ID": p.id,
        "Ten Du An": p.name,
        "Nen Tang": p.platform,
        "Trang Thai": p.status,
        "Ngan Sach (VND)": p.budget,
        "Ma Truong Du An": p.ownerId
      })));
      XLSX.utils.book_append_sheet(workbook, projectsWS, "Du An");

      // Convert users to worksheet
      const usersWS = XLSX.utils.json_to_sheet(dbUsers.map(u => ({
        "ID": u.id,
        "Ho Ten": u.fullName,
        "Vai Tro": u.role,
        "Email": u.email,
        "Trang Thai": u.status
      })));
      XLSX.utils.book_append_sheet(workbook, usersWS, "Nhan Su");

      // Convert transactions to worksheet
      const txWS = XLSX.utils.json_to_sheet(dbTransactions.map(t => ({
        "ID": t.id,
        "Ma Du An": t.projectId,
        "So Tiền (VND)": t.amount,
        "Phan Loai": t.type,
        "Cong Thanh Toan": t.gateway,
        "Ngay Giao Dich": t.date
      })));
      XLSX.utils.book_append_sheet(workbook, txWS, "Giao Dich So Cai");

      // Convert assets to worksheet
      const assetsWS = XLSX.utils.json_to_sheet(dbAssets.map(a => ({
        "ID": a.id,
        "Ten File": a.filename,
        "Dinh Dang": a.type,
        "Kich Thuoc (KB)": a.size,
        "Ma Du An": a.projectId
      })));
      XLSX.utils.book_append_sheet(workbook, assetsWS, "Tài Nguyên File");

      XLSX.writeFile(workbook, "LedgerFlow_Database_Full_Export.xlsx");
    } catch (e: any) {
      alert("Lỗi xuất Excel: " + (e.message || e));
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("LEDGERFLOW STUDIO - BAO CAO CO SO DU LIEU", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Ngay xuat: ${new Date().toLocaleString('vi-VN')}`, 14, 28);
      
      let y = 38;
      
      if (activeDbTab === 'transactions') {
        doc.setFont("helvetica", "bold");
        doc.text("DANH SACH GIAO DICH SO CAI", 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        dbTransactions.forEach((t, i) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${i + 1}. [TX] ID: ${t.id} | Loai: ${t.type} | Cong: ${t.gateway} | Tien: ${t.amount.toLocaleString()} VND | Ngay: ${t.date}`, 14, y);
          y += 7;
        });
      } else if (activeDbTab === 'projects') {
        doc.setFont("helvetica", "bold");
        doc.text("DANH SACH DU AN KHOI NGHIEP", 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        dbProjects.forEach((p, i) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${i + 1}. [PJ] ID: ${p.id} | Ten: ${p.name} | Nen tang: ${p.platform} | Ngan sach: ${p.budget.toLocaleString()} VND | Trang thai: ${p.status}`, 14, y);
          y += 7;
        });
      } else if (activeDbTab === 'users') {
        doc.setFont("helvetica", "bold");
        doc.text("DANH SACH NHAN SU", 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        dbUsers.forEach((u, i) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${i + 1}. [US] ID: ${u.id} | Ho ten: ${u.fullName} | Role: ${u.role} | Email: ${u.email}`, 14, y);
          y += 7;
        });
      } else {
        doc.setFont("helvetica", "bold");
        doc.text("DANH SACH TAI NGUYEN FILE", 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        dbAssets.forEach((a, i) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${i + 1}. [AS] ID: ${a.id} | Ten: ${a.filename} | Format: ${a.type} | Size: ${a.size} KB`, 14, y);
          y += 7;
        });
      }

      doc.save(`LedgerFlow_${activeDbTab}_Report.pdf`);
    } catch (e: any) {
      alert("Lỗi xuất PDF: " + (e.message || e));
    }
  };

  // Form states for adding entries
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Solo Founder' | 'Kế toán trưởng' | 'Lead Developer' | 'QA Engineer'>('Solo Founder');
  const [newUserEmail, setNewUserEmail] = useState('');
  
  const [newProjName, setNewProjName] = useState('');
  const [newProjPlatform, setNewProjPlatform] = useState<'Web App' | 'WebGL Game' | 'Mobile App' | 'Desktop App'>('Web App');
  const [newProjStatus, setNewProjStatus] = useState<'GDD' | 'Prototype' | 'Beta' | 'Release'>('Prototype');
  const [newProjBudget, setNewProjBudget] = useState<number>(50000000);
  const [newProjOwnerId, setNewProjOwnerId] = useState<string>('user-1');

  const [newTxProjId, setNewTxProjId] = useState<string>('proj-1');
  const [newTxAmount, setNewTxAmount] = useState<number>(10000000);
  const [newTxType, setNewTxType] = useState<'Thu' | 'Chi'>('Thu');
  const [newTxGateway, setNewTxGateway] = useState<'VietQR' | 'MoMo' | 'Stripe' | 'Tiền mặt'>('VietQR');
  const [newTxDate, setNewTxDate] = useState<string>('2026-06-03');

  const [newAssetFilename, setNewAssetFilename] = useState('');
  const [newAssetType, setNewAssetType] = useState<'PNG Image' | 'Binary Model' | 'Excel Sheet' | 'YAML Config' | 'CJS Bundle'>('PNG Image');
  const [newAssetSize, setNewAssetSize] = useState<number>(128);
  const [newAssetProjectId, setNewAssetProjectId] = useState<string>('proj-1');

  // Trigger adds
  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const item: LFUser = {
      id: `user-${Date.now()}`,
      fullName: newUserName.trim(),
      role: newUserRole,
      email: newUserEmail.trim(),
      status: 'Active'
    };
    setDbUsers(prev => [...prev, item]);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleAddProject = () => {
    if (!newProjName.trim()) return;
    const item: LFProject = {
      id: `proj-${Date.now()}`,
      name: newProjName.trim(),
      platform: newProjPlatform,
      status: newProjStatus,
      budget: Number(newProjBudget) || 0,
      ownerId: newProjOwnerId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setDbProjects(prev => [...prev, item]);
    setNewProjName('');
  };

  const handleAddTransaction = () => {
    const item: LFTransaction = {
      id: `tx-${Date.now()}`,
      projectId: newTxProjId,
      amount: Number(newTxAmount) || 0,
      type: newTxType,
      gateway: newTxGateway,
      date: newTxDate
    };
    setDbTransactions(prev => [...prev, item]);
  };

  const handleAddAsset = () => {
    if (!newAssetFilename.trim()) return;
    const item: LFAsset = {
      id: `asset-${Date.now()}`,
      filename: newAssetFilename.trim(),
      type: newAssetType,
      size: Number(newAssetSize) || 0,
      projectId: newAssetProjectId
    };
    setDbAssets(prev => [...prev, item]);
    setNewAssetFilename('');
  };

  const handleResetDb = () => {
    if (confirm("Bạn thực sự muốn khôi phục cơ sở dữ liệu về mặc định ban đầu?")) {
      localStorage.removeItem('lf_db_users');
      localStorage.removeItem('lf_db_projects');
      localStorage.removeItem('lf_db_transactions');
      localStorage.removeItem('lf_db_assets');
      window.location.reload();
    }
  };

  // Pipeline active step
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);

  // Quiz Lab state
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // Load custom tables on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fastrack_custom_registered_tables');
      if (stored) {
        setRegisteredTables(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Lỗi tải bảng tự nhập: ', e);
    }
    handleParse();
  }, []);

  const handlePresetSelect = (presetType: 'invoice' | 'bank' | 'pos') => {
    if (presetType === 'invoice') {
      setTableName('vietnam_vat_invoices');
      setTableDesc('Danh sách chứng từ hóa đơn GTGT phát sinh phục vụ kê khai thuế.');
      setInputType('csv');
      setRawText(`mst_ban,ngay_hd,mat_hang,gia_tri_goc,vat_rate
0102145667,2026-05-10,Thiết bị định tuyến Wifi 6,8500000,10
0312654881,2026-05-12,Mực in văn phòng Canon,450000,8
3718992015,2026-05-15,Vật tư đá dăm đổ móng,74000000,8
0102145667,2026-05-18,Hạt nhựa PVC công nghệ cao,125000000,10
0102145699,2026-05-22,Dịch vụ cước viễn thông tháng 5,1200000,10`);
    } else if (presetType === 'bank') {
      setTableName('vcb_bank_transactions');
      setTableDesc('Nhật ký biến động số dư tài khoản ngân hàng chính phát sinh của doanh nghiệp.');
      setInputType('csv');
      setRawText(`transaction_id,booking_time,amount,direction,narration
FT2611590212,2026-05-02 09:12:01,15000000,IN,Thu tien thanh toan don hang #1029
FT2611590554,2026-05-04 14:22:15,3500000,OUT,Thanh toan tien dien van phong cty
FT2611590822,2026-05-08 17:05:40,25000000,IN,Ung truoc chi phi khao sat cau xunv
FT2611590919,2026-05-12 11:30:10,1200000,OUT,Phi dich vu SMS OTP ngan hang`);
    } else if (presetType === 'pos') {
      setTableName('pos_store_sales');
      setTableDesc('Nhật trình doanh số bán lẻ thu ngân tại quầy thanh toán tự động POS.');
      setInputType('json');
      setRawText(`[
  {"order_no": "ORD-0091", "timestamp": "2026-05-28T08:15:30", "subtotal": 125000, "payment_method": "MOMO", "cashier": "Nguyen An"},
  {"order_no": "ORD-0092", "timestamp": "2026-05-28T08:32:12", "subtotal": 560000, "payment_method": "BANK_QR", "cashier": "Le Binh"},
  {"order_no": "ORD-0093", "timestamp": "2026-05-28T09:05:00", "subtotal": 2200000, "payment_method": "CASH", "cashier": "Nguyen An"}
]`);
    }
  };

  const handleParse = () => {
    setParseError(null);
    try {
      const cleanName = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '');
      if (!cleanName) {
        throw new Error('Tên bảng không được để trống và chỉ chứa chữ cái, số, dấu gạch dưới!');
      }

      if (inputType === 'json') {
        const parsed = JSON.parse(rawText.trim());
        if (!Array.isArray(parsed)) {
          throw new Error('Định dạng dữ liệu JSON phải là một mảng [] chứa các đối tượng {}!');
        }
        if (parsed.length === 0) {
          throw new Error('Mảng dữ liệu JSON rỗng!');
        }
        const columns = Object.keys(parsed[0]);
        setParsedData({ columns, rows: parsed });
      } else {
        // Parse CSV
        const lines = rawText.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('CSV cốt lõi phải có ít nhất dòng tiêu đề và 1 dòng dữ liệu bản ghi!');
        }
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.trim());
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            let val: any = values[idx];
            // Infer type
            if (val === undefined || val === '') {
              val = null;
            } else if (!isNaN(Number(val))) {
              val = Number(val);
            }
            obj[h] = val;
          });
          rows.push(obj);
        }
        setParsedData({ columns: headers, rows });
      }
    } catch (err: any) {
      setParseError(err.message || 'Lỗi phân tích cú pháp. Vui lòng kiểm tra lại định dạng dữ liệu nhập vào.');
      setParsedData(null);
    }
  };

  // Run automatically when inputs change
  useEffect(() => {
    handleParse();
  }, [rawText, tableName, inputType]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Generate dynamic structures
  const colsList = parsedData ? parsedData.columns : [];
  const rowsList = parsedData ? parsedData.rows : [];

  const generatedSQL = () => {
    if (colsList.length === 0) return '-- Nhập dữ liệu để sinh bảng SQL tự động';
    const cleanName = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    let fields = colsList.map((col, idx) => {
      const sampleVal = rowsList[0]?.[col];
      let type = 'TEXT';
      let constraints = '';
      
      if (idx === 0) {
        constraints = 'PRIMARY KEY';
      } else {
        constraints = 'NOT NULL';
      }

      if (typeof sampleVal === 'number') {
        type = Number.isInteger(sampleVal) ? 'INTEGER' : 'REAL';
      }
      
      // Fine-tune labels representing accounting constraints
      if (col.includes('ngay') || col.includes('time') || col.includes('date')) {
        constraints = 'NOT NULL';
      }
      if (col.includes('amt') || col.includes('tri_gia') || col.includes('amount') || col.includes('subtotal') || col.includes('gia_tri')) {
        type = 'INTEGER'; // Standard integer round in VNĐ
      }

      return `  ${col.padEnd(16)} ${type} ${constraints}`;
    }).join(',\n');

    return `CREATE TABLE ${cleanName} (\n${fields}\n);\n\n-- Khởi tạo chỉ mục truy xuất nhanh\nCREATE INDEX idx_${cleanName}_first ON ${cleanName}(${colsList[0]});`;
  };

  const generatedPandas = () => {
    if (colsList.length === 0) return '# Nhập dữ liệu để sinh mã Python Pandas';
    const fileLoad = inputType === 'json' ? "pd.read_json('data_source.json')" : "pd.read_csv('data_source.csv')";
    const cleanName = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '');

    // Check if there is currency columns to clean
    const moneyCols = colsList.filter(col => 
      col.includes('tri_gia') || col.includes('amt') || col.includes('amount') || col.includes('subtotal') || col.includes('gia_tri')
    );

    let cleaningBlock = '';
    if (moneyCols.length > 0) {
      cleaningBlock = `
# Làm sạch & chuẩn hóa các cột tiền tệ VNĐ (loại bỏ ký tự thô lẻ chữđ, dấu phẩy)
def clean_vietname_money(val):
    if pd.isna(val): return 0
    import re
    cleaned = re.sub(r'[^\\d.]', '', str(val))
    return int(float(cleaned)) if cleaned else 0

`;
      moneyCols.forEach(col => {
        cleaningBlock += `df['${col}'] = df['${col}'].apply(clean_vietname_money)\n`;
      });
    }

    return `import pandas as pd
import numpy as np

# 1. Nạp nguồn dữ liệu từ Workspace thực tế của ${cleanName}
df = ${fileLoad}

# 2. Xử lý thiếu hụt dữ liệu (Imputation)
for col in df.columns:
    if df[col].isnull().any():
        if df[col].dtype == 'object':
            df[col] = df[col].fillna('N/A')
        else:
            df[col] = df[col].fillna(0)
${cleaningBlock}
# 3. Tính toán các chỉ số thống kê đặc thù (Vietnamese Compliance KPI)
print(f"Tổng số bản ghi kế toán thu thập: {len(df)} dòng")
print("Cấu trúc trường dữ liệu thô:")
print(df.info())

# 4. Lưu kết quả sạch ra tệp sản phẩm
df.to_csv('refined_${cleanName}.csv', index=False)
print("✅ Hoàn thành quy trình làm sạch dữ liệu lớn!")`;
  };

  const generatedPrompt = () => {
    return `Bạn là kỹ sư kiểm toán nội bộ dữ liệu lớn người Việt Nam cấp cao. 
Tôi muốn bạn viết các quy luật trích xuất và truy vấn nghiệp vụ bất thường cho bảng dữ liệu "${tableName}" có cấu trúc các cột sau:
Các cột: [${colsList.join(', ')}]

Hãy ưu tiên viết:
1. Quy tắc dò hóa đơn rác, số hóa đơn lặp lại sai định dạng của Việt Nam.
2. Viết câu SQL SELECT lọc ra các giao dịch nghi ngờ chênh lệch giữa nguyên giá và tỷ lệ thuế suất bất thường.
3. Giải thích súc tích bằng tiếng Việt cách xử lý rủi ro khi bị cán bộ kiểm tra gạt thuế đầu vào.`;
  };

  const handleRegisterTable = () => {
    if (!parsedData) return;
    const cleanName = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '');

    // Check duplicate
    if (registeredTables.some(t => t.tableName === cleanName)) {
      alert(`Bảng "${cleanName}" đã đồng bộ trong Sổ sách rồi! Vui lòng đặt tên bảng khác.`);
      return;
    }

    const columnsFormatted = colsList.map((col, idx) => {
      const sampleVal = rowsList[0]?.[col];
      let type = 'TEXT';
      if (typeof sampleVal === 'number') {
        type = Number.isInteger(sampleVal) ? 'INTEGER' : 'REAL';
      }
      return {
        name: col,
        type,
        constraints: idx === 0 ? 'PRIMARY KEY' : 'NOT NULL',
        description: `Trường dữ liệu tự động định dạng cho cột ${col}`
      };
    });

    const newTable: ParsedTable = {
      id: `table_${Date.now()}`,
      tableName: cleanName,
      description: tableDesc,
      columns: columnsFormatted,
      rows: rowsList,
      sqlDef: generatedSQL()
    };

    const updated = [...registeredTables, newTable];
    setRegisteredTables(updated);
    try {
      localStorage.setItem('fastrack_custom_registered_tables', JSON.stringify(updated));
      alert(`🎉 Đã đồng bộ bảng "${cleanName}" (${rowsList.length} dòng) thành công! Lúc này bạn có thể vào mục "Sơ đồ quan hệ & Run SQL" để chọn bảng mới này và gõ câu SELECT thực hiện kiểm định thật!`);
    } catch (e) {
      console.error(e);
      alert('Không thể lưu trữ do vuợt dung lượng cục bộ cho phép!');
    }
  };

  const handleDeleteRegistered = (id: string, name: string) => {
    const updated = registeredTables.filter(t => t.id !== id);
    setRegisteredTables(updated);
    try {
      localStorage.setItem('fastrack_custom_registered_tables', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* INTRO HERO HEADER */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider font-mono">
              Phát Triển Không Giới Hạn
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h3 className="text-md sm:text-base font-black text-white flex items-center gap-1.5 mt-1.5">
            <Database className="w-5 h-5 text-purple-400" />
            Không Gian Dữ Liệu Tự Do & Khung Biên Dịch Sổ Sách
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl font-medium">
            Tự do thêm nội dung mới bằng cách nộp/past dữ liệu thô (Hóa đơn, Excel, XML, JSON). Hệ thống sẽ tự động biến dạng, trích xuất cấu trúc cột lập tức và sinh ra cơ sở dữ liệu mẫu + mã Pandas sạch phù hợp nhất.
          </p>
        </div>

        {/* Dynamic total counter */}
        <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850/80">
          <div className="w-10 h-10 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bảng tùy biến đã nạp</span>
            <strong className="text-md font-extrabold text-white font-mono block">{registeredTables.length} Tables Registered</strong>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-100">
          <ShieldCheck className="h-4 w-4 text-amber-300" />
          Boundary note
        </h2>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Custom Data Workbench la workspace mo phong offline-first cho schema preview, query builder va pivot simulation.
          Du lieu mau co the nam trong static data hoac localStorage; ket qua trich loc, export va RDBMS demo can duoc nguoi duyet kiem tra truoc khi dung cho so sach, bao cao hoac migrate du lieu that.
        </p>
      </section>

      {/* PHÂN HỆ TẬP TRUNG TÙY CHỌN */}
      <div className="flex bg-[#0b0f19] border border-slate-850 p-1.5 rounded-2xl shadow-inner select-none font-sans">
        <button
          onClick={() => setWorkspaceMode('parser')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            workspaceMode === 'parser'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/65'
          }`}
        >
          <Upload className="w-4 h-4 text-purple-400" />
          <span>Phân Hệ I: Máy Trích Lọc Hóa Đơn Thô</span>
        </button>
        <button
          onClick={() => setWorkspaceMode('rdbms')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            workspaceMode === 'rdbms'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/65'
          }`}
        >
          <Database className="w-4 h-4 text-purple-400" />
          <span>Phân Hệ II: Hệ Quản Trị RDBMS &amp; Sơ Đồ ERD</span>
        </button>
        <button
          onClick={() => setWorkspaceMode('deepdive')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            workspaceMode === 'deepdive'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/65'
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Deep Dive: Schema Query Pivot</span>
        </button>
      </div>

      {workspaceMode === 'deepdive' && <CustomDataWorkbenchDeepDivePanel />}

      {workspaceMode === 'parser' && (
        <>
          {/* QUICK PRESETS SELECTION */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-500" />
                Chọc mẫu cấu hình dữ liệu thông dụng (Nạp 1 click):
              </span>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">WAL sync ready</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handlePresetSelect('invoice')}
                className="p-3 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-850 hover:border-purple-500/30 rounded-xl text-left transition-all text-xs flex items-start gap-2.5 font-bold cursor-pointer"
              >
                <span className="p-1 px-2 bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-md text-[10px] font-mono leading-none">CSV</span>
                <div className="min-w-0">
                  <span className="block truncate font-bold text-slate-200">VAT Invoices</span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Hóa đơn đại diện GTGT</span>
                </div>
              </button>
              
              <button
                onClick={() => handlePresetSelect('bank')}
                className="p-3 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-850 hover:border-purple-500/30 rounded-xl text-left transition-all text-xs flex items-start gap-2.5 font-bold cursor-pointer"
              >
                <span className="p-1 px-2 bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-md text-[10px] font-mono leading-none">TXT</span>
                <div className="min-w-0">
                  <span className="block truncate font-bold text-slate-200">VCB Transaction Log</span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Sao kê ngân hàng VCB</span>
                </div>
              </button>

              <button
                onClick={() => handlePresetSelect('pos')}
                className="p-3 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-850 hover:border-purple-500/30 rounded-xl text-left transition-all text-xs flex items-start gap-2.5 font-bold cursor-pointer"
              >
                <span className="p-1 px-2 bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-md text-[10px] font-mono leading-none">JSON</span>
                <div className="min-w-0">
                  <span className="block truncate font-bold text-slate-200">POS Sales Data</span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Doanh số quầy bán lẻ</span>
                </div>
              </button>
            </div>
          </div>

      {/* TWO COLUMN INTERACTIVE INTERFACE */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* INPUT FORM SIDE (5 cols) */}
        <section className="lg:col-span-5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-purple-400" />
              1. Trình nhập liệu dữ liệu thô
            </span>
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850 text-[10px] font-bold">
              <button 
                onClick={() => setInputType('csv')} 
                className={`px-2 py-1 rounded transition-all ${inputType === 'csv' ? 'bg-purple-600 font-extrabold text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                CSV / Raw
              </button>
              <button 
                onClick={() => setInputType('json')} 
                className={`px-2 py-1 rounded transition-all ${inputType === 'json' ? 'bg-purple-600 font-extrabold text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                JSON Array
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Table title and description */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Tên bảng khởi dựng</label>
                <input
                  type="text"
                  value={tableName}
                  onChange={e => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="custom_invoices"
                  className="w-full bg-[#02050b] border border-slate-850 px-3 py-2 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Tag định dạng</label>
                <div className="px-3 py-2 bg-slate-950 border border-slate-850 text-slate-500 font-mono font-bold text-[10.5px] rounded-lg">
                  db.table.{tableName || 'null'}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Diễn giải tính chất ròng</label>
              <input
                type="text"
                value={tableDesc}
                onChange={e => setTableDesc(e.target.value)}
                placeholder="Ví dụ: Bảng hóa đơn dịch vụ..."
                className="w-full bg-[#02050b] border border-slate-850 px-3 py-2 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-medium"
              />
            </div>

            {/* Paste space with drop area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Không gian văn bản nạp lớn</label>
                <span className="text-[9.5px] text-slate-600 font-mono font-semibold">Tự động biên dịch khi gõ</span>
              </div>
              <div className="relative">
                <textarea
                  rows={9}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Dán tiêu đề cột và các hàng dữ liệu phân tách bằng dấu phẩy ở đây..."
                  className="w-full bg-[#020409] border border-slate-850 p-3 rounded-xl text-[11px] font-mono font-semibold text-slate-200 placeholder-slate-700 leading-relaxed focus:outline-none focus:border-purple-500"
                />
                
                {/* Visual drag drop prompt inside textarea */}
                <div className="absolute right-2 bottom-2.5 flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg select-none">
                  <Upload className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
                  <span className="text-[9.5px] text-slate-400 font-bold">Auto Parser Live</span>
                </div>
              </div>
            </div>

            {/* Manual parser feedback alerts */}
            {parseError ? (
              <div className="bg-rose-500/5 text-rose-400 border border-rose-500/15 p-3 rounded-xl text-[11px] font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{parseError}</p>
              </div>
            ) : (
              parsedData && (
                <div className="bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 p-3 rounded-xl text-[11px]/none font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dữ liệu hợp chuẩn! Đã phát hiện {colsList.length} dải cột chính và {rowsList.length} dòng hàng thực tế.</span>
                </div>
              )
            )}

            {/* Trigger registry logic */}
            <button
              onClick={handleRegisterTable}
              disabled={!parsedData}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-850 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/10 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Tách đồng bộ vào Sổ Sách & Sandbox SQL
            </button>
          </div>
        </section>

        {/* COMPILER OUTPUT & REGISTERED TABLES SIDE (7 cols) */}
        <section className="lg:col-span-7 space-y-6">
          {/* Dynamic Grid Viewer */}
          {parsedData && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-slate-850 pb-3">
                <Table className="w-4 h-4 text-purple-400" />
                2. Phân tích trực quan bảng đích (Live Schema Grid)
              </span>

              <div className="overflow-x-auto rounded-xl border border-slate-850 max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                <table className="w-full text-[10px] font-mono text-left select-text">
                  <thead>
                    <tr className="bg-[#02050a] border-b border-slate-850 text-slate-500 text-[9px] uppercase font-black">
                      {colsList.map(h => (
                        <th key={h} className="px-3 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 bg-slate-950/40">
                    {rowsList.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/40">
                        {colsList.map(h => {
                          const val = row[h];
                          return (
                            <td key={h} className="px-3 py-1.5 text-slate-300 font-bold truncate max-w-[155px]">
                              {typeof val === 'number' && val > 1000 
                                ? new Intl.NumberFormat('vi-VN').format(val) 
                                : String(val ?? 'NULL')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCRIPT COMPILER OUTPUT SWITCH */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex border-b border-slate-850 pb-2.5 justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-emerald-400" />
                3. Trình biên dịch mã tương thích (1-Click SDK Scripts)
              </span>

              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850 text-[10.5px] font-bold">
                <button
                  onClick={() => setSelectedFormat('sql')}
                  className={`px-2.5 py-1 rounded transition-all ${selectedFormat === 'sql' ? 'bg-[#152e25] text-emerald-400 font-black' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  SQL DDL
                </button>
                <button
                  onClick={() => setSelectedFormat('pandas')}
                  className={`px-2.5 py-1 rounded transition-all ${selectedFormat === 'pandas' ? 'bg-[#152e25] text-emerald-400 font-black' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Python Pandas
                </button>
                <button
                  onClick={() => setSelectedFormat('prompt')}
                  className={`px-2.5 py-1 rounded transition-all ${selectedFormat === 'prompt' ? 'bg-[#152e25] text-emerald-400 font-black' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  AI Auditor Prompt
                </button>
              </div>
            </div>

            {/* Display compiled script */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>
                  {selectedFormat === 'sql' ? 'SQLite/Postgres Schema Definition File' : selectedFormat === 'pandas' ? 'Python Cleaning Data Pipeline script' : 'Custom engineering prompt for Auditor'}
                </span>
                
                <button
                  onClick={() => {
                    const txt = selectedFormat === 'sql' ? generatedSQL() : selectedFormat === 'pandas' ? generatedPandas() : generatedPrompt();
                    copyToClipboard(txt, 'compiled_code');
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-emerald-500/40 transition-all font-semibold font-sans normal-case"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  {copiedId === 'compiled_code' ? 'Đã sao chép!' : 'Sao chép mã'}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#020409] border-b border-slate-900 font-mono text-[9.5px]/none">
                  <span className="text-slate-500 font-extrabold uppercase">
                    {selectedFormat === 'sql' ? `${tableName}.sql` : selectedFormat === 'pandas' ? 'pandas_audit_pipeline.py' : `ai_auditor_instruction_${tableName}.txt`}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed font-semibold max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-850 select-text">
                  {selectedFormat === 'sql' ? generatedSQL() : selectedFormat === 'pandas' ? generatedPandas() : generatedPrompt()}
                </pre>
              </div>
            </div>
          </div>

          {/* MANAGING REGISTERED CUSTOM TABLES */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-slate-850 pb-3">
              <Database className="w-4 h-4 text-purple-400" />
              Sổ sách thực tế - Các bảng dữ liệu đã nạp cục bộ ({registeredTables.length})
            </span>

            {registeredTables.length === 0 ? (
              <div className="text-center py-6 px-4 bg-slate-950/60 rounded-xl border border-slate-850">
                <Database className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-[11px] text-slate-500 font-bold">Chưa có bảng ngoài nào được đăng ký.</p>
                <p className="text-[10px] text-slate-600 mt-1">Sử dụng form bên trái để mượn hoặc dán dữ liệu, sau đó bấm nút "Tách đồng bộ" để đăng ký vĩnh viễn.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850 select-none">
                {registeredTables.map(table => (
                  <div key={table.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-extrabold shadow">
                          {table.rows.length} rows loaded
                        </span>
                        <button
                          onClick={() => handleDeleteRegistered(table.id, table.tableName)}
                          className="p-1 text-slate-600 hover:text-rose-400 transition-all"
                          title="Gỡ bảng khỏi sổ sách"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="text-[11.5px] font-bold text-slate-200 mt-2 truncate font-mono">Table: {table.tableName}</h4>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-semibold truncate-2-lines">{table.description}</p>
                    </div>

                    <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-slate-900 justify-end">
                      <button
                        onClick={() => copyToClipboard(table.sqlDef, `sql_reg_${table.id}`)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-850 rounded text-slate-400 hover:text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-800"
                      >
                        <Copy className="w-3 h-3 text-purple-400" />
                        {copiedId === `sql_reg_${table.id}` ? 'Xong' : 'Copy DDL'}
                      </button>
                      <button
                        onClick={() => {
                          const csvText = [
                            table.columns.map(c => c.name).join(','),
                            ...table.rows.map(r => table.columns.map(c => r[c.name] ?? '').join(','))
                          ].join('\n');
                          const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${table.tableName}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-850 rounded text-slate-400 hover:text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-800"
                        title="Tải về file Excel CSV sạch"
                      >
                        <FileDown className="w-3 h-3 text-emerald-400" />
                        Tải CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )}

  {workspaceMode === 'rdbms' && (
    /* PHÂN HỆ II: STATE-OF-THE-ART LOCAL RDBMS MANAGER SYSTEM WITH ERD DIAGRAM */
    <div className="space-y-6 font-sans">
      {/* ANALYTICS SUMMARY GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl shrink-0">
            <Briefcase className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Tổng Dự Án</span>
            <strong className="text-sm font-black text-white font-mono">{dbProjects.length} Projects</strong>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Doanh Số (Thu)</span>
            <strong className="text-sm font-black text-emerald-400 font-mono">
              {dbTransactions.filter(t => t.type === 'Thu').reduce((acc, current) => acc + current.amount, 0).toLocaleString()}đ
            </strong>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Tổng Quỹ Chi</span>
            <strong className="text-sm font-black text-rose-450 font-mono">
              {dbTransactions.filter(t => t.type === 'Chi').reduce((acc, current) => acc + current.amount, 0).toLocaleString()}đ
            </strong>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Tổng Số Nhân Sự</span>
            <strong className="text-sm font-black text-white font-mono">{dbUsers.length} Active Users</strong>
          </div>
        </div>
      </div>

      {/* DYNAMIC RELATIONSHIP ERD MAP */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-purple-400" />
            Sơ Đồ Thực Thể Quan Hệ Hệ Thống (RDBMS Entity-Relationship Diagram)
          </span>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/5 px-2.5 py-0.5 rounded border border-purple-500/20">
            SQLite / PostgreSQL Schema Mapping
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 select-none">
          {/* Table Users */}
          <div 
            onClick={() => setActiveDbTab('users')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${activeDbTab === 'users' ? 'bg-purple-950/20 border-purple-500 ring-2 ring-purple-500/15' : 'bg-[#02050a]/60 border-slate-850 hover:border-slate-800'}`}
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
              <span className="text-[11px] font-black text-white flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <User className="w-3.5 h-3.5 text-blue-400" />
                1. users
              </span>
              <span className="text-[8px] font-sans font-extrabold uppercase bg-blue-500/10 text-blue-400 px-1.5 rounded">Dim</span>
            </div>
            <div className="mt-2 text-[10px] font-mono space-y-1 text-slate-400 font-semibold">
              <p className="text-purple-400 font-bold"><strong className="text-slate-500 font-normal">[PK]</strong> id : VARCHAR</p>
              <p>fullName : VARCHAR</p>
              <p>role : VARCHAR</p>
              <p>email : VARCHAR</p>
              <p>status : VARCHAR</p>
            </div>
          </div>

          {/* Connector line represent vector 1 */}
          <div className="hidden md:flex flex-col justify-center items-center text-center gap-1 shrink-0 text-slate-600">
            <span className="text-[10px] font-mono bg-[#0b0f19] border border-slate-850 px-2 py-0.5 rounded text-slate-500">
              ownerId 🔗 id
            </span>
            <span className="text-lg font-bold leading-none shrink-0 text-purple-600">&larr; 1:N &rarr;</span>
          </div>

          {/* Table Projects */}
          <div 
            onClick={() => setActiveDbTab('projects')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${activeDbTab === 'projects' ? 'bg-purple-950/20 border-purple-500 ring-2 ring-purple-500/15' : 'bg-[#02050a]/60 border-slate-850 hover:border-slate-800'}`}
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
              <span className="text-[11px] font-black text-white flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                2. projects
              </span>
              <span className="text-[8px] font-sans font-extrabold uppercase bg-purple-500/10 text-purple-400 px-1.5 rounded">Fact/Dim</span>
            </div>
            <div className="mt-2 text-[10px] font-mono space-y-1 text-slate-400 font-semibold">
              <p className="text-purple-400 font-bold"><strong className="text-slate-500 font-normal">[PK]</strong> id : VARCHAR</p>
              <p>name : VARCHAR</p>
              <p>platform : VARCHAR</p>
              <p>status : VARCHAR</p>
              <p>budget : INT</p>
              <p className="text-amber-400 font-bold"><strong className="text-slate-500 font-normal">[FK]</strong> ownerId : VARCHAR</p>
            </div>
          </div>

          {/* Multi-connector representation */}
          <div className="p-3.5 bg-[#02050a]/60 rounded-xl border border-slate-850 flex flex-col justify-center space-y-2 text-[10px] font-mono font-semibold text-slate-500">
            <div className="flex justify-between items-center border-b border-[#0f1422] pb-1 cursor-pointer hover:text-white" onClick={() => setActiveDbTab('transactions')}>
              <span>transactions.projectId</span>
              <span className="text-purple-400 font-bold">&rarr; projects.id</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer hover:text-white" onClick={() => setActiveDbTab('assets')}>
              <span>assets.projectId</span>
              <span className="text-purple-400 font-bold">&rarr; projects.id</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE BROWSER AND CRUD */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT TABBED BROWSING (8 cols) */}
        <div className="lg:col-span-12 xl:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
              <button
                onClick={() => setActiveDbTab('projects')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeDbTab === 'projects' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Dự Án ({dbProjects.length})</span>
              </button>
              <button
                onClick={() => setActiveDbTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeDbTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Nhân Sự ({dbUsers.length})</span>
              </button>
              <button
                onClick={() => setActiveDbTab('transactions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeDbTab === 'transactions' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Giao Dịch ({dbTransactions.length})</span>
              </button>
              <button
                onClick={() => setActiveDbTab('assets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeDbTab === 'assets' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tài Nguyên File ({dbAssets.length})</span>
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="Tải tệp Excel full 4 bảng liên kết"
              >
                <FileDown className="w-3 h-3" />
                Xuất Excel
              </button>

              <button
                onClick={handleExportPDF}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="In báo cáo PDF cho phân hệ hiện tại"
              >
                <FileText className="w-3 h-3" />
                Xuất PDF
              </button>

              <button
                onClick={handleResetDb}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                Reset DB
              </button>
            </div>
          </div>

          {/* TABLE COMPONENT */}
          <div className="overflow-x-auto rounded-xl border border-slate-850">
            {activeDbTab === 'users' && (
              <table className="w-full text-left font-mono text-xs select-text">
                <thead>
                  <tr className="bg-[#02050a] border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="px-4 py-2.5">Mã ID</th>
                    <th className="px-4 py-2.5">Họ Tên</th>
                    <th className="px-4 py-2.5">Vai Trò/Role</th>
                    <th className="px-4 py-2.5">Địa chỉ Email</th>
                    <th className="px-4 py-2.5">Trạng Thái</th>
                    <th className="px-3 py-2.5 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-slate-950/20 text-slate-200">
                  {dbUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="px-4 py-2.5 text-purple-400 font-bold">{u.id}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-105 font-sans">{u.fullName}</td>
                      <td className="px-4 py-2.5 text-slate-300 font-medium">
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10.5px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-450 font-sans">{u.email}</td>
                      <td className="px-4 py-2.5 font-sans">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                          {u.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setDbUsers(prev => prev.filter(p => p.id !== u.id))}
                          className="text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeDbTab === 'projects' && (
              <table className="w-full text-left font-mono text-xs select-text">
                <thead>
                  <tr className="bg-[#02050a] border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="px-4 py-2.5">Mã ID</th>
                    <th className="px-4 py-2.5">Tên Sản Phẩm/Dự Án</th>
                    <th className="px-4 py-2.5">Nền Tảng Phục Vụ</th>
                    <th className="px-4 py-2.5">Trạng Thái</th>
                    <th className="px-4 py-2.5 text-right">Ngân Sách Đầu Tư</th>
                    <th className="px-4 py-2.5 font-sans">Chủ Sở Hữu</th>
                    <th className="px-3 py-2.5 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-slate-950/20 text-slate-200">
                  {dbProjects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="px-4 py-2.5 text-purple-400 font-bold">{p.id}</td>
                      <td className="px-4 py-2.5 font-sans font-black text-slate-100">{p.name}</td>
                      <td className="px-4 py-2.5 text-slate-350">{p.platform}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${
                          p.status === 'Release' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          p.status === 'Beta' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                          'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-300">{p.budget.toLocaleString()}đ</td>
                      <td className="px-4 py-2.5 text-slate-400 font-sans font-medium">
                        {dbUsers.find(u => u.id === p.ownerId)?.fullName || p.ownerId}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setDbProjects(prev => prev.filter(proj => proj.id !== p.id))}
                          className="text-slate-600 hover:text-rose-450 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeDbTab === 'transactions' && (
              <table className="w-full text-left font-mono text-xs select-text">
                <thead>
                  <tr className="bg-[#02050a] border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="px-4 py-2.5">ID Giao Dịch</th>
                    <th className="px-4 py-2.5 font-sans">Thuộc Dự Án</th>
                    <th className="px-4 py-2.5 text-right">Số Tiền (VNĐ)</th>
                    <th className="px-4 py-2.5">Xếp Loại</th>
                    <th className="px-4 py-2.5 font-sans font-bold">Cổng GT</th>
                    <th className="px-4 py-2.5">Ngày Phát Sinh</th>
                    <th className="px-3 py-2.5 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-slate-950/20 text-slate-200">
                  {dbTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-450 text-[11px]">{t.id}</td>
                      <td className="px-4 py-2.5 text-slate-200 font-sans font-bold">
                        {dbProjects.find(p => p.id === t.projectId)?.name || t.projectId}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${t.type === 'Thu' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'Thu' ? '+' : '-'}{t.amount.toLocaleString()}đ
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9.5px]/none font-bold uppercase ${
                          t.type === 'Thu' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-sans text-slate-350">{t.gateway}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-[11px]">{t.date}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setDbTransactions(prev => prev.filter(tx => tx.id !== t.id))}
                          className="text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeDbTab === 'assets' && (
              <table className="w-full text-left font-mono text-xs select-text">
                <thead>
                  <tr className="bg-[#02050a] border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="px-4 py-2.5">Mã ID</th>
                    <th className="px-4 py-2.5">Tên Tệp Phương Tiện</th>
                    <th className="px-4 py-2.5">Định Dạng</th>
                    <th className="px-4 py-2.5 text-right">Dung lượng (KB)</th>
                    <th className="px-4 py-2.5">Thuộc Dự Án</th>
                    <th className="px-3 py-2.5 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-slate-950/20 text-slate-200">
                  {dbAssets.map(a => (
                    <tr key={a.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-450">{a.id}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-100 font-sans">{a.filename}</td>
                      <td className="px-4 py-2.5 text-slate-400">{a.type}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-300">{a.size.toLocaleString()} KB</td>
                      <td className="px-4 py-2.5 text-slate-350 text-xs font-sans font-medium">
                        {dbProjects.find(p => p.id === a.projectId)?.name || a.projectId}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setDbAssets(prev => prev.filter(as => as.id !== a.id))}
                          className="text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR INSERT FORM (4 cols) */}
        <div className="lg:col-span-12 xl:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-slate-850 pb-2.5 font-sans">
            <Plus className="w-4 h-4 text-purple-400" />
            Thêm Bản Ghi Mới Cục Bộ
          </span>

          {activeDbTab === 'users' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Họ Tên Nhân Sự</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Hoàng Kiên Dev"
                  className="w-full bg-[#02050b] border border-slate-850 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Cơ Cấu Vai Trò/Role</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="Solo Founder">Solo Founder (Người Sáng Lập)</option>
                  <option value="Kế toán trưởng">Kế toán trưởng (Audit/Tax)</option>
                  <option value="Lead Developer">Lead Developer (Lập Trình Viên)</option>
                  <option value="QA Engineer">QA Engineer (Đảm Bảo Chất Lượng)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Địa chỉ Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="kien@ledgerflow.vn"
                  className="w-full bg-[#02050b] border border-slate-850 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={handleAddUser}
                className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-550 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow uppercase tracking-wider transition-all cursor-pointer font-sans"
              >
                Lưu Nhân Sự Mới
              </button>
            </div>
          )}

          {activeDbTab === 'projects' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Tên Dự Án Lập Trình</label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="e.g. Gun Bound Việt Nam v2"
                  className="w-full bg-[#02050b] border border-slate-850 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Nền Tảng</label>
                  <select
                    value={newProjPlatform}
                    onChange={e => setNewProjPlatform(e.target.value as any)}
                    className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                  >
                    <option value="Web App">Web App</option>
                    <option value="WebGL Game">WebGL Game</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Desktop App">Desktop App</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Trạng Thái</label>
                  <select
                    value={newProjStatus}
                    onChange={e => setNewProjStatus(e.target.value as any)}
                    className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                  >
                    <option value="GDD">GDD (Bản nháp)</option>
                    <option value="Prototype">Prototype</option>
                    <option value="Beta">Beta (Thử nghiệm)</option>
                    <option value="Release">Release (Thương mại)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Ngân Sách Đầu Tư (VNĐ)</label>
                <input
                  type="number"
                  value={newProjBudget}
                  onChange={e => setNewProjBudget(Number(e.target.value) || 0)}
                  className="w-full bg-[#02050b] border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1 text-amber-500 flex items-center gap-1">
                  Chủ Sở Hữu (FK Link)
                </label>
                <select
                  value={newProjOwnerId}
                  onChange={e => setNewProjOwnerId(e.target.value)}
                  className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                >
                  {dbUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddProject}
                className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-550 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow uppercase tracking-wider transition-all cursor-pointer font-sans"
              >
                Lắp Dự Án Mới
              </button>
            </div>
          )}

          {activeDbTab === 'transactions' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Liên Kết Dự Án (FK)</label>
                <select
                  value={newTxProjId}
                  onChange={e => setNewTxProjId(e.target.value)}
                  className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                >
                  {dbProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Số Tiền (VNĐ)</label>
                  <input
                    type="number"
                    value={newTxAmount}
                    onChange={e => setNewTxAmount(Number(e.target.value) || 0)}
                    className="w-full bg-[#02050b] border border-slate-850 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Thu hay Chi</label>
                  <select
                    value={newTxType}
                    onChange={e => setNewTxType(e.target.value as any)}
                    className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                  >
                    <option value="Thu">Thu (Dòng tiền vào)</option>
                    <option value="Chi">Chi (Dòng phí ra)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1 font-sans">Cổng Thanh Toán</label>
                  <select
                    value={newTxGateway}
                    onChange={e => setNewTxGateway(e.target.value as any)}
                    className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-2 py-2 text-xs font-bold text-slate-200 focus:outline-none font-sans"
                  >
                    <option value="VietQR">VietQR (Napas)</option>
                    <option value="MoMo">Ví MoMo</option>
                    <option value="Stripe">Stripe Card</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Ngày Giao Dịch</label>
                  <input
                    type="date"
                    value={newTxDate}
                    onChange={e => setNewTxDate(e.target.value)}
                    className="w-full bg-[#02050b] border border-slate-850 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleAddTransaction}
                className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-550 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow uppercase tracking-wider transition-all cursor-pointer font-sans"
              >
                Hạch Toán Giao Dịch
              </button>
            </div>
          )}

          {activeDbTab === 'assets' && (
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Tên Tệp Tin Asset</label>
                <input
                  type="text"
                  value={newAssetFilename}
                  onChange={e => setNewAssetFilename(e.target.value)}
                  placeholder="e.g. background_music.ogg"
                  className="w-full bg-[#02050b] border border-slate-850 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Định Dạng</label>
                  <select
                    value={newAssetType}
                    onChange={e => setNewAssetType(e.target.value as any)}
                    className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                  >
                    <option value="PNG Image">PNG Image</option>
                    <option value="Binary Model">Binary Model</option>
                    <option value="Excel Sheet">Excel Sheet</option>
                    <option value="YAML Config">YAML Config</option>
                    <option value="CJS Bundle">CJS Bundle</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Kích Thước (KB)</label>
                  <input
                    type="number"
                    value={newAssetSize}
                    onChange={e => setNewAssetSize(Number(e.target.value) || 0)}
                    className="w-full bg-[#02050b] border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1 text-amber-500">Liên Kết Dự Án (FK)</label>
                <select
                  value={newAssetProjectId}
                  onChange={e => setNewAssetProjectId(e.target.value)}
                  className="w-full bg-[#02050b] border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                >
                  {dbProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddAsset}
                className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-purple-600 hover:from-purple-550 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow uppercase tracking-wider transition-all cursor-pointer font-sans"
              >
                Lưu Tài Nguyên Mới
              </button>
            </div>
          )}

          <div className="p-3 bg-purple-950/25 border border-purple-900/40 rounded-xl space-y-1.5 text-[11px] leading-relaxed select-text font-serif">
            <span className="font-extrabold text-purple-400 uppercase flex items-center gap-1.5 font-sans tracking-wide">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Chuẩn Kiểm Định RDBMS Sổ Cái:
            </span>
            <p className="text-slate-450 font-sans font-medium">
              Hệ thống hạch toán tự động áp dụng ràng buộc tham chiếu nghiêm ngặt. Khi xóa dự án hoặc nhân sự, các giao dịch và file assets liên kết sẽ giữ nguyên định dạng lịch sử phục vụ đối soát định kỳ.
            </p>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ERP & ACCOUNTING PORTAL PIPELINE AND MASTERCLASS QUIZ LAB */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* INTERACTIVE DATA PIPELINE LINEAGE */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                Đường Ống Dữ Liệu ERP Thực Chiến (Interactive Lineage)
              </span>
              <span className="bg-purple-500/15 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded border border-purple-500/25 uppercase font-mono">
                Pipeline Map
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed mt-2.5 font-medium">
              Tìm hiểu cách thức dữ liệu chuyển động từ nguồn chứng từ rác của người điều hành thành báo cáo quản trị chuẩn chỉnh qua 4 trạm lõi:
            </p>

            {/* Stepper controls */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {PIPELINE_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = activePipelineStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActivePipelineStep(idx)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      isActive 
                        ? 'bg-purple-600/15 border-purple-500 text-white shadow-lg' 
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <StepIcon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                    <span className="text-[9px] font-extrabold mt-1.5 truncate max-w-full">Trạm {idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Details */}
            <div className="bg-slate-950 border border-slate-850/80 p-4 rounded-xl mt-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <h4 className="text-[12.5px] font-black text-white">{PIPELINE_STEPS[activePipelineStep].title}</h4>
                <span className="text-[9.5px] uppercase font-mono text-purple-400 font-extrabold bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                  {PIPELINE_STEPS[activePipelineStep].status}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {PIPELINE_STEPS[activePipelineStep].focus}
              </p>

              <div className="p-3 bg-[#0a0d14] border border-purple-900/30 rounded-lg text-[11px] leading-relaxed space-y-1">
                <span className="font-bold text-purple-400 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Quy định Sổ sách / Circular Compliance:
                </span>
                <p className="text-slate-400 font-medium">
                  {PIPELINE_STEPS[activePipelineStep].vietStandard}
                </p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 italic mt-2 text-right">
            * Bấm chọn Trạm 1 - 4 ở trên để kiểm tra cơ cấu ELT vận hành quản trị.
          </div>
        </div>

        {/* VIETNAMESE SME ERP MASTERCLASS QUIZ LAB */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                Học Viện Thách Thức Kế Toán Sổ Sách & Dữ Liệu SME Việt Nam
              </span>
              <span className="bg-[#152e25] text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-500/25 uppercase font-mono">
                Knowledge Lab
              </span>
            </div>

            {!quizCompleted ? (
              <div className="space-y-4 mt-3">
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>CÂU HỎI {currentQuizIndex + 1} / {QUIZ_QUESTIONS.length}</span>
                    <span className="text-purple-400">Đúng: {score} câu</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full transition-all duration-300"
                      style={{ width: `${((currentQuizIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Question */}
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 leading-relaxed select-text">
                  {QUIZ_QUESTIONS[currentQuizIndex].question}
                </h4>

                {/* Answers buttons */}
                <div className="space-y-2 select-none">
                  {QUIZ_QUESTIONS[currentQuizIndex].options.map((opt, oIdx) => {
                    const isSelected = selectedAnswerIdx === oIdx;
                    let optionStyle = "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900 hover:border-slate-800";
                    
                    if (quizSubmitted) {
                      if (oIdx === QUIZ_QUESTIONS[currentQuizIndex].correctIdx) {
                        optionStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold";
                      } else if (isSelected) {
                        optionStyle = "bg-rose-500/10 border-rose-500 text-rose-400 font-bold";
                      } else {
                        optionStyle = "bg-slate-950/40 border-slate-900 text-slate-600 opacity-60";
                      }
                    } else if (isSelected) {
                      optionStyle = "bg-purple-600/15 border-purple-500 text-white font-bold ring-1 ring-purple-500/40";
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={quizSubmitted}
                        onClick={() => setSelectedAnswerIdx(oIdx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2.5 ${optionStyle}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 text-slate-400">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Description block */}
                {quizSubmitted && (
                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-1.5 text-xs animate-fadeIn">
                    <span className="font-extrabold uppercase text-[10px] tracking-wider text-purple-400 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      Lớp học Kế toán số giải thích:
                    </span>
                    <p className="text-slate-300 font-medium leading-relaxed font-sans">{QUIZ_QUESTIONS[currentQuizIndex].explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Quiz completed screen */
              <div className="text-center py-6 px-4 space-y-4 mt-3 bg-slate-950/40 rounded-2xl border border-slate-850 text-slate-100">
                <div className="w-14 h-14 rounded-full bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                  <Award className="w-8 h-8 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bảng xếp hạng năng lực</span>
                  <p className="text-md font-black text-white">
                    {score === 5 ? "🏆 Chuyên Gia ERP & Kế Toán Số SME Thục Luyện" :
                     score >= 3 ? "🥈 Chuyên Viên Kiểm Toán Dữ Liệu Lớn" :
                     "🥉 Học Viên Sổ Sách Đồng Bộ"}
                  </p>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    Bạn đã giải đáp chuẩn xác <strong className="text-purple-400 font-mono text-sm">{score} / {QUIZ_QUESTIONS.length}</strong> thử thách nâng cao thực tế!
                  </p>
                </div>

                <div className="p-3 bg-purple-500/5 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-xl max-w-sm mx-auto leading-relaxed">
                  {score === 5 
                    ? "Hiểu biết vẹn toàn! Bạn đã nắm cứng nguyên lý dọn dẹp Pandas, Star Schema, và định khoản kép. Hãy áp dụng ngay vào Sổ cái thực tế để tối ưu dòng tiền!"
                    : "Lựa chọn tuyệt vời! Bạn có kiến thức nền khá vững. Hãy tiếp tục dán các mẫu thô bên trái để nắm vững cơ chế định vị tài khoản ròng của Sổ cái Việt Nam."
                  }
                </div>

                <button
                  onClick={() => {
                    setCurrentQuizIndex(0);
                    setSelectedAnswerIdx(null);
                    setQuizSubmitted(false);
                    setScore(0);
                    setQuizCompleted(false);
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-500/25 transition-all uppercase tracking-wider inline-block"
                >
                  Giải Lại Thách Thức
                </button>
              </div>
            )}
          </div>

          {!quizCompleted && (
            <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-end">
              {!quizSubmitted ? (
                <button
                  onClick={() => {
                    if (selectedAnswerIdx === null) return;
                    setQuizSubmitted(true);
                    if (selectedAnswerIdx === QUIZ_QUESTIONS[currentQuizIndex].correctIdx) {
                      setScore(prev => prev + 1);
                    }
                  }}
                  disabled={selectedAnswerIdx === null}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-1"
                >
                  <span>Nộp Bài Kiểm Định</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (currentQuizIndex + 1 < QUIZ_QUESTIONS.length) {
                      setCurrentQuizIndex(prev => prev + 1);
                      setSelectedAnswerIdx(null);
                      setQuizSubmitted(false);
                    } else {
                      setQuizCompleted(true);
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-1"
                >
                  <span>{currentQuizIndex + 1 < QUIZ_QUESTIONS.length ? "Câu tiếp theo" : "Xem điểm cuối"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
