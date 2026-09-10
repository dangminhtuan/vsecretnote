// 60 Ký tự chuẩn của Base60 mapping (0..59)
export const B60_MAPPING = [
  'c','d','g','G','j','k','K','h','v','D','m','C','r','s','n','b','l','Q','S','z',
  'N','y','L','W','p','f','q','t','T','R','x','0','1','2','3','4','5','6','7','8',
  '9','A','B','E','F','H','o','J','M','P','U','V','X','Y','Z','a','e','i','u','w'
];

export const GLYPH_RECIPES = [
  // 0: 'c'
  { id: 0, char: 'c', path: '<path d="M 68 28 A 25 25 0 0 0 68 72" fill="none" />' },
  // 1: 'd' - Nét móc lưỡi câu / chữ d khuyết
  { id: 1, char: 'd', path: '<path d="M 50 20 L 50 50 A 18 15 0 0 0 50 80" fill="none" />' },
  // 2: 'g' - Tia sét hình học ziczac ↯ (Không mũi tên)
  { id: 2, char: 'g', path: '<polyline points="60,20 38,48 58,48 36,80" fill="none" />' },
  // 3: 'G' - Cung C hoa cong to đối xứng gương
  { id: 3, char: 'G', path: '<path d="M 24 22 A 30 30 0 1 1 24 78" fill="none" />' },
  // 4: 'j' - Nét móc câu nhỏ gọn
  { id: 4, char: 'j', path: '<path d="M 56 32 L 56 58 A 12 12 0 0 1 32 68" fill="none" />' },
  // 5: 'k' - Góc nhọn mở phải nhỏ
  { id: 5, char: 'k', path: '<polyline points="64,30 34,50 64,70" fill="none" />' },
  // 6: 'K' - Góc nhọn mở trái nét dài
  { id: 6, char: 'K', path: '<polyline points="22,24 78,50 22,76" fill="none" />' },
  // 7: 'h' - Trái tim hình học đáy nhọn ♡
  { id: 7, char: 'h', path: '<path d="M 50 42 A 14 14 0 0 0 22 42 L 50 80 L 78 42 A 14 14 0 0 0 50 42 Z" fill="none" />' },
  // 8: 'v' - Góc nhọn v nhỏ ∨
  { id: 8, char: 'v', path: '<polyline points="32,44 50,76 68,44" fill="none" />' },
  // 9: 'D' - Bán nguyệt lớn khép kín quay phải
  { id: 9, char: 'D', path: '<path d="M 32 22 L 32 78 A 28 28 0 0 0 32 22 Z" fill="none" />' },
  // 10: 'm' - Hai vòm sóng đôi liên tiếp
  { id: 10, char: 'm', path: '<path d="M 22 62 A 14 14 0 0 1 50 62 A 14 14 0 0 1 78 62" fill="none" />' },
  // 11: 'C' - Cung tròn lớn mở rộng
  { id: 11, char: 'C', path: '<path d="M 76 22 A 30 30 0 1 0 76 78" fill="none" />' },
  // 12: 'r' - Góc vuông trên-trái ┌
  { id: 12, char: 'r', path: '<polyline points="35,66 35,34 75,34" fill="none" />' },
  // 13: 's' - Góc vuông ngược đáy phải _|
  { id: 13, char: 's', path: '<polyline points="65,34 65,66 25,66" fill="none" />' },
  // 14: 'n' - Một vòm cong đơn mở dưới ⌒
  { id: 14, char: 'n', path: '<path d="M 28 62 A 22 22 0 0 1 72 62" fill="none" />' },
  // 15: 'b' - Trục đứng liền bụng phải
  { id: 15, char: 'b', path: '<path d="M 36 22 L 36 78 A 18 18 0 0 0 36 42" fill="none" />' },
  // 16: 'l' - Nét gạch dọc 90 độ
  { id: 16, char: 'l', path: '<line x1="50" y1="18" x2="50" y2="82" />' },
  // 17: 'Q' - Hình vuông khép kín □
  { id: 17, char: 'Q', path: '<rect x="30" y="30" width="40" height="40" rx="4" fill="none" />' },
  // 18: 'S' - Chữ S hoa 2 vòm đối xứng tâm
  { id: 18, char: 'S', path: '<path d="M 64 22 C 32 14, 26 40, 50 50 C 74 60, 68 86, 36 78" fill="none" />' },
  // 19: 'z' - Góc vuông trên-phải ┐
  { id: 19, char: 'z', path: '<polyline points="25,34 65,34 65,66" fill="none" />' },
  // 20: 'N' - Ziczac chữ N hoa
  { id: 20, char: 'N', path: '<polyline points="30,78 30,22 70,78 70,22" fill="none" />' },
  // 21: 'y' - Chữ y phân nhánh cân đối
  { id: 21, char: 'y', path: '<line x1="68" y1="24" x2="32" y2="80" /><line x1="32" y1="24" x2="50" y2="52" />' },
  // 22: 'L' - Góc vuông chữ L |_
  { id: 22, char: 'L', path: '<polyline points="34,22 34,78 76,78" fill="none" />' },
  // 23: 'W' - Bốn nét xiên ziczac lớn W
  { id: 23, char: 'W', path: '<polyline points="20,24 35,78 50,42 65,78 80,24" fill="none" />' },
  // 24: 'p' - Trục rủ liền vòm trên
  { id: 24, char: 'p', path: '<path d="M 36 80 L 36 28 A 18 18 0 0 1 36 64" fill="none" />' },
  // 25: 'f' - Chữ T ngược ⊥
  { id: 25, char: 'f', path: '<line x1="24" y1="76" x2="76" y2="76" /><line x1="50" y1="76" x2="50" y2="24" />' },
  // 26: 'q' - Khung vuông mở phải ⊏
  { id: 26, char: 'q', path: '<polyline points="68,30 30,30 30,70 68,70" fill="none" />' },
  // 27: 't' - Dấu chữ thập +
  { id: 27, char: 't', path: '<line x1="30" y1="50" x2="70" y2="50" /><line x1="50" y1="26" x2="50" y2="76" />' },
  // 28: 'T' - Chữ T hoa đối xứng ⊤
  { id: 28, char: 'T', path: '<line x1="22" y1="24" x2="78" y2="24" /><line x1="50" y1="24" x2="50" y2="78" />' },
  // 29: 'R' - Trục dài xiên + mái ngắn vát đỉnh phải
  { id: 29, char: 'R', path: '<polyline points="32,78 54,26 76,48" fill="none" />' },
  // 30: 'x' - Dấu chéo nhỏ ×
  { id: 30, char: 'x', path: '<line x1="34" y1="44" x2="66" y2="76" /><line x1="66" y1="44" x2="34" y2="76" />' },
  // 31: '0' - Oval số 0 + tâm ⊙
  { id: 31, char: '0', path: '<ellipse cx="50" cy="50" rx="22" ry="28" fill="none" /><circle cx="50" cy="50" r="4" fill="currentColor" />' },
  // 32: '1' - Nét gập số 1
  { id: 32, char: '1', path: '<polyline points="36,36 50,22 50,80" fill="none" />' },
  // 33: '2' - Vòm cong + đáy ngang số 2
  { id: 33, char: '2', path: '<path d="M 32 36 A 16 16 0 0 1 68 44 C 68 62, 34 66, 32 78 L 70 78" fill="none" />' },
  // 34: '3' - Hai vòm mở trái số 3
  { id: 34, char: '3', path: '<path d="M 34 26 L 66 26 C 56 46, 56 46, 66 54 A 16 16 0 0 1 34 76" fill="none" />' },
  // 35: '4' - Chữ số 4 hình học
  { id: 35, char: '4', path: '<polyline points="62,22 28,58 72,58" fill="none" /><line x1="62" y1="36" x2="62" y2="80" />' },
  // 36: '5' - Chữ số 5 hình học
  { id: 36, char: '5', path: '<polyline points="68,26 34,26 32,48" fill="none" /><path d="M 32 48 A 18 18 0 1 1 32 76" fill="none" />' },
  // 37: '6' - Chữ số 6 hình học
  { id: 37, char: '6', path: '<circle cx="50" cy="62" r="17" fill="none" /><path d="M 33 60 C 32 38, 44 24, 66 24" fill="none" />' },
  // 38: '7' - Góc tù số 7
  { id: 38, char: '7', path: '<polyline points="28,26 72,26 44,78" fill="none" />' },
  // 39: '8' - Hai vòng tròn xếp chồng
  { id: 39, char: '8', path: '<circle cx="50" cy="38" r="14" fill="none" /><circle cx="50" cy="64" r="16" fill="none" />' },
  // 40: '9' - Vòng tròn đỉnh + đuôi rủ
  { id: 40, char: '9', path: '<circle cx="50" cy="38" r="17" fill="none" /><path d="M 67 38 L 67 66 A 14 14 0 0 1 42 78" fill="none" />' },
  // 41: 'A' - Gạch xiên nghịch 45° nét dài \
  { id: 41, char: 'A', path: '<line x1="26" y1="26" x2="74" y2="74" />' },
  // 42: 'B' - Chữ B hoa 2 vòm bụng (Kích thước thanh thoát, vừa vặn cân đối)
  { id: 42, char: 'B', path: '<line x1="32" y1="30" x2="32" y2="72" /><path d="M 32 30 L 48 30 A 10 10 0 0 1 48 50 L 32 50" fill="none" /><path d="M 32 50 L 49 50 A 11 11 0 0 1 49 72 L 32 72" fill="none" />' },
  // 43: 'E' - Chữ T xoay 90° ⊢
  { id: 43, char: 'E', path: '<line x1="32" y1="22" x2="32" y2="78" /><line x1="32" y1="50" x2="72" y2="50" />' },
  // 44: 'F' - Chữ T xoay trái ⊣
  { id: 44, char: 'F', path: '<line x1="66" y1="22" x2="66" y2="78" /><line x1="66" y1="50" x2="28" y2="50" />' },
  // 45: 'H' - Cổng vòm vuông mở dưới ⊓
  { id: 45, char: 'H', path: '<polyline points="30,68 30,30 70,30 70,68" fill="none" />' },
  // 46: 'o' - Vòng tròn nhỏ xoe ở giữa ○
  { id: 46, char: 'o', path: '<circle cx="50" cy="50" r="18" fill="none" />' },
  // 47: 'J' - Ngang đỉnh + móc cong lớn J
  { id: 47, char: 'J', path: '<line x1="32" y1="24" x2="72" y2="24" /><path d="M 58 24 L 58 64 A 18 18 0 0 1 28 74" fill="none" />' },
  // 48: 'M' - Ziczac M lớn
  { id: 48, char: 'M', path: '<polyline points="20,72 35,28 50,56 65,28 80,72" fill="none" />' },
  // 49: 'P' - Khung vuông mở trái ⊐
  { id: 49, char: 'P', path: '<polyline points="32,30 70,30 70,70 32,70" fill="none" />' },
  // 50: 'U' - Khung chữ U vuông ⊔
  { id: 50, char: 'U', path: '<polyline points="30,32 30,70 70,70 70,32" fill="none" />' },
  // 51: 'V' - Chóp nón lớn ^ nét dài
  { id: 51, char: 'V', path: '<polyline points="24,78 50,22 76,78" fill="none" />' },
  // 52: 'X' - Dấu chéo lớn X
  { id: 52, char: 'X', path: '<line x1="24" y1="24" x2="76" y2="76" /><line x1="76" y1="24" x2="24" y2="76" />' },
  // 53: 'Y' - Chữ Y lớn phân nhánh
  { id: 53, char: 'Y', path: '<polyline points="26,24 50,52 74,24" fill="none" /><line x1="50" y1="52" x2="50" y2="80" />' },
  // 54: 'Z' - Chữ Z lớn toàn khung
  { id: 54, char: 'Z', path: '<polyline points="26,24 74,24 26,76 74,76" fill="none" />' },
  // 55: 'a' - Một gạch ngang đơn -
  { id: 55, char: 'a', path: '<line x1="22" y1="50" x2="78" y2="50" />' },
  // 56: 'e' - Hai gạch ngang song song =
  { id: 56, char: 'e', path: '<line x1="24" y1="38" x2="76" y2="38" /><line x1="24" y1="62" x2="76" y2="62" />' },
  // 57: 'i' - Nét nghiêng thuận 45° ngắn /
  { id: 57, char: 'i', path: '<line x1="38" y1="62" x2="62" y2="38" />' },
  // 58: 'u' - Cung chữ u tròn mở trên ∪
  { id: 58, char: 'u', path: '<path d="M 28 26 L 28 58 A 22 22 0 0 0 72 58 L 72 26" fill="none" />' },
  // 59: 'w' - Chữ w nhỏ hai đỉnh nhọn
  { id: 59, char: 'w', path: '<polyline points="20,44 32,74 44,52 56,74 68,44" fill="none" />' }
];

