@echo off
setlocal
title Beneinst - Generazione sitemap

rem Usa UTF-8 per visualizzare correttamente i messaggi di PowerShell.
chcp 65001 >nul

cd /d "%~dp0"

echo.
echo ===============================================
echo   BENEINST.EU - GENERAZIONE SITEMAP
echo ===============================================
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0genera-sitemap-beneinst.ps1"
set "BENEINST_EXIT=%ERRORLEVEL%"

echo.
if "%BENEINST_EXIT%"=="0" (
  echo Sitemap generata correttamente.
) else (
  echo ATTENZIONE: la generazione non e stata completata.
)

echo.
pause
exit /b %BENEINST_EXIT%
