# Lấy file cài đặt LedgerFlow Hub Windows

Mục tiêu: người dùng cuối không cần chạy CMD, không cần Node.js, không cần mở source code.

## Cách chuẩn

1. Vào GitHub repository `DVBCLUB/LedgerFlow-Studio`.
2. Mở tab **Actions**.
3. Chọn workflow **Build LedgerFlow Hub Windows Setup**.
4. Mở lần chạy mới nhất có dấu xanh.
5. Kéo xuống mục **Artifacts**.
6. Tải artifact tên:

```txt
LedgerFlow-Hub-Windows-Setup
```

7. Giải nén artifact đó.
8. Bấm file `.exe` để cài hoặc chạy bản portable.

## File nào là file cài đặt?

Trong artifact có thể có nhiều file. Ưu tiên file `.exe` có chữ setup hoặc tên giống:

```txt
LedgerFlow-Hub-0.1.0-x64.exe
```

Nếu có bản portable, nó cũng là `.exe` nhưng chạy trực tiếp không cần cài.

## Nếu Windows hiện SmartScreen

Do app chưa ký số code-signing certificate nên Windows có thể hiện cảnh báo. Chọn:

```txt
More info -> Run anyway
```

Chỉ dùng file lấy từ GitHub Actions/Release của repo chính.

## Không nên đưa người dùng cuối tải Source code ZIP

Source ZIP là dành cho lập trình/build. Người dùng cuối chỉ nên tải artifact hoặc release `.exe`.
