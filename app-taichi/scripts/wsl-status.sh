#!/usr/bin/env bash
echo "=== gradle/java processes ==="
pgrep -fa java | head -5 || echo "no java process"
echo "=== android dir ==="
ls ~/app-taichi-build/android/ 2>&1 | head -20
echo "=== keystore ==="
ls -l ~/app-taichi-build/android/app/taichi-release.keystore 2>&1
echo "=== apk output dir ==="
ls -lhR ~/app-taichi-build/android/app/build/outputs/ 2>&1 | head -20
echo "=== gradle build gradle signing patched? ==="
grep -c TAICHI_UPLOAD_STORE_FILE ~/app-taichi-build/android/app/build.gradle 2>&1
