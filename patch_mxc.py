import re

js = open('main.js', 'r', encoding='utf-8').read()

# Fix 1: Add window.showToast if missing
if 'window.showToast =' not in js:
    js = js.replace('const btnDeleteNote = document.getElementById(\'btn-delete-note\');',
    '''const btnDeleteNote = document.getElementById('btn-delete-note');

window.showToast = function(msg) {
  const container = document.getElementById('exp-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'exp-toast';
  toast.textContent = msg;
  toast.style.color = '#0ff';
  toast.style.borderColor = '#0ff';
  toast.style.backgroundColor = 'rgba(0, 50, 50, 0.9)';
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2000);
};''')

# Fix 2: M^C array
old_arr = "['text-input', 'compressed-input', 'compressed-continuous-input', 'cvnss4-input', 'fake-viet-input', 'time-input', 'time5-input']"
new_arr = "['text-input', 'compressed-input', 'compressed-continuous-input', 'cvnss4-input', 'fake-viet-input', 'time-input', 'time-5-input', 'camel-case-input', 'no-accent-input']"
if old_arr in js:
    js = js.replace(old_arr, new_arr)

# Fix 3: Compression Bars UI
old_bars = """        const labelRow = group.querySelector('.label-row');
        if (labelRow) {
           barContainer.style.marginTop = '0';
           barContainer.style.flex = '1';
           barContainer.style.justifyContent = 'flex-end';
           labelRow.appendChild(barContainer);
        } else {
           group.appendChild(barContainer);
        }"""
new_bars = """        // Always append below the textarea
        barContainer.style.marginTop = '2px';
        barContainer.style.marginBottom = '8px';
        barContainer.style.justifyContent = 'flex-end';
        group.insertBefore(barContainer, ta.nextSibling);"""
if old_bars in js:
    js = js.replace(old_bars, new_bars)

open('main.js', 'w', encoding='utf-8').write(js)
print("Patched main.js")
