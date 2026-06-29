export const TONES = ['ngang', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng'];

// === PHỤ ÂM ĐẦU ===
export const CONSONANTS_BASE = new Array(24).fill(null);
CONSONANTS_BASE[7] = 'h';   // hôn
CONSONANTS_BASE[8] = 'v';   // vú
CONSONANTS_BASE[9] = 'd';   // dâm
CONSONANTS_BASE[10] = 'm';  // mút
CONSONANTS_BASE[11] = 'ch'; // chịch
CONSONANTS_BASE[12] = 'r';  // rên
CONSONANTS_BASE[13] = 's';  // sướng
CONSONANTS_BASE[14] = 'n';  // nứng
CONSONANTS_BASE[15] = 'b';  // bướm (thay đĩ)
CONSONANTS_BASE[16] = 'l';  // liếm (thay phò)
CONSONANTS_BASE[17] = 'ch'; // chim (thay cặc)
CONSONANTS_BASE[18] = 's';  // sờ (thay gái)
CONSONANTS_BASE[19] = '';   // ôm (thay tình)
CONSONANTS_BASE[20] = 'ng'; // ngực
CONSONANTS_BASE[21] = 'nh'; // nhấp
CONSONANTS_BASE[22] = 'l';  // lồn

const remainingConsonants = [
  '', 'b', 'c', 'd', 'đ', 'g', 'gh', 'gi', 'h', 'k', 'kh',
  'n', 'ng', 'ngh', 'nh', 'p', 'ph', 'qu', 'r', 's', 't', 'th', 'tr', 'v', 'x'
];
export const CONSONANTS_EXTRA = new Array(8).fill(null);

const poolConsonants = remainingConsonants.filter(c => 
  !CONSONANTS_BASE.includes(c)
);

let poolIndex = 0;
for(let i = 0; i < 24; i++) {
  if (CONSONANTS_BASE[i] === null) {
    CONSONANTS_BASE[i] = poolConsonants[poolIndex++];
  }
}
for(let i = 0; i < 8; i++) {
  if (CONSONANTS_EXTRA[i] === null && poolIndex < poolConsonants.length) {
    CONSONANTS_EXTRA[i] = poolConsonants[poolIndex++];
  }
}

// === VẦN ===
export const RHYMES_BASE = new Array(60).fill(null);
RHYMES_BASE[7] = 'ôn';
RHYMES_BASE[8] = 'u';
RHYMES_BASE[9] = 'âm';
RHYMES_BASE[10] = 'ut';
RHYMES_BASE[11] = 'ich';
RHYMES_BASE[12] = 'ên';
RHYMES_BASE[13] = 'ương';
RHYMES_BASE[14] = 'ưng';
RHYMES_BASE[15] = 'ươm';
RHYMES_BASE[16] = 'iêm';
RHYMES_BASE[17] = 'im';
RHYMES_BASE[18] = 'ơ';
RHYMES_BASE[19] = 'ôm';
RHYMES_BASE[20] = 'ưc';
RHYMES_BASE[21] = 'âp';
RHYMES_BASE[22] = 'ôn';

const allRhymes = [
  "a", "ac", "ach", "ai", "am", "an", "ang", "anh", "ao", "ap", "at", "au", "ay", 
  "ă", "ăc", "ăm", "ăn", "ăng", "ăp", "ăt",
  "â", "âc", "âm", "ân", "âng", "âp", "ât", "âu", "ây",
  "e", "ec", "em", "en", "eng", "eo", "ep", "et",
  "ê", "êch", "êm", "ên", "ênh", "êp", "êt", "êu",
  "i", "ia", "ich", "iêc", "iêm", "iên", "iêng", "iêp", "iêt", "iêu", "im", "in", "inh", "ip", "it", "iu",
  "o", "oa", "oac", "oach", "oai", "oam", "oan", "oang", "oanh", "oap", "oat", "oay", "oăc", "oăm", "oăn", "oăng", "oăt", "oc", "oe", "oen", "oeo", "oet", "oi", "om", "on", "ong", "op", "ot",
  "ô", "ôc", "ôi", "ôm", "ôn", "ông", "ôp", "ôt",
  "ơ", "ơi", "ơm", "ơn", "ơp", "ơt",
  "u", "ua", "uân", "uâng", "uât", "uây", "uc", "uê", "uêch", "uênh", "ui", "um", "un", "ung", "uo", "uôc", "uôi", "uôm", "uôn", "uông", "uôt", "up", "ut", "uya", "uych", "uyn", "uynh", "uyt", "uyu", "uy", "uyên", "uyêt",
  "ư", "ưa", "ưc", "ưi", "ưm", "ưn", "ưng", "ươc", "ươi", "ươm", "ươn", "ương", "ươp", "ươt", "ưt", "ưu",
  "y", "yêm", "yên", "yêng", "yêt", "yêu"
];

const poolRhymes = allRhymes.filter(r => !RHYMES_BASE.includes(r));

let rPoolIndex = 0;
for(let i = 0; i < 60; i++) {
  if (RHYMES_BASE[i] === null) {
    RHYMES_BASE[i] = poolRhymes[rPoolIndex++];
  }
}
export const RHYMES_EXTRA_1 = poolRhymes.slice(rPoolIndex, rPoolIndex + 60);
rPoolIndex += 60;
export const RHYMES_EXTRA_2 = poolRhymes.slice(rPoolIndex);

// === SHORTCUT WORDS (TỪ ƯU TIÊN 4 SỐ) ===
export const SHORTCUT_WORDS = [
  "chim", "mút", "vú", "chịch", "hôn", "lồn",
  "dâm", "rên", "sướng", "nứng", "bướm", "liếm", "sờ", "ôm", "ngực", "nhấp",
  "em", "anh", "tôi", "bạn"
];

// === DANH SÁCH TỪ NHẠY CẢM ===
export const SENSITIVE_WORDS = [
  "chim", "mút", "vú", "chịch", "hôn", "lồn",
  "dâm", "rên", "sướng", "nứng", "bướm", "liếm", "sờ", "ôm", "ngực", "nhấp"
];

// === TỪ KHÓA 2 SỐ (DỰA TRÊN 24 PHỤ ÂM) ===
export const TWO_DIGIT_WORDS = [
  "có",     // 00 - c
  "đi",     // 01 - đ
  "gặp",    // 02 - g
  "ghê",    // 03 - gh
  "gì",     // 04 - gi
  "kêu",    // 05 - k
  "không",  // 06 - kh
  "hay",    // 07 - h
  "vậy",    // 08 - v
  "dạ",     // 09 - d
  "mình",   // 10 - m
  "chưa",   // 11 - ch
  "rồi",    // 12 - r
  "sao",    // 13 - s
  "này",    // 14 - n
  "biết",   // 15 - b
  "làm",    // 16 - l
  "cho",    // 17 - ch
  "sẽ",     // 18 - s
  "ơi",     // 19 - rỗng
  "người",  // 20 - ng
  "như",    // 21 - nh
  "lại",    // 22 - l
  "nghĩ"    // 23 - ngh
];

// === TIẾNG ANH (S2 = 6,7,8,9) ===
export const ENGLISH_DICT = [
  "hello", "world", "love", "time", "fuck", "shit", "sex", "pussy", "dick", "cock", "boobs", "ass",
  "cyber", "matrix", "hacker", "system", "online", "code", "secret", "data"
];

// === BẢNG MÃ NÉN BASE60 (MNEMONIC ACRONYM) ===
// 24 giá trị đầu tiên (00-23) sẽ tương ứng với 24 phụ âm gốc của TimeCypher
// Các giá trị còn lại (24-59) sẽ là các số và chữ còn lại (trừ f, F).
export const BASE60_MAPPING = [
  // 00-23: Mnemonic Consonants
  'c', 'd', 'g', 'G', 'j', 'k', 'K', 'h', 'v', 'D', 'm', 'C', 'r', 's', 'n', 'b', 'l', 'q', 'S', 'z', 'N', 'y', 'L', 'W',
  // 24-33: Numbers (10)
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  // 34-42: Remaining lowercase without f (9)
  'a', 'e', 'i', 'o', 'p', 't', 'u', 'w', 'x',
  // 43-59: Remaining uppercase without F (17)
  'A', 'B', 'E', 'H', 'I', 'J', 'M', 'O', 'P', 'Q', 'R', 'T', 'U', 'V', 'X', 'Y', 'Z'
];
