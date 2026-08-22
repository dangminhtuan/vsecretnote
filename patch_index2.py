import sys

content = open('index.html', 'r', encoding='utf-8').read()

button_html = '''<button id="btn-multi-copy" class="cyber-btn" style="border-color: #0ff; color: #0ff; background: #000; cursor: pointer; padding: 4px 10px; letter-spacing: 1px; white-space: nowrap; line-height: 1.3; text-align: center;"><span style="display:block;font-size:0.85em;">[m^C]</span><span style="display:block;font-size:0.75em;">BATCH</span></button>'''

target = '<button id="btn-sandbox-clear"'
if button_html not in content:
    content = content.replace(target, button_html + '\n          ' + target)

bar_ui = '''
              <div id="compression-bars-container" style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px; margin-bottom: 12px; width: 100%; border: 1px solid #333; padding: 8px; background: rgba(0, 20, 0, 0.5);">
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888; font-family: monospace;">
                  <span>Tiếng Việt Gốc</span>
                  <span id="bar-raw-text">0 Bytes</span>
                </div>
                <div style="width: 100%; height: 6px; background: #222; border-radius: 3px; overflow: hidden;">
                  <div id="bar-raw-fill" style="width: 0%; height: 100%; background: #f55; transition: width 0.3s ease;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888; font-family: monospace; margin-top: 4px;">
                  <span>VCOMP Base60</span>
                  <span id="bar-comp-text">0 Bytes</span>
                </div>
                <div style="width: 100%; height: 6px; background: #222; border-radius: 3px; overflow: hidden;">
                  <div id="bar-comp-fill" style="width: 0%; height: 100%; background: #0f0; transition: width 0.3s ease;"></div>
                </div>
              </div>
'''

target_text_input = '<textarea id="text-input" placeholder="Nhập văn bản cần mã hóa..." spellcheck="false"></textarea>'

content = content.replace(' <span id="compression-stats" style="color:#0f0; font-size:12px; font-weight:normal; margin-left:10px;"></span>', '')

if 'compression-bars-container' not in content:
    content = content.replace(target_text_input, target_text_input + bar_ui)

open('index.html', 'w', encoding='utf-8').write(content)
print("Updated index.html")
