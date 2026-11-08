# Quản lý tài nguyên và lịch sử dọn dự án

[Tài liệu dự án](README.md) · [README · VI/EN](../README.md)

## 1. Nguyên tắc

Chỉ loại bỏ tài sản sau khi kiểm tra import từ main.tsx, URL từ sceneAssets.ts và các script dựng lại. Không coi mọi phiên bản mô hình là thừa: story/high/balanced có vai trò khác nhau, còn .blend là nguồn chỉnh sửa.

Website không dùng nhân vật/hoa thủ tục để thay tạm khi GLB tải. ScenePending trả null, Canvas ẩn và UI khóa đến khi sẵn sàng. SVG chỉ cho thiết bị không WebGL2.

## 2. Những gì phải giữ

| Nhóm | Lý do |
| --- | --- |
| src/, index.html, config và lockfile | Mã ứng dụng và môi trường build |
| public/models/ và metadata/giấy phép | GLB đang dùng, nguồn, checksum |
| art/bouquet/rose-wishes-natural.blend | Bó 10 hoa hiện hành |
| art/bouquet/rose-wishes-bouquet.blend | Thư viện asset-master dùng bởi recipe |
| Hai master .blend nhân vật | Chỉnh sửa rig, trang phục, tóc |
| Texture nguồn, recipe và packer | Tái tạo asset không phụ thuộc bản cache |
| scripts/check-*.mjs | Kiểm chứng còn sử dụng |
| Tài liệu và cleanup-report.json | Bàn giao và lịch sử |

Hiện có 22 GLB: 15 hoa, 4 accessories/fillers, 2 nhân vật và 1 chậu. Một phiên chọn 17 URL. Kiểm tra số lượng bằng sceneAssets.ts/check-models thay vì xóa theo tên trông giống nhau.

## 3. Cache có thể tạo lại

node_modules/ tạo từ npm install; dist/ từ build. .qa/ chứa xuất thô GLB và ảnh kiểm tra; .preview-profile/ là profile QA Chrome. Python bytecode, .blend1 và tsbuildinfo là sản phẩm phụ; .gitignore đã loại các nhóm này.

Packer có thể cần .qa/bouquet/raw hoặc .qa/characters dù frontend không cần. Xóa cache không làm web hỏng nếu public/models đủ, nhưng phải xuất lại trước khi pack.

Đóng QA Chrome trước khi xóa profile. Xác nhận đường dẫn tuyệt đối nằm trong workspace trước khi xóa thư mục. Không xóa profile Chrome cá nhân, master .blend hoặc metadata chỉ vì chúng không được frontend import.

## 4. Lịch sử dọn ngày 01/11/2026

Đã bỏ ProceduralPerson.tsx, DaySky.tsx không dùng; GLB Sam/Maya và hoa tải đời cũ; recipe cũ; backup trước chỉnh; cache, preview và build cũ. Sau đó tạo lại build hiện hành.

Báo cáo máy đọc nằm tại [cleanup-report.json](cleanup-report.json): 1.703 tệp, 2.108.791.435 byte được ghi nhận ở lượt dọn đó. Đây là số lịch sử, **không phải dung lượng dự án hiện tại** hoặc lượng sẽ xóa ở lần sau. Không viết lại báo cáo lịch sử khi chỉ cập nhật tài liệu.

## 5. Kiểm tra khi dọn tiếp

Chạy build/check, đối chiếu required assets và import reachability. Thử tải chậm/lỗi, story→studio và fallback. Không tự suy từ “không có URL runtime” rằng bản nguồn Blender có thể bỏ.

Các vấn đề đã sửa cùng đợt trước gồm shader warm-up treo do StrictMode dọn material; chi tiết hiện tại ở scene-loading.md. Dọn tài nguyên và sửa tải là hai việc riêng, không phải xóa file sẽ tự giải quyết tải lỗi.

