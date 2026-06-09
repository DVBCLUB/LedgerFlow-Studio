@echo off
chcp 65001 >nul
title LedgerFlow Studio - Build Desktop
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ================================================
echo   LedgerFlow Studio - Build ban Desktop Windows
echo ================================================
echo.

echo %CD% | find /I "\Temp\Rar$" >nul
if not errorlevel 1 (
  echo [LOI] Ban dang chay file ben trong file .zip/.rar tam cua WinRAR.
  echo Hay GIAI NEN TOAN BO thu muc ra Desktop hoac o D: truoc khi build.
  echo Vi du: Right click file zip/rar ^> Extract to LedgerFlow-Studio\
  pause
  exit /b 1
)

if not exist package.json (
  echo [LOI] Khong thay package.json.
  echo Nguyen nhan: chua giai nen toan bo project hoac file .bat khong nam o thu muc goc.
  echo Hay chay file nay trong thu muc co package.json.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [CAN CAI] May chua co Node.js LTS.
  echo Dang thu cai bang winget...
  where winget >nul 2>nul
  if errorlevel 1 (
    echo [LOI] May khong co winget. Hay cai Node.js LTS tai https://nodejs.org/ roi chay lai.
    pause
    exit /b 1
  )
  winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  if errorlevel 1 (
    echo [LOI] Cai Node.js bang winget that bai. Hay cai thu cong tai https://nodejs.org/
    pause
    exit /b 1
  )
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong thay npm. Dong cua so nay, mo lai file sau khi cai Node.js xong.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [1/3] Dang cai thu vien...
  call npm install
  if errorlevel 1 (
    echo [LOI] npm install that bai. Xem log phia tren.
    pause
    exit /b 1
  )
) else (
  echo [1/3] Da co node_modules.
)

echo [2/3] Dang build web + server...
call npm run build
if errorlevel 1 (
  echo [LOI] Build that bai. Can xem log phia tren de sua loi.
  pause
  exit /b 1
)

echo [3/3] Dang dong goi desktop portable/installer...
call npm run desktop:dist
if errorlevel 1 (
  echo [LOI] Dong goi desktop that bai. Can xem log phia tren.
  pause
  exit /b 1
)

echo.
echo Hoan tat. Kiem tra thu muc release\ de lay file .exe.
pause
