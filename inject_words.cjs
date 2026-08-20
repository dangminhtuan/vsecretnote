const fs = require('fs');

async function run() {
  const vcomp = await import('./vcomp.js');
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
  
  const allWords = Array.from(new Set([...holy, ...romance]));
  const pairs = [];
  allWords.forEach(w => {
    try {
      const t = vcomp.encodeWord(w);
      const b = vcomp.timeToBase60(t);
      if (b && b.length === 3) {
        pairs.push({word: w, b60: b, time: t});
      }
    } catch(e) {}
  });
  
  let code = fs.readFileSync('main.js', 'utf8');
  
  let pairsStr = '[\n';
  pairs.forEach(p => {
    pairsStr += `    { word: '${p.word}', b60: '${p.b60}', time: '${p.time}' },\n`;
  });
  pairsStr += '  ]';
  
  const oldArr = code.substring(code.indexOf('const sampleQuizPairs = ['), code.indexOf('];', code.indexOf('const sampleQuizPairs = [')) + 2);
  const newArr = 'const sampleQuizPairs = ' + pairsStr + ';';
  
  code = code.replace(oldArr, newArr);
  fs.writeFileSync('main.js', code);
  console.log('Successfully injected ' + pairs.length + ' custom words into sampleQuizPairs!');
}

run();
