# LedgerFlow Hub — Release Readiness Checklist

Mục tiêu của checklist này là tránh nhầm **source ZIP** với **bản cài đặt Windows `.exe`**.

## 1. Không phát hành source ZIP cho người dùng cuối

Nút GitHub **Code → Download ZIP** chỉ tải mã nguồn. File ZIP này sẽ có các thư mục như:

- `src/`
- `desktop/`
- `scripts/`
- `package.json`
- `server.ts`

Đó không phải phần mềm cài đặt.

## 2. Bản đúng cho người dùng cuối

Người dùng cuối chỉ nên tải file `.exe` từ:

1. GitHub Actions artifact: `LedgerFlow-Hub-Windows-Setup`
2. GitHub Releases: file `LedgerFlow-Hub-...exe`

## 3. Điều kiện trước khi gửi cho người khác

Trước khi gửi bản `.exe`, kiểm tra:

- Workflow **Build LedgerFlow Hub Windows Setup** chạy xanh.
- Artifact `LedgerFlow-Hub-Windows-Setup` có ít nhất một file `.exe`.
- Cài được trên Windows bằng double click.
- Sau khi cài có shortcut **LedgerFlow Hub** ngoài Desktop hoặc Start Menu.
- Mở app không cần CMD, Node.js hoặc npm.
- Bấm **Labs → Start Here** mở được.
- Các tab quan trọng mở được: Company OS, Game Library, Game Progress, Game History, Backup / Restore.
- Trước khi update bản mới, vào **Backup / Restore** xuất JSON.

## 4. Build local nếu Actions chưa có artifact

Trong source folder, chạy:

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Sau khi chạy xong, file `.exe` nằm trong:

```txt
release/
```

## 5. Không đổi cấu trúc lõi khi chỉ phát hành

Không sửa/xóa các thư mục sau nếu chỉ muốn build release:

- `src/`
- `desktop/`
- `build/`
- `scripts/`
- `public/`
- `.github/workflows/`
