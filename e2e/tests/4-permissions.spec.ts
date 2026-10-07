import { expect, test } from '@playwright/test';
import { adminSignIn, state } from '../helpers';

// Each staff role sees only its own part of the admin panel, and a wrong code doesn't sign in.

test('an order handler can work on orders but not open settings, staff or costs', async ({ page }) => {
  await adminSignIn(page, 'handler');
  await page.goto(`${state.urls.admin}/orders`);
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Settings' })).toHaveCount(0);
  for (const blocked of ['/settings', '/staff', '/profit', '/product-profit']) {
    await page.goto(`${state.urls.admin}${blocked}`);
    await expect(page).toHaveURL(/denied=1/);
  }
});

test('a content editor cannot open orders or customers', async ({ page }) => {
  await adminSignIn(page, 'editor');
  for (const blocked of ['/orders', '/customers']) {
    await page.goto(`${state.urls.admin}${blocked}`);
    await expect(page).toHaveURL(/denied=1/);
  }
});

test('a wrong authenticator code does not sign in', async ({ page }) => {
  const { email } = state.admins.handler;
  await page.goto(`${state.urls.admin}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(state.password);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Authenticator code').fill('000000');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/code is not right/)).toBeVisible();
  await page.goto(`${state.urls.admin}/orders`);
  await expect(page).toHaveURL(/\/login/);
});
