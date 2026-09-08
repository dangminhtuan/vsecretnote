/**
 * ===================================================
 * ⚡ VSECRETNOTE - ADAPTIVE 4-SLOT NAVIGATION SYSTEM
 * ===================================================
 * - Bên trái: Logo (về Trang Chính) + Tên trang/chức năng hiện tại
 * - Bên phải: 4 slots điều hướng thích ứng:
 *    [Slot 1] 📌 Ghim (User chọn ghim - hỗ trợ ghim cả trang lẫn chức năng con)
 *    [Slot 2] 🔥 Thường dùng toàn cục (Top click hệ thống, loại trừ Trang Chính)
 *    [Slot 3] 🎯 Thường dùng theo ngữ cảnh (Top click ngữ cảnh / chức năng anh em cùng trang)
 *    [Slot 4] 🗂️ Bảng chọn tất cả trang & chức năng (Launcher Hub + đổi ghim tức thì)
 *
 * * Lưu ý: Trang chính (index) đã được tích hợp vĩnh viễn ở Logo bên trái,
 *          nên hoàn toàn không chiếm dụng 4 slots hay danh sách Popover.
 */

export const VSN_PAGES = [
  {
    id: 'index',
    title: 'Trang Chính',
    shortTitle: 'Trang Chính',
    badge: 'STUDIO & NOTES',
    desc: 'Editor đa thức & Ghi chú bảo mật',
    icon: '🏠',
    path: '/index.html',
    aliases: ['/', '/index.html', '/index']
  },
  {
    id: 'twins',
    title: 'Kỳ Quan Đối Xứng',
    shortTitle: 'Kỳ Quan Đối Xứng',
    badge: 'TWINS CODEX',
    desc: '695 từ đối xứng & mã lặp Base60',
    icon: '✨',
    path: '/twins.html',
    aliases: ['/twins.html', '/twins']
  },
  {
    id: 'mnemonic',
    title: 'Bảng Thần Chú',
    shortTitle: 'Bảng Thần Chú',
    badge: 'MNEMONIC MASTER',
    desc: 'Khẩu quyết ghi nhớ 60 ký tự Base60',
    icon: '⚡',
    path: '/mnemonic.html',
    aliases: ['/mnemonic.html', '/mnemonic']
  },
  {
    id: 'dict-matrix',
    title: 'Ma Trận & Từ Điển',
    shortTitle: 'Ma Trận & Từ Điển',
    badge: 'DICT & MATRIX',
    desc: 'Tổng hợp Ma trận vần và Từ điển Base60',
    icon: '📊',
    path: '/dict-matrix.html',
    aliases: ['/dict-matrix.html', '/dict-matrix'],
    children: [
      {
        id: 'dict-matrix-matrix',
        parentId: 'dict-matrix',
        title: 'Ma Trận Vần',
        shortTitle: 'Ma Trận Vần',
        badge: 'RHYME MATRIX',
        desc: 'Tra cứu 155 vần & mã hóa 6 thanh',
        icon: '📊',
        path: '/dict-matrix.html?tab=matrix',
        tabTarget: 'tab-matrix',
        btnId: 'tab-btn-matrix'
      },
      {
        id: 'dict-matrix-dict',
        parentId: 'dict-matrix',
        title: 'Từ Điển Tra Cứu',
        shortTitle: 'Từ Điển Tra Cứu',
        badge: 'DICTIONARY',
        desc: 'Tra cứu 5.000+ từ tiếng Việt & mã Base60',
        icon: '📖',
        path: '/dict-matrix.html?tab=dict',
        tabTarget: 'tab-dict',
        btnId: 'tab-btn-dict'
      },
      {
        id: 'dict-matrix-download',
        parentId: 'dict-matrix',
        title: 'Tải Từ Điển Gboard',
        shortTitle: 'Tải Gboard',
        badge: 'GBOARD DICT',
        desc: 'Tải các gói phím tắt tiện dụng & học sâu',
        icon: '📥',
        path: '/dict-matrix.html?action=download',
        action: 'download',
        btnId: 'dl-btn',
        menuId: 'dl-menu'
      }
    ]
  },
  {
    id: 'vssl',
    title: 'Thủ Ngữ VSSL',
    shortTitle: 'Thủ Ngữ VSSL',
    badge: 'SIGN LANGUAGE',
    desc: 'Ngôn ngữ ký hiệu cử chỉ tay',
    icon: '🤟',
    path: '/vssl.html',
    aliases: ['/vssl.html', '/vssl']
  },
  {
    id: 'font-maker',
    title: 'Font Glyph Maker',
    shortTitle: 'Font Glyph Maker',
    badge: 'CYBER FONT',
    desc: 'Bộ công cụ tạo glyph CyberVietnamese',
    icon: '🔤',
    path: '/font-maker.html',
    aliases: ['/font-maker.html', '/font-maker']
  },
  {
    id: 'dict',
    title: 'Từ Điển B60 (Cũ)',
    shortTitle: 'Từ Điển Cũ',
    badge: 'DICTIONARY',
    desc: 'Bảng từ điển tra cứu đơn lập',
    icon: '📖',
    path: '/dict.html',
    aliases: ['/dict.html', '/dict']
  },
  {
    id: 'matrix',
    title: 'Ma Trận Vần (Cũ)',
    shortTitle: 'Ma Trận Cũ',
    badge: 'RHYME MATRIX',
    desc: 'Bảng ma trận vần đơn lập',
    icon: '▦',
    path: '/matrix.html',
    aliases: ['/matrix.html', '/matrix']
  }
];

