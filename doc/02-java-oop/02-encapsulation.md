# Encapsulation — Đóng Gói

## Tổng Quan

Encapsulation không chỉ là private fields + getter/setter. Senior cần hiểu information hiding, invariant protection, immutability strategies, và module system (Java 9+) như một cấp độ encapsulation mới.

---

## Keyword: Encapsulation vs Information Hiding

**Định nghĩa:** Encapsulation = bundling data + behavior. Information hiding = ẩn implementation details. Hai khái niệm liên quan nhưng khác nhau.

```java
// Encapsulation WITHOUT information hiding — vô nghĩa
// ❌ Getter/setter cho mọi field = expose toàn bộ internal state
public class User {
    private String name;
    private String email;
    private List<String> roles;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public List<String> getRoles() { return roles; }  // ⚠️ Expose mutable list!
    public void setRoles(List<String> roles) { this.roles = roles; }
}
// Đây chỉ là "encapsulation theater" — không bảo vệ gì cả
// Caller vẫn biết và phụ thuộc vào internal structure

// ✅ True information hiding — expose behavior, hide data
public class User {
    private String name;
    private String email;
    private final Set<Role> roles = EnumSet.noneOf(Role.class);

    // Expose behavior, không expose data structure
    public boolean hasRole(Role role) {
        return roles.contains(role);
    }

    public void grantRole(Role role) {
        Objects.requireNonNull(role);
        roles.add(role);
    }

    public void revokeRole(Role role) {
        roles.remove(role);
    }

    // Nếu cần expose collection → unmodifiable copy
    public Set<Role> getRoles() {
        return Collections.unmodifiableSet(roles);
    }

    // Validate trong setter — protect invariants
    public void setEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + email);
        }
        this.email = email.toLowerCase().trim();
    }
}
```

---

## Keyword: Invariant Protection

**Định nghĩa:** Đảm bảo object luôn ở trạng thái hợp lệ — không thể tạo hoặc chuyển sang trạng thái invalid.

```java
// Class invariant: điều kiện LUÔN đúng cho mọi instance
// Ví dụ: DateRange — start <= end
public class DateRange {
    private final LocalDate start;
    private final LocalDate end;

    public DateRange(LocalDate start, LocalDate end) {
        Objects.requireNonNull(start, "start");
        Objects.requireNonNull(end, "end");
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("start must be <= end");
        }
        this.start = start;
        this.end = end;
    }

    // Immutable → invariant luôn được bảo vệ
    // Không có setter → không thể phá invariant sau construction
}

// Mutable class — khó bảo vệ invariant hơn
public class BankAccount {
    private BigDecimal balance;
    private boolean frozen;

    // Invariant: balance >= 0, frozen account cannot transact
    public void withdraw(BigDecimal amount) {
        if (frozen) throw new IllegalStateException("Account is frozen");
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (amount.compareTo(balance) > 0) {
            throw new InsufficientFundsException(balance, amount);
        }
        balance = balance.subtract(amount);
        // Invariant maintained: balance still >= 0
    }

    // Thread safety — synchronized để protect invariant trong concurrent access
    public synchronized void transfer(BankAccount target, BigDecimal amount) {
        this.withdraw(amount);
        target.deposit(amount);
        // Nếu không synchronized: race condition có thể phá invariant
    }
}
```

---

## Keyword: Immutability Strategies

**Định nghĩa:** Các cách tạo immutable objects — từ simple đến deep immutability.

```java
// Level 1: Shallow immutability — final fields, no setters
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;

    public Money(BigDecimal amount, Currency currency) {
        this.amount = Objects.requireNonNull(amount);
        this.currency = Objects.requireNonNull(currency);
    }

    public Money add(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(amount.add(other.amount), currency);
    }
}

// Level 2: Deep immutability — defensive copy cho mutable fields
public final class Event {
    private final String name;
    private final List<String> attendees;
    private final Date timestamp;  // Date is mutable!

    public Event(String name, List<String> attendees, Date timestamp) {
        this.name = name;
        this.attendees = List.copyOf(attendees);  // Immutable copy
        this.timestamp = new Date(timestamp.getTime());  // Defensive copy
    }

    public List<String> getAttendees() {
        return attendees;  // Already immutable — safe to return
    }

    public Date getTimestamp() {
        return new Date(timestamp.getTime());  // Defensive copy on get
    }
}

// Level 3: Record — built-in immutability (Java 16+)
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount);
        Objects.requireNonNull(currency);
    }
    public Money add(Money other) {
        return new Money(amount.add(other.amount), currency);
    }
}

// Immutable collections (Java 9+)
List<String> immutableList = List.of("a", "b", "c");
Set<Integer> immutableSet = Set.of(1, 2, 3);
Map<String, Integer> immutableMap = Map.of("a", 1, "b", 2);
// Tất cả throw UnsupportedOperationException khi modify

// Collections.unmodifiableXxx — wrapper, không copy
List<String> mutable = new ArrayList<>(List.of("a", "b"));
List<String> unmodifiable = Collections.unmodifiableList(mutable);
mutable.add("c");  // unmodifiable cũng thấy "c"! (chỉ là view)

// List.copyOf — copy, truly independent
List<String> copied = List.copyOf(mutable);
mutable.add("d");  // copied KHÔNG thấy "d"

// Benefits of immutability:
// 1. Thread-safe without synchronization
// 2. Can be shared freely (no defensive copies needed)
// 3. Great as Map keys and Set elements (hashCode stable)
// 4. Easier to reason about (no state changes)
// 5. Failure atomicity (operation fails → object unchanged)
```

---

## Keyword: Module System (Java 9+)

**Định nghĩa:** Java Platform Module System (JPMS) — encapsulation ở cấp package, mạnh hơn access modifiers.

```java
// module-info.java
module com.example.myapp {
    // Declare dependencies
    requires java.sql;
    requires java.logging;
    requires transitive com.example.common;  // Transitive: callers cũng thấy

    // Export packages — chỉ exported packages visible bên ngoài module
    exports com.example.myapp.api;
    exports com.example.myapp.model;

    // Qualified export — chỉ cho module cụ thể
    exports com.example.myapp.internal to com.example.testing;

    // Open for reflection (Spring, Hibernate cần)
    opens com.example.myapp.model to com.fasterxml.jackson.databind;

    // Service provider
    provides com.example.spi.Plugin with com.example.myapp.MyPlugin;
    uses com.example.spi.Plugin;
}

// Trước modules: public class = accessible everywhere
// Sau modules: public class trong unexported package = KHÔNG accessible
// → Strong encapsulation: internal packages thực sự hidden

// Tại sao quan trọng cho senior:
// 1. Library design: chỉ export API, hide implementation
// 2. Dependency management: explicit requires
// 3. Security: reflection bị restrict (trừ khi opens)
// 4. Performance: JVM có thể optimize dựa trên module boundaries
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Encapsulation vs Information Hiding | Bundle data+behavior vs hide details | Getter/setter theater, expose behavior not data |
| Invariant Protection | Object luôn ở trạng thái hợp lệ | Validate in constructor/setter, thread safety |
| Immutability Strategies | Shallow → deep → record | Defensive copy, List.copyOf vs unmodifiable, benefits |
| Module System | Package-level encapsulation (Java 9+) | exports, opens, strong encapsulation |
