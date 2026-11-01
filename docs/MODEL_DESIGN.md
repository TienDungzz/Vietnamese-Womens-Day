# Thiết kế mô hình và vật liệu

## 1. Phân loại tài sản

| Nhóm | Cách tạo | Tệp hoặc thành phần |
| --- | --- | --- |
| Hoa hồng, giấy, nơ, lá, hoa phụ bó hoa | Blender, xuất GLB | art/bouquet/, public/models/bouquet/ |
| Nam và nữ | Blender, mesh gắn bộ xương | art/characters/, public/models/characters/ |
| Hai chậu sát hiên | GLB Poly Haven đã xử lý | public/models/plants/potted-plant.glb |
| Nhà, cửa, đường, cầu, xích đu, hộp thư | Hình học Three.js | src/scenes/ |
| Cây bóng mát, hoa trắng, rào hoa giấy, vườn, rừng | Hình học thủ tục, nhiều phần dùng instancing | GardenTrees, BlossomTrees, FlowerFence, FlowerGarden, Forest |
| Trời, mây, mặt trời/trăng, sao | Mesh và shader | SkyCycle.tsx |

Không phải mọi vật thể đều là mô hình tải từ thư viện. Blender master là nguồn chỉnh sửa; GLB là bản phân phối cho web. Không dùng .blend để hiển thị trực tiếp trong trình duyệt.

## 2. Bó hoa: cấu trúc và điểm nhấn

Bó hoa gồm **10 hoa chính có ID độc lập**, dựng từ năm mẫu hình học khác nhau. Mẫu lặp theo i % 5 nhưng vị trí, kích thước, màu, độ nghiêng và xoay khác nhau. Nhìn từ trên là các cụm lệch tự nhiên, không phải một vòng tròn chia đều.

Các bông trung tâm cao/lớn hơn; bông ngoài thấp và nhỏ hơn, tạo vòm có nhịp. Bọc giấy kem và hồng trầm ôm bó; nơ satin và cành kết nối phía dưới. Lá và hoa phụ bù các khe, không phủ thành lớp nổi trên tâm hoa chính.

Mục tiêu mỹ thuật khoảng 70% hoa chính, 20% hoa phụ/lá và 10% khoảng thở được hiểu là hướng phối nhìn từ trên. Không cam kết tỷ lệ diện tích chính xác ở mọi góc. Các số đo cũ của một bố trí không được coi là số đo của bố trí mới nếu chưa tính lại.

## 3. Hình học cánh hồng

build_bouquet.py dựng năm biến thể với 8, 10 hoặc 12 lớp xoắn, khoảng 45–67 cánh tùy mẫu. Cánh có:
- Cong dọc từ chân ra đầu, không là miếng phẳng thẳng.
- Khum ngang, bất đối xứng và nếp uốn nhỏ.
- Mép lật ra có điều tiết để hoa bung nhưng không xòe cứng.
- Bề dày và mặt sau, giúp nhìn nghiêng/sau không mất cánh.

Các lớp được nén sát hơn so với phiên bản đầu. Phần lõi cuộn dày, lớp ngoài mở rộng hơn; kích thước và seed biến thiên giữ hình dáng ổn định giữa các mức chi tiết. “Có mặt sau” ở đây là hình học đã dựng, không chỉ bật double-sided cho một tấm không bề dày.

## 4. Màu và PBR

roses.ts giữ bảng 10 màu: đỏ nhung, hồng phấn, kem, đỏ rượu, hồng pastel, đỏ nhung đậm, hồng đào, kem, hồng đậm và ruby. Base color được đặt vào vật liệu cánh theo ID. PBR có map chi tiết gân, sáng tối và roughness; giấy có sợi/nhăn, lá có gân, satin có đặc tính riêng.

ModelRose.tsx nhân bản vật liệu cần đổi màu nhưng dùng chung map theo chất lượng/tên texture để hạn chế GPU upload trùng. Hover/selection dùng phát sáng nhẹ, không thay hẳn màu hoa. Material hiển thị FrontSide; bề mặt sau phải có trong asset. Studio dùng AgX, không thay toàn bộ vật liệu bằng một chất liệu phẳng.

So màu Blender/web bằng cùng palette và ánh sáng tham chiếu, không lấy viewport solid của Blender làm kết quả cuối.

## 5. Bố trí và hoa phụ

src/data/bouquet-layout.json là nguồn chung:
- position: tâm mẫu hoa.
- direction: hướng trục hoa, được chuẩn hóa thành quaternion.
- size: tỷ lệ đồng đều.
- twist: xoay quanh trục hoa, radian.

arrange_bouquet.py áp dụng bảng này cho bản Blender, dựng lại cành và phụ kiện liên quan. build_fillers.py đặt hoa nhỏ trong khoảng hở dựa trên hình bao hoa chính, có biên an toàn; không chủ ý rải đầu hoa phụ xuyên từ giữa hoa chính.

Hoa phụ gồm cúc nhỏ màu ngà nhụy vàng, hoa trắng li ti, lá hẹp phân nhánh và lá xanh bổ trợ. Trong web, toàn bộ clone fillers bị vô hiệu raycast và gắn decorative. Không có ID lời chúc cho chúng. Các con số chi tiết từng loại có thể thay theo lần dựng; khi cần kiểm kê chính xác, đọc GLB/recipe mới thay vì suy từ ảnh.

