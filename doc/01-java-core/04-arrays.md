# Arrays — Mảng

## Tổng Quan

Array trong Java là object trên heap với kích thước cố định, type-safe, và covariant (gây ra runtime issues). Hiểu memory layout, covariance trap, và khi nào dùng array vs Collection là kiến thức quan trọng.

---

## Keyword: Array Internals

**Định nghĩa:** Array là object đặc biệt trên heap — có header, length field, và contiguous memory cho elements.

**Memory Layout:**

```java
// Array memory layout (64-bit JVM, CompressedOops):
// ┌──────────────────────────────────────┐
// │ Mark Word          (8 bytes)         │ ← GC age, lock, hashCode
// │ Class Pointer      (4 bytes)         │ ← [I, [Ljava/lang/String; etc.
// │ Array Length        (4 bytes)         │ ← int, max = Integer.MAX_VALUE
// │ Element 0           (element size)   │
// │ Element 1           (element size)   │
// │ ...                                  │
// │ Padding to 8-byte boundary           │
// └──────────────────────────────────────┘

// int[10]: 16 (header) + 40 (10 × 4 bytes) = 56 bytes
// Object[10]: 16 (header) + 40 (10 × 4 bytes ref) = 56 bytes (+ objects trên heap)
// byte[10]: 16 (header) + 10 + 6 (padding) = 32 bytes
// boolean[10]: 16 (header) + 10 + 6 (padding) = 32 bytes (1 byte per boolean)

// Maximum array size
// Lý thuyết: Integer.MAX_VALUE (2^31 - 1 = ~2.1 tỷ)
// Thực tế: Integer.MAX_VALUE - 5 (một số JVM reserve header bytes)
// OutOfMemoryError nếu không đủ contiguous heap space

// Zero-initialization
int[] arr = new int[1000];  // Tất cả = 0
// JVM zero-fill memory khi allocate → O(n) cho allocation
// Nhưng OS có thể dùng zero-page mapping → gần O(1) cho large arrays
```

**Array Covariance — design flaw của Java:**

```java
// Array là covariant: String[] IS-A Object[]
Object[] objects = new String[3];  // Compile OK!
objects[0] = "Hello";              // OK
objects[1] = 42;                   // ArrayStoreException tại RUNTIME!

// Tại sao đây là design flaw?
// Vì compiler không thể catch lỗi — phải check type tại runtime cho MỌI array store
// → Performance overhead (mỗi lần gán element, JVM phải check type)

// Generics KHÔNG covariant (đúng đắn hơn):
// List<String> IS-NOT-A List<Object>
// List<Object> list = new ArrayList<String>();  // Compile ERROR ✓

// → Đây là lý do generics dùng wildcards thay vì covariance:
// List<? extends Object> list = new ArrayList<String>();  // OK, read-only
```

---

## Keyword: Array Operations & Performance

**Định nghĩa:** Các thao tác mảng và đặc điểm hiệu năng.

```java
// System.arraycopy — native method, nhanh nhất
// JVM có thể dùng CPU memcpy instruction
int[] src = {1, 2, 3, 4, 5};
int[] dest = new int[5];
System.arraycopy(src, 0, dest, 0, src.length);

// Arrays.copyOf — wrapper quanh System.arraycopy
int[] copy = Arrays.copyOf(src, src.length);
int[] bigger = Arrays.copyOf(src, 10);  // Mở rộng, fill 0

// clone() — shallow copy
int[] cloned = src.clone();

// QUAN TRỌNG: Tất cả đều shallow copy cho reference arrays
String[] names = {"An", "Bình"};
String[] copied = names.clone();
// copied[0] và names[0] trỏ đến CÙNG String object
// (String immutable nên không sao, nhưng mutable objects thì nguy hiểm)

// Arrays.sort — Dual-Pivot Quicksort cho primitives, TimSort cho objects
int[] nums = {5, 2, 8, 1, 9};
Arrays.sort(nums);  // In-place, O(n log n) average

// Parallel sort (Java 8+) — dùng ForkJoinPool
int[] large = new int[1_000_000];
Arrays.parallelSort(large);  // Nhanh hơn sort() cho large arrays (>= 8192 elements)

// Arrays.mismatch (Java 9+) — tìm vị trí khác nhau đầu tiên
int[] a = {1, 2, 3, 4, 5};
int[] b = {1, 2, 3, 9, 5};
int idx = Arrays.mismatch(a, b);  // 3

// Arrays.compare (Java 9+) — lexicographic comparison
int cmp = Arrays.compare(a, b);  // negative (a < b tại index 3)

// Array fill patterns
int[] filled = new int[100];
Arrays.fill(filled, 42);                    // Tất cả = 42
Arrays.fill(filled, 10, 20, 99);           // Index 10-19 = 99
Arrays.setAll(filled, i -> i * i);          // filled[i] = i²
Arrays.parallelSetAll(filled, i -> i * i);  // Parallel version
```

