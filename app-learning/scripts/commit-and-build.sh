#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

cd /home/hiepnt/projects/app

echo "=== Committing ==="
git add -A
git commit -m "add prev/next lesson navigation, fix TTS chunking" || true

echo ""
echo "=== Rebuilding ==="
rm -f java-spring-course.apk
bash scripts/rebuild.sh

echo ""
echo "=== Copying APK ==="
bash scripts/copy-apk.sh
