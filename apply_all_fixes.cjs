const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. autoFillSpecialTime global
const autoFillDef = "function autoFillSpecialTime(timeStr) {\r\n    if (!txtEncrypted) return;\r\n    txtEncrypted.value = timeStr;\r\n    lastAutoFilledTime = timeStr;\r\n    syncFromTime();\r\n  }";
const autoFillDefLF = autoFillDef.replace(/\r\n/g, '\n');
if (code.includes(autoFillDef)) code = code.replace(autoFillDef, autoFillDef + "\r\n  window.autoFillSpecialTime = autoFillSpecialTime;");
else if (code.includes(autoFillDefLF)) code = code.replace(autoFillDefLF, autoFillDefLF + "\n  window.autoFillSpecialTime = autoFillSpecialTime;");

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
code = code.substring(0, canvasIdx) + "window.base60ToTime = base60ToTime;\nwindow.decodeWord = decodeWord;\n" + code.substring(canvasIdx);

// 5. Quiz distractors length === 3
code = code.replace(/b && b\[0\] === firstChar && b !== targetB60;/g, "b && b.length === 3 && b[0] === firstChar && b !== targetB60;");
code = code.replace(/b && b !== targetB60 && !distractors\.has\(b\)/g, "b && b.length === 3 && b !== targetB60 && !distractors.has(b)");

// 6. initQuizRound mapping & word display
const initFind = "const options = [currentQuizTarget.b60, ...distractors];\r\n    \r\n    // Xáo trộn 4 đáp án\r\n    options.sort(() => Math.random() - 0.5);\r\n\r\n    gridEl.innerHTML = '';\r\n    options.forEach(opt => {\r\n      const btn = document.createElement('button');\r\n      btn.className = 'quiz-opt-btn';\r\n      btn.textContent = opt;\r\n      btn.addEventListener('click', () => handleQuizAnswer(opt, btn));\r\n      gridEl.appendChild(btn);\r\n    });";
const initFindLF = initFind.replace(/\r\n/g, '\n');

const initReplace = `const distractorsObj = distractors.map(b => {
      // Find original word for distractor
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
    });`;

if (code.includes(initFind)) code = code.replace(initFind, initReplace);
else if (code.includes(initFindLF)) code = code.replace(initFindLF, initReplace);

// 7. handleQuizAnswer display word
const handleFind = `    if (selectedB60 === currentQuizTarget.b60) {
      btnEl.classList.add('correct');
      gameState.quizStreak++;
      addEXP(15, \`🎯 Streak x\${gameState.quizStreak}\`);
      if (feedbackEl) {
        feedbackEl.style.color = '#0f0';
        feedbackEl.textContent = 'CHÍNH XÁC! +15 EXP';
      }
      setTimeout(initQuizRound, 1000);
    } else {
      btnEl.classList.add('wrong');
      gameState.quizStreak = 0;
      updateGameUI();
      allBtns.forEach(b => {
        if (b.textContent === currentQuizTarget.b60) b.classList.add('correct');
      });
      if (feedbackEl) {
        feedbackEl.style.color = '#f00';
        feedbackEl.textContent = 'SAI RỒI! Mất Streak';
      }
      setTimeout(initQuizRound, 2000);
    }`;
const handleFindLF = handleFind.replace(/\r\n/g, '\n');

const handleReplace = `    if (selectedB60 === currentQuizTarget.b60) {
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
        feedbackEl.textContent = 'SAI RỒI! Mất Streak';
      }
      setTimeout(initQuizRound, 2000);
    }`;
    
if (code.includes(handleFind)) code = code.replace(handleFind, handleReplace);
else if (code.includes(handleFindLF)) code = code.replace(handleFindLF, handleReplace);

fs.writeFileSync('main.js', code);
console.log('Restored all fixes and patched quiz properly');
