# Variables & Data Types — Biến và Kiểu Dữ Liệu

## Tổng Quan

Java là ngôn ngữ **statically typed, strongly typed** — mọi biến phải khai báo kiểu tại compile time và không tự động chuyển đổi giữa các kiểu không tương thích. Hiểu sâu về cách JVM lưu trữ, quản lý bộ nhớ, và xử lý kiểu dữ liệu là nền tảng để viết code hiệu quả và debug các vấn đề phức tạp.

---

## Keyword: Variable

**Định nghĩa:** Vùng nhớ được đặt tên dùng để lưu trữ giá trị trong chương trình.

**Giải thích chi tiết:**

Biến trong Java có 3 thành phần: kiểu dữ liệu, tên biến, và giá trị. Khi khai báo biến, JVM cấp phát vùng nhớ tương ứng với kiểu dữ liệu.

**Phân loại biến theo scope và lifetime:**

| Loại | Khai báo ở đâu | Lưu ở đâu | Lifetime | Giá trị mặc định |
|------|----------------|-----------|----------|-------------------|
| Local variable | Trong method/block | Stack frame | Khi method kết thúc | Không có — phải khởi tạo |
| Instance variable (field) | Trong class, ngoài method | Heap (trong object) | Khi object bị GC | Có (0, null, false) |
| Static variable (class variable) | Với từ khóa `static` | Metaspace (Java 8+) | Khi class bị unload | Có (0, null, false) |
| Parameter | Trong method signature | Stack frame | Khi method kết thúc | Giá trị truyền vào |

```java
public class VariableLifecycle {
    // Static variable — load cùng class vào Metaspace
    // Tồn tại suốt đời ứng dụng (trừ khi ClassLoader bị GC)
    private static int instanceCount = 0;

    // Instance variable — tạo trên Heap khi new object
    // GC thu hồi khi không còn reference nào trỏ đến object
    private String name;
    private int[] scores;  // Reference trên heap, mảng cũng trên heap

    public void process() {
        // Local variable — tạo trên Stack frame của method này
        // PHẢI khởi tạo trước khi dùng — compiler enforce
        int count = 0;

        // Local variable reference — reference trên stack, object trên heap
        List<String> items = new ArrayList<>();

        // Sau khi method kết thúc:
        // - count bị pop khỏi stack
        // - items reference bị pop, ArrayList trên heap chờ GC
    }
}
```

**Deep dive — Stack vs Heap:**

```
Stack (mỗi thread có riêng)          Heap (shared giữa tất cả threads)
┌─────────────────────┐              ┌──────────────────────────┐
│ process() frame     │              │                          │
│  count = 0          │              │  ┌──────────────────┐   │
│  items = ref ───────┼──────────────┼─▶│ ArrayList object  │   │
├─────────────────────┤              │  └──────────────────┘   │
│ main() frame        │              │                          │
│  obj = ref ─────────┼──────────────┼─▶┌──────────────────┐   │
│                     │              │  │ VariableLifecycle │   │
└─────────────────────┘              │  │  name = ref ──────┼──▶│"Hello"│
                                     │  │  scores = ref ────┼──▶│[1,2,3]│
                                     │  └──────────────────┘   │
                                     └──────────────────────────┘
```

**Lưu ý cho Senior:**
- Local variables KHÔNG có giá trị mặc định — đây là design decision của Java để tránh bugs. Compiler bắt lỗi "variable might not have been initialized".
- Instance variables CÓ giá trị mặc định vì JVM zero-fill memory khi allocate object trên heap.
- `final` local variable có thể được khởi tạo sau khi khai báo (deferred initialization), miễn là chỉ gán 1 lần và compiler chứng minh được.

```java
final int result;
if (condition) {
    result = 1;  // OK — definite assignment
} else {
    result = 2;  // OK — mỗi nhánh gán đúng 1 lần
}
// result đã được gán chắc chắn → dùng được
```

---

## Keyword: Primitive Types

