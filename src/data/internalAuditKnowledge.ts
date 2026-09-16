export const AUDIT_AREAS = [
  { area: 'Bản quyền & Tài nguyên số (Digital Assets)', objective: 'Đảm bảo asset 3D, âm thanh, kịch bản có bản quyền hợp lệ, không vi phạm IP.', keyRisks: ['sử dụng asset vi phạm bản quyền', 'thiếu chứng từ mua bán license', 'chia sẻ tài nguyên số trái phép'], controls: ['Asset License Registry', 'quét mã nguồn và model 3D trước khi đóng gói', 'phân quyền truy cập kho asset'] },
  { area: 'Chi phí Cloud & Hạ tầng GPU / API', objective: 'Chi tiêu hạ tầng cloud, GPU server và token API đúng dự toán, không lãng phí.', keyRisks: ['rò rỉ API key', 'chạy script ngốn GPU vô tận', 'chi phí server vượt hạn mức'], controls: ['AI Vault Key Encryption', 'Budget Governor giới hạn token', 'cảnh báo chi phí cloud thời gian thực'] },
  { area: 'Kho Game Assets & 3D Models', objective: 'Lưu trữ, versioning và phân loại asset 3D chuẩn xác, không thất lạc asset.', keyRisks: ['thiếu texture/shader', 'file 3D quá nặng gây giảm FPS', 'trùng lặp asset trong kho'], controls: ['kiểm kê asset định kỳ', 'tự động nén và tối ưu polygon', 'gắn metadata và version tag cho từng model'] },
  { area: 'Kho Kịch Bản & Video Thành Phẩm', objective: 'Quản lý kho kịch bản AI, file video render 4K và luồng xuất bản mạng xã hội.', keyRisks: ['kịch bản trùng lặp nội dung', 'video render lỗi encoding', 'lộ video chưa phát hành'], controls: ['kho kịch bản tập trung', 'tự động kiểm duyệt nội dung trước khi render', 'phân quyền xuất bản video'] },
  { area: 'Doanh Thu Số & Cổng Thanh Toán', objective: 'Doanh thu in-app, subscription và bán bản quyền khớp số liệu cổng thanh toán.', keyRisks: ['lệch đối soát cổng thanh toán', 'gian lận hoàn tiền (chargeback)', 'thiếu hóa đơn VAT điện tử'], controls: ['tự động đối chiếu webhook thanh toán', 'ghi nhận doanh thu theo chuẩn mực kế toán số', 'lưu trữ log giao dịch bất biến'] },
  { area: 'Báo Cáo Điều Hành CEO', objective: 'Dữ liệu điều hành trung thực, cập nhật thời gian thực, có log kiểm toán minh bạch.', keyRisks: ['báo cáo sai lệch chỉ số MAU/ARR', 'không có audit log', 'che giấu lỗi hệ thống'], controls: ['CEO Command Cockpit', 'Audit log bất biến', 'hệ thống cảnh báo tự động'] }
];

export const RISK_CONTROL_MATRIX = [
  { risk: 'Rò rỉ API Key hoặc Token Cloud', process: 'Chi phí Cloud & Hạ tầng', control: 'Mã hóa AES-256 trong AI Key Vault và auto-lock khi không sử dụng', test: 'Quét toàn bộ codebase và log runtime để đảm bảo 0 rò rỉ secret', evidence: 'Vault Security Report, Audit Log, Git Secret Scan' },
  { risk: 'Sử dụng Asset 3D không có bản quyền', process: 'Bản quyền & Tài nguyên số', control: 'Bắt buộc gắn License ID và hóa đơn mua tài nguyên vào Kho Game Assets', test: 'Lấy mẫu asset trong dự án game, đối chiếu License với nhà cung cấp', evidence: 'Biên nhận mua asset, file license.txt, metadata model' },
  { risk: 'Model 3D quá nặng làm sụt giảm FPS', process: 'Kho Game Assets & 3D Models', control: 'Tự động kiểm tra polygon count và dung lượng file GLTF/GLB trước khi build', test: 'Chạy benchmark FPS trên trình duyệt để kiểm tra độ mượt', evidence: 'FPS Benchmark Report, 3D Asset Inspector log' },
  { risk: 'Render video 4K tiêu tốn tài nguyên quá mức', process: 'Kho Kịch Bản & Video', control: 'Giới hạn độ phân giải và thời lượng render tối đa theo từng phân cảnh', test: 'Kiểm tra log FFmpeg và thời gian hoàn thành tác vụ render', evidence: 'FFmpeg log, Video Processing Queue history' },
  { risk: 'Lệch số liệu thanh toán in-app / subscription', process: 'Doanh Thu Số', control: 'Tự động đối soát webhook Stripe / VietQR với database nội bộ', test: 'Dò khớp 100% giao dịch thanh toán thành công với đơn hàng đã kích hoạt', evidence: 'Payment Webhook Logs, Sổ cái doanh thu số' },
  { risk: 'Thay đổi mã nguồn hoặc cấu hình trái phép', process: 'Kiểm Soát Hệ Thống', control: 'Audit log bắt buộc ghi nhận người sửa, timestamp và mã định danh tác vụ', test: 'Kiểm tra lịch sử thay đổi trên git và audit log daemon', evidence: 'Audit Log, Git commit history, Patch Review Session' }
];

