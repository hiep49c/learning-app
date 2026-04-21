---
inclusion: fileMatch
fileMatchPattern: "**/*.ts,**/*.tsx"
---

# Defensive Coding Rules — Chống Bug Runtime

## 1. Memory Leak Prevention

### useEffect Cleanup (BẮT BUỘC)
- Mọi `useEffect` có subscription, listener, timer, hoặc async operation PHẢI có cleanup function

```typescript
// ✅ ĐÚNG — cleanup subscription
useEffect(() => {
  const subscription = database.collections
    .get('subjects').query().observe()
    .subscribe(setSubjects);
  return () => subscription.unsubscribe();
}, []);
```

### Timer Cleanup (BẮT BUỘC)
- `setTimeout`, `setInterval` PHẢI được clear trong cleanup
- Dùng `useRef` để giữ timer ID

```typescript
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => {
  timerRef.current = setInterval(updateStudyTime, 1000);
  return () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
}, []);
```

### Event Listener Cleanup (BẮT BUỘC)
- AppState, Keyboard, Dimensions, BackHandler — tất cả phải cleanup

```typescript
useEffect(() => {
  const sub = AppState.addEventListener('change', handleAppStateChange);
  return () => sub.remove();
}, []);
```

### Async sau Unmount (BẮT BUỘC)
- Dùng AbortController để cancel async operations khi unmount

```typescript
useEffect(() => {
  const controller = new AbortController();
  async function load(): Promise<void> {
    try {
      const data = await fetchLocalData();
      if (!controller.signal.aborted) setData(data);
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
  load();
  return () => controller.abort();
}, []);
```

---

## 2. Null Safety

- Mọi nested property access PHẢI dùng optional chaining `?.`
- Dùng `??` thay vì `||` cho default values (tránh falsy bug với 0, '', false)
- `.find()` luôn có thể return `undefined` — handle nó
- Dùng `Array.isArray()` khi nhận data từ database hoặc storage
- WatermelonDB `.find(id)` throw nếu không tìm thấy — luôn wrap try/catch

```typescript
// ❌ SAI
const topicName = currentPlan.topics[0].name;
const minutes = studyMinutes || 30;

// ✅ ĐÚNG
const topicName = currentPlan?.topics?.[0]?.name ?? 'Chưa có chủ đề';
const minutes = studyMinutes ?? 30;
```

---

## 3. App Lifecycle — Background/Foreground/Kill

### AppState Handling (BẮT BUỘC)
- Handle transitions: active→background, background→active, inactive→active
- Khi vào background: persist mọi unsaved state ngay lập tức
- OS có thể kill app bất cứ lúc nào — KHÔNG rely vào việc app sẽ quay lại
- Study session progress persist mỗi 30 giây VÀ khi app vào background

### Resume from Kill (BẮT BUỘC)
- Khi app start: kiểm tra session dang dở trong DB
- Nếu có: hỏi user tiếp tục hay bỏ
- KHÔNG auto-resume mà không hỏi user

---

## 4. Concurrency & Race Conditions

