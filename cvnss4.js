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
