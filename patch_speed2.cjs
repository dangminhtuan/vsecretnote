const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// Patch 1: Replace listener
const idx1 = code.indexOf('if (speedInput) {');
const endIdx1 = code.indexOf('}\n  }', idx1);
if (idx1 !== -1 && endIdx1 !== -1) {
  const newListener = `if (speedInput) {
      speedInput.addEventListener('input', (e) => {
        if (!speedActive) return;
        const val = speedInput.value.trim();
        if (val.includes(' ')) {
          speedInput.value = val.replace(/\\s/g, '');
        }
        if (speedInput.value.trim().length === 3) {
          checkSpeedInput(speedInput.value.trim().toLowerCase());
        }
      });
    }`;
  code = code.substring(0, idx1) + newListener + code.substring(endIdx1 + 1);
  console.log('Patched listener');
}

// Patch 2: Replace checkSpeedInput else block
const idx2 = code.indexOf('// Wrong! Flash red.');
if (idx2 !== -1) {
  const endIdx2 = code.indexOf('}', idx2);
  const newWrong = `// Wrong! Flash red.
      speedInput.style.backgroundColor = '#500';
      setTimeout(() => speedInput.style.backgroundColor = '', 200);
      currentSpan.classList.add('wrong');
      speedInput.value = '';
    `;
  code = code.substring(0, idx2) + newWrong + code.substring(endIdx2);
  console.log('Patched wrong logic');
}

fs.writeFileSync('main.js', code);
