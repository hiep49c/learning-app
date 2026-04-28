# Control Flow — Luồng Điều Khiển

## Tổng Quan

Luồng điều khiển xác định thứ tự thực thi câu lệnh. Ngoài cú pháp cơ bản, senior cần hiểu bytecode generation, branch prediction impact, và các patterns/anti-patterns liên quan.

---

## Keyword: if-else

**Định nghĩa:** Câu lệnh rẽ nhánh dựa trên điều kiện boolean.

**Deep dive — Performance & Patterns:**

```java
// Branch prediction — CPU dự đoán nhánh nào sẽ chạy
// Nhánh được chọn thường xuyên hơn → nhanh hơn (pipeline không bị flush)
// → Đặt case phổ biến nhất ở if, ít phổ biến ở else

// Anti-pattern: Deep nesting (Arrow anti-pattern)
// ❌
if (user != null) {
    if (user.isActive()) {
        if (user.hasPermission("admin")) {
            if (order != null) {
                processOrder(order);
            }
        }
    }
}

// ✅ Guard clauses — early return
if (user == null) return;
if (!user.isActive()) return;
if (!user.hasPermission("admin")) return;
if (order == null) return;
processOrder(order);

// ✅ Combine conditions
if (user == null || !user.isActive() || !user.hasPermission("admin") || order == null) {
    return;
}
processOrder(order);

// Anti-pattern: Boolean comparison
// ❌
if (isActive == true) { }
if (isActive == false) { }
// ✅
if (isActive) { }
if (!isActive) { }

// Anti-pattern: Redundant else after return
// ❌
if (condition) {
    return valueA;
} else {
    return valueB;
}
// ✅
if (condition) {
    return valueA;
}
return valueB;

// Conditional logic → Polymorphism (khi if-else chain dài)
// ❌ Mỗi lần thêm type → sửa method
double calculateArea(Shape shape) {
    if (shape instanceof Circle c) return Math.PI * c.radius() * c.radius();
    if (shape instanceof Rectangle r) return r.width() * r.height();
    throw new IllegalArgumentException("Unknown shape");
}
// ✅ Polymorphism — thêm type → thêm class, không sửa code cũ
// Hoặc sealed interface + switch expression (Java 21+)
```

---

## Keyword: switch & Switch Expressions

**Định nghĩa:** Rẽ nhánh nhiều hướng — Java 21 hoàn thiện với pattern matching, sealed types, và exhaustiveness checking.

**Evolution of switch qua các Java versions:**

```java
// Java 1-6: switch chỉ hỗ trợ int, byte, short, char
// Java 7: thêm String
// Java 14: switch expressions (preview → standard)
// Java 17: pattern matching for switch (preview)
// Java 21: pattern matching for switch (standard)

// Traditional switch — fall-through trap
int day = 2;
switch (day) {
    case 1:
        System.out.println("Monday");
        // QUÊN break → fall through sang case 2!
    case 2:
        System.out.println("Tuesday");
        break;
}
// Output: "Monday" rồi "Tuesday" — bug!

// Switch expression (Java 14+) — KHÔNG có fall-through
String dayName = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    case 4 -> "Thursday";
    case 5 -> "Friday";
    case 6, 7 -> "Weekend";
    default -> throw new IllegalArgumentException("Invalid day: " + day);
};

// Pattern matching switch (Java 21+)
// Kết hợp instanceof + cast + guard conditions
Object obj = getInput();
String result = switch (obj) {
    case null -> "null value";
    case Integer i when i < 0 -> "Negative: " + i;
    case Integer i -> "Integer: " + i;
    case String s when s.isBlank() -> "Blank string";
    case String s -> "String: " + s;
    case int[] arr -> "Array length: " + arr.length;
    default -> "Other: " + obj.getClass().getSimpleName();
};

// Exhaustiveness với sealed types — compiler đảm bảo cover hết
sealed interface Result permits Success, Failure, Pending {}
record Success(String data) implements Result {}
record Failure(Exception error) implements Result {}
record Pending(int progress) implements Result {}

String describe(Result r) {
    return switch (r) {
        case Success s -> "OK: " + s.data();
        case Failure f -> "Error: " + f.error().getMessage();
        case Pending p -> "Loading: " + p.progress() + "%";
        // Không cần default — compiler biết đã cover hết sealed types
    };
}

// yield trong switch expression block
int numLetters = switch (dayName) {
    case "Monday", "Friday", "Sunday" -> 6;
    case "Tuesday" -> 7;
    default -> {
        // Block code phức tạp
        String trimmed = dayName.trim();
        yield trimmed.length();  // yield thay cho return trong switch expression
    }
};
```

**JVM Implementation — switch bytecode:**

```java
// Compiler chọn giữa 2 bytecode instructions:
// 1. tableswitch — khi case values liên tục (O(1) lookup)
//    switch(x) { case 1: case 2: case 3: case 4: }
//    → Jump table: index trực tiếp

// 2. lookupswitch — khi case values rải rác (O(log n) binary search)
//    switch(x) { case 1: case 100: case 10000: }
//    → Sorted table + binary search

// String switch — compiler tạo 2-phase lookup:
// Phase 1: switch trên hashCode() (int)
// Phase 2: equals() check để xử lý hash collision
switch (str) {
    case "hello" -> { }  // Compiled to: if (str.hashCode() == "hello".hashCode() && str.equals("hello"))
    case "world" -> { }
}
// → String switch KHÔNG nhanh hơn if-else chain đáng kể
// → Nhưng code sạch hơn
```

---

