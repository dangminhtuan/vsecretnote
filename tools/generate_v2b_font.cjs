/**
 * V2B Font Generator v2 — Stroke-to-Outline Expansion
 * Sửa lỗi căn bản: TTF không có "stroke", mọi nét phải là filled polygon.
 * Giải pháp: "Thổi phồng" mọi đường kẻ thành dải băng (ribbon) khép kín.
 */
'use strict';

const opentype = require('../node_modules/opentype.js/dist/opentype.js');
const fs = require('fs');
const path = require('path');

// ============================================================
// FONT METRICS (TỐI ƯU KHOẢNG CÁCH TỪ VÀ BỐ CỤC)
// ============================================================
const UPM = 1000;
const ASCENDER = 800;
const DESCENDER = -200;
const ADVANCE_WIDTH = 600; // Khối chữ co gọn, hai từ đứng sát nhau tự nhiên
const SPACE_WIDTH = 220;   // Khoảng trắng giữa các từ nhỏ gọn, tự nhiên
const CELL = 750;          // Cân đối với advance width

// SVG→Font: x↑ same, y flipped
function sfx(ax) { return Math.round(ax * CELL / 100); }
function sfy(ay) { return Math.round(ASCENDER - ay * CELL / 100); }

// ============================================================
// BASE60 MAPPING (60 ky tu)
// ============================================================
const B60_MAPPING = [
  'c','d','g','G','j','k','K','h','v','D','m','C','r','s','n','b','l','Q','S','z',
  'N','y','L','W','p','f','q','t','T','R','x','0','1','2','3','4','5','6','7','8',
  '9','A','B','E','F','H','o','J','M','P','U','V','X','Y','Z','a','e','i','u','w'
];

