const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const oldInitLogic = `    const validPairs = sampleQuizPairs.filter(p => p.b60 && p.b60.length === 3);
    const targetIndex = Math.floor(Math.random() * validPairs.length);
    currentQuizTarget = validPairs[targetIndex];`;

const newInitLogic = `    let tWord = '', tTime = '', tB60 = '';
    const wordPool = (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.length) ? REAL_VIETNAMESE_WORDS : sampleWordsList;
    while(true) {
       tWord = wordPool[Math.floor(Math.random() * wordPool.length)];
       try {
           tTime = typeof encodeWord === 'function' ? encodeWord(tWord) : '';
           tB60 = typeof timeToBase60 === 'function' ? timeToBase60(tTime) : '';
           if (tB60 && tB60.length === 3) break;
       } catch(e) {}
    }
    currentQuizTarget = { word: tWord, time: tTime, b60: tB60 };`;

if (code.includes('const validPairs = sampleQuizPairs')) {
    code = code.replace(oldInitLogic, newInitLogic);
    fs.writeFileSync('main.js', code);
    console.log('Patched quiz to use dynamic REAL_VIETNAMESE_WORDS instead of sample data.');
} else {
    console.log('Could not find the block to replace.');
}
