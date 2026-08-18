import { REAL_VIETNAMESE_WORDS } from './data.js';
import { encodeWord, removeVietnameseTones } from './vcomp.js';

const missingRhymes = new Set();
const failedWords = [];

for (const w of REAL_VIETNAMESE_WORDS) {
  const enc = encodeWord(w);
  if (enc.startsWith('[')) {
    failedWords.push(w);
    const [cleanWord] = removeVietnameseTones(w.toLowerCase());
    
    // basic phonetics extraction to find the missing rhyme
    let consonant = '';
    let rhyme = cleanWord;
    const allCons = ['ch', 'gh', 'gi', 'kh', 'ngh', 'ng', 'nh', 'ph', 'qu', 'th', 'tr', 'c', 'đ', 'd', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x'];
    for (const c of allCons) {
      if (cleanWord.startsWith(c)) {
        consonant = c;
        rhyme = cleanWord.substring(c.length);
        break;
      }
    }
    if (consonant === 'gi') {
      if (rhyme === '') rhyme = 'i';
      else if (rhyme.startsWith('ê')) rhyme = 'i' + rhyme;
      else if (!/^[aăâeêioôơuưy]/.test(rhyme)) rhyme = 'i' + rhyme;
    }
    missingRhymes.add(rhyme);
  }
}

console.log(`Failed words: ${failedWords.length}`);
console.log(`Missing rhymes:`, Array.from(missingRhymes).sort());
