# Inheritance — Kế Thừa

## Tổng Quan

Inheritance là cơ chế tái sử dụng code mạnh mẽ nhưng dễ bị lạm dụng. Senior cần hiểu vtable dispatch, fragile base class problem, Liskov Substitution Principle, và khi nào dùng composition thay vì inheritance.

---

## Keyword: Virtual Method Dispatch (vtable)

**Định nghĩa:** JVM dùng virtual method table để resolve method call tại runtime — nền tảng của polymorphism.

```java
// Mỗi class có một vtable (virtual method table) trong Metaspace
// vtable = array of method pointers, indexed by method slot

// Ví dụ:
class Animal {
    void eat() { }    // vtable slot 0
    void sleep() { }  // vtable slot 1
}

class Dog extends Animal {
    @Override
    void eat() { }    // Override → vtable slot 0 trỏ đến Dog.eat
    void bark() { }   // New method → vtable slot 2
    // sleep() kế thừa → vtable slot 1 vẫn trỏ đến Animal.sleep
}

// Dog vtable:
// [0] → Dog.eat (overridden)
// [1] → Animal.sleep (inherited)
// [2] → Dog.bark (new)

// invokevirtual bytecode:
Animal a = new Dog();
a.eat();
// 1. Load object reference
// 2. Get vtable from object's class pointer
// 3. Lookup method at slot 0
// 4. Call Dog.eat()

// JIT optimization — devirtualization:
// Nếu JIT detect chỉ có 1 implementation → inline trực tiếp
// Monomorphic call site: 1 type → direct call (fastest)
// Bimorphic: 2 types → conditional + direct calls
// Megamorphic: 3+ types → vtable lookup (slowest)

// → final methods và final classes giúp JIT optimize tốt hơn
// → private methods dùng invokespecial (không virtual dispatch)
```

---

## Keyword: Fragile Base Class Problem

**Định nghĩa:** Thay đổi base class có thể break subclasses theo cách không lường trước — lý do chính để ưu tiên composition.

```java
// Ví dụ kinh điển từ Effective Java:
public class InstrumentedHashSet<E> extends HashSet<E> {
    private int addCount = 0;

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);  // ⚠️ HashSet.addAll() gọi add() cho mỗi element!
    }

    public int getAddCount() { return addCount; }
}

InstrumentedHashSet<String> s = new InstrumentedHashSet<>();
s.addAll(List.of("a", "b", "c"));
s.getAddCount();  // 6! (không phải 3)
// addAll: addCount += 3 (= 3)
// super.addAll() gọi this.add() 3 lần: addCount += 3 (= 6)

// Vấn đề: subclass phụ thuộc vào implementation detail của base class
// Nếu HashSet thay đổi addAll() implementation → subclass break

// ✅ Fix: Composition (Decorator pattern)
public class InstrumentedSet<E> implements Set<E> {
    private final Set<E> delegate;  // Composition
    private int addCount = 0;

    public InstrumentedSet(Set<E> delegate) {
        this.delegate = delegate;
    }

    @Override
    public boolean add(E e) {
        addCount++;
        return delegate.add(e);  // Delegate, không super
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return delegate.addAll(c);  // Delegate — không bị double-count
    }

    // Delegate tất cả methods khác...
    @Override public int size() { return delegate.size(); }
    @Override public boolean contains(Object o) { return delegate.contains(o); }
    // ...
}
```

---

## Keyword: Composition over Inheritance

**Định nghĩa:** Ưu tiên "has-a" (composition) hơn "is-a" (inheritance) — linh hoạt hơn, ít coupling hơn.