/**
 * Ghép 2 hoặc 3 ký tự Base60 thành một khối chữ tượng hình Hangul / Cyber block hoàn chỉnh
 * @param {string} b60Code Chuỗi mã Base60 (2 hoặc 3 ký tự)
 * @param {number} size Kích thước SVG (px, mặc định 82)
 * @param {string} strokeColor Màu nét (mặc định #00f2fe)
 */
export function buildHangulBlockSvg(b60Code, size = 82, strokeColor = '#00f2fe') {
  if (!b60Code || b60Code === '--' || b60Code === '??') {
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}">
      <rect x="4" y="4" width="92" height="92" rx="12" fill="#0b1120" stroke="#1e2c4a" stroke-width="1.5"/>
      <text x="50" y="58" fill="#64748b" font-size="28" text-anchor="middle" font-family="monospace">?</text>
    </svg>`;
  }

  const chars = [...b60Code];
  const strokeW = 6.5;

  // Lấy glyph recipes tương ứng
  const getG = (ch) => {
    const idx = Math.max(0, B60_MAPPING.indexOf(ch));
    return GLYPH_RECIPES[idx] || GLYPH_RECIPES[0];
  };

  if (chars.length === 1) {
    const g = getG(chars[0]);
    return `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px ${strokeColor}44);">
        <rect x="2" y="2" width="96" height="96" rx="12" fill="#080e1a" stroke="${strokeColor}" stroke-width="1.2" opacity="0.3" />
        <g transform="translate(10, 10) scale(0.8)">${g.path}</g>
      </svg>
    `;
  }

  if (chars.length === 2) {
    // 2 Nét: Kiểu Hangul tầng trên (Phụ âm C1) và tầng dưới (Vần C2)
    const g1 = getG(chars[0]);
    const g2 = getG(chars[1]);
    return `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px ${strokeColor}55);">
        <rect x="2" y="2" width="96" height="96" rx="12" fill="#080e1a" stroke="${strokeColor}" stroke-width="1.2" opacity="0.3" />
        <line x1="12" y1="50" x2="88" y2="50" stroke="${strokeColor}" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.25"/>
        <!-- Tầng trên: C1 Phụ âm -->
        <g transform="translate(20, 4) scale(0.6)">${g1.path}</g>
        <!-- Tầng dưới: C2 Vần -->
        <g transform="translate(20, 46) scale(0.6)">${g2.path}</g>
      </svg>
    `;
  }

  // 3 Nét: C1 (Phụ âm), C2 (Vần), C3 (Thanh điệu)
  const c1Char = chars[0], c2Char = chars[1], c3Char = chars[2];
  const g1 = getG(c1Char);
  const g2 = getG(c2Char);
  const g3 = getG(c3Char);

  const isC3Upper = /[A-Z]/.test(c3Char);

  if (!isC3Upper) {
    // △ Tam giác thuận: C3 ở đỉnh trên, C1 dưới trái, C2 dưới phải
    return `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}" stroke="${strokeColor}" stroke-width="${strokeW * 0.75}" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px ${strokeColor}55);">
        <rect x="2" y="2" width="96" height="96" rx="12" fill="#080e1a" stroke="${strokeColor}" stroke-width="1.2" opacity="0.25" />
        <polygon points="50,6 94,94 6,94" fill="none" stroke="${strokeColor}" stroke-width="0.6" stroke-dasharray="3,3" opacity="0.18" />
        <!-- C3 (Thanh điệu thường) trên đỉnh -->
        <g transform="translate(21, 6) scale(0.58)">${g3.path}</g>
        <!-- C1 (Phụ âm) đáy dưới trái -->
        <g transform="translate(6, 42) scale(0.58)">${g1.path}</g>
        <!-- C2 (Vần) đáy dưới phải -->
        <g transform="translate(36, 42) scale(0.58)">${g2.path}</g>
      </svg>
    `;
  } else {
    // ▽ Tam giác ngược: C1 trên trái, C2 trên phải, C3 HOA ở chân đế dưới
    return `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}" stroke="${strokeColor}" stroke-width="${strokeW * 0.75}" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px ${strokeColor}55);">
        <rect x="2" y="2" width="96" height="96" rx="12" fill="#080e1a" stroke="${strokeColor}" stroke-width="1.2" opacity="0.25" />
        <polygon points="6,6 94,6 50,94" fill="none" stroke="${strokeColor}" stroke-width="0.6" stroke-dasharray="3,3" opacity="0.18" />
        <!-- C1 (Phụ âm) trên trái -->
        <g transform="translate(6, 8) scale(0.58)">${g1.path}</g>
        <!-- C2 (Vần) trên phải -->
        <g transform="translate(36, 8) scale(0.58)">${g2.path}</g>
        <!-- C3 (Thanh điệu HOA) chân đế dưới -->
        <g transform="translate(21, 44) scale(0.58)">${g3.path}</g>
      </svg>
    `;
  }
}
