@echo off
setlocal EnableDelayedExpansion
title Build Callyzer APK

set "TOOLS=%LOCALAPPDATA%\callyzer-clone\android-tools"
set "JDK_DIR=%TOOLS%\jdk-17"
set "SDK_DIR=%TOOLS%\android-sdk"
set "GRADLE_DIR=%TOOLS%\gradle-8.7"

REM Locate the android project. Prefer the OneDrive-safe copy.
set "PROJECT=%LOCALAPPDATA%\callyzer-clone\android"
if not exist "%PROJECT%\settings.gradle.kts" set "PROJECT=%~dp0android"
if not exist "%PROJECT%\settings.gradle.kts" (
    echo [!] Could not find the android project folder.
    echo.
    echo Run "Fix OneDrive and run.bat" first to copy the project
    echo into %%LOCALAPPDATA%%\callyzer-clone\, then come back here.
    pause
    exit /b 1
)

set "OUT=%~dp0apk"
mkdir "%TOOLS%" 2>nul
mkdir "%OUT%" 2>nul

echo.
echo ===================================================
echo   Building the Callyzer Android APK
echo ===================================================
echo.
echo Project:    %PROJECT%
echo Tools dir:  %TOOLS%
echo APK out:    %OUT%
echo.
echo This will:
echo  1. Download build tools the first time ^(~700 MB^)
echo  2. Compile the app ^(2-5 minutes^)
echo  3. Save the APK as: %OUT%\callyzer-clone.apk
echo.
echo Make sure you're on a stable internet connection.
echo.
pause

REM --------------------------------------------------
REM 1. JDK 17 (Eclipse Temurin)
REM --------------------------------------------------
if not exist "%JDK_DIR%\bin\java.exe" (
    echo.
    echo [1/4] Downloading JDK 17 ^(~180 MB^)...
    powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.11%%2B9/OpenJDK17U-jdk_x64_windows_hotspot_17.0.11_9.zip' -OutFile '%TOOLS%\jdk.zip' -UseBasicParsing"
    if errorlevel 1 (echo [!] JDK download failed. & pause & exit /b 1)
    echo Extracting JDK...
    powershell -NoProfile -Command "Expand-Archive -Path '%TOOLS%\jdk.zip' -DestinationPath '%TOOLS%' -Force"
    for /d %%d in ("%TOOLS%\jdk-17*") do if not exist "%JDK_DIR%" move "%%d" "%JDK_DIR%" >nul
    del "%TOOLS%\jdk.zip" 2>nul
)
set "JAVA_HOME=%JDK_DIR%"
set "PATH=%JAVA_HOME%\bin;%PATH%"
"%JAVA_HOME%\bin\java" -version >nul 2>&1
if errorlevel 1 (echo [!] JDK setup failed. & pause & exit /b 1)
echo JDK 17 ready.