**Định nghĩa:** 8 kiểu dữ liệu nguyên thủy được JVM hỗ trợ trực tiếp, lưu giá trị trên stack (local) hoặc inline trong object (field).

**Giải thích chi tiết:**

| Kiểu | Bytes | Phạm vi | JVM Internal | Mặc định |
|-------|-------|---------|-------------|----------|
| `byte` | 1 | -128 → 127 | Stored as int trên stack | 0 |
| `short` | 2 | -32,768 → 32,767 | Stored as int trên stack | 0 |
| `int` | 4 | -2³¹ → 2³¹-1 (~±2.1 tỷ) | 32-bit integer | 0 |
| `long` | 8 | -2⁶³ → 2⁶³-1 | 64-bit integer | 0L |
| `float` | 4 | ±3.4E38 (6-7 chữ số có nghĩa) | IEEE 754 single | 0.0f |
| `double` | 8 | ±1.7E308 (15-16 chữ số có nghĩa) | IEEE 754 double | 0.0d |
| `char` | 2 | 0 → 65,535 (UTF-16 code unit) | Unsigned 16-bit | '\u0000' |
| `boolean` | JVM-dependent | true/false | int (0 or 1) trên stack | false |

**JVM Internals — điều senior cần biết:**

```java
// 1. byte, short, char đều được promote thành int trên JVM stack
// JVM bytecode KHÔNG có iadd cho byte — chỉ có iadd (int add)
byte a = 10, b = 20;
// byte c = a + b;  // COMPILE ERROR! a + b trả về int
byte c = (byte)(a + b);  // Phải cast tường minh

// 2. boolean không có kích thước cố định trong JVM spec
// - Trong local variable: stored as int (4 bytes)
// - Trong boolean[]: mỗi element 1 byte
// - Trong object field: JVM implementation dependent (thường 1 byte, có padding)

// 3. long và double KHÔNG atomic trên 32-bit JVM
// JLS §17.7: "non-atomic treatment of double and long"
// Trên 32-bit JVM, ghi long/double = 2 operations (high 32 bits + low 32 bits)
// → Race condition nếu không synchronized hoặc volatile
private volatile long timestamp;  // volatile đảm bảo atomic read/write

// 4. Floating-point precision — KHÔNG dùng cho tiền tệ
System.out.println(0.1 + 0.2);           // 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);    // false!

// IEEE 754: 0.1 trong binary = 0.0001100110011... (lặp vô hạn)
// → Luôn có sai số biểu diễn

// Dùng BigDecimal cho tiền tệ
BigDecimal price = new BigDecimal("19.99");  // String constructor — chính xác
BigDecimal tax = price.multiply(new BigDecimal("0.1"));
// KHÔNG dùng: new BigDecimal(0.1) — vẫn bị precision loss!

// 5. char là UTF-16 code unit, KHÔNG phải Unicode code point
// Emoji và ký tự ngoài BMP cần 2 chars (surrogate pair)
String emoji = "😀";
emoji.length();        // 2 (2 UTF-16 code units)
emoji.codePointCount(0, emoji.length());  // 1 (1 code point)
emoji.charAt(0);       // '\uD83D' (high surrogate)
emoji.charAt(1);       // '\uDE00' (low surrogate)
```

**Overflow behavior:**

```java
// Integer overflow — KHÔNG throw exception, wrap around silently
int max = Integer.MAX_VALUE;  // 2147483647
int overflow = max + 1;       // -2147483648 (wrap to MIN_VALUE)

// Đây là nguồn gốc nhiều security vulnerabilities
// Ví dụ: kiểm tra array size
int size = Integer.MAX_VALUE;
int newSize = size + 1;  // Negative! → ArrayNegativeSizeException hoặc tệ hơn

// Java 8+ — Math.addExact() throw ArithmeticException khi overflow
int safe = Math.addExact(Integer.MAX_VALUE, 1);  // ArithmeticException!
long safeLong = Math.multiplyExact(1_000_000, 1_000_000);  // OK: 1_000_000_000_000L

// Unsigned operations (Java 8+)
int unsigned = Integer.parseUnsignedInt("4294967295");  // Max unsigned int
int compare = Integer.compareUnsigned(-1, 1);  // -1 as unsigned > 1
long asUnsigned = Integer.toUnsignedLong(-1);  // 4294967295L
```

