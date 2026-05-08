# Java Spring Course App — Hướng Dẫn Build & Triển Khai

## Yêu Cầu Hệ Thống

- **OS**: Ubuntu 22.04 (WSL2 trên Windows 11)
- **Node.js**: v20+ (qua nvm)
- **Java**: OpenJDK 17+ (đã có JDK 21)
- **Android SDK**: Đã cài tại `~/Android/Sdk`
- **Dung lượng ổ đĩa**: Tối thiểu 10GB trống

## Cấu Trúc Project

```
app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout (providers, SeedGate, AuthGate)
│   ├── (auth)/             # Login flow
│   ├── (tabs)/             # Tab navigation (Home, Course, Search, Bookmarks, Profile)
│   ├── quiz/               # Quiz screens
│   └── keyword/            # Keyword detail
├── src/
│   ├── components/         # UI components (CodeBlock, ContentRenderer, CourseTree, QuizCard, TTSControls, SeedingScreen, ToastProvider)
│   ├── database/           # WatermelonDB schema, models, provider (SQLiteAdapter)
│   ├── services/           # Business logic (Progress, Search, Quiz, Bookmark, ModuleUnlock, Seed, TTS)
│   ├── stores/             # Zustand stores (Auth, Progress, Course, Search, Quiz, Bookmark, TTS)
│   ├── theme/              # React Native Paper theme (light/dark)
│   └── utils/              # Toast utility, extractLessonText (cho TTS)
├── scripts/                # Build-time scripts
│   ├── parse-content.ts    # Parse markdown → JSON
│   ├── generate-quizzes.ts # Generate quiz questions
│   ├── output-seed-data.ts # Output seed JSON files
│   ├── run-with-nvm.sh     # NVM wrapper cho commands
│   ├── rebuild.sh          # Build APK (khuyên dùng)
│   ├── install-android-sdk.sh
│   ├── setup-sdk.sh
│   └── create-icons.sh
├── assets/
│   └── seed-data/          # JSON seed data (auto-generated)
├── doc/                    # Markdown tài liệu khóa học (source content)
├── android/                # Native Android project (auto-generated bởi expo prebuild)
├── app.json                # Expo config
├── eas.json                # EAS Build config
├── package.json
└── tsconfig.json
```

---

## 1. Cài Đặt Lần Đầu

### 1.1 Cài Node.js qua nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

### 1.2 Cài dependencies

```bash
npm install
```

### 1.3 Cài Android SDK (nếu chưa có)

```bash
sudo apt-get install -y unzip wget
bash scripts/install-android-sdk.sh
bash scripts/setup-sdk.sh
source ~/.bashrc
```

### 1.4 Tạo placeholder icons

```bash
bash scripts/create-icons.sh
```

---

## 2. Generate Seed Data

Mỗi khi thay đổi nội dung trong `doc/`, chạy lại:

```bash
npm run parse-content
```

**Output**: 9 modules, 27 lessons, 129 keywords, 140 code examples, 27 quizzes, 129 questions

---

## 3. Chạy Tests

```bash
npm test
```

**Kết quả mong đợi**: 188+ tests pass

---

## 4. Build APK

### Cách nhanh nhất (khuyên dùng)

```bash
# Commit code trước
git add -A && git commit -m "update"

# Build
bash scripts/rebuild.sh
```

Thời gian build: ~8-10 phút. APK output: `./java-spring-course.apk`

### Cách thủ công

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

