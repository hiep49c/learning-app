# Yêu Cầu — App Thái Cực Quyền 24 Thức

Tài liệu mô tả yêu cầu chức năng cho **app độc lập** `app-taichi`. Viết theo dạng user story + tiêu chí chấp nhận (EARS) làm cơ sở cho `design.md` và tasks triển khai.

---

## 1. Phạm vi

### Trong phạm vi
- App di động độc lập (Android trước, có thể iOS sau) giới thiệu và hướng dẫn **Thái Cực Quyền 24 thức**.
- Soạn nội dung hướng dẫn chi tiết cho đủ **24 thức**.
- Hiển thị **hình ảnh** và **video** minh họa cho từng thức.
- Thu thập link media (ảnh/video) từ nguồn uy tín.
- Hỗ trợ **copy text** và **đọc text (TTS)**.
- Bookmark và tìm kiếm thức.

### Ngoài phạm vi
- Không chấm điểm/nhận diện động tác qua camera.
- Không tải/lưu video offline trong APK (dùng nhúng/stream để tránh tăng kích thước app). Ảnh tĩnh có thể bundle hoặc dùng URL.
- Không có tài khoản đăng nhập máy chủ / đồng bộ đám mây (dữ liệu tiến trình lưu cục bộ).
- Không chia sẻ code trực tiếp với `app-learning`/`app-vietlot` (chỉ tham khảo pattern).

---

## 2. Yêu cầu chức năng

### R1 — Màn hình chính & danh sách 24 thức
**Là** người tập, **tôi muốn** thấy danh sách 24 thức theo đúng trình tự **để** biết bài quyền gồm những gì.

- WHEN người dùng mở app THEN hệ thống SHALL hiển thị danh sách 24 thức theo đúng thứ tự từ "Khởi thế" đến "Thu thế".
- WHEN hiển thị mỗi thức trong danh sách THEN hệ thống SHALL hiển thị số thứ tự, tên Hán Việt và nghĩa tiếng Việt.
- WHEN người dùng bấm một thức THEN hệ thống SHALL mở màn hình chi tiết của thức đó.
- WHERE có ảnh đại diện THE danh sách SHALL hiển thị thumbnail của thức.

### R2 — Chi tiết từng thức
**Là** người tập, **tôi muốn** đọc hướng dẫn chi tiết **để** tập đúng động tác.

- WHEN người dùng mở chi tiết một thức THEN hệ thống SHALL hiển thị: tổng quan, trình tự động tác (từng bước), hơi thở & trọng tâm, yếu lĩnh, lỗi thường gặp, nguồn tham khảo.
- WHERE động tác có nguy cơ chấn thương (đá chân, hạ thấp trọng tâm) THE hệ thống SHALL hiển thị phần "Lưu ý an toàn".
- WHEN nội dung có bước đánh số THEN hệ thống SHALL hiển thị dạng danh sách có thứ tự.
- WHEN ở màn hình chi tiết THEN hệ thống SHALL cho phép chuyển nhanh sang thức trước/sau.

### R3 — Hình ảnh minh họa
**Là** người tập, **tôi muốn** xem ảnh tư thế **để** hình dung động tác.

- WHEN một thức có ảnh minh họa THEN hệ thống SHALL hiển thị ảnh kèm mô tả (alt text).
- IF ảnh tải từ URL thất bại THEN hệ thống SHALL hiển thị placeholder và không làm vỡ layout.
- WHEN hiển thị ảnh THEN hệ thống SHALL giữ đúng tỉ lệ khung hình, vừa chiều rộng màn hình.

### R4 — Video hướng dẫn
**Là** người tập, **tôi muốn** xem video động tác **để** nắm chuyển động liên tục.

- WHEN một thức có video THEN hệ thống SHALL hiển thị trình nhúng video (YouTube) có thể bấm phát.
- WHERE không có mạng THE hệ thống SHALL hiển thị thông báo cần kết nối để xem video, và vẫn cho đọc phần hướng dẫn chữ.
- WHEN hiển thị video THEN hệ thống SHALL kèm tiêu đề và link nguồn.

### R5 — Nguồn media uy tín
**Là** người dùng, **tôi muốn** media đến từ nguồn đáng tin **để** tập đúng chuẩn.

- WHEN gắn ảnh/video cho một thức THEN nội dung SHALL ưu tiên nguồn uy tín (kênh võ sư/giải vô địch, tổ chức wushu, tài liệu xuất bản) và ghi rõ nguồn.
- WHEN một media được chọn THEN `task.md` SHALL ghi lại URL, tên nguồn và trạng thái đã kiểm chứng.

