# Tiến Độ Nội Dung — 24 Thức Thái Cực Quyền

Theo dõi tiến độ soạn hướng dẫn chi tiết và thu thập media (ảnh/video) cho từng thức. Mỗi thức "hoàn thành" khi có: hướng dẫn chi tiết đủ mục + ≥1 ảnh hoặc video từ nguồn uy tín (đã ghi nguồn).

## Trạng thái tổng quan
- forms_total: 24
- forms_content_done: 0 / 24
- forms_media_done: 0 / 24
- seed_generated: false

## Chú thích cột
- **Nội dung**: đã soạn file `doc/forms/NN-*.md` đủ các mục (tổng quan, trình tự, hơi thở & trọng tâm, yếu lĩnh, lỗi thường gặp, lưu ý an toàn nếu cần).
- **Ảnh**: đã có ≥1 ảnh minh họa + ghi nguồn.
- **Video**: đã có ≥1 video nhúng + ghi nguồn.
- **An toàn**: cần phần "Lưu ý an toàn" (động tác đá chân / hạ thấp trọng tâm).

| # | Thức (Hán Việt) | Nội dung | Ảnh | Video | An toàn | Ghi chú nguồn |
|---|---|:---:|:---:|:---:|:---:|---|
| 1  | Khởi thế | ☐ | ☐ | ☐ | – | |
| 2  | Tả hữu dã mã phân bờm | ☐ | ☐ | ☐ | – | |
| 3  | Bạch hạc lượng xí | ☐ | ☐ | ☐ | – | |
| 4  | Tả hữu lâu tất ảo bộ | ☐ | ☐ | ☐ | – | |
| 5  | Thủ huy tỳ bà | ☐ | ☐ | ☐ | – | |
| 6  | Đảo niệm hầu | ☐ | ☐ | ☐ | – | |
| 7  | Tả lãm tước vĩ | ☐ | ☐ | ☐ | – | gồm Bằng/Lí/Tê/Án |
| 8  | Hữu lãm tước vĩ | ☐ | ☐ | ☐ | – | gồm Bằng/Lí/Tê/Án |
| 9  | Đơn tiên | ☐ | ☐ | ☐ | – | |
| 10 | Vân thủ | ☐ | ☐ | ☐ | – | |
| 11 | Đơn tiên | ☐ | ☐ | ☐ | – | lặp lại thức 9 |
| 12 | Cao thám mã | ☐ | ☐ | ☐ | – | |
| 13 | Hữu đặng cước | ☐ | ☐ | ☐ | ⚠️ | đá gót chân |
| 14 | Song phong quán nhĩ | ☐ | ☐ | ☐ | – | |
| 15 | Trưởng thân tả đặng cước | ☐ | ☐ | ☐ | ⚠️ | xoay + đá gót |
| 16 | Tả hạ thế độc lập | ☐ | ☐ | ☐ | ⚠️ | hạ thấp trọng tâm + đứng 1 chân |
| 17 | Hữu hạ thế độc lập | ☐ | ☐ | ☐ | ⚠️ | hạ thấp trọng tâm + đứng 1 chân |
| 18 | Tả hữu ngọc nữ xuyên thoa | ☐ | ☐ | ☐ | – | |
| 19 | Hải để châm | ☐ | ☐ | ☐ | ⚠️ | cúi người thấp |
| 20 | Thiểm thông tý | ☐ | ☐ | ☐ | – | |
| 21 | Chuyển thân ban lan chùy | ☐ | ☐ | ☐ | – | |
| 22 | Như phong tự bế | ☐ | ☐ | ☐ | – | |
| 23 | Thập tự thủ | ☐ | ☐ | ☐ | – | |
| 24 | Thu thế | ☐ | ☐ | ☐ | – | |

---

## Bảng nguồn media (điền khi thu thập)

Mỗi dòng = 1 media được chọn cho một thức. Chỉ đưa vào seed khi cột "Đã kiểm chứng" = ✔.

| Thức # | Loại | Tiêu đề | URL | Nguồn (tên) | Đã kiểm chứng |
|---|---|---|---|---|:---:|
| | | | | | ☐ |

### Ứng viên nguồn tổng thể (toàn bài 24 thức)
Có thể dùng chung cho nhiều thức (cắt theo mốc thời gian):

| Mô tả | URL | Nguồn | Ghi chú |
|---|---|---|---|
| Trình diễn 24 thức chuẩn (vô địch Taijiquan) | *(điền khi chọn)* | — | Wikipedia dẫn video "Qiu Huifang, World Taijiquan Champion" |
| Tài liệu tên thức chuẩn | https://en.wikipedia.org/wiki/24-form_tai_chi | Wikipedia | Dùng đối chiếu tên/trình tự |

---

## Việc tiếp theo (sau khi doc được duyệt)
1. [ ] Khởi tạo project Expo `app-taichi` + cài dependencies (xem design §2).
2. [ ] Dựng schema WatermelonDB + models (design §3).
3. [ ] Viết `ContentRenderer` có block image/video/callout (design §4).
4. [ ] Soạn nội dung 24 file trong `doc/forms/` + thu thập media (bảng trên).
5. [ ] Viết `scripts/parse-forms.ts` sinh seed JSON (design §7).
6. [ ] `SeedService`, `TTSService`, bookmark, search, settings.
7. [ ] Build APK thử nghiệm + kiểm tra copy/TTS/ảnh/video.

> Lưu ý: nội dung hướng dẫn võ thuật cần diễn giải lại từ nguồn uy tín, kèm khuyến cáo học trực tiếp với võ sư; không sao chép nguyên văn tài liệu có bản quyền.
