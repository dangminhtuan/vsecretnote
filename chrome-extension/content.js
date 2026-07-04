import { encodeWord, decodeWord, timeToBase60, base60ToTime } from '../vcomp.js';

const tooltip = document.createElement('div');
tooltip.id = 'vcomp-cypher-tooltip';
tooltip.style.display = 'none';
tooltip.innerHTML = `
  <button id="vcomp-btn-enc-num" title="Mã hóa thành Số (Alt+1)">🔢</button>
  <button id="vcomp-btn-enc-char" title="Mã hóa thành Ký tự (Alt+2)">🔠</button>
  <button id="vcomp-btn-decode" title="Giải mã (Alt+3)">🔓</button>
  <button id="vcomp-undo-action" title="Hãy mã hóa bằng Alt+1, Alt+2 trước khi hoàn tác (Alt+Z)" style="color: #ff00ff; border-color: #ff00ff; opacity: 0.5;">🔙</button>
  <div class="vcomp-dropdown">
    <button id="vcomp-btn-menu" title="Tùy chọn">⋮</button>
    <div class="vcomp-dropdown-content" id="vcomp-menu-content">
      <a href="#" id="vcomp-disable-site">Tắt trên trang này</a>
      <a href="#" id="vcomp-disable-all">Tắt trên mọi trang</a>
    </div>
  </div>
`;
document.body.appendChild(tooltip);

let currentSelectionRange = null;
let isDisabledSite = false;
let isGlobalDisabled = false;
let lastAction = null;
const currentHostname = window.location.hostname;

chrome.storage.local.get(['disabledDomains', 'globalDisable'], (result) => {
  const domains = result.disabledDomains || [];
  isDisabledSite = domains.includes(currentHostname);
  isGlobalDisabled = result.globalDisable || false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.disabledDomains) {
      isDisabledSite = changes.disabledDomains.newValue.includes(currentHostname);
    }
    if (changes.globalDisable) {
      isGlobalDisabled = changes.globalDisable.newValue;
    }
  }
});

document.addEventListener('mouseup', (e) => {
  if (tooltip.contains(e.target)) return;
  document.getElementById('vcomp-menu-content').style.display = 'none';

  if (isDisabledSite || isGlobalDisabled) {
    tooltip.style.display = 'none';
    currentSelectionRange = null;
    return;
  }

  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 0 && selection.rangeCount > 0) {
    currentSelectionRange = selection.getRangeAt(0);
    
    const btnUndo = document.getElementById('vcomp-undo-action');
    if (lastAction) {
      btnUndo.style.opacity = '1';
      btnUndo.title = 'Hoàn tác (Alt+Z)';
    } else {
      btnUndo.style.opacity = '0.5';
      btnUndo.title = 'Hãy mã hóa bằng Alt+1, Alt+2 trước khi hoàn tác (Alt+Z)';
    }

    const rect = currentSelectionRange.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.display = 'flex';
  } else {
    tooltip.style.display = 'none';
    currentSelectionRange = null;
  }
});

document.addEventListener('scroll', () => {
  if (tooltip.style.display !== 'none') {
    tooltip.style.display = 'none';
    document.getElementById('vcomp-menu-content').style.display = 'none';
  }
});

function performUndo() {
  if (!lastAction) return;

  // Shadow test
  let errorMsgs = [];
  lastAction.forEach(data => {
    if (data.mode === 'encode' && data.processedText && data.textToProcess) {
      const DECODE_REGEX = /("[^"]+"|\[[^\]]+\]|[a-zA-Z0-9À-ỹ_]+)/;
      const shadowDecoded = data.processedText.split(DECODE_REGEX).map(token => {
        if (!token) return '';
        if (token.startsWith('"') && token.endsWith('"')) return token.substring(1, token.length - 1);
        if (token.startsWith('[') && token.endsWith(']')) return token;
        if (token.match(/^[a-zA-Z0-9À-ỹ_]+$/)) {
          let decoded = /[a-zA-Z]/.test(token) ? decodeWord(base60ToTime(token)) : decodeWord(token);
          return decoded.startsWith('[ERR') ? token : decoded;
        }
        return token;
      }).join('');
      
      if (shadowDecoded !== data.textToProcess) {
        errorMsgs.push(`Gốc: "${data.textToProcess}"\nGiải mã ra: "${shadowDecoded}"`);
        console.error(`Shadow Test Failed! Original: ${data.textToProcess}, Encoded: ${data.processedText}, Decoded: ${shadowDecoded}`);
      }
    }
    
    data.node.nodeValue = data.originalText;
  });

  if (errorMsgs.length > 0) {
    alert(`⚠️ CẢNH BÁO MẤT MÁT DỮ LIỆU!\n\nHệ thống phát hiện lỗi thuật toán giải mã trên một số đoạn vừa được mã hóa:\n\n${errorMsgs.join('\n---\n')}\n\nVui lòng kiểm tra lại cấu hình từ điển!`);
  }

  lastAction = null;
  tooltip.style.display = 'none';
  const menuContent = document.getElementById('vcomp-menu-content');
  if (menuContent) menuContent.style.display = 'none';
  window.getSelection().removeAllRanges();
}

