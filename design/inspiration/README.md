# Ảnh inspiration (UX/UI bạn thích)

Thả ảnh chụp màn hình vào thư mục này. Agent sẽ mở từng ảnh để phân tích (Claude đọc được ảnh PNG/JPG/WebP).

## Cách đặt tên

`<NN>-<nguồn>-<phần>.png` — ví dụ:

```
01-linear-hero.png
02-stripe-press-article.png
03-someone-portfolio-grid.png
04-vercel-blog-dark.png
```

- Mỗi ảnh chỉ nên chứa **một** phần giao diện (hero, danh sách bài, trang bài viết, thẻ dự án, footer, dark mode…). Ảnh cả trang dài → chia nhỏ.
- Chụp ở kích thước thật (desktop ~1440px, mobile ~390px). Có ảnh mobile thì thêm hậu tố `-mobile`.
- Logo / màu thương hiệu bạn đã có → để trong `brand/`.

## Ghi chú (quan trọng hơn cả ảnh)

Với mỗi ảnh, ghi 1 dòng vào bảng: **thích điều gì** và **không muốn lấy điều gì**. Agent không đoán được lý do bạn chọn ảnh.

| Ảnh | Thích | Không lấy | Dùng cho trang |
|---|---|---|---|
| 01-… | ví dụ: chữ tiêu đề to, nhiều khoảng trắng | ví dụ: gradient tím | trang chủ |
| | | | |

## Checklist trước khi báo `HG-5 done`

- [ ] Ít nhất 1 ảnh cho: trang chủ/hero · danh sách bài · trang đọc bài · thẻ/trang portfolio
- [ ] (Nên có) 1 ảnh dark mode, 1 ảnh mobile
- [ ] Bảng ghi chú ở trên đã điền
- [ ] `design/BRIEF.md` đã điền (tối thiểu mục A, B, C)
