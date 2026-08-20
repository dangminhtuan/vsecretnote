const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace Top Right Button
const btnRegex = /<button id="btn-copy-b60"[^>]*>[\s\S]*?<\/button>/;
const emptyBtn = '<button id="btn-copy-b60" class="cyber-btn" style="border-color: #555; color: #555; background: #000; cursor: not-allowed; padding: 4px 10px; letter-spacing: 1px; white-space: nowrap; line-height: 1.3; text-align: center;" disabled><span style="display:block;font-size:0.85em;">[ ]</span><span style="display:block;font-size:0.75em;">EMPTY</span></button>';
html = html.replace(btnRegex, emptyBtn);

// 2. Remove all action-btns blocks
html = html.replace(/<div class="action-btns">[\s\S]*?<\/div>\s*<\/div>/g, '</div>');

// 3. Add Continuous Box
const b60Box = `<!-- Compressed Base60 -->
            <div class="input-group compressed-group">
              <div class="label-row">
                <label for="compressed-input">COMPRESSED CODE [BASE60]</label>
              </div>
              <textarea id="compressed-input" placeholder="Mã nén siêu ngắn..." spellcheck="false"></textarea>
            </div>`;

const contBox = `

            <!-- Compressed Base60 Continuous -->
            <div class="input-group compressed-group">
              <div class="label-row">
                <label for="compressed-continuous-input">CONTINUOUS BASE60 [NO SPACE]</label>
              </div>
              <textarea id="compressed-continuous-input" placeholder="Mã nén liên tiếp (không khoảng trắng)..." spellcheck="false"></textarea>
            </div>`;

html = html.replace(b60Box, b60Box + contBox);

// 4. Add Context Menu Div
const contextMenu = `
    <!-- Floating Context Menu -->
    <div id="floating-context-menu" style="display: none; position: absolute; z-index: 10000; gap: 6px; background: rgba(0, 15, 0, 0.95); border: 1px solid #0f0; padding: 6px; border-radius: 4px; box-shadow: 0 0 15px rgba(0, 255, 0, 0.5); flex-direction: row; align-items: center;">
      <button id="ctx-copy" class="copy-btn" style="font-weight: bold;">[^C] COPY</button>
      <button id="ctx-clear" class="copy-btn clear-btn" style="font-weight: bold;">[DEL] CLR</button>
      <button id="ctx-full" class="copy-btn btn-fullscreen" style="font-weight: bold;">⤢ FULL</button>
      <button id="ctx-close" class="copy-btn clear-btn" style="border-color: #777; color: #777;">✕</button>
    </div>
`;
if (!html.includes('floating-context-menu')) {
  html = html.replace('</body>', contextMenu + '\n  </body>');
}

fs.writeFileSync('index.html', html);
console.log('index.html updated for context menu');