```java
// Khi nào dùng Inheritance:
// 1. Thực sự là quan hệ "is-a" (Dog IS-A Animal)
// 2. Base class được thiết kế cho inheritance (documented, tested)
// 3. Không vi phạm LSP (Liskov Substitution Principle)

// Khi nào dùng Composition:
// 1. "has-a" hoặc "uses-a" relationship
// 2. Cần thay đổi behavior tại runtime
// 3. Cần combine behaviors từ nhiều sources
// 4. Base class không được thiết kế cho inheritance

// Strategy Pattern — composition cho swappable behavior
public class PaymentProcessor {
    private final PaymentStrategy strategy;  // Composition

    public PaymentProcessor(PaymentStrategy strategy) {
        this.strategy = strategy;
    }

    public void process(Order order) {
        strategy.pay(order.getTotal());
    }
}

// Có thể thay đổi strategy tại runtime
PaymentProcessor processor = new PaymentProcessor(new CreditCardPayment());
// Sau đó: new PaymentProcessor(new PayPalPayment())

// Decorator Pattern — composition cho layered behavior
public interface Logger {
    void log(String message);
}

public class ConsoleLogger implements Logger {
    public void log(String message) { System.out.println(message); }
}

public class TimestampLogger implements Logger {
    private final Logger delegate;  // Wrap another logger
    public TimestampLogger(Logger delegate) { this.delegate = delegate; }
    public void log(String message) {
        delegate.log("[" + Instant.now() + "] " + message);
    }
}

public class AsyncLogger implements Logger {
    private final Logger delegate;
    private final ExecutorService executor;
    public void log(String message) {
        executor.submit(() -> delegate.log(message));
    }
}

// Combine behaviors — không thể làm với inheritance
Logger logger = new AsyncLogger(new TimestampLogger(new ConsoleLogger()));

// Mixin via interfaces with default methods (Java 8+)
public interface Auditable {
    default void audit(String action) {
        AuditLog.record(this.getClass().getSimpleName(), action);
    }
}

public interface Cacheable {
    default String cacheKey() {
        return this.getClass().getSimpleName() + ":" + this.hashCode();
    }
}

// Class "mixin" multiple behaviors
public class UserService implements Auditable, Cacheable {
    // Có cả audit() và cacheKey() mà không cần inheritance
}
```

---

## Keyword: Designing for Inheritance

**Định nghĩa:** Nếu class được thiết kế để extend, phải document rõ ràng và test kỹ.

```java
// Effective Java Item 19: Design and document for inheritance or else prohibit it

// Rules cho class designed for inheritance:
// 1. Document self-use patterns
/**
 * {@inheritDoc}
 * <p>Implementation note: this method calls {@link #validate()} before saving.
 * Subclasses overriding validate() will affect save() behavior.</p>
 */
public void save(Entity entity) {
    validate(entity);  // Documented self-use
    doSave(entity);
}

// 2. Provide hooks (protected methods) thay vì force override
protected void beforeSave(Entity entity) { }  // Hook — subclass có thể override
protected void afterSave(Entity entity) { }

// 3. Template Method Pattern
public abstract class AbstractRepository<T> {
    // Template method — defines algorithm skeleton
    public final T save(T entity) {  // final — subclass không thể thay đổi flow
        validate(entity);
        beforeSave(entity);
        T saved = doSave(entity);  // Abstract — subclass implement
        afterSave(saved);
        return saved;
    }

    protected abstract T doSave(T entity);  // Subclass must implement
    protected void validate(T entity) { }   // Optional hook
    protected void beforeSave(T entity) { } // Optional hook
    protected void afterSave(T entity) { }  // Optional hook
}

// 4. Nếu KHÔNG thiết kế cho inheritance → đánh dấu final
public final class String { }      // Cannot extend
public final class Integer { }     // Cannot extend
// Hoặc: package-private constructor → chỉ extend trong cùng package
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Virtual Method Dispatch | vtable lookup tại runtime | Mono/bi/megamorphic, JIT devirtualization |
| Fragile Base Class | Base class change breaks subclass | InstrumentedHashSet example, self-use dependency |
| Composition over Inheritance | has-a > is-a | Strategy, Decorator, runtime flexibility |
| Designing for Inheritance | Document or prohibit | Template Method, hooks, final class |
