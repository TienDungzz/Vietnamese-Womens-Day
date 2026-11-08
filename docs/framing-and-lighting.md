# Khung hình, ánh sáng và giao diện

[Tài liệu dự án](README.md) · [README · VI/EN](../README.md)

## 1. Bố cục thị giác

Nhà là điểm đến của câu chuyện, bó hoa là điểm nhấn sau trao. Chữ nằm phía trên trái; nhà và sân chiếm vùng chính. Mặt trời/mặt trăng giữ gần góc trên phải. Đường và rào tạo tiền cảnh; nhà/cây/xích đu là trung cảnh; sông/rừng tạo hậu cảnh. Cây bao khung nhưng phải tránh che cửa, tay và bó hoa.

Giao diện dùng Be Vietnam Pro cho nội dung, Playfair Display cho tiêu đề; hồng trầm là màu nhấn. Dòng Ngày Phụ nữ Việt Nam **20/10** luôn ở vùng tiêu đề chính.

## 2. Camera theo giai đoạn

CameraRig trong src/main.tsx dùng camera phối cảnh FOV 40°. Đây là các **vị trí đích**, vị trí thực tế được nội suy.

| Giai đoạn | Vị trí | Điểm nhìn |
| --- | --- | --- |
| Đứng chờ, đang đi | [9, 6.3, 12.8] | [0, 1.7, -0.45], góc 3/4 |
| Tới cửa, gõ, mở, trao | [3.8, 3, 4.3] | Vẫn vùng trước nhà; nhân vật lớn hơn |
| Tiến vào hoa | [0.15, 2.1, 0.5] | [0.15, 1.85, -1.46] |
| Khám phá | [0, 2.2, 5.2] | [0, 0.5, 0], OrbitControls |

Cảnh chuyện dùng lerp theo dt, không chạy spline. Sang khám phá là đổi tổ hợp cảnh và camera, chưa có match-cut video hoặc depth-of-field riêng. Reduced motion đưa camera về đích ngay.

## 3. Canvas trong trang

.stage đặt tuyệt đối; chữ và nút là DOM ngoài Canvas. Mặt nạ CSS làm mềm mép cảnh chuyện, khác với fog 3D.

| Chế độ | Inset .stage hiện hành |
| --- | --- |
| Story desktop | 125px −3% 140px 10% |
| Explore desktop | 235px 20% 165px |
| Story ≤800px | 250px −22% 170px −22% |
| Explore ≤800px | 260px −6% 180px |

Inset âm giúp nhà lớn hơn trong khung; vùng trái chừa chỗ chữ. Khi mở thiệp mobile, selector .explore:has(.wish-card) thu vùng bó hoa lại; thiệp phía dưới cuộn khi dài. Trang có min-height 900px desktop, 820px mobile; màn thấp có thể cuộn.

**800px** là breakpoint giao diện, **760px** là mốc chọn mô hình balanced/high. Hai cơ chế độc lập. Đổi một mốc không tự đổi mốc kia.

## 4. Điều khiển bó hoa

OrbitControls có target [0, 0.5, 0], khoảng cách 3,4–7, góc cực 0,65–1,9 radian, không pan. Damping 0,075; rotateSpeed 0,65; zoomSpeed 0,7. Người xem kéo/vuốt để xoay, cuộn/chụm để phóng. Reset tạo lại controls và đưa camera về mặc định.

Phải kiểm tra trước, sau, hai bên và nhìn từ trên. Giấy, lá và cánh cần có mặt sau phù hợp; không đánh giá asset chỉ bằng chính diện.

## 5. Ánh sáng và màu

Atmosphere.tsx dùng hemisphere, đèn hướng chính có bóng và đèn bù lạnh. Ban ngày, đèn chính ở [-8, 12, 6], ánh kem ấm. Shadow map 1024², bias và normal bias giảm lỗi bóng. Fog phủ khoảng xa 22–65.

Đèn hiên/dây đèn tạo điểm ấm; nhóm đèn hiên điều khiển tăng cường độ về đêm. Một số đèn nhỏ và vật liệu phát sáng vẫn tĩnh, không phải mọi nguồn sáng đều nội suy cùng công thức.

