# SOLID Principles — Nguyên Tắc SOLID

## Tổng Quan

SOLID là 5 nguyên tắc thiết kế OOP của Robert C. Martin. Senior cần hiểu không chỉ định nghĩa mà cả trade-offs, khi nào áp dụng, khi nào vi phạm có chủ đích, và cách Spring Framework leverage SOLID.

---

## Keyword: Single Responsibility Principle (SRP)

**Định nghĩa:** Mỗi class chỉ có MỘT lý do để thay đổi — một actor/stakeholder chịu trách nhiệm.

```java
// SRP không phải "mỗi class làm 1 việc" — mà là "1 lý do thay đổi"
// "Lý do thay đổi" = actor/stakeholder yêu cầu thay đổi

// ❌ Vi phạm: Employee class phục vụ 3 actors
public class Employee {
    public BigDecimal calculatePay() { }     // CFO yêu cầu thay đổi
    public int calculateHours() { }          // COO yêu cầu thay đổi
    public void save() { }                   // CTO yêu cầu thay đổi
}
// Thay đổi cho CFO có thể break logic của COO

// ✅ Tách theo actor
public class PayCalculator { public BigDecimal calculate(Employee e) { } }
public class HourTracker { public int calculate(Employee e) { } }
public class EmployeeRepository { public void save(Employee e) { } }

// Spring áp dụng SRP:
// @Controller — chỉ handle HTTP request/response
// @Service — chỉ business logic
// @Repository — chỉ data access
// Mỗi layer thay đổi vì lý do khác nhau

// Trade-off: Quá nhiều classes nhỏ → complexity tăng
// Balance: Tách khi có DỰ KIẾN thay đổi độc lập, không tách preventively
```

---

## Keyword: Open/Closed Principle (OCP)

**Định nghĩa:** Mở cho extension, đóng cho modification — thêm behavior mới mà không sửa code cũ.

```java
// OCP thường đạt được qua: Strategy, Template Method, Observer, Plugin architecture

// Ví dụ thực tế: Notification system
// ❌ Mỗi lần thêm channel → sửa method
public void notify(String type, String message) {
    if ("email".equals(type)) sendEmail(message);
    else if ("sms".equals(type)) sendSms(message);
    else if ("push".equals(type)) sendPush(message);
    // Thêm "slack" → sửa method này
}

// ✅ OCP: thêm channel = thêm class
public interface NotificationChannel {
    boolean supports(String type);
    void send(String message);
}

@Component
public class NotificationService {
    private final List<NotificationChannel> channels;  // Spring inject tất cả implementations

    public void notify(String type, String message) {
        channels.stream()
            .filter(ch -> ch.supports(type))
            .forEach(ch -> ch.send(message));
    }
}

// Thêm Slack: tạo SlackChannel implements NotificationChannel
// NotificationService KHÔNG cần sửa

// Spring Boot auto-configuration là OCP ở cấp framework:
// Thêm dependency → auto-configure → không sửa code
// spring-boot-starter-data-jpa → tự cấu hình JPA
// spring-boot-starter-security → tự cấu hình Security
```

---

## Keyword: Liskov Substitution Principle (LSP)

**Định nghĩa:** Subtype phải thay thế được supertype mà không làm sai program behavior — behavioral subtyping.

```java
// LSP formal rules:
// 1. Preconditions cannot be strengthened in subtype
// 2. Postconditions cannot be weakened in subtype
// 3. Invariants of supertype must be preserved
// 4. History constraint: subtype cannot add state changes supertype doesn't allow

// ❌ Classic violation: Square extends Rectangle
public class Rectangle {
    protected int width, height;
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int area() { return width * height; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int w) { this.width = w; this.height = w; }
    @Override
    public void setHeight(int h) { this.width = h; this.height = h; }
}

// Client code expects Rectangle behavior:
void resize(Rectangle r) {
    r.setWidth(5);
    r.setHeight(3);
    assert r.area() == 15;  // FAILS for Square! area = 9
}
// Square strengthens postcondition of setWidth (also changes height)
// → Violates LSP

// ✅ Fix: separate types, no inheritance
public interface Shape { double area(); }
public record Rectangle(double width, double height) implements Shape {
    public double area() { return width * height; }
}
public record Square(double side) implements Shape {
    public double area() { return side * side; }
}

// Real-world LSP violations to watch for:
// 1. Throwing UnsupportedOperationException
//    Collections.unmodifiableList() returns List that throws on add()
//    → Technically violates LSP (weakens postcondition)
//    → Accepted trade-off in Java Collections

// 2. Subclass restricting valid inputs
//    Base: accepts any positive number
//    Sub: only accepts even numbers → strengthens precondition → LSP violation

// 3. Subclass changing observable behavior
//    Base: sort() is stable
//    Sub: sort() is unstable → weakens postcondition → LSP violation
```