// ============================================================
// 60 GLYPH RECIPES (SVG strings)
// ============================================================
const GLYPH_RECIPES = [
  { id: 0,  char: 'c', path: '<path d="M 68 28 A 25 25 0 0 0 68 72" />' },
  { id: 1,  char: 'd', path: '<path d="M 50 20 L 50 50 A 18 15 0 0 0 50 80" />' },
  { id: 2,  char: 'g', path: '<polyline points="60,20 38,48 58,48 36,80" />' },
  { id: 3,  char: 'G', path: '<path d="M 24 22 A 30 30 0 1 1 24 78" />' },
  { id: 4,  char: 'j', path: '<path d="M 56 32 L 56 58 A 12 12 0 0 1 32 68" />' },
  { id: 5,  char: 'k', path: '<polyline points="64,30 34,50 64,70" />' },
  { id: 6,  char: 'K', path: '<polyline points="22,24 78,50 22,76" />' },
  { id: 7,  char: 'h', path: '<path d="M 50 42 A 14 14 0 0 0 22 42 L 50 80 L 78 42 A 14 14 0 0 0 50 42 Z" />' },
  { id: 8,  char: 'v', path: '<polyline points="32,44 50,76 68,44" />' },
  { id: 9,  char: 'D', path: '<path d="M 32 22 L 32 78 A 28 28 0 0 0 32 22 Z" />' },
  { id: 10, char: 'm', path: '<path d="M 22 62 A 14 14 0 0 1 50 62 A 14 14 0 0 1 78 62" />' },
  { id: 11, char: 'C', path: '<path d="M 76 22 A 30 30 0 1 0 76 78" />' },
  { id: 12, char: 'r', path: '<polyline points="35,66 35,34 75,34" />' },
  { id: 13, char: 's', path: '<polyline points="65,34 65,66 25,66" />' },
  { id: 14, char: 'n', path: '<path d="M 28 62 A 22 22 0 0 1 72 62" />' },
  { id: 15, char: 'b', path: '<path d="M 36 22 L 36 78 A 18 18 0 0 0 36 42" />' },
  { id: 16, char: 'l', path: '<line x1="50" y1="18" x2="50" y2="82" />' },
  { id: 17, char: 'Q', path: '<rect x="30" y="30" width="40" height="40" />' },
  { id: 18, char: 'S', path: '<path d="M 64 22 C 32 14, 26 40, 50 50 C 74 60, 68 86, 36 78" />' },
  { id: 19, char: 'z', path: '<polyline points="25,34 65,34 65,66" />' },
  { id: 20, char: 'N', path: '<polyline points="30,78 30,22 70,78 70,22" />' },
  { id: 21, char: 'y', path: '<line x1="68" y1="24" x2="32" y2="80" /><line x1="32" y1="24" x2="50" y2="52" />' },
  { id: 22, char: 'L', path: '<polyline points="34,22 34,78 76,78" />' },
  { id: 23, char: 'W', path: '<polyline points="20,24 35,78 50,42 65,78 80,24" />' },
  { id: 24, char: 'p', path: '<path d="M 36 80 L 36 28 A 18 18 0 0 1 36 64" />' },
  { id: 25, char: 'f', path: '<line x1="24" y1="76" x2="76" y2="76" /><line x1="50" y1="76" x2="50" y2="24" />' },
  { id: 26, char: 'q', path: '<polyline points="68,30 30,30 30,70 68,70" />' },
  { id: 27, char: 't', path: '<line x1="30" y1="50" x2="70" y2="50" /><line x1="50" y1="26" x2="50" y2="76" />' },
  { id: 28, char: 'T', path: '<line x1="22" y1="24" x2="78" y2="24" /><line x1="50" y1="24" x2="50" y2="78" />' },
  { id: 29, char: 'R', path: '<polyline points="32,78 54,26 76,48" />' },
  { id: 30, char: 'x', path: '<line x1="34" y1="44" x2="66" y2="76" /><line x1="66" y1="44" x2="34" y2="76" />' },
  { id: 31, char: '0', path: '<ellipse cx="50" cy="50" rx="22" ry="28" /><dot cx="50" cy="50" r="5" />' },
  { id: 32, char: '1', path: '<polyline points="36,36 50,22 50,80" />' },
  { id: 33, char: '2', path: '<path d="M 32 36 A 16 16 0 0 1 68 44 C 68 62, 34 66, 32 78 L 70 78" />' },
  { id: 34, char: '3', path: '<path d="M 34 26 L 66 26 C 56 46, 56 46, 66 54 A 16 16 0 0 1 34 76" />' },
  { id: 35, char: '4', path: '<polyline points="62,22 28,58 72,58" /><line x1="62" y1="36" x2="62" y2="80" />' },
  { id: 36, char: '5', path: '<polyline points="68,26 34,26 32,48" /><path d="M 32 48 A 18 18 0 1 1 32 76" />' },
  { id: 37, char: '6', path: '<circle cx="50" cy="62" r="17" /><path d="M 33 60 C 32 38, 44 24, 66 24" />' },
  { id: 38, char: '7', path: '<polyline points="28,26 72,26 44,78" />' },
  { id: 39, char: '8', path: '<circle cx="50" cy="38" r="14" /><circle cx="50" cy="64" r="16" />' },
  { id: 40, char: '9', path: '<circle cx="50" cy="38" r="17" /><path d="M 67 38 L 67 66 A 14 14 0 0 1 42 78" />' },
  { id: 41, char: 'A', path: '<line x1="26" y1="26" x2="74" y2="74" />' },
  { id: 42, char: 'B', path: '<line x1="28" y1="22" x2="28" y2="78" /><path d="M 28 22 L 50 22 A 14 14 0 0 1 50 50 L 28 50" /><path d="M 28 50 L 52 50 A 14 14 0 0 1 52 78 L 28 78" />' },
  { id: 43, char: 'E', path: '<line x1="32" y1="22" x2="32" y2="78" /><line x1="32" y1="50" x2="72" y2="50" />' },
  { id: 44, char: 'F', path: '<line x1="66" y1="22" x2="66" y2="78" /><line x1="66" y1="50" x2="28" y2="50" />' },
  { id: 45, char: 'H', path: '<polyline points="30,68 30,30 70,30 70,68" />' },
  { id: 46, char: 'o', path: '<circle cx="50" cy="50" r="18" />' },
  { id: 47, char: 'J', path: '<line x1="32" y1="24" x2="72" y2="24" /><path d="M 58 24 L 58 64 A 18 18 0 0 1 28 74" />' },
  { id: 48, char: 'M', path: '<polyline points="20,72 35,28 50,56 65,28 80,72" />' },
  { id: 49, char: 'P', path: '<polyline points="32,30 70,30 70,70 32,70" />' },
  { id: 50, char: 'U', path: '<polyline points="30,32 30,70 70,70 70,32" />' },
  { id: 51, char: 'V', path: '<polyline points="24,78 50,22 76,78" />' },
  { id: 52, char: 'X', path: '<line x1="24" y1="24" x2="76" y2="76" /><line x1="76" y1="24" x2="24" y2="76" />' },
  { id: 53, char: 'Y', path: '<polyline points="26,24 50,52 74,24" /><line x1="50" y1="52" x2="50" y2="80" />' },
  { id: 54, char: 'Z', path: '<polyline points="26,24 74,24 26,76 74,76" />' },
  { id: 55, char: 'a', path: '<line x1="22" y1="50" x2="78" y2="50" />' },
  { id: 56, char: 'e', path: '<line x1="24" y1="38" x2="76" y2="38" /><line x1="24" y1="62" x2="76" y2="62" />' },
  { id: 57, char: 'i', path: '<line x1="38" y1="62" x2="62" y2="38" />' },
  { id: 58, char: 'u', path: '<path d="M 28 26 L 28 58 A 22 22 0 0 0 72 58 L 72 26" />' },
  { id: 59, char: 'w', path: '<polyline points="20,44 32,74 44,52 56,74 68,44" />' }
];

