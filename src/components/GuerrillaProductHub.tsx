import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Database, 
  Server, 
  Layers, 
  PlusCircle, 
  Zap, 
  HelpCircle, 
  Trash2, 
  Edit,
  Save, 
  Copy, 
  ChevronRight, 
  Compass, 
  AlertCircle, 
  Check, 
  BookOpen, 
  Terminal,
  Activity,
  Award,
  ArrowRight,
  FileText,
  Download,
  Printer
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useStore } from '../store/useStore';

interface UnexpectedIdea {
  id: string;
  title: string;
  type: 'saas' | 'game' | 'utility';
  nicheAudience: string;
  pricePoint: number; // in VND
  speedRating: number; // 1-10
  costRating: number; // 1-10 (10 means very low cost)
  marketPain: number; // 1-10
  viralPotential: number; // 1-10
  description: string;
  guerrillaScore: number;
  aiBlueprint?: string;
  createdAt: string;
}

const INITIAL_IDEAS: UnexpectedIdea[] = [
  {
    id: 'idea_saas_vietqr',
    title: 'VietQR Auto-Ledger - Đồng bộ đối soát shop online nhỏ',
    type: 'saas',
    nicheAudience: 'Chủ shop bán hàng facebook live, kinh doanh hộ cá thể không rành ERP nặng nề',
    pricePoint: 35000, // 35k/tháng
    speedRating: 9,
    costRating: 10,
    marketPain: 9,
    viralPotential: 8,
    description: 'Ứng dụng siêu nhỏ sử dụng Webhook ngân hàng tự do bóc tách cú pháp chuyển khoản VietQR, đối chiếu với trạng thái tồn kho rồi tự động gán nhãn trạng thái hạch toán thông qua bảng SQLite thô của Chrome Extension.',
    guerrillaScore: 9.2,
    createdAt: '2026-06-01',
    aiBlueprint: `### 🚀 BẢN THIẾT KẾ CHIẾN THUẬT DU KÍCH - VIETQR AUTO-LEDGER

## 1. DATA SCIENCE & BIG DATA (Trụ cột Dữ Liệu)
- **Star Schema Tối Giản**: Xây dựng bảng sự kiện \`fact_bank_transactions\` liên kết trực tiếp với bảng chiều khách hàng \`dim_orders\`.
- **Phân Tích Báo Cáo**: Dùng pandas lọc bỏ các giao dịch lỗi do nội dung chuyển khoản sai cấu trúc, gán nhãn tỷ lệ đối khớp tự động thành công (Auto-Match Rate).

## 2. BUSINESS ANALYSIS (Trụ cột Nghiệp Vụ)
- **Nỗi đau khách hàng**: Shop nhỏ bị trôi bill chuyển khoản, mất nhiều giờ ngồi dò sao kê tay trên app ngân hàng.
- **Quy trình tối giản**: Quét VietQR -> Tạo mã giao dịch duy nhất nhập vào mô tả chuyển khoản -> Webhook bắt giao dịch đẩy lên database -> Bot gửi tin nhắn xác nhận.

## 3. FINANCIAL ACCOUNTING (Trụ cột Kinh Tế & Chi Phí 0đ)
- **Giá bán rẻ số lượng lớn**: Chỉ **35.000đ/tháng** (bằng 1 cốc cà phê vỉa hè). Nhắm tới mục tiêu 2.050 cửa hàng sử dụng tạo ra **71.750.000 VNĐ MRR** ổn định.
- **Hạ tầng 0đ**: Lưu trữ database trên Supabase Free Tier, chạy backend trên Vercel Serverless. Chi phí vận hành máy chủ thực tế hàng tháng là 0 VNĐ.
- **Cổng thanh toán**: Tận dụng VietQR mở của SeABank/VietinBank để nhận tiền nạp tự động không tốn 1,5%-3% phí cổng trung gian như thẻ tín dụng.

## 4. PROGRAMMING STACK (Trụ cột Lập Trình Siêu Tốc)
- **Frontend/Backend**: Sử dụng React + Vite + Express cùng thư viện Tailwind CSS. Đóng gói thêm 1 Chrome Extension nhỏ để tự động parse sao kê thủ công trong web ngân hàng mà không cần API ngân hàng chính thống đắt đỏ.
- **Mốc thời gian đóng gói**: 5 ngày làm việc độc lập.

## 5. MACHINE LEARNING & AI INTEGRATION (Trụ Cột Thông Minh)
- **AI Phân Tích Thông Minh**: Tích hợp một model NLP phân cụm siêu nhẹ để phân nhóm tự động các nội dung khách ghi sai cú pháp (ví dụ: "chuc muong sinh nhat", "tra tien ao", "ck do giay") để gán đúng mã đơn hàng khả thi nhất. Thuật toán chạy suy luận trực tiếp trên client để giảm chi phí máy chủ AI.`
  },
  {
    id: 'idea_game_hcmc',
    title: 'Sài Gòn Rush: Kẹt Xe Không Lối Thoát',
    type: 'game',
    nicheAudience: 'Học sinh, sinh viên và dân văn phòng chơi xả stress trong lúc chờ kẹt xe tan tầm',
    pricePoint: 15000, // 15k mua vĩnh viễn không quảng cáo
    speedRating: 10,
    costRating: 9,
    marketPain: 8,
    viralPotential: 10,
    description: 'Game Hyper-casual 2D màn hình dọc, người chơi điều khiển shipper vượt qua bẫy hố ga, các rào chắn "lô cốt", bò thả trôi, đón nhận thời tiết mưa ngập nước vỉa hè để giật đồ ăn giao kịp giờ. Càng kẹt xe càng đông thách thức kịch bộc.',
    guerrillaScore: 9.3,
    createdAt: '2026-06-02',
    aiBlueprint: `### 🚀 BẢN THIẾT KẾ CHIẾN THUẬT DU KÍCH - SÀI GÒN RUSH

## 1. DATA SCIENCE & BIG DATA (Trụ cột Dữ Liệu)
- **Quản Trị Người Dùng**: Dùng SQLite lưu trữ số điểm kỷ lục địa phương, ghi nhận hành vi "va chạm" để vẽ biểu đồ phân phối khó dễ của các màn chơi (Difficulty Curve Analytics).

## 2. BUSINESS ANALYSIS (Trụ cột Nghiệp Vụ)
- **Nỗi đau**: Sự đồng điệu và giải trí tức thời. Game thủ giải trí nhanh trong 1-3 phút mà không cần suy nghĩ nặng nề.
- **Cơ chế giữ chân**: Tích haptic rung mạnh khi shipper đâm trúng ổ gà, sfX âm thanh tiếng còi xe inh ỏi thân thuộc của phố phường Việt Nam.

## 3. FINANCIAL ACCOUNTING (Trụ cột Kinh Tế & Chi Phí 0đ)
- **Định giá thu hoạch**: Cho tải miễn phí có kèm quảng cáo interstitial xen kẽ nhẹ nhàng sau mỗi 4 lượt chơi. Người chơi có thể trả **15.000 VNĐ** một lần duy nhất để tắt quảng cáo vĩnh viễn và tặng skin "Shipper Ninja Gió".
- **Hạ tầng 0đ**: Game offline chạy trực tiếp trên thiết bị (Edge computing), sử dụng AdMob để gắn quảng cáo. Chi phí duy trì server là 0 VNĐ.

## 4. PROGRAMMING STACK (Trụ cột Lập Trình Siêu Tốc)
- **Engine**: Sử dụng Godot Engine hoặc Cocos Creator siêu nhẹ để compile bản Android/WebGL trong 6 ngày.
- **Tài Nguyên Asset**: Dùng AI Generation để tự vẽ nhân vật chibi và các background phố xá quận 1, quận 3.

## 5. MACHINE LEARNING & AI INTEGRATION (Trụ Cột Thông Minh)
- **Hệ Thống Tránh Hack**: Tích hợp một mạng nơ-ron hồi quy cực nhẹ (Sequential MLP) nạp On-device lưu trữ lịch sử vuốt màn hình để phân biệt giữa người chơi tay thật và auto-clicker gian lận điểm thưởng.`
  }
];

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
    systemInstruction: 'Bạn là kiến trúc sư giải pháp tự động hóa tài chính và cổng thanh toán 0% phí tại Việt Nam. Bạn viết mã nguồn webhook và cung cấp giải pháp bóc tách thông báo chuyển khoản bằng bot Telegram (VietQR, MBBank, Techcombank, ACB) để kích hoạt vật phẩm game hoặc tài khoản SaaS tức thời mà không cần cổng thanh toán rườm rà.',
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

export const STREMY_NODES = [
  {
    id: 'stage_1',
    phase: 'GIAI ĐOẠN 1: Ý TƯỞNG SIÊU NGÁCH',
    title: 'Đánh Ngách Hẹp & Cực Mặn',
    goal: 'Giải quyết triệt để 1 rắc rối của tệp khách hàng cô đọng thay vì mơ làm ERP đa năng.',
    toolStack: ['Google Trends VN', 'Hội nhóm Facebook bán hàng', 'Lướt reviews 1-3 sao trên App Store / Steam', 'TikTok Search xu hướng'],
    guerillaHacks: [
      'Tìm kiếm từ khoá "ức chế", "vất vả", "bị sót bill" trong các cộng đồng kinh doanh online tự cứu hoặc game thủ Việt.',
      'Sử dụng AI Agent Growth Hacker phác hoạ tệp chân dung để hiểu cặn kẽ nỗi đau thực tế của họ trước khi viết bất kì dòng code nào.'
    ],
    actionChecklist: [
      'Nói chuyện / phỏng vấn trực tiếp tối thiểu 3 khách hàng tiềm năng về khó khăn của họ.',
      'Giới hạn danh sách tính năng (Scope) trong vòng tối đa 3 ngày code. Loại bỏ hoàn toàn 95% tính năng rườm rà.',
      'Định giá rẻ bằng đúng cốc nước mía / cốc cà phê vỉa hè để khách hàng không ngần ngại ấn nút nạp.'
    ],
    metric: 'Nỗi đau thị trường > 8.5/10 | Thời gian lập trình kì hạn < 5 ngày',
    details: 'Thay vì viết ra các tính năng chung chung cho mọi khách hàng, hãy tối ưu hóa hết mức để chỉ phục vụ một nhóm đặc biệt. Ví dụ: Phần mềm tự động gửi tin nhắn cảm ơn và hoá đơn cho người mua hàng bằng VietQR sau 3 giây hoặc mini game xe máy lách ổ gà khi ngập lụt.'
  },
  {
    id: 'stage_2',
    phase: 'GIAI ĐOẠN 2: LẬP TRÌNH ĐA NỀN TẢNG',
    title: 'Cross-Platform Với 1 Code Duy Nhất',
    goal: 'Compile nhanh gọn sang cả PC (Web/Desktop) lẫn Mobile với dung lượng siêu tối giản.',
    toolStack: ['Vite + React (Làm PWA)', 'Godot Engine 4 (Game nhẹ < 30MB, xuất Android/Desktop mượt bốc)', 'Tauri (Chuyển web-app thành app PC mộc mạc)', 'SQLite cục bộ / LocalStorage'],
    guerillaHacks: [
      'Tận dụng hoàn toàn AI Game & App Logic Coder để sinh mã nguồn thô cho SQLite, canvas WebGL hoặc GDScript mà không lo bí ý tưởng giải thuật.',
      'Ưu tiên thiết kế Offline-first để loại trừ gánh nặng server VPS đắt đỏ, giúp ứng dụng sống bền bỉ không tốn tiền bảo trì.'
    ],
    actionChecklist: [
      'Thiết lập khung sườn source code tương thích màn hình dọc di động lẫn nằm ngang PC.',
      'Tích hợp tính năng tự động lưu trữ tiến trình hoặc nhật ký giao dịch xuống cơ sở dữ liệu cục bộ.',
      'Rà soát triệt để dung lượng file build cuối. Nén chặt toàn bộ ảnh, tệp nhạc sang định dạng WebP, OGG cực nhẹ.'
    ],
    metric: 'Dung lượng bộ cài game < 25MB | Web-app tải trang dưới 1.5 giây',
    details: 'Giữ cho cấu trúc lập trình gãy góc và sạch bóng rườm rà. Bằng cách không sử dụng các framework quá nặng nề, bạn có thể triển khai thành công ứng dụng trên cả di động cấu hình yếu lẫn các dòng máy tính văn phòng.'
  },
  {
    id: 'stage_3',
    phase: 'GIAI ĐOẠN 3: ĐỘNG CƠ THANH TOÁN 0Đ',
    title: 'Tự Động Hoá Kế Toán Bằng VietQR',
    goal: 'Nhận nạp rút tự động và gán VIP tức thì mà không thất thoát 2.5% phí cho cổng thanh toán.',
    toolStack: ['Cổng API VietQR động (vietqr.io)', 'Webhook kiểm tra lịch sử giao dịch', 'Telegram Push Notification Bot', 'NodeJS Server chạy Serverless (Vercel/Render)'],
    guerillaHacks: [
      'Sinh QR động đính kèm mã đơn hàng duy nhất và số tiền chính xác, giúp khách chỉ cần mở app bank quét 1 chạm là tiền nhảy ngay.',
      'Dùng extension Chrome tự động sao cập sao kê hoặc viết Google App Script nhận email biến động số dư cực chuẩn.'
    ],
    actionChecklist: [
      'Thiết lập cấu trúc cú pháp chuyển tiền mẫu dạng viết liền không dấu để bóc tách nhanh (ví dụ: SEC_MEMBER_99K).',
      'Viết API xử lý webhook đầu nhận: Kiểm tra giao dịch trùng, xác minh số tiền khớp và gọi SQLite nâng hạng tài khoản khách tại chỗ.',
      'Định kỳ dọn dẹp các tệp nhật ký giao dịch không cần thiết để giữ trơn chu database.'
    ],
    metric: 'Chi phí vận hành cổng thanh toán = 0 VNĐ | Thời cấp quyền game/app < 5 giây',
    details: 'Bằng cách tự động hóa luồng kế toán qua VietQR NAPAS, bạn giải phóng bản thân khỏi việc ngồi dò sao kê tay bằng cách tự bóc tách thông báo giao dịch thông qua webhook serverless 0đ.'
  },
  {
    id: 'stage_4',
    phase: 'GIAI ĐOẠN 4: TIẾP THỊ LAN TRUYỀN HỢP LỆ',
    title: 'ASO Ngách & Video Ngắn TikTok',
    goal: 'Không tốn 1 đồng ngân sách chạy quảng cáo trả phí (Ads). Tận dụng tối đa phễu traffic tự nhiên.',
    toolStack: ['SEO Chợ ứng dụng Google Play / Steam', 'Quay màn hình / Capcut di động', 'Kênh Tiktok cá nhân / Short Reels', 'Hệ thống giới thiệu bạn bè nhận mã'],
    guerillaHacks: [
      'Nhấn mạnh giá trị sản phẩm rẻ như cốc trà đá vỉa hè (15k - 20k) nhưng giải toả ức chế khổng lồ để thúc đẩy mua hàng tích tắc.',
      'Chèn hệ thống Referral trực tiếp vào app: Khách hàng chia sẻ app được tặng thêm 7 ngày trải nghiệm VIP để tự lôi kéo khách mới.'
    ],
    actionChecklist: [
      'Tập trung tối ưu tiêu đề ASO chứa các thuật ngữ nỗi đau cốt lõi của khách để xếp hạng cao khi họ tìm kiếm.',
      'Tạo 5 kịch bản video ngắn và đăng tải đều đặn hằng ngày lặp lại thông điệp ngộ nghĩnh đi cùng link bio tải nhanh.',
      'Theo dõi các chỉ số tải trang và tỷ lệ chuyển đổi thanh toán để điều chỉnh vị trí đặt nút nạp hấp dẫn hơn.'
    ],
    metric: 'Chi phí tiếp thị (CAC) = 0 VNĐ | Tỷ lệ viral tự phát đạt > 110%',
    details: 'Thời buổi hiện tại cạnh tranh rất khốc liệt, khách hàng thường hoài nghi ứng dụng đắt tiền hoặc các dịch vụ đăng ký hàng tháng nặng nề. Mức giá rẻ hạt dẻ một lần cùng sự viral tự nhiên qua video ngắn là chìa khóa vàng giúp bạn chiến thắng.'
  }
];

