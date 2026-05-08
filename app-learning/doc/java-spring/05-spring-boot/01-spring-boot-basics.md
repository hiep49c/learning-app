# Spring Boot — Deep Dive

## Tổng Quan

Spring Boot = opinionated Spring + auto-configuration + embedded server. Senior cần hiểu auto-configuration mechanism, conditional beans, externalized configuration binding, và production readiness.

---

## Keyword: Auto-configuration Mechanism

**Định nghĩa:** Spring Boot tự động cấu hình beans dựa trên classpath, properties, và existing beans.

```java
// Auto-configuration flow:
// 1. @SpringBootApplication includes @EnableAutoConfiguration
// 2. Spring loads META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
//    (trước Spring Boot 3.0: META-INF/spring.factories)
// 3. Mỗi auto-configuration class có @Conditional annotations
// 4. Conditions evaluated → beans created if conditions met

// Ví dụ: DataSourceAutoConfiguration
@AutoConfiguration
@ConditionalOnClass(DataSource.class)  // Chỉ khi DataSource class trên classpath
@ConditionalOnMissingBean(DataSource.class)  // Chỉ khi user chưa define DataSource bean
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {
    @Bean
    @ConditionalOnProperty(prefix = "spring.datasource", name = "url")
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }
}

// Conditional annotations:
@ConditionalOnClass(DataSource.class)        // Class trên classpath
@ConditionalOnMissingClass("com.example.X")  // Class KHÔNG trên classpath
@ConditionalOnBean(DataSource.class)          // Bean đã tồn tại
@ConditionalOnMissingBean(DataSource.class)   // Bean CHƯA tồn tại
@ConditionalOnProperty(name = "feature.enabled", havingValue = "true")
@ConditionalOnWebApplication                  // Là web application
@ConditionalOnExpression("${feature.a} && !${feature.b}")

// User beans LUÔN override auto-configuration
// Vì @ConditionalOnMissingBean check user beans trước

// Debug auto-configuration:
// --debug flag hoặc logging.level.org.springframework.boot.autoconfigure=DEBUG
// → ConditionEvaluationReport: positive matches, negative matches, exclusions

// Tạo custom auto-configuration:
@AutoConfiguration
@ConditionalOnClass(MyLibrary.class)
@EnableConfigurationProperties(MyLibraryProperties.class)
public class MyLibraryAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public MyLibraryClient myLibraryClient(MyLibraryProperties props) {
        return new MyLibraryClient(props.getApiKey(), props.getBaseUrl());
    }
}
```

---

## Keyword: @ConfigurationProperties — Type-safe Configuration

**Định nghĩa:** Bind configuration properties vào Java objects — type-safe, validated, IDE-supported.

```java
@ConfigurationProperties(prefix = "app.notification")
@Validated  // Enable JSR-303 validation
public class NotificationProperties {

    @NotBlank
    private String from;

    private final Email email = new Email();
    private final Sms sms = new Sms();
    private final Retry retry = new Retry();

    // Nested configuration
    public static class Email {
        private boolean enabled = true;
        private String host = "smtp.gmail.com";
        private int port = 587;
        @DurationUnit(ChronoUnit.SECONDS)
        private Duration timeout = Duration.ofSeconds(30);
        // Getters & Setters
    }

    public static class Sms {
        private boolean enabled = false;
        private String provider = "twilio";
        // Getters & Setters
    }

    public static class Retry {
        private int maxAttempts = 3;
        @DurationUnit(ChronoUnit.MILLIS)
        private Duration initialDelay = Duration.ofMillis(100);
        private double multiplier = 2.0;
        // Getters & Setters
    }

    // Getters & Setters
}

// application.yml:
// app:
//   notification:
//     from: noreply@example.com
//     email:
//       enabled: true
//       host: smtp.gmail.com
//       timeout: 30s
//     sms:
//       enabled: false
//     retry:
//       max-attempts: 5
//       initial-delay: 200ms

// Immutable @ConfigurationProperties (Spring Boot 2.2+)
@ConfigurationProperties(prefix = "app.cache")
public record CacheProperties(
    boolean enabled,
    @DefaultValue("300") int ttlSeconds,
    @DefaultValue("1000") int maxSize
) {}
// Constructor binding — no setters needed

// Property sources priority (highest to lowest):
// 1. Command line arguments (--server.port=9090)
// 2. SPRING_APPLICATION_JSON
// 3. ServletConfig/ServletContext parameters
// 4. JNDI
// 5. System properties (-Dserver.port=9090)
// 6. OS environment variables (SERVER_PORT=9090)
// 7. application-{profile}.yml
// 8. application.yml
// 9. @PropertySource annotations
// 10. Default properties (SpringApplication.setDefaultProperties)
```