function getGlyphByChar(ch) {
  const idx = B60_MAPPING.indexOf(ch);
  return GLYPH_RECIPES[idx < 0 ? 0 : idx];
}

// ============================================================
// STROKE HALF-WIDTH (SVG units, in original 100x100 space)
// Based on geo-font.html stroke-width=6.5 → half = 3.25
// ============================================================
const HW = 3.5;   // stroke half-width for sub-glyph elements
const BHW = 3.0;  // border box half-width (full cell, no sub-glyph scaling)

// ============================================================
// GEOMETRY HELPERS
// ============================================================

function sampleCirclePts(cx, cy, r, N = 40) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function sampleEllipsePts(cx, cy, rx, ry, N = 40) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

function sampleArcPts(x1, y1, rx, ry, xRotDeg, largeArc, sweep, x2, y2, N = 20) {
  if (Math.abs(rx) < 0.01 || Math.abs(ry) < 0.01) return [[x1,y1],[x2,y2]];
  if (Math.abs(x1-x2) < 0.01 && Math.abs(y1-y2) < 0.01) return [[x1,y1]];
  
  const phi = xRotDeg * Math.PI / 180;
  const cosp = Math.cos(phi), sinp = Math.sin(phi);
  const dx = (x1-x2)/2, dy = (y1-y2)/2;
  const x1p = cosp*dx + sinp*dy, y1p = -sinp*dx + cosp*dy;
  let rxA = Math.abs(rx), ryA = Math.abs(ry);
  const lam = x1p*x1p/rxA/rxA + y1p*y1p/ryA/ryA;
  if (lam > 1) { rxA *= Math.sqrt(lam); ryA *= Math.sqrt(lam); }
  const num = Math.max(0, rxA*rxA*ryA*ryA - rxA*rxA*y1p*y1p - ryA*ryA*x1p*x1p);
  const den = rxA*rxA*y1p*y1p + ryA*ryA*x1p*x1p;
  let sq = den > 0.001 ? Math.sqrt(num/den) : 0;
  if (largeArc === sweep) sq = -sq;
  const cxp = sq*rxA*y1p/ryA, cyp = -sq*ryA*x1p/rxA;
  const cx_ = (x1+x2)/2 + cosp*cxp - sinp*cyp;
  const cy_ = (y1+y2)/2 + sinp*cxp + cosp*cyp;
  const ux=(x1p-cxp)/rxA, uy=(y1p-cyp)/ryA;
  const vx=(-x1p-cxp)/rxA, vy=(-y1p-cyp)/ryA;
  let theta1 = Math.atan2(uy, ux);
  let dTheta = Math.atan2(vy, vx) - theta1;
  if (sweep === 0 && dTheta > 0) dTheta -= 2*Math.PI;
  if (sweep === 1 && dTheta < 0) dTheta += 2*Math.PI;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = theta1 + dTheta*i/N;
    pts.push([cx_ + rxA*(cosp*Math.cos(t)-sinp*Math.sin(t)),
              cy_ + ryA*(sinp*Math.cos(t)+cosp*Math.sin(t))]);
  }
  return pts;
}

