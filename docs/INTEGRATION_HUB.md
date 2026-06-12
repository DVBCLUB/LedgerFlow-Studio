# LedgerFlow Integration Hub

Mục tiêu: biến LedgerFlow Studio thành **trung tâm đầu mối kết nối với các phần mềm/nền tảng hiện có trên thị trường**, thay vì tự xây lại mọi thứ từ đầu.

LedgerFlow sẽ đóng vai trò:

- Trung tâm nghiệp vụ kế toán / vận hành / chứng từ.
- Bộ não AI điều phối, phân tích, tạo checklist, tạo prompt, đọc lỗi, đề xuất hành động.
- Hub kết nối dữ liệu giữa các nền tảng.
- Lớp kiểm soát bảo mật, quyền truy cập, nhật ký và phê duyệt.

Không biến LedgerFlow thành bản sao của VS Code, GitHub, Google Drive, MISA hay SmartPro. LedgerFlow chỉ cần biết **kết nối, điều phối, đồng bộ, kiểm soát và tự động hóa**.

---

## 0. Integration Hub trong app

Đã có màn hình trong app:

```text
Nút nổi: Integration Hub
Hash mở nhanh: #/integration_hub hoặc #/integration-hub
```

### V1 đã có

- Hiển thị các nhóm connector chính: AI Gateway, GitHub, VS Code/Cursor, Google Workspace, MISA/SmartPro, Document Vault, Automation, Data Hub.
- Có nút mở nhanh sang GitHub repo, GitHub Actions, Issues, AI Gateway.
- Có lộ trình v1 → v5 để phát triển connector thật.

### V2 đã có nền móng registry thật

Integration Hub không còn chỉ là card tĩnh. Backend có registry local để lưu trạng thái connector:

```text
server/services/integrationRegistry.ts
src/utils/integrationHubApi.ts
src/components/IntegrationHub.tsx
```

File local runtime, không commit GitHub:

```text
integration_registry.json
integration_events.log.json
```

API kỹ thuật:

```text
GET    /api/integrations
PATCH  /api/integrations/:id
POST   /api/integrations/:id/test
POST   /api/integrations/:id/events
GET    /api/integrations/events
DELETE /api/integrations/events
```

V2 hiện làm an toàn:

- Bật/tắt connector.
- Test connector.
- Lưu trạng thái và thông báo lần test gần nhất.
- Ghi event log local.
- Chưa tự ghi/sửa/xóa dữ liệu ngoài.

---

## 1. Nguyên tắc kiến trúc

### 1.1. Hub, không phải clone

Sai hướng:

```text
LedgerFlow = tự làm lại GitHub + VS Code + Google Drive + CRM + ERP + kế toán + AI IDE
```

Đúng hướng:

```text
LedgerFlow = trung tâm điều phối
GitHub = kho code, issue, PR, CI
VS Code/Cursor = nơi code sâu
Google Sheets/Drive = dữ liệu, chứng từ, cộng tác
Email/Calendar = luồng công việc văn phòng
MISA/SmartPro = hệ thống kế toán/legacy nếu doanh nghiệp đang dùng
AI Gateway = lớp AI nội bộ fallback nhiều provider/key
Zapier/Make/n8n = automation bên ngoài nếu cần
```

### 1.2. Connector-first

Mọi tích hợp đều đi qua connector chuẩn:

```text
Provider → Connector → Capability → Action → Audit Log → Approval
```

Ví dụ:

```text
GitHub → GitHubConnector → createIssue/readCI/openPR → log → user approval
Google Drive → DriveConnector → listFiles/uploadDoc/syncFolder → log → user approval
SmartPro → SmartProConnector → export/import/report bridge → log → user approval
```

### 1.3. Không cho AI hành động nguy hiểm tự động

AI được phép:

- Phân tích.
- Đề xuất.
- Tạo task.
- Tạo prompt.
- Tạo draft.
- Tạo patch nháp.
- Gợi ý mapping dữ liệu.

AI không được tự động:

- Xóa file.
- Push code lên main.
- Gửi email thật.
- Commit secret.
- Thanh toán tiền.
- Xóa chứng từ.
- Ghi đè dữ liệu kế toán.

Các hành động ghi/sửa/xóa phải có nút **Duyệt / Từ chối**.

---

## 2. Các nhóm tích hợp cần có

### 2.1. AI Provider Hub

Đã có nền móng:

- Gemini
- Groq
- OpenRouter
- Claude / Anthropic
- Ollama local
- LiteLLM optional fallback
- Encrypted AI Vault
- Passphrase lock
- Auto-lock
- Backup/import key
- Usage log
- Diagnostics / Preflight

Mục tiêu tiếp theo:

- Chuẩn hóa AI Gateway thành connector chính thức.
- Phân loại model theo nhiệm vụ:
  - quick: tác vụ nhẹ
  - pro: phân tích nặng
  - code: lập trình
  - audit: kiểm tra kế toán/kiểm toán
  - document: đọc chứng từ

### 2.2. DevOps / Software Hub

Kết nối:

- GitHub
- GitHub Issues
- GitHub Pull Requests
- GitHub Actions
- VS Code
- Cursor
- Copilot
- Claude Code / Gemini Code Assist / Codex nếu dùng riêng

LedgerFlow làm:

- Tạo yêu cầu phát triển.
- AI chuyển yêu cầu thành spec.
- AI tạo checklist test.
- AI tạo prompt chuẩn cho Cursor/VS Code.
- Tạo GitHub Issue.
- Đọc CI xanh/đỏ.
- Phân tích log lỗi.
- Tạo release checklist.

Không cần clone VS Code trong app ở v1.

### 2.3. Google Workspace Hub

Kết nối:

- Google Sheets
- Google Drive
- Gmail
- Google Calendar
- Google Contacts

Ứng dụng:

- Đồng bộ file chi phí công trường.
- Kéo chứng từ từ Drive.
- Tạo báo cáo sếp từ Google Sheets.
- Gửi email draft, không gửi tự động nếu chưa duyệt.
- Lịch nhắc hạn thanh toán, hạn hoàn ứng, hạn hợp đồng.

### 2.4. Accounting / ERP Legacy Hub

Kết nối hoặc bán tự động với:

- MISA
- SmartPro
- Fast Accounting
- Excel import/export
- XML hóa đơn điện tử
- CSV ngân hàng
- PDF chứng từ

Thực tế với phần mềm cũ như SmartPro:

- Nếu có database/API: làm connector trực tiếp.
- Nếu không có API: làm bridge bằng Excel/CSV/import template.
- Nếu bắt ghi tay: dùng OCR/nhập nhanh/soát lỗi để hỗ trợ, không thay thế quy trình bắt buộc.

### 2.5. Document / Evidence Hub

Kết nối:

- Folder local
- Google Drive
- OneDrive nếu cần
- PDF invoice
- XML invoice
- Ảnh phiếu nhập kho
- Hợp đồng / đề nghị thanh toán / bảng kê

LedgerFlow làm:

- Quản lý hồ sơ chứng từ.
- Gắn chứng từ vào khoản chi.
- Tự kiểm tra thiếu file.
- Tạo checklist hồ sơ thanh toán.
- AI đọc chứng từ và gợi ý phân loại.

### 2.6. Automation Hub

Kết nối:

- n8n
- Make
- Zapier
- Webhook custom

Nguyên tắc:

- Automation phải chạy qua trigger/action rõ ràng.
- Hành động ghi dữ liệu/gửi mail phải có chế độ duyệt.
- Mọi automation phải ghi log và có cách tắt nhanh.
