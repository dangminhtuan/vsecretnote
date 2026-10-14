
    import {
      encodeWord, decodeWord, extractPhonetics, applyTone
    } from './vcomp.js';

    import {
      RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2,
      BASE60_MAPPING
    } from './data.js';

    import { VIETNAMESE_LEXICON_MAP } from './vietnamese_lexicon.js';

    // Live clock on status bar
    function updateLiveClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const el = document.getElementById('liveClock');
      if (el) el.textContent = `${h}:${m}`;
    }
    setInterval(updateLiveClock, 10000);
    updateLiveClock();

    // ====================================================================
    // SMART CALCULATOR (PORT TỪ SmartCalculator.kt - OFFLINE 0ms)
    // ====================================================================
    const SmartCalculator = {
      formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '';
        const parts = num.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return parts.join(',');
      },
      formatVietnameseShortCurrency(val) {
        if (val < 1000) return null;
        if (val >= 1000000000) {
          const b = (val / 1000000000).toFixed(1).replace('.0', '').replace('.', ',');
          return `${b} tỷ`;
        }
        if (val >= 1000000) {
          const m = (val / 1000000).toFixed(1).replace('.0', '').replace('.', ',');
          return `${m} triệu`;
        }
        if (val >= 1000) {
          const k = Math.round(val / 1000);
          return `${k} nghìn`;
        }
        return null;
      },
      evaluateMath(rawExpr) {
        try {
          let clean = rawExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\^/g, '**');
          clean = clean.replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)');
          clean = clean.replace(/π/g, 'Math.PI');
          if (!/[0-9]/.test(clean)) return null;
          if (!/^[0-9+\-*\/().\sMath.sqrtPI]+$/.test(clean)) return null;
          const res = Function(`'use strict'; return (${clean})`)();
          if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
            return Math.round(res * 10000) / 10000;
          }
        } catch(e) {}
        return null;
      },
      analyzeBeforeCursor(beforeText) {
        if (!beforeText || !beforeText.trim()) return [];
        const lastLine = beforeText.substring(beforeText.lastIndexOf('\n') + 1);
        if (!lastLine.trim()) return [];

        // 1. Số tiền thuần túy >= 4 chữ số
        const pureNumMatch = /(?<![\d.,+\-×÷*\/^])(\d{4,15})\s*$/.exec(lastLine);
        if (pureNumMatch) {
          const rawDigits = pureNumMatch[1];
          const val = parseInt(rawDigits, 10);
          if (!isNaN(val) && val >= 1000) {
            const formatted = this.formatNumber(val);
            const list = [
              { label: `🔄 ${formatted}`, text: formatted, replaceLen: pureNumMatch[0].length, isMoney: true, amount: val },
              { label: `💰 ${formatted} ₫`, text: `${formatted} ₫`, replaceLen: pureNumMatch[0].length, isMoney: true, amount: val }
            ];
            const vnWords = this.formatVietnameseShortCurrency(val);
            if (vnWords) {
              list.push({ label: `🗣️ ${vnWords}`, text: vnWords, replaceLen: pureNumMatch[0].length, isMoney: true, amount: val });
            }
            return list;
          }
        }

        // 2. Phép tính toán học
        const mathMatch = /([\d.,+\-×÷*\/^()√π%\s]{2,60})(=?)\s*$/.exec(lastLine);
        if (mathMatch) {
          const expr = mathMatch[1].trim();
          if (/[+\-×÷*\/^√%]/.test(expr)) {
            const res = this.evaluateMath(expr);
            if (res !== null) {
              const formatted = this.formatNumber(res);
              return [
                { label: `🧮 = ${formatted}`, text: `${expr} = ${formatted}`, replaceLen: mathMatch[0].length, isCalc: true, amount: Math.round(res) },
                { label: `💰 ${formatted} ₫`, text: `${formatted} ₫`, replaceLen: mathMatch[0].length, isCalc: true, amount: Math.round(res) }
              ];
            }
          }
        }

        return [];
      }
    };

    // ====================================================================
    // SMART EXPENSE MODULE (SỔ THU CHI THÔNG MINH - CHUẨN ANDROID)
    // ====================================================================
    const SmartExpenseModule = {
      isEnabled() {
        return localStorage.getItem('vboard_expense_enabled') !== 'false';
      },
      setEnabled(val) {
        localStorage.setItem('vboard_expense_enabled', val ? 'true' : 'false');
      },
      formatCompactAmount(amount) {
        if (amount >= 1000000) {
          const tr = (amount / 1000000).toFixed(1).replace('.0', '').replace('.', ',');
          return `${tr}tr`;
        }
        if (amount >= 1000) {
          const k = Math.round(amount / 1000);
          return `${k}k`;
        }
        return amount.toString();
      },
      getExpenses() {
        try {
          return JSON.parse(localStorage.getItem('vboard_expenses') || '[]');
        } catch(e) {
          return [];
        }
      },
      addExpense(amount, note = 'Ghi nhanh') {
        const list = this.getExpenses();
        const entry = {
          id: Date.now(),
          amount: amount,
          note: note,
          timestamp: Date.now()
        };
        list.push(entry);
        localStorage.setItem('vboard_expenses', JSON.stringify(list));
        return entry;
      },
      removeLastExpense() {
        const list = this.getExpenses();
        if (list.length > 0) {
          const popped = list.pop();
          localStorage.setItem('vboard_expenses', JSON.stringify(list));
          return popped;
        }
        return null;
      },
      getTotals() {
        const list = this.getExpenses();
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        let today = 0;
        let month = 0;
        list.forEach(e => {
          if (e.timestamp >= startOfDay) today += e.amount;
          if (e.timestamp >= startOfMonth) month += e.amount;
        });
        return { today, month };
      }
    };

    window.toggleExpenseModule = function() {
      const next = !SmartExpenseModule.isEnabled();
      SmartExpenseModule.setEnabled(next);
      updateExpenseUI();
      showToast(next ? '💰 Đã BẬT Sổ chi tiêu thông minh' : '🔒 Đã TẮT Sổ chi tiêu');
    };

    function updateExpenseUI() {
      const btn = document.getElementById('optExpenseToggle');
      const box = document.getElementById('expenseSummaryBox');
      const enabled = SmartExpenseModule.isEnabled();
      if (btn) {
        btn.textContent = enabled ? 'Bật' : 'Tắt';
        btn.className = `sheet-btn ${enabled ? 'active gold' : ''}`;
      }
      if (box) {
        const { today, month } = SmartExpenseModule.getTotals();
        box.textContent = `Hôm nay: ${SmartCalculator.formatNumber(today)} ₫ | Tháng này: ${SmartCalculator.formatNumber(month)} ₫`;
      }
    }

    // ====================================================================
    // 1. DATA LAYOUT TỪ VCompKeyboardView.kt (CHÍNH XÁC 100%)
    // ====================================================================
    const NORMAL_ROWS = [
      // Row 0
      [
        { id: 'k_0_0', char: ':', shift: '°', tl: '', sub: '°', type: 'flank', r: 0, c: 0 },
        { id: 'k_0_1', char: '1', shift: '!', tl: 'yê', sub: 'sắc', type: 'normal', subType: 'tone', r: 0, c: 1 },
        { id: 'k_0_2', char: '2', shift: '@', tl: 'oat', sub: 'huyền', type: 'normal', subType: 'tone', r: 0, c: 2 },
        { id: 'k_0_3', char: '3', shift: '#', tl: 'ê', sub: 'hỏi', type: 'normal', subType: 'tone', r: 0, c: 3 },
        { id: 'k_0_4', char: '4', shift: '$', tl: 'ươu', sub: 'ngã', type: 'normal', subType: 'tone', r: 0, c: 4 },
        { id: 'k_0_5', char: '5', shift: '%', tl: 'âu', sub: 'nặng', type: 'normal', subType: 'tone', r: 0, c: 5 },
        { id: 'k_0_6', char: '6', shift: '^', tl: 'ươ', sub: 'th', type: 'normal', subType: 'cons', r: 0, c: 6 },
        { id: 'k_0_7', char: '7', shift: '&', tl: 'oai', sub: 'ch', type: 'normal', subType: 'cons', r: 0, c: 7 },
        { id: 'k_0_8', char: '8', shift: '*', tl: 'oă', sub: 'tr', type: 'normal', subType: 'cons', r: 0, c: 8 },
        { id: 'k_0_9', char: '9', shift: '(', tl: 'ây', sub: 'nh', type: 'normal', subType: 'cons', r: 0, c: 9 },
        { id: 'k_0_10', char: '0', shift: ')', tl: 'ô', sub: 'ng', type: 'normal', subType: 'cons', r: 0, c: 10 },
        { id: 'k_0_11', char: '000', shift: '₫', tl: '', sub: '₫', type: 'flank', r: 0, c: 11 }
      ],
      // Row 1
      [
        { id: 'k_1_0', char: '🔢', shift: '', tl: '', sub: 'Sym', type: 'fn', r: 1, c: 0 },
        { id: 'k_1_1', char: 'q', shift: 'Q', tl: 'Qu', sub: 'ngã', type: 'normal', r: 1, c: 1 },
        { id: 'k_1_2', char: 'w', shift: 'W', tl: 'ư', sub: '', type: 'normal', r: 1, c: 2 },
        { id: 'k_1_3', char: 'e', shift: 'E', tl: 'êu', sub: '', type: 'normal', r: 1, c: 3 },
        { id: 'k_1_4', char: 'r', shift: 'R', tl: 'Tr', sub: '', type: 'normal', r: 1, c: 4 },
        { id: 'k_1_5', char: 't', shift: 'T', tl: 'Th', sub: '', type: 'normal', r: 1, c: 5 },
        { id: 'k_1_6', char: 'y', shift: 'Y', tl: 'yêu', sub: '', type: 'normal', r: 1, c: 6 },
        { id: 'k_1_7', char: 'u', shift: 'U', tl: 'u', sub: '', type: 'normal', r: 1, c: 7 },
        { id: 'k_1_8', char: 'i', shift: 'I', tl: 'i', sub: '', type: 'normal', r: 1, c: 8 },
        { id: 'k_1_9', char: 'o', shift: 'O', tl: 'o', sub: '', type: 'normal', r: 1, c: 9 },
        { id: 'k_1_10', char: 'p', shift: 'P', tl: 'Ph', sub: '', type: 'normal', r: 1, c: 10 },
        { id: 'k_1_11', char: '⌫', shift: '', tl: '', sub: 'Del', type: 'bksp', r: 1, c: 11 }
      ],
      // Row 2
      [
        { id: 'k_2_0', char: '📋', shift: '', tl: '', sub: 'Dán', type: 'flank', r: 2, c: 0 },
        { id: 'k_2_1', char: 'a', shift: 'A', tl: 'a', sub: '', type: 'normal', r: 2, c: 1 },
        { id: 'k_2_2', char: 's', shift: 'S', tl: 'ương', sub: '', type: 'normal', r: 2, c: 2 },
        { id: 'k_2_3', char: 'd', shift: 'D', tl: 'đ', sub: 'nặng', type: 'normal', r: 2, c: 3 },
        { id: 'k_2_4', char: 'f', shift: 'F', tl: 'ươn', sub: '', type: 'normal', r: 2, c: 4 },
        { id: 'k_2_5', char: 'g', shift: 'G', tl: 'Gh', sub: '', type: 'normal', r: 2, c: 5 },
        { id: 'k_2_6', char: 'h', shift: 'H', tl: 'Nh', sub: '', type: 'normal', r: 2, c: 6 },
        { id: 'k_2_7', char: 'j', shift: 'J', tl: 'eo', sub: '', type: 'normal', r: 2, c: 7 },
        { id: 'k_2_8', char: 'k', shift: 'K', tl: 'Kh', sub: 'sắc', type: 'normal', r: 2, c: 8 },
        { id: 'k_2_9', char: 'l', shift: 'L', tl: 'oi', sub: 'hỏi', type: 'normal', r: 2, c: 9 },
        { id: 'k_2_10', char: '"', shift: "'", tl: '', sub: "'", type: 'fn', r: 2, c: 10 },
        { id: 'k_2_11', char: '🔍', shift: '', tl: '', sub: 'Giữ:AI', type: 'flank', r: 2, c: 11 }
      ],
      // Row 3
      [
        { id: 'k_3_0', char: '⇧', shift: '', tl: '', sub: 'Shift', type: 'shift', r: 3, c: 0 },
        { id: 'k_3_1', char: '/', shift: '\\', tl: '', sub: '\\', type: 'fn', r: 3, c: 1 },
        { id: 'k_3_2', char: 'z', shift: 'Z', tl: 'ưa', sub: '', type: 'normal', r: 3, c: 2 },
        { id: 'k_3_3', char: 'x', shift: 'X', tl: 'ơi', sub: '', type: 'normal', r: 3, c: 3 },
        { id: 'k_3_4', char: 'c', shift: 'C', tl: 'Ch', sub: '', type: 'normal', r: 3, c: 4 },
        { id: 'k_3_5', char: 'v', shift: 'V', tl: 'ia', sub: 'huyền', type: 'normal', r: 3, c: 5 },
        { id: 'k_3_6', char: 'b', shift: 'B', tl: 'uy', sub: 'ngang', type: 'normal', r: 3, c: 6 },
        { id: 'k_3_7', char: 'n', shift: 'N', tl: 'Ng', sub: '', type: 'normal', r: 3, c: 7 },
        { id: 'k_3_8', char: 'm', shift: 'M', tl: 'uôi', sub: '', type: 'normal', r: 3, c: 8 },
        { id: 'k_3_9', char: ',', shift: '|', tl: '', sub: '|', type: 'fn', r: 3, c: 9 },
        { id: 'k_3_10', char: '.', shift: '…', tl: '', sub: '…', type: 'fn', r: 3, c: 10 },
        { id: 'k_3_11', char: '⏎', shift: '↵', tl: '', sub: 'Line', type: 'action', r: 3, c: 11 }
      ],
      // Row 4
      [
        { id: 'k_4_0', char: '📱', shift: '', tl: '', sub: '1-Tay', type: 'mode', r: 4, c: 0 },
        { id: 'k_4_1', char: '(', shift: '⇤', tl: '', sub: '2 KT', type: 'fn', r: 4, c: 1 },
        { id: 'k_4_2', char: ')', shift: '⇥', tl: '', sub: '2 KT', type: 'fn', r: 4, c: 2 },
        { id: 'k_4_3', char: '‹', shift: '|‹', tl: '', sub: '2 KT', type: 'fn', r: 4, c: 3 },
        { id: 'k_4_4', char: ' ', shift: '', tl: '', sub: '3 KT', type: 'space', r: 4, c: 4 },
        { id: 'k_4_5', char: '›', shift: '›|', tl: '', sub: '3 KT', type: 'fn', r: 4, c: 5 },
        { id: 'k_4_6', char: ',', shift: ';', tl: '', sub: '3 KT', type: 'fn', r: 4, c: 6 },
        { id: 'k_4_7', char: '?', shift: ']', tl: '', sub: '4+ KT', type: 'fn', r: 4, c: 7 },
        { id: 'k_4_8', char: '+', shift: '}', tl: '', sub: '4+ KT', type: 'fn', r: 4, c: 8 },
        { id: 'k_4_9', char: '-', shift: '_', tl: '', sub: '4+ KT', type: 'fn', r: 4, c: 9 },
        { id: 'k_4_10', char: '"', shift: '~', tl: '', sub: '4+ KT', type: 'fn', r: 4, c: 10 },
        { id: 'k_4_11', char: '↵', shift: '↵', tl: '', sub: 'Enter', type: 'action', r: 4, c: 11 }
      ]
    ];

    // DECK ĐIỀU KHIỂN HÀNG 4 KHI BẬT STUDY MODE (GIỮ ⇧)
    const STUDY_ROW4_DECK = [
      { id: 'k_4_1', char: 'B4', sub: 'Lục', targetMode: 2, colorHex: '#3FB950' },
      { id: 'k_4_2', char: 'B5', sub: 'Vàng', targetMode: 3, colorHex: '#F2CC60' },
      { id: 'k_4_3', char: 'B6', sub: 'Tím', targetMode: 4, colorHex: '#BC8CFF' },
      { id: 'k_4_4', char: 'ALL', sub: 'B4-6', targetMode: 1, colorHex: '#58A6FF' },
      { id: 'k_4_5', char: 'B1', sub: 'Telex', targetMode: 5, colorHex: '#F0883E' },
      { id: 'k_4_6', char: 'B2', sub: 'BKVL', targetMode: 6, colorHex: '#D29922' },
      { id: 'k_4_7', char: 'B3', sub: '0..5', targetMode: 7, colorHex: '#79C0FF' },
      { id: 'k_4_8', char: '🎤a1', sub: 'Nói a1', targetMode: 0, colorHex: '#3FB950' },
      { id: 'k_4_9', char: '🎤vV1', sub: 'Nói vV1', targetMode: 0, colorHex: '#F2CC60' },
      { id: 'k_4_10', char: '🔄Mã', sub: 'Đổi câu', targetMode: 0, colorHex: '#BC8CFF' }
    ];

    const STUDY_MODE_BADGES = [
      'Tắt',
      '🎓 Tất cả B4-B6',
      '🎓 B4 Lục (aeiouy)',
      '🎓 B5 Vàng (cghmnw)',
      '🎓 B6 Tím (6789tp)',
      '🎓 B1 Telex (zsfrxj)',
      '🎓 B2 BKVL (bkvlqd)',
      '🎓 B3 Số (0..5)'
    ];

    // SYMBOLS LAYER (5 hàng x 12 cột)
    const SYMBOL_ROWS = [
      [
        { id: 'sym_0_0', char: '~', type: 'fn' }, { id: 'sym_0_1', char: '{' }, { id: 'sym_0_2', char: '}' },
        { id: 'sym_0_3', char: '[' }, { id: 'sym_0_4', char: ']' }, { id: 'sym_0_5', char: '₫' },
        { id: 'sym_0_6', char: '$' }, { id: 'sym_0_7', char: '€' }, { id: 'sym_0_8', char: '¥' },
        { id: 'sym_0_9', char: '%' }, { id: 'sym_0_10', char: '‰' }, { id: 'sym_0_11', char: '⚙️', sub: 'Cài đặt', type: 'fn' }
      ],
      [
        { id: 'sym_1_0', char: 'ABC', sub: 'ABC', type: 'fn' }, { id: 'sym_1_1', char: '&' }, { id: 'sym_1_2', char: '|' },
        { id: 'sym_1_3', char: '^' }, { id: 'sym_1_4', char: '\\' }, { id: 'sym_1_5', char: '7', type: 'digit' },
        { id: 'sym_1_6', char: '8', type: 'digit' }, { id: 'sym_1_7', char: '9', type: 'digit' },
        { id: 'sym_1_8', char: '÷' }, { id: 'sym_1_9', char: '√' }, { id: 'sym_1_10', char: '😂' },
        { id: 'sym_1_11', char: '⌫', sub: 'Del', type: 'bksp' }
      ],
      [
        { id: 'sym_2_0', char: '📋', sub: 'Dán', type: 'flank' }, { id: 'sym_2_1', char: ';' }, { id: 'sym_2_2', char: ':' },
        { id: 'sym_2_3', char: '_' }, { id: 'sym_2_4', char: '`' }, { id: 'sym_2_5', char: '4', type: 'digit' },
        { id: 'sym_2_6', char: '5', type: 'digit' }, { id: 'sym_2_7', char: '6', type: 'digit' },
        { id: 'sym_2_8', char: '×' }, { id: 'sym_2_9', char: 'π' }, { id: 'sym_2_10', char: '❤️' },
        { id: 'sym_2_11', char: '🔍', sub: 'Giữ:AI', type: 'flank' }
      ],
      [
        { id: 'sym_3_0', char: '⇧', sub: 'Shift', type: 'shift' }, { id: 'sym_3_1', char: '!' }, { id: 'sym_3_2', char: '@' },
        { id: 'sym_3_3', char: '#' }, { id: 'sym_3_4', char: '*' }, { id: 'sym_3_5', char: '1', type: 'digit' },
        { id: 'sym_3_6', char: '2', type: 'digit' }, { id: 'sym_3_7', char: '3', type: 'digit' },
        { id: 'sym_3_8', char: '-' }, { id: 'sym_3_9', char: '±' }, { id: 'sym_3_10', char: '👍' },
        { id: 'sym_3_11', char: '↵', sub: 'Line', type: 'action' }
      ],
      [
        { id: 'sym_4_0', char: '📱', sub: '1-Tay', type: 'mode' }, { id: 'sym_4_1', char: '(' }, { id: 'sym_4_2', char: ')' },
        { id: 'sym_4_3', char: '<' }, { id: 'sym_4_4', char: ' ', sub: 'Space', type: 'space' }, { id: 'sym_4_5', char: '0', type: 'digit' },
        { id: 'sym_4_6', char: '.' }, { id: 'sym_4_7', char: '000' }, { id: 'sym_4_8', char: '+' },
        { id: 'sym_4_9', char: '=', sub: 'Giữ:Tính' }, { id: 'sym_4_10', char: '🔥' }, { id: 'sym_4_11', char: '↵', sub: 'Enter', type: 'action' }
      ]
    ];

    // BÀN PHÍM MÃ VẦN BÍ MẬT (SECRET RHYMES)
    const SECRET_36_KEYS = [
      { id: 'k_0_1', digit: '1', rhymes: ['yê', 'sắc', 'ai', 'iêc', 'ua'] },
      { id: 'k_0_2', digit: '2', rhymes: ['oat', 'huyền', 'am', 'iêng', 'uô'] },
      { id: 'k_0_3', digit: '3', rhymes: ['ê', 'hỏi', 'an', 'iêt', 'ưa'] },
      { id: 'k_0_4', digit: '4', rhymes: ['ươu', 'ngã', 'ang', 'im', 'ươ'] },
      { id: 'k_0_5', digit: '5', rhymes: ['âu', 'nặng', 'anh', 'in', 'ươc'] },
      { id: 'k_0_6', digit: '6', rhymes: ['ươ', 'th', 'ao', 'inh', 'ươn'] },
      { id: 'k_0_7', digit: '7', rhymes: ['oai', 'ch', 'ap', 'it', 'ương'] },
      { id: 'k_0_8', digit: '8', rhymes: ['oă', 'tr', 'at', 'iêu', 'ươp'] },
      { id: 'k_0_9', digit: '9', rhymes: ['ây', 'nh', 'ay', 'oam', 'ươt'] },
      { id: 'k_0_10', digit: '0', rhymes: ['ô', 'ng', 'ăc', 'oan', 'ưu'] },
      { id: 'k_1_1', digit: 'q', rhymes: ['Qu', 'ngã', 'oang', 'oanh', 'ap'] },
      { id: 'k_1_2', digit: 'w', rhymes: ['ư', 'ư', 'oap', 'oat', 'ay'] },
      { id: 'k_1_3', digit: 'e', rhymes: ['êu', 'e', 'oay', 'oăc', 'âm'] },
      { id: 'k_1_4', digit: 'r', rhymes: ['Tr', 'r', 'oăm', 'oăn', 'ân'] },
      { id: 'k_1_5', digit: 't', rhymes: ['Th', 't', 'oăng', 'oăt', 'âng'] },
      { id: 'k_1_6', digit: 'y', rhymes: ['yêu', 'y', 'oe', 'oen', 'âp'] },
      { id: 'k_1_7', digit: 'u', rhymes: ['u', 'u', 'oeo', 'oet', 'ât'] },
      { id: 'k_1_8', digit: 'i', rhymes: ['i', 'i', 'oi', 'om', 'âu'] },
      { id: 'k_1_9', digit: 'o', rhymes: ['o', 'o', 'on', 'ong', 'êch'] },
      { id: 'k_1_10', digit: 'p', rhymes: ['Ph', 'p', 'ooc', 'op', 'ên'] },
      { id: 'k_2_1', digit: 'a', rhymes: ['a', 'a', 'ot', 'ăng', 'ênh'] },
      { id: 'k_2_2', digit: 's', rhymes: ['ương', 'sắc', 'ăp', 'ăt', 'êp'] },
      { id: 'k_2_3', digit: 'd', digitDisplay: 'd', rhymes: ['đ', 'nặng', 'âu', 'ây', 'êt'] },
      { id: 'k_2_4', digit: 'f', rhymes: ['ươn', 'huyền', 'âc', 'âm', 'êu'] },
      { id: 'k_2_5', digit: 'g', rhymes: ['Gh', 'g', 'ân', 'âng', 'ia'] },
      { id: 'k_2_6', digit: 'h', rhymes: ['Nh', 'h', 'âp', 'ât', 'iêc'] },
      { id: 'k_2_7', digit: 'j', rhymes: ['eo', 'nặng', 'âu', 'e', 'iêm'] },
      { id: 'k_2_8', digit: 'k', rhymes: ['Kh', 'sắc', 'ec', 'em', 'iên'] },
      { id: 'k_2_9', digit: 'l', rhymes: ['oi', 'hỏi', 'en', 'eng', 'iêng'] },
      { id: 'k_3_2', digit: 'z', rhymes: ['ưa', 'ngang', 'eo', 'ep', 'iêp'] },
      { id: 'k_3_3', digit: 'x', rhymes: ['ơi', 'ngã', 'et', 'êu', 'iêt'] },
      { id: 'k_3_4', digit: 'c', rhymes: ['Ch', 'c', 'ê', 'êch', 'im'] },
      { id: 'k_3_5', digit: 'v', rhymes: ['ia', 'huyền', 'êm', 'ên', 'in'] },
      { id: 'k_3_6', digit: 'b', rhymes: ['uy', 'ngang', 'ênh', 'êp', 'inh'] },
      { id: 'k_3_7', digit: 'n', rhymes: ['Ng', 'n', 'êt', 'êu', 'ip'] },
      { id: 'k_3_8', digit: 'm', rhymes: ['uôi', 'm', 'ia', 'iêc', 'it'] }
    ];

    const SECRET_PASSWORDS = [
      { name: 'VCB Ngân Hàng', code: '123456', keyPath: ['1', '2', '3', '4', '5', '6'] },
      { name: 'BIDV SmartBanking', code: '212121', keyPath: ['2', '1', '2', '1', '2', '1'] },
      { name: 'MB Bank Quân Đội', code: '257190', keyPath: ['2', '5', '7', '1', '9', '0'] },
      { name: 'Master Password', code: 'Minh@2026', keyPath: ['m', 'i', 'n', 'h'] }
    ];

    // ====================================================================
    // 2. VCOMP NEIGHBOR ENGINE (TRĂM HOA ĐUA NỞ 8 HƯỚNG)
    // ====================================================================
    function buildCanonicalKeyNeighbors() {
      const CONS_MAP = {
        't': 'Th', 'r': 'Tr', 'c': 'Ch', 'k': 'Kh', 'g': 'Gh',
        'n': 'Ng', 'h': 'Nh', 'p': 'Ph', 'q': 'Qu', 'l': 'Ngh', 'd': 'đ'
      };
      const TONE_DISPLAY_MAP = {
        'b': '=', 'k': '/', 'v': '\\', 'l': '?', 'q': '~', 'd': '.',
        'z': '=', 's': '/', 'f': '\\', 'r': '?', 'x': '~', 'j': '.'
      };

      const map = {};
      const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

      for (const ch of letters) {
        const lowIdx = BASE60_MAPPING.indexOf(ch);
        const upIdx = BASE60_MAPPING.indexOf(ch.toUpperCase());

        const r1_low = lowIdx !== -1 && RHYMES_BASE[lowIdx] !== '-' ? RHYMES_BASE[lowIdx] : null;
        const r2_low = lowIdx !== -1 && RHYMES_EXTRA_1[lowIdx] !== '-' ? RHYMES_EXTRA_1[lowIdx] : null;
        const r3_low = lowIdx !== -1 && RHYMES_EXTRA_2[lowIdx] !== '-' ? RHYMES_EXTRA_2[lowIdx] : null;

        const r1_up = upIdx !== -1 && RHYMES_BASE[upIdx] !== '-' ? RHYMES_BASE[upIdx] : null;
        const r2_up = upIdx !== -1 && RHYMES_EXTRA_1[upIdx] !== '-' ? RHYMES_EXTRA_1[upIdx] : null;
        const r3_up = upIdx !== -1 && RHYMES_EXTRA_2[upIdx] !== '-' ? RHYMES_EXTRA_2[upIdx] : null;

        const cons = CONS_MAP[ch];
        const toneSymbol = TONE_DISPLAY_MAP[ch];
        const dirs = {};

        // Hàng trên (Vần HOA): Top-Left B1, Top B3, Top-Right B2
        if (r1_up) dirs.top_left = { text: r1_up, type: 'rhyme', isUpper: true, table: 1 };
        if (r3_up) dirs.top = { text: r3_up, type: 'rhyme', isUpper: true, table: 3 };
        if (r2_up) dirs.top_right = { text: r2_up, type: 'rhyme', isUpper: true, table: 2 };

        // Hàng giữa: Trái = Phụ âm, Phải = Dấu
        if (cons) dirs.left = { text: cons, type: 'cons' };
        if (toneSymbol) dirs.right = { text: toneSymbol, type: 'tone' };

        // Hàng dưới (Vần thường): Bottom-Left B1, Bottom B3, Bottom-Right B2
        if (r1_low) dirs.bottom_left = { text: r1_low, type: 'rhyme', isUpper: false, table: 1 };
        if (r3_low) dirs.bottom = { text: r3_low, type: 'rhyme', isUpper: false, table: 3 };
        if (r2_low) dirs.bottom_right = { text: r2_low, type: 'rhyme', isUpper: false, table: 2 };

        map[ch] = dirs;
      }
      return map;
    }

    const KEY_NEIGHBORS = buildCanonicalKeyNeighbors();

    function getNeighborCoordinates(row, col) {
      return {
        top_left:     { r: row - 1, c: col - 1 },
        top:          { r: row - 1, c: col },
        top_right:    { r: row - 1, c: col + 1 },
        left:         { r: row,     c: col - 1 },
        right:        { r: row,     c: col + 1 },
        bottom_left:  { r: row + 1, c: col - 1 },
        bottom:       { r: row + 1, c: col },
        bottom_right: { r: row + 1, c: col + 1 }
      };
    }

    // ====================================================================
    // 3. STATE BIẾN TOÀN CỤC
    // ====================================================================
    let currentMode = 'normal'; // 'normal', '36L', '36R', 'symbols', 'secret_rhymes'
    let isShift = false;
    let isCaps = false;
    let shiftStudyMode = 0; // 0=off, 1=all, 2=B4, 3=B5, 4=B6, 5=B1, 6=B2, 7=B3
    let voiceAiEnabled = true;
    let isRecording = false;

    // Buffer & Caret Text State
    let committedText = '';
    let composingBuffer = '';
    let caretIndex = 0;
    let selectionStart = -1;
    let selectionEnd = -1;

    // Smart Contextual Backspace state
    let lastCommittedBySwipe = false;
    let lastCommittedSwipeWord = null;
    let lastCommittedWord = null;
    let isNumberRowLaunchpadActive = false;

    // Trăm hoa đua nở state
    let activeBloomRoot = null;
    let bloomHoldTimer = null;
    let isBloomLockedOpen = false;

    // Glide trail & Continuous swipe
    let glidePoints = [];
    let glideKeys = [];
    let isSwiping = false;

    // Pedagogical Illumination (Dạy học A1)
    let activeTeachingHighlight = null;

    // Mã vần bí mật
    let secretRhymeCycle = 0;
    let secretPeekActive = false;
    let secretInputSequence = [];

    // Gesture & Long-press timers
    let modeLongTimer = null;
    let isModeLongTriggered = false;
    let voiceLongTimer = null;
    let lastShiftTapTime = 0;
    let activePointerId = null;
    let gestureStartX = 0;
    let gestureStartY = 0;
    let gestureKeyDef = null;

    // Canvas
    let swipeCanvas = document.getElementById('swipeCanvas');
    let swipeCtx = swipeCanvas ? swipeCanvas.getContext('2d') : null;

    // Đóng / Mở Khung Hướng Dẫn
    window.dismissIntroBanner = function() {
      const banner = document.getElementById('introBanner');
      if (banner) {
        banner.classList.add('hidden');
        setTimeout(() => { banner.style.display = 'none'; }, 260);
        const btnTip = document.getElementById('btnToggleIntro');
        if (btnTip) btnTip.style.display = 'inline-flex';
        showToast('💡 Đã đóng hướng dẫn. Bấm nút 💡 Mẹo ở trên để xem lại bất cứ lúc nào!');
      }
    };

    window.toggleIntroBanner = function() {
      const banner = document.getElementById('introBanner');
      const btnTip = document.getElementById('btnToggleIntro');
      if (!banner) return;
      if (banner.style.display === 'none' || banner.classList.contains('hidden')) {
        banner.style.display = 'block';
        void banner.offsetWidth;
        banner.classList.remove('hidden');
        if (btnTip) btnTip.style.display = 'none';
        showToast('💡 Đã mở lại hướng dẫn');
      } else {
        dismissIntroBanner();
      }
    };

    // ====================================================================
    // 4. ANDROID TEMPORARY NOTICE & TOAST
    // ====================================================================
    let noticeTimer = null;
    function showTemporaryNotice(message, isGold = false) {
      const noticeBar = document.getElementById('sugNoticeBar');
      const noticePill = document.getElementById('sugNoticePill');
      if (!noticeBar || !noticePill) return;

      noticePill.textContent = message;
      noticePill.className = `sug-notice-pill ${isGold ? 'gold' : 'blue'}`;
      noticeBar.classList.add('active');

      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => {
        noticeBar.classList.remove('active');
      }, 2500);

      showToast(message);
    }

    let toastTimer = null;
    function showToast(msg) {
      const el = document.getElementById('globalToast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.classList.remove('show'); }, 2200);
    }

    // ====================================================================
    // 5. CỤM CÔNG CỤ TỰ ẨN KHI GÕ & VOICE / CLIPBOARD / AI NOTICES
    // ====================================================================
    function updateToolbarVisibility() {
      const isTyping = composingBuffer.length > 0;
      const btnPaste = document.getElementById('btnToolPaste');
      const btnSettings = document.getElementById('btnToolSettings');
      if (btnPaste && btnSettings) {
        btnPaste.style.display = isTyping ? 'none' : 'inline-flex';
        btnSettings.style.display = isTyping ? 'none' : 'inline-flex';
      }
    }

    window.handleNativePaste = function() {
      showTemporaryNotice('📋 Đang thực hiện chức năng Dán bộ nhớ đệm ở giao diện web, hãy dùng mobile app để có trải nghiệm đầy đủ!', false);
    };

    window.handleNativeAskAi = function() {
      showTemporaryNotice('❓🎤 Đang thực hiện chức năng Hỏi Gemini AI ở giao diện web, hãy dùng mobile app để có trải nghiệm đầy đủ!', true);
    };

    window.handleNativeVoiceTap = function() {
      if (voiceLongTimer) return;
      if (isRecording) {
        isRecording = false;
        updateVoiceBtnUI();
        showTemporaryNotice('✅ Đã kết thúc thu âm giọng nói mô phỏng', true);
      } else {
        isRecording = true;
        updateVoiceBtnUI();
        const actionName = (currentMode === 'symbols') ? 'Hỏi bài toán toán học' : (shiftStudyMode > 0 ? 'Nói đọc tốc ký A1' : 'Thu âm giọng nói');
        showTemporaryNotice(`✍️🎤 Đang thực hiện chức năng ${actionName} ở giao diện web, hãy dùng mobile app để có trải nghiệm đầy đủ!`, true);
      }
    };

    window.startVoiceLongPress = function(e) {
      e.preventDefault();
      voiceLongTimer = setTimeout(() => {
        voiceLongTimer = null;
        voiceAiEnabled = !voiceAiEnabled;
        if (isRecording) isRecording = false;
        updateVoiceBtnUI();
        const msg = voiceAiEnabled ? '✨🎤 Đã bật Voice AI (Gemini tự động đặt dấu câu)' : '🎤 Đã tắt Voice AI (Offline 0ms, đọc kèm dấu)';
        showTemporaryNotice(msg, true);
      }, 350);
    };

    window.cancelVoiceLongPress = function() {
      if (voiceLongTimer) {
        clearTimeout(voiceLongTimer);
        voiceLongTimer = null;
      }
    };

    function updateVoiceBtnUI() {
      const btn = document.getElementById('btnToolVoice');
      const icon = document.getElementById('voiceBtnIcon');
      if (!btn || !icon) return;

      if (isRecording) {
        btn.className = 'sug-tool-btn voice recording';
        icon.textContent = '🔴';
      } else if (currentMode === 'symbols') {
        btn.className = 'sug-tool-btn voice calc';
        icon.textContent = '🧮🎤';
      } else if (shiftStudyMode > 0) {
        btn.className = 'sug-tool-btn voice study';
        icon.textContent = '🎓🎤';
      } else if (voiceAiEnabled) {
        btn.className = 'sug-tool-btn voice';
        icon.textContent = '✨✍️🎤';
      } else {
        btn.className = 'sug-tool-btn voice off';
        icon.textContent = '✍️🎤';
      }
    }

    // ====================================================================
    // 6. RENDER GỢI Ý & SOẠN THẢO (SMART CALCULATOR, EXPENSES & LEXICON)
    // ====================================================================
    function renderSuggestions() {
      const container = document.getElementById('sugChipsScroll');
      if (!container) return;
      container.innerHTML = '';

      // 1. Nếu đang ở Chế độ Học Dấu (Study Mode - Giữ ⇧)
      if (shiftStudyMode > 0) {
        const modeBadge = STUDY_MODE_BADGES[shiftStudyMode] || '🎓 Học Dấu';
        const studyChips = [
          { text: '🎤a1 Nói ➔ Mã a1', type: 'study' },
          { text: '🎤vV1 Nói ➔ Mã vV1', type: 'study' },
          { text: '🎤⏱️ Nói ➔ Mã số', type: 'study' },
          { text: '🔀 Đổi câu ➔ a1', type: 'study' },
          { text: '🔀 Đổi câu ➔ vV1', type: 'study' },
          { text: '🔓 Giải mã ô chat', type: 'study' },
          { text: '📖 Mổ từ tại trỏ', type: 'study' },
          { text: modeBadge, type: 'badge' }
        ];

        studyChips.forEach(item => {
          const chip = document.createElement('div');
          chip.className = 'sug-chip study-chip';
          chip.innerHTML = `<span class="word-text">${item.text}</span>`;
          chip.onclick = () => handleStudyChipClick(item.text);
          container.appendChild(chip);
        });
        updateToolbarVisibility();
        return;
      }

      // 2. Nếu đang ở Tầng Ký hiệu / Máy tính (Symbols Layer)
      if (currentMode === 'symbols') {
        const calcStarters = ['🧮🎤 Nói bài toán', 'toán', 'mong', 'thết', '15000', '25000*3'];
        calcStarters.forEach((item, idx) => {
          const chip = document.createElement('div');
          chip.className = `sug-chip ${idx === 0 ? 'calc-chip' : ''}`;
          chip.innerHTML = `<span class="word-text">${item}</span>`;
          chip.onclick = () => {
            if (idx === 0) {
              handleNativeVoiceTap();
            } else {
              commitWord(item);
            }
          };
          container.appendChild(chip);
        });
        updateToolbarVisibility();
        return;
      }

      // 3. Nếu đang gõ ký tự (composingBuffer)
      if (composingBuffer) {
        const low = composingBuffer.toLowerCase();
        const found = Object.keys(VIETNAMESE_LEXICON_MAP).filter(w => w.startsWith(low)).slice(0, 10);
        const suggestions = found.length ? found : [composingBuffer];

        suggestions.forEach((word, index) => {
          const chip = document.createElement('div');
          chip.className = `sug-chip ${index === 0 ? 'primary' : ''}`;
          
          let codeTag = '';
          try {
            const enc = encodeWord(word);
            if (enc && enc.base60) codeTag = `<span class="code-badge">[${enc.base60}]</span>`;
          } catch(e) {}

          chip.innerHTML = `<span class="word-text">${word}</span>${codeTag}`;
          chip.onclick = () => commitWord(word);
          container.appendChild(chip);
        });
        updateToolbarVisibility();
        return;
      }

      // 4. Nếu buffer rỗng: Phân tích Smart Calculator & Sổ Thu Chi quanh con trỏ
      const beforeCursor = committedText.slice(0, caretIndex);
      const calcSuggestions = SmartCalculator.analyzeBeforeCursor(beforeCursor);

      if (calcSuggestions.length > 0) {
        // Nút Lưu chi tiêu thông minh 📥
        if (SmartExpenseModule.isEnabled() && calcSuggestions[0].amount) {
          const amt = calcSuggestions[0].amount;
          const compact = SmartExpenseModule.formatCompactAmount(amt);
          const expChip = document.createElement('div');
          expChip.className = 'sug-chip expense-chip';
          expChip.innerHTML = `<span class="word-text">📥 Lưu chi ${compact}</span>`;
          expChip.onclick = () => {
            handleSaveExpense(amt, compact);
          };
          container.appendChild(expChip);
        }

        calcSuggestions.forEach(calcItem => {
          const chip = document.createElement('div');
          chip.className = `sug-chip ${calcItem.isCalc ? 'calc-chip' : 'money-chip'}`;
          chip.innerHTML = `<span class="word-text">${calcItem.label}</span>`;
          chip.onclick = () => {
            applyCalcReplacement(calcItem);
          };
          container.appendChild(chip);
        });
      }

      // 5. Thêm các từ khởi đầu câu tự nhiên
      const starters = ['tôi', 'bạn', 'hôm nay', 'chúng ta', 'công việc', 'thực sự', 'toán', 'mong'];
      starters.forEach((word, index) => {
        const chip = document.createElement('div');
        chip.className = `sug-chip ${index === 0 && calcSuggestions.length === 0 ? 'primary' : ''}`;
        let codeTag = '';
        try {
          const enc = encodeWord(word);
          if (enc && enc.base60) codeTag = `<span class="code-badge">[${enc.base60}]</span>`;
        } catch(e) {}

        chip.innerHTML = `<span class="word-text">${word}</span>${codeTag}`;
        chip.onclick = () => commitWord(word);
        container.appendChild(chip);
      });

      updateToolbarVisibility();
    }

    function handleSaveExpense(amount, compact) {
      SmartExpenseModule.addExpense(amount, 'Ghi nhanh');
      const { today, month } = SmartExpenseModule.getTotals();
      const todayStr = SmartCalculator.formatNumber(today);
      const monthStr = SmartCalculator.formatNumber(month);

      // Hiển thị chip hoàn tác và thống kê
      const container = document.getElementById('sugChipsScroll');
      if (container) {
        container.innerHTML = '';
        const undoChip = document.createElement('div');
        undoChip.className = 'sug-chip';
        undoChip.innerHTML = `<span class="word-text" style="color: #ff7b72;">🗑️ Hủy lưu ${compact}</span>`;
        undoChip.onclick = () => {
          SmartExpenseModule.removeLastExpense();
          updateExpenseUI();
          showTemporaryNotice(`🗑️ Đã hủy khoản chi ${compact}`, false);
          renderSuggestions();
        };
        container.appendChild(undoChip);

        const statChip = document.createElement('div');
        statChip.className = 'sug-chip money-chip';
        statChip.innerHTML = `<span class="word-text">💰 Nay: ${todayStr} ₫ | Tháng: ${monthStr} ₫</span>`;
        statChip.onclick = () => openSettings();
        container.appendChild(statChip);
      }

      updateExpenseUI();
      showTemporaryNotice(`✅ Đã lưu ${compact} (Ghi nhanh) — Hôm nay: ${todayStr} ₫`, true);
    }

    function applyCalcReplacement(calcItem) {
      const before = committedText.slice(0, caretIndex);
      const after = committedText.slice(caretIndex);
      const cutBefore = before.slice(0, before.length - calcItem.replaceLen);
      committedText = cutBefore + calcItem.text + ' ' + after;
      caretIndex = (cutBefore + calcItem.text + ' ').length;
      showToast(`🧮 Đã áp dụng: ${calcItem.text}`);
      updateEditorDisplay();
      renderSuggestions();
    }

    function handleStudyChipClick(label) {
      if (label.startsWith('🎓')) {
        shiftStudyMode = (shiftStudyMode + 1) % 8;
        if (shiftStudyMode === 0) shiftStudyMode = 1;
        renderKeyboard();
        renderSuggestions();
        showToast(STUDY_MODE_BADGES[shiftStudyMode]);
        return;
      }
      if (label.includes('Nói ➔ Mã')) {
        showTemporaryNotice(`🎤 Đang thực hiện chức năng ${label} ở giao diện web, hãy dùng mobile app để có trải nghiệm đầy đủ!`, true);
        return;
      }
      if (label.includes('Đổi câu')) {
        if (!committedText.trim()) {
          showToast('⚠️ Hãy gõ nội dung câu trước khi đổi mã!');
          return;
        }
        const words = committedText.trim().split(/\s+/);
        const encoded = words.map(w => {
          const enc = encodeWord(w);
          return enc ? enc.base60 : w;
        }).join(' ');
        committedText = encoded + ' ';
        caretIndex = committedText.length;
        updateEditorDisplay();
        showToast('🔀 Đã chuyển toàn bộ câu sang mã tốc ký!');
        return;
      }
      if (label.includes('Giải mã')) {
        if (!committedText.trim()) {
          showToast('⚠️ Hãy gõ mã tốc ký trước khi giải mã!');
          return;
        }
        const codes = committedText.trim().split(/\s+/);
        const decoded = codes.map(c => {
          const dec = decodeWord(c);
          return dec || c;
        }).join(' ');
        committedText = decoded + ' ';
        caretIndex = committedText.length;
        updateEditorDisplay();
        showToast('🔓 Đã giải mã câu văn!');
        return;
      }
      if (label.includes('Mổ từ')) {
        const words = committedText.trim().split(/\s+/);
        const lastW = words[words.length - 1] || 'học';
        const p = extractPhonetics(lastW);
        if (p) {
          showTemporaryNotice(`📖 Mổ từ "${lastW}": Phụ âm [${p.consonant || 'rỗng'}] + Vần [${p.rhyme}] + Dấu [${p.tone}]`, true);
        } else {
          showToast(`📖 Từ "${lastW}" là từ đơn lẻ`);
        }
        return;
      }
      showTemporaryNotice(`ℹ️ ${label}`, false);
    }

    function commitWord(word) {
      const before = committedText.slice(0, caretIndex);
      const after = committedText.slice(caretIndex);

      let insertWord = word;
      if (before && !before.endsWith(' ') && !before.endsWith('\n')) {
        insertWord = ' ' + insertWord;
      }
      insertWord += ' ';

      committedText = before + insertWord + after;
      caretIndex = (before + insertWord).length;
      composingBuffer = '';
      lastCommittedWord = word;
      isNumberRowLaunchpadActive = true;

      clearNeighborBloom();
      updateEditorDisplay();
      renderKeyboard();
      renderSuggestions();

      // Kích hoạt Đèn Quỹ đạo Dạy học A1 (Pedagogical Illumination)
      showTeachingHighlightForWord(word);
    }

    // ====================================================================
    // 7. ĐÈN QUỸ ĐẠO DẠY HỌC A1 (PEDAGOGICAL ILLUMINATION CHUẨN ANDROID)
    // ====================================================================
    function showTeachingHighlightForWord(word) {
      const clean = word.trim().toLowerCase();
      if (!clean) return;

      document.querySelectorAll('.teach-cons, .teach-rhyme, .teach-tone').forEach(el => {
        el.classList.remove('teach-cons', 'teach-rhyme', 'teach-tone');
      });

      const enc = encodeWord(clean);
      if (!enc || !enc.c1 || !enc.c2 || !enc.c3) {
        clearGlideTrail();
        return;
      }

      const k1 = findKeyByChar(enc.c1.toLowerCase());
      const k2 = findKeyByChar(enc.c2.toLowerCase());
      const k3 = findKeyByChar(enc.c3.toLowerCase());

      if (k1) {
        const el = document.getElementById(k1.id);
        if (el) el.classList.add('teach-cons');
      }
      if (k2) {
        const el = document.getElementById(k2.id);
        if (el) el.classList.add('teach-rhyme');
      }
      if (k3) {
        const el = document.getElementById(k3.id);
        if (el) el.classList.add('teach-tone');
      }

      if (k1 && k2 && k3 && swipeCanvas && swipeCtx) {
        const wrapR = document.getElementById('keyboardWrapper').getBoundingClientRect();
        const el1 = document.getElementById(k1.id);
        const el2 = document.getElementById(k2.id);
        const el3 = document.getElementById(k3.id);
        if (el1 && el2 && el3) {
          const r1 = el1.getBoundingClientRect();
          const r2 = el2.getBoundingClientRect();
          const r3 = el3.getBoundingClientRect();

          const pts = [
            { x: r1.left + r1.width / 2, y: r1.top + r1.height / 2 },
            { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 },
            { x: r3.left + r3.width / 2, y: r3.top + r3.height / 2 }
          ];

          drawGlideTrail(pts);
        }
      }
    }

    function findKeyByChar(ch) {
      for (const row of NORMAL_ROWS) {
        for (const k of row) {
          if (k.char.toLowerCase() === ch) return k;
        }
      }
      return null;
    }

    function updateEditorDisplay() {
      const box = document.getElementById('outputBox');
      if (!box) return;

      if (!committedText && !composingBuffer) {
        box.innerHTML = '';
      } else {
        const before = committedText.slice(0, caretIndex);
        const after = committedText.slice(caretIndex);

        let content = '';
        if (selectionStart !== -1 && selectionEnd !== -1 && selectionStart !== selectionEnd) {
          const s1 = Math.min(selectionStart, selectionEnd);
          const s2 = Math.max(selectionStart, selectionEnd);
          const selBefore = committedText.slice(0, s1);
          const selMid = committedText.slice(s1, s2);
          const selAfter = committedText.slice(s2);
          content = escapeHtml(selBefore) + `<span class="selected-text">${escapeHtml(selMid)}</span>` + escapeHtml(selAfter);
        } else {
          const compHtml = composingBuffer ? `<span class="composing-word">${escapeHtml(composingBuffer)}</span>` : '';
          content = escapeHtml(before) + compHtml + `<span class="cursor-caret"></span>` + escapeHtml(after);
        }
        box.innerHTML = content;
      }
      box.scrollTop = box.scrollHeight;

      const totalText = committedText + composingBuffer;
      const chars = totalText.length;
      const words = totalText.trim() ? totalText.trim().split(/\s+/).length : 0;
      document.getElementById('charCountLabel').textContent = `Ký tự: ${chars} | Từ: ${words}`;
      updateToolbarVisibility();
      updateLaunchpadCapsule();
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }

    window.clearEditor = function() {
      committedText = '';
      composingBuffer = '';
      caretIndex = 0;
      selectionStart = -1;
      selectionEnd = -1;
      lastCommittedBySwipe = false;
      lastCommittedSwipeWord = null;
      lastCommittedWord = null;
      isNumberRowLaunchpadActive = false;
      clearNeighborBloom();
      clearGlideTrail();
      document.querySelectorAll('.teach-cons, .teach-rhyme, .teach-tone').forEach(el => {
        el.classList.remove('teach-cons', 'teach-rhyme', 'teach-tone');
      });
      updateEditorDisplay();
      renderKeyboard();
      renderSuggestions();
      showToast('🧹 Đã xóa toàn bộ nội dung');
    };

    // ====================================================================
    // 8. BỆ PHÓNG HÀNG 4 (ACTIVE LAUNCH ZONE CAPSULE GLOW)
    // ====================================================================
    function updateLaunchpadCapsule() {
      const curLen = composingBuffer.length || (lastCommittedWord ? lastCommittedWord.length : 0);
      document.querySelectorAll('.launch-capsule-1, .launch-capsule-2, .launch-capsule-3').forEach(el => {
        el.classList.remove('launch-capsule-1', 'launch-capsule-2', 'launch-capsule-3');
      });

      if (currentMode !== 'normal') return;

      if (curLen === 2) {
        ['k_4_1', 'k_4_2', 'k_4_3'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.add('launch-capsule-1');
        });
      } else if (curLen === 3) {
        ['k_4_4', 'k_4_5', 'k_4_6'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.add('launch-capsule-2');
        });
      } else if (curLen >= 4) {
        ['k_4_7', 'k_4_8', 'k_4_9', 'k_4_10'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.add('launch-capsule-3');
        });
      }
    }

    // ====================================================================
    // 9. TRĂM HOA ĐUA NỞ (NEIGHBOR BLOOM 8 HƯỚNG)
    // ====================================================================
    function showNeighborBloomFor(keyDef) {
      clearNeighborBloom();
      activeBloomRoot = keyDef;
      isBloomLockedOpen = true;

      const rootEl = document.getElementById(keyDef.id);
      if (rootEl) rootEl.classList.add('active-bloom-root');

      const charKey = keyDef.char.toLowerCase();
      const config = KEY_NEIGHBORS[charKey];
      if (!config) return;

      const coords = getNeighborCoordinates(keyDef.r, keyDef.c);

      for (const [dir, coord] of Object.entries(coords)) {
        const neighborId = `k_${coord.r}_${coord.c}`;
        const neighborEl = document.getElementById(neighborId);
        const item = config[dir];
        if (!neighborEl || !item) continue;

        neighborEl.classList.add('neighbor-bloom');

        // Tạo cánh hoa nổi
        const badge = document.createElement('span');
        badge.className = 'bloom-petal-badge';

        if (item.type === 'cons') {
          badge.classList.add('cons');
          badge.textContent = item.text;
        } else if (item.type === 'tone') {
          badge.classList.add('tone');
          badge.textContent = item.text;
        } else {
          badge.classList.add(`rhyme-b${item.table || 1}`);
          badge.textContent = item.text;
          if (item.isUpper) badge.classList.add('upper');
        }

        badge.style.pointerEvents = 'auto';
        badge.onclick = (e) => {
          e.stopPropagation();
          handlePetalSelect(item, keyDef);
        };

        neighborEl.appendChild(badge);
      }

      showToast(`🌸 Bung hoa 8 hướng quanh '${keyDef.char}' (Ghim mở để học!)`);
    }

    function clearNeighborBloom() {
      document.querySelectorAll('.active-bloom-root').forEach(el => el.classList.remove('active-bloom-root'));
      document.querySelectorAll('.neighbor-bloom').forEach(el => el.classList.remove('neighbor-bloom'));
      document.querySelectorAll('.bloom-petal-badge').forEach(el => el.remove());
      activeBloomRoot = null;
      isBloomLockedOpen = false;
    }

    function handlePetalSelect(item) {
      if (item.type === 'cons') {
        composingBuffer += item.text;
        showToast(`🌸 Đã chèn phụ âm ghép: ${item.text}`);
      } else if (item.type === 'tone') {
        if (composingBuffer) {
          try {
            const toned = applyTone(composingBuffer, item.text);
            if (toned) composingBuffer = toned;
          } catch(e) {}
        }
        showToast(`🌸 Đã áp dụng dấu thanh: ${item.text}`);
      } else {
        composingBuffer += item.text;
        showToast(`🌸 Đã chèn vần: ${item.text}`);
      }

      clearNeighborBloom();
      updateEditorDisplay();
      renderSuggestions();
    }

    
    
    // ====================================================================
    // BỘ MÃ HÓA & GIẢI MÃ TỐC KÝ A1 + LEXICON DUAL SWIPE ENGINE
    // ====================================================================
    const CONS_MAP_A1 = {
      '': 'z', 'th': '6', 'ch': '7', 'tr': '8', 'nh': '9', 'ng': '0',
      'ph': 'f', 'gi': 'j', 'đ': 'w', 'd': 'd', 'kh': 'a', 'qu': 'o',
      'gh': 'u', 'ngh': 'y', 'b': 'b', 'c': 'c', 'g': 'g', 'h': 'h',
      'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p', 'r': 'r',
      's': 's', 't': 't', 'v': 'v', 'x': 'x'
    };
    const REV_CONS_A1 = {
      '1': 'th', '2': 'ch', '3': 'tr', '4': 'nh', '5': 'ng',
      '6': 'th', '7': 'ch', '8': 'tr', '9': 'nh', '0': 'ng'
    };
    for (const [k, v] of Object.entries(CONS_MAP_A1)) {
      REV_CONS_A1[v] = k;
    }

    const TONES_B1 = ['z', 's', 'f', 'r', 'x', 'j']; // Telex
    const TONES_B2 = ['b', 'k', 'v', 'l', 'q', 'd']; // BKVL
    const TONES_B3 = ['0', '1', '2', '3', '4', '5']; // VNI
    const TONES_B4 = ['a', 'e', 'i', 'o', 'u', 'y']; // Nguyên âm
    const TONES_B5 = ['c', 'g', 'h', 'p', 't', 'w']; // Phụ âm
    const TONES_B6 = ['6', '7', '8', '9', 'm', 'n']; // Cụm vòm

    const ADJACENT_NEIGHBORS = {
      '1': ['2', 'q', 'w'], '2': ['1', '3', 'q', 'w', 'e'], '3': ['2', '4', 'w', 'e', 'r'],
      '4': ['3', '5', 'e', 'r', 't'], '5': ['4', '6', 'r', 't', 'y'], '6': ['5', '7', 't', 'y'],
      '7': ['6', '8', 'y', 'u'], '8': ['7', '9', 'u', 'i'], '9': ['8', '0', 'i', 'o', 'p'],
      '0': ['9', 'o', 'p'],
      'q': ['w', 'a', '1', '2'], 'w': ['q', 'e', 's', 'a', '2', '3'],
      'e': ['w', 'r', 'd', 's', '3', '4'], 'r': ['e', 't', 'f', 'd', '4', '5'],
      't': ['r', 'y', 'g', 'f', '5', '6'], 'y': ['t', 'u', 'h', 'g', '6', '7'],
      'u': ['y', 'i', 'j', 'h', '7', '8'], 'i': ['u', 'o', 'k', 'j', '8', '9'],
      'o': ['i', 'p', 'l', 'k', '9', '0'], 'p': ['o', 'l', '0'],
      'a': ['q', 'w', 's', 'z'], 's': ['w', 'e', 'a', 'd', 'z', 'x'],
      'd': ['e', 'r', 's', 'f', 'x', 'c'], 'f': ['r', 't', 'd', 'g', 'c', 'v'],
      'g': ['t', 'y', 'f', 'h', 'v', 'b'], 'h': ['y', 'u', 'g', 'j', 'b', 'n'],
      'j': ['u', 'i', 'h', 'k', 'n', 'm'], 'k': ['i', 'o', 'j', 'l', 'm'],
      'l': ['o', 'p', 'k'],
      'z': ['a', 's', 'x'], 'x': ['z', 's', 'd', 'c'],
      'c': ['x', 'd', 'f', 'v'], 'v': ['c', 'f', 'g', 'b'],
      'b': ['v', 'g', 'h', 'n'], 'n': ['b', 'h', 'j', 'm'],
      'm': ['n', 'j', 'k']
    };

    function getKeyAtPoint(x, y) {
      if (x === undefined || y === undefined) return null;
      const el = document.elementFromPoint(x, y)?.closest('.grid-key');
      if (el && el.id) {
        const charEl = el.querySelector('.key-char');
        return { id: el.id, char: charEl ? charEl.textContent : '', el };
      }

      let nearestKey = null;
      let minDist = 50;
      const allKeys = document.querySelectorAll('.grid-key');
      for (const keyEl of allKeys) {
        const rect = keyEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(x - centerX, y - centerY);
        if (dist < minDist) {
          minDist = dist;
          const charEl = keyEl.querySelector('.key-char');
          nearestKey = { id: keyEl.id, char: charEl ? charEl.textContent : '', el: keyEl };
        }
      }
      return nearestKey;
    }

    function isValidVietnameseWord(word) {
      if (!word || typeof word !== 'string') return false;
      if (word.startsWith('[') || word.includes('ERR') || word.includes('UNKNOWN')) return false;
      return true;
    }

    function decodeA1(code) {
      if (!code || code.length < 2 || code.length > 3) return null;
      const isTwoChar = (code.length === 2);
      const c1Raw = isTwoChar ? 'z' : code[0];
      const c2Raw = isTwoChar ? code[0] : code[1];
      const c3Raw = isTwoChar ? code[1] : code[2];

      let cons = '';
      let isCap = false;
      const digMap = { '1': 'th', '2': 'ch', '3': 'tr', '4': 'nh', '5': 'ng', '6': 'th', '7': 'ch', '8': 'tr', '9': 'nh', '0': 'ng' };
      if (digMap[c1Raw]) {
        cons = digMap[c1Raw];
        isCap = /^[1-5]$/.test(c1Raw);
      } else {
        const low = c1Raw.toLowerCase();
        cons = REV_CONS_A1[low];
        if (cons === undefined) return null;
        isCap = isTwoChar ? /^[A-Z]$/.test(c2Raw) : /^[A-Z]$/.test(c1Raw);
      }

      const c3Clean = c3Raw.toLowerCase();
      let tone = -1;
      let table = 1;
      let isUpper = false;
      if (TONES_B1.includes(c3Clean)) { tone = TONES_B1.indexOf(c3Clean); table = 1; isUpper = false; }
      else if (TONES_B2.includes(c3Clean)) { tone = TONES_B2.indexOf(c3Clean); table = 2; isUpper = false; }
      else if (TONES_B3.includes(c3Clean)) { tone = TONES_B3.indexOf(c3Clean); table = 3; isUpper = false; }
      else if (TONES_B4.includes(c3Clean)) { tone = TONES_B4.indexOf(c3Clean); table = 1; isUpper = true; }
      else if (TONES_B5.includes(c3Clean)) { tone = TONES_B5.indexOf(c3Clean); table = 2; isUpper = true; }
      else if (TONES_B6.includes(c3Clean)) { tone = TONES_B6.indexOf(c3Clean); table = 3; isUpper = true; }
      if (tone === -1) return null;

      const c2Clean = c2Raw.toLowerCase();
      const b60Char = isUpper ? c2Clean.toUpperCase() : c2Clean;
      const rIdx = BASE60_MAPPING.indexOf(b60Char);
      if (rIdx === -1) return null;

      let rime = '';
      if (table === 1) rime = RHYMES_BASE[rIdx];
      else if (table === 2) rime = RHYMES_EXTRA_1[rIdx];
      else rime = RHYMES_EXTRA_2[rIdx];
      if (!rime || rime === '-') return null;

      let prefix = cons;
      if (cons === 'gi' && rime) {
        if (rime.startsWith('iê')) rime = rime.substring(1);
        else if (rime.startsWith('i')) prefix = 'g';
      }
      if (prefix && prefix !== 'qu' && rime && rime.startsWith('yê')) {
        rime = 'iê' + rime.substring(2);
      }

      const tonedRime = applyTone(rime, tone);
      const rawWord = prefix + tonedRime;
      if (isCap) return rawWord.charAt(0).toUpperCase() + rawWord.slice(1);
      return rawWord;
    }

    function decodeVV1(code) {
      if (!code || code.length !== 3) return null;
      try {
        if (typeof base60ToTime === 'function' && typeof decodeWord === 'function') {
          const time = base60ToTime(code);
          if (time && time.length === 6 && !time.includes('?')) {
            const ss = parseInt(time.substring(4, 6), 10);
            if (ss >= 36) return null;
            const w = decodeWord(time);
            if (w && isValidVietnameseWord(w)) return w;
          }
        }
      } catch(e) {}
      return null;
    }

    function decode3Key(k1, k2, k3) {
      if (!k1 || !k2 || !k3) return null;
      const c1 = k1.toLowerCase();
      const c2 = k2.toLowerCase();
      const c3 = k3.toLowerCase();

      // 1. Thử a1 trước
      const wA1 = decodeA1(c1 + c2 + c3);
      if (wA1 && isValidVietnameseWord(wA1)) return { word: wA1, system: 'a1', code: `${c1}${c2}${c3}` };

      // 2. Thử vV1 nguyên bản
      const rawCode = k1 + k2 + k3;
      const wV1 = decodeVV1(rawCode);
      if (wV1 && isValidVietnameseWord(wV1)) return { word: wV1, system: 'vV1', code: rawCode };

      // 3. Thử vV1 viết hoa vần k2
      const altCode = k1 + k2.toUpperCase() + k3;
      const wV1Alt = decodeVV1(altCode);
      if (wV1Alt && isValidVietnameseWord(wV1Alt)) return { word: wV1Alt, system: 'vV1', code: altCode };

      return null;
    }

    function decodeStraight2Key(kStart, kEnd) {
      if (!kStart || !kEnd) return null;
      const s = kStart.toLowerCase();
      const e = kEnd.toLowerCase();

      let wA1 = decodeA1(s + e + 'z');
      if (wA1) return { word: wA1, system: 'a1', code: `${s}${e}z` };

      wA1 = decodeA1(s + e + 'a');
      if (wA1) return { word: wA1, system: 'a1', code: `${s}${e}a` };

      let wV1 = decodeVV1(kStart + kEnd + 'b');
      if (wV1) return { word: wV1, system: 'vV1', code: `${kStart}${kEnd}b` };

      wV1 = decodeVV1(kStart + kEnd + '0');
      if (wV1) return { word: wV1, system: 'vV1', code: `${kStart}${kEnd}0` };

      const cons = REV_CONS_A1[s] !== undefined ? REV_CONS_A1[s] : s;
      if (cons && /^[aeiouyw]$/i.test(e)) {
        return { word: cons + e, system: 'a1', code: `${s}${e}` };
      }
      return null;
    }

    function findTurningCorners(pts, windowPx = 22) {
      if (!pts || pts.length < 8) return [];
      const dists = [0];
      for (let i = 1; i < pts.length; i++) {
        dists.push(dists[i-1] + Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y));
      }
      const totalLen = dists[dists.length - 1];
      if (totalLen < 30) return [];

      const scores = [];
      for (let i = 0; i < pts.length; i++) {
        const curD = dists[i];
        if (curD < windowPx * 0.7 || totalLen - curD < windowPx * 0.7) continue;

        let iPrev = i;
        while (iPrev > 0 && curD - dists[iPrev] < windowPx) iPrev--;
        let iNext = i;
        while (iNext < pts.length - 1 && dists[iNext] - curD < windowPx) iNext++;

        const dx1 = pts[i].x - pts[iPrev].x, dy1 = pts[i].y - pts[iPrev].y;
        const dx2 = pts[iNext].x - pts[i].x, dy2 = pts[iNext].y - pts[i].y;
        const l1 = Math.hypot(dx1, dy1), l2 = Math.hypot(dx2, dy2);
        if (l1 < 4 || l2 < 4) continue;

        const dot = (dx1 * dx2 + dy1 * dy2) / (l1 * l2);
        const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
        const angleDeg = angleRad * 180 / Math.PI;

        scores.push({ index: i, point: pts[i], angleDeg, distFromStart: curD });
      }

      const peaks = [];
      for (let j = 1; j < scores.length - 1; j++) {
        if (scores[j].angleDeg >= 38 && scores[j].angleDeg >= scores[j-1].angleDeg && scores[j].angleDeg >= scores[j+1].angleDeg) {
          peaks.push(scores[j]);
        }
      }
      if (peaks.length === 0) {
        let maxS = null;
        for (const s of scores) {
          if (s.angleDeg >= 38 && (!maxS || s.angleDeg > maxS.angleDeg)) maxS = s;
        }
        if (maxS) peaks.push(maxS);
      }
      return peaks.sort((a, b) => b.angleDeg - a.angleDeg);
    }

    function extractKeysFromPath(pathPoints) {
      if (!pathPoints || pathPoints.length === 0) return [];
      const keys = [];
      let lastKeyId = null;

      for (let i = 0; i < pathPoints.length; i++) {
        const p = pathPoints[i];
        if (i === 0) {
          const k = getKeyAtPoint(p.x, p.y);
          if (k && k.id !== lastKeyId) { keys.push(k); lastKeyId = k.id; }
          continue;
        }
        const pPrev = pathPoints[i - 1];
        const segDist = Math.hypot(p.x - pPrev.x, p.y - pPrev.y);
        const steps = Math.max(1, Math.floor(segDist / 12));
        for (let s = 1; s <= steps; s++) {
          const sx = pPrev.x + (p.x - pPrev.x) * (s / steps);
          const sy = pPrev.y + (p.y - pPrev.y) * (s / steps);
          const k = getKeyAtPoint(sx, sy);
          if (k && k.id !== lastKeyId) { keys.push(k); lastKeyId = k.id; }
        }
      }
      return keys;
    }

    function resolveSwipeGesture(pathPoints, startKeyDef, currentBuffer = '', glideKeys = []) {
      if (!pathPoints || pathPoints.length < 2 || !startKeyDef) return null;
      const pStart = pathPoints[0];
      const pEnd = pathPoints[pathPoints.length - 1];
      const endDef = getKeyAtPoint(pEnd.x, pEnd.y) || startKeyDef;
      if (!endDef || !endDef.char) return null;

      const kStart = startKeyDef.char.toLowerCase();
      const kEnd = endDef.char.toLowerCase();

      const chordDist = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);
      let pathLen = 0;
      for (let i = 1; i < pathPoints.length; i++) {
        pathLen += Math.hypot(pathPoints[i].x - pathPoints[i-1].x, pathPoints[i].y - pathPoints[i-1].y);
      }

      // 1. BỘ LỌC CHỐNG RUN TAY (Anti-Jitter Filter)
      // Nếu độ dịch chuyển < 36px và tổng quãng đường < 50px -> Đây là cú chạm phím (TAP), không nhận diện vuốt!
      if (chordDist < 36 && pathLen < 50) return null;

      // 2. Trích xuất toàn bộ chuỗi ký tự lướt qua
      const denseKeys = extractKeysFromPath(pathPoints);
      const crossedChars = [];
      for (const kd of [...denseKeys, ...glideKeys]) {
        const c = (kd.char || '').toLowerCase();
        if (c && c.length === 1 && /^[a-z0-9]$/i.test(c)) {
          if (crossedChars.length === 0 || crossedChars[crossedChars.length - 1] !== c) {
            crossedChars.push(c);
          }
        }
      }
      if (crossedChars.length < 2) return null;

      // 3. ĐIỀU HƯỚNG ƯU TIÊN THÔNG MINH (Dual-Priority Routing)
      // - Nếu điểm kết thúc là phím dấu Telex (s, f, r, x, j, z, w) -> Ưu tiên Tốc ký A1 3-phím!
      // - Nếu lướt qua 4+ phím -> Ưu tiên Gõ lướt từ vựng Lexicon Swipe kiểu Gboard!
      const isTelexToneEnd = ['s', 'f', 'r', 'x', 'j', 'z', 'w'].includes(kEnd);
      const corners = findTurningCorners(pathPoints, 22);

      // Giải mã cử chỉ bẻ góc 3 phím A1
      function tryResolveA1() {
        if (corners.length > 0) {
          for (const corner of corners) {
            const midDef = getKeyAtPoint(corner.point.x, corner.point.y);
            if (midDef && midDef.char && midDef.char.toLowerCase() !== kStart && midDef.char.toLowerCase() !== kEnd) {
              const kMid = midDef.char.toLowerCase();
              const res3 = decode3Key(kStart, kMid, kEnd);
              if (res3 && res3.word) {
                return {
                  ...res3,
                  gestureType: '3key',
                  keys: [kStart, kMid, kEnd],
                  desc: `3 phím A1: [${kStart}] ➔ [${kMid}] ➔ [${kEnd}]`
                };
              }
            }
          }
        }
        return null;
      }

      // Giải mã gõ lướt Lexicon từ điển tiếng Việt theo tần suất (Frequency Ranking)
      function tryResolveLexicon() {
        const startC = crossedChars[0];
        const endC = crossedChars[crossedChars.length - 1];
        const allLexKeys = Object.keys(VIETNAMESE_LEXICON_MAP);

        let bestCandidate = null;
        let bestScore = -Infinity;

        for (let rank = 0; rank < allLexKeys.length; rank++) {
          const w = allLexKeys[rank];
          if (!w.startsWith(startC) || !w.endsWith(endC)) continue;
          if (w.length < 2 || w.length > crossedChars.length + 2) continue;

          let matchIdx = 0;
          let matchedLetters = 0;
          let exactMatches = 0;

          for (let i = 0; i < w.length; i++) {
            const ch = w[i];
            const foundIdx = crossedChars.indexOf(ch, matchIdx);
            if (foundIdx !== -1) {
              matchIdx = foundIdx + 1;
              matchedLetters += 1;
              exactMatches += 1;
            } else {
              const nbrs = ADJACENT_NEIGHBORS[ch] || [];
              const nbrFound = crossedChars.findIndex((cc, ci) => ci >= matchIdx && nbrs.includes(cc));
              if (nbrFound !== -1) {
                matchIdx = nbrFound + 1;
                matchedLetters += 0.5; // Điểm thấp hơn cho phím lân cận
              } else {
                matchIdx = -1;
                break;
              }
            }
          }
          if (matchIdx === -1) continue;

          // Điểm xếp hạng tần suất từ tiếng Việt thông dụng
          const freqScore = (10000 - rank) * 2;
          // Thưởng lớn cho chuỗi ký tự khớp chính xác 100% trên vệt vuốt
          const exactBonus = (exactMatches === w.length) ? 800 : (exactMatches * 80);
          // Trừ điểm nếu từ dài hơn nhiều so với số ký tự quét qua
          const lenPenalty = (w.length > crossedChars.length) ? (w.length - crossedChars.length) * 300 : 0;
          const totalScore = freqScore + exactBonus + (matchedLetters * 100) - lenPenalty;

          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestCandidate = w;
          }
        }

        if (bestCandidate) {
          const wordList = VIETNAMESE_LEXICON_MAP[bestCandidate];
          const targetWord = (wordList && wordList.length > 0) ? wordList[0] : bestCandidate;
          const pathStr = crossedChars.length > 5 
            ? `${crossedChars[0]}➔...➔${crossedChars[crossedChars.length - 1]}`
            : crossedChars.join('➔');

          return {
            word: targetWord,
            system: 'lexicon',
            code: bestCandidate,
            keys: crossedChars,
            desc: `Gõ lướt: [${pathStr}]`
          };
        }
        return null;
      }

      // Nhánh 1: Nếu kết thúc bằng phím dấu Telex, ưu tiên A1 tốc ký
      if (isTelexToneEnd && crossedChars.length <= 4) {
        const a1Res = tryResolveA1();
        if (a1Res) return a1Res;
      }

      // Nhánh 2: Nếu quét qua 4 phím trở lên, ưu tiên Lexicon Swipe
      if (crossedChars.length >= 4) {
        const lexRes = tryResolveLexicon();
        if (lexRes) return lexRes;
      }

      // Nhánh 3: Trường hợp 2-3 phím
      if (!isTelexToneEnd) {
        const lexRes = tryResolveLexicon();
        if (lexRes) return lexRes;
        const a1Res = tryResolveA1();
        if (a1Res) return a1Res;
      } else {
        const a1Res = tryResolveA1();
        if (a1Res) return a1Res;
        const lexRes = tryResolveLexicon();
        if (lexRes) return lexRes;
      }

      // Nhánh 4: 2 phím thẳng (Phụ âm + Vần / Nguyên âm)
      const res2 = decodeStraight2Key(kStart, kEnd);
      if (res2 && res2.word) {
        return {
          ...res2,
          gestureType: '2key_straight',
          keys: [kStart, kEnd],
          desc: `2 phím: [${kStart}] ➔ [${kEnd}]`
        };
      }

      return null;
    }

    // ====================================================================
    // 10. CANVAS GLIDE TRAILS & VẼ VỆT SÁNG NEON LIÊN TỤC (ELECTRIC NEON BEAM)
    // ====================================================================
    function resizeCanvas() {
      const wrap = document.getElementById('keyboardWrapper');
      const canvas = document.getElementById('swipeCanvas');
      if (wrap && canvas) {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
          canvas.width = w;
          canvas.height = h;
        }
      }
    }
    window.addEventListener('resize', resizeCanvas);

    function drawGlideCanvas(currentX, currentY, alpha = 1) {
      const canvas = document.getElementById('swipeCanvas');
      const wrap = document.getElementById('keyboardWrapper');
      if (!canvas || !wrap) return;

      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!glidePoints || glidePoints.length === 0) return;

      const wrapRect = wrap.getBoundingClientRect();
      ctx.save();
      ctx.globalAlpha = alpha;

      // Lớp 1: Quầng sáng Neon xanh Cyan dạ quang tỏa rộng rực rỡ (Outer Neon Glow)
      ctx.beginPath();
      glidePoints.forEach((p, idx) => {
        const px = p.x - wrapRect.left;
        const py = p.y - wrapRect.top;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      if (currentX !== undefined && currentY !== undefined && glidePoints.length > 0) {
        ctx.lineTo(currentX - wrapRect.left, currentY - wrapRect.top);
      }
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Lớp 2: Thân tia sáng Electric Blue chuẩn Android (#58A6FF)
      ctx.beginPath();
      glidePoints.forEach((p, idx) => {
        const px = p.x - wrapRect.left;
        const py = p.y - wrapRect.top;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      if (currentX !== undefined && currentY !== undefined && glidePoints.length > 0) {
        ctx.lineTo(currentX - wrapRect.left, currentY - wrapRect.top);
      }
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 6;
      ctx.stroke();

      // Lớp 3: Lõi tia chớp trắng sáng rực rỡ (Core Lightning Spark)
      ctx.beginPath();
      glidePoints.forEach((p, idx) => {
        const px = p.x - wrapRect.left;
        const py = p.y - wrapRect.top;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      if (currentX !== undefined && currentY !== undefined && glidePoints.length > 0) {
        ctx.lineTo(currentX - wrapRect.left, currentY - wrapRect.top);
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    }

    function clearGlideTrail() {
      const canvas = document.getElementById('swipeCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      glidePoints = [];
      glideKeys = [];
      isSwiping = false;
    }

    function fadeGlideTrail() {
      let step = 0;
      const totalSteps = 8;
      function fadeStep() {
        step++;
        if (step > totalSteps) {
          clearGlideTrail();
          return;
        }
        const alpha = 1.0 - (step / totalSteps);
        drawGlideCanvas(undefined, undefined, alpha);
        requestAnimationFrame(fadeStep);
      }
      requestAnimationFrame(fadeStep);
    }


    // ====================================================================
    // 11. RENDER KEYBOARD CHÍNH (CHUẨN 5 HÀNG VÀ TẦNG STUDY MODE)
    // ====================================================================
    function renderKeyboard() {
      const wrap = document.getElementById('keyboardWrapper');
      if (!wrap) return;
      wrap.innerHTML = '<canvas class="swipe-canvas" id="swipeCanvas"></canvas>';
      swipeCanvas = document.getElementById('swipeCanvas');
      swipeCtx = swipeCanvas ? swipeCanvas.getContext('2d') : null;
      resizeCanvas();

      const secToolbar = document.getElementById('secretToolbar');
      if (secToolbar) {
        secToolbar.style.display = (currentMode === 'secret_rhymes') ? 'flex' : 'none';
      }

      if (currentMode === 'normal') {
        renderNormalLayout(wrap);
      } else if (currentMode === 'symbols') {
        renderSymbolsLayout(wrap);
      } else if (currentMode === '36L') {
        render36LLayout(wrap);
      } else if (currentMode === '36R') {
        render36RLayout(wrap);
      } else if (currentMode === 'secret_rhymes') {
        renderSecretRhymesLayout(wrap);
      }
      updateLaunchpadCapsule();
      updateVoiceBtnUI();
      resizeCanvas();
      setTimeout(resizeCanvas, 50);
    }

    function createKeyElement(k) {
      const el = document.createElement('div');
      el.className = 'grid-key';
      el.id = k.id || `k_${Math.random()}`;

      if (k.type === 'flank') el.classList.add('key-flank');
      if (k.type === 'fn') el.classList.add('key-fn');
      if (k.type === 'action') el.classList.add('key-action');
      if (k.type === 'digit') el.classList.add('key-digit');
      if (k.span && k.span > 1) el.classList.add(`span-${k.span}`);

      if (k.type === 'shift') {
        el.classList.add('key-shift');
        if (isCaps) el.classList.add('caps');
        else if (isShift) el.classList.add('active');
      }

      // Màu sắc nhãn phụ hàng 0: 1..5 Cam dấu thanh, 6..10 Tím phụ âm
      if (k.subType === 'tone') el.classList.add('tone-sub');
      if (k.subType === 'cons') el.classList.add('cons-sub');

      let mainChar = k.char;
      let displaySub = k.sub || '';

      // Biến đổi khi Shift active
      if ((isShift || isCaps) && k.shift) {
        mainChar = k.shift;
      } else if ((isShift || isCaps) && k.char.length === 1 && !k.type) {
        mainChar = k.char.toUpperCase();
      }

      // Xử lý 7 Tầng Study Mode (Tô màu và nhãn dấu chuẩn Android)
      if (currentMode === 'normal' && shiftStudyMode > 0) {
        const ch = k.char.toLowerCase();
        const b4 = ['a', 'e', 'i', 'o', 'u', 'y'];
        const b5 = ['c', 'g', 'h', 'm', 'n', 'w'];
        const b6 = ['6', '7', '8', '9', 't', 'p'];
        const b1 = ['z', 's', 'f', 'r', 'x', 'j'];
        const b2 = ['b', 'k', 'v', 'l', 'q', 'd'];
        const b3 = ['0', '1', '2', '3', '4', '5'];
        const toneNames = ['ngang', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng'];

        if ((shiftStudyMode === 1 || shiftStudyMode === 2) && b4.includes(ch)) {
          el.classList.add('study-key-b4');
          displaySub = toneNames[b4.indexOf(ch)];
        } else if ((shiftStudyMode === 1 || shiftStudyMode === 3) && b5.includes(ch)) {
          el.classList.add('study-key-b5');
          displaySub = toneNames[b5.indexOf(ch)];
        } else if ((shiftStudyMode === 1 || shiftStudyMode === 4) && b6.includes(ch)) {
          el.classList.add('study-key-b6');
          displaySub = toneNames[b6.indexOf(ch)];
        } else if (shiftStudyMode === 5 && b1.includes(ch)) {
          el.classList.add('study-key-b1');
          displaySub = toneNames[b1.indexOf(ch)];
        } else if (shiftStudyMode === 6 && b2.includes(ch)) {
          el.classList.add('study-key-b2');
          displaySub = toneNames[b2.indexOf(ch)];
        } else if (shiftStudyMode === 7 && b3.includes(ch)) {
          el.classList.add('study-key-b3');
          displaySub = toneNames[b3.indexOf(ch)];
        }

        // Hàng 0 ở Study Mode
        if (k.id === 'k_0_0') {
          mainChar = '📖';
          displaySub = 'Mổ từ';
        } else if (k.id === 'k_0_11') {
          mainChar = '⏱️';
          displaySub = 'Mã số';
        }
      }

      // Xử lý Number Row Launchpad
      if (isNumberRowLaunchpadActive && k.r === 0 && k.c >= 1 && k.c <= 10) {
        const vniMarks = {
          '1': '´', '2': '`', '3': '?', '4': '~', '5': '.',
          '6': '^', '7': '*', '8': '˘', '9': '⇄đ', '0': '—'
        };
        const badge = document.createElement('span');
        badge.className = 'vni-launchpad-badge';
        badge.textContent = vniMarks[k.char] || '';
        el.appendChild(badge);
      }

      const charSpan = document.createElement('span');
      charSpan.className = 'key-char';
      charSpan.textContent = mainChar;
      el.appendChild(charSpan);

      if (k.tl && shiftStudyMode === 0) {
        const tlSpan = document.createElement('span');
        tlSpan.className = 'key-tl';
        tlSpan.textContent = k.tl;
        el.appendChild(tlSpan);
      }

      if (displaySub) {
        const subSpan = document.createElement('span');
        subSpan.className = 'key-sub';
        subSpan.textContent = displaySub;
        el.appendChild(subSpan);
      }

      attachKeyPointerEvents(el, k);
      return el;
    }

        function attachKeyPointerEvents(keyEl, k) {
      keyEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { keyEl.setPointerCapture(e.pointerId); } catch(err) {}
        activePointerId = e.pointerId;
        gestureStartX = e.clientX;
        gestureStartY = e.clientY;
        gestureKeyDef = k;
        isModeLongTriggered = false;

        resizeCanvas();
        glidePoints = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
        glideKeys = [k];
        isSwiping = false;

        // Xóa highlight dạy học khi chạm phím mới
        document.querySelectorAll('.teach-cons, .teach-rhyme, .teach-tone').forEach(el => {
          el.classList.remove('teach-cons', 'teach-rhyme', 'teach-tone');
        });
        clearGlideTrail();

        // Long-press Trăm hoa đua nở (> 300ms) trên 36 phím ký tự
        if ((k.char.length === 1 || k.r === 0) && !k.type && shiftStudyMode === 0) {
          bloomHoldTimer = setTimeout(() => {
            isModeLongTriggered = true;
            showNeighborBloomFor(k);
          }, 300);
        }

        // Long Press phím Mode (📱) -> về Chuẩn
        if (k.type === 'mode' || k.char === '📱' || k.char === '📴') {
          modeLongTimer = setTimeout(() => {
            isModeLongTriggered = true;
            switchMode('normal');
            showTemporaryNotice('⏱️ Đã giữ phím 📱 ➔ Trở về Bàn phím Chuẩn 2 tay!');
          }, 350);
        }

        // Long Press phím Shift (⇧) -> Đổi Study Mode
        if (k.type === 'shift') {
          modeLongTimer = setTimeout(() => {
            isModeLongTriggered = true;
            shiftStudyMode = (shiftStudyMode + 1) % 8;
            renderKeyboard();
            renderSuggestions();
            showTemporaryNotice(`📖 Chế độ Học Dấu: ${STUDY_MODE_BADGES[shiftStudyMode]}`);
          }, 350);
        }

        // Long Press phím Backspace (⌫) -> Select All & Cut
        if (k.type === 'bksp') {
          modeLongTimer = setTimeout(() => {
            isModeLongTriggered = true;
            clearEditor();
            showTemporaryNotice('✂️ Đang thực hiện chức năng Chọn tất cả & Cắt ở giao diện web!', false);
          }, 450);
        }

        // Long Press phím '=' ở tầng Symbols -> Tính toán tức thì
        if (k.char === '=' || k.id === 'sym_4_9') {
          modeLongTimer = setTimeout(() => {
            isModeLongTriggered = true;
            const before = committedText.slice(0, caretIndex);
            const calcRes = SmartCalculator.analyzeBeforeCursor(before);
            if (calcRes.length > 0) {
              applyCalcReplacement(calcRes[0]);
            } else {
              showToast('🧮 Không có phép tính hợp lệ trước con trỏ');
            }
          }, 350);
        }

        // Long Press phím '🔍' -> Hỏi Gemini AI
        if (k.char === '🔍' || k.id === 'k_2_11' || k.id === 'sym_2_11') {
          modeLongTimer = setTimeout(() => {
            isModeLongTriggered = true;
            handleNativeAskAi();
          }, 350);
        }
      });

      keyEl.addEventListener('pointermove', (e) => {
        if (activePointerId !== e.pointerId) return;
        e.preventDefault();

        const dx = e.clientX - gestureStartX;
        const dy = e.clientY - gestureStartY;
        const dist = Math.hypot(dx, dy);

        if (dist > 16) {
          if (bloomHoldTimer) { clearTimeout(bloomHoldTimer); bloomHoldTimer = null; }
          if (modeLongTimer) { clearTimeout(modeLongTimer); modeLongTimer = null; }
        }

        // HUD khi vuốt phím Backspace
        if (k.type === 'bksp') {
          if (dx < -30) {
            const count = Math.min(10, Math.floor(Math.abs(dx) / 25));
            showToast(`⌫ Vuốt sang trái: Xóa ${count} từ`);
            return;
          }
          if (dy > 30) {
            showToast(`⌫ Vuốt xuống dưới: Xóa cả dòng`);
            return;
          }
        }

        // Bắt đầu vẽ tia sáng Neon rực rỡ ngay khi ngón tay di chuyển (> 5px)
        if (dist > 5) {
          glidePoints.push({ x: e.clientX, y: e.clientY, time: Date.now() });

          const curK = getKeyAtPoint(e.clientX, e.clientY);
          if (curK && (glideKeys.length === 0 || glideKeys[glideKeys.length - 1].id !== curK.id)) {
            glideKeys.push(curK);
          }
          drawGlideCanvas(e.clientX, e.clientY);
        }

        // Đánh dấu cờ vuốt hợp lệ khi cự ly >= 30px
        if (dist >= 30) {
          isSwiping = true;
        }
      });

      keyEl.addEventListener('pointerup', (e) => {
        if (activePointerId !== e.pointerId) return;
        e.preventDefault();
        try { keyEl.releasePointerCapture(e.pointerId); } catch(err) {}
        activePointerId = null;

        if (bloomHoldTimer) { clearTimeout(bloomHoldTimer); bloomHoldTimer = null; }
        if (modeLongTimer) { clearTimeout(modeLongTimer); modeLongTimer = null; }

        if (isModeLongTriggered) return;

        const dx = e.clientX - gestureStartX;
        const dy = e.clientY - gestureStartY;
        const dist = Math.hypot(dx, dy);

        let pathLen = 0;
        for (let i = 1; i < glidePoints.length; i++) {
          pathLen += Math.hypot(glidePoints[i].x - glidePoints[i-1].x, glidePoints[i].y - glidePoints[i-1].y);
        }

        // 1. BỘ LỌC CHỐNG RUN TAY: Nếu rung lắc tự nhiên (< 36px hoặc pathLen < 50px), nhận diện là TAP thuần túy
        if (!isSwiping || dist < 36 || pathLen < 50 || glidePoints.length < 3) {
          clearGlideTrail();

          // Cử chỉ vuốt Backspace trái (xóa N từ) hoặc xuống (xóa đoạn)
          if (k.type === 'bksp') {
            if (dx < -35) {
              const count = Math.min(10, Math.floor(Math.abs(dx) / 25));
              handleBackspaceSwipeWords(count);
              return;
            }
            if (dy > 35) {
              handleBackspaceSwipeDown();
              return;
            }
          }

          // Chạm phím (Tap) thông thường
          handleKeyTap(k);
          return;
        }

        // 2. Người dùng thực sự vuốt Glide cử chỉ (A1 / Lexicon Swipe / 2-phím)
        glidePoints.push({ x: e.clientX, y: e.clientY, time: Date.now() });
        const resolved = resolveSwipeGesture(glidePoints, gestureKeyDef, composingBuffer, glideKeys);

        if (resolved && resolved.word) {
          commitWord(resolved.word);
          lastCommittedBySwipe = true;
          lastCommittedSwipeWord = resolved.word;
          showToast(`🚀 ${resolved.desc} ➔ '${resolved.word}'`);
          fadeGlideTrail();
          return;
        }

        // Fallback quẹt 2 phím hợp lệ
        if (glideKeys.length >= 2) {
          const fK = glideKeys[0].char;
          const lK = glideKeys[glideKeys.length - 1].char;
          if (fK && lK && fK !== lK) {
            const res2 = decodeStraight2Key(fK, lK);
            if (res2 && res2.word) {
              commitWord(res2.word);
              lastCommittedBySwipe = true;
              lastCommittedSwipeWord = res2.word;
              showToast(`⚡ Quẹt 2 điểm: '${res2.word}'`);
              fadeGlideTrail();
              return;
            }
          }
        }

        clearGlideTrail();
      });

      keyEl.addEventListener('pointercancel', (e) => {
        try { keyEl.releasePointerCapture(e.pointerId); } catch(err) {}
        activePointerId = null;
        if (bloomHoldTimer) clearTimeout(bloomHoldTimer);
        if (modeLongTimer) clearTimeout(modeLongTimer);
        clearGlideTrail();
      });
    }

    function handleKeyTap(k) {
      // 0. Nếu đang ở Chế độ Study Mode trên Hàng 4: Bấm deck item
      if (currentMode === 'normal' && shiftStudyMode > 0) {
        if (k.id === 'k_0_0') {
          handleStudyChipClick('📖 Mổ từ tại trỏ');
          return;
        }
        if (k.id === 'k_0_11') {
          handleStudyChipClick('🎤⏱️ Nói ➔ Mã số');
          return;
        }
        const deckItem = STUDY_ROW4_DECK.find(d => d.id === k.id);
        if (deckItem) {
          if (deckItem.targetMode > 0) {
            shiftStudyMode = deckItem.targetMode;
            renderKeyboard();
            renderSuggestions();
            showToast(STUDY_MODE_BADGES[shiftStudyMode]);
          } else if (k.id === 'k_4_8') {
            handleStudyChipClick('🎤a1 Nói ➔ Mã a1');
          } else if (k.id === 'k_4_9') {
            handleStudyChipClick('🎤vV1 Nói ➔ Mã vV1');
          } else if (k.id === 'k_4_10') {
            handleStudyChipClick('🔀 Đổi câu ➔ a1');
          }
          return;
        }
      }

      // 1. Phím chuyển Mode
      if (k.type === 'mode' || k.char === '📱') {
        if (currentMode === 'normal') switchMode('36L');
        else if (currentMode === '36L') switchMode('36R');
        else switchMode('normal');
        return;
      }

      // 2. Phím Ký hiệu (🔢 Sym) / ABC
      if (k.id === 'k_1_0' || k.char === '🔢') {
        switchMode('symbols');
        return;
      }
      if (k.char === 'ABC') {
        switchMode('normal');
        return;
      }

      // 3. Phím Cài đặt (⚙️)
      if (k.char === '⚙️') {
        openSettings();
        return;
      }

      // 4. Phím Dán (📋)
      if (k.char === '📋') {
        handleNativePaste();
        return;
      }

      // 5. Phím Soi (🔍)
      if (k.char === '🔍') {
        const w = composingBuffer || committedText.trim().split(/\s+/).pop() || '';
        showTemporaryNotice(`🔍 Đang thực hiện chức năng Soi giải nghĩa từ "${w}" ở giao diện web!`, false);
        return;
      }

      // 6. Phím Shift (⇧)
      if (k.type === 'shift') {
        const now = Date.now();
        if (now - lastShiftTapTime < 350) {
          isCaps = !isCaps;
          isShift = isCaps;
          showToast(isCaps ? '🔒 Đã bật CapsLock' : '🔓 Đã tắt CapsLock');
        } else {
          if (isCaps) {
            isCaps = false;
            isShift = false;
          } else {
            isShift = !isShift;
          }
        }
        lastShiftTapTime = now;
        renderKeyboard();
        return;
      }

      // 7. Phím Điều Hướng Con Trỏ Trên Hàng 4 (‹ › ( ))
      if (k.id === 'k_4_3') {
        if (isShift) {
          caretIndex = 0;
          selectionStart = -1; selectionEnd = -1;
          isShift = false; renderKeyboard();
          showToast('|‹ Đã về đầu dòng');
        } else {
          if (caretIndex > 0) caretIndex--;
        }
        updateEditorDisplay();
        return;
      }
      if (k.id === 'k_4_5') {
        if (isShift) {
          caretIndex = committedText.length;
          selectionStart = -1; selectionEnd = -1;
          isShift = false; renderKeyboard();
          showToast('›| Đã về cuối dòng');
        } else {
          if (caretIndex < committedText.length) caretIndex++;
        }
        updateEditorDisplay();
        return;
      }
      if (k.id === 'k_4_1' && isShift) {
        selectionStart = 0;
        selectionEnd = caretIndex;
        isShift = false; renderKeyboard();
        updateEditorDisplay();
        showToast('⇤ Đã chọn về đầu dòng');
        return;
      }
      if (k.id === 'k_4_2' && isShift) {
        selectionStart = caretIndex;
        selectionEnd = committedText.length;
        isShift = false; renderKeyboard();
        updateEditorDisplay();
        showToast('⇥ Đã chọn về cuối dòng');
        return;
      }

      // 8. Phím 000 / ₫
      if (k.char === '000') {
        const text = isShift ? '₫' : '000';
        insertTextAtCaret(text);
        if (isShift) { isShift = false; renderKeyboard(); }
        return;
      }

      // 9. Phím Backspace (⌫) — SMART CONTEXTUAL BACKSPACE
      if (k.type === 'bksp') {
        // Xóa vùng đang chọn
        if (selectionStart !== -1 && selectionEnd !== -1 && selectionStart !== selectionEnd) {
          const s1 = Math.min(selectionStart, selectionEnd);
          const s2 = Math.max(selectionStart, selectionEnd);
          committedText = committedText.slice(0, s1) + committedText.slice(s2);
          caretIndex = s1;
          selectionStart = -1; selectionEnd = -1;
          updateEditorDisplay();
          renderSuggestions();
          showToast('⌫ Đã xóa vùng chọn');
          return;
        }

        // Xóa 1 chạm từ vừa vuốt
        if (lastCommittedBySwipe && lastCommittedSwipeWord) {
          const expected = lastCommittedSwipeWord + ' ';
          const before = committedText.slice(0, caretIndex);
          if (before.endsWith(expected) || before.endsWith(lastCommittedSwipeWord)) {
            const deleteLen = before.endsWith(' ') ? lastCommittedSwipeWord.length + 1 : lastCommittedSwipeWord.length;
            committedText = before.slice(0, before.length - deleteLen) + committedText.slice(caretIndex);
            caretIndex -= deleteLen;
            lastCommittedBySwipe = false;
            lastCommittedSwipeWord = null;
            updateEditorDisplay();
            renderSuggestions();
            showToast('⌫ Xóa 1 chạm từ vừa vuốt');
            return;
          }
        }

        // Xóa bình thường
        if (composingBuffer) {
          composingBuffer = composingBuffer.slice(0, -1);
        } else if (caretIndex > 0) {
          committedText = committedText.slice(0, caretIndex - 1) + committedText.slice(caretIndex);
          caretIndex--;
        }
        updateEditorDisplay();
        renderSuggestions();
        return;
      }

      // 10. Phím Space ( )
      if (k.type === 'space' || k.char === ' ') {
        if (composingBuffer) {
          commitWord(composingBuffer);
        } else {
          insertTextAtCaret(' ');
        }
        return;
      }

      // 11. Phím Xuống dòng (↵ / ⏎)
      if (k.type === 'action' || k.char === '↵' || k.char === '⏎') {
        if (composingBuffer) commitWord(composingBuffer);
        insertTextAtCaret('\n');
        return;
      }

      // 12. Chế độ Number Row Launchpad: Bấm số ở Hàng 0 đổi dấu tức thì!
      if (isNumberRowLaunchpadActive && k.r === 0 && k.c >= 1 && k.c <= 10 && lastCommittedWord) {
        const vniToneMap = {
          '1': 'sắc', '2': 'huyền', '3': 'hỏi', '4': 'ngã', '5': 'nặng',
          '6': 'mũ', '7': 'móc', '8': 'trăng', '9': 'đổi_âm', '0': 'ngang'
        };
        const toneName = vniToneMap[k.char];
        if (toneName) {
          try {
            const toned = applyTone(lastCommittedWord, toneName);
            if (toned && toned !== lastCommittedWord) {
              const before = committedText.slice(0, caretIndex);
              const after = committedText.slice(caretIndex);
              const expected = lastCommittedWord + ' ';
              if (before.endsWith(expected)) {
                committedText = before.slice(0, before.length - expected.length) + toned + ' ' + after;
                caretIndex = (before.slice(0, before.length - expected.length) + toned + ' ').length;
                lastCommittedWord = toned;
                updateEditorDisplay();
                showToast(`🎯 Launchpad Hàng 0: Đổi sang '${toned}'`);
                return;
              }
            }
          } catch(e) {}
        }
      }

      // 13. Chế độ Mã Vần Bí Mật
      if (currentMode === 'secret_rhymes' && k.secretDigit) {
        handleSecretKeyTap(k);
        return;
      }

      // 14. Gõ ký tự thường
      isNumberRowLaunchpadActive = false;
      let charToType = k.char;
      if ((isShift || isCaps) && k.shift) charToType = k.shift;
      else if ((isShift || isCaps) && k.char.length === 1 && !k.type) charToType = k.char.toUpperCase();

      if (isShift && !isCaps) {
        isShift = false;
        renderKeyboard();
      }

      if (isBloomLockedOpen) clearNeighborBloom();

      composingBuffer += charToType;
      updateEditorDisplay();
      renderSuggestions();
    }

    function insertTextAtCaret(text) {
      const before = committedText.slice(0, caretIndex);
      const after = committedText.slice(caretIndex);
      committedText = before + text + after;
      caretIndex += text.length;
      selectionStart = -1; selectionEnd = -1;
      updateEditorDisplay();
      renderSuggestions();
    }

    function handleBackspaceSwipeWords(wordCount) {
      if (composingBuffer) {
        composingBuffer = '';
      } else if (caretIndex > 0) {
        const before = committedText.slice(0, caretIndex).trimEnd();
        const words = before.split(/\s+/);
        const actualDelete = Math.min(words.length, wordCount);
        words.splice(words.length - actualDelete, actualDelete);
        const cutBefore = words.length > 0 ? words.join(' ') + ' ' : '';
        const after = committedText.slice(caretIndex);
        committedText = cutBefore + after;
        caretIndex = cutBefore.length;
        showToast(`⌫ Đã vuốt xóa ${actualDelete} từ`);
      }
      updateEditorDisplay();
      renderSuggestions();
    }

    function handleBackspaceSwipeDown() {
      if (composingBuffer) {
        composingBuffer = '';
      } else if (caretIndex > 0) {
        const before = committedText.slice(0, caretIndex);
        const lastNewline = before.lastIndexOf('\n');
        const cutIdx = lastNewline >= 0 ? lastNewline + 1 : 0;
        const after = committedText.slice(caretIndex);
        committedText = committedText.slice(0, cutIdx) + after;
        caretIndex = cutIdx;
      }
      updateEditorDisplay();
      renderSuggestions();
      showToast('⌫ Đã vuốt xóa cả dòng');
    }

    // ====================================================================
    // 12. RENDER CÁC TẦNG LAYOUT
    // ====================================================================
    function renderNormalLayout(container) {
      NORMAL_ROWS.forEach((rowDef, rIdx) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'grid-row';
        
        // Nếu ở Hàng 4 và đang bật Study Mode: Thay thế bằng STUDY_ROW4_DECK!
        if (rIdx === 4 && shiftStudyMode > 0) {
          const modeKey = { id: 'k_4_0', char: '📱', sub: '1-Tay', type: 'mode' };
          const enterKey = { id: 'k_4_11', char: '↵', sub: 'Enter', type: 'action' };

          rowEl.appendChild(createKeyElement(modeKey));
          STUDY_ROW4_DECK.forEach(deckItem => {
            const isSel = deckItem.targetMode > 0 && deckItem.targetMode === shiftStudyMode;
            const keyEl = createKeyElement({
              id: deckItem.id,
              char: deckItem.char,
              sub: deckItem.sub,
              type: 'fn'
            });
            keyEl.classList.add('study-deck-key');
            if (isSel) keyEl.classList.add('selected');
            rowEl.appendChild(keyEl);
          });
          rowEl.appendChild(createKeyElement(enterKey));
        } else {
          rowDef.forEach(keyDef => {
            rowEl.appendChild(createKeyElement(keyDef));
          });
        }
        container.appendChild(rowEl);
      });
    }

    function renderSymbolsLayout(container) {
      SYMBOL_ROWS.forEach(rowDef => {
        const rowEl = document.createElement('div');
        rowEl.className = 'grid-row';
        rowDef.forEach(keyDef => {
          rowEl.appendChild(createKeyElement(keyDef));
        });
        container.appendChild(rowEl);
      });
    }

    function render36LLayout(container) {
      const topBar = document.createElement('div');
      topBar.className = 'top-hex-bar';
      const hexKeys = [
        { char: 'a', tl: 'a' }, { char: 'b', tl: 'uy' }, { char: 'c', tl: 'Ch' },
        { char: 'd', tl: 'đ' }, { char: 'e', tl: 'êu' }, { char: 'f', tl: 'ươn' },
        { char: '36L', sub: 'Giữ: 2-Tay', span: 2, type: 'mode' },
        { char: '<' }, { char: '%' }, { char: '$' }, { char: '000', type: 'flank' }
      ];
      hexKeys.forEach(hk => topBar.appendChild(createKeyElement(hk)));
      container.appendChild(topBar);

      const splitWrap = document.createElement('div');
      splitWrap.className = 'split-layout-wrap';

      const paneTyping = document.createElement('div');
      paneTyping.className = 'split-pane-typing';
      const rowsLeft = [
        ['g', 'h', 'i', 'j', 'k', 'l'],
        ['7', '8', '9', 'm', 'n', 'o'],
        ['4', '5', '6', 'p', 'q', 'r'],
        ['1', '2', '3', 's', 't', 'u'],
        ['0', 'v', 'w', 'x', 'y', 'z']
      ];
      rowsLeft.forEach(r => {
        const rEl = document.createElement('div');
        rEl.className = 'grid-row';
        r.forEach(ch => {
          const isNum = /^[0-9]/.test(ch);
          rEl.appendChild(createKeyElement({ char: ch, type: isNum ? 'digit' : 'normal' }));
        });
        paneTyping.appendChild(rEl);
      });

      const paneSug = document.createElement('div');
      paneSug.className = 'split-pane-suggestions';
      ['toán', 'mong', 'thết', 'vươn', 'yêu'].forEach((w, i) => {
        const chip = document.createElement('div');
        chip.className = `v-sug-item ${i === 0 ? 'primary' : ''}`;
        chip.innerHTML = `<span class="v-word">${w}</span><span class="v-code">[VComp]</span>`;
        chip.onclick = () => commitWord(w);
        paneSug.appendChild(chip);
      });

      const paneFunc = document.createElement('div');
      paneFunc.className = 'split-pane-funcs';
      const rowsRight = [
        [{ char: '-' }, { char: '+' }, { char: '=' }, { char: '>' }],
        [{ char: '⌫', type: 'bksp' }, { char: ':' }, { char: ';' }, { char: '"' }],
        [{ char: '.' }, { char: ',' }, { char: '(' }, { char: ')' }],
        [{ char: '↵', type: 'action' }, { char: '⇧', type: 'shift' }, { char: '/' }, { char: '🔍', type: 'flank' }],
        [{ char: ' ', span: 2, type: 'space' }, { char: '?' }, { char: '📴', sub: '2Tay', type: 'mode' }]
      ];
      rowsRight.forEach(r => {
        const rEl = document.createElement('div');
        rEl.className = 'grid-row';
        r.forEach(fk => rEl.appendChild(createKeyElement(fk)));
        paneFunc.appendChild(rEl);
      });

      splitWrap.appendChild(paneTyping);
      splitWrap.appendChild(paneSug);
      splitWrap.appendChild(paneFunc);
      container.appendChild(splitWrap);
    }

    function render36RLayout(container) {
      const topBar = document.createElement('div');
      topBar.className = 'top-hex-bar';
      const hexKeys = [
        { char: '000', type: 'flank' }, { char: '$' }, { char: '%' }, { char: '<' },
        { char: '36R', sub: 'Giữ: 2-Tay', span: 2, type: 'mode' },
        { char: 'a', tl: 'a' }, { char: 'b', tl: 'uy' }, { char: 'c', tl: 'Ch' },
        { char: 'd', tl: 'đ' }, { char: 'e', tl: 'êu' }, { char: 'f', tl: 'ươn' }
      ];
      hexKeys.forEach(hk => topBar.appendChild(createKeyElement(hk)));
      container.appendChild(topBar);

      const splitWrap = document.createElement('div');
      splitWrap.className = 'split-layout-wrap';

      const paneFunc = document.createElement('div');
      paneFunc.className = 'split-pane-funcs';
      const rowsFunc = [
        [{ char: '-' }, { char: '+' }, { char: '=' }, { char: '>' }],
        [{ char: '"' }, { char: ';' }, { char: ':' }, { char: '⌫', type: 'bksp' }],
        [{ char: ')' }, { char: '(' }, { char: ',' }, { char: '.' }],
        [{ char: '🔍', type: 'flank' }, { char: '/' }, { char: '⇧', type: 'shift' }, { char: '↵', type: 'action' }],
        [{ char: '📴', sub: '2Tay', type: 'mode' }, { char: '?' }, { char: ' ', span: 2, type: 'space' }]
      ];
      rowsFunc.forEach(r => {
        const rEl = document.createElement('div');
        rEl.className = 'grid-row';
        r.forEach(fk => rEl.appendChild(createKeyElement(fk)));
        paneFunc.appendChild(rEl);
      });

      const paneSug = document.createElement('div');
      paneSug.className = 'split-pane-suggestions';
      ['toán', 'mong', 'thết', 'vươn', 'yêu'].forEach((w, i) => {
        const chip = document.createElement('div');
        chip.className = `v-sug-item ${i === 0 ? 'primary' : ''}`;
        chip.innerHTML = `<span class="v-word">${w}</span><span class="v-code">[VComp]</span>`;
        chip.onclick = () => commitWord(w);
        paneSug.appendChild(chip);
      });

      const paneTyping = document.createElement('div');
      paneTyping.className = 'split-pane-typing';
      const rowsRight = [
        ['g', 'h', 'i', 'j', 'k', 'l'],
        ['m', 'n', 'o', '7', '8', '9'],
        ['p', 'q', 'r', '4', '5', '6'],
        ['s', 't', 'u', '1', '2', '3'],
        ['v', 'w', 'x', 'y', 'z', '0']
      ];
      rowsRight.forEach(r => {
        const rEl = document.createElement('div');
        rEl.className = 'grid-row';
        r.forEach(ch => {
          const isNum = /^[0-9]/.test(ch);
          rEl.appendChild(createKeyElement({ char: ch, type: isNum ? 'digit' : 'normal' }));
        });
        paneTyping.appendChild(rEl);
      });

      splitWrap.appendChild(paneFunc);
      splitWrap.appendChild(paneSug);
      splitWrap.appendChild(paneTyping);
      container.appendChild(splitWrap);
    }

    function renderSecretRhymesLayout(container) {
      NORMAL_ROWS.forEach(rowDef => {
        const rowEl = document.createElement('div');
        rowEl.className = 'grid-row';
        rowDef.forEach(k => {
          const sec = SECRET_36_KEYS.find(s => s.id === k.id);
          if (sec) {
            const rhymeList = sec.rhymes || [];
            const curRhyme = rhymeList[secretRhymeCycle % rhymeList.length] || k.char;
            const cloneKey = { ...k, char: curRhyme, secretDigit: sec.digit };
            const el = createKeyElement(cloneKey);
            
            if (secretPeekActive) {
              const badge = document.createElement('span');
              badge.className = 'key-peek-badge';
              badge.textContent = sec.digitDisplay || sec.digit;
              el.appendChild(badge);
            }
            rowEl.appendChild(el);
          } else {
            rowEl.appendChild(createKeyElement(k));
          }
        });
        container.appendChild(rowEl);
      });
    }

    // ====================================================================
    // 13. BÀN PHÍM MÃ VẦN BÍ MẬT & VỆT SÁNG NEON
    // ====================================================================
    window.toggleSecretPeek = function() {
      secretPeekActive = !secretPeekActive;
      const lbl = document.getElementById('secretPeekLabel');
      if (lbl) lbl.textContent = secretPeekActive ? 'Soi Số: BẬT' : 'Soi Số: TẮT';
      renderKeyboard();
      showToast(secretPeekActive ? '👁️ Đã bật soi số ngầm (Ngón tay không che phím)' : '🔒 Đã tắt soi số');
    };

    window.rotateSecretCycle = function() {
      secretRhymeCycle = (secretRhymeCycle + 1) % 4;
      const names = ['Tầng 1: B3/B1', 'Tầng 2: Dấu/Phụ âm', 'Tầng 3: B2', 'Tầng 4: Phụ'];
      const lbl = document.getElementById('secretCycleLabel');
      if (lbl) lbl.textContent = names[secretRhymeCycle];
      renderKeyboard();
      showToast(`🎲 Đã đổi sang ${names[secretRhymeCycle]}`);
    };

    window.showSecretVaultList = function() {
      let str = '🔑 KÉT MẬT KHẨU ĐÃ LƯU:\n\n';
      SECRET_PASSWORDS.forEach(p => {
        str += `• ${p.name}: [${p.code}] ➔ Phím: ${p.keyPath.join(' - ')}\n`;
      });
      str += '\n💡 Cơ chế: Bấm vần đầu tiên ➔ Tự động điền mật khẩu & vẽ vệt sáng Neon học vần!';
      alert(str);
    };

    function handleSecretKeyTap(k) {
      const digit = (k.secretDigit || '').toLowerCase();
      secretInputSequence.push(digit);

      const matches = SECRET_PASSWORDS.filter(pw => {
        if (pw.keyPath.length < secretInputSequence.length) return false;
        for (let i = 0; i < secretInputSequence.length; i++) {
          if (pw.keyPath[i].toLowerCase() !== secretInputSequence[i]) return false;
        }
        return true;
      });

      if (matches.length === 1) {
        const matched = matches[0];
        insertTextAtCaret(matched.code);
        secretInputSequence = [];
        drawNeonPath(matched.keyPath);
        rotateSecretCycle();
        showTemporaryNotice(`✅ Tự điền mật khẩu ${matched.name} & Vẽ vệt sáng học vần!`, true);
      } else if (matches.length > 1) {
        showTemporaryNotice(`⏳ Trùng tiền tố: Bấm tiếp vần thứ ${secretInputSequence.length + 1} để phân nhánh!`, false);
      } else {
        secretInputSequence = [];
        insertTextAtCaret(k.char);
      }
    }

    function drawNeonPath(keyPath) {
      const canvas = document.getElementById('swipeCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const points = [];
      keyPath.forEach(char => {
        const sec = SECRET_36_KEYS.find(s => s.digit.toLowerCase() === char.toLowerCase());
        if (sec) {
          const el = document.getElementById(sec.id);
          if (el) {
            const r = el.getBoundingClientRect();
            const wrapR = document.getElementById('keyboardWrapper').getBoundingClientRect();
            points.push({ x: r.left - wrapR.left + r.width / 2, y: r.top - wrapR.top + r.height / 2 });
          }
        }
      });

      if (points.length < 2) return;

      let step = 0;
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.strokeStyle = 'rgba(242, 204, 96, 0.9)';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#58a6ff';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        step++;
        if (step < 60) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 1200);
        }
      }
      animate();
    }

    // ====================================================================
    // 14. CÀI ĐẶT SHEET & CHUYỂN CHẾ ĐỘ
    // ====================================================================
    window.openSettings = function() {
      document.getElementById('settingsSheet').classList.add('open');
      syncSettingsUI();
      updateExpenseUI();
    };
    window.closeSettings = function() {
      document.getElementById('settingsSheet').classList.remove('open');
    };

    window.switchMode = function(mode) {
      currentMode = mode;
      clearNeighborBloom();
      clearGlideTrail();
      renderKeyboard();
      renderSuggestions();
      closeSettings();
      syncSettingsUI();
      const labels = {
        'normal': 'Chuẩn 2 Tay (5×12)',
        '36L': '36L Tay Trái (+ Hexa)',
        '36R': '36R Tay Phải (+ Hexa)',
        'symbols': 'Tầng Ký Hiệu & Số (Sym)',
        'secret_rhymes': '🔐 Bàn Phím Mã Vần Bí Mật'
      };
      showToast(`📱 Chuyển sang: ${labels[mode] || mode}`);
    };

    window.setVoiceAiMode = function(enabled) {
      voiceAiEnabled = enabled;
      updateVoiceBtnUI();
      syncSettingsUI();
      showTemporaryNotice(`✨✍️🎤 Đang cấu hình Voice AI ở giao diện web, hãy dùng mobile app để có trải nghiệm đầy đủ!`, true);
    };

    window.setStudyLevel = function(lvl) {
      shiftStudyMode = lvl;
      renderKeyboard();
      renderSuggestions();
      syncSettingsUI();
      showToast(`📖 Học Dấu: ${STUDY_MODE_BADGES[lvl]}`);
    };

    function syncSettingsUI() {
      const btnOff = document.getElementById('optVoiceOffline');
      const btnOn = document.getElementById('optVoiceAi');
      if (btnOff && btnOn) {
        btnOff.classList.toggle('active', !voiceAiEnabled);
        btnOn.classList.toggle('active', voiceAiEnabled);
      }

      ['Normal', '36L', '36R', 'Secret'].forEach(m => {
        const el = document.getElementById('optMode' + m);
        if (el) {
          const match = (m === 'Normal' && currentMode === 'normal') ||
                        (m === '36L' && currentMode === '36L') ||
                        (m === '36R' && currentMode === '36R') ||
                        (m === 'Secret' && currentMode === 'secret_rhymes');
          el.classList.toggle('active', match);
        }
      });

      for (let i = 0; i <= 7; i++) {
        const el = document.getElementById('optStudy' + i);
        if (el) el.classList.toggle('active', shiftStudyMode === i);
      }
    }

    // ====================================================================
    // 15. KHỞI TẠO BAN ĐẦU
    // ====================================================================
    renderKeyboard();
    renderSuggestions();
    updateVoiceBtnUI();
    updateExpenseUI();
  