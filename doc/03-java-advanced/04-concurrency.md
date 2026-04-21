# Concurrency & Multithreading — Deep Dive

## Tổng Quan

Concurrency là lĩnh vực phức tạp nhất trong Java. Senior/Tech Lead cần hiểu Java Memory Model (JMM), happens-before relationships, lock-free algorithms, và modern concurrency patterns.

---

## Keyword: Java Memory Model (JMM)

**Định nghĩa:** JMM (JSR 133) định nghĩa cách threads tương tác qua shared memory — visibility và ordering guarantees.

```java
// Problem: Mỗi thread có thể cache variables trong CPU registers/L1 cache
// → Thread A ghi x=1, Thread B có thể vẫn thấy x=0

// JMM defines "happens-before" relationships:
// Nếu action A happens-before action B → B thấy kết quả của A

// Happens-before rules:
// 1. Program order: trong cùng thread, statement trước HB statement sau
// 2. Monitor lock: unlock() HB lock() tiếp theo trên cùng monitor
// 3. Volatile: write HB read tiếp theo trên cùng volatile variable
// 4. Thread start: thread.start() HB mọi action trong thread đó
// 5. Thread join: mọi action trong thread HB join() return
// 6. Transitivity: A HB B, B HB C → A HB C

// Visibility problem:
public class Visibility {
    private boolean running = true;  // Không volatile!

    public void stop() { running = false; }

    public void run() {
        while (running) {  // Có thể loop mãi mãi!
            // JIT có thể hoist: if (running) while(true) { }
        }
    }
}

// Fix 1: volatile
private volatile boolean running = true;
// volatile write → flush to main memory
// volatile read → read from main memory
// + prevents reordering around volatile access

// Fix 2: synchronized
public synchronized void stop() { running = false; }
public void run() {
    while (true) {
        synchronized (this) {
            if (!running) break;
        }
    }
}

// Reordering — compiler/CPU có thể reorder instructions
int a = 0, b = 0;
// Thread 1:        Thread 2:
a = 1;              int x = b;
b = 2;              int y = a;
// Possible result: x=2, y=0 (reordering!)
// volatile hoặc synchronized ngăn reordering
```

---

## Keyword: synchronized — Monitor Lock

**Định nghĩa:** Intrinsic lock (monitor) — mutual exclusion + memory visibility.

```java
// Mỗi object có 1 intrinsic lock (monitor)
// synchronized block: acquire lock → execute → release lock

// Lock levels (JVM optimization):
// 1. Biased locking: assume single thread → no CAS (deprecated Java 15+)
// 2. Thin lock (lightweight): CAS on mark word → fast for low contention
// 3. Fat lock (heavyweight): OS mutex → slow but fair for high contention

// Lock escalation: biased → thin → fat (automatic, based on contention)

// synchronized method vs block:
public synchronized void method() { }  // Lock on 'this'
public static synchronized void staticMethod() { }  // Lock on Class object

public void method() {
    synchronized (this) { }  // Same as synchronized method
    synchronized (lockObject) { }  // Lock on specific object — preferred
}

// ❌ Common mistakes:
// 1. Synchronize on wrong object
private final List<String> list = new ArrayList<>();
synchronized (list) { list.add("item"); }
// Nếu list được reassign → different lock → race condition!
// Fix: dùng separate final lock object

private final Object lock = new Object();
synchronized (lock) { list.add("item"); }

// 2. Synchronize on boxed primitive
private Integer count = 0;
synchronized (count) { count++; }  // ⚠️ count = new Integer → different object!

// 3. Double-checked locking (broken without volatile)
// ❌ Broken:
private static Singleton instance;
public static Singleton getInstance() {
    if (instance == null) {
        synchronized (Singleton.class) {
            if (instance == null) {
                instance = new Singleton();  // May be reordered!
                // Other thread may see non-null but partially constructed instance
            }
        }
    }
    return instance;
}

// ✅ Fixed with volatile:
private static volatile Singleton instance;
// volatile prevents reordering of constructor and assignment

// ✅ Better: Initialization-on-demand holder
public class Singleton {
    private Singleton() {}
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() { return Holder.INSTANCE; }
}
// Class loading guarantees thread-safety + lazy initialization
```

