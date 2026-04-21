---
inclusion: fileMatch
fileMatchPattern: "**/*.ts,**/*.tsx"
---

# Coding Standards - React Native + Expo

## TypeScript
- Bật strict mode trong tsconfig.json (`"strict": true`)
- KHÔNG dùng `any` — dùng `unknown` rồi narrow type, hoặc định nghĩa interface/type rõ ràng
- Mọi function phải có return type annotation tường minh
- Dùng `interface` cho object shapes, `type` cho unions/intersections
- Dùng `as const` cho literal values thay vì type assertion
- Enum chỉ dùng string enum, không dùng numeric enum
- KHÔNG dùng non-null assertion `!` — dùng type guard hoặc optional chaining

## Cấu trúc thư mục

```
src/
├── app/                  # Expo Router screens
│   ├── (tabs)/           # Tab navigation
│   ├── _layout.tsx       # Root layout
│   └── index.tsx         # Entry screen
├── components/           # Reusable UI components
│   ├── ui/               # Primitive UI (Button, Input, Card...)
│   └── features/         # Feature-specific components
├── hooks/                # Custom React hooks
├── stores/               # Zustand stores
├── models/               # WatermelonDB models & schema
├── services/             # Business logic & algorithms
├── utils/                # Pure utility functions
├── constants/            # App constants, enums, config
├── types/                # Shared TypeScript types
├── i18n/                 # Internationalization
└── assets/               # Images, fonts, animations
```

## Naming Conventions
- **Files**: kebab-case (`study-plan-card.tsx`, `use-study-timer.ts`)
- **Components**: PascalCase (`StudyPlanCard`, `ProgressChart`)
- **Hooks**: camelCase bắt đầu bằng `use` (`useStudyTimer`, `useSubjectList`)
- **Stores**: camelCase kết thúc bằng `Store` (`studyPlanStore`, `settingsStore`)
- **Models**: PascalCase số ít (`Subject`, `StudySession`, `DailyPlan`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SUBJECTS`, `DEFAULT_STUDY_DURATION`)
- **Types/Interfaces**: PascalCase, interface có prefix `I` chỉ khi cần phân biệt (`StudyPlan`, `IStudyPlanService`)

## Component Rules
- Dùng functional components + hooks, KHÔNG dùng class components
- Mỗi component một file, export default
- Props phải có interface riêng: `interface StudyCardProps { ... }`
- Tách logic ra custom hook khi component vượt 100 dòng
- KHÔNG inline styles — dùng `StyleSheet.create()` ở cuối file
- Mọi text hiển thị phải nằm trong `<Text>` component

## State Management (Zustand)
- Mỗi domain một store riêng (subjects, studyPlans, settings, progress)
- KHÔNG lưu derived state — dùng selectors
- Actions đặt tên dạng verb: `addSubject`, `updateProgress`, `resetPlan`
- Persist store với AsyncStorage cho settings, KHÔNG persist transient UI state

## Database (WatermelonDB)
- Schema migration bắt buộc cho mọi thay đổi schema
- Model decorators: `@field`, `@date`, `@readonly`, `@relation`
- KHÔNG query trực tiếp trong components — dùng `@observe` hoặc custom hooks
- Soft delete (đánh dấu `is_deleted`) cho data bình thường
- Hard delete (purge) chỉ khi user chủ động yêu cầu xóa toàn bộ dữ liệu trong Settings

## Imports
- Absolute imports qua path aliases: `@/components`, `@/hooks`, `@/stores`
- Thứ tự import: React → third-party → internal → types → styles
- KHÔNG circular imports
- Barrel exports (`index.ts`) chỉ cho thư mục `components/ui`
- KHÔNG import module/package chưa có trong package.json — kiểm tra trước khi dùng
