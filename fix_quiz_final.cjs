const fs = require('fs');
let main = fs.readFileSync('main.js', 'utf8');

// 1. Change HOLY_HOUR_CODES
const oldCodes = /const HOLY_HOUR_CODES = \{[\s\S]*?\};/;
const newCodes = `const HOLY_HOUR_CODES = {
    '0000': '000005', '0101': '010123', '0202': '020205', '0303': '030335',
    '0404': '040429', '0505': '050520', '0606': '060627', '0707': '070700',
    '0808': '080801', '0909': '090900', '1010': '101000', '1111': '111105',
    '1212': '121200', '1313': '131301', '1414': '141401', '1515': '151501',
    '1616': '161601', '1717': '171700', '1818': '181802', '1919': '191900',
    '2020': '202005', '2121': '212100', '2222': '222202', '2323': '232302',
    '0123': '012317', '1234': '123407', '2345': '234503', '2332': '233211'
  };`;
main = main.replace(oldCodes, newCodes);

// 2. Change generateWrongAnswers
const oldWrong = /function generateWrongAnswers\([\s\S]*?return wrong;\s*\}/;
const newWrong = `function generateWrongAnswers(correctB60) {
    const wrong = [];
    const holyCodes = Object.values(HOLY_HOUR_CODES);
    const shuffled = holyCodes.sort(() => Math.random() - 0.5);
    for (const c of shuffled) {
      try {
        const b = typeof timeToBase60 === 'function' ? timeToBase60(c) : '';
        if (b && b.length === 3 && b !== correctB60 && !wrong.includes(b)) {
          wrong.push(b);
          if (wrong.length >= 2) break;
        }
      } catch(e) {}
    }
    while (wrong.length < 2) wrong.push(wrong.length === 0 ? '??' : '!!');
    return wrong;
  }`;
main = main.replace(oldWrong, newWrong);

// 3. Remove wordToShow replacement
const oldBtnCorrect = /if\s*\(wordToShow\s*&&\s*!btn\.textContent\.includes\('\('\)\)\s*\{\s*btn\.textContent = `\$\{selectedB60\}\s*\(\$\{wordToShow\}\)`;\s*\}/g;
main = main.replace(oldBtnCorrect, '');

// 4. Remove auto-show
const oldShowQuiz = /if\s*\(b60\)\s*showQuiz\(timeCode,\s*b60,\s*foundSpecial\.label\);/;
main = main.replace(oldShowQuiz, '// Auto-show removed');

fs.writeFileSync('main.js', main);
console.log('Patched main.js silently');
