# LedgerFlow Hub - CI Failure Guide

Tai lieu nay dung khi GitHub Actions bi do. Mo Actions -> Build LedgerFlow Hub Desktop -> job bi fail -> xem step fail, roi doi chieu bang duoi.

## 1. Environment configuration check

Lenh:

```bash
npm run check:env
```

Neu fail, thuong do:

- `.env.example` thieu bien cau hinh.
- Con placeholder kieu `MY_GEMINI_API_KEY`.
- Source code co dau hieu lo API key.

Cach sua:

- Chi de ten bien trong `.env.example`, khong de key that.
- API key that phai de trong `.env.local` tren may rieng hoac GitHub Secrets / hosting secrets.

## 2. Simulation module integrity check

Lenh:

```bash
npm run check:simulations
```

Neu fail, thuong do:

- Them model moi nhung quen them vao `src/data/simulationRegistry.ts`.
- Registry co component nhung file trong `src/components` khong ton tai.
- Component co file nhung khong export.
- Module chinh chua duoc lazy-load trong `App.tsx`.
- Founder Lab chua duoc gan trong `FounderLabsDock.tsx`.
- Route/tab key trong App/Dock bi lech voi registry.

Cach sua:

1. Kiem tra `src/data/simulationRegistry.ts`.
2. Kiem tra `src/components/<ComponentName>.tsx`.
3. Kiem tra `src/App.tsx` voi module chinh.
4. Kiem tra `src/components/FounderLabsDock.tsx` voi Founder Labs.

## 3. Desktop package configuration check

Lenh:

```bash
npm run check:desktop
```

Neu fail, thuong do:

- `package.json` bi mat `main: desktop/main.cjs`.
- `appId` / `productName` bi doi sai.
- Windows target thieu `nsis` hoac `portable`.
- Shortcut Desktop / Start Menu bi tat.
- Electron security bi doi sai: `nodeIntegration`, `contextIsolation`, `sandbox`, `webSecurity`.

Cach sua:

- Kiem tra `package.json` phan `build`.
- Kiem tra `desktop/main.cjs`.

## 4. Offline readiness check

Lenh:

```bash
npm run check:offline
```

Neu fail, thuong do app dang phu thuoc CDN/font ngoai:

- `unpkg.com`
- `cdn.jsdelivr.net`
- `cdnjs.cloudflare.com`
- `fonts.googleapis.com`
- `fonts.gstatic.com`

Cach sua:

- Cai package bang npm thay vi lay CDN.
- Dung local asset/font thay vi link ngoai.

## 5. TypeScript check

Lenh:

```bash
npm run lint
```

Neu fail, thuong do:

- Sai type TypeScript.
- Import component/file sai ten.
- Props cua component khong dung.
- Bien/function khong ton tai.

Cach sua:

- Doc dong loi trong log.
- Tim file va line TypeScript bao loi.

## 6. Build desktop package

Lenh:

```bash
npm run desktop:dist
```

Neu fail, thuong do:

- Vite build fail.
- Server bundle fail.
- Electron Builder fail.
- Thieu dependency.
- Mot platform khong build duoc target tuong ung.

Cach sua:

- Chay `npm run build` truoc.
- Neu build web pass nhung desktop fail, xem Electron Builder log.

## 7. Production build smoke check

Lenh:

```bash
npm run check:build
```

Neu fail, thuong do:

- `dist/index.html` khong co.
- `dist/server.cjs` khong co.
- `manifest.webmanifest` khong co.
- Service worker/PWA output khong co.
- Build manifest khong co hoac sai.
- Server bundle thieu route API quan trong.

Cach sua:

- Kiem tra `vite.config.ts`.
- Kiem tra `server.ts`.
- Kiem tra `scripts/write-build-manifest.mjs`.

## 8. Runtime API smoke check

Lenh:

```bash
npm run check:runtime
```

Neu fail, thuong do:

- `node dist/server.cjs` khong khoi dong duoc.
- Cong 3000 dang bi chiem.
- `/api/health`, `/api/db/load`, `/api/gemini/status` khong tra JSON dung.

Cach sua:

- Tat app dang dung port 3000.
- Kiem tra `server.ts` va `dist/server.cjs`.

## 9. Release artifact check

Lenh:

```bash
npm run check:release
```

Neu fail, thuong do:

- Electron Builder khong tao thu muc `release/`.
- Windows thieu `.exe`.
- macOS thieu `.dmg`.
- Linux thieu `.AppImage`.
- Ten file khong co `LedgerFlow-Hub`.

Cach sua:

- Kiem tra `package.json` phan `build`.
- Kiem tra log Electron Builder.

## 10. Full hybrid checklist

Lenh tong:

```bash
npm run check:hybrid
```

Lenh nay nen chay sau khi da build xong va da co `dist/` + `release/`.

## Quy trinh debug nhanh

1. Neu fail o step nao, chi sua step do truoc.
2. Khong sua lan man nhieu file cung luc.
3. Sau khi sua, chay lai lenh cua step bi fail.
4. Neu pass local, push len GitHub de Actions chay lai.
5. Neu van fail, chup man hinh step fail va log 20 dong cuoi.
