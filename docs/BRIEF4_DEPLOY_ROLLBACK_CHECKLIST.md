# BRIEF4 - Checklist Deploy va Rollback

## Checklist Deploy
1. Pull main moi nhat va xac minh commit hash muc tieu.
2. Chay bo kiem tra:

```bash
npm run lint
npm run check:runtime
```

3. Xac nhan cac endpoint runtime sau o trang thai healthy:
- /api/gateway/health
- /api/ai-workforce/runtime
- /api/ai-workforce/mission-execution-queue/drift
- /api/company-os/browser-sandbox/diagnostics

4. Xac nhan cac panel frontend tai duoc:
- AI Workforce Runtime panel (co thao tac drift)
- Web AI Sync panel (co xac nhan fallback + diagnostics)

5. Xac nhan khong co secret bi dua vao tracked files.
6. Deploy len moi truong muc tieu.
7. Chay smoke check sau deploy tren URL da trien khai.

## Tieu chi Go/No-Go
Chi Go khi tat ca dieu kien deu dung:
- lint va runtime checks pass
- gateway health tra ve live providers/stats
- drift endpoint phan hoi va khong co xu huong critical unresolved
- browser diagnostics endpoint phan hoi binh thuong

## Dieu kien kich hoat Rollback
Rollback neu sau deploy xay ra mot trong cac truong hop:
- runtime contracts that bai lien tuc
- critical drift cua mission queue tang va repair khong on dinh he thong
- browser mode bi cooldown/failure loop lam tac nghen van hanh
- gateway live snapshot khong kha dung hoac payload sai cau truc

## Quy trinh Rollback
1. Xac dinh commit on dinh gan nhat.
2. Re-deploy commit on dinh gan nhat.
3. Chay lai smoke check:

```bash
npm run check:runtime
```

4. Xac minh lai endpoint cot loi va panel UI.
5. Ghi incident note gom:
- trigger condition
- affected endpoints
- rollback commit hash
- next remediation owner

## Bang chung Release
Can thu thap va luu tru:
- output cua check:runtime
- mau payload gateway health
- drift report truoc/sau repair (neu co)
- snapshot browser diagnostics
