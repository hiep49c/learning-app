# 🥋 App Thái Cực Quyền 24 Thức

> App di động độc lập hướng dẫn tập **Thái Cực Quyền 24 thức** (bài giản hóa Bắc Kinh, phái Dương) để tăng cường sức khỏe. Mỗi chiêu thức có hướng dẫn chi tiết, hình ảnh/video minh họa từ nguồn uy tín, hỗ trợ copy text và đọc text (TTS), xem bài tập dễ dàng.

---

## 📌 Giới thiệu

`app-taichi` là **app độc lập**, nằm song song với `app-learning` và `app-vietlot` trong repo `learning-app`. App không phụ thuộc và không chia sẻ code trực tiếp với 2 app kia, nhưng **tái sử dụng cùng tech stack và các pattern đã được kiểm chứng** (Expo Router, WatermelonDB, TTS, bookmark, content renderer) để tiết kiệm công sức và giữ chất lượng.

```
learning-app/
├── app-learning/     # App học Java/English (độc lập)
├── app-vietlot/      # App xổ số Vietlott (độc lập)
└── app-taichi/       # App Thái Cực Quyền 24 thức (MỚI — độc lập)
```

### Mục tiêu
- Người tập xem được **24 chiêu thức** theo đúng trình tự bài quyền.
- Mỗi thức có **hướng dẫn chi tiết**: trình tự động tác, hơi thở, trọng tâm, yếu lĩnh, lỗi thường gặp, lưu ý an toàn.
- Mỗi thức có **ảnh và/hoặc video minh họa** từ nguồn được đánh giá cao.
- **Copy text** và **đọc text (TTS)** để học linh hoạt.
- **Xem dễ dàng**: danh sách rõ ràng, chi tiết trực quan, bookmark, tìm kiếm.

---

## 🧭 Nội dung — 24 chiêu thức

Bài quyền là chuỗi 24 động tác liên tục, tập theo đúng thứ tự:

| # | Tên Hán Việt | Nghĩa tiếng Việt | Pinyin / tên tiếng Anh thông dụng |
|---|---|---|---|
| 1 | Khởi thế | Bắt đầu | Qǐshì — Commencing |
| 2 | Tả hữu dã mã phân bờm | Ngựa hoang rẽ bờm hai bên | Zuǒyòu Yěmǎ Fēnzōng — Parting the Wild Horse's Mane |
| 3 | Bạch hạc lượng xí | Hạc trắng xòe cánh | Báihè Liàngchì — White Crane Spreads Its Wings |
| 4 | Tả hữu lâu tất ảo bộ | Gạt gối bước ngoằn ngoèo | Zuǒyòu Lōuxī Àobù — Brush Knee and Step Forward |
| 5 | Thủ huy tỳ bà | Tay gảy đàn tỳ bà | Shǒuhūi Pípá — Hands Play the Pipa |
| 6 | Đảo niệm hầu | Khỉ lùi lại phía sau | Dào Juǎn Gōng — Reverse Reeling Forearm / Repulse Monkey |
| 7 | Tả lãm tước vĩ | Nắm đuôi chim tước bên trái | Zuǒ Lǎn Quèwěi — Left Grasp Sparrow's Tail |
| 8 | Hữu lãm tước vĩ | Nắm đuôi chim tước bên phải | Yòu Lǎn Quèwěi — Right Grasp Sparrow's Tail |
| 9 | Đơn tiên | Cầm roi một tay | Dān Biān — Single Whip |
| 10 | Vân thủ | Tay vận chuyển như mây | Yúnshǒu — Cloud Hands |
| 11 | Đơn tiên | Cầm roi một tay | Dān Biān — Single Whip |
| 12 | Cao thám mã | Xoa đầu ngựa | Gāo Tàn Mǎ — High Pat on Horse |
| 13 | Hữu đặng cước | Đá gót chân phải | Yòu Dēng Jiǎo — Right Heel Kick |
| 14 | Song phong quán nhĩ | Hai quả núi xuyên vào tai | Shuāngfēng Guàn'ěr — Strike to Ears with Both Fists |
| 15 | Trưởng thân tả đặng cước | Xoay người đá gót chân trái | Zhuǎnshēn Zuǒ Dēngjiǎo — Turn Body and Left Heel Kick |
| 16 | Tả hạ thế độc lập | Ngồi thấp vươn lên đứng một chân bên trái (Kim kê độc lập) | Zuǒ Xiàshì Dúlì — Lower Body & Stand on One Leg, Left |
| 17 | Hữu hạ thế độc lập | Ngồi thấp vươn lên đứng một chân bên phải | Yòu Xiàshì Dúlì — Lower Body & Stand on One Leg, Right |
| 18 | Tả hữu ngọc nữ xuyên thoa | Thiếu nữ đưa thoi hai bên | Yùnǚ Chuānsuō — Fair Lady Works the Shuttles |
| 19 | Hải để châm | Kim chìm đáy biển | Hǎidǐ Zhēn — Needle at Sea Bottom |
| 20 | Thiểm thông tý | Tia chớp phóng qua tay | Shān Tōng Bèi — Fan Through Back |
| 21 | Chuyển thân ban lan chùy | Xoay người gạt đỡ và đấm | Zhuǎnshēn Bānlánchuí — Turn, Deflect, Parry & Punch |
| 22 | Như phong tự bế | Đóng kín như niêm phong | Rúfēng Sìbì — Apparent Close Up |
| 23 | Thập tự thủ | Bắt chéo tay chữ thập | Shízìshǒu — Cross Hands |
| 24 | Thu thế | Kết thúc | Shōushì — Closing |

