#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

node -e "
const d = require('./assets/seed-data/lessons.json');
const l = d[0];
console.log('Lesson ID:', l.id);
console.log('content_json type:', typeof l.content_json);
console.log('content_json length:', l.content_json.length);
const parsed = JSON.parse(l.content_json);
console.log('sections count:', parsed.sections.length);
console.log('first 3 sections:');
parsed.sections.slice(0, 3).forEach((s, i) => {
  console.log('  [' + i + '] type=' + s.type + ', text=' + (s.text || s.code || '').substring(0, 80));
});
"
