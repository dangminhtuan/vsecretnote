const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');
code = code.replace(/function updateContinuousBox\(\) \{/, 'function updateContinuousBox() { console.log("updateContinuousBox called! txtCompressed:", txtCompressed.value); ');
fs.writeFileSync('main.js', code);
