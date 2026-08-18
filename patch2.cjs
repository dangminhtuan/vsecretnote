const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');
code = code.replace(
  /    \/\/ Chưa qua: auto-fill nếu ô trống\r?\n    currentIsPast = false;\r?\n    const label = foundSpecial\.label;\r?\n    const shouldAutoFill = !isUserTyping\(\);\r?\n\r?\n    if \(shouldAutoFill && lastAutoFilledTime !== label\) \{\r?\n      lastAutoFilledTime = label;\r?\n      autoFillSpecialTime\(foundSpecial\.fh, foundSpecial\.fm\);\r?\n    \}/g,
  "    // Chưa qua\n    currentIsPast = false;\n    const label = foundSpecial.label;"
);
fs.writeFileSync('main.js', code);
console.log('Patch2 done');
