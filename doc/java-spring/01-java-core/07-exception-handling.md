# Exception Handling — Xử Lý Ngoại Lệ

## Tổng Quan

Exception handling trong Java không chỉ là try-catch — senior cần hiểu exception hierarchy design, performance cost, checked vs unchecked debate, và patterns cho enterprise applications.

---

## Keyword: Exception Hierarchy & Design

**Định nghĩa:** Phân cấp exception trong Java và lý do thiết kế.

```
Throwable (checked)
├── Error (unchecked — JVM/system level, KHÔNG nên catch)
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   ├── NoClassDefFoundError
│   ├── VirtualMachineError
│   └── AssertionError
└── Exception (checked — application level)
    ├── RuntimeException (unchecked — programming errors)
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   │   └── NumberFormatException
    │   ├── IllegalStateException
    │   ├── IndexOutOfBoundsException
    │   │   ├── ArrayIndexOutOfBoundsException
    │   │   └── StringIndexOutOfBoundsException
    │   ├── ClassCastException
    │   ├── UnsupportedOperationException
    │   ├── ConcurrentModificationException
    │   └── ArithmeticException
    └── Checked Exceptions (recoverable errors)
        ├── IOException
        │   └── FileNotFoundException
        ├── SQLException
        ├── ClassNotFoundException
        ├── InterruptedException
        └── ReflectiveOperationException
```

**Design rationale:**
```java
// Error: JVM/system problems — ứng dụng KHÔNG thể recover
// → KHÔNG catch (trừ trường hợp đặc biệt như logging before shutdown)
try {
    // ...
} catch (OutOfMemoryError e) {
    // ❌ Thường vô nghĩa — JVM state đã corrupt
    // Ngoại lệ: log error rồi System.exit()
}

// Checked Exception: Recoverable conditions bên ngoài control của programmer
// → Compiler BUỘC phải handle
// Ví dụ: file không tồn tại, network down, database unavailable

// Unchecked Exception (RuntimeException): Programming errors / bugs
// → KHÔNG buộc handle — fix code thay vì catch
// Ví dụ: null pointer, array out of bounds, illegal argument

// Checked vs Unchecked debate:
// Pro checked: Force caller to handle errors → safer
// Con checked: Boilerplate, exception declaration pollution, breaks encapsulation
// Modern trend: Prefer unchecked (Spring, Kotlin, Scala đều dùng unchecked)
// Java's own evolution: newer APIs dùng unchecked nhiều hơn
```

---

## Keyword: Exception Performance Cost

**Định nghĩa:** Tạo exception object rất tốn kém — chủ yếu do fillInStackTrace().

```java
// Exception creation cost:
// 1. new Exception() → allocate object (cheap)
// 2. fillInStackTrace() → walk entire call stack (EXPENSIVE)
//    - Mỗi stack frame: resolve class, method, line number
//    - Deep stack (Spring app): 50-100+ frames
//    - Cost: ~1-10 microseconds (vs ~1 nanosecond cho normal method call)

// Benchmark: throw/catch vs if/else
// throw/catch: ~1000-10000x chậm hơn if/else check

// ❌ Anti-pattern: Exception for control flow
public int findIndex(int[] arr, int target) {
    try {
        for (int i = 0; ; i++) {
            if (arr[i] == target) return i;
        }
    } catch (ArrayIndexOutOfBoundsException e) {
        return -1;  // Dùng exception thay cho bounds check
    }
}

// ✅ Normal control flow
public int findIndex(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

// Optimization: Pre-created exception (skip fillInStackTrace)
// Dùng trong performance-critical code (ví dụ: Netty, gRPC)
public class FastException extends RuntimeException {
    public static final FastException INSTANCE = new FastException();

    private FastException() {
        super(null, null, true, false);  // writableStackTrace = false
    }

    @Override
    public synchronized Throwable fillInStackTrace() {
        return this;  // No-op — skip expensive stack walk
    }
}

// JVM optimization: -XX:+OmitStackTraceInFastThrow
// Khi cùng exception throw nhiều lần tại cùng vị trí,
// JVM có thể bỏ qua fillInStackTrace → stack trace = null
// → Debug khó hơn, nhưng performance tốt hơn
// Tắt: -XX:-OmitStackTraceInFastThrow
```

---

## Keyword: try-with-resources — Deep Dive

**Định nghĩa:** Automatic resource management — đảm bảo close() được gọi, xử lý suppressed exceptions.

```java
// AutoCloseable interface
public interface AutoCloseable {
    void close() throws Exception;
}

// Closeable extends AutoCloseable (IOException only)
public interface Closeable extends AutoCloseable {
    void close() throws IOException;
}

// Suppressed exceptions — khi cả try body VÀ close() throw exception
try (var resource = new MyResource()) {
    throw new RuntimeException("Primary");
    // resource.close() cũng throw: new RuntimeException("Close")
}
// Kết quả: Primary exception được throw
// Close exception được "suppressed" — gắn vào primary exception
// primary.getSuppressed() → [RuntimeException("Close")]

// Multiple resources — close theo thứ tự NGƯỢC
try (
    var first = new Resource1();   // Close cuối cùng
    var second = new Resource2();  // Close thứ hai
    var third = new Resource3()    // Close đầu tiên
) {
    // use resources
}
// Close order: third → second → first (LIFO)
// Nếu multiple close() throw → tất cả suppressed vào primary

// Custom AutoCloseable
public class DatabaseConnection implements AutoCloseable {
    private Connection conn;

    public DatabaseConnection(String url) throws SQLException {
        this.conn = DriverManager.getConnection(url);
    }

    @Override
    public void close() {
        try {
            if (conn != null && !conn.isClosed()) {
                conn.close();
            }
        } catch (SQLException e) {
            // Log but don't throw — close() should be idempotent
            logger.warn("Error closing connection", e);
        }
    }
}

// Effectively final variable (Java 9+)
Connection conn = getConnection();
try (conn) {  // conn phải effectively final
    // use conn
}
// conn.close() tự động gọi
```

