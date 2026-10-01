@echo off
setlocal
cd /d "%~dp0"
for %%I in ("%~dp0.") do set "PROJECT_ROOT=%%~fI"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Reindirizza-pagine-autore.ps1" -Root "%PROJECT_ROOT%"
if errorlevel 1 goto failed
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Analizza-e-reindirizza-index.ps1" -Root "%PROJECT_ROOT%"
if errorlevel 1 goto failed
echo.
echo Anteprima completata. Leggere entrambi i rapporti prima di applicare.
pause
exit /b 0
:failed
echo.
echo Analisi interrotta. Controllare il messaggio precedente.
pause
exit /b 1