// Trích xuất toàn bộ mục điều hướng (loại trừ 'index' và gộp phẳng các children)
export function getAllNavTargets() {
  const targets = [];
  for (const page of VSN_PAGES) {
    if (page.id === 'index') continue;
    targets.push(page);
    if (page.children && page.children.length > 0) {
      for (const child of page.children) {
        targets.push(child);
      }
    }
  }
  return targets;
}

const STORAGE_KEY_PINNED = 'vsn_nav_pinned';
const STORAGE_KEY_GLOBAL = 'vsn_nav_global_clicks';
const STORAGE_KEY_CONTEXT = 'vsn_nav_context_clicks';

class VsnNavManager {
  constructor() {
    this.headerElement = null;
    this.currentPage = this.detectCurrentPage();

    // Lắng nghe back/forward trình duyệt để đồng bộ giao diện
    window.addEventListener('popstate', () => {
      this.updateState();
    });
  }

  getItemById(id) {
    if (!id || id === 'index') return null;
    for (const page of VSN_PAGES) {
      if (page.id === id) return page;
      if (page.children) {
        const found = page.children.find(c => c.id === id);
        if (found) return found;
      }
    }
    return null;
  }

  detectCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const tab = (params.get('tab') || '').toLowerCase();
    const action = (params.get('action') || '').toLowerCase();

    // 1. Tìm trang cha tương ứng
    let matchedPage = null;
    for (const page of VSN_PAGES) {
      if (page.aliases && page.aliases.some(alias => path === alias || path.endsWith(alias))) {
        matchedPage = page;
        break;
      }
    }
    if (!matchedPage) {
      matchedPage = VSN_PAGES.find(p => path.includes(p.id)) || VSN_PAGES[0];
    }

    // 2. Nếu trang có sub-features (chức năng con, như dict-matrix)
    if (matchedPage && matchedPage.children && matchedPage.children.length > 0) {
      if (action === 'download' || tab === 'download' || search.includes('action=download')) {
        const found = matchedPage.children.find(c => c.action === 'download' || c.id.endsWith('download'));
        if (found) return found;
      }
      if (tab === 'dict' || search.includes('tab=dict')) {
        const found = matchedPage.children.find(c => c.id.endsWith('dict'));
        if (found) return found;
      }
      if (tab === 'matrix' || search.includes('tab=matrix')) {
        const found = matchedPage.children.find(c => c.id.endsWith('matrix'));
        if (found) return found;
      }
      // Mặc định khi vào dict-matrix mà không có query param là Ma Trận Vần
      if (matchedPage.id === 'dict-matrix') {
        return matchedPage.children[0]; // dict-matrix-matrix
      }
    }