---

## Keyword: Reference Types

**Định nghĩa:** Kiểu dữ liệu lưu reference (con trỏ) đến object trên heap — bao gồm classes, interfaces, arrays, enums, records, annotations.

**Giải thích chi tiết — Memory Layout:**

```java
// Reference size phụ thuộc JVM:
// - 32-bit JVM: 4 bytes
// - 64-bit JVM: 8 bytes (hoặc 4 bytes với CompressedOops, mặc định cho heap < 32GB)

// Object header trên heap (64-bit JVM với CompressedOops):
// ┌──────────────────────────────────────┐
// │ Mark Word (8 bytes)                  │ ← hashCode, GC age, lock info
// │ Class Pointer (4 bytes compressed)   │ ← trỏ đến class metadata
// │ [Array Length (4 bytes) — nếu array] │
// │ Instance Fields (aligned)            │ ← dữ liệu thực
// │ Padding (to 8-byte boundary)         │
// └──────────────────────────────────────┘

// Ví dụ: Object rỗng = 16 bytes (header + padding)
// Integer object = 16 bytes (header 12 + int 4)
// int primitive = 4 bytes
// → Integer tốn gấp 4 lần int!
```

**Null reference — billion dollar mistake:**

```java
// null là giá trị đặc biệt: reference không trỏ đến object nào
String name = null;
// name.length();  // NullPointerException tại runtime

// Java 14+ — Helpful NullPointerExceptions
// Trước: "NullPointerException" (không biết biến nào null)
// Sau: "Cannot invoke String.length() because 'name' is null"

// Defensive patterns:
// 1. Objects.requireNonNull — fail fast
public void setName(String name) {
    this.name = Objects.requireNonNull(name, "name must not be null");
}

// 2. Optional — explicit nullable
public Optional<User> findById(Long id) {
    return Optional.ofNullable(userMap.get(id));
}

// 3. @Nullable / @NonNull annotations (JSR 305, JetBrains, Spring)
public void process(@NonNull String input, @Nullable String optional) { }

// 4. Pattern: Null Object
public interface Logger {
    void log(String message);
    Logger NULL = message -> {};  // No-op implementation
}
```

**Pass-by-value — Java LUÔN pass-by-value:**

```java
// Primitive: copy giá trị
void change(int x) { x = 100; }
int a = 5;
change(a);  // a vẫn = 5

// Reference: copy reference (địa chỉ), KHÔNG copy object
void modify(List<String> list) {
    list.add("new");        // Thay đổi object gốc qua reference copy ✓
    list = new ArrayList<>();  // Chỉ thay đổi local copy của reference ✗
}

// Chứng minh: swap KHÔNG hoạt động
void swap(Object a, Object b) {
    Object temp = a;
    a = b;      // Chỉ swap local copies
    b = temp;   // Object gốc không đổi
}
```

---

## Keyword: Type Casting & Promotion

**Định nghĩa:** Chuyển đổi giá trị giữa các kiểu dữ liệu — có rules phức tạp mà senior cần nắm.

**Numeric Promotion Rules (JLS §5.6):**

