---
inclusion: manual
---

# Build & Release Rules

## Expo Configuration
- Dùng Expo Managed Workflow, KHÔNG eject trừ khi bắt buộc
- `app.json` / `app.config.ts` là single source of truth cho app config
- Version bumping: semver (major.minor.patch), `buildNumber` tăng mỗi build
- Dùng `expo-updates` cho OTA updates nếu cần sau này (nhưng mặc định tắt vì local-first)

## Environment Management
- 3 environments: development, staging, production
- Dùng `app.config.ts` với biến môi trường để switch config
- Bundle identifier khác nhau mỗi env:
  - Dev: `com.app.studyplanner.dev`
  - Staging: `com.app.studyplanner.staging`
  - Prod: `com.app.studyplanner`
- KHÔNG dùng `.env` cho secrets — dùng EAS Secrets

## Build Commands
- `npx expo start` — development server
- `eas build --platform ios --profile development` — iOS dev build
- `eas build --platform android --profile development` — Android dev build
- `eas build --platform all --profile production` — production build
- `eas submit` — submit to App Store / Google Play

## Pre-build Checklist (Tự động qua CI)
1. TypeScript compile: `npx tsc --noEmit`
2. Lint: `npx eslint src/ --ext .ts,.tsx`
3. Tests pass: `npm test`
4. No console.log in production code (ESLint rule)
5. Bundle size check: không vượt quá threshold đã set

## Android Specific
- `minSdkVersion`: 24 (Android 7.0)
- `targetSdkVersion`: 34 (Android 14)
- Signing: dùng EAS managed credentials
- ProGuard enabled cho release builds
- Adaptive icon + legacy icon
- Splash screen dùng `expo-splash-screen`

## iOS Specific
- Minimum iOS version: 15.0
- Signing: dùng EAS managed credentials
- App Transport Security: default (HTTPS only)
- Privacy manifest: khai báo đầy đủ theo Apple requirements
- Launch screen dùng `expo-splash-screen`

## Code Quality Gates
- ESLint + Prettier bắt buộc
- ESLint config: `@react-native/eslint-config` + custom rules
- Prettier config thống nhất trong `.prettierrc`
- Husky + lint-staged cho pre-commit hooks
- Commit message format: Conventional Commits (`feat:`, `fix:`, `chore:`)

## Git Workflow
- Branch naming: `feature/`, `fix/`, `chore/`, `release/`
- Main branch luôn deployable
- PR required cho mọi merge vào main
- Squash merge để giữ history sạch
- Tag mỗi release: `v1.0.0`

## App Store Guidelines
- KHÔNG vi phạm App Store Review Guidelines hoặc Google Play policies
- Privacy policy page bắt buộc (dù app không thu thập data)
- App phải có giá trị sử dụng thực tế, không chỉ là wrapper
- Screenshots và metadata chuẩn bị cho cả 2 stores
- Rating prompt: dùng `expo-store-review`, hiển thị sau khi user dùng app ≥ 3 ngày

## Expo SDK Upgrade
- Upgrade Expo SDK mỗi 2-3 versions, KHÔNG để quá cũ (max 2 versions behind)
- Trước khi upgrade: đọc changelog, kiểm tra breaking changes
- Upgrade theo thứ tự: `expo` → `expo-*` packages → third-party packages
- Dùng `npx expo install --fix` để auto-fix compatible versions
- Sau upgrade: chạy full test suite + build cả iOS và Android
- KHÔNG upgrade Expo SDK cùng lúc với feature changes — tách riêng commit/PR

## App Versioning & Update Strategy
- `version` (semver) hiển thị cho user: tăng khi có feature mới hoặc fix quan trọng
- `buildNumber` / `versionCode` tăng MỖI build gửi lên store (không bao giờ giảm)
- Khi thay đổi DB schema: bump minor version tối thiểu
- Lưu schema version trong DB — kiểm tra khi app start để trigger migration
- Nếu cần force update (breaking change): hiển thị dialog yêu cầu user update từ store
