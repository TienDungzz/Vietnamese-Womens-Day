# Rose Wishes · 20/10

Website tiếng Việt, Vite + React + TypeScript + React Three Fiber. Chạm để bắt đầu câu chuyện, xem nhân vật đến cửa và trao hoa, sau đó xoay/zoom bó hoa và khám phá đúng 11 lời chúc trong đặc tả.

## Chạy tại local

Yêu cầu Node.js 22 trở lên.

```sh
npm install
npm run dev
npm run build
npm run preview
```

Trên PowerShell chặn npm.ps1, dùng `npm.cmd` thay cho `npm`. Vite hiển thị địa chỉ local trong terminal.

## Phạm vi hiện tại

Đây là bản triển khai luồng tương tác với **model hình học tự tạo (placeholder 3D)**, không phải nhân vật realistic có rig. Cửa có pivot bản lề; nhân vật di chuyển vào vùng trigger trước cửa rồi mới gõ cửa. Chuyển động tay/chân mang tính mô phỏng; chưa có diễn xuất khuôn mặt, chuyển động ngón tay hay animation trao vật từ rig. Bó hoa sử dụng cùng component ở cả hai cảnh, 11 ID ổn định và năm kiểu cánh procedural. Camera tiến vào bó hoa rồi chuyển cảnh studio. Không sử dụng GLB hoặc hình ảnh tải từ nguồn bên ngoài.

Chọn hoa bằng chuột/tap hoặc 11 nút bàn phím; thiệp hỗ trợ Escape, bông trước/tiếp và đóng. OrbitControls hỗ trợ kéo, cuộn và pinch. Đã khám phá được lưu trong sessionStorage. Nút âm thanh phát chuỗi âm ambient và tiếng gõ tổng hợp bằng Web Audio, mặc định tắt; không phải bản thu piano. Reduced motion rút ngắn chuyển cảnh. Khi WebGL không khả dụng hoặc canvas lỗi, ảnh SVG cục bộ cùng danh sách nút vẫn cho đọc đủ 11 lời chúc; chế độ này bỏ qua hoạt cảnh 3D.

## Nội dung và asset

- Sửa lời chúc: `src/data/wishes.ts`; bố trí/màu/biến thể: `src/data/roses.ts`.
- Cảnh và nhân vật procedural: `src/scenes/Story.tsx`.
- Hoa, giấy gói và nơ dùng chung: `src/components/Bouquet.tsx`.
- Luồng trạng thái: `src/hooks/useSceneFlow.ts`.
- Đặc tả gốc: `ROSE_WISHES_20_10_SPEC.md`.

Các asset **chưa có**, cần bổ sung để đạt mỹ thuật realistic trong đặc tả:

1. `public/models/characters/`: nam trưởng thành có rig và idle/walk/knock/handover; nữ trưởng thành có rig và open-door/receive/smile.
2. `public/models/house/`: nhà, cửa riêng có pivot bản lề, đường lát đá, hàng rào, cây và hoa leo.
3. `public/models/flowers/`: tối thiểu 3–5 mẫu hồng realistic, giấy gói, lá, cành và nơ; giữ mapping rose-01 đến rose-11 khi thay model.
4. `public/textures/`: texture PBR WebP/KTX2 có giấy phép phù hợp.
5. `public/audio/`: piano, ambience và tiếng gõ có giấy phép nếu thay âm tổng hợp.
6. `public/environments/`: HDRI hoàng hôn/studio có giấy phép.

Chỉ đặt file vào public chưa tự tích hợp: cần thay hình học trong các component bằng GLTFLoader/useGLTF, kết nối animation mixer và attachment tay. Ghi tác giả/giấy phép của asset mới trước khi phân phối. SVG fallback và hình học hiện tại được tạo trực tiếp cho dự án. Google Fonts là tùy chọn online; font Georgia/sans-serif hệ thống hoạt động khi offline.

## Kiểm tra thủ công

- Mở mới: không tự bước đi. Click âm thanh không bắt đầu hành trình; click bắt đầu nhiều lần không reset.
- Đợi nhân vật tới cửa, gõ hai nhịp, mở cửa và trao hoa; hoặc dùng Bỏ qua/Mở cửa.
- Chọn lần lượt 01–11, đối chiếu nội dung với đặc tả; thử click hoa trên canvas, kéo xoay, cuộn/pinch, đóng thiệp, replay, reset camera.
- Dùng Tab/Enter/Escape; bật reduced motion trong hệ điều hành; chặn WebGL để kiểm tra fallback.
- Kiểm tra thêm trên iOS Safari và Android Chrome trước khi phát hành. Chưa có kiểm chứng trên thiết bị thật.