    return matchedPage;
  }

  getPinnedId() {
    const pinned = localStorage.getItem(STORAGE_KEY_PINNED);
    if (!pinned || pinned === 'index') {
      return 'twins';
    }
    return pinned;
  }

  setPinnedId(id) {
    if (!id || id === 'index') {
      localStorage.setItem(STORAGE_KEY_PINNED, 'twins');
    } else {
      localStorage.setItem(STORAGE_KEY_PINNED, id);
    }
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
    if (!toId || toId === 'index') return;
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

  updateState() {
    this.currentPage = this.detectCurrentPage();
    if (this.headerElement) {
      this.render(this.headerElement);
    }
  }

  // Điều hướng mượt mà nội bộ trang khi target nằm ngay trong trang hiện tại (không reload trang)
  handleInPageNavigation(item) {
    if (item.action === 'download' || item.id.endsWith('download')) {
      const dlMenu = document.getElementById('dl-menu') || document.getElementById(item.menuId);
      const dlBtn = document.getElementById('dl-btn') || document.getElementById(item.btnId);
      if (dlMenu) dlMenu.classList.add('show');
      if (dlBtn) dlBtn.classList.add('active');
      dlMenu?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (item.btnId || item.tabTarget) {
      const btn = document.getElementById(item.btnId) || document.querySelector(`[data-target="${item.tabTarget}"]`);
      if (btn) {
        btn.click();
      }
      const dlMenu = document.getElementById('dl-menu');
      const dlBtn = document.getElementById('dl-btn');
      if (dlMenu) dlMenu.classList.remove('show');
      if (dlBtn) dlBtn.classList.remove('active');
    }

    window.history.pushState(null, '', item.path);
    this.recordClick(item.id);
    this.updateState();
  }

  calculateSlots() {
    const currentItem = this.currentPage;
    const currentId = currentItem.id;
    const currentParentId = currentItem.parentId || (currentItem.children ? currentItem.id : null);
    const pinnedId = this.getPinnedId();
    const globalClicks = this.getGlobalClicks();
    const contextClicks = this.getContextClicks(currentId);

    const allTargets = getAllNavTargets();

    // Thứ tự fallback ưu tiên nếu chưa có click
    const defaultPriority = [
      'twins',
      'dict-matrix-matrix',
      'dict-matrix-dict',
      'mnemonic',
      'dict-matrix-download',
      'vssl',
      'font-maker',
      'dict-matrix'
    ];

    const getPriorityIndex = (id) => {
      const idx = defaultPriority.indexOf(id);
      return idx === -1 ? 999 : idx;
    };

    // 1. SLOT 1: PINNED (Ghim)
    let slot1 = this.getItemById(pinnedId);
    if (!slot1 || slot1.id === 'index') {
      slot1 = this.getItemById('twins') || allTargets[0];
    }

    // 2. SLOT 2: GLOBAL FREQUENT (Toàn cục)
    // Sắp xếp các mục theo click toàn cục giảm dần, loại bỏ current và slot1
    const globalCandidates = allTargets
      .filter(p => p.id !== 'index' && p.id !== currentId && p.id !== slot1.id)
      .sort((a, b) => {
        const clicksA = globalClicks[a.id] || 0;
        const clicksB = globalClicks[b.id] || 0;
        if (clicksB !== clicksA) return clicksB - clicksA;
        return getPriorityIndex(a.id) - getPriorityIndex(b.id);
      });
    const slot2 = globalCandidates[0] || allTargets.find(p => p.id !== currentId && p.id !== slot1.id) || allTargets[0];

    // 3. SLOT 3: CONTEXT FREQUENT (Ngữ cảnh trang hiện tại)
    // Sắp xếp theo click ngữ cảnh, loại bỏ current, slot1, slot2
    const contextCandidates = allTargets
      .filter(p => p.id !== 'index' && p.id !== currentId && p.id !== slot1.id && p.id !== slot2.id)
      .sort((a, b) => {
        const clicksA = contextClicks[a.id] || 0;
        const clicksB = contextClicks[b.id] || 0;
        if (clicksB !== clicksA) return clicksB - clicksA;

        // Ưu tiên ngữ cảnh: nếu a hoặc b là sibling cùng nhóm chức năng với trang hiện tại
        const aIsSibling = currentParentId && (a.parentId === currentParentId || a.id === currentParentId);
        const bIsSibling = currentParentId && (b.parentId === currentParentId || b.id === currentParentId);
        if (aIsSibling && !bIsSibling) return -1;
        if (!aIsSibling && bIsSibling) return 1;

        return getPriorityIndex(a.id) - getPriorityIndex(b.id);
      });
    const slot3 = contextCandidates[0] || allTargets.find(p => p.id !== currentId && p.id !== slot1.id && p.id !== slot2.id) || allTargets[1];

    return { slot1, slot2, slot3 };
  }

  render(headerElement) {
    if (!headerElement) return;
    this.headerElement = headerElement;

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

    // VẾ TRÁI: Logo (Click là về Trang Chính) + Badge trang/chức năng hiện tại
    const brandBox = document.createElement('a');
    brandBox.className = 'vsn-brand-box';
    brandBox.href = '/index.html';
    brandBox.title = '⚡ TimeCypher Studio - Bấm để về Trang Chính';
    brandBox.innerHTML = `
      <span class="vsn-logo-title glitch" data-text="TIMECYPHER">⚡ TIMECYPHER</span>
      <span class="vsn-current-badge">${this.currentPage.icon} ${this.currentPage.shortTitle || this.currentPage.title}</span>
    `;

    // VẾ PHẢI: 4 SLOTS ĐIỀU HƯỚNG
    const navBox = document.createElement('nav');
    navBox.className = 'vsn-slots-nav';

    // Helper tạo nút link cho Slot
    const createSlotBtn = (page, typeClass, defaultTag, currentTag, tagTooltip) => {
      const isCurrent = page.id === this.currentPage.id;
      const tagLabel = isCurrent ? currentTag : defaultTag;
      const btn = document.createElement('a');
      btn.href = isCurrent ? 'javascript:void(0)' : page.path;
      btn.className = `vsn-slot-btn ${typeClass} ${isCurrent ? 'is-current-page' : ''}`;
      btn.title = isCurrent ? `[Bạn đang ở chức năng này]: ${page.title}` : tagTooltip;
      btn.innerHTML = `
        <span class="vsn-slot-tag">${tagLabel}</span>
        <span class="vsn-slot-name">${page.icon} ${page.shortTitle || page.title}</span>
      `;
      if (!isCurrent) {
        btn.addEventListener('click', (e) => {
          const targetUrl = new URL(page.path, window.location.origin);
          const isSamePage = targetUrl.pathname.toLowerCase() === window.location.pathname.toLowerCase();

          if (isSamePage && (page.parentId || page.action || page.tabTarget)) {
            e.preventDefault();
            this.handleInPageNavigation(page);
          } else {
            this.recordClick(page.id);
          }
        });
      }
      return btn;
    };

    // Slot 1: Pinned
    const slot1Btn = createSlotBtn(
      slot1,
      'slot-pinned',
      '📌 Ghim',
      '📌 Đang xem',
      `[Slot 1 - Ghim]: ${slot1.title}. Đổi ghim nhanh ở menu 'Tất cả'`
    );

    // Slot 2: Global Frequent
    const gClicks = globalClicks[slot2.id] || 0;
    const slot2Btn = createSlotBtn(
      slot2,
      'slot-global',
      '🔥 Thường dùng',
      '🔥 Đang xem',
      `[Slot 2 - Toàn cục]: ${slot2.title} (${gClicks} lượt mở)`
    );

    // Slot 3: Context Frequent
    const cClicks = contextClicks[slot3.id] || 0;
    const slot3Btn = createSlotBtn(
      slot3,
      'slot-context',
      '🎯 Ngữ cảnh',
      '🎯 Đang xem',
      `[Slot 3 - Ngữ cảnh]: ${slot3.title} (${cClicks} lượt từ đây)`
    );

    // Slot 4: Launcher Button (Tất Cả Trang & Chức Năng)
    const slot4Btn = document.createElement('button');
    slot4Btn.type = 'button';
    slot4Btn.className = 'vsn-slot-btn slot-launcher';
    slot4Btn.title = 'Mở danh mục tất cả trang & tùy chọn ghim nhanh';
    slot4Btn.innerHTML = `
      <span class="vsn-slot-tag">🗂️</span>
      <span class="vsn-slot-name">Tất Cả ▼</span>
    `;

    // Dropdown Popover Launcher
    const popover = document.createElement('div');
    popover.className = 'vsn-launcher-popover';
    popover.style.display = 'none';

    // Xây dựng danh sách các trang & chức năng con (hoàn toàn loại trừ 'index')
    const pagesHtml = VSN_PAGES
      .filter(p => p.id !== 'index')
      .map(p => {
        const isCurrent = p.id === this.currentPage.id;
        const isPinned = p.id === pinnedId;
        const pGlobal = globalClicks[p.id] || 0;
        const pContext = contextClicks[p.id] || 0;

        // Nếu trang có chức năng con (sub-features)
        if (p.children && p.children.length > 0) {
          const childrenHtml = p.children.map(child => {
            const isChildCurrent = child.id === this.currentPage.id;
            const isChildPinned = child.id === pinnedId;
            const cGlobal = globalClicks[child.id] || 0;
            const cContext = contextClicks[child.id] || 0;
            return `
              <div class="vsn-subpage-item ${isChildCurrent ? 'current-page' : ''}" data-id="${child.id}">
                <a href="${child.path}" class="vsn-subpage-info" data-sub-id="${child.id}" style="text-decoration:none; color:inherit;">
                  <span class="vsn-subpage-prefix">├─</span>
                  <span class="vsn-subpage-icon">${child.icon}</span>
                  <div class="vsn-subpage-texts">
                    <div class="vsn-subpage-title">
                      ${child.title}
                      ${isChildCurrent ? '<small style="color:#00ffcc; font-size:9.5px;">(Đang xem)</small>' : ''}
                    </div>
                    <div class="vsn-subpage-desc">${child.desc}</div>
                    <div style="font-size: 8.5px; color: #5a7d6a; margin-top: 1px;">
                      <span>🔥 Toàn cục: ${cGlobal}</span> &bull; 
                      <span>🎯 Ngữ cảnh: ${cContext}</span>
                    </div>
                  </div>
                </a>
                <button class="vsn-pin-action-btn vsn-sub-pin-btn ${isChildPinned ? 'is-pinned' : ''}" title="${isChildPinned ? 'Đang được ghim ở Slot 1' : 'Ghim chức năng này vào Slot 1'}" data-pin-id="${child.id}">
                  ${isChildPinned ? '📌' : '📍'}
                </button>
              </div>
            `;
          }).join('');

          return `
            <div class="vsn-page-group" data-group="${p.id}">
              <div class="vsn-page-item vsn-group-header-item ${isCurrent ? 'current-page' : ''}" data-id="${p.id}">
                <a href="${p.path}" class="vsn-page-info" style="text-decoration:none; color:inherit;">
                  <span class="vsn-page-icon">${p.icon}</span>
                  <div class="vsn-page-texts">
                    <div class="vsn-page-title">
                      ${p.title}
                      ${isCurrent ? '<small style="color:#00ffcc; font-size:10px;">(Đang mở)</small>' : ''}
                    </div>
                    <div class="vsn-page-desc">${p.desc}</div>
                  </div>
                </a>
                <button class="vsn-pin-action-btn ${isPinned ? 'is-pinned' : ''}" title="${isPinned ? 'Đang được ghim ở Slot 1' : 'Ghim trang này vào Slot 1'}" data-pin-id="${p.id}">
                  ${isPinned ? '📌' : '📍'}
                </button>
              </div>
              <div class="vsn-subpage-list">
                ${childrenHtml}
              </div>
            </div>
          `;
        }

        // Trang đơn lập chuẩn
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
      }).join('');

    popover.innerHTML = `
      <div class="vsn-popover-header">
        <span class="vsn-popover-title">🗂️ TẤT CẢ TRANG & CHỨC NĂNG</span>
        <span class="vsn-popover-tip">Bấm 📌 để ghim vào Slot 1</span>
      </div>
      <div class="vsn-pages-list">
        ${pagesHtml}
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

    // Sự kiện click chuyển trang/chức năng trong popover (hỗ trợ in-page switch)
    popover.querySelectorAll('.vsn-subpage-info, .vsn-page-info').forEach(link => {
      link.addEventListener('click', (e) => {
        const subId = link.getAttribute('data-sub-id');
        const item = subId ? this.getItemById(subId) : this.getItemById(link.closest('[data-id]')?.getAttribute('data-id'));
        if (!item) return;

        const targetUrl = new URL(item.path, window.location.origin);
        const isSamePage = targetUrl.pathname.toLowerCase() === window.location.pathname.toLowerCase();

        if (isSamePage && (item.parentId || item.action || item.tabTarget)) {
          e.preventDefault();
          popover.style.display = 'none';
          slot4Btn.classList.remove('active');
          this.handleInPageNavigation(item);
        } else {
          this.recordClick(item.id);
        }
      });
    });

    // Sự kiện đổi Ghim (Slot 1)
    popover.querySelectorAll('.vsn-pin-action-btn').forEach(pinBtn => {
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pinId = pinBtn.getAttribute('data-pin-id');
        this.setPinnedId(pinId);
        // Re-render tức thì để thấy thay đổi ngay lập tức
        this.updateState();
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
  window.__VSN_NAV_MANAGER__ = manager;
  
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
    if (!window.__VSN_NAV_INITIALIZED__) {
      const header = document.querySelector('header.vsn-auto-nav') || document.querySelector('header#vsn-nav-header');
      if (header) {
        window.__VSN_NAV_INITIALIZED__ = true;
        initVsnNavigation();
      }
    }
  });
}
