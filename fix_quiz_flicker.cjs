const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const targetStr = `function tickSpecialTime() {
    if (!document.body.classList.contains('sandbox-mode') || !display) return;`;

const newStr = `function tickSpecialTime() {
    const choicesEl = document.getElementById('quiz-choices');
    if (choicesEl && choicesEl.style.display !== 'none') return; // Freeze UI if quiz is active

    if (!document.body.classList.contains('sandbox-mode') || !display) return;`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('main.js', code);
  console.log('Fixed tickSpecialTime to freeze UI when quiz is active.');
} else {
  console.log('Could not find targetStr');
}
