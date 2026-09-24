# Project Rules: vsecretnote (TimeCypher & ViScript)

## Cung cấp Link Kiểm thử: Song song Localhost (PC) & LAN IP (Mobile)
- **Context**: BẤT KỲ TRƯỜNG HỢP NÀO trợ lý gửi link kiểm thử cho người dùng (hoàn thành tác vụ, phản hồi lệnh `br`, `r`, gợi ý link xem trước, kiểm thử tính năng...).
- **Constraint**: 
  1. Đảm bảo cấu hình server web luôn mở lắng nghe mọi địa chỉ mạng (`host: '0.0.0.0'` hoặc `host: true` trong `vite.config.js`).
  2. **BẮT BUỘC LUÔN LUÔN CUNG CẤP CẢ 2 LINK RIÊNG BIỆT**, đặt nhãn trực quan rõ ràng để người dùng liếc qua là biết ngay:
     - 💻 **Link Localhost (PC)**: Dùng để test trên máy tính, đảm bảo trình duyệt nhận diện Secure Context cho phép hoạt động đầy đủ tính năng Copy / Clipboard API.
     - 📱 **Link LAN IP (Mobile)**: Dùng IP mạng nội bộ (`http://192.168.1.123:5173/<path>`) để test trên điện thoại di động (`_m`) qua Wi-Fi khi không ngồi trước máy tính.
  3. **Chỉ gửi link trang đang làm việc / có liên quan**:
     - Mặc định chỉ gửi trang đang làm việc hoặc được yêu cầu (ví dụ: đang làm việc ở Subtitle thì CHỈ gửi 2 link của Subtitle).
     - Tuyệt đối KHÔNG gửi kèm link các trang không liên quan nếu người dùng không yêu cầu.
  4. **Định dạng hiển thị chuẩn ra chat**:
     - 💻 **[Tên trang - PC/Localhost (Hỗ trợ Copy)](http://localhost:5173/<path_neu_co>)**
     - 📱 **[Tên trang - Mobile/LAN IP (Điện thoại)](http://192.168.1.123:5173/<path_neu_co>)**

## Tư duy Logic & Đối chiếu Vi sai khi Phân tích Lỗi (Differential Root-Cause Analysis)
- **Context**: Khi người dùng báo lỗi kỹ thuật về một nút bấm, tính năng, hoặc hành vi bị hỏng ở một thành phần/ô nhập cụ thể.
- **Constraint**:
  1. **Tuyệt đối không đổ lỗi toàn cục khi lỗi mang tính cục bộ**:
     - Không được quy kết nguyên nhân do môi trường, hạ tầng, trình duyệt, OS hay giao thức (như HTTP vs HTTPS) nếu tính năng đó vẫn đang hoạt động bình thường ở các thành phần khác trên cùng trang web.
     - Lời giải thích của AI bắt buộc phải thỏa mãn tính nhất quán logic: Giải thích được ĐỒNG THỜI tại sao thành phần A chạy được mà thành phần B lại hỏng.
  2. **Bắt buộc phân tích vi sai đối chiếu (A/B Differential Analysis)**:
     - Luôn đặt thành phần hoạt động (A) cạnh thành phần bị hỏng (B) trong mã nguồn để tìm ra điểm khác biệt thực sự:
       + Element selector (ID/Class) có đúng không?
       + Event listeners (click, focus, input) đã được gán vào B chưa?
       + Kiểu thẻ DOM (textarea vs div/span, input readonly)?
       + Biến con trỏ tham chiếu (active element) có đang trỏ đúng vào B không?
  3. **Tự chịu trách nhiệm điều tra, không để người dùng phân tích hộ**:
     - Phải tự dùng công cụ đọc code, grep, kiểm tra trạng thái thực tế để truy vết nguyên nhân đến tận cùng trước khi phát biểu. Tuyệt đối không suy đoán ẩu, lười biếng để người dùng phải chỉ ra lỗi logic sơ đẳng.

## Trực Quan Hóa Tối Đa - Liếc Qua Là Hiểu (Visual Over Text Explanation)
- **Context**: Khi thiết kế các thành phần giao diện (UI), công cụ tinh chỉnh cấu hình, bộ hoán vị hoặc thao tác đa chiều.
- **Constraint**:
  1. **Ưu tiên Sơ Đồ Hình Học hơn Nhãn Chữ (Visual Over Text)**:
     - Tuyệt đối không phụ thuộc vào các chuỗi chữ hướng dẫn dài dòng hoặc nút bấm thuần chữ để giải thích luồng xử lý.
     - Phải mô hình hóa các thành phần tương tác thành sơ đồ hình học trực quan (ví dụ: hình vuông 4 góc, mạng liên kết, các mũi tên hoán vị 2 chiều `⇄`, `⇅`).
  2. **Liếc Qua Là Hiểu (Glanceable UI)**:
     - Bố cục phải tự giải thích (self-explanatory): Người dùng nhìn vào sơ đồ trong vòng 1 giây là biết ngay thành phần nào liên kết với thành phần nào, hoán đổi theo chiều nào mà không cần đọc tài liệu.
  3. **Đánh Số Đồng Bộ (Numbered Trigger Mechanism)**:
     - Trên các mũi tên hoán vị hoặc luồng xử lý, đánh dấu số định danh nổi bật (ví dụ: `①`, `②`, `③`).
     - Các nút bấm hành động tương ứng ở bên ngoài cũng mang cùng mã số định danh (ví dụ: `[ 🔄 1 ]`, `[ 🔄 2 ]`) để tạo sự liên kết phản xạ tức thì giữa mắt nhìn và ngón tay bấm.


