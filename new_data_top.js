export const TONES = ['ngang', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng'];

// === PHỤ ÂM ĐẦU ===
// CONSONANTS_BASE: 24 phụ âm (HH = 0-23)
export const CONSONANTS_BASE = [
  'c', 'đ', 'g', 'gh', 'gi', 'k', 'kh',
  'h', 'v', 'd', 'm', 'ch', 'r', 's', 'n', 'b', 'l',
  'ch', 's', '', 'ng', 'nh', 'l', 'ngh'
];

export const CONSONANTS_EXTRA = [
  'p', 'ph', 'qu', 't', 'th', 'tr', 'x', null
];

// === VẦN ===
// RHYMES_BASE: a/ă/â/e/ê + anchors
export const RHYMES_BASE = [
  'a', 'ac', 'ach', 'ai', 'am', 'an', 'ang',
  'ôn', 'u', 'âm', 'ut', 'ich', 'ên', 'ương',
  'ưng', 'ươm', 'iêm', 'im', 'ơ', 'ôm',
  'ưc', 'âp', 'ôn',
  'anh', 'ao', 'ap', 'at', 'au', 'ay',
  'ă', 'ăc', 'ăm', 'ăn', 'ăng', 'ăp', 'ăt',
  'â', 'âc', 'ân', 'âng', 'ât', 'âu', 'ây',
  'e', 'ec', 'em', 'en', 'eo', 'ep', 'et',
  'ê', 'êch', 'êm', 'ênh', 'êp', 'êt', 'êu',
  'i', 'ia', ''
];

// RHYMES_EXTRA_1: i/o/ô/ơ
export const RHYMES_EXTRA_1 = [
  'iêc', 'iên', 'iêng', 'iêp', 'iêt', 'iêu', 'in', 'inh', 'ip', 'it', 'iu',
  'oa', 'oai', 'oan', 'oc', 'oe', 'oi', 'om', 'on', 'ong', 'op', 'ot', 'oăn', 'oăng',
  'ô', 'ôc', 'ôi', 'ông', 'ôp', 'ôt',
  'ơi', 'ơm', 'ơn', 'ơp', 'ơt',
  'o', 'oac', 'oach', 'oam', 'oang', 'oanh', 'oap', 'oat', 'oay', 'oeo',
  'oem', 'oen', 'oet', 'ooc', 'oong', 'oăc', 'oăm', 'oăt', 'iê', 'eng',
  null, null, null, null, null
];

// RHYMES_EXTRA_2: u/ư/y
export const RHYMES_EXTRA_2 = [
  'ua', 'uân', 'uât', 'uc', 'uê', 'ui', 'um', 'un', 'ung', 'uôc', 'uôi', 'uôn', 'uông', 'uôt', 'up', 'uy', 'uyên', 'uyêt',
  'ư', 'ưa', 'ưi', 'ưm', 'ưn', 'ươc', 'ươi', 'ươn', 'ươp', 'ươt', 'ưt', 'ưu',
  'y', 'yêm', 'yên', 'yêt', 'yêu',
  'ươu', 'uôm', 'uơ', 'uâng', 'uây', 'uêch', 'uênh', 'uya', 'uych', 'uyn',
  'uynh', 'uyp', 'uyt', 'uyu', 'yn', 'ynh', 'yt', 'yêng', 'ăk', 'n',
  null, null, null, null, null
];

export const BASE60_MAPPING = [
  'c', 'd', 'g', 'G', 'j', 'k', 'K', 'h', 'v', 'D', 'm', 'C', 'r', 's', 'n', 'b', 'l', 'Q', 'S', 'z', 'N', 'y', 'L', 'W',
  'p', 'f', 'q', 't', 'T', 'R', 'x', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'E', 'F', 'H', 'I', 'J', 'M', 'P', 'U', 'V', 'X', 'Y', 'Z', 'a', 'e', 'i', 'u', 'w'
];

export const ENGLISH_DICT = [
  'hello', 'world', 'love', 'time', 'fuck', 'shit', 'sex', 'pussy',
  'dick', 'cock', 'boobs', 'ass', 'cyber', 'matrix', 'hacker', 'system',
  'online', 'code', 'secret', 'data'
];
