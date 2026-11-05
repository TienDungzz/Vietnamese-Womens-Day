# Quy ước giao diện và rà soát mã dư

## Class BEM

- Block độc lập: `app`, `site-header`, `brand`, `language-select`, `theme-toggle`, `sound-toggle`, `wish-card`, `photobooth`, `photo-editor`, `photo-stack`, `stable-text`, `scene-loading`.
- Element: `block__element`, ví dụ `site-header__actions`, `photobooth__slot`, `photo-editor__done`.
- Modifier: `block--modifier` hoặc `block__element--modifier`, luôn đi cùng class gốc khi render. Ví dụ `app app--story`, `rose-picker__button rose-picker__button--seen`.
- Thành phần dùng chung có thể kết hợp block, ví dụ `button button--text app__skip-intro`.
- Dùng `aria-expanded`, `aria-pressed`, `aria-selected` và các thuộc tính `data-*` cho trạng thái tương tác. Không tạo class trạng thái chung như `active`, `seen`.
- ID phục vụ ARIA, danh mục frame và dữ liệu API không phụ thuộc tên class CSS.

`global.css` chứa reset, theme, bố cục chính và các block dùng chung. `photobooth.css` chứa photobooth và popup chỉnh ảnh, tải cùng module ghép ảnh. `photo-stack.css` chứa xấp ảnh và vùng bấm, tải sớm cùng fallback để không lệch khung trước khi mở photobooth. CSS được trình bày theo từng rule/declaration; các media query cùng điều kiện được gom lại, reduced motion đặt cuối.

## Phần đã dọn

- Bỏ tên VI/EN trong dữ liệu bố cục vì UI chỉ dùng số ảnh và sơ đồ; giữ ID, kích thước và hình học của cả 12 bố cục.
- Bỏ 4 nhãn dịch thuộc nội dung/nút đã loại khỏi UI.
- Bỏ tham số callback không dùng ở cây cảnh.
- Bỏ class CSS mồ côi và các khai báo bị ghi đè; gom media query trùng lặp, loại màu cảnh cũ đã được theme ngày/đêm thay thế.
- Bỏ alias đóng photobooth riêng trong header; dùng chung `site-header__close`.
- Cập nhật selector của các script QA theo tên BEM.

Không xóa nguồn Blender, texture, recipe xuất mô hình hoặc tài liệu nguồn: chúng phục vụ chỉnh sửa và tái tạo tài sản, dù không nằm trong bundle web.

## Kiểm tra

```sh
npm run build
npm run check
npm run check:styles
npm run check:api
npm run check:photobooth
```

TypeScript bật `noUnusedLocals` và `noUnusedParameters`. `check:styles` đọc JSX bằng TypeScript và CSS bằng PostCSS, kiểm tên BEM và phát hiện class CSS không xuất hiện trong JSX; kiểm tra này nằm trong `npm run check`.

Các script kiểm tra giao diện bằng trình duyệt cần Vite ở cổng 5173 và Chrome QA với CDP ở cổng 9222. Không chạy nhiều script trình duyệt đồng thời trên cùng tab. Kiểm tra CSS mồ côi không thay thế kiểm tra tương tác, bố cục và trạng thái ngày/đêm trong trình duyệt.

Riêng `check-content-api-browser.mjs` cần Vite QA với `VITE_CONTENT_API_URL=http://127.0.0.1:8792/content`. Script tự chạy API thử nghiệm ở 8792; frontend mặc định 5174, có thể đổi bằng `CONTENT_API_QA_URL` nếu cổng đó thuộc dự án khác. Không ghi cấu hình QA vào `.env.local` của người dùng.
