@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title Build LedgerFlow Hub Windows Installer

echo ==================================================
echo  LedgerFlow Hub - Tao file cai dat Windows .exe
echo ==================================================
echo.
echo File nay KHONG chay app dev/localhost.
echo File nay dung de dong goi ra ban cai dat trong thu muc release.
echo Sau khi xong, ban chi can bam file .exe trong release de cai dat.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js.
  echo Tai va cai Node.js LTS tu https://nodejs.org/
  echo Sau do mo lai file nay.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong tim thay npm. Hay cai lai Node.js LTS.
  pause
  exit /b 1
)

echo [1/5] Kiem tra thu muc project...
if not exist package.json (
  echo [LOI] Hay dat file nay o thu muc goc LedgerFlow-Studio, cung cap voi package.json.
  pause
  exit /b 1
)

if not exist desktop\main.cjs (
  echo [LOI] Khong thay desktop\main.cjs. Thu muc project bi thieu file desktop.
  pause
  exit /b 1
)

if not exist build\icon.ico (
  echo [CANH BAO] Chua thay build\icon.ico. Script build se thu tao icon trong buoc build.
  echo Neu build ra file .exe khong co logo, hay bao ChatGPT kiem tra lai icon.
  echo.
)

echo [2/5] Don thu muc release cu de tranh nham file .exe cu...
if exist release (
  rmdir /s /q release
  if exist release (
    echo [LOI] Khong xoa duoc thu muc release cu. Hay dong cac file .exe/installer dang mo roi chay lai.
    pause
    exit /b 1
  )
)

echo [3/5] Cai/cap nhat thu vien...
echo Lan dau co the lau. Neu da cai roi, npm se bo qua phan lon.
call npm install
if errorlevel 1 (
  echo [LOI] npm install that bai.
  echo Goi y: kiem tra internet, Node.js LTS, hoac xoa node_modules roi chay lai.
  pause
  exit /b 1
)

echo.
echo [4/5] Build va dong goi installer...
echo Qua trinh nay co the mat vai phut lan dau tien.
echo Neu thay nhieu dong WARN thi chua chac la loi. Chi khi co dong [LOI] moi la build fail.
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run desktop:dist
if errorlevel 1 (
  echo.
  echo [LOI] Build installer that bai.
  echo Hay chup man hinh tu dong loi dau tien den dong nay gui cho ChatGPT.
  echo Thuong gap: script check, thieu file icon, hoac Electron Builder tai goi bi loi mang.
  pause
  exit /b 1
)

echo.
echo [5/5] Kiem tra file .exe da tao...
if not exist release (
  echo [LOI] Build bao thanh cong nhung khong thay thu muc release.
  pause
  exit /b 1
)

set EXE_COUNT=0
for /f "delims=" %%F in ('dir /b /a:-d "release\*.exe" 2^>nul') do (
  set /a EXE_COUNT+=1
  echo   [EXE] release\%%F
)

if "%EXE_COUNT%"=="0" (
  echo [LOI] Khong tim thay file .exe trong thu muc release.
  echo Hay mo thu muc release va chup man hinh danh sach file gui cho ChatGPT.
  start "" "%cd%\release"
  pause
  exit /b 1
)

echo.
echo ==================================================
echo  BUILD THANH CONG
echo ==================================================
echo.
echo Thu muc thanh pham: %cd%\release
echo Bam file .exe trong danh sach tren de cai dat LedgerFlow Hub.
echo Neu Windows hien SmartScreen, chon More info ^> Run anyway.
echo.
start "" "%cd%\release"
pause
endlocal
