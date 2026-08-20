const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const startTag = '<!-- Text Decrypted -->';
const endTag = '<!-- Debug Sandbox Log -->';
const startIdx = html.indexOf(startTag);
const endIdx = html.indexOf(endTag);

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find bounds');
  process.exit(1);
}

const newHtmlBlock = `<!-- Text Decrypted -->
          <div class="input-group">
            <div class="label-row"><label for="text-input">TIẾNG VIỆT (GỐC)</label></div>
            <div style="display: flex; gap: 8px; align-items: stretch; margin-top: 6px;">
              <textarea id="text-input" placeholder="Nhập văn bản cần mã hóa..." spellcheck="false" style="flex: 1; margin: 0;"></textarea>
              <div style="display: flex; flex-direction: column; gap: 4px; width: 100px;">
                <button id="btn-copy-text" class="copy-btn" style="flex: 1; font-weight: bold; font-size: 0.8rem; background: rgba(0,255,0,0.1);">COPY GỐC</button>
                <div style="display: flex; gap: 4px; height: 24px;">
                  <button id="btn-clear-text" class="copy-btn clear-btn" style="flex: 1; font-size: 0.7rem;">CLR</button>
                  <button class="copy-btn btn-fullscreen" style="flex: 1; font-size: 0.8rem;" onclick="toggleFullscreen(this)">⤢</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="controls">
            <button id="btn-encode" class="cyber-btn"><span class="btn-text">ENCODE &darr;</span></button>
            <button id="btn-decode" class="cyber-btn"><span class="btn-text">DECODE &uarr;</span></button>
          </div>

          <!-- Compressed Base60 -->
          <div class="input-group compressed-group">
            <div class="label-row"><label for="compressed-input">COMPRESSED CODE [BASE60]</label></div>
            <div style="display: flex; gap: 8px; align-items: stretch; margin-top: 6px;">
              <textarea id="compressed-input" placeholder="Mã nén siêu ngắn..." spellcheck="false" style="flex: 1; margin: 0;"></textarea>
              <div style="display: flex; flex-direction: column; gap: 4px; width: 100px;">
                <button id="btn-copy-compressed" class="copy-btn" style="flex: 1; font-weight: bold; font-size: 0.8rem; background: rgba(0,255,0,0.1);">COPY B60</button>
                <div style="display: flex; gap: 4px; height: 24px;">
                  <button id="btn-clear-compressed" class="copy-btn clear-btn" style="flex: 1; font-size: 0.7rem;">CLR</button>
                  <button class="copy-btn btn-fullscreen" style="flex: 1; font-size: 0.8rem;" onclick="toggleFullscreen(this)">⤢</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Compressed Base60 Continuous -->
          <div class="input-group compressed-group">
            <div class="label-row"><label for="compressed-continuous-input">CONTINUOUS BASE60 [NO SPACE]</label></div>
            <div style="display: flex; gap: 8px; align-items: stretch; margin-top: 6px;">
              <textarea id="compressed-continuous-input" placeholder="Mã nén liên tiếp (không khoảng trắng)..." spellcheck="false" style="flex: 1; margin: 0;"></textarea>
              <div style="display: flex; flex-direction: column; gap: 4px; width: 100px;">
                <button id="btn-copy-continuous" class="copy-btn" style="flex: 1; font-weight: bold; font-size: 0.8rem; background: rgba(0,255,0,0.1);">COPY LIỀN</button>
                <div style="display: flex; gap: 4px; height: 24px;">
                  <button id="btn-clear-continuous" class="copy-btn clear-btn" style="flex: 1; font-size: 0.7rem;">CLR</button>
                  <button class="copy-btn btn-fullscreen" style="flex: 1; font-size: 0.8rem;" onclick="toggleFullscreen(this)">⤢</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Mã giả Việt -->
          <div class="input-group">
            <div class="label-row"><label for="fake-viet-input">FAKE VIETNAMESE (MÃ GIẢ)</label></div>
            <div style="display: flex; gap: 8px; align-items: stretch; margin-top: 6px;">
              <textarea id="fake-viet-input" placeholder="Mã giả Tiếng Việt..." spellcheck="false" style="flex: 1; margin: 0;"></textarea>
              <div style="display: flex; flex-direction: column; gap: 4px; width: 100px;">
                <button id="btn-copy-fake" class="copy-btn" style="flex: 1; font-weight: bold; font-size: 0.8rem; background: rgba(0,255,0,0.1);">COPY MÃ GIẢ</button>
                <div style="display: flex; gap: 4px; height: 24px;">
                  <button id="btn-clear-fake" class="copy-btn clear-btn" style="flex: 1; font-size: 0.7rem;">CLR</button>
                  <button class="copy-btn btn-fullscreen" style="flex: 1; font-size: 0.8rem;" onclick="toggleFullscreen(this)">⤢</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Time Cypher -->
          <div class="input-group">
            <div class="label-row"><label for="time-input">TIME ENCRYPTED [HHMMSS]</label></div>
            <div style="display: flex; gap: 8px; align-items: stretch; margin-top: 6px;">
              <textarea id="time-input" placeholder="Mã thời gian 6 chữ số..." spellcheck="false" style="flex: 1; margin: 0;"></textarea>
              <div style="display: flex; flex-direction: column; gap: 4px; width: 100px;">
                <button id="btn-copy-time" class="copy-btn" style="flex: 1; font-weight: bold; font-size: 0.8rem; background: rgba(0,255,0,0.1);">COPY 6 SỐ</button>
                <div style="display: flex; gap: 4px; height: 24px;">
                  <button id="btn-clear-time" class="copy-btn clear-btn" style="flex: 1; font-size: 0.7rem;">CLR</button>
                  <button class="copy-btn btn-fullscreen" style="flex: 1; font-size: 0.8rem;" onclick="toggleFullscreen(this)">⤢</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Time Cypher 5 Digits -->
          <div class="input-group">
            <div class="label-row"><label for="time-5-input">TIME ENCRYPTED [SSSSS]</label></div>
            <div style="display: flex; gap: 8px; align-items: stretch; margin-top: 6px;">
              <textarea id="time-5-input" placeholder="Mã thời gian 5 chữ số..." spellcheck="false" style="flex: 1; margin: 0;"></textarea>
              <div style="display: flex; flex-direction: column; gap: 4px; width: 100px;">
                <button id="btn-copy-time5" class="copy-btn" style="flex: 1; font-weight: bold; font-size: 0.8rem; background: rgba(0,255,0,0.1);">COPY 5 SỐ</button>
                <div style="display: flex; gap: 4px; height: 24px;">
                  <button id="btn-clear-time5" class="copy-btn clear-btn" style="flex: 1; font-size: 0.7rem;">CLR</button>
                  <button class="copy-btn btn-fullscreen" style="flex: 1; font-size: 0.8rem;" onclick="toggleFullscreen(this)">⤢</button>
                </div>
              </div>
            </div>
          </div>

          `;

const finalHtml = html.substring(0, startIdx) + newHtmlBlock + html.substring(endIdx);
fs.writeFileSync('index.html', finalHtml);

// Fix the btn-copy-b60 button to empty
let newCode = fs.readFileSync('index.html', 'utf8');
const btnRegex = /<button id="btn-copy-b60"[^>]*>[\s\S]*?<\/button>/;
const emptyBtn = '<button id="btn-copy-b60" class="cyber-btn" style="border-color: #555; color: #555; background: #000; cursor: not-allowed; padding: 4px 10px; letter-spacing: 1px; white-space: nowrap; line-height: 1.3; text-align: center;" disabled><span style="display:block;font-size:0.85em;">[ ]</span><span style="display:block;font-size:0.75em;">EMPTY</span></button>';
newCode = newCode.replace(btnRegex, emptyBtn);
fs.writeFileSync('index.html', newCode);

console.log('Fixed index.html structure');
