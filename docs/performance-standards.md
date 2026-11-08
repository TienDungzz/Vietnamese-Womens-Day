# Quy chuẩn hiệu năng — Rose Wishes

## Phạm vi

Tham khảo [performance-standards của Valentine](https://github.com/TienDungzz/Valentine-14-2/blob/main/docs/performance-standards.md). Các ngưỡng dưới đây tách rõ kiểm tra build và mục tiêu cần đo thật. Lịch sử tối ưu xem [PERFORMANCE.md](PERFORMANCE.md).

## Ngân sách kiểm tra tự động

| Hạng mục | Giới hạn |
| --- | --- |
| JavaScript khởi đầu, toàn bộ static import closure | Dưới 350.000 byte |
| Tổng gzip từng chunk JavaScript khởi đầu | Dưới 110.000 byte |
| Scene3D và Photobooth | Dynamic import, không nằm trong static closure |
| Model phát hành | Mọi GLB trong public/models phải được runtime tham chiếu |

npm run check:performance đọc manifest trong dist, không đo thời gian mạng/FPS. Luôn build mới trước khi chạy; npm run check:standards thực hiện đúng thứ tự này. Vite cảnh báo chunk trên 500 kB không đồng nghĩa build thất bại; không tăng warning limit chỉ để che cảnh báo.

Số đo gần nhất đã ghi nhận: entry khoảng 258 kB, gzip 82 kB; đây là lịch sử, không phải số đo tự cập nhật. Chunk 3D vẫn lớn và chỉ tải khi cần; toàn bộ trải nghiệm không giảm cùng tỷ lệ với entry.

## Chính sách runtime

Giữ Scene3D và Photobooth tải riêng; fallback không import Three. Giữ chỗ stage, overlay tải và preload/GPU gate, không thay mô hình tạm. Photobooth đóng phải giải phóng cache/object URL theo ownership, giữ draft metadata trong sessionStorage.

Tái sử dụng vector/material/geometry và cache path/hình học theo frame bất biến. Preview ghép ảnh gom bằng requestAnimationFrame; hủy lượt lỗi thời. DPR hiện giới hạn 1–1,5 trong Canvas; không tăng mặc định nếu chưa đo lại. Giảm chi tiết trang trí/bóng trước các chi tiết hoa chính, mặt/tay và khả năng đọc.

## QA trên thiết bị thật

Mục tiêu đề xuất: ít nhất 30 FPS, frame time p95 khoảng 33 ms trở xuống trên điện thoại tham chiếu. Chưa có bằng chứng dự án đạt các mục tiêu này trên mọi máy. Chưa chốt ngân sách tổng MB, draw calls, tam giác hoặc RAM; cần đo trước khi đặt giới hạn phù hợp bó hoa hiện tại.

Đo production build trên Android tầm trung và Safari iPhone; ghi commit, thiết bị, OS/browser, mạng, viewport/DPR, cache lạnh/nóng. Đo byte truyền tải, thời gian ready, frame time p50/p95, draw calls/triangles và bộ nhớ qua 10 vòng replay/mở đóng photobooth. Thử xuất 16–20 ảnh, chuyển ngày/đêm và đổi ngôn ngữ. Không suy kết quả máy thật từ emulation desktop.

## Lệnh kiểm tra

npm run build rồi npm run check:performance kiểm ngân sách không cần browser. npm run check:performance -- --browser kiểm lazy loading ở production preview mặc định cổng 5188 và Chrome QA CDP 9222; đổi URL bằng PERFORMANCE_QA_URL. Kiểm thử này dùng fallback giả lập, không chứng minh hiệu năng WebGL.

npm run check và npm run check:photobooth kiểm tính toàn vẹn tài nguyên, xuất ảnh và hành vi liên quan. Điều kiện chạy browser QA xem CODE_STYLE.md. Không nới ngân sách nếu chưa ghi lý do và số đo trước/sau.