function sampleCubicBezierPts(x0,y0,x1,y1,x2,y2,x3,y3, N=12) {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i/N, mt = 1-t;
    pts.push([
      mt*mt*mt*x0 + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x3,
      mt*mt*mt*y0 + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*y3
    ]);
  }
  return pts;
}

// ============================================================
// STROKE EXPANSION
// ============================================================

// Expand OPEN polyline to filled ribbon polygon (with round caps)
function expandOpen(pts, hw) {
  if (!pts || pts.length < 2) return [];
  const n = pts.length;
  const left = [], right = [];

  function tangent(i) {
    if (i === 0) return [pts[1][0]-pts[0][0], pts[1][1]-pts[0][1]];
    if (i === n-1) return [pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]];
    const d1 = [pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]];
    const d2 = [pts[i+1][0]-pts[i][0], pts[i+1][1]-pts[i][1]];
    const l1 = Math.sqrt(d1[0]**2+d1[1]**2)||1, l2 = Math.sqrt(d2[0]**2+d2[1]**2)||1;
    return [d1[0]/l1+d2[0]/l2, d1[1]/l1+d2[1]/l2];
  }

  for (let i = 0; i < n; i++) {
    const [tx, ty] = tangent(i);
    const len = Math.sqrt(tx*tx+ty*ty)||1;
    const nx = -ty/len*hw, ny = tx/len*hw;
    left.push([pts[i][0]+nx, pts[i][1]+ny]);
    right.push([pts[i][0]-nx, pts[i][1]-ny]);
  }

  // Round cap at end
  const endPt = pts[n-1];
  const a1 = Math.atan2(left[n-1][1]-endPt[1], left[n-1][0]-endPt[0]);
  const a2 = Math.atan2(right[n-1][1]-endPt[1], right[n-1][0]-endPt[0]);
  let da = a2 - a1; if (da < 0) da += 2*Math.PI;
  const endCap = [];
  for (let i = 1; i < 8; i++) {
    const a = a1 + da*i/8;
    endCap.push([endPt[0]+Math.cos(a)*hw, endPt[1]+Math.sin(a)*hw]);
  }

  // Round cap at start
  const startPt = pts[0];
  const sa1 = Math.atan2(right[0][1]-startPt[1], right[0][0]-startPt[0]);
  const sa2 = Math.atan2(left[0][1]-startPt[1], left[0][0]-startPt[0]);
  let sda = sa2 - sa1; if (sda < 0) sda += 2*Math.PI;
  const startCap = [];
  for (let i = 1; i < 8; i++) {
    const a = sa1 + sda*i/8;
    startCap.push([startPt[0]+Math.cos(a)*hw, startPt[1]+Math.sin(a)*hw]);
  }

  return [...left, ...endCap, ...[...right].reverse(), ...startCap];
}

