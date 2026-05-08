# Methods — Phương Thức

## Tổng Quan

Methods là đơn vị tổ chức code cơ bản. Senior cần hiểu JVM method invocation (invokevirtual, invokeinterface, invokestatic, invokespecial, invokedynamic), method dispatch, inlining optimization, và design principles cho clean method signatures.

---

## Keyword: Method Invocation — JVM Level

**Định nghĩa:** JVM có 5 bytecode instructions cho method invocation, mỗi loại có dispatch mechanism khác nhau.

```java
// 1. invokestatic — gọi static method (compile-time binding)
Math.max(1, 2);  // invokestatic java/lang/Math.max:(II)I

// 2. invokespecial — gọi constructor, private method, super method
//    (compile-time binding, KHÔNG virtual dispatch)
new Object();           // invokespecial java/lang/Object.<init>:()V
super.toString();       // invokespecial
private void helper();  // invokespecial

// 3. invokevirtual — gọi instance method trên class
//    (runtime binding — virtual method dispatch qua vtable)
obj.toString();  // invokevirtual java/lang/Object.toString:()Ljava/lang/String;

// 4. invokeinterface — gọi method qua interface reference
//    (runtime binding — dispatch qua itable, chậm hơn invokevirtual)
List<String> list = new ArrayList<>();
list.size();  // invokeinterface java/util/List.size:()I

// 5. invokedynamic — dynamic method resolution (Java 7+)
//    Dùng cho: lambda, string concat (Java 9+), method handles
Runnable r = () -> {};  // invokedynamic (bootstrap method tạo lambda)

// Performance implications:
// invokestatic, invokespecial: nhanh nhất (direct call, dễ inline)
// invokevirtual: nhanh (vtable lookup, JIT có thể devirtualize + inline)
// invokeinterface: chậm hơn (itable lookup, khó optimize hơn)
// invokedynamic: first call chậm (bootstrap), sau đó nhanh (cached)

// JIT Inlining — optimization quan trọng nhất
// JIT compiler inline small methods (< 35 bytecodes mặc định)
// → Loại bỏ method call overhead
// → Cho phép further optimizations (escape analysis, dead code elimination)
// -XX:MaxInlineSize=35 (default)
// -XX:FreqInlineSize=325 (for hot methods)

// final methods dễ inline hơn (không cần devirtualize)
// private methods dễ inline hơn (invokespecial, không virtual)
// → Đây là lý do "prefer private/final" không chỉ về encapsulation
```

---

## Keyword: Method Parameters — Pass-by-Value Deep Dive

**Định nghĩa:** Java LUÔN pass-by-value — primitives copy giá trị, references copy địa chỉ.

```java
// Chứng minh Java là pass-by-value cho references:
public void swap(Object a, Object b) {
    Object temp = a;
    a = b;
    b = temp;
    // Chỉ swap LOCAL COPIES của references
    // Objects gốc KHÔNG bị swap
}

String x = "Hello";
String y = "World";
swap(x, y);
// x vẫn = "Hello", y vẫn = "World"

// Nhưng CÓ THỂ modify object qua reference copy:
public void addItem(List<String> list) {
    list.add("new");  // Modify object gốc qua reference copy
}

// Defensive copying — pattern quan trọng
public class DateRange {
    private final Date start;
    private final Date end;

    public DateRange(Date start, Date end) {
        // ❌ Caller có thể modify Date sau khi truyền vào
        // this.start = start;

        // ✅ Defensive copy
        this.start = new Date(start.getTime());
        this.end = new Date(end.getTime());
    }

    public Date getStart() {
        // ❌ Caller có thể modify returned Date
        // return start;

        // ✅ Defensive copy
        return new Date(start.getTime());
    }

    // Hoặc tốt hơn: dùng immutable types
    // private final LocalDate start;  // Immutable — không cần defensive copy
}
```

---

## Keyword: Varargs — Internals & Pitfalls

**Định nghĩa:** Variable arguments — compiler tạo array tại call site.

```java
public void log(String format, Object... args) {
    // args là Object[] — compiler tạo array khi gọi
}

log("Hello %s, age %d", "An", 25);
// Compiler tạo: log("Hello %s, age %d", new Object[]{"An", 25})
// → Mỗi lần gọi tạo array mới → GC pressure

// Heap pollution với generic varargs
@SafeVarargs  // Suppress warning
public static <T> List<T> listOf(T... elements) {
    return Arrays.asList(elements);
}

// Tại sao cần @SafeVarargs?
// Generic varargs tạo Object[] (type erasure), không phải T[]
// → Có thể gây ClassCastException tại runtime

// ❌ Unsafe varargs — heap pollution
static <T> T[] toArray(T... args) {
    return args;  // Returns Object[] disguised as T[]
}
String[] strings = toArray("a", "b");  // ClassCastException!
// Vì toArray trả về Object[], cast sang String[] fail

// ✅ Safe varargs — chỉ đọc, không expose array
@SafeVarargs
static <T> List<T> safeList(T... args) {
    return List.of(args);  // Chỉ đọc args, không return nó
}

// Performance: tránh varargs trong hot path
// Overload cho common cases:
public void log(String msg) { }                    // 0 args — no array
public void log(String msg, Object a) { }          // 1 arg — no array
public void log(String msg, Object a, Object b) { } // 2 args — no array
public void log(String msg, Object... args) { }    // 3+ args — array
// Pattern dùng trong: String.format, Logger, EnumSet.of
```

---

## Keyword: Method Overloading — Resolution Rules

