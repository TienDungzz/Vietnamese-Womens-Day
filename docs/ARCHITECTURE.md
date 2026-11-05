# Kiến trúc, dữ liệu và kiểm thử

## 1. Công nghệ và điểm vào

React 19, TypeScript, Vite 6, Three.js, React Three Fiber và Drei. src/main.tsx gắn React root, LanguageProvider, ContentProvider, App và UI; Canvas nằm trong Scene3D tải động. package.json/package-lock.json là nguồn phiên bản dependency; không cần Blender để build frontend.

| Vị trí | Trách nhiệm |
| --- | --- |
| src/main.tsx | Header, tiêu đề, lựa chọn hoa, thiệp, fallback, boundary và import động |
| src/components/Scene3D.tsx | Chunk 3D tải riêng: Canvas, cảnh, mô hình, điều khiển và CameraRig |
| src/components/SiteHeader.tsx | Header chung; chế độ photobooth chỉ hiện logo và nút đóng |
| src/hooks/useSceneFlow.ts | Trạng thái và timer câu chuyện |
| src/hooks/useDayNight.ts | Tiến trình ngày/đêm dùng chung CSS và 3D |
| src/sceneAssets.ts | URL GLB và mức chi tiết |
| src/components/SceneLoading.tsx | Suspense và chuẩn bị GPU trong chunk 3D |
| src/components/SceneLoadingOverlay.tsx | Overlay 2D dùng chung, không phụ thuộc Three |
| src/scenes/Story.tsx | Lắp cảnh, di chuyển nam và trao hoa |
| src/scenes/Person.tsx | Clone rig, AnimationMixer, IK |
| src/components/Bouquet.tsx, ModelRose.tsx | Lắp 10 hoa, phụ kiện, vật liệu và chọn |
| src/scenes/gardenLayout.ts | Vùng sân, vị trí chậu và cây hoa trắng |
| src/i18n.tsx | Context ngôn ngữ và bảng dịch |
| src/components/LanguageSelect.tsx, StableText.tsx | Dropdown và bố cục bản dịch |
| src/styles/global.css | Responsive, mặt nạ, màu và UI |
| src/photobooth/ | 16 bố cục/8 phong cách/20 ảnh; trình ghép tải động, xấp ảnh 3D, fallback và xuất PNG |
| src/content/ | Hợp đồng API, GET/timeout, dự phòng và provider nội dung trước App |

## 2. Dữ liệu nội dung

wishes.ts chứa 10 bản tiếng Việt, ID/title/text/kind. wishes.en.ts chứa title/text tiếng Anh theo ID. roses.ts kết hợp nội dung, màu, mẫu i % 5 và bouquet-layout.json. Không đổi ID khi đổi thứ tự hay dịch. Màu và layout không được suy từ câu chữ.

Khi cấu hình API bằng `.env.local`, ContentProvider tải/kiểm tra dữ liệu trước khi mount App; lời chúc và danh mục ảnh hợp lệ từ API ưu tiên hơn bản nguồn. Lời chúc vẫn ghép với hình học theo ID; API không chỉnh layout/màu. Hai bản dịch có thể đến từ cùng response; đổi ngôn ngữ không fetch lại. Dự phòng theo từng nhóm nếu lỗi HTTP, timeout hoặc sai schema. Xem [CONTENT_API.md](CONTENT_API.md).

Khi thêm ngôn ngữ cần mở rộng Language, thông điệp, dữ liệu lời chúc, dropdown, phần lưu lựa chọn và StableText. Khi đổi số lượng hoa phải cập nhật tất cả dữ liệu, Blender, GLB phụ kiện và kiểm tra; hiện tại yêu cầu là 10.

## 3. Câu chuyện và thời gian

INTRO_READY → WALKING → AT_DOOR → KNOCKING → DOOR_OPENING → HANDOVER → BOUQUET_TRANSITION → BOUQUET_EXPLORE.

Nam bắt đầu tại Z = 5,6, hướng Y = π, đi thẳng về −0,92. Tốc độ mong muốn khoảng 0,95 trước khi giảm gần cửa; pace được làm mượt. Box trigger giới hạn X ±0,35, Y 0–3, Z −1,1 đến −0,88.

