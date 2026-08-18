const fs = require('fs');
let text = fs.readFileSync('data.js', 'utf8');
if (!text.includes('"lồn"') && !text.includes("'lồn'")) {
  text = text.replace(/"\\u00e0n"\];/, '"\\u00e0n", "lồn"];');
  fs.writeFileSync('data.js', text);
  console.log('Successfully added word to data.js');
} else {
  console.log('Word already exists');
}
