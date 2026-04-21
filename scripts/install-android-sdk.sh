#!/bin/bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || nvm use 20 2>/dev/null || true

ANDROID_HOME="$HOME/Android/Sdk"
CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"

echo "=== Installing Android SDK to $ANDROID_HOME ==="
mkdir -p "$ANDROID_HOME/cmdline-tools"

if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo "Downloading Android command-line tools..."
    cd /tmp
    
    # Download if not already cached
    if [ ! -f cmdline-tools.zip ]; then
        wget -q --show-progress "$CMDLINE_TOOLS_URL" -O cmdline-tools.zip
    fi
    
    # Use jar (from Java) to extract since unzip may not be available
    echo "Extracting..."
    mkdir -p cmdline-tools-extract
    cd cmdline-tools-extract
    jar xf /tmp/cmdline-tools.zip
    mv cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
    cd /tmp
    rm -rf cmdline-tools-extract cmdline-tools.zip
    echo "Command-line tools installed."
else
    echo "Command-line tools already installed."
fi

export ANDROID_HOME
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo ""
echo "=== Accepting licenses ==="
yes | sdkmanager --licenses > /dev/null 2>&1 || true

echo ""
echo "=== Installing required SDK packages ==="
sdkmanager --install "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo ""
echo "=== Setting up environment variables ==="
if ! grep -q "ANDROID_HOME" "$HOME/.bashrc" 2>/dev/null; then
    echo "" >> "$HOME/.bashrc"
    echo "# Android SDK" >> "$HOME/.bashrc"
    echo "export ANDROID_HOME=\"$HOME/Android/Sdk\"" >> "$HOME/.bashrc"
    echo 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"' >> "$HOME/.bashrc"
    echo "Environment variables added to .bashrc"
fi

echo ""
echo "=== Android SDK installation complete ==="
echo "ANDROID_HOME=$ANDROID_HOME"
ls -la "$ANDROID_HOME/build-tools/" 2>/dev/null
ls -la "$ANDROID_HOME/platforms/" 2>/dev/null
