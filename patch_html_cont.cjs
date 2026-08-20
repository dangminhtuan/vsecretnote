const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /(<textarea id="compressed-input"[^>]*><\/textarea>\s*<\/div>)/;
if (html.match(regex)) {
  const continuousBox = `
          <!-- Compressed Base60 Continuous -->
          <div class="input-group compressed-group">
            <div class="label-row">
              <label for="compressed-continuous-input">CONTINUOUS BASE60 [NO SPACE]</label>
            </div>
            <textarea id="compressed-continuous-input" placeholder="Mã nén liên tiếp (không khoảng trắng)..." spellcheck="false"></textarea>
          </div>
  `;
  html = html.replace(regex, "$1\n" + continuousBox);
  fs.writeFileSync('index.html', html);
  console.log('Injected continuous box successfully');
} else {
  console.log('Regex did not match!');
}