---

## Keyword: Multidimensional Arrays

**Định nghĩa:** Mảng nhiều chiều — thực chất là mảng chứa mảng (array of arrays), KHÔNG phải matrix liên tục.

```java
// Java multidimensional array = array of arrays (jagged by nature)
int[][] matrix = new int[3][4];
// Thực tế tạo:
// 1 array object chứa 3 references
// 3 array objects, mỗi cái chứa 4 ints
// → 4 objects trên heap, KHÔNG contiguous

// Memory layout:
// matrix → [ref0, ref1, ref2]
//           ↓      ↓      ↓
//          [0,0,0,0] [0,0,0,0] [0,0,0,0]

// Cache performance implication:
// Row-major access (tốt — sequential memory):
for (int i = 0; i < rows; i++)
    for (int j = 0; j < cols; j++)
        sum += matrix[i][j];  // Sequential access ✓

// Column-major access (tệ — random memory jumps):
for (int j = 0; j < cols; j++)
    for (int i = 0; i < rows; i++)
        sum += matrix[i][j];  // Cache miss mỗi lần ✗

// Với matrix lớn, row-major nhanh hơn 5-10x do CPU cache locality

// Flatten 2D → 1D cho performance-critical code
int[] flat = new int[rows * cols];
// Access: flat[i * cols + j] thay vì matrix[i][j]
// → 1 object thay vì rows+1 objects, contiguous memory

// Jagged array — mỗi row kích thước khác nhau
int[][] jagged = new int[3][];
jagged[0] = new int[2];
jagged[1] = new int[5];
jagged[2] = new int[1];
// Hữu ích cho: adjacency list, sparse data
```

---

## Keyword: Arrays vs Collections

**Định nghĩa:** Khi nào dùng array, khi nào dùng Collection — trade-offs quan trọng.

```java
// Dùng Array khi:
// - Primitive types (int[], double[]) — tránh autoboxing overhead
// - Fixed size, biết trước
// - Performance-critical (cache locality, no object overhead)
// - Varargs parameters
// - Low-level data structures

// Dùng Collection khi:
// - Dynamic size
// - Cần rich API (sort, filter, search, stream)
// - Generic type safety (List<String> vs String[])
// - Cần immutability (List.of(), Collections.unmodifiableList())
// - Interop với APIs (hầu hết modern APIs dùng Collection)

// Conversion
// Array → List
String[] arr = {"a", "b", "c"};
List<String> fixed = Arrays.asList(arr);     // Fixed-size, backed by array
List<String> mutable = new ArrayList<>(Arrays.asList(arr));  // Mutable copy
List<String> immutable = List.of(arr);       // Immutable (Java 9+)

// List → Array
String[] back = list.toArray(new String[0]);  // Preferred (JVM optimizes)
String[] back2 = list.toArray(String[]::new); // Java 11+ method reference

// TRAP: Arrays.asList() returns fixed-size list backed by array
List<String> list = Arrays.asList("a", "b", "c");
// list.add("d");     // UnsupportedOperationException!
// list.remove("a");  // UnsupportedOperationException!
list.set(0, "x");     // OK — modifies underlying array too

// TRAP: Arrays.asList() với primitive array
int[] ints = {1, 2, 3};
List<int[]> wrong = Arrays.asList(ints);  // List chứa 1 element: int[]!
// Vì generics không hỗ trợ primitives

// Fix: dùng IntStream
List<Integer> correct = IntStream.of(ints).boxed().toList();
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Array Internals | Object trên heap, fixed size, contiguous | Memory layout, header overhead, max size |
| Array Covariance | String[] IS-A Object[] | ArrayStoreException, runtime type check overhead |
| Array Operations | sort, copy, fill, compare | Dual-Pivot Quicksort, parallelSort, shallow copy |
| Multidimensional | Array of arrays (jagged) | Cache locality, row-major vs column-major, flatten |
| Arrays vs Collections | Fixed vs dynamic, primitive vs generic | Autoboxing cost, Arrays.asList traps |
