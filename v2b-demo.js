import { REAL_VIETNAMESE_WORDS } from './data.js';
import { encodeWord, timeToBase60 } from './vcomp.js';
import { initVsnNavigation } from './nav-system.js';
import { buildHangulBlockSvg } from './geo-recipes.js';

// === TỪ ĐIỂN VÀ ÁNH XẠ INDEX ===
const wordMap = new Map();
REAL_VIETNAMESE_WORDS.forEach((word, idx) => {
  wordMap.set(word.toLowerCase(), idx);
});

// Casing utilities: 0: lower, 1: Title, 2: UPPER
function detectCasing(word) {
  if (word === word.toUpperCase() && word !== word.toLowerCase()) return 2;
  if (word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) return 1;
  return 0;
}

function applyCasing(word, casing) {
  if (casing === 2) return word.toUpperCase();
  if (casing === 1) return word[0].toUpperCase() + word.slice(1);
  return word.toLowerCase();
}

function getCasingLabel(casing) {
  if (casing === 2) return 'HOA HẾT';
  if (casing === 1) return 'Hoa đầu';
  return 'thường';
}

// === CÁC MẪU VĂN BẢN PRESET ===
const PRESETS = [
  {
    name: 'Tuyên Ngôn Độc Lập',
    icon: '📜',
    text: 'Nước Việt Nam có quyền hưởng tự do và độc lập, và sự thật đã thành một nước tự do độc lập. Toàn thể dân tộc Việt Nam quyết đem tất cả tinh thần và lực lượng, tính mạng và của cải để giữ vững quyền tự do, độc lập ấy.'
  },
  {
    name: 'Công Nghệ AI & Dữ Liệu',
    icon: '🤖',
    text: 'Trí tuệ nhân tạo và mô hình ngôn ngữ lớn đang mở ra một kỷ nguyên mới cho nhân loại. Khả năng nén dữ liệu và tối ưu hóa bộ nhớ đóng vai trò quyết định trong việc tăng tốc độ tính toán.'
  },
  {
    name: 'Khẩu Hiệu Quốc Gia',
    icon: '🇻🇳',
    text: 'Cộng hòa xã hội chủ nghĩa Việt Nam: Độc lập - Tự do - Hạnh phúc.'
  },
  {
    name: 'Truyện Kiều (Thơ Lục Bát)',
    icon: '🖋️',
    text: 'Trăm năm trong cõi người ta,\nChữ tài chữ mệnh khéo là ghét nhau.\nTrải qua một cuộc bể dâu,\nNhững điều trông thấy mà đau đớn lòng.'
  },
  {
    name: 'Đời Thường & Trò Chuyện',
    icon: '☕',
    text: 'Hôm nay thời tiết đẹp lắm, chiều nay chúng mình cùng nhau đi dạo quanh hồ Tây rồi uống cà phê nhé!'
  }
];

