@echo off
setlocal EnableExtensions
title Callyzer Clone - safe launcher

set "SRC=%~dp0"
set "SAFE_DIR=%LOCALAPPDATA%\callyzer-clone"
set "SAFE_WEB=%SAFE_DIR%\web"

echo.
echo ==================================================
echo   Callyzer Clone - safe launcher (no OneDrive)
echo ==================================================
echo.
echo OneDrive backs up your Documents folder, which keeps
echo corrupting the npm install. This script moves the
echo project to a folder OneDrive doesn't touch:
echo.
echo   %SAFE_DIR%
echo.
echo and runs everything from there. The original copy in
echo Documents stays as it is - you can ignore it from now
echo on; just use this script (or the launcher in the new
echo location) to start the app in the future.
echo.
pause

echo.
echo Copying project files...
if not exist "%SAFE_DIR%" mkdir "%SAFE_DIR%"
robocopy "%SRC%web" "%SAFE_WEB%" /E /XD node_modules .next /NFL /NDL /NJH /NJS /NC /NS /NP >nul
robocopy "%SRC%" "%SAFE_DIR%" "*.bat" "README.md" /NFL /NDL /NJH /NJS /NC /NS /NP >nul
robocopy "%SRC%android" "%SAFE_DIR%\android" /E /XD .gradle build /NFL /NDL /NJH /NJS /NC /NS /NP >nul
echo Done copying.
echo.

cd /d "%SAFE_WEB%"

where node >nul 2>nul
if errorlevel 1 (
    echo [!] Node.js is not installed.
    echo.
    echo Please install the LTS version from:
    echo     https://nodejs.org
    echo.
    start "" "https://nodejs.org/en/download"
    pause
    exit /b 1
)

echo Installing dependencies in the safe folder ^(takes ~1 minute^)...
echo.
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del /q "package-lock.json"
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo [!] npm install failed even outside OneDrive.
    echo Please copy the messages above and share them.
    pause
    exit /b 1
)

echo.
echo Setup complete. Starting the server...
echo.
echo - The browser will open automatically once the server is ready
echo   ^(usually 10-20 seconds the first time^).
echo - To stop the server, close this window or press Ctrl+C.
echo.

start "" /min powershell -NoProfile -WindowStyle Hidden -Command ^
  "$ErrorActionPreference='SilentlyContinue';" ^
  "for ($i=0; $i -lt 90; $i++) {" ^
  "  try { $r = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 2;" ^
  "        if ($r.StatusCode) { Start-Process http://localhost:3000; break } }" ^
  "  catch { Start-Sleep -Seconds 1 } }"

call npm run dev

endlocal
