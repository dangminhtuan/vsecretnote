const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /if \(typeof txtCompressed !== 'undefined' && txtCompressed\) \{[\s\S]*?lastAutoFilledTime = fullTimeStr;\s*\}/;

const newBlock = `if (typeof txtCompressed !== 'undefined' && txtCompressed) {
          txtCompressed.value = opt;
          if (typeof syncFromCompressed === 'function') syncFromCompressed();
          
          // Auto Copy to clipboard
          const timeValue = txtEncrypted ? txtEncrypted.value : (timeCode + '00');
          const copyStr = timeValue + " " + opt;
          navigator.clipboard.writeText(copyStr).then(() => {
            if (typeof showToast === 'function') showToast('Đã copy: ' + copyStr);
            else {
              const el = document.createElement('div');
              el.textContent = 'Đã copy: ' + copyStr;
              el.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0f0;color:#000;padding:10px;border-radius:4px;z-index:99999;font-weight:bold;font-family:monospace;';
              document.body.appendChild(el);
              setTimeout(()=>el.remove(), 2000);
            }
          });

          const fullTimeStr = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[timeCode] ? HOLY_HOUR_CODES[timeCode] : timeCode + '00';
          lastAutoFilledTime = fullTimeStr;
        }`;

if (code.match(regex)) {
  code = code.replace(regex, newBlock);
  fs.writeFileSync('main.js', code);
  console.log('Fixed showQuiz fill and copy data');
} else {
  console.log('Regex missed');
}
