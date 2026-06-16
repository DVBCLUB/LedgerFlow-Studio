// ============================================================
// EMAIL SEQUENCE KNOWLEDGE — LedgerFlow Studio
// ============================================================

export type SequenceType =
  | 'welcome'
  | 'trial_nurture'
  | 'activation'
  | 'upgrade'
  | 'churn_prevention'
  | 'winback';

export type EmailTone = 'formal' | 'conversational' | 'founder-personal';

export interface EmailTemplate {
  day: number;
  subject: string;
  preheader: string;
  goal: string;
  bodyStructure: string[];
  cta: string;
  avoidIf: string;
}

export interface EmailSequence {
  id: SequenceType;
  name: string;
  trigger: string;
  totalEmails: number;
  duration: string;
  emails: EmailTemplate[];
}

export const EMAIL_SEQUENCES: EmailSequence[] = [
  {
    id: 'welcome',
    name: 'Welcome Sequence — Chào mừng người đăng ký mới',
    trigger: 'User đăng ký tài khoản, điền form demo hoặc xin checklist',
    totalEmails: 5,
    duration: '7 ngày',
    emails: [
      {
        day: 0,
        subject: 'Chào [Tên] — workspace LedgerFlow đã sẵn sàng',
        preheader: 'Bắt đầu bằng daily brief và dữ liệu mẫu trong 3 bước',
        goal: 'Xác nhận đăng ký, đặt kỳ vọng, đưa user vào lần đăng nhập đầu.',
        bodyStructure: [
          'Chào mừng ngắn gọn, nói rõ LedgerFlow là Company OS / Simulation Lab.',
          '3 bước bắt đầu: mở daily brief, chọn workspace, xem dữ liệu mẫu.',
          'Nhắc offline-first: có thể thử bằng static data/localStorage trước.',
          'CTA vào workspace đầu tiên.',
        ],
        cta: 'Mở LedgerFlow workspace',
        avoidIf: 'User đã tạo workspace hoặc mở daily brief trong 10 phút đầu.',
      },
      {
        day: 1,
        subject: '[Tên], đây là daily brief 3 phút nên xem trước',
        preheader: '5 số cần biết mỗi sáng trước khi quyết định',
        goal: 'Education + feature discovery.',
        bodyStructure: [
          'Mô tả daily brief: lane, status, metric, next action.',
          'Liên kết pain của founder/operator: dữ liệu rải rác, quyết định chậm.',
          'Gợi ý user copy mẫu brief để dùng trong team.',
        ],
        cta: 'Xem daily brief mẫu',
        avoidIf: 'User đã xem Command Center V2 daily brief.',
      },
      {
        day: 3,
        subject: 'Nếu chỉ dùng 1 module tuần này, hãy dùng cái này',
        preheader: 'Chọn một workflow nhỏ: marketing, kế toán, sales hoặc AI staff',
        goal: 'Drive activation bằng một use case cụ thể.',
        bodyStructure: [
          'Đưa 4 lựa chọn workflow theo vai trò.',
          'Khuyên chỉ chọn 1 workflow để tránh quá tải.',
          'Nhắc AI chỉ là co-pilot; người dùng duyệt trước khi publish/gửi.',
        ],
        cta: 'Chọn workflow đầu tiên',
        avoidIf: 'User đã hoàn thành 2+ workflow.',
      },
      {
        day: 5,
        subject: 'Checklist: LedgerFlow không phải ERP thay thế tất cả',
        preheader: 'Dùng như lớp điều hành nhẹ, kết nối dữ liệu và quyết định',
        goal: 'Handle objection và định vị đúng sản phẩm.',
        bodyStructure: [
          'Nói rõ LedgerFlow là operating hub/simulation lab.',
          'Giải thích cách dùng cùng Excel, accounting software, CRM.',
          'Đưa 3 trường hợp không nên dùng để tăng niềm tin.',
        ],
        cta: 'Đọc checklist định vị',
        avoidIf: 'Lead đã có paid signal rõ và đang đợi proposal.',
      },
      {
        day: 7,
        subject: 'Bạn muốn pilot workflow nào trước?',
        preheader: 'Marketing, sales, finance, accounting hay AI staff',
        goal: 'Segment user và mời demo/pilot.',
        bodyStructure: [
          'Hỏi một câu segmentation đơn giản.',
          'Đề xuất demo 15 phút với dữ liệu mẫu.',
          'Nếu chưa sẵn sàng, mời tải checklist/offline template.',
        ],
        cta: 'Chọn pilot workflow',
        avoidIf: 'User đã đặt lịch demo.',
      },
    ],
  },
  {
    id: 'activation',
    name: 'Activation Sequence — Đưa user đến aha moment',
    trigger: 'User đã đăng nhập nhưng chưa tạo workflow hoặc chưa quay lại.',
    totalEmails: 3,
    duration: '5 ngày',
    emails: [
      {
        day: 0,
        subject: 'Aha moment đầu tiên: thấy next action trong 30 giây',
        preheader: 'Không cần cấu hình nhiều, dùng dữ liệu mẫu trước',
        goal: 'Guide user tới first value.',
        bodyStructure: [
          'Mô tả aha moment: thấy việc cần làm tiếp theo.',
          'Chỉ 3 click: Command Center → lane → next action.',
          'Nói rõ dữ liệu mô phỏng không thay người duyệt.',
        ],
        cta: 'Tạo next action đầu tiên',
        avoidIf: 'User đã có next action mới trong 24h.',
      },
      {
        day: 2,
        subject: 'Thử 1 landing copy hoặc 1 sales message trước',
        preheader: 'Marketing có thể bắt đầu bằng một experiment nhỏ',
        goal: 'Activate marketing/growth lane.',
        bodyStructure: [
          'Đề xuất tạo copy bằng formula PAS hoặc battle card.',
          'Nhắc người dùng review/sửa tay trước khi publish.',
          'Mời lưu artifact để so sánh phiên bản.',
        ],
        cta: 'Tạo experiment marketing',
        avoidIf: 'User đã tạo copy hoặc campaign.',
      },
      {
        day: 5,
        subject: 'Bạn đã có đủ tín hiệu để quyết định chưa?',
        preheader: 'Dùng scorecard nhỏ thay vì cảm tính',
        goal: 'Move user tới review habit.',
        bodyStructure: [
          'Tóm tắt 3 signal: usage, lead response, finance impact.',
          'Gợi ý dùng weekly review.',
          'Nếu thiếu signal, đề xuất hành động nhỏ tiếp theo.',
        ],
        cta: 'Mở weekly review',
        avoidIf: 'User đã chạy weekly review trong tuần.',
      },
    ],
  },
  {
    id: 'trial_nurture',
    name: 'Trial Nurture — Nuôi dưỡng dùng thử',
    trigger: 'User trong giai đoạn pilot/trial.',
    totalEmails: 4,
    duration: '10 ngày',
    emails: [
      {
        day: 1,
        subject: 'Dùng thử tốt nhất khi có một workflow thật',
        preheader: 'Dùng data mẫu trước, rồi mới đưa data nhạy cảm vào sau',
        goal: 'Set trial success criteria.',
        bodyStructure: ['Chọn 1 workflow cần đo kết quả.', 'Đặt metric thành công nhỏ.', 'Nhắc không upload data nhạy cảm khi chưa cần.'],
        cta: 'Đặt trial success metric',
        avoidIf: 'User đã khai báo success metric.',
      },
      {
        day: 4,
        subject: '3 câu hỏi giúp biết trial có đúng hướng không',
        preheader: 'Nếu câu trả lời mơ hồ, đừng scale với team',
        goal: 'Qualification và risk reduction.',
        bodyStructure: ['Pain có giảm không?', 'Ai duyệt kết quả?', 'Bước tiếp theo có rõ không?'],
        cta: 'Trả lời 3 câu hỏi',
        avoidIf: 'User đã gửi feedback trial.',
      },
      {
        day: 7,
        subject: 'Nếu team thấy rối, dùng thêm 1 dashboard nhỏ',
        preheader: 'Mở rộng từ cá nhân sang team một cách thấp rủi ro',
        goal: 'Team expansion.',
        bodyStructure: ['Chọn một lane để team review.', 'Không mời cả công ty ngay.', 'Tạo checklist approval nhỏ.'],
        cta: 'Tạo team review nhỏ',
        avoidIf: 'User đã invite teammate hoặc mở approval workflow.',
      },
      {
        day: 10,
        subject: 'Bạn có muốn chốt pilot 1 lane không?',
        preheader: '1 lane, 1 metric, 1 review meeting',
        goal: 'Convert trial to paid pilot.',
        bodyStructure: ['Tóm tắt usage signal.', 'Đề xuất pilot scope nhỏ.', 'CTA book review.'],
        cta: 'Book pilot review',
        avoidIf: 'User đã nâng cấp hoặc từ chối pilot.',
      },
    ],
  },
  {
    id: 'upgrade',
    name: 'Upgrade Sequence — Chuyển đổi paid pilot',
    trigger: 'User đã đạt activation hoặc có paid signal.',
    totalEmails: 2,
    duration: '4 ngày',
    emails: [
      {
        day: 0,
        subject: 'Bạn đã có đủ tín hiệu để chạy pilot trả phí',
        preheader: 'Một scope nhỏ để giảm rủi ro',
        goal: 'Make upgrade concrete.',
        bodyStructure: ['Tóm tắt artifact/user signal.', 'Đề xuất 1 lane pilot.', 'Nói rõ thành công đo bằng metric nào.'],
        cta: 'Chốt pilot scope',
        avoidIf: 'User chưa tạo artifact hoặc chưa quay lại.',
      },
      {
        day: 3,
        subject: 'Pilot nhỏ hay rollout lớn? Tôi khuyên pilot nhỏ',
        preheader: 'Đừng biến LedgerFlow thành dự án ERP',
        goal: 'Reduce scope anxiety.',
        bodyStructure: ['Nhắc Company OS nhẹ.', 'Đưa 2 gói pilot.', 'CTA review với founder.'],
        cta: 'Xem 2 gói pilot',
        avoidIf: 'User đã chốt paid plan.',
      },
    ],
  },
  {
    id: 'churn_prevention',
    name: 'Churn Prevention — Giữ khách sắp rời bỏ',
    trigger: 'User không login trong 14 ngày hoặc dùng ít hơn 30% tính năng key.',
    totalEmails: 3,
    duration: '7 ngày',
    emails: [
      {
        day: 0,
        subject: '[Tên] — chúng tôi nhớ bạn',
        preheader: 'Và có vài cải tiến mới bạn chưa thấy',
        goal: 'Soft re-engagement.',
        bodyStructure: ['Không trách user.', 'Highlight 1–2 cải tiến.', 'Gợi ý quick win nhỏ.'],
        cta: 'Quay lại xem thử',
        avoidIf: 'User đã login trong 48h.',
      },
      {
        day: 3,
        subject: 'Bạn có muốn tôi setup giúp không?',
        preheader: 'Offer hỗ trợ setup miễn phí 30 phút',
        goal: 'High-touch offer.',
        bodyStructure: ['Offer onboarding 1-1.', 'Nói rõ sẽ setup gì.', 'Alternative: dùng dữ liệu mẫu nếu chưa muốn upload file.'],
        cta: 'Book 30 phút miễn phí',
        avoidIf: 'User đã login hoặc reply email trước.',
      },
      {
        day: 7,
        subject: 'Trước khi bạn rời — 1 câu hỏi',
        preheader: 'Feedback của bạn giúp cải thiện sản phẩm',
        goal: 'Final feedback.',
        bodyStructure: ['Hỏi 1 lý do chính không dùng tiếp.', 'Cho 3 lựa chọn hoặc reply tự do.', 'Không bán hàng quá mạnh.'],
        cta: 'Gửi feedback',
        avoidIf: 'User đã nâng cấp hoặc login trong 7 ngày qua.',
      },
    ],
  },
  {
    id: 'winback',
    name: 'Winback Sequence — Kéo lại user cũ',
    trigger: 'User đã rời hoặc không hoạt động dài ngày.',
    totalEmails: 2,
    duration: '10 ngày',
    emails: [
      {
        day: 0,
        subject: 'LedgerFlow đã thay đổi khá nhiều từ lần trước',
        preheader: 'Giờ có Company OS lanes và marketing workspace',
        goal: 'Show meaningful change.',
        bodyStructure: ['Nhắc nhẹ lần trước user đã thử.', 'Nêu 3 cải tiến liên quan pain.', 'CTA xem lại demo bằng dữ liệu mẫu.'],
        cta: 'Xem bản mới',
        avoidIf: 'User đang active hoặc đã unsubscribe.',
      },
      {
        day: 10,
        subject: 'Tôi nên xóa bạn khỏi danh sách cập nhật chứ?',
        preheader: 'Một câu trả lời là đủ',
        goal: 'Permission cleanup.',
        bodyStructure: ['Tôn trọng inbox.', 'Cho lựa chọn tiếp tục hoặc unsubscribe.', 'Không dùng FOMO giả.'],
        cta: 'Chọn tiếp tục nhận update',
        avoidIf: 'User đã reply hoặc unsubscribe.',
      },
    ],
  },
];

