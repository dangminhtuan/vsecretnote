const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// Replace initQuizRound
const startInit = code.indexOf('function initQuizRound()');
const endInit = code.indexOf('function handleQuizAnswer', startInit);
const newInit = `function initQuizRound() {
    const wordEl = document.getElementById('quiz-target-word');
    const gridEl = document.getElementById('quiz-options-grid');
    const feedbackEl = document.getElementById('quiz-feedback');
    const streakEl = document.getElementById('quiz-streak-count');
    if (!wordEl || !gridEl) return;

    if (feedbackEl) feedbackEl.textContent = '';
    
    const streak = gameState.quizStreak || 0;
    let diffBadge = '🟢 Dễ (Khác phụ âm)';
    if (streak >= 6) diffBadge = '🔥 Cao thủ (Cùng phụ âm)';
    else if (streak >= 3) diffBadge = '🟡 Trung bình (Gài bẫy)';
    
    if (streakEl) streakEl.textContent = \`🔥 Streak: \${streak} | \${diffBadge}\`;

    // Pick a valid 3-character b60 word from REAL_VIETNAMESE_WORDS
    let validPairs = [];
    if (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.length > 0) {
      // Find 10 random words to avoid scanning the whole array
      const shuffled = [...REAL_VIETNAMESE_WORDS].sort(() => Math.random() - 0.5).slice(0, 50);
      for (const w of shuffled) {
        try {
          const b = timeToBase60(encodeWord(w));
          if (b && b.length === 3) validPairs.push({ word: w, b60: b });
        } catch(e) {}
      }
    }
    
    // Fallback to something if empty
    if (validPairs.length === 0) validPairs = [{ word: 'việt', b60: 'vNk' }];
    
    currentQuizTarget = validPairs[Math.floor(Math.random() * validPairs.length)];
    wordEl.textContent = \`"\${currentQuizTarget.word}"\`;

    const distractors = getAdaptiveDistractors(currentQuizTarget.word, currentQuizTarget.b60, streak);
    const distractorsObj = Array.from(distractors).map(b => {
      let orig = '';
      if (typeof REAL_VIETNAMESE_WORDS !== 'undefined') {
        const found = REAL_VIETNAMESE_WORDS.find(w => {
           try { return timeToBase60(encodeWord(w)) === b; } catch(e){return false;}
        });
        if(found) orig = found;
      }
      return { b60: b, word: orig };
    });

    const options = [{ b60: currentQuizTarget.b60, word: currentQuizTarget.word }, ...distractorsObj];
    
    // Xáo trộn đáp án
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
  }

  `;
if (startInit !== -1 && endInit !== -1) {
  code = code.substring(0, startInit) + newInit + code.substring(endInit);
  console.log('Replaced initQuizRound');
}

// Replace handleQuizAnswer
const startHandle = code.indexOf('function handleQuizAnswer');
const endHandle = code.indexOf('function startSpeedTest()', startHandle) !== -1 
  ? code.indexOf('function startSpeedTest()', startHandle)
  : code.indexOf('// --- TIME ATTACK', startHandle);

const newHandle = `function handleQuizAnswer(selectedB60, btnEl) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const allBtns = document.querySelectorAll('.quiz-opt-btn');

    if (selectedB60 === currentQuizTarget.b60) {
      btnEl.classList.add('correct');
      if (btnEl.dataset.word) btnEl.textContent = \`\${btnEl.dataset.b60} (\${btnEl.dataset.word})\`;
      gameState.quizStreak++;
      addEXP(15, \`🎯 Streak x\${gameState.quizStreak}\`);
      if (feedbackEl) {
        feedbackEl.style.color = '#0f0';
        feedbackEl.textContent = 'CHÍNH XÁC! +15 EXP';
      }
      setTimeout(initQuizRound, 1000);
    } else {
      btnEl.classList.add('wrong');
      if (btnEl.dataset.word) btnEl.textContent = \`\${btnEl.dataset.b60} (\${btnEl.dataset.word})\`;
      gameState.quizStreak = 0;
      updateGameUI();
      allBtns.forEach(b => {
        if (b.dataset.b60 === currentQuizTarget.b60) {
          b.classList.add('correct');
          if (b.dataset.word) b.textContent = \`\${b.dataset.b60} (\${b.dataset.word})\`;
        }
      });
      if (feedbackEl) {
        feedbackEl.style.color = '#f00';
        feedbackEl.textContent = \`SAI RỒI! Mã đúng là [\${currentQuizTarget.b60}]\`;
      }
      setTimeout(initQuizRound, 2000);
    }
  }

  `;

if (startHandle !== -1 && endHandle !== -1) {
  code = code.substring(0, startHandle) + newHandle + code.substring(endHandle);
  console.log('Replaced handleQuizAnswer');
}

fs.writeFileSync('main.js', code);
