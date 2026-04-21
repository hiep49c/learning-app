# Polymorphism — Đa Hình

## Tổng Quan

Polymorphism là nguyên tắc OOP mạnh nhất — cho phép viết code generic hoạt động với nhiều types. Senior cần hiểu dispatch mechanisms, type erasure implications, và cách leverage polymorphism để thiết kế extensible systems.

---

## Keyword: Runtime Polymorphism (Dynamic Dispatch)

**Định nghĩa:** JVM chọn method implementation tại runtime dựa trên actual type của object.

```java
// Polymorphism cho phép Open/Closed Principle
public interface Notification {
    void send(String message, String recipient);
}

public class EmailNotification implements Notification {
    public void send(String message, String recipient) {
        // Send email
    }
}

public class SmsNotification implements Notification {
    public void send(String message, String recipient) {
        // Send SMS
    }
}

public class PushNotification implements Notification {
    public void send(String message, String recipient) {
        // Send push notification
    }
}

// NotificationService KHÔNG cần biết implementation cụ thể
// Thêm loại mới → thêm class, KHÔNG sửa service
public class NotificationService {
    private final List<Notification> channels;

    public void notifyAll(String message, String recipient) {
        for (Notification channel : channels) {
            channel.send(message, recipient);  // Dynamic dispatch
        }
    }
}

// Double Dispatch — khi cần dispatch dựa trên 2 types
// Java chỉ có single dispatch (dựa trên receiver type)
// Visitor Pattern giải quyết double dispatch:
public interface ShapeVisitor {
    double visit(Circle circle);
    double visit(Rectangle rectangle);
    double visit(Triangle triangle);
}

public interface Shape {
    double accept(ShapeVisitor visitor);  // First dispatch: Shape type
}

public class Circle implements Shape {
    private final double radius;
    public double accept(ShapeVisitor visitor) {
        return visitor.visit(this);  // Second dispatch: visitor.visit(Circle)
    }
}

public class AreaCalculator implements ShapeVisitor {
    public double visit(Circle c) { return Math.PI * c.getRadius() * c.getRadius(); }
    public double visit(Rectangle r) { return r.getWidth() * r.getHeight(); }
    public double visit(Triangle t) { return 0.5 * t.getBase() * t.getHeight(); }
}

// Java 21+ — Pattern matching thay thế Visitor trong nhiều trường hợp
double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.getRadius() * c.getRadius();
        case Rectangle r -> r.getWidth() * r.getHeight();
        case Triangle t -> 0.5 * t.getBase() * t.getHeight();
    };
}
```

---

## Keyword: Covariant Return Types

**Định nghĩa:** Override method có thể return subtype của original return type — hữu ích cho fluent APIs.

```java
public class Animal {
    public Animal create() {
        return new Animal();
    }
}

public class Dog extends Animal {
    @Override
    public Dog create() {  // Covariant return: Dog thay vì Animal
        return new Dog();
    }
}

// Ứng dụng: Builder pattern với inheritance
public abstract class AbstractBuilder<T extends AbstractBuilder<T>> {
    protected String name;

    @SuppressWarnings("unchecked")
    protected T self() { return (T) this; }

    public T name(String name) {
        this.name = name;
        return self();  // Return concrete builder type
    }
}

public class UserBuilder extends AbstractBuilder<UserBuilder> {
    private String email;

    public UserBuilder email(String email) {
        this.email = email;
        return this;
    }

    public User build() { return new User(name, email); }
}

// Fluent chain không bị "lose type"
User user = new UserBuilder()
    .name("An")      // Returns UserBuilder (not AbstractBuilder)
    .email("an@x.com")  // Available because type preserved
    .build();
```

---

## Keyword: Type Erasure & Polymorphism

**Định nghĩa:** Generics bị erase tại runtime — ảnh hưởng đến polymorphism với generic types.

```java
// Type erasure: List<String> và List<Integer> cùng là List tại runtime
List<String> strings = new ArrayList<>();
List<Integer> ints = new ArrayList<>();
strings.getClass() == ints.getClass();  // true! Cả hai là ArrayList

// Không thể overload dựa trên generic type
// ❌ Compile error: same erasure
// public void process(List<String> strings) { }
// public void process(List<Integer> ints) { }

// Bridge methods — compiler tạo để maintain polymorphism sau erasure
public interface Comparable<T> {
    int compareTo(T other);
}

public class MyString implements Comparable<MyString> {
    @Override
    public int compareTo(MyString other) { return 0; }
    // Compiler tạo bridge method:
    // public int compareTo(Object other) { return compareTo((MyString) other); }
}

// Reifiable vs Non-reifiable types
// Reifiable: type info available at runtime (primitives, raw types, unbounded wildcards)
// Non-reifiable: type info erased (List<String>, T, ? extends Number)

// instanceof với generics
// ❌ if (obj instanceof List<String>) { }  // Compile error
// ✅ if (obj instanceof List<?>) { }       // OK — unbounded wildcard
// ✅ if (obj instanceof List<?> list && !list.isEmpty()
//        && list.get(0) instanceof String) { }  // Runtime check elements

// Super Type Token pattern — preserve generic type info
// Dùng trong: Jackson TypeReference, Spring ParameterizedTypeReference
abstract class TypeReference<T> {
    private final Type type;
    protected TypeReference() {
        Type superclass = getClass().getGenericSuperclass();
        this.type = ((ParameterizedType) superclass).getActualTypeArguments()[0];
    }
    public Type getType() { return type; }
}

// Usage: anonymous subclass captures type argument
TypeReference<List<String>> ref = new TypeReference<>() {};
ref.getType();  // java.util.List<java.lang.String> — preserved!
```

---

## Keyword: Ad-hoc Polymorphism (Method Overloading)

**Định nghĩa:** Compile-time polymorphism — compiler chọn method dựa trên static type, KHÔNG phải runtime type.

```java
public class Dispatcher {
    public String dispatch(Object obj) { return "Object"; }
    public String dispatch(String str) { return "String"; }
    public String dispatch(Integer num) { return "Integer"; }
}

Dispatcher d = new Dispatcher();
Object obj = "hello";
d.dispatch(obj);      // "Object"! Không phải "String"
// Vì overloading resolved tại COMPILE TIME dựa trên declared type (Object)

// Nếu cần runtime dispatch dựa trên argument type:
// Pattern 1: instanceof chain (simple but not extensible)
public String dispatch(Object obj) {
    if (obj instanceof String s) return "String: " + s;
    if (obj instanceof Integer i) return "Integer: " + i;
    return "Object: " + obj;
}

// Pattern 2: Visitor pattern (extensible)
// Pattern 3: Map<Class, Handler> (flexible)
private final Map<Class<?>, Function<Object, String>> handlers = Map.of(
    String.class, obj -> "String: " + obj,
    Integer.class, obj -> "Integer: " + obj
);

public String dispatch(Object obj) {
    return handlers.getOrDefault(obj.getClass(), o -> "Unknown: " + o).apply(obj);
}

// Pattern 4: Pattern matching switch (Java 21+)
public String dispatch(Object obj) {
    return switch (obj) {
        case String s -> "String: " + s;
        case Integer i -> "Integer: " + i;
        default -> "Object: " + obj;
    };
}
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Runtime Polymorphism | Dynamic dispatch dựa trên actual type | Double dispatch, Visitor, pattern matching |
| Covariant Return Types | Override return subtype | Fluent builder with inheritance |
| Type Erasure | Generic info erased at runtime | Bridge methods, reifiable types, TypeReference |
| Ad-hoc Polymorphism | Overloading = compile-time resolution | Static type dispatch, runtime alternatives |
