# Annotations & Reflection — Deep Dive

## Tổng Quan

Annotations và Reflection là nền tảng của Spring Framework, Hibernate, Jackson, và hầu hết Java frameworks. Senior cần hiểu annotation processing pipeline, reflection performance, và cách frameworks dùng chúng.

---

## Keyword: Annotation Processing Pipeline

**Định nghĩa:** Annotations được xử lý ở 3 giai đoạn: compile-time (APT), class-loading, và runtime (reflection).

```java
// @Retention xác định khi nào annotation tồn tại:

// SOURCE — chỉ trong source code, compiler xóa
// Dùng cho: code generation, lint checks
@Retention(RetentionPolicy.SOURCE)
public @interface Generated { }  // Lombok @Getter, @Setter

// CLASS — trong .class file, nhưng JVM không load
// Dùng cho: bytecode analysis tools
@Retention(RetentionPolicy.CLASS)  // Default nếu không chỉ định
public @interface NonNull { }

// RUNTIME — tồn tại tại runtime, đọc được qua reflection
// Dùng cho: Spring, Hibernate, Jackson, JUnit
@Retention(RetentionPolicy.RUNTIME)
public @interface Service { }

// Compile-time annotation processing (APT):
// javax.annotation.processing.AbstractProcessor
// Chạy trong compiler → generate source code
// Ví dụ: Lombok, MapStruct, Dagger, AutoValue

// Lombok @Getter generates:
@Getter
public class User {
    private String name;
}
// APT generates bytecode for:
// public String getName() { return this.name; }

// Runtime annotation processing:
// Spring scans classpath → find @Component, @Service, etc.
// Hibernate reads @Entity, @Column → build mapping
// Jackson reads @JsonProperty → configure serialization
```

---

## Keyword: Custom Annotation Design

**Định nghĩa:** Thiết kế annotation cho framework/library — meta-annotations, repeatable, inherited.

```java
// Full-featured custom annotation
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
@Documented  // Include in Javadoc
@Inherited   // Subclass inherits this annotation
public @interface Cacheable {
    String value() default "";           // Cache name
    long ttl() default 300;              // TTL in seconds
    String key() default "";             // SpEL expression for cache key
    String condition() default "";       // Conditional caching
    Class<? extends CacheResolver> resolver() default DefaultCacheResolver.class;
}

// Usage:
@Cacheable(value = "users", ttl = 600, key = "#id")
public User findById(Long id) { }

// Repeatable annotation (Java 8+)
@Repeatable(Schedules.class)
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Schedule {
    String cron();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Schedules {
    Schedule[] value();
}

// Usage:
@Schedule(cron = "0 0 * * *")
@Schedule(cron = "0 12 * * *")
public void cleanup() { }

// Composed annotation (meta-annotation pattern)
// Spring uses this extensively
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Service                    // Meta-annotation
@Transactional              // Meta-annotation
public @interface TransactionalService {
    // Combines @Service + @Transactional
}

@TransactionalService  // = @Service + @Transactional
public class OrderService { }
```

---

## Keyword: Reflection — Performance & Alternatives

**Định nghĩa:** Reflection cho phép inspect/modify code tại runtime — powerful nhưng có performance cost.

```java
// Reflection performance cost:
// 1. No JIT optimization (cannot inline reflective calls)
// 2. Security checks on every access
// 3. Boxing/unboxing for primitive parameters
// 4. Array creation for varargs

// Benchmark: direct call vs reflection
// Direct: ~1-2 ns
// Reflection (first call): ~1000 ns
// Reflection (cached Method): ~50-100 ns
// MethodHandle: ~5-10 ns

// Optimization 1: Cache Method/Field objects
// ❌ Slow: lookup every time
for (Object obj : objects) {
    Method m = obj.getClass().getMethod("getName");
    m.invoke(obj);
}

// ✅ Fast: cache Method object
Method getName = User.class.getMethod("getName");
getName.setAccessible(true);  // Skip access checks → faster
for (Object obj : objects) {
    getName.invoke(obj);
}

// Optimization 2: MethodHandle (Java 7+)
// Closer to direct call performance, JIT can optimize
MethodHandles.Lookup lookup = MethodHandles.lookup();
MethodHandle mh = lookup.findVirtual(User.class, "getName",
    MethodType.methodType(String.class));

for (Object obj : objects) {
    String name = (String) mh.invoke(obj);  // Near-direct-call speed
}

// Optimization 3: LambdaMetafactory — fastest reflective access
// Generate lambda at runtime that calls method directly
MethodHandle mh = lookup.findVirtual(User.class, "getName",
    MethodType.methodType(String.class));

CallSite site = LambdaMetafactory.metafactory(
    lookup, "apply", MethodType.methodType(Function.class),
    MethodType.methodType(Object.class, Object.class),
    mh, MethodType.methodType(String.class, User.class)
);

@SuppressWarnings("unchecked")
Function<User, String> getter = (Function<User, String>) site.getTarget().invokeExact();
// getter.apply(user) → same speed as user.getName()

// Spring Framework uses this approach for property access
// → Reflection overhead only at startup, not at runtime

// Module system restrictions (Java 9+):
// Reflection on non-exported packages → IllegalAccessException
// Fix: --add-opens module/package=ALL-UNNAMED
// Or: opens package in module-info.java
```

---

## Keyword: Dynamic Proxy

**Định nghĩa:** Tạo proxy object tại runtime implement interfaces — nền tảng của Spring AOP.

```java
// JDK Dynamic Proxy — chỉ cho interfaces
public interface UserService {
    User findById(Long id);
    void save(User user);
}

// InvocationHandler — intercept mọi method call
InvocationHandler handler = (proxy, method, args) -> {
    long start = System.nanoTime();
    try {
        Object result = method.invoke(realService, args);  // Call real method
        return result;
    } finally {
        long duration = System.nanoTime() - start;
        logger.info("{} took {} ms", method.getName(), duration / 1_000_000.0);
    }
};

UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    handler
);

proxy.findById(1L);  // Intercepted → logged → delegated to real service

// CGLIB Proxy — cho classes (không cần interface)
// Spring dùng CGLIB khi target không implement interface
// Tạo subclass tại runtime → override methods
// Limitation: cannot proxy final classes/methods

// Spring AOP uses:
// JDK Proxy: khi bean implement interface
// CGLIB: khi bean không implement interface
// spring.aop.proxy-target-class=true → force CGLIB cho tất cả

// Practical use cases:
// 1. Logging/Monitoring (cross-cutting concern)
// 2. Transaction management (@Transactional)
// 3. Security checks (@PreAuthorize)
// 4. Caching (@Cacheable)
// 5. Retry logic (@Retryable)
// 6. Lazy loading (Hibernate entity proxies)
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Annotation Processing | SOURCE → CLASS → RUNTIME pipeline | APT (Lombok), runtime (Spring), meta-annotations |
| Custom Annotation | @interface with meta-annotations | Repeatable, composed, inherited |
| Reflection Performance | ~50-100x slower than direct call | Cache Method, MethodHandle, LambdaMetafactory |
| Dynamic Proxy | Runtime interface implementation | JDK Proxy vs CGLIB, Spring AOP foundation |
