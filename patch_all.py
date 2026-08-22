import re

js = open('main.js', 'r', encoding='utf-8').read()

# 1. Add showToast
if 'window.showToast =' not in js:
    js = js.replace("const btnDeleteNote = document.getElementById('btn-delete-note');",
    """const btnDeleteNote = document.getElementById('btn-delete-note');

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
};""")

# 2. Fix M^C array
old_arr = "['text-input', 'compressed-input', 'compressed-continuous-input', 'cvnss4-input', 'fake-viet-input', 'time-input', 'time5-input']"
new_arr = "['text-input', 'compressed-input', 'compressed-continuous-input', 'cvnss4-input', 'fake-viet-input', 'time-input', 'time-5-input', 'camel-case-input', 'no-accent-input']"
js = js.replace(old_arr, new_arr)

# 3. Context Menu Pos
# Wait, context menu pos was already committed maybe?
# The user's summary said: Context Menu UX Improved: Patched main.js so that if a textarea is too close to the top...
# Let's assume it's in there. I will leave it alone if it's there.
old_menu = """        const topPos = rect.top + window.scrollY - 40; // a bit above
        let leftPos = rect.right + window.scrollX - ctxMenu.offsetWidth;
        if (leftPos < 0) leftPos = rect.left + window.scrollX;
        
        ctxMenu.style.top = Math.max(10, topPos) + 'px';"""
new_menu = """        let topPos = rect.top + window.scrollY - 45; // a bit above
        if (rect.top < 60) {
          topPos = rect.bottom + window.scrollY + 8;
        }
        let leftPos = rect.right + window.scrollX - ctxMenu.offsetWidth;
        if (leftPos < 0) leftPos = rect.left + window.scrollX;
        
        ctxMenu.style.top = topPos + 'px';"""
if old_menu in js:
    js = js.replace(old_menu, new_menu)

# 4. Byte Compression Bars
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
js = js.replace(old_bars, new_bars)

# 5. camel-case and no-accent generation
clear_code = """      if (txtFakeViet) txtFakeViet.value = '';
      if (document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = '';
      if (document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = '';"""
js = js.replace("if (txtFakeViet) txtFakeViet.value = '';", clear_code)

def replace_set(match):
    indent = match.group(1)
    cond = match.group(2)
    val = match.group(3)
    return f"{indent}if({cond}) {cond}.value = {val};\n{indent}if(document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = typeof toCamelCase === 'function' ? toCamelCase(txtDecrypted ? txtDecrypted.value : '') : '';\n{indent}if(document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = typeof toNoAccentContinuous === 'function' ? toNoAccentContinuous(txtDecrypted ? txtDecrypted.value : '') : '';"

js = re.sub(r"^(\s*)if\s*\((txtFakeViet)\)\s*\2\.value\s*=\s*(.*?toFakeViet.*?);", replace_set, js, flags=re.MULTILINE)

open('main.js', 'w', encoding='utf-8').write(js)
print("Applied all fixes")
