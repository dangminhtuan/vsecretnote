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

code = code.replace(/if \(!rawText\.trim\(\)\) \{\s*txtDecrypted\.value = '';\s*txtEncrypted\.value = '';\s*renderBreakdown\(\[\]\);\s*return;\s*\}/g, 'if (!rawText.trim()) {' + universalClear + '}');

fs.writeFileSync('main.js', code);
console.log('Fixed syncFromCompressed clear bug');
