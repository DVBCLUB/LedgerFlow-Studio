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
    trigger: 'User đăng ký tài khoản hoặc điền form nhận thông tin',
    totalEmails: 5,
    duration: '7 ngày',
    emails: [
      {
        day: 0,
        subject: 'Chào [Tên] — tài khoản của bạn đã sẵn sàng',
        preheader: 'Bắt đầu trong 3 bước đơn giản',
        goal: 'Confirm + set expectation + first login',
        bodyStructure: [
          'Chào mừng ngắn gọn — không quá hoa mỹ',
          '3 bước để bắt đầu (tạo công trình, nhập chi phí mẫu, xem dashboard)',
          'Link CTA nổi bật: "Vào ngay →"',
          'PS: cho biết bạn sẽ nhận thêm gì trong 7 ngày tới',
        ],
        cta: 'Bắt đầu ngay →',
        avoidIf: 'User đã login trong vòng 10 phút — bỏ email này',
      },
      {
        day: 1,
        subject: '[Tên], đây là video 3 phút bạn nên xem ngay',
        preheader: 'Dashboard 5 KPI — từ 0 đến báo cáo sếp',
        goal: 'Education + feature discovery + second login',
        bodyStructure: [
          'Thumbnail video hoặc GIF demo dashboard',
          '3 tính năng được dùng nhiều nhất (tạm ứng, hồ sơ thiếu, báo cáo sếp)',
          'Social proof nhỏ: "200+ kế toán viên đã..."',
          'CTA: "Xem dashboard của bạn →"',
        ],
        cta: 'Xem ngay →',
        avoidIf: 'User đã tạo ít nhất 1 công trình',
      },
      {
        day: 3,
        subject: 'Tạm ứng treo — bạn có đang kiểm soát được không?',
        preheader: 'Case thật: 300 triệu tạm ứng "biến mất" 3 tháng',
        goal: 'Pain → solution email, trigger activation',
        bodyStructure: [
          'Mini case study thật (ẩn danh) về tạm ứng treo',
          'Giải thích module tạm ứng hoạt động như thế nào',
          'Screenshot hoặc mô tả dashboard aging tạm ứng',
          'CTA: "Thêm tạm ứng đầu tiên →"',
        ],
        cta: 'Nhập tạm ứng thử →',
        avoidIf: 'User đã nhập tạm ứng trong app',
      },
      {
        day: 5,
        subject: 'Câu hỏi thật: Bạn đang mất bao nhiêu giờ/tháng?',
        preheader: 'Và tool này giúp giảm xuống còn bao nhiêu',
        goal: 'ROI framing + remove objections',
        bodyStructure: [
          'Bài toán ROI: X giờ/tháng × mức lương → chi phí cơ hội',
          'Pricing so sánh: phần mềm 199k vs 9 giờ nhân sự',
          'Trả lời 2 objection phổ biến nhất',
          'CTA: "Nâng cấp tài khoản →" hoặc "Hỏi tôi bất cứ điều gì"',
        ],
        cta: 'Xem gói phù hợp →',
        avoidIf: 'User đã nâng cấp lên gói trả phí',
      },
      {
        day: 7,
        subject: 'Tài khoản thử của bạn — còn 7 ngày',
        preheader: 'Và câu hỏi quan trọng tôi muốn hỏi bạn',
        goal: 'Urgency + feedback loop + last conversion push',
        bodyStructure: [
          'Nhắc nhở thân thiện về hết hạn dùng thử',
          'Hỏi 1 câu: "Điều gì chưa khiến bạn quyết định?" (reply email)',
          'Offer: book demo 15 phút 1-1',
          'CTA kép: "Nâng cấp" hoặc "Đặt lịch demo"',
        ],
        cta: 'Nâng cấp hoặc đặt demo →',
        avoidIf: 'User đã nâng cấp',
      },
    ],
  },
  {
    id: 'activation',
    name: 'Activation Sequence — Kích hoạt người dùng thụ động',
    trigger: 'User đăng ký nhưng chưa tạo dự án sau 48 giờ',
    totalEmails: 3,
    duration: '5 ngày',
    emails: [
      {
        day: 2,
        subject: '[Tên] — bạn chưa tạo công trình đầu tiên',
        preheader: 'Chỉ mất 2 phút, tôi hướng dẫn từng bước',
        goal: 'Re-engagement, remove friction',
        bodyStructure: [
          'Acknowledge: biết bạn bận',
          'Giải thích tạo công trình chỉ cần tên + ngân sách',
          'GIF hoặc ảnh screenshot từng bước',
          'CTA: "Tạo công trình đầu tiên →"',
        ],
        cta: 'Tạo ngay, mất 2 phút →',
        avoidIf: 'User đã login trong 24h gần nhất',
      },
      {
        day: 4,
        subject: 'Template công trình mẫu — bạn chỉ cần điền vào',
        preheader: 'File mẫu đã có dữ liệu demo cho ngành xây dựng',
        goal: 'Reduce friction with pre-filled template',
        bodyStructure: [
          'Gửi link template/demo với dữ liệu đã được điền sẵn',
          'Hướng dẫn: xem trước, rồi xóa và nhập dữ liệu thật',
          'Một câu về lợi ích khi xem demo với dữ liệu thật',
          'CTA: "Xem template →"',
        ],
        cta: 'Xem template mẫu →',
        avoidIf: 'User đã tạo ít nhất 1 dữ liệu trong app',
      },
      {
        day: 6,
        subject: 'Cuối cùng — tôi có thể giúp gì cho bạn?',
        preheader: 'Reply email này, tôi sẽ trả lời trong ngày',
        goal: 'Personal outreach, identify blocker',
        bodyStructure: [
          'Founder email cá nhân (không phải newsletter tone)',
          'Hỏi thẳng: "Bạn gặp khó ở bước nào?"',
          'Không dùng template quá, tone tự nhiên',
          'CTA: "Reply email này" — không link app',
        ],
        cta: 'Reply email này →',
        avoidIf: 'User đã tương tác bất kỳ trong app',
      },
    ],
  },
  {
    id: 'churn_prevention',
    name: 'Churn Prevention — Giữ khách sắp rời bỏ',
    trigger: 'User không login trong 14 ngày / dùng < 30% tính năng key',
    totalEmails: 3,
    duration: '7 ngày',
    emails: [
      {
        day: 0,
        subject: '[Tên] — chúng tôi nhớ bạn',
        preheader: 'Và có vài cải tiến mới bạn chưa thấy',
        goal: 'Soft re-engagement, feature update highlight',
        bodyStructure: [
          'Không accusatory — không nói "bạn lâu rồi không dùng"',
          'Highlight 1–2 tính năng mới hoặc cải tiến gần đây',
          'Gợi ý quick win: "Thêm 5 chi phí, dashboard tự cập nhật"',
          'CTA nhẹ: "Xem thêm →"',
        ],
        cta: 'Quay lại xem thử →',
        avoidIf: 'User đã login trong 48h',
      },
      {
        day: 3,
        subject: 'Bạn có muốn tôi setup giúp không?',
        preheader: 'Offer hỗ trợ setup miễn phí 30 phút',
        goal: 'High-touch offer, identify reason for churn',
        bodyStructure: [
          'Offer 1-1 onboarding call miễn phí',
          'Giải thích mình sẽ làm gì trong 30 phút',
          'Alternative: gửi file Excel cũ, mình nhập vào hệ thống',
          'CTA: "Đặt lịch 30 phút →" hoặc "Gửi file Excel"',
        ],
        cta: 'Book 30 phút miễn phí →',
        avoidIf: 'User đã login hoặc reply email trước',
      },
      {
        day: 7,
        subject: 'Trước khi bạn rời — 1 câu hỏi',
        preheader: 'Feedback của bạn giúp tôi cải thiện sản phẩm rất nhiều',
        goal: 'Final feedback + potential win-back',
        bodyStructure: [
          '1 câu hỏi duy nhất: "Lý do chính bạn không dùng tiếp?"',
          '3 lựa chọn (A/B/C) hoặc reply tự do',
          'Không bán hàng trong email này',
          'Nếu phù hợp: offer downgrade hoặc pause subscription',
        ],
        cta: 'Gửi feedback →',
        avoidIf: 'User đã nâng cấp hoặc login trong 7 ngày qua',
      },
    ],
  },
];

