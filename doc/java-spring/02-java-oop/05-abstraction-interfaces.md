# Abstraction, Interfaces & Abstract Classes

## Tổng Quan

Abstraction là nền tảng thiết kế hệ thống — ẩn complexity, expose contract. Senior cần hiểu interface evolution (default methods, sealed interfaces), diamond problem, và khi nào dùng abstract class vs interface.

---

## Keyword: Interface Evolution (Java 8 → 21)

**Định nghĩa:** Interface trong Java đã tiến hóa từ pure contract thành powerful abstraction mechanism.

```java
// Java 1-7: Chỉ abstract methods + constants
public interface Drawable {
    void draw();  // implicitly public abstract
    int MAX_SIZE = 100;  // implicitly public static final
}

// Java 8: default methods + static methods
public interface Collection<E> {
    // Abstract
    boolean add(E e);
    int size();

    // Default — có implementation, subclass có thể override
    default boolean isEmpty() { return size() == 0; }

    default void forEach(Consumer<? super E> action) {
        for (E e : this) action.accept(e);
    }

    // Static — utility methods
    static <E> Collection<E> empty() { return Collections.emptyList(); }
}

// Java 9: private methods (helper cho default methods)
public interface Logger {
    void log(String message);

    default void logInfo(String msg) { log(format("INFO", msg)); }
    default void logError(String msg) { log(format("ERROR", msg)); }

    // Private helper — không visible cho implementors
    private String format(String level, String msg) {
        return "[" + level + "] " + LocalDateTime.now() + " " + msg;
    }
}

// Java 17: sealed interfaces
public sealed interface Shape permits Circle, Rectangle, Triangle {}
// Chỉ 3 classes được implement → compiler biết tất cả subtypes
// → Exhaustive switch không cần default

// Java 21: sealed + pattern matching = algebraic data types
double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t -> 0.5 * t.base() * t.height();
        // No default needed — exhaustive
    };
}
```

---

## Keyword: Diamond Problem & Default Method Conflicts

**Định nghĩa:** Khi class implement 2 interfaces có cùng default method — Java có rules rõ ràng để resolve.

```java
public interface A {
    default String hello() { return "A"; }
}

public interface B {
    default String hello() { return "B"; }
}

// ❌ Compile error: class inherits unrelated defaults
// public class C implements A, B { }

// ✅ Must override to resolve conflict
public class C implements A, B {
    @Override
    public String hello() {
        return A.super.hello();  // Explicitly choose A's implementation
        // Hoặc: return B.super.hello();
        // Hoặc: return "C's own implementation";
    }
}

// Resolution rules (JLS §9.4.1.3):
// 1. Class method wins over interface default
// 2. More specific interface wins (sub-interface > super-interface)
// 3. If ambiguous → must override

public interface Base {
    default String name() { return "Base"; }
}

public interface Sub extends Base {
    @Override
    default String name() { return "Sub"; }
}

public class MyClass implements Base, Sub {
    // Sub.name() wins — more specific (Sub extends Base)
    // myClass.name() → "Sub"
}
```

---

## Keyword: Abstract Class vs Interface — Decision Guide

**Định nghĩa:** Khi nào dùng cái nào — không chỉ về syntax mà về design intent.

```java
// Interface: DEFINES A CONTRACT (what to do)
// - "Can do" relationship: Comparable, Serializable, Runnable
// - Multiple inheritance of type
// - Evolve with default methods
// - Clients depend on interface, not implementation

// Abstract Class: SHARES IMPLEMENTATION (how to do)
// - "Is a" relationship with shared state
// - Template Method pattern
// - Constructor logic
// - Non-public members

// Real-world example: Spring Framework
// Interface: Repository<T, ID> — contract
// Abstract class: AbstractRepository — shared implementation
// Concrete: JpaRepository, MongoRepository — specific implementation

// Skeleton Implementation pattern (Effective Java)
// Interface + Abstract class = best of both worlds
public interface Vending<T> {
    void addItem(T item, int quantity);
    T dispense();
    int getStock();
}

// Abstract skeleton — implements common logic
public abstract class AbstractVending<T> implements Vending<T> {
    protected final Map<T, Integer> inventory = new LinkedHashMap<>();

    @Override
    public void addItem(T item, int quantity) {
        inventory.merge(item, quantity, Integer::sum);
    }

    @Override
    public int getStock() {
        return inventory.values().stream().mapToInt(Integer::intValue).sum();
    }

    // dispense() left abstract — subclass decides strategy
}

// Concrete implementations
public class FifoVending<T> extends AbstractVending<T> {
    @Override
    public T dispense() {
        var entry = inventory.entrySet().iterator().next();
        // FIFO logic...
    }
}

// Client code depends on interface Vending<T>
// Implementation can extend AbstractVending or implement Vending directly
```

