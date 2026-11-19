// Deterministic build assets. Original product photographs remain untouched.
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto'), sharp = require('sharp');
sharp.concurrency(2);
async function files(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(file));
    else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) result.push(file);
  }
  return result.sort();
}
(async () => {
  const manifest = {}, retained = new Set();
  const inputs = [...await files('public/images'), ...await files('public/catalog-assets')].sort();
  for (const input of inputs) {
    const bytes = await fs.readFile(input), metadata = await sharp(bytes).metadata();
    const rotatedWidth = metadata.orientation >= 5 ? metadata.height : metadata.width;
    if (!rotatedWidth) throw Error('Missing image width: ' + input);
    const widths = [...new Set([320, 640, 1280, Math.min(1280, rotatedWidth)].filter(width => width <= rotatedWidth))].sort((a, b) => a - b);
    const hash = crypto.createHash('sha256').update(bytes).update('webp80-autoOrient-v1-' + sharp.versions.sharp + '-' + sharp.versions.vips).digest('hex').slice(0, 12);
    const relative = path.relative('public', input).replaceAll(path.sep, '/');
    const base = relative.replace(/\.[^.]+$/, ''); const variants = [];
    for (const width of widths) {
      const output = path.join('public/optimized', `${base}.${hash}.${width}.webp`);
      retained.add(path.resolve(output)); await fs.mkdir(path.dirname(output), { recursive: true });
      try { await fs.access(output); } catch { await sharp(bytes).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(output); }
      const dimensions = await sharp(output).metadata();
      variants.push({ src: '/' + path.relative('public', output).replaceAll(path.sep, '/'), width: dimensions.width, height: dimensions.height });
    }
    manifest['/' + relative] = { hash, width: rotatedWidth, height: metadata.orientation >= 5 ? metadata.width : metadata.height, widths: variants.map(variant => variant.width) };
  }
  // Remove only obsolete generated assets under the owned output directory.
  for (const file of await files('public/optimized')) if (!retained.has(path.resolve(file))) await fs.unlink(file);
  await fs.mkdir('src/generated', { recursive: true });
  await fs.writeFile('src/generated/image-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Optimized ${inputs.length} bundled images; generated assets and manifest are reproducible.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
