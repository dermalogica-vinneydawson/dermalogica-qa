const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['Pixel 5']);
  const page = await context.newPage();
  
  await page.goto('https://www.dermalogica.com/');
  const searchIcons = page.locator('[data-search-toggle], details-modal.header__search summary, .header__icon--search, button[aria-label*="Search"], a[href="/search"]');
  
  for (let i = 0; i < await searchIcons.count(); i++) {
    try {
      await searchIcons.nth(i).click({ timeout: 5000 });
      break;
    } catch {}
  }
  
  await page.waitForTimeout(3000); // let drawer open
  
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      name: i.name,
      id: i.id,
      className: i.className,
      placeholder: i.placeholder,
      visible: i.offsetWidth > 0 && i.offsetHeight > 0
    }));
  });
  
  console.log(JSON.stringify(inputs.filter(i => i.visible), null, 2));
  
  await browser.close();
})();