export const EMAIL_METRICS_BENCHMARKS = [
  { metric: 'Open Rate', industry: '22–28%', goodFor: '>30%', note: 'Niche kế toán/B2B VN thường open rate tốt hơn B2C nếu segment đúng.' },
  { metric: 'Click Rate', industry: '2.5–4%', goodFor: '>5%', note: 'Plain text email thường CTR tốt hơn HTML phức tạp.' },
  { metric: 'Reply Rate', industry: '1–3%', goodFor: '>5%', note: 'Founder email từ địa chỉ cá nhân cao hơn no-reply@.' },
  { metric: 'Unsubscribe Rate', industry: '<0.5%', goodFor: '<0.2%', note: 'Nếu >1% phải xem lại segment và tần suất gửi.' },
  { metric: 'Trial → Paid', industry: '2–5%', goodFor: '>8%', note: 'B2B SaaS VN cần trust và pilot scope rõ để conversion tốt.' },
];

export const AI_EMAIL_PROMPT = (params: {
  sequenceType: SequenceType;
  dayNumber: number;
  persona: string;
  mainGoal: string;
  tone: EmailTone;
}) => `Bạn là email marketing copywriter B2B SaaS, viết email bằng tiếng Việt.

Viết email số ${params.dayNumber} trong sequence "${params.sequenceType}".
Persona người nhận: ${params.persona}
Mục tiêu email: ${params.mainGoal}
Tone: ${
  params.tone === 'formal'
    ? 'Chuyên nghiệp, lịch sự'
    : params.tone === 'conversational'
      ? 'Thân thiện, tự nhiên như nói chuyện'
      : 'Viết như founder gửi email cá nhân, không phải newsletter'
}

Output format:
SUBJECT: [Tiêu đề, max 50 ký tự]
PREHEADER: [Dòng xem trước, max 90 ký tự]
BODY: [Nội dung email, max 200 từ, text thuần]
CTA: [1 nút action rõ]
PS: [tùy chọn]

Lưu ý: Không hứa thay thế kế toán chuyên nghiệp. Không dùng từ "số 1", "tốt nhất" nếu không có bằng chứng.`;
