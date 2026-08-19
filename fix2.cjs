const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');
const search = "currentQuizTimeCode = null;";
const idx = code.indexOf(search);
const end = code.indexOf("}", idx);
const replacement = "currentQuizTimeCode = null;\n    const actionsEl = document.getElementById('top-left-actions');\n    if (actionsEl) actionsEl.style.display = 'flex';\n  }";
code = code.substring(0, idx) + replacement + code.substring(end + 1);
fs.writeFileSync('main.js', code);
console.log('Done!');
