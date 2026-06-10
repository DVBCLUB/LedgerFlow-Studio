@echo off
setlocal
chcp 65001 >nul
title Build LedgerFlow Hub Windows Installer

echo ==================================================
echo  LedgerFlow Hub - Build Windows Installer
echo  Tao file cai dat .exe trong thu muc release
echo ==================================================
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

echo [1/4] Kiem tra thu muc project...
if not exist package.json (
  echo [LOI] Hay dat file nay o thu muc goc LedgerFlow-Studio, cung cap voi package.json.
  pause
  exit /b 1
)

echo [2/4] Cai thu vien neu can...
if exist package-lock.json (
  call npm install
) else (
  call npm install
)
if errorlevel 1 (
  echo [LOI] npm install that bai.
  pause
  exit /b 1
)

echo.
echo [3/4] Dong goi thanh phan mem Windows...
echo Qua trinh nay co the mat vai phut lan dau tien.
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run desktop:dist
if errorlevel 1 (
  echo [LOI] Build installer that bai. Xem loi phia tren de sua.
  pause
  exit /b 1
)

echo.
echo [4/4] Hoan tat.
echo File cai dat nam trong thu muc release.
echo Hay tim file dang LedgerFlow-Hub-*.exe
echo.
if exist release (
  start "" "%cd%\release"
)

echo Bam file .exe trong thu muc release de cai dat LedgerFlow Hub.
pause
endlocal
