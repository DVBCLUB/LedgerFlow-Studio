# Source ZIP khác Windows Setup

Khi bấm nút **Code → Download ZIP** trên GitHub, file tải về là **mã nguồn**. Mã nguồn sẽ có `src/`, `scripts/`, `desktop/`, `package.json` và các file cấu hình. Mã nguồn không chứa sẵn file `.exe`.

File cài đặt Windows chỉ có sau khi build:

1. Build local bằng `BUILD_WINDOWS_INSTALLER.bat`, sau đó lấy `.exe` trong thư mục `release/`.
2. Hoặc tải artifact/release do GitHub Actions tạo ra: `LedgerFlow-Hub-Windows-Setup`.

Người dùng cuối nên tải bản Windows Setup `.exe`, không nên tải source ZIP.
