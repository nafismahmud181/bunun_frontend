// End-to-end test runner: `npm run e2e` (extra arguments go to Playwright, e.g. `npm run e2e -- --headed`).
//
// Starts a throwaway copy of the whole shop on this computer, runs the browser tests against it,
// then removes everything:
//   1. a fresh PostgreSQL in Docker (port 54329), migrated and seeded, plus test staff and a coupon
//   2. the API (4500), the storefront (3500) and the admin panel (3600), built for production
//   3. Playwright (e2e/tests)
// Your real database (Supabase) and your `npm run dev` servers are never touched.
//
// Options: --keep          leave everything running afterwards (to click around; Ctrl+C stops it)
//          --skip-build    reuse the last test builds (faster when only the tests changed)
// The backend and admin repos are expected next to this one (../backend, ../admin); set
// E2E_BACKEND_DIR / E2E_ADMIN_DIR to point elsewhere (CI).
import { execSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, openSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(here, '..');
const BACKEND = path.resolve(process.env.E2E_BACKEND_DIR ?? path.join(FRONTEND, '../backend'));
const ADMIN = path.resolve(process.env.E2E_ADMIN_DIR ?? path.join(FRONTEND, '../admin'));
const LOGS = path.join(here, '.logs');

const PORTS = { db: 54329, api: 4500, store: 3500, admin: 3600 };
const CONTAINER = 'bunun-e2e-pg';
const DB_URL = `postgresql://bunun:bunun@localhost:${PORTS.db}/bunun`;
const URLS = {
  api: `http://localhost:${PORTS.api}`,
  store: `http://localhost:${PORTS.store}`,
  admin: `http://localhost:${PORTS.admin}`,
};

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const skipBuild = args.includes('--skip-build');
const playwrightArgs = args.filter((a) => a !== '--keep' && a !== '--skip-build');
const win = process.platform === 'win32';

const secrets = {
  ADMIN_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
  REVALIDATE_SECRET: randomBytes(24).toString('hex'),
};
// Everything the test copy of the API needs. Nothing comes from the backend's .env file.
const apiEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'warn',
  PORT: String(PORTS.api),
  HOST: '127.0.0.1',
  DATABASE_URL: DB_URL,
  DIRECT_URL: DB_URL,
  CORS_ORIGINS: URLS.store,
  STOREFRONT_URL: URLS.store,
  COURIER_DRIVER: 'fake',
  SMS_DRIVER: 'log',
  ...secrets,
};

const children = [];
const step = (msg) => console.log(`\n▶ ${msg}`);

function run(cmd, cwd, env = {}, opts = {}) {
  return execSync(cmd, {
    cwd,
    stdio: opts.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: { ...process.env, ...env },
  });
}

function start(name, cmd, cwd, env) {
  mkdirSync(LOGS, { recursive: true });
  const out = openSync(path.join(LOGS, `${name}.log`), 'w');
  const child = spawn(cmd, {
    cwd,
    env: { ...process.env, ...env },
    shell: true,
    stdio: ['ignore', out, out],
    detached: !win,
  });
  children.push({ name, child });
  return child;
}

function stopAll() {
  for (const { child } of children) {
    if (child.exitCode !== null) continue;
    try {
      if (win) execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
      else process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  }
  try {
    execSync(`docker rm -f ${CONTAINER}`, { stdio: 'ignore' });
  } catch {
    /* not running */
  }
}

const portFree = (port) =>
  new Promise((resolve) => {
    const s = net.connect({ port, host: '127.0.0.1' });
    s.once('connect', () => (s.destroy(), resolve(false)));
    s.once('error', () => resolve(true));
  });

async function waitFor(name, url, seconds = 120) {
  for (let i = 0; i < seconds; i++) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${name} did not start at ${url}; see e2e/.logs/${name}.log`);
}

let failed = true;
try {
  step('Checking ports');
  for (const [name, port] of Object.entries(PORTS))
    if (!(await portFree(port)))
      throw new Error(`Port ${port} (${name}) is already in use. Stop whatever uses it and try again.`);

  step('Starting a fresh test database (Docker)');
  stopAll();
  run(
    `docker run -d --name ${CONTAINER} -e POSTGRES_USER=bunun -e POSTGRES_PASSWORD=bunun -e POSTGRES_DB=bunun -p ${PORTS.db}:5432 postgres:17-alpine`,
    FRONTEND,
    {},
    { capture: true },
  );
  for (let i = 0; ; i++) {
    try {
      execSync(`docker exec ${CONTAINER} pg_isready -U bunun -d bunun`, { stdio: 'ignore' });
      break;
    } catch {
      if (i > 60) throw new Error('The test database did not start.');
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  // pg_isready can say yes a moment before the server accepts outside connections.
  await new Promise((r) => setTimeout(r, 2000));

  step('Migrating and seeding it');
  run('npx prisma migrate deploy', BACKEND, apiEnv);
  run('npx prisma db seed', BACKEND, apiEnv);
  const state = JSON.parse(run('npx tsx scripts/e2e-setup.ts', BACKEND, apiEnv, { capture: true }).toString());
  writeFileSync(path.join(here, '.state.json'), JSON.stringify({ ...state, urls: URLS }, null, 2));

  if (!skipBuild) {
    step('Building the storefront and admin panel (production builds)');
    run('npx next build', FRONTEND, { NEXT_DIST_DIR: '.next-e2e', NEXT_PUBLIC_API_URL: URLS.api });
    run('npx next build', ADMIN, {});
  }

  step('Starting the API, storefront and admin panel');
  start('api', 'npx tsx src/server.ts', BACKEND, apiEnv);
  await waitFor('api', `${URLS.api}/health`);
  start('store', `npx next start -p ${PORTS.store}`, FRONTEND, {
    NEXT_DIST_DIR: '.next-e2e',
    REVALIDATE_SECRET: secrets.REVALIDATE_SECRET,
  });
  start('admin', `npx next start -p ${PORTS.admin}`, ADMIN, { API_URL: URLS.api, STOREFRONT_URL: URLS.store });
  await Promise.all([waitFor('store', URLS.store), waitFor('admin', `${URLS.admin}/login`)]);

  step('Running the browser tests');
  try {
    run(`npx playwright test ${playwrightArgs.join(' ')}`, FRONTEND, {
      E2E_STORE_URL: URLS.store,
      E2E_ADMIN_URL: URLS.admin,
      E2E_API_URL: URLS.api,
    });
    failed = false;
  } catch {
    console.log('\n✗ Some tests failed. Open the report with: npx playwright show-report');
  }

  if (keep) {
    console.log(`\nStill running (--keep): storefront ${URLS.store}, admin ${URLS.admin}. Ctrl+C stops everything.`);
    await new Promise((resolve) => process.once('SIGINT', resolve));
  }
} catch (err) {
  console.error(`\n✗ ${err.message}`);
} finally {
  step('Cleaning up (servers and test database)');
  stopAll();
}
if (!failed) console.log('\n✓ All end-to-end tests passed.');
process.exit(failed ? 1 : 0);