export const EMAIL_METRICS_BENCHMARKS = [
  { metric: 'Open Rate', industry: '22–28%', goodFor: '>30%', note: 'Niche kế toán/B2B VN thường open rate tốt hơn B2C nếu segment đúng' },
  { metric: 'Click Rate', industry: '2.5–4%', goodFor: '>5%', note: 'Plain text email thường CTR tốt hơn HTML phức tạp' },
  { metric: 'Reply Rate (personal email)', industry: '1–3%', goodFor: '>5%', note: 'Founder email từ địa chỉ cá nhân cao hơn no-reply@' },
  { metric: 'Unsubscribe Rate', industry: '<0.5%', goodFor: '<0.2%', note: 'Nếu >1% phải xem lại segment và tần suất gửi' },
  { metric: 'Conversion (trial → paid)', industry: '2–5%', goodFor: '>8%', note: 'B2B SaaS VN thường conversion thấp hơn US do trust barrier' },
];

export const AI_EMAIL_PROMPT = (params: {
  sequenceType: SequenceType;
  dayNumber: number;
  persona: string;
  mainGoal: string;
  tone: 'formal' | 'conversational' | 'founder-personal';
}) => `Bạn là email marketing copywriter B2B SaaS, viết email bằng tiếng Việt.

Viết email số ${params.dayNumber} trong sequence "${params.sequenceType}".
Persona người nhận: ${params.persona}
Mục tiêu email: ${params.mainGoal}
Tone: ${params.tone === 'formal' ? 'Chuyên nghiệp, lịch sự' : params.tone === 'conversational' ? 'Thân thiện, tự nhiên như nói chuyện' : 'Viết như founder gửi email cá nhân, không phải newsletter'}

Output format:
**SUBJECT:** [Tiêu đề, max 50 ký tự]
**PREHEADER:** [Dòng xem trước, max 90 ký tự]
**BODY:**
[Nội dung email, max 200 từ. Không dùng hình ảnh placeholder. Viết như text thuần.]
**CTA:** [1 nút action rõ]
**PS (tùy chọn):** [1 câu thêm nếu cần]

Lưu ý: Không hứa thay thế kế toán chuyên nghiệp. Không dùng từ "số 1", "tốt nhất" không có bằng chứng.`;

