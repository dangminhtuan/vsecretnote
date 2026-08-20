const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Disable top right button
html = html.replace(/<button id="btn-copy-b60"[^>]*>[\s\S]*?<\/button>/, '<button id="btn-copy-b60" class="cyber-btn" style="border-color: #555; color: #555; background: #000; cursor: not-allowed; padding: 4px 10px; letter-spacing: 1px; white-space: nowrap; line-height: 1.3; text-align: center;" disabled><span style="display:block;font-size:0.85em;">[ ]</span><span style="display:block;font-size:0.75em;">EMPTY</span></button>');

const inputs = [
  { id: 'text-input', labelStr: 'TIẾNG VIỆT (GỐC)', copyName: 'COPY GỐC' },
  { id: 'compressed-input', labelStr: 'COMPRESSED CODE [BASE60]', copyName: 'COPY B60' },
  { id: 'compressed-continuous-input', labelStr: 'CONTINUOUS BASE60 [NO SPACE]', copyName: 'COPY LIỀN' },
  { id: 'fake-viet-input', labelStr: 'FAKE VIETNAMESE (MÃ GIẢ)', copyName: 'COPY MÃ GIẢ' },
  { id: 'time-input', labelStr: 'TIME CYPHER [6-DIGITS]', copyName: 'COPY 6 SỐ' },
  { id: 'time-5-input', labelStr: 'TIME CYPHER [5-DIGITS]', copyName: 'COPY 5 SỐ' }
];

for (let input of inputs) {
  // Find the block: <div class="input-group"[^>]*> ... <textarea id="id" ...></textarea> ... </div>
  // Because it's hard to parse HTML with regex, we can replace the label-row and the textarea.
  
  // 1. Remove the old action-btns from label-row
  const regexLabelRow = new RegExp(`<div class="label-row">[\\s\\S]*?<label for="${input.id}">[\\s\\S]*?</label>[\\s\\S]*?<div class="action-btns">[\\s\\S]*?</div>[\\s\\S]*?</div>`);
  html = html.replace(regexLabelRow, `<div class="label-row"><label for="${input.id}">${input.labelStr}</label></div>`);
  
  // 2. Wrap the textarea and the new action buttons
  const regexTextarea = new RegExp(`(<textarea id="${input.id}"[\\s\\S]*?></textarea>)`);
  const replaceStr = `<div style="display: flex; gap: 8px; align-items: stretch; margin-top: 6px;">
              $1
              <div style="display: flex; flex-direction: column; gap: 4px; width: 100px;">
                <button id="btn-copy-${input.id.replace('-input', '')}" class="copy-btn" style="flex: 1; font-weight: bold; letter-spacing: 0.5px; font-size: 0.8rem; background: rgba(0,255,0,0.1);">${input.copyName}</button>
                <div style="display: flex; gap: 4px; height: 24px;">
                  <button id="btn-clear-${input.id.replace('-input', '')}" class="copy-btn clear-btn" style="flex: 1; font-size: 0.7rem;">CLR</button>
                  <button class="copy-btn btn-fullscreen" style="flex: 1; font-size: 0.8rem;" onclick="toggleFullscreen(this)">⤢</button>
                </div>
              </div>
            </div>`;
  html = html.replace(regexTextarea, replaceStr);
}

// Fix mismatched IDs since my loop above created btn-copy-text, btn-clear-text
// Actually, in the original code, the IDs were:
// text: btn-copy-text, btn-clear-text
// compressed: btn-copy-compressed, btn-clear-compressed
// continuous: btn-copy-compressed-continuous -> wait, the id in JS is btn-copy-continuous!
html = html.replace('btn-copy-compressed-continuous', 'btn-copy-continuous');
html = html.replace('btn-clear-compressed-continuous', 'btn-clear-continuous');

// Write back
fs.writeFileSync('index.html', html);
console.log('index.html layout redesigned');
