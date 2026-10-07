import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { adminSignIn, state } from '../helpers';

// Staff handle the order checkout.spec.ts placed: confirm, pack, ship, deliver. Stock and the
// shopper's tracking page follow along.

const order = () =>
  JSON.parse(readFileSync(path.join(__dirname, '..', '.order.json'), 'utf8')) as {
    orderNo: string;
    phone: string;
    total: number;
  };

async function moveTo(page: Page, action: string, status: string) {
  await page.getByRole('button', { name: action, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: action, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText(status, { exact: true }).first()).toBeVisible();
}

test('staff find the new order and take it all the way to delivered', async ({ page }) => {
  const { orderNo, phone, total } = order();
  await adminSignIn(page, 'owner');

  // Find it by phone number in the order list.
  await page.goto(`${state.urls.admin}/orders`);
  await page.getByPlaceholder('Order number, phone or name').fill(phone);
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('link', { name: orderNo }).click();
  await expect(page.getByRole('heading', { name: new RegExp(orderNo) })).toBeVisible();
  await expect(page.getByText(`৳${total.toLocaleString('en-IN')}`).first()).toBeVisible();

  await moveTo(page, 'Confirm order', 'Confirmed');
  await moveTo(page, 'Start packing', 'Packing');
  await moveTo(page, 'Mark shipped', 'Shipped');
  await moveTo(page, 'Mark delivered', 'Delivered');

  // Every step is in the history, with who did it.
  const history = page.locator('[data-slot="card"]', { hasText: 'History' });
  for (const s of ['Confirmed', 'Packing', 'Shipped', 'Delivered']) await expect(history).toContainText(s);
  await expect(history).toContainText('E2E owner');

  // Stock went down by the one item sold.
  await page.goto(`${state.urls.admin}/inventory?q=${state.product.sku}`);
  const row = page.getByRole('row', { name: new RegExp(state.product.sku) });
  await expect(row.getByRole('cell').nth(4)).toHaveText(String(state.product.stock - 1));

  // The shopper sees it delivered.
  await page.goto(`${state.urls.store}/track?order=${orderNo}&phone=${phone}`);
  await expect(page.getByText(`Order ${orderNo}`)).toContainText('Delivered');
});
