const fs = require('fs');
const filePath = 'C:/Users/PC/.gemini/config/AGENTS.md';
let agents = fs.readFileSync(filePath, 'utf8');

const newRule = `
<RULE>
## Từ Điển Phân Biệt Các Module (Domain Dictionary)
- **Context:** Khi User yêu cầu sửa đổi hoặc fix lỗi liên quan đến các tính năng có giao diện tương đồng (như Quiz).
- **Constraint:** AI phải phân biệt rạch ròi 2 hệ thống sau, không được râu ông nọ cắm cằm bà kia:
  1. **Flash Quiz (Sidebar Game):** Nằm ở bảng điều khiển bên phải. Do hàm \`handleQuizAnswer\` và \`initQuizRound\` quản lý.
  2. **Quiz Giờ Thiêng (Top-bar / Special Time):** Nằm ở góc trên cùng bên trái trong Sandbox mode (ví dụ 16:16, 17:17). Do hàm \`showQuiz\` và \`tickSpecialTime\` quản lý.
- **Implementation:** Trước khi sửa code, AI phải tự đặt câu hỏi và nhìn vào ảnh chụp màn hình (nếu có) để xác định chính xác User đang thao tác ở khu vực (DOM) nào, sau đó mới tiến hành patch đúng hàm tương ứng.
</RULE>
`;

if(!agents.includes('Từ Điển Phân Biệt Các Module')) {
  agents = agents.replace('</RULE[user_global]>', newRule + '</RULE[user_global]>');
  fs.writeFileSync(filePath, agents);
  console.log('Added Domain Dictionary Rule');
}
