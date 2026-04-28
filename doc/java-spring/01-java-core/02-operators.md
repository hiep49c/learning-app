# Operators — Toán Tử

## Tổng Quan

Toán tử trong Java không chỉ là phép tính đơn giản — chúng liên quan đến numeric promotion, evaluation order, short-circuit behavior, và nhiều edge cases mà senior developer cần nắm vững để tránh bugs tinh vi.

---

## Keyword: Arithmetic Operators

**Định nghĩa:** Toán tử thực hiện phép tính số học: `+`, `-`, `*`, `/`, `%`, `++`, `--`.

**Deep dive — Integer Division & Overflow:**

```java
// Integer division truncates toward zero (KHÔNG phải floor)
System.out.println(7 / 2);     // 3
System.out.println(-7 / 2);    // -3 (truncate toward zero)
Math.floorDiv(-7, 2);          // -4 (floor division — Java 8+)

// Modulo behavior với số âm
System.out.println(7 % 2);     // 1
System.out.println(-7 % 2);    // -1 (dấu theo dividend)
Math.floorMod(-7, 2);          // 1 (luôn dương — Java 8+)

// Division by zero
// int / 0 → ArithmeticException
// double / 0.0 → Infinity (KHÔNG exception!)
System.out.println(1 / 0);     // ArithmeticException
System.out.println(1.0 / 0.0); // Infinity
System.out.println(0.0 / 0.0); // NaN

// Overflow — silent wrap-around, KHÔNG exception
int max = Integer.MAX_VALUE;    // 2147483647
System.out.println(max + 1);   // -2147483648 (MIN_VALUE)
System.out.println(max * 2);   // -2

// Safe arithmetic (Java 8+)
Math.addExact(max, 1);         // ArithmeticException
Math.multiplyExact(max, 2);    // ArithmeticException
Math.incrementExact(max);      // ArithmeticException
Math.negateExact(Integer.MIN_VALUE);  // ArithmeticException (vì |MIN| > MAX)

// Pre-increment vs Post-increment — evaluation order matters
int i = 5;
int a = i++ + i++;  // a = 5 + 6 = 11, i = 7
// Step: i=5, first i++ returns 5 (i becomes 6)
//       i=6, second i++ returns 6 (i becomes 7)

int j = 5;
int b = ++j + ++j;  // b = 6 + 7 = 13, j = 7

// TRAP: i = i++
int x = 5;
x = x++;  // x = 5! (NOT 6)
// Step: temp = x (5), x = x + 1 (6), x = temp (5)
// JVM bytecode: iload, iinc, istore — store overwrites increment
```

**String concatenation operator `+`:**

```java
// + với String triggers string concatenation
System.out.println("a" + 1 + 2);   // "a12" (left-to-right: "a"+1="a1", "a1"+2="a12")
System.out.println(1 + 2 + "a");   // "3a" (left-to-right: 1+2=3, 3+"a"="3a")
System.out.println("a" + (1 + 2)); // "a3" (parentheses first)

// JVM optimization (Java 9+): invokedynamic cho string concat
// Trước Java 9: compiler tạo StringBuilder
// Java 9+: JVM tự chọn strategy tối ưu nhất tại runtime
// → Không cần tự dùng StringBuilder cho simple concatenation

// Nhưng VẪN cần StringBuilder trong loop
String result = "";
for (int i = 0; i < 10000; i++) {
    result += i;  // O(n²) — mỗi lần tạo String mới
}

StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i);  // O(n) — append vào buffer
}
```

---

## Keyword: Comparison Operators & Equality

**Định nghĩa:** Toán tử so sánh: `==`, `!=`, `>`, `<`, `>=`, `<=` — với nhiều pitfalls cho reference types.

**`==` vs `.equals()` — nguồn gốc vô số bugs:**

