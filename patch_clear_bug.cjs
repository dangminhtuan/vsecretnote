const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const universalClear = `
    if (txtDecrypted) txtDecrypted.value = '';
    if (txtEncrypted) txtEncrypted.value = '';
    if (txtCompressed) txtCompressed.value = '';
    if (txtFakeViet) txtFakeViet.value = '';
    if (txtTime5) txtTime5.value = '';
    if (txtCompressedContinuous) txtCompressedContinuous.value = '';
    renderBreakdown([]);
    return;
`;

// Replace in syncFromDecrypted
code = code.replace(/if \(!text\.trim\(\)\) \{\s*txtEncrypted\.value = '';\s*if\(txtCompressed\) txtCompressed\.value = '';\s*renderBreakdown\(\[\]\);\s*return;\s*\}/g, 'if (!text.trim()) {' + universalClear + '}');

// Replace in syncFromTime
code = code.replace(/if \(!text\.trim\(\)\) \{\s*txtDecrypted\.value = '';\s*if\(txtCompressed\) txtCompressed\.value = '';\s*renderBreakdown\(\[\]\);\s*return;\s*\}/g, 'if (!text.trim()) {' + universalClear + '}');

fs.writeFileSync('main.js', code);
console.log('Fixed clearing bug in main.js');
