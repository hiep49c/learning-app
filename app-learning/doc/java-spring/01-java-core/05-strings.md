# Strings — Chuỗi Ký Tự

## Tổng Quan

String là class được dùng nhiều nhất trong Java — immutable, interned, và có nhiều JVM optimizations. Senior cần hiểu String Pool, compact strings, concatenation optimization, và encoding issues.

---

## Keyword: String Immutability

**Định nghĩa:** String objects không thể thay đổi sau khi tạo — mọi "modification" tạo object mới.

**Tại sao String immutable? (Design decision quan trọng):**

```java
// 1. Thread Safety — String có thể shared giữa threads mà không cần synchronization
// 2. String Pool — chỉ hoạt động vì immutable (nếu mutable, thay đổi 1 ảnh hưởng tất cả)
// 3. Security — class name, file path, URL, SQL query dùng String
//    Nếu mutable, attacker có thể thay đổi sau validation
// 4. hashCode caching — tính 1 lần, cache mãi mãi
//    → HashMap/HashSet lookup nhanh hơn

// Internal implementation (Java 9+: Compact Strings)
// Trước Java 9: char[] (2 bytes per char, UTF-16)
// Java 9+: byte[] + coder flag
//   - LATIN1 (coder=0): 1 byte per char — cho ASCII/Latin strings
//   - UTF16 (coder=1): 2 bytes per char — cho Unicode strings
// → Tiết kiệm ~50% memory cho ASCII-heavy applications

// String class internals (simplified):
public final class String {
    private final byte[] value;  // Actual character data
    private final byte coder;    // LATIN1=0, UTF16=1
    private int hash;            // Cached hashCode (0 = not computed)
    // hash được tính lazy, cached vì immutable
}

// hashCode caching
String s = "Hello";
s.hashCode();  // Tính lần đầu, cache vào field hash
s.hashCode();  // Trả về cached value — O(1)

// TRAP: hashCode = 0 cho một số strings
"".hashCode();           // 0
"f5a5a608".hashCode();   // 0 (hash collision)
// → Mỗi lần gọi hashCode() trên string có hash=0, phải tính lại
// (JVM không phân biệt "chưa tính" vs "tính ra 0")
```

---

## Keyword: String Pool & Interning

**Định nghĩa:** Vùng nhớ trong Heap nơi JVM lưu trữ và tái sử dụng String literals.

```java
// String Pool implementation:
// - Hashtable native trong JVM (StringTable)
// - Nằm trong Heap (Java 7+, trước đó trong PermGen)
// - Default size: -XX:StringTableSize=65536 (Java 11+)
// - Có thể GC (weak references)

// Interning rules:
// 1. String literals tự động intern
String a = "hello";  // Intern vào pool

// 2. Compile-time constant expressions tự động intern
String b = "hel" + "lo";  // Compiler gộp → "hello" → intern
final String prefix = "hel";
String c = prefix + "lo";  // final → constant → intern
System.out.println(a == b);  // true
System.out.println(a == c);  // true

// 3. Runtime strings KHÔNG tự động intern
String name = "lo";
String d = "hel" + name;  // Runtime concat → KHÔNG intern
System.out.println(a == d);  // false

// 4. intern() thủ công
String e = d.intern();
System.out.println(a == e);  // true

// Khi nào dùng intern()?
// - Khi có nhiều duplicate strings (parsing CSV, XML, JSON)
// - Khi cần == comparison thay vì equals() (micro-optimization)
// - CẢNH BÁO: intern() có cost — lock contention trên StringTable
// - CẢNH BÁO: interned strings tồn tại lâu → memory leak nếu lạm dụng

// String deduplication (G1 GC, Java 8u20+)
// -XX:+UseStringDeduplication
// GC tự động deduplicate String objects có cùng value
// Khác intern(): không ảnh hưởng == comparison, chỉ share byte[] array
// → An toàn hơn intern(), không cần thay đổi code
```

---

## Keyword: String Concatenation Optimization

**Định nghĩa:** JVM tối ưu string concatenation qua các phiên bản — từ StringBuilder đến invokedynamic.

```java
// Java 1-4: Compiler tạo StringBuffer (synchronized, chậm)
// Java 5-8: Compiler tạo StringBuilder (unsynchronized, nhanh hơn)
String result = "Hello" + name + "!";
// Compiled to:
// new StringBuilder().append("Hello").append(name).append("!").toString()

// Java 9+: invokedynamic (JEP 280)
// Compiler tạo invokedynamic call → JVM chọn strategy tối ưu tại runtime
// Strategies: StringBuilder, byte[] concat, MethodHandle chain...
// → Nhanh hơn và tạo ít garbage hơn

// NHƯNG: Trong loop, VẪN cần StringBuilder thủ công
// ❌ O(n²) — mỗi iteration tạo String mới
String result = "";
for (int i = 0; i < n; i++) {
    result += items[i];  // Mỗi lần: allocate, copy, concat
}

// ✅ O(n) — append vào buffer
StringBuilder sb = new StringBuilder(estimatedSize);  // Pre-size nếu biết
for (int i = 0; i < n; i++) {
    sb.append(items[i]);
}
String result = sb.toString();

// StringBuilder vs StringBuffer
// StringBuilder: unsynchronized, nhanh hơn → dùng trong single thread
// StringBuffer: synchronized, chậm hơn → dùng trong multi-thread (hiếm khi cần)

// StringBuilder capacity management
StringBuilder sb = new StringBuilder();  // Default capacity: 16
// Khi append vượt capacity → allocate new array (capacity * 2 + 2)
// → Copy toàn bộ data sang array mới
// Pre-size để tránh resize: new StringBuilder(expectedLength)

// String.join() và Collectors.joining() — clean API
String csv = String.join(", ", "An", "Bình", "Cường");
String csv2 = list.stream().collect(Collectors.joining(", ", "[", "]"));
// "[An, Bình, Cường]"
```

