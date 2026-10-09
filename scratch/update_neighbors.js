import fs from 'fs';

let content = fs.readFileSync('keyboard-grid.html', 'utf8');

const startMarker = '    const KEY_NEIGHBORS = {';
const endMarker = '    // Từ điển dự đoán không dấu ➔ có dấu';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const replacement = `    function buildCanonicalKeyNeighbors() {
      const CONS_MAP = {
        't': 'Th', 'r': 'Tr', 'c': 'Ch', 'k': 'Kh', 'g': 'Gh',
        'n': 'Ng', 'h': 'Nh', 'p': 'Ph', 'q': 'Qu', 'l': 'Ngh', 'd': 'đ'
      };

      const map = {};
      const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

      for (const ch of letters) {
        const lowIdx = BASE60_MAPPING.indexOf(ch);
        const upIdx = BASE60_MAPPING.indexOf(ch.toUpperCase());

        const r1_low = lowIdx !== -1 && RHYMES_BASE[lowIdx] !== '-' ? '-' + RHYMES_BASE[lowIdx] : null;
        const r2_low = lowIdx !== -1 && RHYMES_EXTRA_1[lowIdx] !== '-' ? '-' + RHYMES_EXTRA_1[lowIdx] : null;
        const r3_low = lowIdx !== -1 && RHYMES_EXTRA_2[lowIdx] !== '-' ? '-' + RHYMES_EXTRA_2[lowIdx] : null;

        const r1_up = upIdx !== -1 && RHYMES_BASE[upIdx] !== '-' ? '-' + RHYMES_BASE[upIdx] : null;
        const r2_up = upIdx !== -1 && RHYMES_EXTRA_1[upIdx] !== '-' ? '-' + RHYMES_EXTRA_1[upIdx] : null;
        const r3_up = upIdx !== -1 && RHYMES_EXTRA_2[upIdx] !== '-' ? '-' + RHYMES_EXTRA_2[upIdx] : null;

        const cons = CONS_MAP[ch];
        const dirs = {};

        // Hàng trên: 3 vần thường (B1 Lam, B2 Vàng, B3 Lục)
        if (r1_low) dirs.top_left = { rhyme: r1_low };
        if (r2_low) dirs.top = { rhyme: r2_low };
        if (r3_low) dirs.top_right = { rhyme: r3_low };

        // Cánh trái: Phụ âm ghép tím (nếu có), hoặc vần HOA B1
        if (cons) {
          dirs.left = { rhyme: cons, type: 'cons' };
          if (r1_up) dirs.bottom_left = { rhyme: r1_up };
        } else {
          if (r1_up) dirs.left = { rhyme: r1_up };
        }

        // Cánh phải & dưới: Các vần HOA B2 & B3
        if (r2_up) dirs.right = { rhyme: r2_up };
        if (r3_up) dirs.bottom = { rhyme: r3_up };

        map[ch] = dirs;
      }

      // Hàng số 0..9 (Vần phụ bổ trợ)
      const digits = '0123456789'.split('');
      for (const dg of digits) {
        const idx = BASE60_MAPPING.indexOf(dg);
        if (idx !== -1) {
          const r1 = RHYMES_BASE[idx] !== '-' ? '-' + RHYMES_BASE[idx] : null;
          const r2 = RHYMES_EXTRA_1[idx] !== '-' ? '-' + RHYMES_EXTRA_1[idx] : null;
          const r3 = RHYMES_EXTRA_2[idx] !== '-' ? '-' + RHYMES_EXTRA_2[idx] : null;
          map[dg] = {
            bottom_left: r1 ? { rhyme: r1 } : null,
            bottom: r2 ? { rhyme: r2 } : null,
            bottom_right: r3 ? { rhyme: r3 } : null
          };
        }
      }

      return map;
    }

    const KEY_NEIGHBORS = buildCanonicalKeyNeighbors();

`;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync('keyboard-grid.html', newContent, 'utf8');
console.log('Successfully updated KEY_NEIGHBORS in keyboard-grid.html!');
