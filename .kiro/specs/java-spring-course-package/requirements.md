# Tài Liệu Yêu Cầu — Java Spring Course Package

## Giới Thiệu

Tính năng này tạo một gói nội dung khóa học Java Spring toàn diện cho ứng dụng học tập mobile. Gói nội dung bao gồm tài liệu từ kiến thức Java cơ bản nhất đến Spring Framework nâng cao, từ dự án đơn lẻ đến kiến trúc microservice thực tế. Toàn bộ nội dung được lưu trữ local-first trong WatermelonDB, không yêu cầu kết nối mạng.

## Thuật Ngữ

- **Course_Package**: Gói nội dung khóa học bao gồm tất cả modules, lessons, keywords và bài tập cho một khóa học cụ thể
- **Module**: Đơn vị tổ chức lớn nhất trong khóa học, nhóm các bài học theo chủ đề (ví dụ: "Java Core", "Spring Boot Basics")
- **Lesson**: Một bài học cụ thể trong module, chứa nội dung lý thuyết, ví dụ code và bài tập
- **Keyword_Entry**: Một mục từ khóa kỹ thuật bao gồm tên, định nghĩa, giải thích chi tiết, ví dụ code và liên kết đến bài học liên quan
- **Learning_Path**: Lộ trình học tập xác định thứ tự các module và lesson, bao gồm prerequisites giữa các bài học
- **Content_Renderer**: Thành phần hiển thị nội dung bài học bao gồm text, code blocks, diagrams và interactive elements
- **Progress_Tracker**: Thành phần theo dõi tiến độ học tập của người dùng cho từng lesson, module và toàn khóa học
- **Search_Engine**: Thành phần tìm kiếm nội dung trong toàn bộ khóa học bao gồm keywords, lessons và code examples
- **Bookmark_Manager**: Thành phần quản lý đánh dấu (bookmark) các nội dung quan trọng để xem lại
- **Code_Example**: Đoạn code minh họa kèm theo giải thích, có syntax highlighting và khả năng copy
- **Quiz**: Bài kiểm tra kiến thức gắn với lesson hoặc module, bao gồm câu hỏi trắc nghiệm và tự luận ngắn
- **Difficulty_Level**: Mức độ khó của nội dung, gồm 4 cấp: Beginner, Intermediate, Advanced, Expert
- **WatermelonDB**: Cơ sở dữ liệu local-first reactive dùng cho React Native, lưu trữ structured data
- **AsyncStorage**: Key-value storage đơn giản cho React Native, chỉ dùng cho settings nhỏ

## Yêu Cầu

### Yêu Cầu 1: Cấu Trúc Dữ Liệu Khóa Học

**User Story:** Là người học, tôi muốn khóa học được tổ chức theo cấu trúc rõ ràng từ cơ bản đến nâng cao, để tôi có thể học theo lộ trình logic và không bị bỡ ngỡ.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL tổ chức nội dung thành các modules theo thứ tự: Java Core Fundamentals, Java OOP, Java Advanced, Spring Framework Basics, Spring Boot, Spring Data & Persistence, Spring Security, Spring Cloud & Microservices, và Real-world Project Patterns.
2. WHEN một Module được tạo, THE Course_Package SHALL gán cho Module đó một Difficulty_Level tương ứng (Beginner, Intermediate, Advanced, hoặc Expert).
3. THE Course_Package SHALL make all modules freely accessible to the user without prerequisite locking — users can study any module in any order.
4. WHEN một Lesson được tạo, THE Course_Package SHALL gán Lesson đó vào đúng một Module và xác định vị trí thứ tự trong Module.
5. THE Course_Package SHALL lưu trữ toàn bộ cấu trúc khóa học trong WatermelonDB (SQLiteAdapter) với các bảng riêng biệt cho modules, lessons, keywords, code examples và quizzes.

### Yêu Cầu 2: Nội Dung Java Core Fundamentals

