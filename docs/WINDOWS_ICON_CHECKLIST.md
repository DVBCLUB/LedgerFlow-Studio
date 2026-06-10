# Windows icon checklist

Mục tiêu: bản tải về phải nhìn giống phần mềm Windows thật, không phải app dev chạy CMD.

## Icon files

LedgerFlow desktop build dùng các file sau:

- `build/logo.svg`: logo nguồn, dễ chỉnh bằng SVG.
- `build/icon.ico`: icon Windows thật, được tạo bởi `npm run prepare:icons`.

## Nơi icon được dùng

`package.json` đang cấu hình electron-builder dùng:

- `build.win.icon = build/icon.ico`
- `build.nsis.installerIcon = build/icon.ico`
- `build.nsis.uninstallerIcon = build/icon.ico`

`desktop/main.cjs` cũng đặt icon cho cửa sổ app bằng `build/icon.ico` khi file này tồn tại.

## Cách kiểm tra sau khi build

Chạy:

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Sau khi build xong, mở thư mục:

```txt
release
```

Kiểm tra:

1. File installer `LedgerFlow-Hub-...exe` có icon LedgerFlow không.
2. Bấm cài đặt, shortcut Desktop có icon LedgerFlow không.
3. Start Menu có icon LedgerFlow không.
4. Khi mở app, icon trên taskbar/cửa sổ có icon LedgerFlow không.

## Nếu Windows vẫn hiện icon trắng

Windows đôi khi cache icon cũ. Thử:

1. Đổi tên file `.exe` hoặc build lại bản mới.
2. Xóa bản cài cũ rồi cài lại.
3. Restart Windows Explorer hoặc restart máy.

## Lưu ý

Logo không phải chữ ký số. Nếu chưa code-sign, Windows SmartScreen vẫn có thể cảnh báo ứng dụng không rõ nhà phát hành dù icon đã đúng.
