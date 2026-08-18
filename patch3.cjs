const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

code = code.replace(
  /document\.getElementById\('btn-sandbox-clear'\)\?\.addEventListener\('click', \(\) => \{\r?\n  const active = document\.activeElement;\r?\n  if \(txtDecrypted\) txtDecrypted\.value = '';\r?\n  if \(txtEncrypted\) txtEncrypted\.value = '';\r?\n  if \(txtCompressed\) txtCompressed\.value = '';\r?\n  if \(active && \(active === txtDecrypted \|\| active === txtEncrypted \|\| active === txtCompressed\)\) \{\r?\n    active\.focus\(\);\r?\n  \} else \{\r?\n    txtDecrypted\?\.focus\(\);\r?\n  \}\r?\n\}\);/,
  `document.getElementById('btn-sandbox-clear')?.addEventListener('click', () => {
  const active = document.activeElement;
  if (txtDecrypted) txtDecrypted.value = '';
  if (txtEncrypted) txtEncrypted.value = '';
  if (txtCompressed) txtCompressed.value = '';
  if (txtFakeViet) txtFakeViet.value = '';
  if (txtTime5) txtTime5.value = '';
  if (active && (active === txtDecrypted || active === txtEncrypted || active === txtCompressed || active === txtFakeViet || active === txtTime5)) {
    active.focus();
  } else {
    txtDecrypted?.focus();
  }
});`
);

fs.writeFileSync('main.js', code);
console.log('Patch3 done');
