import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  BASE60_HH, BASE60_HH_EXTRA, BASE60_SS,
  TONE_TABLE_B1, TONE_TABLE_B2, TONE_TABLE_B3,
  timeToBase60, encodeWord, extractPhonetics,
  buildLearningCard
} from 'file:///d:/__G AG Projects/vsecretnote_hkC_20260815/vcomp.js';
import {
  CONSONANTS_BASE, CONSONANTS_EXTRA,
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2,
  BASE60_MAPPING, REAL_VIETNAMESE_WORDS
} from 'file:///d:/__G AG Projects/vsecretnote_hkC_20260815/data.js';

const projectRoot = 'd:/__G AG Projects/vsecretnote_hkC_20260815';
const publicDir = path.join(projectRoot, 'public');

console.log("=== TÁI TẠO ĐỒNG BỘ 100% TẤT CẢ CÁC TỪ ĐIỂN VÀ GÓI ZIP CHO HỆ THỐNG ===");

// 1. COMPONENT R (RULES) - 36 CÂU CHUYỆN GỢI NHỚ (MNEMONIC STORIES) IN HOA TỪ KHÓA
const RULE_STORIES = {
  a: 'Cứ bước qua chiếc CẦU, há mồm NGOÁP rồi HUỂNH hoang đi xa!',
  b: 'Bắt BƯỚM mở TÒE loe, gặp NGUY trèo tót lên CÂY, sợ TOÁT mồ hôi tới KHUYA!',
  c: 'Hát CA TIẾC con CUA rơi, đè CHỊCH bé HOA nếu thật sự MUỐN!',
  d: 'CÁC TIÊN nữ XUẤT hiện, thú tính DÂM kẹp KHÍT như ngậm điếu THUỐC!',
  e: 'Cún con kêu đòi MẸ, ngoắt NGOÁY cái đuôi rồi HUÝCH vào chân!',
  f: 'Trèo THÁP đầy MỐC LƯỢN bay, chạy HÉC-quyn quẹo NGHOEO đón BUYN! (Dấu Huyền)',
  g: 'Cầm GẠCH đứng NGHIÊNG hối GIỤC, em GÁI vừa xong một HIỆP đòi về QUÊ!',
  h: 'Sáng sớm HÔN đón CHIỀU XUÂN, bất ngờ HÉT to cười HOEM chọc HUYNH!',
  i: 'Thôi xách ba lô lên và ĐI! (Tiền tố: I hoa đầu, O hoa hết)',
  j: 'Chăm LÀM MIỆT mài không LÙI, ngậm KẸO đỏ CHOẸT thơm mùi QUÝT! (Dấu Nặng)',
  k: 'Vác CÁN đập CHÍN giãn CHUN, CÀNG khoe KHIẾU hì hục KHUÂN đồ!',
  l: 'Cúi xuống LIẾM láp, nàng ĐÒI đâm TRÚNG cái LỒN như con HOẴNG BỰ!',
  m: 'Đòi MÚT cho DỊU rồi TRÙM mền như MÈO, cào KHOÉT vách rồi HUÝT sáo!',
  n: 'Nổi NỨNG TƯƠI như VƯỢN, phanh bờ NGỰC CHO ghé vào NGỬI!',
  o: 'Vệt mực ĐEN làm HOEN gỉ chiếc xe BUÝP! (vần \'o\' TV mã 4)',
  p: 'Thuyền CHAO đảo gặp CÔ gái TƯƠI, KẸT vào cái XOONG rớt LÌN xìn!',
  q: 'Bãi CÁT mồ CÔI bị CƯỚP, vỗ đầu CHIM gầy CÒM khen đẹp TUYỆT!',
  r: 'Vừa RÊN không KỊP đuôi, mở miệng RĂN kẻo làm TOANG bình RƯỢU quý! (Dấu Hỏi)',
  s: 'Đang SƯỚNG ra NƯỚC, LƯỚT tay vào SỜ, nàng bảo BỚT kẻo ĐỨT gân! (Dấu Sắc)',
  t: 'Vượt bãi CHÔNG nhẹ lướt về SAU, giã CHÀY bánh XỐP ăn không DỨT!',
  u: 'Cùng san CHIA say MÊ, mở dấu NGOẶC ghi tên Lưu HUỲNH rực rỡ!',
  v: 'Sờ đôi VÚ VIẾT thư rất VUI, mặt VẾCH chạy máy GIÊ kêu như xe BUYN!',
  w: 'Khởi đầu từ GỐC TRỐNG RỖNG, xây THÀNH tóc XOĂNG tít là ĐƯỢC!',
  x: 'Đi ra BẮC XƠI rượu bắt QUỲ, canh ĐÊM THOẮT cất tiếng LIỀNG! (Dấu Ngã)',
  y: 'Dập NHẤP đau XÓT CHỤM lại, ban LỆNH máy GIÊ quét sạch quân GIẶC!',
  z: 'Vòng ÔM đừng LO hãy ỪA, vào BẾP cầm XẺNG xúc mảnh đất CẰN! (Dấu Ngang)',
  '0': 'Ra suối TẮM mát rồi BƠM nước mặc áo YẾM (Dấu Ngang)',
  '1': 'Không CẮN nhau để sống HƠN người trong bình YÊN (Dấu Sắc)',
  '2': 'Ánh TRĂNG ló CHỚP nhoáng trên bảng YẾT kiến (Dấu Huyền)',
  '3': 'Cầm BẮP ngô ăn BỚT trao người mình YÊU (Dấu Hỏi)',
  '4': 'Cầm kéo CẮT cỏ CHO đàn HƯƠU (Dấu Ngã)',
  '5': 'Vết thương BẦM dập mở toang NGOÁC cánh BUỒM (Dấu Nặng)',
  '6': 'Tỉnh GIẤC hoàn thành kế HOẠCH tay QUƠ vội!',
  '7': 'Bước đôi CHÂN há mồm NGOẠM thịt nhảy QUẪNG!',
  '8': 'Lên TẦNG cao chén vỡ CHOANG tay KHUẤY trà!',
  '9': 'Rơi xuống mảnh ĐẤT kinh DOANH nhà trống HUẾCH!'
};