document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    performUndo();
    return;
  }

  if (e.altKey && ['1', '2', '3'].includes(e.key)) {
    const selection = window.getSelection();
    if (selection.toString().trim().length > 0 && selection.rangeCount > 0) {
      e.preventDefault();
      currentSelectionRange = selection.getRangeAt(0);
      if (e.key === '1') {
        replaceSelectedText('encode', encodeWord);
      } else if (e.key === '2') {
        replaceSelectedText('encode', (w) => {
          try {
            const num = encodeWord(w);
            if (typeof num === 'string' && num.startsWith('"')) return num;
            return num ? timeToBase60(num) : w;
          } catch (err) { return w; }
        });
      } else if (e.key === '3') {
        replaceSelectedText('decode');
      }
    }
  }
});

function replaceSelectedText(mode, processFn) {
  if (!currentSelectionRange) return;
  const range = currentSelectionRange;
  
  const treeWalker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes = [];
  let currentNode;
  while (currentNode = treeWalker.nextNode()) {
    if (currentNode.parentNode && (currentNode.parentNode.tagName === 'SCRIPT' || currentNode.parentNode.tagName === 'STYLE')) continue;
    textNodes.push(currentNode);
  }

  if (textNodes.length === 0) return;

  const undoData = [];

  textNodes.forEach(node => {
    let startOffset = 0;
    let endOffset = node.nodeValue.length;

    if (node === range.startContainer) startOffset = range.startOffset;
    if (node === range.endContainer) endOffset = range.endOffset;

    const originalText = node.nodeValue;
    const actionData = { node: node, originalText: originalText, mode: mode };
    undoData.push(actionData);

    const textToProcess = originalText.substring(startOffset, endOffset);
    if (textToProcess.trim().length > 0) {
      let processedText = '';
      if (mode === 'decode') {
        const DECODE_REGEX = /("[^"]+"|\[[^\]]+\]|[a-zA-Z0-9À-ỹ_]+)/;
        processedText = textToProcess.split(DECODE_REGEX).map(token => {
          if (!token) return '';
          if (token.startsWith('"') && token.endsWith('"')) return token.substring(1, token.length - 1);
          if (token.startsWith('[') && token.endsWith(']')) return token;
          if (token.match(/^[a-zA-Z0-9]+$/)) {
            let decoded = /[a-zA-Z]/.test(token) ? decodeWord(base60ToTime(token)) : decodeWord(token);
            return decoded.startsWith('[ERR') ? token : decoded;
          }
          return token;
        }).join('');
      } else {
        processedText = textToProcess.split(/([\s.,;?!()[\]{}"'“”~…—/|\-])/).map(w => {
          if (w.trim() === '') return w;
          if (/^[\s.,;?!()[\]{}"'“”~…—/|\-]+$/.test(w)) return w; 
          const result = processFn(w);
          return result ? result : w;
        }).join('');
      }
      
      actionData.textToProcess = textToProcess;
      actionData.processedText = processedText;
      
      node.nodeValue = originalText.substring(0, startOffset) + processedText + originalText.substring(endOffset);
    }
  });

  lastAction = undoData;
  tooltip.style.display = 'none';
  window.getSelection().removeAllRanges();
}

document.getElementById('vcomp-btn-enc-num').addEventListener('mousedown', (e) => {
  e.preventDefault(); e.stopPropagation();
  replaceSelectedText('encode', encodeWord);
});

document.getElementById('vcomp-btn-enc-char').addEventListener('mousedown', (e) => {
  e.preventDefault(); e.stopPropagation();
  replaceSelectedText('encode', (w) => {
    try {
      const num = encodeWord(w);
      if (typeof num === 'string' && num.startsWith('"')) return num;
      return num ? timeToBase60(num) : w;
    } catch (e) {
      console.error(e);
      return w;
    }
  });
});

document.getElementById('vcomp-btn-decode').addEventListener('mousedown', (e) => {
  e.preventDefault(); e.stopPropagation();
  replaceSelectedText('decode');
});

document.getElementById('vcomp-btn-menu').addEventListener('mousedown', (e) => {
  e.preventDefault(); e.stopPropagation();
  const menu = document.getElementById('vcomp-menu-content');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

// Undo action
document.getElementById('vcomp-undo-action').addEventListener('mousedown', (e) => {
  e.preventDefault(); e.stopPropagation();
  performUndo();
});

document.getElementById('vcomp-disable-site').addEventListener('mousedown', (e) => {
  e.preventDefault(); e.stopPropagation();
  chrome.storage.local.get(['disabledDomains'], (result) => {
    const domains = result.disabledDomains || [];
    if (!domains.includes(currentHostname)) {
      domains.push(currentHostname);
      chrome.storage.local.set({ disabledDomains: domains }, () => {
        tooltip.style.display = 'none';
        window.getSelection().removeAllRanges();
        alert(`Đã tắt VCOMP Tooltip trên trang ${currentHostname}. Bạn có thể bật lại trong Popup.`);
      });
    }
  });
});

document.getElementById('vcomp-disable-all').addEventListener('mousedown', (e) => {
  e.preventDefault(); e.stopPropagation();
  chrome.storage.local.set({ globalDisable: true }, () => {
    tooltip.style.display = 'none';
    window.getSelection().removeAllRanges();
    alert('Đã tắt VCOMP Tooltip trên MỌI TRANG. Bạn có thể bật lại trong Popup.');
  });
});
