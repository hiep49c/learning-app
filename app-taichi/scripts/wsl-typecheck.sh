#!/usr/bin/env bash
set -e
cd ~/app-taichi-build
# sync latest source (keep node_modules)
rsync -a --exclude node_modules --exclude .expo --exclude android --exclude assets \
  /mnt/d/PROJECT/my-service/learning-app/app-taichi/ ~/app-taichi-build/
npx tsc --noEmit
echo "TYPECHECK_OK"
