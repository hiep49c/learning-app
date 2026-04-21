# Spring Cloud & Microservices — Deep Dive

## Tổng Quan

Microservices architecture giải quyết scalability nhưng tạo ra distributed systems complexity. Senior/Tech Lead cần hiểu trade-offs, patterns, failure modes, và khi nào KHÔNG nên dùng microservices.

---

## Keyword: Microservices Trade-offs

**Định nghĩa:** Microservices không phải silver bullet — hiểu trade-offs trước khi adopt.

```
Monolith advantages:
✅ Simple development, testing, deployment
✅ Easy debugging (single process)
✅ No network latency between components
✅ ACID transactions
✅ Simple data consistency

Microservices advantages:
✅ Independent deployment & scaling
✅ Technology diversity per service
✅ Team autonomy (Conway's Law)
✅ Fault isolation
✅ Easier to understand individual services

Microservices costs:
❌ Network complexity (latency, failures, serialization)
❌ Distributed transactions (eventual consistency)
❌ Operational complexity (monitoring, tracing, deployment)
❌ Data consistency challenges
❌ Testing complexity (integration, contract tests)
❌ Debugging across services

When to use microservices:
- Large team (>20 developers) needing independent deployment
- Different scaling requirements per component
- Different technology requirements per component
- Organization structured around business capabilities

When NOT to use:
- Small team (<10 developers)
- Simple domain
- Tight coupling between components
- Starting a new project (start monolith, extract later)
```

---

## Keyword: Service Communication Patterns

**Định nghĩa:** Synchronous (REST, gRPC) vs Asynchronous (messaging) — mỗi cái cho use case khác.

```java
// Synchronous — REST with WebClient (reactive, non-blocking)
@Service
public class OrderService {
    private final WebClient userClient;

    public OrderService(WebClient.Builder builder) {
        this.userClient = builder.baseUrl("http://user-service").build();
    }

    public Mono<OrderDto> createOrder(CreateOrderRequest request) {
        return userClient.get()
            .uri("/api/users/{id}", request.userId())
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError,
                response -> Mono.error(new UserNotFoundException(request.userId())))
            .bodyToMono(UserDto.class)
            .map(user -> processOrder(request, user));
    }
}

// Synchronous — OpenFeign (declarative, blocking)
@FeignClient(name = "user-service", fallback = UserClientFallback.class)
public interface UserClient {
    @GetMapping("/api/users/{id}")
    UserDto findById(@PathVariable Long id);
}

@Component
public class UserClientFallback implements UserClient {
    @Override
    public UserDto findById(Long id) {
        return new UserDto(id, "Unknown", "N/A");  // Fallback
    }
}

// Asynchronous — Event-driven with Spring Cloud Stream
@Service
public class OrderService {
    private final StreamBridge streamBridge;

    public Order createOrder(CreateOrderRequest request) {
        Order order = orderRepo.save(new Order(request));
        // Publish event — consumers process asynchronously
        streamBridge.send("order-events", new OrderCreatedEvent(order.getId()));
        return order;
    }
}

@Component
public class InventoryEventHandler {
    @Bean
    public Consumer<OrderCreatedEvent> handleOrderCreated() {
        return event -> {
            inventoryService.reserveItems(event.getOrderId());
        };
    }
}

// When to use sync vs async:
// Sync: need immediate response, simple request-reply
// Async: fire-and-forget, event notification, long processing
// Async: decoupling, buffering, reliability (message broker persists)
```

---

## Keyword: Resilience Patterns

**Định nghĩa:** Patterns để handle failures trong distributed systems — Circuit Breaker, Retry, Bulkhead, Rate Limiter.

```java
// Resilience4j — lightweight fault tolerance library

// Circuit Breaker — prevent cascade failures
@CircuitBreaker(name = "userService", fallbackMethod = "fallback")
public UserDto getUser(Long id) {
    return userClient.findById(id);
}

public UserDto fallback(Long id, Throwable t) {
    logger.warn("User service unavailable, using fallback", t);
    return new UserDto(id, "Unknown", "N/A");
}

// Circuit Breaker states:
// CLOSED → requests pass through, failures counted
// OPEN → requests blocked, fallback returned immediately
// HALF_OPEN → limited requests allowed to test recovery

// Retry — automatic retry with backoff
@Retry(name = "userService", fallbackMethod = "fallback")
public UserDto getUser(Long id) {
    return userClient.findById(id);
}

// Bulkhead — limit concurrent calls to prevent resource exhaustion
@Bulkhead(name = "userService", type = Bulkhead.Type.THREADPOOL)
public UserDto getUser(Long id) {
    return userClient.findById(id);
}

// Rate Limiter — limit request rate
@RateLimiter(name = "userService")
public UserDto getUser(Long id) {
    return userClient.findById(id);
}

// Configuration:
resilience4j:
  circuitbreaker:
    instances:
      userService:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 3
  retry:
    instances:
      userService:
        max-attempts: 3
        wait-duration: 500ms
        exponential-backoff-multiplier: 2
        retry-exceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
  bulkhead:
    instances:
      userService:
        max-concurrent-calls: 10
        max-wait-duration: 500ms

// Decoration order matters:
// Retry → CircuitBreaker → Bulkhead → RateLimiter → Function
// Retry wraps CircuitBreaker: retry the circuit breaker call
```

