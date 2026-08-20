const fs = require('fs');

async function run() {
  const dataJsPath = 'data.js';
  let dataJs = fs.readFileSync(dataJsPath, 'utf8');

  // Match the array
  const regex = /export const REAL_VIETNAMESE_WORDS\s*=\s*(\[.*?\]);/s;
  const match = dataJs.match(regex);
  if (!match) {
    console.log("Could not parse REAL_VIETNAMESE_WORDS");
    return;
  }

  let realWords = [];
  try {
    realWords = JSON.parse(match[1]);
  } catch (e) {
    console.log("Could not JSON parse the array", e);
    return;
  }

  const holy = [
    'cạ', 'phạc', 'gạch', 'tục', 'thiệt', 'tràn', 'xỉn', 'hôn', 'vú', 'dâm', 'mút', 'chịch',
    'rên', 'sướng', 'nứng', 'bướm', 'liếm', 'chim', 'sờ', 'ôm', 'ngực', 'nhấp', 'lồn', 'ngành',
    'được', 'rớt', 'nghẻm', 'nghợn'
  ];
  const romance = [
    'ôm', 'ấp', 'hôn', 'hít', 'vuốt', 've', 'xoa', 'cưng', 'chiều', 'thương', 'nhớ', 'nhung', 'say', 'đắm', 'nồng', 'cháy',
    'khát', 'khao', 'mong', 'chờ', 'thèm', 'ngọt', 'ngào', 'đê', 'mê', 'quấn', 'quýt', 'mơn', 'trớn', 'mặn', 'mà', 'êm', 'ái',
    'liếm', 'mút', 'cắn', 'nhấp', 'dập', 'nhồi', 'đút', 'xóc', 'rên', 'rỉ', 'rùng', 'mình', 'bắn', 'trớ', 'xuất', 'tinh',
    'sướng', 'rụng', 'rời', 'mẩy', 'khít', 'trơn', 'ướt', 'át', 'dâm', 'đãng',
    'lồn', 'cu', 'bướm', 'chim', 'cặc', 'vú', 'ngực', 'mông', 'đùi', 'eo', 'môi', 'lưỡi',
    'anh', 'em', 'vợ', 'chồng', 'bé', 'dượng', 'ngoan', 'hư', 'gợi', 'cảm', 'khiêu', 'khích', 'quyến', 'rũ',
    'quá', 'này', 'nọ', 'thích', 'muốn', 'ngủ', 'chơi', 'làm', 'cùng', 'nào', 'vậy'
  ];

  const customWords = Array.from(new Set([...holy, ...romance]));
  
  let addedCount = 0;
  for (const word of customWords) {
    if (!realWords.includes(word)) {
      realWords.push(word);
      addedCount++;
    }
  }

  const newArrayString = JSON.stringify(realWords);
  const newDataJs = dataJs.replace(match[0], `export const REAL_VIETNAMESE_WORDS = ${newArrayString};`);

  fs.writeFileSync(dataJsPath, newDataJs);
  console.log(`Added ${addedCount} new words. Total words is now ${realWords.length}`);
}

run();
