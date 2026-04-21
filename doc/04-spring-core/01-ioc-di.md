# Spring IoC & Dependency Injection — Deep Dive

## Tổng Quan

IoC Container là trái tim của Spring — quản lý object lifecycle, dependency wiring, và configuration. Senior cần hiểu container internals, bean resolution algorithm, circular dependency handling, và advanced DI patterns.

---

## Keyword: IoC Container Internals

**Định nghĩa:** Spring Container = BeanFactory + ApplicationContext — quản lý bean definitions, instantiation, wiring, và lifecycle.

```java
// Container startup sequence:
// 1. Load bean definitions (XML, annotations, Java config)
// 2. BeanFactoryPostProcessor — modify bean definitions
//    Ví dụ: PropertySourcesPlaceholderConfigurer resolve ${...}
// 3. Instantiate beans (constructor)
// 4. Populate properties (setter injection, field injection)
// 5. BeanPostProcessor.postProcessBeforeInitialization
//    Ví dụ: @Autowired resolution, @Value resolution
// 6. InitializingBean.afterPropertiesSet() / @PostConstruct
// 7. BeanPostProcessor.postProcessAfterInitialization
//    Ví dụ: AOP proxy creation, @Async proxy
// 8. Bean ready to use
// ...
// 9. @PreDestroy / DisposableBean.destroy()
// 10. Container shutdown

// BeanFactory vs ApplicationContext:
// BeanFactory: lazy initialization, basic DI
// ApplicationContext: eager initialization + events + i18n + AOP + ...
// → Luôn dùng ApplicationContext trong production

// Bean Definition:
// - Class name
// - Scope (singleton, prototype, request, session)
// - Constructor arguments
// - Property values
// - Init/destroy methods
// - Dependencies (autowire candidates)

// Component scanning:
@ComponentScan(
    basePackages = "com.example",
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.example\\.internal\\..*"
    )
)
// Scans classpath → finds @Component, @Service, @Repository, @Controller
// Creates BeanDefinition for each → registers in container
```

---

## Keyword: Dependency Injection — Advanced Patterns

**Định nghĩa:** Ngoài basic constructor/setter/field injection, Spring hỗ trợ nhiều patterns phức tạp.

```java
// 1. Constructor Injection — BEST PRACTICE
@Service
public class OrderService {
    private final OrderRepository repository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    // Single constructor → @Autowired implicit (Spring 4.3+)
    public OrderService(OrderRepository repository,
                        PaymentService paymentService,
                        NotificationService notificationService) {
        this.repository = repository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }
}
// Advantages: immutable (final), testable, explicit dependencies
// Disadvantage: many parameters → consider refactoring (SRP violation?)

// 2. Optional Dependencies
@Service
public class ReportService {
    private final DataSource dataSource;
    private final CacheManager cacheManager;  // Optional

    public ReportService(DataSource dataSource,
                         @Autowired(required = false) CacheManager cacheManager) {
        this.dataSource = dataSource;
        this.cacheManager = cacheManager;  // null if no CacheManager bean
    }

    // Hoặc dùng Optional
    public ReportService(DataSource dataSource, Optional<CacheManager> cacheManager) {
        this.dataSource = dataSource;
        this.cacheManager = cacheManager.orElse(null);
    }
}

// 3. Collection Injection — inject tất cả implementations
@Service
public class NotificationService {
    private final List<NotificationChannel> channels;

    // Spring inject TẤT CẢ beans implement NotificationChannel
    // Ordered by @Order annotation hoặc Ordered interface
    public NotificationService(List<NotificationChannel> channels) {
        this.channels = channels;
    }

    public void notifyAll(String message) {
        channels.forEach(ch -> ch.send(message));
    }
}

// 4. Map Injection — inject by name
@Service
public class StrategyService {
    private final Map<String, PaymentStrategy> strategies;

    // Key = bean name, Value = bean instance
    public StrategyService(Map<String, PaymentStrategy> strategies) {
        this.strategies = strategies;
    }

    public void pay(String type, BigDecimal amount) {
        PaymentStrategy strategy = strategies.get(type);
        if (strategy == null) throw new IllegalArgumentException("Unknown: " + type);
        strategy.pay(amount);
    }
}

// 5. ObjectProvider — lazy/optional/stream access
@Service
public class LazyService {
    private final ObjectProvider<ExpensiveBean> expensiveProvider;

    public LazyService(ObjectProvider<ExpensiveBean> expensiveProvider) {
        this.expensiveProvider = expensiveProvider;
    }

    public void process() {
        // Lazy: bean created only when getObject() called
        ExpensiveBean bean = expensiveProvider.getIfAvailable();
        if (bean != null) bean.doWork();

        // Stream all beans of type
        expensiveProvider.stream().forEach(ExpensiveBean::doWork);

        // With default
        ExpensiveBean bean = expensiveProvider.getIfAvailable(DefaultExpensiveBean::new);
    }
}
```

---

## Keyword: Bean Resolution & Ambiguity

**Định nghĩa:** Cách Spring chọn bean khi có nhiều candidates — @Primary, @Qualifier, custom qualifiers.

