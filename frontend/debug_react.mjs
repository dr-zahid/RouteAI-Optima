import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', exception => {
    console.log('BROWSER UNCAUGHT EXCEPTION:', exception);
  });

  await page.goto('http://localhost:5173');
  await page.fill('input[placeholder="Origin — city, state or address"]', 'pahaska tepee');
  await page.fill('input[placeholder="Destination — city, state or address"]', 'Affton');
  await page.click('button[type="submit"]');
  
  // wait up to 10 seconds for the request to complete
  await page.waitForTimeout(10000);
  await browser.close();
})();
