const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const search = "currentQuizTimeCode = null;\n  }";
const replacement = "currentQuizTimeCode = null;\n    const actionsEl = document.getElementById('top-left-actions');\n    if (actionsEl) actionsEl.style.display = 'flex';\n  }";

if (code.includes(search)) {
  code = code.replace(search, replacement);
  fs.writeFileSync('main.js', code);
  console.log('Fixed hideQuiz properly');
}
