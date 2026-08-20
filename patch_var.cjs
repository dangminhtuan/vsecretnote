const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');
const searchStr = "const txtTime5 = document.getElementById('time-5-input');";
const replaceStr = "const txtTime5 = document.getElementById('time-5-input');\nconst txtCompressedContinuous = document.getElementById('compressed-continuous-input');";
if (code.includes(searchStr)) {
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync('main.js', code);
  console.log('Added const txtCompressedContinuous');
} else {
  console.log('searchStr not found');
}
