@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Correggi-menu-e-canonici.ps1" -Root "%~dp0." -Apply
if errorlevel 1 (
  echo Correzione interrotta. Controlla l'errore sopra.
  pause
  exit /b 1
)
echo Controlla menu-canonici-report.txt prima di pubblicare.
pause
