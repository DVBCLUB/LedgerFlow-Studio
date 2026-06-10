@echo off
setlocal
chcp 65001 >nul
title Build LedgerFlow Hub Windows Installer

echo ==================================================
echo  LedgerFlow Hub - Tao file cai dat Windows .exe
echo ==================================================
echo.
echo File nay KHONG chay app dev.
echo File nay chi dung de dong goi ra ban cai dat trong thu muc release.
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

if not exist desktop\main.cjs (
  echo [LOI] Khong thay desktop\main.cjs. Thu muc project bi thieu file desktop.
  pause
  exit /b 1
)

echo [2/4] Cai/cap nhat thu vien...
echo Lan dau co the lau. Neu da cai roi, npm se bo qua phan lon.
call npm install
if errorlevel 1 (
  echo [LOI] npm install that bai.
  echo Goi y: kiem tra internet, Node.js LTS, hoac xoa node_modules roi chay lai.
  pause
  exit /b 1
)

echo.
echo [3/4] Build va dong goi installer...
echo Qua trinh nay co the mat vai phut lan dau tien.
echo Neu thay nhieu dong WARN thi chua chac la loi. Chi khi co dong [LOI] moi la build fail.
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run desktop:dist
if errorlevel 1 (
  echo.
  echo [LOI] Build installer that bai.
  echo Hay chup man hinh tu dong loi dau tien den dong nay gui cho ChatGPT.
  echo Thuong gap: script check cu, thieu file icon, hoac Electron Builder tai goi bi loi mang.
  pause
  exit /b 1
)

echo.
echo [4/4] Hoan tat.
if not exist release (
  echo [LOI] Build bao thanh cong nhung khong thay thu muc release.
  pause
  exit /b 1
)

echo File cai dat nam trong thu muc release.
echo Hay tim file co duoi .exe, vi du: LedgerFlow-Hub-0.1.0-x64.exe
echo.
start "" "%cd%\release"

echo Bam file .exe trong thu muc release de cai dat LedgerFlow Hub.
pause
endlocal
