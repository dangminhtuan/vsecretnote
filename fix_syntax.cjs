const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const badBlock = `  let currentQuizTimeCode = null;


  } } catch(e) {}
    }
    while (wrong.length < 2) wrong.push(wrong.length === 0 ? '??' : '!!');
    return wrong;
  }`;

const goodBlock = `  let currentQuizTimeCode = null;

  function generateWrongAnswers(correctB60) {
    const pool = ['0000','1111','2222','0101','1212','2323','0202','0303','0404','0505','0606','0707','0808','0909','1010','1313','1414','1515','1616','1717','1818','1919','2020','2121','0123','1234'];
    const wrong = [];
    for (const code of pool.sort(() => Math.random() - 0.5)) {
      try { const b = timeToBase60(code); if (b && b !== correctB60 && !wrong.includes(b)) { wrong.push(b); if (wrong.length >= 2) break; } } catch(e) {}
    }
    while (wrong.length < 2) wrong.push(wrong.length === 0 ? '??' : '!!');
    return wrong;
  }`;

if (code.includes(badBlock)) {
  code = code.replace(badBlock, goodBlock);
  fs.writeFileSync('main.js', code);
  console.log('Fixed syntax error!');
} else {
  console.log('Could not find bad block');
}