## 6. Ba mức chi tiết

| Mức | Khi dùng | Đặc điểm |
| --- | --- | --- |
| story | Hoa cầm tay trong cảnh xa | Tạo từ balanced, đơn giản hóa; texture tối đa 512px |
| balanced | Khám phá khi media query max-width:760px khớp | Ít hình học hơn high; pack texture tối đa 1024px |
| high | Khám phá ở màn rộng hơn | Chi tiết cánh cao; pack texture tối đa 2048px |

Mức được chọn bằng media query, không chấm điểm GPU. Không tự chuyển chất lượng theo FPS. Một phiên tải đủ story và mức khám phá được chọn trước khi hiện cảnh. Phụ kiện/fillers có bản chính và story, không có cặp high/balanced riêng.

22 GLB hiện hành gồm 15 mẫu hồng, 4 phụ kiện/fillers, 2 nhân vật và 1 chậu. Một phiên bình thường cần 17 URL, không tải cả high và balanced. manifest.json lưu số tam giác, texture, checksum của các bản bó hoa chính.

## 7. Nhân vật nam

Nam có dáng thon, tương đối cao, vai/thân vừa, khoảng cách chân thu lại để bước tự nhiên. Mặc cardigan charcoal có bề mặt dệt, áo trong kem, quần ivory **ống suông** và giày. Quần giữ đường rơi thẳng thay vì phồng bắp chân hoặc nhăn xoắn quá mức.

Tóc tối màu **side part 7/3**, có đường chia lệch, lớp mái quét, độ phồng trên đỉnh và các lọn mảnh. Tóc có hình học/lớp sợi và opacity atlas; không chỉ là một khối ôm sát đầu. Khuôn mặt và bàn tay giữ chi tiết giải phẫu/texture từ nguồn Sam, không phải dựng lại bằng các hình cầu.

Nguồn: art/characters/male-cardigan.blend. Web: male-cardigan.glb. Các pass chỉnh tỷ lệ đã có trong master, không chạy lặp tùy tiện.

## 8. Nhân vật nữ

Nữ là bản thích nghi riêng từ cùng nền rig/giải phẫu, không đổi trực tiếp asset nam. Áo xám tay ngắn, jeans xanh bạc màu cạp cao ống rộng có chi tiết rách nhẹ, giày ngà, túi vai sáng và dây chuyền nhỏ.

Tóc hiện hành thẳng tối màu chạm vai, phần đuôi cong nhẹ vào trong, mái thưa ngang trán ở trên mi. Dùng lớp tóc nền và sợi hình học thuôn thay vì alpha cutout dày gây nhiễu vùng trán. Đây là thay thế kiểu tóc dài uốn trước đó.

Nguồn: female-grey-jeans.blend; web: female-grey-jeans.glb. Chi tiết quy trình ở FEMALE_CHARACTER.md.

## 9. Rig và chuyển động

Cả hai giữ Idle_Standing và Walk_Relaxed. SkeletonUtils.clone tách bộ xương từng instance. AnimationMixer áp clip trước, sau đó IK giải tay theo bó hoa trong cùng callback để mixer không ghi đè pose cuối.

Chuyển idle/walk fade khoảng 0,5s; nhịp bước điều chỉnh theo tốc độ di chuyển. Runtime scale nam 0,96, nữ 0,94. Tay dùng chuỗi upperarm/lowerarm/hand với bốn lượt giải; không có mô phỏng gân hay ngón tay vật lý.

Bó hoa nội suy vị trí/quaternion thế giới giữa hai carry anchor, đồng thời chuyển trọng số giữ của hai người. Nhờ đó nó không nhảy parent đột ngột. Đây là IK + clip + nội suy được dàn dựng, chưa phải motion capture riêng cho toàn động tác trao hoa.

## 10. Quy tắc chỉnh asset

Giữ ID, bone name, clip name và local origin khi xuất lại. Kiểm tra đầy đủ góc trước/sau, tỷ lệ với người và bọc, vị trí tay, chân trên hiên, cửa mở và chuyển sang cảnh gần. Không đưa bouquet mesh vào file nhân vật: bó hoa được ứng dụng quản lý độc lập. Nguồn/giấy phép xem public/models/LICENSES.md.

## 11. Bề mặt và hình học môi trường

useSurface.ts tạo CanvasTexture 256×256 có seed cố định cho plaster, stone, wood, grass và asphalt. Chúng dùng nhiễu, vân hoặc vết nhỏ theo loại, thiết lập sRGB và lặp bề mặt; một số mesh dùng lại map làm bump. Đây là texture thủ tục, không phải bộ PBR scan độ phân giải cao. Khi muốn nâng độ thật, cần đánh giá cả hình học, UV/tỷ lệ lặp và ánh sáng, không chỉ tăng độ tương phản texture.

Lá, hoa vườn, rừng và rào tận dụng InstancedMesh để lặp nhiều phần tử với transform/màu riêng. Cành chính, nhà, ván cầu và bậc đá là mesh lắp ráp; bầu trời/nước dùng shader. Tăng số phần tử cần tính cả chi phí tam giác và bóng đổ; chỉ giảm số GLB không đồng nghĩa đã giảm độ nặng toàn cảnh.

