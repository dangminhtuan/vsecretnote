import fs from 'fs';
import opentype from 'opentype.js';
import { BASE60_SS } from './vcomp.js';

const FONT_URL = './public/Rajdhani-Bold.ttf';
const OUTPUT_FONT_RAW = './public/CyberVietnamese-Raw.ttf';
const OUTPUT_FEA = './features.fea';

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
  const ZONES = [
    { x: 50,  y: -150, w: 400, h: 400, ax: 1, ay: 1 },  // c1: Bot-Left -> Dồn Lên(ay=1), Phải(ax=1)
    { x: 550, y: -150, w: 400, h: 400, ax: -1, ay: 1 }, // c2: Bot-Right -> Dồn Lên, Trái
    { x: 50,  y: 350,  w: 400, h: 400, ax: 1, ay: -1 }, // c3: Top-Left -> Dồn Xuống, Phải
  ];
  const TONE_ZONE = { x: 550, y: 350, w: 400, h: 400 }; // Top-Right

  const refPath = baseFont.getPath('C', 0, 0, 1000);
  const refBb = refPath.getBoundingBox();
  const refW = refBb.x2 - refBb.x1;
  const refH = refBb.y2 - refBb.y1;

  function addThickLine(p, x1, y1, x2, y2, th) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const nx = (-dy / len) * (th / 2);
    const ny = (dx / len) * (th / 2);
    p.moveTo(x1 + nx, y1 + ny);
    p.lineTo(x2 + nx, y2 + ny);
    p.lineTo(x2 - nx, y2 - ny);
    p.lineTo(x1 - nx, y1 - ny);
    p.close();
  }

  function getToneMarkPath(tone, zone) {
    const cx = zone.x + zone.w * 0.35; 
    const cy = zone.y + zone.h * 0.35; // Y points UP in OpenType
    const r  = Math.min(zone.w, zone.h) * 0.35; 
    const th = 55; // Độ dày nét chuẩn
    
    const p = new opentype.Path();

    switch (tone) {
      case 0: // Ngang (=) - 2 thanh ngang khép kín
        addThickLine(p, cx - r*0.4, cy + r*0.35, cx + r*0.4, cy + r*0.35, th);
        addThickLine(p, cx - r*0.4, cy - r*0.35, cx + r*0.4, cy - r*0.35, th);
        break;
      case 1: // Sắc (/) - thanh chéo lên phải
        addThickLine(p, cx - r*0.6, cy - r*0.7, cx + r*0.6, cy + r*0.7, th);
        break;
      case 2: // Huyền (\) - thanh chéo xuống phải
        addThickLine(p, cx - r*0.6, cy + r*0.7, cx + r*0.6, cy - r*0.7, th);
        break;
      case 3: // Hỏi (?) - Móc cong khép kín (Ribbon curve)
        p.moveTo(cx - r*0.4 - th/2, cy + r*0.2);
        p.curveTo(cx - r*0.4 - th/2, cy + r*0.9 + th/2, cx + r*0.5 + th/2, cy + r*0.9 + th/2, cx + r*0.5 + th/2, cy + r*0.1);
        p.curveTo(cx + r*0.5 + th/2, cy - r*0.4, cx + th/2, cy - r*0.2, cx + th/2, cy - r*0.8);
        p.lineTo(cx - th/2, cy - r*0.8);
        p.curveTo(cx - th/2, cy - r*0.2 + th/2, cx + r*0.5 - th/2, cy - r*0.4 + th/2, cx + r*0.5 - th/2, cy + r*0.1);
        p.curveTo(cx + r*0.5 - th/2, cy + r*0.9 - th/2, cx - r*0.4 + th/2, cy + r*0.9 - th/2, cx - r*0.4 + th/2, cy + r*0.2);
        p.close();
        break;
      case 4: // Ngã (~) - Sóng ngã dải lụa khép kín
        p.moveTo(cx - r*0.7, cy - r*0.2 + th/2);
        p.quadraticCurveTo(cx - r*0.3, cy + r*0.7 + th/2, cx, cy + th/2);
        p.quadraticCurveTo(cx + r*0.3, cy - r*0.7 + th/2, cx + r*0.7, cy + r*0.2 + th/2);
        p.lineTo(cx + r*0.7, cy + r*0.2 - th/2);
        p.quadraticCurveTo(cx + r*0.3, cy - r*0.7 - th/2, cx, cy - th/2);
        p.quadraticCurveTo(cx - r*0.3, cy + r*0.7 - th/2, cx - r*0.7, cy - r*0.2 - th/2);
        p.close();
        break;
      case 5: // Nặng (.) - Chấm vuông đặc
        const s = r * 0.5;
        p.moveTo(cx - s/2, cy - s/2);
        p.lineTo(cx + s/2, cy - s/2);
        p.lineTo(cx + s/2, cy + s/2);
        p.lineTo(cx - s/2, cy + s/2);
        p.close();
        break;
    }
    return p;
  }

  // Helper vẽ vòng tròn rỗng (Donut Ring) theo winding rule
  function addRing(p, cx, cy, rOut, rIn) {
    const k = 0.5522847498;
    // Outer circle (Clockwise)
    p.moveTo(cx + rOut, cy);
    p.curveTo(cx + rOut, cy + rOut * k, cx + rOut * k, cy + rOut, cx, cy + rOut);
    p.curveTo(cx - rOut * k, cy + rOut, cx - rOut, cy + rOut * k, cx - rOut, cy);
    p.curveTo(cx - rOut, cy - rOut * k, cx - rOut * k, cy - rOut, cx, cy - rOut);
    p.curveTo(cx + rOut * k, cy - rOut, cx + rOut, cy - rOut * k, cx + rOut, cy);
    p.close();

    // Inner circle (Counter-Clockwise to create hole)
    p.moveTo(cx + rIn, cy);
    p.curveTo(cx + rIn, cy - rIn * k, cx + rIn * k, cy - rIn, cx, cy - rIn);
    p.curveTo(cx - rIn * k, cy - rIn, cx - rIn, cy - rIn * k, cx - rIn, cy);
    p.curveTo(cx - rIn, cy + rIn * k, cx - rIn * k, cy + rIn, cx, cy + rIn);
    p.curveTo(cx + rIn * k, cy + rIn, cx + rIn, cy + rIn * k, cx + rIn, cy);
    p.close();
  }

  // Helper vẽ khung chữ nhật bo góc rỗng bao trùm toàn bộ ô 1000x1000
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

  function createPositionalPath(char, zoneIndex, tone = -1, caseType = 'LOWER') {
    const zone = ZONES[zoneIndex];
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

    if (tone >= 0) {
      const tonePath = getToneMarkPath(tone, TONE_ZONE);
      outPath.extend(tonePath);

      // Nếu là chữ Hoa đầu -> vẽ vòng tròn O quanh dấu thanh
      if (caseType === 'TITLE') {
        const cx = TONE_ZONE.x + TONE_ZONE.w * 0.35;
        const cy = TONE_ZONE.y + TONE_ZONE.h * 0.35;
        addRing(outPath, cx, cy, 145, 120);
      }
      // Nếu là CHỮ HOA TOÀN BỘ -> vẽ khung viền bo tròn bao trùm toàn bộ khối 1000x1000
      else if (caseType === 'ALL') {
        addRoundedRectFrame(outPath, 15, -185, 970, 970, 30, 20);
      }
    }
    return outPath;
  }

  function getCharName(char) {
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

  // Thêm glyph tiền tố ẩn prefix_o và prefix_O (advanceWidth = 0)
  glyphs.push(new opentype.Glyph({
    name: 'prefix_o', unicode: 'o'.charCodeAt(0), advanceWidth: 0, path: new opentype.Path()
  }));
  glyphs.push(new opentype.Glyph({
    name: 'prefix_O', unicode: 'O'.charCodeAt(0), advanceWidth: 0, path: new opentype.Path()
  }));

  const base60Names = [];
  const pos1Names = [];
  const pos2Names = [];
  const pos3Names = [];
  const pos3TitleNames = [];
  const pos3AllNames = [];

  for (let i = 0; i < BASE60_SS.length; i++) {
    const char = BASE60_SS[i];
    const name = getCharName(char);
    const unicode = char.charCodeAt(0);

    // 1. Base glyph
    const baseGlyph = baseFont.charToGlyph(char);
    glyphs.push(new opentype.Glyph({
        name: name, unicode: unicode,
        advanceWidth: baseGlyph.advanceWidth, path: baseGlyph.path
    }));
    base60Names.push(name);

    // 2. Pos1 (c1)
    const name1 = name + '.pos1';
    glyphs.push(new opentype.Glyph({
        name: name1, advanceWidth: 0, path: createPositionalPath(char, 0)
    }));
    pos1Names.push(name1);

    // 3. Pos2 (c2)
    const name2 = name + '.pos2';
    glyphs.push(new opentype.Glyph({
        name: name2, advanceWidth: 0, path: createPositionalPath(char, 1)
    }));
    pos2Names.push(name2);

    // 4. Pos3 (c3) - LOWER, TITLE, ALL
    const toneIdx = i % 6;
    
    // Lowercase
    const name3 = name + '.pos3';
    glyphs.push(new opentype.Glyph({
        name: name3, advanceWidth: 1000, path: createPositionalPath(char, 2, toneIdx, 'LOWER')
    }));
    pos3Names.push(name3);

    // Title Case (o prefix)
    const name3Title = name + '.pos3_t';
    glyphs.push(new opentype.Glyph({
        name: name3Title, advanceWidth: 1000, path: createPositionalPath(char, 2, toneIdx, 'TITLE')
    }));
    pos3TitleNames.push(name3Title);

    // All Caps (O prefix)
    const name3All = name + '.pos3_a';
    glyphs.push(new opentype.Glyph({
        name: name3All, advanceWidth: 1000, path: createPositionalPath(char, 2, toneIdx, 'ALL')
    }));
    pos3AllNames.push(name3All);
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

  // Generate features.fea với đầy đủ 3 trường hợp: Thường, Title (o...), ALL (O...)
  const fea = `languagesystem DFLT dflt;
languagesystem latn dflt;

@base60 = [${base60Names.join(' ')}];
@pos1 = [${pos1Names.join(' ')}];
@pos2 = [${pos2Names.join(' ')}];
@pos3 = [${pos3Names.join(' ')}];
@pos3_t = [${pos3TitleNames.join(' ')}];
@pos3_a = [${pos3AllNames.join(' ')}];

feature calt {
    # 1. Chữ Hoa đầu từ (Tiền tố 'o')
    sub prefix_o @base60' @base60 @base60 by @pos1;
    sub prefix_o @pos1 @base60' @base60 by @pos2;
    sub prefix_o @pos1 @pos2 @base60' by @pos3_t;

    # 2. CHỮ HOA TOÀN TỪ (Tiền tố 'O')
    sub prefix_O @base60' @base60 @base60 by @pos1;
    sub prefix_O @pos1 @base60' @base60 by @pos2;
    sub prefix_O @pos1 @pos2 @base60' by @pos3_a;

    # 3. Chữ thường tiêu chuẩn (Không tiền tố)
    sub @base60' @base60 @base60 by @pos1;
    sub @pos1 @base60' @base60 by @pos2;
    sub @pos2 @base60' by @pos3;
} calt;
`;
  fs.writeFileSync(OUTPUT_FEA, fea);
  console.log(`Saved FEA to ${OUTPUT_FEA}`);
}

buildFont();
