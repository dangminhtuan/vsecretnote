import { base60ToTime, decodeWord, BASE60_SS } from './vcomp.js';

let validCount = 0;
for (let i=0; i<60; i++) {
  for (let j=0; j<60; j++) {
    for (let k=0; k<60; k++) {
       let b60 = BASE60_SS[i] + BASE60_SS[j] + BASE60_SS[k];
       let word = decodeWord(base60ToTime(b60));
       if (word && !word.startsWith('[')) {
          validCount++;
       }
    }
  }
}
console.log("Valid Base60 combinations:", validCount);
