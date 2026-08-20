const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const targetStr = `  if (typeof autoFillSpecialTime === 'function') {
    autoFillSpecialTime(selectedFullTime);
  }`;

const newStr = `  if (typeof window.autoFillSpecialTime === 'function') {
    window.autoFillSpecialTime(selectedFullTime);
  }`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('main.js', code);
console.log('Done replacing autoFillSpecialTime check');
