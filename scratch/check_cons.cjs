const fs = require('fs');
const content = fs.readFileSync('keyboard-grid.html', 'utf8');

const regex = /'([a-z0-9])':\s*\{/g;
let m;
const keys = [];
while ((m = regex.exec(content)) !== null) {
  keys.push(m[1]);
}
console.log('Keys in KEY_NEIGHBORS:', keys.join(', '));
