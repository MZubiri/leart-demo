const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const folder = process.argv[2];
  const output = process.argv[3];
  const files = (await fs.readdir(folder)).filter((file) => /\.(png|jpe?g|webp)$/i.test(file));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
  const tiles = (await Promise.all(files.map(async (file) => {
    const extension = path.extname(file).toLowerCase();
    const mime = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : extension === '.webp' ? 'image/webp' : 'image/png';
    const data = (await fs.readFile(path.join(folder, file))).toString('base64');
    return `<figure><img src="data:${mime};base64,${data}"><figcaption>${file.slice(0, 8)}</figcaption></figure>`;
  }))).join('');
  await page.setContent(`<style>body{margin:0;padding:20px;background:#ddd;font:16px Arial}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}figure{margin:0;background:#fff;border:1px solid #222;padding:8px}img{width:100%;height:220px;object-fit:contain;display:block}figcaption{text-align:center;margin-top:6px;font-weight:bold}</style><div class="grid">${tiles}</div>`);
  await page.screenshot({ path: output, fullPage: true });
  await browser.close();
})();
