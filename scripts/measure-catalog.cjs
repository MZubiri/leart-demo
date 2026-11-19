// Cold-cache local measurement; controlled API with the versioned initial catalog.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright'), ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('src/app/store/products.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const catalog = {}; new Function('exports', compiled)(catalog);
const root = path.resolve('dist/leart-demo/browser');
const settings = { storeName: 'Leart', whatsAppNumber: '573001112233', announcementText: 'Prueba local', instagramUrl: '', whatsAppQuoteTemplate: '{lines}', whatsAppPersonalizationTemplate: '{reference}' };
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const api = { '/api/public/products': catalog.PRODUCTS.filter(product => product.isActive !== false), '/api/public/settings': settings, '/api/public/pricing': require('../backend/Leart.Api/Data/pricing-rules.json') };
  response.setHeader('Cache-Control', 'no-store');
  if (Object.hasOwn(api, pathname)) { response.setHeader('Content-Type', 'application/json'); return response.end(JSON.stringify(api[pathname])); }
  let file = path.resolve(root, '.' + decodeURIComponent(pathname));
  if (!file.startsWith(root + path.sep)) file = path.join(root, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) file = path.join(root, 'index.html');
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); response.end(fs.readFileSync(file));
});
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.addInitScript(() => { window.__catalogLcp = 0; new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__catalogLcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); });
    const session = await context.newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: 200000, uploadThroughput: 93750 });
    await page.goto(`http://127.0.0.1:${server.address().port}/catalogo`, { waitUntil: 'domcontentloaded' });
    await page.locator('.product-card').first().waitFor();
    await page.waitForLoadState('networkidle', { timeout: 90000 }); await page.waitForTimeout(1000);
    const broken = await page.locator('img').evaluateAll(images => images.filter(image => image.complete && image.currentSrc && !image.naturalWidth).map(image => image.currentSrc));
    if (broken.length) throw Error('Broken image URLs: ' + broken.join(', '));
    console.log(JSON.stringify(await page.evaluate(() => {
      const images = performance.getEntriesByType('resource').filter(entry => entry.initiatorType === 'img');
      return { viewport: '390x844 DPR1', latencyMs: 80, downloadBytesPerSecond: 200000, cards: document.querySelectorAll('.product-card').length,
        imageRequests: images.length, imageEncodedBytes: images.reduce((sum, entry) => sum + entry.encodedBodySize, 0), lcpMs: Math.round(window.__catalogLcp),
        lazyImages: document.querySelectorAll('img[loading="lazy"]').length, responsiveImages: document.querySelectorAll('img[srcset]').length };
    })));
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
