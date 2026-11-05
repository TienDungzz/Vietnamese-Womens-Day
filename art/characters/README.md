# Nguồn Blender của hai nhân vật

## 1. Master hiện hành

| Tệp | Thiết kế |
| --- | --- |
| male-cardigan.blend | Nam thon cao, cardigan charcoal, áo kem, quần ivory ống suông, tóc side part 7/3 bồng |
| female-grey-jeans.blend | Nữ áo xám, jeans xanh bạc ống rộng, giày/túi ngà, tóc thẳng ngang vai mái thưa |
| textures/soft-hair-strands.png | Atlas sợi/opacity tóc nam |
| textures/female-straight-strands.png | Atlas màu sợi tóc nữ |
| textures/female-fringe-strands.png | Atlas màu/alpha 2048 × 1024 cho mái nữ |
| textures/female-fringe-normal.png | Normal sợi mái nữ |

Giải phẫu mặt/tay, skeleton và clip kế thừa Sam CC0; trang phục, tóc và chỉnh tỷ lệ thuộc công việc dự án. Đây là hai tài sản riêng dùng cùng nền rig, không sửa nữ bằng ghi đè GLB nam.

## 2. Rig và quy ước

Giữ Idle_Standing và Walk_Relaxed, chuỗi upperarm_l/lowerarm_l/hand_l và phía _r. Runtime dùng SkeletonUtils.clone; mixer chạy trước IK. Scale nam 0,96, nữ 0,94. Bó hoa được quản lý ngoài file nhân vật, không export lẫn vào rig.

Không tự apply transform hoặc đổi rest pose mà bỏ qua skin/animation. Các pass thon chân và đổi tỷ lệ trong master đã hoàn tất; chạy lặp có thể làm sai mesh/rest skeleton.

## 3. Nam

Recipe nằm tại scripts/blender/: build_male.py, refine_male.py, straighten_calves.py, reference_style_v4.py. Đây là các bước dựng/chỉnh theo lịch sử, không phải chuỗi bắt buộc chạy lại mỗi lần đổi tóc.

Mục tiêu giữ quần suông rơi thẳng, chân không phồng và khoảng bước vừa. Tóc có đường chia 7/3, lớp quét và độ phồng, không ép thành mũ ôm đầu.

Để xuất master đã chỉnh:
1. Mở scene nhân vật đúng, chọn rig và mesh skin đang dùng.
2. Tạo .qa/characters/ nếu chưa có.
3. Xuất GLB có animation vào .qa/characters/male-cardigan.glb.
4. Chạy:

```sh
node scripts/pack-male.mjs
node scripts/check-male.mjs
npm run build
```

Packer kiểm hai clip, chặn đối tượng bó hoa lẫn vào, nén map WebP 1024px quality 88 và Meshopt, cập nhật bytes/hash trong metadata nam. Hair cards được cấu hình alpha phù hợp. Đổi URL version nếu cần bỏ cache cũ.

## 4. Nữ

build_female.py dựng bản thích nghi; female_straight_bangs.py là preset tóc hiện hành và đã được gọi từ recipe đầy đủ. Phần mái cong được dựng bởi female_soft_fringe.py. Đổi riêng mái dùng update_existing(), kiểm tra rồi export_current(); bản stage là .qa/characters/female-soft-fringe.blend. Không dựng lại toàn cơ thể.

Blender export nữ trực tiếp vào public/models/characters/female-grey-jeans.glb, sau đó:

```sh
node scripts/finalize-female.mjs
npm run check
npm run build
```

Finalizer bỏ idle trùng, bỏ sheen sai ở tóc mới, gắn atlas nguồn và nén texture/Meshopt. Khi dùng script tóc riêng, kiểm tra bản stage .qa/characters/female-hair-update.blend trước khi thay master. Chi tiết ở [nhân vật nữ](../../docs/FEMALE_CHARACTER.md).

## 5. Kiểm tra hình ảnh và chuyển động

render_character_head.py và render_reference_previews.py hỗ trợ tạo lại ảnh kiểm tra; đọc cấu hình/đường dẫn trong script trước khi dùng. Preview không là tài nguyên web.

Kiểm trước, nghiêng, sau, idle và walk; quần không phồng calf, tóc không bạc/rách alpha, tay giữ hoa đúng trước thân. Chạy cả story để kiểm chân nữ trên hiên và nhận hoa. Giữ nguồn/giấy phép tại [LICENSES.md](../../public/models/LICENSES.md).

