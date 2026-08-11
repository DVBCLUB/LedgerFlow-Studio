export type DeepDiveCard = {
  id: string;
  title: string;
  scope: string;
  learningGoal: string;
  documents: string[];
  simulatedEntries: string[];
  redFlags: string[];
  controlQuestions: string[];
};

export type VatScenario = {
  id: string;
  label: string;
  baseAmount: number;
  vatRate: 8 | 10;
  notes: string[];
  reviewChecklist: string[];
};

export type InventoryDecisionNode = {
  method: 'weighted-average' | 'fifo' | 'specific-identification';
  label: string;
  bestFor: string[];
  risks: string[];
  controlChecks: string[];
};

export type AccountingPolicyDecisionRule = {
  signal: string;
  tt200Fit: string;
  tt133Fit: string;
  reviewerQuestion: string;
};

export type AccountingVnTestCase = {
  id: string;
  industry: 'sme-general' | 'trading' | 'services' | 'construction';
  title: string;
  scenario: string;
  documents: string[];
  expectedChecks: string[];
  simulatedEntries: string[];
  reviewerDecision: string;
};

export const VIETNAM_ACCOUNTING_DEEP_DIVE: DeepDiveCard[] = [
  {
    id: 'tt200-tt133-policy-selector',
    title: 'Decision tree: chọn Thông tư 200 hay 133',
    scope: 'Mô phỏng lựa chọn chính sách kế toán theo quy mô, nhu cầu quản trị và khả năng mở rộng hệ thống tài khoản.',
    learningGoal: 'Người học hiểu vì sao không nên chọn hệ thống tài khoản chỉ vì file mẫu cũ; phải có policy được duyệt và có version.',
    documents: ['quy mô doanh nghiệp', 'nhu cầu báo cáo quản trị', 'hệ thống tài khoản dự kiến', 'mẫu BCTC cần xuất', 'biên bản chọn chính sách'],
    simulatedEntries: ['Nợ 156 / Nợ 1331 / Có 331 khi mua hàng có hóa đơn', 'Nợ 632 / Có 156 khi xuất bán hàng hóa', 'Nợ 131 / Có 511 / Có 3331 khi ghi nhận doanh thu bán hàng'],
    redFlags: ['dùng sai hệ thống tài khoản', 'không có chính sách kế toán được duyệt', 'không tách tài khoản chi tiết cho dự án khi cần'],
    controlQuestions: ['doanh nghiệp cần báo cáo quản trị chi tiết đến mức nào?', 'có dùng tài khoản chi phí 621/622/627 không?', 'policy có được lưu ngày hiệu lực và người duyệt không?']
  },
  {
    id: 'vat-8-10-review-lab',
    title: 'VAT 8% vs 10% review lab',
    scope: 'Mô phỏng kiểm tra thuế suất theo từng dòng hàng hóa/dịch vụ, không tự kết luận pháp lý thay người phụ trách.',
    learningGoal: 'Người học biết tách dòng hóa đơn, kiểm tra mapping thuế suất, ghi ngoại lệ và yêu cầu người có thẩm quyền duyệt.',
    documents: ['hóa đơn điện tử', 'dòng hàng hóa/dịch vụ', 'mapping mã hàng - thuế suất', 'căn cứ kỳ hiệu lực', 'log ngoại lệ'],
    simulatedEntries: ['Nợ 156/642/627 theo tính chất chi phí', 'Nợ 1331 phần VAT đầu vào đủ điều kiện', 'Có 111/112/331 tổng thanh toán'],
    redFlags: ['cùng một mã hàng lúc 8% lúc 10% không có lý do', 'không tách dòng hàng khác thuế suất', 'áp thuế theo thói quen thay vì căn cứ'],
    controlQuestions: ['mỗi dòng có căn cứ thuế suất không?', 'hóa đơn có tách dòng rõ không?', 'ngoại lệ đã được kế toán trưởng duyệt chưa?']
  },
  {
    id: 'inventory-method-decision-tree',
    title: 'Decision tree: chọn phương pháp hàng tồn kho',
    scope: 'So sánh bình quân gia quyền, FIFO và đích danh trong mô phỏng giá vốn.',
    learningGoal: 'Người học thấy cùng một nghiệp vụ xuất kho có thể tạo giá vốn khác nhau nếu phương pháp tính giá khác nhau.',
    documents: ['chính sách tồn kho', 'phiếu nhập kho', 'phiếu xuất kho', 'thẻ kho', 'bảng tính giá xuất kho', 'biên bản kiểm kê'],
    simulatedEntries: ['Nợ 632 / Có 156 khi xuất bán hàng hóa', 'Nợ 621 / Có 152 khi xuất vật tư cho công trình/sản xuất', 'Nợ 154 / Có 621/622/623/627 khi kết chuyển chi phí dự án'],
    redFlags: ['đổi phương pháp giữa kỳ không có duyệt', 'âm kho vẫn tính giá vốn', 'sổ kho và kế toán không đối chiếu'],
    controlQuestions: ['phương pháp nào đang được policy duyệt?', 'ảnh hưởng COGS và gross margin là bao nhiêu?', 'có phát sinh âm kho hoặc lệch kiểm kê không?']
  },
  {
    id: 'project-advance-settlement',
    title: 'Case dự án: tạm ứng và hoàn ứng chi phí R&D',
    scope: 'Mô phỏng theo dõi tiền ứng cho quản lý sản phẩm/R&D, chi phí dự án và chứng từ hoàn ứng.',
    learningGoal: 'Người học hiểu tạm ứng là khoản cần theo dõi tuổi nợ, người nhận, mục đích và hồ sơ hoàn ứng.',
    documents: ['đề nghị tạm ứng', 'phiếu chi/ủy nhiệm chi', 'bảng kê hoàn ứng', 'hóa đơn/chứng từ gốc', 'xác nhận số còn treo'],
    simulatedEntries: ['Nợ 141 / Có 111 hoặc 112 khi chi tạm ứng', 'Nợ 627/642 / Nợ 1331 nếu đủ điều kiện / Có 141 khi hoàn ứng', 'Nợ 111/112 / Có 141 nếu nộp lại tiền thừa'],
    redFlags: ['ứng mới khi ứng cũ chưa hoàn', 'quá hạn hoàn ứng', 'chi sai mã dự án', 'chứng từ yếu nhưng giá trị lặp lại nhiều lần'],
    controlQuestions: ['còn treo bao nhiêu?', 'quá hạn bao nhiêu ngày?', 'có gắn mã dự án và người chịu trách nhiệm không?']
  }
];

