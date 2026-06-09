@echo off
chcp 65001 >nul
title LedgerFlow Studio - Build Desktop

cd /d "%~dp0"

echo.
echo ================================================
echo   LedgerFlow Studio - Build ban Desktop Windows
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js LTS: https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo [1/3] Dang cai thu vien...
  call npm install
  if errorlevel 1 (
    echo [LOI] npm install that bai.
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