REM --------------------------------------------------
REM 2. Android SDK (platform 34 + build-tools 34)
REM --------------------------------------------------
if not exist "%SDK_DIR%\platforms\android-34" (
    echo.
    echo [2/4] Setting up Android SDK ^(~500 MB^)...
    if not exist "%SDK_DIR%\cmdline-tools\latest\bin\sdkmanager.bat" (
        powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile '%TOOLS%\cmdline.zip' -UseBasicParsing"
        if errorlevel 1 (echo [!] Android SDK tools download failed. & pause & exit /b 1)
        powershell -NoProfile -Command "Expand-Archive -Path '%TOOLS%\cmdline.zip' -DestinationPath '%SDK_DIR%\cmdline-tools-tmp' -Force"
        if not exist "%SDK_DIR%\cmdline-tools" mkdir "%SDK_DIR%\cmdline-tools"
        move "%SDK_DIR%\cmdline-tools-tmp\cmdline-tools" "%SDK_DIR%\cmdline-tools\latest" >nul
        rmdir /s /q "%SDK_DIR%\cmdline-tools-tmp"
        del "%TOOLS%\cmdline.zip" 2>nul
    )
    REM Pre-accept licenses (well-known SHA hashes)
    if not exist "%SDK_DIR%\licenses" mkdir "%SDK_DIR%\licenses"
    > "%SDK_DIR%\licenses\android-sdk-license" echo.
    >> "%SDK_DIR%\licenses\android-sdk-license" echo 8933bad161af4178b1185d1a37fbf41ea5269c55
    >> "%SDK_DIR%\licenses\android-sdk-license" echo d56f5187479451eabf01fb78af6dfcb131a6481e
    >> "%SDK_DIR%\licenses\android-sdk-license" echo 24333f8a63b6825ea9c5514f83c2829b004d1fee
    > "%SDK_DIR%\licenses\android-sdk-preview-license" echo.
    >> "%SDK_DIR%\licenses\android-sdk-preview-license" echo 84831b9409646a918e30573bab4c9c91346d8abd

    set "ANDROID_HOME=%SDK_DIR%"
    set "ANDROID_SDK_ROOT=%SDK_DIR%"
    echo Installing Android platform-34 and build-tools ^(this is the big one^)...
    call "%SDK_DIR%\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="%SDK_DIR%" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
    if errorlevel 1 (echo [!] Android SDK install failed. & pause & exit /b 1)
)
set "ANDROID_HOME=%SDK_DIR%"
set "ANDROID_SDK_ROOT=%SDK_DIR%"
echo Android SDK ready.

REM --------------------------------------------------
REM 3. Gradle 8.7
REM --------------------------------------------------
if not exist "%GRADLE_DIR%\bin\gradle.bat" (
    echo.
    echo [3/4] Downloading Gradle 8.7 ^(~130 MB^)...
    powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.7-bin.zip' -OutFile '%TOOLS%\gradle.zip' -UseBasicParsing"
    if errorlevel 1 (echo [!] Gradle download failed. & pause & exit /b 1)
    powershell -NoProfile -Command "Expand-Archive -Path '%TOOLS%\gradle.zip' -DestinationPath '%TOOLS%' -Force"
    del "%TOOLS%\gradle.zip" 2>nul
)
echo Gradle ready.

REM --------------------------------------------------
REM 4. Build the APK
REM --------------------------------------------------
echo.
echo [4/4] Compiling the APK ^(2-5 minutes; lots of output is normal^)...
echo.

REM Tell gradle where the SDK is
> "%PROJECT%\local.properties" echo sdk.dir=%SDK_DIR:\=\\%

pushd "%PROJECT%"
call "%GRADLE_DIR%\bin\gradle.bat" :app:assembleDebug --no-daemon --console=plain
set "BUILD_EXIT=%ERRORLEVEL%"
popd

if not "%BUILD_EXIT%"=="0" (
    echo.
    echo [!] Build failed with exit code %BUILD_EXIT%.
    echo Copy the messages above and share them with Claude.
    pause
    exit /b %BUILD_EXIT%
)

REM --------------------------------------------------
REM 5. Copy APK out
REM --------------------------------------------------
set "BUILT_APK=%PROJECT%\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%BUILT_APK%" (
    echo [!] Build reported success but APK is missing at:
    echo     %BUILT_APK%
    pause
    exit /b 1
)

copy /Y "%BUILT_APK%" "%OUT%\callyzer-clone.apk" >nul
copy /Y "%BUILT_APK%" "%LOCALAPPDATA%\callyzer-clone\callyzer-clone.apk" >nul 2>nul

echo.
echo ===================================================
echo   APK built successfully
echo ===================================================
echo.
echo File: %OUT%\callyzer-clone.apk
echo.
echo Now install it on your Android phone:
echo  - See "Install APK on phone.txt" in this folder
echo  - Or just transfer the .apk to your phone and tap it
echo.
start "" "%OUT%"
pause
endlocal
