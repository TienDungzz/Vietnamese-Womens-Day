# API lời chúc và ảnh photobooth

Frontend nhận dữ liệu JSON bằng GET. Không bắt buộc có backend để chạy: khi chưa cấu hình endpoint, ứng dụng dùng lời chúc và ảnh trong repository. Cấu hình API không thay đổi hình học, vị trí hoặc màu bó hoa.

## 1. Cấu hình

Sao chép `.env.example` thành `.env.local`, điền endpoint rồi khởi động lại Vite:

```dotenv
VITE_CONTENT_API_URL=https://api.example.com/rose-wishes/content
```

Hoặc dùng hai endpoint riêng:

```dotenv
VITE_WISHES_API_URL=https://api.example.com/rose-wishes/wishes
VITE_PHOTOS_API_URL=https://api.example.com/rose-wishes/photos
```

Có thể chỉ cấu hình một nhóm; nhóm còn lại dùng dữ liệu sẵn có. Endpoint riêng ưu tiên hơn endpoint chung cho nhóm tương ứng. Có thể dùng đường dẫn cùng nguồn như `/api/rose-wishes/content`. Các biến VITE được gắn lúc build và công khai trong frontend; không đặt khóa bí mật vào đây. Bản production cần build lại sau khi đổi biến môi trường.

## 2. Response chung

```json
{
  "wishes": [
    {
      "id": "rose-01",
      "title": { "vi": "Dành riêng cho em", "en": "Just for you" },
      "text": { "vi": "Chúc em một ngày thật dịu dàng.", "en": "Wishing you a lovely day." }
    }
  ],
  "photos": [
    {
      "id": "photo-01",
      "src": "https://cdn.example.com/photos/01.jpg",
      "thumb": "https://cdn.example.com/photos/thumbs/01.jpg",
      "label": { "vi": "Một ngày bên nhau", "en": "A day together" }
    }
  ]
}
```

Ví dụ rút gọn chỉ minh họa một phần tử. Response thật cần **đúng 10 wishes** (`rose-01`–`rose-10`) và **đúng 20 photos** (`photo-01`–`photo-20`). Xem [ví dụ đầy đủ](examples/content-response.json) để có payload đủ số lượng, có thể trả trực tiếp từ endpoint thử nghiệm.

Hai endpoint riêng có thể trả mảng trực tiếp, hoặc bọc bằng `{ "wishes": [...] }` / `{ "photos": [...] }`. Không bọc thêm `data` hoặc trả phân trang: đây là toàn bộ nội dung của một trải nghiệm.

## 3. Trường dữ liệu

| Trường | Yêu cầu | Ý nghĩa |
| --- | --- | --- |
| wish.id | Bắt buộc, duy nhất | Gắn ổn định vào bông hồng tương ứng |
| wish.title / wish.text | Bắt buộc, không rỗng | Chuỗi hoặc object `{vi,en}` |
| photo.id | Bắt buộc, duy nhất | Gắn ảnh với các ô đã lưu trong bản nháp |
| photo.src | Bắt buộc | URL file ảnh gốc dùng để ghép và xuất |
| photo.thumb | Tùy chọn | URL ảnh nhỏ; thiếu sẽ dùng src |
| photo.label | Tùy chọn | Mô tả VI/EN; thiếu dùng nhãn theo số |

Nếu title/text/label là chuỗi, dùng cùng nội dung cho VI và EN. Với object, `vi` bắt buộc, `en` thiếu sẽ dùng bản VI; `en` có nhưng rỗng được coi là dữ liệu không hợp lệ. Nội dung hiển thị dưới dạng văn bản, không render HTML từ API.

Thứ tự mảng tùy ý; frontend sắp theo ID. Không đổi ID khi chỉ sửa nội dung hoặc đường dẫn ảnh. Số lượng 10/20 hiện là ràng buộc thiết kế, không tự thay đổi theo độ dài response.

