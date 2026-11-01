# Công cụ 3D cục bộ và quy trình Blender

## 1. Vai trò

Blender chỉnh hình học, vật liệu, UV, trọng số và hoạt ảnh; MCP cho phép công cụ điều khiển phiên Blender đang mở. Node.js đóng gói GLB cho web. Chạy website/build không yêu cầu Blender hoặc MCP.

Nhà, cây, sông, cầu, rào và xích đu hiện được dựng trong src/scenes/, nên sửa chúng bằng mã. Bó hoa và nhân vật dùng master Blender. Không cần tải một mô hình mới cho mọi thay đổi trang trí.

## 2. Bản cài đã được ghi nhận

Lượt cài/kiểm tra ngày **31/10/2026** ghi nhận:
- Blender 4.5.15 LTS portable, đã đối chiếu SHA-256.
- uv 0.13.6, Python 3.11.18 do uv quản lý.
- MCP for Blender 2.2.6, add-on 1.8, protocol 15.
- Kết nối tên blender, bridge tại 127.0.0.1:9876.

Đây là thông tin lần cài trước, không phải kết quả dò lại phiên đang chạy hoặc khẳng định phiên bản mới nhất.

## 3. Vị trí trên máy phát triển

| Thành phần | Đường dẫn |
| --- | --- |
| Blender | %LOCALAPPDATA%\Programs\RoseWishes3D\blender-4.5.15-windows-x64\ |
| uv | %LOCALAPPDATA%\Programs\RoseWishes3D\uv\ |
| MCP executable | %USERPROFILE%\.local\bin\mcp-for-blender.exe |
| Python MCP | %APPDATA%\uv\tools\mcp-for-blender\ |
| Add-on | %APPDATA%\Blender Foundation\Blender\4.5\scripts\addons\blender_mcp.py |
| Preferences | %APPDATA%\Blender Foundation\Blender\4.5\config\userpref.blend |
| Cấu hình client | %USERPROFILE%\.codex\config.toml |

Cấu hình được ghi nhận dùng executable tuyệt đối, PYTHONUTF8=1; có backup config.blender-backup-*.toml bên cạnh cấu hình. Không có Windows service riêng, không tự mở Blender khi đăng nhập.

## 4. Bắt đầu phiên

1. Mở shortcut **Blender (Rose Wishes)** đã tạo trong Start Menu.
2. Giữ Blender mở. Nếu bridge chưa hoạt động, vào sidebar **MCP for Blender**, chọn Start MCP Server.
3. Mở đúng master và kiểm tra scene đang active trước khi chạy recipe.
4. Đọc scene/objects trước khi chỉnh; không xóa toàn bộ scene mặc định nếu người dùng còn công việc chưa lưu.
5. Nếu client chưa thấy tool Blender, kiểm tra bridge, đường dẫn cấu hình và nạp lại client.

Shortcut đã được cấu hình bật Poly Haven cho scene; nếu mở Blender trực tiếp, có thể cần bật trong sidebar. Chưa cấu hình dịch vụ tạo model trả phí Meshy/Tripo hoặc tài khoản Sketchfab/Poly Pizza. Không coi việc có MCP là đã kết nối mọi dịch vụ này.

## 5. Chỉnh tài sản đúng nhóm

| Muốn chỉnh | Nguồn | Quy trình |
| --- | --- | --- |
| Cánh/kiểu hoa | rose-wishes-bouquet.blend | build_bouquet → export raw → pack |
| Vị trí 10 hoa | bouquet-layout.json + rose-wishes-natural.blend | arrange_bouquet → accessories/fillers → story |
| Nam | male-cardigan.blend | Export đúng rig/mesh → pack-male |
| Nữ | female-grey-jeans.blend | build_female hoặc tóc riêng → finalize-female |
| Cảnh nhà/vườn | src/scenes/ | Sửa TSX, build và kiểm tra camera |

Chi tiết thao tác nằm trong art/bouquet/README.md và art/characters/README.md. Recipe Blender có context và scene names riêng; không chạy các hàm rời thiếu bước khởi tạo rồi coi output là master hợp lệ.

## 6. Xuất và kiểm tra

Blender dùng Z-up, web dùng Y-up. Builder bó hoa có W(x,y,z) = (x,−z,y); glTF export đổi lại hệ phù hợp. Không bù trục hai lần.

Giữ origin/scale, rig, clip và vật liệu; export selection/active scene đúng để tránh lẫn mô hình khác. Asset thô đi qua packer để nhúng texture, Meshopt và metadata. Sau đó kiểm tra GLB, cập nhật URL version nếu cần và chạy story thực tế.

Giữ master trước khi dọn .qa/. Các script có thể tạo bản stage; kiểm tra trước khi thay master hiện hành.

## 7. Nguồn tham khảo của bản cài

- [Blender 4.5](https://download.blender.org/release/Blender4.5/)
- [MCP for Blender](https://github.com/ahujasid/mcp-for-blender)
- [uv](https://github.com/astral-sh/uv)

Các liên kết ghi lại nguồn công cụ; không có bước tải/cài mới được thực hiện chỉ vì tài liệu này được cập nhật.