---

## Keyword: java.util.concurrent — Lock Framework

**Định nghĩa:** Explicit locks với more features than synchronized — tryLock, fairness, read-write separation.

```java
// ReentrantLock — explicit lock with more control
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // Critical section
} finally {
    lock.unlock();  // MUST unlock in finally
}

// tryLock — non-blocking attempt
if (lock.tryLock(1, TimeUnit.SECONDS)) {
    try { /* critical section */ }
    finally { lock.unlock(); }
} else {
    // Could not acquire lock — handle gracefully
}

// ReadWriteLock — multiple readers OR single writer
ReadWriteLock rwLock = new ReentrantReadWriteLock();
// Multiple threads can read simultaneously
rwLock.readLock().lock();
try { return cache.get(key); }
finally { rwLock.readLock().unlock(); }

// Only one thread can write, blocks all readers
rwLock.writeLock().lock();
try { cache.put(key, value); }
finally { rwLock.writeLock().unlock(); }

// StampedLock (Java 8+) — optimistic reading
StampedLock sl = new StampedLock();

// Optimistic read — no locking, validate after
long stamp = sl.tryOptimisticRead();
double x = this.x, y = this.y;  // Read fields
if (!sl.validate(stamp)) {  // Check if write occurred
    stamp = sl.readLock();  // Fallback to pessimistic read
    try { x = this.x; y = this.y; }
    finally { sl.unlockRead(stamp); }
}
// Use x, y

// Condition — wait/notify replacement
ReentrantLock lock = new ReentrantLock();
Condition notEmpty = lock.newCondition();
Condition notFull = lock.newCondition();

// Producer:
lock.lock();
try {
    while (queue.isFull()) notFull.await();
    queue.add(item);
    notEmpty.signal();
} finally { lock.unlock(); }

// Consumer:
lock.lock();
try {
    while (queue.isEmpty()) notEmpty.await();
    item = queue.remove();
    notFull.signal();
} finally { lock.unlock(); }
```

---

## Keyword: Atomic Classes & CAS

**Định nghĩa:** Lock-free thread-safe operations dùng Compare-And-Swap (CAS) — nhanh hơn synchronized cho simple operations.

```java
// CAS: compareAndSet(expected, new)
// Hardware instruction: nếu current == expected → set new, return true
// Nếu current != expected → do nothing, return false (retry)

AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();     // ++counter (atomic)
counter.getAndIncrement();     // counter++ (atomic)
counter.addAndGet(5);          // counter += 5 (atomic)
counter.compareAndSet(10, 20); // if counter==10 then counter=20

// AtomicReference — CAS cho object references
AtomicReference<Config> config = new AtomicReference<>(initialConfig);
config.compareAndSet(oldConfig, newConfig);

// LongAdder (Java 8+) — faster than AtomicLong for high contention
// Internally: array of cells, each thread updates different cell
// sum() aggregates all cells
LongAdder adder = new LongAdder();
adder.increment();  // Distributed across cells
adder.sum();        // Aggregate

// Benchmark: 16 threads incrementing
// AtomicLong: ~200M ops/sec (contention on single variable)
// LongAdder: ~1.5B ops/sec (distributed, less contention)

// VarHandle (Java 9+) — low-level atomic access
// Replacement for sun.misc.Unsafe
// Used internally by AtomicXxx classes
```

---

## Keyword: CompletableFuture — Async Programming

**Định nghĩa:** Composable async operations — Java's answer to Promises/Futures.