// Expand CLOSED polyline to filled ribbon (no caps, smooth loop)
function expandClosed(pts, hw) {
  if (!pts || pts.length < 3) return expandOpen(pts, hw);
  const n = pts.length;
  const outer = [], inner = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i-1+n)%n], curr = pts[i], next = pts[(i+1)%n];
    const d1 = [curr[0]-prev[0], curr[1]-prev[1]];
    const d2 = [next[0]-curr[0], next[1]-curr[1]];
    const l1 = Math.sqrt(d1[0]**2+d1[1]**2)||1, l2 = Math.sqrt(d2[0]**2+d2[1]**2)||1;
    const tx = d1[0]/l1+d2[0]/l2, ty = d1[1]/l1+d2[1]/l2;
    const tlen = Math.sqrt(tx*tx+ty*ty)||1;
    const nx = -ty/tlen*hw, ny = tx/tlen*hw;
    outer.push([curr[0]+nx, curr[1]+ny]);
    inner.push([curr[0]-nx, curr[1]-ny]);
  }
  // outer CW + inner CCW = filled ring/frame
  return [...outer, ...[...inner].reverse()];
}

// ============================================================
// SVG ELEMENT -> OUTLINE POLYGONS (in original SVG space)
// ============================================================
function nums(s) { return s.trim().split(/[\s,]+/).filter(Boolean).map(Number); }

function elementToPolygons(el, hw) {
  const polys = [];

  // <line>
  const lm = el.match(/x1="([^"]+)"\s*y1="([^"]+)"\s*x2="([^"]+)"\s*y2="([^"]+)"/);
  if (lm) { polys.push(expandOpen([[+lm[1],+lm[2]],[+lm[3],+lm[4]]], hw)); return polys; }

  // <polyline>
  const pm = el.match(/points="([^"]+)"/);
  if (pm) {
    const pts = pm[1].trim().split(/\s+/).map(p => p.split(',').map(Number));
    polys.push(expandOpen(pts, hw)); return polys;
  }

  // <dot> (custom tag: solid filled circle)
  const dotm = el.match(/<dot\s[^>]*cx="([^"]+)"\s*cy="([^"]+)"\s*r="([^"]+)"/);
  if (dotm) {
    polys.push(sampleCirclePts(+dotm[1], +dotm[2], +dotm[3]+hw, 24)); return polys;
  }

  // <circle>
  const cm = el.match(/(?:^|<)\s*circle\s[^>]*cx="([^"]+)"\s*cy="([^"]+)"\s*r="([^"]+)"/);
  if (cm) {
    const [cx,cy,r] = [+cm[1], +cm[2], +cm[3]];
    const outer = sampleCirclePts(cx, cy, r+hw, 40);
    const inner = sampleCirclePts(cx, cy, Math.max(hw*0.5, r-hw), 40).reverse();
    polys.push([...outer, ...inner]); return polys;
  }

  // <ellipse>
  const em = el.match(/(?:^|<)\s*ellipse\s[^>]*cx="([^"]+)"\s*cy="([^"]+)"\s*rx="([^"]+)"\s*ry="([^"]+)"/);
  if (em) {
    const [cx,cy,rx,ry] = [+em[1], +em[2], +em[3], +em[4]];
    const outer = sampleEllipsePts(cx, cy, rx+hw, ry+hw, 40);
    const inner = sampleEllipsePts(cx, cy, Math.max(hw*0.5,rx-hw), Math.max(hw*0.5,ry-hw), 40).reverse();
    polys.push([...outer, ...inner]); return polys;
  }

  // <rect>
  const rm = el.match(/(?:^|<)\s*rect\s[^>]*x="([^"]+)"\s*y="([^"]+)"\s*width="([^"]+)"\s*height="([^"]+)"/);
  if (rm) {
    const [x,y,w,h] = [+rm[1], +rm[2], +rm[3], +rm[4]];
    const outer = [[x-hw,y-hw],[x+w+hw,y-hw],[x+w+hw,y+h+hw],[x-hw,y+h+hw]];
    const inner = [[x+hw,y+hw],[x+w-hw,y+hw],[x+w-hw,y+h-hw],[x+hw,y+h-hw]].reverse();
    polys.push([...outer, ...inner]); return polys;
  }

  // <path d="...">
  const dm = el.match(/\bd="([^"]+)"/);
  if (dm) { polys.push(...pathDToPolygons(dm[1], hw)); return polys; }

  return polys;
}