export const AUDIT_PROGRAM = [
  { step: '1. Lập phạm vi kiểm toán', work: 'Xác định dự án game/phần mềm, kho asset, kỳ kiểm tra và hạn mức chi phí.', output: 'Digital Audit Scope Memo' },
  { step: '2. Khảo sát quy trình', work: 'Vẽ luồng từ ý tưởng kịch bản/gameplay đến khi render, đóng gói và thanh toán.', output: 'Process Flow Chart' },
  { step: '3. Nhận diện rủi ro số', work: 'Liệt kê rủi ro về bản quyền, bảo mật API key, chi phí cloud và tính toàn vẹn dữ liệu.', output: 'Digital Risk Register' },
  { step: '4. Kiểm thử kiểm soát', work: 'Kiểm tra mã nguồn, đối chiếu license asset, benchmark FPS và log thanh toán.', output: 'Audit Working Papers' },
  { step: '5. Đánh giá & Kết luận', work: 'Ghi nhận phát hiện theo: Hiện trạng - Tiêu chuẩn - Nguyên nhân - Rủi ro - Khuyến nghị.', output: 'Audit Findings Report' },
  { step: '6. Khắc phục & Tự chữa lành', work: 'Kích hoạt Self-Healing patch hoặc giao việc cho kỹ sư xử lý triệt để.', output: 'Remediation Tracker' }
];

export const FINDING_TEMPLATES = [
  { title: 'Tài nguyên 3D chưa gắn License hợp lệ', condition: 'Một số asset trong kho game chưa có hóa đơn hoặc mã bản quyền thương mại.', criteria: 'Mọi tài nguyên số sử dụng trong sản phẩm thương mại phải có license rõ ràng.', impact: 'Nguy cơ bị khiếu nại bản quyền hoặc bị gỡ bỏ khỏi App Store/Steam.', recommendation: 'Rà soát và bổ sung license cho toàn bộ kho asset hoặc thay thế bằng asset tự sinh.' },
  { title: 'Chi phí Token API vượt ngưỡng ngân sách', condition: 'Mức tiêu thụ token API trong kỳ vượt 20% so với dự toán ban đầu.', criteria: 'Chi phí AI/Cloud phải tuân thủ hạn mức trong Token Governor.', impact: 'Giảm biên lợi nhuận của sản phẩm phần mềm.', recommendation: 'Chuyển các tác vụ nội bộ sang On-Device Local Offline LLM WebGPU ($0).' },
  { title: 'Asset 3D chưa được nén tối ưu', condition: 'Dung lượng texture và số lượng đa giác của model 3D vượt mức khuyến nghị.', criteria: 'Game 3D web/mobile cần duy trì khung hình ổn định 60FPS.', recommendation: 'Sử dụng công cụ nén tự động trong Glacia Asset Studio để giảm dung lượng file.' }
];

export const FOLLOW_UP_TRACKER = [
  { finding: 'Tài nguyên 3D chưa gắn License', owner: 'Game Art Lead', deadline: '3 ngày', evidence: 'Bổ sung file license.txt và link nguồn asset', status: 'In Progress' },
  { finding: 'Chi phí API vượt ngưỡng', owner: 'AI Engineer', deadline: '2 ngày', evidence: 'Kích hoạt WebLLM Offline và siết chặt token quota', status: 'Closed' },
  { finding: 'Tối ưu hóa đa giác model 3D', owner: '3D Artist', deadline: '5 ngày', evidence: 'Log benchmark 60FPS mượt mà trên thiết bị yếu', status: 'Open' }
];

export const SAMPLING_GUIDE = [
  'Ưu tiên chọn mẫu theo mức độ rủi ro: chi phí API cao, asset thương mại bên thứ ba, giao dịch thanh toán giá trị lớn.',
  'Kiểm tra 100% các model 3D và kịch bản video xuất bản ra công chúng.',
  'Mỗi mẫu kiểm tra phải lưu bằng chứng số: hash file, log giao dịch, license ID và chữ ký duyệt.',
  'Nếu phát hiện sai sót, kích hoạt quy trình tự động cô lập và cập nhật quy tắc phòng ngừa.'
];