> **Đối chiếu nguồn chuẩn:** Trình tự trên khớp với bài *24-posture Simplified Tai Chi Form* (bài Bắc Kinh 1956, dựa trên phái Dương) theo [Wikipedia — 24-form tai chi](https://en.wikipedia.org/wiki/24-form_tai_chi). Khác biệt duy nhất ở cách đánh số: tài liệu chuẩn tách "Lãm tước vĩ" thành 4 kỹ thuật con (Bằng/Lí/Tê/Án — Ward Off / Rollback / Press / Push), còn cách đếm 24 thức phổ biến gộp lại thành một thức. *Nội dung đã được diễn giải lại cho phù hợp giấy phép nguồn.*

---

## 🎯 Tính năng người dùng

| Tính năng | Mô tả |
|---|---|
| Danh sách 24 thức | Hiển thị đúng thứ tự, kèm số thứ tự + tên Hán Việt + nghĩa tiếng Việt |
| Chi tiết từng thức | Tổng quan, trình tự động tác, hơi thở & trọng tâm, yếu lĩnh, lỗi thường gặp, lưu ý an toàn |
| Hình ảnh minh họa | Ảnh tư thế cho mỗi thức, giữ đúng tỉ lệ, có mô tả |
| Video hướng dẫn | Nhúng video (YouTube) từ nguồn uy tín, bấm phát |
| Copy text | Chọn và copy toàn bộ nội dung chữ |
| Đọc text (TTS) | Nghe hướng dẫn bằng giọng tiếng Việt |
| Bookmark | Đánh dấu thức yêu thích |
| Tìm kiếm | Tìm theo tên Hán Việt hoặc nghĩa tiếng Việt |

---

## 📁 Cấu trúc tài liệu

```
app-taichi/doc/
├── README.md          # (file này) Tổng quan app + danh sách 24 thức + đối chiếu nguồn + format
├── requirements.md    # Yêu cầu chức năng (user story + tiêu chí chấp nhận)
├── design.md          # Thiết kế kỹ thuật: kiến trúc, data model, content block image/video, pipeline media
├── task.md            # Tiến độ tổng hợp nội dung 24 thức + bảng nguồn media
└── forms/             # (sẽ tạo khi soạn nội dung) 1 file .md cho mỗi thức
    ├── 01-khoi-the.md
    ├── 02-da-ma-phan-bom.md
    └── ...
```

---

## 📝 Format một bài học (mỗi chiêu thức)

Mỗi file trong `forms/` tuân theo khung sau, để script build parse thành `content_json`:

```markdown
# <Tên Hán Việt> (<Nghĩa tiếng Việt>)

## Tổng quan
Vai trò của thức trong bài, nhóm động tác, hướng di chuyển.

## Hình ảnh minh họa
![Mô tả tư thế](<đường dẫn ảnh hoặc URL>)

## Video hướng dẫn
@video[<tiêu đề>](<URL YouTube>)

## Trình tự động tác
1. Bước 1 ...
2. Bước 2 ...

## Hơi thở & trọng tâm
- Hít vào khi ...
- Thở ra khi ...
- Hư/thực: dồn trọng tâm chân ...

## Yếu lĩnh (điểm mấu chốt)
- Lấy eo làm trục ...

## Lỗi thường gặp
- ...

## Lưu ý an toàn
- (khi động tác có nguy cơ: đá chân, hạ thấp trọng tâm)

## Nguồn tham khảo
- [Tên nguồn](URL)
```

---

## ⚠️ Lưu ý về an toàn tập luyện

Nội dung trong app mang tính **tham khảo và minh họa**, không thay thế việc học trực tiếp với võ sư. Thái Cực Quyền đòi hỏi kết hợp **Ý – Khí – Hình** (tâm trí tập trung, hơi thở điều hòa, động tác liên tục không ngắt quãng, lấy eo làm trục, hư thực phân minh). Người mới nên:

- Tập chậm, khởi động kỹ khớp gối và cổ chân.
- Tìm video chuẩn từ võ sư (từ khóa: *"Thái cực quyền 24 thức chuẩn"*) hoặc tham gia câu lạc bộ để được chỉnh tư thế, tránh chấn thương khớp gối.
- Mỗi bài học có phần "Lưu ý an toàn" riêng khi động tác có nguy cơ.

---

## 🔗 Liên kết

- [Yêu cầu chức năng](./requirements.md)
- [Thiết kế kỹ thuật](./design.md)
- [Tiến độ nội dung](./task.md)
- Nguồn chuẩn tên thức: [Wikipedia — 24-form tai chi](https://en.wikipedia.org/wiki/24-form_tai_chi)
