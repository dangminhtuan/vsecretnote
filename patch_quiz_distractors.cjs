const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Rewrite getAdaptiveDistractors
const oldAdaptive = code.substring(code.indexOf('function getAdaptiveDistractors'), code.indexOf('function initQuizRound()'));

const newAdaptive = `function getAdaptiveDistractors(targetWord, targetB60, streak) {
    const firstChar = targetB60[0];
    const distractors = new Map(); // b60 -> word
    const wordPool = (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.length) 
      ? REAL_VIETNAMESE_WORDS 
      : sampleWordsList;

    if (streak >= 6) {
      // CẤP ĐỘ KHÓ
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
      // CẤP ĐỘ VỪA
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

    // ĐIỀN NỐT
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
code = code.replace(oldAdaptive, newAdaptive);

// 2. Rewrite initQuizRound
const oldInitEnd = `    const distractors = getAdaptiveDistractors(currentQuizTarget.word, currentQuizTarget.b60, streak);
    const options = [currentQuizTarget.b60, ...distractors];
    
    // Xáo trộn 4 đáp án
    options.sort(() => Math.random() - 0.5);

    gridEl.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleQuizAnswer(opt, btn));
      gridEl.appendChild(btn);
    });
  }`;

const newInitEnd = `    const distractors = getAdaptiveDistractors(currentQuizTarget.word, currentQuizTarget.b60, streak);
    const options = [{ b60: currentQuizTarget.b60, word: currentQuizTarget.word }, ...distractors];
    
    // Xáo trộn 4 đáp án
    options.sort(() => Math.random() - 0.5);

    gridEl.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt.b60;
      btn.dataset.b60 = opt.b60;
      btn.dataset.word = opt.word;
      btn.addEventListener('click', () => handleQuizAnswer(opt.b60, btn));
      gridEl.appendChild(btn);
    });
  }`;
code = code.replace(oldInitEnd, newInitEnd);

// 3. Rewrite handleQuizAnswer
const oldHandle = code.substring(code.indexOf('function handleQuizAnswer('), code.indexOf('// --- GAME LOOP ---'));
const newHandle = `function handleQuizAnswer(selectedB60, btnEl) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const allBtns = document.querySelectorAll('.quiz-opt-btn');

    if (selectedB60 === currentQuizTarget.b60) {
      btnEl.classList.add('correct');
      btnEl.textContent = \`\${btnEl.dataset.b60} (\${btnEl.dataset.word})\`;
      gameState.quizStreak++;
      addEXP(15, \`🎯 Streak x\${gameState.quizStreak}\`);
      if (feedbackEl) {
        feedbackEl.style.color = '#0f0';
        feedbackEl.textContent = 'CHÍNH XÁC! +15 EXP';
      }
      setTimeout(initQuizRound, 1000);
    } else {
      btnEl.classList.add('wrong');
      btnEl.textContent = \`\${btnEl.dataset.b60} (\${btnEl.dataset.word})\`;
      gameState.quizStreak = 0;
      updateGameUI();
      allBtns.forEach(b => {
        if (b.dataset.b60 === currentQuizTarget.b60) {
          b.classList.add('correct');
          b.textContent = \`\${b.dataset.b60} (\${b.dataset.word})\`;
        }
      });
      if (feedbackEl) {
        feedbackEl.style.color = '#f00';
        feedbackEl.textContent = 'SAI RỒI! Mất Streak';
      }
      setTimeout(initQuizRound, 2000);
    }
  }

  `;
code = code.replace(oldHandle, newHandle);

fs.writeFileSync('main.js', code);
console.log('Patched quiz adaptive distractors and words');
