const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');
code = code.replace(/if \(typeof updateContinuousBox === 'function'\) updateContinuousBox\(\);/g, '');
code = code.replace('function renderBreakdown(pairs) {', "function renderBreakdown(pairs) {\n  if (typeof updateContinuousBox === 'function') updateContinuousBox();");
fs.writeFileSync('main.js', code);
console.log('Fixed exactly!');
