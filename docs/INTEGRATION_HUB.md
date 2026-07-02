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

## Nguyên tắc UI

- Người dùng chỉ thấy điều cần bấm hoặc trạng thái cần xử lý.
- Nội dung kỹ thuật để trong logs, docs hoặc panel chi tiết mở theo nhu cầu.
- Không đưa nguyên câu giao việc cho AI vào giao diện app.
- Mỗi connector chỉ cần tên, trạng thái, mục đích ngắn và hành động chính.
