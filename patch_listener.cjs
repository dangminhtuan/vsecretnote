const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');
const searchStr2 = "if (txtTime5) txtTime5.addEventListener('input', syncFromTime5);";
const replaceStr2 = "if (txtTime5) txtTime5.addEventListener('input', syncFromTime5);\nif (txtCompressedContinuous) txtCompressedContinuous.addEventListener('input', syncFromCompressedContinuous);";
if (code.includes(searchStr2) && !code.includes("txtCompressedContinuous.addEventListener")) {
  code = code.replace(searchStr2, replaceStr2);
  fs.writeFileSync('main.js', code);
  console.log('Added event listener');
} else {
  console.log('Not found or already added');
}
