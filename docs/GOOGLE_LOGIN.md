# Đăng nhập/đăng ký Google

- `/dang-nhap`: nút **Đăng nhập bằng Google**.
- `/dang-ky`: nút **Đăng ký bằng Google**. Lần đầu tạo tài khoản, lần sau đăng nhập; không yêu cầu tạo mật khẩu CameraHub cho tài khoản Google mới.
- Email đã có tài khoản cũ phải nhập mật khẩu CameraHub để liên kết. Không nhận email/Google sub do trình duyệt tự khai báo để tạo phiên.
- Có trạng thái loading/config chưa bật/lỗi/hủy/phiên liên kết hết hạn. Nút Google cao 48px; đã kiểm tra không tràn ngang ở 360/768/1024/1440px.
- Không có client secret hoặc Google token trong frontend/localStorage. Các API đi qua `/api` cùng origin và giữ CSRF/session hiện có.

## File

- `src/components/AccountPages.tsx`: nút Google, thông báo, form xác nhận liên kết và điều hướng tài khoản.
- `src/lib/identity.ts`: status, xác nhận liên kết qua CSRF, thông báo tiếng Việt cố định.
- `src/lib/identity.test.ts`: thêm ba kiểm thử status, payload liên kết và không phản chiếu error tùy ý.
- `src/marketplace.css`: nút Google, divider, thông báo và panel liên kết dùng tokens chung.

`npm.cmd run build` và `npm.cmd test` thành công: **36 kiểm thử**. Backend đạt **32 kiểm thử**, gồm 6 kiểm thử Google qua authorization-code/OIDC với local provider và JWT ký số; không thay thế kiểm tra với Google thật.

## Cấu hình Google Cloud và kết quả

Đã kiểm tra chuyển tới Google thật. Sau khi người dùng thêm callback trong Google Auth Platform → Clients → Web OAuth client → **Authorized redirect URIs**, Google đã hiển thị **Sign in to continue to CameraHub**, không còn lỗi redirect_uri_mismatch. Callback đang dùng:

```text
http://127.0.0.1:5173/api/auth/google/callback
```

Đọc `D:/CamerHub_Backend/docs/GOOGLE_LOGIN.md` để xem cấu hình biến môi trường, migration V3 và luồng bảo mật. Thông tin người dùng cung cấp đã lưu ở `.env` backend bị Git bỏ qua; không cần đưa gì vào `VITE_*`.

Phiên local: frontend 5173 (`npm.cmd run dev`), backend 8081 (`$env:SERVER_PORT='8081'; .\scripts\Invoke-Backend.ps1 Run`). `.env.local` frontend dùng `CAMERAHUB_API_URL=http://127.0.0.1:8081`; giữ nguyên proxy `/api`. Mở web bằng `127.0.0.1` để thử nút Google. Việc nhập/chọn tài khoản Google thật cần do người dùng thực hiện; chưa kiểm tra token exchange bằng Google thật.

Ảnh kiểm tra local, không commit: `.local/qa/google-login-desktop.jpg`, `.local/qa/google-register-mobile.jpg`, `.local/qa/google-redirect-mismatch.jpg`.