// === TOKENIZER & ENCODER 16-BIT ===
export function encodeV2B(inputText) {
  if (!inputText) return { tokens: [], hexStream: '', fullStream: '' };

  // Tokenize words, punctuation, newlines
  const regex = /([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]+)|([^\sa-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]+)|(\n+)|(\s+)/g;
  const tokens = [];
  let match;

  while ((match = regex.exec(inputText)) !== null) {
    const [full, word, punct, newline] = match;

    if (word) {
      const lower = word.toLowerCase();
      const casing = detectCasing(word);
      if (wordMap.has(lower)) {
        const idx = wordMap.get(lower);
        // Bit 15: 0 (Word)
        // Bit 14-13: Casing (00: lower, 01: Title, 10: UPPER)
        // Bit 12-0: Word Index (0..7189)
        const code16 = (casing << 13) | (idx & 0x1FFF);
        
        // Base60 TimeCypher encoding
        const b60Enc = encodeWord(word.toLowerCase());
        const b60Code = b60Enc.startsWith('[') ? '--' : timeToBase60(b60Enc);

        tokens.push({
          type: 'word',
          text: word,
          cleanWord: REAL_VIETNAMESE_WORDS[idx],
          idx,
          casing,
          code16,
          hex: code16.toString(16).toUpperCase().padStart(4, '0'),
          bin: code16.toString(2).padStart(16, '0'),
          puaChar: String.fromCharCode(0xE000 + (code16 % 0x1800)),
          b60Code
        });
      } else {
        // Out Of Vocabulary (OOV)
        tokens.push({
          type: 'oov',
          text: word,
          hex: Array.from(new TextEncoder().encode(word)).map(b => b.toString(16).padStart(2, '0')).join('')
        });
      }
    } else if (punct) {
      tokens.push({
        type: 'punct',
        text: punct,
        hex: Array.from(new TextEncoder().encode(punct)).map(b => b.toString(16).padStart(2, '0')).join('')
      });
    } else if (newline) {
      tokens.push({
        type: 'newline',
        text: newline,
        hex: '0A'
      });
    }
  }

  // Hex stream of 16-bit tokens
  const hexList = tokens.map(t => {
    if (t.type === 'word') return t.hex;
    if (t.type === 'newline') return '\\n';
    return `[${t.text}]`;
  });

  return {
    tokens,
    hexStream: tokens.filter(t => t.type === 'word').map(t => t.hex).join(' '),
    fullStream: hexList.join(' ')
  };
}

// === DECODER 16-BIT V2B ===
export function decodeV2B(tokens) {
  let result = '';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = tokens[i - 1];

    if (t.type === 'word') {
      const idx = t.code16 & 0x1FFF;
      const casing = (t.code16 >> 13) & 0x03;
      const rawWord = REAL_VIETNAMESE_WORDS[idx] || t.text;
      const restored = applyCasing(rawWord, casing);

      // Auto-insert space if previous token was word or certain trailing punctuation
      if (prev && (prev.type === 'word' || (prev.type === 'punct' && !['(', '[', '{', '"', "'", '“', '‘'].includes(prev.text.slice(-1))))) {
        result += ' ';
      }
      result += restored;
    } else if (t.type === 'punct') {
      // Opening quote/parenthesis gets a leading space if following a word
      if (['(', '[', '{', '"', "'", '“', '‘'].includes(t.text[0]) && prev && prev.type === 'word') {
        result += ' ';
      }
      result += t.text;
    } else if (t.type === 'newline') {
      result += t.text;
    } else if (t.type === 'oov') {
      if (prev && (prev.type === 'word' || prev.type === 'oov')) result += ' ';
      result += t.text;
    }
  }
  return result;
}

// === TÍNH TOÁN CHỈ SỐ NÉN & DUNG LƯỢNG ===
export function calculateMetrics(inputText, tokens) {
  if (!inputText.trim()) {
    return {
      wordCount: 0,
      utf8Bytes: 0,
      utf16Bytes: 0,
      v2bBytes: 0,
      savingPercent: 0,
      ratio: '1.0x'
    };
  }

  const utf8Bytes = new TextEncoder().encode(inputText).length;
  const utf16Bytes = inputText.length * 2;

  let v2bBytes = 0;
  let wordCount = 0;

  tokens.forEach(t => {
    if (t.type === 'word') {
      v2bBytes += 2;
      wordCount++;
    } else if (t.type === 'punct' || t.type === 'newline') {
      v2bBytes += new TextEncoder().encode(t.text).length;
    } else if (t.type === 'oov') {
      v2bBytes += 2 + new TextEncoder().encode(t.text).length;
    }
  });

  const savingPercent = utf8Bytes > 0 ? Math.max(0, ((1 - v2bBytes / utf8Bytes) * 100)).toFixed(1) : 0;
  const ratio = v2bBytes > 0 ? (utf8Bytes / v2bBytes).toFixed(2) + 'x' : '1.0x';

  return {
    wordCount,
    utf8Bytes,
    utf16Bytes,
    v2bBytes,
    savingPercent,
    ratio
  };
}

