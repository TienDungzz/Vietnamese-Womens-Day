# Rose Wishes · 20/10

[Tiếng Việt](#tieng-viet) · [English](#english) · [Tài liệu / Documentation](docs/README.md)

<a id="tieng-viet"></a>

## Tiếng Việt

Website quà tặng tương tác dành cho **Ngày Phụ nữ Việt Nam 20/10**: một câu chuyện trao hoa, **10 bông hồng mở 10 lời chúc**, và photobooth với **20 khoảnh khắc**. Giao diện có tiếng Việt/Anh, chuyển ngày/đêm liên tục, âm thanh tùy chọn và chế độ giảm chuyển động.

### Trải nghiệm hiện tại

- Theo dõi chàng trai đi đến nhà, cô gái mở cửa hai cánh và nhận bó hoa; có bắt đầu, bỏ qua và xem lại.
- Xoay bó hoa 3D, chọn từng bông chính để đọc thiệp. Hoa phụ/lá chỉ trang trí.
- Nhấn trực tiếp xấp ảnh cạnh bó hoa để mở photobooth: **16 bố cục × 8 phong cách frame**, thư viện 20 ảnh cố định, crop/zoom, kéo đổi chỗ và tải PNG.
- Hình dạng ảnh thuộc thiết kế của từng bố cục; không có bộ chọn hình dạng toàn cục. Thumbnail phong cách frame chỉ thể hiện trang trí, không chứa bố cục ảnh.
- Mobile có nút thu gọn frame/bố cục và dải thumbnail ngay dưới preview; dùng chung header với màn hình chính.
- Bối cảnh gồm nhà, sân cỏ, chậu hoa, rào hoa giấy phía trước, xích đu dưới cây tán rộng, sông, cầu gỗ và rừng phía sau.

Bó hoa và nhân vật dùng GLB có vật liệu/rig; môi trường kết hợp hình học Three.js và tài nguyên cục bộ. Không cần Blender để chạy hoặc build frontend.

### Cài đặt và chạy

Yêu cầu **Node.js 22+**, npm và trình duyệt hiện đại. Chạy tại thư mục gốc:

```bash
npm ci
npm run dev
```

Vite mặc định dùng cổng 5173 và in URL thực tế. Trên PowerShell, dùng `npm.cmd` nếu `npm.ps1` bị chặn.

```bash
npm run build
npm run preview
```

Build tạo `dist/`; preview chỉ để xem bản build cục bộ. Phát hành nội dung `dist/` qua static hosting. API nội dung cần dịch vụ riêng nếu muốn dùng; frontend không cung cấp backend quản trị.

### Lời chúc và ảnh

Không cấu hình API thì dùng nội dung trong repository. Để nhận JSON qua GET, sao chép `.env.example` thành `.env.local`:

```dotenv
VITE_CONTENT_API_URL=https://api.example.com/rose-wishes/content
```

Response phải có đúng **10 lời chúc** (`rose-01`…`rose-10`) và **20 ảnh** (`photo-01`…`photo-20`). Có thể dùng `VITE_WISHES_API_URL` và `VITE_PHOTOS_API_URL` riêng; endpoint riêng ưu tiên theo nhóm. Dữ liệu lỗi được thay bằng dự phòng theo từng nhóm. Xem [hợp đồng API](docs/content-api.md).

Biến `VITE_*` công khai và được gắn khi build; không đặt secret. Khởi động lại dev server hoặc build lại khi đổi cấu hình.

Hiện danh mục mặc định dùng **20 ảnh demo Lorem Picsum**, chưa phải bộ ảnh chính thức:

- Dùng link: sửa `src/photobooth/photos.json`, giữ đủ ID, dùng URL file ảnh trực tiếp và đặt `mode: "fixed"` cho bộ chính thức. Nguồn ảnh cần cho phép CORS để xuất PNG.
- Dùng file: đặt đúng 20 nguồn `01`…`20` dạng JPEG/PNG/WebP/AVIF trong `art/photos/originals/`, chạy `npm run prepare:photos`, rồi build. Lệnh tạo WebP/thumbnail và cập nhật danh mục. Xem [hướng dẫn ảnh](art/photos/originals/README.md).
- Lời chúc dự phòng nằm trong `src/data/wishes.ts` và `wishes.en.ts`; ID/hình học hoa ở `roses.ts` và `bouquet-layout.json`. API không thay hình học bó hoa.

### Kiểm tra

```bash
npm run check:standards
```

Lệnh tổng kiểm fixture của checker, coding, dữ liệu/model, build mới, bảo mật và ngân sách bundle; không cần browser/mạng khi đã cài dependency.

| Lệnh | Chức năng |
| --- | --- |
| `npm run check` | BEM, 10 lời chúc, model, bó hoa và rig |
| `npm run check:coding` | Cờ TypeScript bắt buộc, compiler, BEM, encoding tài liệu tiêu chuẩn |
| `npm run check:styles` | Tên BEM và class CSS mồ côi |
| `npm run check:api` | Schema, endpoint, timeout và dự phòng |
| `npm run check:security` | Sink HTML/code nguy hiểm, file nhạy cảm/artifact và URL API |
| `npm run test:standards` | Fixture đúng/sai của checker bảo mật |
| `npm run check:performance` | Ngân sách JS/lazy loading trong build đã tạo; chạy build trước |
| `npm run check:dependencies` | npm audit dependency production; cần mạng |
| `npm run check:photobooth` | QA trình duyệt cho 16 × 8 = 128 PNG và thao tác ghép |

QA trình duyệt cần Vite và Chrome QA riêng bật CDP 9222; không nằm trong lệnh tổng. Xem [kiến trúc và kiểm thử](docs/architecture.md) cho URL, cổng và các script story/tải cảnh/ngôn ngữ. Audit dependency cũng chạy riêng.

### Hiệu năng, lưu trữ và giới hạn

Scene3D và photobooth tải bằng dynamic import. Cảnh chỉ hiện khi tài nguyên/GPU sẵn sàng; không thay bằng mô hình tạm. Thiết bị không WebGL2 dùng trải nghiệm 2D; lỗi GLB có nút thử lại.

Ngân sách entry JS: dưới **350 kB**, gzip dưới **110 kB**. Số đo đã ghi nhận gần nhất: **258,16 kB / gzip 81,52 kB**; không phải số tự cập nhật. Chunk 3D vẫn có cảnh báo vượt 500 kB. Chưa có benchmark điện thoại thật để khẳng định FPS hoặc mức RAM trên mọi thiết bị.

Ngôn ngữ lưu trong localStorage; ID đã xem và metadata/crop photobooth lưu sessionStorage theo tab/phiên, không lưu bytes ảnh. Ảnh/font từ bên ngoài cần mạng. Không có đăng nhập, chụp camera hoặc upload ảnh của người xem.

### Tài liệu và mã nguồn

Bắt đầu tại [mục lục docs](docs/README.md): đặc tả, kiến trúc, bối cảnh, mô hình, photobooth, API và ba quy chuẩn coding/hiệu năng/bảo mật. Tên tài liệu dùng kebab-case, ngoại trừ `README.md`.

| Đường dẫn | Nội dung |
| --- | --- |
| `src/components/`, `src/scenes/`, `src/hooks/` | UI, cảnh 3D, nhân vật và luồng câu chuyện |
| `src/data/`, `src/i18n.tsx`, `src/content/` | Nội dung, bản dịch và API |
| `src/photobooth/` | Danh mục ảnh, bố cục, frame, chỉnh ảnh và Canvas export |
| `public/` | Tài nguyên phát hành; [nguồn/giấy phép mô hình](public/models/LICENSES.md) |
| `art/` | Master Blender, recipe, ảnh nguồn và branding; không đưa vào dist |
| `scripts/` | Kiểm tra, xử lý ảnh và công cụ dựng/xuất tài nguyên |
| `docs/` | Tài liệu hiện hành và báo cáo lịch sử được phân biệt rõ |

Hướng dẫn nguồn: [bó hoa](art/bouquet/README.md), [nhân vật](art/characters/README.md), [logo/favicon](art/branding/README.md). Giữ các mức GLB story/high/balanced và nguồn Blender; không xóa theo tên giống nhau. Quy ước commit: `[type]detail`.

<a id="english"></a>

## English

An interactive gift for **Vietnamese Women's Day, October 20**: a flower-giving story, **10 roses revealing 10 wishes**, and a photobooth with **20 memories**. The interface supports Vietnamese/English, gradual day/night transitions, optional sound and reduced motion.

### Current experience

- Watch the boy approach the house and the girl open the double doors to receive the bouquet. Start, skip and replay controls are available.
- Rotate the 3D bouquet and select a main rose to read its wish. Filler flowers and leaves are decorative.
- Click the photo stack beside the bouquet to open the photobooth: **16 layouts × 8 frame styles**, a fixed 20-photo library, crop/zoom, drag-to-swap and PNG download.
- Photo shapes belong to each authored layout; there is no global shape override. Frame-style thumbnails show decoration without photo slots.
- Mobile provides collapsible frame/layout selectors and a thumbnail strip below the preview. The main site header is reused.
- The scene includes a house, lawn, flowerpots, a front bougainvillea fence, a shaded swing, river, wooden bridge and forest.

The bouquet and characters use GLB assets with materials/rigs. The environment combines Three.js geometry and local assets. Blender is only needed to edit source assets, not to run or build the frontend.

### Setup and build

Requires **Node.js 22+**, npm and a modern browser. Run from the repository root:

```bash
npm ci
npm run dev
```

Vite defaults to port 5173 and prints the actual URL. Use `npm.cmd` in PowerShell if script policy blocks `npm.ps1`.

```bash
npm run build
npm run preview
```

The build outputs `dist/`; preview serves it locally. Deploy the contents of `dist/` to static hosting. Optional content APIs require a separate service; this frontend does not include an administration backend.

### Wishes and photos

Without API configuration, the app uses repository content. Copy `.env.example` to `.env.local` to configure a public GET endpoint:

```dotenv
VITE_CONTENT_API_URL=https://api.example.com/rose-wishes/content
```

The response must contain exactly **10 wishes** (`rose-01`…`rose-10`) and **20 photos** (`photo-01`…`photo-20`). Separate `VITE_WISHES_API_URL` and `VITE_PHOTOS_API_URL` values override the combined endpoint for their respective sections. Invalid sections fall back independently. See the [API contract](docs/content-api.md).

All `VITE_*` values are public and build-time configuration. Never place secrets in them. Restart the dev server or rebuild after changing configuration.

The default catalog currently contains **20 Lorem Picsum demo images**, not the final photo collection:

- Remote files: edit `src/photobooth/photos.json`, preserve all IDs, use direct image URLs and set `mode: "fixed"` for the final collection. The image host must allow CORS for PNG export.
- Local files: put exactly 20 JPEG/PNG/WebP/AVIF originals named `01`…`20` in `art/photos/originals/`, run `npm run prepare:photos`, then build. This creates WebP images/thumbnails and updates the catalog. See the [photo guide](art/photos/originals/README.md).
- Fallback wishes live in `src/data/wishes.ts` and `wishes.en.ts`; rose IDs and geometry mapping live in `roses.ts` and `bouquet-layout.json`. Content APIs do not modify bouquet geometry.

### Checks

```bash
npm run check:standards
```

The aggregate command runs checker fixtures, coding checks, content/model checks, a fresh build, security checks and bundle budgets. No browser or network is required once dependencies are installed.

| Command | Purpose |
| --- | --- |
| `npm run check` | BEM, 10 wishes, models, bouquet and rig |
| `npm run check:coding` | Required TypeScript flags, compiler, BEM and standards document encoding |
| `npm run check:styles` | BEM names and orphan CSS classes |
| `npm run check:api` | Schema, endpoints, timeout and fallback |
| `npm run check:security` | Unsafe HTML/code sinks, private files/artifacts and API URLs |
| `npm run test:standards` | Safe/unsafe security-checker fixtures |
| `npm run check:performance` | Initial JS budget and lazy loading; build first |
| `npm run check:dependencies` | Online production dependency audit |
| `npm run check:photobooth` | Browser QA for 16 × 8 = 128 PNGs and editor interactions |

Browser QA requires Vite and a dedicated Chrome QA instance with CDP on port 9222; it is separate from the aggregate command. See [architecture and testing](docs/architecture.md) for URLs, ports and story/loading/language scripts. The dependency audit is also separate.

### Performance, storage and limitations

Scene3D and the photobooth use dynamic imports. The scene is revealed only after assets/GPU preparation completes; no temporary model replacement is used. Devices without WebGL2 get a 2D experience; GLB loading errors provide retry.

Initial JS budgets are **under 350 kB**, and **under 110 kB gzip**. The latest recorded measurement is **258.16 kB / 81.52 kB gzip**, a historical value rather than a live counter. The 3D chunk still triggers Vite's 500 kB warning. Real-phone benchmarks are not yet available to establish universal FPS or memory guarantees.

Language is stored in localStorage. Viewed IDs and photobooth draft metadata/crops are stored in sessionStorage for the tab/session, without image bytes. External images/fonts require network access. There is no login, camera capture or viewer photo upload.

### Documentation and source

Start at the [documentation index](docs/README.md): product specification, architecture, scene/model design, photobooth, API and coding/performance/security standards. Detailed documents currently use Vietnamese; this root README provides both languages. Documentation filenames use kebab-case except for `README.md`.

| Path | Contents |
| --- | --- |
| `src/components/`, `src/scenes/`, `src/hooks/` | UI, 3D scene, characters and story flow |
| `src/data/`, `src/i18n.tsx`, `src/content/` | Content, translations and API |
| `src/photobooth/` | Photo catalog, layouts, frame styles, editor and Canvas export |
| `public/` | Shipped assets; [model sources/licenses](public/models/LICENSES.md) |
| `art/` | Blender masters, recipes, source photos and branding; excluded from dist |
| `scripts/` | Checks, photo preparation and asset authoring/export tools |
| `docs/` | Current documentation and explicitly labeled historical reports |

Source guides: [bouquet](art/bouquet/README.md), [characters](art/characters/README.md), [logo/favicon](art/branding/README.md). Preserve story/high/balanced GLB variants and Blender sources; similar names do not imply unused files. Commit convention: `[type]detail`.
