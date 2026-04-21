# Collections Framework — Deep Dive

## Tổng Quan

Collections Framework là backbone của Java applications. Senior cần hiểu internal data structures, time complexity, thread-safety characteristics, và chọn đúng implementation cho từng use case.

---

## Keyword: HashMap Internals

**Định nghĩa:** Hash table implementation — array of buckets, separate chaining, treeification (Java 8+).

```java
// Internal structure:
// Node<K,V>[] table — array of buckets
// Default initial capacity: 16
// Default load factor: 0.75
// Resize: double capacity khi size > capacity * loadFactor

// Hash computation:
// 1. key.hashCode() → int (32 bits)
// 2. Spread: hash ^ (hash >>> 16) — mix high bits into low bits
// 3. Bucket index: hash & (capacity - 1) — bitwise AND (capacity is power of 2)

// Collision resolution:
// Java 7: Linked list (O(n) worst case)
// Java 8+: Linked list → Red-Black tree khi bucket size >= 8
//          Tree → Linked list khi bucket size <= 6
// → Worst case: O(log n) thay vì O(n)

// Treeification requires: key implements Comparable
// Nếu không Comparable → compare by identityHashCode (less efficient)

// Performance implications:
// Good hashCode: O(1) average for get/put
// Bad hashCode (all same hash): O(log n) with treeification
// Resize: O(n) — rehash all entries

// hashCode() quality matters enormously:
// ❌ Bad: return 1; → all entries in 1 bucket → O(n)
// ❌ Bad: return random; → same key different hash → lost entries
// ✅ Good: Objects.hash(field1, field2) — well-distributed

// ConcurrentHashMap (Java 8+):
// - Lock striping: lock per bucket (not entire map)
// - CAS operations for simple updates
// - No null keys or values (unlike HashMap)
// - size() is approximate in concurrent scenarios
// - computeIfAbsent() is atomic

ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();
counters.computeIfAbsent("hits", k -> new AtomicLong()).incrementAndGet();
// Thread-safe without external synchronization

// LinkedHashMap — HashMap + doubly-linked list
// Maintains insertion order (or access order for LRU cache)
// LRU Cache implementation:
LinkedHashMap<String, Object> lruCache = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Object> eldest) {
        return size() > MAX_CACHE_SIZE;
    }
};

// TreeMap — Red-Black tree, sorted by key
// O(log n) for get/put/remove
// NavigableMap: floorKey, ceilingKey, subMap, headMap, tailMap
TreeMap<LocalDate, Event> events = new TreeMap<>();
events.floorEntry(today);     // Latest event on or before today
events.subMap(startDate, endDate);  // Events in range
```

---

## Keyword: ArrayList vs LinkedList — Real Performance

**Định nghĩa:** ArrayList gần như luôn nhanh hơn LinkedList — ngay cả cho insertions.

```java
// Common misconception: "LinkedList tốt cho insert/delete"
// Reality: ArrayList thường nhanh hơn do CPU cache locality

// ArrayList: contiguous memory → cache-friendly
// LinkedList: scattered nodes → cache misses

// Benchmark results (typical):
// Random access:    ArrayList O(1)  vs LinkedList O(n)     → ArrayList wins
// Iteration:        ArrayList fast  vs LinkedList slow     → ArrayList wins (cache)
// Add at end:       ArrayList O(1)* vs LinkedList O(1)     → Similar
// Add at beginning: ArrayList O(n)  vs LinkedList O(1)     → LinkedList wins
// Add in middle:    ArrayList O(n)  vs LinkedList O(n)**   → ArrayList often wins!

// * ArrayList amortized O(1) — occasional O(n) resize
// ** LinkedList O(n) to FIND position + O(1) to insert
//    But finding position requires traversal → cache misses

// When to actually use LinkedList:
// 1. Frequent add/remove at BOTH ends → use as Deque
// 2. Iterator-based removal during iteration
// 3. Almost never for general-purpose List

// ArrayList capacity management:
ArrayList<String> list = new ArrayList<>(1000);  // Pre-size if known
// Default capacity: 10
// Growth: oldCapacity + (oldCapacity >> 1) = 1.5x
// 10 → 15 → 22 → 33 → 49 → ...
// ensureCapacity(minCapacity) — pre-allocate
// trimToSize() — shrink to actual size

// Immutable lists (Java 9+):
List<String> immutable = List.of("a", "b", "c");
// Internal: specialized classes for 0-2 elements, array-based for 3+
// List.of() with 0 elements → singleton empty list
// List.of(e1) → specialized 1-element class (no array!)
// List.of(e1, e2) → specialized 2-element class
// List.of(e1, e2, e3, ...) → array-based
// → Memory efficient for small lists
```

---

## Keyword: Set Implementations

**Định nghĩa:** HashSet, LinkedHashSet, TreeSet — chọn dựa trên ordering requirements.

