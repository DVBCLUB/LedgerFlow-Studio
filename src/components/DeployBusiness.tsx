// Version 2.0 - DeployBusiness (Phát Hành & Thương Mại Hóa)
import React, { useState } from 'react';
import { 
  Rocket, 
  Cloud, 
  GitBranch, 
  Globe, 
  Calendar, 
  Calculator, 
  CheckCircle2, 
  Copy,
  FolderOpen,
  DollarSign,
  ShieldAlert,
  Zap,
  TrendingUp,
  Server,
  FileCode
} from 'lucide-react';

export default function DeployBusiness() {
  const [activeTab, setActiveTab] = useState<'firebase_gcp' | 'devops_git' | 'product_launch' | 'legal_payment'>('firebase_gcp');
  const [copiedCodeFlag, setCopiedCodeFlag] = useState<string | null>(null);

  const triggerCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeFlag(key);
    setTimeout(() => setCopiedCodeFlag(null), 2000);
  };

  // --- TAB 3: PRODUCT LAUNCH PLANNER SCHEDULE ---
  const [launchTasks, setLaunchTasks] = useState([
    { id: 1, day: "Ngày T-14", task: "Cài đặt & hoàn thiện bản test alpha, dọn sạch log rác.", done: true },
    { id: 2, day: "Ngày T-7", task: "Tạo trailer gameplay ngắn & quay video màn hình tính năng cốt lõi.", done: false },
    { id: 3, day: "Ngày T-3", task: "Soạn thảo bài đăng Reddit, J2Team Community và Product Hunt teaser.", done: false },
    { id: 4, day: "Ngày T-0", task: "Phát hành chính thức! Gửi tin nhắn đồng hành, trả lời bình luận trong 24h đầu tiên.", done: false },
    { id: 5, day: "Ngày T+7", task: "Tổng hợp phản hồi người chơi, vá nóng các bug khẩn cập.", done: false }
  ]);

  const toggleTask = (id: number) => {
    setLaunchTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // --- TAB 4: LEGAL PAYMENT TRANSACTION CALCULATOR ---
  const [monthlySales, setMonthlySales] = useState<number>(50000000); // VNĐ

  // Calculation Fees
  const momoFee = monthlySales * 0.02; // MoMo 2%
  const stripeFee = monthlySales * 0.034 + (100 * 7500); // Stripe 3.4% + 0.3USD (Giả định 100 giao dịch)
  const vietQrFee = 0; // Hoàn toàn 0đ

  // Interactive Tab 4 State variables (lifted to prevent hook violation)
  const [intlPercent, setIntlPercent] = useState<number>(50); // percentage of sales that are international
  const [bankId, setBankId] = useState<string>("vcb");
  const [accountNo, setAccountNo] = useState<string>("1026072026");
  const [accountName, setAccountName] = useState<string>("NGUYEN VAN A");
  const [qrAmount, setQrAmount] = useState<number>(125000);
  const [qrMemo, setQrMemo] = useState<string>("DONHANGYDS9201");

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <section className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Phát Hành &amp; Thương Mại Hóa</h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Khai phóng giấc mơ solo founder: Thiết lập Firebase 0đ, setup DevOps tự động, đẩy nhanh phễu tiếp thị cùng tích hợp cổng thanh toán quét QR.
            </p>
          </div>
        </div>

        {/* TABS CONTROLS */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('firebase_gcp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'firebase_gcp' ? 'bg-emerald-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Firebase &amp; GCP 0đ
          </button>
          <button
            onClick={() => setActiveTab('devops_git')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'devops_git' ? 'bg-emerald-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Devops &amp; GitHub
          </button>
          <button
            onClick={() => setActiveTab('product_launch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'product_launch' ? 'bg-emerald-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Chiến Dịch Ra Mắt
          </button>
          <button
            onClick={() => setActiveTab('legal_payment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'legal_payment' ? 'bg-emerald-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Thương Mại &amp; Thanh Toán
          </button>
        </div>
      </section>

      {/* =================================== TAB 1: FIREBASE GCP 0đ =================================== */}
      {activeTab === 'firebase_gcp' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Lựa chọn cơ sở dữ liệu cloud tiết kiệm nhất
              </span>
              <h3 className="text-base font-black text-white">Kiến Trúc Đám Mây Tinh Gọn Cho Solo Founder</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Khi mới ra mắt sản phẩm, đừng tốn chi phí thuê máy chủ Elasticsearch hay SQL Server hàng tháng. Hãy vận dụng tối đa <strong>Firebase Spark Tier (Miễn phí)</strong> cung cấp lượng đọc/ghi Firestore và Authenticate người dùng dạt dào dư dả cho 10,000 người dùng tích cực.
              </p>
            </div>

            {/* lazy initialization guidelines to avoid crash backend */}
            <div className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                Ngăn chặn lỗi crash server khi thiếu API key môi trường
              </h4>
              <p className="text-[11.5px] text-slate-300 leading-relaxed font-semibold">
                Khi tích hợp Firebase Admin SDK hay bất kỳ SDK của bên thứ ba nào, tuyệt đối tránh việc gọi khởi tạo ngay lúc nạp module (Module load-time). Thay vào đó, hãy viết hàm khởi tạo lười (<strong>Lazy Initialization</strong>) để bảo đảm hệ thống kiểm duyệt Docker/Cloud Run luôn khởi chạy mượt mà ngay cả khi môi trường trống.
              </p>
              
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1.5">
                <span>TypeScript SDK - Safe lazy firebase initializer</span>
                <button
                  onClick={() => triggerCopy(`import admin from "firebase-admin";

let firebaseAdminInstance: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (!firebaseAdminInstance) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountKey) {
      // Throw lỗi cụ thể khi thực sự gọi đến tính năng, tránh crash server ngay lúc khởi chạy
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is missing!");
    }
    
    // Khởi tạo lười an toàn bảo mật
    firebaseAdminInstance = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey))
    });
  }
  return firebaseAdminInstance;
}`, 'lazy_fb')}
                  className="text-emerald-400 hover:text-emerald-300 font-extrabold uppercase cursor-pointer"
                >
                  {copiedCodeFlag === 'lazy_fb' ? "Đã chép!" : "Copy code"}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-[10.5px] font-mono text-slate-300 rounded-xl leading-relaxed select-text border border-slate-900 overflow-x-auto max-h-[140px]">
{`let firebaseAdminInstance = null;
export function getFirebaseAdmin() {
  if (!firebaseAdminInstance) {
    if (!process.env.FIREBASE_KEY) throw new Error("Missing credentials!");
    firebaseAdminInstance = admin.initializeApp({...});
  }
  return firebaseAdminInstance;
}`}
              </pre>
            </div>
          </div>

          {/* Secure Rules visualizer */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <Server className="w-5 h-5 text-emerald-400" />
              Sổ Tay Firestore Security Rules
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Hãy dán các quy tắc an toàn bảo mật dưới đây để ngăn cản việc rò rỉ dữ liệu, đảm bảo rằng người dùng chỉ có quyền sửa xóa đúng các bản ghi ghi công danh tính và dữ liệu bí mật tài chính của riêng họ.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono block">firestore.rules template</span>
              <pre className="text-[10px] font-mono text-slate-350 select-text overflow-x-auto max-h-[220px] leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chỉ chủ tài khoản mới được can thiệp dữ liệu
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Luật chống ghi khống bảng ghi log
    match /transactions/{txId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && resource.data.createdBy == request.auth.uid;
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 2: DEVOPS & GITHUB CI/CD =================================== */}
      {activeTab === 'devops_git' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Một chạm để deploy lên cloud rực rỡ
              </span>
              <h3 className="text-base font-black text-white">DevOps &amp; GitHub Actions Tự Động Hóa 100%</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Hạn chế việc up code thủ công bằng tay lên máy chủ thông qua FTP hoặc SSH rườm rà. Thiết lập quy chuẩn tích hợp liên tục (CI/CD) thông qua GitHub Actions tự động build Docker Container và đẩy lên Cloud Run của Google chỉ với một lệnh <code>git push</code> duy nhất.
              </p>
            </div>

            {/* Dockerfile guidelines */}
            <div className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <span className="text-xs font-black text-emerald-404 uppercase">Tệp cấu hình Build Dockerfile mỏng nhẹ an toàn</span>
              <p className="text-[11px] text-slate-300 leading-normal font-semibold">
                Mẫu Dockerfile đa tầng (Multi-stage build) giúp sấy khô tệp sản phẩm, giảm tải dung lượng image container rải rác từ 1GB xuống dưới 120MB, tiết kiệm cước lưu trữ mạng của Google Container Registry.
              </p>
            </div>

            {/* CI/CD YAML File copyable */}
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-xl border border-slate-850">
                <span className="text-[10.5px] font-mono text-slate-400 font-bold flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  GitHub Actions — deploy.yml template
                </span>
                <button
                  onClick={() => triggerCopy(`name: Deploy to Google Cloud Run

on:
  push:
    branches: [ main ] # Kích hoạt khi merge vào nhánh main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Code repo
      uses: actions/checkout@v4

    - name: Authenticate with Google Cloud GCP
      uses: google-github-actions/auth@v2
      with:
        credentials_json: \${{ secrets.GCP_SA_KEY }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v2

    - name: Authorize Docker pushes
      run: |
        gcloud auth configure-docker --quiet

    - name: Build and Push Docker Image container
      run: |
        docker build -t gcr.io/\${{ secrets.GCP_PROJECT_ID }}/my-game-app:latest .
        docker push gcr.io/\${{ secrets.GCP_PROJECT_ID }}/my-game-app:latest

    - name: Deploy to Cloud Run instance
      run: |
        gcloud run deploy my-game-service \\
          --image gcr.io/\${{ secrets.GCP_PROJECT_ID }}/my-game-app:latest \\
          --region us-central1 \\
          --platform managed \\
          --allow-unauthenticated`, 'yaml_code')}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold text-emerald-405 bg-emerald-500/10 border border-emerald-500/20 rounded-lg cursor-pointer"
                >
                  {copiedCodeFlag === 'yaml_code' ? "Đã sao chép!" : "Copy YAML"}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-[10.5px] font-mono text-slate-300 rounded-xl leading-relaxed select-text border border-slate-900 overflow-x-auto max-h-[140px]">
{`name: Deploy to Cloud Run
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: google-github-actions/auth@v2
      with:
        credentials_json: \${{ secrets.GCP_SA_KEY }}`}
              </pre>
            </div>
          </div>

          {/* DevOps info card help */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-black text-rose-450 uppercase tracking-widest flex items-center gap-1.5 block">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              Rào cản rò rỉ private credentials
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Kinh nghiệm xương máu bảo mật:
            </p>
            <ul className="space-y-3.5 text-[11px] text-slate-400 font-bold pl-1">
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>Tuyệt đối không commit tệp chìa khóa bí mật như <strong className="text-slate-300">.env</strong>, <strong className="text-slate-300">secret-account.json</strong> lên các kho mã nguồn công cộng GitHub.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>Luôn sử dụng tệp mẫu <strong className="text-slate-300">.env.example</strong> để hướng dẫn các cộng tác viên tự điền cấu hình riêng an toàn.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* =================================== TAB 3: PRODUCT LAUNCH PLANNER =================================== */}
      {activeTab === 'product_launch' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="space-y-1.5">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Xây dựng sức mạnh cộng hưởng từ cộng đồng
              </span>
              <h3 className="text-base font-black text-white">Xây dựng phễu Marketing 0đ cho Solo Founder Việt Nam</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Tại Việt Nam, các hội nhóm lập trình như <strong>J2Team Community, Reddit Lập Trình</strong> là nơi lưu trú của hàng trăm ngàn người dùng am hiểu công nghệ. Hãy chia sẻ chân thật quá trình tự tay viết game (Devlog) thay vì đăng bài bán hàng thô lỗ để nhận được nhiều lượt lan tỏa chân thực nhất.
              </p>
            </div>

            {/* PH & Reddit launch tips list */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-200">Mẹo viết bài lan tỏa trên Reddit</span>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Đăng video chơi thử không che giấu (No hype, just real gameplay / features) vào sub-reddit <code>r/indiegames</code>, <code>r/Unity3D</code>. Thừa nhận những điểm chưa mượt để xin đóng góp ý kiến xây dựng.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-200">Sắp đặt giờ vàng Product Hunt</span>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Lên lịch ra mắt lúc 00:01 giờ Thái Bình Dương (tức khoảng 14:00 giờ chiều Việt Nam) để tận dụng trọn vẹn 24 giờ bầu chọn tìm vị trí Top Product of the day.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive launch tasks scheduler checklist */}
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Lịch Trình Ra Mắt Sản Phẩm (T-Minus)
            </h3>
            <p className="text-[11.5px] text-slate-400 font-semibold leading-relaxed">
              Click tick vào các mốc thời gian hoàn thành dưới đây để tự mình kiểm kê độ trưởng thành, chuẩn bị sẵn sàng trước ngày vinh danh bấm nút xuất bản rực rỡ.
            </p>

            <div className="space-y-2.5 bg-slate-950 p-4 border border-slate-850 rounded-xl">
              {launchTasks.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => toggleTask(t.id)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-start gap-2.5 hover:bg-slate-900 ${
                    t.done 
                      ? 'border-emerald-500/20 bg-emerald-950/10 text-slate-400' 
                      : 'border-slate-850 bg-slate-950 text-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => {}} // handled by div click
                    className="mt-0.5 accent-emerald-500 shrink-0 cursor-pointer"
                  />
                  <div>
                    <span className={`text-[10px] uppercase font-mono font-black ${t.done ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {t.day}
                    </span>
                    <p className={`mt-0.5 font-medium leading-relaxed ${t.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {t.task}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================== TAB 4: LEGAL, STRIPE VS PADDLE MoR COMPARISON & HYBRID ROUTING =================================== */}
      {activeTab === 'legal_payment' && (() => {
        // Advanced calculations based on PDF pages 7 & 8
        const internationalSales = (monthlySales * intlPercent) / 100;
        const domesticSales = monthlySales - internationalSales;

        // Transaction assumptions: assume average price is 125,000 VND ($5 USD) per ticket/month
        const averageTicketSize = 125000;
        const estimatedTxCount = Math.max(1, Math.round(monthlySales / averageTicketSize));
        const domesticTxCount = Math.round(estimatedTxCount * (1 - intlPercent / 100));
        const intlTxCount = estimatedTxCount - domesticTxCount;

        // Stripe Fees (2.9% + 0.3USD for local; 3.9% + 0.3USD for international cards. $0.30 is ~7,500 VND)
        const stripeLocalCommissions = domesticSales * 0.029 + domesticTxCount * 7500;
        const stripeIntlCommissions = internationalSales * 0.039 + intlTxCount * 7500;
        const totalStripeCommissions = stripeLocalCommissions + stripeIntlCommissions;

        // Stripe Tax compliance SaaS cost & local бухгалтер / audit overhead representation (as mentioned on Page 8)
        const stripeAccountingTaxOverhead = internationalSales > 0 
          ? Math.round(1500000 + internationalSales * 0.04) // Minimum 1.5M for tax agent + 4% for international tax filings / penalties risk
          : 0;
        const stripeTotalCost = totalStripeCommissions + stripeAccountingTaxOverhead;

        // Paddle MoR Fees (5.0% + 0.50USD. $0.50 is ~12,500 VND)
        const paddleTotalCommissions = monthlySales * 0.05 + estimatedTxCount * 12500;
        const paddleAccountingTaxOverhead = 0; // Paddle handles 100% tax compliance internationally
        const paddleTotalCost = paddleTotalCommissions + paddleAccountingTaxOverhead;

        // Optimal Hybrid Split suggested in Page 9: Local sales via Stripe Domestic (2.9% + low risk) + Intl sales via Paddle MoR (no cross-border audits)
        const hybridStripeLocalCost = domesticSales * 0.029 + domesticTxCount * 7500;
        const hybridPaddleIntlCost = internationalSales * 0.05 + intlTxCount * 12500;
        const hybridTotalCost = hybridStripeLocalCost + hybridPaddleIntlCost;

        return (
          <div className="grid lg:grid-cols-12 gap-6 select-text">
            
            {/* LEFT SIDE: LEGAL TYPE & MERCHANT OF RECORD VS GATEWAY GUIDE */}
            <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
              
              <div className="space-y-1.5">
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Trang 7-8: Pháp lý Kế toán &amp; Cổng dòng tiền quốc tế
                </span>
                <h3 className="text-base font-black text-white">Lựa Chọn Kiến Trúc Thanh Toán Để Ngăn Ngừa Thảm Họa Kế Toán</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Sản phẩm giá cực thấp (<strong className="text-emerald-400">giá ví dụ $5 / 125.000đ</strong>) bán với số lượng lớn sinh ra hàng vạn giao dịch nhỏ (microtransactions). Nếu chọn sai cổng thanh toán, solo founder sẽ ngay lập tức đối mặt với cơn ác mộng khớp sao kê kế toán và rủi ro phạt thuế VAT toàn cầu!
                </p>
              </div>

              {/* Stripe vs Paddle Comparison Cabinet Matrix (Derived from PDF) */}
              <div className="space-y-3">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 pt-1">
                  📊 So Sánh Bản Chất: Stripe (Processor) vs Paddle (MoR)
                </span>

                <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950">
                  <table className="w-full text-left border-collapse text-[11px] font-sans">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-350 font-black">
                        <th className="p-3">Tiêu Chí Đánh Giá</th>
                        <th className="p-3 text-purple-400">Stripe (Payment Gateway)</th>
                        <th className="p-3 text-emerald-400">Paddle (Merchant of Record)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-400">
                      <tr>
                        <td className="p-3 font-bold text-white">Phí gốc cơ bản</td>
                        <td className="p-3 font-mono">2,9% + 0.30 USD (Nội địa)</td>
                        <td className="p-3 font-mono text-emerald-500">5% + 0.50 USD (Trọn gói)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Chủ thẻ pháp lý (Legal Seller)</td>
                        <td className="p-3">
                          <span className="text-orange-400 font-bold block mb-0.5">Doanh nghiệp của bạn</span>
                          Bạn tự chịu trách nhiệm pháp lý trực tiếp với từng quốc gia của khách hàng.
                        </td>
                        <td className="p-3">
                          <span className="text-emerald-400 font-bold block mb-0.5">Paddle là người bán</span>
                          Paddle mua lại phần mềm của bạn rồi phân phối hợp pháp, đứng ra ký hợp đồng.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">VAT &amp; Sales Tax toàn cầu</td>
                        <td className="p-3">
                          <span className="text-rose-400">Tự tính toán, khai báo</span>
                          Bạn tự nộp thuế VAT tại hơn 200+ quốc gia khi cán mốc chịu thuế địa phương.
                        </td>
                        <td className="p-3 text-emerald-350">
                          <span className="text-emerald-450 font-bold block">Tự động 100%</span>
                          Paddle tự thu, tự khai báo và nộp thuế thay cho bạn tại 200+ vùng lãnh thổ.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Bút toán Sổ Cái hạch toán</td>
                        <td className="p-3">
                          <strong className="text-rose-450">Hàng vạn bút toán dẹt</strong>
                          10.000 khách mua = 10.000 bút toán đối soát kế toán khổng lồ trên Ledger.
                        </td>
                        <td className="p-3 text-emerald-350">
                          <strong className="text-emerald-405 font-bold">1 bút toán duy nhất</strong>
                          Cuối mỗi chu kỳ, nhận đúng 1 lần phát sinh chuyển khoản tổng kèm 1 hóa đơn.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Phí Chargebacks &amp; Gian lẬn</td>
                        <td className="p-3">Tự chịu rủi ro bồi hoàn và đóng tiền phạt nặng nề (~$15/tranh chấp).</td>
                        <td className="p-3">Bao trọn gói, Paddle chịu rủi ro gian lận và tự gánh bồi hoàn.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Suggested Split Box from PDF Page 9 */}
              <div className="bg-emerald-955/15 border border-emerald-900/25 p-4 rounded-xl space-y-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5 font-mono">
                  🔑 Chiến lược Tối Ưu Phân Tách Cấu Trúc (Page 9)
                </span>
                <p className="text-[11.5px] text-slate-350 leading-relaxed font-semibold">
                  Để tối đa hóa lợi nhuận ròng:
                  <br />
                  1. Hãy sử dụng <strong className="text-sky-400">VietQR/Stripe nội địa</strong> cho khách hàng Việt Nam để hưởng phí siêu thấp và dễ dàng khai báo thuế trong nước.
                  <br />
                  2. Chạy <strong className="text-emerald-400">Paddle MoR</strong> cho toàn bộ giao dịch quốc tế để loại bỏ hoàn toàn các rủi ro kiểm toán xuyên biên giới và cắt đứt hóa đơn rắc rối!
                </p>
              </div>

            </div>

            {/* RIGHT SIDE: INTERACTIVE TRANSACTIONS SPLITTER & FEE SIMULATOR */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5">
              
              <div className="space-y-1">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-400" />
                  Giả Lập Doanh Thu &amp; Cước Phí Định Kỳ
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Nhập số liệu để mô phỏng sự biến chuyển dòng tiền dưới các hạ tầng khác nhau:
                </p>
              </div>

              {/* Controls block */}
              <div className="space-y-4 bg-slate-950 p-4 border border-slate-900 rounded-xl">
                {/* Monthly sales total */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold block">Tổng Doanh Số Tháng Mong Muốn:</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1.5 text-xs text-slate-500 font-bold font-mono">đ</span>
                    <input
                      type="number"
                      value={monthlySales}
                      onChange={e => setMonthlySales(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-3 py-1 text-xs text-white font-mono font-bold"
                    />
                  </div>
                  <span className="text-[9.5px] text-slate-500 font-semibold">
                    Tương đương khoảng <strong className="text-slate-400 font-mono">{(estimatedTxCount).toLocaleString()}</strong> giao dịch (${(averageTicketSize/25000).toFixed(0)} / 125.000đ).
                  </span>
                </div>

                {/* International split slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Tỉ lệ đơn quốc tế xuất khẩu:</span>
                    <span className="text-purple-400 font-mono font-extrabold">{intlPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={intlPercent}
                    onChange={e => setIntlPercent(Number(e.target.value))}
                    className="w-full accent-purple-500 h-1 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono font-semibold">
                    <span>Nội địa (0% Intl)</span>
                    <span>Toàn Cầu (100% Intl)</span>
                  </div>
                </div>
              </div>

              {/* Simulation Result output blocks */}
              <div className="space-y-3.5">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">
                  🛡️ Báo Cáo Định Phí &amp; Chi Phí Quản Trị Hệ Thống
                </span>

                {/* Scenario 1: Stripe Solo */}
                <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-purple-400 block">1. Ổn định duy nhất bằng Stripe:</span>
                    <span className="text-xs font-mono font-black text-rose-400">-{Math.round(stripeTotalCost).toLocaleString()} đ</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-normal font-medium pl-1 text-slate-450">
                    <div>• Phí cổng cơ bản: <span className="font-mono text-slate-350">{Math.round(totalStripeCommissions).toLocaleString()}đ</span></div>
                    {intlPercent > 0 && (
                      <div className="text-orange-400 font-semibold italic">• + Chi phí rủi ro kiểm toán &amp; thuế VAT rắc rối: ~{stripeAccountingTaxOverhead.toLocaleString()}đ (Yêu cầu thuê kế toán viên hoặc công cụ Stripe Tax)</div>
                    )}
                  </div>
                </div>

                {/* Scenario 2: Paddle MoR Solo */}
                <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-emerald-400 block">2. Chạy hoàn toàn qua Paddle MoR:</span>
                    <span className="text-xs font-mono font-black text-emerald-400">-{Math.round(paddleTotalCost).toLocaleString()} đ</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-normal font-medium pl-1 text-slate-450">
                    <div>• Phí MoR trọn gói (5%+0.5$): <span className="font-mono text-slate-350">{Math.round(paddleTotalCommissions).toLocaleString()}đ</span></div>
                    <div className="text-emerald-500 font-semibold">• + Chi phí hâm nóng đối soát VAT: 0 VNĐ (Do Paddle gánh 100% trách nhiệm)</div>
                  </div>
                </div>

                {/* Scenario 3: Optimal Split Hybrid Strategy (Trang 9) */}
                <div className="p-3.5 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-400 block uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-4 h-4 text-emerald-405" />
                      3. Phương án Hybrid Tối Ưu (Page 9):
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-450">-{Math.round(hybridTotalCost).toLocaleString()} đ</span>
                  </div>
                  <div className="text-[10px] text-slate-450 leading-normal font-medium pl-1">
                    <div>• Stripe nội địa (cho {100 - intlPercent}% Local sales): <span className="font-mono text-slate-350">{Math.round(hybridStripeLocalCost).toLocaleString()}đ</span></div>
                    <div>• Paddle quốc tế (cho {intlPercent}% Intl sales): <span className="font-mono text-slate-350">{Math.round(hybridPaddleIntlCost).toLocaleString()}đ</span></div>
                    <div className="text-emerald-405 font-bold uppercase mt-1 tracking-wider text-[9.5px]">🚀 Khuyên dùng: Tiết kiệm tối đa {(Math.max(0, Math.round(stripeTotalCost - hybridTotalCost))).toLocaleString()}đ so với Stripe đơn lẻ!</div>
                  </div>
                </div>

              </div>
              
              <div className="text-[9.5px] text-slate-500 font-semibold leading-normal pt-1 flex items-start gap-1.5">
                <span className="text-amber-500">⚠</span>
                <span>Từ góc độ kiểm toán tài chính Việt Nam, Paddle giúp bạn nhận đúng 1 lần chuyển khoản sạch mỗi tháng vào ngân hàng đi kèm 1 hóa đơn thương mại dạt dào pháp lý!</span>
              </div>

            </div>

            {/* INTERACTIVE VIETQR CODE GENERATOR - INTEGRATED PAYMENTS */}
            <div className="col-span-12 bg-slate-950/40 border border-slate-850 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                <div className="space-y-1 border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 className="text-xs font-black text-emerald-450 tracking-widest uppercase font-mono">
                      VietQR Instant Generator (0đ Transaction Fee Method)
                    </h3>
                  </div>
                  <h4 className="text-sm font-black text-white">
                    Tích Hợp Cổng Thanh Toán VietQR Tự Động Chỉ Trong 1 Phút
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold">
                    Thay vì trả 2%-3.5% cho bên thứ ba, Solo Founder có thể nhúng trực tiếp API VietQR (Hoàn toàn miễn phí, 0đ chiết khấu) phục vụ bán sỉ/lẻ.
                  </p>
                </div>
                
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[10.5px] font-semibold leading-relaxed text-amber-100">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <p>
                    Boundary note: preview QR ben duoi dung dich vu VietQR online de minh hoa nhanh. Ban desktop offline-first can renderer QR local va nguoi duyet doi chieu tai khoan, so tien, memo truoc khi dung that.
                  </p>
                </div>

                <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">Standard format:</span>
                  <span>NAPAS-247 QR Code API v2</span>
                </div>
              </div>

              <div className="grid md:grid-cols-12 gap-8">
                {/* Form fields */}
                <div className="md:col-span-7 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-mono font-bold block">1. NGÂN HÀNG THỤ HƯỞNG</label>
                      <select
                        value={bankId}
                        onChange={e => setBankId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs font-bold rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="vcb">Vietcombank (VCB)</option>
                        <option value="tcb">Techcombank (TCB)</option>
                        <option value="acb">Á Châu Bank (ACB)</option>
                        <option value="mb">MB Bank (MB)</option>
                        <option value="bidv">BIDV Bank</option>
                        <option value="icb">VietinBank (CTG)</option>
                        <option value="tpb">TPBank (TPB)</option>
                        <option value="vpb">VPBank</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-mono font-bold block">2. SỐ TÀI KHOẢN (STK)</label>
                      <input
                        type="text"
                        value={accountNo}
                        onChange={e => setAccountNo(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="Ví dụ: 1026072026"
                        className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs font-mono font-bold rounded-xl p-2.5 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-mono font-bold block">3. TÊN CHỦ TÀI KHOẢN (HOA KHÔNG DẤU)</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={e => setAccountName(e.target.value.toUpperCase())}
                        placeholder="NANG LUONG VANG"
                        className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-mono font-bold block">4. SỐ TIỀN THANH TOÁN (VND)</label>
                      <input
                        type="number"
                        step="1000"
                        value={qrAmount}
                        onChange={e => setQrAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="125000"
                        className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs font-mono font-bold rounded-xl p-2.5 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono font-bold block">5. NỘI DUNG CHUYỂN KHOẢN (MEMO - KHÔNG DẤU)</label>
                    <input
                      type="text"
                      value={qrMemo}
                      onChange={e => setQrMemo(e.target.value.replace(/[^a-zA-Z0-9_\s]/g, ""))}
                      placeholder="DONHANG9203"
                      className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Code embed snippet generator */}
                  <div className="space-y-2 bg-[#040711] border border-slate-900 rounded-xl p-4 mt-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Dòng code nhúng API tự sinh cho App/Website của bạn:</span>
                      <button
                        onClick={() => triggerCopy(`https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${qrAmount}&addInfo=${encodeURIComponent(qrMemo)}&accountName=${encodeURIComponent(accountName)}`, 'vietqr_api')}
                        className="text-[9.5px] uppercase font-mono font-black text-emerald-450 hover:text-emerald-350 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 cursor-pointer self-start"
                      >
                        {copiedCodeFlag === 'vietqr_api' ? "Đã chép!" : "Copy URL"}
                      </button>
                    </div>
                    <pre className="text-[9.5px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed select-text mt-1.5 bg-slate-950/70 p-2.5 rounded border border-slate-900">
                      {`<img src="https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${qrAmount}&addInfo=${encodeURIComponent(qrMemo)}&accountName=${encodeURIComponent(accountName)}" alt="VietQR Code" />`}
                    </pre>
                  </div>
                </div>

                {/* Display card visual rendering */}
                <div className="md:col-span-5 flex justify-center items-center border-0 border-transparent">
                  <div className="w-full max-w-[270px] bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-4">
                    {/* Visual Card elements */}
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse"></span>
                        <span className="text-[10px] font-black text-slate-400 font-mono">NAPAS 24/7 QR</span>
                      </div>
                      <span className="text-[11px] font-black italic text-purple-400">{bankId.toUpperCase()}</span>
                    </div>

                    <div className="flex justify-center py-2 bg-white rounded-xl p-2 border border-slate-200 shadow-inner">
                      <img
                        src={`https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${qrAmount}&addInfo=${encodeURIComponent(qrMemo)}&accountName=${encodeURIComponent(accountName)}`}
                        alt="Scannable VietQR Code"
                        className="w-44 h-44 block bg-white shrink-0 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[9.5px] font-bold leading-relaxed text-amber-100">
                      Online preview only. Khi dong goi offline, thay bang QR renderer local va giu buoc human approval.
                    </p>

                    <div className="space-y-2 text-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase block">Chủ Tài Khoản</span>
                        <span className="font-extrabold text-slate-200 uppercase tracking-wide block truncate">{accountName || 'CHƯA NHẬP TÊN'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-850 pt-2 text-[10.5px] font-mono leading-tight">
                        <div className="text-left">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Số tiền:</span>
                          <span className="font-black text-emerald-400 font-sans">{(qrAmount).toLocaleString()}đ</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Nội dung (Memo):</span>
                          <span className="font-extrabold text-slate-350 truncate block max-w-[90px]">{qrMemo || 'Không có'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

    </div>
  );
}
