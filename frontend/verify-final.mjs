import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto('http://localhost:4789/', { waitUntil: 'networkidle0' });
  
  // 点击选择器
  await page.waitForSelector('.ant-select-selector', { timeout: 5000 });
  await page.click('.ant-select-selector');
  await page.waitForTimeout(500);
  
  // 检查下拉层位置
  const dropdown = await page.evaluate(() => {
    const el = document.querySelector('.ant-select-dropdown');
    if (!el) return { found: false };
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      found: true,
      display: style.display,
      opacity: style.opacity,
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      inViewport: rect.top >= 0 && rect.top < window.innerHeight && rect.left >= 0 && rect.left < window.innerWidth,
      itemCount: el.querySelectorAll('.ant-select-item-option').length
    };
  });
  
  console.log(JSON.stringify(dropdown, null, 2));
  
  await browser.close();
})().catch(err => {
  console.error('ERR:', err.message);
  process.exit(1);
});
