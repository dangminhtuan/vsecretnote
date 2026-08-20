const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

code = code.replace(/const distractorsObj = distractors\.map/g, "const distractorsObj = Array.from(distractors).map");

fs.writeFileSync('main.js', code);
console.log('Fixed Set map error');
