const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const targetListener = `    if (speedInput) {
      speedInput.addEventListener('keydown', (e) => {
        if (!speedActive) return;
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          checkSpeedInput(speedInput.value.trim().toLowerCase());
        }
      });
    }`;

const newListener = `    if (speedInput) {
      speedInput.addEventListener('input', (e) => {
        if (!speedActive) return;
        const val = speedInput.value.trim();
        // Remove space if they accidentally press it
        if (val.includes(' ')) {
          speedInput.value = val.replace(/\\s/g, '');
        }
        if (speedInput.value.trim().length === 3) {
          checkSpeedInput(speedInput.value.trim().toLowerCase());
        }
      });
    }`;

code = code.replace(targetListener, newListener);

const targetCheckEnd = `      if (speedCurrentIndex >= speedWords.length) {
        endSpeedTest();
      } else {
        const nextSpan = document.getElementById(\`speed-word-\${speedCurrentIndex}\`);
        if (nextSpan) nextSpan.classList.add('active');
        resetHintTimer();
      }
    }
  }`;

const newCheckEnd = `      if (speedCurrentIndex >= speedWords.length) {
        endSpeedTest();
      } else {
        const nextSpan = document.getElementById(\`speed-word-\${speedCurrentIndex}\`);
        if (nextSpan) nextSpan.classList.add('active');
        resetHintTimer();
      }
    } else {
      currentSpan.classList.add('wrong');
      speedInput.value = '';
    }
  }`;

code = code.replace(targetCheckEnd, newCheckEnd);

fs.writeFileSync('main.js', code);
console.log('Patched');
