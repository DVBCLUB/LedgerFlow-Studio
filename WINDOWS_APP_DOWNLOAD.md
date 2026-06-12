# Tai ban LedgerFlow Hub cho Windows

**Dung file nay neu ban muon tai ban phan mem `.exe` de mo/cai dat.**

Khong tai bang nut **Code > Download ZIP** tren GitHub neu muc tieu la su dung phan mem. Nut do chi tai source code cho lap trinh vien.

## Cach tai ban `.exe`

1. Vao tab **Actions** tren GitHub.
2. Chon workflow **Build Windows Desktop**.
3. Mo run mau xanh moi nhat.
4. Keo xuong muc **Artifacts**.
5. Tai artifact:

```text
LedgerFlow-Hub-Windows-Download
```

6. Giai nen file zip vua tai.
7. Bam file `.exe` ben trong de mo/cai dat LedgerFlow Hub.

## Neu Windows hien canh bao SmartScreen

Chon:

```text
More info > Run anyway
```

Ly do: app chua co chung thu ky so Windows Code Signing, nen Windows co the canh bao lan dau.

## Neu ban la lap trinh vien

Neu muon build local tren may Windows, chay:

```bat
tools\windows\BUILD_WINDOWS_INSTALLER.bat
```

File `.exe` se duoc tao trong thu muc `release/`.
