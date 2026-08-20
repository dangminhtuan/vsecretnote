const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /<div id="sandbox-top-left"[^>]*>[\s\S]*?<div style="display: flex; align-items: center; gap: 6px;">\s*(<div id="top-left-actions"[^>]*>[\s\S]*?<\/div>)\s*<\/div>\s*<div style="display: flex; align-items: center; gap: 6px;">\s*(<div id="special-time-display"[^>]*>[\s\S]*?<\/div>)\s*(<div id="quiz-choices"[^>]*>[\s\S]*?<\/div>)\s*<\/div>\s*<\/div>/;

const newStructure = `<div id="sandbox-top-left" style="display: none; position: fixed; top: 10px; left: 10px; z-index: 9999; flex-direction: column; align-items: flex-start; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          $2
          $1
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          $3
        </div>
      </div>`;

if(html.match(regex)) {
  html = html.replace(regex, newStructure);
  fs.writeFileSync('index.html', html);
  console.log('Fixed topbar rows exactly');
} else {
  console.log('Regex did not match!');
}
