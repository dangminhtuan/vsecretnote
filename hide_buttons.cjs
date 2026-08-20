const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Hide btn-sandbox-hashtag
const hashOld = `id="btn-sandbox-hashtag" class="cyber-btn" style="border-color: #0f0; color: #0f0; background: #000; cursor: pointer; font-size: 16px; font-weight: bold; width: 36px; height: 36px; border-radius: 5px; display: flex;`;
const hashNew = `id="btn-sandbox-hashtag" class="cyber-btn" style="display: none !important; border-color: #0f0; color: #0f0; background: #000; cursor: pointer; font-size: 16px; font-weight: bold; width: 36px; height: 36px; border-radius: 5px;`;
if (code.includes(hashOld)) {
  code = code.replace(hashOld, hashNew);
} else {
  // Try regex if spacing differs
  code = code.replace(/id="btn-sandbox-hashtag"([^>]+)style="([^"]+)"/g, 'id="btn-sandbox-hashtag"$1style="display: none !important; $2"');
}

// Hide btn-copy-b60
code = code.replace(/id="btn-copy-b60"([^>]+)style="([^"]+)"/g, 'id="btn-copy-b60"$1style="display: none !important; $2"');

fs.writeFileSync('index.html', code);
console.log('Hidden # and EMPTY buttons in index.html');
