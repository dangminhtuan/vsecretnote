const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /if \(!text\.trim\(\)\) \{\s*txt([a-zA-Z]+)\.value = '';\s*if\(txt([a-zA-Z]+)\) txt\2\.value = '';\s*renderBreakdown\(\[\]\);\s*return;\s*\}/g;

code = code.replace(regex, (match) => {
  return match.replace("renderBreakdown([]);", "if(txtFakeViet) txtFakeViet.value = '';\n    if(txtTime5) txtTime5.value = '';\n    renderBreakdown([]);");
});

fs.writeFileSync('main.js', code);
console.log('Fixed clear logic!');