```java
// HashSet: HashMap internally (value = dummy PRESENT object)
// O(1) add/remove/contains
// No ordering guarantee
// Allows null (1 null element)

// LinkedHashSet: LinkedHashMap internally
// O(1) operations + maintains insertion order
// Slightly slower than HashSet (linked list overhead)

// TreeSet: TreeMap internally (Red-Black tree)
// O(log n) operations
// Sorted order (natural or Comparator)
// NavigableSet: floor, ceiling, subSet, headSet, tailSet
// Does NOT allow null (needs comparison)

// CopyOnWriteArraySet: thread-safe, optimized for read-heavy
// Every write creates new array copy → expensive writes
// Iteration never throws ConcurrentModificationException
// Use for: small sets, read-mostly, event listeners

// Choosing the right Set:
// Need fast lookup, no order? → HashSet
// Need insertion order? → LinkedHashSet
// Need sorted order? → TreeSet
// Need thread-safe, read-heavy? → CopyOnWriteArraySet
// Need thread-safe, write-heavy? → ConcurrentHashMap.newKeySet()
// Enum values? → EnumSet (always!)

// Set operations:
Set<String> a = Set.of("1", "2", "3");
Set<String> b = Set.of("2", "3", "4");

// Union: a ∪ b
Set<String> union = new HashSet<>(a);
union.addAll(b);  // {1, 2, 3, 4}

// Intersection: a ∩ b
Set<String> intersection = new HashSet<>(a);
intersection.retainAll(b);  // {2, 3}

// Difference: a \ b
Set<String> difference = new HashSet<>(a);
difference.removeAll(b);  // {1}

// Symmetric difference: a △ b
Set<String> symDiff = new HashSet<>(a);
symDiff.addAll(b);
Set<String> tmp = new HashSet<>(a);
tmp.retainAll(b);
symDiff.removeAll(tmp);  // {1, 4}
```

---

## Keyword: Queue & Deque — Choosing Right Implementation

**Định nghĩa:** Queue (FIFO), Deque (double-ended), PriorityQueue (heap) — mỗi cái cho use case khác.

```java
// ArrayDeque — preferred general-purpose Deque/Stack
// Resizable circular array — faster than LinkedList for both Stack and Queue
// No null elements
Deque<String> stack = new ArrayDeque<>();  // Use as Stack (LIFO)
stack.push("a"); stack.push("b");
stack.pop();  // "b"

Deque<String> queue = new ArrayDeque<>();  // Use as Queue (FIFO)
queue.offer("a"); queue.offer("b");
queue.poll();  // "a"

// PriorityQueue — binary heap
// O(log n) offer/poll, O(1) peek
// NOT thread-safe
// Natural ordering or custom Comparator
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    Comparator.comparing(Task::getPriority).reversed()  // High priority first
);

// BlockingQueue — thread-safe, blocking operations
// Producer-Consumer pattern
BlockingQueue<Job> jobQueue = new LinkedBlockingQueue<>(100);  // Bounded
// Producer:
jobQueue.put(job);      // Blocks if full
// Consumer:
Job job = jobQueue.take();  // Blocks if empty

// Implementations:
// ArrayBlockingQueue: bounded, fair option
// LinkedBlockingQueue: optionally bounded
// PriorityBlockingQueue: unbounded, priority-based
// SynchronousQueue: zero-capacity, direct handoff
// DelayQueue: elements available after delay

// SynchronousQueue — special: no internal capacity
// put() blocks until another thread calls take()
// Used in: Executors.newCachedThreadPool()
```

---

## Keyword: Fail-Fast vs Fail-Safe Iterators

**Định nghĩa:** Fail-fast throw ConcurrentModificationException; fail-safe work on copy/snapshot.

```java
// Fail-fast: ArrayList, HashMap, HashSet, etc.
// Detect structural modification during iteration → throw CME
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
for (String s : list) {
    list.remove(s);  // ConcurrentModificationException!
}

// Internal: modCount field tracks structural modifications
// Iterator checks modCount on each next() call
// If modCount changed → throw CME

// Safe removal during iteration:
// 1. Iterator.remove()
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) it.remove();
}

// 2. removeIf() (Java 8+)
list.removeIf(s -> s.equals("b"));

// 3. Collect + removeAll
list.removeAll(list.stream().filter(s -> s.equals("b")).toList());

// Fail-safe: ConcurrentHashMap, CopyOnWriteArrayList
// Work on snapshot or allow concurrent modification
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    map.remove(entry.getKey());  // OK! No CME
}
// But: iterator may not reflect all concurrent changes

// CopyOnWriteArrayList: every write creates new array
// Iteration uses snapshot → never CME
// Good for: event listeners, read-heavy small lists
// Bad for: large lists, write-heavy
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| HashMap Internals | Array + linked list/tree buckets | Treeification (Java 8), load factor, ConcurrentHashMap |
| ArrayList vs LinkedList | Contiguous vs scattered memory | Cache locality, ArrayList almost always wins |
| Set Implementations | HashSet, LinkedHashSet, TreeSet | EnumSet for enums, CopyOnWriteArraySet |
| Queue & Deque | FIFO, LIFO, Priority, Blocking | ArrayDeque preferred, BlockingQueue for producer-consumer |
| Fail-Fast vs Fail-Safe | CME detection vs snapshot iteration | modCount, Iterator.remove(), ConcurrentHashMap |