| Trạng thái | Chuyển tiếp bình thường |
| --- | --- |
| INTRO_READY | Chỉ sau click/tap hoặc nút bắt đầu |
| WALKING | Khi chạm trigger |
| AT_DOOR | 400ms đến KNOCKING |
| KNOCKING | 1.800ms đến DOOR_OPENING |
| DOOR_OPENING | Chờ tư thế nhận thực sự sẵn sàng, sau đó 400ms đến HANDOVER; có timeout an toàn 15.000ms |
| HANDOVER | 3.200ms đến BOUQUET_TRANSITION |
| BOUQUET_TRANSITION | 1.600ms đến BOUQUET_EXPLORE |

Timer được thiết lập lại khi dependency đổi; reduced motion dùng khoảng 200ms cho các chuyển timer thông thường. Chuyển vị trí bó hoa dùng khoảng 2,4s với đường cong bậc năm; reduced motion ngắn hơn. Không cộng các thời gian thành cam kết tổng thời lượng: đi bộ, FPS, tải và receiver readiness ảnh hưởng kết quả.

Tải cảnh khóa luồng/timer và chuyển động chính. Một số dao động trang trí/clip có vòng cập nhật riêng, không phải hệ pause toàn bộ engine.

## 4. Không gian trao hoa

Carry anchor nam [0, 1.257, 0.34] trong nhóm quay π; anchor nữ [0, 1.1, 0.32] trong nhóm nữ. Story lấy world transform hai anchor, nội suy rồi đổi về local của story-root. Bó hoa scale 0,26. IK tay đuổi theo cùng mục tiêu.

Thời gian mỗi trạng thái được reset ngay đầu callback khung hình khi scene đổi, trước khi đọc progress; không reset trễ trong passive effect. Nữ chuẩn bị tay trong lúc cửa mở, giữ liên tục sang HANDOVER. Trước khi mixer chạy, các bone tay được trả về pose nền để phần không được clip keyframe không tích lũy IK từ khung trước. Nội suy pose dùng dt thực, không phụ thuộc giới hạn số khung.

`Person.onReceiveReady` được báo sau bước IK khi trọng số tư thế nhận đã đủ; đây không chỉ là thông báo GLB đã tải. `useSceneFlow` dùng tín hiệu này để tránh timer đưa hoa đi trước tay trên máy có FPS thấp. Kiểm tra story đo progress khung đầu bằng 0, không đảo ngược tiến trình và có chuẩn bị tay trước HANDOVER.

Cửa hai cánh mở vào sau facade; nữ đứng trên Y = 0,37. Kiểm thử story đo sweep cửa/bó hoa trong luồng hiện hành, không phải engine collision tổng quát cho mọi pose.

## 5. Lưu trữ và khả năng truy cập

- sessionStorage rose-seen: ID đã xem, lọc trùng/ID không hợp lệ theo danh sách hiện tại.
- localStorage rose-language: vi/en, mặc định vi nếu chưa chọn hoặc đọc lỗi.
- Theme mặc định ban ngày; chưa lưu theme dài hạn.
- Âm thanh Web Audio mặc định tắt; người xem bật mới tạo/resume context.
- Thiệp có role dialog, aria-modal=false, focus khi mở, Escape để đóng và trả focus về phần tử trước.
- 10 nút chọn hoa là đường truy cập thay cho việc bắt buộc click chính xác mesh.
- Giảm chuyển động đọc từ media query và theo dõi thay đổi.

Fallback SVG chỉ dùng khi không có WebGL2. Lỗi tải GLB ở thiết bị có WebGL dùng thông báo thử lại, không tự chuyển thành nhân vật tạm.

## 6. Lệnh kiểm tra

```sh
npm run build
npm run check
```

build chạy tsc -b và Vite. check chạy check-content, check-models, check-bouquet và check-male. Các phép kiểm bao gồm ID/nội dung/layout, danh sách GLB thực dùng, checksum, khả năng giải mã, texture, rig và đặc điểm bó hoa/nam. Đây là kiểm tra tài sản và cấu trúc, không tự chứng minh mô hình đẹp hay FPS đạt trên mọi máy.

Kiểm tra trình duyệt cần Vite ở 127.0.0.1:5173 và Chrome riêng bật CDP 9222:

| Script | Kiểm tra |
| --- | --- |
| check-scene-loading.mjs | Giữ request, cảnh ẩn/khóa, release, lỗi/retry, cache |
| check-story.mjs | Sân/chậu/cây, toàn luồng, sweep cửa và trao hoa |
| check-ui.mjs | 10 nút, migrate progress cũ, điều hướng vòng |
| check-language.mjs | VI/EN, 10 thiệp, lưu lựa chọn, metadata, bàn phím dropdown |
| check-language-layout.mjs | So khung trước/sau dịch ở 360/800/1440px, đủ 10 thiệp |
| check-photobooth.mjs | 36 bản PNG, crop/preview, chọn/đổi ảnh, draft, lỗi/retry, VI/EN và mobile |
| check-content-api.mjs | Schema, endpoint chung/riêng, ID, URL, timeout và dự phòng |
| check-content-api-browser.mjs | API HTTP thực, startup, thiệp VI/EN, ảnh API và PNG |

Chạy từng script riêng. Một số script đóng cả QA browser khi xong; cần mở lại nếu script tiếp theo cần CDP. Các script ngôn ngữ dùng giao diện không WebGL để tập trung DOM; không thay cho kiểm tra 3D. --mobile thuộc check-scene-loading; --screenshots thuộc check-scene-loading và check-story, không áp dụng tự động cho mọi script.

Photobooth dùng `sessionStorage` khóa `rose-photobooth` để giữ ID khung/màu và 20 ô cùng crop. Thư viện là bộ ảnh cố định trong public/photos do lệnh `npm run prepare:photos` tạo từ art/photos/originals. Không đưa ảnh vào danh sách GLB bắt buộc. Preview và export dùng chung renderer; ảnh gốc được giải mã khi dùng, cache tham chiếu được giải phóng khi đóng trình ghép. QA photobooth chặn request bằng ảnh thử, không yêu cầu xuất bản ảnh thử.

Kiểm tra story trên GPU phần mềm tạm ẩn mesh trang trí ngoài nhân vật, bó hoa và cửa sau bước kiểm tra sân; mục đích là đo chuyển động thật mà không để chi phí vẽ tán lá làm trình duyệt bỏ qua cả trạng thái. Cờ `--screenshots` vẫn chụp sân trước khi ẩn trang trí. Đây là cách giảm tải riêng trong phiên QA, không đổi cảnh của người dùng hoặc chứng minh FPS toàn cảnh trên thiết bị thực.

Ví dụ khởi chạy PowerShell; đóng QA browser trước nếu profile đang được dùng:

```powershell
Start-Process -FilePath 'C:\Program Files\Google\Chrome\Application\chrome.exe' -WindowStyle Hidden -ArgumentList '--headless=new','--no-first-run','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=9222','--user-data-dir=C:\Users\trant\Desktop\Source\Women-Day\.preview-profile','about:blank'
node scripts/check-language-layout.mjs
```

Đường dẫn Chrome/profile là ví dụ máy phát triển hiện tại; đổi theo máy. CDP chỉ dùng kiểm thử cục bộ. Ảnh QA vào .qa/ khi bật tùy chọn tương ứng.

## 7. Quy trình thay đổi và kiểm chứng

| Thay đổi | Việc cần kiểm tra |
| --- | --- |
| Nội dung/dịch | Đồng bộ bảng trong đặc tả, check-content, kiểm tra ngôn ngữ/layout |
| Tọa độ cây/rào/nhà | Build, xem nhiều góc, lối đi và camera responsive |
| Rig/animation | Check asset, kiểm tra toàn story và vị trí tay/chân |
| Bó hoa/layout | Dựng lại phụ kiện/fillers, pack story, check-bouquet, xoay nhiều góc |
| Preload/renderer | check-scene-loading gồm lỗi và cached transition |
| CSS | Layout nhiều chiều rộng, focus, không tràn chữ và không che 3D |

Đo hình học 0px giữa hai bản dịch chỉ chứng minh các vùng DOM đã đo không đổi khung trong điều kiện kiểm tra. Không gọi đó là CLS tổng thể bằng 0 trên mạng/thiết bị thực. Cảnh còn phụ thuộc GPU, tải font và hiệu năng thiết bị; chưa có benchmark FPS phổ quát.

