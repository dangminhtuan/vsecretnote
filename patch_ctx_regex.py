import re

js = open('main.js', 'r', encoding='utf-8').read()

pattern = r"(const topPos = rect\.top \+ window\.scrollY - 40; // a bit above\s*let leftPos = rect\.right \+ window\.scrollX - ctxMenu\.offsetWidth;\s*if \(leftPos < 0\) leftPos = rect\.left \+ window\.scrollX;\s*ctxMenu\.style\.top = Math\.max\(10, topPos\) \+ 'px';)"

replacement = """let topPos = rect.top + window.scrollY - 45; // a bit above
          if (rect.top < 60) {
            topPos = rect.bottom + window.scrollY + 8;
          }
          let leftPos = rect.right + window.scrollX - ctxMenu.offsetWidth;
          if (leftPos < 0) leftPos = rect.left + window.scrollX;
          
          ctxMenu.style.top = topPos + 'px';"""

new_js = re.sub(pattern, replacement, js)

if new_js != js:
    open('main.js', 'w', encoding='utf-8').write(new_js)
    print("Patched.")
else:
    print("Failed to match.")
