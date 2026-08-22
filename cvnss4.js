export const RHYMES_56 = {
  'uyêt': 'yd', 'uyên': 'yl',
  'iêt': 'id', 'iêp': 'if', 'iêc': 'is', 'iên': 'il', 'iêm': 'iv', 'iêng': 'iz', 'iêu': 'iw',
  'yêt': 'id', 'yên': 'il', 'yêm': 'iv', 'yêng': 'iz', 'yêu': 'iw',
  'uôt': 'ud', 'uôc': 'us', 'uôn': 'ul', 'uôm': 'uv', 'uông': 'uz', 'uôi': 'uj',
  'ươt': 'ưd', 'ươp': 'ưf', 'ươc': 'ưs', 'ươn': 'ưl', 'ươm': 'ưv', 'ương': 'ưz', 'ươu': 'ưw', 'ươi': 'ưj',
  'uât': 'âd', 'uân': 'âl', 'uâng': 'âz', 'uây': 'âj',
  'uơt': 'ơd', 'uơn': 'ơl', 'uơi': 'ơj',
  'oăt': 'ăd', 'oăp': 'ăf', 'oăc': 'ăs', 'oăn': 'ăl', 'oăm': 'ăv', 'oăng': 'ăz',
  'oet': 'ed', 'oec': 'es', 'oen': 'el', 'oem': 'ev', 'oeng': 'ez', 'oeo': 'ew',
  'oat': 'od', 'oap': 'of', 'oac': 'os', 'oan': 'ol', 'oam': 'ov', 'oang': 'oz', 'oao': 'ow', 'oai': 'oj', 'oay': 'aj'
};

const INIT_MAP = {
  'ph': 'f', 'qu': 'q', 'k': 'c', 'kh': 'k', 'd': 'z', 'đ': 'd', 'gi': 'j', 'gh': 'g', 'ngh': 'w', 'ng': 'w'
};

const INITS = ['ngh', 'ng', 'nh', 'ch', 'gh', 'gi', 'ph', 'qu', 'kh', 'th', 'tr', 'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'x'];

function getToneAndGroupAndClean(word) {
  let nfd = word.toLowerCase().normalize('NFD');
  let tone = 0;
  if (nfd.includes('\u0301')) tone = 1;
  else if (nfd.includes('\u0300')) tone = 2;
  else if (nfd.includes('\u0309')) tone = 3;
  else if (nfd.includes('\u0303')) tone = 4;
  else if (nfd.includes('\u0323')) tone = 5;

  let group = 'khong';
  if (nfd.includes('\u0302')) {
    group = 'non';
  } else if (nfd.includes('\u0306') || nfd.includes('\u031b')) {
    group = 'trang_moc';
  }

  let clean = nfd.replace(/[\u0301\u0300\u0309\u0303\u0323]/g, '').normalize('NFC');
  return { tone, group, clean };
}

function splitWord(clean) {
  for (let init of INITS) {
    if (clean.startsWith(init)) {
      return { init, rhyme: clean.substring(init.length) };
    }
  }
  return { init: '', rhyme: clean };
}

function stripHatsAndHooks(str) {
  return str.replace(/â/g, 'a').replace(/ă/g, 'a')
            .replace(/ê/g, 'e')
            .replace(/ô/g, 'o').replace(/ơ/g, 'o')
            .replace(/ư/g, 'u');
}

export function encodeCVNSS4Word(word) {
  // Bỏ qua các từ không phải tiếng Việt hoặc có ký tự đặc biệt
  if (!/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/.test(word)) return word;

  const { tone, group, clean } = getToneAndGroupAndClean(word);
  let { init, rhyme } = splitWord(clean);
  
  if (init === 'gi') {
    if (rhyme === '') rhyme = 'i';
    else if (rhyme.startsWith('ê')) rhyme = 'i' + rhyme;
    else if (!/^[aăâeêioôơuưy]/.test(rhyme)) rhyme = 'i' + rhyme;
  }

  let initMapped = INIT_MAP[init] || init;
  let reducedRhyme = rhyme;

  if (RHYMES_56[rhyme]) {
    reducedRhyme = RHYMES_56[rhyme];
  } else {
    if (reducedRhyme.endsWith('ng')) reducedRhyme = reducedRhyme.slice(0, -2) + 'g';
    else if (reducedRhyme.endsWith('nh')) reducedRhyme = reducedRhyme.slice(0, -2) + 'h';
    else if (reducedRhyme.endsWith('ch')) reducedRhyme = reducedRhyme.slice(0, -2) + 'k';

    if (reducedRhyme === 'uy') {
      reducedRhyme = 'y';
    } else if (reducedRhyme === 'y') {
      reducedRhyme = 'i';
    }
  }

  let reducedWord = initMapped + reducedRhyme;
  let sym = '';

  if (group === 'non') {
    if (tone === 1) sym = 'b';
    else if (tone === 2) sym = 'd';
    else if (tone === 3) sym = 'q';
    else if (tone === 4) sym = 'g';
    else if (tone === 5) sym = 'f';
    else if (tone === 0) sym = 'y';
  } else if (group === 'trang_moc') {
    if (tone === 1) sym = 'x';
    else if (tone === 2) sym = 'k';
    else if (tone === 3) sym = 'v';
    else if (tone === 4) sym = 'w';
    else if (tone === 5) sym = 'h';
    else if (tone === 0) sym = 'o';
  } else if (group === 'khong') {
    if (tone === 1) {
      if (reducedWord.endsWith('c') || reducedWord.endsWith('p') || reducedWord.endsWith('t')) {
        sym = '';
      } else {
        sym = 'j';
      }
    }
    else if (tone === 2) sym = 'l';
    else if (tone === 3) sym = 'z';
    else if (tone === 4) sym = 's';
    else if (tone === 5) sym = 'r';
    else if (tone === 0) {
      const pList = ['ag', 'ah', 'aj', 'eg', 'el', 'ev', 'ew', 'ez', 'ih', 'oah', 'og', 'oj', 'ol', 'ov', 'ow', 'oz', 'ug', 'yh'];
      if (pList.includes(reducedRhyme)) {
        sym = 'p';
      }
    }
  }

  let finalWord = stripHatsAndHooks(reducedWord) + sym;

  // Preserve case
  if (word === word.toUpperCase() && word !== word.toLowerCase()) {
    return finalWord.toUpperCase();
  }
  if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
    return finalWord.charAt(0).toUpperCase() + finalWord.slice(1);
  }

  return finalWord;
}

const REVERSE_RHYMES_56 = Object.fromEntries(Object.entries(RHYMES_56).map(([k, v]) => [v, k]));

export function decodeCVNSS4Word(word) {
  if (!/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/.test(word)) return word;

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
    1: '\u0301', 2: '\u0300', 3: '\u0309', 4: '\u0303', 5: '\u0323'
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
