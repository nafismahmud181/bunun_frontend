import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

/** What e2e/run.mjs prepared: test staff, the coupon, the product the tests buy, the URLs. */
export interface E2EState {
  password: string;
  admins: Record<'owner' | 'handler' | 'editor', { email: string; secret: string }>;
  coupon: { code: string; percent: number };
  product: { sku: string; slug: string; name: string; price: number; stock: number };
  urls: { api: string; store: string; admin: string };
}

export const state: E2EState = JSON.parse(readFileSync(path.join(__dirname, '.state.json'), 'utf8'));

/** The current 6-digit authenticator code for a base32 secret (RFC 6238, 30-second steps). */
export function totp(secret: string, at = Date.now()) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const hmac = createHmac('sha1', key).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, '0');
}

/**
 * Signs in to the admin panel as a test staff member. A code is accepted only once, so when the
 * last sign-in used the current 30-second step, the next step's code is used (the API allows ±1).
 */
const lastStep: Record<string, number> = {};
export async function adminSignIn(page: Page, who: keyof E2EState['admins']) {
  const { email, secret } = state.admins[who];
  await page.goto(`${state.urls.admin}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(state.password);
  await page.getByRole('button', { name: 'Continue' }).click();
  const step = Math.floor(Date.now() / 30_000);
  const use = lastStep[who] !== undefined && lastStep[who] >= step ? lastStep[who] + 1 : step;
  lastStep[who] = use;
  await page.getByLabel('Authenticator code').fill(totp(secret, use * 30_000));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

/** "৳1,850" → 1850 */
export const taka = (text: string) => Number(text.replace(/[^\d]/g, ''));

/** A phone number not used by any earlier run (the database is fresh each run anyway). */
export const newPhone = () => `017${String(Date.now()).slice(-8)}`;
