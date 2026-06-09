@echo off
chcp 65001 >nul
title LedgerFlow Studio - Run Local

cd /d "%~dp0"

echo.
echo ================================================
echo   LedgerFlow Studio - Simulation Lab
echo   Chay tren may tinh local
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js.
  echo Tai Node.js LTS tai: https://nodejs.org/
  echo Cai xong roi bam lai file RUN_LOCAL.bat nay.
  pause
  exit /b 1
)

if not exist package.json (
  echo [LOI] Khong thay package.json. Hay de file .bat o thu muc goc du an.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [1/2] Chua co node_modules, dang cai thu vien...
  call npm install
  if errorlevel 1 (
    echo [LOI] npm install that bai.
    pause
    exit /b 1
  )
) else (
  echo [1/2] Da co node_modules, bo qua npm install.
)

echo [2/2] Dang mo trinh duyet...
start "" "http://localhost:5173"

echo.
echo Dang chay app. Neu trinh duyet chua hien, mo:
echo http://localhost:5173
echo.
echo Dung dong cua so nay khi dang dung app.
echo Muon tat app: bam Ctrl + C, roi bam Y.
echo.

call npm run dev

pause