---

## Keyword: Functional Interface & Lambda

**Định nghĩa:** Interface với đúng 1 abstract method — nền tảng của functional programming trong Java.

```java
// Built-in functional interfaces (java.util.function)
// Memorize these — dùng hàng ngày:

// Function<T, R>: T → R
Function<String, Integer> length = String::length;
Function<String, String> upper = String::toUpperCase;
Function<String, Integer> composed = upper.andThen(length);  // Compose

// Predicate<T>: T → boolean
Predicate<String> notEmpty = s -> !s.isEmpty();
Predicate<String> isEmail = s -> s.contains("@");
Predicate<String> validEmail = notEmpty.and(isEmail);  // Combine

// Consumer<T>: T → void
Consumer<String> print = System.out::println;
Consumer<String> log = s -> logger.info(s);
Consumer<String> both = print.andThen(log);  // Chain

// Supplier<T>: () → T
Supplier<LocalDateTime> now = LocalDateTime::now;
Supplier<UUID> uuid = UUID::randomUUID;

// UnaryOperator<T>: T → T (special Function)
UnaryOperator<String> trim = String::trim;

// BinaryOperator<T>: (T, T) → T (special BiFunction)
BinaryOperator<Integer> max = Integer::max;

// Primitive specializations — avoid autoboxing
IntFunction<String> intToString = Integer::toString;
ToIntFunction<String> parseInt = Integer::parseInt;
IntPredicate isPositive = i -> i > 0;
IntUnaryOperator doubleIt = i -> i * 2;

// Custom functional interface
@FunctionalInterface
public interface Validator<T> {
    ValidationResult validate(T target);

    default Validator<T> and(Validator<T> other) {
        return target -> {
            ValidationResult result = this.validate(target);
            return result.isValid() ? other.validate(target) : result;
        };
    }
}

// Compose validators
Validator<User> nameValidator = user ->
    user.getName().isBlank() ? ValidationResult.error("Name required") : ValidationResult.ok();
Validator<User> emailValidator = user ->
    !user.getEmail().contains("@") ? ValidationResult.error("Invalid email") : ValidationResult.ok();

Validator<User> fullValidator = nameValidator.and(emailValidator);
```

---

## Keyword: Sealed Types (Java 17+)

**Định nghĩa:** Restrict hierarchy — chỉ cho phép listed subtypes, enabling exhaustive pattern matching.

```java
// Sealed interface — algebraic data type
public sealed interface Result<T> permits Success, Failure, Loading {
    // Compiler knows ALL possible subtypes
}

public record Success<T>(T data) implements Result<T> {}
public record Failure<T>(String error, Exception cause) implements Result<T> {}
public record Loading<T>(int progress) implements Result<T> {}

// Exhaustive handling — compiler ensures all cases covered
public <T> String describe(Result<T> result) {
    return switch (result) {
        case Success<T> s -> "Data: " + s.data();
        case Failure<T> f -> "Error: " + f.error();
        case Loading<T> l -> "Loading: " + l.progress() + "%";
        // No default needed!
    };
}

// Sealed class hierarchy
public sealed abstract class Expression
    permits Literal, Add, Multiply, Negate {
}

public record Literal(double value) extends Expression {}
public record Add(Expression left, Expression right) extends Expression {}
public record Multiply(Expression left, Expression right) extends Expression {}
public record Negate(Expression operand) extends Expression {}

// Recursive evaluation with pattern matching
public double evaluate(Expression expr) {
    return switch (expr) {
        case Literal l -> l.value();
        case Add a -> evaluate(a.left()) + evaluate(a.right());
        case Multiply m -> evaluate(m.left()) * evaluate(m.right());
        case Negate n -> -evaluate(n.operand());
    };
}

// permits rules:
// - Permitted subtypes must be in same module (or same package if no module)
// - Each subtype must be: final, sealed, or non-sealed
//   final: no further extension
//   sealed: controlled further extension
//   non-sealed: open for extension (escape hatch)
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Interface Evolution | default, static, private methods | Java 8→21 progression, backward compatibility |
| Diamond Problem | Conflicting default methods | Resolution rules, explicit super call |
| Abstract vs Interface | Share implementation vs define contract | Skeleton Implementation pattern |
| Functional Interface | 1 abstract method, lambda target | Built-in types, composition, primitive specializations |
| Sealed Types | Restricted hierarchy (Java 17+) | Algebraic data types, exhaustive pattern matching |
