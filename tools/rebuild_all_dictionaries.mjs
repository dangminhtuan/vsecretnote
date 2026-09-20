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
  'a': 'Người BA hát khúc tình CA trước mái NHÀ, tiếng sóng vỗ oam OẠP giữa căn phòng TUỀNH toàng không chút HUÊNH hoang!',
  'b': 'Bắt con BƯỚM đẹp đem KHOE, TUY vậy đến ĐÂY may mà THOÁT nạn lúc đêm KHUYA!',
  'c': 'Tổng KẾT công VIỆC đi MUA sắm, tích lũy thành TÍCH tặng nhánh HOA tươi nếu thực lòng MUỐN!',
  'd': 'Thời CƠ nàng TIÊN giáng XUẤT, dốc hết con TÂM nướng đĩa THỊT thơm rồi châm điếu THUỐC!',
  'e': 'Lên chiếc XE cùng MẸ bế em BÉ, niềm say MÊ ngoắt NGOÁY đuôi rồi tinh nghịch HUÝCH vai!',
  'f': 'Hiến PHÁP của đất QUỐC gia giữ xanh mảnh VƯỜN, ký tấm ngân SÉC đi đường ngoằn NGOÈO đón xe BUYN!',
  'g': 'Cầm viên GẠCH đứng NGHIÊNG người hối GIỤC, bắt gặp em GÁI vừa chơi xong một HIỆP ở căn nhà THUÊ!',
  'h': 'Trao nụ HÔN thật NHIỀU đón ngày XUÂN, chăm chỉ luyện TẬP hưởng vị NGỌT ngào đầy hợp LÝ!',
  'i': 'Thôi xách ba lô lên và ĐI! (Tiền tố: I hoa đầu, O hoa hết)',
  'j': 'Chăm chỉ LÀM việc người VIỆT luôn rạng rỡ VUI tươi, chia nhau thanh KẸO cười toét LOÉT đón chuyến xe BUÝT!',
  'k': 'Người BẠN khó CHỊU trùm mền kín mít, mấy THÁNG trời ngóng TIN mời đi ăn bát BÚN!',
  'l': 'Từng luận ĐIỂM được NÓI giữ NGUYÊN giá trị, chớ để lẫn LỘN băn KHOĂN những chuyện NHƯN nhượng!',
  'm': 'Hơi HÚT chân CHÍNH thời trai TUỔI trẻ, khoác áo ĐẸP móc xe kéo MOÓC va vào cùi KHUỶU tay!',
  'n': 'Khó khăn NHƯNG chăm HỌC sẽ được GIÚP, biến ước mơ thành hiện THỰC đóng GÓP hương thơm cho đời NGỬI!',
  'o': 'Vệt mực ĐEN tặng CHO em cả TUÝP màu, cùng nhau bước ĐI cầm bút CHÌ mỗi KHI vẽ tranh! (vần \'o\' TV mã 4)',
  'p': 'Xem tờ BÁO ăn bữa CƠM cùng mọi NGƯỜI, từng đường NÉT trên chiếc XOONG bóng loáng như thẻ QUYN bài!',
  'q': 'Vừa bộc PHÁT lời TÔI bị kẻ gian CƯỚP lời, xem bộ PHIM cùng cả NHÓM thật là TUYỆT vời!',
  'r': 'Tiếng RÊN vọng ra NGOÀI rồi lắng XUỐNG, làm MỘT việc TỐT để kịp thời CỨU nguy nan!',
  's': 'Trên con ĐƯỜNG an TOÀN đi SUỐT đêm, CÁC bạn nhỏ dẫn CON ngắm hoa QUỲNH nở!',
  't': 'Đứng phía SAU lập chiến CÔNG vượt VƯỢT mọi thử thách, qua bao NGÀY mở chiếc HỘP quà chấm DỨT chuỗi ngày chờ!',
  'u': 'Gió mùa THU lời ru RU êm đềm võng ĐU đưa, tấm gương được NÊU trong dấu NGOẶC sáng trong NHƯ ngọc!',
  'v': 'Cùng san CHIA cho KỊP tới VÙNG quê, bắt con ẾCH dưới hố sâu hoắm rồi hái chùm QUÝT!',
  'w': 'Gõ chữ QU tốc ký liền tay, lập chiến công THÀNH công vang dội sáng HOẰNG soi dòng sông NƯỚC!',
  'x': 'Từ miền BẮC vào chung sống VỚI nhau đừng ngập NGỪM, suốt ĐÊM thoăn THOẮT dạy chim YỂNG hót!',
  'y': 'Nhận mệnh LỆNH chạy máy GIÊ thóc tại vùng ĐẮK Lắk, gửi EM nụ cười hoem OEM cùng người HUYNH đài!',
  'z': 'Mới HÔM nào ở TRONG nhà mà CHƯA nấu nướng, nay đỏ lửa góc BẾP cầm chiếc XẺNG xúc đống than QUN!',
  '0': 'Trải qua bao NĂM tháng CÔ gái mặc áo YẾM, chăm lo việc ĂN uống sống HƠN người trong bình YÊN! (Nhánh 0)',
  '1': 'Trải qua bao NĂM tháng CÔ gái mặc áo YẾM, chăm lo việc ĂN uống sống HƠN người trong bình YÊN! (Nhánh 1)',
  '2': 'Năng suất gia TĂNG kết HỢP lòng kiên QUYẾT, lúc hội GẶP hãy BỚT lo âu để trọn vẹn tình YÊU! (Nhánh 2)',
  '3': 'Năng suất gia TĂNG kết HỢP lòng kiên QUYẾT, lúc hội GẶP hãy BỚT lo âu để trọn vẹn tình YÊU! (Nhánh 3)',
  '4': 'Nước mắt ướt MẶT làm HOEN chén ly RƯỢU, bước qua chiếc CẦU vai KHOÁC túi giong cánh BUỒM ra khơi! (Nhánh 4)',
  '5': 'Nước mắt ướt MẶT làm HOEN chén ly RƯỢU, bước qua chiếc CẦU vai KHOÁC túi giong cánh BUỒM ra khơi! (Nhánh 5)',
  '6': 'Tỉnh cơn mê GIẤC hoàn thành kế HOẠCH nhớ THUỞ xưa, bao lớp tiền NHÂN há miệng NGOẠM mồi lòng bâng KHUÂNG! (Nhánh 6)',
  '7': 'Tỉnh cơn mê GIẤC hoàn thành kế HOẠCH nhớ THUỞ xưa, bao lớp tiền NHÂN há miệng NGOẠM mồi lòng bâng KHUÂNG! (Nhánh 7)',
  '8': 'Lên trên các TẦNG đo KHOẢNG cách tay KHUẤY trà, trên mảnh ĐẤT kinh DOANH ngày càng KHUẾCH trương phát đạt! (Nhánh 8)',
  '9': 'Lên trên các TẦNG đo KHOẢNG cách tay KHUẤY trà, trên mảnh ĐẤT kinh DOANH ngày càng KHUẾCH trương phát đạt! (Nhánh 9)'
};

