#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || nvm use 20 2>/dev/null || true
echo "Node version: $(node --version)"
exec "$@"
