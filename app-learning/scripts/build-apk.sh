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
echo "Java: $(java -version 2>&1 | head -1)"
echo "ANDROID_HOME: $ANDROID_HOME"
echo ""

# Step 1: Generate native Android project
echo "=== Step 1: Expo Prebuild (generate Android project) ==="
npx expo prebuild --platform android --clean --no-install 2>&1 <<< "Y"
echo ""

# Step 2: Write local.properties
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
echo "local.properties written"
echo ""

# Step 3: Build APK with Gradle
echo "=== Step 2: Building APK with Gradle ==="
cd android
chmod +x gradlew
./gradlew assembleRelease 2>&1
cd ..
echo ""

# Step 4: Find and copy APK
echo "=== Step 3: Locating APK ==="
APK_PATH=$(find android/app/build/outputs -name "*.apk" -type f 2>/dev/null | head -1)
if [ -n "$APK_PATH" ]; then
    cp "$APK_PATH" ./java-spring-course.apk
    echo "APK copied to: $(pwd)/java-spring-course.apk"
    ls -lh java-spring-course.apk
else
    echo "APK not found in build outputs. Checking..."
    find android/app/build/outputs -type f -name "*.apk" 2>/dev/null
fi

echo ""
echo "=== Build complete ==="
