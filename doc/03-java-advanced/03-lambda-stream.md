# Lambda Expressions & Stream API — Deep Dive

## Tổng Quan

Lambda và Stream API là paradigm shift trong Java — từ imperative sang functional style. Senior cần hiểu lambda capture semantics, stream pipeline internals, parallel stream pitfalls, và performance characteristics.

---

## Keyword: Lambda Internals

**Định nghĩa:** Lambda KHÔNG phải anonymous class — JVM dùng invokedynamic + LambdaMetafactory để tạo tại runtime.

```java
// Anonymous class vs Lambda — khác biệt quan trọng:

// Anonymous class:
// - Tạo .class file riêng (Outer$1.class)
// - new object mỗi lần
// - this = anonymous class instance
Runnable anon = new Runnable() {
    public void run() {
        System.out.println(this.getClass());  // Outer$1
    }
};

// Lambda:
// - KHÔNG tạo .class file
// - invokedynamic → LambdaMetafactory tạo class tại runtime
// - Có thể reuse instance (nếu non-capturing)
// - this = enclosing class instance
Runnable lambda = () -> {
    System.out.println(this.getClass());  // Outer (enclosing class!)
};

// Non-capturing lambda — có thể được cache (singleton)
Runnable nonCapturing = () -> System.out.println("hello");
// JVM có thể tạo 1 instance và reuse → no allocation per call

// Capturing lambda — capture variables, tạo instance mới
String name = "An";
Runnable capturing = () -> System.out.println(name);
// Phải tạo instance mới để hold captured value

// Capture rules:
// - Local variables: phải effectively final (copy by value)
// - Instance fields: capture this reference (mutable!)
// - Static fields: access trực tiếp (mutable!)

int counter = 0;
// list.forEach(item -> counter++);  // ERROR: counter not effectively final

// Workaround cho mutable state trong lambda:
AtomicInteger counter = new AtomicInteger(0);
list.forEach(item -> counter.incrementAndGet());  // OK: reference is final

// Hoặc dùng array (hack, không khuyến khích):
int[] count = {0};
list.forEach(item -> count[0]++);  // OK: array ref is final, content mutable
```

---

## Keyword: Method Reference Types

**Định nghĩa:** 4 loại method reference — mỗi loại có capture behavior khác nhau.

```java
// 1. Static method: ClassName::staticMethod
Function<String, Integer> parse = Integer::parseInt;
// Equivalent: s -> Integer.parseInt(s)
// Non-capturing → có thể cache

// 2. Bound instance method: instance::method
String prefix = "Hello";
Function<String, String> greet = prefix::concat;
// Equivalent: s -> prefix.concat(s)
// Capturing: captures prefix reference

// 3. Unbound instance method: ClassName::instanceMethod
Function<String, Integer> len = String::length;
// Equivalent: s -> s.length()
// First parameter becomes receiver
// Non-capturing → có thể cache

BiFunction<String, String, Boolean> eq = String::equals;
// Equivalent: (s1, s2) -> s1.equals(s2)

// 4. Constructor reference: ClassName::new
Supplier<ArrayList<String>> factory = ArrayList::new;
// Equivalent: () -> new ArrayList<>()

Function<Integer, ArrayList<String>> sizedFactory = ArrayList::new;
// Equivalent: size -> new ArrayList<>(size)
// Compiler chọn constructor dựa trên functional interface signature

// Array constructor reference
IntFunction<String[]> arrayFactory = String[]::new;
// Equivalent: size -> new String[size]
// Dùng trong: stream.toArray(String[]::new)
```

---

## Keyword: Stream Pipeline Internals

**Định nghĩa:** Stream pipeline = source + intermediate ops (lazy) + terminal op (triggers execution).

```java
// Stream KHÔNG lưu data — chỉ là pipeline description
// Execution chỉ xảy ra khi terminal operation được gọi

// Lazy evaluation — intermediate ops không chạy cho đến khi terminal op
List<String> names = List.of("An", "Bình", "Cường", "Dũng", "Em");
names.stream()
    .filter(n -> {
        System.out.println("filter: " + n);  // Chỉ in khi terminal op chạy
        return n.length() > 2;
    })
    .map(n -> {
        System.out.println("map: " + n);
        return n.toUpperCase();
    })
    .findFirst();  // Terminal op

// Output:
// filter: An       (length 2, filtered out)
// filter: Bình     (length 4, passes)
// map: Bình        (transform)
// → Stops! findFirst() short-circuits — Cường, Dũng, Em never processed

// Stream pipeline fusion:
// JVM có thể merge multiple operations thành single pass
// filter + map + collect → single loop internally

// Stream characteristics — affect optimization:
// ORDERED: elements have encounter order (List, LinkedHashSet)
// DISTINCT: no duplicates (Set)
// SORTED: elements are sorted (TreeSet, sorted())
// SIZED: known size (Collection, not filter result)
// NONNULL: no null elements (some sources)
// IMMUTABLE: source cannot be modified
// CONCURRENT: source supports concurrent modification

// unordered() — hint to allow optimizations
set.stream()
    .unordered()  // Allow reordering for parallel performance
    .limit(10)
    .collect(toList());

// Stream reuse — CANNOT reuse stream
Stream<String> stream = names.stream();
stream.forEach(System.out::println);
// stream.count();  // IllegalStateException: stream has already been operated upon
```

---

## Keyword: Collectors — Advanced

**Định nghĩa:** Collectors cho complex aggregation — grouping, partitioning, downstream collectors.

