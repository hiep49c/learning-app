# Classes & Objects — Lớp và Đối Tượng

## Tổng Quan

Class và Object là nền tảng OOP trong Java. Senior cần hiểu object lifecycle trên JVM, memory layout, class loading mechanism, và các design patterns liên quan đến object creation.

---

## Keyword: Object Memory Layout

**Định nghĩa:** Cách JVM lưu trữ object trên heap — header, fields, padding.

```
Object layout trên 64-bit JVM (CompressedOops enabled, heap < 32GB):

┌─────────────────────────────────────────────┐
│ Mark Word (8 bytes)                         │
│  ├─ hashCode (31 bits)                      │
│  ├─ GC age (4 bits, max 15 → promote to old)│
│  ├─ biased locking info                     │
│  └─ lock state (2 bits)                     │
│     00 = lightweight lock                   │
│     01 = unlocked / biased                  │
│     10 = heavyweight lock (monitor)         │
│     11 = GC marked                          │
├─────────────────────────────────────────────┤
│ Class Pointer (4 bytes, compressed)         │
│  └─ Trỏ đến Klass metadata trong Metaspace  │
├─────────────────────────────────────────────┤
│ Instance Fields (sorted by size for packing)│
│  ├─ longs/doubles (8 bytes each)            │
│  ├─ ints/floats (4 bytes each)              │
│  ├─ shorts/chars (2 bytes each)             │
│  ├─ bytes/booleans (1 byte each)            │
│  └─ references (4 bytes compressed)         │
├─────────────────────────────────────────────┤
│ Padding (to 8-byte boundary)                │
└─────────────────────────────────────────────┘
```

```java
// Ví dụ memory calculation
public class User {
    private long id;        // 8 bytes
    private int age;        // 4 bytes
    private boolean active; // 1 byte
    private String name;    // 4 bytes (compressed ref)
}
// Header: 12 bytes (mark word 8 + class pointer 4)
// Fields: 8 + 4 + 1 + 4 = 17 bytes
// Padding: 3 bytes (to align to 8-byte boundary)
// Total: 12 + 17 + 3 = 32 bytes

// Empty object: 16 bytes (12 header + 4 padding)
// → Mỗi object có overhead tối thiểu 16 bytes

// Tool: JOL (Java Object Layout) — xem layout thực tế
// System.out.println(ClassLayout.parseClass(User.class).toPrintable());

// Field reordering — JVM sắp xếp fields để minimize padding
public class BadLayout {
    boolean a;  // 1 byte + 7 padding
    long b;     // 8 bytes
    boolean c;  // 1 byte + 7 padding
    long d;     // 8 bytes
}
// Naive: 1+7+8+1+7+8 = 32 bytes fields
// JVM reorders: long b, long d, boolean a, boolean c
// Optimized: 8+8+1+1+6(padding) = 24 bytes fields
// -XX:+CompactFields (default) enables this optimization
```

---

## Keyword: Object Lifecycle & Garbage Collection

**Định nghĩa:** Vòng đời object từ allocation đến GC collection — hiểu để tránh memory leaks.

