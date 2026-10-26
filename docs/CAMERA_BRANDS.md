# CameraHub: hãng máy ảnh

## Thay đổi

- Thanh điều hướng: `Đăng bán máy ảnh` dẫn đến `/dang-ban`.
- Form đăng bán: 35 lựa chọn theo đúng thứ tự yêu cầu, `Khác` ở cuối. Chọn `Khác` phải nhập tên cụ thể, tối đa 100 ký tự. Lỗi hiển thị bằng tiếng Việt.
- Kho thiết bị: `Sửa hãng máy` dùng lại cùng component, tự chọn lại hãng hiện tại; hãng tùy chỉnh hiện trong ô `Tên hãng máy khác`.
- Sửa sang hãng khác gửi tin về trạng thái chờ duyệt; giữ nguyên ảnh, giá, mô tả, sê-ri và tin đăng khác. Giữ nguyên hãng thì giữ nguyên model/trạng thái.
- Thiết bị đã đặt mua, đã bán hoặc có hồ sơ kiểm định không được tự đổi hãng, để bảo toàn thông tin giao dịch/kiểm định.

## Cấu trúc và API

Marketplace hiện dùng DTO record trong `MarketplaceController` và `JdbcTemplate` trong `MarketplaceService`; không có Entity/Repository JPA riêng cho sản phẩm/hãng.

Giữ nguyên cấu trúc database: `products.model_id → camera_models.brand_id → brands.name`. Chỉ thêm hãng vào bảng hiện có khi người bán thực sự lưu tin. Model không khai báo tiếp tục dùng bản ghi `Chưa khai báo model` như trước; không tạo sản phẩm mẫu.

`POST /api/marketplace/listings` nhận thêm:

```json
{"brandName":"Khác","customBrandName":"Tên hãng của người bán","deviceType":"BODY"}
```

Với hãng có sẵn, gửi `brandName` và bỏ `customBrandName`. API cũ dùng `brandId` hoặc `modelId` tiếp tục hoạt động; chỉ được chọn một trong ba cách.

`POST /api/marketplace/listings/{id}/brand` nhận `brandName` và `customBrandName` tương tự. Endpoint yêu cầu đăng nhập, CSRF và quyền sở hữu tin đăng; khóa hàng trong transaction trước khi kiểm tra/cập nhật. API xem sản phẩm/kho thiết bị hiện tại tiếp tục trả tên hãng thực tế qua trường `brand`.

## File triển khai

Frontend (`D:/CameraHub_Frontend`):

- `src/components/SiteLayout.tsx`: mục đăng bán trên thanh điều hướng.
- `src/components/ListingForm.tsx`: gửi lựa chọn hãng qua API tạo tin hiện có.
- `src/components/CameraBrandField.tsx`: dropdown, ô nhập và lỗi dùng chung.
- `src/lib/cameraBrands.ts`: danh sách, chuẩn hóa và khôi phục lựa chọn.
- `src/components/MyListings.tsx`: hộp thoại sửa hãng.
- `src/lib/cameraBrands.test.ts`: kiểm thử danh sách, validation và khôi phục hãng.

Backend (`D:/CamerHub_Backend`):

- `src/main/java/vn/camerahub/marketplace/CameraBrands.java`: kiểm tra danh sách và tên tùy chỉnh.
- `src/main/java/vn/camerahub/marketplace/MarketplaceController.java`: DTO tương thích ngược và endpoint sửa hãng.
- `src/main/java/vn/camerahub/marketplace/MarketplaceService.java`: lưu hãng/model bằng SQL có tham số, cập nhật hãng theo quyền sở hữu.
- `src/main/java/vn/camerahub/marketplace/MarketplaceErrors.java`: lỗi validation hãng bằng tiếng Việt.
- `src/test/java/vn/camerahub/marketplace/CameraBrandsTest.java`: kiểm thử validation/DTO.
- `src/test/java/vn/camerahub/marketplace/MarketplaceIT.java`: kiểm thử lưu, xem, sửa, quyền sở hữu, trạng thái và tương thích API cũ.

## Kiểm tra thủ công

1. Đăng nhập, bấm `Đăng bán máy ảnh`; kiểm tra 35 hãng theo thứ tự, gồm `Voigtländer`, `Blackmagic Design`, `Z CAM` và `Khác` cuối danh sách.
2. Gửi form chưa chọn hãng: bị chặn và báo `Vui lòng chọn hãng máy.`.
3. Chọn `Khác`, bỏ trống hoặc chỉ nhập khoảng trắng: bị chặn. Đổi về Canon/Sony: ô tên tùy chỉnh được ẩn.
4. Dùng một tin đăng thực tế cần tạo, hoàn tất thông tin và lưu với hãng có sẵn hoặc tên tùy chỉnh. Kiểm tra tên hãng trong kho thiết bị và trên trang chi tiết sau khi được duyệt.
5. Trong kho thiết bị, bấm `Sửa hãng máy`: kiểm tra hãng/tên tùy chỉnh được điền lại. Lưu thay đổi, mở lại để xác nhận. Kiểm tra ảnh/giá/mô tả không đổi.
6. Kiểm tra trên điện thoại và desktop; menu đăng bán vẫn truy cập được, ô tên hãng không tràn chiều ngang.

## Lệnh kiểm thử

Kết quả ngày 23/10/2026: frontend build thành công, 54 kiểm thử frontend đạt; backend build thành công, 20 kiểm thử unit và 11 kiểm thử tích hợp `MarketplaceIT` đạt. Kiểm tra giao diện: điều hướng `/dang-ban`, đủ 35 lựa chọn, lỗi thiếu hãng/tên hãng khác bằng tiếng Việt, ẩn input khi đổi về hãng có sẵn; không tràn ngang ở 320px và 1024px.

Frontend: `npm run build`, `npm test`.

Backend: `./scripts/Invoke-Backend.ps1 -Task Verify`.

Kiểm thử database: nạp môi trường bằng `scripts/Import-LocalEnvironment.ps1`, đặt `JAVA_HOME` tới JDK 21, chạy `./mvnw.cmd --batch-mode --no-transfer-progress -Pneon-it '-Dit.test=MarketplaceIT' verify`. Các fixture trong `MarketplaceIT` nằm trong transaction và được rollback; không seed sản phẩm demo vào database.