---

## Keyword: Interface Segregation Principle (ISP)

**Định nghĩa:** Clients không nên phụ thuộc vào methods không dùng — chia interface lớn thành nhỏ, focused.

```java
// ISP trong Spring:
// CrudRepository<T, ID> — basic CRUD
// PagingAndSortingRepository<T, ID> extends CrudRepository — + paging
// JpaRepository<T, ID> extends PagingAndSortingRepository — + JPA specific

// Client chỉ cần CRUD → depend on CrudRepository
// Client cần paging → depend on PagingAndSortingRepository
// Không bị force depend on JPA-specific methods

// ISP cho service interfaces:
// ❌ Fat interface
public interface UserService {
    User findById(Long id);
    List<User> findAll();
    User create(CreateUserRequest req);
    User update(Long id, UpdateUserRequest req);
    void delete(Long id);
    void sendVerificationEmail(Long userId);
    void resetPassword(Long userId);
    Report generateUserReport();
    void importFromCsv(InputStream csv);
    void exportToCsv(OutputStream csv);
}

// ✅ Segregated interfaces
public interface UserReader {
    User findById(Long id);
    List<User> findAll();
}

public interface UserWriter {
    User create(CreateUserRequest req);
    User update(Long id, UpdateUserRequest req);
    void delete(Long id);
}

public interface UserNotification {
    void sendVerificationEmail(Long userId);
    void resetPassword(Long userId);
}

// CQRS pattern tự nhiên từ ISP:
// Read operations: UserReader
// Write operations: UserWriter
// Có thể scale independently
```

---

## Keyword: Dependency Inversion Principle (DIP)

**Định nghĩa:** High-level modules không phụ thuộc low-level modules — cả hai phụ thuộc abstractions. Đây là nền tảng của Spring DI.

```java
// DIP = Inversion of Control (IoC) ở design level
// Spring DI = implementation của DIP

// ❌ High-level depends on low-level
public class OrderService {
    private final MySQLOrderRepository repo = new MySQLOrderRepository();
    // OrderService phụ thuộc trực tiếp vào MySQL implementation
    // Đổi sang PostgreSQL → sửa OrderService
}

// ✅ Both depend on abstraction
public interface OrderRepository {  // Abstraction
    void save(Order order);
    Optional<Order> findById(Long id);
}

@Repository
public class JpaOrderRepository implements OrderRepository {  // Low-level
    // JPA implementation
}

@Service
public class OrderService {  // High-level
    private final OrderRepository repository;  // Depends on abstraction

    public OrderService(OrderRepository repository) {
        this.repository = repository;  // Spring injects implementation
    }
}

// DIP enables:
// 1. Testability — inject mock repository
@Test
void testCreateOrder() {
    OrderRepository mockRepo = mock(OrderRepository.class);
    OrderService service = new OrderService(mockRepo);
    // Test business logic without database
}

// 2. Flexibility — swap implementations
// Dev: H2 in-memory
// Prod: PostgreSQL
// Test: Mock
// Tất cả implement cùng OrderRepository interface

// 3. Plugin architecture
// Core module defines interfaces
// Plugin modules provide implementations
// Core không biết plugins tồn tại → loose coupling

// Dependency Rule (Clean Architecture):
// Source code dependencies point INWARD
// Outer layers depend on inner layers
// Inner layers NEVER depend on outer layers
//
// Domain (entities) → knows nothing
// Use Cases → depends on Domain
// Interface Adapters → depends on Use Cases
// Frameworks → depends on Interface Adapters
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| SRP | 1 lý do thay đổi per class | Actor-based, Spring layer separation |
| OCP | Open extension, closed modification | Strategy pattern, Spring auto-configuration |
| LSP | Subtype thay thế supertype safely | Pre/postconditions, Square/Rectangle, UnsupportedOperationException |
| ISP | Small focused interfaces | CQRS from ISP, Spring Repository hierarchy |
| DIP | Depend on abstractions | Spring DI foundation, testability, Clean Architecture |
