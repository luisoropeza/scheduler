/**
 * Smoke test: logs in with every seeded role (DataSeeder, clinic 1) and visits each page it can reach,
 * failing on uncaught errors, console errors or API responses >= 400.
 *
 * Requires the full stack running (db + backend + `pnpm start`). Uses the locally installed Chrome:
 *   pnpm e2e:smoke                 # all roles
 *   pnpm e2e:smoke -- doctor       # one role
 * Env: BASE_URL (default http://localhost:4200), CHROME_PATH (default: Playwright's "chrome" channel),
 *      SCREENSHOTS=dir to save a screenshot per page.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4200';
const SHOTS = process.env.SCREENSHOTS;
const PASSWORD = 'password123';

const USERS = {
  admin: { email: 'admin.downtown@clinic.com', routes: ['/dashboard', '/board', '/calendar', '/appointments', '/staff', '/specialties', '/profile'] },
  doctor: {
    email: 'ana.garcia@clinic.com',
    routes: ['/dashboard', '/board', '/calendar', '/appointments', '/patients', '/availability', '/appointments/new', '/profile']
  },
  assistant: { email: 'maria.ramos@clinic.com', routes: ['/dashboard', '/board', '/calendar', '/appointments', '/patients', '/appointments/new', '/profile'] },
  patient: { email: 'john.smith@email.com', routes: ['/appointments', '/appointments/new', '/calendar', '/assistant', '/profile'] }
};

const only = process.argv[2];
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { channel: 'chrome', headless: true }
);
const problems = [];

for (const [role, user] of Object.entries(USERS)) {
  if (only && only !== role) continue;
  const context = await browser.newContext({ viewport: { width: 1500, height: 920 }, locale: 'es-ES' });
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`[${role}] uncaught: ${error.message}`));
  page.on('console', (message) => message.type() === 'error' && problems.push(`[${role}] console: ${message.text()}`));
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      problems.push(`[${role}] ${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  await page.goto(`${BASE}/clinic-options`);
  await page.getByRole('button', { name: /Ingresar al espacio/ }).first().click();
  await page.locator('input[type=email]').fill(user.email);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 10_000 });

  for (const route of user.routes) {
    await page.goto(BASE + route);
    await page.waitForLoadState('networkidle');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${role}${route.replaceAll('/', '-')}.png`) });
    console.log(`✓ ${role} ${route}`);
  }
  await context.close();
}

await browser.close();
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('\nSmoke test passed');
