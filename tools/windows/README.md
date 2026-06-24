# Windows Desktop Build Tools

Thu muc nay chua cac script dong goi LedgerFlow Hub thanh thu muc Windows chay truc tiep.

## Build tren may local

Chay:

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Script nay tu quay ve thu muc goc project, cai dependencies, tao lai icon Windows hop le, build web/server va tao `release/win-unpacked/LedgerFlow Hub.exe`.

## Ban tai cho nguoi dung

Nguoi dung khong nen tai nut **Code > Download ZIP** cua GitHub vi do la source code. Ban phat hanh dung nam trong:

```text
GitHub > Actions > Build Windows Desktop > run xanh moi nhat > Artifacts
```

Tai artifact `LedgerFlow-Hub-Windows-Download`, giai nen ra va chay `win-unpacked/LedgerFlow Hub.exe`.
