const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const oldCopyLogic = `      const copyText = currentQuizTarget.time + " " + currentQuizTarget.b60;
      navigator.clipboard.writeText(copyText).then(() => {
        if (typeof showToast === 'function') showToast('Đã copy: ' + copyText);
      });`;

if (code.includes('const copyText = currentQuizTarget.time + " " + currentQuizTarget.b60;')) {
    code = code.replace(oldCopyLogic, '');
    fs.writeFileSync('main.js', code);
    console.log('Removed clipboard copy logic successfully.');
} else {
    console.log('Could not find clipboard logic to remove.');
}
