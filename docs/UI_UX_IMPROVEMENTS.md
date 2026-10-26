# Cải thiện CameraHub: hãng máy, ảnh và tài khoản

## Phạm vi và kết quả

Giữ React + TypeScript + Vite và Spring Boot hiện có. Giữ tên route, xác thực, quyền xem ảnh, luồng duyệt tin và giao dịch. Người dùng đã duyệt kế hoạch và cho phép API nhận hãng máy thay vì bắt buộc model. Không thay đổi cấu trúc database hoặc thêm migration.

## 1. Khảo sát và vấn đề UI/UX

Các trang chính: trang chủ, danh sách/chi tiết thiết bị, tư vấn, giỏ hàng, thanh toán, đơn hàng, đăng bán, thu mua, tài khoản/địa chỉ, đăng nhập/đăng ký, xác minh và quản trị. Component dùng chung gồm Header/Footer, Button, Input, ProductCard, ProductMedia, Modal, Badge, Skeleton và EmptyState.

| Ưu tiên | Vấn đề trước khi sửa | Kết quả |
| --- | --- | --- |
| Cao | Form bắt chọn hãng kèm model; API bắt buộc modelId | Chọn riêng hãng Canon, Fujifilm (Fuji), Sony… và loại thiết bị; tên dòng máy ghi trong tiêu đề |
| Cao | Kho thiết bị và giỏ hàng dùng hình minh họa dù có ảnh lưu | Dùng ProductMedia chung; ảnh thật hiển thị khi API trả về ảnh |
| Cao | Không xem trước ảnh, khó biết ảnh nào tải lỗi | Có thumbnail, ảnh bìa, số lượng, trạng thái từng ảnh và lỗi cụ thể |
| Cao | Upload một phần thất bại dễ mất thông tin hoặc tạo lại tin | Giữ ID tin đã tạo, chỉ thử lại ảnh chưa lưu trong biểu mẫu đang mở |
| Trung bình | Tài khoản ít phân cấp, kho thiết bị khó quản lý | Dashboard, menu, thông tin cá nhân, thống kê thật, tìm kiếm/lọc trạng thái, hộp xem ảnh |
| Trung bình | Màu/kích thước/control rải rác; chữ và vùng bấm nhỏ | Tokens chung, trạng thái nút, input báo lỗi tiếng Việt, vùng bấm chính tối thiểu 44px trên mobile |
| Trung bình | Menu mobile thiếu tìm kiếm và xử lý bàn phím | Thêm tìm kiếm, aria-controls/expanded, Escape đóng menu và trả focus |
| Thấp | Ảnh/card chưa có hình học thống nhất | Khung ảnh sản phẩm 4:3, tên tối đa hai dòng, fallback khi ảnh lỗi |

## 2. Các file sửa/thêm và lý do

Đường dẫn frontend bên dưới tương đối với `D:/CameraHub_Frontend`.

| File | Mục đích |
| --- | --- |
| `src/lib/marketplace.ts` | Đọc danh mục hãng từ API |
| `src/lib/listingPhotos.ts` (mới) | Kiểm tra file và upload multipart với CSRF, timeout và lỗi máy chủ |
| `src/lib/listingPhotos.test.ts` (mới) | Năm kiểm thử cho giới hạn file, multipart, CSRF và lỗi upload |
| `src/components/ListingForm.tsx` (tách mới) | Chọn hãng, lưu một lần, tiến trình và thử lại các ảnh còn thiếu |
| `src/components/PhotoPicker.tsx` (mới) | Xem trước, thêm/bỏ ảnh, số lượng và trạng thái |
| `src/components/listing-editor.css` (mới) | Bố cục form và ảnh responsive |
| `src/components/SellerPages.tsx` | Dùng form và kho thiết bị đã tách; giữ export/hành vi cũ |
| `src/components/ShoppingPages.tsx` | Giỏ hàng dùng ảnh thiết bị thật |
| `src/components/ProfilePage.tsx` | Kết nối dashboard mới, giữ các route hiện có |
| `src/components/ProfileContent.tsx` (mới) | Tổng quan tài khoản, số liệu từ API, menu, thông tin và địa chỉ |
| `src/components/MyListings.tsx` (tách mới) | Tìm/lọc kho cá nhân, ảnh, giá, trạng thái và gallery |
| `src/components/profile.css` (mới) | Dashboard desktop và điều hướng cuộn ngang trên mobile |
| `src/components/ui.tsx` | ProductMedia có fallback; Button loading/ghost; Input lỗi tại chỗ; card ảnh và giá gốc nếu có dữ liệu |
| `src/components/SiteLayout.tsx` | Tìm kiếm trong menu mobile và xử lý Escape/focus |
| `src/styles.css` | Palette, font/spacing/radius/shadow/touch tokens, focus/loading/error/reduced-motion |
| `src/prototype.css` | Loại màu token trùng và dùng radius chung |
| `src/marketplace.css` | Hình học ảnh, control dễ đọc, vùng bấm và responsive dùng chung |
| `docs/PROTOTYPE_MARKETPLACE.md` | Cập nhật trạng thái retry ảnh |
| `docs/UI_UX_IMPROVEMENTS.md` (mới) | Báo cáo và hướng dẫn kiểm tra này |

