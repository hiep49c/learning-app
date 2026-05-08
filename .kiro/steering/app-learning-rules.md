---
inclusion: fileMatch
fileMatchPattern: "**/app-learning/**/*.ts,**/app-learning/**/*.tsx,**/app-learning/**/*.js"
---

# App-Learning — Quy Tắc Bắt Buộc

## Khi thay đổi seed data (`assets/seed-data/`)

- **PHẢI bump `CURRENT_SEED_VERSION`** trong `src/services/SeedService.ts` mỗi khi thay đổi/thêm file trong `assets/seed-data/`
- Nếu không bump: app đã cài sẽ KHÔNG re-seed → user không thấy data mới
- Áp dụng khi: thêm modules, thêm lessons, thêm keywords, sửa quiz, thêm môn học mới

## Khi thêm môn học mới hoặc sửa query hiển thị data

- Mọi query hiển thị data cho user **PHẢI filter theo `currentSubject`** từ `subjectStore`
- Convention phân biệt môn: dùng **prefix `vocab-`** cho English, không có prefix cho Java
  - English: `module_id LIKE 'vocab-%'`, `lesson_id LIKE 'vocab-%'`
  - Java: `module_id NOT LIKE 'vocab-%'`, `lesson_id NOT LIKE 'vocab-%'`
- Nếu thêm môn mới: định nghĩa prefix mới (ví dụ: `python-`) và update filter logic trong:
  - `src/services/SearchService.ts`
  - `src/stores/courseStore.ts` (loadCourseTree)
  - `src/stores/vocabStore.ts` (loadTopics)
  - `app/(tabs)/learn/index.tsx`

## Tên app & config

- Tên app config ở **2 nơi**: `app.json` (Expo) + `android/app/src/main/res/values/strings.xml`
- Khi đổi tên: phải sửa CẢ HAI file
- Tên hiện tại: "Học Tập"

## Vocab data pipeline

- Source: `scripts/vocab-gen/w*.js` → `node generate.js` → `doc/english-vocabulary/words.json`
- Seed: `node scripts/generate-vocab-seed.js` → `assets/seed-data/vocab-*.json`
- Docx: `python3 scripts/export-dictionary.py` → `English-Dictionary.docx`
- Khi enrich vocab files → chạy lại cả pipeline + bump seed version
