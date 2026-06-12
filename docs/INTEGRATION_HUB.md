# LedgerFlow Integration Hub

Mục tiêu: biến LedgerFlow Studio thành **trung tâm đầu mối kết nối với các phần mềm/nền tảng hiện có trên thị trường**, thay vì tự xây lại mọi thứ từ đầu.

LedgerFlow sẽ đóng vai trò:

- Trung tâm nghiệp vụ kế toán / vận hành / chứng từ.
- Bộ não AI điều phối, phân tích, tạo checklist, tạo prompt, đọc lỗi, đề xuất hành động.
- Hub kết nối dữ liệu giữa các nền tảng.
- Lớp kiểm soát bảo mật, quyền truy cập, nhật ký và phê duyệt.

Không biến LedgerFlow thành bản sao của VS Code, GitHub, Google Drive, MISA hay SmartPro. LedgerFlow chỉ cần biết **kết nối, điều phối, đồng bộ, kiểm soát và tự động hóa**.

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

- n8n self-host/free
- Make
- Zapier
- Webhook
- Local scripts

LedgerFlow làm:

- Nhận webhook.
- Gửi webhook.
- Chạy automation có kiểm soát.
- Log toàn bộ hành động.

---

## 3. Kiến trúc kỹ thuật đề xuất

### 3.1. Connector Registry

Tạo registry quản lý connector:

```ts
export interface IntegrationConnector {
  id: string;
  name: string;
  category: 'ai' | 'devops' | 'workspace' | 'accounting' | 'storage' | 'automation';
  status: 'available' | 'configured' | 'error' | 'disabled';
  capabilities: IntegrationCapability[];
}
```

### 3.2. Capability chuẩn

```ts
export interface IntegrationCapability {
  id: string;
  label: string;
  type: 'read' | 'write' | 'sync' | 'analyze' | 'export' | 'import';
  requiresApproval: boolean;
}
```

### 3.3. Action log chuẩn

```ts
export interface IntegrationActionLog {
  id: string;
  connectorId: string;
  action: string;
  status: 'draft' | 'approved' | 'success' | 'error';
  createdAt: string;
  summary: string;
  error?: string;
}
```

### 3.4. Approval layer

Mọi action nguy hiểm đi qua approval:

```text
AI đề xuất → tạo action draft → user duyệt → connector chạy → ghi log
```

---

## 4. Lộ trình triển khai

### Giai đoạn 1 — Integration Hub shell

Mục tiêu: tạo trung tâm điều phối, chưa cần kết nối thật hết.

Làm:

- Trang Integration Hub trong app.
- Danh sách connector theo nhóm.
- Trạng thái: chưa cấu hình / đã cấu hình / lỗi.
- Nút mở GitHub, VS Code, AI Gateway, docs.
- Lưu cấu hình connector local.
- Audit log cơ bản.

Connector v1:

- AI Gateway
- GitHub
- VS Code/Cursor handoff
- Google Workspace placeholder
- Accounting/Excel placeholder
- Automation/Webhook placeholder

### Giai đoạn 2 — DevOps connector thật

Làm:

- Cấu hình repo GitHub.
- Tạo GitHub Issue từ yêu cầu.
- Đọc trạng thái Actions.
- Đọc log lỗi CI.
- AI phân tích lỗi.
- Tạo prompt cho Cursor/VS Code.

### Giai đoạn 3 — Workspace connector

Làm:

- Google Drive/Sheets/Gmail/Calendar ở mức bán tự động.
- Tạo link chứng từ.
- Tạo draft email.
- Nhắc hạn hoàn ứng/thanh toán.

### Giai đoạn 4 — Accounting bridge

Làm:

- Import/export Excel/CSV.
- Template cho SmartPro/MISA nếu không có API.
- Mapping cột.
- Kiểm tra lỗi trước khi import.

### Giai đoạn 5 — Automation marketplace

Làm:

- Webhook inbound/outbound.
- n8n/Make/Zapier recipe.
- Action approval.
- Scheduler.

---

## 5. Ưu tiên v1 nên build ngay

### Màn hình: Integration Hub

Các card:

1. AI Gateway
2. GitHub
3. VS Code / Cursor
4. Google Workspace
5. Accounting / SmartPro / MISA
6. Document Storage
7. Automation / Webhook

Mỗi card có:

- Trạng thái.
- Mô tả.
- Nút cấu hình.
- Nút test kết nối.
- Nút mở nhanh.
- Capability list.

### Màn hình: DevOps Control

Các chức năng v1:

- Nhập yêu cầu phát triển.
- AI tạo spec/checklist/prompt.
- Copy prompt cho Cursor/VS Code.
- Tạo GitHub Issue.
- Mở GitHub Actions.

---

## 6. Quy tắc bảo mật

- Không lưu token/key ở frontend localStorage nếu có quyền ghi/sửa/xóa.
- Key/token phải đi qua encrypted vault.
- Log không được chứa secret.
- Action nguy hiểm phải cần duyệt.
- Không tự động gửi email, push code, xóa chứng từ hoặc sửa dữ liệu kế toán khi chưa xác nhận.
- Có danh sách file/endpoint nhạy cảm không cho AI sửa nếu chưa xác nhận.

---

## 7. Tên module đề xuất

Tên chính:

```text
LedgerFlow Integration Hub
```

Tên phụ:

```text
DevOps Center
Workspace Center
Accounting Bridge
Automation Center
Document Hub
AI Gateway
```

---

## 8. Đích đến dài hạn

LedgerFlow không chỉ là phần mềm kế toán. Nó là:

```text
Operating System nội bộ cho công ty nhỏ
```

Tức là một màn hình trung tâm để:

- Quản lý tiền.
- Quản lý chứng từ.
- Quản lý công việc.
- Quản lý AI.
- Quản lý code/phần mềm.
- Quản lý kết nối dữ liệu.
- Quản lý báo cáo.
- Quản lý tự động hóa.

Các phần mềm khác vẫn tồn tại, LedgerFlow chỉ đứng giữa để điều phối và kiểm soát.