## Keyword: for Loop & Enhanced for

**Định nghĩa:** Vòng lặp với nhiều biến thể — hiểu rõ iterator protocol và performance implications.

```java
// Enhanced for — syntactic sugar cho Iterator
for (String item : list) {
    System.out.println(item);
}
// Compiler desugar thành:
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String item = it.next();
    System.out.println(item);
}

// Với array — desugar thành index-based loop
for (int item : array) {
    System.out.println(item);
}
// Compiler desugar thành:
for (int i = 0; i < array.length; i++) {
    int item = array[i];
    System.out.println(item);
}

// ConcurrentModificationException — trap phổ biến
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
for (String item : list) {
    if (item.equals("b")) {
        list.remove(item);  // ConcurrentModificationException!
    }
}

// Fix 1: Iterator.remove()
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) {
        it.remove();  // Safe
    }
}

// Fix 2: removeIf (Java 8+)
list.removeIf(item -> item.equals("b"));

// Fix 3: Collect items to remove, then removeAll
List<String> toRemove = list.stream()
    .filter(item -> item.equals("b"))
    .toList();
list.removeAll(toRemove);

// Performance: ArrayList vs LinkedList iteration
// ArrayList: for-index O(1) per access, for-each O(1) per access → cả hai nhanh
// LinkedList: for-index O(n) per access → O(n²) total! for-each O(1) per access → O(n)
// → LUÔN dùng for-each hoặc iterator cho LinkedList

// Loop optimization — JIT compiler
// JIT có thể: unroll loops, hoist invariants, eliminate bounds checks
for (int i = 0; i < array.length; i++) {  // JIT hoist array.length
    array[i] = i * 2;  // JIT có thể eliminate bounds check
}

// Labeled loops — break/continue outer loop
outer:
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        if (matrix[i][j] == target) {
            result = new int[]{i, j};
            break outer;  // Thoát cả hai vòng
        }
    }
}
```

---

## Keyword: while & do-while

**Định nghĩa:** Vòng lặp dựa trên điều kiện — while kiểm tra trước, do-while kiểm tra sau.

```java
// Infinite loop patterns
// while (true) — phổ biến nhất
while (true) {
    String input = readInput();
    if ("quit".equals(input)) break;  // "quit".equals() tránh NPE
    process(input);
}

// for (;;) — tương đương, ít phổ biến hơn
for (;;) {
    if (shouldStop()) break;
}

// Busy-wait anti-pattern
// ❌ CPU 100%, waste resources
while (!isReady()) {
    // Spin — tiêu tốn CPU
}

// ✅ Dùng wait/notify hoặc blocking operations
synchronized (lock) {
    while (!isReady()) {
        lock.wait();  // Release lock, sleep until notified
    }
}

// ✅ Hoặc dùng CountDownLatch, CompletableFuture, BlockingQueue

// do-while — đảm bảo chạy ít nhất 1 lần
// Use case: input validation, retry logic
int attempts = 0;
boolean success;
do {
    success = tryOperation();
    attempts++;
} while (!success && attempts < MAX_RETRIES);

// Retry with exponential backoff
int delay = 100;  // ms
do {
    try {
        result = callExternalService();
        break;
    } catch (TransientException e) {
        Thread.sleep(delay);
        delay = Math.min(delay * 2, MAX_DELAY);  // Exponential backoff
        attempts++;
    }
} while (attempts < MAX_RETRIES);
```

---

## Keyword: break, continue, return

**Định nghĩa:** Câu lệnh điều khiển luồng trong vòng lặp — break thoát, continue bỏ qua, return thoát method.

```java
// break chỉ thoát vòng lặp/switch GẦN NHẤT
// Labeled break thoát vòng lặp được đặt tên

// continue chỉ bỏ qua iteration HIỆN TẠI của vòng lặp GẦN NHẤT
// Labeled continue bỏ qua iteration của vòng lặp được đặt tên

// return trong finally — TRAP!
public int getValue() {
    try {
        return 1;
    } finally {
        return 2;  // ⚠️ Override return value! Method trả về 2
        // Compiler warning: "finally block does not complete normally"
    }
}

// return trong try-with-resources
public String readFile() {
    try (var reader = new BufferedReader(new FileReader("f"))) {
        return reader.readLine();  // reader vẫn được close sau return
    }
}

// Unreachable code — compiler detect
public void method() {
    return;
    // System.out.println("hello");  // Compile error: unreachable statement
}

// Nhưng compiler KHÔNG detect tất cả unreachable code
public void method() {
    if (true) return;
    System.out.println("hello");  // Compiler cho phép! (dù thực tế unreachable)
    // Vì compiler chỉ check constant expressions, không evaluate conditions
}

while (false) {
    // System.out.println("hello");  // Compile error: unreachable
}

if (false) {
    System.out.println("hello");  // OK! if(false) được đặc biệt cho phép
    // Đây là "conditional compilation" pattern trong Java
    // Dùng cho debug code: if (DEBUG) { ... }
}
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| if-else | Rẽ nhánh boolean | Guard clauses, arrow anti-pattern, → polymorphism |
| switch | Rẽ nhánh nhiều hướng | Pattern matching (Java 21), tableswitch vs lookupswitch |
| for & enhanced for | Vòng lặp | Iterator protocol, ConcurrentModificationException, LinkedList O(n²) |
| while & do-while | Vòng lặp điều kiện | Busy-wait anti-pattern, retry with backoff |
| break/continue/return | Điều khiển luồng | Labeled break, return in finally trap, unreachable code rules |
