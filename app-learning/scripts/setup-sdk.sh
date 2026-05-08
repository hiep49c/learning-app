#!/bin/bash
set -e

export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "=== Accepting licenses ==="
echo y | sdkmanager --licenses 2>/dev/null || true
echo y | sdkmanager --licenses 2>/dev/null || true
echo y | sdkmanager --licenses 2>/dev/null || true
echo y | sdkmanager --licenses 2>/dev/null || true
echo y | sdkmanager --licenses 2>/dev/null || true

echo ""
echo "=== Installing SDK packages ==="
sdkmanager --install "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo ""
echo "=== Verifying ==="
sdkmanager --list_installed 2>/dev/null || sdkmanager --list 2>/dev/null | head -10

echo ""
echo "=== Done ==="
echo "ANDROID_HOME=$ANDROID_HOME"
