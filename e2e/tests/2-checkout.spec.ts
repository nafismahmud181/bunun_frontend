import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { newPhone, state, taka } from '../helpers';

// A shopper buys with Cash on Delivery to Dhanmondi, Dhaka, using the test coupon. The order is
// handed to admin.spec.ts (saved in e2e/.order.json).

const DELIVERY_INSIDE_DHAKA = 70;

test('checkout with cash on delivery, a coupon, then tracking the order', async ({ page }) => {
  const p = state.product;
  const phone = newPhone();

  await page.goto(`/product/${p.slug}`);
  await page.locator('.buy-row').getByRole('button', { name: 'Add to Cart' }).click();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();

  await page.getByPlaceholder('Full name').fill('Rahima Begum');
  await page.getByPlaceholder('Mobile number (01XXXXXXXXX)').fill(phone);
  await page.getByLabel('Division').selectOption({ label: 'Dhaka' });
  await page.getByLabel('District').selectOption({ label: 'Dhaka' });
  await page.getByLabel('Area / thana').selectOption({ label: 'Dhanmondi' });
  await page.getByPlaceholder('House, road, block / village').fill('House 7, Road 3');

  // Delivery inside Dhaka, and the total.
  const summary = page.locator('.summary');
  const line = (label: string) => summary.locator('.sum-line', { hasText: label }).locator('span').last();
  await expect(line('Delivery charge')).toHaveText(`৳${DELIVERY_INSIDE_DHAKA}`);
  await expect(line('Total')).toHaveText(`৳${(p.price + DELIVERY_INSIDE_DHAKA).toLocaleString('en-US')}`);

  // A code that doesn't exist is refused, and can be removed.
  await page.getByLabel('Coupon code').fill('NOPE123');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(summary.getByRole('alert')).toContainText("isn't valid");
  await summary.locator('.coupon-error').getByRole('button', { name: 'Remove' }).click();

  // The test coupon takes 10% off the items.
  const discount = Math.round((p.price * state.coupon.percent) / 100);
  await page.getByLabel('Coupon code').fill(state.coupon.code.toLowerCase());
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(summary.locator('.coupon-applied')).toContainText(state.coupon.code);
  await expect(line(`Coupon ${state.coupon.code}`)).toHaveText(`−৳${discount.toLocaleString('en-US')}`);
  const total = p.price - discount + DELIVERY_INSIDE_DHAKA;
  await expect(line('Total')).toHaveText(`৳${total.toLocaleString('en-US')}`);

  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.getByRole('heading', { name: /received your order/ })).toBeVisible();
  const confirmation = await page.getByText(/Order #/).innerText();
  const orderNo = /BN-\d{4}-\d+/.exec(confirmation)?.[0] ?? '';
  expect(orderNo).not.toBe('');
  expect(confirmation).toContain(`৳${total.toLocaleString('en-US')}`);
  writeFileSync(path.join(__dirname, '..', '.order.json'), JSON.stringify({ orderNo, phone, total }));

  // The success page links to tracking, which finds the order by number + phone.
  await page.getByRole('link', { name: 'Track this order' }).click();
  await expect(page.getByText(`Order ${orderNo}`)).toBeVisible();
  expect(taka(await page.locator('body').innerText())).toBeGreaterThan(0);
});

test('tracking refuses a wrong phone number', async ({ page }) => {
  await page.goto('/track');
  await page.getByPlaceholder(/Order number/).fill('BN-2026-999999');
  await page.getByPlaceholder('Mobile number used for the order').fill('01700000000');
  await page.getByRole('button', { name: 'Track' }).click();
  await expect(page.getByText('No order matches')).toBeVisible();
  await expect(page.getByText(/^Order BN-/)).toHaveCount(0);
});
