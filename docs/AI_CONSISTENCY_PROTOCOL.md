# AI Consistency Protocol (Giao thức Nhất quán Liên AI)

> ⚠️ **BẮT BUỘC đọc** trước khi thực hiện bất kỳ thay đổi code nào.
> Áp dụng cho: Gemini, Claude, GPT, Copilot, Cursor, và mọi AI coding agent khác.

---

## 1. Vấn đề (Problem Statement)

Mỗi AI model có "bản năng code" khác nhau:
- **Gemini**: Thích xây mới, tạo kiến trúc lớn
- **Claude**: Thích đơn giản hóa, gộp file, xóa code "thừa"
- **GPT**: Thích đổi tên, refactor theo chuẩn riêng
- **Copilot**: Thích inline, ít cấu trúc

Kết quả: AI sau xóa / đổi tên / refactor code của AI trước, gây **xáo trộn codebase liên tục**.

---

## 2. Nguyên tắc Vàng (Golden Rules)

### Rule #1: KHÔNG xóa code của AI khác
- Nếu thấy code không quen thuộc, KHÔNG cho rằng nó "chết" hoặc "vô dụng".
- Code đó có thể do AI khác tạo ra với mục đích cụ thể.
- **Hành động**: ĐỌC tài liệu và HỎI người dùng trước khi xóa.

### Rule #2: KHÔNG đổi tên file / component / biến
- Tên đã đặt có lý do của nó.
- Đổi tên = phá vỡ import, routing, và mọi AI sau sẽ không tìm thấy code.
- **Ngoại lệ**: Chỉ đổi tên nếu người dùng yêu cầu cụ thể.

### Rule #3: Thay đổi NHỎ, có thể review
- Mỗi lần thay đổi: tối đa 3-5 file.
- Nếu cần thay đổi >5 file → chia thành nhiều bước, mỗi bước có thể review riêng.
- **Cấm**: "Refactor toàn bộ module", "Restructure project", "Clean up architecture".

### Rule #4: Giữ lại code cũ ít nhất 1 bước
- Khi thay đổi, luôn giữ code cũ comment lại hoặc backup.
- Nếu AI sau muốn revert → có thể dễ dàng khôi phục.

### Rule #5: ƯU TIÊN BẢN WINDOWS & LUÔN ĐÓNG GÓI DESKTOP
- Mọi lần nâng cấp, sửa đổi, kiểm tra PHẢI ưu tiên chạy trên môi trường **Windows Desktop**.
- Sau khi code và build xong (`npm run build`), **BẮT BUỘC chạy đóng gói `npm run desktop:pack`** để làm mới file chạy `release\win-unpacked\LedgerFlow Hub.exe`.

### Rule #6: TÀI KHOẢN OWNER DUY NHẤT LÀ DAVID BAO
- Luôn sử dụng tài khoản: **`davidbao1704@gmail.com`** (mật khẩu: `admin123`).
- Tuyệt đối KHÔNG sử dụng các email demo/cũ khi đăng nhập hoặc test tự động.

### Rule #7: LUÔN chạy build trước và sau
- Trước khi thay đổi: `npm run build` (biết trạng thái hiện tại)
- Sau khi thay đổi: `npm run build` và `npm run desktop:pack` (xác nhận không hỏng và đóng gói Windows)
- Nếu build lỗi: sửa lỗi build trước, KHÔNG xóa code gây lỗi.

---

## 3. Quy trình Chuẩn (Standard Workflow)