```java
// Object lifecycle:
// 1. Allocation (new) → Eden space (Young Generation)
// 2. Minor GC → Survivor space (nếu còn reachable)
// 3. Aging (survive multiple GCs) → Old Generation (tenured)
// 4. Major/Full GC → collected khi unreachable

// Reachability levels (java.lang.ref):
// 1. Strong reference — bình thường, GC không thu hồi
Object obj = new Object();

// 2. Soft reference — GC thu hồi khi sắp OOM (dùng cho cache)
SoftReference<byte[]> cache = new SoftReference<>(new byte[1024 * 1024]);
byte[] data = cache.get();  // null nếu đã bị GC

// 3. Weak reference — GC thu hồi ngay khi không có strong ref
WeakReference<Object> weak = new WeakReference<>(new Object());
// WeakHashMap dùng weak keys → entry tự xóa khi key bị GC

// 4. Phantom reference — không thể get(), chỉ để track khi object bị GC
PhantomReference<Object> phantom = new PhantomReference<>(obj, referenceQueue);

// Memory leak patterns trong Java:
// 1. Static collections giữ references mãi mãi
private static final List<Object> cache = new ArrayList<>();  // Leak!

// 2. Listener/callback không unregister
eventBus.register(listener);  // Nếu quên unregister → leak

// 3. Inner class giữ reference đến outer class
public class Outer {
    private byte[] largeData = new byte[10_000_000];

    public Runnable createTask() {
        return new Runnable() {  // Anonymous inner class giữ ref đến Outer
            public void run() { /* không dùng largeData nhưng vẫn giữ ref */ }
        };
    }
    // Fix: dùng static inner class hoặc lambda (nếu không capture)
}

// 4. ThreadLocal không cleanup
ThreadLocal<Connection> connHolder = new ThreadLocal<>();
connHolder.set(getConnection());
// Nếu thread pool reuse thread → connection không bao giờ bị GC
// Fix: always call connHolder.remove() trong finally

// 5. String.substring() trước Java 7 giữ ref đến original char[]
```

---

## Keyword: Constructor — Advanced

**Định nghĩa:** Constructor không chỉ khởi tạo — liên quan đến initialization order, this() chaining, và object publication safety.

```java
// Initialization order (quan trọng cho interview):
// 1. Static fields và static initializer blocks (theo thứ tự xuất hiện)
// 2. Instance fields và instance initializer blocks (theo thứ tự xuất hiện)
// 3. Constructor body

public class InitOrder {
    // Step 1: Static (chỉ chạy 1 lần khi class load)
    private static int staticField = initStatic();  // 1st
    static { System.out.println("Static block"); }  // 2nd

    // Step 2: Instance (mỗi lần new)
    private int instanceField = initInstance();      // 3rd
    { System.out.println("Instance block"); }        // 4th

    // Step 3: Constructor
    public InitOrder() {
        System.out.println("Constructor");           // 5th
    }
}

// Constructor chaining
public class Connection {
    private final String host;
    private final int port;
    private final int timeout;
    private final boolean ssl;

    // Primary constructor — tất cả logic ở đây
    public Connection(String host, int port, int timeout, boolean ssl) {
        this.host = Objects.requireNonNull(host);
        this.port = validatePort(port);
        this.timeout = timeout > 0 ? timeout : 30000;
        this.ssl = ssl;
    }

    // Convenience constructors delegate to primary
    public Connection(String host, int port) {
        this(host, port, 30000, false);
    }

    public Connection(String host) {
        this(host, 80);
    }
}

// TRAP: Calling overridable method in constructor
public class Parent {
    public Parent() {
        init();  // ⚠️ Nếu subclass override init(), gọi trước subclass constructor!
    }
    protected void init() { System.out.println("Parent init"); }
}

public class Child extends Parent {
    private String name;
    public Child(String name) {
        super();  // Gọi Parent() → init() → Child.init() chạy
        this.name = name;  // name chưa được gán tại thời điểm init() chạy!
    }
    @Override
    protected void init() {
        System.out.println("Child init: " + name);  // name = null!
    }
}
// → KHÔNG BAO GIỜ gọi overridable method trong constructor

// Safe publication — object escape trong constructor
public class Unsafe {
    private int value;
    public Unsafe() {
        // ❌ Publish this trước khi constructor hoàn thành
        EventBus.register(this);  // Other threads thấy partially constructed object!
        this.value = 42;  // Có thể chưa visible cho threads khác
    }
}

// ✅ Factory method pattern — publish sau khi fully constructed
public class Safe {
    private int value;
    private Safe() {
        this.value = 42;
    }
    public static Safe create() {
        Safe obj = new Safe();  // Fully constructed
        EventBus.register(obj);  // Safe to publish
        return obj;
    }
}
```

---

