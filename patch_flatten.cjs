const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('<div id="sandbox-top-left"');
const end = html.indexOf('<div id="sandbox-actions"');

if (start !== -1 && end !== -1) {
  const tlStart = html.indexOf('<div id="top-left-actions"');
  let tlEnd = tlStart;
  let depth = 1;
  while(depth > 0 && tlEnd < end) {
    tlEnd += 1;
    if (html.substring(tlEnd, tlEnd+4) === '<div') depth++;
    if (html.substring(tlEnd, tlEnd+5) === '</div') depth--;
  }
  const tlHTML = html.substring(tlStart, tlEnd + 6);
  
  const stStart = html.indexOf('<div id="special-time-display"');
  let stEnd = stStart;
  depth = 1;
  while(depth > 0 && stEnd < end) {
    stEnd += 1;
    if (html.substring(stEnd, stEnd+4) === '<div') depth++;
    if (html.substring(stEnd, stEnd+5) === '</div') depth--;
  }
  const stHTML = html.substring(stStart, stEnd + 6);
  
  const qcStart = html.indexOf('<div id="quiz-choices"');
  let qcEnd = qcStart;
  depth = 1;
  while(depth > 0 && qcEnd < end) {
    qcEnd += 1;
    if (html.substring(qcEnd, qcEnd+4) === '<div') depth++;
    if (html.substring(qcEnd, qcEnd+5) === '</div') depth--;
  }
  const qcHTML = html.substring(qcStart, qcEnd + 6);
  
  const newBlock = '<div id="sandbox-top-left" style="display: none; position: fixed; top: 10px; left: 10px; z-index: 9999; flex-direction: row; align-items: center; gap: 8px;">\n' +
                   '  ' + stHTML + '\n' +
                   '  ' + qcHTML + '\n' +
                   '  ' + tlHTML + '\n' +
                   '</div>\n      ';
                   
  html = html.substring(0, start) + newBlock + html.substring(end);
  fs.writeFileSync('index.html', html);
  console.log('Flattened correctly');
} else {
  console.log('Failed to find bounds');
}
