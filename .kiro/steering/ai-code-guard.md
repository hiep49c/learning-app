---
inclusion: fileMatch
fileMatchPattern: "**/*.ts,**/*.tsx"
---

# AI Code Guard — Chống Bug Khi AI Sinh Code

Rules này ngăn các lỗi phổ biến mà AI (bao gồm cả tôi) thường mắc khi sinh code.

---

## 1. KHÔNG Hallucinate APIs & Packages

- KHÔNG dùng package chưa có trong `package.json` — kiểm tra trước khi import
- KHÔNG bịa tên function/method không tồn tại trong library
- KHÔNG dùng API signature sai version (ví dụ: dùng API của React Navigation v5 trong project dùng Expo Router)
- Khi không chắc API có tồn tại: đọc file source hoặc type definitions trước
- KHÔNG assume default export khi library chỉ có named exports (và ngược lại)
- Khi dùng WatermelonDB: kiểm tra đúng API — `database.get()` không phải `database.collections.get()` tùy version

### Danh sách packages đã chọn (KHÔNG thay thế bằng package khác trừ khi được yêu cầu):
- Navigation: `expo-router` (KHÔNG dùng `@react-navigation/native` trực tiếp)
- UI: `react-native-paper` (KHÔNG dùng NativeBase, Tamagui, Gluestack)
- State: `zustand` (KHÔNG dùng Redux, MobX, Jotai)
- DB: `@nozbe/watermelondb` (KHÔNG dùng Realm, TypeORM, Drizzle)
- Images: `expo-image` (KHÔNG dùng `react-native-fast-image`)

---

## 2. KHÔNG Để Code Thừa — Dọn Dẹp Triệt Để (BẮT BUỘC)

### Khi tạo code mới:
- KHÔNG tạo function/component mà không ai gọi
- KHÔNG tạo file mà không được import ở đâu
- KHÔNG để unused imports — xóa ngay
- KHÔNG tạo interface/type mà không được sử dụng
- KHÔNG viết TODO comments rồi bỏ đó — implement luôn hoặc không viết
- KHÔNG tạo placeholder functions với body rỗng hoặc chỉ có `// TODO`

### Khi sửa hoặc thay thế code cũ (BẮT BUỘC):
- Xóa function/variable/type cũ đã bị thay thế bởi code mới
- Xóa imports không còn dùng sau khi sửa
- Xóa file cũ nếu đã tạo file mới thay thế hoàn toàn
- Xóa commented-out code — KHÔNG giữ code cũ dưới dạng comment "để phòng"
- Xóa console.log/debug statements sau khi debug xong
- Xóa test cases cho code đã bị xóa/thay thế
- Nếu đổi approach (ví dụ: từ useState sang Zustand), xóa TOÀN BỘ code approach cũ

### Quy trình dọn dẹp sau mỗi thay đổi:
1. Search tên function/component/type cũ trong toàn project — nếu không còn ai dùng → xóa
2. Kiểm tra imports trong file vừa sửa — xóa imports không còn reference
3. Kiểm tra file vừa sửa có code bị comment out không → xóa
4. Kiểm tra có biến/constant nào khai báo mà không dùng → xóa
5. Nếu xóa export từ file → kiểm tra barrel file (`index.ts`) có re-export nó không → xóa luôn

### KHÔNG được giữ lại:
- Code cũ dưới dạng comments: `// const oldFunction = () => { ... }`
- Imports không dùng: `import { OldComponent } from './old-component'`
- Variables khai báo nhưng không reference: `const unusedConfig = { ... }`
- Types/interfaces mồ côi sau refactor
- Files rỗng hoặc chỉ còn imports mà không export gì
- Duplicate logic: 2 functions làm cùng 1 việc sau khi refactor

---

## 3. KHÔNG Copy-Paste Sai Context

- Khi tạo component mới: KHÔNG copy logic từ component khác rồi quên đổi tên biến/state
- Khi tạo store mới: KHÔNG copy store khác rồi quên đổi type/interface
- Khi tạo model mới: KHÔNG copy model khác rồi quên đổi table name/columns
- Mỗi file phải có logic riêng biệt, phù hợp với mục đích của nó
- KHÔNG duplicate utility functions — kiểm tra `src/utils/` trước khi tạo mới