```java
// Rule 1: Unary numeric promotion
// byte, short, char → int khi dùng với unary operator
byte b = 10;
// byte neg = -b;  // ERROR! -b trả về int
int neg = -b;      // OK

// Rule 2: Binary numeric promotion
// Khi 2 operands khác kiểu → promote lên kiểu lớn hơn
// Thứ tự: byte/short/char → int → long → float → double
int i = 10;
long l = 20L;
// int result = i + l;  // ERROR! i + l trả về long
long result = i + l;    // OK

float f = 1.5f;
double d = 2.5;
double result2 = f + d;  // float + double → double

// TRAP: integer division
int a = 7, b = 2;
double wrong = a / b;        // 3.0 (int / int = int, rồi mới cast)
double right = (double) a / b;  // 3.5 (cast trước khi chia)
double right2 = a / (double) b; // 3.5
double right3 = a * 1.0 / b;    // 3.5

// Rule 3: Compound assignment tự động cast
byte x = 10;
x += 5;    // OK — tương đương x = (byte)(x + 5)
// x = x + 5;  // ERROR! x + 5 trả về int

// Rule 4: Ternary operator promotion
// Cả hai nhánh phải cùng kiểu (hoặc promote được)
int i = 10;
double d = 20.0;
// int result = condition ? i : d;  // ERROR! result type = double
double result = condition ? i : d;  // OK — i promote thành double
```

**Narrowing — data loss scenarios:**

```java
// Narrowing có thể mất dữ liệu — compiler KHÔNG cảnh báo khi cast tường minh
int big = 130;
byte small = (byte) big;  // -126 (overflow: 130 - 256 = -126)

long huge = 123456789012345L;
int truncated = (int) huge;  // -2045911175 (mất 32 bits cao)

double precise = 1.9999999;
int rounded = (int) precise;  // 1 (truncate, KHÔNG round)

// float → int: NaN và Infinity
float nan = Float.NaN;
int fromNan = (int) nan;  // 0

float inf = Float.POSITIVE_INFINITY;
int fromInf = (int) inf;  // Integer.MAX_VALUE

float negInf = Float.NEGATIVE_INFINITY;
int fromNegInf = (int) negInf;  // Integer.MIN_VALUE
```

---

## Keyword: Wrapper Classes & Autoboxing

**Định nghĩa:** Classes bọc primitive thành objects — cần thiết cho Collections, generics, và nullable values.

**Integer Cache — performance trap phổ biến:**

```java
// JVM cache Integer objects cho giá trị -128 → 127 (JLS §5.1.7)
Integer a = 127;
Integer b = 127;
System.out.println(a == b);  // true — cùng cached object

Integer c = 128;
Integer d = 128;
System.out.println(c == d);  // false — khác object!
System.out.println(c.equals(d));  // true — so sánh giá trị

// Cache range có thể mở rộng bằng JVM flag:
// -XX:AutoBoxCacheMax=1000

// Tương tự cho: Byte, Short, Long (-128→127), Character (0→127)
// Boolean: TRUE và FALSE luôn cached

// LUÔN dùng .equals() để so sánh wrapper objects
// == chỉ so sánh reference, không so sánh giá trị
```

**Autoboxing/Unboxing pitfalls:**

```java
// 1. NullPointerException khi unboxing null
Integer nullInt = null;
int value = nullInt;  // NullPointerException! (unboxing null)

// 2. Performance — autoboxing trong loop tạo garbage
long sum = 0L;
for (long i = 0; i < 1_000_000; i++) {
    sum += i;  // OK — primitive
}

Long sum2 = 0L;  // Wrapper!
for (long i = 0; i < 1_000_000; i++) {
    sum2 += i;  // Mỗi lần tạo Long object mới → GC pressure
}
// sum2 version chậm hơn ~5-10x

// 3. == vs equals confusion trong mixed comparisons
Integer x = 0;
// if (x == null || x == 0) { }  // x == 0 unbox x → NPE nếu null!
if (x == null || x.intValue() == 0) { }  // Safe
if (x == null || x.equals(0)) { }        // Safe

// 4. Ternary operator autoboxing trap
Integer a = 1;
Integer b = 2;
Integer c = null;
// Integer result = true ? a : c;  // OK — cả hai là Integer
int result = true ? a : c;  // NPE! Compiler unbox cả hai vì result là int
```

**Memory comparison:**

```java
// int: 4 bytes
// Integer: 16 bytes (12 header + 4 int value)
// int[1000]: ~4KB
// Integer[1000]: ~20KB (16KB objects + 4KB references)
// ArrayList<Integer> with 1000 elements: ~20KB + ArrayList overhead

// → Dùng primitive arrays khi performance matters
// → Dùng IntStream, LongStream, DoubleStream thay vì Stream<Integer>
IntStream.range(0, 1000).sum();  // Không autoboxing
```

