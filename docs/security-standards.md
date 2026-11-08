# Quy chuẩn bảo mật và dữ liệu — Rose Wishes

[Tài liệu dự án](README.md) · [README · VI/EN](../README.md)

## Phạm vi và dữ liệu công khai

Tham khảo [security-standards của Valentine](https://github.com/TienDungzz/Valentine-14-2/blob/main/docs/security-standards.md), điều chỉnh cho website có API nội dung và photobooth. Hiện không có đăng nhập, backend quản trị, camera, microphone hay upload ảnh của người xem.

10 lời chúc, 20 ảnh và mọi biến VITE_* đều có thể được người truy cập đọc. Không dùng frontend để giữ lời nhắn bí mật, API key hoặc credential. Chỉ endpoint công khai được cấu hình trong .env.example; .env thực phải được ignore, không commit. Không tự thêm analytics hoặc gửi tương tác cho bên thứ ba.

## Nội dung, URL và API

Render lời chúc dưới dạng text React; không dangerouslySetInnerHTML, eval, Function động hay document.write trong src. Không coi API là HTML tin cậy. Kiểm đúng số lượng, ID duy nhất, VI/EN/plain string và thứ tự theo ID.

URL ảnh/API chỉ HTTP(S), không nhúng username/password. Dùng HTTPS ở production; HTTP chỉ cho phát triển hoặc cấu hình hosting đã đánh giá. Chặn javascript:, data:, file:, blob: từ API; blob nội bộ phục vụ export là trường hợp riêng. Timeout/abort và lỗi từng phần phải trả về nội dung dự phòng; không hiển thị stack/credential cho người dùng.

Ảnh bên thứ ba thấy request và có thể ngừng phục vụ; ảnh export cần CORS thích hợp. Font Google hiện là tài nguyên mạng, ảnh demo Picsum không phải bộ ảnh chính thức. Ghi nguồn/giấy phép khi thay ảnh.

## Storage và tài nguyên

localStorage chỉ lưu lựa chọn ngôn ngữ rose-language. sessionStorage giữ ID đã xem rose-seen và metadata draft rose-photobooth, không lưu bytes ảnh hoặc secret. Parse có try/catch, allowlist ID/giá trị và fallback; không đọc key dự án khác. Kiểu draft mới phải có cách migrate/version phù hợp; hiện dữ liệu cũ được lọc khi đọc.

Giữ package-lock.json và dùng npm ci khi phát hành. Chỉ phát hành dist; không sao chép .env, .git, .qa, node_modules, master .blend hoặc script nội bộ vào public/dist.

## Hosting: cần kiểm chứng riêng

HTTPS, X-Content-Type-Options: nosniff, Referrer-Policy phù hợp; Permissions-Policy tắt camera/microphone. CSP phải theo origin API/ảnh/font và decoder/worker thực tế, hạn chế wildcard/unsafe-eval. frame-ancestors theo chính sách nhúng; HSTS chỉ trên domain đã sẵn sàng HTTPS.

Header này do hosting cung cấp; tài liệu không khẳng định đã cấu hình. Kiểm MIME GLB/JS/texture và CORS mà không phá WebGL, decoder hoặc xuất PNG. Không dùng chế độ no-cors để né lỗi export.

## Kiểm tra và giới hạn

npm run check:security kiểm AST các sink nguy hiểm trong src, file nhạy cảm đã tracked, tệp nội bộ vô tình vào public/dist, chạy kiểm thử schema/client API hiện có và ca URL nguy hiểm bổ sung. Chỉ báo đường dẫn/rule, không in nội dung nghi là secret.

npm run test:standards kiểm checker bằng fixture an toàn/nguy hiểm. npm run check:standards build mới trước kiểm tra bảo mật để kiểm artifact hiện hành. Kiểm tra tĩnh không phải bộ quét secret toàn diện và có thể bị alias/computed access qua mặt; không thay code review, pentest hoặc kiểm header hosting. npm run check:dependencies chạy npm audit --omit=dev khi có mạng; không tự nâng dependency hoặc cam kết không có lỗ hổng chỉ vì checker cục bộ đạt.
