const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. HOLY_HOUR_CODES update
code = code.replace(
  /'2323': '232302', \/\/ ngành/,
  "'2323': '023235', // quyện"
).replace(
  /'0303': '030335', \/\/ tục/,
  "'0303': '030319', // tái"
).replace(
  /'0404': '040407', \/\/ giết/,
  "'0404': '040419', // thám"
).replace(
  /'0123': '012301', \/\/ đánh/,
  "'0123': '012330', // phước"
).replace(
  /    '1234': '123407', \/\/ rớt\r?\n    '2345': '234503', \/\/ nghẻm\r?\n    '2332': '233211', \/\/ nghợn/,
  "    '1234': '123407', // rớt"
);

// Fix pool array
code = code.replace(
  /const pool = \['0000','1111','2222','0101','1212','2323','0202','0303','0404','0505','0606','0707','0808','0909','1010','1313','1414','1515','1616','1717','1818','1919','2020','2121','0123','1234','2345','2332'\];/,
  "const pool = ['0000','1111','2222','0101','1212','2323','0202','0303','0404','0505','0606','0707','0808','0909','1010','1313','1414','1515','1616','1717','1818','1919','2020','2121','0123','1234'];"
);

// 2. autoFillSpecialTime & isUserTyping
code = code.replace(
  /function autoFillSpecialTime\(h, m\) {\r?\n    if \(!txtEncrypted\) return;\r?\n    const hh = String\(h\)\.padStart\(2, '0'\);\r?\n    const mm = String\(m\)\.padStart\(2, '0'\);\r?\n    const timeStr = `\${hh}\${mm}`; \/\/ 0202, không có dấu ':'\r?\n    txtEncrypted.value = timeStr;\r?\n    syncFromTime\(\);\r?\n  }/,
  "function autoFillSpecialTime(timeStr) {\n    if (!txtEncrypted) return;\n    txtEncrypted.value = timeStr;\n    lastAutoFilledTime = timeStr;\n    syncFromTime();\n  }"
);
code = code.replace(
  /        const hStr = code\.slice\(0, 2\);\r?\n        const mStr = code\.slice\(2, 4\);\r?\n        autoFillSpecialTime\(parseInt\(hStr, 10\), parseInt\(mStr, 10\)\);/,
  "        const fullTimeStr = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[code] ? HOLY_HOUR_CODES[code] : code + '00';\n        autoFillSpecialTime(fullTimeStr);"
);
code = code.replace(
  /               autoFillSpecialTime\(parseInt\(timeStr\.slice\(0,2\), 10\), parseInt\(timeStr\.slice\(2,4\), 10\)\);/,
  "               autoFillSpecialTime(timeStr);"
);
code = code.replace(
  /function getSpecialTimeInfo\(fh, fm\) {\r?\n    const hh2 = String\(fh\)\.padStart\(2, '0'\);\r?\n    const mm2 = String\(fm\)\.padStart\(2, '0'\);\r?\n    const timeCode = `\${hh2}\${mm2}`;\r?\n    let decodedWord = '', b60 = '';\r?\n    try { decodedWord = decodeWord\(timeCode\) \|\| ''; } catch\(e\) {}\r?\n    try { b60 = timeToBase60\(timeCode \+ '00'\) \|\| ''; } catch\(e\) {}\r?\n    const validWord = decodedWord && !decodedWord\.includes\('\?'\) && !decodedWord\.startsWith\('\['\);\r?\n    return { timeCode, decodedWord: validWord \? decodedWord : '', b60 };\r?\n  }/,
  "function getSpecialTimeInfo(fh, fm) {\n    const hh2 = String(fh).padStart(2, '0');\n    const mm2 = String(fm).padStart(2, '0');\n    const timeCode = `${hh2}${mm2}`;\n    const fullCode = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[timeCode] ? HOLY_HOUR_CODES[timeCode] : timeCode + '00';\n    let decodedWord = '', b60 = '';\n    try { decodedWord = decodeWord(fullCode) || ''; } catch(e) {}\n    try { b60 = timeToBase60(fullCode) || ''; } catch(e) {}\n    const validWord = decodedWord && !decodedWord.includes('?') && !decodedWord.startsWith('[');\n    return { timeCode, decodedWord: validWord ? decodedWord : '', b60 };\n  }"
);
code = code.replace(
  /      try { const b = timeToBase60\(code \+ '00'\); if \(b && b !== correctB60 && !wrong\.includes\(b\)\) { wrong\.push\(b\); if \(wrong\.length >= 2\) break; } } catch\(e\) {}/,
  "      const fullCode = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[code] ? HOLY_HOUR_CODES[code] : code + '00';\n      try { const b = timeToBase60(fullCode); if (b && b !== correctB60 && !wrong.includes(b)) { wrong.push(b); if (wrong.length >= 2) break; } } catch(e) {}"
);


