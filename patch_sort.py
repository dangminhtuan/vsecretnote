import sys

js = open('dict.js', 'r', encoding='utf-8').read()

old_sort = """      let valA = a[sortCol];
      let valB = b[sortCol];"""

new_sort = """      let valA = sortCol === 'toneName' ? a.tone : a[sortCol];
      let valB = sortCol === 'toneName' ? b.tone : b[sortCol];"""

if old_sort in js:
    js = js.replace(old_sort, new_sort)

open('dict.js', 'w', encoding='utf-8').write(js)
print("Done")
