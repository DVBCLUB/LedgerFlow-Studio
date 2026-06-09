# LedgerFlow Studio - Hybrid Run Guide

Phan mem nay duoc cau hinh de chay duoc ca web va desktop.

## Web local

1. Cai thu vien: npm install
2. Chay dev server: npm run dev
3. Mo trinh duyet tai http://localhost:3000

## Build web production

1. Build: npm run build
2. Chay server production: npm run start

Ghi chu: Neu chi deploy static frontend thi cac API /api/gemini va /api/db se khong hoat dong day du. Can deploy dang Node server neu muon giu Gemini API va luu db_storage.json.

## Desktop Electron

Chay thu tren may tinh:

npm run desktop:dev

Dong goi file cai dat:

npm run desktop:dist

File xuat ra nam trong thu muc release.

## Co che desktop

Electron khong pha giao dien hien co. No khoi dong server Express noi bo, sau do mo cua so desktop va load app tai http://127.0.0.1:3000.

File db_storage.json cua desktop duoc chuyen ve thu muc userData cua Electron de tranh ghi vao thu muc cai dat.

## PWA

Vite da bat vite-plugin-pwa. Khi build web, trinh duyet co the cai app nhu ung dung doc lap neu duoc ho tro.
