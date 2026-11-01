# Nguồn Blender của bó hoa

## 1. Hai bản .blend có vai trò khác nhau

| Tệp | Vai trò |
| --- | --- |
| rose-wishes-natural.blend | Bố trí **10 hoa** hiện hành, cành, bọc và hoa phụ theo layout chung |
| rose-wishes-bouquet.blend | Thư viện mẫu hình học/asset-master cho recipe dựng và bố trí |

Mở bản natural để xem phối tổng thể. Scene chính mang tên **Rose Wishes - Bouquet Atelier**; thư viện dùng scene **Rose Wishes - Asset Masters**. Bản thư viện không phải mô hình tạm tải trên web và không được xóa chỉ vì bố trí cũ bên trong khác bản natural.

## 2. Thiết kế

Năm mẫu hồng gồm 8/10/12 lớp, khoảng 45–67 cánh, cong dọc, khum ngang, mép lật và mặt sau mỏng. Các lớp sát hơn ở lõi, bông ngoài mở có kiểm soát. 10 hoa dùng vị trí/độ lớn/độ nghiêng khác nhau; tránh đặt đều vòng tròn hoặc đẩy hoa lớn ra ngoài bọc.

Giấy kem/hồng, tissue, nơ satin, cành và lá được dựng riêng trong accessories. Fillers chứa cúc ngà, hoa nhỏ trắng và lá hẹp để lấp khe. Mục tiêu 70/20/10 là định hướng phối, không là phép đo cố định mọi góc. Tránh đầu hoa phụ mọc từ tâm hoa chính.

Màu/chất liệu xem docs/MODEL_DESIGN.md và src/data/roses.ts. Hình học và map thủ tục bó hoa là tài sản tự tạo của dự án.

## 3. Dữ liệu chung

../../src/data/bouquet-layout.json là nguồn vị trí, direction, size, twist cho 10 bông. Web đọc trực tiếp qua roses.ts; arrange_bouquet.py đọc cùng JSON cho Blender. Nếu chỉnh layout trên web phải dựng lại cành/phụ kiện/fillers tương ứng, không chỉ thay JSON rồi giữ GLB cũ.

Builder dùng Y-up trong tính toán và W() để chuyển sang Blender Z-up. Đừng tự xoay thêm khi export.

## 4. Dựng lại mẫu hoa

Trong Blender, nạp scripts/blender/build_bouquet.py bằng cơ chế import có __file__ đúng. Thứ tự làm việc chính:
1. init_atelier(), textures(), materials().
2. rose(i,quality) cho i = 0…4, quality high/balanced.
3. accessories(), assemble().
4. export_variant(i,quality) cho các biến thể và export_accessories().
5. Nạp build_fillers.py rồi gọi build(builder), trong đó builder là module build_bouquet đã khởi tạo; bước này tạo raw fillers.glb mà pack mặc định cần.
6. save() sau khi kiểm tra; sau đó chạy arrange_bouquet.py nếu cần đồng bộ bản natural với JSON hiện hành.

Đây là recipe có context nội bộ C, không phải lệnh CLI nhận cờ. Nó có thể tạo/sửa scene chuyên dụng và ghi bản nguồn; đọc script trước khi chạy trên file đang có công việc chưa lưu. Dựng đầy đủ thư viện không đồng nghĩa bố trí natural đã được cập nhật.

GLB thô được ghi vào .qa/bouquet/raw/. Packer đọc chính thư mục này:

```sh
node scripts/pack-bouquet.mjs
node scripts/prepare-story-bouquet.mjs
node scripts/check-bouquet.mjs
```

Pack mặc định xử lý 10 mẫu high/balanced cộng accessories/fillers; phải có đủ raw input. Có thể pack riêng theo tên file không có .glb, ví dụ accessories hoặc fillers.

## 5. Cập nhật bố trí 10 hoa

1. Sửa JSON layout, giữ đủ 10 mục và các ID trong wishes.
2. Chạy scripts/blender/arrange_bouquet.py trong Blender. Script đọc thư viện, áp layout, dựng lại accessories và gọi build_fillers.
3. Kiểm tra scene/bọc/cành và bản natural được lưu.
4. Pack các nhóm vừa đổi rồi tái tạo bản story:

```sh
node scripts/pack-bouquet.mjs accessories fillers
node scripts/prepare-story-bouquet.mjs accessories fillers
node scripts/check-bouquet.mjs
npm run build
```

Nếu đổi cánh mẫu, cần export/pack lại mẫu high và balanced, sau đó story tương ứng. Chỉ đổi layout thì không bắt buộc dựng lại tất cả hình học cánh.

## 6. Vật liệu và đóng gói

pack-bouquet dùng dedup/prune/join, WebP và Meshopt. High tối đa 2048px, balanced 1024px. Các map gân/sợi được nén lossless theo pattern; phần còn lại quality 92. manifest.json lưu triangles, bytes, SHA-256, bounds, textures, source và recipe.

prepare-story-bouquet lấy hoa balanced, phụ kiện bản chính, simplify mục tiêu ratio 0,20 với error 0,003, map 512px quality 82. Đây là tham số xử lý, không hứa chính xác 20% tam giác cho mọi mesh.

## 7. Kiểm nhận và lưu trữ

Xoay trước/sau/nghiêng/trên; quan sát cánh xuyên nhau, bọc bị lộ khoảng rỗng lớn, cành không nối đài, filler chọc giữa hoa chính và màu khác giữa các cảnh. fillers runtime tắt raycast; chỉ 10 hoa mở thiệp.

Không giữ các bản before-*.blend và preview cũ làm nguồn hiện hành. .qa/ có thể tạo lại nhưng phải còn raw nếu định chạy packer. Xem [thiết kế mô hình](../../docs/MODEL_DESIGN.md), [giấy phép](../../public/models/LICENSES.md).

