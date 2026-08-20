const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const oldFunc = `  function generateWrongAnswers(correctB60) {
    const pool = ['0000','1111','2222','0101','1212','2323','0202','0303','0404','0505','0606','0707','0808','0909','1010','1313','1414','1515','1616','1717','1818','1919','2020','2121','0123','1234'];
    const wrong = [];
    for (const code of pool.sort(() => Math.random() - 0.5)) {
      try { const b = timeToBase60(code); if (b && b !== correctB60 && !wrong.includes(b)) { wrong.push(b); if (wrong.length >= 2) break; } } catch(e) {}
    }
    while (wrong.length < 2) wrong.push(wrong.length === 0 ? '??' : '!!');
    return wrong;
  }`;

const newFunc = `  function generateWrongAnswers(correctB60) {
    const wrong = [];
    const wordPool = (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.length) 
      ? REAL_VIETNAMESE_WORDS 
      : sampleWordsList;
      
    // Trích xuất ngẫu nhiên các từ an toàn có mã base60 3 ký tự
    const safeWords = wordPool.sort(() => Math.random() - 0.5);
    for (const w of safeWords) {
      try {
        const t = encodeWord(w);
        const b = timeToBase60(t);
        if (b && b.length === 3 && b !== correctB60 && !wrong.includes(b)) {
          wrong.push(b);
          if (wrong.length >= 2) break;
        }
      } catch(e) {}
    }
    while (wrong.length < 2) wrong.push(wrong.length === 0 ? '??' : '!!');
    return wrong;
  }`;

if (code.includes(oldFunc)) {
  code = code.replace(oldFunc, newFunc);
  fs.writeFileSync('main.js', code);
  console.log('Successfully replaced generateWrongAnswers');
} else {
  console.log('Failed to find old generateWrongAnswers');
}