const topRules = [];
let ruleIndex = 1;

// 1.1. 26 Ký tự Alphabet (A..Z)
const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
const alphabet26 = 'abcdefghijklmnopqrstuvwxyz'.split('');
alphabet26.forEach(char => {
  const lower = char;
  const upper = char.toUpperCase();
  const numStr = (ruleIndex++).toString().padStart(2, '0');
  const displayStr = `${numStr} [${upper}/${lower}] ${RULE_STORIES[char]}`;
  const shortcut = vowels.has(char) ? `${char}v` : char;
  topRules.push(`${shortcut}\t${displayStr}`);
});

// 1.2. 10 Chữ Số 0 -> 9
const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
digits.forEach(d => {
  const numStr = (ruleIndex++).toString().padStart(2, '0');
  const displayStr = `${numStr} [Số ${d}] ${RULE_STORIES[d]}`;
  topRules.push(`${d}\t${displayStr}`);
});

// 2. HELPER CHO THẺ 9 VẦN HỌC SÂU (Đã import từ vcomp.js: tự động khử trùng nhóm vần cho Cặp Lặp & Tam Hoa)

// 3. BUILD FORWARD (F), BACKWARD (B), LEARNING (L)
const filteredWords = REAL_VIETNAMESE_WORDS.filter(w => w !== 'pết' && w !== 'pềt');

const F_lines = [];
const B_lines = [];
const L_lines = [];

filteredWords.forEach(word => {
  const enc = encodeWord(word);
  if (!enc || enc.startsWith('[')) return;
  const b60 = timeToBase60(enc);
  if (!b60 || b60.includes('?')) return;

  // F (Forward): Mã -> Từ (gõ TWf ra thành)
  F_lines.push(`${b60}\t${word}\t\t`);

  // B (Backward): Từ + p -> Mã (gõ thànhp ra TWf)
  B_lines.push(`${word}p\t${b60}\t\t`);

  // L (Learning): Từ + l -> Thẻ 9 vần ma trận (gõ thànhl ra TWf: ay,ôp,ưt | ANH,oăng,ươc | ap,ôc,ươn)
  const card = buildLearningCard(b60, word);
  L_lines.push(`${word}l\t${card}\t\t`);
});

const header = '# Gboard Dictionary version:2\n# Gboard Dictionary format:shortcut\tword\tlanguage_tag\tpos_tag\n';
const R_lines = topRules.map(line => line.includes('\t') ? `${line}\t\t` : `${line}\t\t\t`);

const components = {
  R: R_lines,
  F: F_lines,
  B: B_lines,
  L: L_lines
};

