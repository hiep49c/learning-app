# Generics — Kiểu Tổng Quát

## Tổng Quan

Generics cung cấp compile-time type safety cho collections và APIs. Senior cần hiểu type erasure implications, PECS principle, recursive type bounds, và type token patterns.

---

## Keyword: Type Erasure — Deep Dive

**Định nghĩa:** Compiler xóa generic type info, thay bằng bounds (hoặc Object) — generics chỉ tồn tại tại compile time.

```java
// Compiler transforms:
List<String> list = new ArrayList<>();
list.add("hello");
String s = list.get(0);

// Thành (sau erasure):
List list = new ArrayList();
list.add("hello");
String s = (String) list.get(0);  // Compiler insert cast

// Erasure rules:
// T → Object (unbounded)
// T extends Comparable → Comparable (bounded)
// T extends Comparable & Serializable → Comparable (first bound)

// Consequences:
// 1. Cannot use instanceof with generic type
// if (obj instanceof List<String>) { }  // ERROR
if (obj instanceof List<?>) { }          // OK

// 2. Cannot create generic array
// T[] arr = new T[10];  // ERROR
// List<String>[] arr = new List<String>[10];  // ERROR
@SuppressWarnings("unchecked")
T[] arr = (T[]) new Object[10];  // Workaround (unsafe)

// 3. Cannot use primitives
// List<int> nums;  // ERROR — must use List<Integer>

// 4. Static fields cannot use class type parameter
public class Box<T> {
    // static T value;  // ERROR — T is per-instance, static is per-class
    static Object value;  // OK
}

// 5. Cannot overload by generic type
// void process(List<String> s) { }
// void process(List<Integer> i) { }  // ERROR: same erasure

// Bridge methods — maintain polymorphism after erasure
public interface Comparable<T> {
    int compareTo(T o);
}
public class MyInt implements Comparable<MyInt> {
    public int compareTo(MyInt o) { return 0; }
    // Compiler generates bridge:
    // public int compareTo(Object o) { return compareTo((MyInt) o); }
}
```

---

## Keyword: PECS — Producer Extends, Consumer Super

**Định nghĩa:** Wildcard guideline: dùng `? extends T` khi đọc (produce), `? super T` khi ghi (consume).

```java
// Producer Extends — đọc items từ collection
public double sum(List<? extends Number> numbers) {
    double total = 0;
    for (Number n : numbers) {  // Đọc as Number ✓
        total += n.doubleValue();
    }
    // numbers.add(1);  // ERROR! Cannot add — compiler không biết exact type
    return total;
}
sum(List.of(1, 2, 3));        // List<Integer> ✓
sum(List.of(1.5, 2.5));       // List<Double> ✓

// Consumer Super — ghi items vào collection
public void addNumbers(List<? super Integer> list) {
    list.add(1);     // Ghi Integer ✓
    list.add(2);
    // Integer n = list.get(0);  // ERROR! get() returns Object
    Object obj = list.get(0);    // Chỉ đọc as Object
}
addNumbers(new ArrayList<Integer>());  // ✓
addNumbers(new ArrayList<Number>());   // ✓
addNumbers(new ArrayList<Object>());   // ✓

// Real-world PECS: Collections.copy
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    // src: producer (đọc) → extends
    // dest: consumer (ghi) → super
    for (int i = 0; i < src.size(); i++) {
        dest.set(i, src.get(i));
    }
}

// Comparable/Comparator luôn dùng super
// ❌
public static <T extends Comparable<T>> T max(List<T> list) { }
// ✅ Flexible hơn — chấp nhận Comparable của supertype
public static <T extends Comparable<? super T>> T max(List<? extends T> list) { }
// Ví dụ: ScheduledFuture extends Delayed extends Comparable<Delayed>
// max(List<ScheduledFuture>) cần Comparable<? super ScheduledFuture>

// Capture helper — khi cần "capture" wildcard type
public void swap(List<?> list, int i, int j) {
    swapHelper(list, i, j);  // Delegate to capture wildcard
}
private <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

---

## Keyword: Recursive Type Bounds

**Định nghĩa:** Type parameter tham chiếu đến chính nó — pattern cho self-referential types.

```java
// Pattern: <T extends Comparable<T>>
// "T là kiểu có thể so sánh với chính nó"
public static <T extends Comparable<T>> T max(Collection<T> collection) {
    T result = null;
    for (T element : collection) {
        if (result == null || element.compareTo(result) > 0) {
            result = element;
        }
    }
    return result;
}

// Builder pattern với self-type
public abstract class Builder<T extends Builder<T>> {
    protected String name;

    @SuppressWarnings("unchecked")
    protected T self() { return (T) this; }

    public T name(String name) {
        this.name = name;
        return self();
    }
}

public class UserBuilder extends Builder<UserBuilder> {
    private String email;
    public UserBuilder email(String email) { this.email = email; return this; }
    public User build() { return new User(name, email); }
}

// Chain preserves concrete type:
new UserBuilder().name("An").email("an@x.com").build();
// name() returns UserBuilder (not Builder) → email() available

// Enum self-type: Enum<E extends Enum<E>>
// Mọi enum implicitly: public final class Color extends Enum<Color>
// Cho phép: Comparable<Color>, valueOf(Color.class, "RED")
```

---

## Keyword: Type Tokens & Super Type Tokens

**Định nghĩa:** Patterns để preserve generic type info tại runtime — vượt qua type erasure.

```java
// Simple type token — Class<T>
public <T> T deserialize(String json, Class<T> type) {
    // type.getName() available at runtime
    return objectMapper.readValue(json, type);
}
String user = deserialize(jsonStr, String.class);

// Problem: Class<T> không capture generic parameters
// deserialize(json, List.class) → List (raw), không phải List<String>

// Super Type Token — capture full generic type
// Pattern từ Neal Gafter, dùng trong Jackson, Spring, Guice
public abstract class TypeReference<T> {
    private final Type type;

    protected TypeReference() {
        Type superclass = getClass().getGenericSuperclass();
        this.type = ((ParameterizedType) superclass).getActualTypeArguments()[0];
    }

    public Type getType() { return type; }
}

// Usage — anonymous subclass captures type argument
TypeReference<List<String>> ref = new TypeReference<>() {};
ref.getType();  // java.util.List<java.lang.String>

// Jackson usage:
List<User> users = objectMapper.readValue(json, new TypeReference<List<User>>() {});

// Spring usage:
ResponseEntity<List<User>> response = restTemplate.exchange(
    url, HttpMethod.GET, null,
    new ParameterizedTypeReference<List<User>>() {}
);

// Tại sao hoạt động?
// Anonymous class: new TypeReference<List<String>>() {}
// Compiler lưu generic superclass info trong bytecode (Signature attribute)
// getGenericSuperclass() đọc info này tại runtime
// → Type parameter KHÔNG bị erase cho class declarations, chỉ erase cho local usage
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Type Erasure | Generic info removed at runtime | Bridge methods, cannot instanceof/new T[] |
| PECS | Producer Extends, Consumer Super | Comparable<? super T>, capture helper |
| Recursive Type Bounds | T extends Comparable<T> | Self-type builder, Enum<E extends Enum<E>> |
| Type Tokens | Preserve generic type at runtime | Super Type Token, Jackson TypeReference |
