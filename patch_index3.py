import sys
import re

content = open('index.html', 'r', encoding='utf-8').read()

# Remove the old static bars
bar_pattern = r'<div id="compression-bars-container".*?</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>'
content = re.sub(r'<div id="compression-bars-container".*?(?=\s*</div>\s*<div class="controls">)', '', content, flags=re.DOTALL)
content = re.sub(r'<div id="compression-bars-container"[\s\S]*?(?=\s*</div>\s*</div>\s*<div class="controls">)', '', content)
# Just use standard string manipulation to be safer
start_idx = content.find('<div id="compression-bars-container"')
if start_idx != -1:
    end_idx = content.find('</div>\n              </div>\n  \n            </div>\n            \n            <div class="controls">')
    # wait, it's easier to just do a strict replace
    pass

# I'll just regex the block
content = re.sub(r'<div id="compression-bars-container"[\s\S]*?</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>', '', content)
content = re.sub(r'<div id="compression-bars-container"[\s\S]*?(?=</textarea>\s*</div>\s*<div class="controls">)', '', content)
# wait, it was inserted AFTER the textarea, BEFORE the closing div of input-group.
content = re.sub(r'</textarea>\s*<div id="compression-bars-container".*?(?=\s*</div>\s*<div class="controls">)', '</textarea>', content, flags=re.DOTALL)


# Add new input boxes
new_boxes = '''
            <!-- Tiếng Việt camelCase -->
            <div class="input-group">
              <div class="label-row">
                <label for="camel-case-input">TIẾNG VIỆT CAMELCASE [TAG]</label>
              </div>
              <textarea id="camel-case-input" placeholder="víDụNhưThếNày..." spellcheck="false"></textarea>
            </div>
  
            <!-- Tiếng Việt Không Dấu Liền -->
            <div class="input-group">
              <div class="label-row">
                <label for="no-accent-input">KHÔNG DẤU LIỀN [TAG]</label>
              </div>
              <textarea id="no-accent-input" placeholder="vidunhuthenay..." spellcheck="false"></textarea>
            </div>
'''
if 'camel-case-input' not in content:
    content = content.replace('<!-- Time Encrypted -->', new_boxes + '\n            <!-- Time Encrypted -->')

open('index.html', 'w', encoding='utf-8').write(content)
print("Updated index.html")
