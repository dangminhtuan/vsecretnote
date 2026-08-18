const fs = require('fs');
const topContent = fs.readFileSync('new_data_top.js', 'utf8');
const oldData = fs.readFileSync('data.js', 'utf8');

// Find REAL_VIETNAMESE_WORDS
const idx = oldData.indexOf('export const REAL_VIETNAMESE_WORDS');
if (idx === -1) {
  console.log('Could not find REAL_VIETNAMESE_WORDS');
  process.exit(1);
}

const bottomContent = oldData.substring(idx);
fs.writeFileSync('data.js', topContent + '\n\n' + bottomContent, 'utf8');
console.log('Successfully spliced data.js');
