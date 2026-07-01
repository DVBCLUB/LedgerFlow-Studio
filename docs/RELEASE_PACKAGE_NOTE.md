# Source ZIP khac Windows Setup

Khi bam nut **Code -> Download ZIP** tren GitHub, file tai ve la **ma nguon**. Ma nguon se co `src/`, `scripts/`, `desktop/`, `package.json` va cac file cau hinh. Ma nguon khong chua san file `.exe`.

File cai dat Windows chi co sau khi build:

1. Build local bang `BUILD_WINDOWS_INSTALLER.bat`, sau do lay `.exe` trong thu muc `release/`.
2. Hoac tai artifact/release do GitHub Actions tao ra: `LedgerFlow-Hub-Windows-Setup`.

Nguoi dung cuoi nen tai ban Windows Setup `.exe`, khong nen tai source ZIP.