export const TT200_TT133_DECISION_RULES: AccountingPolicyDecisionRule[] = [
  {
    signal: 'Doanh nghiep can bao cao quan tri chi tiet theo du an, san pham, trung tam chi phi hoac don vi noi bo.',
    tt200Fit: 'Thuong phu hop hon neu can he thong tai khoan chi tiet, tracking chi phi sau va bao cao quan tri rong.',
    tt133Fit: 'Chi phu hop neu nhu cau bao cao don gian va policy noi bo khong can mo rong tai khoan qua nhieu.',
    reviewerQuestion: 'Nguoi duyet co can BCTC/bao cao quan tri chi tiet hon mau SME don gian khong?'
  },
  {
    signal: 'Doanh nghiep nho, nghiep vu lap lai, it nhu cau phan tich tai khoan va uu tien van hanh gon.',
    tt200Fit: 'Co the qua nang neu chi can so sach co ban va khong co yeu cau quan tri phuc tap.',
    tt133Fit: 'Co the phu hop cho SME neu du dieu kien ap dung va co policy duoc phe duyet.',
    reviewerQuestion: 'Da co can cu ve quy mo, nhu cau bao cao va nguoi phe duyet policy chua?'
  },
  {
    signal: 'Doanh nghiep du kien goi von, mo rong nhieu line san pham, ket noi ERP hoac can audit trail chat.',
    tt200Fit: 'Nen review nghiem tuc vi he thong tai khoan va bao cao co kha nang mo rong tot hon.',
    tt133Fit: 'Can canh bao migration risk neu sau nay phai chuyen len he thong chi tiet hon.',
    reviewerQuestion: 'Neu 12 thang toi mo rong, viec doi policy/COA co gay dut gay du lieu khong?'
  }
];

