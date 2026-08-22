import sys
import re

def patch_html():
    html = open('dict.html', 'r', encoding='utf-8').read()
    
    html = html.replace('th:nth-child(5), th:nth-child(6) { width: 100px; }', 'th:nth-child(6), th:nth-child(7) { width: 90px; }')
    html = html.replace('th:nth-child(2) { width: 25%; }', 'th:nth-child(2) { width: 20%; }')
    html = html.replace('th:nth-child(3) { width: 15%; }', 'th:nth-child(3) { width: 12%; }')
    html = html.replace('th:nth-child(4) { width: 15%; }', 'th:nth-child(4) { width: 12%; }\n    th:nth-child(5) { width: 12%; }')
    html = html.replace('th:nth-child(5) { width: 150px; }', 'th:nth-child(6) { width: 120px; }')
    html = html.replace('th:nth-child(6) { width: 150px; }', 'th:nth-child(7) { width: 120px; }')
    
    th_block = """          <th>
            <div class="th-title" data-sort="toneName">Dấu <span class="sort-icon" id="sort-icon-toneName"></span></div>
            <div class="ms-container" id="ms-tone">
              <div class="ms-header" id="ms-tone-header">Tất cả</div>
              <div class="ms-dropdown" id="ms-tone-dropdown">
                <input type="text" class="ms-search" id="ms-tone-search" placeholder="Tìm..." />
                <div class="ms-options" id="ms-tone-options">
                  <!-- Checkboxes JS -->
                </div>
              </div>
            </div>
          </th>
"""
    # Insert before <div class="th-title" data-sort="enc">
    if 'data-sort="toneName"' not in html:
        idx = html.find('<div class="th-title" data-sort="enc">')
        th_idx = html.rfind('<th', 0, idx)
        if th_idx != -1:
            html = html[:th_idx] + th_block + html[th_idx:]
    
    open('dict.html', 'w', encoding='utf-8').write(html)

def patch_js():
    js = open('dict.js', 'r', encoding='utf-8').read()
    
    tone_defs = """
const TONE_NAMES = {
  0: "Bằng",
  1: "Sắc",
  2: "Huyền",
  3: "Hỏi",
  4: "Ngã",
  5: "Nặng"
};
const allTones = ["Bằng", "Sắc", "Huyền", "Hỏi", "Ngã", "Nặng"];
let selectedTones = new Set();
"""
    if "selectedTones =" not in js:
        js = js.replace('let selectedRhymes = new Set();', 'let selectedRhymes = new Set();\n' + tone_defs)
        
    if "initMultiSelect('ms-tone'" not in js:
        js = js.replace("initMultiSelect('ms-rhyme', allRhymes, selectedRhymes);", 
                        "initMultiSelect('ms-rhyme', allRhymes, selectedRhymes);\n    initMultiSelect('ms-tone', allTones, selectedTones);")
                        
    if "item.toneName" not in js:
        js = js.replace("rhyme: ph.rhyme,", "rhyme: ph.rhyme,\n        toneName: TONE_NAMES[ph.tone],")
        
    if "selectedTones.has" not in js:
        js = js.replace("if (selectedRhymes.size > 0 && !selectedRhymes.has(item.rhyme)) return false;",
                        "if (selectedRhymes.size > 0 && !selectedRhymes.has(item.rhyme)) return false;\n      if (selectedTones.size > 0 && !selectedTones.has(item.toneName)) return false;")
                        
    if "<td style=\"color: #888;\">${item.rhyme}</td>" in js:
        js = js.replace("<td style=\"color: #888;\">${item.rhyme}</td>",
                        "<td style=\"color: #888;\">${item.rhyme}</td>\n        <td style=\"color: #888;\">${item.toneName || '-'}</td>")
                        
    if "document.getElementById('ms-tone').classList.remove('open');" not in js:
        js = js.replace("if (!e.target.closest('#ms-rhyme')) document.getElementById('ms-rhyme').classList.remove('open');",
                        "if (!e.target.closest('#ms-rhyme')) document.getElementById('ms-rhyme').classList.remove('open');\n  if (!e.target.closest('#ms-tone')) document.getElementById('ms-tone').classList.remove('open');")
                        
    open('dict.js', 'w', encoding='utf-8').write(js)

patch_html()
patch_js()
print("Done")
