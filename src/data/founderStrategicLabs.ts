export const PERSONA_LAB = [
  {
    persona: 'Kế toán viên đa ngành',
    context: 'Làm việc với thương mại, dịch vụ, sản xuất hoặc dự án; cần học tình huống và rà soát chứng từ nhanh.',
    pain: ['khó nhớ checklist theo từng loại nghiệp vụ', 'sợ sai kỳ doanh thu/chi phí', 'khó giải thích rủi ro cho sếp'],
    trigger: 'Cần một case mô phỏng để tập ra quyết định trước khi áp dụng vào file thật.',
    willingnessToPaySignal: 'Sẵn sàng trả cho case bank, checklist kiểm toán, mẫu báo cáo và simulator có ví dụ cụ thể.',
    validationQuestions: ['Bạn thường sai hoặc mất thời gian ở loại nghiệp vụ nào?', 'Bạn muốn mô phỏng ngành nào trước?', 'Đầu ra nào giúp bạn dùng ngay trong công việc?'],
    biasWarning: 'Persona này chỉ là giả thuyết nghiên cứu; phải đối chiếu bằng phỏng vấn hoặc khảo sát thật.'
  },
  {
    persona: 'Chủ doanh nghiệp nhỏ',
    context: 'Không muốn tự làm kế toán chi tiết nhưng cần hiểu dòng tiền, công nợ, tồn kho, chi phí và rủi ro.',
    pain: ['không hiểu báo cáo kế toán', 'khó biết tiền đang nằm ở đâu', 'không biết chi phí nào đang đốt tiền'],
    trigger: 'Muốn mô phỏng quyết định kinh doanh trước khi thuê người hoặc mua phần mềm lớn.',
    willingnessToPaySignal: 'Trả tiền nếu phần mềm giúp hiểu rủi ro và quyết định nhanh, không cần học kế toán quá sâu.',
    validationQuestions: ['Bạn muốn biết chỉ số nào mỗi tuần?', 'Bạn có cần simulator trước khi đầu tư/mở sản phẩm mới không?', 'Bạn chấp nhận trả bao nhiêu cho dashboard học dễ hiểu?'],
    biasWarning: 'Không giả định chủ doanh nghiệp nào cũng muốn dùng app học tập; cần kiểm tra bằng demo thật.'
  },
  {
    persona: 'Solo founder làm sản phẩm bằng AI',
    context: 'Một người vừa học, vừa code, vừa marketing, vừa quản trị tài chính, dùng AI như nhân viên ảo.',
    pain: ['AI làm lan man', 'khó kiểm soát chi phí tool', 'build nhiều nhưng không biết có bán được không'],
    trigger: 'Cần một operating system để giao việc cho AI, test ý tưởng và quản lý quyết định.',
    willingnessToPaySignal: 'Trả tiền cho prompt pack, work order board, simulator thương mại hóa và template vận hành.',
    validationQuestions: ['Bạn đang dùng AI nào như nhân viên?', 'Bạn cần mô phỏng phần nào trước khi code?', 'Bạn mất tiền tool ở đâu nhiều nhất?'],
    biasWarning: 'Không lấy phản hồi của solo founder làm đại diện cho toàn bộ thị trường giáo dục/kế toán.'
  },
  {
    persona: 'Người học qua game giáo dục',
    context: 'Muốn học kế toán, kiểm toán, tài chính, sản phẩm hoặc kinh doanh qua tình huống ra quyết định.',
    pain: ['lý thuyết khô', 'khó nhớ red flag', 'học xong không biết áp dụng'],
    trigger: 'Có mini-game tình huống với điểm số, lựa chọn và hậu quả rõ ràng.',
    willingnessToPaySignal: 'Trả tiền cho game/case nếu có lộ trình học, điểm số, replay và giải thích sau mỗi quyết định.',
    validationQuestions: ['Bạn thích học bằng quiz, case hay game quyết định?', 'Bạn muốn chơi 5 phút hay 30 phút mỗi phiên?', 'Phần thưởng nào làm bạn học tiếp?'],
    biasWarning: 'Game vui không đồng nghĩa với học hiệu quả; cần đo learning outcome.'
  }
];

