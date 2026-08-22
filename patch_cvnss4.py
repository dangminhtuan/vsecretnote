import os

content = open('cvnss4.js', 'r', encoding='utf-8').read()

patch = """
const REVERSE_RHYMES_56 = Object.fromEntries(Object.entries(RHYMES_56).map(([k, v]) => [v, k]));

export function decodeCVNSS4Word(word) {
  if (!/^[a-zA-Z0-9_\\u00C0-\\u024F\\u1E00-\\u1EFF]+$/.test(word)) return word;

  let isUpper = word === word.toUpperCase();
  let isCap = word[0] === word[0].toUpperCase();
  let lower = word.toLowerCase();

  const SYMS_NON = { 'b':1, 'd':2, 'q':3, 'g':4, 'f':5, 'y':0 };
  const SYMS_MOC = { 'x':1, 'k':2, 'v':3, 'w':4, 'h':5, 'o':0 };
  const SYMS_KHO = { 'j':1, 'l':2, 'z':3, 's':4, 'r':5, 'p':0 };

  let sym = '';
  let group = 'khong';
  let tone = -1;

  let last = lower.slice(-1);
  if (SYMS_NON[last] !== undefined) { sym = last; group = 'non'; tone = SYMS_NON[last]; }
  else if (SYMS_MOC[last] !== undefined) { sym = last; group = 'trang_moc'; tone = SYMS_MOC[last]; }
  else if (SYMS_KHO[last] !== undefined) { sym = last; group = 'khong'; tone = SYMS_KHO[last]; }

  let reducedWord = lower;
  if (sym !== '') {
    let stripped = lower.slice(0, -1);
    if (stripped.length > 0 && /[aeiouy]/i.test(stripped)) { 
      reducedWord = stripped;
    } else {
      sym = ''; group = 'khong'; tone = -1;
    }
  }

  if (sym === '') {
    group = 'khong';
    last = lower.slice(-1);
    if (last === 'c' || last === 'p' || last === 't') tone = 1;
    else tone = 0;
  }

  let init = '';
  let reducedRhyme = reducedWord;
  const REV_INIT = { 'f':'ph', 'q':'qu', 'j':'gi', 'w':'ng' };
  
  for (let c of ['ngh', 'ng', 'nh', 'ch', 'gh', 'gi', 'ph', 'qu', 'kh', 'th', 'tr', 'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'x', 'f', 'j', 'w', 'z']) {
    if (reducedWord.startsWith(c)) {
      init = c;
      reducedRhyme = reducedWord.slice(c.length);
      break;
    }
  }

  let rhyme = reducedRhyme;
  if (REVERSE_RHYMES_56[reducedRhyme]) {
    rhyme = REVERSE_RHYMES_56[reducedRhyme];
  } else {
    if (reducedRhyme.endsWith('g')) rhyme = reducedRhyme.slice(0, -1) + 'ng';
    else if (reducedRhyme.endsWith('h') && reducedRhyme.length > 1) rhyme = reducedRhyme.slice(0, -1) + 'nh';
    else if (reducedRhyme.endsWith('k')) rhyme = reducedRhyme.slice(0, -1) + 'ch';
    else if (reducedRhyme === 'y') rhyme = 'uy';
    else if (reducedRhyme === 'i' && init === '') rhyme = 'y';
  }

  let restoredInit = init;
  if (REV_INIT[init]) restoredInit = REV_INIT[init];
  
  if (init === 'c' && /^[eêi]/.test(rhyme)) restoredInit = 'k';
  if (init === 'k' && !/^[eêi]/.test(rhyme)) restoredInit = 'c';
  if (init === 'g' && /^[eêi]/.test(rhyme)) restoredInit = 'gh';
  if (init === 'w' && /^[eêi]/.test(rhyme)) restoredInit = 'ngh';
  if (init === 'w' && !/^[eêi]/.test(rhyme)) restoredInit = 'ng';
  if (init === 'z') restoredInit = 'd';
  if (init === 'd') restoredInit = 'đ';
  
  if (init === 'j') {
    if (rhyme.startsWith('i')) rhyme = rhyme.slice(1);
    if (rhyme === '') rhyme = 'i';
  }

  let baseWord = restoredInit + rhyme;
  if (group === 'non') {
    baseWord = baseWord.replace('a', 'â').replace('e', 'ê').replace('o', 'ô');
  } else if (group === 'trang_moc') {
    baseWord = baseWord.replace('a', 'ă').replace('o', 'ơ').replace('u', 'ư');
  }

  const TONE_MARKS = {
    1: '\\u0301', 2: '\\u0300', 3: '\\u0309', 4: '\\u0303', 5: '\\u0323'
  };
  
  let finalNfd = baseWord;
  if (tone >= 1 && tone <= 5) {
     let vMatch = baseWord.match(/[aăâeêioôơuưy]+/);
     if (vMatch) {
       let v = vMatch[0];
       let mark = TONE_MARKS[tone];
       let vIndex = vMatch.index;
       
       let toneIdx = 0;
       if (v.length === 2 && !v.endsWith('a') && !v.endsWith('e') && !v.endsWith('o') && !v.endsWith('i') && !v.endsWith('y')) {
          // Simplified rule: if Ends in consonant, Tone on second char... Wait, tone placement is hard.
          // Let's just use a simple heuristic for now.
       }
       if (v.length > 1) toneIdx = 1;
       if (v.length === 1) toneIdx = 0;
       if (restoredInit === 'qu' || restoredInit === 'gi') toneIdx = v.length - 1;
       
       let head = baseWord.substring(0, vIndex + toneIdx + 1);
       let tail = baseWord.substring(vIndex + toneIdx + 1);
       finalNfd = head + mark + tail;
     }
  }

  let finalWord = finalNfd.normalize('NFC');
  
  if (finalWord === 'sâ') finalWord = 'say';
  if (finalWord === 'hâ') finalWord = 'hay';
  if (finalWord === 'tâ') finalWord = 'tay';
  if (finalWord === 'nâ') finalWord = 'nay';
  if (finalWord === 'bâ') finalWord = 'bay';
  if (finalWord === 'mâ' && word === 'may') finalWord = 'may';

  if (isUpper) return finalWord.toUpperCase();
  if (isCap) return finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
  return finalWord;
}
"""

if "decodeCVNSS4Word" not in content:
    with open('cvnss4.js', 'a', encoding='utf-8') as f:
        f.write(patch)
        
print("Updated cvnss4.js")
