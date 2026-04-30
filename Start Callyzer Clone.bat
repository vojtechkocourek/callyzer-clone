@echo off
setlocal
title Callyzer Clone

cd /d "%~dp0web"

echo.
echo ==============================================
echo   Callyzer Clone - one-click launcher
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [!] Node.js is not installed.
    echo.
    echo Please install the LTS version from:
    echo     https://nodejs.org
    echo.
    echo Run the installer, click Next a few times, then
    echo come back here and double-click this file again.
    echo.
    start "" "https://nodejs.org/en/download"
    pause
    exit /b 1
)

REM Detect a broken or partial install (common cause: OneDrive syncing the
REM Documents folder mid-install). If key files are missing, wipe and reinstall.
set "NEEDS_INSTALL=0"
if not exist "node_modules" set "NEEDS_INSTALL=1"
if not exist "node_modules\next\package.json" set "NEEDS_INSTALL=1"
if not exist "node_modules\util-deprecate\node.js" set "NEEDS_INSTALL=1"
if not exist "node_modules\react\package.json" set "NEEDS_INSTALL=1"

if "%NEEDS_INSTALL%"=="1" (
    if exist "node_modules" (
        echo Found a partial install - cleaning up first...
        rmdir /s /q "node_modules"
        if exist "package-lock.json" del /q "package-lock.json"
        echo.
    )
    echo Installing dependencies (one-time, takes ~1 minute)...
    echo.
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo [!] npm install failed.
        echo.
        echo Most common cause: OneDrive is syncing the Documents folder
        echo while npm is writing thousands of small files.
        echo.
        echo Quick fix: pause OneDrive sync ^(right-click the OneDrive
        echo cloud icon in the taskbar, then "Pause syncing"^), then
        echo double-click "Clean reinstall.bat" and try again.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Setup complete.
    echo.
)

echo Starting the server on http://localhost:3000 ...
echo.
echo - The browser will open automatically once the server is ready
echo   (usually 10-20 seconds the first time).
echo - To stop the server, close this window or press Ctrl+C.
echo.

REM Spawn a small background helper that polls localhost:3000 and only
REM opens the browser once the server actually responds. This avoids the
REM "blank page" race when the browser tab opens before Next.js is ready.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command ^
  "$ErrorActionPreference='SilentlyContinue';" ^
  "for ($i=0; $i -lt 90; $i++) {" ^
  "  try { $r = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 2;" ^
  "        if ($r.StatusCode) { Start-Process http://localhost:3000; break } }" ^
  "  catch { Start-Sleep -Seconds 1 } }"

call npm run dev

endlocal
