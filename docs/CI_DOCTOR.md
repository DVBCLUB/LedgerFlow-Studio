# GitHub CI Doctor

GitHub CI Doctor là connector phụ của Integration Hub, dùng để nối 3 phần:

```text
GitHub Actions đỏ → LedgerFlow đọc run/job/step → AI Gateway phân tích → prompt đưa qua VS Code/Cursor
```

## Cách mở

Trong app bấm nút nổi **CI Doctor**, hoặc mở trực tiếp:

```text
http://127.0.0.1:3000/#/ci_doctor
```

Các hash được hỗ trợ:

```text
#/ci_doctor
#/ci-doctor
#/github_ci
```

## Luồng dùng chuẩn

1. Chờ GitHub Actions chạy xong.
2. Mở **CI Doctor**.
3. Bấm **Tải lỗi CI**.
4. Kiểm tra run/job/step đang đỏ.
5. Bấm **AI phân tích**.
6. Copy phần **Prompt đưa qua VS Code/Cursor**.
7. Dán prompt đó vào VS Code Copilot/Cursor để sửa đúng lỗi.
8. Sau khi sửa chạy:

```bash
npm run lint
npm run build
```

9. Push lại và xem Actions xanh/đỏ.

## Ghi chú kỹ thuật

- Frontend đọc GitHub Actions public bằng GitHub API.
- AI analysis chạy qua endpoint nội bộ `/api/gemini/generate`, tức là tận dụng AI Gateway/vault/fallback đã có.
- Không lưu GitHub token ở frontend.
- Nếu cần repo private hoặc tạo issue/PR sâu hơn, cấu hình `GITHUB_TOKEN` hoặc `GH_TOKEN` ở `.env` local để backend GitHub connector dùng.

## Giới hạn v1

- V1 đọc run/job/step summary. Chưa tải full raw log ở frontend để tránh CORS/permission phức tạp.
- Nếu log quá chi tiết cần full log, mở GitHub Actions trực tiếp rồi copy đoạn lỗi vào Dev Handoff hoặc AI Chat.
- AI không tự sửa code; nó tạo prompt cho VS Code/Cursor để bạn kiểm soát.
