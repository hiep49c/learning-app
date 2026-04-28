# Spring Data JPA — Deep Dive

## Tổng Quan

Spring Data JPA abstracts database access. Senior cần hiểu N+1 problem, entity lifecycle, transaction isolation, optimistic/pessimistic locking, và query optimization.

---

## Keyword: Entity Lifecycle & Persistence Context

**Định nghĩa:** JPA Entity có 4 states — Transient, Managed, Detached, Removed. Persistence Context (EntityManager) tracks managed entities.

```java
// Entity states:
// Transient: new object, not in DB, not managed
User user = new User("An");  // Transient

// Managed: tracked by EntityManager, changes auto-synced to DB
userRepository.save(user);  // → Managed
user.setName("Bình");       // Dirty checking → auto UPDATE on flush

// Detached: was managed, now disconnected (after transaction ends)
// Changes NOT auto-synced
User detached = userRepository.findById(1L).get();
// Transaction ends → detached
detached.setName("Cường");  // NOT saved automatically
userRepository.save(detached);  // merge() → re-attach and save

// Removed: scheduled for deletion
userRepository.delete(user);  // → Removed → DELETE on flush

// Persistence Context = First-Level Cache
User u1 = userRepository.findById(1L).get();  // SQL SELECT
User u2 = userRepository.findById(1L).get();  // NO SQL — from cache
assert u1 == u2;  // Same object reference!

// Dirty checking — automatic change detection
@Transactional
public void updateUser(Long id, String newName) {
    User user = userRepository.findById(id).get();  // Managed
    user.setName(newName);  // Dirty
    // NO explicit save() needed!
    // On transaction commit → flush → UPDATE SQL generated
}

// Flush modes:
// AUTO (default): flush before queries and on commit
// COMMIT: flush only on commit
// entityManager.flush(); // Manual flush
```

---

## Keyword: N+1 Problem & Solutions

**Định nghĩa:** Loading N child collections triggers N additional queries — most common JPA performance issue.

```java
// N+1 Problem:
@Entity
public class Order {
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderItem> items;
}

List<Order> orders = orderRepository.findAll();  // 1 query: SELECT * FROM orders
for (Order order : orders) {
    order.getItems().size();  // N queries: SELECT * FROM order_items WHERE order_id = ?
}
// Total: 1 + N queries!

// Solution 1: JOIN FETCH (JPQL)
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.status = :status")
List<Order> findByStatusWithItems(@Param("status") OrderStatus status);
// 1 query with JOIN — all data loaded

// ⚠️ JOIN FETCH + Pagination = memory issue
// Hibernate loads ALL results in memory, then paginates
// Warning: "HHH90003004: firstResult/maxResults specified with collection fetch"

// Solution 2: @EntityGraph
@EntityGraph(attributePaths = {"items", "items.product"})
List<Order> findByStatus(OrderStatus status);
// Generates LEFT JOIN FETCH

// Solution 3: @BatchSize — batch lazy loading
@Entity
public class Order {
    @OneToMany(mappedBy = "order")
    @BatchSize(size = 20)  // Load items for 20 orders at once
    private List<OrderItem> items;
}
// Instead of N queries → ceil(N/20) queries
// Global: spring.jpa.properties.hibernate.default_batch_fetch_size=20

// Solution 4: Projection — load only needed fields
public interface OrderSummary {
    Long getId();
    String getCustomerName();
    BigDecimal getTotalAmount();
    // No items loaded at all
}
List<OrderSummary> findByStatus(OrderStatus status);

// Solution 5: DTO Projection with JPQL
@Query("SELECT new com.example.dto.OrderDto(o.id, o.total, c.name) " +
       "FROM Order o JOIN o.customer c WHERE o.status = :status")
List<OrderDto> findOrderDtos(@Param("status") OrderStatus status);
```

---

## Keyword: Transaction Isolation & Locking

**Định nghĩa:** Isolation levels và locking strategies cho concurrent data access.

