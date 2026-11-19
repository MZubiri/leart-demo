// Production frontend with controlled HTTP data; backend authorization is tested separately.
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const { server } = require('./measure-catalog.cjs');
const focused = locator => locator.evaluate(element => element === document.activeElement);
async function until(check, label) {
  for (let i = 0; i < 100; i++) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 25)); }
  throw Error(label);
}
async function trap(page, dialog) {
  await dialog.waitFor();
  await until(() => dialog.evaluate(element => element.contains(document.activeElement)), 'Initial focus inside modal');
  const candidates = dialog.locator('button:not([disabled]),a[href],input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]');
  const tabbable = [];
  for (const element of await candidates.all()) if (await element.isVisible() && await element.evaluate(el => el.tabIndex >= 0)) tabbable.push(element);
  assert(tabbable.length, 'Dialog has reachable controls');
  const first = tabbable[0], last = tabbable.at(-1);
  await first.focus(); await page.keyboard.press('Shift+Tab'); await until(() => focused(last), 'Shift+Tab wraps to last');
  await last.focus(); await page.keyboard.press('Tab'); await until(() => focused(first), 'Tab wraps to first');
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
}
async function close(page, dialog, opener) {
  await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
  await until(() => focused(opener), 'Focus returns to the trigger');
  assert.equal(await opener.evaluate(element => !!element.closest('[inert]')), false);
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
}
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true }); const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => { localStorage.setItem('leart_admin_token', 'test-only-mocked-api-token'); localStorage.setItem('leart_admin_user', JSON.stringify({ username: 'Test', email: 'test@example.test', role: 'Admin' })); });
    const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(url + '/catalogo'); await page.locator('.product-card').first().waitFor();
    const quoteTrigger = page.getByRole('button', { name: 'Cotizar mi idea', exact: true });
    await quoteTrigger.focus(); await page.keyboard.press('Enter');
    const quote = page.getByRole('dialog', { name: 'Armar cotización', exact: true }); await trap(page, quote);
    assert(await quoteTrigger.evaluate(element => !!element.closest('[inert]')));
    await quote.getByRole('button', { name: /^Continuar/ }).press('Enter');
    await quote.getByRole('button', { name: 'Agregar una minifigura', exact: true }).waitFor();
    await quote.getByRole('button', { name: /^Continuar/ }).press('Enter');
    await quote.getByLabel('Ocasión', { exact: true }).waitFor();
    assert.equal(await page.locator('#occasion').count(), 1); assert.equal(await page.locator('#customizer-occasion').count(), 1);
    await trap(page, quote);
    await quote.getByLabel('Idea, nombres o requerimientos especiales').fill('Prueba de teclado');
    await quote.getByRole('button', { name: /^Agregar a cotización/ }).press('Enter');
    const cart = page.getByRole('dialog', { name: 'Cotización', exact: true }); await trap(page, cart);
    await cart.getByRole('button', { name: /^Aumentar cantidad/ }).press('Enter');
    await until(async () => (await cart.getByRole('heading').innerText()).includes('(2)'), 'Quotation quantity increases');
    await close(page, cart, quoteTrigger);
    const cartTrigger = page.getByRole('button', { name: 'Abrir cotización', exact: true });
    await cartTrigger.focus(); await page.keyboard.press('Enter'); await trap(page, cart); await close(page, cart, cartTrigger);
    await page.goto(url + '/admin/productos');
    const create = page.getByRole('button', { name: /Nuevo Producto/ }); await create.focus(); await page.keyboard.press('Enter');
    const product = page.getByRole('dialog', { name: 'Crear Nuevo Producto', exact: true }); await trap(page, product);
    await product.getByLabel('Imagen del Producto', { exact: true }).waitFor();
    assert.equal(await product.getByLabel('Subir imagen de producto JPEG PNG o WebP').getAttribute('type'), 'file');
    await close(page, product, create);
    const edit = page.getByRole('button', { name: 'Editar', exact: true }).first(); await edit.focus(); await page.keyboard.press('Enter');
    const editDialog = page.getByRole('dialog', { name: 'Editar Producto', exact: true }); await trap(page, editDialog); await close(page, editDialog, edit);
    await page.goto(url + '/admin/pedidos');
    const detail = page.getByRole('button', { name: 'Ver detalles', exact: true }); await detail.focus(); await page.keyboard.press('Enter');
    const order = page.getByRole('dialog', { name: 'Pedido: KEYBOARD-TEST', exact: true }); await trap(page, order); await close(page, order, detail);
    assert.deepEqual(errors, []); console.log('Keyboard: quote steps, cart transition and quantity, create/edit product, order detail, Tab/Shift+Tab, Escape, inert background and focus restoration passed.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
