# Tải tài nguyên và chỉ hiện cảnh hoàn chỉnh

[Tài liệu dự án](README.md) · [README · VI/EN](../README.md)

## 1. Mục tiêu

Người xem không thấy lần lượt nhân vật tạm, hoa sơ bộ rồi mô hình chính. Khi chưa chuẩn bị xong, overlay che cảnh và khóa tương tác. GLB story/high/balanced là mức chi tiết theo mục đích hiển thị, không phải placeholder.

## 2. Danh sách tải

src/sceneAssets.ts quản lý URL dùng chung cho preload và consumer:
- Nam, nữ, chậu cây: 3 URL.
- Năm hoa story và năm hoa mức khám phá được chọn: 10 URL.
- Giấy/nơ/lá và fillers, mỗi nhóm có bản chính/story: 4 URL.

Tổng 17 URL cho một lựa chọn chất lượng. Toàn thư mục có 22 GLB do còn mức khám phá còn lại. bouquetDetail() chọn balanced khi max-width:760px khớp, high khi không khớp.

useGLTF.preload() được gọi **từng URL**. SceneAssets đọc cùng cache key từng URL trong một Suspense. Không đổi thành preload một mảng nếu consumer vẫn đọc đơn lẻ: cache key sẽ khác.

## 3. Chuẩn bị GPU và mở Canvas

1. App preload, đặt main inert và Canvas visibility:hidden.
2. Suspense đợi GLB giải mã; ScenePending trả null và báo chưa ready.
3. PrepareScene thu texture của mô hình/cảnh, gọi gl.initTexture.
4. gl.compile(scene,camera), kiểm tra LINK_STATUS và diagnostics.
5. gl.render() một khung hoàn chỉnh khi Canvas còn ẩn.
6. invalidate và đợi hai requestAnimationFrame rồi xác nhận ready với scene mode.
7. App hiện Canvas, gỡ khóa UI và đưa frameloop về always.

Lúc tải dùng frameloop=demand. Compile và warm-up trong cùng lượt giúp tránh polling bất đồng bộ giữ vật liệu đã bị StrictMode dọn. Texture hoa có cơ chế dùng chung; không cần upload lại mọi bản giống nhau.

Readiness có token story hoặc studio:quality. Khi chuyển sang khám phá, tổ hợp ánh sáng và scene mới được chuẩn bị trước khi mở tương tác. Có đủ byte trên mạng chưa đồng nghĩa GPU đã sẵn sàng.

## 4. Khóa hành động và ngoại lệ

loading phụ thuộc assetsReady và readyMode khớp sceneMode. Các handler chọn/bắt đầu/bỏ qua/xem lại kiểm tra loading. useSceneFlow ngừng timer và Story ngừng chuyển động chính khi bị pause. Đây không phải pause toàn bộ mọi animation của engine.

Lỗi tài nguyên/shader được chuyển lên RenderBoundary, hiển thị thông báo và nút reload. Không đổi sang một nhân vật đơn giản hoặc âm thầm bỏ asset lỗi.

Thông báo tải VI hiện tại:
> Chờ một chút nhé, có điều bất ngờ dành cho em…
>
> Những điều đẹp đẽ luôn đáng để chờ đợi.

Bản EN nằm trong i18n.tsx. Ngôn ngữ đã lưu được áp dụng cho overlay.

## 5. Thiết bị không WebGL

App kiểm tra WebGL2. Nếu không hỗ trợ, Fallback dùng public/images/bouquet.svg và nút khám phá 10 thiệp. Đây là trải nghiệm thay thế ổn định cho thiết bị đó; không phải ảnh hiện tạm trong khi đợi GLB.

## 6. Kiểm chứng và xử lý sự cố

```sh
node scripts/check-scene-loading.mjs
node scripts/check-scene-loading.mjs --mobile
node scripts/check-scene-loading.mjs --screenshots
```

Cần dev 5173 và QA Chrome CDP 9222. Script giữ một GLB, kiểm tra cảnh ẩn/UI khóa, thả request, chuyển cảnh dùng cache, gây lỗi chậu và thử lại. --mobile kiểm tra thêm nhánh thiết bị nhỏ; --screenshots lưu ảnh vào .qa/.

Nếu overlay không hết: kiểm tra request lỗi, URL consumer có trùng preload, link shader, console và token mode. Không giải quyết bằng cách bỏ overlay trước khi cảnh đủ. Nếu đổi GLB nhưng vẫn thấy bản cũ: kiểm tra query version, browser cache và đường dẫn asset.