const topRules = [];
let ruleIndex = 1;

// 1.1. 26 Ký tự Alphabet (A..Z)
const vowels = new Set(['a', 'i']); // Chỉ riêng 'a' và 'i' giữ hậu tố 'v' (av, iv), còn 'e', 'o', 'u', 'y' để nguyên
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

// 3. BUILD FORWARD (F), TRA GỌN 0 (0), THẺ HỌC 9 (9)
const filteredWords = REAL_VIETNAMESE_WORDS.filter(w => w !== 'pết' && w !== 'pềt');

const F_lines = [];
const Zero_lines = [];
const Nine_lines = [];

filteredWords.forEach(word => {
  const enc = encodeWord(word);
  if (!enc || enc.startsWith('[')) return;
  const b60 = timeToBase60(enc);
  if (!b60 || b60.includes('?')) return;

  // F (Forward): Mã -> Từ (gõ TWf ra thành)
  F_lines.push(`${b60}\t${word}\t\t`);

  // 0 (Tra gọn phím 0): Từ + 0 -> Mã (gõ thành0 ra TWf, không vỡ Telex)
  Zero_lines.push(`${word}0\t${b60}\t\t`);

  // 9 (Học sâu phím 9): Từ + 9 -> Thẻ mẹo ma trận (gõ thành9 ra TWf: mẹo vần)
  const card = buildLearningCard(b60, word);
  Nine_lines.push(`${word}9\t${card}\t\t`);
});

