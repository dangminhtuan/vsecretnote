const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Rewrite updateContinuousBox to protect cursor
const oldUpdateContinuousBoxRegex = /function updateContinuousBox\(\) \{[\s\S]*?\}/;
const newUpdateContinuousBox = `function updateContinuousBox() {
  if (txtCompressed && txtCompressedContinuous) {
    if (document.activeElement !== txtCompressedContinuous) {
      txtCompressedContinuous.value = txtCompressed.value.replace(/\\s+/g, '');
    }
  }
}`;

if (code.match(oldUpdateContinuousBoxRegex)) {
  code = code.replace(oldUpdateContinuousBoxRegex, newUpdateContinuousBox);
} else {
  // If not found, just append it
  code += '\n' + newUpdateContinuousBox;
}

// 2. Inject into renderBreakdown
const renderBreakdownTarget = "function renderBreakdown(pairs) {";
const renderBreakdownNew = "function renderBreakdown(pairs) {\n  if (typeof updateContinuousBox === 'function') updateContinuousBox();";
if (!code.includes("if (typeof updateContinuousBox === 'function') updateContinuousBox();")) {
  code = code.replace(renderBreakdownTarget, renderBreakdownNew);
}

// 3. Remove the buggy inline injections I added previously
code = code.replace(/if \(typeof updateContinuousBox === 'function'\) updateContinuousBox\(\);/g, (match, offset) => {
  // Keep only the first occurrence (which is inside renderBreakdown)
  return code.indexOf(match) === offset ? match : '';
});

// Clean up weird double spacing caused by previous replaces
code = code.replace(/renderBreakdown\(breakdownPairs\);\s*/g, "renderBreakdown(breakdownPairs);\n  ");

fs.writeFileSync('main.js', code);
console.log('Fixed continuous box sync logic');
