# Tài liệu Rose Wishes / Documentation

[README dự án · Tiếng Việt / English](../README.md)

## Quy ước

- Tên tài liệu dùng kebab-case; README.md dành cho điểm vào thư mục.
- Mô tả tính năng hiện hành tách khỏi quy chuẩn và số liệu/báo cáo lịch sử.
- Liên kết dùng đường dẫn tương đối; khi đổi tên phải sửa cả tài liệu và checker đang đọc tệp.
- README tổng có tiếng Việt và tiếng Anh. Tài liệu chuyên sâu hiện dùng tiếng Việt.
- Không coi kết quả checker tĩnh là bằng chứng về FPS máy thật, chất lượng mỹ thuật hoặc cấu hình hosting.

## Sản phẩm và tích hợp

| Tài liệu | Phạm vi |
| --- | --- |
| [product-spec.md](product-spec.md) | Câu chuyện, 10 hoa/10 lời chúc và tiêu chí kiểm nhận |
| [photobooth-spec.md](photobooth-spec.md) | 20 ảnh, 16 bố cục, 8 phong cách, crop và xuất PNG |
| [content-api.md](content-api.md) | Biến môi trường, hợp đồng JSON và dự phòng |
| [languages.md](languages.md) | VI/EN, dropdown, font và ổn định bố cục |

## Kiến trúc và thiết kế 3D

| Tài liệu | Phạm vi |
| --- | --- |
| [architecture.md](architecture.md) | Module, state machine, trao hoa, storage và QA |
| [scene-loading.md](scene-loading.md) | Preload, chuẩn bị GPU, gating, fallback và retry |
| [scene-design.md](scene-design.md) | Nhà, sân, cây, rào, sông, cầu và rừng |
| [framing-and-lighting.md](framing-and-lighting.md) | Camera, responsive, ánh sáng và ngày/đêm |
| [model-design.md](model-design.md) | Hoa, vật liệu, nhân vật, rig và mức chi tiết |
| [female-character.md](female-character.md) | Nhân vật nữ, tóc, rig và xuất asset |
| [local-3d-tools.md](local-3d-tools.md) | Công cụ Blender/MCP và quy trình cục bộ |

## Tiêu chuẩn và bảo trì

| Tài liệu | Phạm vi |
| --- | --- |
| [coding-standards.md](coding-standards.md) | Quy tắc code, engine, UI và phạm vi checker |
| [code-style.md](code-style.md) | Hướng dẫn BEM/CSS chi tiết, bổ sung cho coding standards |
| [performance-standards.md](performance-standards.md) | Ngân sách build, runtime và cách đo máy thật |
| [security-standards.md](security-standards.md) | API/URL, storage, artifact, dependency và hosting |
| [project-cleanup.md](project-cleanup.md) | Tệp phải giữ, cache và cách dọn an toàn |

## Số liệu và lịch sử

- [performance-history.md](performance-history.md): số đo và thay đổi của đợt tối ưu; không thay cho ngân sách hiện hành.
- [cleanup-report.json](cleanup-report.json): báo cáo dọn cũ, không phải thống kê dung lượng hiện tại. Giữ nguyên nội dung lịch sử.

## Hướng dẫn tài nguyên nguồn

[Bó hoa](../art/bouquet/README.md) · [Nhân vật](../art/characters/README.md) · [Ảnh](../art/photos/originals/README.md) · [Branding](../art/branding/README.md) · [Nguồn và giấy phép](../public/models/LICENSES.md)