// === GIAO DIỆN & SỰ KIỆN DOM ===
document.addEventListener('DOMContentLoaded', () => {
  try {
    initVsnNavigation('#vsn-nav-header');
  } catch (e) {
    console.warn('Navigation init warning:', e);
  }

  const inputEl = document.getElementById('input-text');
  const presetContainer = document.getElementById('preset-chips');
  const metricWords = document.getElementById('metric-words');
  const metricUtf8 = document.getElementById('metric-utf8');
  const metricUtf16 = document.getElementById('metric-utf16');
  const metricV2b = document.getElementById('metric-v2b');
  const metricSaving = document.getElementById('metric-saving');
  const metricRatio = document.getElementById('metric-ratio');
  const progressBar = document.getElementById('progress-bar');
  const hangulStage = document.getElementById('hangul-stage');
  const tokenStream = document.getElementById('token-stream');
  const hexOutput = document.getElementById('hex-output');
  const decodedOutput = document.getElementById('decoded-output');
  const statusBadge = document.getElementById('status-badge');
  const btnCopyHex = document.getElementById('btn-copy-hex');
  const btnClear = document.getElementById('btn-clear');
  const btnCopyDecoded = document.getElementById('btn-copy-decoded');

  // Switch View Mode buttons for Hangul Blocks
  let currentViewMode = 'grid'; // 'grid' (thẻ lớn) hoặc 'inline' (dòng chữ tự nhiên)
  const btnModeGrid = document.getElementById('btn-mode-grid');
  const btnModeInline = document.getElementById('btn-mode-inline');

  if (btnModeGrid && btnModeInline) {
    btnModeGrid.addEventListener('click', () => {
      currentViewMode = 'grid';
      btnModeGrid.classList.add('active');
      btnModeInline.classList.remove('active');
      processPipeline();
    });
    btnModeInline.addEventListener('click', () => {
      currentViewMode = 'inline';
      btnModeInline.classList.add('active');
      btnModeGrid.classList.remove('active');
      processPipeline();
    });
  }

  // Inspector Elements
  const inspectorWord = document.getElementById('ins-word');
  const inspectorCasing = document.getElementById('ins-casing');
  const inspectorIndex = document.getElementById('ins-index');
  const inspectorHex = document.getElementById('ins-hex');
  const inspectorBin = document.getElementById('ins-bin');
  const inspectorB60 = document.getElementById('ins-b60');
  const inspectorPua = document.getElementById('ins-pua');
  const inspectorSvgBox = document.getElementById('ins-svg-box');

  // Khởi tạo Preset Chips
  if (presetContainer) {
    presetContainer.innerHTML = '';
    PRESETS.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-btn';
      btn.innerHTML = `<span>${p.icon}</span> ${p.name}`;
      btn.addEventListener('click', () => {
        inputEl.value = p.text;
        processPipeline();
      });
      presetContainer.appendChild(btn);
    });
  }

  // Pipeline chính
  function processPipeline() {
    const text = inputEl?.value || '';
    const { tokens, hexStream } = encodeV2B(text);
    const metrics = calculateMetrics(text, tokens);
    const decoded = decodeV2B(tokens);

    // Cập nhật Metrics với an toàn null-check
    if (metricWords) metricWords.textContent = metrics.wordCount.toLocaleString();
    if (metricUtf8) metricUtf8.textContent = `${metrics.utf8Bytes} B`;
    if (metricUtf16) metricUtf16.textContent = `${metrics.utf16Bytes} B`;
    if (metricV2b) metricV2b.textContent = `${metrics.v2bBytes} B`;
    if (metricSaving) metricSaving.textContent = `-${metrics.savingPercent}%`;
    if (metricRatio) metricRatio.textContent = metrics.ratio;
    if (progressBar) progressBar.style.width = `${Math.min(100, metrics.savingPercent)}%`;

    // Cập nhật Hex Output
    if (hexOutput) hexOutput.value = hexStream;

    // Cập nhật Decoded Output
    if (decodedOutput) decodedOutput.value = decoded;

    // Cập nhật Status Badge
    if (statusBadge) {
      if (text.trim() === '') {
        statusBadge.className = 'status-badge status-idle';
        statusBadge.innerHTML = '⚡ Sẵn sàng xử lý';
      } else if (text.trim() === decoded.trim()) {
        statusBadge.className = 'status-badge status-success';
        statusBadge.innerHTML = '✅ 100% Khớp hoàn hảo (Lossless)';
      } else {
        statusBadge.className = 'status-badge status-diff';
        statusBadge.innerHTML = '⚠️ Có sai khác khoảng trắng/dấu câu';
      }
    }

    // 1. RENDER VĂN BẢN TIẾNG VIỆT KỲ LẠ KIỂU HÀN (HANGUL BLOCKS)
    renderHangulStage(tokens);

    // 2. RENDER DÒNG TOKEN BÓC TÁCH
    renderTokens(tokens);
  }

  // Render các khối chữ tượng hình kiểu Hàn / Cyber Blocks
  function renderHangulStage(tokens) {
    if (!hangulStage) return;
    hangulStage.innerHTML = '';

    const wordTokens = tokens.filter(t => t.type === 'word');
    if (wordTokens.length === 0) {
      hangulStage.innerHTML = '<div class="empty-hangul">Nhập văn bản tiếng Việt để xem từng từ hiển thị thành khối chữ tượng hình kiểu Hàn (2-Byte / khối)...</div>';
      return;
    }

    if (currentViewMode === 'grid') {
      hangulStage.className = 'hangul-stage-grid';
      wordTokens.forEach((t, i) => {
        const card = document.createElement('div');
        card.className = 'hangul-card';
        card.dataset.idx = i;

        // Render SVG khối chữ tượng hình Hangul
        const svgHtml = buildHangulBlockSvg(t.b60Code, 78, '#00f2fe');

        card.innerHTML = `
          <div class="h-svg-wrap">${svgHtml}</div>
          <div class="h-word-row">
            <span class="h-word">${t.text}</span>
            <span class="h-2b-badge">2 Bytes</span>
          </div>
          <div class="h-meta-row">
            <span class="h-b60" title="Mã TimeCypher Base60">${t.b60Code}</span>
            <span class="h-hex" title="Mã Hex 16-bit">0x${t.hex}</span>
          </div>
        `;

        card.addEventListener('click', () => {
          document.querySelectorAll('.hangul-card, .word-token-chip').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          showTokenDetails(t, i + 1);
        });

        hangulStage.appendChild(card);
      });
    } else {
      // Chế độ 'inline' - Đoạn văn tự nhiên liền mạch như trang chữ Hàn
      hangulStage.className = 'hangul-stage-inline';
      tokens.forEach((t, i) => {
        if (t.type === 'word') {
          const item = document.createElement('div');
          item.className = 'hangul-inline-item';
          const svgHtml = buildHangulBlockSvg(t.b60Code, 44, '#00f2fe');
          item.innerHTML = `
            <div class="h-inline-svg">${svgHtml}</div>
            <span class="h-inline-word">${t.text}</span>
          `;
          item.addEventListener('click', () => {
            showTokenDetails(t, i + 1);
          });
          hangulStage.appendChild(item);
        } else if (t.type === 'punct') {
          const p = document.createElement('span');
          p.className = 'hangul-inline-punct';
          p.textContent = t.text;
          hangulStage.appendChild(p);
        } else if (t.type === 'newline') {
          hangulStage.appendChild(document.createElement('br'));
        }
      });
    }

    // Tự động kích hoạt khối đầu tiên
    if (wordTokens[0]) {
      showTokenDetails(wordTokens[0], 1);
    }
  }

  // Render Token Chips
  function renderTokens(tokens) {
    if (!tokenStream) return;
    tokenStream.innerHTML = '';
    const wordTokens = tokens.filter(t => t.type === 'word');

    if (wordTokens.length === 0) {
      tokenStream.innerHTML = '<div class="empty-tokens">Nhập văn bản để xem bóc tách 16-bit...</div>';
      return;
    }

    wordTokens.forEach((t, i) => {
      const chip = document.createElement('div');
      chip.className = 'word-token-chip';
      chip.innerHTML = `
        <span class="tok-num">#${i + 1}</span>
        <span class="tok-word">${t.text}</span>
        <span class="tok-hex">0x${t.hex}</span>
        <span class="tok-b60">${t.b60Code}</span>
      `;

      chip.addEventListener('click', () => {
        document.querySelectorAll('.word-token-chip, .hangul-card').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        showTokenDetails(t, i + 1);
      });

      tokenStream.appendChild(chip);
    });
  }

  // Soi chi tiết token
  function showTokenDetails(t, num) {
    if (!inspectorWord) return;
    inspectorWord.textContent = `${t.text} (#${num})`;
    if (inspectorCasing) inspectorCasing.textContent = getCasingLabel(t.casing);
    if (inspectorIndex) inspectorIndex.textContent = `#${t.idx} trong kho 7.190 từ`;
    if (inspectorHex) inspectorHex.textContent = `0x${t.hex} (${t.code16})`;
    
    // Hiển thị SVG lớn trong inspector
    if (inspectorSvgBox) {
      inspectorSvgBox.innerHTML = buildHangulBlockSvg(t.b60Code, 94, '#00f2fe');
    }

    // Phân tách nhị phân trực quan
    if (inspectorBin && t.bin) {
      const b = t.bin;
      inspectorBin.innerHTML = `
        <span class="bit-dict" title="Bit 15: 0 = Từ điển">${b[0]}</span>
        <span class="bit-casing" title="Bit 14-13: Casing">${b.slice(1, 3)}</span>
        <span class="bit-idx" title="Bit 12-0: Index (0..7189)">${b.slice(3, 7)} ${b.slice(7, 11)} ${b.slice(11, 16)}</span>
      `;
    }

    if (inspectorB60) inspectorB60.textContent = t.b60Code;
    if (inspectorPua) inspectorPua.textContent = `U+${t.hex} (16-bit BMP)`;
  }

  // Sự kiện nhập liệu
  if (inputEl) inputEl.addEventListener('input', processPipeline);

  // Nút xóa
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (inputEl) {
        inputEl.value = '';
        inputEl.focus();
      }
      processPipeline();
    });
  }

  // Nút sao chép Hex
  if (btnCopyHex) {
    btnCopyHex.addEventListener('click', async () => {
      if (!hexOutput?.value) return;
      await navigator.clipboard.writeText(hexOutput.value);
      const orig = btnCopyHex.innerHTML;
      btnCopyHex.innerHTML = '✅ Đã chép Hex';
      setTimeout(() => btnCopyHex.innerHTML = orig, 1500);
    });
  }

  // Nút sao chép văn bản giải mã
  if (btnCopyDecoded) {
    btnCopyDecoded.addEventListener('click', async () => {
      if (!decodedOutput?.value) return;
      await navigator.clipboard.writeText(decodedOutput.value);
      const orig = btnCopyDecoded.innerHTML;
      btnCopyDecoded.innerHTML = '✅ Đã chép';
      setTimeout(() => btnCopyDecoded.innerHTML = orig, 1500);
    });
  }

  // Kích hoạt mặc định với preset 0
  if (inputEl) {
    inputEl.value = PRESETS[0].text;
    processPipeline();
  }
});
