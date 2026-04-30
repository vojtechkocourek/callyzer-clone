@echo off
setlocal
title Callyzer Clone - Clean reinstall

cd /d "%~dp0web"

echo.
echo ==============================================
echo   Clean reinstall
echo ==============================================
echo.
echo This will:
echo   1. Delete the broken node_modules folder
echo   2. Delete package-lock.json
echo   3. Reinstall all dependencies from scratch
echo.
echo If OneDrive keeps interfering, pause it before
echo continuing: right-click the OneDrive cloud icon
echo in the taskbar, then "Pause syncing".
echo.
pause

echo.
echo Removing node_modules...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del /q "package-lock.json"
if exist ".next" rmdir /s /q ".next"

echo Installing dependencies fresh...
echo.
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo [!] Install failed. Please share the messages above with Claude.
    pause
    exit /b 1
)

echo.
echo Done. You can now double-click "Start Callyzer Clone.bat".
echo.
pause
