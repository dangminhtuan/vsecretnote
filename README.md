# VSecretNote (TimeCypher) & SecretNote Keyboard
**Ứng dụng Ghi chú Bảo mật chuẩn Mã hóa Tiếng Việt (VCOMP) tích hợp Bàn phím Ảo Thế Hệ Mới**

VSecretNote không chỉ là một ứng dụng ghi chú bảo mật. Nó là một **Hệ sinh thái Giáo dục & Bảo mật**, sử dụng thuật toán nén và mã hóa ngữ nghĩa tiếng Việt độc quyền (VCOMP) để biến những bí mật của bạn thành các đoạn mã vô nghĩa trong mắt người ngoài, nhưng lại dịch ngược hoàn hảo khi bạn cần.

## 🌟 Trải nghiệm Live Demo
**Trải nghiệm trực tiếp tại:** [https://mat-ma-thoi-gian.pages.dev/](https://mat-ma-thoi-gian.pages.dev/)

---

## 🔥 Tính năng Nổi bật (Bản Cập Nhật Mới)

### 1. Bàn phím SecretNote Keyboard (SNK) - Mô hình Widget Độc lập
Đây là một cuộc cách mạng so với phiên bản trước. Bàn phím ảo SNK giờ đây hoạt động như một Widget độc lập, có thể nhúng vào bất kỳ trang web hoặc dự án nào:
- **Đa giao diện (Multi-theme):** Chuyển đổi mượt mà giữa các giao diện `Android`, `iOS`, và `Web` (Ma trận/Hacker) chỉ với một cú click.
- **Cơ chế kéo thả (Drag & Drop):** Tự do di chuyển bàn phím khắp màn hình để không che khuất tầm nhìn.

### 2. Công cụ Học tập (Edu-Typing) & Nhập liệu Thông minh
Không chỉ để gõ nhanh, SNK là người thầy dạy bạn thuộc lòng hệ thống mã hóa Base60:
- **Vuốt phím (Swipe-to-Type):** Vuốt để nhập liệu với tốc độ cực nhanh, từ vựng được tự động nội suy và chèn vào văn bản.
- **Gợi ý Thông minh theo Ngữ cảnh (Contextual Next-Word):** AI của bàn phím tự động dự đoán các từ tiếp theo dựa trên từ bạn vừa gõ (ví dụ: gõ "muốn" sẽ gợi ý "đi, làm, hỏi...").
- **Tra cứu chéo Base60:** Hỗ trợ gõ trực tiếp mã Base60 (không phân biệt hoa/thường, ví dụ gõ `chd`) để bàn phím tự động dịch ra từ Tiếng Việt tương ứng (`chơi [CHd]`) ngay trên thanh gợi ý.

### 3. Bảo mật Tuyệt đối & Ngoại tuyến (Offline 100%)
- **Mã hóa VCOMP (Base60):** Mỗi từ tiếng Việt được nén chặt thành 2-3 ký tự (Ví dụ: `tuyệt mật` -> `Gza m9U`). Không có từ điển giải mã, dữ liệu hoàn toàn vô dụng với hacker.
- **Không Máy Chủ (Serverless):** Ứng dụng hoạt động hoàn toàn trên trình duyệt của bạn (Client-side). Không có cơ sở dữ liệu đám mây, không gửi API về server. Bí mật của bạn chỉ nằm trên máy của bạn.

---

## 🚀 Cài đặt & Chạy Ứng dụng
Đây là một ứng dụng thuần Frontend (HTML/JS/CSS/Vite).

### Chạy môi trường phát triển (Dev)
```bash
npm install
npm run dev
```

### Xây dựng bản phân phối (Build)
```bash
npm run build
```

*Sản phẩm được phát triển nhằm mục tiêu tối ưu hóa tốc độ nhập liệu và bảo mật thông tin cá nhân bằng ngôn ngữ Tiếng Việt.*


## 🚀 Sức mạnh của VCOMP (Vietnamese Base60 Compression)
VCOMP là một bước tiến hóa tối thượng trong việc xử lý và lưu trữ tiếng Việt:
- **Nén Dữ Liệu Tuyệt Đối:** Mọi từ tiếng Việt được nén thành chính xác 3 ký tự Base60 thuần túy, triệt tiêu hoàn toàn dấu cách. Tiết kiệm hơn 50% dung lượng lưu trữ so với tiếng Việt có dấu.
- **Bảo Toàn Hệ Thống:** Không bao giờ lỗi font, lỗi url, lỗi database key nhờ vào tập ký tự Base60 an toàn 100%.
- **Bảo Mật Nhận Thức:** Hoạt động như một lớp mật mã tự nhiên (Zero-Knowledge) giúp bảo vệ quyền riêng tư tuyệt đối. Con người có thể được huấn luyện để giải mã và đọc hiểu qua hệ sinh thái học tập của VCOMP.

Để xem bài đánh giá và so sánh chi tiết tính ưu việt của **VCOMP so với CVNSS4.0**, vui lòng đọc tại: [VCOMP vs CVNSS4.0](VCOMP_vs_CVNSS4.md)

Để xem **Bản thiết kế kiến trúc mã hóa toàn diện (Cụ thể cái gì được mã hóa thành cái gì)**, vui lòng đọc tại: [Kiến Trúc TimeCypher & Base60](HUONG_DAN_MA_HOA_TIMECYPHER_BASE60.md)

Để xem toàn bộ quy tắc 3 Bảng Vần, Trục từ neo bậy, Thế số đẹp và Mẹo tra cứu tốc độ cao, vui lòng xem tại: [Quy Tắc Vần & Mẹo Ghi Nhớ TimeCypher](QUY_TAC_VAN_VA_MEO_GHI_NHO.md)
