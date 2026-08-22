import re

html = open('index.html', 'r', encoding='utf-8').read()

# The goal is to move the compressed-continuous-input div right after the text-input textarea.
# First, let's find the text-input block
text_input_pattern = r'(<div class="input-group"[^>]*>\s*<div class="label-row">\s*<label for="text-input">.*?</textarea>\s*</div>)'
# Wait, the structure in index.html is:
# <div class="input-group"> ... </div>
# <textarea id="text-input" ...></textarea>
# No! Let's just find `</textarea>\s*</div>` maybe? Wait. I'd better be precise.