**User Story:** Là người mới bắt đầu, tôi muốn học các kiến thức Java cơ bản nhất một cách có hệ thống, để tôi có nền tảng vững chắc trước khi học Spring.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: Variables & Data Types, Operators, Control Flow (if/else, switch, loops), Arrays, Strings, Methods, và Exception Handling cơ bản.
2. WHEN một Lesson thuộc module Java Core Fundamentals được hiển thị, THE Content_Renderer SHALL hiển thị ít nhất một Code_Example minh họa cho mỗi khái niệm chính trong bài học.
3. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi thuật ngữ kỹ thuật trong module Java Core Fundamentals bao gồm: định nghĩa ngắn gọn, giải thích chi tiết, ví dụ code, và liên kết đến lesson liên quan.
4. WHEN người dùng hoàn thành tất cả lessons trong module Java Core Fundamentals, THE Progress_Tracker SHALL đánh dấu module là hoàn thành và mở khóa module Java OOP.

### Yêu Cầu 3: Nội Dung Java OOP

**User Story:** Là người học, tôi muốn nắm vững lập trình hướng đối tượng trong Java, để tôi hiểu được nền tảng thiết kế của Spring Framework.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: Classes & Objects, Encapsulation, Inheritance, Polymorphism, Abstraction, Interfaces, Abstract Classes, Enums, và SOLID Principles.
2. WHEN một Lesson về design pattern được hiển thị, THE Content_Renderer SHALL hiển thị ít nhất một Code_Example thực tế minh họa pattern đó trong ngữ cảnh ứng dụng Java.
3. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi OOP concept và design principle bao gồm so sánh với các concept liên quan (ví dụ: Interface vs Abstract Class).

### Yêu Cầu 4: Nội Dung Java Advanced

**User Story:** Là người học, tôi muốn học các tính năng nâng cao của Java, để tôi có thể hiểu và sử dụng hiệu quả các tính năng phức tạp trong Spring.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: Generics, Collections Framework, Lambda Expressions, Stream API, Optional, Concurrency & Multithreading, Java I/O & NIO, Reflection, Annotations, và Java Modules.
2. WHEN một Lesson về Collections hoặc Stream API được hiển thị, THE Content_Renderer SHALL hiển thị Code_Example so sánh cách tiếp cận truyền thống và cách tiếp cận sử dụng tính năng mới.
3. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi Java advanced feature bao gồm: use cases phổ biến, best practices, và common pitfalls.

### Yêu Cầu 5: Nội Dung Spring Framework Basics

**User Story:** Là người học, tôi muốn hiểu các khái niệm nền tảng của Spring Framework, để tôi có thể nắm được cách Spring hoạt động trước khi đi vào các module cụ thể.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: Spring IoC Container, Dependency Injection (Constructor, Setter, Field), Bean Lifecycle, Bean Scopes, Spring Configuration (XML, Annotation, Java Config), ApplicationContext, và Spring AOP basics.
2. WHEN một Lesson về Dependency Injection được hiển thị, THE Content_Renderer SHALL hiển thị Code_Example cho cả ba phương pháp injection (Constructor, Setter, Field) với giải thích ưu nhược điểm của từng phương pháp.
3. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi Spring annotation phổ biến (@Component, @Service, @Repository, @Controller, @Autowired, @Bean, @Configuration, @Qualifier, @Primary, @Scope).

### Yêu Cầu 6: Nội Dung Spring Boot

**User Story:** Là người học, tôi muốn học Spring Boot để nhanh chóng xây dựng ứng dụng Spring, để tôi có thể tạo dự án thực tế một cách hiệu quả.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: Spring Boot Auto-configuration, Spring Boot Starters, Application Properties & YAML, Profiles, Spring Boot Actuator, REST API Development, Request/Response Handling, Validation, Error Handling, và Logging.
2. WHEN một Lesson về REST API được hiển thị, THE Content_Renderer SHALL hiển thị Code_Example hoàn chỉnh cho một CRUD endpoint bao gồm Controller, Service, và DTO layers.
3. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi Spring Boot annotation và configuration property phổ biến bao gồm: mô tả chức năng, giá trị mặc định, và ví dụ sử dụng.

### Yêu Cầu 7: Nội Dung Spring Data & Persistence

