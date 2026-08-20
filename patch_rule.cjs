const fs = require('fs');
const filePath = 'C:/Users/PC/.gemini/config/AGENTS.md';
let agents = fs.readFileSync(filePath, 'utf8');
const newRule = `
<RULE>
## Chống Lỗi Hồi Quy (Anti-Regression & State Preservation)
- **Context:** Khi AI dự định sử dụng \`git checkout\` để khôi phục file, hoặc chạy script regex thay thế/xóa một khối code lớn để sửa lỗi.
- **Constraint:** TUYỆT ĐỐI không được ghi đè mù quáng. Phải rà soát lại các lượt chat gần nhất xem người dùng vừa yêu cầu fix/thêm tính năng nhỏ nào khác trên cùng file đó không.
- **Implementation:** Nếu bắt buộc phải dùng \`git checkout\`, AI phải chủ động code lại các tinh chỉnh UI/logic vừa thực hiện thành công trước đó (ví dụ: thứ tự nút, khoảng cách, layout) để đảm bảo không lôi lỗi cũ từ quá khứ trở về. Không được lười biếng phó mặc cho bản backup cũ.
</RULE>
`;
if(!agents.includes('Anti-Regression')) {
  agents = agents.replace('</RULE[user_global]>', newRule + '</RULE[user_global]>');
  fs.writeFileSync(filePath, agents);
  console.log('Rule added to AGENTS.md');
} else {
  console.log('Rule already exists');
}
