import { CONSONANTS_BASE, CONSONANTS_EXTRA } from './data.js';
import { removeVietnameseTones } from './vcomp.js';

const allConsonants = [...new Set([...CONSONANTS_BASE, ...CONSONANTS_EXTRA].filter(c => c !== null))].sort((a,b) => b.length - a.length);

function getPhonetics(word) {
  const [cleanWord, tone] = removeVietnameseTones(word.toLowerCase());
  let consonant = '';
  let rhyme = cleanWord;
  for (const c of allConsonants) {
    if (cleanWord.startsWith(c)) {
      consonant = c;
      rhyme = cleanWord.substring(c.length);
      break;
    }
  }
  return { consonant, rhyme, tone };
}

console.log('và:', getPhonetics('và'));
console.log('của:', getPhonetics('của'));