export const VAT_SCENARIOS: VatScenario[] = [
  {
    id: 'vat-8-goods-sample',
    label: 'Dòng mô phỏng VAT 8%',
    baseAmount: 100000000,
    vatRate: 8,
    notes: ['Tiền VAT mô phỏng = baseAmount * 8%', 'Tổng thanh toán = baseAmount + VAT', 'Luôn cần kiểm tra chính sách hiện hành trước khi dùng thật'],
    reviewChecklist: ['có mapping mã hàng không?', 'có kỳ hiệu lực không?', 'hóa đơn có tách dòng không?']
  },
  {
    id: 'vat-10-service-sample',
    label: 'Dòng mô phỏng VAT 10%',
    baseAmount: 20000000,
    vatRate: 10,
    notes: ['Tiền VAT mô phỏng = baseAmount * 10%', 'Dùng để so sánh với dòng 8% trong cùng hồ sơ', 'Không tự động kết luận thuế suất'],
    reviewChecklist: ['dịch vụ thuộc nhóm nào?', 'có hợp đồng/nghiệm thu không?', 'kế toán trưởng đã duyệt chưa?']
  }
];

export const VAT_RATE_REVIEW_RULES = [
  'Tach tung dong hang hoa/dich vu truoc khi so sanh 8% va 10%; khong duyet theo tong hoa don neu co nhieu nhom hang.',
  'Luu can cu ky hieu luc va mapping ma hang - thue suat, vi day la diem can nguoi duyet xac nhan theo van ban hien hanh.',
  'Neu cung mot ma hang phat sinh ca 8% va 10%, danh dau ngoai le kiem soat va yeu cau ly do bang chung.',
  'Khong de AI/UI ket luan thue suat cuoi cung; panel chi tinh so tien VAT mo phong va tao checklist review.'
];

export const INVENTORY_METHOD_DECISION_TREE: InventoryDecisionNode[] = [
  {
    method: 'weighted-average',
    label: 'Bình quân gia quyền',
    bestFor: ['hàng hóa nhiều lô', 'giá biến động vừa phải', 'muốn tính toán đơn giản cho SME'],
    risks: ['che mất biến động giá từng lô', 'dễ sai nếu nhập xuất chưa khóa kỳ'],
    controlChecks: ['khóa kỳ kho trước khi tính', 'đối chiếu số lượng tồn', 'so sánh giá bình quân bất thường']
  },
  {
    method: 'fifo',
    label: 'FIFO - nhập trước xuất trước',
    bestFor: ['hàng có vòng đời/lô rõ', 'muốn mô phỏng dòng hàng cũ ra trước', 'giá mua biến động cần theo dõi ảnh hưởng COGS'],
    risks: ['cần dữ liệu lô nhập tốt', 'dễ phức tạp hơn bình quân'],
    controlChecks: ['theo dõi lô', 'không để tồn âm', 'so sánh COGS giữa FIFO và bình quân']
  },
  {
    method: 'specific-identification',
    label: 'Đích danh',
    bestFor: ['hàng giá trị lớn', 'tài sản/hàng hóa nhận diện riêng', 'dự án cần tracking từng mã'],
    risks: ['khó áp dụng đại trà', 'dễ sai nếu mã định danh không chặt'],
    controlChecks: ['mã định danh duy nhất', 'biên bản giao nhận theo mã', 'đối chiếu ảnh/chứng từ nếu cần']
  }
];

export const INVENTORY_DECISION_PATHS = [
  {
    question: 'Hang co ma lo/serial rieng va gia tri lon khong?',
    yes: 'Can nhac dich danh neu chung tu theo doi duoc tung ma.',
    no: 'Chuyen sang cau hoi ve vong quay va bien dong gia.'
  },
  {
    question: 'Hang co vong doi/han dung/lo nhap ro va can uu tien lo cu ra truoc khong?',
    yes: 'Can nhac FIFO, dong thoi kiem tra ton am va chat luong du lieu lo.',
    no: 'Can nhac binh quan gia quyen cho SME neu du lieu lo chua du chat.'
  },
  {
    question: 'Gia mua bien dong manh va gross margin nhay cam voi COGS khong?',
    yes: 'Mo phong song song FIFO va binh quan de founder/ke toan truong thay anh huong truoc khi chot policy.',
    no: 'Uu tien policy de van hanh on dinh, it doi giua ky.'
  }
];

