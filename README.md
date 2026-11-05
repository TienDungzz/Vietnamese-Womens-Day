# Rose Wishes · Ngày Phụ nữ Việt Nam 20/10

Rose Wishes là website quà tặng tương tác: người xem bắt đầu hành trình chàng trai mang hoa đến nhà cô gái, theo dõi cảnh trao hoa, sau đó xoay bó hoa 3D và khám phá **10 lời chúc qua 10 bông hồng chính**. Giao diện hỗ trợ tiếng Việt, tiếng Anh và chuyển đổi ngày/đêm.

Bó hoa là điểm nhấn có mức đầu tư hình học cao nhất. Nhân vật có bộ xương và hoạt ảnh; nhà, sân vườn, hàng rào hoa giấy, xích đu, đường phố, sông, cầu và rừng được dựng bằng mã Three.js. Phong cách hướng đến cảm giác tự nhiên, dịu dàng và có chiều sâu; cây cối vẫn được cách điệu để phục vụ cảnh thời gian thực.

## Chạy dự án

Yêu cầu Node.js 22 trở lên và npm. Chạy tại thư mục gốc:

```sh
npm install
npm run dev
npm run build
npm run preview
npm run check
```

Vite in địa chỉ truy cập trong terminal, thông thường là http://localhost:5173. Nếu PowerShell chặn npm.ps1, dùng npm.cmd. Build tạo dist/; preview phục vụ bản build. Blender/MCP chỉ cần khi chỉnh mô hình. GLB được lưu cục bộ, không tải lại từ nguồn bên ngoài khi build; Google Fonts vẫn dùng mạng và có font hệ thống dự phòng.

## Bản đồ tài liệu

| Tài liệu | Nội dung |
| --- | --- |
| [Đặc tả sản phẩm](ROSE_WISHES_20_10_SPEC.md) | Trải nghiệm, trạng thái, tương tác và 10 lời chúc hiện hành |
| [Photobooth](docs/PHOTOBOOTH_SPEC.md) | 20 ảnh cố định, 16 bố cục, 8 frame, chỉnh hình dạng/crop và xuất PNG |
| [API nội dung](docs/CONTENT_API.md) | Cấu hình endpoint, response 10 lời chúc/20 ảnh, VI/EN và dữ liệu dự phòng |
| [Bối cảnh](docs/SCENE_DESIGN.md) | Tọa độ, nhà, sân, cây, hàng rào, sông và cầu |
| [Khung hình và ánh sáng](docs/FRAMING_AND_LIGHTING.md) | Camera, bố cục desktop/mobile, ánh sáng và ngày/đêm |
| [Thiết kế mô hình](docs/MODEL_DESIGN.md) | Hình học bó hoa, nhân vật, vật liệu và mức chi tiết |
| [Kiến trúc và kiểm thử](docs/ARCHITECTURE.md) | Thành phần mã, dữ liệu, hoạt ảnh và kiểm chứng |
| [Tải cảnh](docs/SCENE_LOADING.md) | Preload, GPU, điều kiện hiện cảnh và lỗi |
| [Đa ngôn ngữ](docs/LANGUAGES.md) | VI/EN, dropdown và chống xê dịch bố cục |
| [Nhân vật nữ](docs/FEMALE_CHARACTER.md) | Tóc, trang phục, rig và quy trình xuất |
| [Công cụ cục bộ](docs/LOCAL_3D_TOOLS.md) | Blender, MCP và quy trình làm việc |
| [Quản lý tài nguyên](docs/PROJECT_CLEANUP.md) | Tệp phải giữ, cache và lịch sử dọn |
| [Quy ước BEM và rà soát mã dư](docs/CODE_STYLE.md) | Block/element/modifier, CSS và kiểm tra mã không dùng |
| [Nguồn bó hoa](art/bouquet/README.md) | Bản Blender, recipe và đóng gói |
| [Nguồn nhân vật](art/characters/README.md) | Bản nam/nữ và xuất GLB |
| [Logo và favicon](art/branding/README.md) | Nguồn ảnh, kích thước và lệnh xuất biểu tượng |
| [Nguồn và giấy phép](public/models/LICENSES.md) | Tài sản tự dựng và tài sản kế thừa |

## Những đặc điểm phải giữ

Frontend hỗ trợ API nội dung. Sao chép `.env.example` thành `.env.local`, đặt `VITE_CONTENT_API_URL` tới endpoint GET trả `{ wishes: [...], photos: [...] }`, rồi khởi động lại dev server hoặc build lại. Cũng có thể dùng `VITE_WISHES_API_URL` và `VITE_PHOTOS_API_URL` riêng. Xem [hợp đồng API và JSON mẫu đầy đủ](docs/CONTENT_API.md). Không cấu hình API thì tiếp tục dùng dữ liệu tại frontend; API lỗi hoặc response sai thì dùng dự phòng theo từng nhóm.

Photobooth mở bằng cách nhấn trực tiếp xấp ảnh 3D cạnh bó hoa; khung ảnh có viền sáng khi hover/focus, không có nút chữ riêng. Hiện dùng **20 link ảnh mẫu cố định từ Lorem Picsum** để xem thử và tải PNG ngay. Thay `src`/`thumb` trong `src/photobooth/photos.json` để dùng link của bạn; giữ đủ 20 ID và chọn `mode: "fixed"` khi dùng ảnh chính thức. Link phải trả về file ảnh trực tiếp và cho phép CORS để xuất PNG.

Nếu dùng file cục bộ: đặt `01.jpg` … `20.jpg` (cũng nhận PNG/WebP/AVIF) vào `art/photos/originals/`, chạy `npm run prepare:photos`, rồi build. Lệnh này xuất ảnh web/thumbnail và tự chuyển danh mục về file local. Xem [hướng dẫn ảnh](art/photos/originals/README.md).

- Chỉ 10 hoa chính tương tác, ID rose-01 đến rose-10. Hoa phụ và lá không mở thiệp.
- Bố trí hoa dùng chung src/data/bouquet-layout.json; dịch hoặc đổi vị trí không đổi ID.
- Chàng trai đứng chờ thao tác bắt đầu. Có bỏ qua, xem lại và giảm chuyển động. Âm thanh mặc định tắt.
- Không hiện mô hình tạm lúc tải. Chỉ mở Canvas và tương tác khi tài nguyên/GPU sẵn sàng.
- Story/high/balanced là các mức chi tiết có mục đích, không phải tệp thừa.
- Rào hoa giấy chỉ ở mặt trước; chừa lối chính và lối lên cầu. Sau nhà là vườn, sông, đường nhỏ và rừng.
- Tài liệu đồng bộ phiên bản ngày 01/11/2026. Mô tả hiện trạng không có nghĩa mọi mục tiêu mỹ thuật đã đạt mức ảnh chụp thật.

