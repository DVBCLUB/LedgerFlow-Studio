import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Database, 
  Terminal, 
  Trophy as CupIcon, 
  FileText, 
  Download, 
  Sparkles, 
  Settings, 
  Award, 
  CircleDot, 
  Activity, 
  Printer, 
  ArrowRight, 
  CloudLightning,
  Coins,
  History,
  Zap,
  Clock,
  ExternalLink,
  Play,
  Check,
  Copy,
  Upload
} from 'lucide-react';

interface MilestoneTask {
  id: string;
  category: string;
  text: string;
  subText: string;
  points: number;
}

const GAMIFIED_TASKS: MilestoneTask[] = [
  {
    id: 'g_task_guerrilla',
    category: 'Chiến lược du kích',
    text: 'Sáng tạo ý tưởng ngách & gọi AI Thẩm định',
    subText: 'Thực hiện tại tab "0. Phòng Sản Phẩm Du Kích" để phân mổ 5 Trụ Cột và xây Lean Canvas.',
    points: 15
  },
  {
    id: 'g_task_pro_quota',
    category: 'Cấu hình Hệ thống',
    text: 'Đồng bộ tài khoản phụ hoặc nạp thêm Secrets API Key',
    subText: 'Trải nghiệm mượt mà với Quota Pro chất lượng cao bằng cách nạp biến PMSTUDY.',
    points: 10
  },
  {
    id: 'g_task_vietqr',
    category: 'Nghiệp vụ thực chiến',
    text: 'Kiểm thử cơ chế đối soát VietQR tự động',
    subText: 'Học tập về cách Thông tư 123 và hóa đơn điện tử được tích hợp tại "9. Kế Toán Thực Chiến VN".',
    points: 20
  },
  {
    id: 'g_task_sandbox_account',
    category: 'Kế toán quản trị',
    text: 'Khai báo tài khoản Sandbox Nợ/Có chuẩn mực',
    subText: 'Khai báo hạch toán doanh thu, tài sản ròng rã tại tab "6. Không Gian Dữ Liệu Tự Do".',
    points: 15
  },
  {
    id: 'g_task_3_transactions',
    category: 'Kế toán quản trị',
    text: 'Ghi nhận thành công 3 định khoản hạch toán kép',
    subText: 'Tạo tối thiểu 3 bút toán đối khớp để đảm bảo Nguyên lý Cân đối phát sinh kiểm chứng.',
    points: 20
  },
  {
    id: 'g_task_pandas',
    category: 'Dữ liệu Lab',
    text: 'Trải nghiệm dọn dẹp dữ liệu bằng Pandas & SQLite',
    subText: 'Chạy một script thực thi làm dọn và chuẩn hóa sao kê tại "3. Đa Ngành Data Science & FinLab".',
    points: 10
  },
  {
    id: 'g_task_ml_applied',
    category: 'Trí tuệ nhân tạo',
    text: 'Mô phỏng huấn luyện mô hình Machine Learning hoặc kinh tế game',
    subText: 'Thử nghiệm dự báo chuỗi thời gian hay chạy thuật toán chặn nợ xấu tại "10. ML Thực Tế".',
    points: 10
  }
];

const PUBLIC_TEMPLATES = [
  {
    id: 'p1',
    title: '💬 Ký sự Solo Founder kiếm tiền lẻ',
    desc: 'Báo cáo tuần thực chiến chia sẻ về động cơ tích hợp VietQR 0đ cho shop bán hàng.',
    content: `🚀 KÝ SỰ SOLO FOUNDER: TẠI SAO TÔI QUYẾT ĐỊNH ĐỐI SOÁT VIETQR 0% PHÍ?

Hôm nay chia sẻ một bài học nhỏ khi build LedgerFlow Studio. 
Thay vì dùng cổng tích hợp tốn 2-3% phí + thời gian duyệt rườm rà, tôi dùng luồng dọn sao kê ngân hàng VCB / VietinBank thô và so khớp với mã ghi chú tự động.

Nhận diện tức khắc trong 10 giây:
✅ Chi phí vận hành giao dịch: 0đ
✅ Tiền về tài khoản thẳng, không giam 7 ngày
✅ Tự động ghi sổ kế toán kép (Nợ 112 / Có 511) theo TT 200.

Mời AE ghé thăm demo & hùa cùng build nhé! #BuildInPublic #SaaS #Vietnam`
  },
  {
    id: 'p2',
    title: '📊 Bản đồ 10 ý tưởng Sản phẩm Dữ liệu',
    desc: 'Mẫu post đúc rút từ Phòng sản phẩm du kích gây thu hút cộng đồng khởi nghiệp.',
    content: `💡 CHIA SẺ: 10 Ý TƯỞNG SẢN PHẨM KHỞI NGHIỆP DỮ LIỆU TẠI VIỆT NAM

Tôi khởi động phòng nghiên cứu "Guerrilla Product Hub" cho LedgerFlow Studio và phát hiện ra 3 ngách cực béo bở:

1. Trình dọn dẹp sao kê PDF ngân hàng thành Excel chuẩn (VCB, BIDV, Agr)
2. Công cụ kiểm soát chéo chênh lệch số dư nội bộ & sao kê cho shop online
3. Parser hóa đơn điện tử XML từ Tổng cục Thuế khớp sổ quản lý

Mọi người quan tâm ý tưởng nào nhất? Tôi sẽ open source hoàn toàn bộ pipeline xử lý nhé! #VnTech #SoloFounder #BuildInPublic`
  },
  {
    id: 'p3',
    title: '⚖️ Đánh Giá Thẩm Định của Hội Đồng Cố Vấn',
    desc: 'Post chia sẻ bài học đắt giá khi bị 4 Cố Vấn "đập tơi tả" để tìm điểm cân bằng tài chính.',
    content: `😅 TRẢI NGHIỆM ĐẮT GIÁ: KHI BỊ "HỘI ĐỒNG CỐ VẤN" ĐẬP TƠI TẢ

Bản báo cáo tuần này của tôi nhận gạch đá ngập tràn từ các cố vấn ảo Tech Lead, CFO, Product PM & Growth Hacker:
- CFO: "Sản phẩm quá rộng, 13 tabs làm mông lung người dùng. Tập trung vào VietQR ngay!"
- Tech Lead: "Sử dụng LocalStorage làm chỗ chứa chính là tự sát công nghệ. Khách đổi trình duyệt mất sạch!"

Bài học rút ra: Phải tinh giản dòng hạch toán, lưu trữ persistent trên cloud thay vì tham tính năng. Hãy tập trung làm tốt duy nhất một thứ! #StartupVN #Finance #BuildInPublic`
  }
];

