const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// I want to separate top-left-actions from special-time-display and quiz-choices.
// Right now they are inside the same <div style="display: flex; align-items: center; gap: 6px;">

// Replace:
// <div id="special-time-display" ...></div>
// <div id="top-left-actions" ...>...</div>
// <div id="quiz-choices" ...></div>

const specialTimeRegex = /(<div id="special-time-display"[\s\S]*?<\/div>)/;
const topLeftActionsRegex = /(<div id="top-left-actions"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/; 
// Actually, it's safer to just move top-left-actions out of the inner div.

let updatedHtml = html.replace(
  /<div style="display: flex; align-items: center; gap: 6px;">\s*(<div id="special-time-display"[\s\S]*?<\/div>)\s*(<div id="top-left-actions"[\s\S]*?<\/div>)\s*(<div id="quiz-choices"[\s\S]*?<\/div>)\s*<\/div>/,
  `<div style="display: flex; align-items: center; gap: 6px;">
          $2
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          $1
          $3
        </div>`
);

fs.writeFileSync('index.html', updatedHtml);
console.log('Fixed topbar layout');
