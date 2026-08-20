const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. autoFillSpecialTime global
const autoFillDef = "function autoFillSpecialTime(timeStr) {\n    if (!txtEncrypted) return;\n    txtEncrypted.value = timeStr;\n    lastAutoFilledTime = timeStr;\n    syncFromTime();\n  }";
const autoFillDefCRLF = autoFillDef.replace(/\n/g, '\r\n');
if (code.includes(autoFillDef)) code = code.replace(autoFillDef, autoFillDef + "\n  window.autoFillSpecialTime = autoFillSpecialTime;");
else if (code.includes(autoFillDefCRLF)) code = code.replace(autoFillDefCRLF, autoFillDefCRLF + "\r\n  window.autoFillSpecialTime = autoFillSpecialTime;");

// 2. sync clear fixes
const syncClearRegex = /if \(!text\.trim\(\)\) \{\s*txt([a-zA-Z]+)\.value = '';\s*if\(txt([a-zA-Z]+)\) txt\2\.value = '';\s*renderBreakdown\(\[\]\);\s*return;\s*\}/g;
code = code.replace(syncClearRegex, (match) => {
  return match.replace("renderBreakdown([]);", "if(txtFakeViet) txtFakeViet.value = '';\n    if(txtTime5) txtTime5.value = '';\n    renderBreakdown([]);");
});

// 3. handleTopLeftQuiz fixes
code = code.replace(/typeof autoFillSpecialTime === 'function'/g, "typeof window.autoFillSpecialTime === 'function'");
code = code.replace(/autoFillSpecialTime\(selectedFullTime\)/g, "window.autoFillSpecialTime(selectedFullTime)");
code = code.replace(/typeof base60ToTime === 'function'/g, "typeof window.base60ToTime === 'function'");
code = code.replace(/base60ToTime\(selectedB60\)/g, "window.base60ToTime(selectedB60)");

// 4. export imports
const canvasIdx = code.indexOf('const canvas = document.getElementById');
if (!code.includes('window.base60ToTime = base60ToTime;')) {
  code = code.substring(0, canvasIdx) + "window.base60ToTime = base60ToTime;\nwindow.decodeWord = decodeWord;\n" + code.substring(canvasIdx);
}

// 5. Quiz distractors length === 3
code = code.replace(/b && b\[0\] === firstChar && b !== targetB60;/g, "b && b.length === 3 && b[0] === firstChar && b !== targetB60;");
code = code.replace(/b && b !== targetB60 && !distractors\.has\(b\)/g, "b && b.length === 3 && b !== targetB60 && !distractors.has(b)");

// 6. initQuizRound replacement (safe)
const initStart = code.indexOf('function initQuizRound()');
const initEnd = code.indexOf('function handleQuizAnswer(', initStart);

const newInit = `function initQuizRound() {
    const wordEl = document.getElementById('quiz-target-word');
    const gridEl = document.getElementById('quiz-options-grid');
    const feedbackEl = document.getElementById('quiz-feedback');
    const streakEl = document.getElementById('quiz-streak-count');
    if (!wordEl || !gridEl) return;

    if (feedbackEl) feedbackEl.innerHTML = '';
    
    const streak = gameState.quizStreak || 0;
    let diffBadge = '🟢 Dễ (Khác phụ âm)';
    if (streak >= 6) diffBadge = '🔥 Cao thủ (Cùng phụ âm)';
    else if (streak >= 3) diffBadge = '🟡 Trung bình (Gài bẫy)';
    
    if (streakEl) streakEl.textContent = \`🔥 Streak: \${streak} | \${diffBadge}\`;

    let validPairs = [];
    if (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.length > 0) {
      const shuffled = [...REAL_VIETNAMESE_WORDS].sort(() => Math.random() - 0.5).slice(0, 50);
      for (const w of shuffled) {
        try {
          const b = timeToBase60(encodeWord(w));
          if (b && b.length === 3) validPairs.push({ word: w, b60: b });
        } catch(e) {}
      }
    }
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

code = code.substring(0, initStart) + newInit + code.substring(initEnd);

// 7. handleQuizAnswer replacement (safe)
const handleStart = code.indexOf('function handleQuizAnswer(selectedB60');
const handleEnd = code.indexOf('// --- TIME ATTACK 60S MODULE ---', handleStart);

const newHandle = `function handleQuizAnswer(selectedB60, btnEl) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const allBtns = document.querySelectorAll('.quiz-opt-btn');

    allBtns.forEach(b => {
      b.style.pointerEvents = 'none';
      if (b.dataset.word) {
        b.textContent = \`\${b.dataset.b60} (\${b.dataset.word})\`;
      }
    });

    if (selectedB60 === currentQuizTarget.b60) {
      btnEl.classList.add('correct');
      gameState.quizStreak++;
      addEXP(15, \`🎯 Streak x\${gameState.quizStreak}\`);
      if (feedbackEl) {
        feedbackEl.style.color = '#0f0';
        feedbackEl.innerHTML = 'CHÍNH XÁC! +15 EXP<br/>';
      }
    } else {
      btnEl.classList.add('wrong');
      gameState.quizStreak = 0;
      updateGameUI();
      allBtns.forEach(b => {
        if (b.dataset.b60 === currentQuizTarget.b60) b.classList.add('correct');
      });
      if (feedbackEl) {
        feedbackEl.innerHTML = '';
      }
    }

    if (feedbackEl) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'CÂU HỎI TIẾP ➔';
      nextBtn.style.cssText = 'margin-top: 15px; padding: 10px 20px; font-family: monospace; font-size: 14px; font-weight: bold; background: #ffff00; color: #000; border: none; border-radius: 4px; cursor: pointer; width: 100%; max-width: 300px; display: inline-block; text-transform: uppercase;';
      nextBtn.onclick = () => initQuizRound();
      feedbackEl.appendChild(nextBtn);
    }
  }

  `;

code = code.substring(0, handleStart) + newHandle + code.substring(handleEnd);

fs.writeFileSync('main.js', code);
console.log('Successfully patched all features safely!');
