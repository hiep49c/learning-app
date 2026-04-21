---
inclusion: always
---

# Steering Index — Hướng Dẫn Đọc Rules

## Project Overview

Ứng dụng mobile học tập cá nhân hóa. React Native + Expo, TypeScript strict, Expo Router, Zustand + immer, WatermelonDB, React Native Paper. Toàn bộ local-first, không server, không analytics, không đăng ký tài khoản.

## Danh sách Rules & Khi Nào Đọc

### React Native (Mobile App)
| # | File | Auto-load khi | Đọc thủ công khi |
|---|------|--------------|-----------------|
| 1 | `coding-standards.md` | Đọc/sửa `*.ts, *.tsx` | Tạo file mới, hỏi về cấu trúc project |
| 2 | `ai-code-guard.md` | Đọc/sửa `*.ts, *.tsx` | Viết code mới, sửa code, refactor |
| 3 | `defensive-coding.md` | Đọc/sửa `*.ts, *.tsx` | Viết hooks, async logic, DB operations, timers |
| 4 | `security-privacy.md` | Đọc/sửa `*.ts, *.tsx` | Xử lý data, storage, permissions, input |
| 5 | `performance.md` | Đọc/sửa `*.ts, *.tsx` | Tối ưu rendering, DB queries, bundle size |
| 6 | `ui-ux.md` | Đọc/sửa `*.tsx` | Tạo/sửa components, screens, forms, animations |
| 7 | `testing.md` | Đọc/sửa `*.test.ts, *.spec.ts` | Viết tests, setup test infrastructure |
| 8 | `build-release.md` | Không auto-load | Hỏi về build, deploy, CI/CD, app store |

### Java Spring (Backend)
| # | File | Auto-load khi |
|---|------|--------------|
| 1 | `java/index.md` | Đọc/sửa `*.java` |
| 2 | `java/coding-standards.md` | Đọc/sửa `*.java` |
| 3 | `java/defensive-coding.md` | Đọc/sửa `*.java` |
| 4 | `java/ai-code-guard.md` | Đọc/sửa `*.java` |

### Python
| # | File | Auto-load khi |
|---|------|--------------|
| 1 | `python/index.md` | Đọc/sửa `*.py` |
| 2 | `python/coding-standards.md` | Đọc/sửa `*.py` |
| 3 | `python/defensive-coding.md` | Đọc/sửa `*.py` |
| 4 | `python/ai-code-guard.md` | Đọc/sửa `*.py` |

### Kotlin
| # | File | Auto-load khi |
|---|------|--------------|
| 1 | `kotlin/index.md` | Đọc/sửa `*.kt, *.kts` |
| 2 | `kotlin/coding-standards.md` | Đọc/sửa `*.kt, *.kts` |
| 3 | `kotlin/defensive-coding.md` | Đọc/sửa `*.kt, *.kts` |
| 4 | `kotlin/ai-code-guard.md` | Đọc/sửa `*.kt, *.kts` |

## Quy Tắc Đọc Rules

### PHẢI đọc trước khi viết code:
- `coding-standards.md` — cấu trúc, naming, patterns
- `ai-code-guard.md` — chống bug AI, impact analysis, cleanup

### PHẢI đọc khi viết logic phức tạp:
- `defensive-coding.md` — memory leaks, null safety, lifecycle, concurrency

### PHẢI đọc khi làm UI:
- `ui-ux.md` — design system, accessibility, responsive, animations

### PHẢI đọc khi viết tests:
- `testing.md` — strategy, patterns, commands

### Đọc khi được hỏi:
- `build-release.md` — chỉ khi user hỏi về build/deploy/release
- `security-privacy.md` — khi xử lý data nhạy cảm, permissions

## Nguyên Tắc Quan Trọng Nhất (Luôn Áp Dụng)

1. **Local-first**: KHÔNG gọi API bên ngoài, KHÔNG gửi data qua network
2. **Impact Analysis**: Trước khi sửa → tìm nơi dùng → sửa → kiểm tra tác động
3. **Cleanup**: Sau khi sửa → xóa code thừa, imports thừa, commented code
4. **Null Safety**: Optional chaining `?.`, nullish coalescing `??`, try/catch cho DB
5. **Memory Safety**: useEffect cleanup, timer cleanup, AbortController cho async
6. **TypeScript Strict**: Không `any`, không `!`, không `@ts-ignore`
7. **Verify**: `npx tsc --noEmit` + chạy tests sau mỗi thay đổi
8. **Notifications**: Cancel cũ trước khi schedule mới, handle permission denied
9. **Storage**: AsyncStorage chỉ cho settings nhỏ, WatermelonDB cho mọi structured data
