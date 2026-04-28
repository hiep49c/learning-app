# REST API Development — Deep Dive

## Tổng Quan

Building production-grade REST APIs với Spring Boot. Senior cần hiểu request lifecycle, content negotiation, error handling strategies, API versioning, và performance optimization.

---

## Keyword: Request Lifecycle

**Định nghĩa:** HTTP request đi qua nhiều layers trước khi đến controller method.

```
Client Request
    ↓
Servlet Container (Tomcat)
    ↓
Filter Chain (Security, CORS, Logging)
    ↓
DispatcherServlet
    ↓
HandlerMapping (find controller method)
    ↓
HandlerInterceptor.preHandle()
    ↓
ArgumentResolvers (@RequestBody, @PathVariable, @RequestParam)
    ↓
Validation (@Valid)
    ↓
Controller Method
    ↓
ReturnValueHandlers (serialize response)
    ↓
HandlerInterceptor.postHandle()
    ↓
ViewResolver (if needed)
    ↓
HandlerInterceptor.afterCompletion()
    ↓
Filter Chain (response)
    ↓
Client Response
```

```java
// Custom HandlerInterceptor — cross-cutting concerns
@Component
public class RequestTimingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) {
        request.setAttribute("startTime", System.nanoTime());
        return true;  // false → abort request
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        long start = (long) request.getAttribute("startTime");
        long duration = (System.nanoTime() - start) / 1_000_000;
        logger.info("{} {} → {} ({}ms)",
            request.getMethod(), request.getRequestURI(),
            response.getStatus(), duration);
    }
}

// Custom ArgumentResolver
@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                   NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.findByUsername(auth.getName());
    }
}

// Usage:
@GetMapping("/me")
public UserDto getCurrentUser(@CurrentUser User user) {
    return UserDto.from(user);
}
```

---

## Keyword: Error Handling — Production Grade

**Định nghĩa:** Consistent error responses, proper HTTP status codes, và error detail levels.

```java
// RFC 7807 Problem Details (Spring 6+)
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create("https://api.example.com/errors/not-found"));
        problem.setProperty("resourceType", ex.getResourceType());
        problem.setProperty("resourceId", ex.getResourceId());
        return problem;
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setTitle("Business Rule Violation");
        problem.setProperty("rule", ex.getRule());
        problem.setProperty("context", ex.getContext());
        return problem;
    }

    // Validation errors — detailed field-level errors
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation Failed");

        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid",
                (a, b) -> a + "; " + b
            ));
        problem.setProperty("fieldErrors", fieldErrors);

        return ResponseEntity.badRequest().body(problem);
    }

    // Catch-all — NEVER expose internal details to client
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        logger.error("Unexpected error", ex);  // Full stack trace in logs
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred");  // Generic message to client
        // KHÔNG include: stack trace, SQL queries, internal class names
        return problem;
    }
}
```

---

## Keyword: API Design Best Practices

**Định nghĩa:** RESTful conventions, versioning, pagination, HATEOAS.

```java
// URL design:
// GET    /api/v1/users          — list users
// GET    /api/v1/users/123      — get user
// POST   /api/v1/users          — create user
// PUT    /api/v1/users/123      — full update
// PATCH  /api/v1/users/123      — partial update
// DELETE /api/v1/users/123      — delete user
// GET    /api/v1/users/123/orders — nested resource

// API Versioning strategies:
// 1. URL path: /api/v1/users (most common, clear)
// 2. Header: Accept: application/vnd.example.v1+json
// 3. Query param: /api/users?version=1

// Pagination response:
@GetMapping
public ResponseEntity<PagedResponse<UserDto>> getUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "createdAt,desc") String[] sort
) {
    Page<User> users = userService.findAll(
        PageRequest.of(page, size, Sort.by(parseSortOrders(sort)))
    );

    PagedResponse<UserDto> response = new PagedResponse<>(
        users.map(UserDto::from).getContent(),
        users.getNumber(),
        users.getSize(),
        users.getTotalElements(),
        users.getTotalPages(),
        users.isLast()
    );

    return ResponseEntity.ok(response);
}

// DTO validation — never trust client input
public record CreateUserRequest(
    @NotBlank @Size(min = 2, max = 100) String name,
    @NotBlank @Email String email,
    @NotNull @Past LocalDate birthDate,
    @Size(max = 500) String bio
) {}

// Response DTO — control what's exposed
public record UserDto(
    Long id,
    String name,
    String email,
    // KHÔNG include: password, internal IDs, audit fields
    LocalDateTime createdAt
) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getName(),
            user.getEmail(), user.getCreatedAt());
    }
}
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Request Lifecycle | Filter → Interceptor → Resolver → Controller | Custom interceptors, argument resolvers |
| Error Handling | RFC 7807 ProblemDetail, @RestControllerAdvice | Field-level validation errors, never expose internals |
| API Design | REST conventions, versioning, pagination | DTO mapping, input validation, response structure |