```java
List<Employee> employees = getEmployees();

// groupingBy with downstream collector
Map<Department, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.averagingDouble(Employee::getSalary)
    ));

// Multi-level grouping
Map<Department, Map<Level, List<Employee>>> grouped = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.groupingBy(Employee::getLevel)
    ));

// groupingBy + counting + sorting
Map<Department, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment, Collectors.counting()));

// toMap with merge function (handle duplicate keys)
Map<String, Employee> byName = employees.stream()
    .collect(Collectors.toMap(
        Employee::getName,
        Function.identity(),
        (existing, replacement) -> existing  // Keep first on duplicate
    ));

// toMap with specific Map implementation
Map<String, Employee> sortedByName = employees.stream()
    .collect(Collectors.toMap(
        Employee::getName,
        Function.identity(),
        (a, b) -> a,
        TreeMap::new  // Sorted map
    ));

// Custom collector
Collector<String, StringBuilder, String> joining = Collector.of(
    StringBuilder::new,           // Supplier: create accumulator
    StringBuilder::append,        // Accumulator: add element
    (a, b) -> a.append(b),      // Combiner: merge accumulators (parallel)
    StringBuilder::toString       // Finisher: extract result
);

// teeing collector (Java 12+) — two collectors in one pass
var result = employees.stream().collect(
    Collectors.teeing(
        Collectors.averagingDouble(Employee::getSalary),
        Collectors.counting(),
        (avg, count) -> "Average: " + avg + ", Count: " + count
    )
);
```

---

## Keyword: Parallel Streams — Pitfalls

**Định nghĩa:** Parallel stream dùng ForkJoinPool — nhưng không phải lúc nào cũng nhanh hơn.

```java
// Parallel stream dùng common ForkJoinPool
// Default parallelism = Runtime.getRuntime().availableProcessors() - 1

// Khi NÊN dùng parallel:
// 1. Large dataset (>10,000 elements)
// 2. CPU-intensive operations (không I/O)
// 3. Stateless, non-interfering operations
// 4. Source hỗ trợ efficient splitting (ArrayList, array, IntRange)

// Khi KHÔNG NÊN dùng parallel:
// 1. Small dataset — overhead > benefit
// 2. I/O operations — threads block, pool exhausted
// 3. Ordered operations (limit, findFirst) — coordination overhead
// 4. LinkedList source — poor splitting (O(n) to split)
// 5. Shared mutable state — race conditions

// ❌ Race condition
List<String> results = new ArrayList<>();  // Not thread-safe!
stream.parallel().forEach(item -> results.add(process(item)));  // BUG!

// ✅ Thread-safe collection
List<String> results = stream.parallel()
    .map(this::process)
    .collect(Collectors.toList());  // Collector handles thread-safety

// ❌ Common ForkJoinPool starvation
// Blocking I/O in parallel stream blocks shared pool threads
stream.parallel().forEach(item -> {
    httpClient.send(request);  // Blocks thread!
    // Other parallel streams in application starved
});

// ✅ Custom ForkJoinPool for isolation
ForkJoinPool customPool = new ForkJoinPool(4);
List<Result> results = customPool.submit(() ->
    items.parallelStream()
        .map(this::process)
        .collect(toList())
).get();
customPool.shutdown();

// Spliterator — controls how stream splits for parallel
// ArrayList: splits in half → good parallelism
// LinkedList: splits poorly → sequential fallback
// TreeSet: splits by subtree → decent parallelism
// Custom Spliterator for custom data sources
```

---

## Keyword: Optional — Best Practices

**Định nghĩa:** Container cho nullable values — dùng đúng cách tránh anti-patterns.

```java
// ✅ DO: Return Optional from methods that may not have result
public Optional<User> findById(Long id) {
    return Optional.ofNullable(userMap.get(id));
}

// ✅ DO: Chain operations
String city = findUser(id)
    .flatMap(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");

// ✅ DO: Use orElseGet for expensive defaults
user.orElseGet(() -> loadDefaultUser());  // Lazy — only called if empty

// ❌ DON'T: Use Optional as field type
public class User {
    private Optional<String> middleName;  // BAD — not serializable, overhead
    private String middleName;  // GOOD — nullable field is fine
}

// ❌ DON'T: Use Optional as method parameter
public void process(Optional<String> name) { }  // BAD
public void process(String name) { }  // GOOD — caller passes null or value
public void process() { }  // GOOD — overload for absent case

// ❌ DON'T: Use Optional.get() without check
user.get();  // NoSuchElementException if empty!
// ✅
user.orElseThrow();  // Same exception but intent is clear
user.orElseThrow(() -> new UserNotFoundException(id));

// ❌ DON'T: Use Optional for collections
public Optional<List<User>> findUsers() { }  // BAD
public List<User> findUsers() { return List.of(); }  // GOOD — empty list

// ❌ DON'T: isPresent() + get() pattern
if (user.isPresent()) {
    process(user.get());  // BAD — verbose
}
user.ifPresent(this::process);  // GOOD

// Optional with streams (Java 9+)
optional.stream()  // Stream of 0 or 1 elements
    .flatMap(...)
    .collect(...);

// or() (Java 9+) — chain Optional suppliers
Optional<User> user = findInCache(id)
    .or(() -> findInDatabase(id))
    .or(() -> findInRemoteService(id));
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Lambda Internals | invokedynamic, not anonymous class | Capture semantics, this reference, caching |
| Method References | 4 types: static, bound, unbound, constructor | Capture behavior, compiler selection |
| Stream Pipeline | Lazy evaluation, short-circuit, fusion | Characteristics, reuse prohibition |
| Collectors | Complex aggregation | groupingBy + downstream, teeing, custom collector |
| Parallel Streams | ForkJoinPool-based parallelism | When to use, pool starvation, Spliterator |
| Optional | Nullable container | Return type only, chain operations, anti-patterns |
