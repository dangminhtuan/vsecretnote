import re
with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("from './vcomp.js';", "from './vcomp.js';\\nimport { encodeCVNSS4Word } from './cvnss4.js';")
content = content.replace("const txtCompressedContinuous = document.getElementById('compressed-continuous-input');", "const txtCompressedContinuous = document.getElementById('compressed-continuous-input');\\nconst txtCVNSS4 = document.getElementById('cvnss4-input');")
content = content.replace("if (txtFakeViet) txtFakeViet.value = '';", "if (txtFakeViet) txtFakeViet.value = '';\\n    if (txtCVNSS4) txtCVNSS4.value = '';")
content = content.replace("let breakdownPairs = [];", "let breakdownPairs = [];\\n  let cvnss4Parts = [];")
content = content.replace("compressedParts.push(b60Code);", "compressedParts.push(b60Code);\\n      cvnss4Parts.push(encodeCVNSS4Word(token));")
content = content.replace("compressedParts.push(token);", "compressedParts.push(token);\\n      cvnss4Parts.push(token);")
content = content.replace("if(txtCompressed) txtCompressed.value = compressedParts.join('');", "if(txtCompressed) txtCompressed.value = compressedParts.join('');\\n  if(txtCVNSS4) txtCVNSS4.value = cvnss4Parts.join('');")
content = content.replace("decryptedParts.push(decoded);\\n      compressedParts.push(b60Code);", "decryptedParts.push(decoded);\\n      compressedParts.push(b60Code);\\n      cvnss4Parts.push(encodeCVNSS4Word(decoded));")
content = content.replace("decryptedParts.push(token);\\n      compressedParts.push(token);", "decryptedParts.push(token);\\n      compressedParts.push(token);\\n      cvnss4Parts.push(token);")
content = content.replace("const allBreakdownPairs = [];", "const allBreakdownPairs = [];\\n  const allCvnss4Parts = [];")
content = content.replace("allDecryptedParts.push('\\\\n');", "allDecryptedParts.push('\\\\n');\\n      allCvnss4Parts.push('\\\\n');")
content = content.replace("allDecryptedParts.push(decoded);", "allDecryptedParts.push(decoded);\\n        allCvnss4Parts.push(encodeCVNSS4Word(decoded));")
content = content.replace("allDecryptedParts.push(token);", "allDecryptedParts.push(token);\\n        allCvnss4Parts.push(token);")
content = content.replace("txtDecrypted.value = allDecryptedParts.join('');", "txtDecrypted.value = allDecryptedParts.join('');\\n  if(txtCVNSS4) txtCVNSS4.value = allCvnss4Parts.join('');")
with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)
