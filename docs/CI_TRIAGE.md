# CI Triage Checklist

Dung checklist nay khi CI cua LedgerFlow Studio bi do, hoac khi PR co thay doi lien quan den build, packaging, TypeScript, Electron, server, hoac persistence.

## Release gate hien tai

PR chua san sang merge neu maintainers chua giai trinh duoc ket qua cua tung gate:

```bash
npm run lint
npm test
npm run build
```

Neu mot lenh tam thoi fail do legacy debt da biet, can gan link issue tracking va dinh kem output fail chinh xac.

## Tai hien loi nhanh o local

1. Bat dau tu nhanh sach duoc cat tu `main`.
2. Cai dependencies bang cung Node version voi CI.
3. Chay checks theo dung thu tu:

```bash
npm install
npm run lint
npm test
npm run build
```

4. Ghi nhan loi goc dau tien, khong chi nhin tong ket cuoi.
5. Phan loai loi theo nhom ben duoi.

## Nhom loi thuong gap

### TypeScript hoac lint

- Thieu event union/type variant.
- Khai bao hoac export bi trung.
- Barrel export cu tro den module da xoa/doi vi tri.
- UI prop type bi lech.
- Type giua server/client khong tuong thich.
- Xu ly strict null hoac unknown chua dung.

### Unit/integration tests

- Test fixture bi drift.
- Mock khong con khop sau khi doi service.
- Gia dinh sai ve duong dan persistence local.
- Gia dinh sai ve timing cua background jobs.

### Build/runtime

- Vite hoac bundler import fail.
- Electron path/runtime bi lech.
- Node version khong khop.
- Bien moi truong khong dung ky vong.
- Thieu generated/static asset.

### Desktop packaging

- Windows script fail.
- Electron entrypoint/preload bi lech.
- Loi redirection `userData`.
- Thieu dependency de khoi dong API/assistant daemon.

## Mau bang chung cho PR

Dung mau nay cho PR co tac dong runtime hoac code nhay cam voi release:

```text
Validation:
- npm run lint: <pass/fail/not run + reason>
- npm test: <pass/fail/not run + reason>
- npm run build: <pass/fail/not run + reason>
- Windows desktop package: <pass/fail/not run + reason>

Known failures:
- <issue link or none>

Rollback:
- <how to revert or disable safely>
```

## Guardrails

- Khong tat type checking toan du an chi de CI xanh.
- Uu tien sua dung diem thay vi dung `any` rong.
- Chi dua file cu khoi lint/build surface khi da chung minh khong con dung.
- Khong them module san pham moi khi loi CI P0 chua duoc giai quyet.
- Giu gia dinh build giua Windows desktop va web-render dong bo.

## P0 tracking lien quan

- #14: loi TypeScript CI hien tai dang chan build.
- #26: triage CI/type-check va on dinh release gate.
