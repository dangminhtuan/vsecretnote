const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');
code = code.replace(/\/\/ setupCopyClear\(/g, 'setupCopyClear(');
code = code.replace(/setupCopyClear\('btn-copy/g, "// setupCopyClear('btn-copy");
fs.writeFileSync('main.js', code);
console.log('Fixed setupCopyClear syntax');
