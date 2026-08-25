import { CONSONANTS_BASE, CONSONANTS_EXTRA, RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2, ENGLISH_DICT } from './data.js';

let count = 0;
for (let tone=0; tone<6; tone++) {
  // Base
  for (let c=0; c<CONSONANTS_BASE.length; c++) {
    for (let r=0; r<RHYMES_BASE.length; r++) { count++; }
    for (let r=0; r<RHYMES_EXTRA_1.length; r++) { count++; }
    for (let r=0; r<RHYMES_EXTRA_2.length; r++) { count++; }
  }
  // Extra
  for (let c=0; c<CONSONANTS_EXTRA.length; c++) {
    for (let r=0; r<RHYMES_BASE.length; r++) { count++; }
    for (let r=0; r<RHYMES_EXTRA_1.length; r++) { count++; }
    for (let r=0; r<RHYMES_EXTRA_2.length; r++) { count++; }
  }
}
console.log("Viet combinations:", count);
console.log("Eng dictionary:", ENGLISH_DICT.length);
console.log("Total valid ligatures needed:", count + ENGLISH_DICT.length);