---

## 4. KHÔNG Bỏ Sót Edge Cases

Khi viết bất kỳ function nào, PHẢI xem xét:
- Input rỗng: empty string, empty array, null, undefined
- Input boundary: 0, negative numbers, MAX_SAFE_INTEGER
- Input quá lớn: string 10000 ký tự, array 10000 items
- Concurrent calls: function được gọi 2 lần liên tiếp
- Interrupted flow: user navigate away giữa chừng

---

## 5. KHÔNG Tạo Inconsistent State

- Khi update nhiều related state values: update trong 1 action, KHÔNG update từng cái riêng lẻ
- KHÔNG để UI hiển thị state trung gian (ví dụ: loading=false nhưng data=null và error=null)
- Mọi async flow phải có đủ 3 states: loading, success, error

```typescript
// ❌ SAI — state có thể inconsistent giữa 2 setState calls
setLoading(false);
setData(result);

// ✅ ĐÚNG — update trong 1 action
dispatch({ type: 'success', data: result });
// Hoặc dùng Zustand: set({ loading: false, data: result, error: null })
```

---

## 6. KHÔNG Ignore TypeScript Errors

- KHÔNG dùng `@ts-ignore` hoặc `@ts-expect-error` — fix type error thay vì suppress
- KHÔNG dùng `as any` để bypass type checking
- KHÔNG dùng `!` (non-null assertion) — dùng type guard hoặc optional chaining
- Nếu type error khó fix: tạo proper type definition, KHÔNG workaround

---

## 7. KHÔNG Tạo Implicit Dependencies

- Mọi dependency của component phải qua props hoặc hooks, KHÔNG dùng global variables
- KHÔNG import trực tiếp database instance trong components — dùng hooks/services
- KHÔNG rely vào execution order giữa các useEffect
- KHÔNG assume component mount order

---

## 8. Migration & Data Safety

- Khi thay đổi WatermelonDB schema: PHẢI tạo migration, KHÔNG chỉ sửa schema
- Migration phải handle data cũ — KHÔNG để app crash khi user update từ version cũ
- Khi thêm required column: phải có default value trong migration
- Khi rename column: migrate data từ column cũ sang mới
- Test migration path: v1→v2, v1→v3 (skip version)
- KHÔNG xóa column/table trong migration trừ khi data không còn cần

---

## 9. Consistent Patterns

Khi tạo file mới, ĐỌC file cùng loại đã có trong project trước:
- Tạo component mới → đọc 1 component hiện có để match pattern
- Tạo hook mới → đọc 1 hook hiện có
- Tạo store mới → đọc 1 store hiện có
- Tạo model mới → đọc 1 model hiện có
- Tạo service mới → đọc 1 service hiện có
- KHÔNG introduce pattern mới nếu project đã có pattern cho cùng use case

---

## 10. Impact Analysis — Phân Tích Tác Động Khi Sửa Code (BẮT BUỘC)

Mỗi lần sửa code, PHẢI thực hiện quy trình 3 bước: TRƯỚC → SỬA → SAU.

### Bước 1: TRƯỚC khi sửa — Xác định phạm vi ảnh hưởng

1. **Tìm tất cả nơi sử dụng** function/component/type sắp sửa:
   - Search toàn bộ project cho tên function/component/type
   - Kiểm tra re-exports (barrel files `index.ts`)
   - Kiểm tra dynamic references (string-based navigation, store selectors)

2. **Đọc và hiểu code liên quan** trước khi thay đổi:
   - File đang sửa
   - Tất cả files import từ file đang sửa
   - Files mà file đang sửa import từ (dependencies)
   - Tests liên quan

3. **Liệt kê rủi ro** — trả lời các câu hỏi:
   - Function/component này được gọi ở đâu?
   - Thay đổi signature (params, return type) có break caller nào không?
   - Thay đổi behavior có làm sai logic ở nơi khác không?
   - Có side effects nào (DB write, state update, navigation) bị ảnh hưởng?
   - Type/interface thay đổi có break nơi nào dùng nó không?

### Bước 2: SỬA — Nguyên tắc thay đổi an toàn

