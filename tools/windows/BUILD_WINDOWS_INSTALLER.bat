@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title Build LedgerFlow Hub Windows App

set SCRIPT_DIR=%~dp0
pushd "%SCRIPT_DIR%..\.." >nul

echo ==================================================
echo  LedgerFlow Hub - Tao ban Windows chay truc tiep
echo ==================================================
echo.
echo File nay KHONG chay app dev/localhost.
echo File nay build ra thu muc release\win-unpacked.
echo Sau khi xong, bam LedgerFlow Hub.exe trong thu muc do de chay.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js.
  echo Tai va cai Node.js LTS tu https://nodejs.org/
  echo Sau do mo lai file nay.
  pause
  popd >nul
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong tim thay npm. Hay cai lai Node.js LTS.
  pause
  popd >nul
  exit /b 1
)

echo [1/6] Kiem tra thu muc project...
if not exist package.json (
  echo [LOI] Khong tim thay package.json o thu muc goc LedgerFlow-Studio.
  pause
  popd >nul
  exit /b 1
)

if not exist desktop\main.cjs (
  echo [LOI] Khong thay desktop\main.cjs. Thu muc project bi thieu file desktop.
  pause
  popd >nul
  exit /b 1
)

echo [2/6] Don thu muc release cu de tranh nham ban .exe cu...
if exist release (
  rmdir /s /q release
  if exist release (
    echo [LOI] Khong xoa duoc thu muc release cu. Hay dong LedgerFlow Hub.exe dang mo roi chay lai.
    pause
    popd >nul
    exit /b 1
  )
)

echo [3/6] Cai/cap nhat thu vien...
echo Lan dau co the lau. Neu da cai roi, npm se bo qua phan lon.
call npm install
if errorlevel 1 (
  echo [LOI] npm install that bai.
  echo Goi y: kiem tra internet, Node.js LTS, hoac xoa node_modules roi chay lai.
  pause
  popd >nul
  exit /b 1
)

echo.
echo [4/6] Tao lai icon Windows hop le...
echo Buoc nay ghi de build\icon.ico de tranh dung nham icon cu bi loi resedit.
call npm run prepare:icons
if errorlevel 1 (
  echo [LOI] Tao build\icon.ico that bai.
  echo Hay chup man hinh loi va gui cho ChatGPT.
  pause
  popd >nul
  exit /b 1
)

if not exist build\icon.ico (
  echo [LOI] Script prepare:icons chay xong nhung van khong thay build\icon.ico.
  pause
  popd >nul
  exit /b 1
)

echo.
echo [5/6] Build ban Windows chay truc tiep...
echo Qua trinh nay co the mat vai phut lan dau tien.
echo Neu thay nhieu dong WARN thi chua chac la loi. Chi khi co dong [LOI] moi la build fail.
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run desktop:dist
if errorlevel 1 (
  echo.
  echo [LOI] Build ban Windows that bai.
  echo Hay chup man hinh tu dong loi dau tien den dong nay gui cho ChatGPT.
  echo Thuong gap: script check, icon Windows, hoac Electron Builder tai goi bi loi mang.
  pause
  popd >nul
  exit /b 1
)

echo.
echo [6/6] Kiem tra file .exe da tao...
if not exist release (
  echo [LOI] Build bao thanh cong nhung khong thay thu muc release.
  pause
  popd >nul
  exit /b 1
)

set "APP_EXE=%cd%\release\win-unpacked\LedgerFlow Hub.exe"
if not exist "%APP_EXE%" (
  echo [LOI] Khong tim thay file:
  echo "%APP_EXE%"
  echo Hay mo thu muc release\win-unpacked va chup man hinh danh sach file gui cho ChatGPT.
  start "" "%cd%\release"
  pause
  popd >nul
  exit /b 1
)

echo   [EXE] "%APP_EXE%"

echo.
echo ==================================================
echo  BUILD THANH CONG
echo ==================================================
echo.
echo Thu muc thanh pham: %cd%\release\win-unpacked
echo Bam LedgerFlow Hub.exe de chay phan mem, khong can cai dat.
echo Neu Windows hien SmartScreen, chon More info ^> Run anyway.
echo.
start "" "%cd%\release\win-unpacked"
pause
popd >nul
endlocal