URL ảnh hỗ trợ HTTP(S), tuyệt đối hoặc tương đối với **URL response API**. Ví dụ API tại `https://api.example.com/v1/content` trả `images/01.jpg` thì ảnh là `https://api.example.com/v1/images/01.jpg`; `/images/01.jpg` là từ gốc domain API. Không dùng URL nhúng username/password, data URL, JavaScript URL hoặc link trang album.

## 4. Tải, kiểm tra và dự phòng

API được đọc một lần khi khởi tạo, trước khi App/cảnh 3D được mount; overlay hiện trong lúc đợi. Đổi VI/EN không gửi request lại vì response chứa hai bản dịch. Request chung được chia sẻ giữa hai nhóm và StrictMode, tránh GET trùng.

Mỗi request có timeout 8 giây. HTTP lỗi, JSON lỗi, thiếu/trùng ID hoặc sai dữ liệu sẽ làm **nhóm tương ứng** dùng dữ liệu dự phòng. Nhóm hợp lệ vẫn nhận từ API. Chi tiết lỗi ghi ở console với tiền tố `[Rose Wishes content API]`. Reload trang để tải lại sau khi sửa backend.

`data-content-source` trên main có giá trị `api`, `mixed` hoặc `local`, thuận tiện kiểm tra tích hợp. `mixed` nghĩa một nhóm lấy từ API, nhóm còn lại lấy tại frontend. Lỗi tải byte ảnh sau khi API hợp lệ được xử lý trong photobooth bằng thông báo/thử lại, không phải đổi toàn bộ danh mục.

## 5. CORS và xác thực

Backend khác origin cần cho phép origin của frontend đọc JSON. Ảnh/CDN cũng cần cho phép anonymous CORS để Canvas và texture 3D đọc được ảnh; ảnh hiển thị được trong thẻ img chưa đủ chứng minh xuất PNG được. Với nguồn công khai có thể dùng `Access-Control-Allow-Origin: *`; với cookie cần cấu hình backend cụ thể.

Client hiện dùng `credentials: same-origin`: gửi cookie cho API cùng origin, không gửi cookie đến domain khác. Chưa thêm đăng nhập hoặc bearer-token flow. Nếu backend cần xác thực khác, bổ sung theo giao thức backend thay vì để khóa bí mật trong biến VITE.

Trang HTTPS nên dùng API và ảnh HTTPS để tránh mixed content. Lỗi API không được xử lý bằng tắt kiểm tra CORS trong trình duyệt.

## 6. Mã nguồn và kiểm tra

- `src/content/schema.ts`: kiểm tra và chuẩn hóa response.
- `src/content/client.ts`: GET, timeout, dùng chung request và dự phòng từng nhóm.
- `src/content/ContentProvider.tsx`: dữ liệu mặc định và khởi tạo trước App.
- `src/main.tsx`: dùng nội dung API cho thiệp/nhãn chọn hoa.
- `src/photobooth/`: dùng cùng danh mục API cho thư viện, xấp ảnh, crop và PNG. Cache ảnh theo URL để không nhầm ảnh cùng ID từ nguồn khác.

```sh
node scripts/check-content-api.mjs
npm run build
npm run check
```

Kiểm tra tích hợp trình duyệt: mở Chrome QA với CDP 9222, chạy Vite riêng trên 5174 với `VITE_CONTENT_API_URL=http://127.0.0.1:8792/content`, rồi chạy `node scripts/check-content-api-browser.mjs`. Script tự mở API thử trên 8792, phục vụ 10 lời chúc/20 ảnh QA, kiểm cả xuất PNG, sau đó đóng API. Không dùng cổng 8792 cho dịch vụ khác cùng lúc. Script dùng chế độ không WebGL để tập trung vào nội dung, không thay thế kiểm tra hoạt ảnh 3D.

Các dữ liệu gốc `wishes.ts`, `wishes.en.ts`, `photos.json` vẫn là dự phòng có thể chỉnh sửa; khi API được bật và hợp lệ, nội dung API có ưu tiên.
