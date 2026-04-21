---
inclusion: fileMatch
fileMatchPattern: "**/*.ts,**/*.tsx"
---

# Performance Rules

## Rendering
- Dùng `FlatList` hoặc `FlashList` cho danh sách, KHÔNG dùng `ScrollView` + `.map()` cho list > 10 items
- `keyExtractor` bắt buộc cho mọi list, dùng ID từ database
- Dùng `getItemLayout` khi item height cố định
- `React.memo()` cho list item components và components nhận props ổn định
- KHÔNG re-render toàn bộ list khi chỉ 1 item thay đổi
- Dùng `useCallback` cho event handlers truyền vào child components

## Images & Assets
- Dùng `expo-image` thay vì `Image` component mặc định
- Ảnh phải được optimize trước khi bundle (WebP format ưu tiên)
- Lazy load ảnh không nằm trong viewport
- SVG icons dùng `react-native-svg`, KHÔNG dùng PNG cho icons

## Memory
- Dùng `useMemo` cho expensive computations (sort, filter danh sách lớn)
- KHÔNG giữ reference đến large objects trong global state
- Pagination cho database queries: load tối đa 50 items/lần

## Navigation
- Lazy load screens với dynamic imports
- KHÔNG preload tất cả screens khi app khởi động
- Dùng `freezeOnBlur` cho inactive tab screens

## Database Performance
- Index các columns thường query: `subject_id`, `date`, `status`
- Batch writes: gom nhiều operations vào 1 `database.write()`
- KHÔNG query trong render cycle — query trong `useEffect` hoặc dùng `observe()`
- Limit query results, KHÔNG `fetchAll()` trên bảng lớn
- Dùng `Q.where()` conditions thay vì fetch rồi filter trong JS

## App Startup
- Splash screen giữ đến khi app ready (fonts loaded, DB initialized)
- KHÔNG block main thread khi khởi tạo database
- Defer non-critical initialization (notifications setup)
- Target: app interactive trong < 2 giây trên thiết bị mid-range

## Bundle Size
- Tree-shake unused imports
- KHÔNG import toàn bộ library: `import { Button } from 'react-native-paper'` thay vì `import * as Paper`
- Tránh duplicate dependencies trong package.json
- Dùng `expo install` để đảm bảo compatible versions
