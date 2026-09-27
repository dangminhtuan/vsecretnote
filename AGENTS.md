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
  4. **Tiết Kiệm Diện Tích & Ẩn Thuyết Minh Khi Đã Quá Rõ Ràng (Zero-Bloat / Dismissible Explanation)**:
     - Khi các tín hiệu thị giác trực tiếp trên giao diện (như màu sắc phím, nhãn góc, mũi tên hướng) nhìn liếc qua đã quá rõ ràng rồi thì **không cần phải thuyết minh dài dòng tốn diện tích màn hình** (đặc biệt trên điện thoại).
     - Nếu có thanh thuyết minh/giải thích cho người mới dùng lần đầu, **bắt buộc phải có nút Tắt (`Ẩn thuyết minh` / `✕`)** để thu gọn hoàn toàn khi người dùng đã hiểu quy tắc, kèm một **nút nhỏ gọn (`💡`)** ngay trên thanh công cụ/ô nhập để bật lại bất cứ khi nào muốn soi chi tiết. Trạng thái bật/tắt phải được lưu lại (`localStorage`).

## Lệnh Quy Ước: 'k' hoặc 'K' kèm Hình ảnh (OCR & Chờ lệnh)
- **Context**: Khi người dùng gửi hình ảnh kèm ký tự `k` hoặc `K` (hoặc gửi `k` làm tin nhắn độc lập sau khi gửi ảnh).
- **Constraint**:
  1. **Trích xuất thông tin (OCR)**: Đọc toàn bộ nội dung văn bản, ký tự, bố cục hoặc thông tin trong hình ảnh.
  2. **Gửi trả dữ liệu**: Trình bày lại text đã trích xuất một cách đầy đủ, chính xác và ngăn nắp cho người dùng.
  3. **Chờ lệnh mới**: Dừng lại hoàn toàn và chờ người dùng viết prompt tiếp theo (dựa trên thông tin vừa trích xuất).
  4. **Không tự ý suy đoán**: Tuyệt đối không tự ý viết code, sửa đổi file hay suy đoán tác vụ trước khi nhận chỉ thị rõ ràng tiếp theo.

## Lệnh Quy Ước: 'u' hoặc 'U' (Cắm USB & Cài APK lên điện thoại)
- **Context**: Khi người dùng gõ `u` hoặc `U` dưới dạng tin nhắn độc lập.
- **Constraint**:
  1. Hiểu là: Người dùng đã cắm cáp USB nối điện thoại với máy tính và yêu cầu cài đặt file APK mới nhất (`.\dist\vboard.apk`) lên điện thoại.
  2. Tự động chạy lệnh cài đặt qua ADB trong background:
     `& "D:\CodingTools\AndroidStudio_AppData_Local_Android_Sdk\platform-tools\adb.exe" install -r -d ".\dist\vboard.apk"`
  3. Báo cáo kết quả cài đặt cho người dùng (thành công hoặc nếu chưa bật USB Debugging/chưa nhận máy) kèm link tải trực tiếp.

## Tư duy Chuỗi Hành Vi Toàn Diện (End-to-End Typing Flow & Next Action Anticipation)
- **Context**: Bất kỳ khi nào xây dựng hoặc chỉnh sửa cơ chế nhập liệu, chốt từ, hoán đổi phím hoặc tương tác người dùng trên bàn phím.
- **Constraint**:
  1. **Tuyệt đối không thi hành máy móc, thiển cận (No Literal Slaving / No Isolated Completion)**:
     - Không bao giờ chỉ dừng lại ở việc gán ký tự/từ vào ô nhập liệu rồi bỏ mặc người dùng.
     - BẮT BUỘC phải tư duy trọn vẹn chuỗi hành vi tiếp theo (Next Action Anticipation):
       + **Phân định rõ Gõ thường (Tap) vs Quẹt (Flick/Swipe)**:
         * **Gõ thường (Tap)**: Luôn bảo toàn ký tự gốc của phím (ví dụ: gõ `ka` rồi chạm phím `g` phải ra `kag` để người dùng có thể gõ tiếp `kage`). Tuyệt đối không được cướp phím gốc khi người dùng chỉ tap thường!
         * **Quẹt (Flick / Swipe)**: Biểu thị ý định dứt khoát chốt từ/vần (ví dụ: quẹt ngang phím `g` ra `kai `) -> **BẮT BUỘC TỰ ĐỘNG THÊM DẤU CÁCH (`" "`)** để gõ tiếp từ sau liền mạch mà không phải bấm Space thủ công.
       + **Gõ dấu câu (`.`, `,`, `!`, `?`...)**: Phải tự động bắt dính dấu câu sát vào từ đứng trước (xóa space đệm thừa) và tự động tạo dấu cách sau dấu câu.
       + **Xóa sửa sai (Smart Backspace)**: Bấm Backspace ngay sau khi chốt từ bằng vuốt phải hỗ trợ xóa nguyên từ + space hoặc hoàn tác mượt mà.
  2. **Ngữ âm học Thực chiến & Chống lãng phí (Zero Phonetic Waste & Smart Substitution)**:
     - Các vần âm tắc kết thúc bằng `c, ch, p, t` (như `iêt`, `ac`, `at`, `ap`...) trong tiếng Việt **chỉ có 2 thanh điệu: Sắc (12h) và Nặng (6h)**. Hoàn toàn KHÔNG CÓ thanh Bằng, Huyền, Hỏi, Ngã.
     - Tuyệt đối cấm sinh ra các từ ma quái / rác ngôn ngữ như `iểt`, `iềt`, `axt`...
     - Phải chủ động phát hiện và đề xuất/gán các phím tắt có giá trị cao (từ/cụm từ hay dùng nhất) vào các hướng thanh điệu không tồn tại này để tận dụng 100% tài nguyên cử chỉ của bàn phím.
  3. **Tiên liệu Trải nghiệm Thực chiến (Senior Product Owner Mindset)**:
     - Đặt bản thân vào vị trí người trực tiếp gõ trên màn hình cảm ứng để tự động hoàn thiện toàn bộ các vi tương tác (micro-interactions) cần thiết trước khi người dùng kịp nhắc.
