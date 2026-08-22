import { decodeCVNSS4Word } from './cvnss4.js';
import fs from 'fs';

let content = fs.readFileSync('main.js', 'utf-8');
let funcStr = content.match(/function syncFromCVNSS4\(\) \{[\s\S]*?forceSave\(\);\s*\}/)[0];

const txtCVNSS4 = { value: 'Das coj cac Gen Z suy zugr' };
const txtDecrypted = { value: '' };
const txtEncrypted = { value: '' };
const txtCompressed = { value: '' };
const txtFakeViet = { value: '' };
const txtTime5 = { value: '' };
const txtCompressedContinuous = { value: '' };

const TOKEN_REGEX = /([^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g;

function encodeWord(w) { return "TIME_" + w; }
function timeToBase60(t) { return "B60_" + t; }
function toFakeViet(w) { return "FAKE_" + w; }
function timeTo5Digit(w) { return "5D_" + w; }
function updateCompressionStats() {}
function autoResizeAll() {}
function forceSave() {}
function logActivity() {}

eval(funcStr);

syncFromCVNSS4();
console.log(txtDecrypted.value);
