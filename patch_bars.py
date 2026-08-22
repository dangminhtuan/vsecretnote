import re

js = open('main.js', 'r', encoding='utf-8').read()

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

open('main.js', 'w', encoding='utf-8').write(js)
print("Patched bars")
