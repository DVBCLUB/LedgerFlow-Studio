# Chạy LedgerFlow Studio trên Windows

LedgerFlow Studio là **phần mềm mô phỏng / học / lab**, không phải phần mềm kế toán vận hành thật để thay MISA/FAST/SmartPro.

## Người dùng cuối nên dùng bản cài đặt

Nếu mục tiêu là tải về như phần mềm bình thường, hãy build hoặc tải file `.exe` installer, sau đó cài đặt và mở bằng shortcut **LedgerFlow Hub**.

File build installer ở thư mục gốc:

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Sau khi build xong, file `.exe` nằm trong:

```text
release/
```

## Chạy dev local bằng CMD

Cách này chỉ dành cho người sửa code/test nhanh.

1. Cài **Node.js LTS** nếu máy chưa có.
2. Giải nén project.
3. Bấm file dev trong:

```text
tools/windows/RUN_LOCAL_DEV.bat
```

Hoặc chạy terminal tại thư mục gốc:

```bash
npm install
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

## Đóng bản dev local

Đóng cửa sổ terminal hoặc bấm:

```text
Ctrl + C
```

rồi bấm `Y`.

## Lưu ý

- Các module là mô phỏng: học nghiệp vụ, thử tình huống, calculator, checklist, prompt lab.
- Không dùng để nhập dữ liệu kế toán thật thay phần mềm kế toán chính thức.
- Các phần AI/Gemini có thể cần `GEMINI_API_KEY`, nhưng nhiều module vẫn chạy offline bằng dữ liệu mô phỏng.
