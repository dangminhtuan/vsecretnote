# Project Rules: vsecretnote (TimeCypher & ViScript)

## Cung cấp Link Kiểm thử Mạng Nội bộ (LAN IP for Mobile & PC)
- **Context**: BẤT KỲ TRƯỜNG HỢP NÀO trợ lý gửi link kiểm thử cho người dùng (hoàn thành tác vụ, phản hồi lệnh `br`, `r`, gợi ý link xem trước, kiểm thử tính năng...).
- **Constraint**: 
  1. Đảm bảo cấu hình server web luôn mở lắng nghe mọi địa chỉ mạng (`host: '0.0.0.0'` hoặc `host: true` trong `vite.config.js`).
  2. BẮT BUỘC LUÔN LUÔN cung cấp link theo **IP mạng nội bộ (LAN IPv4: `192.168.1.123`)** để người dùng có thể click mở trực tiếp trên cả máy tính lẫn điện thoại di động (`_m`) chung Wi-Fi. TUYỆT ĐỐI KHÔNG chỉ gửi mỗi link `localhost`.
  3. **Chỉ gửi link trang đang làm việc / có liên quan**:
     - Mặc định chỉ gửi trang đang làm việc hoặc được yêu cầu (ví dụ: đang làm việc ở Studio/Sandbox thì CHỈ gửi link Trang chính).
     - Tuyệt đối KHÔNG gửi kèm link các trang không liên quan (như demo bàn phím, bảng font...) nếu người dùng không yêu cầu hoặc tác vụ không đụng đến chúng.
     - Định dạng link xuất ra chat: 📱 💻 **[Tên trang (PC & Mobile)](http://192.168.1.123:5173/<path_neu_co>)**

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

