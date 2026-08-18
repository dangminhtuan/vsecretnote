import { decodeWord } from './vcomp.js';

const pool = ['0000','1111','2222','0101','1212','2323','0202','0303','0404','0505','0606','0707','0808','0909','1010','1313','1414','1515','1616','1717','1818','1919','2020','2121','0123','1234','2345','2332'];

for (const code of pool) {
  let found = [];
  for (let ss = 0; ss < 60; ss++) {
    const timeStr = code + ss.toString().padStart(2, '0');
    const word = decodeWord(timeStr);
    if (!word.startsWith('[') && !word.includes('?')) {
      found.push(`${timeStr}: ${word}`);
    }
  }
  console.log(`--- ${code} ---`);
  console.log(found.join(', '));
}
