const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const importTarget = "import {\n  encodeWord, decodeWord, timeToBase60, base60ToTime, TOKEN_REGEX\n, applyTone} from './vcomp.js';";
const importReplacement = importTarget + "\nimport { encodeCVNSS4Word } from './cvnss4.js';";
code = code.replace(importTarget, importReplacement);

const uiVarTarget = "const txtCompressedContinuous = document.getElementById('compressed-continuous-input');";
const uiVarReplacement = uiVarTarget + "\nconst txtCVNSS4 = document.getElementById('cvnss4-input');";
code = code.replace(uiVarTarget, uiVarReplacement);

// Just replace everything else carefully using regex to not fail if exact spacing is weird
code = code.replace(/let breakdownPairs = \[\];/g, "let breakdownPairs = [];\n  let cvnss4Parts = [];");
code = code.replace(/const allBreakdownPairs = \[\];/g, "const allBreakdownPairs = [];\n  const allCvnss4Parts = [];");

code = code.replace(/if \(txtCompressedContinuous\) txtCompressedContinuous.value = '';/g, "if (txtCompressedContinuous) txtCompressedContinuous.value = '';\n    if (txtCVNSS4) txtCVNSS4.value = '';");

code = code.replace(/compressedParts.push\(b60Code\);/g, "compressedParts.push(b60Code);\n      if(typeof token !== 'undefined') cvnss4Parts.push(encodeCVNSS4Word(token));\n      if(typeof decoded !== 'undefined') cvnss4Parts.push(encodeCVNSS4Word(decoded));");

code = code.replace(/allDecryptedParts.push\(decoded\);/g, "allDecryptedParts.push(decoded);\n        allCvnss4Parts.push(encodeCVNSS4Word(decoded));");

code = code.replace(/encryptedParts.push\(token\);\n      compressedParts.push\(token\);/g, "encryptedParts.push(token);\n      compressedParts.push(token);\n      cvnss4Parts.push(token);");
code = code.replace(/decryptedParts.push\(token\);\n      compressedParts.push\(token\);/g, "decryptedParts.push(token);\n      compressedParts.push(token);\n      cvnss4Parts.push(token);");
code = code.replace(/allTimeParts.push\(token\);\n        allDecryptedParts.push\(token\);/g, "allTimeParts.push(token);\n        allDecryptedParts.push(token);\n        allCvnss4Parts.push(token);");

code = code.replace(/allDecryptedParts.push\('\\n'\);/g, "allDecryptedParts.push('\\n');\n      allCvnss4Parts.push('\\n');");

code = code.replace(/if\(txtCompressed\) txtCompressed.value = compressedParts.join\(''\);/g, "if(txtCompressed) txtCompressed.value = compressedParts.join('');\n  if(txtCVNSS4) txtCVNSS4.value = cvnss4Parts.join('');");
code = code.replace(/txtDecrypted.value = allDecryptedParts.join\(''\);/g, "txtDecrypted.value = allDecryptedParts.join('');\n  if(txtCVNSS4) txtCVNSS4.value = allCvnss4Parts.join('');");

fs.writeFileSync('main.js', code);