function pathDToPolygons(d, hw) {
  const polys = [];
  const tokens = d.trim().split(/([MmLlCcAaZzHhVv])/).filter(Boolean);
  let cmd = 'M', cx = 0, cy = 0, curPts = [];

  function flush(closed) {
    if (curPts.length < 2) { curPts = []; return; }
    if (closed && curPts.length >= 4) {
      // Remove closing duplicate if present
      const last = curPts.length - 1;
      const dx = curPts[0][0]-curPts[last][0], dy = curPts[0][1]-curPts[last][1];
      const clean = (dx*dx+dy*dy < 0.1) ? curPts.slice(0,-1) : curPts;
      polys.push(expandClosed(clean, hw));
    } else {
      polys.push(expandOpen(curPts, hw));
    }
    curPts = [];
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].trim();
    if (!t) continue;
    if (/^[MmLlCcAaZzHhVv]$/.test(t)) { cmd = t; continue; }
    const n = nums(t);
    let j = 0;
    while (j < n.length || j === 0) {
      switch (cmd) {
        case 'M': flush(false); cx=n[j]; cy=n[j+1]; curPts=[[cx,cy]]; j+=2; cmd='L'; break;
        case 'm': flush(false); cx+=n[j]; cy+=n[j+1]; curPts=[[cx,cy]]; j+=2; cmd='l'; break;
        case 'L': cx=n[j]; cy=n[j+1]; curPts.push([cx,cy]); j+=2; break;
        case 'l': cx+=n[j]; cy+=n[j+1]; curPts.push([cx,cy]); j+=2; break;
        case 'H': cx=n[j]; curPts.push([cx,cy]); j++; break;
        case 'h': cx+=n[j]; curPts.push([cx,cy]); j++; break;
        case 'V': cy=n[j]; curPts.push([cx,cy]); j++; break;
        case 'v': cy+=n[j]; curPts.push([cx,cy]); j++; break;
        case 'C': {
          const bz = sampleCubicBezierPts(cx,cy,n[j],n[j+1],n[j+2],n[j+3],n[j+4],n[j+5],12);
          curPts.push(...bz.slice(1)); cx=n[j+4]; cy=n[j+5]; j+=6; break;
        }
        case 'c': {
          const bz = sampleCubicBezierPts(cx,cy,cx+n[j],cy+n[j+1],cx+n[j+2],cy+n[j+3],cx+n[j+4],cy+n[j+5],12);
          curPts.push(...bz.slice(1)); cx+=n[j+4]; cy+=n[j+5]; j+=6; break;
        }
        case 'A': {
          const ap = sampleArcPts(cx,cy,n[j],n[j+1],n[j+2],n[j+3],n[j+4],n[j+5],n[j+6],16);
          curPts.push(...ap.slice(1)); cx=n[j+5]; cy=n[j+6]; j+=7; break;
        }
        case 'a': {
          const ap = sampleArcPts(cx,cy,n[j],n[j+1],n[j+2],n[j+3],n[j+4],cx+n[j+5],cy+n[j+6],16);
          curPts.push(...ap.slice(1)); cx+=n[j+5]; cy+=n[j+6]; j+=7; break;
        }
        case 'Z': case 'z': flush(true); j=n.length; break;
        default: j=n.length; break;
      }
      if (j >= n.length) break;
    }
  }
  flush(false);
  return polys;
}

