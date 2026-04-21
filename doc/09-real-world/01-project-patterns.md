# Real-world Project Patterns — Deep Dive

## Tổng Quan

Patterns và practices từ production systems. Senior/Tech Lead cần biết architecture decision records, testing pyramid, deployment strategies, và performance engineering.

---

## Keyword: Architecture Decision Records (ADR)

**Định nghĩa:** Document architecture decisions — context, decision, consequences.

```markdown
# ADR-001: Use PostgreSQL as primary database

## Status: Accepted

## Context
We need a relational database for our e-commerce platform.
Requirements: ACID transactions, JSON support, full-text search,
horizontal read scaling.

## Decision
Use PostgreSQL 16 with:
- Read replicas for query scaling
- JSONB columns for flexible product attributes
- Full-text search (tsvector) instead of Elasticsearch for simple cases

## Consequences
Positive:
- Strong ACID guarantees
- Rich JSON support reduces need for document DB
- Built-in FTS reduces infrastructure complexity

Negative:
- Write scaling limited to vertical (vs horizontal with NoSQL)
- Team needs PostgreSQL-specific knowledge
- JSONB queries less intuitive than document DB queries

## Alternatives Considered
- MySQL: less JSON support, less advanced features
- MongoDB: eventual consistency concerns for financial data
- DynamoDB: vendor lock-in, complex query patterns
```

---

## Keyword: Testing Pyramid — Production Strategy

**Định nghĩa:** Unit → Integration → E2E — mỗi level có purpose và cost khác nhau.

```java
// Testing pyramid:
//        /  E2E  \        Few, slow, expensive
//       / Contract \      API contract verification
//      / Integration \    DB, HTTP, messaging
//     /    Unit       \   Many, fast, cheap

// Unit Test — test business logic in isolation
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository orderRepo;
    @Mock PaymentService paymentService;
    @Mock InventoryService inventoryService;
    @InjectMocks OrderService orderService;

    @Test
    void shouldRejectOrderWhenInsufficientStock() {
        when(inventoryService.checkStock(anyLong(), anyInt()))
            .thenReturn(false);

        assertThatThrownBy(() -> orderService.create(request))
            .isInstanceOf(InsufficientStockException.class)
            .hasMessageContaining("Product 123");

        verify(paymentService, never()).charge(any());
        verify(orderRepo, never()).save(any());
    }

    @Test
    void shouldCreateOrderAndChargePayment() {
        when(inventoryService.checkStock(anyLong(), anyInt())).thenReturn(true);
        when(orderRepo.save(any())).thenReturn(savedOrder);
        when(paymentService.charge(any())).thenReturn(paymentResult);

        OrderDto result = orderService.create(request);

        assertThat(result.status()).isEqualTo("CONFIRMED");
        verify(paymentService).charge(argThat(p ->
            p.getAmount().compareTo(new BigDecimal("99.99")) == 0));

        InOrder inOrder = inOrder(inventoryService, paymentService, orderRepo);
        inOrder.verify(inventoryService).checkStock(anyLong(), anyInt());
        inOrder.verify(orderRepo).save(any());
        inOrder.verify(paymentService).charge(any());
    }
}

// Integration Test — test with real DB, HTTP
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers  // Real PostgreSQL in Docker
class OrderControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mockMvc;

    @Test
    void shouldCreateAndRetrieveOrder() throws Exception {
        // Create
        String response = mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productId": 1, "quantity": 2}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn().getResponse().getContentAsString();

        Long orderId = JsonPath.parse(response).read("$.id", Long.class);

        // Retrieve
        mockMvc.perform(get("/api/orders/{id}", orderId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"));
    }
}

// Contract Test — verify API contract between services
// Spring Cloud Contract or Pact
// Producer: defines contract, generates tests
// Consumer: uses contract stubs for testing
```

---

## Keyword: Performance Engineering

**Định nghĩa:** Systematic approach to performance — profiling, benchmarking, optimization.

