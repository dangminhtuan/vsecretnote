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
            <div class="label-row">
              <label for="text-input">TIẾNG VIỆT (GỐC)</label>
              <div class="action-btns">
                <button id="btn-copy-text" class="copy-btn">[^C] TEXT</button>
                <button id="btn-clear-text" class="copy-btn clear-btn">[DEL]</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⤢</button>
              </div>
            </div>
            <textarea id="text-input" placeholder="Nhập văn bản cần mã hóa..." spellcheck="false"></textarea>
          </div>
          
          <div class="controls">
            <button id="btn-encode" class="cyber-btn"><span class="btn-text">ENCODE &darr;</span></button>
            <button id="btn-decode" class="cyber-btn"><span class="btn-text">DECODE &uarr;</span></button>
          </div>

          <!-- Compressed Base60 -->
          <div class="input-group compressed-group">
            <div class="label-row">
              <label for="compressed-input">COMPRESSED CODE [BASE60]</label>
              <div class="action-btns">
                <button id="btn-copy-compressed" class="copy-btn">[^C] B60</button>
                <button id="btn-clear-compressed" class="copy-btn clear-btn">[DEL]</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⤢</button>
              </div>
            </div>
            <textarea id="compressed-input" placeholder="Mã nén siêu ngắn..." spellcheck="false"></textarea>
          </div>

          <!-- Compressed Base60 Continuous -->
          <div class="input-group compressed-group">
            <div class="label-row">
              <label for="compressed-continuous-input">CONTINUOUS BASE60 [NO SPACE]</label>
              <div class="action-btns">
                <button id="btn-copy-continuous" class="copy-btn">[^C] LIỀN</button>
                <button id="btn-clear-continuous" class="copy-btn clear-btn">[DEL]</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⤢</button>
              </div>
            </div>
            <textarea id="compressed-continuous-input" placeholder="Mã nén liên tiếp (không khoảng trắng)..." spellcheck="false"></textarea>
          </div>

          <!-- Mã giả Việt -->
          <div class="input-group">
            <div class="label-row">
              <label for="fake-viet-input">FAKE VIETNAMESE (MÃ GIẢ)</label>
              <div class="action-btns">
                <button id="btn-copy-fake" class="copy-btn">[^C] M.GIẢ</button>
                <button id="btn-clear-fake" class="copy-btn clear-btn">[DEL]</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⤢</button>
              </div>
            </div>
            <textarea id="fake-viet-input" placeholder="Mã giả Tiếng Việt..." spellcheck="false"></textarea>
          </div>

          <!-- Time Cypher -->
          <div class="input-group">
            <div class="label-row">
              <label for="time-input">TIME ENCRYPTED [HHMMSS]</label>
              <div class="action-btns">
                <button id="btn-copy-time" class="copy-btn">[^C] 6-SỐ</button>
                <button id="btn-clear-time" class="copy-btn clear-btn">[DEL]</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⤢</button>
              </div>
            </div>
            <textarea id="time-input" placeholder="Mã thời gian 6 chữ số..." spellcheck="false"></textarea>
          </div>

          <!-- Time Cypher 5 Digits -->
          <div class="input-group">
            <div class="label-row">
              <label for="time-5-input">TIME ENCRYPTED [SSSSS]</label>
              <div class="action-btns">
                <button id="btn-copy-time5" class="copy-btn">[^C] 5-SỐ</button>
                <button id="btn-clear-time5" class="copy-btn clear-btn">[DEL]</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⤢</button>
              </div>
            </div>
            <textarea id="time-5-input" placeholder="Mã thời gian 5 chữ số..." spellcheck="false"></textarea>
          </div>

          `;

const finalHtml = html.substring(0, startIdx) + newHtmlBlock + html.substring(endIdx);
fs.writeFileSync('index.html', finalHtml);
console.log('Restored layout structure horizontally');
