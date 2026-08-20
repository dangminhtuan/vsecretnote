const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const search = "function autoFillSpecialTime(timeStr) {\n    if (!txtEncrypted) return;\n    txtEncrypted.value = timeStr;\n    lastAutoFilledTime = timeStr;\n    syncFromTime();\n  }";
const search2 = "function autoFillSpecialTime(timeStr) {\r\n    if (!txtEncrypted) return;\r\n    txtEncrypted.value = timeStr;\r\n    lastAutoFilledTime = timeStr;\r\n    syncFromTime();\r\n  }";

if (code.includes(search)) {
  code = code.replace(search, search + "\n  window.autoFillSpecialTime = autoFillSpecialTime;");
  fs.writeFileSync('main.js', code);
  console.log('Fixed');
} else if (code.includes(search2)) {
  code = code.replace(search2, search2 + "\r\n  window.autoFillSpecialTime = autoFillSpecialTime;");
  fs.writeFileSync('main.js', code);
  console.log('Fixed (CRLF)');
} else {
  console.log('Not found');
}
