import { expect, test } from '@playwright/test';
import { state, taka } from '../helpers';

// Browsing and the cart. Runs on a desktop browser and on a phone-sized one.

test('the home page shows products and the shop lists them', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Bunon/);
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();

  await page.goto('/shop');
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
});

test('a product page changes price with the size, and the cart adds, counts and removes', async ({ page }) => {
  const p = state.product;
  await page.goto(`/product/${p.slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.name);
  const price = page.locator('.pdp-price');
  await expect(price).toHaveText(`৳${p.price.toLocaleString('en-US')}`);

  // A bigger size costs more.
  const sizes = page.locator('.sizes button');
  await sizes.nth(1).click();
  await expect.poll(async () => taka(await price.innerText())).toBeGreaterThan(p.price);
  await sizes.nth(0).click();

  await page.locator('.buy-row').getByRole('button', { name: 'Add to Cart' }).click();
  const drawer = page.locator('.drawer-panel');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(p.name.slice(0, 20))).toBeVisible();
  const subtotal = drawer.locator('.drawer-foot .sum-line span').last();
  await expect(subtotal).toHaveText(`৳${p.price.toLocaleString('en-US')}`);

  await drawer.getByRole('button', { name: 'Increase' }).click();
  await expect(subtotal).toHaveText(`৳${(p.price * 2).toLocaleString('en-US')}`);

  await drawer.getByRole('button', { name: 'Remove' }).click();
  await expect(drawer.getByText('Your cart is empty.')).toBeVisible();
});
