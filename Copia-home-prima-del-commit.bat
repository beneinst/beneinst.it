@echo off
setlocal
title Beneinst - Aggiornamento index.html
cd /d "%~dp0"

if not exist "index.htm" (
    echo ERRORE: index.htm non trovato.
    echo Metti questo BAT nella cartella principale del sito, accanto a index.htm.
    pause
    exit /b 1
)

for %%F in ("index.htm") do if %%~zF EQU 0 (
    echo ERRORE: index.htm e vuoto. Nessuna copia eseguita.
    pause
    exit /b 1
)

copy /b /y "index.htm" "index.html" >nul
if errorlevel 1 (
    echo ERRORE: impossibile aggiornare index.html.
    pause
    exit /b 1
)

fc /b "index.htm" "index.html" >nul
if errorlevel 1 (
    echo ERRORE: verifica della copia fallita.
    pause
    exit /b 1
)

echo index.html aggiornato: copia identica di index.htm.
echo Ora puoi controllare le modifiche e procedere con il commit.
pause
exit /b 0
