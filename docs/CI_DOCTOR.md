# GitHub CI Doctor

GitHub CI Doctor la connector phu cua Integration Hub, dung de noi 3 phan:

```text
GitHub Actions do -> LedgerFlow doc run/job/step -> AI Gateway phan tich -> prompt dua qua VS Code/Cursor
```

## Cach mo

Trong app bam nut noi **CI Doctor**, hoac mo truc tiep:

```text
http://127.0.0.1:3000/#/ci_doctor
```

Hash route duoc ho tro:

```text
#/ci_doctor
#/ci-doctor
#/github_ci
```

## Luong dung chuan

1. Cho GitHub Actions chay xong.
2. Mở **CI Doctor**.
3. Bam **Tai loi CI**.
4. Kiểm tra run/job/step đang đỏ.
5. Bam **AI phan tich**.
6. Copy phan **Prompt dua qua VS Code/Cursor**.
7. Dan prompt do vao VS Code Copilot/Cursor de sua dung loi.
8. Sau khi sửa chạy:

```bash
npm run lint
npm run build
```

9. Push lai va xem Actions xanh/do.

## Ghi chu ky thuat

- Frontend doc GitHub Actions public bang GitHub API.
- AI analysis chay qua endpoint noi bo `/api/gemini/generate`, tuc la tan dung AI Gateway/vault/fallback da co.
- Khong luu GitHub token o frontend.
- Neu can repo private hoac tao issue/PR sau hon, cau hinh `GITHUB_TOKEN` hoac `GH_TOKEN` o `.env` local de backend GitHub connector dung.

## Gioi han v1

- V1 doc run/job/step summary. Chua tai full raw log o frontend de tranh CORS/permission phuc tap.
- Neu log qua chi tiet can full log, mo GitHub Actions truc tiep roi copy doan loi vao Dev Handoff hoac AI Chat.
- AI khong tu sua code; no tao prompt cho VS Code/Cursor de ban kiem soat.