// ============================================================
// POLYGON → OPENTYPE PATH  (apply sub-glyph transform)
// ============================================================
// offX, offY, sc: sub-glyph transform in SVG space
// Every point [px, py] in polygon (original SVG 0-100 space)
// → ax = offX + px*sc,  ay = offY + py*sc  (full SVG 0-100 space)
// → fx = ax * CELL/100, fy = ASCENDER - ay * CELL/100  (font units)
function polyToOT(poly, offX, offY, sc, otPath) {
  if (!poly || poly.length < 3) return;
  for (let i = 0; i < poly.length; i++) {
    const ax = offX + poly[i][0] * sc;
    const ay = offY + poly[i][1] * sc;
    const fx = Math.round(ax * CELL / 100);
    const fy = Math.round(ASCENDER - ay * CELL / 100);
    if (i === 0) otPath.moveTo(fx, fy);
    else otPath.lineTo(fx, fy);
  }
  otPath.closePath();
}

// ============================================================
// BORDER BOX (4 solid bars in full cell space)
// ============================================================
function addBorderBox(otPath) {
  const m = 2.5; // margin SVG units
  const bw = BHW; // bar half-width SVG units

  const bars = [
    [[m, m-bw], [100-m, m-bw], [100-m, m+bw], [m, m+bw]],            // top
    [[m, 100-m-bw], [100-m, 100-m-bw], [100-m, 100-m+bw], [m, 100-m+bw]], // bottom
    [[m-bw, m-bw], [m+bw, m-bw], [m+bw, 100-m+bw], [m-bw, 100-m+bw]],    // left
    [[100-m-bw, m-bw], [100-m+bw, m-bw], [100-m+bw, 100-m+bw], [100-m-bw, 100-m+bw]], // right
  ];

  for (const bar of bars) {
    for (let i = 0; i < bar.length; i++) {
      const fx = Math.round(bar[i][0] * CELL / 100);
      const fy = Math.round(ASCENDER - bar[i][1] * CELL / 100);
      if (i === 0) otPath.moveTo(fx, fy);
      else otPath.lineTo(fx, fy);
    }
    otPath.closePath();
  }
}

// ============================================================
// BUILD COMPOSITE BLOCK GLYPH (3 sub-glyphs — KHÔNG VIỀN HỘP & TÁCH NÉT RÕ RÀNG)
// ============================================================
function buildBlockGlyph(c1ch, c2ch, c3ch) {
  const otPath = new opentype.Path();

  const isUpper = /[A-Z]/.test(c3ch);
  let positions;
  if (!isUpper) {
    // △ Tam giác thuận: Co cụm hướng tâm gắn kết, khe hở vi mô đều 7.2 đơn vị
    positions = [
      { ch: c3ch, offX: 26, offY: 6,  sc: 0.48 },
      { ch: c1ch, offX: 8,  offY: 42, sc: 0.48 },
      { ch: c2ch, offX: 44, offY: 42, sc: 0.48 },
    ];
  } else {
    // ▽ Tam giác ngược: Co cụm hướng tâm gắn kết, khe hở vi mô đều 7.2 đơn vị
    positions = [
      { ch: c1ch, offX: 8,  offY: 6,  sc: 0.48 },
      { ch: c2ch, offX: 44, offY: 6,  sc: 0.48 },
      { ch: c3ch, offX: 26, offY: 42, sc: 0.48 },
    ];
  }

  for (const { ch, offX, offY, sc } of positions) {
    const recipe = getGlyphByChar(ch);
    const elRe = /(<(?:line|polyline|circle|ellipse|rect|path|dot)\s[^>]*?>)/g;
    let m;
    while ((m = elRe.exec(recipe.path)) !== null) {
      const polys = elementToPolygons(m[1], HW);
      for (const poly of polys) {
        polyToOT(poly, offX, offY, sc, otPath);
      }
    }
  }

  return otPath;
}

