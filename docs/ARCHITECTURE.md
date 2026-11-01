# Kiến trúc, dữ liệu và kiểm thử

## 1. Công nghệ và điểm vào

React 19, TypeScript, Vite 6, Three.js, React Three Fiber và Drei. src/main.tsx gắn React root, LanguageProvider, App, Canvas và phần UI. package.json/package-lock.json là nguồn phiên bản dependency; không cần Blender để build frontend.

| Vị trí | Trách nhiệm |
| --- | --- |
| src/main.tsx | Header, tiêu đề, lựa chọn hoa, thiệp, fallback, CameraRig, boundary |
| src/hooks/useSceneFlow.ts | Trạng thái và timer câu chuyện |
| src/hooks/useDayNight.ts | Tiến trình ngày/đêm dùng chung CSS và 3D |
| src/sceneAssets.ts | URL GLB và mức chi tiết |
| src/components/SceneLoading.tsx | Suspense, chuẩn bị GPU, overlay |
| src/scenes/Story.tsx | Lắp cảnh, di chuyển nam và trao hoa |
| src/scenes/Person.tsx | Clone rig, AnimationMixer, IK |
| src/components/Bouquet.tsx, ModelRose.tsx | Lắp 10 hoa, phụ kiện, vật liệu và chọn |
| src/scenes/gardenLayout.ts | Vùng sân, vị trí chậu và cây hoa trắng |
| src/i18n.tsx | Context ngôn ngữ và bảng dịch |
| src/components/LanguageSelect.tsx, StableText.tsx | Dropdown và bố cục bản dịch |
| src/styles/global.css | Responsive, mặt nạ, màu và UI |

## 2. Dữ liệu nội dung

wishes.ts chứa 10 bản tiếng Việt, ID/title/text/kind. wishes.en.ts chứa title/text tiếng Anh theo ID. roses.ts kết hợp nội dung, màu, mẫu i % 5 và bouquet-layout.json. Không đổi ID khi đổi thứ tự hay dịch. Màu và layout không được suy từ câu chữ.

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
| DOOR_OPENING | 1.800ms đến HANDOVER; nếu receiver chưa ready thì timer 15.000ms |
| HANDOVER | 3.200ms đến BOUQUET_TRANSITION |
| BOUQUET_TRANSITION | 1.600ms đến BOUQUET_EXPLORE |

Timer được thiết lập lại khi dependency đổi; reduced motion dùng khoảng 200ms cho các chuyển timer thông thường. Chuyển vị trí bó hoa dùng khoảng 2,4s với đường cong bậc năm; reduced motion ngắn hơn. Không cộng các thời gian thành cam kết tổng thời lượng: đi bộ, FPS, tải và receiver readiness ảnh hưởng kết quả.

Tải cảnh khóa luồng/timer và chuyển động chính. Một số dao động trang trí/clip có vòng cập nhật riêng, không phải hệ pause toàn bộ engine.

## 4. Không gian trao hoa

Carry anchor nam [0, 1.257, 0.34] trong nhóm quay π; anchor nữ [0, 1.1, 0.32] trong nhóm nữ. Story lấy world transform hai anchor, nội suy rồi đổi về local của story-root. Bó hoa scale 0,26. IK tay đuổi theo cùng mục tiêu.

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

Chạy từng script riêng. Một số script đóng cả QA browser khi xong; cần mở lại nếu script tiếp theo cần CDP. Các script ngôn ngữ dùng giao diện không WebGL để tập trung DOM; không thay cho kiểm tra 3D. --mobile thuộc check-scene-loading; --screenshots thuộc check-scene-loading và check-story, không áp dụng tự động cho mọi script.

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

