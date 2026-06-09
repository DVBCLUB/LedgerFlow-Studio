# LedgerFlow Hub - Desktop Release Guide

File nay huong dan cach lay ban cai dat Windows tu GitHub Actions.

## Tu dong build tren GitHub

Repo da co workflow:

.github/workflows/build-desktop.yml

Workflow nay se tu chay khi push len nhanh main hoac khi bam chay thu cong bang workflow_dispatch.

## Cach lay file cai dat

1. Mo repo tren GitHub.
2. Vao tab Actions.
3. Chon workflow Build LedgerFlow Hub Desktop.
4. Chon run moi nhat da thanh cong.
5. Tai artifact ten LedgerFlow-Hub-Windows.
6. Giai nen file artifact.
7. Chay file LedgerFlow-Hub-...exe de cai dat.

## Ket qua sau khi cai

- Co shortcut LedgerFlow Hub tren Desktop.
- Co shortcut LedgerFlow Hub trong Start Menu.
- Bam shortcut la mo phan mem.
- App khoi dong server noi bo tren may tinh tai 127.0.0.1:3000.
- Du lieu local cua desktop luu trong thu muc userData cua Electron.

## Offline

Chay duoc offline:

- Giao dien React.
- Cac module hoc tap, nghien cuu, dashboard tinh toan local.
- Du lieu da luu o may tinh local.

Can internet:

- Gemini API.
- Supabase sync.
- Google Search / cloud services.
- Tai cap nhat tu GitHub.

## Build tren may ca nhan

Cai dependencies:

npm install

Build file cai dat Windows:

npm run desktop:dist

File ket qua nam trong thu muc release.