```java
// == cho primitives: so sánh giá trị ✓
int a = 5, b = 5;
System.out.println(a == b);  // true

// == cho references: so sánh IDENTITY (cùng object?), KHÔNG phải equality
String s1 = new String("hello");
String s2 = new String("hello");
System.out.println(s1 == s2);      // false — khác object
System.out.println(s1.equals(s2)); // true — cùng nội dung

// String literal pool — đặc biệt
String s3 = "hello";
String s4 = "hello";
System.out.println(s3 == s4);  // true — cùng pool reference (NHƯNG ĐỪNG DỰA VÀO ĐIỀU NÀY)

// Integer cache trap
Integer x = 127, y = 127;
System.out.println(x == y);  // true — cached

Integer a2 = 128, b2 = 128;
System.out.println(a2 == b2);  // false — ngoài cache range!

// equals() contract (JLS §Object.equals):
// 1. Reflexive: x.equals(x) == true
// 2. Symmetric: x.equals(y) == y.equals(x)
// 3. Transitive: x.equals(y) && y.equals(z) → x.equals(z)
// 4. Consistent: multiple calls return same result
// 5. x.equals(null) == false

// Implementing equals correctly
@Override
public boolean equals(Object obj) {
    if (this == obj) return true;                    // Identity check
    if (obj == null || getClass() != obj.getClass()) return false;  // Type check
    // KHÔNG dùng instanceof nếu class có thể bị extend
    // vì instanceof vi phạm symmetry: subclass.equals(superclass) ≠ superclass.equals(subclass)
    MyClass other = (MyClass) obj;
    return Objects.equals(this.field1, other.field1)
        && this.field2 == other.field2;
}

// LUÔN override hashCode() khi override equals()
// Contract: a.equals(b) → a.hashCode() == b.hashCode()
// Vi phạm → HashMap, HashSet hoạt động sai
@Override
public int hashCode() {
    return Objects.hash(field1, field2);
}
```

**Floating-point comparison:**

```java
// KHÔNG dùng == cho floating-point
System.out.println(0.1 + 0.2 == 0.3);  // false!

// Dùng epsilon comparison
private static final double EPSILON = 1e-10;
boolean equal = Math.abs(a - b) < EPSILON;

// Hoặc dùng Double.compare() (xử lý NaN và -0.0 đúng)
Double.compare(a, b) == 0;

// -0.0 vs +0.0
System.out.println(0.0 == -0.0);           // true (== coi bằng nhau)
System.out.println(Double.compare(0.0, -0.0));  // 1 (compare phân biệt)
System.out.println(new Double(0.0).equals(-0.0));  // false (equals phân biệt)

// NaN
System.out.println(Double.NaN == Double.NaN);       // false
System.out.println(Double.compare(Double.NaN, Double.NaN));  // 0 (compare coi bằng)
```

---

## Keyword: Logical Operators & Short-Circuit

**Định nghĩa:** `&&`, `||` (short-circuit) vs `&`, `|` (non-short-circuit) — khác biệt quan trọng.

```java
// Short-circuit: && dừng khi gặp false, || dừng khi gặp true
// → Vế phải CÓ THỂ KHÔNG được evaluate

// Pattern: null-safe check
String name = null;
if (name != null && name.length() > 0) { }  // Safe — name.length() không chạy
if (name != null & name.length() > 0) { }   // NPE! & luôn evaluate cả hai vế

// Side effects bị skip
int i = 0;
boolean result = false && (++i > 0);  // i vẫn = 0! ++i không chạy
boolean result2 = true || (++i > 0);  // i vẫn = 0! ++i không chạy

// Non-short-circuit: & | luôn evaluate cả hai vế
// Dùng khi CẦN side effects ở cả hai vế (hiếm khi cần)
boolean valid = validateA() & validateB();  // Cả hai luôn chạy

// Bitwise vs Logical — cùng ký hiệu, khác ngữ cảnh
// & | ^ dùng cho boolean → logical (non-short-circuit)
// & | ^ dùng cho int/long → bitwise
boolean a = true & false;   // Logical AND (non-short-circuit)
int b = 0xFF & 0x0F;        // Bitwise AND → 0x0F

// XOR cho boolean — "exactly one is true"
boolean exactlyOne = a ^ b;  // true khi a ≠ b
```

---

## Keyword: Bitwise Operators

**Định nghĩa:** Toán tử thao tác trên từng bit — dùng trong low-level programming, flags, và performance optimization.

