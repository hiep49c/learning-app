#!/usr/bin/env bash
# Run only the Gradle assembleRelease step (prebuild already done).
set -e
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

DST=~/app-taichi-build
cd "$DST/android"
chmod +x gradlew
./gradlew assembleRelease --no-daemon

APK=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
echo "APK_BUILT=$APK"
cp "$APK" "$DST/app-taichi.apk"
cp "$APK" /mnt/d/PROJECT/my-service/learning-app/app-taichi/app-taichi.apk
echo "DONE_COPIED"
ls -lh /mnt/d/PROJECT/my-service/learning-app/app-taichi/app-taichi.apk