---

## Keyword: String Methods — Advanced

**Định nghĩa:** Các methods quan trọng và edge cases mà senior cần biết.

```java
// substring() — implementation thay đổi qua versions
// Java 6-: substring() share underlying char[] → memory leak!
//   String large = readHugeFile();
//   String small = large.substring(0, 10);  // small giữ reference đến huge char[]
// Java 7+: substring() tạo copy → không leak, nhưng tốn memory hơn

// equals() vs equalsIgnoreCase() vs contentEquals()
"Hello".equals("hello");              // false
"Hello".equalsIgnoreCase("hello");    // true
"Hello".contentEquals(new StringBuilder("Hello"));  // true
// contentEquals() chấp nhận CharSequence, không chỉ String

// compareTo() — lexicographic, dựa trên Unicode code points
"abc".compareTo("abd");  // -1 (c < d)
"abc".compareTo("ab");   // 1 (longer)
"abc".compareTo("abc");  // 0

// strip() vs trim() (Java 11+)
// trim() chỉ remove ASCII whitespace (char <= ' ')
// strip() remove Unicode whitespace (Character.isWhitespace())
"\u2000Hello\u2000".trim();   // "\u2000Hello\u2000" (Unicode space không bị trim)
"\u2000Hello\u2000".strip();  // "Hello" (Unicode space bị strip)

// repeat() (Java 11+)
"abc".repeat(3);  // "abcabcabc"
"-".repeat(50);   // Separator line

// chars() và codePoints() (Java 9+)
"Hello".chars()       // IntStream of char values
    .mapToObj(c -> (char) c)
    .toList();

// Handling surrogate pairs correctly
String emoji = "Hello 😀 World";
emoji.length();                    // 15 (includes surrogate pair)
emoji.codePointCount(0, emoji.length());  // 14 (actual characters)
emoji.codePoints()                 // IntStream of code points
    .mapToObj(Character::toString)
    .toList();                     // Correct character list

// formatted() (Java 15+) — instance method
"Name: %s, Age: %d".formatted("An", 25);  // "Name: An, Age: 25"

// Text Blocks (Java 15+)
String json = """
        {
            "name": "Java",
            "version": 21
        }
        """;
// Incidental whitespace (leading spaces) tự động stripped
// Trailing whitespace stripped per line
// \s — preserve trailing space
// \ — line continuation (no newline)
String singleLine = """
        This is a \
        single line\
        """;  // "This is a single line"
```

---

## Keyword: Regular Expressions — Advanced

**Định nghĩa:** Regex engine trong Java dùng NFA (Nondeterministic Finite Automaton) — có thể bị catastrophic backtracking.

```java
// Pattern compilation — LUÔN compile và reuse
// ❌ Compile mỗi lần gọi
boolean match = input.matches("\\d+");  // Compile Pattern mỗi lần!

// ✅ Compile 1 lần, reuse
private static final Pattern DIGITS = Pattern.compile("\\d+");
boolean match = DIGITS.matcher(input).matches();

// Named groups (Java 7+)
Pattern DATE = Pattern.compile(
    "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})"
);
Matcher m = DATE.matcher("2024-03-15");
if (m.matches()) {
    String year = m.group("year");    // "2024"
    String month = m.group("month");  // "03"
}

// Catastrophic backtracking — ReDoS vulnerability
// Pattern: (a+)+ matching "aaaaaaaaaaaaaaaaX"
// NFA tries exponential combinations → O(2^n)
// → Application hangs (Denial of Service)

// ❌ Vulnerable patterns
Pattern.compile("(a+)+");           // Nested quantifiers
Pattern.compile("(a|aa)+");         // Overlapping alternatives
Pattern.compile("(.*a){10}");       // Greedy with backtracking

// ✅ Fix: Possessive quantifiers (no backtracking)
Pattern.compile("(a++)");           // ++ = possessive, no backtrack
Pattern.compile("(?>a+)");          // Atomic group

// ✅ Fix: Set timeout
Matcher m = pattern.matcher(input);
// Java không có built-in timeout cho regex
// Workaround: run in separate thread with timeout

// Useful patterns for validation
Pattern EMAIL = Pattern.compile(
    "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
);
Pattern UUID = Pattern.compile(
    "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    Pattern.CASE_INSENSITIVE
);
Pattern IP_V4 = Pattern.compile(
    "^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$"
);
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| String Immutability | Không thể thay đổi sau khi tạo | Compact Strings (Java 9+), hashCode caching, security |
| String Pool & Interning | JVM cache String literals | StringTable size, deduplication, intern() cost |
| Concatenation Optimization | invokedynamic (Java 9+) | Loop concat O(n²), StringBuilder pre-sizing |
| String Methods | strip vs trim, codePoints, text blocks | Surrogate pairs, Unicode handling |
| Regular Expressions | NFA engine, Pattern reuse | Catastrophic backtracking (ReDoS), possessive quantifiers |