Backend, tương đối với `D:/CamerHub_Backend`:

| File | Mục đích |
| --- | --- |
| `src/main/java/vn/camerahub/marketplace/MarketplaceController.java` | GET hãng và request brandId/deviceType, giữ modelId cũ |
| `src/main/java/vn/camerahub/marketplace/MarketplaceService.java` | Xác thực hãng; dùng model chung cho hãng/loại khi chưa khai báo model |
| `src/main/java/vn/camerahub/marketplace/MarketplaceErrors.java` | Lỗi ảnh quá dung lượng dễ hiểu |
| `src/main/java/vn/camerahub/marketplace/ProductMediaController.java` | Ảnh hỏng trả lỗi 400 dễ hiểu |
| `src/test/java/vn/camerahub/marketplace/MarketplaceIT.java` | Kiểm tra hãng mới, tương thích model cũ và lựa chọn không hợp lệ |

## 3. API và dữ liệu

- `GET /api/public/brands` trả `{id, name}[]` từ danh mục đã cấu hình.
- `POST /api/marketplace/listings` nhận `brandId` cùng `deviceType` (`BODY`, `LENS`, `OTHER`), các trường thông tin khác giữ nguyên. Nếu thiếu deviceType, mặc định BODY.
- Client cũ tiếp tục gửi `modelId`. Chỉ được gửi một trong `brandId` hoặc `modelId`; hãng/model không tồn tại bị từ chối.
- Schema cũ yêu cầu products.model_id. Backend tạo/tái sử dụng model rõ tên `Chưa khai báo model` theo hãng/loại, không gán một dòng máy thật tùy ý. Model và tin cũ được giữ nguyên.
- Upload vẫn dùng endpoint cũ, tối đa 8 ảnh JPG/PNG, 5 MB và 24 megapixel mỗi ảnh. Ảnh chờ duyệt chỉ chủ sở hữu và Admin được xem. Quyền đọc ảnh công khai không được mở rộng.
- Không tạo số sao, số đã bán, bảo hành hoặc giảm giá giả. Giá gốc chỉ hiện khi presentation chứa giá gốc hợp lệ lớn hơn giá hiện tại.

## 4. Kiểm tra đã thực hiện

