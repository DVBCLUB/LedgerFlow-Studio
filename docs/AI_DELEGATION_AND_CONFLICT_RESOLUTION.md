# LedgerFlow Studio — AI Delegation, Role-Based Access Control (RBAC) & Conflict Resolution

Tài liệu thiết kế kiến trúc phân quyền nhiệm vụ (Task Delegation) và giải quyết xung đột ý kiến (Multi-Agent Consensus) theo các tiêu chuẩn công nghệ hàng đầu thế giới (**Amazon IAM, Google DeepMind, Anthropic, Netflix**).

---

## 1. Triết Lý Phân Quyền Bất Khả Xâm Phạm
Để tránh tình trạng nhiều AI tranh chấp tài nguyên, ghi đè file hoặc đưa ra giải pháp đối nghịch gây lỗi phần mềm:
1. **Đặc Quyền Tối Thiểu (Least Privilege)**: Mỗi AI chỉ được cấp quyền trong đúng phạm vi nhiệm vụ của nó.
2. **Cô Lập Ranh Giới Domain (Domain Boundary Isolation)**: AI làm Video Marketing không được phép đọc/ghi dữ liệu kế toán; AI làm Game không được sửa code Webhook thanh toán.
3. **Phân Xử Đồng Thuận (Consensus Arbitration)**: Khi có 2 phương án đối nghịch, hệ thống triệu tập Hội đồng 3 AI độc lập chấm điểm theo 3 tiêu chí: *An toàn (40%), Tốc độ (30%), Bền vững (30%)*.

---

## 2. Ma Trận Cấp Độ Quyền Hạn (Authority Levels)

| Cấp Độ | Tên Vai Trò | Phạm Vi Quyền Hạn | Quyền Ghi Trực Tiếp |
| :--- | :---: | :--- | :---: |
| **LEVEL 1** | `SCOUT_READER` | Chỉ đọc dữ liệu, telemetry, tài liệu nghiên cứu | ❌ KHÔNG |
| **LEVEL 2** | `DRAFT_CREATOR` | Tạo file nháp, viết code, kịch bản, tài sản game | ⚠️ Chỉ vào Staging/Draft |
| **LEVEL 3** | `VALIDATOR_JUDGE` | Thẩm định chất lượng, review bảo mật, kiểm tra lint | ⚠️ Quyền Duyệt / Từ Chối |
| **LEVEL 4** | `RELEASE_GATEKEEPER` | Gạch nợ VietQR, Merge PR vào main, Release app | ✅ DUY NHẤT CEO |

---

## 3. Giao Thức Trọng Tài Đa AI (DeepMind Multi-Agent Consensus)

Khi AI Chuyên gia A (Architect) và AI Chuyên gia B (DevOps) có giải pháp mâu thuẫn:
1. **Đưa bài toán vào Trọng Tài**:
   - `Claude 3.5 Sonnet` chấm điểm Logic & An toàn.
   - `GPT-4o` chấm điểm Năng suất & Tốc độ hoàn thành.
   - `Gemini 2.5 Pro` chấm điểm Khả năng mở rộng & Bền vững dài hạn.
2. **Công thức tính điểm**:
   $$\text{Điểm Tổng Hợp} = (\text{Safety} \times 0.4) + (\text{Speed} \times 0.3) + (\text{Sustainability} \times 0.3)$$
3. **Tự động áp dụng**: Phương án có điểm cao nhất được thực thi tự động. Nếu điểm $< 70/100$, hệ thống tự động thông báo CEO qua Telegram để quyết định.

---

## 4. Khoanh Vùng Cách Ly Sự Cố (Netflix Blast-Radius Quarantine)

- Nếu 1 AI Agent gặp lỗi lặp lại **3 lần liên tiếp**:
  1. Tự động thu hồi quyền ghi (`canDirectlyWriteDisk = false`).
  2. Đưa Agent vào trạng thái `QUARANTINED`.
  3. Kích hoạt Agent dự phòng (Fallback Specialist) tiếp quản nhiệm vụ qua Hàng Đợi Dead-Letter Queue (DLQ).
  4. Gửi báo cáo chẩn đoán cho Solo Founder duyệt khôi phục (Restore).
