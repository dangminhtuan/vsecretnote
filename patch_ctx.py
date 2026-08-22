import re

js = open('main.js', 'r', encoding='utf-8').read()

old_logic = """          // Position it near the top-right of the textarea, accounting for scroll
          const topPos = rect.top + window.scrollY - 40; // a bit above
          let leftPos = rect.right + window.scrollX - ctxMenu.offsetWidth;
          if (leftPos < 0) leftPos = rect.left + window.scrollX;
          
          ctxMenu.style.top = Math.max(10, topPos) + 'px';
          ctxMenu.style.left = leftPos + 'px';"""

new_logic = """          // Smart UX: Position it near the top-right, but avoid overlapping the top menu
          let topPos = rect.top + window.scrollY - 45; 
          if (rect.top < 60) {
            // Not enough room above, put it below the textarea
            topPos = rect.bottom + window.scrollY + 8;
          }
          let leftPos = rect.right + window.scrollX - ctxMenu.offsetWidth;
          if (leftPos < 0) leftPos = rect.left + window.scrollX;
          
          ctxMenu.style.top = topPos + 'px';
          ctxMenu.style.left = leftPos + 'px';"""

if old_logic in js:
    js = js.replace(old_logic, new_logic)
    open('main.js', 'w', encoding='utf-8').write(js)
    print("Patched context menu positioning.")
else:
    print("Could not find the exact old_logic.")
