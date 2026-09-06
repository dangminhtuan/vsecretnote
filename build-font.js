import fs from 'fs';
import { execSync } from 'child_process';
import opentype from 'opentype.js';
import { BASE60_SS, BASE60_HH, BASE60_HH_EXTRA, BASE60_MM } from './vcomp.js';
import { BASE60_MAPPING } from './data.js';

const FONT_URL = './public/Rajdhani-Bold.ttf';
const OUTPUT_FONT_RAW = './public/CyberVietnamese-Raw.ttf';
const OUTPUT_FEA = './features.fea';
const OUTPUT_FONT_FINAL = './public/CyberVietnamese-Regular.ttf';
const DIST_FONT_FINAL = './dist/CyberVietnamese-Regular.ttf';

async function buildFont() {
  console.log("Loading base font...");
  const fontBuffer = fs.readFileSync(FONT_URL);
  const baseFont = opentype.parse(fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength));

  const glyphs = [];
  
  // Standard NotDef and Space
  glyphs.push(new opentype.Glyph({
      name: '.notdef', unicode: 0, advanceWidth: 1000, path: new opentype.Path()
  }));
  glyphs.push(new opentype.Glyph({
      name: 'space', unicode: 32, advanceWidth: 500, path: new opentype.Path()
  }));

  const PAD = 0.03;
  // OpenType Coordinates: X: 0->1000, Y: -200->800
  // Bố cục Tam giác Thuận (△ - khi C3 là chữ thường hoặc số):
  // - c1_bot: Đáy trái (x: 70, y: -140, w: 410, h: 420) -> dồn phải (ax: 1), dồn lên (ay: 1)
  // - c2_bot: Đáy phải (x: 520, y: -140, w: 410, h: 420) -> dồn trái (ax: -1), dồn lên (ay: 1)
  // - c3_top: Đỉnh trên (x: 270, y: 320, w: 460, h: 420) -> căn giữa X (ax: 0), dồn xuống (ay: -1)

  // Bố cục Tam giác Ngược (▽ - khi C3 là chữ HOA):
  // - c1_top: Đáy trên-trái (x: 70, y: 320, w: 410, h: 420) -> dồn phải (ax: 1), dồn xuống (ay: -1)
  // - c2_top: Đáy trên-phải (x: 520, y: 320, w: 410, h: 420) -> dồn trái (ax: -1), dồn xuống (ay: -1)
  // - c3_bot: Đỉnh dưới (x: 270, y: -140, w: 460, h: 420) -> căn giữa X (ax: 0), dồn lên (ay: 1)
  const ZONES = {
    c1_bot: { x: 70,  y: -140, w: 410, h: 420, ax: 1,  ay: 1  },
    c2_bot: { x: 520, y: -140, w: 410, h: 420, ax: -1, ay: 1  },
    c3_top: { x: 270, y: 320,  w: 460, h: 420, ax: 0,  ay: -1 },

    c1_top: { x: 70,  y: 320,  w: 410, h: 420, ax: 1,  ay: -1 },
    c2_top: { x: 520, y: 320,  w: 410, h: 420, ax: -1, ay: -1 },
    c3_bot: { x: 270, y: -140, w: 460, h: 420, ax: 0,  ay: 1  },
  };

  const refPath = baseFont.getPath('C', 0, 0, 1000);
  const refBb = refPath.getBoundingBox();
  const refW = refBb.x2 - refBb.x1;
  const refH = refBb.y2 - refBb.y1;

  // 1 đường viền thanh thẳng đứng ở mép trái (Dành cho Viết Hoa - Title Case)
  function addLeftBorder(p) {
    const x1 = 20, x2 = 48;
    const y1 = -160, y2 = 760;
    p.moveTo(x1, y1);
    p.lineTo(x2, y1);
    p.lineTo(x2, y2);
    p.lineTo(x1, y2);
    p.close();
  }

  // Khung viền chữ nhật bao bọc 4 phía (Dành cho Viết HOA TOÀN BỘ - ALL CAPS)
  function addRoundedRectFrame(p, x, y, w, h, rx, th) {
    const k = 0.5522847498;
    // Outer rect (Clockwise)
    p.moveTo(x + rx, y + h);
    p.lineTo(x + w - rx, y + h);
    p.curveTo(x + w - rx + rx*k, y + h, x + w, y + h - rx + rx*k, x + w, y + h - rx);
    p.lineTo(x + w, y + rx);
    p.curveTo(x + w, y + rx - rx*k, x + w - rx + rx*k, y, x + w - rx, y);
    p.lineTo(x + rx, y);
    p.curveTo(x + rx - rx*k, y, x, y + rx - rx*k, x, y + rx);
    p.lineTo(x, y + h - rx);
    p.curveTo(x, y + h - rx + rx*k, x + rx - rx*k, y + h, x + rx, y + h);
    p.close();

    // Inner rect (Counter-Clockwise)
    const ix = x + th, iy = y + th, iw = w - th * 2, ih = h - th * 2, irx = Math.max(0, rx - th);
    p.moveTo(ix + irx, iy + ih);
    p.curveTo(ix + irx - irx*k, iy + ih, ix, iy + ih - irx + irx*k, ix, iy + ih - irx);
    p.lineTo(ix, iy + irx);
    p.curveTo(ix, iy + irx - irx*k, ix + irx - irx*k, iy, ix + irx, iy);
    p.lineTo(ix + iw - irx, iy);
    p.curveTo(ix + iw - irx + irx*k, iy, ix + iw, iy + irx - irx*k, ix + iw, iy + irx);
    p.lineTo(ix + iw, iy + ih - irx);
    p.curveTo(ix + iw, iy + ih - irx + irx*k, ix + iw - irx + irx*k, iy + ih, ix + iw - irx, iy + ih);
    p.lineTo(ix + irx, iy + ih);
    p.close();
  }

  function createPositionalPath(char, zone, caseType = 'LOWER') {
    const iW = zone.w * (1 - PAD * 2), iH = zone.h * (1 - PAD * 2);
    const iX = zone.x + zone.w * PAD,  iY = zone.y + zone.h * PAD;

    const baseGlyph = baseFont.charToGlyph(char);
    const basePath = baseGlyph.path;
    const bb = basePath.getBoundingBox();
    const cW = bb.x2 - bb.x1;
    const cH = bb.y2 - bb.y1;
    
    const baseSc = Math.min(iW / refW, iH / refH);
    const sc = Math.min(baseSc, iW / cW, iH / cH);
    const scaledW = cW * sc;
    const scaledH = cH * sc;
    
    let ox = iX + (iW - scaledW) / 2;
    if (zone.ax === -1) ox = iX;
    if (zone.ax === 1)  ox = iX + iW - scaledW;
    
    let oy = iY + (iH - scaledH) / 2;
    if (zone.ay === -1) oy = iY;
    if (zone.ay === 1)  oy = iY + iH - scaledH;

    const outPath = new opentype.Path();
    for (const cmd of basePath.commands) {
      if (cmd.type === 'M') outPath.moveTo(ox + (cmd.x - bb.x1)*sc, oy + (cmd.y - bb.y1)*sc);
      else if (cmd.type === 'L') outPath.lineTo(ox + (cmd.x - bb.x1)*sc, oy + (cmd.y - bb.y1)*sc);
      else if (cmd.type === 'Q') outPath.quadraticCurveTo(ox + (cmd.x1 - bb.x1)*sc, oy + (cmd.y1 - bb.y1)*sc, ox + (cmd.x - bb.x1)*sc, oy + (cmd.y - bb.y1)*sc);
      else if (cmd.type === 'C') outPath.curveTo(ox + (cmd.x1 - bb.x1)*sc, oy + (cmd.y1 - bb.y1)*sc, ox + (cmd.x2 - bb.x1)*sc, oy + (cmd.y2 - bb.y1)*sc, ox + (cmd.x - bb.x1)*sc, oy + (cmd.y - bb.y1)*sc);
      else if (cmd.type === 'Z') outPath.close();
    }

    if (caseType === 'TITLE') {
      addLeftBorder(outPath);
    } else if (caseType === 'ALL') {
      addRoundedRectFrame(outPath, 18, -170, 964, 950, 24, 22);
    }

    return outPath;
  }

  function getCharName(char) {
    if (char === 'I') return 'prefix_I';
    if (char === 'O') return 'prefix_O';
    if (/[a-zA-Z0-9]/.test(char)) return 'b60_' + char;
    const names = {
        '!': 'exclam', '@': 'at', '#': 'numbersign', '$': 'dollar', '%': 'percent',
        '^': 'asciicircum', '&': 'ampersand', '*': 'asterisk', '(': 'parenleft', ')': 'parenright',
        '-': 'hyphen', '_': 'underscore', '=': 'equal', '+': 'plus', '[': 'bracketleft',
        ']': 'bracketright', '{': 'braceleft', '}': 'braceright', '|': 'bar', '\\': 'backslash',
        ';': 'semicolon', ':': 'colon', "'": 'quotesingle', '"': 'quotedbl', ',': 'comma',
        '.': 'period', '<': 'less', '>': 'greater', '/': 'slash', '?': 'question', '~': 'asciitilde',
        '`': 'grave'
    };
    return names[char] || 'uni' + char.charCodeAt(0).toString(16).toUpperCase();
  }

  // 1. Thêm glyph tiền tố ẩn prefix_I và prefix_O (advanceWidth = 0, path rỗng)
  // Các glyph này đại diện trực tiếp cho các ký tự gõ 'I' và 'O' (chữ hoa)
  // NOTE: 'o' thường đã là ký tự C2 hợp lệ trong Base60, KHÔNG dùng làm tiền tố nữa
  glyphs.push(new opentype.Glyph({
    name: 'prefix_I', unicode: 'I'.charCodeAt(0), advanceWidth: 0, path: new opentype.Path()
  }));
  glyphs.push(new opentype.Glyph({
    name: 'prefix_O', unicode: 'O'.charCodeAt(0), advanceWidth: 0, path: new opentype.Path()
  }));

  // Các nhóm ký tự theo đúng vai trò ngữ nghĩa trong Base60
  // C1: Chỉ gồm các phụ âm đầu hợp lệ (Không bao giờ chứa I, O, o)
  const C1_CHARS = Array.from(new Set([...BASE60_HH, ...BASE60_HH_EXTRA])).filter(c => c && c.length === 1);
  // C2: Vần (gồm 60 ký tự)
  const C2_CHARS = Array.from(new Set([...BASE60_MM])).filter(c => c && c.length === 1);
  // C3: Dấu / thanh điệu (gồm 60 ký tự)
  const C3_CHARS = Array.from(new Set([...BASE60_SS])).filter(c => c && c.length === 1);

  // Phân loại C3 thành C3_UPPER (chữ HOA: C3 ở Dưới) và C3_LOWER (chữ thường/số: C3 ở Trên)
  const C3_UPPER = C3_CHARS.filter(c => /[A-Z]/.test(c));
  const C3_LOWER = C3_CHARS.filter(c => !/[A-Z]/.test(c));

  // Tập hợp toàn bộ ký tự Base60
  const allChars = Array.from(new Set([
    ...C1_CHARS,
    ...C2_CHARS,
    ...C3_CHARS,
    ...BASE60_MAPPING
  ])).filter(c => c && c.length === 1);

  console.log(`Processing ${allChars.length} characters for Base60 font...`);

  // Tạo base glyphs cho các ký tự (ngoại trừ I, O đã gán vào prefix; 'o' thường là ký tự C2 hợp lệ)
  for (let i = 0; i < allChars.length; i++) {
    const char = allChars[i];
    if (char === 'I' || char === 'O') continue;
    
    const name = getCharName(char);
    const unicode = char.charCodeAt(0);
    const baseGlyph = baseFont.charToGlyph(char);
    glyphs.push(new opentype.Glyph({
        name: name,
        unicode: unicode,
        advanceWidth: baseGlyph.advanceWidth,
        path: baseGlyph.path
    }));
  }

  // Tạo glyphs cho C1:
  // - pos1_bot (khi C3 ở trên): nằm ở Đáy trái
  // - pos1_top (khi C3 ở dưới): nằm ở Đáy trên-trái
  for (const char of C1_CHARS) {
    const name = getCharName(char);
    glyphs.push(new opentype.Glyph({
      name: name + '.pos1_bot', advanceWidth: 0, path: createPositionalPath(char, ZONES.c1_bot)
    }));
    glyphs.push(new opentype.Glyph({
      name: name + '.pos1_top', advanceWidth: 0, path: createPositionalPath(char, ZONES.c1_top)
    }));
  }

  // Tạo glyphs cho C2:
  // - pos2_bot (khi C3 ở trên): nằm ở Đáy phải
  // - pos2_top (khi C3 ở dưới): nằm ở Đáy trên-phải
  for (const char of C2_CHARS) {
    const name = getCharName(char);
    glyphs.push(new opentype.Glyph({
      name: name + '.pos2_bot', advanceWidth: 0, path: createPositionalPath(char, ZONES.c2_bot)
    }));
    glyphs.push(new opentype.Glyph({
      name: name + '.pos2_top', advanceWidth: 0, path: createPositionalPath(char, ZONES.c2_top)
    }));
  }

  // Tạo glyphs cho C3_LOWER (C3 ở Trên - Đỉnh nón thuận △):
  for (const char of C3_LOWER) {
    const name = getCharName(char);
    glyphs.push(new opentype.Glyph({
      name: name + '.pos3_top', advanceWidth: 1000, path: createPositionalPath(char, ZONES.c3_top, 'LOWER')
    }));
    glyphs.push(new opentype.Glyph({
      name: name + '.pos3_top_t', advanceWidth: 1000, path: createPositionalPath(char, ZONES.c3_top, 'TITLE')
    }));
    glyphs.push(new opentype.Glyph({
      name: name + '.pos3_top_a', advanceWidth: 1000, path: createPositionalPath(char, ZONES.c3_top, 'ALL')
    }));
  }

  // Tạo glyphs cho C3_UPPER (C3 ở Dưới - Đỉnh chóp ngược ▽):
  for (const char of C3_UPPER) {
    const name = getCharName(char);
    glyphs.push(new opentype.Glyph({
      name: name + '.pos3_bot', advanceWidth: 1000, path: createPositionalPath(char, ZONES.c3_bot, 'LOWER')
    }));
    glyphs.push(new opentype.Glyph({
      name: name + '.pos3_bot_t', advanceWidth: 1000, path: createPositionalPath(char, ZONES.c3_bot, 'TITLE')
    }));
    glyphs.push(new opentype.Glyph({
      name: name + '.pos3_bot_a', advanceWidth: 1000, path: createPositionalPath(char, ZONES.c3_bot, 'ALL')
    }));
  }

  console.log(`Generating font with ${glyphs.length} glyphs...`);
  const font = new opentype.Font({
      familyName: 'Cyber Vietnamese',
      styleName: 'Regular',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
      glyphs: glyphs
  });

  font.download = function() {};
  fs.writeFileSync(OUTPUT_FONT_RAW, Buffer.from(font.toArrayBuffer()));
  console.log(`Saved raw font to ${OUTPUT_FONT_RAW}`);

  // Xây dựng các lớp OpenType FEA
  const c1Names = C1_CHARS.map(getCharName);
  const c1Pos1BotNames = C1_CHARS.map(c => getCharName(c) + '.pos1_bot');
  const c1Pos1TopNames = C1_CHARS.map(c => getCharName(c) + '.pos1_top');

  const c2Names = C2_CHARS.map(getCharName);
  const c2Pos2BotNames = C2_CHARS.map(c => getCharName(c) + '.pos2_bot');
  const c2Pos2TopNames = C2_CHARS.map(c => getCharName(c) + '.pos2_top');

  const c3LowerNames = C3_LOWER.map(getCharName);
  const c3Pos3TopNames = C3_LOWER.map(c => getCharName(c) + '.pos3_top');
  const c3Pos3TopTNames = C3_LOWER.map(c => getCharName(c) + '.pos3_top_t');
  const c3Pos3TopANames = C3_LOWER.map(c => getCharName(c) + '.pos3_top_a');

  const c3UpperNames = C3_UPPER.map(getCharName);
  const c3Pos3BotNames = C3_UPPER.map(c => getCharName(c) + '.pos3_bot');
  const c3Pos3BotTNames = C3_UPPER.map(c => getCharName(c) + '.pos3_bot_t');
  const c3Pos3BotANames = C3_UPPER.map(c => getCharName(c) + '.pos3_bot_a');

  // Generate features.fea với phân tách chính xác:
  const fea = `languagesystem DFLT dflt;
languagesystem latn dflt;

@c1 = [${c1Names.join(' ')}];
@c1_p1_bot = [${c1Pos1BotNames.join(' ')}];
@c1_p1_top = [${c1Pos1TopNames.join(' ')}];

@c2 = [${c2Names.join(' ')}];
@c2_p2_bot = [${c2Pos2BotNames.join(' ')}];
@c2_p2_top = [${c2Pos2TopNames.join(' ')}];

@c3_lower = [${c3LowerNames.join(' ')}];
@c3_p3_top = [${c3Pos3TopNames.join(' ')}];
@c3_p3_top_t = [${c3Pos3TopTNames.join(' ')}];
@c3_p3_top_a = [${c3Pos3TopANames.join(' ')}];

@c3_upper = [${c3UpperNames.join(' ')}];
@c3_p3_bot = [${c3Pos3BotNames.join(' ')}];
@c3_p3_bot_t = [${c3Pos3BotTNames.join(' ')}];
@c3_p3_bot_a = [${c3Pos3BotANames.join(' ')}];

feature calt {
    # 1. Chữ Hoa đầu từ (Tiền tố 'I') -> 1 viền đứng bên trái
    # 1a. Nếu C3 là HOA -> C3 ở Dưới
    sub prefix_I @c1' @c2 @c3_upper by @c1_p1_top;
    sub prefix_I @c1_p1_top @c2' @c3_upper by @c2_p2_top;
    sub prefix_I @c1_p1_top @c2_p2_top @c3_upper' by @c3_p3_bot_t;

    # 1b. Nếu C3 là thường/số -> C3 ở Trên
    sub prefix_I @c1' @c2 @c3_lower by @c1_p1_bot;
    sub prefix_I @c1_p1_bot @c2' @c3_lower by @c2_p2_bot;
    sub prefix_I @c1_p1_bot @c2_p2_bot @c3_lower' by @c3_p3_top_t;

    # 2. CHỮ HOA TOÀN TỪ (Tiền tố 'O') -> Khung viền 4 xung quanh
    # 2a. Nếu C3 là HOA -> C3 ở Dưới
    sub prefix_O @c1' @c2 @c3_upper by @c1_p1_top;
    sub prefix_O @c1_p1_top @c2' @c3_upper by @c2_p2_top;
    sub prefix_O @c1_p1_top @c2_p2_top @c3_upper' by @c3_p3_bot_a;

    # 2b. Nếu C3 là thường/số -> C3 ở Trên
    sub prefix_O @c1' @c2 @c3_lower by @c1_p1_bot;
    sub prefix_O @c1_p1_bot @c2' @c3_lower by @c2_p2_bot;
    sub prefix_O @c1_p1_bot @c2_p2_bot @c3_lower' by @c3_p3_top_a;

    # 3. Chữ thường tiêu chuẩn (Không tiền tố)
    # 3a. Nếu C3 là HOA -> C3 ở Dưới
    sub @c1' @c2 @c3_upper by @c1_p1_top;
    sub @c1_p1_top @c2' @c3_upper by @c2_p2_top;
    sub @c1_p1_top @c2_p2_top @c3_upper' by @c3_p3_bot;

    # 3b. Nếu C3 là thường/số -> C3 ở Trên
    sub @c1' @c2 @c3_lower by @c1_p1_bot;
    sub @c1_p1_bot @c2' @c3_lower by @c2_p2_bot;
    sub @c1_p1_bot @c2_p2_bot @c3_lower' by @c3_p3_top;
} calt;
`;
  fs.writeFileSync(OUTPUT_FEA, fea);
  console.log(`Saved FEA to ${OUTPUT_FEA}`);

  console.log("Compiling OpenType features via fontTools...");
  execSync(`python -c "from fontTools.feaLib.builder import addOpenTypeFeatures; from fontTools.ttLib import TTFont; font = TTFont('${OUTPUT_FONT_RAW}'); addOpenTypeFeatures(font, '${OUTPUT_FEA}'); font.save('${OUTPUT_FONT_FINAL}')"`);
  console.log(`Compiled font saved to ${OUTPUT_FONT_FINAL}`);

  if (fs.existsSync('./dist')) {
    fs.copyFileSync(OUTPUT_FONT_FINAL, DIST_FONT_FINAL);
    console.log(`Copied font to ${DIST_FONT_FINAL}`);
  }
  console.log("✓ Hoàn tất xây dựng font!");
}

buildFont();
