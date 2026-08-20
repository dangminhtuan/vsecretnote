const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const targetStr = `window.handleTopLeftQuiz = function(selectedB60, correctB60, correctFullCode, btn) {
  if (selectedB60 === correctB60) {
    btn.style.background = '#0f0';
    btn.style.color = '#000';
    autoFillSpecialTime(correctFullCode);
    navigator.clipboard.writeText(correctB60);
    if (window.triggerHolyHourQuest) window.triggerHolyHourQuest();
  } else {
    btn.style.background = '#f00';
    btn.style.color = '#000';
    btn.style.textDecoration = 'line-through';
  }
};`;

const newStr = `window.handleTopLeftQuiz = function(selectedB60, correctB60, correctFullCode, btn) {
  let selectedFullTime = selectedB60;
  try {
    if (typeof base60ToTime === 'function') {
      const decoded = base60ToTime(selectedB60);
      if (decoded && decoded.length === 6) {
         selectedFullTime = decoded;
      }
    }
  } catch(e) {}
  
  const timeCode = selectedFullTime.length >= 4 ? selectedFullTime.substring(0, 4) : selectedFullTime;
  const copyText = \`\${timeCode} \${selectedB60}\`;

  navigator.clipboard.writeText(copyText);

  if (typeof autoFillSpecialTime === 'function') {
    autoFillSpecialTime(selectedFullTime);
  }

  if (selectedB60 === correctB60) {
    btn.style.background = '#0f0';
    btn.style.color = '#000';
    if (window.triggerHolyHourQuest) window.triggerHolyHourQuest();
  } else {
    btn.style.background = '#f00';
    btn.style.color = '#000';
    btn.style.textDecoration = 'line-through';
  }
};`;

// Use simple replacement but also index slicing just in case of formatting issues
const idx = code.indexOf('window.handleTopLeftQuiz = function(');
const endIdx = code.indexOf('};', idx) + 2;

if (idx !== -1 && endIdx !== -1) {
  code = code.substring(0, idx) + newStr + code.substring(endIdx);
  fs.writeFileSync('main.js', code);
  console.log('Fixed handleTopLeftQuiz');
} else {
  console.log('Could not find handleTopLeftQuiz block');
}
