# Windows Desktop Build Tools

Thu muc nay chua cac script dong goi LedgerFlow Hub thanh file Windows `.exe`.

## Build tren may local

Chay:

```bat
BUILD_WINDOWS_INSTALLER.bat
```

Script nay tu quay ve thu muc goc project, cai dependencies, tao lai icon Windows hop le, build web/server va dong goi installer vao thu muc `release/`.

## Ban tai cho nguoi dung

Nguoi dung khong nen tai nut **Code > Download ZIP** cua GitHub vi do la source code. Ban phat hanh dung nam trong:

```text
GitHub > Actions > Build Windows Desktop > run xanh moi nhat > Artifacts
```

Tai artifact `LedgerFlow-Hub-Windows-Download`, giai nen ra se thay file `.exe` va file huong dan.
