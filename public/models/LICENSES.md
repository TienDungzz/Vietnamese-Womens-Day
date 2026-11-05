# Nguồn mô hình và thông tin giấy phép

Tài liệu ghi lại nguồn tài sản đang phân phối trong public/models/. Thông tin dưới đây dựa trên metadata nguồn được giữ trong dự án; việc viết lại tài liệu không tạo giấy phép mới cho toàn bộ repository.

## 1. Nhân vật

characters/male-cardigan.glb và characters/female-grey-jeans.glb thích nghi từ **Sam**, nguồn Innerscene / MakeHuman / MPFB. Phần nền kế thừa gồm giải phẫu mặt/tay, rig và animation clips; metadata dự án ghi nguồn CC0.

- [Trang tài sản Sam](https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-sam-3d-person-animated-dc23800f)
- [Điều khoản nguồn](https://www.innerscene.com/tools/library/terms)
- Metadata giữ tại characters/male-cardigan.json.

Trang phục cardigan/quần suông, áo xám/jeans, kiểu tóc nam 7/3 và nữ mái thưa, các chỉnh tỷ lệ và cơ chế IK nhận hoa được thực hiện cho dự án. Master nằm trong art/characters/. Không còn phân phối bản Sam/Maya runtime cũ độc lập.

## 2. Chậu cây

plants/potted-plant.glb dùng **Potted Plant 01**, tác giả **Rico Cilliers / Poly Haven**, nguồn ghi CC0 1.0 Universal.

- [Trang tài sản](https://polyhaven.com/a/potted_plant_01)
- [Giấy phép Poly Haven](https://polyhaven.com/license)
- URL nguồn, bytes và checksum giữ trong sources.json.

Bản web đã đơn giản hóa mesh và nhúng texture WebP 1024px. Đây là chậu cây sát hiên; tám chậu hoa dọc lối chính do mã dự án dựng riêng.

## 3. Bó hoa

Hình học hoa hồng, cành/lá, giấy gói, nơ satin, hoa phụ và map PBR thủ tục được tạo cho Rose Wishes bằng các recipe Blender. Không dùng dịch vụ API tạo model trả phí cho nhóm tài sản này.

- Nguồn tổng thể: art/bouquet/rose-wishes-natural.blend.
- Thư viện mẫu: art/bouquet/rose-wishes-bouquet.blend.
- Recipe: scripts/blender/build_bouquet.py, build_fillers.py, arrange_bouquet.py.
- Hash/texture/bounds/số tam giác: bouquet/manifest.json.

Manifest dùng nhãn project-original để mô tả nguồn. Nhãn này **không phải tuyên bố CC0** hoặc một giấy phép mã nguồn mở riêng cho toàn bộ nội dung dự án.

## 4. Hình học cảnh và tài sản khác

Nhà, cửa, sân, hàng rào hoa giấy, cây vườn, xích đu, hộp thư, đường phố, cầu, rừng, bầu trời và nước là hình học/shader do dự án dựng trong src/scenes/. Chúng không có file GLB tải bên ngoài riêng.

Ảnh tham chiếu người dùng cung cấp dùng để mô tả phong cách, không được đưa thành texture khuôn mặt hoặc ảnh phân phối trong website. Mô hình không được mô tả là bản scan người trong ảnh.

## 5. Khi thay tài sản

Giữ tên tác giả, URL nguồn, điều khoản và metadata có liên quan; không suy giấy phép tài sản mới từ tài sản cũ. Sau khi thay GLB, cập nhật manifest/checksum và kiểm tra các URL runtime. Không xóa LICENSES.md hoặc metadata chỉ vì frontend không import chúng.

Logo website là ảnh người dùng cung cấp, được xử lý tách nền bằng imagegen; nguồn xử lý nằm ở art/branding/logo-source.png. Logo và favicon không thuộc nhóm mô hình CC0 ở trên; không suy giấy phép logo từ giấy phép Sam hoặc Poly Haven. Xem art/branding/README.md cho quy trình xuất.

## 6. Ảnh mẫu photobooth

20 ảnh mẫu được tham chiếu bằng link ID cố định từ [Lorem Picsum](https://picsum.photos/images). `src/photobooth/photos.json` giữ link ảnh/thumbnail, tên tác giả và URL nguồn Unsplash lấy từ API Picsum. Đây là ảnh thay thế để xem thử trước khi có bộ ảnh cá nhân, không thuộc các mô hình CC0 ở mục 1–2 và không phải ảnh riêng của chủ dự án. Khi thay ảnh chính thức, cập nhật danh mục và thông tin nguồn tương ứng.