code = code.replace(
  /if \(lastAutoFilledTime\) {\r?\n      const hParts = lastAutoFilledTime\.split\(':'\);\r?\n      if \(hParts\.length === 2\) {\r?\n        const code = hParts\[0\] \+ hParts\[1\];\r?\n        if \(enc === code\) return false;\r?\n      }\r?\n    }/,
  "if (lastAutoFilledTime && enc === lastAutoFilledTime) {\n      return false;\n    }"
);

// 3. Share link fix
code = code.replace(
  /const encoded = b60Val\.replace\(\/\\n\/g, 'o'\)\.replace\(\/ \/g, 'O'\);/,
  "const encoded = b60Val.replace(/\\n/g, '-').replace(/ /g, '');"
);

const holyHourObj = `
  const HOLY_HOUR_CODES = {
    '0000': '000005', // cạ
    '1111': '111105', // chịch
    '2222': '222202', // lồn
    '0101': '010123', // phạc
    '1212': '121200', // rên
    '2323': '023235', // quyện
    '0202': '020205', // gạch
    '0303': '030319', // tái
    '0404': '040419', // thám
    '0505': '050535', // trụi
    '0606': '060627', // xỉn
    '0707': '070700', // hôn
    '0808': '080801', // vú
    '0909': '090900', // dâm
    '1010': '101000', // mút
    '1313': '131301', // sướng
    '1414': '141401', // nứng
    '1515': '151501', // bướm
    '1616': '161601', // liếm
    '1717': '171700', // chim
    '1818': '181802', // sờ
    '1919': '191900', // ôm
    '2020': '202005', // ngực
    '2121': '212100', // nhấp
    '0123': '012330', // phước
    '1234': '123407', // rớt
  };
`;
if (!code.includes('HOLY_HOUR_CODES')) {
  code = code.replace(
    /function getSpecialTimeInfo/,
    holyHourObj + '\n  function getSpecialTimeInfo'
  );
}

// Append decodeShareHash
const tail = `
function decodeShareHash(hash) {
  let str = decodeURIComponent(hash.replace(/^#/, ''));
  str = str.replace(/-/g, '\\n');
  const b60Chars = "cdgGjkKhvDmCrsnblQSzNyLWpfqtTRx0123456789ABEFHIJMPUVXYZaeiuw";
  let unpacked = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '\\n') {
      unpacked += '\\n';
      i++;
    } else if (str[i] === '[') {
      let end = str.indexOf(']', i);
      if (end === -1) end = str.length - 1;
      unpacked += str.slice(i, end + 1) + ' ';
      i = end + 1;
    } else {
      let isB60 = true;
      for (let j = 0; j < 3; j++) {
        if (i+j >= str.length || !b60Chars.includes(str[i+j])) {
          isB60 = false; break;
        }
      }
      if (isB60) {
        unpacked += str.slice(i, i+3) + ' ';
        i += 3;
      } else {
        unpacked += str[i];
        i++;
      }
    }
  }
  return unpacked.replace(/ \\n/g, '\\n').trim();
}

document.addEventListener('DOMContentLoaded', () => {
  if (location.hash && location.hash.length > 1 && typeof txtCompressed !== 'undefined') {
    setTimeout(() => {
      txtCompressed.value = decodeShareHash(location.hash);
      if (typeof syncFromCompressed === 'function') syncFromCompressed();
    }, 100);
  }
});
`;

if (!code.includes('decodeShareHash')) {
  code += tail;
}

fs.writeFileSync('main.js', code);
console.log('Patch success!');
