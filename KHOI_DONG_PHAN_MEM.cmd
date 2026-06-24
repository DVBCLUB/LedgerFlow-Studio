@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: LedgerFlow Hub - Startup Script
:: Phien ban: 2.0 - Cap nhat June 2026
:: Mo ta: Script khoi dong ung dung LedgerFlow Hub
:: ============================================================================

 title Khoi dong LedgerFlow Hub
 chcp 65001 > nul
 cls

 echo =============================================================================
 echo                    KHOI DONG LEDGERFLOW HUB
 echo =============================================================================
 echo.
 echo  Dang tim ban desktop trong thu muc release...
 echo  Neu chua co release moi, hay chay: npm run desktop:pack
 echo.
 echo  Vui long doi giay lat...
 echo.

:: Kiem tra va khoi dong phien ban phu hop nhat
 set "APP_DIR=%~dp0"
 set "RELEASE_DIR=%APP_DIR%release"
 
:: Ban Windows desktop duy nhat: release\win-unpacked\LedgerFlow Hub.exe
 set "UNPACKED_EXE=%RELEASE_DIR%\win-unpacked\LedgerFlow Hub.exe"

 if exist "%UNPACKED_EXE%" (
   echo [DESKTOP] Dang mo ban Windows desktop: "%UNPACKED_EXE%"
   echo.
   start "" "%UNPACKED_EXE%"
   timeout /t 3 /nobreak > nul
   exit /b 0
 )

:: Neu khong tim thay file EXE nao
 echo [LOI] Khong tim thay phien ban Windows desktop tai:
 echo "%UNPACKED_EXE%"
 echo.
 echo Hay chay cac lenh sau de tao lai ban desktop:
 echo.
 echo   cd /d "%APP_DIR%"
 echo   npm install
 echo   npm run desktop:pack
 echo.
 echo Hoac chay:
 echo   tools\windows\BUILD_WINDOWS_INSTALLER.bat
 echo.
 pause
exit /b 1
