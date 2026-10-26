# Frontend trên Vercel, backend trên Render

`vercel.json` phục vụ Vite từ `dist`, chuyển `/api/*` tới
`https://camerhub-backend.onrender.com/api/*` và xử lý đường dẫn React bằng `index.html`.
Frontend tiếp tục gọi API tương đối; cookie đăng nhập và CSRF đi qua cùng origin.
Không đưa khóa JWT, SERVICE_INTERNAL_KEY, OpenAI key hoặc mật khẩu database vào frontend.

## Triển khai

1. Commit và push `vercel.json` cùng mã frontend lên GitHub, vào nhánh sẽ triển khai.
2. Vercel → Add New Project → import `CameraHubProject/CameraHub_Frontend`.
3. Chọn Framework Preset **Vite**, Root Directory **.**, Build Command **npm run build**,
   Output Directory **dist**, Install Command **npm ci**, Node.js **22.x**.
4. Deploy và dùng hostname Vercel cấp. Cấu hình hiện tại không yêu cầu biến `VITE_API_URL`.
5. Kiểm tra `/`, tải lại `/tai-khoan`, và gọi `/api/health` trên hostname Vercel.
6. Kiểm tra đăng ký/đăng nhập, sửa hồ sơ và tải ảnh sau khi các backend nghiệp vụ sẵn sàng.

Gateway báo `UP` chỉ xác nhận Gateway đang chạy. Dự án cần Identity, Marketplace,
Moderation, Commerce và Advisor chạy riêng, với database phù hợp và cùng khóa nội bộ.
Gateway cần các biến IDENTITY_URL, MARKETPLACE_URL, MODERATION_URL, COMMERCE_URL,
ADVISOR_URL trỏ đến các service đã triển khai; địa chỉ 127.0.0.1 của môi trường local
không dùng để kết nối giữa các service Render.

Khi dùng Google login, đặt FRONTEND_URL của Identity thành origin HTTPS Vercel thực tế.
Đăng ký redirect `https://<hostname-vercel>/api/auth/google/callback` trong Google OAuth.
Nếu đổi tên miền, cập nhật cả hai cấu hình. Giữ SESSION_COOKIE_SECURE=true trên production.

Nếu đổi hostname Gateway, sửa destination của quy tắc `/api/:path*` trong `vercel.json`
rồi deploy lại frontend. Không đổi quy tắc đó thành địa chỉ một service nghiệp vụ riêng.
