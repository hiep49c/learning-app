/**
 * Inject a release signingConfig into android/app/build.gradle and point the
 * release buildType at it. Idempotent-ish (guarded by caller grep).
 */
const fs = require('fs');
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');

// 1) Add signingConfigs.release inside android { ... } (after signingConfigs { debug {...} })
const signingBlock = `
        release {
            storeFile file(TAICHI_UPLOAD_STORE_FILE)
            storePassword TAICHI_UPLOAD_STORE_PASSWORD
            keyAlias TAICHI_UPLOAD_KEY_ALIAS
            keyPassword TAICHI_UPLOAD_KEY_PASSWORD
        }`;

if (s.includes('signingConfigs {')) {
  // insert release config right after "signingConfigs {"
  s = s.replace(/signingConfigs\s*\{/, (m) => `${m}${signingBlock}`);
} else {
  // add a signingConfigs block inside android { }
  s = s.replace(/android\s*\{/, (m) => `${m}\n    signingConfigs {${signingBlock}\n    }`);
}

// 2) Point release buildType to the release signingConfig
// Replace the signingConfig line within buildTypes.release
s = s.replace(
  /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
  `$1signingConfig signingConfigs.release`,
);

fs.writeFileSync(file, s);
console.log('patched', file);