// ============================================================
// LOAD REAL VIETNAMESE WORDS FROM data.js
// ============================================================
const dataPath = path.join(__dirname, '..', 'data.js');
const dataRaw = fs.readFileSync(dataPath, 'utf8');
function extractArray(raw, varName) {
  const re = new RegExp(`export\\s+const\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
  const m = raw.match(re);
  if (!m) throw new Error(`Cannot find ${varName} in data.js`);
  return eval(m[1]);
}
const REAL_VN_WORDS = extractArray(dataRaw, 'REAL_VIETNAMESE_WORDS');

// ============================================================
// MAIN: BUILD FONT
// ============================================================
async function main() {
  console.log('🔤 V2B Font Generator v4 — Tách nét rõ ràng & Khoảng cách từ tự nhiên');
  console.log(`📦 Số âm tiết: ${REAL_VN_WORDS.length}`);
  console.log(`📏 Advance Width: ${ADVANCE_WIDTH}, Space Width: ${SPACE_WIDTH}`);

  // Nạp động engine vcomp.js
  const { encodeWord, timeToBase60 } = await import('../vcomp.js');
  console.log('✅ Đã nạp thành công bộ mã hóa ngữ âm tiếng Việt vcomp.js');

  const glyphs = [];

  // .notdef
  glyphs.push(new opentype.Glyph({ name: '.notdef', advanceWidth: ADVANCE_WIDTH, path: new opentype.Path() }));
  // space (khoảng cách giữa các từ gọn gàng, tự nhiên)
  glyphs.push(new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: SPACE_WIDTH, path: new opentype.Path() }));

  console.log('⚙️  Đang xây dựng 7,190 glyphs không viền...');

  let errors = 0;
  for (let i = 0; i < REAL_VN_WORDS.length; i++) {
    const syllable = REAL_VN_WORDS[i];
    const codepoint = 0xE000 + i;

    // Lấy 3 nét Base60 thật sự từ ngữ âm tiếng Việt
    let c1 = 'c', c2 = 'c', c3 = 'c';
    try {
      const t = encodeWord(syllable);
      const b60 = timeToBase60(t);
      if (b60 && b60.length === 3 && !b60.includes('?') && !b60.startsWith('[')) {
        c1 = b60[0];
        c2 = b60[1];
        c3 = b60[2];
      }
    } catch (e) {
      errors++;
    }

    let glyphPath;
    try {
      glyphPath = buildBlockGlyph(c1, c2, c3);
    } catch (e) {
      errors++;
      glyphPath = new opentype.Path();
    }

    glyphs.push(new opentype.Glyph({
      name: `vi_${i}_${syllable.replace(/[^a-zA-Z0-9]/g,'_')}`,
      unicode: codepoint,
      advanceWidth: ADVANCE_WIDTH,
      path: glyphPath
    }));

    if (i % 1000 === 0) process.stdout.write(`\r  ${i}/${REAL_VN_WORDS.length} (${Math.round(i/REAL_VN_WORDS.length*100)}%)...`);
  }

  process.stdout.write('\n');
  console.log(`✅ Đã tạo ${glyphs.length} glyphs (${errors} lỗi)`);

  const font = new opentype.Font({
    familyName: 'V2B ViScript',
    styleName: 'Regular',
    unitsPerEm: UPM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs
  });

  // Save TTF
  const outDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'V2B-ViScript.ttf');

  try {
    const ab = font.toArrayBuffer();
    const buf = Buffer.from(ab);
    fs.writeFileSync(outPath, buf);
    const kb = (buf.length / 1024).toFixed(1);
    console.log(`\n🎉 Font đã tạo: ${outPath} (${kb} KB)`);
  } catch(e) {
    console.error('Lỗi ghi file:', e.message);
    process.exit(1);
  }
}

main().catch(console.error);
