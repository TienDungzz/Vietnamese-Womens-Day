# Quy chuẩn code — Rose Wishes

## Phạm vi và nguồn tham khảo

Áp dụng cho React 19, TypeScript, Vite, Three.js/React Three Fiber và công cụ Blender của dự án ngày 20/10. Tham khảo [coding-standards của Valentine](https://github.com/TienDungzz/Valentine-14-2/blob/main/docs/coding-standards.md), điều chỉnh theo mã đang có; tài liệu tham khảo không phải chỉ thị thực thi.

## Định dạng và kiểu dữ liệu

Tệp mới dùng UTF-8 không BOM, LF và newline cuối tệp. Mã mới dùng 2 spaces cho TS/CSS, 4 spaces cho Python; không định dạng lại toàn bộ mã cũ chỉ để đổi khoảng trắng. TypeScript bật strict, noUnusedLocals, noUnusedParameters. Dữ liệu ngoài ứng dụng nhận bằng unknown và kiểm schema trước khi dùng; không dùng any hoặc ts-ignore để né lỗi.

Component/type dùng PascalCase, hàm/biến camelCase; tên thời gian phải nêu đơn vị khi có thể nhầm. Giữ tên và ID tài nguyên cũ để không phá draft. Copy VI/EN tập trung tại i18n/dữ liệu, không hardcode trong engine. Giữ Unicode NFC và font hỗ trợ tiếng Việt.

## Trạng thái và nội dung

10 hoa chính tương ứng rose-01 đến rose-10; 20 ảnh tương ứng photo-01 đến photo-20. Hoa phụ không tương tác. Không ánh xạ lời chúc bằng thứ tự children hoặc random. State React bất biến, bộ ID đã xem không trùng; state machine của câu chuyện là nguồn quyết định phase.

Không side effect trong render. Effect có cleanup khi sở hữu timer/listener/request. Chặn kích hoạt lặp và callback cũ khi replay/reset. Khi trao hoa, một owner điều khiển bó hoa tại mỗi phase; đổi parent phải giữ world transform và khớp chuyển động tay.

## Engine và tài nguyên

Không cập nhật React state theo từng frame cho transform; dùng ref và useFrame. Tránh tạo Vector3, geometry, material trong vòng render khi tái sử dụng được. Camera chỉ có một nguồn ghi tại mỗi phase. Dispose theo ownership; không dispose cache GLTF dùng chung còn được tham chiếu.

Không hiển thị mô hình tạm rồi thay bằng mô hình thật: giữ overlay cho đến khi đủ tài nguyên và GPU sẵn sàng. Lỗi có retry/fallback rõ ràng. Giữ master Blender, recipe và texture nguồn ngoài public/dist. Script Blender chỉ sửa collection/tài nguyên thuộc phạm vi của nó, không xóa cả scene ngoài yêu cầu.

## HTML, CSS và khả năng truy cập

BEM: block__element--modifier, modifier đi cùng class gốc. Xem [CODE_STYLE.md](CODE_STYLE.md) cho cấu trúc CSS. Dùng button thật, accessible name cho nút icon, aria-expanded/pressed/selected đúng trạng thái. Popup quản focus, Escape và trả focus khi đóng.

Mobile không cắt CTA; vùng chạm mục tiêu 44 px. Dùng shared header, CSS token và StableText để hạn chế CLS khi đổi ngôn ngữ. Reduced motion áp dụng cho cả CSS và timeline. Không thay thế kiểm tra tương tác bằng kiểm tra tên class.

## Kiểm tra tự động và giới hạn

- npm run check:coding: kiểm ba cờ TypeScript bắt buộc, compiler và BEM/class mồ côi.
- npm run check: kiểm nội dung, model, bó hoa, rig và CSS hiện có.
- npm run check:standards: nhóm kiểm tra cục bộ đầy đủ gồm coding, dữ liệu/model, API/bảo mật, build và ngân sách bundle.
- npm run test:standards: kiểm các trường hợp đúng/sai của bộ kiểm tra bảo mật.

Checker không tự chứng minh accessibility, vẻ đẹp mô hình, logic hoạt ảnh hoặc định dạng toàn bộ file cũ. Thay đổi tương tác cần chạy QA trình duyệt liên quan: check:photobooth, scripts/check-language-layout.mjs, scripts/check-scene-loading.mjs. Không chạy đồng thời trên cùng tab CDP. Commit theo [type]detail; không đưa artifact QA vào Git.
