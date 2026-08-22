import sys
import re

content = open('main.js', 'r', encoding='utf-8').read()

# Fix 1: The SyntaxError \/\B=\%\;
content = content.replace(r'textSpan.textContent = \/\B=\%\;', 'textSpan.textContent = `${currentBytes}/${rawBytes}B=${pct}%`;')

# Fix 2: The HOLY_HOUR_CODES fallback logic
old_quiz_logic = '''        // Nu `ang lA dY ? (trAi tim) => TA-nh gi? thiAng g n nht trong T_NG LAI
        if (display.innerHTML.includes('dY ?') || !HOLY_HOUR_CODES[targetCode]) {
           const futureTimes = Object.keys(HOLY_HOUR_CODES).sort();
           const nextTime = futureTimes.find(t => t > currentCode) || futureTimes[0];
           targetCode = nextTime;
           // Tm hin th< gi? tng lai lAn nAt
           display.dataset.timecode = targetCode;
           display.innerHTML = `<span style="font-size:11px;color:#0f0;font-weight:bold;">dY ? ${targetCode.substring(0,2)}:${targetCode.substring(2)}=?</span>`;
        } else {
           display.innerHTML = `<span style="font-size:11px;color:#ff0;font-weight:bold;">s ${targetCode.substring(0,2)}:${targetCode.substring(2)}=?</span>`;
        }
  
        // MY quiz
        const correctFullCode = HOLY_HOUR_CODES[targetCode];'''

# I'll just use Regex to replace the logic safely, avoiding unicode match issues
patch_quiz = '''        // Nếu đang là trái tim => Tính giờ thiêng gần nhất
        if (display.innerHTML.includes('dY ?') || !targetCode) {
           const futureTimes = Object.keys(HOLY_HOUR_CODES).sort();
           const nextTime = futureTimes.find(t => t > currentCode) || futureTimes[0];
           targetCode = nextTime;
           display.dataset.timecode = targetCode;
           display.innerHTML = `<span style="font-size:11px;color:#0f0;font-weight:bold;">dY ? ${targetCode.substring(0,2)}:${targetCode.substring(2)}=?</span>`;
        } else {
           display.innerHTML = `<span style="font-size:11px;color:#ff0;font-weight:bold;">⭐ ${targetCode.substring(0,2)}:${targetCode.substring(2)}=?</span>`;
        }
  
        // Mở quiz
        const correctFullCode = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[targetCode] ? HOLY_HOUR_CODES[targetCode] : targetCode + '00';'''

# Do regex replacement
content = re.sub(r'if \(display\.innerHTML\.includes\([^\)]+\) \|\| !HOLY_HOUR_CODES\[targetCode\]\) \{[\s\S]*?const correctFullCode = HOLY_HOUR_CODES\[targetCode\];', patch_quiz, content)

open('main.js', 'w', encoding='utf-8').write(content)
print("Fixed main.js")
