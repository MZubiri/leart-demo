const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const designs = [
  { slug: 'sets', pages: 10, url: 'https://www.canva.com/design/DAG-7MxZhI8/cnyEJmFekgnPCJDcgJupfA/view' },
  { slug: 'minibox', pages: 1, url: 'https://www.canva.com/design/DAHVCZUXbbM/wH46V5-Q7copu_1s2t3oTA/view' },
  { slug: 'minifiguras', pages: 49, url: 'https://www.canva.com/design/DAGmDWpe4LE/_-ZpiLje1I7qJAqg0YuWYw/view#1' },
  { slug: 'proceso', pages: 2, url: 'https://www.canva.com/design/DAG-7eBTSuk/miD9QrlCbkaY7MLIZ4O8_w/view' }
];

const root = path.resolve(__dirname, '..', 'public', 'catalog-assets');

function assetId(url) {
  const uri = decodeURIComponent(url).match(/M\/([a-f0-9-]{20,})/i)?.[1];
  return uri || crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
}

async function run() {
  await fs.mkdir(root, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const manifest = [];
  const downloaded = new Map();

  for (const design of designs) {
    const page = await context.newPage();
    await page.goto(design.url, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForTimeout(1000);
    const designDir = path.join(root, design.slug);
    await fs.mkdir(designDir, { recursive: true });

    for (let pageNumber = 1; pageNumber <= design.pages; pageNumber += 1) {
      await page.waitForTimeout(350);
      const text = (await page.locator('body').innerText()).replace(/\n{3,}/g, '\n\n');
      const domImages = await page.locator('img').evaluateAll((nodes) => nodes
        .map((node) => ({
          src: node.currentSrc || node.src,
          width: node.naturalWidth,
          height: node.naturalHeight,
          alt: node.alt || ''
        }))
        .filter((image) => image.src.startsWith('https://media.canva.com/') && image.width >= 120 && image.height >= 120));
      const resourceImages = await page.evaluate(() => performance.getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((url) => url.startsWith('https://media.canva.com/'))
        .map((src) => {
          const width = Number(src.match(/\/width:(\d+)/)?.[1] || 0);
          const height = Number(src.match(/\/height:(\d+)/)?.[1] || 0);
          return { src, width, height, alt: '' };
        })
        .filter((image) => image.width >= 120 && image.height >= 120));
      const byId = new Map();
      for (const image of [...resourceImages, ...domImages]) {
        const id = assetId(image.src);
        const previous = byId.get(id);
        if (!previous || image.width * image.height > previous.width * previous.height) byId.set(id, image);
      }
      const images = [...byId.values()];

      const pageAssets = [];
      for (const image of images) {
        const id = assetId(image.src);
        const pixels = image.width * image.height;
        const previous = downloaded.get(id);
        let relativePath = previous?.path;
        if (!previous || pixels > previous.pixels) {
          const response = await context.request.get(image.src);
          if (!response.ok()) continue;
          const type = response.headers()['content-type'] || 'image/png';
          const extension = type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : 'png';
          const filename = `${id}.${extension}`;
          relativePath = `/catalog-assets/${design.slug}/${filename}`;
          await fs.writeFile(path.join(designDir, filename), await response.body());
          downloaded.set(id, { path: relativePath, pixels });
        }
        if (!pageAssets.some((asset) => asset.path === relativePath)) pageAssets.push({ path: relativePath, ...image });
      }

      manifest.push({ design: design.slug, page: pageNumber, title: await page.title(), text, assets: pageAssets });
      process.stdout.write(`${design.slug} ${pageNumber}/${design.pages}: ${pageAssets.length} assets\n`);
      await page.evaluate(() => performance.clearResourceTimings());

      if (pageNumber < design.pages) {
        const next = page.getByRole('button', { name: 'Next page' });
        await next.click();
      }
    }
    await page.close();
  }

  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
