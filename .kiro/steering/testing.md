---
inclusion: fileMatch
fileMatchPattern: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/test-utils/**"
---

# Testing Rules

## Chiến lược Testing
- Mọi feature mới phải có test trước khi merge
- Test pyramid: Unit (70%) → Integration (20%) → E2E (10%)
- Coverage target: ≥ 80% cho services và utils, ≥ 60% cho components

## Unit Tests (Jest)
- File test đặt cạnh file source: `study-plan.service.ts` → `study-plan.service.test.ts`
- Hoặc trong thư mục `__tests__/` cùng cấp
- Test pure functions trước: utils, services, algorithms
- Mock database calls, KHÔNG test trực tiếp với WatermelonDB trong unit tests
- Mỗi test case phải có description rõ ràng bằng tiếng Anh
- Pattern: Arrange → Act → Assert
- KHÔNG test implementation details — test behavior

```typescript
// Ví dụ chuẩn
describe('StudyPlanService', () => {
  describe('generateDailyPlan', () => {
    it('should distribute study time evenly across topics', () => {
      // Arrange
      const topics = [/* ... */];
      const availableMinutes = 120;
      
      // Act
      const plan = generateDailyPlan(topics, availableMinutes);
      
      // Assert
      expect(plan.sessions).toHaveLength(topics.length);
      expect(plan.totalMinutes).toBeLessThanOrEqual(availableMinutes);
    });
  });
});
```

## Component Tests (React Native Testing Library)
- Test user interactions, KHÔNG test internal state
- Dùng `screen.getByRole()`, `getByText()`, `getByTestId()` — ưu tiên accessible queries
- Test loading states, error states, empty states
- KHÔNG snapshot testing cho components phức tạp — chỉ dùng cho simple UI components
- Mock navigation với `@react-navigation/native` mock

## Integration Tests
- Test luồng hoàn chỉnh: user action → store update → DB write → UI update
- Dùng in-memory database cho integration tests
- Test data persistence: write → close → reopen → verify data còn
- Test edge cases: dữ liệu rỗng, dữ liệu lớn, concurrent writes

## E2E Tests (Detox)
- Chỉ test critical user flows:
  1. Onboarding: chọn môn học → thiết lập mục tiêu → tạo plan
  2. Daily flow: xem lịch học → bắt đầu session → hoàn thành → xem progress
  3. Settings: thay đổi cài đặt → verify thay đổi được lưu
- Chạy trên cả iOS simulator và Android emulator
- KHÔNG test UI details trong E2E — chỉ test flows

## Test Data
- Dùng factory functions cho test data, KHÔNG hardcode
- File `test-utils/factories.ts` chứa tất cả factories
- Faker.js cho random test data khi cần
- Fixtures cho complex test scenarios

## Lệnh chạy test
- `npm test` — chạy tất cả unit + integration tests
- `npm run test:watch` — watch mode khi develop
- `npm run test:coverage` — chạy với coverage report
- `npm run test:e2e:ios` — E2E trên iOS
- `npm run test:e2e:android` — E2E trên Android
