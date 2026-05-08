# Spring AOP — Deep Dive

## Tổng Quan

AOP tách cross-cutting concerns khỏi business logic. Senior cần hiểu proxy mechanism, pointcut expressions, advice ordering, và self-invocation trap.

---

## Keyword: AOP Proxy Mechanism

**Định nghĩa:** Spring AOP dùng runtime proxies — JDK Dynamic Proxy hoặc CGLIB.

```java
// JDK Dynamic Proxy: target implements interface
// → Proxy implements same interface, delegates to target
// Limitation: chỉ intercept interface methods

// CGLIB Proxy: target không implement interface
// → Proxy extends target class, override methods
// Limitation: cannot proxy final classes/methods

// Spring Boot default: CGLIB cho tất cả (spring.aop.proxy-target-class=true)

// Self-invocation trap — BUG PHỔ BIẾN NHẤT với AOP
@Service
public class UserService {
    @Transactional
    public void createUser(User user) {
        userRepo.save(user);
        sendWelcomeEmail(user);  // ⚠️ Self-invocation!
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendWelcomeEmail(User user) {
        // @Transactional KHÔNG hoạt động!
        // Vì gọi trực tiếp this.sendWelcomeEmail()
        // Proxy bị bypass → AOP advice không chạy
    }
}

// Tại sao? Proxy wraps target:
// Client → Proxy.createUser() → Target.createUser()
//                                  → Target.sendWelcomeEmail() ← direct call, no proxy!

// Fix 1: Inject self (circular, cần @Lazy)
@Service
public class UserService {
    @Lazy @Autowired private UserService self;

    public void createUser(User user) {
        userRepo.save(user);
        self.sendWelcomeEmail(user);  // Goes through proxy ✓
    }
}

// Fix 2: Extract to separate service
@Service
public class EmailService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendWelcomeEmail(User user) { }
}

// Fix 3: ApplicationContext.getBean()
// Fix 4: AopContext.currentProxy() (cần exposeProxy=true)
```

---

## Keyword: Pointcut Expressions — Advanced

**Định nghĩa:** Pointcut language xác định WHERE advice applies — execution, annotation, within, args.

```java
// execution — most common, match method execution
@Pointcut("execution(public * com.example.service.*.*(..))")
// Breakdown:
// public — access modifier (optional)
// * — any return type
// com.example.service.* — any class in package
// .* — any method
// (..) — any parameters

// Wildcards:
// * — matches any single element
// .. — matches any number of elements (packages or parameters)
// + — matches subclasses

// Examples:
@Pointcut("execution(* save*(..))") // Any method starting with "save"
@Pointcut("execution(* *(.., String))") // Last param is String
@Pointcut("execution(* com.example..*.*(..))") // Any method in com.example and sub-packages

// @annotation — match methods with specific annotation
@Pointcut("@annotation(com.example.Loggable)")
// Matches any method annotated with @Loggable

// @within — match all methods in class with annotation
@Pointcut("@within(org.springframework.stereotype.Service)")
// All methods in @Service classes

// within — match all methods in class/package
@Pointcut("within(com.example.service..*)")
// All methods in service package and sub-packages

// args — match by parameter types (runtime check)
@Pointcut("args(String, ..)")
// Methods where first arg is String at runtime

// Combining pointcuts
@Pointcut("serviceLayer() && !execution(* toString())")
@Pointcut("execution(* *(..)) && @annotation(transactional)")

// Binding annotations to advice parameters
@Around("@annotation(cacheable)")
public Object cache(ProceedingJoinPoint pjp, Cacheable cacheable) throws Throwable {
    String cacheName = cacheable.value();
    long ttl = cacheable.ttl();
    // Use annotation attributes
    String key = generateKey(pjp, cacheable.key());
    Object cached = cacheManager.get(cacheName, key);
    if (cached != null) return cached;
    Object result = pjp.proceed();
    cacheManager.put(cacheName, key, result, ttl);
    return result;
}
```

---

## Keyword: Advice Ordering & @Transactional Internals

**Định nghĩa:** Khi nhiều aspects apply cùng method — thứ tự quan trọng.

```java
// Advice execution order (same join point):
// @Around (before proceed) → @Before → Method → @AfterReturning → @After → @Around (after proceed)

// Multiple aspects — order by @Order
@Aspect
@Order(1)  // Lower = higher priority = runs first (outer)
public class SecurityAspect { }

@Aspect
@Order(2)  // Runs second (inner)
public class LoggingAspect { }

// Execution: Security.before → Logging.before → Method → Logging.after → Security.after
// Like onion layers: outer aspect wraps inner aspect

// @Transactional internals:
// Spring creates TransactionInterceptor (AOP advice)
// Before method: begin transaction
// After method success: commit
// After method exception: rollback (for unchecked exceptions by default)

@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // TransactionInterceptor:
    // 1. Get PlatformTransactionManager
    // 2. Begin transaction (or join existing)
    // 3. Execute method
    // 4. If RuntimeException/Error → rollback
    // 5. If checked exception → commit (default!)
    // 6. If success → commit
}

// ⚠️ Checked exceptions DON'T trigger rollback by default!
@Transactional(rollbackFor = Exception.class)  // Rollback for ALL exceptions
public void riskyOperation() throws IOException { }

// Propagation levels:
// REQUIRED (default): join existing or create new
// REQUIRES_NEW: always create new (suspend existing)
// NESTED: savepoint within existing transaction
// SUPPORTS: join if exists, non-transactional if not
// NOT_SUPPORTED: suspend existing, run non-transactional
// MANDATORY: must have existing, throw if not
// NEVER: throw if transaction exists
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| AOP Proxy | JDK Dynamic Proxy vs CGLIB | Self-invocation trap, proxy bypass |
| Pointcut Expressions | execution, @annotation, within, args | Combining, binding annotation params |
| Advice Ordering | @Order for multiple aspects | Onion layers, @Transactional internals, rollback rules |