---

## Keyword: Exception Handling Patterns

**Định nghĩa:** Patterns và anti-patterns cho exception handling trong enterprise applications.

```java
// 1. Exception Translation — wrap low-level exception thành high-level
@Repository
public class JpaUserRepository implements UserRepository {
    @Override
    public User findById(Long id) {
        try {
            return entityManager.find(User.class, id);
        } catch (PersistenceException e) {
            // Translate JPA exception → domain exception
            throw new DataAccessException("Failed to find user: " + id, e);
        }
    }
}
// Spring @Repository tự động làm điều này (DataAccessException hierarchy)

// 2. Exception Enrichment — thêm context vào exception
public Order processOrder(Long orderId) {
    try {
        return doProcessOrder(orderId);
    } catch (Exception e) {
        throw new OrderProcessingException(
            "Failed to process order " + orderId + " for customer " + customerId,
            e  // LUÔN giữ original cause
        );
    }
}

// 3. Retry Pattern
public <T> T withRetry(Supplier<T> operation, int maxRetries) {
    Exception lastException = null;
    for (int attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return operation.get();
        } catch (TransientException e) {
            lastException = e;
            logger.warn("Attempt {} failed, retrying...", attempt, e);
            sleep(exponentialBackoff(attempt));
        }
    }
    throw new MaxRetriesExceededException("Failed after " + maxRetries + " attempts", lastException);
}

// 4. Circuit Breaker (simplified)
// Khi service liên tục fail → ngừng gọi, trả fallback
// → Tránh cascade failure trong microservices

// 5. Global Exception Handler (Spring)
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
            .map(v -> v.getPropertyPath() + ": " + v.getMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(new ErrorResponse(message));
    }

    // Catch-all — log unexpected errors, return generic message
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        logger.error("Unexpected error", ex);  // Log full stack trace
        return ResponseEntity.status(500)
            .body(new ErrorResponse("Internal server error"));  // Generic message to client
    }
}
```

---

## Keyword: Custom Exception Design

**Định nghĩa:** Thiết kế exception hierarchy cho ứng dụng — balance giữa granularity và simplicity.

```java
// Base exception cho application
public abstract class ApplicationException extends RuntimeException {
    private final String errorCode;
    private final Map<String, Object> context;

    protected ApplicationException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.context = new LinkedHashMap<>();
    }

    public ApplicationException with(String key, Object value) {
        context.put(key, value);
        return this;
    }

    public String getErrorCode() { return errorCode; }
    public Map<String, Object> getContext() { return Collections.unmodifiableMap(context); }
}

// Domain-specific exceptions
public class EntityNotFoundException extends ApplicationException {
    public EntityNotFoundException(String entityType, Object id) {
        super("NOT_FOUND", entityType + " not found with id: " + id, null);
        with("entityType", entityType).with("id", id);
    }
}

public class BusinessRuleViolationException extends ApplicationException {
    public BusinessRuleViolationException(String rule, String detail) {
        super("BUSINESS_RULE_VIOLATION", rule + ": " + detail, null);
        with("rule", rule);
    }
}

// Usage
throw new EntityNotFoundException("User", userId);
throw new BusinessRuleViolationException("INSUFFICIENT_BALANCE",
    "Cannot withdraw " + amount + " from account with balance " + balance)
    .with("accountId", accountId)
    .with("requestedAmount", amount)
    .with("currentBalance", balance);

// Exception hierarchy guidelines:
// 1. Extend RuntimeException (unchecked) — modern best practice
// 2. Include error code — cho API error responses
// 3. Include context — cho debugging
// 4. Keep hierarchy shallow — 2-3 levels max
// 5. LUÔN giữ cause chain — new Exception(message, cause)
```

---

## Keyword: InterruptedException

**Định nghĩa:** Exception đặc biệt cho thread interruption — xử lý sai là bug phổ biến.

```java
// InterruptedException thrown bởi: Thread.sleep(), Object.wait(),
// BlockingQueue.take(), Future.get(), Lock.lockInterruptibly()...

// ❌ Anti-pattern 1: Nuốt interrupt
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    // Swallow — thread mất interrupt status!
}

// ❌ Anti-pattern 2: Wrap thành RuntimeException mà không restore interrupt
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    throw new RuntimeException(e);  // Interrupt status bị mất
}

// ✅ Pattern 1: Restore interrupt status
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();  // Restore interrupt flag
    // Handle or propagate
}

// ✅ Pattern 2: Propagate (nếu method signature cho phép)
public void process() throws InterruptedException {
    Thread.sleep(1000);  // Propagate lên caller
}

// ✅ Pattern 3: Restore + throw unchecked
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    throw new RuntimeException("Interrupted during processing", e);
}
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Exception Hierarchy | Throwable → Error / Exception → RuntimeException | Checked vs unchecked debate, modern trend |
| Exception Performance | fillInStackTrace() expensive | ~1000x slower than if/else, OmitStackTraceInFastThrow |
| try-with-resources | AutoCloseable auto-close | Suppressed exceptions, close order (LIFO) |
| Exception Patterns | Translation, enrichment, retry, circuit breaker | Global handler, context-rich exceptions |
| Custom Exception Design | Application exception hierarchy | Error codes, context map, shallow hierarchy |
| InterruptedException | Thread interruption | Restore interrupt flag, never swallow |
