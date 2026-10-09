import fs from 'fs';
const html = fs.readFileSync('./vcomp-169-rhymes.html', 'utf8');
const counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
const matches = [...html.matchAll(/<td class="td-a1">([0-9a-z]{3})<\/td>/g)];
console.log('Total a1 codes found:', matches.length);
matches.forEach(m => {
  const c1 = m[1][0];
  if (counts[c1] !== undefined) counts[c1]++;
});
console.log('Phụ âm số 1..5:');
console.log('1 (th):', counts['1']);
console.log('2 (ch):', counts['2']);
console.log('3 (tr):', counts['3']);
console.log('4 (nh):', counts['4']);
console.log('5 (ng):', counts['5']);

const allC1 = {};
matches.forEach(m => {
  const c1 = m[1][0];
  allC1[c1] = (allC1[c1] || 0) + 1;
});
console.log('Toàn bộ c1:', allC1);