export type EmailTone = 'conversational' | 'executive' | 'educational' | 'direct';

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
    name: 'Welcome Sequence - chao mung nguoi dung moi',
    trigger: 'User dang ky tai khoan, dien form demo hoac xin checklist',
    totalEmails: 5,
    duration: '7 ngay',
    emails: [
      {
        day: 0,
        subject: 'Chao [Ten] - workspace LedgerFlow cua ban da san sang',
        preheader: 'Bat dau bang daily brief va du lieu mau trong 3 buoc',
        goal: 'Xac nhan dang ky, dat ky vong, dua user vao lan dang nhap dau',
        bodyStructure: [
          'Chao mung ngan gon, noi ro day la Company OS / Simulation Lab.',
          '3 buoc bat dau: mo daily brief, chon workspace, xem du lieu mau.',
          'Nhac offline-first: co the thu bang static data/localStorage truoc.',
          'CTA vao workspace dau tien.',
        ],
        cta: 'Mo LedgerFlow workspace',
        avoidIf: 'User da tao workspace hoac mo daily brief trong 10 phut dau',
      },
      {
        day: 1,
        subject: '[Ten], day la daily brief 3 phut nen xem truoc',
        preheader: '5 so can biet moi sang truoc khi quyet dinh',
        goal: 'Education + feature discovery',
        bodyStructure: [
          'Mo ta daily brief: lane, status, metric, next action.',
          'Lien ket voi pain cua founder/operator: du lieu rai rac, quyet dinh cham.',
          'Goi y user copy mau brief de dung trong team.',
        ],
        cta: 'Xem daily brief mau',
        avoidIf: 'User da xem Command Center V2 daily brief',
      },
      {
        day: 3,
        subject: 'Neu chi dung 1 module tuan nay, hay dung cai nay',
        preheader: 'Chon mot workflow nho: marketing, ke toan, sales hoac AI staff',
        goal: 'Drive activation bang mot use case cu the',
        bodyStructure: [
          'Dua 4 lua chon workflow theo vai tro.',
          'Khuyen chi chon 1 workflow de tranh qua tai.',
          'Nhac AI chi la co-pilot, nguoi dung duyet truoc khi publish/gui.',
        ],
        cta: 'Chon workflow dau tien',
        avoidIf: 'User da hoan thanh 2+ workflow',
      },
      {
        day: 5,
        subject: 'Checklist: LedgerFlow khong phai ERP thay the tat ca',
        preheader: 'Dung nhu lop dieu hanh nhe, ket noi du lieu va quyet dinh',
        goal: 'Handle objection va dinh vi dung san pham',
        bodyStructure: [
          'Noi ro LedgerFlow la operating hub/simulation lab.',
          'Giai thich cach dung cung tool hien co: Excel, accounting software, CRM.',
          'Dua 3 truong hop khong nen dung de tang niem tin.',
        ],
        cta: 'Doc checklist dinh vi',
        avoidIf: 'Lead da co paid signal ro va dang doi proposal',
      },
      {
        day: 7,
        subject: 'Ban muon pilot workflow nao truoc?',
        preheader: 'Marketing, sales, finance, accounting hay AI staff',
        goal: 'Segment user va moi demo/pilot',
        bodyStructure: [
          'Hoi mot cau hoi segmentation don gian.',
          'De xuat demo 15 phut voi du lieu mau.',
          'Neu chua san sang, moi tai checklist/offline template.',
        ],
        cta: 'Chon pilot workflow',
        avoidIf: 'User da dat lich demo',
      },
    ],
  },
  {
    id: 'activation',
    name: 'Activation Sequence - dua user den aha moment',
    trigger: 'User da dang nhap nhung chua tao workflow hoac chua quay lai',
    totalEmails: 3,
    duration: '5 ngay',
    emails: [
      {
        day: 0,
        subject: 'Aha moment dau tien: thay next action trong 30 giay',
        preheader: 'Khong can cau hinh nhieu, dung du lieu mau truoc',
        goal: 'Guide user toi first value',
        bodyStructure: [
          'Mo ta aha moment: thay viec can lam tiep theo.',
          'Chi 3 click: Command Center -> lane -> next action.',
          'Noi ro du lieu mo phong khong thay nguoi duyet.',
        ],
        cta: 'Tao next action dau tien',
        avoidIf: 'User da co next action moi trong 24h',
      },
      {
        day: 2,
        subject: 'Thu 1 landing copy hoac 1 sales message truoc',
        preheader: 'Marketing co the bat dau bang mot experiment nho',
        goal: 'Activate marketing/growth lane',
        bodyStructure: [
          'De xuat tao copy bang formula PAS hoac battle card.',
          'Nhac nguoi dung review/sua tay truoc khi publish.',
          'Moi luu vao localStorage de so sanh phien ban.',
        ],
        cta: 'Tao experiment marketing',
        avoidIf: 'User da tao copy hoac campaign',
      },
      {
        day: 5,
        subject: 'Ban da co du tin hieu de quyet dinh chua?',
        preheader: 'Dung scorecard nho thay vi cam tinh',
        goal: 'Move user toi review habit',
        bodyStructure: [
          'Tom tat 3 signal: usage, lead response, finance impact.',
          'Goi y dung monthly/weekly review.',
          'Neu thieu signal, de xuat hanh dong nho tiep theo.',
        ],
        cta: 'Mo weekly review',
        avoidIf: 'User da chay weekly review trong tuan',
      },
    ],
  },
  {
    id: 'trial_nurture',
    name: 'Trial Nurture - nuoi duong dung thu',
    trigger: 'User trong giai doan pilot/trial',
    totalEmails: 4,
    duration: '10 ngay',
    emails: [
      {
        day: 1,
        subject: 'Dung thu tot nhat khi co mot workflow that',
        preheader: 'Dung data mau truoc, roi moi dua data nhay cam vao sau',
        goal: 'Set trial success criteria',
        bodyStructure: ['Chon 1 workflow can do ket qua.', 'Dat metric thanh cong nho.', 'Nhac khong upload data nhay cam khi chua can.'],
        cta: 'Dat trial success metric',
        avoidIf: 'User da khai bao success metric',
      },
      {
        day: 4,
        subject: '3 cau hoi giup biet trial co dang dung huong',
        preheader: 'Neu cau tra loi mo ho, dung scale voi team',
        goal: 'Qualification va risk reduction',
        bodyStructure: ['Hoi pain co giam khong.', 'Hoi ai duyet ket qua.', 'Hoi buoc tiep theo co ro khong.'],
        cta: 'Tra loi 3 cau hoi',
        avoidIf: 'User da gui feedback trial',
      },
      {
        day: 7,
        subject: 'Neu team thay roi, dung them 1 dashboard nho',
        preheader: 'Mo rong tu ca nhan sang team mot cach thap rui ro',
        goal: 'Encourage second use case',
        bodyStructure: ['De xuat them 1 lane lien quan.', 'Khong goi y rollout toan cong ty.', 'Nhan manh pilot nho, co rollback.'],
        cta: 'Them workflow thu hai',
        avoidIf: 'User co activity giam manh trong 3 ngay',
      },
      {
        day: 10,
        subject: 'Tong ket trial: giu, sua hay dung?',
        preheader: 'Quyet dinh dua tren bang chung, khong dua tren cam hung',
        goal: 'Move to conversion or learning',
        bodyStructure: ['Tom tat metric can review.', 'Neu pass thi de xuat paid pilot.', 'Neu fail thi ghi lesson va dung dung luc.'],
        cta: 'Mo trial review',
        avoidIf: 'User da chuyen paid pilot',
      },
    ],
  },
  {
    id: 'churn_prevention',
    name: 'Churn Prevention - canh bao truoc khi roi bo',
    trigger: 'User giam activity, khong mo workspace hoac khong co next action moi',
    totalEmails: 3,
    duration: '7 ngay',
    emails: [
      {
        day: 0,
        subject: 'Co phai LedgerFlow dang qua rong?',
        preheader: 'Thu thu hep ve 1 workflow thay vi dung tat ca',
        goal: 'Reduce overwhelm',
        bodyStructure: ['Thua nhan san pham co nhieu module.', 'De xuat 1 workflow nho theo vai tro.', 'CTA quay lai dung du lieu mau.'],
        cta: 'Chon lai 1 workflow',
        avoidIf: 'User vua active trong 24h',
      },
      {
        day: 3,
        subject: 'Muon toi gui ban mau nhe hon khong?',
        preheader: 'Mot daily brief, mot board, mot checklist',
        goal: 'Offer lighter path',
        bodyStructure: ['De xuat ban toi gian.', 'Hoi module nao gay roi.', 'Moi reply thay vi click neu can.'],
        cta: 'Nhan ban workflow nhe',
        avoidIf: 'User da request support',
      },
      {
        day: 7,
        subject: 'Neu chua phu hop, hay ghi lai ly do',
        preheader: 'Feedback that giup san pham bot lech huong',
        goal: 'Win learning even if churn',
        bodyStructure: ['Khong ep quay lai.', 'Hoi ly do roi bo.', 'De xuat winback sau khi co feature phu hop.'],
        cta: 'Gui feedback 1 phut',
        avoidIf: 'User da unsubscribe',
      },
    ],
  },
  {
    id: 'upgrade',
    name: 'Upgrade Sequence - tu pilot sang paid workflow',
    trigger: 'User co paid signal, demo signal hoac team request',
    totalEmails: 3,
    duration: '6 ngay',
    emails: [
      {
        day: 0,
        subject: 'Pilot da co tin hieu, buoc tiep theo la gi?',
        preheader: 'Dinh nghia scope paid nho nhat truoc khi mo rong',
        goal: 'Frame paid pilot',
        bodyStructure: ['Tom tat outcome pilot.', 'De xuat scope nho nhat.', 'Noi ro phan nao van can nguoi duyet.'],
        cta: 'Lap scope paid pilot',
        avoidIf: 'Lead chua co decision maker',
      },
      {
        day: 3,
        subject: 'Bang so sanh: free workflow vs paid pilot',
        preheader: 'Tra tien cho su on dinh, support va workflow that',
        goal: 'Clarify value and boundaries',
        bodyStructure: ['So sanh 3 dong: data, review, support.', 'Khong hua automate tat ca.', 'Dua risk reversal.'],
        cta: 'Xem pham vi paid pilot',
        avoidIf: 'User da nhan proposal',
      },
      {
        day: 6,
        subject: 'Co nen chot pilot trong tuan nay?',
        preheader: 'Neu chua dung, hay dung lai dung luc',
        goal: 'Close or disqualify cleanly',
        bodyStructure: ['Hoi quyet dinh ro.', 'Neu co: hen kickoff.', 'Neu khong: ghi objection va follow-up sau.'],
        cta: 'Chon kickoff hoac dung lai',
        avoidIf: 'User da close lost/won',
      },
    ],
  },
  {
    id: 'winback',
    name: 'Winback Sequence - quay lai khi co ly do moi',
    trigger: 'User churned, paused, hoac lead cu co feature phu hop moi',
    totalEmails: 2,
    duration: '14 ngay',
    emails: [
      {
        day: 0,
        subject: 'LedgerFlow da nhe hon o diem ban tung bi ket',
        preheader: 'Mot cap nhat nho, dung voi ly do ban roi bo',
        goal: 'Reopen conversation with relevant change',
        bodyStructure: ['Nhac ly do cu neu co.', 'Noi cap nhat moi lien quan.', 'Moi xem lai bang du lieu mau.'],
        cta: 'Xem cap nhat lien quan',
        avoidIf: 'Khong co thay doi that su lien quan den ly do churn',
      },
      {
        day: 14,
        subject: 'Toi se khong lam phien nua neu chua dung luc',
        preheader: 'Mot cau hoi cuoi de biet khi nao nen quay lai',
        goal: 'Permission-based follow-up',
        bodyStructure: ['Ton trong thoi diem.', 'Hoi trigger nao nen follow-up lai.', 'Cho option tai checklist thay vi demo.'],
        cta: 'Chon thoi diem follow-up',
        avoidIf: 'User da yeu cau khong lien he',
      },
    ],
  },
];

