# LedgerFlow Studio

LedgerFlow Studio là **phần mềm mô phỏng / học / lab** cho kế toán, dữ liệu, AI, kiểm toán nội bộ, growth và triển khai sản phẩm.

Nó **không phải** phần mềm kế toán vận hành thật để thay MISA/FAST/SmartPro, không dùng để nhập chứng từ thật và không tự quyết định hạch toán/thuế. Các module dùng để học, mô phỏng tình huống, thử calculator, checklist, prompt lab và case study.

## Chạy trên Windows

Cách nhanh nhất: bấm đúp file:

```bat
RUN_LOCAL.bat
```

File này sẽ tự cài thư viện nếu chưa có và chạy app local.

Khi terminal hiện `Server running on http://0.0.0.0:3000`, mở:

```text
http://localhost:3000
```

Nếu không vào được, thử:

```text
http://127.0.0.1:3000
```

Xem hướng dẫn chi tiết trong:

```text
README_RUN_WINDOWS.md
```

## Build desktop Windows

Bấm đúp:

```bat
BUILD_DESKTOP_WINDOWS.bat
```

Nếu thành công, file `.exe` sẽ nằm trong thư mục:

```text
release/
```

## Chạy thủ công bằng terminal

**Prerequisites:** Node.js LTS

```bash
npm install
npm run dev
```

Sau đó mở `http://localhost:3000`.

## Ghi chú AI

Một số module AI/Gemini cần `GEMINI_API_KEY` hoặc `PMSTUDY`, nhưng nhiều module vẫn chạy bằng dữ liệu mô phỏng/offline.