export default function CommandCenter() {
  // Metrics loaded from localStorage
  const [metrics, setMetrics] = useState({
    ideasCount: 0,
    transactionsCount: 0,
    assetsCount: 0,
    registeredTablesCount: 0,
    checkedRoadmapTasksCount: 0,
    usingCustomKey: false
  });

  // Gamification completed tasks
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [scoreNotification, setScoreNotification] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  // New States for VietQR parsing & Build in Public
  const [parserState, setParserState] = useState<'idle' | 'parsing' | 'completed'>('idle');
  const [parserProgress, setParserProgress] = useState(0);
  const [parserLogs, setParserLogs] = useState<string[]>([]);
  const [simulatedTx, setSimulatedTx] = useState<any[]>([]);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string>('p1');
  const [customPostContent, setCustomPostContent] = useState<string>('');

  useEffect(() => {
    const selectedTemplate = PUBLIC_TEMPLATES.find(t => t.id === activePostId);
    if (selectedTemplate) {
      setCustomPostContent(selectedTemplate.content);
    }
  }, [activePostId]);

  const startStatementParsingSimulation = () => {
    if (parserState !== 'idle') return;
    setParserState('parsing');
    setParserProgress(5);
    setParserLogs(["[KHỞI TẠO] Nhận tệp chứa dải sao kê tài khoản ngân hàng...", "[PHÂN TÍCH] Đang trích xuất siêu dữ liệu bảng tính XLS..."]);

    const steps = [
      { prg: 25, log: "📂 Đã tìm thấy cấu trúc tệp VCB_Excel_Export.xlsx (Dải 1,200 dòng hạch toán)..." },
      { prg: 50, log: "🤖 Quét AI: Thẩm định mã chuyển khoản VietQR & phân rã nội dung thanh toán..." },
      { prg: 75, log: "⚖️ Định dạng bút toán kép Ghi Nợ TK 112 (Tiền gửi ngân hàng) / Ghi Có TK 511 (Doanh thu)..." },
      { prg: 100, log: "🎉 Thành công! Hợp nhất sổ phụ hạch toán và đã sẵn sàng đồng bộ sâu đĩa cứng máy chủ!" }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setParserProgress(step.prg);
        setParserLogs(prev => [...prev, step.log]);
        
        if (step.prg === 100) {
          setParserState('completed');
          const draftTx = [
            { id: 'vqr-' + Date.now() + '-1', projectId: 'proj-1', amount: 580000, type: 'Thu', gateway: 'VietQR', date: new Date().toISOString().split('T')[0], description: 'Hạch toán VietQR: Thu tiền Đơn hàng #1089' },
            { id: 'vqr-' + Date.now() + '-2', projectId: 'proj-1', amount: 1250000, type: 'Thu', gateway: 'VietQR', date: new Date().toISOString().split('T')[0], description: 'Hạch toán VietQR: Thu tiền Đơn hàng #1090' },
            { id: 'vqr-' + Date.now() + '-3', projectId: 'proj-1', amount: 4500000, type: 'Thu', gateway: 'VietQR', date: new Date().toISOString().split('T')[0], description: 'Hạch toán VietQR: Khách sỉ đặt cọc #91' },
            { id: 'vqr-' + Date.now() + '-4', projectId: 'proj-1', amount: 11000, type: 'Chi', gateway: 'VietQR', date: new Date().toISOString().split('T')[0], description: 'Hạch toán VietQR: Phí SMS banking định kỳ tháng' }
          ];
          setSimulatedTx(draftTx);
          pushLog("Đã dọn sạch dải sao kê & trích xuất 4 định khoản VietQR thành công!");
          playSuccessChime();
        }
      }, (index + 1) * 900);
    });
  };

  const confirmSaveToLedger = () => {
    try {
      const stored = localStorage.getItem('lf_db_transactions');
      let currentList = [];
      if (stored) {
        currentList = JSON.parse(stored);
      } else {
        currentList = [
          { id: 'tx-1', projectId: 'proj-1', amount: 120000000, type: 'Thu', gateway: 'Stripe', date: '2026-05-01' },
          { id: 'tx-2', projectId: 'proj-2', amount: 15000000, type: 'Thu', gateway: 'VietQR', date: '2026-05-15' },
          { id: 'tx-3', projectId: 'proj-1', amount: 24000500, type: 'Chi', gateway: 'Tiền mặt', date: '2026-05-18' },
          { id: 'tx-4', projectId: 'proj-3', amount: 8500000, type: 'Chi', gateway: 'MoMo', date: '2026-05-22' }
        ];
      }
      
      const updatedList = [...simulatedTx, ...currentList];
      localStorage.setItem('lf_db_transactions', JSON.stringify(updatedList));
      
      setMetrics(prev => ({
        ...prev,
        transactionsCount: updatedList.length
      }));
      
      pushLog(`Đã sáp nhập và đồng bộ sâu ${simulatedTx.length} bút toán mới vào Sổ Cái Quản Trị.`);
      setSimulatedTx([]);
      setParserState('idle');
      setParserProgress(0);
      setParserLogs([]);
      playVictoryFanfare();
      
      setScoreNotification(`⭐ Đối khớp & Đồng bộ +50 điểm!`);
      setTimeout(() => setScoreNotification(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPostContent = () => {
    try {
      navigator.clipboard.writeText(customPostContent);
      setCopiedPostId(activePostId);
      pushLog(`Đã sao chép nội dung bài đăng "${PUBLIC_TEMPLATES.find(t => t.id === activePostId)?.title}" thành công!`);
      playSuccessChime();
      setTimeout(() => setCopiedPostId(null), 2000);
    } catch (err) {
      console.warn("Clipboard write failed: ", err);
    }
  };

  // Sound effects generator (Chime sound on checking task)
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(1e-4, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = ctx.currentTime;
      playTone(523.25, now, 0.35); // C5
      playTone(659.25, now + 0.08, 0.35); // E5
      playTone(783.99, now + 0.16, 0.5); // G5
      playTone(1046.50, now + 0.28, 0.7); // C6
    } catch (e) {
      console.warn("Audio playback context was blocked by browser autoplay policy.");
    }
  };

  // Play a deeper "completion of certificate" sound
  const playVictoryFanfare = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number, vol = 0.1) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(1e-4, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      playTone(523.25, now, 0.2); // C5
      playTone(523.25, now + 0.2, 0.2); // C5
      playTone(523.25, now + 0.4, 0.2); // C5
      playTone(659.25, now + 0.6, 0.4); // E5
      playTone(587.33, now + 1.0, 0.4); // D5
      playTone(659.25, now + 1.4, 0.4); // E5
      playTone(783.99, now + 1.8, 0.8, 0.15); // G5
    } catch (e) {
      console.warn("Audio block context", e);
    }
  };

  // Log message generator
  const pushLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setSystemLogs(prev => [`[${timestamp}] 📡 ${msg}`, ...prev.slice(0, 19)]);
  };

  // Fetch metrics and state on mount
  useEffect(() => {
    // 1. Ideas
    let ideasCount = 0;
    try {
      const storedIdeas = localStorage.getItem('guerrilla_unexpected_ideas');
      if (storedIdeas) {
        ideasCount = JSON.parse(storedIdeas).length;
      }
    } catch (_) {}

    // 2. Transactions, Assets
    let transactionsCount = 0;
    let assetsCount = 0;
    try {
      const tx = localStorage.getItem('lf_db_transactions');
      if (tx) transactionsCount = JSON.parse(tx).length;
      const ass = localStorage.getItem('lf_db_assets');
      if (ass) assetsCount = JSON.parse(ass).length;
    } catch (_) {}

    // 3. Registered Tables & Roadmaps Tasks
    let registeredTablesCount = 0;
    let checkedRoadmapTasksCount = 0;
    try {
      const tab = localStorage.getItem('fastrack_custom_registered_tables');
      if (tab) registeredTablesCount = JSON.parse(tab).length;
      const tsk = localStorage.getItem('fastrack_checked_tasks');
      if (tsk) checkedRoadmapTasksCount = JSON.parse(tsk).length;
    } catch (_) {}

    setMetrics({
      ideasCount,
      transactionsCount,
      assetsCount,
      registeredTablesCount,
      checkedRoadmapTasksCount,
      usingCustomKey: false
    });

    // Check Gemini API key status from backend
    fetch('/api/gemini/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(prev => ({ ...prev, usingCustomKey: data.usingCustomKey }));
          pushLog(`Hệ thống Gemini được cấu hình: ${data.keyName}`);
        }
      })
      .catch((_) => {
        pushLog('Không thể đối soát trực tiếp máy chủ Gemini Status. Chạy ngoại tuyến.');
      });

    // Load gamification checked tasks
    try {
      const savedProgress = localStorage.getItem('ledgerflow_gamified_progress');
      if (savedProgress) {
        setCompletedTaskIds(JSON.parse(savedProgress));
      }
    } catch (_) {}

    // Initial system logs setup
    pushLog("Bảng chỉ huy LedgerFlow Studio v4 đã sẵn sàng.");
    pushLog(`Tải thành công ${ideasCount} ý tưởng tác chiến du kích.`);
    pushLog(`Đối soát phát hiện ${transactionsCount} định khoản hạch toán kép trong Sandbox.`);
  }, []);

  // Update gamified checklist
  const handleToggleTask = (taskId: string, points: number, text: string) => {
    const isCompleted = completedTaskIds.includes(taskId);
    let updated: string[];

    if (isCompleted) {
      updated = completedTaskIds.filter(id => id !== taskId);
      pushLog(`Đã bỏ đánh dấu: "${text}"`);
    } else {
      updated = [...completedTaskIds, taskId];
      playSuccessChime();
      pushLog(`Chúc mừng! Đã hoàn thành nhiệm vụ: "${text}" (+${points} điểm)`);
      
      // Trigger temporary floating score pop-up
      setScoreNotification(`+${points} Điểm Thực Chiến!`);
      setTimeout(() => setScoreNotification(null), 2500);

      // Victory fanfare if everything completed!
      if (updated.length === GAMIFIED_TASKS.length) {
        setTimeout(() => {
          playVictoryFanfare();
          pushLog("🏆 HOÀN THÀNH TOÀN BỘ CHƯƠNG TRÌNH LEDGERFLOW - BẠN ĐÃ LÀ BẬC THẦY TÁC CHIẾN ĐA NĂNG!");
        }, 600);
      }
    }

    setCompletedTaskIds(updated);
    localStorage.setItem('ledgerflow_gamified_progress', JSON.stringify(updated));
  };

  // Calculations for score and progress
  const totalScore = completedTaskIds.reduce((sum, id) => {
    const task = GAMIFIED_TASKS.find(t => t.id === id);
    return sum + (task ? task.points : 0);
  }, 0);

  const maxScore = GAMIFIED_TASKS.reduce((sum, t) => sum + t.points, 0);
  const completionPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Print dossier preview layout
  const handleTriggerPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Hãy cho phép cửa sổ bật lên (popup) để in tài liệu hạch toán!");
      return;
    }

    // Get loaded elements
    let ideasText = 'Chưa có ý tưởng du kích nào được ghi nhận.';
    try {
      const storedIdeas = localStorage.getItem('guerrilla_unexpected_ideas');
      if (storedIdeas) {
        const parsed = JSON.parse(storedIdeas);
        ideasText = parsed.map((id: any, i: number) => `
          <div style="margin-bottom: 25px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
            <h3>#${i + 1}: ${id.title} (Điểm Du Kích: ${id.guerrillaScore}/10)</h3>
            <p><strong>Khách hàng ngách:</strong> ${id.nicheAudience}</p>
            <p><strong>Mô tả cốt lõi:</strong> ${id.description}</p>
            <p><strong>Định giá:</strong> ${Number(id.pricePoint).toLocaleString('vi-VN')} VNĐ</p>
            ${id.aiBlueprint ? `<div style="background:#f4f6f8; padding: 12px; border-radius: 8px; font-size:12px; white-space: pre-wrap; font-family:monospace; margin-top:10px;">${id.aiBlueprint}</div>` : ''}
          </div>
        `).join('');
      }
    } catch (_) {}

    let transactionsText = 'Số cái trống rỗng.';
    try {
      const tx = localStorage.getItem('lf_db_transactions');
      if (tx) {
        const parsed = JSON.parse(tx);
        transactionsText = `
          <table style="width:100%; border-collapse: collapse; margin-top:12px;">
            <thead>
              <tr style="background:#eee; text-align:left; font-size:11px;">
                <th style="padding:8px; border:1px solid #ddd;">ID</th>
                <th style="padding:8px; border:1px solid #ddd;">Ngày hạch toán</th>
                <th style="padding:8px; border:1px solid #ddd;">Giải thích chứng từ</th>
                <th style="padding:8px; border:1px solid #ddd;">TK Nợ</th>
                <th style="padding:8px; border:1px solid #ddd;">TK Có</th>
                <th style="padding:8px; border:1px solid #ddd; text-align:right;">Số tiền phát sinh</th>
              </tr>
            </thead>
            <tbody>
              ${parsed.map((item: any) => `
                <tr style="font-size:11.5px;">
                  <td style="padding:8px; border:1px solid #ddd;">${item.id}</td>
                  <td style="padding:8px; border:1px solid #ddd;">${item.date}</td>
                  <td style="padding:8px; border:1px solid #ddd;">${item.description}</td>
                  <td style="padding:8px; border:1px solid #ddd;">${item.debit || 'N/A'}</td>
                  <td style="padding:8px; border:1px solid #ddd;">${item.credit || 'N/A'}</td>
                  <td style="padding:8px; border:1px solid #ddd; text-align:right; font-weight:bold;">${Number(item.amount).toLocaleString('vi-VN')} VNĐ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    } catch (_) {}

    printWindow.document.write(`
      <html>
        <head>
          <title>Báo cáo Chiến lược & Sổ Cái Tổng Hợp LedgerFlow Studio</title>
          <style>
            body { font-family: "Inter", system-ui, Helvetica, sans-serif; color: #222; line-height: 1.5; padding: 40px; max-width: 900px; margin: auto; }
            h1 { font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 5px; text-transform: uppercase; }
            h2 { font-size: 16px; text-transform: uppercase; color: #444; border-bottom: 1.5px solid #666; padding-bottom: 4px; margin-top: 35px; }
            p { margin: 6px 0; }
            .badge { background: #eee; padding: 3px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
            .header-info { display: flex; justify-content: space-between; font-size: 11px; color:#555; background:#fafafa; padding: 10px; border-radius:6px; margin-top:15px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom:25px; background: #fffbeb; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; font-size: 13px;">
            <strong>Mẹo máy in:</strong> Bấm tổ hợp <strong>Ctrl + P</strong> (hoặc Cmd + P) để in toàn bộ sớ tài liệu này hoặc lưu trực tiếp dưới dạng file <strong>PDF</strong>.
            <button onclick="window.print()" style="margin-left: 15px; padding: 5px 12px; background: #000; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Mở hộp thoại In</button>
          </div>

          <h1>LedgerFlow Studio v4 - Dossier Tác Chiến</h1>
          <p>Báo cáo tổng hợp được biên dịch tự động chứa các ý tưởng du kích có bản vẽ AI, kèm sao kê ghi chép Ledger Sandbox.</p>
          
          <div class="header-info">
            <div>
              <p><strong>Chủ biên:</strong> Solo Founder (${metrics.usingCustomKey ? 'Tài khoản Premium (PMSTUDY)' : 'Cộng đồng dùng chung'})</p>
              <p><strong>Ngày lập báo cáo:</strong> ${new Date().toLocaleDateString('vi-VN')} - UTC: ${new Date().toISOString()}</p>
            </div>
            <div style="text-align:right;">
              <p><strong>Số ý tưởng du kích:</strong> ${metrics.ideasCount}</p>
              <p><strong>Số dòng chứng từ Sandbox:</strong> ${metrics.transactionsCount}</p>
              <p><strong>Tiến trình học tập:</strong> ${completionPercentage}% hoàn thành</p>
            </div>
          </div>

          <h2>I. Phòng Ý Tưởng Sản Phẩm Du Kích (Guerrilla Pitch)</h2>
          ${ideasText}

          <h2>II. Sổ Cái Hạch Toán Thực Nghiệm (Sandbox Journal Balance)</h2>
          <p>Các phát sinh Nợ/Có đối khớp lưỡng hướng kiểm thử hạch toán:</p>
          ${transactionsText}

          <div style="margin-top:60px; font-size:10px; text-align:center; color:#888; border-top:1px solid #eee; padding-top:15px;">
            Hồ sơ được biên soạn cục bộ từ LedgerFlow Sandbox Simulator. Bản quyền thuộc về tác giả.
          </div>
          <script>
            window.onload = function() {
              // Option to trigger automatically in some configurations
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* FLOATING SCORE CHIME TOAST */}
      {scoreNotification && (
        <div className="fixed top-24 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-500 text-white font-black px-4.5 py-3 rounded-2xl shadow-2xl z-50 animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span className="text-sm font-mono text-left">{scoreNotification}</span>
        </div>
      )}

      {/* WELCOME BANNER HEADLINER */}
      <div className="bg-gradient-to-r from-slate-950 via-[#040810] to-[#04101e] rounded-3xl border border-slate-900 p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 select-text">
          <div className="space-y-2">
            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-black rounded-lg uppercase tracking-wider font-mono inline-block">
              ⚡ Trung Tâm Chỉ Huy (Command Center)
            </span>
            <h2 className="text-xl font-black text-white leading-tight">
              Khu Vực Quản Trị, Đối Soát & Trải Nghiệm Học Tập Thực Chiến
            </h2>
            <p className="text-slate-400 text-xs font-semibold max-w-2xl leading-relaxed">
              Chào mừng bạn đến với mô hình **LedgerFlow Command Center**. Tại đây, hệ thống theo dõi tiến trình làm chủ các kỹ nghệ kế toán, dữ liệu lớn, và tiếp thị tăng trưởng. Hãy hoàn thiện các cột mốc thực hành bên dưới để mở khóa tri thức!
            </p>
          </div>

          <div className="flex gap-2 self-stretch md:self-auto shrink-0">
            <button 
              onClick={handleTriggerPrint}
              className="flex items-center justify-center gap-1.5 px-4.5 py-3 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-300 font-black text-xs rounded-xl transition-all shadow select-none cursor-pointer"
              title="Xuất kế hoạch và sổ cái Sandbox ra bản in đẹp đẽ/PDF"
            >
              <Printer className="w-3.5 h-3.5 text-purple-450" />
              <span>Biên Tập PDF / In sớ</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-905 flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Ý tưởng Tác Chiến</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-white font-mono">{metrics.ideasCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">bản</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-905 flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Sổ cái Giao Dịch</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-white font-mono">{metrics.transactionsCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">dòng</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-905 flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Tài sản (Sandbox)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-white font-mono">{metrics.assetsCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">loại</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-905 flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Lộ trình dọn sạch</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-white font-mono">{metrics.checkedRoadmapTasksCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">mốc</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION 8: NORTH STAR 3 PURE METRICS PORTFOLIO */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 p-5 rounded-3xl border border-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-slate-900 pb-3">
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
              BI THỰC CHIẾN: 3 BỘ CHỈ SỐ TINH KHIẾT KHỞI NGHIỆP (NORTH STAR METRICS)
            </h4>
            <p className="text-[10.5px] text-slate-400 mt-1 font-semibold leading-relaxed">
              Theo khuyến khích số #8 từ Hội đồng cố vấn, loại bỏ phễu đếm lượt xem trang hời hợt. Hãy dồn lực tối đa của Solo Founder vào:
            </p>
          </div>
          <span className="text-[9.5px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-lg font-black font-mono">
            FOCUS MODE ON
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                <span>1. ĐỘ SỐNG CÓ ÍCH (WAU)</span>
                <span className="text-purple-400">Shop online</span>
              </div>
              <p className="text-2xl font-black text-white mt-2 mb-0.5">4.2k <span className="text-xs font-semibold text-emerald-400"> hoạt động</span></p>
            </div>
            <p className="text-[10px] text-slate-450 mt-1.5">Tổng số shop nạp sao kê & đối soát ít nhất một lần mỗi 7 ngày qua.</p>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                <span>2. DOANH THU THỰC (MRR)</span>
                <span className="text-emerald-450 text-emerald-400">VietQR 0đ</span>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2 mb-0.5">35,400,000 đ</p>
            </div>
            <p className="text-[10px] text-slate-455 mt-1.5">Dòng tiền dịch vụ chuyển khoản chạy qua hệ thống hạch toán VietQR.</p>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                <span>3. ĐỘ GIỮ CHÂN (RETENTION)</span>
                <span className="text-blue-400">T+30 Days</span>
              </div>
              <p className="text-2xl font-black text-white mt-2 mb-0.5">68.2% <span className="text-xs font-semibold text-blue-400"> trung thành</span></p>
            </div>
            <p className="text-[10px] text-slate-450 mt-1.5">Lý tưởng nhờ dữ liệu đồng bộ cloud kiên cố, xóa bỏ rắc rối mất LocalStorage.</p>
          </div>
        </div>
      </div>

      {/* ACTION 6: INSTANT "AHA MOMENT" VIETQR STATEMENT PARSER PLAYGROUND */}
      <div className="bg-[#0b1329]/90 border border-purple-950/75 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl"></div>
        <div className="absolute left-1/4 bottom-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl"></div>

        <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6 relative z-10">
          {/* Parser Control Zone */}
          <div className="lg:max-w-md flex flex-col justify-between space-y-4">
            <div>
              <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-black rounded-lg uppercase tracking-wider font-mono inline-block mb-2">
                ⚡ Tốc Độ Chớp Nhoáng (Action 6)
              </span>
              <h3 className="text-base font-black text-white flex items-center gap-1.5 leading-snug">
                <CloudLightning className="w-4 h-4 text-amber-400 animate-pulse" />
                Trình Đối Soát Sao Kê VietQR & Tự Động Hạch Toán Bằng AI
              </h3>
              <p className="text-slate-350 text-[11px] leading-relaxed mt-1 font-semibold">
                Trải nghiệm <strong>Sự kỳ diệu trong 5 giây</strong>. Hãy thử tải lên tệp tin hoặc nhấp vào nút Chạy thử dưới đây để chứng kiến AI tự động chiết xuất lưu đồ kế toán kép Nợ-Có từ bảng sao kê ngân hàng thô rác!
              </p>
            </div>

            <div className="space-y-2">
              {parserState === 'idle' && (
                <div className="p-4 border-2 border-dashed border-purple-900/40 hover:border-purple-500/50 bg-slate-950/50 rounded-2xl text-center transition-all cursor-pointer group" onClick={startStatementParsingSimulation}>
                  <Upload className="w-7 h-7 mx-auto text-slate-500 group-hover:text-purple-400 transition-colors mb-2 animate-bounce" />
                  <p className="text-xs font-black text-slate-300">Kéo thả File Sao kê VietQR / Excel tại đây</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">Hỗ trợ định dạng XLS, XLSX, CSV từ VCB, VietinBank, BIDV</p>
                </div>
              )}

              {parserState === 'parsing' && (
                <div className="p-4 bg-slate-950 border border-purple-900/30 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-purple-400 animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                      AI đang xử lý dọn dẹp...
                    </span>
                    <span className="text-white font-mono">{parserProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${parserProgress}%` }}
                    ></div>
                  </div>
                  <div className="bg-[#040812] p-2.5 rounded-xl text-[9px] font-mono text-slate-400 space-y-1 h-[75px] overflow-y-auto border border-slate-900 scrollbar-none text-left">
                    {parserLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

              {parserState === 'completed' && (
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl text-center space-y-2.5">
                  <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-sm font-bold">✓</span>
                  <div>
                    <h5 className="text-xs font-black text-emerald-400">SAO CP / ĐỐI CHUẨN THÀNH CÔNG!</h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Trích xuất xuất sắc 4 bút toán hạch toán đơn húc hoàn hảo.</p>
                  </div>
                  <button 
                    onClick={confirmSaveToLedger}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg hover:from-emerald-500 hover:to-emerald-400 transition-all cursor-pointer"
                  >
                    Lưu Toàn bộ vào Sổ Cái Quản Trị Sandbox →
                  </button>
                </div>
              )}

              {parserState === 'idle' && (
                <button
                  onClick={startStatementParsingSimulation}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-650 hover:bg-purple-600 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer select-none"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Chạy Thử Bằng File Sao kê Mẫu (Chỉ 5 Giây)</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Zone */}
          <div className="flex-1 bg-[#050912]/80 border border-purple-950/40 rounded-2xl p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs font-black text-slate-200 uppercase tracking-widest font-mono">Bản Xem Trước Trích Xuất AI (Live Preview)</span>
                <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                  Trạng thái: {parserState === 'idle' ? 'Đang đợi...' : parserState === 'parsing' ? 'Đang đọc...' : 'Đạt Đích!'}
                </span>
              </div>

              {simulatedTx.length === 0 ? (
                <div className="py-12 text-center text-slate-600 flex flex-col items-center justify-center space-y-2">
                  <Database className="w-8 h-8 text-slate-700" />
                  <p className="text-xs font-bold font-mono">Chưa trích xuất dữ liệu giao dịch</p>
                  <p className="text-[10px] text-slate-500 max-w-xs font-semibold">Nhấp "Chạy Thử" để giả lập đối soát tệp sao kê ngân hàng VCB Excel thô.</p>
                </div>
              ) : (
                <div className="space-y-2 mt-3 overflow-y-auto max-h-[190px] pr-1">
                  {simulatedTx.map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-900 hover:bg-slate-950 text-left">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-white">{tx.description}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8.5px] bg-slate-900 text-purple-400 font-black px-1.5 py-0.5 rounded leading-none">{tx.gateway}</span>
                          <span className="text-[8.5px] text-slate-500 font-mono font-bold">{tx.date}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-extrabold ${tx.type === 'Thu' ? 'text-emerald-450 text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'Thu' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#05111d] border border-blue-900/30 p-2.5 rounded-xl text-[10.5px] text-slate-400 flex items-center gap-2.5 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <p className="leading-snug font-semibold text-slate-300">
                <strong>Định hướng kinh tế:</strong> Cơ hội tích hợp tệp sao kê này trực tiếp qua bot tự động gửi bill VietQR giúp AE shop vận hành 100% rảnh tay.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: GAMIFIED PROGRESS TRACKER */}
        <div className="lg:col-span-8 bg-slate-950/60 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between shadow-xl space-y-5">
          <div className="space-y-4">
            <div className="border-b border-slate-900 pb-3 flex justify-between items-end">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  Con Đường Trở Thành Bậc Thầy Tác Chiến (Gamified Quest)
                </h3>
                <p className="text-[10.5px] text-slate-550 mt-0.5 font-bold">
                  Tích cực tự tay thực hiện các nghiệp vụ then chốt để chứng minh năng lực:
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-extrabold text-purple-400">{totalScore}</span>
                <span className="text-[10px] font-mono text-slate-600"> / {maxScore} pts</span>
              </div>
            </div>

            {/* PROGRESS GLO BAR */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400 flex items-center gap-1 text-[9.5px]">
                  <CircleDot className="w-3 h-3 text-purple-500" />
                  Xếp hạng học tập: {
                    completionPercentage === 100 ? '👑 Master of Tactical Enterprise (Thạc Sĩ)' :
                    completionPercentage >= 70 ? '💎 Đại Cao Thủ Thực Chiến' :
                    completionPercentage >= 40 ? '⚡ Chuyên Viên Tác Chiến' :
                    completionPercentage > 0 ? '🌱 Người Khởi Sự Du Kích' : 'Bắt đầu hành trình'
                  }
                </span>
                <span className="text-white font-black font-mono">{completionPercentage}%</span>
              </div>
              <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850 p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* MILESTONE LIST CHECKBOXES */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {GAMIFIED_TASKS.map((task) => {
                const isCompleted = completedTaskIds.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.points, task.text)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isCompleted 
                        ? 'bg-purple-950/15 border-purple-900/50 hover:bg-purple-950/20' 
                        : 'bg-slate-900/30 border-slate-900 hover:bg-slate-905 hover:border-slate-800'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-purple-500 border border-purple-400 flex items-center justify-center text-white">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full bg-slate-950 border border-slate-800 hover:border-purple-500 flex items-center justify-center"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className={`text-xs font-black truncate block ${isCompleted ? 'text-slate-200 line-through' : 'text-white'}`}>
                          {task.text}
                        </span>
                        <span className={`text-[9.5px] font-mono font-bold shrink-0 ${isCompleted ? 'text-purple-400' : 'text-slate-450 bg-slate-950 border border-slate-900 px-1.5 py-0.5 rounded'}`}>
                          +{task.points} pts
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal font-semibold mt-0.5">
                        {task.subText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MASTER CERTIFICATE REWARD BADGE */}
          {completionPercentage === 100 && (
            <div className="bg-gradient-to-r from-amber-600/10 via-yellow-500/5 to-amber-600/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
                <CupIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  🏆 CHỨNG NHẬN MASTER OF TACTICAL ENTERPRISE MOCK
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Bản đã dọn dẹp xuất sắc toàn bộ chướng ngại, hiểu cặn kẽ 5 trụ cột và kế toán kép thực chiến! Hãy sử dụng tài liệu này để tự tin hạch toán bất chấp mọi khó khăn của Solo Founder!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REAL-TIME WEB CONSOLE LOGS */}
        <div className="lg:col-span-4 bg-[#050911]/90 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between shadow-xl space-y-4">
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="border-b border-slate-900 pb-2.5 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-mono">
                <Terminal className="w-4 h-4 text-purple-450" />
                Audit Console Logs
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            {/* CONSOLE DISPLAY */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-905 flex-1 overflow-y-auto max-h-[300px] font-mono text-[10px] text-emerald-400 space-y-2 select-text text-left scrollbar-thin">
              {systemLogs.length === 0 ? (
                <span className="text-slate-600">[Hệ thống] Đang lắng nghe tín hiệu từ các phân hệ...</span>
              ) : (
                systemLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed border-b border-slate-900/40 pb-1.5">
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Quick action helper card */}
            <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-slate-900 space-y-2 text-[10.5px]">
              <span className="text-white font-black uppercase flex items-center gap-1.5 font-sans">
                <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
                Vận Hành Tốc Độ Cao (Edge Mode)
              </span>
              <p className="text-slate-500 font-semibold leading-relaxed">
                Hệ thống LedgerFlow lưu toàn bộ trạng thái an toàn xuống localStorage trình duyệt của bạn hạch toán Offline-first mà không tốn máy chủ.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION 7: STARTUP VN BUILD IN PUBLIC HUB */}
      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-3">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Compass className="w-4.5 h-4.5 text-purple-400" />
              Kênh Truyền Thông Du Kích (Build In Public Vietnam Hub)
            </h4>
            <p className="text-[10.5px] text-slate-500 mt-1 font-semibold leading-relaxed">
              Thực thi khuyến khích số #7 từ Hội đồng cố vấn. Liên tục đưa sự thật kỹ thuật và tiến trình thật lên MXH để xây dựng lòng tin, hút khách sỉ tự nhiên:
            </p>
          </div>
          <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider font-extrabold font-mono">
            Weekly Social Kit
          </span>
        </div>

        <div className="grid md:grid-cols-12 gap-5 items-stretch">
          {/* Preset templates options */}
          <div className="md:col-span-5 space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Mẫu Bài Đăng Hút Tương Tác:</span>
            {PUBLIC_TEMPLATES.map((tpl) => {
              const isActive = activePostId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setActivePostId(tpl.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 select-none ${
                    isActive 
                      ? 'bg-purple-950/20 border-purple-800 text-white' 
                      : 'bg-slate-900/30 border-slate-900 text-slate-400 hover:bg-slate-905'
                  }`}
                >
                  <p className="text-xs font-black flex items-center gap-1.5">
                    {tpl.title}
                  </p>
                  <p className="text-[9.5px] text-slate-500 leading-normal font-semibold">
                    {tpl.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Core editor & Copy kit */}
          <div className="md:col-span-7 bg-[#040810] border border-slate-900 rounded-2xl p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900/45">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono">Trình Biên Tập Tiện Ích (Social Composer)</span>
                <button
                  onClick={handleCopyPostContent}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-350 text-[10px] font-black transition-all cursor-pointer select-none"
                >
                  {copiedPostId === activePostId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-450 text-emerald-400" />
                      <span className="text-emerald-400">Đã Sao Chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao Chép Post</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={customPostContent}
                onChange={(e) => setCustomPostContent(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-905 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-800/80 resize-none h-[180px] leading-relaxed scrollbar-thin text-left"
                placeholder="Nhấp vào mẫu bài bên trái hoặc tự khởi tạo ý tưởng du kích của riêng bạn..."
              />
            </div>

            <p className="text-[9.5px] text-slate-550 leading-relaxed font-semibold mt-3 text-left">
              💡 <strong>Lời khuyên tác chiến:</strong> Hãy dán thẳng văn bản này lên <em>Threads, Facebook Group Kế toán/SaaS, hay LinkedIn</em> mỗi thứ sáu hàng tuần. Sự công khai (Build in Public) kèm kết quả Sandbox sống động chính là liều marketing tốt nhất không mất phí.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
