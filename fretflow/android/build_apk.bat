@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================================
echo   McFretsky Instant Android SDK APK Compiler (No Gradle)
echo ========================================================

:: 1. Locate Android Studio JDK
set "JAVA_HOME="
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
)
if not defined JAVA_HOME (
    echo [ERROR] Could not find Android Studio JBR at "C:\Program Files\Android\Android Studio\jbr"
    pause
    exit /b 1
)
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
set "JAVAC_EXE=%JAVA_HOME%\bin\javac.exe"
set "JAR_EXE=%JAVA_HOME%\bin\jar.exe"
set "KEYTOOL_EXE=%JAVA_HOME%\bin\keytool.exe"
echo [OK] JDK: %JAVA_HOME%

:: 2. Locate Android SDK
set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"
if not exist "%SDK_DIR%" (
    echo [ERROR] Could not find Android SDK at "%SDK_DIR%"
    pause
    exit /b 1
)

:: Find latest build-tools
set "BUILD_TOOLS="
for /f "delims=" %%D in ('dir /b /ad /on "%SDK_DIR%\build-tools" 2^>nul') do (
    set "BUILD_TOOLS=%SDK_DIR%\build-tools\%%D"
)
if not defined BUILD_TOOLS (
    echo [ERROR] No Android SDK build-tools found in "%SDK_DIR%\build-tools".
    pause
    exit /b 1
)
echo [OK] Build-Tools: %BUILD_TOOLS%

:: Find latest android.jar platform
set "ANDROID_JAR="
for /f "delims=" %%P in ('dir /b /ad /on "%SDK_DIR%\platforms" 2^>nul') do (
    if exist "%SDK_DIR%\platforms\%%P\android.jar" (
        set "ANDROID_JAR=%SDK_DIR%\platforms\%%P\android.jar"
    )
)
if not defined ANDROID_JAR (
    echo [ERROR] No android.jar platform found in "%SDK_DIR%\platforms".
    pause
    exit /b 1
)
echo [OK] Platform: %ANDROID_JAR%

:: 3. Prepare clean build directory
if exist "build_sdk" rmdir /s /q "build_sdk"
mkdir "build_sdk\gen"
mkdir "build_sdk\classes"

:: 4. Compile resources with aapt2
echo [1/5] Compiling resources (aapt2)...
"%BUILD_TOOLS%\aapt2.exe" compile --dir "app\src\main\res" -o "build_sdk\res.zip"
if errorlevel 1 (
    echo [ERROR] aapt2 compile failed.
    pause
    exit /b 1
)

:: 5. Link resources, manifest, and web app assets
echo [2/5] Linking APK resources and HTML assets...
"%BUILD_TOOLS%\aapt2.exe" link -o "build_sdk\unaligned.apk" ^
    -I "%ANDROID_JAR%" ^
    --manifest "app\src\main\AndroidManifest.xml" ^
    --java "build_sdk\gen" ^
    -A "app\src\main\assets" ^
    "build_sdk\res.zip" ^
    --auto-add-overlay
if errorlevel 1 (
    echo [ERROR] aapt2 link failed.
    pause
    exit /b 1
)

:: 6. Compile Java sources
echo [3/5] Compiling Java sources (javac)...
"%JAVAC_EXE%" --release 8 -cp "%ANDROID_JAR%" -d "build_sdk\classes" ^
    "app\src\main\java\com\fretsky\scaletrainer\MainActivity.java" ^
    "build_sdk\gen\com\fretsky\scaletrainer\R.java"
if errorlevel 1 (
    echo [ERROR] javac compilation failed.
    pause
    exit /b 1
)

:: 7. Convert JVM bytecode to Dalvik DEX (d8)
echo [4/5] Building classes.dex (d8)...
set "CLASS_FILES="
for %%C in ("build_sdk\classes\com\fretsky\scaletrainer\*.class") do (
    set "CLASS_FILES=!CLASS_FILES! "%%~fC""
)
"%JAVA_EXE%" -cp "%BUILD_TOOLS%\lib\d8.jar" com.android.tools.r8.D8 ^
    --lib "%ANDROID_JAR%" ^
    --min-api 24 ^
    --output "build_sdk" ^
    !CLASS_FILES!
if errorlevel 1 (
    echo [ERROR] d8 dex conversion failed.
    pause
    exit /b 1
)

:: Add classes.dex into unaligned.apk
pushd "build_sdk"
"%JAR_EXE%" uf "unaligned.apk" "classes.dex"
popd

:: 8. Align and Sign APK
echo [5/5] Aligning and signing McFretsky.apk...
"%BUILD_TOOLS%\zipalign.exe" -f -p 4 "build_sdk\unaligned.apk" "build_sdk\aligned.apk"

if not exist "build_sdk\debug.keystore" (
    "%KEYTOOL_EXE%" -genkeypair -v ^
        -keystore "build_sdk\debug.keystore" ^
        -storepass android ^
        -alias androiddebugkey ^
        -keypass android ^
        -keyalg RSA -keysize 2048 -validity 10000 ^
        -dname "CN=Android Debug,O=Android,C=US" >nul 2>&1
)

"%JAVA_EXE%" -jar "%BUILD_TOOLS%\lib\apksigner.jar" sign ^
    --ks "build_sdk\debug.keystore" ^
    --ks-pass pass:android ^
    --key-pass pass:android ^
    --out "McFretsky.apk" ^
    "build_sdk\aligned.apk"
if errorlevel 1 (
    echo [ERROR] apksigner failed.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   SUCCESS! Your installable APK is ready at:
echo   %~dp0McFretsky.apk
echo ========================================================
explorer.exe /select,"%~dp0McFretsky.apk"
pause