### Double-tap Guard (BẮT BUỘC)
- Mọi button press handler có async operation PHẢI có `isSubmitting` guard

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
const handleComplete = useCallback(async (): Promise<void> => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  try { await completeStudySession(); }
  finally { setIsSubmitting(false); }
}, [isSubmitting]);
```

### Database Write Serialization
- WatermelonDB writes PHẢI nằm trong `database.write()` block
- KHÔNG chạy nhiều `database.write()` song song trên cùng records
- Gom nhiều writes vào 1 batch

### Stale Closure Prevention
- Dùng functional update cho setState trong intervals/timeouts: `setCount(prev => prev + 1)`
- Dùng `useRef` cho values cần access trong async callbacks

---

## 5. Error Boundaries & Crash Prevention

- Wrap mỗi screen trong Error Boundary riêng, Error Boundary ở root cho catch-all
- Fallback UI phải có nút retry
- `JSON.parse()` LUÔN trong try/catch
- Division: kiểm tra `total <= 0` và `Number.isFinite()` trước khi chia
- Mọi async operation phải có try/catch
- KHÔNG swallow errors — log hoặc hiển thị cho user

---

## 6. Navigation Safety

- Validate navigation params, provide defaults — params có thể undefined từ deep link
- KHÔNG navigate away khi đang write database
- Show loading indicator, disable back gesture nếu cần

---

## 7. Zustand Store Safety

- Dùng immer middleware cho mọi store có nested state
- Dùng `shallow` comparison cho selectors trả về objects/arrays
- KHÔNG mutate state trực tiếp

```typescript
// ✅ ĐÚNG — shallow selector
const activeTopics = useStudyStore(
  state => state.topics.filter(t => t.isActive),
  shallow
);
```

---

## 8. Date & Timezone

- Dùng UTC cho mọi timestamp lưu trong database
- Convert sang local timezone CHỈ khi hiển thị cho user
- So sánh ngày: normalize về đầu ngày (00:00:00) trước khi compare
- KHÔNG dùng `new Date()` string parsing — dùng explicit year/month/day
- Xử lý daylight saving time: dùng date-fns hoặc dayjs với timezone plugin
- Lịch học hàng ngày tính theo local timezone của user, KHÔNG theo UTC

---

## 9. Platform-Specific Safety

- Kiểm tra `Platform.OS` trước khi dùng API chỉ có trên 1 platform
- iOS `inactive` state (swipe control center) — Android không có state này
- Keyboard behavior khác nhau: `KeyboardAvoidingView` behavior="padding" (iOS) vs "height" (Android)
- Back button hardware chỉ có trên Android — handle `BackHandler`
- StatusBar height khác nhau — dùng `SafeAreaView`
- Haptics: kiểm tra `Haptics.isAvailableAsync()` trước khi gọi
- File system paths khác nhau giữa iOS và Android — dùng Expo FileSystem APIs

---

## 10. Notification & Scheduling Safety

- Dùng `expo-notifications` cho local notifications, KHÔNG dùng push notifications (local-first)
- Request notification permission trước khi schedule — handle rejection gracefully
- Cancel notifications cũ trước khi schedule mới (tránh duplicate notifications)
- Notification identifiers phải unique và predictable (dùng `studySession-{id}-{date}`)
- Khi user thay đổi lịch học → cancel TẤT CẢ notifications cũ → schedule lại
- Khi user xóa môn học → cancel notifications liên quan
- Test notification scheduling với timezone changes và DST transitions
- Android: set notification channel khi app khởi động
- iOS: handle notification permissions denied — show in-app reminder thay thế

---

## 11. Data Growth & Storage Limits

- AsyncStorage có giới hạn ~6MB trên Android — chỉ lưu settings nhỏ, KHÔNG lưu large data
- WatermelonDB cho mọi structured data (study sessions, plans, progress)
- Implement data cleanup: tự động archive/xóa study sessions cũ hơn 1 năm (hỏi user trước)
- Monitor database size — warn user nếu vượt threshold (ví dụ: 100MB)
- Export data phải handle large datasets — stream/chunk thay vì load tất cả vào memory
- Import data phải validate schema version — reject nếu incompatible

---

## 12. Checklist Review Code

Trước khi hoàn thành bất kỳ file nào, kiểm tra:

- [ ] Mọi `useEffect` có side effect đều có cleanup?
- [ ] Mọi async operation handle unmount case (AbortController)?
- [ ] Mọi timer (setTimeout/setInterval) được clear?
- [ ] Mọi event listener được remove?
- [ ] Mọi nested property access dùng optional chaining `?.`?
- [ ] Mọi default value dùng `??` thay vì `||`?
- [ ] Mọi button action có guard chống double-tap?
- [ ] App state changes (background/foreground) được handle?
- [ ] Critical data persist khi app vào background?
- [ ] Database writes nằm trong batch khi có thể?
- [ ] JSON.parse có try/catch?
- [ ] Division operations có guard zero?
- [ ] Navigation params được validate?
- [ ] Error boundaries wrap screens?
- [ ] Date operations dùng UTC cho storage, local cho display?
- [ ] Notifications cancel cũ trước khi schedule mới?
- [ ] AsyncStorage chỉ lưu data nhỏ (settings), không lưu large objects?