export const FINANCE_LAB = [
  {
    metric: 'Burn rate',
    meaning: 'Tổng tiền founder đốt mỗi tháng cho tool, hosting, AI, thiết kế, marketing và thử nghiệm.',
    formula: 'monthly_tool_cost + hosting_cost + ai_cost + marketing_test_cost + misc_cost',
    healthySignal: 'Chi phí thấp, có lý do dùng lặp lại và có ngày hủy nếu không hiệu quả.',
    warning: 'Trả phí nhiều tool trước khi có doanh thu hoặc bằng chứng sử dụng thật.'
  },
  {
    metric: 'Runway',
    meaning: 'Số tháng còn sống được nếu chưa có doanh thu hoặc doanh thu chưa ổn định.',
    formula: 'cash_available / monthly_burn_rate',
    healthySignal: 'Runway đủ dài để test nhiều vòng MVP nhỏ.',
    warning: 'Runway ngắn nhưng vẫn build tính năng lớn chưa kiểm chứng.'
  },
  {
    metric: 'MRR simulation',
    meaning: 'Doanh thu định kỳ hàng tháng giả lập theo số khách, giá gói và churn.',
    formula: 'active_customers * monthly_price * (1 - churn_rate)',
    healthySignal: 'MRR tăng từ demo/lead thật, không chỉ là ước mơ trên giấy.',
    warning: 'Tăng giá hoặc dự báo khách hàng mà chưa có tín hiệu willingness-to-pay.'
  },
  {
    metric: 'Gross margin',
    meaning: 'Biên lợi nhuận sau chi phí biến đổi như AI API, hosting, MoR/payment fee và support.',
    formula: '(revenue - variable_cost) / revenue',
    healthySignal: 'Có thể giữ biên cao khi tăng người dùng.',
    warning: 'Sản phẩm phụ thuộc API đắt, support thủ công nhiều hoặc phí thanh toán ăn hết lợi nhuận.'
  }
];

export const PAYMENT_DECISION_MATRIX = [
  {
    option: 'Stripe/payment processor',
    bestFor: 'Founder cần linh hoạt kỹ thuật, bán trong phạm vi đã hiểu nghĩa vụ thuế.',
    risk: 'Founder vẫn phải tự chịu trách nhiệm kê khai/tuân thủ thuế theo thị trường bán.',
    useWhen: 'Bán thử nhỏ, thị trường hẹp, đã hiểu trách nhiệm pháp lý và thuế.',
    avoidWhen: 'Muốn bán quốc tế mà không có năng lực xử lý VAT/GST/sales tax.'
  },
  {
    option: 'Merchant of Record',
    bestFor: 'Solo founder bán sản phẩm số quốc tế và muốn giảm gánh nặng thuế/hoàn tiền/hóa đơn.',
    risk: 'Phí cao hơn, cần duyệt tài khoản, phụ thuộc chính sách nền tảng.',
    useWhen: 'Có tín hiệu bán quốc tế hoặc muốn tập trung vào sản phẩm thay vì compliance.',
    avoidWhen: 'Chưa có sản phẩm/khách hàng, chưa cần bật thanh toán thật.'
  },
  {
    option: 'Manual invoice/local transfer',
    bestFor: 'Giai đoạn phỏng vấn, pilot, bán dịch vụ tư vấn/template nhỏ trong nước.',
    risk: 'Khó scale, dễ thiếu quy trình hoàn tiền/điều khoản, cần kế toán thật kiểm tra.',
    useWhen: 'Bán thử ít khách, cần xác minh willingness-to-pay trước khi tích hợp payment.',
    avoidWhen: 'Có nhiều khách lẻ quốc tế hoặc cần tự động cấp quyền sau thanh toán.'
  }
];

