const fs = require('fs');
const content = fs.readFileSync('keyboard-grid.html', 'utf8');

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const defined = [];
alphabet.forEach(char => {
  const reg = new RegExp(`'${char}':\\s*\\{`, 'g');
  if (reg.test(content)) defined.push(char);
});

const missing = alphabet.filter(c => !defined.includes(c));
console.log('Defined keys:', defined.join(', '));
console.log('MISSING KEYS:', missing.join(', '));