```
BƯỚC 1: ĐỌC tài liệu
   ├── AGENTS.md (bắt buộc)
   ├── docs/GLACIA_STANDARDS.md (nếu liên quan đến Glacia)
   ├── docs/AI_CONSISTENCY_PROTOCOL.md (chính tài liệu này)
   └── docs/PROJECT_STRUCTURE.md (hiểu cấu trúc)

BƯỚC 2: XÁC ĐỊNH mục tiêu
   - Chính xác file nào cần thay đổi?
   - Thay đổi gì? (thêm/tối giản/sửa lỗi?)
   - AI nào đã làm việc này trước đây? (nếu có session history)

BƯỚC 3: KIỂM TRA build hiện tại
   > npm run build
   - Nếu lỗi: báo cáo người dùng, KHÔNG tự ý sửa nếu không phải nhiệm vụ

BƯỚC 4: THỰC HIỆN thay đổi
   - Thay đổi NHỎ NHẤT có thể
   - KHÔNG chạm vào file không liên quan
   - KHÔNG đổi tên / xóa code không hiểu

BƯỚC 5: KIỂM TRA build sau thay đổi
   > npm run build

BƯỚC 6: BÁO CÁO
   - File nào đã thay đổi
   - Thay đổi gì (tóm tắt 1-2 dòng)
   - Build có pass không
   - AI agent nào thực hiện (tên model + phiên bản)
```

---

## 4. Handoff Protocol (Bàn giao giữa các AI)

Khi kết thúc phiên làm việc, AI PHẢI ghi lại:

```markdown
## AI Handoff Note

**AI Agent:** [Tên AI + phiên bản, VD: Claude 3.5 Sonnet, Gemini 2.5 Pro]
**Ngày:** [YYYY-MM-DD HH:MM]
**Nhiệm vụ:** [Mô tả ngắn gọn]

### Files đã thay đổi
- `path/to/file.tsx` — [mô tả thay đổi]
- `path/to/file.ts` — [mô tả thay đổi]

### Files đã tạo mới
- `path/to/new-file.tsx` — [mô tả]

### Trạng thái build
- [ ] Build pass (kiểm tra bằng npm run build)
- [ ] Build lỗi (ghi rõ lỗi)

### Lưu ý cho AI tiếp theo
- [Điều gì AI sau cần biết]
- [Code nào còn dang dở]
- [Quyết định kiến trúc quan trọng]

### AI Agent Signature
```
[Tên AI] — [YYYY-MM-DD]
```

> **Cách dùng**: Ghi note này vào cuối file đã thay đổi (dạng comment) hoặc vào file `docs/HANDOFF_LOG.md`.

---

## 5. "Don't Delete" List (Danh sách Cấm Xóa)

Những thứ AI KHÔNG được tự ý xóa hoặc vô hiệu hóa:

| Mục | Lý do | Ai đã tạo |
|-----|-------|-----------|
| Glacia components | Trợ lý ảo của người dùng | Gemini |
| AI Gateway (aiClient, aiRouter, aiKeyVault) | Kiến trúc bảo mật đa provider | Nhiều AI |
| Integration Hub | Trung tâm kết nối | Claude |
| Wiring check (`npm run check:wiring`) | Đảm bảo code không "ngủ quên" | Claude |
| Company OS navigation | Cấu trúc điều hướng chính | GPT |

> ⚠️ Nếu muốn thêm mục vào danh sách này → hỏi người dùng.

---

## 6. Conflict Resolution (Giải quyết Xung đột)

Khi AI A và AI B có ý kiến trái ngược:

1. **Dừng lại** — không AI nào tự ý áp đặt
2. **Đọc tài liệu** — GLACIA_STANDARDS.md, AGENTS.md, AI_AGENT_PLAYBOOK.md
3. **Trình bày cả 2 phương án** cho người dùng
4. **Người dùng quyết định** — AI không tự chọn

---

## 7. Cam kết

Mọi AI agent làm việc trên LedgerFlow Studio cam kết:

```
Tôi, [tên AI + phiên bản], cam kết:
1. KHÔNG xóa code không hiểu rõ mục đích
2. KHÔNG đổi tên file/component/biến khi không cần thiết
3. Thay đổi NHỎ, có thể review
4. LUÔN chạy build trước và sau
5. GHI lại handoff note cho AI tiếp theo
```

---

*Tài liệu này có hiệu lực từ ngày tạo. Mọi AI agent truy cập repo đều mặc định chấp nhận.*
