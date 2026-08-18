const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('vsecret_notes', JSON.stringify([{id: 'note_123', content: 'hello', createdAt: Date.now()}]));
  });
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  const isSandbox = await page.evaluate(() => document.body.classList.contains('sandbox-mode'));
  console.log('Is default sandbox mode with data:', isSandbox);
  await browser.close();
})();
