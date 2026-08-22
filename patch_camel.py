import re

js = open('main.js', 'r', encoding='utf-8').read()

# Helper functions
helpers = """function removeAccents(str) {
  return str.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
function toCamelCase(str) {
  const words = str.trim().split(/\\s+/);
  if (words.length === 0 || !words[0]) return '';
  const first = words[0].charAt(0).toLowerCase() + words[0].slice(1);
  const rest = words.slice(1).map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '');
  return first + rest.join('');
}
function toNoAccent(str) {
  return removeAccents(str).replace(/\\s+/g, '').toLowerCase();
}
"""

if 'function toCamelCase(' not in js:
    js = js.replace('// ===== FAKE VIETNAMESE & 5 DIGITS LOGIC =====', helpers + '\n// ===== FAKE VIETNAMESE & 5 DIGITS LOGIC =====')

# Now, we need to inject the updates. We can just replace `if (txtFakeViet)` or similar.
# There are 5 places where we need to clear them.
clear_code = """      if (txtFakeViet) txtFakeViet.value = '';
      if (document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = '';
      if (document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = '';"""
js = js.replace("if (txtFakeViet) txtFakeViet.value = '';", clear_code)

# And 5 places where we need to set them. They are always set based on `txtDecrypted.value` or `text` or `rawText`.
# Let's dynamically patch by replacing `if(txtFakeViet) txtFakeViet.value = toFakeViet(text);`
# Note: Sometimes it's `toFakeViet(txtDecrypted.value)` or `toFakeViet(rawText)`
def replace_set(match):
    indent = match.group(1)
    cond = match.group(2)
    val = match.group(3)
    return f"{indent}if({cond}) {cond}.value = {val};\n{indent}if(document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = typeof toCamelCase === 'function' ? toCamelCase(txtDecrypted ? txtDecrypted.value : '') : '';\n{indent}if(document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = typeof toNoAccent === 'function' ? toNoAccent(txtDecrypted ? txtDecrypted.value : '') : '';"

js = re.sub(r"^(\s*)if\s*\((txtFakeViet)\)\s*\2\.value\s*=\s*(.*?toFakeViet.*?);", replace_set, js, flags=re.MULTILINE)

open('main.js', 'w', encoding='utf-8').write(js)
print("Patched camelCase and noAccent logic.")
