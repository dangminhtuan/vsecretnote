const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The current HTML block looks like this:
/*
        <div style="display: flex; align-items: center; gap: 6px;">
          <div id="top-left-actions" ...>...</div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div id="special-time-display" ...></div>
          <div id="quiz-choices" ...></div>
        </div>
*/
// We need to move special-time-display back to the first row BEFORE top-left-actions.

html = html.replace(
  /<div style="display: flex; align-items: center; gap: 6px;">\s*(<div id="top-left-actions"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)\s*<\/div>\s*<div style="display: flex; align-items: center; gap: 6px;">\s*(<div id="special-time-display"[\s\S]*?<\/div>)\s*(<div id="quiz-choices"[\s\S]*?<\/div>)\s*<\/div>/,
  `<div style="display: flex; align-items: center; gap: 6px;">
          $2
          $1
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          $3
        </div>`
);

// Fallback if regex misses:
if (!html.includes('$2')) { // simple check to see if it replaced correctly. Wait, it would output '$2' literally if replaced with a bad string but regex replace doesn't do that unless we use raw string.
    fs.writeFileSync('index.html', html);
}
