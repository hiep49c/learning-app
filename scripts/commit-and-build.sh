#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

cd /home/hiepnt/projects/app

echo "=== Committing ==="
git add -A
git commit -m "restore TTS, bookmark, quiz, mark-complete to LessonScreen" || true

echo ""
echo "=== Rebuilding ==="
bash scripts/rebuild.sh

echo ""
echo "=== Copying APK to Windows ==="
bash scripts/copy-apk.sh
