@echo off
chcp 65001 >nul
title LedgerFlow Studio - Run Local
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ================================================
echo   LedgerFlow Studio - Simulation Lab
echo   Chay tren may tinh local
echo ================================================
echo.

REM Khong cho chay truc tiep trong WinRAR/Temp vi se khong thay package.json day du
echo %CD% | find /I "\Temp\Rar$" >nul
if not errorlevel 1 (
  echo [LOI] Ban dang chay file ben trong file .zip/.rar tam cua WinRAR.
  echo Hay GIAI NEN TOAN BO thu muc ra Desktop hoac o D: truoc.
  echo Vi du: Right click file zip/rar ^> Extract to LedgerFlow-Studio\
  pause
  exit /b 1
)

if not exist package.json (
  echo [LOI] Khong thay package.json.
  echo Nguyen nhan thuong gap: ban chua giai nen toan bo project, hoac dat file .bat sai thu muc.
  echo Hay giai nen toan bo repo roi chay RUN_LOCAL.bat trong thu muc co package.json.
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
  echo Da cai Node.js. Dang nap lai PATH...
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong thay npm. Hay dong cua so nay, mo lai RUN_LOCAL.bat sau khi cai Node.js xong.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [1/2] Chua co node_modules, dang cai thu vien...
  call npm install
  if errorlevel 1 (
    echo [LOI] npm install that bai. Xem log phia tren.
    pause
    exit /b 1
  )
) else (
  echo [1/2] Da co node_modules, bo qua npm install.
)

echo [2/2] Dang chay app...
echo.
echo Khi thay dong "Server running", mo trinh duyet tai:
echo http://localhost:3000
echo.
echo Neu khong vao duoc, thu:
echo http://127.0.0.1:3000
echo.
echo Dung dong cua so nay khi dang dung app.
echo Muon tat app: bam Ctrl + C, roi bam Y.
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul && start "" "http://localhost:3000""
call npm run dev

pause
