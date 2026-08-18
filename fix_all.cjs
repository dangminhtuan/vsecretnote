const fs = require('fs');

// ----- FIX MAIN.JS -----
let main = fs.readFileSync('main.js', 'utf8');

// 1. Fix Imports
main = main.replace(
  /BASE60_MAPPING,\s*SHORT_WORDS,\s*TWO_DIGIT_WORDS,\s*ENGLISH_DICT,\s*SHORTCUT_WORDS,/,
  'BASE60_MAPPING, ENGLISH_DICT,'
);

// 2. Insert HOLY_HOUR_CODES
const holyObj = `
  const HOLY_HOUR_CODES = {
    '0101': '010123', '0202': '020202', '0303': '030319', '0404': '040419',
    '0505': '050505', '0606': '060627', '0707': '070714', '0808': '080808',
    '0909': '090909', '1010': '101010', '1111': '111111', '1212': '121212',
    '1313': '131313', '1414': '141414', '1515': '151515', '1616': '161616',
    '1717': '171717', '1818': '181818', '1919': '191919', '2020': '202020',
    '2121': '212121', '2222': '222222', '2323': '023235',
    '0123': '012330', '0234': '023419', '0345': '034519', '0456': '045619'
  };
`;
if (!main.includes('const HOLY_HOUR_CODES = {')) {
  main = main.replace(
    /function getSpecialTimeInfo\(fh, fm\)/,
    holyObj + '\n  function getSpecialTimeInfo(fh, fm)'
  );
}

// 3. Fix special-time-display click
main = main.replace(
  /if \(currentIsPast\) \{\s*\/\/ Trạng thái 😢:[\s\S]*?\}\s*\}\s*\n\s*\}\);/,
  `const fullTimeStr = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[code] ? HOLY_HOUR_CODES[code] : code + '00';
      autoFillSpecialTime(fullTimeStr);
      [txtDecrypted, txtEncrypted, txtCompressed].forEach(el => {
        if (!el) return;
        const prev = el.style.outline;
        el.style.outline = '2px solid #0f0';
        setTimeout(() => { el.style.outline = prev; }, 900);
      });

      const b60 = typeof timeToBase60 === 'function' ? timeToBase60(fullTimeStr) : (display.dataset.b60 || '');
      const timeFormatted = code.slice(0, 2) + ':' + code.slice(2, 4);
      const copyText = \`\${timeFormatted} \${b60}\`;
      navigator.clipboard.writeText(copyText).catch(()=>{});
      
      const prev = display.innerHTML;
      const prevBorder = display.style.borderColor;
      display.style.borderColor = '#fff';
      display.innerHTML = \`<span style="font-size:11px;color:#fff;font-weight:bold">✓ \${copyText}</span>\`;
      setTimeout(() => {
        display.innerHTML = prev;
        display.style.borderColor = prevBorder;
      }, 1200);
    });`
);

// 4. Fix showQuiz
main = main.replace(
  /btn\.style\.cssText = 'padding:3px 12px;font-size:13px;font-weight:bold;cursor:pointer;border:1px solid #0f0;color:#0f0;background:#000;border-radius:4px;font-family:monospace;transition:all 0\.15s;';/g,
  "btn.style.cssText = 'padding:3px 12px;font-size:13px;font-weight:bold;cursor:pointer;border:1px solid #0f0;color:#0f0;background:#000;border-radius:4px;font-family:monospace;transition:all 0.15s;text-transform:none;';"
);

main = main.replace(
  /if \(typeof logActivity === 'function'\) logActivity\(\{ type: 'quiz', time: timeCode, correct: isCorrect \}\);\s*if \(isCorrect\) \{\s*btn\.style\.background = '#003300'; btn\.style\.color = '#0f0';\s*const hStr = timeCode\.slice\(0,2\), mStr = timeCode\.slice\(2,4\);\s*autoFillSpecialTime\(parseInt\(hStr,10\), parseInt\(mStr,10\)\);\s*setTimeout\(\(\) => \{ if\(quizChoices\)\{quizChoices\.style\.display='none';quizChoices\.innerHTML='';\} \}, 1200\);\s*\}/,
  `if (typeof logActivity === 'function') logActivity({ type: 'quiz', time: timeCode, correct: isCorrect });
        
        if (typeof txtCompressed !== 'undefined' && txtCompressed) {
          txtCompressed.value = opt;
          if (typeof syncFromCompressed === 'function') syncFromCompressed();
          const fullTimeStr = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[timeCode] ? HOLY_HOUR_CODES[timeCode] : timeCode + '00';
          lastAutoFilledTime = fullTimeStr;
        }

        if (isCorrect) {
          btn.style.background = '#003300'; btn.style.color = '#0f0';
          setTimeout(() => { if(quizChoices){quizChoices.style.display='none';quizChoices.innerHTML='';} }, 1200);
        }`
);

fs.writeFileSync('main.js', main, 'utf8');

// ----- FIX INDEX.HTML -----
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  /<div id="sandbox-debug-container"[\s\S]*?<\/textarea>\s*<\/div>/,
  '<!-- Debug Sandbox Log Removed -->'
);
fs.writeFileSync('index.html', html, 'utf8');

console.log("Patch successfully applied!");
