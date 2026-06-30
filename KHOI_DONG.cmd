@echo off
echo ============================================================
echo  LedgerFlow Studio - Khoi Dong Phan Mem
echo ============================================================
echo.
echo [1] Dang khoi dong server...
cd /d "%~dp0"

:: Kill any existing node processes on ports 3000/3001
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3005 "') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%a 2>nul

echo [2] Mo trinh duyet sau 5 giay...
start "" /b cmd /c "timeout /t 5 /nobreak >nul && start http://127.0.0.1:3005"

echo.
echo  SERVER: http://127.0.0.1:3005
echo  DAEMON: http://127.0.0.1:3001
echo.
echo  ** Neu trang web hien thi cu, nhan Ctrl+Shift+R trong trinh duyet **
echo  ** de lam moi va xoa cache **
echo.
echo  Nhan Ctrl+C de dung phan mem.
echo ============================================================
echo.
npm run dev
