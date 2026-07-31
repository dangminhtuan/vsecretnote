
// executed directly as module
const keyboardContainer = document.getElementById('keyboardContainer');
const keyboardWrapper = document.getElementById('keyboardWrapper');
const demoInput = document.getElementById('demoInput');
const chatMessages = document.getElementById('chatMessages');

setInterval(() => {
    const d = new Date();
    const el = document.getElementById('statusTime');
    if (el) el.textContent = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}, 1000);

// Bắt sự kiện Copy từ các nút copy giả lập trong chat
document.querySelectorAll('.chat-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const text = e.target.parentElement.querySelector('div').textContent;
        // Copy vào clipboard của bàn phím
        if (window.snk && window.snk.addTemporaryNote) {
            window.snk.addTemporaryNote(text);
            
            // Hiệu ứng copy thành công
            const origBg = btn.style.background;
            btn.style.background = '#4CAF50';
            btn.style.color = 'white';
            setTimeout(() => {
                btn.style.background = origBg;
                btn.style.color = 'black';
            }, 1000);
        }
    });
});

window.snk = new window.SecretNoteKeyboard({ 
    theme: 'android',
    placement: 'custom-div',
    bindMode: 'global'
});
if (window.snk.container && keyboardContainer) {
    keyboardContainer.appendChild(window.snk.container);
}

// Override hide to sync the wrapper container
const originalHide = window.snk.hide.bind(window.snk);
window.snk.hide = function() {
    originalHide();
    if (keyboardContainer && keyboardContainer.style.display === 'flex') {
        keyboardContainer.style.transform = 'translateY(100%)';
        const appContent = document.querySelector('.app-content');
        if (appContent) appContent.style.paddingBottom = '0px';
        setTimeout(() => {
            keyboardContainer.style.display = 'none';
        }, 300);
        if (demoInput) demoInput.blur();
    }
};

if (demoInput) {
    demoInput.addEventListener('focus', () => {
        keyboardContainer.style.display = 'flex';
        setTimeout(() => {
            keyboardContainer.style.transform = 'translateY(0)';
            const appContent = document.querySelector('.app-content');
            if (appContent) {
                appContent.style.transition = 'padding-bottom 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                appContent.style.paddingBottom = keyboardContainer.offsetHeight + 'px';
            }
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 50);
        }, 10);
        
        if (window.snk) {
            window.snk.activeTarget = demoInput;
            window.snk.show();
            // FORCE APPEND to ensure it's contained!
            if (window.snk.container) {
                keyboardContainer.appendChild(window.snk.container);
            }
        }
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 300);
    });
}

if (chatMessages) {
    chatMessages.addEventListener('click', () => {
        if (keyboardContainer && keyboardContainer.style.display === 'flex') {
            keyboardContainer.style.transform = 'translateY(100%)';
            const appContent = document.querySelector('.app-content');
            if (appContent) appContent.style.paddingBottom = '0px';
            setTimeout(() => {
                keyboardContainer.style.display = 'none';
            }, 300);
            demoInput.blur();
            if (window.snk) window.snk.hide();
        }
    });
}

// Prevent default context menu on long press in touch emulation
document.addEventListener('contextmenu', event => {
    // Cho phép menu hiện lên ở ô nhập liệu nếu cần, nhưng cấm ở khu vực bàn phím và các note
    if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
    }
});
