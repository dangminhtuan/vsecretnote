# VSecretNote (TimeCypher)
**Ứng dụng Ghi chú Bí mật chuẩn mã hóa Tiếng Việt (Vietnamese Secret Note)**

VSecretNote không phải là một ứng dụng ghi chú bình thường. Nó là một cỗ máy bảo mật cá nhân, sử dụng thuật toán nén và mã hóa ngữ nghĩa tiếng Việt độc quyền (VCOMP) để biến những bí mật của bạn thành các đoạn mã vô nghĩa trong mắt người ngoài, nhưng lại dịch ngược hoàn hảo khi bạn cần.

## 🌟 Tính năng nổi bật
- **Mã hóa VCOMP (Base60):** Mọi từ tiếng Việt được nén chặt thành 3 ký tự (Ví dụ: `tuyệt mật` -> `hX9 kA4`). Nếu không có bộ từ điển giải mã, dữ liệu hoàn toàn vô dụng với hacker.
- **Offline 100%:** Ứng dụng hoạt động hoàn toàn trên trình duyệt của bạn (Client-side). Không có cơ sở dữ liệu đám mây, không gửi API về server. Dữ liệu được lưu trong `LocalStorage` của trình duyệt. Bí mật của bạn chỉ nằm trên máy của bạn.
- **Giao diện Ma trận (Matrix UI):** Trải nghiệm gõ phím mang đậm phong cách Hacker/Cyberpunk.
- **Phím tắt ẩn (Virtual Shift - phím `f`):** Tối ưu hóa việc viết hoa mà không cần dùng phím Shift thật, giúp thao tác gõ mã hóa cực nhanh.
- **Chế độ Học tập (Sandbox):** Tự do vọc vạch từ điển Base60 mà không sợ làm hỏng dữ liệu gốc.

## 🛠 Cài đặt & Chạy ứng dụng

Vì đây là một ứng dụng thuần Frontend (HTML/JS/CSS), bạn chỉ cần:
1. Tải toàn bộ mã nguồn về máy.
2. Mở file `index.html` bằng bất kỳ trình duyệt nào (Chrome, Firefox, Edge).
3. Bắt đầu gõ và trải nghiệm!

*(Nếu bạn muốn chạy môi trường dev, có thể sử dụng Vite: `npm install` -> `npm run dev`)*

## 🧠 Cấu trúc thư mục
- `index.html`: Khung giao diện chính.
- `style.css`: Giao diện Cyberpunk, Matrix rain effect.
- `main.js`: Xử lý DOM, sự kiện gõ phím, lưu trữ LocalStorage.
- `vcomp.js` & `data.js`: Lõi thuật toán nén tiếng Việt VCOMP (Vietnamese Compression Protocol).

## 🔒 Triết lý bảo mật
Chúng tôi tin rằng quyền riêng tư là tuyệt đối. Bằng việc Mở Mã Nguồn (Open Source) dự án này, chúng tôi mời mọi lập trình viên vào xem xét code để chứng minh rằng: **Không có bất kỳ một dòng code gián điệp nào được chèn vào đây.**

## 🤝 Giấy phép
Dự án được phân phối dưới giấy phép **MIT**. Mọi người tự do sử dụng, chỉnh sửa và phân phối lại.

---
*Tác giả: Minh Tuấn*
