@echo off
setlocal
cd /d "%~dp0"
for %%I in ("%~dp0.") do set "PROJECT_ROOT=%%~fI"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Reindirizza-pagine-autore.ps1" -Root "%PROJECT_ROOT%" -Apply
if errorlevel 1 goto failed
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Analizza-e-reindirizza-index.ps1" -Root "%PROJECT_ROOT%" -Apply
if errorlevel 1 goto failed
echo.
echo Applicazione completata. Controllare i rapporti e git status.
pause
exit /b 0
:failed
echo.
echo Applicazione interrotta. Controllare i rapporti e i backup.
pause
exit /b 1
