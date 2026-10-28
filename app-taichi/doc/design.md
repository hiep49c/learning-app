# Thiết Kế Kỹ Thuật — App Thái Cực Quyền 24 Thức

Tài liệu thiết kế cho app độc lập `app-taichi`. Dựa trên yêu cầu trong [requirements.md](./requirements.md).

---

## 1. Tổng quan kiến trúc

App di động Expo độc lập, dữ liệu đóng gói sẵn (bundled seed), chạy offline cho phần chữ + ảnh, cần mạng cho video.

```
┌─────────────────────────────────────────────────────┐
│                     app-taichi (Expo)                 │
│                                                       │
│  UI (expo-router)                                     │
│   ├─ index            Danh sách 24 thức               │
│   ├─ form/[formId]    Chi tiết một thức               │
│   ├─ bookmarks        Thức đã lưu                      │
│   ├─ search           Tìm kiếm                        │
│   └─ settings         Theme / cỡ chữ                  │
│          │                                            │
│  State (Zustand)                                      │
│   ├─ formStore        danh sách + thức hiện tại       │
│   ├─ bookmarkStore    bookmark cục bộ                 │
│   ├─ ttsStore         trạng thái + cài đặt TTS        │
│   └─ settingsStore    theme, cỡ chữ                   │
│          │                                            │
│  Services                                             │
│   ├─ SeedService      nạp JSON → DB lần đầu           │
│   ├─ TTSService       expo-speech wrapper             │
│   ├─ BookmarkService  CRUD bookmark                   │
│   └─ SearchService    tìm theo tên                    │
│          │                                            │
│  Data (WatermelonDB + SQLiteAdapter)                  │
│   └─ forms, form_media, bookmarks, settings           │
│                                                       │
│  Content pipeline (build-time)                        │
│   doc/forms/*.md → parse-forms.ts → assets/seed/*.json│
└─────────────────────────────────────────────────────┘
```

### Nguyên tắc
- **Độc lập:** không import code từ `app-learning`/`app-vietlot`. Được phép copy & chỉnh các pattern (TTS, content renderer) vào codebase riêng.
- **Content-driven:** nội dung viết ở `doc/forms/*.md`, build thành JSON, nạp vào DB — giống pipeline của `app-learning` nhưng tối giản cho 1 bài quyền.
- **Media tách biệt:** ảnh và video mô tả bằng block riêng trong content, không nhúng cứng vào code.

---

## 2. Tech stack

| Thành phần | Lựa chọn | Ghi chú |
|---|---|---|
| Framework | React Native + **Expo** (SDK mới nhất ổn định) | Giống `app-learning` |
| Điều hướng | **expo-router** (file-based) | |
| Lưu trữ | **WatermelonDB** + **SQLiteAdapter (JSI)** | Persist trên disk |
| State | **Zustand** + immer | |
| UI | **react-native-paper** (Material 3) | Theme sáng/tối |
| TTS | **expo-speech** | Giọng vi-VN |
| Ảnh | **expo-image** | Cache + placeholder |
| Video | **react-native-youtube-iframe** + **react-native-webview** | Nhúng YouTube, không bundle video |
| Lưu cài đặt nhỏ | **AsyncStorage** | theme, cỡ chữ, TTS prefs, seed version |

> **Lưu ý ABI/kích thước:** giống bài học từ `app-learning`, nên giới hạn `abiFilters` (ví dụ `arm64-v8a`) khi build APP phát triển để build nhanh. Video stream nên APK gọn.

---

## 3. Mô hình dữ liệu (WatermelonDB schema)

Tối giản quanh một thực thể chính là **form** (chiêu thức). Nội dung chi tiết lưu dạng `content_json` (các section), media tách bảng riêng để truy vấn/dự phòng.

