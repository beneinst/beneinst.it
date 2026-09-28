@echo off
setlocal

title Beneinst - Correzione dominio del sito statico

set "SITE_ROOT=%~dp0"
set "SITE_ROOT=%SITE_ROOT:~0,-1%"

powershell.exe -NoProfile -ExecutionPolicy Bypass ^
  -File "%~dp0correggi-dominio-beneinst.ps1" ^
  -Root "%SITE_ROOT%"

echo.
if errorlevel 1 (
  echo ATTENZIONE: la correzione non e stata completata correttamente.
) else (
  echo Correzione completata.
)

echo.
pause
endlocal
