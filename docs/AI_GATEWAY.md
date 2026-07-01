# AI Gateway — nhập nhiều API key, fallback tự động

Tài liệu này mô tả cách dùng hệ thống AI Gateway mới của LedgerFlow Studio.

## Mục tiêu

LedgerFlow Studio không còn bắt buộc người dùng phải sửa `.env` trên từng máy. Người dùng có thể mở phần mềm, vào màn hình AI Gateway, nhập nhiều API key của nhiều provider khác nhau và để hệ thống tự fallback khi hết quota.

Ví dụ:

```text
Gemini key tài khoản 1
Gemini key tài khoản 2
Gemini key tài khoản 3
Groq key 1
OpenRouter key 1
Claude key 1
Ollama local
```

Khi key đầu tiên bị quota/rate limit, router sẽ chuyển sang key/provider tiếp theo theo thứ tự priority.

## Mở màn hình cấu hình AI

Sau khi chạy app:

```bash
npm run dev
```

Mở app tại:

```text
http://127.0.0.1:3000
```

Cách mở AI Gateway:

1. Bấm nút nổi **AI Gateway** ở góc phải dưới app.
2. Hoặc mở trực tiếp:

```text
http://127.0.0.1:3000/#/ai_settings
```

Trang HTML dự phòng vẫn còn:

```text
http://127.0.0.1:3000/ai-settings.html
```

## Provider được hỗ trợ

| Provider | Key bắt buộc | Ghi chú |
|---|---:|---|
| Gemini | Có | Có thể nhập nhiều key từ nhiều tài khoản Gemini khác nhau |
| Groq | Có | OpenAI-compatible API, phù hợp fallback free tier |
| OpenRouter | Có | Dùng các model free hoặc paid tùy key |
| Anthropic Claude | Có | Dùng Claude API key riêng |
| Ollama | Không | Chạy local, cần cài Ollama và pull model trước |
| LiteLLM proxy | Tùy chọn | Chỉ là fallback tương thích, không còn bắt buộc |

## Priority hoạt động như thế nào?

Số priority càng nhỏ thì chạy càng trước.

Ví dụ đề xuất:

```text
Gemini acc 1        priority 1
Gemini acc 2        priority 2
Gemini acc 3        priority 3
Groq                priority 10
OpenRouter          priority 20
Claude              priority 30
Ollama              priority 99
```

Nếu `Gemini acc 1` hết quota, hệ thống đánh dấu quota/error rồi thử `Gemini acc 2`.

## Test key

Trong AI Gateway:

1. Chọn provider.
2. Dán API key.
3. Bấm **Test**.
4. Nếu ổn thì bấm lưu.

Hệ thống chỉ trả về trạng thái, latency và thông báo lỗi; không hiển thị key thật ra giao diện sau khi lưu.

## AI Vault và mật khẩu chủ

AI Gateway lưu API key trong backend local, không lưu trong React `localStorage`. Mặc định vault dùng mã hóa local tự động bằng file `.ledgerflow_secret`.

Nếu muốn bảo vệ mạnh hơn, mở AI Gateway và dùng khối **Bảo mật AI Vault**:

1. Nhập mật khẩu chủ ít nhất 8 ký tự.
2. Bấm **Bật mật khẩu chủ**.
3. Hệ thống sẽ giải mã các key cũ rồi mã hóa lại toàn bộ bằng mật khẩu chủ.

Khi vault ở chế độ mật khẩu chủ:

```text
Đang khóa  → app không giải mã key và không gọi AI được bằng key local
Mở khóa    → app dùng key bình thường cho tới khi khóa lại, restart server, hoặc auto-lock hết giờ
```

### Auto-lock AI Vault

Khi đã bật mật khẩu chủ, AI Gateway có thể tự khóa vault sau một thời gian không dùng. Trong khối **Bảo mật AI Vault**, chỉnh mục **Tự khóa vault**:

```text
Số phút không dùng: 30
Bật / lưu auto-lock
```

Mỗi lần gọi AI, diagnostics, thêm/sửa key, export/import backup, bộ đếm sẽ được gia hạn. Hết thời gian không hoạt động, backend tự gọi khóa vault để không giữ mật khẩu trong RAM quá lâu.

Endpoint kỹ thuật:

```text
GET   /api/ai/vault/status
POST  /api/ai/vault/passphrase
POST  /api/ai/vault/unlock
POST  /api/ai/vault/lock
GET   /api/ai/vault/auto-lock
PATCH /api/ai/vault/auto-lock
```

Lưu ý: nếu quên mật khẩu chủ thì không thể mở lại key trong vault. Khi đó dùng file backup mã hóa đã export trước đó, hoặc nhập key lại từ đầu.

## Diagnostics toàn bộ provider

Bấm **Kiểm tra tất cả provider** để kiểm tra toàn bộ key đang lưu.

Kết quả có các trạng thái:

```text
ok      = dùng được
quota   = hết quota/rate limit
timeout = không phản hồi hoặc chậm
error   = lỗi key/provider/model
```

## Nhật ký sử dụng AI

AI Gateway có log local để biết request vừa rồi đi qua provider/key nào.

Log có thể hiển thị:

```text
provider
label của key
model
kiểu gọi: call / stream / diagnostic / test
trạng thái: ok / quota / error
latency
độ dài prompt/output
```

Log không lưu API key thật.

File log local:

```text
runtime/ai_usage.log.json
```

File này đã được `.gitignore` chặn, không commit lên GitHub.

## Backup / chuyển máy

Vì người dùng không dùng một máy cố định, AI Gateway hỗ trợ export/import cấu hình key.

### Máy A — xuất backup

1. Mở AI Gateway.
2. Nhập mật khẩu backup ít nhất 8 ký tự.
3. Bấm tải file backup mã hóa.
4. Lưu file `.backup.json`.

### Máy B — import backup

1. Cài/chạy LedgerFlow Studio.
2. Mở AI Gateway.
3. Chọn file backup.
4. Nhập đúng mật khẩu.
5. Chọn `merge` hoặc `replace`.
6. Bấm import.

Chế độ import:

| Chế độ | Ý nghĩa |
|---|---|
| merge | Gộp key trong backup vào danh sách hiện tại |
| replace | Xóa danh sách hiện tại rồi nhập backup |

## Bảo mật local

Key được lưu ở backend local, không lưu trong React `localStorage`.

Các file nhạy cảm local:

```text
runtime/ai_keys.vault.json
runtime/.ledgerflow_secret
runtime/.ai_vault_session.json
runtime/ai_usage.log.json
```

Các file này đã được `.gitignore` chặn.

Cơ chế hiện tại:

```text
React UI nhập key
→ Express backend nhận key
→ backend mã hóa bằng AES-256-GCM
→ ghi vào runtime/ai_keys.vault.json
→ frontend chỉ thấy key dạng mask
```

Nếu bật mật khẩu chủ, khóa mã hóa vault được dẫn xuất từ mật khẩu bằng `scrypt` và chỉ giữ trong RAM của process server sau khi mở khóa.

## LiteLLM còn dùng không?

LiteLLM vẫn có thể dùng như fallback tương thích nếu bạn muốn, nhưng không còn là bắt buộc.

Luồng mới khuyến nghị:

```text
AI Gateway trong Express
→ Gemini/Groq/OpenRouter/Claude/Ollama
→ fallback tự động theo priority
```

LiteLLM proxy chỉ còn là lựa chọn nâng cao.

## Lệnh kiểm tra code

Trước khi build hoặc push:

```bash
npm run lint
npm run build
```

GitHub Actions cũng đã được thêm để tự kiểm tra khi push/pull request.