**Định nghĩa:** Compiler chọn overloaded method tại compile time theo rules phức tạp.

```java
// Overload resolution (JLS §15.12):
// Phase 1: Exact match (no boxing, no varargs)
// Phase 2: Allow boxing/unboxing (no varargs)
// Phase 3: Allow varargs

public void process(int x) { }        // (1)
public void process(long x) { }       // (2)
public void process(Integer x) { }    // (3)
public void process(Object x) { }     // (4)
public void process(int... x) { }     // (5)

process(42);
// Phase 1: (1) exact match int → CHỌN (1)
// Nếu không có (1): (2) widening int→long
// Nếu không có (1)(2): Phase 2 → (3) boxing int→Integer
// Nếu không có (1)(2)(3): (4) boxing + widening int→Integer→Object
// Nếu không có (1)(2)(3)(4): Phase 3 → (5) varargs

// TRAP: Ambiguous overloads
public void ambiguous(int x, long y) { }
public void ambiguous(long x, int y) { }
// ambiguous(1, 1);  // Compile error: ambiguous!

// TRAP: null argument
public void test(String s) { }
public void test(Object o) { }
// test(null);  // Chọn test(String) — most specific type

public void test(String s) { }
public void test(Integer i) { }
// test(null);  // Compile error: ambiguous! String và Integer không có subtype relationship

// TRAP: Autoboxing + widening
public void calc(long x) { }
public void calc(Integer x) { }
calc(42);  // Chọn calc(long) — widening ưu tiên hơn boxing (Phase 1 trước Phase 2)
```

---

## Keyword: Recursion — Stack & Optimization

**Định nghĩa:** Method gọi chính nó — mỗi call tạo stack frame mới, có thể StackOverflowError.

```java
// Mỗi recursive call = 1 stack frame (~256-1024 bytes)
// Default stack size: -Xss512k (platform dependent)
// → ~1000-5000 recursive calls trước khi StackOverflowError

// Tail recursion — Java KHÔNG optimize (khác Scala, Kotlin)
// ❌ Java không có tail call optimization
public long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);  // Tail position, nhưng JVM không optimize
}
// factorial(100000) → StackOverflowError

// ✅ Convert sang iteration
public long factorialIterative(int n) {
    long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// ✅ Trampoline pattern — simulate tail call optimization
@FunctionalInterface
interface Trampoline<T> {
    Trampoline<T> apply();

    default boolean isComplete() { return false; }
    default T result() { throw new UnsupportedOperationException(); }

    static <T> Trampoline<T> done(T value) {
        return new Trampoline<T>() {
            public Trampoline<T> apply() { return this; }
            public boolean isComplete() { return true; }
            public T result() { return value; }
        };
    }

    default T execute() {
        Trampoline<T> current = this;
        while (!current.isComplete()) {
            current = current.apply();
        }
        return current.result();
    }
}

// Memoization — cache kết quả recursive calls
private Map<Integer, Long> cache = new HashMap<>();
public long fibonacci(int n) {
    if (n <= 1) return n;
    return cache.computeIfAbsent(n, k -> fibonacci(k - 1) + fibonacci(k - 2));
}
// O(n) thay vì O(2^n)
```

---

## Keyword: Method Design Principles

**Định nghĩa:** Nguyên tắc thiết kế method cho code sạch, dễ bảo trì.

```java
// 1. Single Responsibility — mỗi method làm 1 việc
// ❌
public void processOrder(Order order) {
    validateOrder(order);
    calculateTotal(order);
    applyDiscount(order);
    saveToDatabase(order);
    sendEmail(order);
    updateInventory(order);
}
// ✅ Tách thành orchestrator + small methods

// 2. Command-Query Separation (CQS)
// Command: thay đổi state, return void
// Query: trả về data, không thay đổi state
// ❌ Vừa thay đổi vừa trả về
public boolean remove(String item) { }  // Removes AND returns success
// ✅ Tách riêng
public boolean contains(String item) { }  // Query
public void remove(String item) { }       // Command

// 3. Fail Fast — validate đầu vào ngay đầu method
public void transfer(Account from, Account to, BigDecimal amount) {
    Objects.requireNonNull(from, "from account");
    Objects.requireNonNull(to, "to account");
    if (amount.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException("Amount must be positive");
    }
    if (from.equals(to)) {
        throw new IllegalArgumentException("Cannot transfer to same account");
    }
    // Business logic sau validation
}

// 4. Return Optional thay vì null
// ❌
public User findById(Long id) { return null; }
// ✅
public Optional<User> findById(Long id) { return Optional.ofNullable(...); }

// 5. Limit parameters (max 3-4)
// ❌
public void createUser(String name, String email, int age, String phone,
                        String address, String city, String country) { }
// ✅ Parameter Object
public void createUser(CreateUserRequest request) { }

// 6. Method length — ideally < 20 lines
// Nếu method dài → tách thành private helper methods
// "Extract Method" là refactoring phổ biến nhất
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Method Invocation | 5 bytecode instructions | invokevirtual vs invokeinterface, JIT inlining |
| Pass-by-Value | Copy giá trị/reference | Defensive copying, immutable parameters |
| Varargs | T... tạo array tại call site | Heap pollution, @SafeVarargs, performance |
| Overloading Resolution | Compiler chọn method tại compile time | 3-phase resolution, ambiguity traps |
| Recursion | Method gọi chính nó | Stack depth, no TCO in Java, memoization |
| Method Design | Clean method principles | CQS, fail fast, Optional, parameter objects |