- `npm.cmd run build`: thành công, TypeScript và production bundle.
- `npm.cmd test`: **33/33** kiểm thử, 7 file.
- Backend `scripts/Invoke-Backend.ps1 Integration`: **26/26** (8 unit + 18 integration), không lỗi/skip. Bao gồm schema, session/quyền, giao dịch và ảnh. Fixture integration rollback.
- Repo chưa cấu hình lệnh lint/ESLint, vì vậy không báo đã chạy lint.
- Kiểm tra trình duyệt tại **360, 768, 1024, 1440px**: tổng quan tài khoản, kho thiết bị, form đăng bán và danh sách sản phẩm đều có document.scrollWidth bằng clientWidth (345/753/1009/1425, phần chênh 15px là thanh cuộn). Sidebar mobile không đè nội dung.
- Chọn ảnh JPG từ thiết bị: thumbnail tải thành công với naturalWidth 512; bỏ ảnh đưa số preview về 0. Không gửi tin thử vào dữ liệu đang dùng.
- Dropdown chỉ có hãng; lỗi tiêu đề trống hiển thị tiếng Việt; tìm Canon trong kho lọc đúng; mở trạng thái chưa có ảnh; Escape đóng dialog/menu và menu trả focus về nút mở.
- Không ghi nhận console error trong phiên QA cuối.
- Tương phản các token chữ trên nền trắng: primary 15.65:1, accent 6.30:1, muted 5.71:1, success 7.10:1, warning 5.76:1, error 6.94:1. Các cặp này đạt AA cho chữ thường; đây không phải chứng nhận accessibility toàn website.
- Ảnh QA cục bộ (không commit): `.local/qa/profile-desktop.jpg`, `inventory-mobile.jpg`, `listing-form-desktop.jpg`, `listing-form-mobile.jpg`.

## 5. Commit theo nhóm

| Nhóm | Repository | Commit |
| --- | --- | --- |
| Chọn hãng và ảnh | Backend | `9a1ec71` |
| Chọn hãng và ảnh | Frontend | `1fdf9b7` |
| Trang tài khoản/kho thiết bị | Frontend | `e53a1b8` |
| Tokens, accessibility và responsive | Frontend | Commit chứa báo cáo này |

Hai commit baseline trước đó chỉ ghi nhận mã nguồn dự án chưa được Git theo dõi để các nhóm sửa có diff rõ ràng: frontend `b6d5cb1`, backend `6f0ab01`. Không đưa `.env`, dữ liệu ảnh hoặc tài liệu backend chưa được theo dõi vào các commit sửa.

## 6. Chạy và kiểm tra lại

Backend, PowerShell tại `D:/CamerHub_Backend`:

```powershell
$env:SERVER_PORT='8081'
.\scripts\Invoke-Backend.ps1 Run
```

Frontend, PowerShell tại `D:/CameraHub_Frontend`:

```powershell
npm.cmd run dev
```

Phiên hiện tại dùng file `.env.local` bị Git bỏ qua với `CAMERAHUB_API_URL=http://127.0.0.1:8081` vì backend IntelliJ đang chiếm 8080. Giữ backend 8081 và Vite 5173 hoạt động; không khởi chạy thêm bản trùng cổng. Nếu đổi API URL phải khởi động lại Vite.

Mở `http://127.0.0.1:5173/tai-khoan` hoặc `/dang-ban`. Đăng nhập bằng tài khoản thường, không cần xác minh người bán, để thử form; chọn hãng, thêm ảnh và xem trước. Khi gửi tin thật, tin sẽ chờ Admin duyệt; kiểm tra ảnh trong tab Thiết bị của tôi trước và sau khi duyệt. Kiểm tra ảnh công khai ở chi tiết sản phẩm và giỏ hàng sau khi duyệt.

Chạy lại kiểm thử bằng `npm.cmd test`, `npm.cmd run build` và `.\scripts\Invoke-Backend.ps1 Integration` ở đúng repository.

## 7. Giới hạn và bước tiếp theo

- Tin cũ chưa lưu ảnh vẫn hiện minh họa có nhãn. Không thể tự khôi phục file chưa từng được upload thành công.
- Retry ảnh giữ trạng thái trong form đang mở. Refresh/đóng trang mất File đang chọn của trình duyệt. Chưa thêm flow sửa tin cũ, upload bổ sung sau khi rời form hoặc gửi lại tin cần bổ sung.
- Chưa thêm endpoint thay avatar/chỉnh thông tin cá nhân vì ngoài ba nhóm đã duyệt; dashboard hiển thị dữ liệu tài khoản thật.
- Thanh toán/vận chuyển vẫn mô phỏng; đánh giá/số bán cần dữ liệu và API thật. Các tích hợp ngoài và logic giao dịch hiện có giữ nguyên.
- Có thể tiếp tục chuẩn hóa các trang khác theo tokens; phần triển khai lần này tập trung đăng bán, ảnh và tài khoản để giữ thay đổi dễ review.
