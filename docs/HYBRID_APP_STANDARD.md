# LedgerFlow Hub - Hybrid App Standard

Tai lieu nay la checklist tieu chuan de bien ung dung Google AI Studio / React thanh phan mem hybrid co the chay tren web va may tinh.

## 1. Web app standard

- Chay duoc bang trinh duyet.
- Co build production bang `npm run build`.
- Co server Node/Express cho API rieng.
- Co PWA manifest va service worker.
- Static assets dung duong dan tuong doi de phu hop web, desktop va sub-folder hosting.

Tinh trang hien tai:

- React + Vite + Express: done.
- HashRouter: done.
- PWA vite-plugin-pwa: done.
- API `/api/health`, `/api/db`, `/api/gemini`: done.

## 2. Desktop app standard

- Co Electron shell rieng.
- App desktop khoi dong server noi bo.
- Shortcut ngoai Desktop va Start Menu.
- Ten app, appId, productName ro rang.
- Chi cho mo external link bang browser mac dinh, khong mo lung tung trong app.
- Tat nodeIntegration, bat contextIsolation, bat sandbox.
- Chi cho 1 instance app chay cung luc.
- Co menu mo thu muc du lieu local.

Tinh trang hien tai:

- Electron main: done.
- Embedded server: done.
- Shortcut Windows NSIS: done.
- Single instance lock: done.
- Hardened webPreferences: done.
- External link handling: done.
- Local data folder menu: done.

## 3. Offline-first standard

- Giao dien mo duoc khong can internet.
- LocalStorage va `db_storage.json` hoat dong tren may tinh.
- Desktop luu du lieu vao thu muc `userData`, khong ghi vao thu muc cai dat.
- Cac tinh nang cloud phai degrade gracefully khi mat mang.

Tinh trang hien tai:

- UI local: done.
- Local db_storage redirect to Electron userData: done.
- Gemini/Supabase can internet: documented.

## 4. Simulation model standard

- Tat ca module mo phong trong `src/components` phai ton tai khi build.
- App.tsx phai lazy-load dung cac module mo phong trong danh sach trong yeu.
- Cac Founder Labs phu phai duoc gan trong `FounderLabsDock`.
- Moi module trong yeu phai co export de React co the import duoc.
- Build web va desktop phai chay check truoc khi dong goi.
- Khong duoc xoa, doi ten, di chuyen module mo phong neu chua cap nhat registry check.

Tinh trang hien tai:

- `scripts/check-simulation-modules.mjs`: done.
- `npm run check:simulations`: done.
- Prebuild tu dong chay simulation check: done.
- Module trong yeu dang duoc bao ve: done.

## 5. Data standard

- Du lieu local phai tach khoi source code.
- Co thu muc du lieu rieng tung user.
- Can co backup/export trong giai doan tiep theo.

Tinh trang hien tai:

- Local data folder: done.
- Backup/export UI: next phase.

## 6. Release standard

- Build Windows EXE.
- Build macOS DMG.
- Build Linux AppImage.
- Artifact tu GitHub Actions.
- Co ban installer va portable cho Windows.

Tinh trang hien tai:

- Windows nsis + portable: done.
- macOS dmg: configured.
- Linux AppImage: configured.
- GitHub Actions matrix build: done.

## 7. Security standard

- Khong de API key trong source code.
- Desktop khong bat nodeIntegration trong renderer.
- External URL mo bang browser ngoai.
- Khong cho app dieu huong ra domain la trong cua so chinh.
- Secrets dung `.env.local` hoac platform secrets.

Tinh trang hien tai:

- `.env` ignored: done.
- Renderer hardening: done.
- External link isolation: done.

## 8. Maintenance standard

- Co workflow CI.
- Co tai lieu build va release.
- Co checklist de test truoc khi phat hanh.
- Nen co versioning bang tag `v0.1.0`, `v0.2.0`.

Tinh trang hien tai:

- CI build desktop: done.
- `docs/DESKTOP_RELEASE_GUIDE.md`: done.
- `docs/HYBRID_APP_STANDARD.md`: done.

## Test truoc khi phat hanh

1. `npm install`
2. `npm run check:simulations`
3. `npm run lint`
4. `npm run build`
5. `npm run desktop:dev`
6. `npm run desktop:dist`
7. Cai file Windows EXE tren may khac.
8. Tat internet va mo shortcut LedgerFlow Hub.
9. Kiem tra tung module mo phong trong menu.
10. Kiem tra giao dien, du lieu local, Supabase/Gemini fallback.
11. Mo lai app lan 2 de kiem tra single instance lock.
12. Kiem tra thu muc du lieu local tu menu Help.
