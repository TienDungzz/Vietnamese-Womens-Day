# Ngôn ngữ, dropdown và ổn định bố cục

## 1. Phạm vi

Website có **Tiếng Việt (VI)** và **English (EN)**. Tiếng Việt là mặc định; localStorage rose-language lưu lựa chọn. Đổi ngôn ngữ cập nhật giao diện, lời chúc, aria-label, title trang, meta description và html lang mà không khởi động lại câu chuyện, xóa tiến độ hay đổi hoa đang chọn.

Chế độ ngày/đêm và âm thanh là lựa chọn độc lập. Không suy ngôn ngữ từ vị trí địa lý và không gọi API dịch khi chạy.

## 2. Dữ liệu và thành phần

| Tệp | Vai trò |
| --- | --- |
| src/i18n.tsx | LanguageProvider, useLanguage, translate và bảng messages |
| src/data/wishes.ts | Lời chúc tiếng Việt gốc |
| src/data/wishes.en.ts | Title/text tiếng Anh theo ID |
| src/components/LanguageSelect.tsx | Dropdown tùy chỉnh |
| src/components/StableText.tsx | Hai bản dịch chung kích thước |
| src/styles/global.css | Grid dự trữ không gian, menu và responsive |

Khóa thông điệp hiện là câu tiếng Việt, được TypeScript kiểm tra qua Message. Tham số như {count}, {number}, {title}, {seen} được thay bằng values.

```tsx
const {t}=useLanguage();
const label=t('Chọn một trong {count} bông hoa',{count:10});
```

Dùng t cho thuộc tính aria-label/alt/title. Với chữ hiển thị, ưu tiên TranslatedText để giữ bố cục.

## 3. Dropdown

Nút dạng pill có mã VI/EN, icon địa cầu trên desktop và chevron. Menu mở bên dưới, nền theo theme, có tên ngôn ngữ đầy đủ và dấu chọn. Mobile thu gọn nút và ẩn địa cầu; không dùng native select.

Button khai báo aria-haspopup=listbox, aria-expanded và aria-controls. Menu/option có role và aria-selected; option có lang tương ứng.
- Enter/Space hoặc click nút mở.
- Mũi tên, Home/End di chuyển.
- V/T chọn focus tiếng Việt, E chọn focus English.
- Enter/Space xác nhận; Escape đóng và trả focus nút.
- Tab hoặc bấm ngoài đóng menu.
- Chọn một option cập nhật ngôn ngữ rồi trả focus về trigger.

Các thao tác này không tự kích hoạt bước đi trong cảnh 3D.

## 4. Hạn chế xê dịch VI/EN

StableText nhận content gồm vi/en, đặt hai span vào cùng ô Grid. Cả hai được tính kích thước; bản không chọn dùng visibility:hidden và aria-hidden=true, không được đọc hoặc chọn. Vì vùng lấy theo bản lớn hơn ở chiều rộng hiện hành, chuyển ngôn ngữ không làm các thành phần phía sau bị đẩy.

TranslatedText xây content từ Message/values. StableHeading giữ cả bố cục tiêu đề nhiều dòng. Nội dung thiệp dùng title/text của cùng ID ở cả hai ngôn ngữ. Header giữ kích thước nút ổn định; thiệp có scrollbar-gutter:stable.

```tsx
<TranslatedText message="Trở lại bó hoa"/>
<StableText content={{vi:'Nội dung tiếng Việt',en:'English content'}}/>
```

Bản ngắn có thể chừa khoảng trống theo bản dài. Không cắt chữ và không giảm font tự động để ép nội dung. Tránh dùng selector span quá rộng cho thành phần cha: các span nội bộ của StableText không phải đường kẻ trang trí.

Đo hình học đã kiểm tra 360/800/1440px, header, intro, stage, tools và 10 thiệp. Kết quả 0px trong lần kiểm tra không phải tuyên bố điểm CLS toàn trang luôn bằng 0: font, mạng và nội dung tương lai có thể tạo thay đổi khác.

## 5. Sửa nội dung hoặc thêm ngôn ngữ

1. Sửa câu VI và bản EN trong messages nếu là UI.
2. Với thiệp, sửa wishes.ts và wishes.en.ts cùng ID; cập nhật bảng đặc tả.
3. Dùng TranslatedText cho text hiển thị và t cho thuộc tính.
4. Nếu thêm ngôn ngữ, mở rộng Language, messages, dữ liệu thiệp, reader localStorage, options dropdown và danh sách/lớp content của StableText.
5. Kiểm tra các nội dung dài, focus và mobile.

## 6. Kiểm tra

```sh
npm run build
node scripts/check-language.mjs
node scripts/check-language-layout.mjs
```

Hai script trình duyệt cần dev 5173/CDP 9222 và dùng chế độ không WebGL. Script thứ nhất kiểm tra bản dịch, lưu lựa chọn, metadata và keyboard; script thứ hai so tọa độ/kích thước VI/EN ở ba chiều rộng và 10 thiệp. Đây không thay thế QA 3D.

