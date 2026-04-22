#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

cd /home/hiepnt/projects/app

echo "=== Committing ==="
git add -A
git commit -m "fix: simplified LessonScreen with ErrorBoundary" || true

echo ""
echo "=== Rebuilding ==="
bash scripts/rebuild.sh
