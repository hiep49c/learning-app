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
│   ├── _layout.tsx         # Root layout (providers)
│   ├── (auth)/             # Login flow
│   ├── (tabs)/             # Tab navigation (Home, Course, Search, Bookmarks, Profile)
│   ├── quiz/               # Quiz screens
│   └── keyword/            # Keyword detail
├── src/
│   ├── components/         # UI components (CodeBlock, ContentRenderer, CourseTree, QuizCard)
│   ├── database/           # WatermelonDB schema, models, provider
│   ├── services/           # Business logic (Progress, Search, Quiz, Bookmark, ModuleUnlock, Seed)
│   ├── stores/             # Zustand stores (Auth, Progress, Course, Search, Quiz, Bookmark)
│   ├── theme/              # React Native Paper theme (light/dark)
│   └── utils/              # Toast utility
├── scripts/                # Build-time scripts
│   ├── parse-content.ts    # Parse markdown → JSON
│   ├── generate-quizzes.ts # Generate quiz questions
│   ├── output-seed-data.ts # Output seed JSON files
│   ├── run-with-nvm.sh     # NVM wrapper cho commands
│   ├── install-android-sdk.sh
│   ├── setup-sdk.sh
│   ├── create-icons.sh
│   └── build-apk.sh        # Build APK script
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
# Nếu chưa có nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Cài Node 22
nvm install 22
nvm use 22
```

### 1.2 Cài dependencies

```bash
npm install
```

### 1.3 Cài Android SDK (nếu chưa có)

```bash
# Cài unzip (cần sudo)
sudo apt-get install -y unzip wget

# Chạy script cài Android SDK
bash scripts/install-android-sdk.sh
bash scripts/setup-sdk.sh

# Thêm vào .bashrc (nếu chưa có)
echo 'export ANDROID_HOME="$HOME/Android/Sdk"' >> ~/.bashrc
echo 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 1.4 Tạo placeholder icons

```bash
bash scripts/create-icons.sh
```

---

## 2. Generate Seed Data (Nội Dung Khóa Học)

Mỗi khi thay đổi nội dung trong thư mục `doc/`, cần chạy lại:

```bash
npm run parse-content
```

Script này sẽ:
- Parse tất cả file `.md` trong `doc/`
- Tạo quiz questions tự động
- Xuất JSON vào `assets/seed-data/`
- Validate dữ liệu (mỗi bài có code, mỗi keyword có definition ≤100 ký tự, mỗi quiz có ≥3 câu hỏi)

**Output**: 9 modules, 27 lessons, 129 keywords, 140 code examples, 27 quizzes, 129 questions

---

## 3. Chạy Tests

```bash
npm test
```

Hoặc chạy trực tiếp:

```bash
bash scripts/run-with-nvm.sh npx jest --forceExit
```

**Kết quả mong đợi**: 180 tests pass, 13 test suites

---

## 4. Build APK

### Cách 1: Script tự động (khuyên dùng)

```bash
bash scripts/build-apk.sh
```

Script này tự động:
1. Chạy `expo prebuild` tạo thư mục `android/`
2. Chạy Gradle `assembleRelease` build APK
3. Copy APK ra `./java-spring-course.apk`

### Cách 2: Từng bước thủ công

```bash
# Load nvm
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 22

# Set Android SDK
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Bước 1: Generate native Android project
npx expo prebuild --platform android --clean --no-install

# Bước 2: Cấu hình SDK path
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# Bước 3: Build APK
cd android
chmod +x gradlew
./gradlew assembleRelease
cd ..

# Bước 4: Tìm file APK
find android/app/build/outputs -name "*.apk" -type f
```

### Cách 3: EAS Build (cloud, cần tài khoản Expo)

```bash
# Đăng nhập Expo (tạo tài khoản miễn phí tại https://expo.dev)
npx eas login

# Build APK trên cloud
npx eas build --platform android --profile preview

# Hoặc build local qua EAS
npx eas build --platform android --profile preview --local
```

---

## 5. Cài APK Lên Điện Thoại

### 5.1 Tìm file APK

Sau khi build xong, file APK nằm ở:
- Script tự động: `./java-spring-course.apk`
- Build thủ công: `android/app/build/outputs/apk/release/app-release.apk`

### 5.2 Copy APK sang Windows

Từ WSL2, file nằm ở đường dẫn Windows:
```
\\wsl$\Ubuntu-22.04\home\hiepnt\projects\app\java-spring-course.apk
```

Hoặc copy ra Desktop:
```bash
cp java-spring-course.apk /mnt/c/Users/<TenUser>/Desktop/
```

### 5.3 Cài lên Samsung S24 Ultra

**Cách A: Qua USB**
1. Kết nối điện thoại qua USB
2. Bật "Truyền tệp" (File Transfer) trên điện thoại
3. Copy file `.apk` vào thư mục `Download` trên điện thoại
4. Mở File Manager trên điện thoại → tìm file APK → nhấn cài đặt
5. Nếu bị chặn: Cài đặt → Bảo mật → Cho phép cài từ nguồn không xác định

**Cách B: Qua ADB (Android Debug Bridge)**
```bash
# Bật Developer Options + USB Debugging trên điện thoại
# Kết nối USB

# Từ WSL2
export PATH="$HOME/Android/Sdk/platform-tools:$PATH"
adb devices                    # Kiểm tra kết nối
adb install java-spring-course.apk   # Cài APK
```

**Cách C: Qua Google Drive / Email**
1. Upload file APK lên Google Drive
2. Mở Google Drive trên điện thoại
3. Tải và cài đặt

---

## 6. Lưu Ý Quan Trọng

### Build lần đầu
- Lần build đầu tiên mất 15-30 phút vì phải download Gradle, NDK, và tất cả dependencies
- Các lần build sau nhanh hơn nhiều (3-5 phút)

### Khi thay đổi nội dung
1. Sửa file `.md` trong `doc/`
2. Chạy `npm run parse-content` để regenerate seed data
3. Build lại APK

### Khi thay đổi code
1. Sửa code trong `src/` hoặc `app/`
2. Chạy `npm test` để verify
3. Build lại APK

### Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `npx: command not found` | Node chưa load qua nvm | `source ~/.nvm/nvm.sh && nvm use 22` |
| `ANDROID_HOME not set` | Chưa set biến môi trường | `export ANDROID_HOME=$HOME/Android/Sdk` |
| `SDK location not found` | Thiếu `local.properties` | `echo "sdk.dir=$ANDROID_HOME" > android/local.properties` |
| `Permission denied: gradlew` | Thiếu quyền execute | `chmod +x android/gradlew` |
| `NDK not found` | Chưa cài NDK | `sdkmanager --install "ndk;26.1.10909125"` |
| Build bị treo ở CONFIGURING | Đang download dependencies | Đợi 5-10 phút, kiểm tra mạng |
| `expo prebuild` hỏi confirm | Git chưa commit | `git add -A && git commit -m "update"` |

### Thông tin APK
- **Package name**: `com.javaspring.course`
- **Min SDK**: 24 (Android 7.0+)
- **Target SDK**: 34 (Android 14)
- **Tương thích**: Samsung S24 Ultra và tất cả Android 7.0+

---

## 7. Commands Tham Khảo Nhanh

```bash
# Chạy app trong development mode (Expo Go)
npm start

# Chạy tests
npm test

# Generate seed data từ markdown
npm run parse-content

# Build APK
bash scripts/build-apk.sh

# Kiểm tra TypeScript
bash scripts/run-with-nvm.sh npx tsc --noEmit
```
