#!/bin/bash
set -e

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || nvm use 20 2>/dev/null || true

# Set Android SDK & Java
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "Node: $(node --version)"
echo "ANDROID_HOME: $ANDROID_HOME"

# Step 1: Prebuild (skip if android/ already exists with our changes)
if [ ! -d "android" ]; then
    echo "=== Expo Prebuild ==="
    npx expo prebuild --platform android --clean --no-install
fi

# Step 2: Write local.properties
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# Step 3: Build APK
echo "=== Building APK ==="
cd android
chmod +x gradlew
./gradlew assembleRelease --no-daemon 2>&1
BUILD_EXIT=$?
cd ..

if [ $BUILD_EXIT -ne 0 ]; then
    echo "BUILD FAILED with exit code $BUILD_EXIT"
    exit 1
fi

# Step 4: Copy APK
echo "=== Locating APK ==="
APK_PATH=$(find android/app/build/outputs -name "*.apk" -type f 2>/dev/null | head -1)
if [ -n "$APK_PATH" ]; then
    cp "$APK_PATH" ./java-spring-course.apk
    echo "APK: $(ls -lh java-spring-course.apk)"
    echo "BUILD SUCCESS"
else
    echo "APK not found!"
    find android/app/build/outputs -type f 2>/dev/null
    exit 1
fi
