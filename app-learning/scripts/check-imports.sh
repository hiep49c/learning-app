#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

cd /home/hiepnt/projects/app

echo "=== Checking critical imports ==="
node -e "
const mods = ['expo-clipboard', 'expo-speech', 'expo-crypto', 'expo-router', 'react-native-paper', '@nozbe/watermelondb', 'zustand'];
for (const m of mods) {
  try {
    require(m);
    console.log('OK:', m);
  } catch(e) {
    console.log('FAIL:', m, '-', e.message.split('\n')[0]);
  }
}
"

echo ""
echo "=== Checking package.json for expo-speech ==="
node -e "
const pkg = require('./package.json');
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
console.log('expo-speech:', deps['expo-speech'] || 'NOT FOUND');
console.log('expo-clipboard:', deps['expo-clipboard'] || 'NOT FOUND');
"