**User Story:** Là người học, tôi muốn học cách làm việc với cơ sở dữ liệu trong Spring, để tôi có thể xây dựng ứng dụng có khả năng lưu trữ và truy vấn dữ liệu.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: JDBC Template, Spring Data JPA, Entity Mapping, Repository Pattern, Query Methods, JPQL & Native Queries, Pagination & Sorting, Transaction Management, Database Migration (Flyway/Liquibase), và Caching với Spring Cache.
2. WHEN một Lesson về JPA Entity Mapping được hiển thị, THE Content_Renderer SHALL hiển thị Code_Example cho các relationship types: OneToOne, OneToMany, ManyToOne, và ManyToMany.
3. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi JPA annotation (@Entity, @Table, @Id, @GeneratedValue, @Column, @OneToMany, @ManyToOne, @JoinColumn, @Transactional) bao gồm giải thích thuộc tính và ví dụ.

### Yêu Cầu 8: Nội Dung Spring Security

**User Story:** Là người học, tôi muốn học cách bảo mật ứng dụng Spring, để tôi có thể xây dựng ứng dụng an toàn trong thực tế.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: Authentication & Authorization concepts, Spring Security Configuration, UserDetailsService, Password Encoding, Role-Based Access Control, Method Security, JWT Authentication, OAuth2 basics, CORS Configuration, và CSRF Protection.
2. WHEN một Lesson về JWT Authentication được hiển thị, THE Content_Renderer SHALL hiển thị Code_Example hoàn chỉnh cho flow: tạo token, validate token, và filter chain configuration.
3. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi Security concept và annotation bao gồm: mô tả threat model mà concept đó giải quyết.

### Yêu Cầu 9: Nội Dung Spring Cloud & Microservices

**User Story:** Là người học, tôi muốn học kiến trúc microservices với Spring Cloud, để tôi có thể thiết kế và xây dựng hệ thống phân tán trong thực tế.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: Microservices Architecture Patterns, Spring Cloud Config, Service Discovery (Eureka), API Gateway (Spring Cloud Gateway), Load Balancing, Circuit Breaker (Resilience4j), Distributed Tracing, Message Queues (RabbitMQ/Kafka basics), và Docker & Container basics cho Spring apps.
2. WHEN một Lesson về Microservices Architecture được hiển thị, THE Content_Renderer SHALL hiển thị architecture diagrams dưới dạng text-based hoặc image mô tả mối quan hệ giữa các services.
3. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi microservice pattern (Circuit Breaker, Service Discovery, API Gateway, Saga, CQRS, Event Sourcing) bao gồm: vấn đề pattern giải quyết, khi nào nên dùng, và khi nào không nên dùng.

### Yêu Cầu 10: Nội Dung Real-world Project Patterns

**User Story:** Là người học, tôi muốn học các patterns và best practices từ dự án thực tế, để tôi có thể áp dụng kiến thức vào công việc.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp lessons bao gồm: Project Structure Best Practices, Layered Architecture, Clean Architecture, Testing Strategies (Unit, Integration, E2E), CI/CD Pipeline basics, Monitoring & Logging best practices, Performance Tuning, và Common Anti-patterns.
2. WHEN một Lesson về architecture pattern được hiển thị, THE Content_Renderer SHALL hiển thị Code_Example minh họa cấu trúc thư mục và code skeleton cho pattern đó.
3. THE Course_Package SHALL cung cấp ít nhất hai case studies hoàn chỉnh: một cho standalone Spring Boot application và một cho microservices system, mỗi case study bao gồm requirements, architecture decisions, và code highlights.

### Yêu Cầu 11: Hệ Thống Keyword & Giải Thích

**User Story:** Là người học, tôi muốn tra cứu nhanh các thuật ngữ kỹ thuật với giải thích rõ ràng, để tôi không bị gián đoạn khi gặp từ khóa mới trong bài học.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp Keyword_Entry cho mỗi thuật ngữ kỹ thuật quan trọng trong toàn bộ khóa học, mỗi entry bao gồm: tên keyword, định nghĩa ngắn (tối đa 100 ký tự), giải thích chi tiết, ví dụ code, và danh sách lessons liên quan.
2. WHEN người dùng tìm kiếm một keyword, THE Search_Engine SHALL trả về kết quả trong danh sách Keyword_Entry khớp với từ khóa tìm kiếm, sắp xếp theo mức độ liên quan.
3. THE Course_Package SHALL phân loại keywords theo categories: Java Core, OOP, Java Advanced, Spring Core, Spring Boot, Spring Data, Spring Security, Spring Cloud, và Design Patterns.
4. WHEN một Keyword_Entry được hiển thị, THE Content_Renderer SHALL hiển thị liên kết đến các keywords liên quan (related keywords) để người dùng khám phá thêm.