```java
// Isolation levels:
// READ_UNCOMMITTED: dirty reads possible (rarely used)
// READ_COMMITTED: no dirty reads (PostgreSQL default)
// REPEATABLE_READ: no dirty/non-repeatable reads (MySQL InnoDB default)
// SERIALIZABLE: no phantom reads (slowest)

@Transactional(isolation = Isolation.READ_COMMITTED)
public void transfer(Long fromId, Long toId, BigDecimal amount) { }

// Optimistic Locking — version-based, no DB locks
@Entity
public class Account {
    @Id private Long id;
    @Version private Long version;  // Auto-incremented on update
    private BigDecimal balance;
}

// Concurrent update:
// Thread A: read account (version=1), modify, save → version becomes 2
// Thread B: read account (version=1), modify, save → OptimisticLockException!
// Because version in DB (2) ≠ version in entity (1)

// Handle optimistic lock failure:
@Retryable(value = OptimisticLockException.class, maxAttempts = 3)
@Transactional
public void updateBalance(Long id, BigDecimal amount) {
    Account account = accountRepository.findById(id).orElseThrow();
    account.setBalance(account.getBalance().add(amount));
    // save() → checks version → retry if conflict
}

// Pessimistic Locking — DB-level locks
@Query("SELECT a FROM Account a WHERE a.id = :id")
@Lock(LockModeType.PESSIMISTIC_WRITE)  // SELECT ... FOR UPDATE
Optional<Account> findByIdForUpdate(@Param("id") Long id);

// PESSIMISTIC_READ: shared lock (multiple readers, no writers)
// PESSIMISTIC_WRITE: exclusive lock (no other readers or writers)
// PESSIMISTIC_FORCE_INCREMENT: exclusive lock + increment version

// Deadlock prevention:
// Always lock resources in consistent order
// Use timeouts: @QueryHints(@QueryHint(name = "javax.persistence.lock.timeout", value = "3000"))
```

---

## Keyword: Query Optimization

**Định nghĩa:** Techniques để optimize JPA queries cho production workloads.

```java
// 1. Use projections — load only needed columns
public interface UserNameOnly {
    String getName();
    String getEmail();
}
List<UserNameOnly> findByStatus(UserStatus status);
// SELECT name, email FROM users WHERE status = ?

// 2. Pagination — never load all records
Page<User> findByStatus(UserStatus status, Pageable pageable);
// SELECT * FROM users WHERE status = ? LIMIT 20 OFFSET 0

// 3. Specification — dynamic queries
public class UserSpecifications {
    public static Specification<User> hasName(String name) {
        return (root, query, cb) ->
            name == null ? null : cb.like(root.get("name"), "%" + name + "%");
    }

    public static Specification<User> hasStatus(UserStatus status) {
        return (root, query, cb) ->
            status == null ? null : cb.equal(root.get("status"), status);
    }
}

// Combine dynamically:
Specification<User> spec = Specification
    .where(UserSpecifications.hasName(nameFilter))
    .and(UserSpecifications.hasStatus(statusFilter));
Page<User> users = userRepository.findAll(spec, pageable);

// 4. Read-only transactions — skip dirty checking
@Transactional(readOnly = true)
public List<User> findAll() {
    return userRepository.findAll();
    // Hibernate skips dirty checking → faster
    // Some DBs route to read replica
}

// 5. Bulk operations — bypass entity lifecycle
@Modifying
@Query("UPDATE User u SET u.status = :status WHERE u.lastLogin < :date")
int deactivateInactiveUsers(@Param("status") UserStatus status,
                            @Param("date") LocalDateTime date);
// Direct SQL UPDATE — no entity loading, no dirty checking
// ⚠️ Bypasses persistence context cache — may cause stale data

// 6. Database indexing — most impactful optimization
// @Table(indexes = {
//     @Index(name = "idx_user_email", columnList = "email", unique = true),
//     @Index(name = "idx_user_status_created", columnList = "status, created_at")
// })
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Entity Lifecycle | Transient → Managed → Detached → Removed | Dirty checking, persistence context cache |
| N+1 Problem | N child queries for N parents | JOIN FETCH, @BatchSize, projections |
| Transaction & Locking | Isolation levels, optimistic/pessimistic | @Version, FOR UPDATE, deadlock prevention |
| Query Optimization | Projections, pagination, specifications | Read-only transactions, bulk operations, indexing |
