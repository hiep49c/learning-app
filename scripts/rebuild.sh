#!/bin/bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "Node: $(node --version)"
echo "Time: $(date)"
echo ""

# Clean old android dir and rebuild
rm -rf android

echo "=== Step 1: Expo Prebuild ==="
npx expo prebuild --platform android --clean --no-install 2>&1
echo ""

echo "sdk.dir=$ANDROID_HOME" > android/local.properties

echo "=== Step 2: Gradle Build ==="
cd android
chmod +x gradlew
./gradlew assembleRelease --no-daemon --stacktrace 2>&1
BUILD_EXIT=$?
cd ..

if [ $BUILD_EXIT -ne 0 ]; then
    echo ""
    echo "!!! BUILD FAILED with exit code $BUILD_EXIT !!!"
    exit 1
fi

echo ""
echo "=== Step 3: Copy APK ==="
APK=$(find android/app/build/outputs -name "*.apk" -type f | head -1)
if [ -n "$APK" ]; then
    cp "$APK" ./java-spring-course.apk
    ls -lh java-spring-course.apk
    echo "BUILD SUCCESS at $(date)"
else
    echo "No APK found!"
    exit 1
fi
