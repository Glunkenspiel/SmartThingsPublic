#!/usr/bin/env bash
# Linux/macOS equivalent of build_apk.bat: builds McFretsky.apk with the Android SDK tools, no Gradle.
# Usage: BUILD_TOOLS=/path/to/build-tools/34.0.0 ANDROID_JAR=/path/to/platforms/android-34/android.jar ./build_apk.sh
set -euo pipefail
cd "$(dirname "$0")"
: "${BUILD_TOOLS:?set BUILD_TOOLS to an Android SDK build-tools directory}"
: "${ANDROID_JAR:?set ANDROID_JAR to a platform android.jar}"
PKG_DIR=com/fretsky/scaletrainer
OUT=build_sdk
KEYSTORE="${KEYSTORE:-$OUT/debug.keystore}"

mkdir -p "$OUT"
rm -rf "$OUT/gen" "$OUT/classes" "$OUT"/*.apk "$OUT/res.zip" "$OUT/classes.dex"
mkdir -p "$OUT/gen" "$OUT/classes"

echo "[1/5] Compiling resources"
"$BUILD_TOOLS/aapt2" compile --dir app/src/main/res -o "$OUT/res.zip"
echo "[2/5] Linking resources and assets"
"$BUILD_TOOLS/aapt2" link -o "$OUT/unaligned.apk" -I "$ANDROID_JAR" \
  --manifest app/src/main/AndroidManifest.xml --java "$OUT/gen" \
  -A app/src/main/assets "$OUT/res.zip" --auto-add-overlay
echo "[3/5] Compiling Java"
javac --release 8 -Xlint:-options -cp "$ANDROID_JAR" -d "$OUT/classes" \
  "app/src/main/java/$PKG_DIR/MainActivity.java" "$OUT/gen/$PKG_DIR/R.java"
echo "[4/5] Building classes.dex"
java -cp "$BUILD_TOOLS/lib/d8.jar" com.android.tools.r8.D8 --lib "$ANDROID_JAR" --min-api 24 \
  --output "$OUT" "$OUT"/classes/$PKG_DIR/*.class
(cd "$OUT" && zip -q -j unaligned.apk classes.dex)
echo "[5/5] Aligning and signing"
"$BUILD_TOOLS/zipalign" -f -p 4 "$OUT/unaligned.apk" "$OUT/aligned.apk"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -storepass android -alias androiddebugkey -keypass android \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1
fi
java -jar "$BUILD_TOOLS/lib/apksigner.jar" sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android \
  --out McFretsky.apk "$OUT/aligned.apk"
java -jar "$BUILD_TOOLS/lib/apksigner.jar" verify --verbose McFretsky.apk | head -5
echo "Built $(pwd)/McFretsky.apk"
