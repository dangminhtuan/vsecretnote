const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const startInit = code.indexOf('function initQuizRound()');
const endInit = code.indexOf('function handleQuizAnswer(', startInit);

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

    const targetIndex = Math.floor(Math.random() * sampleQuizPairs.length);
    currentQuizTarget = sampleQuizPairs[targetIndex];
    wordEl.textContent = \`"\${currentQuizTarget.word}"\`;

    const distractors = getAdaptiveDistractors(currentQuizTarget.word, currentQuizTarget.b60, streak);
    const options = [{ b60: currentQuizTarget.b60, word: currentQuizTarget.word }, ...distractors];
    
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
  fs.writeFileSync('main.js', code);
  console.log('initQuizRound Replaced!');
}
