const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  console.log('Clicking Sandbox button...');
  await page.click('#btn-playground').catch(e => console.log('Click error:', e.message));
  await new Promise(r => setTimeout(r, 1000));
  const isSandbox = await page.evaluate(() => document.body.classList.contains('sandbox-mode'));
  console.log('Is sandbox mode:', isSandbox);
  await browser.close();
})();
