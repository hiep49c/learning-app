# Spring Security — Deep Dive

## Tổng Quan

Spring Security cung cấp authentication và authorization. Senior cần hiểu filter chain architecture, security context propagation, JWT stateless auth, OAuth2 flows, và common vulnerabilities.

---

## Keyword: Security Filter Chain Architecture

**Định nghĩa:** Spring Security = chain of servlet filters — mỗi filter xử lý một security concern.

```java
// Filter chain order (simplified):
// 1. SecurityContextPersistenceFilter — load/save SecurityContext
// 2. CorsFilter — CORS headers
// 3. CsrfFilter — CSRF protection
// 4. LogoutFilter — handle /logout
// 5. UsernamePasswordAuthenticationFilter — form login
// 6. BasicAuthenticationFilter — HTTP Basic
// 7. BearerTokenAuthenticationFilter — OAuth2/JWT
// 8. ExceptionTranslationFilter — convert security exceptions to HTTP responses
// 9. FilterSecurityInterceptor — authorization check

// Custom filter chain:
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())  // Disable for stateless API
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((req, res, e) -> {
                res.setStatus(401);
                res.getWriter().write("{\"error\": \"Unauthorized\"}");
            })
            .accessDeniedHandler((req, res, e) -> {
                res.setStatus(403);
                res.getWriter().write("{\"error\": \"Forbidden\"}");
            })
        );

    return http.build();
}

// Multiple filter chains — different security for different paths
@Bean
@Order(1)
public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
    http.securityMatcher("/api/**")  // Only for /api paths
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    return http.build();
}

@Bean
@Order(2)
public SecurityFilterChain webFilterChain(HttpSecurity http) throws Exception {
    http.securityMatcher("/**")  // Everything else
        .formLogin(Customizer.withDefaults());
    return http.build();
}
```

---

## Keyword: JWT Authentication — Production Implementation

**Định nghĩa:** Stateless authentication bằng signed tokens — không cần server-side session.

```java
// JWT structure: header.payload.signature
// Header: {"alg": "HS256", "typ": "JWT"}
// Payload: {"sub": "user@example.com", "roles": ["USER"], "iat": ..., "exp": ...}
// Signature: HMAC-SHA256(base64(header) + "." + base64(payload), secret)

@Service
public class JwtService {
    private final SecretKey key;
    private final long accessTokenExpiry;
    private final long refreshTokenExpiry;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.access-expiry:900000}") long accessExpiry,
                      @Value("${jwt.refresh-expiry:604800000}") long refreshExpiry) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiry = accessExpiry;
        this.refreshTokenExpiry = refreshExpiry;
    }

    public String generateAccessToken(UserDetails user) {
        return Jwts.builder()
            .subject(user.getUsername())
            .claim("roles", user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).toList())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessTokenExpiry))
            .signWith(key)
            .compact();
    }

    public String generateRefreshToken(UserDetails user) {
        return Jwts.builder()
            .subject(user.getUsername())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiry))
            .signWith(key)
            .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}

// JWT Filter
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            String token = header.substring(7);
            Claims claims = jwtService.validateToken(token);
            String username = claims.getSubject();

            // Check if token is blacklisted (for logout)
            if (tokenBlacklist.isBlacklisted(token)) {
                chain.doFilter(request, response);
                return;
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            var auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (JwtException e) {
            logger.debug("Invalid JWT: {}", e.getMessage());
            // Don't set authentication → request continues as anonymous
        }

        chain.doFilter(request, response);
    }
}

// Token refresh flow:
// 1. Client sends expired access token → 401
// 2. Client sends refresh token to /api/auth/refresh
// 3. Server validates refresh token → issue new access + refresh tokens
// 4. Old refresh token invalidated (rotation)

// JWT security considerations:
// - Store secret securely (env var, vault, not in code)
// - Short access token expiry (15 min)
// - Longer refresh token expiry (7 days)
// - Token blacklist for logout (Redis)
// - Use RS256 (asymmetric) for microservices (public key verification)
// - Never store sensitive data in JWT payload (it's base64, not encrypted)
```

---

## Keyword: Method Security & Authorization

**Định nghĩa:** Fine-grained authorization tại method level — SpEL expressions, custom permission evaluators.

```java
@EnableMethodSecurity  // Spring Security 6+

@Service
public class DocumentService {

    // Role-based
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAll() { }

    // Permission-based with SpEL
    @PreAuthorize("hasAuthority('DOCUMENT_WRITE')")
    public Document create(Document doc) { }

    // Owner check — access method parameters
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public List<Document> findByUser(@Param("userId") Long userId) { }

    // Post-authorization — check return value
    @PostAuthorize("returnObject.owner == authentication.name")
    public Document findById(Long id) { }

    // Filter collections
    @PostFilter("filterObject.owner == authentication.name or hasRole('ADMIN')")
    public List<Document> findAll() { }

    // Custom permission evaluator
    @PreAuthorize("@documentSecurity.canEdit(#id, authentication)")
    public Document update(Long id, UpdateRequest request) { }
}

// Custom security evaluator
@Component("documentSecurity")
public class DocumentSecurityEvaluator {
    public boolean canEdit(Long documentId, Authentication auth) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) return false;
        String username = auth.getName();
        return doc.getOwner().equals(username)
            || auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
```

---

## Keyword: Common Security Vulnerabilities

**Định nghĩa:** OWASP Top 10 vulnerabilities và cách Spring Security bảo vệ.

```java
// 1. SQL Injection — Spring Data JPA parameterized queries protect
// ❌ Vulnerable:
@Query(value = "SELECT * FROM users WHERE name = '" + name + "'", nativeQuery = true)
// ✅ Safe: parameterized
@Query("SELECT u FROM User u WHERE u.name = :name")

// 2. XSS — Spring escapes output by default (Thymeleaf)
// For REST APIs: Jackson escapes HTML in JSON by default

// 3. CSRF — Spring Security enables by default for session-based auth
// Disable for stateless JWT APIs: csrf.disable()

// 4. Broken Authentication
// - BCrypt password hashing (adaptive, salt built-in)
// - Account lockout after N failed attempts
// - Rate limiting on login endpoint

// 5. Sensitive Data Exposure
// - HTTPS everywhere (server.ssl.enabled=true)
// - Don't log passwords, tokens, PII
// - Don't include sensitive data in JWT payload
// - Secure headers:
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
    .frameOptions(frame -> frame.deny())
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000))
);

// 6. Mass Assignment — don't bind request directly to entity
// ❌ @RequestBody User user → client can set role, id, etc.
// ✅ @RequestBody CreateUserRequest request → DTO with only allowed fields
```

---

## Tóm Tắt Keywords

| Keyword | Định nghĩa ngắn | Senior Focus |
|---------|-----------------|-------------|
| Filter Chain | Servlet filters for security concerns | Multiple chains, custom filters, order |
| JWT Authentication | Stateless token-based auth | Refresh rotation, blacklist, RS256 for microservices |
| Method Security | @PreAuthorize, @PostAuthorize, SpEL | Custom evaluators, owner checks, collection filtering |
| Security Vulnerabilities | OWASP Top 10 protection | SQL injection, XSS, CSRF, mass assignment |