Studio bỏ sky/fog của cảnh chuyện; dùng đèn trước, chính, bù và spot sau để tách cánh. Nền tròn burgundy và vòng mảnh nằm dưới hoa. Nền DOM vẫn theo ngày/đêm.

Studio dùng **AgX tone mapping**. ModelRose giữ vật liệu GLB, nhân bản phần cần đổi màu, dùng chung map theo mức chi tiết. Màu 10 hoa do roses.ts quyết định. Cùng màu đầu vào vẫn có thể khác cảm nhận giữa Blender/web do ánh sáng và quản lý màu.

## 6. Ngày, hoàng hôn và đêm

useDayNight nội suy night từ 0 đến 1 trong **3.200ms**, smoothstep; reduced motion còn 200ms. CSS nhận --night, 3D dùng ref để đổi trời, fog, ánh sáng, mây và thiên thể.

SkyCycle pha trời xanh, hoàng hôn hồng xám/tím xanh rồi xanh đêm; không dùng cam đậm. Mặt trời hạ/mờ khi trăng hiện; 65 sao sáng dần. Bốn cụm mây trôi rất chậm theo X. Reduced motion giữ mây đứng yên.

Thiên thể được đặt theo camera và phần Canvas thực sự nằm trong viewport để tránh mất ở mobile. Đây là chuyển trạng thái theo nút, không phải bầu trời theo giờ thực hoặc mô phỏng thiên văn.

## 7. UI và chuyển ngôn ngữ

Header có thương hiệu, dropdown VI/EN, ngày/đêm và âm thanh. Mobile dùng icon cho ngày/đêm và âm thanh. Dropdown có tên ngôn ngữ đầy đủ và dấu chọn; hỗ trợ bàn phím và đóng khi bấm ngoài.

Trong photobooth dùng cùng `SiteHeader`, giữ logo và chỉ hiện nút đóng SVG căn giữa; các nút còn lại ẩn. Mở photobooth bằng cách nhấn trực tiếp lên xấp ảnh, có viền sáng khi hover/focus, không có nút chữ hoặc lời gợi ý riêng. Dòng mô tả ngắn phía dưới tiêu đề mở đầu đã bỏ; cảnh khám phá vẫn có mô tả của bó hoa. Scrollbar toàn trang mảnh, track trong suốt và thumb theo màu nhấn ngày/đêm.

StableText xếp VI/EN vào cùng một ô Grid: cả hai góp kích thước, chỉ một bản nhìn thấy và được đọc bởi công nghệ hỗ trợ. Tiêu đề, nút, hướng dẫn và thiệp dành chỗ theo bản dài hơn. Không dùng hiệu ứng chiều cao để che xê dịch; bản ngắn có thể có thêm khoảng trống. Thiệp dài vẫn cuộn.

Thiệp lời chúc dùng nền giấy trắng hồng ở chế độ ngày, lavender đậm ở chế độ đêm; viền mảnh, góc bo và bóng nhẹ. Biểu tượng hoa là SVG nét mảnh, tiêu đề serif và nội dung có nhịp dòng thoáng. Nút đóng trong suốt, hai nút trước/sau dùng viền nhẹ; nút trở lại bó hoa là liên kết chữ. Mobile giữ tối đa 60svh và cuộn khi nội dung dài; cả hai ngôn ngữ vẫn dùng StableText để giữ hình học ổn định.

## 8. Kiểm tra mỹ thuật

- Thấy rõ nhà, cửa, hướng nam đi; rào/cây không che hành động chính.
- Lối cầu nối đường lớn; nhà có khoảng vườn phía sau trước sông.
- Mặt trời/trăng còn trong khung; hoàng hôn không cam gắt.
- Màu hoa nhất quán giữa cảnh cầm và cảnh gần; mặt sau không thiếu bề mặt.
- Chân nữ trên hiên, cửa mở vào trong, tay/bó hoa khớp.
- Đổi VI/EN không làm các khối DOM đổi vị trí; thử cả thiệp dài nhất.