export const ACCOUNTING_VN_TEST_CASES: AccountingVnTestCase[] = [
  {
    id: 'sme-general-cash-expense',
    industry: 'sme-general',
    title: 'SME general: chi phi van hanh thieu chung tu',
    scenario: 'Cong ty nho ghi nhan chi phi phan mem va thue ngoai, mot phan chi bang tien mat va chua co hop dong/hoa don day du.',
    documents: ['de nghi thanh toan', 'hop dong hoac bao gia', 'hoa don dien tu neu co', 'bien ban nghiem thu dich vu', 'phieu chi/uy nhiem chi'],
    expectedChecks: ['phan loai chi phi hop le', 'kiem tra VAT dau vao neu co', 'doi chieu nguoi duyet va ngan sach', 'tach khoan thieu chung tu vao exception log'],
    simulatedEntries: ['No 642 / No 1331 neu du dieu kien / Co 111,112,331', 'Neu thieu ho so: chi tao note can kiem tra, khong tu duyet khau tru VAT'],
    reviewerDecision: 'Ke toan/nguoi duyet quyet dinh co chap nhan chi phi va thue dau vao hay yeu cau bo sung ho so.'
  },
  {
    id: 'trading-inventory-vat',
    industry: 'trading',
    title: 'Trading: hang ve lech so luong va VAT',
    scenario: 'Hoa don mua hang ghi 100 san pham, phieu nhap kho chi nhan 96 san pham; mot dong hang ap VAT 8%, dong khac 10%.',
    documents: ['don dat hang', 'hoa don dien tu', 'phieu nhap kho', 'bien ban giao nhan', 'doi chieu cong no NCC'],
    expectedChecks: ['doi chieu so luong hoa don voi kho nhan', 'tach VAT 8% va 10% theo tung dong', 'ghi nhan ngoai le thieu hang', 'kiem tra phuong phap tinh gia xuat kho'],
    simulatedEntries: ['No 156 theo so thuc nhan / No 1331 phan du dieu kien / Co 331', 'No 1388 hoac note claim NCC neu can theo doi hang thieu'],
    reviewerDecision: 'Nguoi duyet xac nhan xu ly hang thieu va thue suat tung dong truoc khi khoa cong no.'
  },
  {
    id: 'services-revenue-recognition',
    industry: 'services',
    title: 'Services: nghiem thu va ghi nhan doanh thu',
    scenario: 'Hop dong dich vu da xuat hoa don nhung bien ban nghiem thu moi hoan thanh 70%, khach hang con giu lai mot phan thanh toan.',
    documents: ['hop dong dich vu', 'timesheet hoac delivery log', 'bien ban nghiem thu', 'hoa don dau ra', 'xac nhan cong no'],
    expectedChecks: ['kiem tra dieu kien ghi nhan doanh thu', 'doi chieu nghiem thu voi hoa don', 'tach cong no phai thu va khoan giu lai', 'khong ket luan thay nguoi duyet ve thoi diem ghi nhan'],
    simulatedEntries: ['No 131 / Co 511 / Co 3331 neu du dieu kien ghi nhan', 'Neu chua du dieu kien: tao exception can reviewer xac nhan'],
    reviewerDecision: 'Ke toan truong/founder xac nhan thoi diem ghi nhan doanh thu va cong no can theo doi.'
  },
  {
    id: 'construction-advance-costing',
    industry: 'construction',
    title: 'Construction template: tam ung qua han va chi phi cong trinh',
    scenario: 'Chi huy truong nhan tam ung cho cong trinh, qua han hoan ung 20 ngay, chung tu vat tu co VAT va mot so phieu chi chua gan ma cong trinh.',
    documents: ['de nghi tam ung', 'uy nhiem chi/phieu chi', 'bang ke hoan ung', 'hoa don VAT', 'phieu nhap/xuat kho', 'ma cong trinh/du an'],
    expectedChecks: ['tuoi no tam ung', 'ma cong trinh/du an', 'VAT dau vao du dieu kien hay khong', 'phan loai 621/623/627/642 theo tinh chat'],
    simulatedEntries: ['No 141 / Co 111,112 khi tam ung', 'No 621,623,627 hoac 642 / No 1331 neu du dieu kien / Co 141 khi hoan ung'],
    reviewerDecision: 'Nguoi duyet xac nhan chung tu du dieu kien va co cho phep tam ung tiep hay khoa tam ung moi.'
  }
];

export const ACCOUNTING_DEEP_DIVE_ACCEPTANCE = [
  'Không hardcode API key hoặc phụ thuộc CDN.',
  'Nội dung pháp luật/kế toán chỉ là mô phỏng học tập, luôn có cảnh báo kiểm tra văn bản hiện hành.',
  'Mỗi case có chứng từ, bút toán mô phỏng, red flag và câu hỏi kiểm soát.',
  'Có thể render thành tab riêng trong AccountingVietnam mà không phải viết lại App.tsx.',
  'Sau khi nối UI cần chạy npm run check:agentops-contracts và npm run lint.'
];