```java
// Async execution
CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() ->
    userService.findById(userId)  // Runs in ForkJoinPool.commonPool()
);

// Chaining
CompletableFuture<String> result = userFuture
    .thenApply(user -> user.getEmail())           // Transform (same thread)
    .thenApplyAsync(email -> enrichEmail(email))   // Transform (async)
    .thenCompose(email -> sendEmailAsync(email))   // FlatMap (async → async)
    .exceptionally(ex -> {
        logger.error("Failed", ex);
        return "fallback@example.com";
    });

// Combining multiple futures
CompletableFuture<User> userF = fetchUserAsync(id);
CompletableFuture<List<Order>> ordersF = fetchOrdersAsync(id);
CompletableFuture<Double> balanceF = fetchBalanceAsync(id);

// Wait for all
CompletableFuture.allOf(userF, ordersF, balanceF)
    .thenRun(() -> {
        User user = userF.join();
        List<Order> orders = ordersF.join();
        Double balance = balanceF.join();
        // All available
    });

// Wait for any (first to complete)
CompletableFuture.anyOf(primaryService, fallbackService)
    .thenAccept(result -> process(result));

// Timeout (Java 9+)
userFuture
    .orTimeout(5, TimeUnit.SECONDS)           // TimeoutException if not done
    .completeOnTimeout(defaultUser, 5, TimeUnit.SECONDS);  // Default value

// Error handling patterns
CompletableFuture<Result> robustCall = CompletableFuture
    .supplyAsync(() -> callService())
    .handle((result, ex) -> {
        if (ex != null) {
            logger.error("Service call failed", ex);
            return Result.empty();
        }
        return result;
    });

// Custom executor (avoid common pool for I/O)
ExecutorService ioPool = Executors.newFixedThreadPool(20);
CompletableFuture.supplyAsync(() -> httpCall(), ioPool);

// Virtual Threads (Java 21+) — lightweight threads for I/O
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> futures = urls.stream()
        .map(url -> executor.submit(() -> fetchUrl(url)))
        .toList();
    // Millions of virtual threads — no pool sizing needed
}
```

---

## Keyword: Virtual Threads (Java 21+)

**Định nghĩa:** Lightweight threads managed by JVM — millions of concurrent threads cho I/O-bound workloads.

```java
// Platform thread: 1:1 mapping to OS thread (~1MB stack, expensive)
// Virtual thread: M:N mapping (many virtual → few platform), ~1KB stack

// Create virtual threads
Thread vt = Thread.ofVirtual().start(() -> {
    // Runs on virtual thread
    // When blocked (I/O, sleep) → unmounts from platform thread
    // Platform thread freed for other virtual threads
});

// Executor with virtual threads
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    // Submit 100,000 tasks — each gets own virtual thread
    IntStream.range(0, 100_000).forEach(i ->
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));  // Doesn't block platform thread!
            return fetchData(i);
        })
    );
}

// When to use virtual threads:
// ✅ I/O-bound: HTTP calls, database queries, file I/O
// ✅ High concurrency: thousands of concurrent connections
// ❌ CPU-bound: computation-heavy tasks (use platform threads)
// ❌ With synchronized blocks holding locks during I/O (pinning)

// Pinning — virtual thread stuck on platform thread:
// 1. Inside synchronized block (use ReentrantLock instead)
// 2. Inside native method
// -Djdk.tracePinnedThreads=full to detect

// Structured Concurrency (Preview, Java 21+)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<User> user = scope.fork(() -> findUser(id));
    Subtask<List<Order>> orders = scope.fork(() -> findOrders(id));

    scope.join();           // Wait for all
    scope.throwIfFailed();  // Propagate exceptions

    return new UserProfile(user.get(), orders.get());
}
// If any subtask fails → all others cancelled automatically
// Parent-child relationship: no leaked threads
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Java Memory Model | Visibility & ordering guarantees | Happens-before, volatile, reordering |
| synchronized | Monitor lock, mutual exclusion | Lock escalation, double-checked locking |
| Lock Framework | ReentrantLock, ReadWriteLock, StampedLock | tryLock, optimistic reading, Condition |
| Atomic & CAS | Lock-free operations | LongAdder for high contention, VarHandle |
| CompletableFuture | Composable async | allOf, handle, timeout, custom executor |
| Virtual Threads | Lightweight threads (Java 21+) | I/O-bound, pinning, structured concurrency |
