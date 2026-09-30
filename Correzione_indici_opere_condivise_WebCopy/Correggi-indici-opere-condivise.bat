@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Correggi-indici-opere-condivise.ps1" -Root "%~dp0" -Apply
if errorlevel 1 (
  echo Correzione interrotta. Controlla il messaggio di errore sopra.
  pause
  exit /b 1
)
echo Correzione completata. Controlla indici-opere-report.txt, poi rigenera la sitemap.
pause