- **Thay đổi nhỏ nhất có thể** — chỉ sửa đúng phần cần sửa, KHÔNG refactor thêm
- **Giữ nguyên public API** — nếu phải đổi signature, update TẤT CẢ callers
- **Giữ nguyên return type** — nếu phải đổi, kiểm tra mọi nơi dùng return value
- **Backward compatible** — nếu thêm param mới, phải optional với default value
- **KHÔNG đổi tên file/function** nếu không cần thiết cho task hiện tại
- **KHÔNG sửa code không liên quan** đến task — dù thấy code xấu, để riêng task khác

### Bước 3: SAU khi sửa — Kiểm tra tác động

1. **TypeScript check**: `npx tsc --noEmit` — fix MỌI type error trước khi tiếp tục
2. **Chạy tests liên quan**: tests của file đã sửa VÀ tests của files phụ thuộc
3. **Kiểm tra diagnostics** trên tất cả files đã thay đổi
4. **Review từng file đã sửa**: đọc lại diff, đảm bảo không sửa nhầm
5. **Kiểm tra UI flows bị ảnh hưởng**: nếu sửa component/store, xác nhận screens dùng nó vẫn đúng

### Ví dụ cụ thể

```
Yêu cầu: Sửa function calculateProgress() trong progress.service.ts

TRƯỚC:
→ Search "calculateProgress" → tìm thấy dùng ở:
  - ProgressScreen.tsx (hiển thị % hoàn thành)
  - DailyPlanCard.tsx (hiển thị progress bar)
  - studyPlanStore.ts (tính toán khi complete session)
→ Đọc cả 3 files, hiểu cách chúng dùng return value

SỬA:
→ Chỉ sửa logic trong calculateProgress()
→ Giữ nguyên signature: (completed: number, total: number) => number
→ Giữ nguyên return range: 0-1

SAU:
→ tsc --noEmit: pass
→ npm test -- progress.service.test.ts: pass
→ Kiểm tra ProgressScreen, DailyPlanCard, studyPlanStore vẫn nhận đúng giá trị
```

### Quy tắc đặc biệt cho từng loại thay đổi

| Loại thay đổi | Phải kiểm tra thêm |
|---|---|
| Sửa **store action** | Tất cả components subscribe store đó |
| Sửa **DB model/schema** | Migration file, tất cả queries dùng model đó |
| Sửa **shared component** | Tất cả screens/components import nó |
| Sửa **hook** | Tất cả components dùng hook đó |
| Sửa **type/interface** | Tất cả files import type đó |
| Sửa **navigation route** | Deep links, notification handlers, tất cả `router.push()` calls |
| Sửa **utility function** | Tất cả callers + unit tests |

---

## 11. Verification & Cleanup Trước Khi Hoàn Thành (BẮT BUỘC)

Sau khi viết hoặc sửa code, PHẢI thực hiện ĐẦY ĐỦ:

### Kiểm tra chức năng:
1. Chạy `npx tsc --noEmit` — fix mọi type error
2. Chạy tests liên quan — KHÔNG chỉ test file đang sửa mà cả files phụ thuộc
3. Kiểm tra diagnostics trên tất cả files đã thay đổi
4. Đọc lại code 1 lần với mindset "user sẽ làm gì unexpected?"
5. Nếu sửa nhiều files: review lại danh sách files đã thay đổi, đảm bảo không sót

### Dọn dẹp code thừa (KHÔNG ĐƯỢC BỎ QUA):
6. Xóa mọi unused imports trong files đã sửa
7. Xóa mọi unused variables/constants/types trong files đã sửa
8. Xóa mọi commented-out code
9. Xóa mọi console.log/debug statements
10. Search tên code cũ đã thay thế — nếu không còn ai dùng → xóa definition
11. Kiểm tra barrel files (`index.ts`) — xóa re-exports của code đã xóa
12. Nếu xóa hết exports của 1 file → xóa luôn file đó

### Xác nhận cuối cùng:
- Chạy lại `npx tsc --noEmit` sau khi dọn dẹp — đảm bảo việc xóa code không gây lỗi mới
- Mọi file trong project phải có mục đích rõ ràng, không có code zombie
