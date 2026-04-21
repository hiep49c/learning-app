---
inclusion: fileMatch
fileMatchPattern: "**/*.ts,**/*.tsx"
---

# Security & Privacy Rules

## Nguyên tắc Local-First
- KHÔNG tạo bất kỳ API call nào đến server bên ngoài
- KHÔNG tích hợp analytics, tracking, hoặc telemetry (Firebase Analytics, Mixpanel, Sentry...)
- KHÔNG dùng cloud database (Firestore, Supabase, Realm Sync...)
- KHÔNG gửi dữ liệu người dùng qua network dưới bất kỳ hình thức nào
- Mọi thuật toán phải chạy on-device, KHÔNG gọi AI API bên ngoài

## Data Storage Security
- Dữ liệu nhạy cảm (nếu có) mã hóa bằng `expo-secure-store`
- KHÔNG lưu plaintext passwords hoặc tokens
- KHÔNG log dữ liệu người dùng ra console trong production

## Permissions
- Chỉ request permissions thực sự cần thiết
- Giải thích rõ lý do trước khi request permission
- App phải hoạt động được (degraded mode) nếu user từ chối permission
- Permissions cần thiết tối thiểu:
  - Notifications (cho nhắc nhở lịch học)
  - Không cần: Camera, Location, Contacts, Microphone

## Input Validation
- Validate mọi user input trước khi lưu vào database
- Sanitize text input để tránh injection
- Giới hạn độ dài input hợp lý (tên môn học ≤ 100 ký tự, ghi chú ≤ 5000 ký tự)
- Validate số liệu: thời gian học > 0, số ngày > 0, điểm số trong range hợp lệ
- Validate data khi import từ JSON file — KHÔNG trust external data

## Secure Coding
- KHÔNG dùng `eval()`, `new Function()`, hoặc dynamic code execution
- KHÔNG lưu secrets trong source code
- KHÔNG dùng HTTP — chỉ HTTPS nếu bất kỳ network call nào được thêm sau này
- Dùng `expo-crypto` cho random generation thay vì `Math.random()` khi cần cryptographic randomness
- KHÔNG dùng deprecated APIs

## Build Security
- KHÔNG commit `.env` files vào git
- Dùng `.gitignore` đầy đủ cho React Native/Expo
- KHÔNG hardcode API keys, secrets trong code
- Enable ProGuard/R8 cho Android release builds

## Privacy by Design
- Không thu thập bất kỳ PII (Personally Identifiable Information) nào
- Không yêu cầu đăng ký tài khoản — app hoạt động ngay khi mở
- Dữ liệu backup do user chủ động export
- Export data ở format mở (JSON) để user có thể đọc và kiểm tra
- Cung cấp tính năng xóa toàn bộ dữ liệu (hard purge) trong Settings