## Keyword: equals, hashCode, toString — Contract & Pitfalls

**Định nghĩa:** Ba methods từ Object mà mọi class nên override đúng cách.

```java
// equals() contract (JLS):
// 1. Reflexive: x.equals(x) == true
// 2. Symmetric: x.equals(y) ↔ y.equals(x)
// 3. Transitive: x.equals(y) && y.equals(z) → x.equals(z)
// 4. Consistent: multiple calls → same result (nếu object không đổi)
// 5. x.equals(null) == false

// TRAP: instanceof vs getClass() trong equals
// instanceof: vi phạm symmetry khi có inheritance
public class Point {
    int x, y;
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }
}

public class ColorPoint extends Point {
    String color;
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof ColorPoint cp)) return false;
        return super.equals(cp) && color.equals(cp.color);
    }
}

Point p = new Point(1, 2);
ColorPoint cp = new ColorPoint(1, 2, "red");
p.equals(cp);   // true (Point.equals dùng instanceof)
cp.equals(p);   // false (ColorPoint.equals check instanceof ColorPoint)
// Vi phạm symmetry!

// Fix: dùng getClass() thay vì instanceof
@Override
public boolean equals(Object o) {
    if (o == null || getClass() != o.getClass()) return false;
    Point p = (Point) o;
    return x == p.x && y == p.y;
}
// Hoặc: dùng composition thay vì inheritance cho value types

// hashCode() contract:
// 1. a.equals(b) → a.hashCode() == b.hashCode() (PHẢI)
// 2. a.hashCode() == b.hashCode() KHÔNG có nghĩa a.equals(b) (collision OK)
// 3. Consistent: multiple calls → same result

// Vi phạm hashCode contract → HashMap/HashSet broken
Map<Point, String> map = new HashMap<>();
Point p1 = new Point(1, 2);
map.put(p1, "hello");

// Nếu equals() override nhưng hashCode() không:
// p1.hashCode() dùng Object.hashCode() (identity hash)
Point p2 = new Point(1, 2);
map.get(p2);  // null! Vì p2.hashCode() ≠ p1.hashCode()

// Best practice: dùng Objects.hash() hoặc IDE generate
@Override
public int hashCode() {
    return Objects.hash(x, y);  // Consistent với equals
}

// Performance: hashCode cho immutable objects nên cache
private int hash;  // 0 = not computed
@Override
public int hashCode() {
    int h = hash;
    if (h == 0) {
        h = Objects.hash(field1, field2, field3);
        hash = h;
    }
    return h;
}

// toString() — debug-friendly representation
@Override
public String toString() {
    return "User{id=" + id + ", name='" + name + "', email='" + email + "'}";
    // Hoặc dùng StringJoiner:
    // return new StringJoiner(", ", User.class.getSimpleName() + "[", "]")
    //     .add("id=" + id)
    //     .add("name='" + name + "'")
    //     .toString();
}
// KHÔNG include sensitive data (password, token) trong toString()
```

---

## Keyword: Record (Java 16+)

**Định nghĩa:** Transparent carrier cho immutable data — compiler tự generate constructor, accessors, equals, hashCode, toString.

