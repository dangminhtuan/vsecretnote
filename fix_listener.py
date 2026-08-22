import sys

with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

wrong_block = """
if (txtCVNSS4) {
  txtCVNSS4.addEventListener('input', () => {
    syncFromCVNSS4();
    logActivity({ type: 'edit', field: 'cvnss4' });
  });
}
"""

if wrong_block in content:
    content = content.replace(wrong_block, "")

# Now find where to put it
target = "if (txtDecrypted) txtDecrypted.addEventListener('input', syncFromDecrypted);"

new_block = """
  if (txtCVNSS4) {
    txtCVNSS4.addEventListener('input', () => {
      syncFromCVNSS4();
      logActivity({ type: 'edit', field: 'cvnss4' });
    });
  }
"""

if "txtCVNSS4.addEventListener('input'" not in content:
    content = content.replace(target, new_block + "\n  " + target)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed listener placement in main.js")