---

## Keyword: var (Local Variable Type Inference)

**Định nghĩa:** Từ khóa `var` (Java 10+) cho phép compiler suy luận kiểu — giảm boilerplate nhưng cần dùng đúng cách.

```java
// Khi NÊN dùng var — kiểu rõ ràng từ vế phải
var list = new ArrayList<String>();           // Rõ ràng: ArrayList<String>
var stream = list.stream();                   // Rõ ràng: Stream<String>
var entry = Map.entry("key", 42);             // Rõ ràng: Map.Entry<String, Integer>
var reader = new BufferedReader(new FileReader("f"));  // Rõ ràng

// Khi KHÔNG NÊN dùng var — kiểu không rõ ràng
var result = service.process();  // process() trả về gì? Phải đọc source
var data = getData();            // Kiểu gì? Không biết
var x = condition ? foo() : bar();  // Kiểu phụ thuộc logic phức tạp

// var KHÔNG dùng được cho:
// - Fields (instance/static variables)
// - Method parameters
// - Method return types
// - Khai báo không có initializer: var x;
// - null initializer: var x = null;
// - Array initializer: var x = {1, 2, 3};
// - Lambda: var f = () -> {};  // Không suy luận được functional interface nào

// var với diamond operator — cẩn thận
var list = new ArrayList<>();  // ArrayList<Object>! Không phải ArrayList<String>
var list = new ArrayList<String>();  // Phải chỉ định type argument

// var trong lambda parameters (Java 11+)
// Hữu ích khi cần annotation trên lambda parameter
list.stream()
    .filter((@NonNull var s) -> s.length() > 3)
    .toList();
```

---

## Keyword: final

**Định nghĩa:** Modifier đánh dấu biến không thể gán lại — nhưng KHÔNG có nghĩa là immutable.

```java
// final primitive — thực sự constant
final int MAX = 100;
// MAX = 200;  // Compile error

// final reference — reference không đổi, object CÓ THỂ thay đổi
final List<String> names = new ArrayList<>();
names.add("Java");     // OK — thay đổi nội dung object
names.clear();         // OK — thay đổi nội dung object
// names = new ArrayList<>();  // Compile error — không thể gán lại reference

// final field — phải khởi tạo trước khi constructor kết thúc
public class Config {
    private final String name;
    private final int timeout;

    // Cách 1: Inline initialization
    private final String version = "1.0";

    // Cách 2: Constructor initialization
    public Config(String name, int timeout) {
        this.name = name;
        this.timeout = timeout;
    }

    // Cách 3: Instance initializer block
    private final List<String> defaults;
    {
        defaults = List.of("a", "b", "c");
    }
}

// final và JMM (Java Memory Model)
// final fields có đặc biệt trong JMM:
// - Đảm bảo visibility: sau khi constructor kết thúc,
//   tất cả threads thấy giá trị đúng của final fields
// - KHÔNG cần volatile hay synchronized cho final fields
// - Điều kiện: object reference không được "escape" trong constructor

public class SafePublication {
    private final Map<String, String> config;

    public SafePublication() {
        config = Map.of("key", "value");
        // KHÔNG được publish 'this' trước khi constructor kết thúc
        // registry.register(this);  // UNSAFE! final guarantee bị phá vỡ
    }
}

// Effectively final (Java 8+)
// Biến local không đánh dấu final nhưng không bao giờ gán lại
// → Có thể dùng trong lambda và anonymous class
String prefix = "Hello";  // Effectively final
list.forEach(item -> System.out.println(prefix + " " + item));  // OK

// prefix = "Hi";  // Nếu uncomment → không còn effectively final
// → Lambda ở trên sẽ compile error
```

---

## Keyword: String Interning & Memory

**Định nghĩa:** Cơ chế JVM tối ưu bộ nhớ cho String literals bằng String Pool.