```ts
// schema version 1
appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'forms',
      columns: [
        { name: 'order_index', type: 'number', isIndexed: true }, // 1..24
        { name: 'name_hanviet', type: 'string' },      // "Tả hữu dã mã phân bờm"
        { name: 'name_vi', type: 'string' },           // "Ngựa hoang rẽ bờm hai bên"
        { name: 'name_pinyin', type: 'string' },       // "Zuǒyòu Yěmǎ Fēnzōng"
        { name: 'name_en', type: 'string' },           // "Parting the Wild Horse's Mane"
        { name: 'summary', type: 'string' },           // mô tả ngắn cho danh sách
        { name: 'thumbnail', type: 'string', isOptional: true },
        { name: 'content_json', type: 'string' },      // LessonContent (sections[])
        { name: 'has_safety_note', type: 'boolean' },
        { name: 'source_file', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'form_media',
      columns: [
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'media_type', type: 'string' },  // 'image' | 'video'
        { name: 'url', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'source_name', type: 'string' }, // nguồn uy tín
        { name: 'source_url', type: 'string' },
        { name: 'order_index', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'bookmarks',
      columns: [
        { name: 'form_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
```

> Tiến trình học (đã xem/đánh dấu hoàn thành) có thể thêm bảng `form_progress` ở phiên bản sau; phạm vi hiện tại tập trung xem + bookmark.

### Content model (`content_json`)

Mở rộng mô hình section của `app-learning` để **thêm 2 loại block: `image` và `video`** (app-learning hiện chưa có — đây là điểm thiết kế mới quan trọng).

```ts
type ContentSection =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }                 // hỗ trợ **bold**, `code`
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image';  url: string; alt: string; caption?: string; source?: { name: string; url: string } }
  | { type: 'video';  provider: 'youtube'; videoId: string; title: string; source?: { name: string; url: string } }
  | { type: 'callout'; variant: 'safety' | 'tip'; text: string }; // "Lưu ý an toàn" / mẹo

interface LessonContent { sections: ContentSection[]; }
```

---

## 4. Thành phần UI chính

### 4.1 ContentRenderer
Render `content_json` thành component RN. Mỗi loại section → một renderer:

| Section | Render bằng | Ghi chú |
|---|---|---|
| heading | `Text` (variant theo level), `selectable` | Copy được |
| paragraph | `Text selectable`, parse inline **bold**/`code` | Copy được |
| list | bullet/ordered | Copy được |
| **image** | `expo-image` | Giữ tỉ lệ, có placeholder + xử lý lỗi tải (R3) |
| **video** | `YoutubePlayer` (react-native-youtube-iframe) | Lazy mount; hiện thông báo khi offline (R4) |
| callout(safety) | Card viền cảnh báo + icon | Hiển thị "Lưu ý an toàn" |

### 4.2 Màn hình chi tiết thức (`form/[formId]`)
- ScrollView bao `ContentRenderer`.
- Nút chuyển **thức trước / thức sau** (theo `order_index`).
- Nút **Bookmark** (toggle).
- FAB **"Đọc bài"** mở panel TTS.

### 4.3 Danh sách (`index`)
- `FlatList` 24 thức theo `order_index`.
- Mỗi item: thumbnail (nếu có) + số thứ tự + tên Hán Việt + nghĩa tiếng Việt.

---

## 5. Text-to-Speech (TTS)

Tái sử dụng pattern từ `app-learning`:

- `TTSService`: `speak(text)`, `stop()`, `setRate()`, `setPitch()`, `getVoices()` qua `expo-speech`.
- `ttsStore` (Zustand): trạng thái play/stop + persist tốc độ/cao độ/giọng.
- `extractFormText(content)`: trích plain text từ `content_json` cho TTS.
  - Đọc: heading, paragraph, list, callout.
  - **Bỏ qua** image/video — thay bằng câu ngắn: *"Có hình minh họa"* / *"Có video hướng dẫn: &lt;tiêu đề&gt;"*.
- Tự `stop()` khi unmount màn hình chi tiết.

---

## 6. Copy text

- Mọi block văn bản dùng prop `selectable` của `Text` (RN hỗ trợ sẵn) → người dùng bôi chọn + copy hệ thống.
- Cân nhắc thêm nút "Copy toàn bài" dùng `expo-clipboard` để copy nhanh plain text của thức (tùy chọn, không bắt buộc cho DoD).

---

## 7. Content pipeline (build-time)

```
doc/forms/NN-ten-thuc.md ──► scripts/parse-forms.ts ──► assets/seed-data/*.json
                                                        ├─ forms.json
                                                        └─ form_media.json
```

