@echo off
title Khoi dong LedgerFlow Hub
chcp 65001 > nul
cls

echo =====================================================================
echo                 KHOI DONG LEDGERFLOW STUDIO
echo =====================================================================
echo.
echo  Tai khoan dang nhap mac dinh (Local / Desktop):
echo  --------------------------------------------------
echo  Email:     founder@ledgerflow.local
echo  Mat khau:  admin123
echo  --------------------------------------------------
echo.

set "APP_EXE=%~dp0release\win-unpacked\LedgerFlow Hub.exe"

if exist "%APP_EXE%" (
    echo [DESKTOP] Dang mo ban Windows desktop: "%APP_EXE%"
    start "" "%APP_EXE%"
    exit /b 0
)

echo [LOI] Khong tim thay phien ban Windows desktop tai:
echo "%APP_EXE%"
echo.
echo Hay chay tools\windows\BUILD_WINDOWS_INSTALLER.bat de tao lai ban desktop.
pause
exit /b 1
