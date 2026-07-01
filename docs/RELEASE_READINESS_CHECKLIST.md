# LedgerFlow Hub - Checklist San Sang Phat Hanh

Muc tieu cua checklist nay la tranh nham **source ZIP** voi **ban cai dat Windows `.exe`**.

## 1. Khong phat hanh source ZIP cho nguoi dung cuoi

Nut GitHub **Code -> Download ZIP** chi tai ma nguon. File ZIP nay se co cac thu muc nhu:

- `src/`
- `desktop/`
- `scripts/`
- `package.json`
- `server.ts`

Do khong phai phan mem cai dat.

## 2. Ban dung cho nguoi dung cuoi

Nguoi dung cuoi chi nen tai file `.exe` tu:

1. GitHub Actions artifact: `LedgerFlow-Hub-Windows-Setup`
2. GitHub Releases: file `LedgerFlow-Hub-...exe`

## 3. Dieu kien truoc khi gui cho nguoi khac

Truoc khi gui ban `.exe`, kiem tra:

- Workflow **Build LedgerFlow Hub Windows Setup** chay xanh.
- Artifact `LedgerFlow-Hub-Windows-Setup` co it nhat mot file `.exe`.
- Cai duoc tren Windows bang double click.
- Sau khi cai co shortcut **LedgerFlow Hub** ngoai Desktop hoac Start Menu.
- Mo app khong can CMD, Node.js hoac npm.
- Bam **Labs -> Start Here** mo duoc.
- Cac tab quan trong mo duoc: Company OS, Game Library, Game Progress, Game History, Backup / Restore.
- Truoc khi update ban moi, vao **Backup / Restore** xuat JSON.

Khuyen nghi bo sung:

- Luu hash va timestamp cua artifact `.exe` vao release note noi bo.
- Neu co thay doi desktop shell, chay them `npm run check:desktop` truoc khi gui ban cai.

## 4. Build local neu Actions chua co artifact

Trong source folder, chay:

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Sau khi chay xong, file `.exe` nam trong:

```txt
release/
```

## 5. Khong doi cau truc loi khi chi phat hanh

Khong sua/xoa cac thu muc sau neu chi muon build release:

- `src/`
- `desktop/`
- `build/`
- `scripts/`
- `public/`
- `.github/workflows/`