- `parse-forms.ts` đọc từng file markdown trong `doc/forms/`, chuyển heading/paragraph/list/ảnh/video thành `ContentSection[]`.
- Cú pháp media trong markdown:
  - Ảnh: `![alt](url)` → section `image` (caption + source lấy từ dòng chú thích kèm theo nếu có).
  - Video: `@video[tiêu đề](https://youtu.be/VIDEO_ID)` → section `video` (tự tách `videoId`).
  - Lưu ý an toàn: khối `> ⚠️ ...` hoặc `## Lưu ý an toàn` → section `callout` variant `safety`.
- Xuất ra `assets/seed-data/*.json`, bump `CURRENT_SEED_VERSION` khi nội dung đổi.

---

## 8. Seed & nạp dữ liệu

`SeedService` (phỏng theo `app-learning`):
- Lần đầu mở app: đọc `forms.json` + `form_media.json` (bundled) → ghi vào WatermelonDB.
- Lưu `@seed_version` trong AsyncStorage; nếu version tăng thì re-seed.
- Nạp tuần tự, an toàn khi gián đoạn (resume theo `order_index` cuối cùng đã ghi).

---

## 9. Xử lý media & lỗi

| Tình huống | Hành vi |
|---|---|
| Ảnh URL tải lỗi | `expo-image` hiển thị placeholder; không vỡ layout (R3) |
| Không có mạng, có video | Hiện thông báo "Cần kết nối mạng để xem video" + vẫn đọc được phần chữ (R4) |
| Video provider không hỗ trợ | Hiển thị link bấm mở trình duyệt ngoài |
| Ảnh bundle | Để trong `assets/forms/` và tham chiếu qua `require` khi build seed |

---

## 10. Nguồn media uy tín (tiêu chí chọn)

Ưu tiên theo thứ tự:
1. Kênh/tư liệu của **võ sư, nhà vô địch wushu, tổ chức thể thao** (ví dụ trình diễn 24 thức chuẩn).
2. **Tài liệu xuất bản** (sách/giáo trình) có minh họa.
3. Nguồn giáo dục phổ biến, có uy tín, ghi rõ tác giả.

Mỗi media phải ghi `source_name` + `source_url`, và được đánh dấu "đã kiểm chứng" trong [task.md](./task.md) trước khi đưa vào seed. Tôn trọng bản quyền: ưu tiên **nhúng** video (không tải lại), ảnh dùng nguồn cho phép hoặc tự chụp/minh họa.

---

## 11. Cấu trúc thư mục dự kiến (khi code)

```
app-taichi/
├── app/                      # expo-router screens
│   ├── _layout.tsx
│   ├── index.tsx             # danh sách 24 thức
│   ├── form/[formId].tsx     # chi tiết thức
│   ├── bookmarks.tsx
│   ├── search.tsx
│   └── settings.tsx
├── src/
│   ├── components/           # ContentRenderer, ImageBlock, VideoBlock, SafetyCallout, TTSControls
│   ├── database/             # schema, models, provider
│   ├── services/             # SeedService, TTSService, BookmarkService, SearchService
│   ├── stores/               # formStore, bookmarkStore, ttsStore, settingsStore
│   ├── theme/                # paper theme
│   └── utils/                # extractFormText
├── scripts/
│   └── parse-forms.ts        # doc/forms/*.md → seed JSON
├── assets/
│   ├── forms/                # ảnh bundle (nếu có)
│   └── seed-data/            # JSON auto-generated
├── doc/                      # tài liệu (README, requirements, design, task, forms/)
├── app.json
├── package.json
└── tsconfig.json
```

---

## 12. Rủi ro & quyết định mở

| Vấn đề | Hướng xử lý |
|---|---|
| Bản quyền ảnh/video | Ưu tiên nhúng video; ảnh dùng nguồn cho phép hoặc minh họa tự tạo; luôn ghi nguồn |
| Chất lượng nội dung võ thuật | Diễn giải lại từ nguồn uy tín; thêm khuyến cáo học trực tiếp với võ sư |
| YouTube iframe trên RN | Dùng `react-native-youtube-iframe`; fallback mở link ngoài nếu lỗi |
| Tăng kích thước APK do ảnh | Nén ảnh, hoặc dùng URL thay vì bundle nếu quá nặng |

---

## 13. Liên kết
- [Tổng quan & 24 thức](./README.md)
- [Yêu cầu chức năng](./requirements.md)
- [Tiến độ nội dung & nguồn media](./task.md)
