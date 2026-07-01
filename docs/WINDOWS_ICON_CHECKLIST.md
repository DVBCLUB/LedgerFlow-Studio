# Windows Icon Checklist

Muc tieu: ban tai ve phai nhin giong phan mem Windows that, khong phai app dev chay CMD.

## Icon Files

LedgerFlow desktop build dung cac file sau:

- `build/logo.svg`: logo nguon, de chinh bang SVG.
- `build/icon.ico`: icon Windows that, duoc tao boi `npm run prepare:icons`.

## Noi Icon Duoc Dung

`package.json` dang cau hinh electron-builder dung:

- `build.win.icon = build/icon.ico`
- `build.nsis.installerIcon = build/icon.ico`
- `build.nsis.uninstallerIcon = build/icon.ico`

`desktop/main.cjs` cung dat icon cho cua so app bang `build/icon.ico` khi file nay ton tai.

## Cach Kiem Tra Sau Khi Build

Chay:

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Sau khi build xong, mo thu muc:

```txt
release
```

Kiem tra:

1. File installer `LedgerFlow-Hub-...exe` co icon LedgerFlow khong.
2. Bam cai dat, shortcut Desktop co icon LedgerFlow khong.
3. Start Menu co icon LedgerFlow khong.
4. Khi mo app, icon tren taskbar/cua so co icon LedgerFlow khong.

## Neu Windows Van Hien Icon Trang

Windows doi khi cache icon cu. Thu:

1. Doi ten file `.exe` hoac build lai ban moi.
2. Xoa ban cai cu roi cai lai.
3. Restart Windows Explorer hoặc restart máy.

## Luu Y

Logo khong phai chu ky so. Neu chua code-sign, Windows SmartScreen van co the canh bao ung dung khong ro nha phat hanh du icon da dung.
