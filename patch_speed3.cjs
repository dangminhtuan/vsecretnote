const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const idx1 = code.indexOf('if (speedInput) {');
const endIdx1 = code.indexOf('    }\r\n  }', idx1) !== -1 ? code.indexOf('    }\r\n  }', idx1) : code.indexOf('    }\n  }', idx1);

if (idx1 !== -1 && endIdx1 !== -1) {
  const newListener = `if (speedInput) {
      speedInput.addEventListener('input', (e) => {
        if (!speedActive) return;
        const val = speedInput.value;
        if (val.includes(' ')) {
          speedInput.value = val.replace(/\\s/g, '');
        }
        if (speedInput.value.trim().length === 3) {
          checkSpeedInput(speedInput.value.trim().toLowerCase());
        }
      });
`;
  code = code.substring(0, idx1) + newListener + code.substring(endIdx1);
  fs.writeFileSync('main.js', code);
  console.log('Patched listener properly!');
} else {
  console.log('Not found boundaries', idx1, endIdx1);
}