```java
// Record = final class + private final fields + canonical constructor
// + accessors (no get prefix) + equals + hashCode + toString
public record Point(int x, int y) {}

// Equivalent to ~60 lines of boilerplate code

// Compact constructor — validation
public record Email(String value) {
    public Email {  // Compact constructor — parameters implicit
        Objects.requireNonNull(value, "email must not be null");
        if (!value.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + value);
        }
        value = value.toLowerCase().trim();  // Can modify before assignment
    }
}

// Custom methods
public record Range(int start, int end) {
    public Range {
        if (start > end) throw new IllegalArgumentException("start > end");
    }

    public int length() { return end - start; }
    public boolean contains(int value) { return value >= start && value <= end; }
    public Range overlap(Range other) {
        int s = Math.max(start, other.start);
        int e = Math.min(end, other.end);
        return s <= e ? new Range(s, e) : null;
    }
}

// Record restrictions:
// - Cannot extend other class (implicitly extends Record)
// - Cannot declare instance fields (only components)
// - Implicitly final — cannot be extended
// - CAN implement interfaces
// - CAN have static fields and methods
// - CAN have custom constructors (must delegate to canonical)

// Record as DTO
public record CreateUserRequest(
    @NotBlank String name,
    @Email String email,
    @Min(0) @Max(150) int age
) {}

// Record decomposition in pattern matching (Java 21+)
if (obj instanceof Point(int x, int y)) {
    System.out.println("x=" + x + ", y=" + y);
}

// Nested record patterns
record Line(Point start, Point end) {}
if (obj instanceof Line(Point(var x1, var y1), Point(var x2, var y2))) {
    double length = Math.hypot(x2 - x1, y2 - y1);
}

// Record vs Lombok @Value:
// Record: built-in, no dependency, pattern matching support
// Lombok: more flexible (builder, custom equals), works with older Java
// Record: accessors are name() not getName()
// Record: cannot have mutable fields
```

---

## Keyword: Object Creation Patterns

**Định nghĩa:** Các patterns tạo object ngoài constructor — static factory, builder, prototype.

```java
// 1. Static Factory Method — ưu tiên hơn constructor
public class Duration {
    private final long millis;

    private Duration(long millis) { this.millis = millis; }

    // Descriptive names (constructor không có tên)
    public static Duration ofMillis(long millis) { return new Duration(millis); }
    public static Duration ofSeconds(long seconds) { return new Duration(seconds * 1000); }
    public static Duration ofMinutes(long minutes) { return new Duration(minutes * 60_000); }

    // Có thể cache/reuse instances
    private static final Duration ZERO = new Duration(0);
    public static Duration zero() { return ZERO; }

    // Có thể return subtype
    public static Duration parse(String text) { /* ... */ }
}

// 2. Builder Pattern — cho objects có nhiều optional parameters
public class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeout;

    private HttpRequest(Builder builder) {
        this.url = Objects.requireNonNull(builder.url);
        this.method = builder.method;
        this.headers = Map.copyOf(builder.headers);
        this.body = builder.body;
        this.timeout = builder.timeout;
    }

    public static Builder builder(String url) {
        return new Builder(url);
    }

    public static class Builder {
        private final String url;
        private String method = "GET";
        private final Map<String, String> headers = new LinkedHashMap<>();
        private String body;
        private int timeout = 30000;

        private Builder(String url) { this.url = url; }

        public Builder method(String method) { this.method = method; return this; }
        public Builder header(String key, String value) { headers.put(key, value); return this; }
        public Builder body(String body) { this.body = body; return this; }
        public Builder timeout(int timeout) { this.timeout = timeout; return this; }

        public HttpRequest build() {
            return new HttpRequest(this);
        }
    }
}

HttpRequest request = HttpRequest.builder("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer token")
    .body("{\"name\": \"An\"}")
    .timeout(5000)
    .build();

// 3. Singleton — dùng enum (Effective Java recommendation)
public enum DatabaseConfig {
    INSTANCE;

    private final String url = loadUrl();
    public String getUrl() { return url; }
}
// Thread-safe, serialization-safe, reflection-safe
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Object Memory Layout | Header + fields + padding trên heap | Mark word, field reordering, JOL tool |
| Object Lifecycle & GC | Allocation → Eden → Survivor → Old → collected | Reference types, memory leak patterns |
| Constructor | Khởi tạo object | Init order, no overridable calls, safe publication |
| equals/hashCode/toString | Object contract methods | Symmetry trap, hashCode caching, HashMap broken |
| Record | Immutable data carrier (Java 16+) | Pattern matching, compact constructor, vs Lombok |
| Creation Patterns | Static factory, Builder, Singleton | Named constructors, fluent API, enum singleton |
