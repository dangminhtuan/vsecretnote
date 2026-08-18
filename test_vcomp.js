import { encodeWord, decodeWord, timeToBase60, base60ToTime } from './vcomp.js';

const testWords = ['hôn', 'sướng', 'tôi', 'không', 'yêu', 'hello'];

for (const w of testWords) {
  const enc = encodeWord(w);
  const base60 = timeToBase60(enc);
  const dec = decodeWord(base60ToTime(base60));
  console.log(`${w} -> enc: ${enc} -> b60: ${base60} -> dec: ${dec} | pass: ${w === dec}`);
}
