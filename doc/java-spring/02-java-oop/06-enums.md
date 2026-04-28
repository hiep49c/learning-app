# Enums — Kiểu Liệt Kê

## Tổng Quan

Enum trong Java là full-featured class — có fields, methods, constructors, implement interfaces. Senior cần hiểu enum internals, EnumSet/EnumMap performance, và advanced patterns như state machine.

---

## Keyword: Enum Internals

**Định nghĩa:** Enum constants là static final instances — JVM đảm bảo singleton, serialization-safe, reflection-safe.

```java
// Compiler transforms enum thành:
public enum Color { RED, GREEN, BLUE }

// Equivalent to:
public final class Color extends Enum<Color> {
    public static final Color RED = new Color("RED", 0);
    public static final Color GREEN = new Color("GREEN", 1);
    public static final Color BLUE = new Color("BLUE", 2);

    private static final Color[] VALUES = {RED, GREEN, BLUE};

    private Color(String name, int ordinal) { super(name, ordinal); }

    public static Color[] values() { return VALUES.clone(); }
    public static Color valueOf(String name) { return Enum.valueOf(Color.class, name); }
}

// Singleton guarantee:
// - Constructor private (compiler enforces)
// - Cannot new enum instances
// - Serialization returns same instance (readResolve)
// - Reflection blocked (Constructor.newInstance throws IllegalArgumentException)

// → Enum là cách tốt nhất implement Singleton (Effective Java Item 3)
public enum DatabaseConfig {
    INSTANCE;
    private final String url = loadFromFile();
    public String getUrl() { return url; }
}

// values() tạo array mới mỗi lần gọi — performance trap trong hot path
// ❌
for (int i = 0; i < 1000000; i++) {
    for (Color c : Color.values()) { }  // 1M array allocations!
}
// ✅ Cache values
private static final Color[] CACHED_VALUES = Color.values();
```

---

## Keyword: EnumSet & EnumMap

**Định nghĩa:** Specialized collections cho enums — dùng bitmask internally, cực kỳ nhanh.

```java
// EnumSet — Set<E extends Enum<E>> backed by bit vector
// O(1) cho add, remove, contains — nhanh hơn HashSet
EnumSet<Permission> perms = EnumSet.of(Permission.READ, Permission.WRITE);
perms.add(Permission.EXECUTE);
perms.contains(Permission.READ);  // O(1) — single bit check
perms.containsAll(EnumSet.of(Permission.READ, Permission.WRITE));  // O(1) — bitwise AND

// Internal: long bitmask (≤64 enum constants) hoặc long[] (>64)
// Permission.READ  = bit 0 = 0b001
// Permission.WRITE = bit 1 = 0b010
// Permission.EXEC  = bit 2 = 0b100
// {READ, WRITE} = 0b011

// EnumMap — Map<K extends Enum<K>, V> backed by array
// O(1) cho get, put — nhanh hơn HashMap, no hashing
EnumMap<DayOfWeek, String> schedule = new EnumMap<>(DayOfWeek.class);
schedule.put(DayOfWeek.MONDAY, "Meeting");
schedule.put(DayOfWeek.FRIDAY, "Review");

// Internal: Object[] indexed by ordinal
// schedule.get(MONDAY) → array[MONDAY.ordinal()] → O(1)

// → LUÔN dùng EnumSet/EnumMap thay vì HashSet/HashMap cho enum keys
```

---

## Keyword: Enum Advanced Patterns

**Định nghĩa:** Enum với abstract methods, interface implementation, và state machine pattern.

```java
// Strategy Pattern với enum
public enum DiscountStrategy {
    NONE {
        public BigDecimal apply(BigDecimal price) { return price; }
    },
    PERCENT_10 {
        public BigDecimal apply(BigDecimal price) {
            return price.multiply(new BigDecimal("0.90"));
        }
    },
    FIXED_50 {
        public BigDecimal apply(BigDecimal price) {
            return price.subtract(new BigDecimal("50")).max(BigDecimal.ZERO);
        }
    };

    public abstract BigDecimal apply(BigDecimal price);
}

// State Machine Pattern
public enum OrderStatus {
    PENDING {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.of(CONFIRMED, CANCELLED);
        }
    },
    CONFIRMED {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.of(SHIPPED, CANCELLED);
        }
    },
    SHIPPED {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.of(DELIVERED);
        }
    },
    DELIVERED {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.noneOf(OrderStatus.class);  // Terminal state
        }
    },
    CANCELLED {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.noneOf(OrderStatus.class);  // Terminal state
        }
    };

    public abstract Set<OrderStatus> allowedTransitions();

    public boolean canTransitionTo(OrderStatus target) {
        return allowedTransitions().contains(target);
    }

    public OrderStatus transitionTo(OrderStatus target) {
        if (!canTransitionTo(target)) {
            throw new IllegalStateException(
                "Cannot transition from " + this + " to " + target);
        }
        return target;
    }
}

// Reverse lookup — name/code → enum
public enum HttpStatus {
    OK(200), NOT_FOUND(404), INTERNAL_ERROR(500);

    private final int code;
    HttpStatus(int code) { this.code = code; }

    // ❌ Slow: O(n) linear search
    public static HttpStatus fromCode(int code) {
        for (HttpStatus s : values()) {
            if (s.code == code) return s;
        }
        throw new IllegalArgumentException("Unknown: " + code);
    }

    // ✅ Fast: O(1) lookup with cached map
    private static final Map<Integer, HttpStatus> BY_CODE =
        Arrays.stream(values()).collect(Collectors.toMap(s -> s.code, s -> s));

    public static HttpStatus fromCodeFast(int code) {
        HttpStatus status = BY_CODE.get(code);
        if (status == null) throw new IllegalArgumentException("Unknown: " + code);
        return status;
    }
}
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Enum Internals | Static final instances, extends Enum | Singleton guarantee, values() allocation |
| EnumSet & EnumMap | Bitmask/array-backed collections | O(1) operations, always prefer over Hash* |
| Enum Patterns | Strategy, State Machine, reverse lookup | Abstract methods, cached lookup map |
