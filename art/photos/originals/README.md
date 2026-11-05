# Bộ 20 ảnh cố định

Website hiện dùng 20 link ảnh mẫu từ **Lorem Picsum**, cấu hình tại `src/photobooth/photos.json`. Bạn có thể sửa trực tiếp các trường `src` và `thumb` bằng link HTTPS ảnh của mình, giữ nguyên ID `photo-01` đến `photo-20`. `src` dùng cho ảnh xuất; `thumb` dùng thư viện và xấp ảnh 3D. Có thể dùng cùng một link cho cả hai nếu chưa có thumbnail. Đổi `mode` sang `fixed` để bỏ nhãn ảnh mẫu.

Link cần trả file ảnh trực tiếp và cho phép CORS (ví dụ header `Access-Control-Allow-Origin: *`) để Canvas xuất PNG. Link trang xem Google Drive hoặc album không phải link file ảnh. Chỉ sửa danh mục link thì không cần chạy script chuẩn bị ảnh cục bộ; dev server sẽ nạp lại, hoặc chạy build cho bản phát hành.

Đặt đúng 20 ảnh của bạn vào thư mục này, tên từ **01** đến **20**, ví dụ `01.jpg`, `02.png`, … `20.jpg`. Mỗi số chỉ có một file. Hỗ trợ JPEG, PNG, WebP và AVIF.

Từ thư mục gốc chạy:

```sh
node scripts/prepare-photobooth-photos.mjs
npm run build
```

Script tự xoay ảnh theo EXIF, xuất ảnh WebP cạnh dài tối đa 1600px (không phóng ảnh nhỏ), thumbnail 320px và catalog metadata vào `public/photos/`, sau đó cập nhật `src/photobooth/photos.json` về các đường dẫn local ở chế độ fixed. Tất cả 20 nguồn phải hợp lệ trước khi chép bộ đã chuẩn bị vào thư mục public. Hiện chưa có ảnh gốc cá nhân do chủ dự án cung cấp; các ảnh đang dùng là mẫu từ mạng.

Ảnh trong thư mục public là tài nguyên người truy cập website có thể xem/tải. Nguồn ở art không cần phân phối lên hosting. Giữ quyền sử dụng ảnh bạn đưa vào dự án. Chỉnh mô tả VI/EN trong `src/photobooth/data.ts` nếu muốn tên riêng cho từng khoảnh khắc.