### Yêu Cầu 12: Theo Dõi Tiến Độ Học Tập

**User Story:** Là người học, tôi muốn theo dõi tiến độ học tập của mình, để tôi biết mình đã học đến đâu và cần học thêm gì.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng hoàn thành một Lesson, THE Progress_Tracker SHALL lưu trạng thái hoàn thành vào WatermelonDB bao gồm: lesson ID, thời điểm hoàn thành, và thời gian học.
2. THE Progress_Tracker SHALL tính toán và hiển thị phần trăm hoàn thành cho mỗi Module dựa trên số lessons đã hoàn thành chia cho tổng số lessons trong Module.
3. THE Progress_Tracker SHALL tính toán và hiển thị phần trăm hoàn thành tổng thể cho toàn khóa học dựa trên số lessons đã hoàn thành chia cho tổng số lessons.
4. WHEN người dùng mở ứng dụng, THE Progress_Tracker SHALL hiển thị lesson gần nhất chưa hoàn thành để người dùng tiếp tục học.

### Yêu Cầu 13: Tìm Kiếm Nội Dung

**User Story:** Là người học, tôi muốn tìm kiếm nhanh nội dung trong khóa học, để tôi có thể tra cứu lại kiến thức khi cần.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng nhập từ khóa tìm kiếm, THE Search_Engine SHALL tìm kiếm trong tiêu đề lessons, nội dung keywords, và code examples, trả về kết quả trong vòng 500ms.
2. THE Search_Engine SHALL hỗ trợ tìm kiếm bằng cả tiếng Việt và tiếng Anh cho các thuật ngữ kỹ thuật.
3. WHEN kết quả tìm kiếm được hiển thị, THE Search_Engine SHALL nhóm kết quả theo loại: Lessons, Keywords, và Code Examples.
4. IF không có kết quả tìm kiếm nào khớp, THEN THE Search_Engine SHALL hiển thị thông báo "Không tìm thấy kết quả" và gợi ý các từ khóa liên quan.

### Yêu Cầu 14: Đánh Dấu & Ghi Chú

**User Story:** Là người học, tôi muốn đánh dấu các nội dung quan trọng và ghi chú cá nhân, để tôi có thể xem lại nhanh khi cần ôn tập.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng đánh dấu bookmark một Lesson hoặc Keyword_Entry, THE Bookmark_Manager SHALL lưu bookmark vào WatermelonDB bao gồm: item ID, item type, thời điểm bookmark, và ghi chú tùy chọn.
2. THE Bookmark_Manager SHALL hiển thị danh sách tất cả bookmarks được sắp xếp theo thời gian tạo, với khả năng lọc theo module hoặc loại nội dung.
3. WHEN người dùng xóa một bookmark, THE Bookmark_Manager SHALL xóa bookmark khỏi WatermelonDB và cập nhật danh sách hiển thị.

### Yêu Cầu 15: Quiz & Kiểm Tra Kiến Thức

**User Story:** Là người học, tôi muốn làm bài kiểm tra sau mỗi bài học, để tôi đánh giá được mức độ hiểu biết của mình.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL cung cấp ít nhất một Quiz cho mỗi Lesson, mỗi Quiz bao gồm tối thiểu 3 câu hỏi trắc nghiệm liên quan đến nội dung bài học.
2. WHEN người dùng hoàn thành một Quiz, THE Progress_Tracker SHALL lưu kết quả vào WatermelonDB bao gồm: quiz ID, điểm số, câu trả lời, và thời điểm làm bài.
3. WHEN người dùng trả lời sai một câu hỏi, THE Content_Renderer SHALL hiển thị giải thích đáp án đúng và liên kết đến phần nội dung liên quan trong Lesson.
4. THE Course_Package SHALL cho phép người dùng làm lại Quiz không giới hạn số lần, và Progress_Tracker SHALL lưu lại lịch sử tất cả các lần làm bài.

### Yêu Cầu 16: Hiển Thị Code Examples