export const DISTRIBUTION_ENGINE = [
  {
    channel: 'Content từ case mô phỏng',
    workflow: ['chọn một case đau thật', 'biến thành bài viết ngắn', 'biến thành demo 3 phút', 'thu phản hồi', 'đưa phản hồi vào backlog'],
    aiRole: 'AI Marketer soạn nháp; founder duyệt giọng văn và tính đúng thực tế.',
    antiSpamRule: 'Không auto-post hàng loạt; mỗi nội dung phải có insight thật hoặc ví dụ mô phỏng hữu ích.',
    successMetric: ['reply chất lượng', 'người xin demo', 'người hỏi giá', 'ý tưởng case mới từ thị trường']
  },
  {
    channel: 'Community research',
    workflow: ['theo dõi câu hỏi lặp lại', 'gom pain point', 'viết survey', 'mời xem prototype', 'ghi decision log'],
    aiRole: 'AI Research Lead phân nhóm pain và đề xuất giả thuyết.',
    antiSpamRule: 'Không giả danh người dùng; không spam link sản phẩm khi chưa giúp gì cho cộng đồng.',
    successMetric: ['số pain point xác nhận', 'số người đồng ý phỏng vấn', 'số phản hồi phủ định có giá trị']
  },
  {
    channel: 'Demo-led selling',
    workflow: ['chọn 1 persona', 'demo 1 mô hình', 'hỏi trước/sau demo', 'ghi objections', 'quyết định build/hold'],
    aiRole: 'AI PM chuẩn bị script demo và câu hỏi phản biện.',
    antiSpamRule: 'Không hứa thay ERP/kế toán chính thức; trình bày là lab học tập và mô phỏng.',
    successMetric: ['demo completed', 'objection list', 'willingness-to-pay signal', 'referral']
  }
];

export const GAME_EDUCATION_LAB = [
  {
    game: 'Audit Red Flag Game',
    learningObjective: 'Nhận diện rủi ro chứng từ và sai kỳ trong thương mại, dịch vụ, sản xuất, xây dựng.',
    coreLoop: ['nhận hồ sơ mô phỏng', 'chọn red flags', 'giải thích lý do', 'nhận điểm và hậu quả'],
    scoring: ['đúng red flag', 'không bỏ sót rủi ro trọng yếu', 'giải thích có bằng chứng', 'không kết luận pháp lý quá mức'],
    winCondition: 'Đạt điểm kiểm soát cao và đề xuất bước kiểm tra tiếp theo hợp lý.',
    mvpScope: '2D card game trong web, dùng dữ liệu case bank sẵn có.'
  },
  {
    game: 'Cash Runway Game',
    learningObjective: 'Hiểu burn rate, runway, tool budget và quyết định sống còn của solo founder.',
    coreLoop: ['chọn tool', 'chi tiền MVP', 'nhận lead/doanh thu giả lập', 'quyết định giữ/hủy/tăng giá'],
    scoring: ['runway còn lại', 'số giả thuyết đã test', 'chi phí mỗi experiment', 'tín hiệu doanh thu'],
    winCondition: 'Sống đủ lâu để có paid signal mà không đốt tiền vô ích.',
    mvpScope: 'Mini-game bảng quyết định, không cần 3D.'
  },
  {
    game: 'Product-Market Fit Decision Game',
    learningObjective: 'Học cách chọn ý tưởng đáng build dựa trên pain, buyer clarity, distribution và technical risk.',
    coreLoop: ['nhận ý tưởng', 'phỏng vấn persona', 'chọn MVP scope', 'test kênh bán', 'ra quyết định GO/HOLD/NO-GO'],
    scoring: ['idea score', 'độ rõ khách hàng', 'chất lượng bằng chứng', 'scope nhỏ', 'không bị AI hype'],
    winCondition: 'Chọn được MVP nhỏ có bằng chứng thị trường tốt.',
    mvpScope: 'Decision game bằng React cards; có thể nâng lên Godot/HTML5 sau.'
  }
];

export const STRATEGIC_LAB_NEXT_STEPS = [
  'Nối Persona Lab vào UI như tab riêng, không chèn vào simulator cũ.',
  'Tạo Finance Lab có input MRR, churn, tool cost, runway nhưng không biến thành kế toán chính thức.',
  'Tạo Distribution Engine với lead board localStorage và anti-spam guard.',
  'Tạo Game Education Lab với 2D decision game trước, chưa làm 3D.',
  'Mọi mô phỏng mới phải có bias warning và validation plan.'
];
