@echo off
chcp 65001 >nul
title LedgerFlow Studio - Legacy Desktop Build Wrapper
setlocal

cd /d "%~dp0\..\.."

echo.
echo ================================================
echo   Legacy wrapper
echo ================================================
echo File build chinh hien nay la BUILD_WINDOWS_INSTALLER.bat o thu muc goc.
echo Wrapper nay chi goi lai file chinh de tranh co nhieu nut build lung tung.
echo.

if not exist BUILD_WINDOWS_INSTALLER.bat (
  echo [LOI] Khong thay BUILD_WINDOWS_INSTALLER.bat o thu muc goc.
  pause
  exit /b 1
)

call BUILD_WINDOWS_INSTALLER.bat

endlocal