npx expo prebuild --platform android --clean --no-install
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
cd android && chmod +x gradlew && ./gradlew assembleRelease && cd ..
cp android/app/build/outputs/apk/release/app-release.apk ./java-spring-course.apk
```

---

## 5. Cài APK Lên Điện Thoại

### Copy sang Windows

```
\\wsl$\Ubuntu-22.04\home\hiepnt\projects\app\java-spring-course.apk
```

### Cài lên Samsung S24 Ultra

1. Copy file `.apk` vào điện thoại qua USB hoặc Google Drive
2. Mở File Manager → tìm file APK → nhấn cài đặt
3. Nếu bị chặn: Cài đặt → Bảo mật → Cho phép cài từ nguồn không xác định

**QUAN TRỌNG**: Khi cập nhật APK mới, **gỡ app cũ trước** rồi cài lại (database format có thể thay đổi).

---

## 6. Tính Năng App

### 6.1 Đăng nhập & Hồ sơ
- Tạo hồ sơ với tên + PIN tùy chọn
- Tự động đăng nhập nếu chỉ có 1 hồ sơ không PIN
- Lưu session qua AsyncStorage — mở lại app không cần đăng nhập lại
- Dữ liệu persist qua SQLiteAdapter (WatermelonDB)

### 6.2 Khóa Học
- 9 modules từ Java Core → Real-world Patterns
- 27 bài học với nội dung chi tiết
- Cây thư mục expandable — click module để mở danh sách bài học
- Hệ thống prerequisite — module sau mở khóa khi hoàn thành module trước
- Module đầu tiên (Java Core) luôn mở khóa

### 6.3 Nội Dung Bài Học
- Hiển thị headings, paragraphs, code blocks (syntax highlighting Java), tables, lists, diagrams
- Code blocks có nút copy, line numbers, file name header
- Nút "Đánh dấu hoàn thành" và "Làm Quiz"
- Bookmark (đánh dấu yêu thích) với icon heart
- Lưu vị trí scroll — mở lại bài học tiếp tục từ chỗ cũ

### 6.4 Text-to-Speech (MỚI)
- Nút FAB "Đọc bài" trên mỗi bài học
- Panel điều khiển:
  - Play/Stop
  - Tốc độ đọc: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
  - Cao độ: Thấp, Bình thường, Cao
  - Chọn giọng đọc (Vietnamese voices)
- Lưu cài đặt tốc độ/cao độ/giọng đọc
- Tự động dừng khi thoát bài học
- Đọc: headings, paragraphs, code (dòng đầu), tables, lists. Bỏ qua diagrams.

### 6.5 Quiz
- Mỗi bài học có quiz với ≥3 câu hỏi trắc nghiệm
- Câu hỏi bằng tiếng Việt
- Hiển thị đáp án đúng/sai + giải thích sau khi nộp bài
- Lưu lịch sử tất cả lần làm bài
- Có thể làm lại không giới hạn

### 6.6 Tìm Kiếm
- Tìm kiếm bài học, từ khóa, code examples
- Hỗ trợ tiếng Việt và tiếng Anh
- Kết quả nhóm theo loại
- Lưu lịch sử tìm kiếm gần đây

### 6.7 Đánh Dấu & Ghi Chú
- Bookmark bài học và từ khóa
- Lọc theo loại (bài học / từ khóa)
- Xóa bookmark

### 6.8 Hồ Sơ & Cài Đặt
- Tiến trình tổng thể và theo module
- Giao diện: Sáng / Tối / Hệ thống
- Cỡ chữ: 0.8x - 1.4x
- Đặt lại dữ liệu
- Đăng xuất

---

## 7. Kiến Trúc Kỹ Thuật

### Database
- **WatermelonDB** với **SQLiteAdapter** (JSI) — dữ liệu persist trên disk
- 12 bảng: user_profiles, modules, module_prerequisites, lessons, keywords, keyword_relations, code_examples, quizzes, quiz_questions, lesson_progress, quiz_attempts, bookmarks
- AsyncStorage chỉ cho settings nhỏ (theme, font size, TTS preferences, seed version, current user ID)

### State Management
- **Zustand** + immer middleware
- 7 stores: Auth, Progress, Course, Search, Quiz, Bookmark, TTS

### Navigation
- **Expo Router** (file-based routing)
- AuthGate: redirect đến login nếu chưa đăng nhập
- SeedGate: hiện progress bar khi nạp dữ liệu lần đầu
- Tab navigation: 5 tabs (Home, Course, Search, Bookmarks, Profile)

### Content Pipeline
- Build-time: `doc/*.md` → `scripts/parse-content.ts` → `assets/seed-data/*.json`
- Runtime: JSON → SeedService → WatermelonDB (lần đầu mở app)

### Text-to-Speech
- **expo-speech** — wrapper native TTS engine
- TTSService: speak, stop, getVoices, setRate, setPitch
- ttsStore: Zustand store quản lý state + persist preferences
- extractLessonText: trích xuất plain text từ LessonContent cho TTS

---

## 8. Lỗi Đã Fix & Bài Học Rút Ra

### Bug 1: Dữ liệu mất khi tắt app
- **Nguyên nhân**: Dùng `LokiJSAdapter` (in-memory) thay vì `SQLiteAdapter`
- **Fix**: Đổi sang `SQLiteAdapter` với JSI trong `src/database/index.ts`
- **Bài học**: LokiJS chỉ dùng cho development/testing, production phải dùng SQLiteAdapter

### Bug 2: Không có auth flow — app mở thẳng vào tabs
- **Nguyên nhân**: Thiếu AuthGate component redirect đến login
- **Fix**: Thêm `AuthGate` trong `app/_layout.tsx` gọi `loadProfiles()` và redirect
- **Bài học**: Luôn implement auth gate ngay từ đầu

### Bug 3: Screens loading vô hạn
- **Nguyên nhân**: `if (!currentUser) return` trong useEffect mà không set `isLoading = false`
- **Fix**: Thêm `setIsLoading(false)` khi `!currentUser`
- **Bài học**: Mọi async init phải có finally block set loading = false

### Bug 4: CourseTree hiển thị trống
- **Nguyên nhân**: `List.Accordion` từ react-native-paper dùng sai — `title=""` và `description={() => ...}` (function thay vì ReactNode)
- **Fix**: Rewrite CourseTree dùng `TouchableRipple` + `View` tự custom
- **Bài học**: Không dùng render function cho props expect ReactNode

### Bug 5: Nội dung bài học trắng
- **Nguyên nhân**: `@json` decorator của WatermelonDB gây lỗi silent khi parse JSON string từ SQLite
- **Fix**: Đổi sang `@field` + parse thủ công bằng `JSON.parse()`, fallback đọc `_raw.content_json`
- **Bài học**: Tránh `@json` decorator, dùng `@field` + manual parse cho JSON columns

### Bug 6: Không back được từ bài học
- **Nguyên nhân**: Thiếu `headerShown: true` và `headerBackVisible: true` trong course stack layout
- **Fix**: Thêm options vào `app/(tabs)/course/_layout.tsx`
- **Bài học**: Luôn set `headerBackVisible: true` cho nested stack screens

### Bug 7: Build chậm (20+ phút)
- **Nguyên nhân**: Build native C++ cho 4 architectures (arm64, armeabi, x86, x86_64)
- **Fix**: Thêm `"ndk": { "abiFilters": ["arm64-v8a"] }` trong `app.json` (chỉ ảnh hưởng APK packaging, library modules vẫn build cho tất cả)
- **Bài học**: Restrict ABI filters cho target device khi build development APK

---

## 9. Commands Tham Khảo Nhanh

```bash
# Generate seed data
npm run parse-content

# Chạy tests
npm test

# Build APK
git add -A && git commit -m "update" && bash scripts/rebuild.sh

# Kiểm tra TypeScript (decorator errors OK)
bash scripts/run-with-nvm.sh npx tsc --noEmit

# Tìm file APK
find . -name "*.apk" -type f
```

---

## 10. Thông Tin APK

| Thuộc tính | Giá trị |
|-----------|---------|
| Package name | `com.javaspring.course` |
| Min SDK | 24 (Android 7.0+) |
| Target SDK | 34 (Android 14) |
| ABI | arm64-v8a (Samsung S24 Ultra) |
| Kích thước | ~73MB |
| Database | WatermelonDB + SQLiteAdapter (JSI) |
| TTS | expo-speech (vi-VN) |
