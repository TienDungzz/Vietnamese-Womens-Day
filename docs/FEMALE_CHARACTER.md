# Nhân vật nữ — thiết kế và quy trình chỉnh sửa

## 1. Hình dáng hiện hành

Nữ dùng nền giải phẫu và rig tương thích với nam, nhưng có bản Blender và GLB riêng. Trang phục theo ảnh tham chiếu: áo xám tay ngắn, jeans xanh bạc màu cạp cao ống rộng, chi tiết rách nhẹ ở gối, giày sáng, túi vai ngà và dây chuyền nhỏ. Không còn váy sáng như đặc tả đầu tiên.

Tóc **thẳng ngang vai màu nâu đen**, rơi hai bên má, đuôi cong nhẹ vào trong; mái thưa ngang trán kết thúc trên mi. Không còn tóc uốn dài. Đây là thích nghi phong cách, không phải scan hay bản sao danh tính người trong ảnh.

## 2. Tài sản

| Thành phần | Đường dẫn |
| --- | --- |
| Bản chỉnh sửa | art/characters/female-grey-jeans.blend |
| Web | public/models/characters/female-grey-jeans.glb |
| Dựng cơ thể/trang phục | scripts/blender/build_female.py |
| Preset tóc hiện tại | scripts/blender/female_straight_bangs.py |
| Atlas tóc | art/characters/textures/female-straight-strands.png |
| Đóng gói | scripts/finalize-female.mjs |
| URL/cache version | src/sceneAssets.ts |

build_female gọi preset tóc hiện tại khi dựng đầy đủ. Muốn chỉ đổi tóc, dùng update_existing() trong script tóc với scene nữ đúng; không cần chạy lại các pass tỷ lệ nam.

## 3. Tóc và vật liệu

Tóc có lớp nền kín và các sợi mảnh hình học thuôn. Mái được phân thành nhiều sợi, tránh mép alpha cắt vụn/nhiễu trên trán. Atlas tạo sắc độ và sợi nhỏ trên nền nâu đen. Mesh tóc gắn theo bone đầu.

Finalizer bỏ KHR_materials_sheen ở vật liệu RW Female straight vì extension xuất trước đây làm tóc đen trông bạc. Các texture tóc/fiber nén WebP lossless, phần còn lại chất lượng 94, tối đa 1024px. Meshopt dùng cho hình học; không tự giảm chất lượng bằng thay kiểu tóc khác.

## 4. Bộ xương và vai trò trong cảnh

Trang phục, da lộ, phụ kiện gắn trọng số theo bone names hiện có. Giữ Idle_Standing và Walk_Relaxed. Runtime scale 0,94; nhóm nữ ở [0.15, 0.37, -1.8]. Cao độ 0,37 là đặt trên hiên, không phải thay chiều cao mô hình.

Trong cảnh mở cửa/trao hoa, nữ dùng IK tay tới bó hoa chung. Không có clip bắt tay nhận hoa hoàn chỉnh riêng hay mô phỏng ngón tay vật lý. Phải giữ origin, bone names và scale khi xuất.

## 5. Cập nhật chỉ tóc

1. Mở master nữ bằng Blender; kiểm tra scene/rig đúng, lưu công việc cần giữ.
2. Chạy script female_straight_bangs.py trong Blender. Script xuất GLB nữ và stage bản .blend ở .qa/characters/female-hair-update.blend.
3. Kiểm tra tóc, khuôn mặt, vai và hoạt ảnh trong bản stage.
4. Sau khi chấp nhận bản stage, chép về art/characters/female-grey-jeans.blend.
5. Chạy finalizer rồi build.

```sh
node scripts/finalize-female.mjs
npm run build
npm run check
```

Finalizer xử lý GLB đã được Blender xuất, không tự mở .blend. Nó bỏ idle trùng tên Idle_Standing.*, khôi phục atlas nguồn, nén texture/hình học và giữ cấu trúc rig. Nếu đổi asset nhưng trình duyệt giữ cache, cập nhật URL version.

## 6. Kiểm nhận

Xem trước, nghiêng và sau đầu; tóc không xuyên vai, mái không che mắt hoặc thành mảng sáng. Kiểm tra áo/jeans/da không hở seam; bàn chân đúng hiên; tay nhận không bị mixer ghi đè. Chạy toàn story đến studio và thiệp. Nguồn/giấy phép chung xem public/models/LICENSES.md.