### R6 — Copy text
**Là** người tập, **tôi muốn** copy nội dung **để** lưu/chia sẻ.

- WHEN người dùng nhấn giữ hoặc chọn một đoạn văn bản hướng dẫn THEN hệ thống SHALL cho phép copy đoạn đó.
- WHEN một thức hiển thị THEN mọi phần văn bản (tổng quan, bước, yếu lĩnh...) SHALL có thể chọn-copy.

### R7 — Đọc text (TTS)
**Là** người tập, **tôi muốn** nghe đọc hướng dẫn **để** vừa tập vừa nghe.

- WHEN người dùng bấm "Đọc bài" THEN hệ thống SHALL đọc phần hướng dẫn chữ bằng giọng tiếng Việt.
- WHEN TTS đang đọc THEN hệ thống SHALL cho tạm dừng/dừng và chỉnh tốc độ đọc.
- WHEN TTS gặp ảnh/video THEN hệ thống SHALL bỏ qua media (đọc tiêu đề/mô tả thay thế).
- WHEN người dùng rời màn hình chi tiết THEN hệ thống SHALL tự dừng đọc.

### R8 — Bookmark
- WHEN người dùng bookmark một thức THEN hệ thống SHALL lưu cục bộ và hiển thị trong danh sách đã lưu.
- WHEN người dùng bỏ bookmark THEN hệ thống SHALL xóa khỏi danh sách đã lưu.

### R9 — Tìm kiếm
- WHEN người dùng nhập từ khóa THEN hệ thống SHALL tìm theo tên Hán Việt và nghĩa tiếng Việt, trả về các thức khớp.
- WHERE không có kết quả THE hệ thống SHALL hiển thị trạng thái trống thân thiện.

### R10 — Cài đặt cơ bản
- WHEN người dùng mở cài đặt THEN hệ thống SHALL cho đổi giao diện Sáng/Tối/Hệ thống và cỡ chữ.
- WHEN người dùng đổi cài đặt THEN hệ thống SHALL lưu và áp dụng ngay.

---

## 3. Yêu cầu phi chức năng

- **Kích thước app:** Video KHÔNG bundle vào APK; dùng nhúng/stream. Ảnh tĩnh nếu bundle phải nén hợp lý.
- **Hoạt động offline cơ bản:** Nội dung chữ + ảnh bundle xem được khi offline; video cần mạng.
- **Hiệu năng:** Màn hình chi tiết mở trong < 1s trên thiết bị tầm trung.
- **Dữ liệu cục bộ:** Tiến trình, bookmark, cài đặt lưu trên máy (không cần tài khoản).
- **An toàn nội dung:** Mỗi thức có cảnh báo an toàn khi phù hợp; app có khuyến cáo chung.
- **Khả năng mở rộng:** Content model cho phép thêm bài quyền khác (ví dụ 48 thức) về sau.
- **Khả năng tiếp cận:** Hỗ trợ chọn-copy, TTS, cỡ chữ điều chỉnh được.

---

## 4. Giả định & phụ thuộc

- Tech stack: **React Native + Expo** (giống `app-learning`), **WatermelonDB + SQLiteAdapter** cho dữ liệu cục bộ, **expo-speech** cho TTS, **expo-router** cho điều hướng.
- Hiển thị video YouTube cần thư viện nhúng (`react-native-youtube-iframe` + `react-native-webview`) — chốt trong `design.md`.
- Nội dung hướng dẫn được tổng hợp/diễn giải lại từ nguồn uy tín để tránh sao chép nguyên văn.

---

## 5. Tiêu chí hoàn thành (Definition of Done)

- [ ] App `app-taichi` build & chạy độc lập (APK cài được).
- [ ] 24 thức hiển thị đúng thứ tự, mở chi tiết được, chuyển trước/sau được.
- [ ] Mỗi thức có hướng dẫn chi tiết đủ các mục ở R2.
- [ ] Mỗi thức có tối thiểu 1 ảnh hoặc 1 video từ nguồn uy tín (ghi nguồn).
- [ ] Block image/video render đúng; lỗi tải không vỡ layout.
- [ ] Copy + TTS hoạt động với toàn bộ nội dung.
- [ ] Bookmark, tìm kiếm, cài đặt theme/cỡ chữ hoạt động.
- [ ] Seed data sinh ra từ `doc/forms/` qua pipeline build.
