# Logo và favicon

logo-source.png là bản tách nền trong suốt bằng imagegen từ ảnh logo người dùng cung cấp: chân dung nữ nhìn sang phải và nhánh lá màu hồng. Đây là bản xử lý từ ảnh tham chiếu, không phải file vector gốc. Giữ bản nguồn để tái xuất kích thước web.

Chạy `node scripts/prepare-branding.mjs` từ thư mục gốc để tạo:

- public/images/logo.png: 128×128, nền trong suốt, dùng trên header.
- public/favicon-16x16.png và favicon-32x32.png: biểu tượng tab trình duyệt.
- public/favicon.ico: các mức 16/32/48px.
- public/apple-touch-icon.png: 180×180, nền kem cho biểu tượng thiết bị Apple.

Liên kết favicon nằm trong index.html, kích thước hiển thị logo nằm trong global.css và thuộc tính img. Khi thay ảnh, xuất lại bộ kích thước và cập nhật query version của favicon để hạn chế cache cũ. Hình trên header có alt rỗng vì liên kết thương hiệu đã có aria-label theo ngôn ngữ.
