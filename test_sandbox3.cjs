const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  const isSandbox = await page.evaluate(() => document.body.classList.contains('sandbox-mode'));
  console.log('Is default sandbox mode:', isSandbox);
  await browser.close();
})();