---

## Keyword: Distributed Data Patterns

**Định nghĩa:** Patterns cho data consistency across microservices — Saga, CQRS, Event Sourcing.

```java
// Saga Pattern — distributed transaction as sequence of local transactions
// Each service: local transaction + publish event
// If any step fails: compensating transactions undo previous steps

// Choreography Saga (event-driven):
// OrderService: create order → publish OrderCreated
// PaymentService: listen OrderCreated → charge → publish PaymentCompleted
// InventoryService: listen PaymentCompleted → reserve → publish InventoryReserved
// OrderService: listen InventoryReserved → confirm order

// Compensation:
// PaymentService: charge fails → publish PaymentFailed
// OrderService: listen PaymentFailed → cancel order

// Orchestration Saga (central coordinator):
@Service
public class OrderSagaOrchestrator {
    public void createOrder(CreateOrderRequest request) {
        // Step 1: Create order (PENDING)
        Order order = orderService.create(request);

        try {
            // Step 2: Reserve payment
            paymentService.reserve(order.getId(), order.getTotal());

            // Step 3: Reserve inventory
            inventoryService.reserve(order.getId(), order.getItems());

            // Step 4: Confirm order
            orderService.confirm(order.getId());
        } catch (PaymentException e) {
            orderService.cancel(order.getId());  // Compensate
        } catch (InventoryException e) {
            paymentService.refund(order.getId());  // Compensate
            orderService.cancel(order.getId());    // Compensate
        }
    }
}

// CQRS — separate read and write models
// Write side: normalized, optimized for consistency
// Read side: denormalized, optimized for queries
// Sync via events: write → event → update read model

// Event Sourcing — store events, not current state
// Events: OrderCreated, ItemAdded, PaymentReceived, OrderShipped
// Current state = replay all events
// Benefits: complete audit trail, temporal queries, event replay
// Challenges: event schema evolution, eventual consistency, complexity

// Outbox Pattern — reliable event publishing
// Problem: save to DB + publish event = not atomic
// Solution: save event to outbox table in same transaction
// Background process reads outbox → publishes to message broker
@Transactional
public Order createOrder(CreateOrderRequest request) {
    Order order = orderRepo.save(new Order(request));
    outboxRepo.save(new OutboxEvent("OrderCreated", order.getId(), serialize(order)));
    return order;
    // Debezium or polling reads outbox → publishes to Kafka
}
```

---

## Keyword: Observability — Logging, Metrics, Tracing

**Định nghĩa:** Three pillars of observability cho microservices — logs, metrics, distributed tracing.

```java
// Distributed Tracing — Micrometer Tracing (Spring Boot 3+)
// Replaces Spring Cloud Sleuth
// Trace: entire request journey across services
// Span: single operation within a trace

// Auto-instrumented: RestTemplate, WebClient, @Async, messaging
// Log correlation: traceId and spanId in MDC
// [order-service,traceId=abc123,spanId=def456] Processing order...
// [payment-service,traceId=abc123,spanId=ghi789] Charging payment...
// Same traceId → same request chain

// Structured logging
logger.info("Order created", kv("orderId", order.getId()),
    kv("customerId", order.getCustomerId()),
    kv("total", order.getTotal()));
// JSON output: {"message":"Order created","orderId":123,"customerId":456,"total":99.99}

// Centralized logging: ELK Stack (Elasticsearch + Logstash + Kibana)
// or Grafana Loki

// Metrics: Micrometer → Prometheus → Grafana
// RED metrics per service:
// Rate: requests per second
// Errors: error rate
// Duration: response time percentiles (p50, p95, p99)

// Health checks for orchestration (Kubernetes):
// Liveness: is the process alive? (restart if not)
// Readiness: can it handle traffic? (remove from LB if not)
// Startup: has it finished starting? (don't check liveness until started)
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Microservices Trade-offs | Benefits vs costs, when to use | Conway's Law, start monolith first |
| Service Communication | Sync (REST, gRPC) vs Async (messaging) | WebClient, Feign, Spring Cloud Stream |
| Resilience Patterns | Circuit Breaker, Retry, Bulkhead | Resilience4j, decoration order, fallbacks |
| Distributed Data | Saga, CQRS, Event Sourcing, Outbox | Choreography vs orchestration, compensation |
| Observability | Logs, Metrics, Tracing | Micrometer Tracing, structured logging, RED metrics |
