const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const adaptiveIdx = code.indexOf('function getAdaptiveDistractors(');
const initIdx = code.indexOf('function initQuizRound()');

if (adaptiveIdx !== -1 && initIdx !== -1) {
  const newAdaptive = `function getAdaptiveDistractors(targetWord, targetB60, streak) {
    const firstChar = targetB60[0];
    const distractors = new Map();
    const wordPool = (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.length) ? REAL_VIETNAMESE_WORDS : sampleWordsList;

    if (streak >= 6) {
      const samePrefixWords = wordPool.filter(w => {
        if (w === targetWord) return false;
        try {
          const b = timeToBase60(encodeWord(w));
          return b && b.length === 3 && b[0] === firstChar && b !== targetB60;
        } catch(e) { return false; }
      }).sort(() => Math.random() - 0.5);
      for (const w of samePrefixWords) {
        const b = timeToBase60(encodeWord(w));
        distractors.set(b, w);
        if (distractors.size >= 3) break;
      }
    } else if (streak >= 3) {
      const samePrefixWords = wordPool.filter(w => {
        if (w === targetWord) return false;
        try {
          const b = timeToBase60(encodeWord(w));
          return b && b.length === 3 && b[0] === firstChar && b !== targetB60;
        } catch(e) { return false; }
      }).sort(() => Math.random() - 0.5);
      for (const w of samePrefixWords.slice(0, 1)) {
        distractors.set(timeToBase60(encodeWord(w)), w);
      }
    }
    const otherWords = wordPool.filter(w => w !== targetWord).sort(() => Math.random() - 0.5);
    for (const w of otherWords) {
      if (distractors.size >= 3) break;
      try {
        const b = timeToBase60(encodeWord(w));
        if (b && b.length === 3 && b !== targetB60 && !distractors.has(b)) {
          distractors.set(b, w);
        }
      } catch(e) {}
    }
    const result = [];
    distractors.forEach((w, b) => result.push({ b60: b, word: w }));
    return result;
  }

  `;
  code = code.substring(0, adaptiveIdx) + newAdaptive + code.substring(initIdx);
}

// 2. Patch initQuizRound to use the object structure
const initStr1 = 'const options = [currentQuizTarget.b60, ...distractors];';
const initStr2 = 'const options = [{ b60: currentQuizTarget.b60, word: currentQuizTarget.word }, ...distractors];';

const gridLoop1 = `    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleQuizAnswer(opt, btn));
      gridEl.appendChild(btn);
    });`;
const gridLoop2 = `    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt.b60;
      btn.dataset.b60 = opt.b60;
      btn.dataset.word = opt.word;
      btn.addEventListener('click', () => handleQuizAnswer(opt.b60, btn));
      gridEl.appendChild(btn);
    });`;

code = code.replace(initStr1, initStr2);
code = code.replace(gridLoop1, gridLoop2);
if (code.includes('opt.b60')) {
  fs.writeFileSync('main.js', code);
  console.log('Fixed everything');
}