export default function GuerrillaProductHub() {
  const { activeIdea, setActiveIdea } = useStore();
  const [ideas, setIdeas] = useState<UnexpectedIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(activeIdea?.id || '');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [viewMode, setViewMode] = useState<'markdown' | 'canvas'>('markdown');

  // Keep global Zustand store in sync with local selectedIdeaId selection
  useEffect(() => {
    if (selectedIdeaId && ideas.length > 0) {
      const found = ideas.find(i => i.id === selectedIdeaId);
      if (found && found.id !== activeIdea?.id) {
        setActiveIdea(found as any);
      }
    }
  }, [selectedIdeaId, ideas, activeIdea, setActiveIdea]);

  
  // Custom interactive weights for weighted dynamic Scoring formula (Page 4 of Appraisal Report)
  const [weightAlpha, setWeightAlpha] = useState<number>(0.4);
  const [weightBeta, setWeightBeta] = useState<number>(0.4);
  const [weightGamma, setWeightGamma] = useState<number>(0.2);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'ideas' | 'agents' | 'strategy'>('ideas');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('stage_1');
  const [strategySubTab, setStrategySubTab] = useState<'mindmap' | 'roadmap' | 'niches' | 'weapons' | 'rules' | 'proposal'>('mindmap');
  
  // States for the interactive, structured project proposal
  const [activeProposalPhase, setActiveProposalPhase] = useState<number>(0);
  const [readyMitigations, setReadyMitigations] = useState<string[]>([
    'mit_scope_1',
    'mit_scope_2',
    'mit_schedule_1',
    'mit_quality_1',
    'mit_tech_1',
    'mit_market_1'
  ]);
  const [comparisonOldVsNew, setComparisonOldVsNew] = useState<'both' | 'old' | 'new'>('both');
  const [simulatedScopeVelocity, setSimulatedScopeVelocity] = useState<number>(92);
  const [simulatedBudgetBurnRate, setSimulatedBudgetBurnRate] = useState<number>(80);
  const [simulatedBugRate, setSimulatedBugRate] = useState<number>(2);

  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('guerrilla_completed_steps');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const updated = prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId];
      try {
        localStorage.setItem('guerrilla_completed_steps', JSON.stringify(updated));
      } catch (e) {
        console.error('Lỗi lưu bước hoàn thành:', e);
      }
      return updated;
    });
  };

  // AI Agent Tab states
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_dev');
  const [agentUserInput, setAgentUserInput] = useState<string>('');
  const [agentOutput, setAgentOutput] = useState<string>('');
  const [loadingAgent, setLoadingAgent] = useState<boolean>(false);
  const [agentError, setAgentError] = useState<string>('');

  // Custom Simulator States
  const [targetVolume, setTargetVolume] = useState<number>(1000);
  const [unitPrice, setUnitPrice] = useState<number>(49000); // 49k VND
  const [monthlyServerCost, setMonthlyServerCost] = useState<number>(0); // Target zero
  
  // New Idea Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<'saas' | 'game' | 'utility'>('saas');
  const [newNiche, setNewNiche] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(20000);
  const [newDesc, setNewDesc] = useState<string>('');
  
  // New Idea Ratings (1-10)
  const [newSpeed, setNewSpeed] = useState<number>(8);
  const [newCost, setNewCost] = useState<number>(9); // 9 mean highly minimal costing
  const [newPain, setNewPain] = useState<number>(8);
  const [newViral, setNewViral] = useState<number>(7);

  // Edit Idea States
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editType, setEditType] = useState<'saas' | 'game' | 'utility'>('saas');
  const [editNiche, setEditNiche] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(20000);
  const [editDesc, setEditDesc] = useState<string>('');
  const [editSpeed, setEditSpeed] = useState<number>(8);
  const [editCost, setEditCost] = useState<number>(9);
  const [editPain, setEditPain] = useState<number>(8);
  const [editViral, setEditViral] = useState<number>(7);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('guerrilla_unexpected_ideas');
      if (stored) {
        const parsed = JSON.parse(stored);
        setIdeas(parsed);
        if (parsed.length > 0) {
          setSelectedIdeaId(parsed[0].id);
        }
      } else {
        localStorage.setItem('guerrilla_unexpected_ideas', JSON.stringify(INITIAL_IDEAS));
        setIdeas(INITIAL_IDEAS);
        setSelectedIdeaId(INITIAL_IDEAS[0].id);
      }
    } catch (e) {
      console.error('Lỗi tải ý tưởng: ', e);
      setIdeas(INITIAL_IDEAS);
      setSelectedIdeaId(INITIAL_IDEAS[0].id);
    }
  }, []);

  const saveToStorage = (updatedList: UnexpectedIdea[]) => {
    setIdeas(updatedList);
    try {
      localStorage.setItem('guerrilla_unexpected_ideas', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Lỗi lưu ý tưởng: ', e);
    }
  };

  // Score Calculation helper (Weighted formula from Page 4: Alpha * Pain + Beta * Gap - Gamma * DevCost)
  const calculateGuerrillaScore = (speed: number, cost: number, pain: number, viral: number) => {
    // DevCost: higher speed & low overhead ratings mean LOWER dev cost.
    const devCost = (10 - speed) * 0.5 + (10 - cost) * 0.5;
    const score = (weightAlpha * pain) + (weightBeta * viral) - (weightGamma * devCost) + 2.0;
    return Number(Math.max(1.0, Math.min(10.0, score)).toFixed(1));
  };

  // Add unexpected idea
  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newNiche.trim() || !newDesc.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin cốt lõi!');
      return;
    }

    const calculatedScore = calculateGuerrillaScore(newSpeed, newCost, newPain, newViral);

    const newIdea: UnexpectedIdea = {
      id: `idea_${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      nicheAudience: newNiche.trim(),
      pricePoint: Number(newPrice),
      speedRating: newSpeed,
      costRating: newCost,
      marketPain: newPain,
      viralPotential: newViral,
      description: newDesc.trim(),
      guerrillaScore: calculatedScore,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newIdea, ...ideas];
    saveToStorage(updated);
    setSelectedIdeaId(newIdea.id);
    setShowAddForm(false);
    
    // Reset fields
    setNewTitle('');
    setNewNiche('');
    setNewPrice(30000);
    setNewDesc('');
    setNewSpeed(8);
    setNewCost(9);
    setNewPain(8);
    setNewViral(7);
  };

  // Delete idea
  const handleDeleteIdea = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xoá ý tưởng này không?')) return;
    const updated = ideas.filter(item => item.id !== id);
    saveToStorage(updated);
    if (selectedIdeaId === id && updated.length > 0) {
      setSelectedIdeaId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedIdeaId('');
    }
  };

  // Start editing an idea
  const handleStartEdit = (idea: UnexpectedIdea) => {
    setEditingIdeaId(idea.id);
    setShowAddForm(false);
    setEditTitle(idea.title);
    setEditType(idea.type);
    setEditNiche(idea.nicheAudience);
    setEditPrice(idea.pricePoint);
    setEditDesc(idea.description || '');
    setEditSpeed(idea.speedRating || 5);
    setEditCost(idea.costRating || 5);
    setEditPain(idea.marketPain || 5);
    setEditViral(idea.viralPotential || 5);
  };

  // Submit edits for idea
  const handleUpdateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdeaId) return;
    if (!editTitle.trim() || !editNiche.trim() || !editDesc.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin cốt lõi!');
      return;
    }

    const calculatedScore = calculateGuerrillaScore(editSpeed, editCost, editPain, editViral);

    const updated = ideas.map(item => {
      if (item.id === editingIdeaId) {
        return {
          ...item,
          title: editTitle.trim(),
          type: editType,
          nicheAudience: editNiche.trim(),
          pricePoint: Number(editPrice),
          speedRating: editSpeed,
          costRating: editCost,
          marketPain: editPain,
          viralPotential: editViral,
          description: editDesc.trim(),
          guerrillaScore: calculatedScore
        };
      }
      return item;
    });

    saveToStorage(updated);
    setEditingIdeaId(null);
  };

  // Call Gemini to generate Plan
  const handleGenerateBlueprint = async (idea: UnexpectedIdea) => {
    setLoadingAI(true);
    setErrorMsg('');
    try {
      const promptText = `Tôi có một ý tưởng phần mềm/nhạc/game bất chợt để xây dựng đánh thị trường ngách, bán với giá rẻ số lượng rộng lớn, theo phong cách "đơn giản hóa - du kích" tại Việt Nam.

Hãy giúp tôi xây dựng "KẾ HOẠCH TÁC CHIẾN 5 TRỤ CỘT" hoàn chỉnh nhất cho ý tưởng này:
- Tiêu đề ý tưởng: "${idea.title}"
- Thể loại: ${idea.type === 'saas' ? 'Micro-SaaS App' : idea.type === 'game' ? 'Mobile Indie Game' : 'Utility Script'}
- Tệp khách hàng ngách nhắm tới: "${idea.nicheAudience}"
- Giá bán sản phẩm: ${idea.pricePoint.toLocaleString('vi-VN')} VNĐ
- Mô tả ý tưởng gốc: "${idea.description}"

LẬP KẾ HOẠCH PHẢI GỒM 5 PHẦN TƯƠNG ĐỨNG VỚI 5 KỸ NĂNG TÔI ĐANG HỌC:
1. DATA SCIENCE & BIG DATA (Cách tổ chức Star Schema lưu hạch toán/game-feel log, dùng pandas dọn dẹp dữ liệu).
2. BUSINESS ANALYSIS (Nghiên cứu nghiệp vụ nỗi đau cụ thể của tệp ngách, quy trình xử lý tối thiểu).
3. FINANCIAL ACCOUNTING & PRICING (Mô hình kinh tế bán giá rẻ số lượng lớn, kế hoạch hạ tầng tối ưu vận hành 0đ không tốn chi phí ròng rã, thanh toán tự động VietQR/Momo 0% chiết khấu).
4. PROGRAMMING STACK (Lựa chọn Stack rút gọn nhất để một mình lập trình biên dịch nhanh nhất < 7 ngày như Vite React, SQLite cục bộ, Godot, Chrome Extension).
5. MACHINE LEARNING & AI INTEGRATION (Trí khôn AI bổ sung để tăng biên giá trị, khuyên dùng local ONNX hoặc gọi Gemini Free Tier tối giảm token).

Vui lòng viết súc tích, đanh thép bằng tiếng Việt, có chèn bình luận chuyên môn thực tế, định dạng markdown đẹp mắt với các tiêu đề rõ ràng để tôi tham khảo trực chiến triển khai.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: 'Bạn là siêu AI tham mưu tăng tốc khởi nghiệp cho Solo Founder và Indie Developer tại Việt Nam. Câu trả lời của bạn luôn bám sát tinh thần tác chiến du kích: Chi phí cực thấp, tốc độ nhanh, giải quyết nỗi đau cực mặn và hái tiền số lượng rộng lớn.'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const updated = ideas.map(item => {
          if (item.id === idea.id) {
            return { ...item, aiBlueprint: data.text || data.content || data.output || '' };
          }
          return item;
        });
        saveToStorage(updated);
      } else {
        if (data.isMissingKey || String(data.error || '').toLowerCase().includes('key')) {
          setErrorMsg('⚠️ Chưa cấu hình AI Gateway/Secrets. AI đang chạy bản mô phỏng tác chiến ngoại tuyến cho bạn súc tích dưới đây.');
          // Simulate localized response in case of missing key
          const fallback = `### 🚀 BẢN THIẾT KẾ CHIẾN THUẬT DU KÍCH MÔ PHỎNG: ${idea.title.toUpperCase()}

## 1. DATA SCIENCE & BIG DATA (Trụ cột Dữ Liệu)
- Thiết lập Star Schema với một bảng thực tế \`fact_product_usage\` thu hẹp các số liệu người dùng sử dụng tính năng và một bảng chiều \`dim_niche_users\`.
- Sử dụng Pandas chạy trên Streamlit Cloud miễn phí hằng ngày gửi báo cáo phễu chuyển đổi sử dụng tính năng yêu thích nhất của khách hàng ngách.

## 2. BUSINESS ANALYSIS (Trụ cột Nghiệp Vụ)
- Cô lập nhu cầu cốt lõi nhất của tệp khách hàng: "${idea.nicheAudience}". Loại bỏ tất cả 90% tính năng rườm rà của các ERP lớn, chỉ lập trình giải quyết 1 vấn đề một cách tự động, liền mạch nhất.

## 3. FINANCIAL ACCOUNTING (Kế hoạch giá rẻ với hạ tầng 0đ)
- Thiết lập định giá hời chỉ **${idea.pricePoint.toLocaleString('vi-VN')}đ** kích thích thanh toán một lần hoặc hàng tháng thoải mái.
- Hạ tầng máy chủ tối ưu tuyệt đối về 0đ: Vercel Hosting + Supabase sịn sò có sẵn để biên lợi nhuận thu về ròng rã tiệm cận 100%!
- Thiết kế hệ thống mã QR nạp tự động qua VietQR API rụng thông điệp trực tiếp vào Telegram nhóm chat một cách trơn tru.

## 4. PROGRAMMING STACK (Trực diện lập trình nhanh)
- Phát triển bằng React Vite cho web-app hay Godot Engine cho game 2D. 
- Thời gian đóng gói tối giản (MVP) giữ vững dưới 6 ngày để liên tục đưa ra thị trường đo lường phản hồi.

## 5. MACHINE LEARNING & AI INTEGRATION (Động cơ thông minh)
- Tích hợp gọi API bóc tách hình ảnh, đối chiếu tự động dùng mô hình Gemini 3.5 Flash miễn phí của Google, bảo mật token qua các biến môi trường an toàn.`;
          const updated = ideas.map(item => {
            if (item.id === idea.id) {
              return { ...item, aiBlueprint: fallback };
            }
            return item;
          });
          saveToStorage(updated);
        } else {
          setErrorMsg(data.error || 'Đường truyền bận, vui lòng thử lại sau ít phút.');
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Không thể kết nối đến máy chủ AI để xử lý.');
    } finally {
      setLoadingAI(false);
    }
  };

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
  const codeRegex = /LF[A-Z0-9\_]+/i;
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
  const cleanInfo = String(info).replace(/[^a-zA-Z0-9_\\s]/g, "").trim();
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

  const currentIdea = ideas.find(item => item.id === selectedIdeaId);

  // Helper to render the dynamic Lean Canvas Model (9 cells)
  const renderLeanCanvas = (idea: UnexpectedIdea) => {
    const problemStr = `- Đối tượng "${idea.nicheAudience}" có những khó chịu lớn khi hạch toán.
- Khó khăn cốt lõi: "${idea.description}"
- Giải pháp truyền thống cực kỳ rườm rà, tốn hao nhân lực hoặc phí phần mềm thương mại đắt đỏ.`;

    const segmentsStr = `- Tệp mục tiêu: ${idea.nicheAudience} tại Việt Nam.
- Người dùng tiên phong: Các hộ kinh doanh bán lẻ, chủ shop livestream, coder tự kiếm thu nhập MRR tự động.`;

    const uvpStr = `- Mô hình vận hành tự động tinh gọn cao độ.
- Bản quyền chỉ ${Number(idea.pricePoint).toLocaleString('vi-VN')} VNĐ/tháng bằng 1 ly café vỉa hè, tạo MRR bền bỉ cho Solo Founder.`;

    const solutionStr = `- Mini-SaaS / Mini-Game gọn nhẹ xây dưới 7 ngày bằng Vite React hoặc Godot.
- Đồng bộ VietQR đối soát webhook đẩy thẳng thông tin tới Telegram không cần cổng trung gian.`;

    const channelsStr = `- Quảng bá du kích không đồng tại các diễn đàn kinh doanh, nhóm Facebook.
- Làm video ngắn TikTok kịch bản hài hước về bài toán thanh toán.
- App Store Optimization (ASO) thọc sâu tệp từ khóa rắc rối hằng ngày.`;

    const revenueStr = `- Thu MRR rẻ từ số đông: ${Number(idea.pricePoint).toLocaleString('vi-VN')} VNĐ nạp trực tiếp qua quét QR.
- Nhận tài trợ hiển thị danh mục liên kết.`;

    const costStr = `- Serverless Vercel, Supabase Free Tier bền bỉ đảm bảo chi phí máy chủ hàng tháng là 0đ.
- Chi phí cơ hội độc lập của Solo Founder là 0 VNĐ.`;

    const metricsStr = `- Tỷ lệ đối soát VietQR khớp thành công tự động.
- Lượt truy cập hoạt động hằng ngày (DAU).
- Định mức thời gian nạp VIP trong 3 giây.`;

    const advantageStr = `- Đóng gói thần tốc chưa đầy 1 tuần làm việc một mình làm chủ 100% công nghệ.
- Tích hợp mô hình AI suy luận trực tiếp trên client (Edge) không phát sinh chi phí API.`;

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-left font-sans text-xs bg-slate-950 p-4 border border-slate-900 rounded-2xl my-2 select-text">
        {/* Step 1: Problem */}
        <div className="md:col-span-1 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div>
            <span className="text-[9.5px] font-black text-rose-450 uppercase tracking-widest block font-mono">⚠️ 1. Vấn đề cốt lõi</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{problemStr}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-bold block pt-1.5 border-t border-slate-950">Market Pain</span>
        </div>

        {/* Step 2: Solution & Metrics */}
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-all flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-black text-teal-400 uppercase tracking-widest block font-mono">🛡️ 2. Giải pháp MVP</span>
              <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{solutionStr}</p>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Core Features</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-all flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-black text-yellow-500 uppercase tracking-widest block font-mono">📏 4. Chỉ số then chốt</span>
              <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{metricsStr}</p>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Key Metrics</span>
          </div>
        </div>

        {/* Step 3: Unique Value Proposition */}
        <div className="md:col-span-1 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between hover:border-purple-500/25 transition-all">
          <div>
            <span className="text-[9.5px] font-black text-purple-405 uppercase tracking-widest block font-mono">⚡ 3. Giá trị độc nhất</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{uvpStr}</p>
          </div>
          <p className="text-[9px] text-purple-400 font-bold pt-1.5 border-t border-slate-950">Unique Value Prop</p>
        </div>

        {/* Step 4: Unfair Advantage & Channels */}
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-all flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-black text-blue-400 uppercase tracking-widest block font-mono">🚀 6. Lợi thế chiến lược</span>
              <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{advantageStr}</p>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Unfair Advantage</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-all flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest block font-mono">📢 5. Kênh tiếp thị</span>
              <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{channelsStr}</p>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Indie Channels</span>
          </div>
        </div>

        {/* Step 5: Customer Segments */}
        <div className="md:col-span-1 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div>
            <span className="text-[9.5px] font-black text-sky-400 uppercase tracking-widest block font-mono">👥 9. Phân khúc khách</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{segmentsStr}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-bold block pt-1.5 border-t border-slate-950">Niche Segments</span>
        </div>

        {/* Bottom Row: Cost Structure & Revenue Streams */}
        <div className="md:col-span-2 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 hover:border-emerald-500/25 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[9.5px] font-black text-emerald-450 uppercase tracking-widest block font-mono">📉 8. Cơ cấu chi phí tối giản 0đ</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{costStr}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Cost Structure</span>
        </div>

        <div className="md:col-span-3 p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 hover:border-emerald-500/25 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[9.5px] font-black text-indigo-400 uppercase tracking-widest block font-mono">📈 7. Dòng doanh thu MRR</span>
            <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed mt-1.5 whitespace-pre-line">{revenueStr}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-bold block pt-1 border-t border-slate-950">Revenue Streams</span>
        </div>
      </div>
    );
  };

  // Helper to render blueprint markdown cleanly
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-black text-white mt-5 border-b border-slate-900 pb-1.5 flex items-center gap-2">
            <span className="w-1 h-3 rounded bg-emerald-500 animate-pulse"></span>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-black text-emerald-400 mt-6 flex items-center gap-1">
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

  // Pricing & Volume math values
  const totalRevenue = targetVolume * unitPrice;
  const netProfit = totalRevenue - (monthlyServerCost * 12);
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* MANIFESTO/PHILOSOPHY HEADER */}
      <section className="bg-gradient-to-r from-purple-950/20 via-[#060a12] to-emerald-950/25 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl animate-pulse"></div>
        <div className="absolute left-1/4 bottom-0 w-32 h-32 rounded-full bg-purple-500/5 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-start gap-4 md:items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
                🚀 VIETNAM GUERILLA PRODUCT STUDIO
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-black rounded font-mono">HỌC ĐỂ ĐÓNG GÓI & BÁN</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-4xl font-semibold">
                Mục tiêu nghiên cứu DA, BA, Tài chính kế toán, Lập trình và ML là để <strong>đóng gói phần mềm, indie game đánh các thị trường ngách, định giá siêu rẻ để tiếp cận số lượng lớn chủ cửa hàng và người dùng Việt Nam</strong>. Hãy rèn luyện kỹ năng lai để xây dựng đế chế micro-SaaS có chi phí vận hành 0đ!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TACTICAL SKILL LINK GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: "1. Data Science", desc: "Quét, làm sạch & khám phá hành vi, tìm ra đúng lỗ hổng thị trường ngách để đánh chiến thuật.", icon: Database, color: "text-blue-400 border-blue-500/20" },
          { title: "2. Business Analysis", desc: "Định vị quy trình tinh giản nhất, giải quyết triệt để 1 nỗi đau vàng lặp đi lặp lại của khách.", icon: Layers, color: "text-purple-400 border-purple-500/20" },
          { title: "3. Kế Toán & Định Giá", desc: "Đóng gói mô hình giá siêu hời nhắm số đông (bán sỉ) đi cùng cấu hình hạ tầng vận hành 0 VNĐ.", icon: DollarSign, color: "text-emerald-400 border-emerald-500/20" },
          { title: "4. Lập Trình Siêu Tốc", desc: "Code nhanh, gãy góc gọn nhẹ dạng MVP trong < 7 ngày bằng Web templates hay Godot thô sơ.", icon: Terminal, color: "text-slate-400 border-slate-700/30" },
          { title: "5. Machine Learning", desc: "Lắp ráp một mác AI On-device siêu nhẹ, tạo lợi thế độc quyền cho app tăng tỷ lệ chuyển đổi.", icon: Cpu, color: "text-indigo-400 border-indigo-500/20" }
        ].map((item, id) => (
          <div key={id} className={`bg-slate-950/60 p-4 rounded-xl border ${item.color} space-y-2`}>
            <div className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-slate-200" />
              <h4 className="text-[11px] font-black uppercase text-white tracking-tight">{item.title}</h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* TAB SUB-SELECTOR BAR */}
      <div className="flex flex-col md:flex-row border border-slate-800 bg-[#04080e]/80 p-1.5 rounded-2xl gap-2 select-none">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border ${
            activeTab === 'ideas'
              ? 'bg-gradient-to-r from-emerald-950/50 via-slate-950 to-emerald-950/50 text-emerald-400 border-emerald-500/25 shadow-lg shadow-emerald-500/5'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>I. SỔ Ý TƯỞNG & GIẢ LẬP KINH TẾ</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border ${
            activeTab === 'agents'
              ? 'bg-gradient-to-r from-emerald-950/50 via-slate-950 to-emerald-950/50 text-emerald-400 border-emerald-500/25 shadow-lg shadow-emerald-500/5'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>II. BIỆT ĐỘI AI AGENT TÁC CHIẾN (SIÊU CẤP VIP)</span>
        </button>

        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border ${
            activeTab === 'strategy'
              ? 'bg-gradient-to-r from-emerald-950/50 via-slate-950 to-emerald-950/50 text-emerald-400 border-emerald-500/25 shadow-lg shadow-emerald-500/5'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>III. SƠ ĐỒ & CHIẾN LƯỢC TẬP TRUNG TỐI ĐA (0 VNĐ)</span>
        </button>
      </div>

      {activeTab === 'ideas' && (
        <>
          {/* SECTION B: GUERILLA SIMULATOR (HIGH VOLUME, LOW PRICE, ZERO-OPERATING COST) */}
      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 shadow-xl grid lg:grid-cols-12 gap-6 items-center">
        {/* Sliders Area */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">OPERATIONAL MODEL SIMULATOR</span>
            <h3 className="text-sm font-black text-white uppercase mt-1">
              📊 Trình Giả Lập Phát Triển "Bán Rẻ - Số Lượng Rộng Lớn"
            </h3>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
              Chiến thuật du kích cắt bỏ rườm rà doanh nghiệp lớn. Chỉ cần tập trung bán cực rẻ với tệp khách đông đảo trên nền hạ tầng tự động <strong>0đ vận hành</strong>:
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Unit Price Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold font-sans">
                <span className="text-slate-350">Mức giá bán siêu rẻ (VND):</span>
                <span className="text-emerald-400 font-mono font-extrabold">{unitPrice.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <input 
                type="range"
                min="10000"
                max="250000"
                step="5000"
                value={unitPrice}
                onChange={e => setUnitPrice(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>10.000đ (Giá Mini Game)</span>
                <span>250.000đ (Micro-SaaS cao cấp)</span>
              </div>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold font-sans">
                <span className="text-slate-350">Số lượng khách hàng tải / gia hạn (User):</span>
                <span className="text-purple-400 font-mono font-extrabold">{targetVolume.toLocaleString('vi-VN')} lượt nạp</span>
              </div>
              <input 
                type="range"
                min="100"
                max="10000"
                step="100"
                value={targetVolume}
                onChange={e => setTargetVolume(Number(e.target.value))}
                className="w-full accent-purple-500 h-1"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>100 lượt</span>
                <span>10.000 lượt (Quy mô vừa phải Việt Nam)</span>
              </div>
            </div>

            {/* Operating cost slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold font-sans">
                <span className="text-slate-350">Chi phí máy chủ, duy trì hàng tháng:</span>
                <span className={`font-mono font-extrabold ${monthlyServerCost === 0 ? 'text-emerald-500 animate-pulse' : 'text-rose-400'}`}>
                  {monthlyServerCost === 0 ? '0 VNĐ (Tối ưu tuyệt đối)' : `${monthlyServerCost.toLocaleString('vi-VN')} VNĐ`}
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="500000"
                step="20000"
                value={monthlyServerCost}
                onChange={e => setMonthlyServerCost(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>0đ (Free-Tier Stack)</span>
                <span>500.000đ/tháng ( VPS riêng)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-1 border-l border-slate-900 h-full hidden lg:block"></div>

        <div className="lg:col-span-4 bg-slate-950 p-4.5 rounded-2xl border border-slate-850 space-y-4">
          <div className="text-center pb-2 border-b border-slate-900">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">HIỆU QUẢ DỮ LIỆU DỰ THU</span>
            <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {totalRevenue.toLocaleString('vi-VN')} <span className="text-xs">VND</span>
            </p>
            <span className="text-[9.5px] text-slate-500 font-semibold block mt-1">Dựa trên mô hình nhân rải quy mô Việt Nam</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between leading-none">
              <span className="text-slate-500 font-semibold">Tỷ suất LN ròng:</span>
              <span className="text-white font-bold font-mono">{profitMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between leading-none">
              <span className="text-slate-500 font-semibold">Phí server cả năm:</span>
              <span className="text-slate-300 font-bold font-mono">{(monthlyServerCost * 12).toLocaleString('vi-VN')} VNĐ</span>
            </div>
            
            <div className="pt-2 border-t border-slate-900">
              {monthlyServerCost === 0 ? (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                  <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest block">⭐ CHỈ SỐ DU KÍCH HOÀN MỸ</span>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    Không lo gánh nặng chi phí! Với operating cost = 0đ, bạn có thể treo game/app hàng năm trời để đón nhận cơ hội viral tự nhiên mà không lo âm tiền cốt lõi.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    Nếu bạn nỗ lực học kỹ thuật tối ưu hóa mã nguồn, tận dụng Supabase Free tier, SQLite cục bộ, bạn có thể ép chi phí vận hành về 0 VNĐ để tăng tỷ suất lợi nhuận đạt mức tối đa!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE: IDEAS HUB & RAPID BLUEPRINTEER */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: UNSAVED IDEAS LIST & CREATOR */}
        <div className="lg:col-span-5 bg-slate-950/60 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between shadow-lg space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-sans">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Sổ Ý Tưởng Bất Chợt ({ideas.length})
              </span>
              <button
                onClick={() => {
                  if (editingIdeaId) {
                    setEditingIdeaId(null);
                  } else {
                    setShowAddForm(!showAddForm);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                  showAddForm || editingIdeaId 
                    ? 'bg-rose-600/20 text-rose-400 border-rose-500/25'
                    : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow shadow-emerald-500/10'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showAddForm || editingIdeaId ? 'Đóng lại' : 'Ghi nhanh'}</span>
              </button>
            </div>

            {/* 🎛️ BỘ CÂN BẰNG TRỌNG SỐ Ý TƯỞNG (IDEA FIT EQUALIZER) */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <span className="text-[10.5px] font-black uppercase text-emerald-400 font-mono flex items-center gap-1.5 leading-none">
                  🎛️ Bộ Cân Bằng Trọng Số Ý Tưởng (Idea Fit Equalizer)
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                  Trang 4: Công thức Fit
                </span>
              </div>
              
              <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-center font-bold">
                <span className="text-purple-400">α (Pain)</span> &nbsp;+&nbsp; 
                <span className="text-sky-450 text-sky-400">β (Gap / Viral)</span> &nbsp;-&nbsp; 
                <span className="text-orange-400">γ (Dev Cost)</span> &nbsp;+&nbsp; 2.0
              </div>

              <div className="space-y-3 text-[10px] font-black">
                {/* Alpha Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-350">
                    <span>Trọng số Tần Suất &amp; Cường Độ Nỗi Đau (α):</span>
                    <span className="text-purple-400 font-mono font-extrabold">{weightAlpha.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightAlpha}
                    onChange={(e) => setWeightAlpha(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Beta Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-350">
                    <span>Trọng số Điểm Lan Tỏa / Khoảng Trống (β):</span>
                    <span className="text-sky-405 text-sky-400 font-mono font-extrabold">{weightBeta.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightBeta}
                    onChange={(e) => setWeightBeta(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Gamma Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-350 font-bold">
                    <span>Trọng số Gánh Nặng / Chi Phí Dev (γ):</span>
                    <span className="text-orange-400 font-mono font-extrabold">{weightGamma.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={weightGamma}
                    onChange={(e) => setWeightGamma(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* FORM TO EDIT OR ADD NEW SUDDEN IDEA */}
            {editingIdeaId !== null ? (
              <form onSubmit={handleUpdateIdea} className="bg-slate-900/65 p-4 rounded-2xl border border-emerald-500/25 space-y-3.5">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-tight flex items-center gap-1.5 border-b border-slate-850 pb-2">
                  <Edit className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Sửa Ý Tưởng: {editTitle}
                </h4>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Tên Ý tưởng (Sản phẩm/Game):</label>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Ví dụ: Tool xuất hóa đơn từ ảnh chụp hóa đơn xá xíu"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Loại hình:</label>
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="saas">Micro-SaaS App</option>
                      <option value="game">Mobile / Web Game</option>
                      <option value="utility">Mã nguồn / Excel Tool</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Thiết lập giá bán (VND):</label>
                    <input 
                      type="number"
                      value={editPrice}
                      onChange={e => setEditPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 px-2 py-1 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Khách hàng ngách cụ thể là ai?:</label>
                  <input 
                    type="text"
                    value={editNiche}
                    onChange={e => setEditNiche(e.target.value)}
                    placeholder="Ví dụ: Tài xế xe ôm, chủ quán lẩu bò, người bán tạp hóa vỉa hè"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Mô tả cơ chế hoạt động vắn tắt:</label>
                  <textarea 
                    rows={3}
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="Khách chụp ảnh hóa đơn tịt -> App gọi AI bóc ra text -> đẩy thành file Excel..."
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                {/* Score inputs (Sliders) */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9.5px] font-black text-slate-450 uppercase block tracking-wider mb-2">Đo lường Chỉ số tác chiến du kích (1 - 10)</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-400">
                    <div>
                      <label className="block mb-1 font-sans">⏱️ Tốc độ hoàn thiện (<span className="text-emerald-400 font-bold">{editSpeed}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={editSpeed} 
                        onChange={e => setEditSpeed(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-sans">💰 Khép chi phí 0đ (<span className="text-emerald-400 font-bold">{editCost}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={editCost} 
                        onChange={e => setEditCost(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-sans">🩹 Sát thương nỗi đau (<span className="text-emerald-400 font-bold">{editPain}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={editPain} 
                        onChange={e => setEditPain(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-sans">📢 Khả năng Viral lan toả (<span className="text-emerald-400 font-bold">{editViral}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={editViral} 
                        onChange={e => setEditViral(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingIdeaId(null)}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-xl"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow shadow-emerald-500/20"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            ) : showAddForm ? (
              <form onSubmit={handleAddIdea} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight flex items-center gap-1.5 border-b border-slate-850 pb-2">
                  <Sparkles className="w-4 h-4 text-yellow-405 animate-spin" />
                  Bắt Kịp Ý Tưởng Vừa Nảy Ra Rực Rỡ!
                </h4>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Tên Ý tưởng (Sản phẩm/Game):</label>
                  <input 
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Tool xuất hóa đơn từ ảnh chụp hóa đơn xá xíu"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Loại hình:</label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="saas">Micro-SaaS App</option>
                      <option value="game">Mobile / Web Game</option>
                      <option value="utility">Mã nguồn / Excel Tool</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Thiết lập giá bán (VND):</label>
                    <input 
                      type="number"
                      value={newPrice}
                      onChange={e => setNewPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 px-2 py-1 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Khách hàng ngách cụ thể là ai?:</label>
                  <input 
                    type="text"
                    value={newNiche}
                    onChange={e => setNewNiche(e.target.value)}
                    placeholder="Ví dụ: Tài xế xe ôm, chủ quán lẩu bò, người bán tạp hóa vỉa hè"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Mô tả cơ chế hoạt động vắn tắt:</label>
                  <textarea 
                    rows={3}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Khách chụp ảnh hóa đơn tịt -> App gọi AI bóc ra text -> đẩy thành file Excel..."
                    className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                {/* Score inputs (Sliders) */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9.5px] font-black text-slate-450 uppercase block tracking-wider mb-2">Đo lường Chỉ số tác chiến du kích (1 - 10)</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-400">
                    <div>
                      <label className="block mb-1">⏱️ Tốc độ hoàn thiện (<span className="text-emerald-400 font-bold">{newSpeed}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={newSpeed} 
                        onChange={e => setNewSpeed(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">💰 Khép chi phí 0đ (<span className="text-emerald-400 font-bold">{newCost}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={newCost} 
                        onChange={e => setNewCost(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">🩹 Sát thương nỗi đau (<span className="text-emerald-400 font-bold">{newPain}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={newPain} 
                        onChange={e => setNewPain(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">📢 Khả năng Viral lan toả (<span className="text-emerald-400 font-bold">{newViral}d</span>):</label>
                      <input 
                        type="range" min="1" max="10" value={newViral} 
                        onChange={e => setNewViral(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-xl"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow shadow-emerald-500/20"
                  >
                    Ghi lại
                  </button>
                </div>
              </form>
            ) : (
              /* IDEAS LIST */
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-900">
                {ideas.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIdeaId(item.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden select-none ${
                      selectedIdeaId === item.id
                        ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/20 shadow shadow-emerald-500/5'
                        : 'bg-slate-900/60 border-slate-850 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-md font-extrabold border ${
                            item.type === 'game' 
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                              : item.type === 'saas' 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {item.type === 'saas' ? 'Micro-SaaS' : item.type === 'game' ? 'Game Mobile' : 'Excel/Code'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{item.createdAt}</span>
                        </div>
                        <h4 className="text-xs font-black text-white mt-2 leading-tight block pr-14">{item.title}</h4>
                      </div>
                      
                      {/* Guerrilla Badge score */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-1 px-2.5 text-center shrink-0 min-w-[50px]">
                        <span className="text-[8px] text-slate-550 block font-bold leading-none uppercase">Score</span>
                        <span className="text-sm font-black text-emerald-400 font-mono tracking-tight block mt-0.5">{item.guerrillaScore}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2.5 truncate">
                      <span className="text-slate-500">Ngách: </span>{item.nicheAudience}
                    </p>

                    <div className="mt-3.5 pt-2 border-t border-slate-900/80 flex justify-between items-center text-[10.5px]/none">
                      <span className="text-slate-500 font-bold">Giá: <strong className="text-slate-200 font-mono">{item.pricePoint.toLocaleString('vi-VN')}đ</strong></span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                          }}
                          className="text-slate-500 hover:text-emerald-400 p-1 rounded transition-all"
                          title="Sửa ý tưởng"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteIdea(item.id, e)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-all"
                          title="Xoá ý tưởng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {ideas.length === 0 && (
                  <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-slate-850/60 p-4">
                    <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Danh sách đang bỏ trống.</p>
                    <p className="text-[10px] text-slate-600 mt-1">Bấm "Ghi nhanh" ở trên để ghi lại ngay dòng ý kiến bất chợt của bạn!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QUICK PROMPT INJECT CARD */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-2.5">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Tư Duy Thực Chiến
            </span>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Kinh nghiệm từ các cao thủ đúc kết: Thị trường luôn có khoảng trống ngách khổng lồ. Việc kết hợp <strong>1 file Python dọn data đơn giản</strong> hay <strong>1 mini game đồ họa retro cực nhẹ</strong>, nạp tiền tự động qua quét QR, có thể mang lại dòng MRR thụ động vượt bậc so với việc theo đuổi các dự án triệu đô bất khả thi.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL STRATEGY BLUEPRINT GENERATED BY GEMINI */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between shadow-lg space-y-4 min-h-[500px]">
          {currentIdea ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Header Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4 border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                      Căn Cứ Tác Chiến: {currentIdea.title}
                    </h3>
                    <p className="text-[11px] text-slate-450 font-medium leading-relaxed mt-1">
                      Chi tiết ý tưởng gốc: <span className="text-slate-300 italic">"{currentIdea.description}"</span>
                    </p>
                  </div>

                  {/* Rating parameters table representation */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleGenerateBlueprint(currentIdea)}
                      disabled={loadingAI}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow shadow-emerald-500/15 disabled:bg-slate-800 disabled:from-slate-800 disabled:to-slate-800 flex items-center gap-1.5 transition-all select-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                      <span>{currentIdea.aiBlueprint ? 'AI Vẽ lại bản đồ' : 'Gọi AI Thẩm định 5 Trụ Cột'}</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Dashboard for Guerrilla Index */}
                <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center font-semibold text-[10px]">
                  <div className="border-r border-slate-900">
                    <span className="text-slate-500 block text-[9px] font-black uppercase">Build Speed</span>
                    <span className="text-white block mt-0.5 font-bold font-mono">{currentIdea.speedRating}/10</span>
                  </div>
                  <div className="border-r border-slate-900">
                    <span className="text-slate-500 block text-[9px] font-black uppercase">Low Overhead</span>
                    <span className="text-emerald-400 block mt-0.5 font-bold font-mono">{currentIdea.costRating}/10</span>
                  </div>
                  <div className="border-r border-slate-900">
                    <span className="text-slate-500 block text-[9px] font-black uppercase">Niche Pain</span>
                    <span className="text-purple-400 block mt-0.5 font-bold font-mono">{currentIdea.marketPain}/10</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] font-black uppercase">Viral Metric</span>
                    <span className="text-sky-400 block mt-0.5 font-bold font-mono">{currentIdea.viralPotential}/10</span>
                  </div>
                </div>
              </div>

              {/* Central text content */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4.5 flex-1 overflow-y-auto max-h-[480px] scrollbar-thin scrollbar-thumb-slate-900">
                {loadingAI ? (
                  <div className="py-20 text-center space-y-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <Cpu className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">BỘ NÃO GEMINI ĐANG TƯ DUY TÁC CHIẾN...</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1 max-w-md mx-auto leading-relaxed">
                        Đang kết xuất bản kế hoạch chi tiết bám sát 5 kỹ nghệ: Khoa học dữ liệu lớn (DA), Nghiên cứu Nghiệp vụ (BA), Sổ sách Định giá rẻ (Finance), Coding siêu kịch bọc (dưới 7 ngày) và tích hợp Edge Machine Learning!
                      </p>
                    </div>

                    {/* Fun guerrilla log step loader */}
                    <div className="text-[9px] font-mono text-slate-500 space-y-1.5 pt-2 text-left max-w-sm mx-auto">
                      <div className="flex gap-2 items-center text-emerald-405">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Cường hóa tệp ngách: "{currentIdea.nicheAudience}"</span>
                      </div>
                      <div className="flex gap-2 items-center text-emerald-405">
                        <Check className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                        <span>Tổng hợp Star Schema & Trình hạch toán hóa đơn...</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="w-3.5 h-3.5 rounded bg-slate-900 block border border-slate-800"></span>
                        <span>Tính toán định mức vận hành 0 VNĐ trên Vercel...</span>
                      </div>
                    </div>
                  </div>
                ) : errorMsg ? (
                  <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/20 text-xs text-rose-300 space-y-2">
                    <div className="flex items-center gap-1 text-rose-400 font-black">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Lỗi kết nối hoặc hụt khoá</span>
                    </div>
                    <p className="font-semibold leading-relaxed">{errorMsg}</p>
                    
                    {/* Fallback custom render anyway if we added a mock text */}
                    {currentIdea.aiBlueprint && (
                      <div className="pt-3 border-t border-slate-800/80 mt-2 space-y-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Kế hoạch mẫu phục vụ nghiên cứu:</span>
                        <div className="text-slate-350">{renderMarkdownText(currentIdea.aiBlueprint)}</div>
                      </div>
                    )}
                  </div>
                ) : currentIdea.aiBlueprint ? (
                  <div className="space-y-4">
                    {/* View mode toggle with export options */}
                    <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-900 mb-2">
                      <div className="flex items-center gap-1.5 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                        <button
                          onClick={() => setViewMode('markdown')}
                          className={`px-3 py-1 text-[10.5px] font-black rounded-md transition-all ${
                            viewMode === 'markdown'
                              ? 'bg-emerald-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sổ tay Tác Chiến (Markdown)
                        </button>
                        <button
                          onClick={() => setViewMode('canvas')}
                          className={`px-3 py-1 text-[10.5px] font-black rounded-md transition-all ${
                            viewMode === 'canvas'
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Lean Canvas (9 Ô)
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Download as Markdown Button */}
                        <button
                          onClick={() => {
                            if (!currentIdea.aiBlueprint) return;
                            const element = document.createElement("a");
                            const file = new Blob([`# KẾ HOẠCH TÁC CHIẾN DU KÍCH: ${currentIdea.title.toUpperCase()}\n\n${currentIdea.aiBlueprint}`], {type: 'text/markdown'});
                            element.href = URL.createObjectURL(file);
                            element.download = `ledgerflow_guerrilla_plan_${currentIdea.id}.md`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[9.5px] font-bold transition-all"
                          title="Tải tài liệu dạng Markdown về máy"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Xuất .MD</span>
                        </button>

                        {/* Print Report Button */}
                        <button
                          onClick={() => {
                            const printW = window.open('', '_blank');
                            if (!printW) {
                              alert("Mở khóa popup để in báo cáo!");
                              return;
                            }
                            printW.document.write(`
                              <html>
                                <head>
                                  <title>Sản phẩm du kích: ${currentIdea.title}</title>
                                  <style>
                                    body { font-family: "Segoe UI", sans-serif; color: #111; line-height: 1.6; padding: 40px; max-width: 800px; margin: auto; }
                                    h1 { border-bottom: 2px solid #000; padding-bottom: 8px; text-transform: uppercase; font-size: 20px; }
                                    .meta { background: #f9f9f9; padding: 12px; border-radius: 6px; font-size:12px; margin-bottom: 20px; }
                                    pre { background: #f5f5f5; padding: 18px; font-family: monospace; font-size:12.5px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ddd; }
                                    @media print { pre { border: none; background: transparent; padding: 0; } }
                                  </style>
                                </head>
                                <body>
                                  <h1>Bản Kế Hoạch Thẩm Định AI - ${currentIdea.title}</h1>
                                  <div class="meta">
                                    <p><strong>Khách hàng ngách:</strong> ${currentIdea.nicheAudience}</p>
                                    <p><strong>Mức giá đầu ra đề cử:</strong> ${currentIdea.pricePoint.toLocaleString('vi-VN')} VNĐ/tháng</p>
                                    <p><strong>Mô tả ý tưởng gốc:</strong> ${currentIdea.description}</p>
                                    <p><strong>Chỉ số Guerrilla Score:</strong> ${currentIdea.guerrillaScore}/10</p>
                                  </div>
                                  <div>
                                    <pre>${currentIdea.aiBlueprint}</pre>
                                  </div>
                                  <script>window.onload = function() { window.print(); }</script>
                                </body>
                              </html>
                            `);
                            printW.document.close();
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-[9.5px] font-bold transition-all"
                          title="In bản thẩm định đẹp đẽ"
                        >
                          <Printer className="w-3 h-3 text-purple-400" />
                          <span>In Báo Cáo</span>
                        </button>

                        <button
                          onClick={() => copyText(currentIdea.aiBlueprint || '', `bp_${currentIdea.id}`)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-[9.5px] font-bold transition-all"
                        >
                          {copiedId === `bp_${currentIdea.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {viewMode === 'canvas' ? (
                      renderLeanCanvas(currentIdea)
                    ) : (
                      <div className="space-y-3 select-text font-sans">
                        {renderMarkdownText(currentIdea.aiBlueprint)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 select-text">
                    
                    {/* Welcome prompt to trigger AI */}
                    <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl flex items-start gap-3.5">
                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase">
                          ⭐ THẨM ĐỊNH TỰ ĐỘNG BẰNG ĐĂNG BẢN LẬP LUẬN
                        </span>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed font-semibold">
                          Ý tưởng này chưa được kích hoạt bản lộ trình kỹ thuật đầy đủ. Bạn có thể bấm nút <strong className="text-emerald-400">"Gọi AI Thẩm định 5 Trụ Cột"</strong> ở trên để bóc tách mã nguồn và lược đồ Star Schema. Dưới đây là phân tích cấu trúc du kích tức thời:
                        </p>
                      </div>
                    </div>

                    {/* 1. INTERACTIVE SWOT MATRIX */}
                    <div className="space-y-3">
                      <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                        📊 Ma Trận Phân Tích SWOT Du Kích (Trang 4)
                      </span>
                      
                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Strengths */}
                        <div className="p-3 bg-slate-950 border border-emerald-950/20 rounded-xl space-y-1">
                          <span className="text-[9.5px] font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none block w-max uppercase">
                            S - Điểm Mạnh (Strengths)
                          </span>
                          <ul className="space-y-1.5 text-[10.5px] text-slate-400 pt-1 font-bold">
                            <li className="flex items-start gap-1">
                              <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                              <span>Tốc độ xây bản dựng siêu tốc (<strong className="text-white">{currentIdea.speedRating}/10</strong>).</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-emerald-400 mt-1 shrink-0">✓</span>
                              <span>Chi phí tối giản gánh nặng cực thấp (<strong className="text-white">{currentIdea.costRating}/10</strong>).</span>
                            </li>
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="p-3 bg-slate-950 border border-orange-950/20 rounded-xl space-y-1">
                          <span className="text-[9.5px] font-mono text-orange-400 font-extrabold bg-orange-500/10 px-1.5 py-0.5 rounded leading-none block w-max uppercase">
                            W - Điểm Yếu (Weaknesses)
                          </span>
                          <ul className="space-y-1.5 text-[10.5px] text-slate-400 pt-1 font-bold">
                            <li className="flex items-start gap-1">
                              <span className="text-orange-400 mt-1 shrink-0">•</span>
                              <span>Solo founder gánh vác cả kỹ thuật lẫn báo cáo thuế phức tạp.</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-orange-400 mt-1 shrink-0">•</span>
                              <span>Công nghệ rào cản mỏng, dễ bị clone nhanh ở giai đoạn đầu.</span>
                            </li>
                          </ul>
                        </div>

                        {/* Opportunities */}
                        <div className="p-3 bg-slate-950 border border-sky-950/20 rounded-xl space-y-1">
                          <span className="text-[9.5px] font-mono text-sky-400 font-extrabold bg-sky-500/10 px-1.5 py-0.5 rounded leading-none block w-max uppercase">
                            O - Cơ Hội (Opportunities)
                          </span>
                          <ul className="space-y-1.5 text-[10.5px] text-slate-400 pt-1 font-bold">
                            <li className="flex items-start gap-1">
                              <span className="text-sky-400 mt-1 shrink-0">+</span>
                              <span>Tệp ngách béo bở: <strong className="text-slate-300">"{currentIdea.nicheAudience}"</strong> mang nỗi đau lớn ({currentIdea.marketPain}/10).</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-sky-400 mt-1 shrink-0">+</span>
                              <span>Kênh lan tỏa organic TikTok, Reddit tiềm năng nhiều ({currentIdea.viralPotential}/10).</span>
                            </li>
                          </ul>
                        </div>

                        {/* Threats */}
                        <div className="p-3 bg-slate-950 border border-rose-950/20 rounded-xl space-y-1">
                          <span className="text-[9.5px] font-mono text-rose-455 font-extrabold bg-rose-500/10 px-1.5 py-0.5 rounded leading-none block w-max uppercase">
                            T - Thách Thức (Threats)
                          </span>
                          <ul className="space-y-1.5 text-[10.5px] text-slate-400 pt-1 font-bold">
                            <li className="flex items-start gap-1">
                              <span className="text-rose-455 mt-1 shrink-0">!</span>
                              <span>Rủi ro thanh tra thuế VAT quốc tế xuyên biên giới khi dùng Stripe đơn lẻ.</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-rose-455 mt-1 shrink-0">!</span>
                              <span>Sập phễu nếu không bảo toàn tỷ suất giữ chân người dùng (Retention).</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* 2. TREND PREDICTOR & PRICING STRATEGY WIZARD */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      
                      {/* Trend Predictor Dashboard Card */}
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-purple-400 font-extrabold">TREND FORECASTER ENGINE</span>
                          <h4 className="text-xs font-black text-white">Chỉ Số Xu Hướng Dự Đoán</h4>
                        </div>
                        
                        <div className="space-y-2 py-1.5 border-y border-slate-900 border-dashed">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">Tỷ lệ trỗi dậy xu hướng:</span>
                            <span className="text-emerald-400 font-mono font-black">📈 84% (Cực Hot)</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">Khả năng Viral tự nhiên:</span>
                            <span className="text-sky-400 font-mono font-black">{(currentIdea.viralPotential * 10)}% (Khả quan)</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                          📌 Khuyên dùng: Triển khai chiến thuật <strong className="text-white">Build in public</strong> để tối đa hóa lượt theo dõi từ ngày T-14.
                        </p>
                      </div>

                      {/* Pricing Strategy Wizard */}
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-emerald-400 font-extrabold">PRICING &amp; FINANCE STRATEGY (Page 6)</span>
                          <h4 className="text-xs font-black text-white">Định Giá Sản Phẩm Tác Chiến</h4>
                        </div>
                        
                        <div className="space-y-2 py-1.5 border-y border-slate-900 border-dashed">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400 font-semibold">Mức giá tương đối đề xuất:</span>
                            <span className="text-white font-mono font-black">{currentIdea.pricePoint.toLocaleString('vi-VN')}đ</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400 font-semibold font-semibold">Phễu thu cốt lõi phù hợp:</span>
                            <span className="text-emerald-400 font-mono font-black">
                              {currentIdea.pricePoint < 50000 ? 'VietQR Nội Địa' : 'Hybrid VietQR + Paddle MoR'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                          🏷️ Ý tưởng quảng bá: Tặng gói trọn đời <strong className="text-white">Lifetime Deal (LTD)</strong> sớm để thu hút những nòng cốt đầu tiên.
                        </p>
                      </div>

                    </div>

                    {/* 3. ASO COLUMN RETENTION RANGING PLAN */}
                    <div className="p-4 bg-gradient-to-r from-slate-950 to-purple-950/20 border border-slate-850 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-mono text-sky-400 font-extrabold uppercase">
                          🚀 PHỄU GIỮ CHÂN &amp; KHOÁ TỪ KHOÁ BAN ĐẦU (ASO &amp; RETENTION TRANG 6)
                        </span>
                        <span className="text-[8.5px] bg-[#0a1020] text-purple-400 px-2 py-0.5 rounded border border-purple-500/10 font-bold">
                          User Retention Signal
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                          <h5 className="text-[11px] font-black text-slate-200">🔍 Trụ Cột SEO Từ Khóa (ASO Keywords)</h5>
                          <p className="text-[10.2px] text-slate-400 leading-relaxed font-semibold">
                            Định hình tên app và tiêu đề ngách bám sát các từ khoá dài có lượng tìm kiếm thô nhưng độ cạnh tranh bằng 0 (Ví dụ: keyword dài đuôi <em className="text-emerald-400 font-bold">"kiểm tra hoá đơn ảo rủi ro..."</em>).
                          </p>
                        </div>

                        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                          <h5 className="text-[11px] font-black text-slate-200">📈 Chỉ Số Giữ Chân Bền Vững (Retention)</h5>
                          <p className="text-[10.2px] text-slate-400 leading-relaxed font-semibold">
                            Tập trung toàn lực để đạt tỷ số giữ chân <strong className="text-white">T+7 trên 25%</strong> bằng tính năng thông báo email tiện lợi, tránh việc tiêu hoang ngân sách tiếp thị vô bến bờ!
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-32 text-center space-y-2">
              <Compass className="w-12 h-12 text-slate-700 mx-auto animate-spin" />
              <p className="text-sm text-slate-400 font-bold">Chưa chọn ý tưởng nào.</p>
              <p className="text-xs text-slate-500">Vui lòng nạp hoặc ghi nhanh 1 ý kiến ở danh mục bên trái để bắt đầu lập chiến thuật!</p>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {activeTab === 'agents' && (
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
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
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

                    <div className="text-[9.5px] font-mono text-slate-400 space-y-2 text-left max-w-xs mx-auto bg-[#04080e] p-3 rounded-xl border border-slate-900">
                      <p className="flex items-center gap-2"><span className="text-emerald-500">▶</span> npx ant-agent-runner init</p>
                      <p className="flex items-center gap-2 text-emerald-400"><span className="text-emerald-500 animate-pulse">●</span> Loading Agent System Instruction System...</p>
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
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold transition-all shadow"
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
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong>Mẹo du kích:</strong> Hãy tận dụng tối đa <strong>Game & App Logic Coder</strong> để nhận các mã nguồn thô của SQLite, Web, hoặc GDScript, sau đó dán vào code editor để chạy thử và hoàn chỉnh game mộc mạc trong đúng 5-7 ngày!
              </p>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-6">
          {/* HEADER INTRO */}
          <div className="bg-[#04080e]/90 border border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block font-sans">STRATEGY COMMAND POST</span>
                <h2 className="text-base font-black text-white uppercase mt-1">
                  ⚔️ Kế Hoạch Tác Chiến Du Kích & Khai Thác Bản Địa
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-4xl font-semibold">
                  Tận dụng lợi thế liên ngành <strong className="text-emerald-400 font-bold">Kế toán + Kiểm toán + Tài chính + DA + BA + ML</strong> làm bộ lọc thiết kế và lập trình thông minh. Không đối đầu trực diện, đi nước đi ngách sắc lẹm, định giá rẻ tối đa.
                </p>
              </div>

              {/* Conventional vs Guerrilla Switch Header Summary */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl shrink-0">
                <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Chi phí duy trì = 0 VNĐ | Tốc độ đóng gói &lt; 7 ngày</span>
              </div>
            </div>

            {/* STRATEGY SUB-TABS SELECTOR */}
            <div className="flex flex-wrap gap-2 border-t border-slate-900 mt-5 pt-4 select-none">
              {[
                { id: 'mindmap', label: '🗺️ 4 Bước Tăng Trưởng', desc: 'Sơ đồ chuỗi tác chiến' },
                { id: 'roadmap', label: '🛹 Lộ Trình 12 Bước Học & Code', desc: '12 Bước hành động cụ thể' },
                { id: 'niches', label: '🎯 Thị Trường Ngách Tận Bản', desc: '8 phân khúc tài chính & game' },
                { id: 'weapons', label: '⚔️ Kho Vũ Khí AI 0 VNĐ', desc: 'Tận dụng Free-tier tối đa' },
                { id: 'rules', label: '🛡️ Tối Thượng Luật & Rủi Ro', desc: '4 Nguyên tắc & 5 Cạm bẫy' },
                { id: 'proposal', label: '📋 Đề Xuất Lập Trình Tinh Gọn', desc: 'Sắp xếp Sprint, KPI & Rủi ro' }
              ].map((sub) => {
                const isSelected = strategySubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setStrategySubTab(sub.id as any)}
                    className={`px-4 py-2.5 rounded-xl transition-all border text-left flex-1 min-w-[160px] ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-950/30 to-slate-950 text-emerald-400 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                        : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="text-xs font-black">{sub.label}</div>
                    <div className="text-[9px] font-semibold text-slate-500 mt-0.5">{sub.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DUAL COGNITION OR INTERACTIVE CONTENT CONDITION */}
          {strategySubTab === 'mindmap' && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
              {/* Conventional Card */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 bg-opacity-70">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-300 font-sans">I. CON ĐƯỜNG TRUYỀN THỐNG (Khó sống sót)</h4>
                    <p className="text-[10px] text-slate-500 font-bold font-sans">Thường dẫn tới cạn vốn của 95% Solo Founder ít ngân sách</p>
                  </div>
                </div>
                
                <div className="space-y-3.5 text-xs text-slate-400 font-semibold leading-relaxed font-sans">
                  <div className="space-y-1">
                    <span className="font-bold text-[10.5px] text-slate-300 block text-orange-300">💸 Chi Phí Ban Đầu Cực Lớn:</span>
                    <p className="text-[10.5px]">Phí thuê VPS khủng, mua licence database, cấu hình máy chủ SaaS rườm rà. Hệ thống âm tiền ngay khi chưa có người dùng đầu tiên.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-[10.5px] text-slate-300 block text-orange-300">🛑 Đưa Sản Phẩm Ra Chợ Quá Chậm:</span>
                    <p className="text-[10.5px]">Mất 3-6 tháng thiết kế đồ sộ để hoàn chỉnh dự án rườm rà. Đến khi triển khai thực tế thị trường đã đổi chiều, người dùng chối từ.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-[10.5px] text-slate-300 block text-orange-300">📉 Bẫy Tiếp Thị Trả Phí (Paid Ads):</span>
                    <p className="text-[10.5px]">Bơm tiền vào Google Ads / Facebook Ads đẩy lượt cài, nhưng doanh thu từ giá bán rẻ không gánh nổi phễu quảng cáo khốc liệt.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-[10.5px] text-slate-350 block text-orange-300">📊 Thu Phí Hằng Tháng Định Kỳ Cứng Nhắc:</span>
                    <p className="text-[10.5px]">Bắt người dùng trả phí định kỳ khiến họ đề phòng rất cao ở Việt Nam. Khâu thuyết phục vô cùng tốn thời gian và rớt phễu cực lẹ.</p>
                  </div>
                </div>
              </div>

            {/* Guerrilla Card */}
            <div className="bg-gradient-to-br from-emerald-950/20 via-slate-950/40 to-emerald-950/20 border border-emerald-950/35 rounded-3xl p-5 space-y-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-2 border-b border-emerald-950/20 pb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-400">II. THIẾT YẾU DU KÍCH 0đ (Hiệu suất tuyệt đối)</h4>
                  <p className="text-[10px] text-emerald-500/70 font-bold">Giúp sống dẻo dai, bền bỉ và dễ hái tiền số đông</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-400">
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-emerald-300 block">💎 Chi Phí Vận Hành Tiệm Cận 0đ:</span>
                  <p className="text-[10.5px] leading-relaxed">Ưu tiên tối đa giải pháp Offline-first (lưu trữ SQLite/LocalStorage cục bộ). Tận dụng Vercel Serverless, Supabase Free Tier, Google App Script.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-emerald-300 block">⚡ Lập Trình Thần Tốc (MVP dưới 5 ngày):</span>
                  <p className="text-[10.5px] leading-relaxed">Chỉ giải quyết duy nhất 1 nỗi đau vàng (Pain Point). Lợi dụng AI đóng gói sạch mã nguồn thô đưa gấp ra thị trường đo lường.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-emerald-300 block">📣 Marketing Lan Truyền Hữu Cơ (No Ads Budget):</span>
                  <p className="text-[10.5px] leading-relaxed">Biến hành vi thực tế (kẹt xe lội nước, trôi bill shop nhỏ) thành kịch bản video ngắn TikTok bám sát tâm lý số đông để kéo traffic tự phát về.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10.5px] text-emerald-300 block">💰 Đóng Gói 'Rẻ Quên Sầu' (Tính mốc 15k - 49k):</span>
                  <p className="text-[10.5px] leading-relaxed">Giá bán chỉ bằng cốc cà phê vỉa hè hoặc ổ bánh mì ăn sáng mua đứt vĩnh viễn không quảng cáo. Triệt tiêu rào cản phòng bị tâm lý của người dùng.</p>
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE MINDMAP BOARD */}
          <div className="bg-[#04080d]/90 border border-slate-900 rounded-3xl p-5 shadow-xl space-y-5">
            <div>
              <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block font-sans">INTERACTIVE ROADMAP & CHI QUYỀN</span>
              <h3 className="text-sm font-black text-white uppercase mt-1 font-sans">
                🗺️ Sơ Đồ Tư Duy Chuỗi Tác Chiến Tăng Trưởng 4 Giai Đoạn
              </h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                Bấm chọn từng nốt sơ đồ dưới đây để bóc rã bộ giải pháp chi tiết đi cùng danh sách Check-list, công nghệ 0đ và bí thuật tối cao từ các AI Coach:
              </p>
            </div>

            {/* Mindmap Nodes Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none relative pt-2">
              {STREMY_NODES.map((node, nIdx) => {
                const isSelected = selectedStrategyId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedStrategyId(node.id)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    {/* Tiny connecting arrow line visually linking steps if widescreen on desktop */}
                    {nIdx < 3 && (
                      <div className="hidden lg:block absolute top-1/2 -right-1 w-2.5 h-[1.5px] bg-slate-900 z-10"></div>
                    )}
                    
                    <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                      <span className="text-[8px] font-black font-mono text-emerald-400 tracking-wider block">
                        {node.phase}
                      </span>
                      <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                        {node.title}
                      </h4>
                    </div>

                    <div className="mt-3 flex justify-center items-center gap-1">
                      {isSelected ? (
                        <span className="text-[8px] font-black bg-emerald-500 text-slate-900 px-2 py-0.5 rounded leading-none font-sans">
                          ĐANG XEM
                        </span>
                      ) : (
                        <span className="text-[8px] font-black text-slate-500 group-hover:text-slate-300 transition-all font-sans">
                          XEM CHI TIẾT →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED NODE DETAILS VIEW */}
            {selectedStrategyId && (() => {
              const activeNode = STREMY_NODES.find(n => n.id === selectedStrategyId);
              if (!activeNode) return null;
              return (
                <div className="grid lg:grid-cols-12 gap-6 pt-2 items-start">
                  
                  {/* Left Column: Strategy details, metrics & tools */}
                  <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-4">
                    <div>
                      <span className="text-[10px] font-mono font-black text-emerald-404 tracking-wider uppercase block">
                        📋 {activeNode.phase}
                      </span>
                      <h4 className="text-sm font-black text-white mt-1">
                        🔑 {activeNode.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-semibold">
                        {activeNode.goal}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10.5px] font-black text-emerald-300 flex items-center gap-1.5 font-sans">
                        🛠️ CÔNG CỤ HOÀN TOÀN 0đ KHUYÊN DÙNG:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeNode.toolStack.map((tool, tIdx) => (
                          <span key={tIdx} className="bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#04080e]/80 p-3 rounded-xl border border-slate-900/60">
                      <span className="text-[10px] font-black text-emerald-400 tracking-wider block uppercase font-mono">
                        🎯 CHỈ SỐ MỤC TIÊU CỐT LÕI (KPI):
                      </span>
                      <p className="text-[11.5px] text-emerald-400 font-mono font-bold mt-1">
                        {activeNode.metric}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400 font-semibold leading-relaxed border-t border-slate-900 pt-3">
                      <span className="font-black text-white block mb-1">Mô tả định vị:</span>
                      {activeNode.details}
                    </div>
                  </div>

                  {/* Right Column: Interactive Checklists & Action items */}
                  <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-4 min-h-[300px]">
                    
                    {/* Action checklists */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-white uppercase tracking-wider block flex items-center gap-1.5 font-sans">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Danh sách hành động cụ thể (Sản xuất ngay)
                      </span>
                      <div className="space-y-2 pt-1 font-sans">
                        {activeNode.actionChecklist.map((item, id) => (
                          <div key={id} className="flex items-start gap-2 text-[11px] text-slate-300 font-semibold leading-relaxed">
                            <span className="text-emerald-400 shrink-0 mt-0.5 font-mono font-black">{id + 1}.</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Highly strategic Guerilla Hacks */}
                    <div className="space-y-2 bg-gradient-to-r from-emerald-950/20 to-transparent p-3.5 rounded-xl border border-emerald-950/30">
                      <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                        Bí thuật du kích (Guerilla Hacks)
                      </span>
                      <div className="space-y-2 pt-1">
                        {activeNode.guerillaHacks.map((item, id) => (
                          <div key={id} className="flex items-start gap-2 text-[10.5px] text-slate-300 font-semibold leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5 shadow shadow-emerald-500/50"></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pre-designed prompt trigger suggestion to quickly direct other agents */}
                    <div className="space-y-2 bg-[#04080e]/60 p-3 rounded-xl border border-slate-900/65">
                      <span className="text-[10px] font-black text-purple-400 uppercase block font-sans">
                        ⚙️ Gửi ý tưởng này đến AI Agents ngay:
                      </span>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Bấm nút dưới để nạp nhanh prompt tương tác trực chiến với nhóm Agent tác chiến lập trình của bạn!
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('agents');
                          if (selectedStrategyId === 'stage_1') {
                            setSelectedAgentId('agent_growth_hacker');
                            setAgentUserInput('Hãy cùng tôi hoàn thành bản nháp ý tưởng sản phẩm siêu ngách (Micro-Niche Product) của tôi. Tôi muốn tìm kiếm 3 nỗi xúc động / bức xúc mãnh liệt nhất của người bán hàng trực tuyến cá nhân nhỏ tại Việt Nam liên quan đến thủ thuật hạch toán dòng tiền, trôi hóa đơn khi livestream.');
                          } else if (selectedStrategyId === 'stage_2') {
                            setSelectedAgentId('agent_dev');
                            setAgentUserInput('Code cho tôi toàn bộ bộ khung lớp JavaScript thuần (hoặc GDScript Godot) để duy trì sao lưu dữ liệu cục bộ an toàn, có khả năng sao chép, phục hồi offline khi mất mạng.');
                          } else if (selectedStrategyId === 'stage_3') {
                            setSelectedAgentId('agent_vietqr');
                            setAgentUserInput('Hãy lập trình luồng mã nguồn NodeJS đối soát VietQR tự động, có phân tách cú pháp cú hích thanh toán bằng regex để mở khoá VIP không tốn chi phí ròng.');
                          } else {
                            setSelectedAgentId('agent_growth_hacker');
                            setAgentUserInput('Hãy lên cho tôi kế hoạch viết bài mô tả ASO chuẩn xác cho Google Play & chợ Steam. Nhắm trúng cụm từ khoá đặc biệt ít cạnh tranh nhưng có lượt tìm kiếm mặn nồng tại Việt Nam.');
                          }
                          setAgentOutput('');
                        }}
                        className="w-full mt-1.5 py-2.5 text-[10px] font-black uppercase bg-slate-900 hover:bg-emerald-950/20 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/30 rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Nạp prompts và mở "Biệt Đội AI Agent"
                      </button>
                    </div>

                  </div>

                </div>
              );
            })()}

          </div>
        </>
      )}

          {/* SUB-TAB 2: ROADMAP 12 STEPS */}
          {strategySubTab === 'roadmap' && (() => {
            const completedCount = completedSteps.length;
            const completionPercentage = Math.round((completedCount / 12) * 100);
            
            const ROADMAP_PHASES = [
              {
                title: '🌱 GIAI ĐOẠN 0 — NỀN MÓNG (1–3 THÁNG)',
                steps: [
                  { id: 'step_1', name: 'Bước 1: Chọn 1 ngôn ngữ mộc & học chuyên sâu', desc: 'Chọn Python (nếu thiên về dữ liệu, ML/data app) hoặc JavaScript/TypeScript (nếu chuộng web + mobile web). Đừng dàn trải học song song cả hai.' },
                  { id: 'step_2', name: 'Bước 2: Luyện kỹ năng Git & GitHub cơ bản', desc: 'Quản lý mã nguồn thô đưa lên GitHub hoàn toàn miễn phí. Đây là kỹ năng rèn luyện thiết thiết thực học ngay tuần đầu!' },
                  { id: 'step_3', name: 'Bước 3: Rèn luyện trí óc dùng AI pair-programming', desc: 'Lợi dụng lực đẩy của Claude, Cursor AI, Windsurf hoặc Copilot để viết code cùng AI dọn sạch cú pháp rườm rà.' }
                ]
              },
              {
                title: '🚀 GIAI ĐOẠN 1 — SẢN PHẨM ĐẦU TAY (3–6 THÁNG)',
                steps: [
                  { id: 'step_4', name: 'Bước 4: Đóng gói micro-app kế toán/tài chính nhỏ', desc: 'Khai thác lợi thế hiểu nghiệp vụ sâu để làm sổ thu chi cá nhân/SME, phân tích BCTC, dashboard kiểm toán nhỏ. Publish web miễn phí (Vercel/Netlify).' },
                  { id: 'step_5', name: 'Bước 5: Tiếp cận framework phát triển game tối giản', desc: 'Học Godot Engine (Cực bốc cho PC + Mobile, nhẹ tưng dưới 25MB) hoặc Phaser.js (game chạy ngay trên Web HTML5 mượt mà).' },
                  { id: 'step_6', name: 'Bước 6: Launch mini game đầu tiên', desc: 'Publish miễn phí lên itch.io lấy ý kiến phản hồi thực tiễn, không tốn bất cứ chi phí publisher hay ads nào.' }
                ]
              },
              {
                title: '📌 GIAI ĐOẠN 2 — MỞ RỘNG ĐA NỀN TẢNG (6–12 THÁNG)',
                steps: [
                  { id: 'step_7', name: 'Bước 7: Thiết lập Cross-Platform Di Động', desc: 'Dùng Flutter (Dart) hoặc React Native để compile sang cả Android và iOS từ đúng 1 codebase duy nhất.' },
                  { id: 'step_8', name: 'Bước 8: Đưa sản phẩm lên Chợ ứng dụng di động', desc: 'Ưu tiên nạp $25 một lần cho Google Play Store trước. Phiên bản Apple App Store ($99/năm) thì để sau khi có kinh nghiệm dồi dào.' },
                  { id: 'step_9', name: 'Bước 9: Gài trí khôn Machine Learning tăng tầm giá trị', desc: 'Tích hợp tự phân loại giao dịch bằng NLP thô, dự báo dòng tiền chi tiêu ngắn hạn, hay cảnh báo hạch toán red flags.' }
                ]
              },
              {
                title: '💰 GIAI ĐOẠN 3 — THƯƠNG MẠI HÓA DU KÍCH (12–24 THÁNG)',
                steps: [
                  { id: 'step_10', name: 'Bước 10: Rải file, bán sỉ trên đa chợ song song', desc: 'Bán trực tiếp qua itch.io, Google Play, Gumroad, Lemon Squeezy hoặc Web app tự phát của chính mình.' },
                  { id: 'step_11', name: 'Bước 11: Định mức giá hời "rẻ nhưng nhiều" để hút khách', desc: 'Định giá siêu rẻ hạt dẻ từ $1 - $5 (15k đến 119k VND). Giảm ngưỡng quyết định mua của người Việt về không.' },
                  { id: 'step_12', name: 'Bước 12: Độc chiêu - Template hoá codebase core', desc: 'Tách nhân gốc phần mềm kế toán hoặc game, nhân bản ra 10 ngách khác nhau chỉ trong 2 tuần bằng cách đổi logo, thay da (reskin).' }
                ]
              }
            ];

            return (
              <div className="space-y-6">
                {/* Visual Progress Header */}
                <div className="bg-[#03060c] p-6 rounded-3xl border border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">LEARNING PROGRESS MONITOR</span>
                    <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 font-sans">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Trình Đo Lường Tiến Độ Chiến Dịch Học & Hành (12 Bước)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold max-w-2xl leading-relaxed">
                      Đo lường các cột mốc thực thi để không bị lạc lối giữa rừng lý thuyết. Bấm tích trực tiếp để cập nhật thành tựu.
                    </p>
                  </div>
                  <div className="w-full sm:w-auto shrink-0 space-y-2 text-right font-sans">
                    <div className="flex justify-between sm:justify-end gap-2.5 text-xs font-extrabold">
                      <span className="text-slate-400">Tiến độ chiến dịch:</span>
                      <span className="text-emerald-400 font-mono text-xs">{completedCount}/12 Bước ({completionPercentage}%)</span>
                    </div>
                    <div className="w-full sm:w-48 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Vertical Stepper layout splitting into phase cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {ROADMAP_PHASES.map((phase, pIdx) => (
                    <div key={pIdx} className="bg-slate-950/70 border border-slate-900 rounded-3xl p-5 space-y-3.5 relative">
                      <div className="absolute right-4 top-4 text-[10px] font-mono font-bold text-slate-700">
                        PHASE 0{pIdx}
                      </div>
                      <h4 className="text-xs font-black text-white border-b border-slate-900 pb-2.5 tracking-tight uppercase">
                        {pIdx === 0 && "🌱 "}
                        {pIdx === 1 && "🚀 "}
                        {pIdx === 2 && "📌 "}
                        {pIdx === 3 && "💰 "}
                        {phase.title}
                      </h4>
                      <div className="space-y-3 pt-1">
                        {phase.steps.map((st) => {
                          const isDone = completedSteps.includes(st.id);
                          return (
                            <div 
                              key={st.id} 
                              onClick={() => toggleStep(st.id)}
                              className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex gap-3 relative overflow-hidden select-none ${
                                isDone 
                                  ? 'bg-emerald-500/5 border-emerald-500/30' 
                                  : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/80 hover:border-slate-800'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                  isDone 
                                    ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                                    : 'border-slate-700 bg-slate-950'
                                }`}>
                                  {isDone && <Check className="w-3 h-3 stroke-[4px]" />}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className={`text-[11px] font-black block transition-all ${
                                  isDone ? 'text-emerald-400 line-through' : 'text-slate-200'
                                }`}>
                                  {st.name}
                                </span>
                                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                                  {st.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technical prioritizing flow chart */}
                <div className="bg-[#04080d]/80 p-5 rounded-3xl border border-slate-900 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">OPTIMIZED TECHNICAL LEARNING FLOW</span>
                    <h3 className="text-sm font-black text-white uppercase mt-1">
                      🛠️ Trật Tự Ưu Tiên Lĩnh Hội Công Nghệ Bậc Thầy
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed">
                      Bám sát sơ đồ phân kỳ này giúp bạn tích lũy kiến thức sâu hẹp, không lo bị ngập lụt lý thuyết mông lung:
                    </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
                    {[
                      { step: "1. Git & Github", tech: "Trực quan quản lý code", color: "border-blue-500/20 text-blue-400 bg-blue-950/5" },
                      { step: "2. Chọn 1 Ngôn Ngữ", tech: "JS/TS hoặc Python mộc", color: "border-purple-500/20 text-purple-400 bg-purple-950/5" },
                      { step: "3. Khung Web/Game", tech: "FastAPI / React / Godot", color: "border-indigo-500/20 text-indigo-400 bg-indigo-950/5" },
                      { step: "4. Deploy Đóng Gói", tech: "Vercel / itch.io / App", color: "border-emerald-500/20 text-emerald-404 bg-emerald-950/5" },
                      { step: "5. Cổng Thanh Toán", tech: "VietQR, PayOS, Telegram", color: "border-pink-500/20 text-pink-400 bg-pink-950/5" },
                      { step: "6. Trí Tuệ Nhân Tạo", tech: "NLP thô, ONNX, ML Model", color: "border-amber-500/20 text-amber-400 bg-amber-950/5" }
                    ].map((stepObj, sidx) => (
                      <div key={sidx} className={`p-4 rounded-2xl border ${stepObj.color} text-center space-y-1 hover:border-slate-700 transition-all cursor-default`}>
                        <span className="text-[8px] font-mono font-black uppercase opacity-60">PHÂN ĐỒ 0{sidx + 1}</span>
                        <h4 className="text-[11px] font-black text-white">{stepObj.step}</h4>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">{stepObj.tech}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* SUB-TAB 3: NICHE CONCEPTS */}
          {strategySubTab === 'niches' && (
            <div className="space-y-6">
              
              {/* Specialized Moat justification card */}
              <div className="bg-gradient-to-r from-[#060a12] via-emerald-950/20 to-purple-950/15 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block font-sans">HOW TO LEVERAGE YOUR SPECIALTIES</span>
                <h3 className="text-sm font-black text-white mt-1 uppercase">
                  🏆 Hào Sâu Bảo Vệ (Moat): Sự Giao Thoa Nghiệp Vụ Tài Chính & Kỹ Thuật
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-4xl font-semibold font-sans">
                  Các lập trình viên bên ngoài thường không biết nghiệp vụ kế toán, hóa đơn, hạch toán kép dán mác. Bạn là người am hiểu <strong className="text-emerald-400 font-bold">Kế toán, Kiểm toán tài vụ, BA, DA</strong> — hãy lấy đây làm lá chắn và vũ khí thượng tầng để thiết kế phần mềm sắc lẹm, giải quyết trúng bí bách thủ công tiềm ẩn của người dùng.
                </p>
              </div>

              {/* 8 Niche Concepts Grid cards */}
              <div className="space-y-3.5">
                <span className="text-xs font-black text-white uppercase tracking-wider block">
                  🎯 8 Ý Tưởng Thiết Kế Sản Phẩm Độc Đáo
                </span>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: "Kế toán SME Trực Chiến", label: "Hộ Kinh Doanh", goal: "Sổ sách thu chi mộc mạc, lọc hóa đơn tự động bằng Regex, báo cáo quý gọn gàng cho cơ sở bán sỉ lặt vặt.", moat: "Xử lý nghiệp vụ thuế, hạch toán giản đơn đúng chuẩn bản địa Việt Nam." },
                    { title: "Trợ lý VN-Index & Định Giá", label: "Phân Tích Tài Chính", goal: "Dashboard nội bộ định giá DCF, bảng lọc chỉ số P/E, tự động lấy dữ liệu tài chính vĩ mô.", moat: "Nền tảng lý thuyết tài vụ chặt chẽ, tạo độ uy tín dữ liệu chân xác tuyệt đối." },
                    { title: "Game Giáo dục Kinh tế cổ điển", label: "Game Giáo Dục", goal: "Phần mềm giả lập/mini game đấu trí dòng tiền, quiz kế toán sòng phẳng cho học sinh, sinh viên học thực nghiệm.", moat: "Xây dựng tình huống quản lý thực tế thú vị, dẹp bỏ lý thuyết suông." },
                    { title: "Trợ thủ Kiểm Toán Chênh Lệch", label: "Kiểm Toán Trợ Lý", goal: "Tool tự động so sánh, đối chiếu chứng từ sỉ, phát hiện bất động luồng tiền.", moat: "Kinh nghiệm thực tế phát hiện sơ hở kiểm toán báo cáo của dân Big4 thực thụ." },
                    { title: "Sổ Chi Tiêu Tinh Gọn Di Động", label: "Ngân Sách Cá Nhân", goal: "Dành riêng cho PC/Mobile, lưu trữ SQLite mọc, tự phân tích red-flags chi tiêu bằng logic AI thợ.", moat: "Hạ mức giá bán mua đứt cực thấp phá rào tâm lý e dè của người dùng phổ thông." },
                    { title: "Sơ Đồ PRD & Mindmap Tool cho BA", label: "Business Analyst Tool", goal: "Addon/Web app vẽ Mindmap, gen sườn PRD tức tốc, gợi ý kịch bản test case cho BA thợ.", moat: "Nhắm trúng khó khăn thiết thực hàng ngày của BA/DA khi đối ứng khách hàng phức tạp." },
                    { title: "Game Quản Lý Nông Trại Idle Realistic", label: "Game Mô Phỏng", goal: "Game mô phỏng vận hành nông trại có cơ tính lạm phát, khấu hao sòng phẳng.", moat: "Toán học phân phối dòng tiền tinh tế tạo trải nghiệm hấp dẫn sâu sắc (Game feel)." },
                    { title: "Excel / Sheets Automation Addon", label: "Kế Toán Excel Tool", goal: "Extension/Macro gài tự động tra cứu mã số thuế, tính toán nhanh NPV, IRR, dọn sạch bảng tính.", moat: "Đón lõng thói quen làm việc hàng đêm với trang tính của hàng triệu dân văn phòng." }
                  ].map((nc, id) => (
                    <div key={id} className="bg-slate-950 p-4.5 rounded-2xl border border-slate-900 space-y-3 hover:border-slate-800 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono font-black text-emerald-400 px-2 py-0.5 border border-emerald-500/25 rounded-md bg-emerald-500/5 block">
                          {nc.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">Concept 0{id + 1}</span>
                      </div>
                      <h4 className="text-xs font-black text-white">{nc.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        <strong className="text-slate-300 block mb-0.5">Sản phẩm:</strong>
                        {nc.goal}
                      </p>
                      <div className="pt-2 border-t border-slate-900 text-[10px] text-emerald-405 font-bold leading-normal">
                        <span className="text-slate-500 font-semibold block mb-0.5">🛡️ Hào bảo vệ (Moat):</span>
                        {nc.moat}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribution channels & pricing models */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                
                {/* Release platform channels compared */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2 font-sans">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Bản Đồ Kênh Phân Phối Đa Chiều (Không Sót Kênh Nào)
                  </h4>

                  <div className="space-y-3.5 text-xs leading-relaxed font-semibold font-sans">
                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
                      <span className="text-[10.5px] text-white font-bold block">📱 Phân khúc Di Động (Mobile Android & iOS):</span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        - Google Play Console: Phí $25 một lần duy nhất, duyệt thoáng hơn, tệp khách di động khổng lồ. Ưu tiên hàng đầu.
                        <br />- Apple App Store: Phí $99/năm, xét duyệt kỹ lưỡng. Chỉ nên tiến tới khi sản phẩm Android bắt đầu đem về dòng tiền thực chất.
                      </p>
                    </div>

                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
                      <span className="text-[10.5px] text-white font-bold block">💻 Phân khúc Máy Tính (PC itch.io) & Chợ Mềm:</span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        - itch.io: Miễn phí phát hành hoàn toàn. Cộng đồng game thủ cực kỳ cởi mở với lập trình viên indie. Cơ chế chọn % chia sẻ doanh thu siêu thấp dễ dãi.
                        <br />- Gumroad / Lemon Squeezy: Bán trực tiếp file cài đặt PC, bộ template, macro xịn. Thanh toán visa cực lẹ, chiết khấu chỉ từ 5-10%.
                        <br />- Web App tự chủ: Deploy lên Vercel/Netlify miễn phí, đấu nối PayOS nạp VietQR động, 0% chiết khấu trung gian, dòng tiền nạp về tài khoản ngân hàng lập tức!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Economic pricing list */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2 font-sans">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Thương Mại Hoá Bằng Triết Lý "Rẻ Mà Nhiều" (Volume Beats Margin)
                  </h4>

                  <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-semibold font-sans">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-200 block font-bold">🛒 Giá bán siêu rẻ hạt dẻ ($1 – $5):</span>
                      <p className="text-[10px] text-slate-450">Set up mức mua đứt vĩnh viễn vặt từ 15k đến 119k VND. Biến chiêu mua sắm thành quyết định trong 3 giây không cần đắn đo của người bán hàng hay game thủ Việt.</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-200 block font-bold">🔄 Gói thuê bao subscription mini ($0.5–$1/tháng):</span>
                      <p className="text-[10px] text-slate-450">Tích hợp tiện ích thông báo, đồng bộ sao lưu đám mây cực rẻ ngang bình trà đá. Tạo lập MRR (doanh thu định kỳ tháng) bền vững tích lũy dần theo quy mô.</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-200 block font-bold">🎯 Chiến thuật "Xác Reskin - Da Khác":</span>
                      <p className="text-[10px] text-slate-450">Một khi có khung game idle nông trại ổn định, hãy nhân bản rồi dán cốt truyện nuôi cá, gom dọn rác xanh, RESKIN thần tốc 5 game mới trong vòng 1 tháng nhắm tới đa dạng từ khóa nhỏ.</p>
                    </div>
                  </div>
                </div>

              </div>
              
            </div>
          )}

          {/* SUB-TAB 4: AI WEAPONS */}
          {strategySubTab === 'weapons' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-emerald-950/20 via-[#060a12] to-slate-950 border border-slate-900 rounded-3xl p-5 relative overflow-hidden">
                <span className="text-[10px] font-mono font-black text-emerald-404 uppercase tracking-widest block">ZERO BUDGET AI TOOL STACK</span>
                <h3 className="text-sm font-black text-white mt-1 uppercase font-sans">
                  ⚔️ Kho Vũ Khí AI Khởi Nghiệp 0 VNĐ (Quay Vòng Hết Quota Free)
                </h3>
                <p className="text-xs text-slate-450 mt-1 leading-relaxed max-w-3xl font-semibold font-sans font-sans">
                  Lợi dụng sự cạnh tranh khốc liệt giữa các gã khổng lồ công nghệ để lách quota miễn phí. Công cụ này nghẽn kịch khung, lập tức dời đô sang công cụ kia!
                </p>
              </div>

              {/* Five Column Grid layout */}
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    category: "🧠 Ý TƯỞNG & NGHIÊN CỨU",
                    borderColor: "border-blue-500/20 bg-blue-950/5",
                    tools: [
                      { name: "Claude (Anthropic)", desc: "Brainstorm mechanics game, phác thảo cốt truyện, duyệt sườn PRD mộc mạc." },
                      { name: "ChatGPT Free", desc: "Trợ thủ đắc lực xoay vòng khi Claude cồng kềnh báo hết quota lượt chat." },
                      { name: "Gemini Free", desc: "Nghiên cứu thị trường nhờ khả năng cập nhật Google Search thực tế tuyệt vời." },
                      { name: "Perplexity AI", desc: "Phân tích đối thủ cạnh tranh, chỉ rõ mỏ ngách ít người biết trực tuyến." }
                    ]
                  },
                  {
                    category: "💻 LẬP TRÌNH & VIẾT CODE",
                    borderColor: "border-purple-500/20 bg-purple-950/5",
                    tools: [
                      { name: "Cursor IDE (AI)", desc: "IDE thần thánh, hỗ trợ code trực tiếp siêu tốc rảnh tay dọn sạch cú pháp." },
                      { name: "GitHub Copilot", desc: "Autocomplete từng dòng mã nhanh, mượt mà bám sát ngữ cảnh dự án." },
                      { name: "Windsurf Editor", desc: "Phương án dự phòng chất lượng cao khi Cursor cạn dung lượng lượt gọi." },
                      { name: "Bolt.new", desc: "Tác chiến dựng nhanh prototype web app mọc từ một mô tả văn bản thô." }
                    ]
                  },
                  {
                    category: "🎨 TẠO MỸ THUẬT & UI",
                    borderColor: "border-sky-505/20 bg-sky-950/5",
                    tools: [
                      { name: "Figma App", desc: "Vẽ bố cục giao diện phẳng gọn, phác bento grid bốc mắt." },
                      { name: "Canva Free", desc: "Thiết kế banner tải ứng dụng, ảnh đại diện Google Play Store chuẩn chỉ." },
                      { name: "Kling AI", desc: "Trình tạo hoạt hình chibi 2D sinh vật di chuyển mượt để cắt sprite sheet." },
                      { name: "Stable Diffusion AI", desc: "Tạo background pixel art, cảnh quan cyberpunk offline mướt." }
                    ]
                  },
                  {
                    category: "🎵 ÂM THANH & NHẠC GAME",
                    borderColor: "border-indigo-500/20 bg-indigo-950/5",
                    tools: [
                      { name: "Suno AI Generator", desc: "Sinh nhạc nền lo-fi, synthwave mát tai cực hợp rơ cho game/app." },
                      { name: "Udio AI", desc: "Tái tạo âm thanh sfx như tiếng bước chân, tiếng mở khóa tinh tế." },
                      { name: "ElevenLabs Voice", desc: "Chuyển văn bản thành giọng đọc truyền cảm lôi cuốn người dùng." },
                      { name: "OpenGameArt.org", desc: "Kho âm thanh thô miễn phí, có bản quyền thương mại sòng phẳng." }
                    ]
                  },
                  {
                    category: "📢 TĂNG TRƯỞNG & VIDEO",
                    borderColor: "border-amber-500/20 bg-amber-950/5",
                    tools: [
                      { name: "CapCut AI", desc: "Dựng clip TikTok ngắn lan truyền cực nhanh, gõ chữ hiệu ứng lôi cuốn." },
                      { name: "Runway Gen-3", desc: "Tạo video giới thiệu ứng dụng ảo diệu nâng tầm chuyên nghiệp." },
                      { name: "Buffer App Free", desc: "Đặt thời gian đăng tự động lên TikTok, Reels để gom dòng traction." },
                      { name: "Brevo Email", desc: "Tự động gửi email chăm sóc hỗ trợ người mua vặt hoàn toàn miễn phí." }
                    ]
                  }
                ].map((col, cidx) => (
                  <div key={cidx} className={`bg-slate-950 p-4 rounded-2xl border ${col.borderColor} flex flex-col justify-between space-y-4`}>
                    <div className="space-y-3.5">
                      <span className="text-[10px] font-black text-white uppercase block pb-1 border-b border-slate-900 tracking-tight">
                        {col.category}
                      </span>
                      <div className="space-y-3 select-text font-sans">
                        {col.tools.map((tl, tidx) => (
                          <div key={tidx} className="space-y-0.5">
                            <span className="text-[11px] font-black text-emerald-400 block">✦ {tl.name}</span>
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{tl.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Practical prompt recipe box */}
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black text-purple-400 block uppercase">RECOMMENDED PROMPT RECIPIE</span>
                  <h4 className="text-xs font-black text-white uppercase font-sans">Gợi Ý Prompt Sản Xuất Nhanh Cho AI Creator:</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal font-sans">
                    Sao chép prompt này để nạp thẳng vào Claude nhằm thiết lập khuôn khổ sườn PRD ứng dụng kế toán ngách:
                  </p>
                </div>
                <button
                  onClick={() => {
                    copyText(
                      `Hãy đóng vai một chuyên viên thiết kế Business Analyst kiêm Kiến trúc sư dữ liệu dày dạn. Tôi chuẩn bị code một Micro-SaaS nhỏ tại Việt Nam chuyên tự động bóc tách hóa đơn VietQR chuyển khoản shop bán hàng. Hãy viết cho tôi 1 file tài liệu PRD (Product Requirement Document) cực kỳ tinh giản, tập trung thiết kế Star Schema SQLite thô và danh sách 3 API Webhook NodeJS rành mạch, bảo mật JWT.`,
                      'quick_agent_blueprint_prompt'
                    );
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-emerald-950/20 text-slate-300 hover:text-emerald-400 font-black text-xs rounded-xl border border-slate-800 hover:border-emerald-500/20 transition-all flex items-center gap-2 select-none"
                >
                  {copiedId === 'quick_agent_blueprint_prompt' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-405" />
                      <span className="text-emerald-405">Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt Cường Hoá BA</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* SUB-TAB 5: RULES VS RISKS */}
          {strategySubTab === 'rules' && (
            <div className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Rules catalog */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2 font-sans font-sans">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    4 Cương Lĩnh Cốt Lõi Của Chiến Pháp Tác Chiến VN
                  </h4>

                  <div className="space-y-4 text-xs font-sans">
                    {[
                      { id: 'ru1', title: "1. Volume beats margin (Doanh số thắng biên lợi nhuận)", desc: "Xếp đặt giá bán cực kì mộc và mượt ngang cốc nước mía vỉa hè (15k - 49k VND) mua đứt hoặc nạp VIP. Hoàn toàn gỡ bỏ sự cảnh giác mua sắm thường trực của bạn đọc Việt Nam." },
                      { id: 'ru2', title: "2. Template hóa codebase triệt để", desc: "Không bao giờ viết lại từ số không tròn trĩnh. Duy trì khuôn mẫu đăng nhập, thanh toán VietQR động linh hoạt, lưu SQLite client. Lúc phát hành phần mềm mới chỉ thay da đổi logo, RESKIN lẹ làng." },
                      { id: 'ru3', title: "3. Rải thảm đa kênh phân phối song song", desc: "Né tránh lệ thuộc một nguồn thu độc nhất. Launch song hành Google Play, itch.io, Web App tự khởi động, Gumroad bán tệp thô. Tiêu biến nguy cơ bị khóa tài khoản o ép đột ngột." },
                      { id: 'ru4', title: "4. Tận dụng tuyệt thế liên ngành làm vũ khí", desc: "Các coder thuần túy thường sáo rỗng về tài vụ và phân tích nghiệp vụ thực hành. Bạn thấu hiểu nghiệp vụ kế toán, quy trình BA thực địa sẽ thiết kế sản phẩm sâu sát sắc nét đè bẹp đối thủ hời hợt." }
                    ].map((ru) => (
                      <div key={ru.id} className="space-y-1.5 bg-slate-900/45 p-3.5 rounded-xl border border-slate-850">
                        <span className="font-extrabold text-[11px] text-emerald-400 block">{ru.title}</span>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{ru.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks and counter-measures catalog */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 space-y-4">
                  <h4 className="text-xs font-black text-rose-400 uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2 font-sans font-sans">
                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                    5 Cạm Bẫy Chí Tử Của Solo Developer Việt Nam & Cách Phòng Tránh
                  </h4>

                  <div className="space-y-4 text-xs font-sans">
                    {[
                      { id: 'ri1', title: "1. Học quá nhiều ngôn ngữ, framework song song", rx: "Cách phòng tránh: Chỉ dùng duy nhất 1 ngách công nghệ thô (Ví dụ JavaScript thuần web, Godot 4 cho game 2D/3D) mài giũa bén ngót." },
                      { id: 'ri2', title: "2. Ôm đồm xây dựng ứng dụng khổng lồ trước khi kiểm chứng", rx: "Cách phòng tránh: Cam kết đóng gói MVP siêu tốc trong vòng 5 ngày. Đẩy nhanh bản beta hớt phản hồi của 5 người dùng ngẫu nhiên cứu hỷ." },
                      { id: 'ri3', title: "3. Điên cuồng phụ thuộc hệ thống đám mây, server đắt đỏ", rx: "Cách phòng tránh: Kiến thiết Offline-first tối đa, lưu trữ cục bộ thiết bị người dùng (SQLite, IndexedDB). VPS chỉ làm Webhook bẫy thanh toán, tối ưu chi phí ròng về 0đ!" },
                      { id: 'ri4', title: "4. Lười nhác tiếp thị hữu cơ, lao đầu chạy Ads tốn phí", rx: "Cách phòng tránh: Lợi nhuận từ sản phẩm 15k không bao giờ bù nổi CAC của Facebook Ads. Bắt buộc phải mướt mồ hôi làm video ngắn TikTok sủi bọt, làm ASO di động chuẩn mực." },
                      { id: 'ri5', title: "5. Say xỉn tranh đấu sòng phẳng chống lại Big Player", rx: "Cách phòng tránh: Đại gia chê không thèm làm sản phẩm nách nhỏ cho bà con sạp cơm vỉa hè, sạp livestream hóa đơn lẻ. Góc tối chính là thiên đường hốt bạc dồi dào!" }
                    ].map((ri) => (
                      <div key={ri.id} className="space-y-1.5 bg-slate-900/45 p-3.5 rounded-xl border border-slate-850">
                        <span className="font-extrabold text-[11px] text-rose-400 block">{ri.title}</span>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{ri.rx}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SUB-TAB 6: PROFESSIONAL DETAILED PROPOSAL */}
          {strategySubTab === 'proposal' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Executive Summary Card */}
              <div className="bg-gradient-to-r from-emerald-950/20 via-[#060a12] to-purple-950/25 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block font-sans">PROJECT EXECUTIVE PROPOSAL</span>
                    <h3 className="text-base font-black text-white uppercase mt-1">
                      📋 Kế Hoạch Chuẩn Hoá Sprint, Đo Lường KPI & Phòng Vệ Rủi Ro (Base.vn & FastWork Standard)
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-4xl font-semibold">
                      Tích hợp triệt để triết lý <strong className="text-emerald-400">Khởi nghiệp Tinh gọn (Lean Startup - FMIT)</strong> và quy trình sản xuất phần mềm chuẩn mực kết hợp Agile/Scrum. Bản đề xuất này thiết lập các mốc thời gian rõ ràng, giám sát chất lượng định lượng chặt chẽ và khoanh vùng 6 rủi ro chí tử để đảm bảo dự án cập bờ an toàn không hao hụt vốn ròng.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION: GOALS, SCOPE & ASSUMPTIONS BAR */}
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* 1. Goals (Mục tiêu) */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white uppercase">🎯 I. MỤC TIÊU CHIẾN DỊCH</span>
                  </div>
                  <ul className="space-y-2.5 text-[11px] text-slate-400 font-semibold leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-405 shrink-0 mt-0.5">✦</span>
                      <span><strong>Sản phẩm đầu tay hoàn chỉnh:</strong> Đóng gói MVP giải quyết đúng nỗi đau ngách, dứt khoát không thừa tính năng rườm rà.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-405 shrink-0 mt-0.5">✦</span>
                      <span><strong>Rút ngắn Time-to-Market:</strong> Đẩy nhanh tiến độ ra mắt bản thử nghiệm để nhanh chóng chộp lấy tín hiệu thị trường.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-405 shrink-0 mt-0.5">✦</span>
                      <span><strong>Tối ưu hóa nguồn vốn:</strong> Tận dụng triệt để nền tảng điện toán đám mây và công cụ AI hỗ trợ chi phí 0đ.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-405 shrink-0 mt-0.5">✦</span>
                      <span><strong>Chất lượng định lượng:</strong> Thiết lập các bài test tự động và theo dõi KPI lỗi nghiêm ngặt trước khi phân phối thương mại.</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Scope (Phạm vi) */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5">
                    <Compass className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black text-white uppercase">🌐 II. PHẠM VI DỰ ÁN</span>
                  </div>
                  <ul className="space-y-2.5 text-[11px] text-slate-400 font-semibold leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 shrink-0 mt-0.5">✦</span>
                      <span><strong>Phạm vi sản phẩm:</strong> Thiết kế duy nhất một màn hình core tinh giản, tập trung giải quyết triệt để 1 nhiệm vụ trọng yếu (SaaS/Game).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 shrink-0 mt-0.5">✦</span>
                      <span><strong>Phạm vi công việc:</strong> Xuyên suốt quy trình chuẩn từ phân tích yêu cầu, thiết kế wireframe, lập trình, kiểm thử đến bàn giao, duy trì.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 shrink-0 mt-0.5">✦</span>
                      <span><strong>Phạm vi kênh & Địa lý:</strong> Tập trung phân phối nền tảng Web App & Chợ ứng dụng Android tại thị trường nội địa để tinh giảm chi phí.</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Assumptions (Giả định) */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black text-white uppercase">📝 III. CƠ SỞ GIẢ ĐỊNH</span>
                  </div>
                  <ul className="space-y-2.5 text-[11px] text-slate-400 font-semibold leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                      <span><strong>Nhóm tinh nhuệ:</strong> Giả định vận hành với quy mô solo founder hoặc nhóm hạt nhân 3-5 người, tự chia luồng công việc rõ ràng.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                      <span><strong>Hạ tầng sẵn sàng:</strong> Tích hợp các SDK mã nguồn mở phổ biến giúp giảm tối thiểu 80% thời gian nghiên cứu nền tảng mới.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 shrink-0 mt-0.5">✦</span>
                      <span><strong>Bảo mật & Luật pháp:</strong> Giả định không thu thập dữ liệu nhạy cảm của người dùng để tránh rắc rối pháp lý ban đầu.</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* SECTION: INTERACTIVE GANTT TIMELINE SCHEDULE */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-black text-emerald-400 block uppercase tracking-widest">INTERACTIVE GANTT TIMELINE</span>
                  <h4 className="text-sm font-black text-white uppercase mt-1">
                    📅 Sơ Đồ Tiến Độ Gantt & Kế Hoạch 5 Pha Tác Chiến
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-normal">
                    Quy trình sản xuất phần mềm khép kín từ lúc phát ý tưởng đến bàn giao vận hành thực chiến. Bấm trực tiếp vào các thanh tiến độ bên dưới để xem báo cáo phân kỳ chi tiết:
                  </p>
                </div>

                {/* Gantt Visual Bars Container */}
                <div className="space-y-3 bg-[#03060c] p-5 rounded-2xl border border-slate-900/60 font-sans">
                  {[
                    { id: 0, label: 'Pha 1: Khởi động & Khảo Sát Phân Tích', duration: 'Tháng 0 - 2', pct: 'w-2/12', color: 'from-blue-500 to-indigo-600', icon: '🔍' },
                    { id: 1, label: 'Pha 2: Thiết kế UI/UX & Code MVP', duration: 'Tháng 2 - 5', pct: 'w-5/12 ml-[16.6%]', color: 'from-amber-500 to-orange-600', icon: '💻' },
                    { id: 2, label: 'Pha 3: Kiểm thử toàn diện & Hiệu chỉnh lỗi', duration: 'Tháng 5 - 7', pct: 'w-2/12 ml-[41.6%]', color: 'from-purple-500 to-pink-600', icon: '🛡' },
                    { id: 3, label: 'Pha 4: Ra mắt thử nghiệm & ASO Chợ Di Động', duration: 'Tháng 7 - 9', pct: 'w-2/12 ml-[58.3%]', color: 'from-teal-500 to-emerald-600', icon: '🚀' },
                    { id: 4, label: 'Pha 5: Khai thác thương mại & Reskin nhân bản', duration: 'Tháng 9 - 18', pct: 'w-9/12 ml-[75%]', color: 'from-emerald-500 to-green-600', icon: '💰' }
                  ].map((phaseItem) => {
                    const isActive = activeProposalPhase === phaseItem.id;
                    return (
                      <div 
                        key={phaseItem.id}
                        onClick={() => setActiveProposalPhase(phaseItem.id)}
                        className={`group cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-slate-900/60 p-2.5 rounded-xl border border-slate-800' 
                            : 'hover:bg-slate-900/20 p-2.5 rounded-xl border border-transparent'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-bold gap-1 mb-1.5">
                          <span className={`${isActive ? 'text-emerald-400' : 'text-slate-200'} flex items-center gap-1.5`}>
                            <span>{phaseItem.icon}</span>
                            <span>{phaseItem.label}</span>
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">{phaseItem.duration}</span>
                        </div>
                        {/* Timeline bar track */}
                        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900 relative">
                          <div className={`h-full bg-gradient-to-r ${phaseItem.color} rounded-full transition-all duration-300 ${phaseItem.pct}`}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Details card for currently selected phase */}
                {(() => {
                  const PHASE_DETAILS = [
                    {
                      id: 0,
                      title: 'Pha 1: Khảo Sát Thị Trường & Phân Tích Nghiệp Vụ (Yêu Cầu Cơ Bản)',
                      time: 'Tháng 0 - 2 (Học mộc & Đóng khung PRD)',
                      role: 'Project Manager (PM), Business Analyst (BA), Technical Lead',
                      goals: 'Kiểm soát phạm vi dự án cốt lõi (Scope Lock) trước khi bắt tay viết dòng code đầu tiên. Đóng băng các câu chuyện người dùng để tránh rạn nứt cấu trúc về sau.',
                      tasks: [
                        'Khảo sát các sạp hàng, hội nhóm để tổng hợp 3 nỗi bực tức nóng bỏng nhất của tệp khách hàng mục tiêu.',
                        'Vẽ sơ đồ luồng dữ liệu thô (Data Flow Diagram) và thiết kế Star Schema SQLite trên máy tính cá nhân.',
                        'Viết tài liệu đặc tả PRD thu thu gọn, bóc tách chính xác những tính năng "buộc phải có" và loại hẳn tính năng "có cho đẹp".',
                        'Thiết lập cấu trúc thư mục Github chuẩn mực khoa học, dọn sạch code mẫu lỗi thời.'
                      ],
                      tools: 'ChatGPT, Perplexity Research, Figma, Git & GitHub repositories',
                      deliverable: 'Bản tài liệu đặc tả PRD kỹ thuật mộc + Bản vẽ Wireframe tương tác đen trắng tối giản.',
                      financialAdvice: 'Trong 60 ngày này, chi phí ròng hoạt động hoàn toàn bằng 0đ. Tận dụng tuyệt đối khối óc và công cụ AI miễn phí.'
                    },
                    {
                      id: 1,
                      title: 'Pha 2: Thiết Kế UI/UX Flat & Lập Trình Lõi MVP Bằng Agile/Sprint',
                      time: 'Tháng 2 - 5 (Code cường lực theo Sprint 2 tuần)',
                      role: 'Lead Developer, UI/UX Designer, DevOps Engineer',
                      goals: 'Xây dựng bộ xương cốt lõi chạy ổn định. Mọi chức năng phụ như cài đặt nâng cao, đổi hình nền v.v. đều bị tạm gác lại. Tập trung hoàn chỉnh module nghiệp vụ chính.',
                      tasks: [
                        'Lập trình module hạch toán dữ liệu thô hoặc cơ chế tương tác trò chơi 2D.',
                        'Thực thi kết nối Webhook thanh toán VietQR động để dòng tiền có thể đổ về tài khoản không cần chi chiết khấu cho bên thứ ba.',
                        'Đóng gói logic SQLite/Edge-computing chạy offline mượt mà không cần truy vấn máy chủ liên tục để bóp nghẹt chi phí VPS.',
                        'Tổ chức review mã nguồn (Code Review) cuối tuần để dọn sạch rác cú pháp và phòng ngừa rò rỉ bộ nhớ.'
                      ],
                      tools: 'React Native, Flutter, Godot 4, Cursor AI Code, PayOS SDKs',
                      deliverable: 'Bản build thô cục bộ (Local MVP Build) chạy trơn tru trên thiết bị giả lập.',
                      financialAdvice: 'Không thuê VPS đắt tiền giai đoạn này. Chạy thử nghiệm cục bộ hoàn toàn hoặc deploy lên Vercel Free-tier.'
                    },
                    {
                      id: 2,
                      title: 'Pha 3: Kiểm Thử Toàn Diện & Tinh Chỉnh Sản Phẩm (Hiệu Chỉnh Tinh Gọn)',
                      time: 'Tháng 5 - 7 (Diệt lỗi & Đo đạc độ bám sản phẩm)',
                      role: 'Tester / Quality Control (QC), QA Analyst, Core Developer',
                      goals: 'Đạt độ chín muồi ổn định kỹ thuật kỹ càng trước khi tung ra thị trường. Không để người dùng đầu tiên thất vọng vì ứng dụng liên tục treo cứng.',
                      tasks: [
                        'Tổ chức viết kịch bản kiểm thử (Test Cases) phủ kín 100% các dòng nghiệp vụ then chốt.',
                        'Mời 10-15 người dùng thân thiết trải nghiệm trước (Chương trình Beta Kín) nhằm thu thập phản hồi va chạm thực tế.',
                        'Đo lường thời gian đáp ứng API, tốc độ tải app dưới 3 giây và sút lỗi bộ nhớ đột ngột.',
                        'Xây dựng các câu thông báo lỗi thông minh hữu ích để người dùng tự khắc phục mà không cần hỗ trợ thủ công.'
                      ],
                      tools: 'Jest, Selenium, Firebase Crashlytics, Google Form Feedback',
                      deliverable: 'Cơ sở dữ liệu lỗi sạch (Zero-Bug Release-Candidate) + Sản phẩm đã được tối ưu hóa tốc độ tải.',
                      financialAdvice: 'Chi phí duy trì khoảng 100k-200k VND mua tên miền chính chủ (.vn hoặc .com). Mọi máy chủ test đều dùng hàng miễn phí.'
                    },
                    {
                      id: 3,
                      title: 'Pha 4: Phát Hành Phiên Bản Beta & ASO Lên Các Chợ Đa Kênh',
                      time: 'Tháng 7 - 9 (Rải file & Gài đặt marketing du kích)',
                      role: 'DevOps / IT Lead, Marketing Specialist, Solo Founder',
                      goals: 'Mở cửa rộng rãi để thu thập Traction (Lượng truy cập hữu cơ). Định vị đúng từ khóa ngách trên App Store nhằm biến lượt tìm kiếm tự nhiên thành người dùng.',
                      tasks: [
                        'Đăng ký tài khoản Google Play Console ($25 đóng một lần vĩnh viễn) để đẩy app lên store.',
                        'Tối ưu hóa công cụ tìm kiếm trên chợ (ASO) - Viết tiêu đề, mô tả chuẩn từ khóa ngách ít cạnh tranh.',
                        'Tạo các trang Landing Page đẹp bốc mặt giới thiệu sản phẩm để người dùng Web dễ dàng tải file hoặc dùng thử tức thì.',
                        'Thiết lập thông báo tự động (Push Notifications) khơi gợi người dùng quay lại ứng dụng mỗi ngày.'
                      ],
                      tools: 'Google Play Console, Vercel Production, CapCut, Buffer',
                      deliverable: 'Đường dẫn tải ứng dụng công khai sòng phẳng + Landing Page hoàn chỉnh đón khách.',
                      financialAdvice: 'Chi phí $25 làm vốn Google. Tuyệt đối không chi tiền chạy quảng cáo Facebook/Google Ads. Thay vào đó hãy tập trung sản xuất 3 video ngắn lên TikTok/Reels tự nhiên.'
                    },
                    {
                      id: 4,
                      title: 'Pha 5: Khai Thác Thương Mại, Pivot Linh Hoạt & Nhân Bản Codebase',
                      time: 'Tháng 9 - 18 (Gặt dòng tiền & Reskin thần tốc)',
                      role: 'Full-stack Product Team & Business Developer',
                      goals: 'Kiếm dòng tiền đều đặn tích tiểu thành đại. Sẵn sàng đổi hướng nếu phát hiện ngách mới bạo phát hơn nhờ bộ codebase gốc đã được mô-đun hóa sòng phẳng.',
                      tasks: [
                        'Kích hoạt cơ chế thanh toán mở gói VIP tự động bằng VietQR/PayOS động theo nguyên tắc "Rẻ nhưng nhiều".',
                        'Theo dõi chỉ số MRR (Doanh thu đều đặn hàng tháng) và tỷ lệ rời đi (Churn Rate) của ví khách để tối ưu trải nghiệm.',
                        'Thực hiện chiến thuật "Hồn Trương Ba Da Hàng Thịt" - đổi logo, thay da, bóc tách cấu trúc để reskin thành 5 app ngách khác nhau trong 2 tuần.',
                        'Phát triển hoàn thiện hệ thống phản hồi chăm sóc khách hàng tự động để giảm tải sức ép solo founder.'
                      ],
                      tools: 'PayOS Analytics, Google Sheets CRM, ElevenLabs AI Voice Support',
                      deliverable: 'Bộ 5 sản phẩm ngách phái sinh gặt hái dòng tiền song song trên chợ di động & web app.',
                      financialAdvice: 'Dùng chính dòng tiền thu hoạch của 100 khách hàng đầu tiên để bù vào chi phí duy trì VPS (khoảng $5/tháng). Dự án đạt mốc Hòa Vốn Kỹ Thuật.'
                    }
                  ];

                  const currentPhase = PHASE_DETAILS[activeProposalPhase];

                  return (
                    <div className="bg-[#03060c] p-5 rounded-2xl border border-slate-900/80 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-3 gap-2">
                        <div>
                          <span className="text-[9px] font-mono font-black text-emerald-400 block uppercase tracking-wider">PHASE 0{currentPhase.id + 1} DETAILED REPORT</span>
                          <h5 className="text-xs font-black text-white mt-0.5">{currentPhase.title}</h5>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-404 border border-emerald-500/20 px-2.5 py-1 rounded-md font-mono font-bold shrink-0">
                          ⏱️ {currentPhase.time}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-5 text-xs text-slate-400 leading-relaxed font-semibold">
                        <div className="space-y-3 font-sans">
                          <div>
                            <span className="text-[10px] font-mono font-black text-slate-500 uppercase block">👥 Nhân sự và vai trò chính:</span>
                            <p className="text-slate-300 font-bold mt-0.5">{currentPhase.role}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-black text-slate-500 uppercase block">🎯 Mục tiêu cốt lõi pha:</span>
                            <p className="mt-0.5 leading-relaxed">{currentPhase.goals}</p>
                          </div>
                          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase block">📦 Sản phẩm bàn giao (Deliverable):</span>
                            <p className="text-emerald-300 font-bold mt-0.5">{currentPhase.deliverable}</p>
                          </div>
                        </div>

                        <div className="space-y-3 font-sans">
                          <div>
                            <span className="text-[10px] font-mono font-black text-slate-500 uppercase block">🛠️ Nhiệm vụ thực thi quan trọng:</span>
                            <div className="space-y-1.5 pt-1">
                              {currentPhase.tasks.map((task, i) => (
                                <div key={i} className="flex items-start gap-2 text-[10.5px]">
                                  <span className="text-emerald-405 font-bold font-mono">{i + 1}.</span>
                                  <span>{task}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-slate-900/60">
                            <span className="text-[10px] font-mono font-black text-purple-400 uppercase block">💡 Tư vấn tối ưu tài chính 0đ (Guerilla Way):</span>
                            <p className="text-[11px] text-purple-300 mt-0.5">{currentPhase.financialAdvice}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* SECTION: KPI SIMULATOR & MONITORING DASHBOARD */}
              <div className="grid lg:grid-cols-12 gap-6">

                {/* Left side: Dynamic KPI health tracker dials */}
                <div className="lg:col-span-8 bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-6">
                  <div>
                    <span className="text-[10px] font-mono font-black text-indigo-400 block uppercase tracking-widest">KPI DASHBOARD INTERACTIVE SIMULATOR</span>
                    <h4 className="text-sm font-black text-white uppercase mt-1">
                      📊 Trình Theo Dõi Chỉ Số Sức Khỏe Dự Án (FastWork Standard)
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">
                      Công thức chuẩn đan xen rủi ro định lượng nhằm giảm thiểu thất bại từ sớm. Di chuyển các thanh trượt bên phải để giả lập các biến số thực chiến và xem kết quả phân tích:
                    </p>
                  </div>

                  {/* Simulator visual gauges */}
                  {(() => {
                    // Success score logic
                    const rawSuccess = (simulatedScopeVelocity * 0.4) + (100 - (simulatedBudgetBurnRate - 100) * 0.3) - (simulatedBugRate * 4.5);
                    const successFactorScore = Math.max(5, Math.min(100, Math.round(rawSuccess)));
                    
                    let ratingText = '';
                    let ratingColor = '';
                    let ratingDesc = '';
                    let ratingRef = '';

                    if (successFactorScore >= 80) {
                      ratingText = 'RẤT ĐÁNG HỨA HẸN (OPTIMAL)';
                      ratingColor = 'text-emerald-404 shadow-emerald-500/20';
                      ratingDesc = 'Hệ số rủi ro cực thấp. Quy trình phát triển Agile kết hợp kiểm soát của Scrum đang phát huy tác dụng tuyệt đối. Bạn sở hữu từ khóa ngách sâu, code gọn gàng không rác, dòng tiền thu hồi nhanh chống chết yểu!';
                      ratingRef = 'Theo khảo sát của Viện FMIT (2024), 85% startup tinh gọn áp dụng quy trình kiểm soát MVP đúng chuẩn sẽ cán mốc hòa vốn trong dưới 12 tháng.';
                    } else if (successFactorScore >= 55) {
                      ratingText = 'ỔN ĐỊNH TRONG TẦM TAY (STABLE)';
                      ratingColor = 'text-amber-400 shadow-amber-500/20';
                      ratingDesc = 'Dự án ở mức an toàn trung bình. Tiến độ có chịu chút áp lực hoặc bug hệ thống còn lác đác. Hãy chú ý dọn dẹp lỗi hồi quy và thắt chặt phạm vi tránh tình trạng ôm đồm tính năng ngoài PRD.';
                      ratingRef = 'Khuyến nghị Base.vn (2023): Hãy áp dụng lập tức cuộc họp Sprint Retrospective cuối tuần để dọn sạch nút thắt cổ chai kỹ thuật.';
                    } else {
                      ratingText = 'NGUY CƠ TAN VỠ CAO (CRITICAL)';
                      ratingColor = 'text-rose-450 shadow-rose-500/10 animated-pulse';
                      ratingDesc = 'Hệ số an toàn đang ở mức đỏ chuông báo động! Code bị rỉ lỗi hoặc ngân sách burnrate quá khốc liệt do thuê máy chủ quá đắt đỏ. Bạn cần dứt khoát bóc tách, đưa toàn bộ cơ sở dữ liệu về SQLite client mộc mạc và đóng băng scope!';
                      ratingRef = 'Quản trị rủi ro (Tạp chí Công Thương): Hãy kích hoạt lập tức kế hoạch ứng phó khẩn cấp, cắt giảm tính năng phụ để kéo dài tuổi thọ của ví.';
                    }

                    return (
                      <div className="space-y-4">
                        {/* Target Meter dial indicator */}
                        <div className="bg-[#03060c] p-5 rounded-2xl border border-slate-900/70 flex flex-col sm:flex-row items-center gap-6 justify-between">
                          <div className="space-y-1.5 text-center sm:text-left">
                            <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">DỰ BÁO XÁC SUẤT CẬP BỜ THÀNH CÔNG</span>
                            <div className="text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2.5 font-sans">
                              <span>Factor Score:</span>
                              <span className={`font-mono text-2xl ${ratingColor}`}>{successFactorScore}%</span>
                            </div>
                            <span className={`text-xs font-black block tracking-tight ${ratingColor}`}>{ratingText}</span>
                            <p className="text-[10.5px] text-slate-400 font-semibold max-w-xl leading-relaxed mt-1">
                              {ratingDesc}
                            </p>
                            <p className="text-[9.5px] text-purple-400 font-bold border-t border-slate-900/60 pt-2 italic">
                              📚 {ratingRef}
                            </p>
                          </div>

                          {/* Ring Gauge indicator */}
                          <div className="shrink-0 relative w-28 h-28 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="#0c1322" strokeWidth="9" fill="transparent" />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                stroke={successFactorScore >= 80 ? '#34d399' : successFactorScore >= 55 ? '#fbbf24' : '#f87171'} 
                                strokeWidth="9" 
                                fill="transparent" 
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * successFactorScore) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-500 ease-out"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-lg font-black text-white font-mono">{successFactorScore}%</span>
                              <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest">HEALTH</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive list of indicators */}
                        <div className="grid sm:grid-cols-3 gap-3.5 pt-2">
                          
                          {/* Indicator 1: Scope & Velocity */}
                          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-900/80 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono font-black text-slate-500">
                              <span>TIẾN ĐỘ SPRINT</span>
                              <span className="text-blue-400 font-mono font-bold">{simulatedScopeVelocity}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                              <div className="bg-blue-400 h-full transition-all duration-300" style={{ width: `${simulatedScopeVelocity}%` }}></div>
                            </div>
                            <span className="text-[9.5px] text-slate-400 font-bold block leading-relaxed">
                              {simulatedScopeVelocity >= 85 ? '🟢 Về đích vượt dự kiến.' : '🟡 Chậm trễ dây dưa 1-2 tuần.'}
                            </span>
                          </div>

                          {/* Indicator 2: Budget Burn Rate */}
                          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-900/80 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono font-black text-slate-550">
                              <span>BURN-RATE VỐN</span>
                              <span className="text-amber-400 font-mono font-bold">{simulatedBudgetBurnRate}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                              <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${Math.min(100, (simulatedBudgetBurnRate / 150) * 100)}%` }}></div>
                            </div>
                            <span className="text-[9.5px] text-slate-400 font-bold block leading-relaxed">
                              {simulatedBudgetBurnRate <= 100 ? '🟢 Trong hạn mức dự chi.' : '🔴 Vượt quá ngân quỹ ròng!'}
                            </span>
                          </div>

                          {/* Indicator 3: Quality Bug Index */}
                          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-900/80 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono font-black text-slate-550">
                              <span>TỶ LỆ LỖI (BUG INDEX)</span>
                              <span className="text-purple-400 font-mono font-bold">{simulatedBugRate}/10</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                              <div className="bg-purple-400 h-full transition-all duration-300" style={{ width: `${simulatedBugRate * 10}%` }}></div>
                            </div>
                            <span className="text-[9.5px] text-slate-400 font-bold block leading-relaxed">
                              {simulatedBugRate <= 3 ? '🟢 Mã nguồn sạch hoàn hảo.' : '🟡 Cần bổ sung test case diệt bọ.'}
                            </span>
                          </div>

                        </div>
                      </div>
                    );
                  })()}

                </div>

                {/* Right side: Sliders to change parameters */}
                <div className="lg:col-span-4 bg-slate-950 p-6 rounded-3xl border border-slate-900 flex flex-col justify-between space-y-5">
                  <div className="space-y-4 font-sans">
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-900 pb-2">
                      🛠️ THAM SỐ GIẢ LẬP
                    </span>

                    {/* Slider 1: Scope Velocity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">Năng suất Sprint (Velocity):</span>
                        <span className="text-blue-400 font-mono font-bold">{simulatedScopeVelocity}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="100" 
                        value={simulatedScopeVelocity}
                        onChange={(e) => setSimulatedScopeVelocity(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-550 font-semibold block leading-tight">Mô tả độ nhanh hoàn thành nhiệm vụ và đóng băng scope của bạn.</span>
                    </div>

                    {/* Slider 2: Budget Burn rate */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">Tỷ lệ tiêu hao vốn (Burn Rate):</span>
                        <span className="text-amber-400 font-mono font-bold">{simulatedBudgetBurnRate}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="150" 
                        value={simulatedBudgetBurnRate}
                        onChange={(e) => setSimulatedBudgetBurnRate(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-550 font-semibold block leading-tight">Burnrate trên 100% nghĩa là bạn đang chi quá nhiều cho VPS/marketing.</span>
                    </div>

                    {/* Slider 3: Bug Rate */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">Hệ số lỗi thừa (Bug Density):</span>
                        <span className="text-purple-400 font-mono font-bold">{simulatedBugRate}/10</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={simulatedBugRate}
                        onChange={(e) => setSimulatedBugRate(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-550 font-semibold block leading-tight">Tỷ lệ lỗi phát sinh sau khi deploy. Càng thấp chứng tỏ test càng kỹ dán mác.</span>
                    </div>

                  </div>

                  <div className="bg-[#04080e] p-3 rounded-xl border border-slate-900 text-[10px] text-slate-500 leading-relaxed font-semibold">
                    <span className="text-white block font-black mb-1">Mẹo tối ưu sức khỏe dự án:</span>
                    Giữ <strong className="text-emerald-450 font-bold">Tiến độ &gt; 90%</strong>, <strong className="text-emerald-450 font-bold">Chi phí &lt; 90%</strong> và <strong className="text-emerald-450 font-bold">Bọ &lt; 2</strong> để đạt hệ chất lượng tối ưu tuyệt đối!
                  </div>
                </div>

              </div>

              {/* SECTION: 6 CORE RISK MITIGATION MATRICES */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-black text-rose-400 block uppercase tracking-widest">PROJECT SHIELD — RISK MITIGATION CHECKLIST</span>
                  <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2 mt-1">
                    <h4 className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                      <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                      Phòng Diệt 6 Nguy Cơ Đổ Vỡ Dự Án (Quy Trình Chuẩn Quốc Tế)
                    </h4>
                    {/* Ready safety indicator calculation */}
                    {(() => {
                      const totalRisks = 6;
                      const preparesCount = readyMitigations.length;
                      const safetyIndex = Math.round((preparesCount / totalRisks) * 100);
                      return (
                        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-xl font-sans font-black text-xs">
                          🛡️ Lực Cản Rủi Ro (Safety Index): {safetyIndex}%
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-normal">
                    Quá trình quản trị rủi ro trải qua 5 bước: Lập chiến lược, Nhận diện rủi ro, Phân tích hậu quả, Đắp sẵn biện pháp ứng phó và Giám sát liên lục (Tạp chí Công Thương). Tích chọn các lá chắn bạn đã hoàn thành chuẩn bị bên dưới:
                  </p>
                </div>

                {/* Risk Matrices Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
                  {[
                    {
                      id: 'mit_scope_1',
                      title: '🚩 1. Nguy cơ phình to phạm vi (Scope Creep)',
                      desc: 'Mở rộng tính năng theo thói quen ngẫu hứng, gây hụt hơi về thời gian.',
                      remedy: 'Đóng băng PRD MVP dứt khoát. Chỉ chấp nhận tính năng mới khi phiên bản 1.0 hoàn thành thu hoạch.',
                      color: 'border-blue-500/20 bg-blue-955/5 text-blue-400'
                    },
                    {
                      id: 'mit_scope_2',
                      title: '⏰ 2. Trễ tiến độ kéo dài dây dưa',
                      desc: 'Thời lượng coding bị đội lên do gặp lỗi công nghệ, thiếu nhân sự.',
                      remedy: 'Sản xuất theo chu kỳ ngắn Sprint 2 tuần (Agile/Scrum). Có cuộc họp review định kỳ sửa đổi sai lệch tức thời.',
                      color: 'border-amber-500/20 bg-amber-955/5 text-amber-400'
                    },
                    {
                      id: 'mit_schedule_1',
                      title: '🪲 3. Suy hao chất lượng mã nguồn',
                      desc: 'Sản phẩm phát hành đầy rẫy bọ treo cứng gây mất uy tín ban đầu.',
                      remedy: 'Thiết lập danh mục Test Cases phủ kịch khung luồng nghiệp vụ. Thực hành code review kỹ lưỡng trước khi build.',
                      color: 'border-purple-500/20 bg-purple-955/5 text-purple-400'
                    },
                    {
                      id: 'mit_quality_1',
                      title: '🔥 4. Bẫy phụ thuộc công nghệ mới',
                      desc: 'Chọn framework quá khó, cộng đồng hỗ trợ quá bé, khó sửa lỗi.',
                      remedy: 'Ưu thế hóa ngôn ngữ mộc bám sâu vững chắc. Sử dụng cấu trúc modul hóa hoàn thiện để dễ hoán đổi.',
                      color: 'border-rose-500/20 bg-rose-955/5 text-rose-400'
                    },
                    {
                      id: 'mit_tech_1',
                      title: '🍂 5. Sai lệch thị trường (No Market Fit)',
                      desc: 'Xây dựng sản phẩm không ai muốn dùng, không ai thèm trả tiền.',
                      remedy: 'Ra mắt trước phiên bản Pilot cực gọn (Build-Measure-Learn). Thường xuyên thu lượm feedback thực tế xoay trục lẹ làng.',
                      color: 'border-teal-500/20 bg-teal-955/5 text-teal-400'
                    },
                    {
                      id: 'mit_market_1',
                      title: '🦴 6. Cạn kiệt dòng tiền duy trì',
                      desc: 'Máy chủ Cloud/VPS tính phí tích lũy vặt thọc thủng túi solo founder.',
                      remedy: 'Ưu tiên cơ chế lưu trữ cục bộ (Offline-first, SQLite). VPS chỉ đóng vai trò Webhook, chi phí duy trì tiến sát 0đ.',
                      color: 'border-sky-500/20 bg-sky-955/5 text-sky-450'
                    }
                  ].map((risk) => {
                    const isChecked = readyMitigations.includes(risk.id);
                    return (
                      <div 
                        key={risk.id}
                        onClick={() => {
                          setReadyMitigations(prev => 
                            prev.includes(risk.id) 
                              ? prev.filter(id => id !== risk.id) 
                              : [...prev, risk.id]
                          );
                        }}
                        className={`p-4.5 rounded-2xl border text-left cursor-pointer transition-all select-none relative overflow-hidden ${
                          isChecked 
                            ? 'bg-emerald-500/5 border-emerald-500/30' 
                            : 'bg-slate-900/30 border-slate-900 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <span className={`${isChecked ? 'text-emerald-404 font-bold' : 'text-slate-300'} font-bold text-xs`}>
                            {risk.title}
                          </span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-705 bg-slate-950'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-normal">
                          {risk.desc}
                        </p>
                        <div className="pt-2.5 mt-2.5 border-t border-slate-900/60 text-[10px] text-slate-450 leading-relaxed font-semibold">
                          <strong className="text-emerald-403 block mb-0.5 font-bold">🛡️ Biện pháp ứng phó:</strong>
                          {risk.remedy}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: BUILD-MEASURE-LEARN COMPASS GRAPH */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-black text-purple-400 block uppercase tracking-widest">BUSINESS EXPERIMENT COMPASS</span>
                  <h4 className="text-sm font-black text-white uppercase mt-1">
                    🏗️ Vòng Lặp Học Hỏi Tinh Gọn & Độc Chiêu Xoay Trục (Lean Startup - FMIT)
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed">
                    Đừng chỉ lập trình cắm đầu. Hãy lắng nghe từng chuyển động phản hồi thực địa từ nhóm khách đơn sơ nhất của bạn thông qua dòng tuần hoàn học hỏi tinh gọn:
                  </p>
                </div>

                <div className="grid sm:grid-cols-5 gap-3.5 pt-2">
                  {[
                    { step: "Sản Xuất (Build)", subtitle: "Chưng cất MVP", highlight: "Phát biểu chính xác PRD rút gọn trong 5 ngày.", desc: "Mã hóa luồng nghiệp vụ cốt lõi nhất không màu mè.", color: "border-blue-500/20 text-blue-400 bg-blue-955/5" },
                    { step: "Đo lường (Measure)", subtitle: "Đo lường Traction", highlight: "Thống kê lượt cài đặt, đo tỉ lệ mở app hàng tuần.", desc: "Kiểm nghiệm kịch khung xem khách hàng thực tế có bực tức gỡ app.", color: "border-purple-500/20 text-purple-400 bg-purple-955/5" },
                    { step: "Khảo sát (Learn)", subtitle: "Lắng nghe phản hồi", highlight: "Trực chiến email, chăm sóc khách trả lời sau 5 phút.", desc: "Chắt lọc mỏ vàng bài học từ 100 người dùng đầu tiên.", color: "border-teal-500/20 text-teal-400 bg-teal-955/5" },
                    { step: "Xoay Trục (Pivot)", subtitle: "Điều hướng sắc lẹm", highlight: "Rũ bỏ tự ái, sẵn sàng thay thế cấu trúc dữ liệu.", desc: "Sẵn sàng quay gót đổi ý tưởng nếu data thực tế nói KHÔNG.", color: "border-pink-500/20 text-pink-400 bg-pink-955/5" },
                    { step: "Nhân Bản (Scale)", subtitle: "Reskin chớp nhoáng", highlight: "Dán nhãn đổi logo thành 5 phiên bản đa ngách nhỏ.", desc: "Nhân cơ hội codebase chuẩn, gặt hái dòng tiền diện rộng hời hợt.", color: "border-amber-500/20 text-amber-400 bg-amber-955/5" }
                  ].map((nodeObj, nidx) => (
                    <div key={nidx} className={`p-4.5 rounded-2xl border ${nodeObj.color} flex flex-col justify-between hover:border-slate-700 transition-all cursor-default`}>
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono font-black uppercase opacity-60">VÒNG LẶP STEP 0{nidx + 1}</span>
                        <h4 className="text-[11.5px] font-black text-white">{nodeObj.step}</h4>
                        <span className="text-[9.5px] text-emerald-404 font-bold block">{nodeObj.subtitle}</span>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed pt-1.5">{nodeObj.desc}</p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-900/60 text-[9.5px] text-slate-400 italic">
                        <strong className="text-white block font-bold not-italic">🎯 Chìa khóa:</strong>
                        {nodeObj.highlight}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: COMPARISON BOARD & HANDOFF */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Side-by-Side Comparison Matrix */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                    <h4 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      So Sánh Chiến Pháp Cũ (Chỉ Du Kích) & Đề Xuất Cải Tiến Mới (Chuẩn Hoá)
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px] text-slate-400 font-sans font-semibold">
                      <thead>
                        <tr className="border-b border-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                          <th className="pb-2">Thừa số đối sánh</th>
                          <th className="pb-2 text-rose-400">Bản cũ (Chỉ du kích thô)</th>
                          <th className="pb-2 text-emerald-404">Bản mới (Mới đề xuất)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/50">
                        <tr>
                          <td className="py-3 font-bold text-slate-300">Lộ trình tổng thể</td>
                          <td className="py-3 leading-normal text-slate-501">Chỉ có 12 bước rải rác học tập, chưa phân kỳ bàn giao.</td>
                          <td className="py-3 leading-normal text-emerald-400/90 font-bold">5 Pha rành mãnh từ Khảo sát, Code Sprint, Test lỗi, Beta đến Nhân bản gặt hái dòng tiền.</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-300">Định vị thị trường</td>
                          <td className="py-3 leading-normal text-slate-501">Bắt chước các ngách mông lung chưa có kịch bản kĩ lưỡng.</td>
                          <td className="py-3 leading-normal text-emerald-400/90 font-bold font-bold">Chọn rõ Moat (Kế toán/Kiểm toán/BA/ML) và tệp khách trong nước thiết thực nhất.</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-300">Học tập kỹ thuật</td>
                          <td className="py-3 leading-normal text-slate-501">Thay đổi ngôn ngữ framework liên tục theo trào lưu bên ngoài.</td>
                          <td className="py-3 leading-normal text-emerald-400/90 font-bold">Lĩnh hội sâu sắc 1 ngôn ngữ thô, quản lý Git tốt và phòng lỗi crash bộ nhớ.</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-300">Quản trị Rủi ro</td>
                          <td className="py-3 leading-normal text-slate-501">Không lên phương án dự phòng, dễ sập tiệm khi hụt tiền.</td>
                          <td className="py-3 leading-normal text-emerald-400/90 font-bold">Xác định 5 bước quản rủi ro (Scope, Schedule, Quality, Tech, Market, Budget).</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-300">Giám sát hiệu suất</td>
                          <td className="py-3 leading-normal text-slate-501">Mơ hồ cảm tính, không dựa vào thước đo khoa học nào.</td>
                          <td className="py-3 leading-normal text-emerald-400/90 font-bold">Theo sát 5 KPI chuẩn mực (Velocity, Burnrate, Bug Rate, Satisfaction, ROI).</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-300">Du trì & Bàn giao</td>
                          <td className="py-3 leading-normal text-slate-501">Mặc kệ code sau khi hoàn thành, dễ bốc hơi uy tín khách hàng.</td>
                          <td className="py-3 leading-normal text-emerald-400/90 font-bold">Bản tài liệu mộc gọn, kế hoạch bảo dưỡng vá lỗi 6-12 tháng bảo hộ khách hàng lẻ.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Handoff and Maintenance Strategy Summary */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-900 flex flex-col justify-between space-y-4 font-sans">
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black text-white uppercase border-b border-slate-900 pb-2.5 flex items-center gap-2">
                      <Server className="w-4 h-4 text-purple-400" />
                      Chiến Lược Bàn Giao Kỹ Thuật & Duy Trì Hệ Thống 6–12 Tháng
                    </h4>

                    <div className="space-y-3 text-xs leading-relaxed font-semibold">
                      <div className="bg-[#03060c] p-3 rounded-xl border border-slate-900">
                        <span className="text-[11px] text-white font-bold block">📦 1. Quy trình bàn giao mã nguồn & Thiết kế:</span>
                        <p className="text-[10px] text-slate-450 mt-1">
                          - Toàn bộ source code được gom gọn, chú thích hoàn chỉnh từng hàm chính.
                          <br />- Đính kèm file hướng dẫn cụ thể cách gõ lệnh deploy cục bộ và cấu hình tên miền trong 3 phút.
                        </p>
                      </div>

                      <div className="bg-[#03060c] p-3 rounded-xl border border-slate-900">
                        <span className="text-[11px] text-white font-bold block">🔌 2. Kế hoạch bảo trì vá lỗi định kỳ:</span>
                        <p className="text-[10px] text-slate-450 mt-1">
                          - Cam kết 1-2 tuần rà soát lại các dòng thông tin ghi lỗi Firebase Crashlytics để vá bọ.
                          <br />- Cập nhật phiên bản thư viện cốt lõi định kỳ để tránh lỗ hổng bảo mật rình rập hại túi tiền người dùng.
                        </p>
                      </div>

                      <div className="bg-[#03060c] p-3 rounded-xl border border-slate-900">
                        <span className="text-[11px] text-white font-bold block">🎧 3. Thiết lập phễu hỗ trợ chăm sóc khách:</span>
                        <p className="text-[10px] text-slate-450 mt-1">
                          - Tổ chức kênh Mailbox chăm sóc riêng biệt. 100% khiếu nại mua hàng/nhận VIP được hệ thống tự động phản hồi trong dưới 15 phút.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-950/20 text-purple-300 font-mono text-[9px] p-2.5 rounded-xl border border-purple-900/30 font-semibold leading-relaxed">
                    🎓 Tham khảo nguyên văn quy trình chuẩn thiết kế, bảo trì của Base.vn, FastWork, MISA AMIS và Viện FMIT để thiết lập cơ sở lý thuyết chặt chẽ tuyệt đối!
                  </div>
                </div>

              </div>
              
            </div>
          )}

          {/* FINAL ADVICE CHEATSHEET */}

          <div className="bg-gradient-to-r from-purple-950/15 via-[#060a12] to-emerald-950/15 border border-slate-800 p-5 rounded-3xl space-y-3.5 shadow-xl">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Award className="w-4 h-4 text-emerald-400 animate-pulse" />
              LỜI KHUYÊN DU KÍCH CHO SOLO FOUNDER KHỞI NGHIỆP 0 VNĐ - PC & MOBILE
            </h4>
            <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed font-semibold font-sans">
              <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <span className="text-white font-bold block text-sm">1. Nhỏ Giao diện tối giản</span>
                <p className="text-[10.5px]">Đừng viết tính năng "Có cũng tốt" (Nice-to-have). Chỉ viết tính năng "Không có không thể dùng" (Must-have). Sự cô đọng tối đa cho phép bạn tung bản beta siêu tốc thử nghiệm.</p>
              </div>
              <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <span className="text-white font-bold block text-sm">2. Đè Bẹp Chi Phí VPS</span>
                <p className="text-[10.5px]">Máy chủ, VPS đắt đỏ là kẻ thù số một của Indie. Khi chưa có tiền mặt ròng, hãy ưu tiên lưu SQLite, LocalStorage cục bộ trên thiết bị của khách hàng (Edge Computing). Serverless chỉ dùng làm cầu nối Webhook nạp tiền.</p>
              </div>
              <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <span className="text-white font-bold block text-sm">3. Lắng Nghe Khách Sát Sao</span>
                <p className="text-[10.5px]">Một người dùng mua phần mềm của bạn trả 15.000đ hay 35.000đ đều mang lại mỏ vàng bài học phản hồi. Trả lời mail/tin nhắn hỗ trợ của khách trong 5 phút để tạo tệp fan trung thành đầu tiên lan toả giới thiệu truyền miệng.</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