function createZip(zipFileName, contentLines) {
  const tempTxtFile = path.join(publicDir, 'dictionary.txt');
  const fullContent = header + contentLines.join('\n');
  fs.writeFileSync(tempTxtFile, fullContent, 'utf8');

  const destZip = path.join(publicDir, zipFileName);
  if (fs.existsSync(destZip)) {
    fs.unlinkSync(destZip);
  }

  execSync(`powershell -Command "Compress-Archive -Path '${tempTxtFile}' -DestinationPath '${destZip}' -Force"`);
}

// 4. SINH 16 TỔ HỢP MODULAR CHO GBOARD
console.log("-> Bắt đầu tạo 16 file Zip tổ hợp...");
const keys = ['R', 'F', 'B', 'L'];
for (let i = 0; i < 16; i++) {
  const activeKeys = [];
  const contentLines = [];

  keys.forEach((key, index) => {
    if ((i & (1 << index)) !== 0) {
      activeKeys.push(key);
      contentLines.push(...components[key]);
    }
  });

  const activeStr = activeKeys.length > 0 ? activeKeys.join('_') : 'EMPTY';
  const zipName = `Gboard_Dict_${activeStr}.zip`;
  createZip(zipName, contentLines);
  console.log(`   ✓ ${zipName} (${contentLines.length} mục)`);
}

// 4.1. Tạo thêm các alias zip với ký hiệu P thay vì B (P = B: Tra gọn phím p)
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_B_L.zip'), path.join(publicDir, 'Gboard_Dict_R_P_L.zip'));
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_B_L.zip'), path.join(publicDir, 'Gboard_Dict_P_L.zip'));
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_B.zip'), path.join(publicDir, 'Gboard_Dict_R_P.zip'));
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_B.zip'), path.join(publicDir, 'Gboard_Dict_P.zip'));
console.log("   ✓ Đã tạo các alias tiện dụng: Gboard_Dict_R_P_L.zip, Gboard_Dict_P_L.zip, Gboard_Dict_R_P.zip, Gboard_Dict_P.zip");

// 5. SINH CÁC FILE TEXT VÀ CÁC ZIP MẶC ĐỊNH CHO MENU
console.log("-> Bắt đầu đồng bộ các file Text và Zip mặc định...");

// 5.1. File mặc định (R + P + L): dictionary_2way.txt, PersonalDictionary.zip, PersonalDictionary_1Way.zip, PersonalDictionary_2Way.zip, gboard_dictionary.zip
const contentRPL = header + [...R_lines, ...B_lines, ...L_lines].join('\n');
fs.writeFileSync(path.join(publicDir, 'dictionary_2way.txt'), contentRPL, 'utf8');
fs.writeFileSync(path.join(publicDir, 'gboard_dictionary.txt'), contentRPL, 'utf8');
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_P_L.zip'), path.join(publicDir, 'PersonalDictionary.zip'));
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_P_L.zip'), path.join(publicDir, 'PersonalDictionary_1Way.zip'));
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_P_L.zip'), path.join(publicDir, 'PersonalDictionary_2Way.zip'));
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_P_L.zip'), path.join(publicDir, 'gboard_dictionary.zip'));
console.log("   ✓ PersonalDictionary.zip, gboard_dictionary.zip (R + P + L)");

// 5.2. File Rules (36 quy tắc): rules_dictionary.txt, Gboard_ToneRules.zip
const contentRules = header + R_lines.join('\n');
fs.writeFileSync(path.join(publicDir, 'rules_dictionary.txt'), contentRules, 'utf8');
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R.zip'), path.join(publicDir, 'Gboard_ToneRules.zip'));
console.log("   ✓ Gboard_ToneRules.zip, rules_dictionary.txt (R - 36 quy tắc)");

// 5.3. File Tra gọn p: Gboard_Fast_Memo.zip
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_P.zip'), path.join(publicDir, 'Gboard_Fast_Memo.zip'));
console.log("   ✓ Gboard_Fast_Memo.zip (P)");

// Dọn dẹp dictionary.txt tạm trong public
const tempTxt = path.join(publicDir, 'dictionary.txt');
if (fs.existsSync(tempTxt)) fs.unlinkSync(tempTxt);

console.log("🎉 ĐÃ TÁI TẠO XONG 100% CÁC FILE TỪ ĐIỂN!");
