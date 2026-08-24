# Integration Hub

Tài liệu nội bộ cho phần tích hợp. Nội dung trong file này không nên bê nguyên lên giao diện người dùng.

## Mục đích hiển thị trong app

Trong app chỉ cần hiển thị ngắn gọn:

- Kết nối đang dùng: GitHub, Replit/local, AI provider khi cần.
- Trạng thái: sẵn sàng, cần cấu hình, lỗi.
- Hành động chính: mở repo, xem log, chạy preview, tạo issue.

Không hiển thị các đoạn mô tả dài kiểu chiến lược, prompt cho AI, nguyên tắc kiến trúc hay hướng dẫn dev nội bộ trên UI chính.

## Phần chạy ngầm

Các phần sau nên chạy ở backend/runtime hoặc để trong tài liệu, không dàn lên app:

- Registry connector và event log.
- Prompt/handoff cho AI coding agent.
- Checklist kỹ thuật dài.
- API route nội bộ.
- Lệnh terminal và hướng dẫn CI chi tiết.

## File liên quan

```text
server/services/integrationRegistry.ts
src/utils/integrationHubApi.ts
src/modules/dev-ops/IntegrationHub.tsx
src/modules/dev-ops/DevHandoffCenter.tsx
```

## 1. Nguyên tắc kiến trúc

### 1.1. Hub điều phối trung tâm
- LedgerFlow là trung tâm điều phối và kết nối các dịch vụ bên ngoài.
- Không lưu trữ credentials dạng plain text, mọi token được quản lý qua Vault và Key Masker.

### 1.2. Phân tách rõ ràng giữa UI và Runtime
- UI chỉ hiển thị trạng thái và hành động tương tác.
- Logic xử lý webhook, đồng bộ và streaming thuộc về runtime backend.

### 1.3. Khả năng chịu lỗi và Circuit Breaker
- Mọi connector đều có fallback và circuit breaker độc lập, tránh lỗi dây chuyền.

### 1.4. Quy tac khong the thuong luong
- Tuyệt đối không hardcode secret hoặc token trong mã nguồn.
- Mọi connector mới phải được đăng ký trong registry và có kiểm thử sức khỏe (health check).

### 1.5. Thu tu rollout connector de xuat
1. **Giai đoạn 1:** GitHub Connector & Local Tool Connectors (Hoàn tất)
2. **Giai đoạn 2:** Google Workspace, Notion, N8n Connectors (Hoàn tất)
3. **Giai đoạn 3:** OpenClaw Web Robot & Autonomous Multi-Factory Hub (Hoàn tất)

## Nguyên tắc UI

- Người dùng chỉ thấy điều cần bấm hoặc trạng thái cần xử lý.
- Nội dung kỹ thuật để trong logs, docs hoặc panel chi tiết mở theo nhu cầu.
- Không đưa nguyên câu giao việc cho AI vào giao diện app.
- Mỗi connector chỉ cần tên, trạng thái, mục đích ngắn và hành động chính.

