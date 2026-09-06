/**
 * ===================================================
 * ⚡ VSECRETNOTE - ADAPTIVE 4-SLOT NAVIGATION SYSTEM
 * ===================================================
 * - Bên trái: Logo + Tên trang hiện tại
 * - Bên phải: 4 slots điều hướng thích ứng:
 *    [Slot 1] 📌 Ghim (User chọn ghim)
 *    [Slot 2] 🔥 Thường dùng toàn cục (Top click hệ thống)
 *    [Slot 3] 🎯 Thường dùng theo ngữ cảnh (Top click từ trang hiện tại)
 *    [Slot 4] 🗂️ Bảng chọn tất cả trang (Launcher Hub + đổi ghim)
 */

export const VSN_PAGES = [
  {
    id: 'index',
    title: 'Trang Chính',
    badge: 'STUDIO & NOTES',
    desc: 'Editor đa thức & Ghi chú bảo mật',
    icon: '🏠',
    path: '/index.html',
    aliases: ['/', '/index.html', '/index']
  },
  {
    id: 'twins',
    title: 'Kỳ Quan Đối Xứng',
    badge: 'TWINS CODEX',
    desc: '695 từ đối xứng & mã lặp Base60',
    icon: '✨',
    path: '/twins.html',
    aliases: ['/twins.html', '/twins']
  },
  {
    id: 'mnemonic',
    title: 'Bảng Thần Chú',
    badge: 'MNEMONIC MASTER',
    desc: 'Khẩu quyết ghi nhớ 60 ký tự Base60',
    icon: '⚡',
    path: '/mnemonic.html',
    aliases: ['/mnemonic.html', '/mnemonic']
  },
  {
    id: 'dict-matrix',
    title: 'Ma Trận & Từ Điển',
    badge: 'DICT & MATRIX',
    desc: 'Tổng hợp Ma trận vần và Từ điển Base60',
    icon: '📊',
    path: '/dict-matrix.html',
    aliases: ['/dict-matrix.html', '/dict-matrix']
  },
  {
    id: 'vssl',
    title: 'Thủ Ngữ VSSL',
    badge: 'SIGN LANGUAGE',
    desc: 'Ngôn ngữ ký hiệu cử chỉ tay',
    icon: '🤟',
    path: '/vssl.html',
    aliases: ['/vssl.html', '/vssl']
  },
  {
    id: 'font-maker',
    title: 'Font Glyph Maker',
    badge: 'CYBER FONT',
    desc: 'Bộ công cụ tạo glyph CyberVietnamese',
    icon: '🔤',
    path: '/font-maker.html',
    aliases: ['/font-maker.html', '/font-maker']
  },
  {
    id: 'dict',
    title: 'Từ Điển B60',
    badge: 'DICTIONARY',
    desc: 'Bảng từ điển tra cứu đơn lập',
    icon: '📖',
    path: '/dict.html',
    aliases: ['/dict.html', '/dict']
  },
  {
    id: 'matrix',
    title: 'Ma Trận Vần',
    badge: 'RHYME MATRIX',
    desc: 'Bảng ma trận vần đơn lập',
    icon: '▦',
    path: '/matrix.html',
    aliases: ['/matrix.html', '/matrix']
  }
];

const STORAGE_KEY_PINNED = 'vsn_nav_pinned';
const STORAGE_KEY_GLOBAL = 'vsn_nav_global_clicks';
const STORAGE_KEY_CONTEXT = 'vsn_nav_context_clicks';

class VsnNavManager {
  constructor() {
    this.currentPage = this.detectCurrentPage();
  }

  detectCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    for (const page of VSN_PAGES) {
      if (page.aliases.some(alias => path === alias || path.endsWith(alias))) {
        return page;
      }
    }
    // Fallback: match by id in path
    const match = VSN_PAGES.find(p => path.includes(p.id));
    return match || VSN_PAGES[0]; // Mặc định là Trang Chính
  }

  getPinnedId() {
    return localStorage.getItem(STORAGE_KEY_PINNED) || 'twins';
  }

  setPinnedId(pageId) {
    localStorage.setItem(STORAGE_KEY_PINNED, pageId);
  }

  getGlobalClicks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_GLOBAL)) || {};
    } catch {
      return {};
    }
  }

  getContextClicks(fromId) {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY_CONTEXT)) || {};
      return data[fromId] || {};
    } catch {
      return {};
    }
  }

  recordClick(toId) {
    const fromId = this.currentPage.id;
    
    // 1. Cập nhật Global clicks
    const globalClicks = this.getGlobalClicks();
    globalClicks[toId] = (globalClicks[toId] || 0) + 1;
    localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(globalClicks));

    // 2. Cập nhật Context clicks
    try {
      const allContext = JSON.parse(localStorage.getItem(STORAGE_KEY_CONTEXT)) || {};
      if (!allContext[fromId]) allContext[fromId] = {};
      allContext[fromId][toId] = (allContext[fromId][toId] || 0) + 1;
      localStorage.setItem(STORAGE_KEY_CONTEXT, JSON.stringify(allContext));
    } catch (e) {
      console.error('Lỗi ghi context clicks:', e);
    }
  }

  calculateSlots() {
    const currentId = this.currentPage.id;
    const pinnedId = this.getPinnedId();
    const globalClicks = this.getGlobalClicks();
    const contextClicks = this.getContextClicks(currentId);

    // Thứ tự fallback ưu tiên nếu chưa có click
    const defaultPriority = ['twins', 'dict-matrix', 'mnemonic', 'index', 'vssl', 'font-maker'];

    // 1. SLOT 1: PINNED (Ghim)
    let slot1 = VSN_PAGES.find(p => p.id === pinnedId);
    if (!slot1) slot1 = VSN_PAGES.find(p => p.id === 'twins') || VSN_PAGES[1];

    // 2. SLOT 2: GLOBAL FREQUENT (Toàn cục)
    // Sắp xếp các trang theo lượt click toàn cục giảm dần, loại bỏ current và slot1
    const globalCandidates = VSN_PAGES
      .filter(p => p.id !== currentId && p.id !== slot1.id)
      .sort((a, b) => {
        const clicksA = globalClicks[a.id] || 0;
        const clicksB = globalClicks[b.id] || 0;
        if (clicksB !== clicksA) return clicksB - clicksA;
        return defaultPriority.indexOf(a.id) - defaultPriority.indexOf(b.id);
      });
    const slot2 = globalCandidates[0] || VSN_PAGES.find(p => p.id !== currentId) || VSN_PAGES[0];

    // 3. SLOT 3: CONTEXT FREQUENT (Ngữ cảnh của trang hiện tại)
    // Sắp xếp các trang theo lượt click từ trang này giảm dần, loại bỏ current, slot1, slot2
    const contextCandidates = VSN_PAGES
      .filter(p => p.id !== currentId && p.id !== slot1.id && p.id !== slot2.id)
      .sort((a, b) => {
        const clicksA = contextClicks[a.id] || 0;
        const clicksB = contextClicks[b.id] || 0;
        if (clicksB !== clicksA) return clicksB - clicksA;
        return defaultPriority.indexOf(a.id) - defaultPriority.indexOf(b.id);
      });
    const slot3 = contextCandidates[0] || VSN_PAGES.find(p => p.id !== currentId && p.id !== slot1.id) || VSN_PAGES[0];

    return { slot1, slot2, slot3 };
  }

  render(headerElement) {
    if (!headerElement) return;

    // Đảm bảo link CSS đã được nạp
    if (!document.querySelector('link[href*="nav-system.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/nav-system.css';
      document.head.appendChild(link);
    }

    headerElement.className = 'vsn-nav-header';
    headerElement.innerHTML = '';

    const { slot1, slot2, slot3 } = this.calculateSlots();
    const globalClicks = this.getGlobalClicks();
    const contextClicks = this.getContextClicks(this.currentPage.id);
    const pinnedId = this.getPinnedId();

    // VẾ TRÁI: Logo + Badge trang hiện tại
    const brandBox = document.createElement('a');
    brandBox.className = 'vsn-brand-box';
    brandBox.href = '/index.html';
    brandBox.title = 'VSecretNote Studio - Về trang chính';
    brandBox.innerHTML = `
      <span class="vsn-logo-title glitch" data-text="TIMECYPHER">⚡ TIMECYPHER</span>
      <span class="vsn-current-badge">${this.currentPage.icon} ${this.currentPage.title}</span>
    `;

    // VẾ PHẢI: 4 SLOTS
    const navBox = document.createElement('nav');
    navBox.className = 'vsn-slots-nav';

    // Helper tạo nút link cho Slot
    const createSlotBtn = (page, typeClass, tagLabel, tagTooltip) => {
      const btn = document.createElement('a');
      btn.href = page.path;
      btn.className = `vsn-slot-btn ${typeClass}`;
      btn.title = tagTooltip;
      btn.innerHTML = `
        <span class="vsn-slot-tag">${tagLabel}</span>
        <span>${page.icon} ${page.title}</span>
      `;
      btn.addEventListener('click', () => {
        this.recordClick(page.id);
      });
      return btn;
    };

    // Slot 1: Pinned
    const slot1Btn = createSlotBtn(
      slot1,
      'slot-pinned',
      '📌 Ghim',
      `[Slot 1 - Ghim]: Trang do bạn ghim cố định. Đổi ở menu 'Tất cả'`
    );

    // Slot 2: Global
    const gClicks = globalClicks[slot2.id] || 0;
    const slot2Btn = createSlotBtn(
      slot2,
      'slot-global',
      '🔥 Thường dùng',
      `[Slot 2 - Toàn cục]: Trang mở nhiều nhất hệ thống (${gClicks} lượt click)`
    );

    // Slot 3: Context
    const cClicks = contextClicks[slot3.id] || 0;
    const slot3Btn = createSlotBtn(
      slot3,
      'slot-context',
      '🎯 Ngữ cảnh',
      `[Slot 3 - Ngữ cảnh]: Thường mở nhất khi đang ở ${this.currentPage.title} (${cClicks} lượt)`
    );

    // Slot 4: Launcher Button (Tất cả trang)
    const slot4Btn = document.createElement('button');
    slot4Btn.type = 'button';
    slot4Btn.className = 'vsn-slot-btn slot-launcher';
    slot4Btn.title = 'Mở danh mục tất cả trang & tùy chọn ghim';
    slot4Btn.innerHTML = `
      <span class="vsn-slot-tag">🗂️</span>
      <span>Tất Cả Trang ▼</span>
    `;

    // Dropdown Popover Launcher
    const popover = document.createElement('div');
    popover.className = 'vsn-launcher-popover';
    popover.style.display = 'none';

    popover.innerHTML = `
      <div class="vsn-popover-header">
        <span class="vsn-popover-title">🗂️ TẤT CẢ CÁC TRANG HỆ THỐNG</span>
        <span class="vsn-popover-tip">Bấm 📌 để đổi nút Ghim</span>
      </div>
      <div class="vsn-pages-list">
        ${VSN_PAGES.map(p => {
          const isCurrent = p.id === this.currentPage.id;
          const isPinned = p.id === pinnedId;
          const pGlobal = globalClicks[p.id] || 0;
          const pContext = contextClicks[p.id] || 0;
          return `
            <div class="vsn-page-item ${isCurrent ? 'current-page' : ''}" data-id="${p.id}">
              <a href="${p.path}" class="vsn-page-info" style="text-decoration:none; color:inherit;">
                <span class="vsn-page-icon">${p.icon}</span>
                <div class="vsn-page-texts">
                  <div class="vsn-page-title">
                    ${p.title} 
                    ${isCurrent ? '<small style="color:#00ffcc; font-size:10px;">(Đang mở)</small>' : ''}
                  </div>
                  <div class="vsn-page-desc">${p.desc}</div>
                  <div style="font-size: 9px; color: #5a7d6a; margin-top: 2px;">
                    <span>🔥 Toàn cục: ${pGlobal}</span> &bull; 
                    <span>🎯 Từ trang này: ${pContext}</span>
                  </div>
                </div>
              </a>
              <button class="vsn-pin-action-btn ${isPinned ? 'is-pinned' : ''}" title="${isPinned ? 'Đang được ghim ở Slot 1' : 'Ghim trang này vào Slot 1'}" data-pin-id="${p.id}">
                ${isPinned ? '📌' : '📍'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Sự kiện toggle popover
    slot4Btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = popover.style.display === 'flex';
      popover.style.display = isVisible ? 'none' : 'flex';
      slot4Btn.classList.toggle('active', !isVisible);
    });

    // Đóng popover khi click ngoài
    document.addEventListener('click', (e) => {
      if (!headerElement.contains(e.target)) {
        popover.style.display = 'none';
        slot4Btn.classList.remove('active');
      }
    });

    // Sự kiện click chuyển trang trong popover (ghi nhận click)
    popover.querySelectorAll('.vsn-page-info').forEach(link => {
      link.addEventListener('click', (e) => {
        const item = link.closest('.vsn-page-item');
        const pageId = item.getAttribute('data-id');
        this.recordClick(pageId);
      });
    });

    // Sự kiện đổi Ghim (Slot 1)
    popover.querySelectorAll('.vsn-pin-action-btn').forEach(pinBtn => {
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pinId = pinBtn.getAttribute('data-pin-id');
        this.setPinnedId(pinId);
        // Re-render tức thì để thấy thay đổi ngay lập tức
        this.render(headerElement);
      });
    });

    navBox.appendChild(slot1Btn);
    navBox.appendChild(slot2Btn);
    navBox.appendChild(slot3Btn);
    navBox.appendChild(slot4Btn);

    headerElement.appendChild(brandBox);
    headerElement.appendChild(navBox);
    headerElement.appendChild(popover);
  }
}

// Khởi tạo tự động khi DOM ready
export function initVsnNavigation(customHeaderSelector) {
  const manager = new VsnNavManager();
  const header = customHeaderSelector 
    ? document.querySelector(customHeaderSelector)
    : document.querySelector('header');

  if (header) {
    manager.render(header);
  }
  return manager;
}

// Auto-run nếu được load trực tiếp qua script tag
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Chỉ auto-init nếu chưa được init thủ công
    if (!window.__VSN_NAV_INITIALIZED__) {
      const header = document.querySelector('header.vsn-auto-nav') || document.querySelector('header#vsn-nav-header');
      if (header) {
        window.__VSN_NAV_INITIALIZED__ = true;
        initVsnNavigation();
      }
    }
  });
}
