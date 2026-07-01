# Unified Audit Log

LedgerFlow Studio là Company OS cho solo founder + AI workforce, nên mọi hành động có rủi ro cần để lại dấu vết kiểm toán. File này mô tả lớp audit log chung vừa thêm cho backend.

## Runtime file

Backend ghi audit event vào file runtime local:

```text
runtime/ledgerflow_audit.log.json
```

File này đã được đưa vào `.gitignore`, không commit lên GitHub.

## Service

Service nằm tại:

```text
server/services/auditLog.ts
```

Các hàm chính:

- `appendAuditEvent(input)` — thêm một audit event mới.
- `readAuditEvents(limit)` — đọc các event gần nhất.
- `integrationLevelToAuditRisk(level)` — map level của Integration Hub sang risk.
- `integrationTypeToAuditStatus(type, level)` — map event type sang trạng thái audit.

## Schema tối thiểu

Mỗi audit event có các trường:

- `actor`: founder, ai-agent, system hoặc connector.
- `workspace`: nơi phát sinh hành động, ví dụ Integration Hub, AgentOps, Product Factory.
- `action`: loại hành động.
- `target`: đối tượng bị tác động.
- `risk`: LOW, MEDIUM, HIGH, BLOCKED.
- `status`: planned, sandbox, pending_approval, approved, rejected, executed, failed.
- `summary`: mô tả ngắn.
- `evidence`: bằng chứng phụ, ví dụ id event, level, type.
- `approvalId` hoặc `connectorId` nếu có.

## Kết nối hiện tại

`server/services/integrationRegistry.ts` đã mirror mọi `appendIntegrationEvent(...)` sang audit log chung. Điều này giúp các thao tác test connector, config connector, handoff GitHub/local tool đều có dấu vết trong `runtime/ledgerflow_audit.log.json`.

## Nguyên tắc mở rộng tiếp theo

Khi thêm Tool Card hoặc AI action mới:

1. Low risk: ghi audit với `status: sandbox`.
2. Medium/High risk: tạo approval request trước, ghi audit với `status: pending_approval`.
3. Sau khi founder duyệt: ghi `approved` hoặc `rejected`.
4. Khi action chạy thật: ghi `executed` hoặc `failed`.
5. Không ghi API key, token, mật khẩu, nội dung file nhạy cảm vào `summary` hoặc `evidence`.

## Ranh giới sản phẩm

Audit log này phục vụ mô phỏng, kiểm soát nội bộ và vận hành Company OS. Nó không biến LedgerFlow thành ERP kế toán chính thức và không thay thế hệ thống chứng từ/phê duyệt pháp lý của doanh nghiệp.
