#!/usr/bin/env bash
# Sync project into Linux FS and install deps (run inside WSL).
set -e
SRC=/mnt/d/PROJECT/my-service/learning-app/app-taichi
DST=~/app-taichi-build
mkdir -p "$DST"
rsync -a --delete --exclude node_modules --exclude .expo --exclude android "$SRC"/ "$DST"/
cd "$DST"
echo "=== installing deps ==="
npm install --no-audit --no-fund
echo "=== install done ==="
ls node_modules/.bin | grep -E "expo|tsc" | head
