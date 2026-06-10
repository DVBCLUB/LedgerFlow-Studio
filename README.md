# LedgerFlow Studio

LedgerFlow Studio là phần mềm mô phỏng / học / lab cho kế toán, dữ liệu, AI, kiểm toán nội bộ, growth và triển khai sản phẩm.

## Dùng như phần mềm Windows

Bấm file ở thư mục gốc:

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Build xong, mở thư mục:

```text
release/
```

Bấm file `.exe` để cài **LedgerFlow Hub**.

## Chạy dev local

Dành cho người sửa code/test:

```text
tools/windows/RUN_LOCAL_DEV.bat
```

Hoặc:

```bash
npm install
npm run dev
```

Rồi mở `http://localhost:3000`.

## Tài liệu

Tài liệu chi tiết đã gom vào thư mục:

```text
docs/
```

Script phụ đã gom vào:

```text
tools/windows/
```

## Cấu trúc không nên đổi tùy tiện

- `src/`: giao diện, module, mô phỏng, dashboard
- `desktop/`: app desktop Electron
- `build/`: icon/logo và asset đóng gói
- `scripts/`: kiểm tra build/CI
- `server.ts`: server local/API
- `package.json`: cấu hình build và installer

Mục tiêu là giữ nguyên phần mềm hiện tại, chỉ gom tài liệu và script phụ cho thư mục gốc dễ nhìn hơn.