const header = '# Gboard Dictionary version:2\n# Gboard Dictionary format:shortcut\tword\tlanguage_tag\tpos_tag\n';
const R_lines = topRules.map(line => line.includes('\t') ? `${line}\t\t` : `${line}\t\t\t`);

const components = {
  F: F_lines,
  '0': Zero_lines,
  '9': Nine_lines,
  R: R_lines
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

// 4. SINH 16 TỔ HỢP MODULAR CHO GBOARD (F, 0, 9, R)
console.log("-> Bắt đầu tạo 16 file Zip tổ hợp...");
const keys = ['F', '0', '9', 'R'];
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

// 4.1. Tạo các alias tiện dụng và tương thích ngược
const fullZip = path.join(publicDir, 'Gboard_Dict_F_0_9_R.zip');
fs.copyFileSync(fullZip, path.join(publicDir, 'PersonalDictionary.zip'));
fs.copyFileSync(fullZip, path.join(publicDir, 'gboard_dictionary.zip'));
fs.copyFileSync(fullZip, path.join(publicDir, 'PersonalDictionary_1Way.zip'));
fs.copyFileSync(fullZip, path.join(publicDir, 'PersonalDictionary_2Way.zip'));
fs.copyFileSync(fullZip, path.join(publicDir, 'Gboard_Dict_R_P_L.zip'));

const zeroNineZip = path.join(publicDir, 'Gboard_Dict_0_9.zip');
fs.copyFileSync(zeroNineZip, path.join(publicDir, 'Gboard_Dict_P_L.zip'));

const zeroZip = path.join(publicDir, 'Gboard_Dict_0.zip');
fs.copyFileSync(zeroZip, path.join(publicDir, 'Gboard_Fast_Memo.zip'));
fs.copyFileSync(zeroZip, path.join(publicDir, 'Gboard_Dict_P.zip'));

const nineZip = path.join(publicDir, 'Gboard_Dict_9.zip');
fs.copyFileSync(nineZip, path.join(publicDir, 'Gboard_Dict_L.zip'));

const ruleZip = path.join(publicDir, 'Gboard_Dict_R.zip');
fs.copyFileSync(ruleZip, path.join(publicDir, 'Gboard_ToneRules.zip'));

console.log("   ✓ Đã tạo các alias tiện dụng (PersonalDictionary.zip, Gboard_Fast_Memo.zip, Gboard_Dict_R_P_L.zip...)");

// 5. SINH CÁC FILE TEXT TĨNH
console.log("-> Bắt đầu đồng bộ các file Text mặc định...");

// 5.1. File mặc định (Toàn bộ F + 0 + 9 + R)
const contentFull = header + [...R_lines, ...F_lines, ...Zero_lines, ...Nine_lines].join('\n');
fs.writeFileSync(path.join(publicDir, 'dictionary_2way.txt'), contentFull, 'utf8');
fs.writeFileSync(path.join(publicDir, 'gboard_dictionary.txt'), contentFull, 'utf8');
fs.writeFileSync(path.join(publicDir, 'dictionary_1way.txt'), header + F_lines.join('\n'), 'utf8');

// 5.2. File Rules (36 quy tắc)
const contentRules = header + R_lines.join('\n');
fs.writeFileSync(path.join(publicDir, 'rules_dictionary.txt'), contentRules, 'utf8');

// Dọn dẹp dictionary.txt tạm trong public
const tempTxt = path.join(publicDir, 'dictionary.txt');
if (fs.existsSync(tempTxt)) fs.unlinkSync(tempTxt);

console.log("🎉 ĐÃ TÁI TẠO XONG 100% CÁC FILE TỪ ĐIỂN!");
