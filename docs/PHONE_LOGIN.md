# Đăng nhập bằng số điện thoại

## Thay đổi

- Trang đăng nhập dùng ô **Số điện thoại hoặc email**, nhập số di động Việt Nam và mật khẩu CameraHub. Không dùng input type=email để trình duyệt chấp nhận số điện thoại.
- Trang đăng ký bằng email/mật khẩu yêu cầu số điện thoại; mỗi số hợp lệ chỉ gắn với một tài khoản. Email vẫn được giữ cho tài khoản và liên kết Google.
- `0912345678`, `0912 345 678`, `84912345678` và `+84 912 345 678` được quy về cùng khóa `+84912345678`. Hỗ trợ nhóm số di động Việt Nam đầu 03/05/07/08/09.
- Tài khoản cũ chưa có điện thoại tiếp tục dùng email; chưa thêm màn cập nhật số cho tài khoản cũ trong thay đổi này. Tài khoản Google tiếp tục hoạt động và không bị bắt nhập số trong luồng OAuth.
- Đây là **số điện thoại + mật khẩu**, chưa có SMS OTP hay xác minh quyền sở hữu số. Ràng buộc một số/một tài khoản không đồng nghĩa xác minh một người chỉ có một tài khoản.

## API và database

Giữ `POST /api/auth/login`, tham số form cũ `email` nay nhận email **hoặc số điện thoại**; mật khẩu và CSRF không đổi. `POST /api/auth/register` yêu cầu phone với số di động hợp lệ; trùng số/email trả 409, định dạng sai/thiếu trả 400. Không tìm tài khoản bằng số mơ hồ hoặc chuỗi không hợp lệ.

Migration `D:/CamerHub_Backend/src/main/resources/db/migration/V4__unique_login_phone.sql` thêm hàm chuẩn hóa và unique index trên số đã chuẩn hóa. Không thêm bảng/cột, không sửa V1–V3, không ghi đè số cũ hoặc gộp/xóa tài khoản. Unique index chặn trùng cả khi có nhiều thao tác ghi đồng thời. Trước migration đã kiểm tra dữ liệu: 0 số đã cung cấp, 0 nhóm trùng, nên không cần xử lý bản ghi cũ.

File backend: `identity/PhoneNumber.java` (mới), `AccountService.java`, `IdentityController.java`, `IdentityErrors.java`, `config/SecurityConfiguration.java`, migration V4, `identity/PhoneNumberTest.java` (mới) và `identity/IdentityIT.java`. File frontend: `AccountPages.tsx`, `identity.ts`, `identity.test.ts` và tài liệu này.

## Kiểm tra lại

```powershell
# D:/CameraHub_Frontend
npm.cmd test
npm.cmd run build

# D:/CamerHub_Backend
.\scripts\Invoke-Backend.ps1 Integration
```

Frontend: build thành công, 37 kiểm thử đạt. Trình duyệt: ô đăng nhập chấp nhận số có khoảng trắng; không tràn ngang ở 360/768/1024/1440px. Ảnh kiểm tra: `.local/qa/phone-login-desktop.jpg` (không commit).

Backend: **37 kiểm thử đạt** (10 unit + 27 integration). Kiểm thử chuẩn hóa số nội địa/+84/84/cách viết thông dụng; loại số thiếu, sai và chuỗi chèn SQL; đăng nhập bằng các dạng số và email đều về cùng user ID; mật khẩu sai/thiếu CSRF/tài khoản bị khóa bị chặn; trùng số khác email bị 409; tài khoản email cũ và Google vẫn hoạt động. Fixture thử nghiệm rollback, không tạo tài khoản hoặc số điện thoại thử còn lưu.

Phiên local tiếp tục dùng frontend `http://127.0.0.1:5173` và backend 8081. Mở `/dang-nhap` hoặc `/dang-ky` để kiểm tra. Backend đọc `.env` riêng; không thay thông tin Google hoặc đưa secret vào mã nguồn.
