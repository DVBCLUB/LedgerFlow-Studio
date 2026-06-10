# LedgerFlow Hub - Desktop Release Guide

Muc tieu cua ban desktop la: nguoi dung tai file `.exe`, bam cai dat, sau do mo LedgerFlow Hub nhu mot phan mem Windows binh thuong. Khong can mo CMD, khong can go `npm`, khong can vao `localhost`.

## 1. Ban dev khac ban cai dat

Ban dang chay bang `npm run dev` la **che do lap trinh**:

- Can Node.js.
- Can CMD/terminal.
- App chay qua server local.
- Dung de sua code va test nhanh.

Ban nguoi dung cuoi can la **ban cai dat Windows**:

- File dang `LedgerFlow-Hub-...exe`.
- Bam file `.exe` de cai dat.
- Cai xong co shortcut ngoai Desktop va Start Menu.
- Bam shortcut la mo app, khong can CMD.

## 2. Cach tao file cai dat tren may Windows

Cach de nhat:

1. Mo thu muc goc `LedgerFlow-Studio`.
2. Bam dup file:

```txt
BUILD_WINDOWS_INSTALLER.bat
```

3. Doi build xong.
4. File cai dat nam trong thu muc:

```txt
release
```

5. Tim file `.exe`, vi du:

```txt
LedgerFlow-Hub-0.1.0-x64.exe
```

6. Gui file `.exe` nay cho nguoi dung hoac tu bam de cai.

## 3. Cach tao file cai dat bang lenh

Neu muon chay bang terminal:

```bash
npm install
npm run desktop:dist
```

File ket qua nam trong thu muc `release`.

## 4. Tu dong build tren GitHub Actions

Repo co workflow build desktop:

```txt
.github/workflows/build-desktop.yml
```

Workflow nay se build artifact cho Windows, macOS va Linux khi push len `main` hoac khi bam chay thu cong.

Artifact Windows:

```txt
LedgerFlow-Hub-Windows
```

Luu y: artifact cua GitHub Actions chi giu tam thoi theo thoi gian cau hinh.

## 5. Tao GitHub Release de tai ve nhu phan mem that

Repo co workflow release Windows:

```txt
.github/workflows/release-windows.yml
```

Cach dung:

1. Mo repo tren GitHub.
2. Vao tab **Actions**.
3. Chon **Release LedgerFlow Hub Windows Installer**.
4. Bam **Run workflow**.
5. Nhap tag, vi du:

```txt
v0.1.0-windows
```

6. Doi workflow chay xong.
7. Vao tab **Releases** cua GitHub.
8. Tai file `.exe` trong release moi nhat.
9. Bam file `.exe` de cai dat.

Day la cach phu hop nhat de phat hanh cho nguoi dung: ho chi can vao Releases, tai `.exe`, cai dat va dung.

## 6. Ket qua sau khi cai Windows

- Co shortcut **LedgerFlow Hub** tren Desktop.
- Co shortcut **LedgerFlow Hub** trong Start Menu.
- Bam shortcut la mo phan mem.
- Electron tu khoi dong server noi bo tren may tinh tai `127.0.0.1:3000`.
- Nguoi dung khong can biet cong 3000, localhost hay CMD.
- Du lieu local cua desktop luu trong thu muc `userData` cua Electron.

## 7. Offline

Chay duoc offline:

- Giao dien React.
- Cac module hoc tap, nghien cuu, dashboard tinh toan local.
- Du lieu da luu o may tinh local.

Can internet:

- Gemini API.
- Supabase sync.
- Google Search / cloud services.
- Tai cap nhat tu GitHub.

## 8. Luu y ve Windows SmartScreen

Neu app chua duoc code-sign bang chung chi so, Windows co the hien canh bao SmartScreen khi cai dat.

Cach tam thoi khi test noi bo:

1. Bam **More info**.
2. Bam **Run anyway**.

Ban release thuong mai that nen mua code-signing certificate de giam canh bao nay.
