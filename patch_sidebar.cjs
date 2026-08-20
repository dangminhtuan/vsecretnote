const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Fix DEL CLEAR
const oldClear = `  if (txtDecrypted) txtDecrypted.value = '';
  if (txtEncrypted) txtEncrypted.value = '';
  if (txtCompressed) txtCompressed.value = '';
  if (txtFakeViet) txtFakeViet.value = '';
  if (txtTime5) txtTime5.value = '';
  if (active && (active === txtDecrypted || active === txtEncrypted || active === txtCompressed || 
active === txtFakeViet || active === txtTime5)) {`;
const newClear = `  if (txtDecrypted) txtDecrypted.value = '';
  if (txtEncrypted) txtEncrypted.value = '';
  if (txtCompressed) txtCompressed.value = '';
  if (typeof txtCompressedContinuous !== 'undefined' && txtCompressedContinuous) txtCompressedContinuous.value = '';
  if (txtFakeViet) txtFakeViet.value = '';
  if (txtTime5) txtTime5.value = '';
  if (active && (active === txtDecrypted || active === txtEncrypted || active === txtCompressed || 
(typeof txtCompressedContinuous !== 'undefined' && active === txtCompressedContinuous) || active === txtFakeViet || active === txtTime5)) {`;
code = code.replace(oldClear, newClear);

// 2. Fix getAdaptiveDistractors (Add b.length === 3)
const oldAdaptive = code.substring(code.indexOf('function getAdaptiveDistractors'), code.indexOf('function initQuizRound()'));
const newAdaptive = `function getAdaptiveDistractors(targetWord, targetB60, streak) {
    const firstChar = targetB60[0];
    const distractors = new Map();
    const wordPool = (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.length) 
      ? REAL_VIETNAMESE_WORDS 
      : sampleWordsList;

    if (streak >= 6) {
      const samePrefixWords = wordPool.filter(w => {
        if (w === targetWord) return false;
        try {
          const b = timeToBase60(encodeWord(w));
          return b && b.length === 3 && b[0] === firstChar && b !== targetB60;
        } catch(e) { return false; }
      }).sort(() => Math.random() - 0.5);

      for (const w of samePrefixWords) {
        distractors.set(timeToBase60(encodeWord(w)), w);
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
code = code.replace(oldAdaptive, newAdaptive);

// 3. Fix initQuizRound
const oldInit = code.substring(code.indexOf('function initQuizRound()'), code.indexOf('function handleQuizAnswer('));
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

    const validPairs = sampleQuizPairs.filter(p => p.b60 && p.b60.length === 3);
    const targetIndex = Math.floor(Math.random() * validPairs.length);
    currentQuizTarget = validPairs[targetIndex];
    wordEl.textContent = \`"\${currentQuizTarget.word}"\`;

    const distractors = getAdaptiveDistractors(currentQuizTarget.word, currentQuizTarget.b60, streak);
    const options = [{ b60: currentQuizTarget.b60, word: currentQuizTarget.word }, ...distractors];
    
    options.sort(() => Math.random() - 0.5);

    gridEl.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt.b60 + ' (' + opt.word + ')';
      btn.dataset.b60 = opt.b60;
      btn.dataset.word = opt.word;
      btn.addEventListener('click', () => handleQuizAnswer(opt.b60, btn));
      gridEl.appendChild(btn);
    });
  }

  `;
code = code.replace(oldInit, newInit);

// 4. Fix handleQuizAnswer
const oldHandle = code.substring(code.indexOf('function handleQuizAnswer('), code.indexOf('// --- TIME ATTACK 60S MODULE ---'));
const newHandle = `function handleQuizAnswer(selectedB60, btnEl) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const allBtns = document.querySelectorAll('.quiz-opt-btn');

    if (feedbackEl && feedbackEl.innerHTML.includes('Câu hỏi tiếp')) return;

    if (selectedB60 === currentQuizTarget.b60) {
      btnEl.classList.add('correct');
      gameState.quizStreak++;
      addEXP(15, \`🔥 Streak x\${gameState.quizStreak}\`);
      
      if (typeof txtDecrypted !== 'undefined' && txtDecrypted) {
        txtDecrypted.value = currentQuizTarget.word;
        if (typeof syncFromDecrypted === 'function') syncFromDecrypted();
      }
      
      const copyText = currentQuizTarget.time + " " + currentQuizTarget.b60;
      navigator.clipboard.writeText(copyText).then(() => {
        if (typeof showToast === 'function') showToast('Đã copy: ' + copyText);
      });

    } else {
      btnEl.classList.add('wrong');
      gameState.quizStreak = 0;
      updateGameUI();
      allBtns.forEach(b => {
        if (b.dataset.b60 === currentQuizTarget.b60) {
          b.classList.add('correct');
        }
      });
    }

    if (feedbackEl) {
      feedbackEl.innerHTML = '<button id="btn-next-quiz" style="background:#0f0; color:#000; font-weight:bold; padding:8px 16px; border:none; cursor:pointer; border-radius:4px; font-family:monospace; margin-top:8px;">CÂU HỎI TIẾP ▸</button>';
      document.getElementById('btn-next-quiz').addEventListener('click', initQuizRound);
    }
  }

  `;
code = code.replace(oldHandle, newHandle);

fs.writeFileSync('main.js', code);
console.log('Patched Sidebar Quiz and Clear Button');
