const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const badButtonStr = '<button id="btn-copy-b60" class="cyber-btn" style="border-color: #0f0; color: #0f0; background: #000; cursor: pointer; padding: 4px 10px; letter-spacing: 1px; white-space: nowrap; line-height: 1.3; font-weight: bold; font-family: monospace;">[^C] TEXT</button>';
const goodButtonStr = '<button id="btn-copy-b60" class="cyber-btn" style="border-color: #0f0; color: #0f0; background: #000; cursor: pointer; padding: 4px 10px; letter-spacing: 1px; white-space: nowrap; line-height: 1.3; text-align: center;"><span style="display:block;font-size:0.85em;">[^C]</span><span style="display:block;font-size:0.75em;">TEXT</span></button>';

if (html.includes(badButtonStr)) {
  html = html.replace(badButtonStr, goodButtonStr);
  fs.writeFileSync('index.html', html);
  console.log('Fixed button style');
} else {
  console.log('Button string not found. Trying regex.');
  const regex = /<button id="btn-copy-b60"[^>]*>\[\^C\] TEXT<\/button>/;
  if (html.match(regex)) {
    html = html.replace(regex, goodButtonStr);
    fs.writeFileSync('index.html', html);
    console.log('Fixed button style via regex');
  }
}