```java
// Khi có nhiều beans cùng type:
public interface Cache {
    void put(String key, Object value);
    Object get(String key);
}

@Service("localCache")
public class LocalCache implements Cache { }

@Service("redisCache")
@Primary  // Default choice khi không chỉ định
public class RedisCache implements Cache { }

@Service("memcachedCache")
public class MemcachedCache implements Cache { }

// Resolution order:
// 1. @Qualifier match
// 2. @Primary
// 3. Bean name match (parameter name = bean name)
// 4. If still ambiguous → NoUniqueBeanDefinitionException

// @Qualifier
@Service
public class UserService {
    public UserService(@Qualifier("localCache") Cache cache) { }
}

// Custom qualifier annotation — type-safe, refactor-friendly
@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE})
public @interface CacheType {
    String value();
}

@Service
@CacheType("local")
public class LocalCache implements Cache { }

@Service
public class UserService {
    public UserService(@CacheType("local") Cache cache) { }
}

// Profile-based selection
@Service
@Profile("dev")
public class InMemoryCache implements Cache { }

@Service
@Profile("prod")
public class RedisCache implements Cache { }

// @ConditionalOnProperty — Spring Boot
@Service
@ConditionalOnProperty(name = "cache.type", havingValue = "redis")
public class RedisCache implements Cache { }
```

---

## Keyword: Circular Dependencies

**Định nghĩa:** A depends on B, B depends on A — Spring có thể resolve cho setter/field injection nhưng KHÔNG cho constructor injection.

```java
// ❌ Circular dependency với constructor injection → BeanCurrentlyInCreationException
@Service
public class ServiceA {
    public ServiceA(ServiceB b) { }  // Needs B
}

@Service
public class ServiceB {
    public ServiceB(ServiceA a) { }  // Needs A → deadlock!
}

// Spring resolution cho setter/field injection:
// 1. Create A (without dependencies)
// 2. Put A reference in "early singleton cache" (3rd level cache)
// 3. Create B
// 4. Inject A reference into B (from early cache)
// 5. B fully initialized
// 6. Inject B into A
// 7. A fully initialized

// Three-level cache:
// singletonObjects (1st): fully initialized beans
// earlySingletonObjects (2nd): early reference (after instantiation, before population)
// singletonFactories (3rd): ObjectFactory to create early reference

// ❌ Circular dependency là design smell — refactor!
// Fix 1: Extract shared logic into third service
@Service
public class SharedLogic { }

@Service
public class ServiceA {
    public ServiceA(SharedLogic shared) { }
}

@Service
public class ServiceB {
    public ServiceB(SharedLogic shared) { }
}

// Fix 2: Use events for decoupling
@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;

    public void createOrder(Order order) {
        orderRepo.save(order);
        publisher.publishEvent(new OrderCreatedEvent(order));
    }
}

@Service
public class InventoryService {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        // React to order creation without direct dependency
    }
}

// Fix 3: @Lazy — defer initialization
@Service
public class ServiceA {
    public ServiceA(@Lazy ServiceB b) { }  // Proxy injected, real B created later
}

// Spring Boot 2.6+ disables circular dependencies by default
// spring.main.allow-circular-references=true to re-enable (not recommended)
```

---

## Keyword: Bean Scope — Deep Dive

**Định nghĩa:** Scope xác định lifecycle và sharing behavior của beans.

```java
// Singleton (default): 1 instance per container
// → Stateless services, repositories, configurations
// ⚠️ KHÔNG lưu request-specific state trong singleton bean!

// Prototype: new instance mỗi lần inject/getBean
// → Stateful objects, builders
// ⚠️ Container KHÔNG quản lý lifecycle (không gọi @PreDestroy)

// Request: 1 instance per HTTP request (web only)
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class RequestContext {
    private String correlationId;
    // Mỗi request có instance riêng
}

// Session: 1 instance per HTTP session (web only)
// Application: 1 instance per ServletContext

// Scope proxy — inject shorter-lived bean into longer-lived bean
// Problem: Singleton bean holds reference to request-scoped bean
// → Cùng 1 request bean cho mọi requests!

// Solution: Scoped proxy
@Component
@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestData { }

@Service  // Singleton
public class MyService {
    private final RequestData requestData;  // Proxy injected!
    // Proxy delegates to actual request-scoped instance per request
}

// Custom scope
public class TenantScope implements Scope {
    @Override
    public Object get(String name, ObjectFactory<?> objectFactory) {
        String tenantId = TenantContext.getCurrentTenant();
        Map<String, Object> tenantBeans = tenantScopedBeans.get(tenantId);
        return tenantBeans.computeIfAbsent(name, k -> objectFactory.getObject());
    }
    // 1 instance per tenant
}
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| IoC Container Internals | BeanDefinition → instantiate → wire → init | Startup sequence, BeanPostProcessor |
| DI Advanced Patterns | Collection, Map, ObjectProvider injection | Optional deps, lazy, strategy pattern |
| Bean Resolution | @Primary, @Qualifier, custom qualifiers | Resolution order, profile-based, conditional |
| Circular Dependencies | A→B→A cycle | Three-level cache, refactoring strategies, events |
| Bean Scope | singleton, prototype, request, session | Scoped proxy, custom scope, stateless rule |