```java
// String Pool nằm trong Heap (Java 7+, trước đó trong PermGen)
// Mọi String literal tự động được intern

String s1 = "Hello";           // Tạo trong String Pool
String s2 = "Hello";           // Tái sử dụng từ Pool
String s3 = new String("Hello");  // Tạo object MỚI trên heap (ngoài pool)
String s4 = s3.intern();       // Trả về reference từ Pool

System.out.println(s1 == s2);  // true — cùng pool reference
System.out.println(s1 == s3);  // false — s3 ngoài pool
System.out.println(s1 == s4);  // true — intern() trả về pool reference

// Compile-time constant folding
String a = "Hello" + " " + "World";  // Compiler gộp thành "Hello World"
String b = "Hello World";
System.out.println(a == b);  // true — cùng literal

// Runtime concatenation — KHÔNG intern
String name = "World";
String c = "Hello " + name;  // Runtime concat → object mới
System.out.println(b == c);  // false

// final String → compile-time constant
final String NAME = "World";
String d = "Hello " + NAME;  // Compiler gộp vì NAME là constant
System.out.println(b == d);  // true!

// String Pool size tuning
// -XX:StringTableSize=60013 (default, prime number)
// Tăng nếu ứng dụng có nhiều unique strings
```

---

## Keyword: Numeric Literals

**Định nghĩa:** Các cách biểu diễn giá trị số trong source code — bao gồm các hệ cơ số và underscore separator.

```java
// Underscore separator (Java 7+) — dễ đọc số lớn
int million = 1_000_000;
long creditCard = 1234_5678_9012_3456L;
double pi = 3.14_15_92_65;
int binary = 0b1010_1100;
int hex = 0xFF_EC_DE_5E;

// Hệ cơ số
int decimal = 255;
int hex = 0xFF;        // Hexadecimal (prefix 0x)
int octal = 0377;      // Octal (prefix 0) — CẢNH BÁO: dễ nhầm!
int binary = 0b11111111;  // Binary (prefix 0b, Java 7+)

// TRAP: Octal literal
int x = 010;  // 8 (octal), KHÔNG phải 10!
// Đây là nguồn bug phổ biến khi format số có leading zeros

// Literal suffixes
long l = 123L;     // L hoặc l (dùng L để tránh nhầm với 1)
float f = 1.5f;    // f hoặc F
double d = 1.5d;   // d hoặc D (mặc định cho floating-point literal)

// Scientific notation
double avogadro = 6.022e23;   // 6.022 × 10²³
double planck = 6.626e-34;    // 6.626 × 10⁻³⁴

// Special floating-point values
double posInf = Double.POSITIVE_INFINITY;  // 1.0 / 0.0
double negInf = Double.NEGATIVE_INFINITY;  // -1.0 / 0.0
double nan = Double.NaN;                   // 0.0 / 0.0

// NaN behavior — KHÔNG bằng bất kỳ giá trị nào, kể cả chính nó
System.out.println(nan == nan);           // false!
System.out.println(Double.isNaN(nan));    // true — cách đúng để check
System.out.println(nan != nan);           // true — cách khác để check

// Infinity behavior
System.out.println(posInf + 1);           // Infinity
System.out.println(posInf + negInf);      // NaN
System.out.println(posInf * 0);           // NaN
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Variable | Vùng nhớ đặt tên lưu giá trị | Stack vs Heap, lifetime, scope |
| Primitive Types | 8 kiểu cơ bản: byte→double, char, boolean | JVM promotion, overflow, IEEE 754 |
| Reference Types | Lưu address đến object trên heap | Object header, memory layout, null safety |
| Type Casting | Chuyển đổi kiểu: widening/narrowing | Promotion rules, data loss, NaN/Infinity |
| Wrapper Classes | Primitive → Object: Integer, Long... | Cache range, autoboxing NPE, memory cost |
| var | Type inference cho local variables (Java 10+) | Khi nên/không nên dùng, diamond operator trap |
| final | Biến không gán lại | JMM guarantee, effectively final, ≠ immutable |
