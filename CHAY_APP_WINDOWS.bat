@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title LedgerFlow Studio OS - Windows Desktop

set SCRIPT_DIR=%~dp0
pushd "%SCRIPT_DIR%" >nul

if exist "release\win-unpacked\LedgerFlow Hub.exe" (
  echo [INFO] Dang khoi chay LedgerFlow Hub Windows Desktop App...
  start "" "release\win-unpacked\LedgerFlow Hub.exe"
  popd >nul
  exit /b 0
) else (
  echo [LOI] Khong tim thay ban Windows Desktop trong release\win-unpacked.
  echo Dang tien hanh dong goi nhanh...
  call npm run desktop:dist
  if exist "release\win-unpacked\LedgerFlow Hub.exe" (
    start "" "release\win-unpacked\LedgerFlow Hub.exe"
  ) else (
    echo [LOI] Dong goi thất bại. Hay kiem tra lai Node.js environment.
    pause
  )
  popd >nul
  exit /b 1
)
