const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    console.log("btnPlayground exists?", !!document.getElementById('btn-playground'));
    document.getElementById('btn-playground').click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const isSandbox = await page.evaluate(() => document.body.classList.contains('sandbox-mode'));
  console.log('Is sandbox mode after click:', isSandbox);
  await browser.close();
})();
