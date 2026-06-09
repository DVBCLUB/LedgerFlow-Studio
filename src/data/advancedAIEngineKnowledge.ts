export const AI_USE_CASES = [
  { name: 'Trợ lý kiểm tra hồ sơ thanh toán', input: 'Đề nghị thanh toán, hợp đồng, nghiệm thu, hóa đơn, phiếu kho', output: 'Thiếu gì, rủi ro gì, có được thanh toán chưa', guardrail: 'AI chỉ gợi ý, kế toán trưởng duyệt cuối.' },
  { name: 'Phân loại chi phí tự động', input: 'Mô tả phát sinh, NCC, công trình, số tiền', output: 'Loại chi phí, tài khoản gợi ý, chứng từ cần kèm', guardrail: 'Không tự ghi sổ nếu chưa có người kiểm tra.' },
  { name: 'Cảnh báo VAT', input: 'Hóa đơn, thuế suất, tiền trước thuế, tiền thuế', output: 'Dòng nghi sai thuế, sai số học, thiếu mã hóa đơn', guardrail: 'Không tự kết luận pháp lý nếu thiếu chứng từ gốc.' },
  { name: 'Tóm tắt báo cáo sếp', input: 'Ngân sách, tạm ứng, công nợ, hồ sơ thiếu, cảnh báo', output: 'Bản tóm tắt 5 dòng và việc cần duyệt', guardrail: 'Không lộ dữ liệu cá nhân/nhạy cảm khi dùng cloud AI.' },
  { name: 'Phát hiện bất thường quỹ dầu/kho', input: 'Phiếu cấp dầu, nhật trình xe, nhập xuất tồn', output: 'Xe/máy hoặc vật tư có chênh lệch bất thường', guardrail: 'Phải đối chiếu với người giữ kho trước khi kết luận.' }
];

export const AI_GUARDRAILS = [
  { rule: 'Không gửi dữ liệu nhạy cảm lên AI cloud', detail: 'Ẩn tên người, số tài khoản, số điện thoại, MST, số hóa đơn nếu không cần thiết.' },
  { rule: 'Không để AI tự duyệt thanh toán', detail: 'AI chỉ tạo cảnh báo và checklist; quyền duyệt thuộc người có thẩm quyền.' },
  { rule: 'Luôn lưu prompt và kết quả', detail: 'Mỗi lần AI phân tích phải có log để kiểm toán lại.' },
  { rule: 'Bắt AI trả lời theo schema', detail: 'Ví dụ: riskLevel, missingDocs, suggestedAction, confidence, needsHumanReview.' },
  { rule: 'Có ngưỡng confidence', detail: 'Dưới 80% thì đưa vào hàng chờ người kiểm tra.' },
  { rule: 'Không coi AI là nguồn luật', detail: 'Luật thuế/kế toán phải có người kiểm tra văn bản hiện hành.' }
];

export const PROMPT_TEMPLATES = [
  { title: 'Kiểm tra hồ sơ thanh toán', prompt: 'Bạn là kiểm soát viên nội bộ. Dựa trên dữ liệu hồ sơ, hãy trả về JSON gồm missingDocs, riskLevel, reason, suggestedAction, needsHumanReview.' },
  { title: 'Phân loại chi phí công trình', prompt: 'Bạn là kế toán xây dựng. Hãy phân loại khoản chi theo vật tư, nhân công, máy thi công, nhiên liệu, HCNS hoặc khác; gợi ý tài khoản và chứng từ cần có.' },
  { title: 'Tóm tắt báo cáo sếp', prompt: 'Tóm tắt dữ liệu thành 5 dòng: ngân sách, tạm ứng, công nợ, hồ sơ thiếu, rủi ro cần duyệt hôm nay.' },
  { title: 'Cảnh báo hóa đơn VAT', prompt: 'Kiểm tra số hóa đơn, thuế suất, tiền trước thuế, tiền thuế, tổng tiền. Trả về dòng nghi ngờ và lý do.' }
];

export const AI_ARCHITECTURE = [
  { layer: 'Offline rules first', detail: 'Rule kiểm tra số học, thiếu mã, thiếu chứng từ chạy offline trước để giảm chi phí AI.' },
  { layer: 'Redaction layer', detail: 'Ẩn thông tin nhạy cảm trước khi gửi cloud AI.' },
  { layer: 'AI analysis layer', detail: 'AI đọc dữ liệu đã ẩn, trả về JSON có confidence và action.' },
  { layer: 'Human approval layer', detail: 'Kế toán dự án/kế toán trưởng duyệt hoặc bác kết quả AI.' },
  { layer: 'Audit log layer', detail: 'Lưu prompt, model, output, người duyệt và thời điểm duyệt.' }
];

export const COST_CONTROL_TIPS = [
  'Ưu tiên rule offline trước, AI chỉ xử lý việc khó như tóm tắt, phân loại, giải thích.',
  'Cache câu hỏi giống nhau để không tốn quota.',
  'Chạy theo batch cuối ngày thay vì gọi AI từng dòng.',
  'Dùng model rẻ/nhỏ cho tóm tắt, model mạnh cho hồ sơ rủi ro cao.',
  'Cho phép người dùng tự nhập API key nếu công ty có ngân sách.'
];
