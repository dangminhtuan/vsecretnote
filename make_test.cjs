const fs = require('fs');
const vcomp = fs.readFileSync('vcomp.js', 'utf8').replace(/import {.*?} from '.*?';/gs, '').replace(/export /g, '');
const data = fs.readFileSync('data.js', 'utf8').replace(/export /g, '');

const testCode = data + '\n' + vcomp + '\nconsole.log("Decode 222243:", decodeWord("222243"));';
fs.writeFileSync('testDecode.cjs', testCode);
