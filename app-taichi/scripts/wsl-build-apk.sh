#!/usr/bin/env bash
# Build a release APK for app-taichi inside WSL.
set -e

export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
export JAVA_HOME="${JAVA_HOME:-$(dirname $(dirname $(readlink -f $(which java))))}"

DST=~/app-taichi-build
cd "$DST"

# sync latest source (keep node_modules; assets already present)
rsync -a --exclude node_modules --exclude .expo --exclude android \
  /mnt/d/PROJECT/my-service/learning-app/app-taichi/ "$DST"/

echo "=== expo prebuild (android) ==="
npx expo prebuild --platform android --clean --no-install

echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# --- Release signing: generate a keystore once, wire into gradle ---
KEYSTORE="$DST/android/app/taichi-release.keystore"
if [ ! -f "$KEYSTORE" ]; then
  echo "=== generating release keystore ==="
  keytool -genkeypair -v -storetype PKCS12 \
    -keystore "$KEYSTORE" \
    -alias taichi -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass taichi123 -keypass taichi123 \
    -dname "CN=TaiChi24, OU=App, O=TaiChi, L=City, S=State, C=VN"
fi

GRADLE_PROPS="$DST/android/gradle.properties"
if ! grep -q "TAICHI_UPLOAD_STORE_FILE" "$GRADLE_PROPS"; then
  cat >> "$GRADLE_PROPS" <<'EOF'

TAICHI_UPLOAD_STORE_FILE=taichi-release.keystore
TAICHI_UPLOAD_KEY_ALIAS=taichi
TAICHI_UPLOAD_STORE_PASSWORD=taichi123
TAICHI_UPLOAD_KEY_PASSWORD=taichi123
EOF
fi

# Patch app/build.gradle to add release signingConfig if not present
APP_GRADLE="$DST/android/app/build.gradle"
if ! grep -q "TAICHI_UPLOAD_STORE_FILE" "$APP_GRADLE"; then
  echo "=== patching app/build.gradle signing ==="
  node "$DST/scripts/patch-gradle.js" "$APP_GRADLE"
fi

echo "=== gradle assembleRelease ==="
cd android
chmod +x gradlew
./gradlew assembleRelease --no-daemon

APK=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
echo "APK_BUILT=$APK"
cp "$APK" "$DST/app-taichi.apk"
cp "$APK" /mnt/d/PROJECT/my-service/learning-app/app-taichi/app-taichi.apk
echo "APK copied to project root: app-taichi.apk"
ls -lh /mnt/d/PROJECT/my-service/learning-app/app-taichi/app-taichi.apk
