const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const buggyStr = `  });
}
        return;
      }

      // Xác định giờ thiêng mục tiêu`;

const fixedStr = `  });
}

      // Xác định giờ thiêng mục tiêu`;

code = code.replace(buggyStr, fixedStr);
fs.writeFileSync('main.js', code);
console.log('Fixed extra brace');