```java
// 1. Measure first — don't optimize prematurely
// Tools: JMH (microbenchmark), JProfiler, async-profiler, Micrometer

// JMH Benchmark
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@State(Scope.Benchmark)
public class CollectionBenchmark {
    @Benchmark
    public void arrayListIteration(Blackhole bh) {
        for (String s : arrayList) bh.consume(s);
    }

    @Benchmark
    public void linkedListIteration(Blackhole bh) {
        for (String s : linkedList) bh.consume(s);
    }
}

// 2. Common performance optimizations:

// Database:
// - Add indexes for WHERE, JOIN, ORDER BY columns
// - Use EXPLAIN ANALYZE to verify query plans
// - Connection pooling (HikariCP default in Spring Boot)
// - N+1 query elimination (JOIN FETCH, @BatchSize)
// - Read replicas for read-heavy workloads

// Caching:
@Cacheable(value = "products", key = "#id", unless = "#result == null")
public Product findById(Long id) { }

@CacheEvict(value = "products", key = "#product.id")
public Product update(Product product) { }

@CacheEvict(value = "products", allEntries = true)
public void clearCache() { }

// Cache levels:
// L1: In-process (Caffeine) — fastest, per-instance
// L2: Distributed (Redis) — shared across instances
// Strategy: L1 for hot data, L2 for shared data

// Async processing:
@Async("taskExecutor")
public CompletableFuture<Report> generateReport(Long userId) {
    // Runs in separate thread pool — doesn't block request
    return CompletableFuture.completedFuture(buildReport(userId));
}

@Bean
public TaskExecutor taskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(5);
    executor.setMaxPoolSize(20);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("async-");
    executor.setRejectedExecutionHandler(new CallerRunsPolicy());
    return executor;
}

// 3. JVM Tuning:
// -Xms2g -Xmx2g (set min=max to avoid resize)
// -XX:+UseG1GC (default Java 11+)
// -XX:MaxGCPauseMillis=200
// -XX:+UseStringDeduplication (G1 only)
// -XX:+HeapDumpOnOutOfMemoryError
// -XX:HeapDumpPath=/var/log/heapdump.hprof
```

---

## Keyword: Common Anti-patterns — Senior Perspective

**Định nghĩa:** Design và implementation mistakes phổ biến trong production systems.

```java
// 1. Distributed Monolith — worst of both worlds
// Microservices that are tightly coupled, must deploy together
// Fix: ensure services can deploy and fail independently

// 2. Shared Database — coupling through data
// Multiple services access same tables
// Fix: database per service, API for data access

// 3. Chatty Services — too many inter-service calls
// Order service calls User, Product, Inventory, Payment for every request
// Fix: aggregate data, cache, async events, BFF pattern

// 4. Anemic Domain Model — entities without behavior
// ❌ All logic in services, entities are just data holders
@Entity
public class Order {
    private BigDecimal total;
    private OrderStatus status;
    // Only getters/setters
}

@Service
public class OrderService {
    public void addItem(Order order, Product product, int qty) {
        // All logic here — Order is just a data bag
    }
}

// ✅ Rich Domain Model — entities encapsulate behavior
@Entity
public class Order {
    public void addItem(Product product, int quantity) {
        validateNotFinalized();
        items.add(new OrderItem(product, quantity));
        recalculateTotal();
    }

    public void confirm() {
        if (items.isEmpty()) throw new EmptyOrderException();
        this.status = OrderStatus.CONFIRMED;
    }
}

// 5. God Class / God Service — too many responsibilities
// Fix: SRP, extract services, domain-driven design

// 6. Premature Optimization
// "We might need to handle 1M requests/sec"
// Fix: measure first, optimize bottlenecks, YAGNI

// 7. Resume-Driven Development
// Using Kafka, Kubernetes, microservices for a CRUD app
// Fix: choose technology based on requirements, not hype

// 8. Ignoring Observability
// No logging, no metrics, no tracing → blind in production
// Fix: structured logging, Micrometer metrics, distributed tracing from day 1
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| ADR | Document architecture decisions | Context, decision, consequences, alternatives |
| Testing Pyramid | Unit → Integration → E2E | Testcontainers, contract tests, test isolation |
| Performance Engineering | Measure → Profile → Optimize | JMH, caching strategy, async, JVM tuning |
| Anti-patterns | Common production mistakes | Distributed monolith, anemic model, premature optimization |