**User Story:** Là người học, tôi muốn xem code examples với syntax highlighting rõ ràng, để tôi dễ đọc và hiểu code.

#### Tiêu Chí Chấp Nhận

1. WHEN một Code_Example được hiển thị, THE Content_Renderer SHALL áp dụng syntax highlighting cho ngôn ngữ Java.
2. WHEN người dùng nhấn nút copy trên một Code_Example, THE Content_Renderer SHALL sao chép toàn bộ nội dung code vào clipboard của thiết bị.
3. THE Content_Renderer SHALL hiển thị Code_Example với font monospace, line numbers, và khả năng cuộn ngang cho các dòng code dài.
4. WHEN một Code_Example có nhiều phần (multi-file example), THE Content_Renderer SHALL hiển thị tabs cho mỗi file với tên file rõ ràng.

### Yêu Cầu 17: Lưu Trữ Dữ Liệu Local-First

**User Story:** Là người học, tôi muốn sử dụng ứng dụng mà không cần kết nối internet, để tôi có thể học mọi lúc mọi nơi.

#### Tiêu Chí Chấp Nhận

1. THE Course_Package SHALL lưu trữ toàn bộ nội dung khóa học (lessons, keywords, code examples, quizzes) trong WatermelonDB, không yêu cầu kết nối mạng để truy cập.
2. THE Progress_Tracker SHALL lưu trữ toàn bộ dữ liệu tiến độ học tập trong WatermelonDB.
3. THE Bookmark_Manager SHALL lưu trữ toàn bộ bookmarks và ghi chú trong WatermelonDB.
4. THE Course_Package SHALL sử dụng AsyncStorage chỉ cho các settings nhỏ như: theme preference, font size preference, và last opened lesson ID.
5. IF ứng dụng bị đóng đột ngột, THEN THE Progress_Tracker SHALL khôi phục trạng thái học tập từ dữ liệu đã lưu trong WatermelonDB khi ứng dụng được mở lại.

### Yêu Cầu 18: Seed Data & Content Loading

**User Story:** Là người phát triển, tôi muốn có cơ chế nạp nội dung khóa học vào database khi cài đặt ứng dụng lần đầu, để người dùng có thể bắt đầu học ngay.

#### Tiêu Chí Chấp Nhận

1. WHEN ứng dụng được khởi chạy lần đầu tiên, THE Course_Package SHALL tự động nạp toàn bộ seed data (modules, lessons, keywords, code examples, quizzes) vào WatermelonDB.
2. THE Course_Package SHALL lưu trữ seed data dưới dạng JSON files được bundle cùng ứng dụng.
3. WHEN quá trình nạp seed data đang diễn ra, THE Course_Package SHALL hiển thị progress indicator cho người dùng.
4. IF quá trình nạp seed data bị gián đoạn, THEN THE Course_Package SHALL phát hiện dữ liệu chưa hoàn chỉnh và tiếp tục nạp từ điểm dừng khi ứng dụng được mở lại.
5. THE Course_Package SHALL sử dụng version number cho seed data để hỗ trợ cập nhật nội dung trong các phiên bản ứng dụng sau.

### Yêu Cầu 19: Text-to-Speech (TTS)

**User Story:** Là người học, tôi muốn nghe nội dung bài học được đọc to, để tôi có thể học khi không tiện nhìn màn hình hoặc muốn ôn tập bằng tai.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng nhấn nút FAB "Đọc bài" trên màn hình bài học, THE Content_Renderer SHALL bắt đầu đọc nội dung bài học bằng Text-to-Speech (expo-speech).
2. THE TTS Controls panel SHALL cho phép người dùng điều chỉnh: tốc độ đọc (0.5x–2x), cao độ (Thấp/Bình thường/Cao), và chọn giọng đọc (Vietnamese voices).
3. THE TTS Service SHALL lưu cài đặt tốc độ, cao độ, và giọng đọc vào AsyncStorage để khôi phục khi mở lại app.
4. WHEN người dùng rời khỏi màn hình bài học, THE TTS Service SHALL tự động dừng đọc.
5. THE extractLessonText utility SHALL trích xuất plain text từ LessonContent, bao gồm headings, paragraphs, code (dòng đầu), tables, lists, và bỏ qua diagrams.