---

## Keyword: Profiles & Conditional Configuration

**Định nghĩa:** Tách cấu hình theo môi trường — profiles, conditional beans, feature flags.

```java
// Profile activation:
// 1. spring.profiles.active=dev,metrics
// 2. SPRING_PROFILES_ACTIVE=prod
// 3. --spring.profiles.active=staging
// 4. SpringApplication.setAdditionalProfiles("dev")

// Profile groups (Spring Boot 2.4+):
// spring.profiles.group.production=proddb,prodmq,prodmetrics
// Activate "production" → activates all three

// Profile-specific beans:
@Configuration
@Profile("dev")
public class DevConfig {
    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }
}

// Profile expression (Spring 5.1+):
@Profile("!prod")           // NOT prod
@Profile("dev | staging")   // dev OR staging
@Profile("cloud & metrics") // cloud AND metrics

// Feature flags pattern:
@ConfigurationProperties(prefix = "features")
public class FeatureFlags {
    private boolean newCheckout = false;
    private boolean darkMode = false;
    private boolean betaApi = false;
}

@Service
@ConditionalOnProperty(name = "features.new-checkout", havingValue = "true")
public class NewCheckoutService implements CheckoutService { }

@Service
@ConditionalOnProperty(name = "features.new-checkout", havingValue = "false", matchIfMissing = true)
public class LegacyCheckoutService implements CheckoutService { }
```

---

## Keyword: Actuator & Production Readiness

**Định nghĩa:** Monitoring, health checks, metrics — production-grade observability.

```java
// Custom health indicator
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return Health.up()
                .withDetail("database", "PostgreSQL")
                .withDetail("responseTime", "5ms")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withException(e)
                .build();
        }
    }
}

// Custom metrics with Micrometer
@Service
public class OrderService {
    private final Counter orderCounter;
    private final Timer orderTimer;

    public OrderService(MeterRegistry registry) {
        this.orderCounter = Counter.builder("orders.created")
            .tag("type", "online")
            .description("Number of orders created")
            .register(registry);

        this.orderTimer = Timer.builder("orders.processing.time")
            .description("Order processing time")
            .register(registry);
    }

    public Order createOrder(CreateOrderRequest request) {
        return orderTimer.record(() -> {
            Order order = processOrder(request);
            orderCounter.increment();
            return order;
        });
    }
}

// Kubernetes-ready health endpoints:
// /actuator/health/liveness — is app alive? (restart if not)
// /actuator/health/readiness — is app ready for traffic? (remove from LB if not)

management:
  endpoint:
    health:
      probes:
        enabled: true  # Enable liveness/readiness
      group:
        readiness:
          include: db, redis, rabbit  # Readiness depends on external services
        liveness:
          include: ping  # Liveness = basic app health
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Auto-configuration | Conditional bean creation from classpath | @Conditional*, override mechanism, debug |
| @ConfigurationProperties | Type-safe config binding | Nested, validated, immutable records, priority |
| Profiles | Environment-specific config | Groups, expressions, feature flags |
| Actuator | Production monitoring | Custom health, Micrometer metrics, K8s probes |