export interface EmailMetricBenchmark {
  metric: string;
  healthy: string;
  warning: string;
  risk: string;
  note: string;
}

export const EMAIL_METRICS_BENCHMARKS: EmailMetricBenchmark[] = [
  { metric: 'Open rate', healthy: '35%+', warning: '20-34%', risk: '<20%', note: 'Subject line can phan anh pain that, khong clickbait.' },
  { metric: 'Click rate', healthy: '6%+', warning: '2-5%', risk: '<2%', note: 'CTA nen la mot hanh dong nho, khong qua nhieu link.' },
  { metric: 'Reply rate', healthy: '3%+', warning: '1-2%', risk: '<1%', note: 'B2B early sales nen coi reply quan trong hon open.' },
  { metric: 'Unsubscribe', healthy: '<0.5%', warning: '0.5-1%', risk: '>1%', note: 'Neu cao, giam tan suat va lam ro permission.' },
  { metric: 'Activation after email', healthy: '10%+', warning: '4-9%', risk: '<4%', note: 'Do user thuc hien workflow, khong chi click.' },
];

export const AI_EMAIL_PROMPT = (params: {
  sequenceType: SequenceType;
  dayNumber: number;
  persona: string;
  mainGoal: string;
  tone: EmailTone;
}) => `Ban la lifecycle marketer B2B SaaS tai Viet Nam.

Viet mot email cho LedgerFlow Studio.

Sequence: ${params.sequenceType}
Day: ${params.dayNumber}
Persona: ${params.persona}
Goal: ${params.mainGoal}
Tone: ${params.tone}

Guardrails:
- LedgerFlow la Company OS / Simulation Lab, khong phai ERP xay dung don le.
- Khong hua thay the ke toan chuyen nghiep, tu van phap ly hoac nguoi duyet cuoi.
- Neu co AI, noi AI chi soan thao/goi y, nguoi dung duyet truoc khi gui/publish.
- Khong spam, khong fearmongering qua muc.

Output:
SUBJECT: [toi da 12 tu]
PREHEADER: [1 cau ngan]
BODY: [120-180 tu, chia doan ngan]
CTA: [1 hanh dong ro]
DO_NOT_SEND_IF: [dieu kien nen bo qua email]`;
