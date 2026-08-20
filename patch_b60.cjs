const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const targetStr = `  try {
    if (typeof base60ToTime === 'function') {
      const decoded = base60ToTime(selectedB60);
      if (decoded && decoded.length === 6) {
         selectedFullTime = decoded;
      }
    }
  } catch(e) {}`;

const newStr = `  try {
    if (typeof window.base60ToTime === 'function') {
      const decoded = window.base60ToTime(selectedB60);
      if (decoded && decoded.length === 6) {
         selectedFullTime = decoded;
      }
    }
  } catch(e) {}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('main.js', code);
  console.log('Fixed handleTopLeftQuiz base60ToTime');
} else {
  // Try with \r\n
  const targetStr2 = targetStr.replace(/\n/g, '\r\n');
  if (code.includes(targetStr2)) {
    code = code.replace(targetStr2, newStr.replace(/\n/g, '\r\n'));
    fs.writeFileSync('main.js', code);
    console.log('Fixed handleTopLeftQuiz base60ToTime (CRLF)');
  }
}
