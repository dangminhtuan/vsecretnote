const fs = require('fs');
let vcomp = fs.readFileSync('vcomp.js', 'utf8');
let data = fs.readFileSync('data.js', 'utf8');
vcomp = vcomp.replace(/export /g, '').replace(/import .* from .*/g, '');
data = data.replace(/export /g, '').replace(/import .* from .*/g, '');

const code = data + '\n' + vcomp + '\nconsole.log(base60ToTime("LLE"));';
fs.writeFileSync('temp.js', code);
