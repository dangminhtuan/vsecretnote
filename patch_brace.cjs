const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const buggyText = `function updateContinuousBox() {
  if (txtCompressed && txtCompressedContinuous) {
    if (document.activeElement !== txtCompressedContinuous) {
      txtCompressedContinuous.value = txtCompressed.value.replace(/\\s+/g, '');
    }
  }
}
}

// We need to inject`;

const fixedText = `function updateContinuousBox() {
  if (txtCompressed && txtCompressedContinuous) {
    if (document.activeElement !== txtCompressedContinuous) {
      txtCompressedContinuous.value = txtCompressed.value.replace(/\\s+/g, '');
    }
  }
}

// We need to inject`;

code = code.replace(buggyText, fixedText);
fs.writeFileSync('main.js', code);
console.log('Fixed extra brace');
