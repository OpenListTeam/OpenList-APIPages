import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.resolve(__dirname, '../public')
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  fs.readFile(path.join(PUBLIC_DIR, p), (err, data) => {
    if (err) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' })
    res.end(data)
  })
})
await new Promise((r) => server.listen(4807, r))

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))

  await page.goto('http://localhost:4807/', { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForSelector('.ant-select-selector', { timeout: 10000 })

  const i18nState = await page.evaluate(() => {
    const hero = document.querySelector('.hero__title')
    const selectText = document.querySelector('.ant-select-selection-item')
    return {
      heroText: hero ? hero.textContent : 'NO HERO',
      selectText: selectText ? selectText.textContent : 'NO SELECT',
    }
  })

  await page.click('.ant-select-selector')
  await new Promise((r) => setTimeout(r, 800))

  const dd = await page.evaluate(() => {
    const el = document.querySelector('.ant-select-dropdown')
    if (!el) return { found: false }
    const r = el.getBoundingClientRect()
    return {
      found: true,
      top: Math.round(r.top), left: Math.round(r.left),
      inViewport: r.top >= 0 && r.top < innerHeight && r.left >= 0 && r.left < innerWidth,
      itemCount: el.querySelectorAll('.ant-select-item-option').length,
    }
  })

  console.log('I18N:', JSON.stringify(i18nState))
  console.log('DROPDOWN:', JSON.stringify(dd))
  console.log('PAGE_ERRORS:', errs.length ? errs.join('; ') : '(none)')
} finally {
  await browser.close()
  server.close()
}
