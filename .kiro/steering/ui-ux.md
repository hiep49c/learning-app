---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---

# UI/UX Rules

## Design System
- Dùng React Native Paper làm base component library
- Tạo theme file tập trung: `src/constants/theme.ts`
- Support Dark Mode và Light Mode, theo system preference mặc định
- Spacing scale cố định: 4, 8, 12, 16, 24, 32, 48, 64
- Border radius nhất quán: small=8, medium=12, large=16, full=9999
- Typography scale: dùng `variant` của Paper (headlineLarge, titleMedium, bodyLarge...)

## Colors
- Định nghĩa semantic colors, KHÔNG dùng hex trực tiếp trong components:
  - `colors.primary`, `colors.surface`, `colors.error`
  - `colors.studyActive`, `colors.studyComplete`, `colors.studySkipped`
- Contrast ratio tối thiểu 4.5:1 cho text, 3:1 cho large text (WCAG AA)
- KHÔNG dùng màu làm phương tiện truyền tải thông tin duy nhất — kết hợp icon/text

## Accessibility (Bắt buộc)
- Mọi touchable element phải có `accessibilityLabel`
- Mọi image phải có `accessibilityLabel` mô tả nội dung
- `accessibilityRole` chính xác: `button`, `header`, `link`, `checkbox`...
- Minimum touch target: 44x44 points
- Support Dynamic Type / font scaling — KHÔNG fix font size
- Test với VoiceOver (iOS) và TalkBack (Android)
- Focus order hợp lý khi navigate bằng screen reader
- `accessibilityHint` cho actions không rõ ràng từ label

## Responsive Design
- Dùng `useWindowDimensions()` cho responsive layouts
- Flexbox cho layout, KHÔNG dùng absolute positioning trừ overlays
- Test trên nhiều kích thước màn hình: iPhone SE, iPhone 15 Pro Max, Pixel 7, tablet
- Safe area: dùng `SafeAreaView` từ `react-native-safe-area-context`
- Keyboard avoiding: dùng `KeyboardAvoidingView` cho forms

## Animations
- Dùng `react-native-reanimated` cho animations phức tạp
- Animations chạy trên UI thread (worklets), KHÔNG trên JS thread
- Respect `reduceMotion` accessibility setting — tắt animation khi user bật
- Duration guidelines: micro-interactions 150-250ms, transitions 250-400ms
- Easing: `Easing.bezier(0.4, 0, 0.2, 1)` cho standard, `Easing.out` cho exits

## Navigation UX
- Bottom tabs cho navigation chính (tối đa 5 tabs)
- Tab icons phải có label text, KHÔNG chỉ icon
- Stack navigation cho drill-down flows
- Back button luôn hoạt động đúng
- Deep linking support cho notifications

## Feedback & States
- Loading: Skeleton screens cho initial load, spinner cho actions
- Empty state: illustration + message + CTA cho mọi list trống
- Error state: message rõ ràng + retry action
- Success feedback: subtle animation hoặc toast, KHÔNG alert()
- Haptic feedback cho important actions (hoàn thành bài học, đạt milestone)
- KHÔNG dùng `Alert.alert()` cho thông báo thường — chỉ cho destructive actions (xóa dữ liệu)

## Forms
- Inline validation, hiển thị lỗi ngay dưới field
- Auto-focus field đầu tiên khi mở form
- Keyboard type phù hợp: `numeric` cho số, `default` cho text
- Submit button disabled khi form invalid
- Hiển thị progress khi form nhiều bước