```java
// Bit manipulation patterns cho senior

// 1. Check if power of 2
boolean isPowerOf2(int n) {
    return n > 0 && (n & (n - 1)) == 0;
    // 8 = 1000, 7 = 0111 → 1000 & 0111 = 0000 ✓
    // 6 = 0110, 5 = 0101 → 0110 & 0101 = 0100 ✗
}

// 2. Count set bits (population count)
int bitCount = Integer.bitCount(0b10110101);  // 5

// 3. Find lowest set bit
int lowest = n & (-n);  // Isolate rightmost 1-bit
// 12 = 1100, -12 = 0100 (two's complement) → 1100 & 0100 = 0100

// 4. Clear lowest set bit
int cleared = n & (n - 1);

// 5. Bitmask flags — phổ biến trong APIs
public static final int READ    = 1 << 0;  // 0001 = 1
public static final int WRITE   = 1 << 1;  // 0010 = 2
public static final int EXECUTE = 1 << 2;  // 0100 = 4
public static final int DELETE  = 1 << 3;  // 1000 = 8

int permissions = READ | WRITE;             // Set flags: 0011
boolean canRead = (permissions & READ) != 0;  // Check flag
permissions |= EXECUTE;                     // Add flag: 0111
permissions &= ~WRITE;                      // Remove flag: 0101
permissions ^= READ;                        // Toggle flag

// 6. Shift operators
// << : left shift (multiply by 2^n)
// >> : arithmetic right shift (divide by 2^n, preserve sign)
// >>>: logical right shift (fill with 0, ignore sign)

int x = -8;           // 11111111_11111111_11111111_11111000
x >> 1;               // 11111111_11111111_11111111_11111100 = -4 (preserve sign)
x >>> 1;              // 01111111_11111111_11111111_11111100 = 2147483644 (fill 0)

// TRAP: shift amount is modulo type size
int a = 1;
a << 32;  // = 1 (NOT 0!) vì 32 % 32 = 0
a << 33;  // = 2 vì 33 % 32 = 1

long b = 1L;
b << 64;  // = 1L vì 64 % 64 = 0

// 7. EnumSet — bitmask implementation cho enums
EnumSet<Permission> perms = EnumSet.of(Permission.READ, Permission.WRITE);
// Internally uses long bitmask — O(1) operations, very fast
```

---

## Keyword: instanceof & Pattern Matching

**Định nghĩa:** Kiểm tra kiểu runtime — Java 16+ thêm pattern matching giảm boilerplate.

```java
// Traditional instanceof + cast
if (obj instanceof String) {
    String s = (String) obj;  // Redundant cast
    System.out.println(s.length());
}

// Pattern matching instanceof (Java 16+)
if (obj instanceof String s) {
    System.out.println(s.length());  // s đã được cast
}

// Scope rules — binding variable chỉ available khi compiler chứng minh type
if (obj instanceof String s && s.length() > 5) {
    // s available ở đây
}

if (!(obj instanceof String s)) {
    return;  // Early return
}
// s available ở đây! Compiler biết obj phải là String

// Pattern matching trong switch (Java 21+)
String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "Positive int: " + i;
        case Integer i            -> "Non-positive int: " + i;
        case String s when s.isEmpty() -> "Empty string";
        case String s             -> "String: " + s;
        case null                 -> "null";
        default                   -> "Unknown: " + obj.getClass();
    };
}

// Record patterns (Java 21+)
record Point(int x, int y) {}
record Line(Point start, Point end) {}

if (obj instanceof Line(Point(var x1, var y1), Point(var x2, var y2))) {
    double length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Sealed classes + pattern matching = exhaustive switch
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}

double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.w() * r.h();
        // Không cần default — compiler biết đã cover hết
    };
}
```

---

## Keyword: Operator Precedence & Evaluation Order

**Định nghĩa:** Thứ tự ưu tiên và thứ tự đánh giá — hai khái niệm khác nhau mà nhiều người nhầm lẫn.

```java
// Precedence: toán tử nào "bind" chặt hơn
// Evaluation order: operand nào được evaluate TRƯỚC

// Java đảm bảo LEFT-TO-RIGHT evaluation order cho operands
// (khác C/C++ — undefined evaluation order)

int i = 0;
int result = i++ + i++;  // Luôn = 0 + 1 = 1 trong Java
// C/C++: undefined behavior!

// Precedence traps
// & có precedence THẤP hơn ==
if (flags & MASK == 0) { }     // Parsed as: flags & (MASK == 0) — WRONG!
if ((flags & MASK) == 0) { }   // Correct

// Ternary associativity — right-to-left
int x = a ? b : c ? d : e;
// Parsed as: a ? b : (c ? d : e) — NOT (a ? b : c) ? d : e

// Assignment associativity — right-to-left
int a, b, c;
a = b = c = 10;  // c=10, b=10, a=10

// BEST PRACTICE: Luôn dùng ngoặc khi không chắc precedence
// Code rõ ràng > code ngắn gọn
boolean valid = (age >= 18) && (hasLicense || hasPermit);
int masked = (value >> 8) & 0xFF;
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Arithmetic Operators | + - * / % ++ -- | Overflow, integer division, i=i++ trap |
| Comparison & Equality | == != > < >= <= | == vs equals, Integer cache, float comparison |
| Logical & Short-Circuit | && \|\| vs & \| | Side effect skip, null-safe pattern |
| Bitwise Operators | & \| ^ ~ << >> >>> | Bitmask flags, power-of-2, shift modulo |
| instanceof | Type check + pattern matching (Java 16+) | Sealed classes, record patterns, switch patterns |
| Precedence & Evaluation | Bind order vs evaluate order | & vs == precedence, left-to-right guarantee |
