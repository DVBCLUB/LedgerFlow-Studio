# Chạy LedgerFlow Studio trên Windows

LedgerFlow Studio là **phần mềm mô phỏng / học / lab**, không phải phần mềm kế toán vận hành thật để thay MISA/FAST/SmartPro.

## Cách chạy nhanh nhất

1. Cài **Node.js LTS** nếu máy chưa có.
2. Giải nén project.
3. Bấm đúp file:

```bat
RUN_LOCAL.bat
```

File này sẽ tự kiểm tra `node_modules`. Nếu chưa có, nó chạy `npm install`, sau đó chạy:

```bash
npm run dev
```

Khi terminal hiện dòng tương tự:

```text
Server running on http://0.0.0.0:3000
```

thì mở trình duyệt tại:

```text
http://localhost:3000
```

Nếu không vào được, thử:

```text
http://127.0.0.1:3000
```

Lưu ý: cửa sổ terminal phải để mở khi đang dùng app. Dòng `npm warn deprecated` hoặc `npm audit` là cảnh báo thư viện, không phải lỗi làm app không chạy.

## Đóng phần mềm

Đóng cửa sổ terminal hoặc bấm:

```text
Ctrl + C
```

rồi bấm `Y`.

## Build thành app desktop Windows

Bấm đúp:

```bat
BUILD_DESKTOP_WINDOWS.bat
```

Nếu build thành công, file `.exe` nằm trong thư mục:

```text
release/
```

## Lưu ý

- Các module là mô phỏng: học nghiệp vụ, thử tình huống, calculator, checklist, prompt lab.
- Không dùng để nhập dữ liệu kế toán thật thay phần mềm kế toán chính thức.
- Các phần AI/Gemini có thể cần `GEMINI_API_KEY`, nhưng nhiều module vẫn chạy offline bằng dữ liệu mô phỏng.
