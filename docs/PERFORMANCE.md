# Hiệu năng

## Đợt tối ưu 05/11/2026

Kích thước từ production build, theo kB thập phân:

| JavaScript entry | Trước | Sau |
| --- | ---: | ---: |
| Chưa nén | khoảng 1.352 kB | 257,38 kB |
| Gzip | khoảng 385 kB | 81,31 kB |

Entry giảm khoảng 81% dung lượng chưa nén và 79% gzip. Đây là giảm phần mã khởi đầu, không phải giảm tương ứng toàn bộ dữ liệu của trải nghiệm 3D. Chunk 3D vẫn khoảng 1.059 kB, photobooth khoảng 34 kB; chúng tải riêng khi được dùng. Chưa có số đo FPS trên điện thoại thật nên không suy diễn mức tăng FPS từ số liệu bundle.

## Các thay đổi

- `Scene3D.tsx` là chunk động chứa Canvas, Three/Fiber, mô hình và CameraRig. Bản fallback không tải chunk này. Vẫn chờ đủ tài nguyên/GPU trước khi hiển thị cảnh; các mức chi tiết mô hình giữ nguyên.
- Photobooth tải động khi mở; đóng thì unmount, giải phóng cache ảnh và object URL. Draft khôi phục từ sessionStorage khi mở lại. CSS xấp ảnh được tách riêng để vùng bấm/viền vẫn đúng trước khi tải photobooth.
- Overlay tải và fallback 2D không import Three. Danh mục ảnh dùng chung ở `photoCatalog.ts`, tách khỏi cấu hình bố cục/hình dạng.
- Camera dùng lại các Vector3 đích thay vì cấp phát trong mỗi frame.
- Cache hình học bố cục theo đối tượng frame (hình dạng cố định theo thiết kế); cache đường bao SVG, clip-path và Path2D theo slot. Cấu hình frame/slot bất biến sau bước khởi tạo. WeakMap cho phép thu hồi các đối tượng không còn dùng.
- Vẽ preview ghép ảnh qua requestAnimationFrame và hủy lượt cũ khi dữ liệu mới đến. Xuất PNG vẫn vẽ trực tiếp, giữ độ phân giải gốc.

## Kiểm tra lại

```sh
npm run build
npm run check:performance
npm run check
npm run check:photobooth
```

`check:performance` kiểm manifest production: entry cùng các import tĩnh dưới 350 kB, gzip dưới 110 kB; 3D và photobooth phải là import động.

Để kiểm tải tài nguyên thực tế, chạy `npm run preview -- --port 5188 --host 127.0.0.1` và Chrome QA có CDP 9222, rồi chạy `npm run check:performance -- --browser`. Có thể đổi URL bằng `PERFORMANCE_QA_URL`. Bài này xác minh fallback không tải 3D, photobooth chỉ tải lúc mở và không tải lại JS khi mở lần hai.

Các bài kiểm tra dùng cùng tab QA nên chạy tuần tự. `check-scene-loading.mjs` cần WebGL để kiểm đủ 17 asset, chặn thao tác khi tải và không hiển thị mô hình tạm. `check-language-layout.mjs` đo CLS giữa VI/EN; `check-photobooth.mjs` kiểm crop/mặt nạ, draft, popup và 128 tổ hợp PNG.
