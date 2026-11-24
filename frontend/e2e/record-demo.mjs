// End to end demo recorder: drives the real app (frontend + API + MongoDB + Redis) from the landing page
// through report → AI proposal → approval → refund → audit → admin, records a video and screenshots every screen.
//
//   WEB_URL=http://localhost:3000 OUT_DIR=../docs node frontend/e2e/record-demo.mjs
//
// Output: $OUT_DIR/demo.webm (convert to mp4 with ffmpeg) and $OUT_DIR/screens/NN-name.png
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';
const OUT_DIR = resolve(process.env.OUT_DIR ?? 'docs');
const SCREENS_DIR = join(OUT_DIR, 'screens');
const VIDEO_TMP = join(OUT_DIR, '.video-tmp');
const PASSWORD = 'Demo@123';
const VIEWPORT = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

let shotIndex = 0;
/** Caption timestamps relative to the start of the video, written out as chapters for the landing page player. */
const chapters = [];
let videoStartedAt = 0;

/** Visible cursor and a caption bar, re-created on every page load. Hidden while screenshots are taken. */
const OVERLAY_SCRIPT = () => {
  const install = () => {
    if (document.getElementById('__demo-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = '__demo-cursor';
    cursor.style.cssText =
      'position:fixed;z-index:2147483647;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
      'background:rgba(163,230,53,.55);border:2px solid #0b1a12;pointer-events:none;transition:transform .12s ease-out;';
    const caption = document.createElement('div');
    caption.id = '__demo-caption';
    caption.style.cssText =
      'position:fixed;z-index:2147483646;left:50%;bottom:24px;transform:translateX(-50%);max-width:80%;padding:10px 18px;' +
      'border-radius:999px;background:rgba(11,26,18,.92);color:#f1f5f0;font:600 16px/1.4 system-ui,sans-serif;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.3);pointer-events:none;';
    document.body.append(cursor, caption);
    const saved = JSON.parse(sessionStorage.getItem('__demo') ?? '{}');
    caption.textContent = saved.caption ?? '';
    caption.style.display = saved.caption ? 'block' : 'none';
    if (saved.x !== undefined) cursor.style.transform = `translate(${saved.x}px, ${saved.y}px)`;
    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const state = JSON.parse(sessionStorage.getItem('__demo') ?? '{}');
      sessionStorage.setItem('__demo', JSON.stringify({ ...state, x: e.clientX, y: e.clientY }));
    });
    window.addEventListener('mousedown', () => (cursor.style.scale = '0.75'));
    window.addEventListener('mouseup', () => (cursor.style.scale = '1'));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (text) => process.stdout.write(`${text}\n`);

async function caption(page, text) {
  log(`▸ ${text}`);
  if (videoStartedAt) chapters.push({ time: Math.max(0, Math.round((Date.now() - videoStartedAt) / 100) / 10), title: text });
  await page.evaluate((t) => {
    const state = JSON.parse(sessionStorage.getItem('__demo') ?? '{}');
    sessionStorage.setItem('__demo', JSON.stringify({ ...state, caption: t }));
    const el = document.getElementById('__demo-caption');
    if (el) {
      el.textContent = t;
      el.style.display = t ? 'block' : 'none';
    }
  }, text);
}

async function shot(page, name, options = {}) {
  await page.evaluate(() => document.querySelectorAll('#__demo-cursor,#__demo-caption').forEach((n) => (n.style.visibility = 'hidden')));
  const file = join(SCREENS_DIR, `${String(++shotIndex).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, ...options });
  await page.evaluate(() => document.querySelectorAll('#__demo-cursor,#__demo-caption').forEach((n) => (n.style.visibility = 'visible')));
  log(`  📸 ${file}`);
}

/** Glides the visible cursor to the element, then clicks: easier to follow than an instant jump. */
async function clickVisibly(page, locator, { pause = 350 } = {}) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
  await sleep(pause);
  await locator.click();
}

async function typeVisibly(page, locator, text) {
  await clickVisibly(page, locator, { pause: 150 });
  await locator.pressSequentially(text, { delay: 45 });
}

async function wheel(page, distance, step = 140) {
  for (let moved = 0; moved < distance; moved += step) {
    await page.mouse.wheel(0, step);
    await sleep(70);
  }
}

/** Demo account buttons on the login page, by role label. */
const DEMO_BUTTON = { 'asha@demo.in': 'Customer', 'ravi@demo.in': 'Ops agent', 'priya@demo.in': 'Approver', 'admin@demo.in': 'Admin' };

async function login(page, email, { quickFill = false } = {}) {
  await page.goto(`${WEB_URL}/login`);
  await page.getByLabel('Email').waitFor();
  if (quickFill) {
    // One click demo account button fills email and password
    await clickVisibly(page, page.getByRole('button', { name: new RegExp(`^${DEMO_BUTTON[email]}`) }));
    await sleep(500);
  } else {
    await typeVisibly(page, page.getByLabel('Email'), email);
    await typeVisibly(page, page.getByLabel('Password'), PASSWORD);
  }
  await clickVisibly(page, page.getByRole('button', { name: 'Log in' }));
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
  await page.waitForLoadState('networkidle');
}

async function logout(page) {
  await clickVisibly(page, page.getByRole('button', { name: 'Log out' }));
  await page.waitForURL((url) => url.pathname === '/login');
}

async function landing(page) {
  await page.goto(WEB_URL, { waitUntil: 'load' });
  await caption(page, 'RefundDesk: AI investigates, humans approve, money moves once');
  await page.mouse.move(640, 300, { steps: 10 });
  await sleep(7000); // let the live hero demo play through to "refunded"
  await shot(page, 'landing-hero');
  await shot(page, 'landing-full-page', { fullPage: true });
  await caption(page, 'The problem, and the proof from CI');
  await wheel(page, 900);
  await sleep(1500);
  await caption(page, 'A read only agent: the case flows around it, one step at a time');
  await wheel(page, 1000);
  await sleep(3500);
  await caption(page, 'Every role gets its own screen, and every safeguard is built in');
  await wheel(page, 1800);
  await sleep(1200);
  await caption(page, 'From complaint to refund in one system');
  await wheel(page, 1000);
  await sleep(1800);
  await wheel(page, 900);
  await sleep(1500);
  await caption(page, 'The double click test: click approve as fast as you like');
  await page.locator('#try-it').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.getElementById('try-it').scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await sleep(1200);
  const approve = page.locator('#try-it').getByRole('button', { name: 'Approve refund' });
  await clickVisibly(page, approve);
  for (let i = 0; i < 6; i++) {
    await approve.click();
    await sleep(160);
  }
  await caption(page, '7 clicks, still exactly 1 refund');
  await sleep(2200);
  await shot(page, 'landing-double-click-test');
  await caption(page, 'Now the real thing: try the live demo');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1500);
  await clickVisibly(page, page.getByRole('link', { name: 'Try the live demo' }).first());
  await page.waitForURL((url) => url.pathname === '/login');
}

async function customerReports(page) {
  await caption(page, 'A wrong password shows a clear, specific error');
  await typeVisibly(page, page.getByLabel('Email'), 'asha@demo.in');
  await typeVisibly(page, page.getByLabel('Password'), 'wrong-password');
  await clickVisibly(page, page.getByRole('button', { name: 'Log in' }));
  await page.getByText('Email or password is incorrect.').waitFor();
  await sleep(800);
  await shot(page, 'login-error');
  await caption(page, 'Asha, a customer, logs in');
  await login(page, 'asha@demo.in');
  await page.getByRole('heading', { name: 'My transactions' }).waitFor();
  await caption(page, 'She was charged twice by FoodNow: ₹499.00, 40 seconds apart');
  await sleep(1500);
  await shot(page, 'customer-transactions');
  await clickVisibly(page, page.locator('a[href="/cases/new?txn=101"]'));
  await page.getByRole('heading', { name: 'Report an issue' }).waitFor();
  await caption(page, 'Forms validate before anything is sent');
  await clickVisibly(page, page.getByRole('button', { name: 'Submit request' }));
  await page.getByText('Choose what went wrong').waitFor();
  await sleep(800);
  await shot(page, 'customer-report-validation');
  await caption(page, 'She picks "Charged twice" and adds a note');
  await clickVisibly(page, page.getByLabel('Charged twice'));
  await typeVisibly(page, page.getByLabel('Tell us more'), 'Charged twice for one order, please refund the extra charge.');
  await sleep(500);
  await shot(page, 'customer-report-form');
  await clickVisibly(page, page.getByRole('button', { name: 'Submit request' }));
  await page.waitForURL(/\/cases\/\d+$/);
  const caseId = Number(new URL(page.url()).pathname.split('/').pop());
  await caption(page, `Request #${caseId} received. The AI agent starts investigating straight away`);
  await page.getByText('In review').first().waitFor();
  await sleep(2500);
  await shot(page, 'customer-case-in-review');
  await logout(page);
  return caseId;
}

async function opsInvestigates(page, caseId) {
  await caption(page, 'Ravi, a support agent, logs in with one click on a demo account');
  await login(page, 'ravi@demo.in', { quickFill: true });
  await page.getByRole('heading', { name: 'Cases' }).waitFor();
  await caption(page, 'Live queue counts up top, and the queue shows only cases that need action');
  await sleep(1800);
  await shot(page, 'ops-case-queue');
  await clickVisibly(page, page.locator(`a[href="/ops/cases/${caseId}"]`).first());
  await page.getByRole('heading', { name: `Case #${caseId}` }).waitFor();
  await page.getByText('AI proposal — needs human approval').waitFor();
  await caption(page, 'Where the case stands, then the AI proposal: a full refund, with reasons and confidence');
  await sleep(2500);
  await shot(page, 'ops-case-detail-ai-proposal', { fullPage: true });
  await caption(page, 'Related transactions: the duplicate is flagged automatically');
  await wheel(page, 500);
  await sleep(1500);
  await caption(page, 'Ops can add internal notes. Only an approver can decide');
  await typeVisibly(page, page.getByLabel('Add note'), 'Checked with the merchant: one order only.');
  await clickVisibly(page, page.getByRole('button', { name: 'Add note' }));
  await page.getByText('Checked with the merchant: one order only.').last().waitFor();
  await sleep(1500);
  await shot(page, 'ops-case-detail-note');
  await logout(page);
}

async function approverDecides(page, caseId) {
  await caption(page, 'Priya, an approver, reviews the case');
  await login(page, 'priya@demo.in', { quickFill: true });
  await page.goto(`${WEB_URL}/ops/cases/${caseId}`);
  await page.getByText('AI proposal — needs human approval').waitFor();
  await sleep(1500);
  await shot(page, 'approver-case-detail');
  await caption(page, 'She approves: the amount is capped at the original charge and a comment is required');
  await clickVisibly(page, page.getByRole('button', { name: 'Approve', exact: true }));
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await typeVisibly(page, dialog.getByLabel('Comment'), 'Duplicate confirmed by the AI and the merchant.');
  await sleep(600);
  await shot(page, 'approver-approve-dialog');
  await clickVisibly(page, dialog.getByRole('button', { name: 'Approve refund' }));
  await page.getByText('Refund of ₹499.00 completed').waitFor();
  await caption(page, 'Refunded exactly once, keyed to the case. The case closes automatically');
  await sleep(2500);
  await shot(page, 'approver-case-refunded');
  await caption(page, 'The audit log records every step: who, what and when');
  await clickVisibly(page, page.getByRole('tab', { name: 'Audit log' }));
  await page.getByText('Refund executed').first().waitFor();
  await page.getByRole('tab', { name: 'Audit log' }).scrollIntoViewIfNeeded();
  await sleep(2500);
  await shot(page, 'approver-audit-log', { fullPage: true });
  await caption(page, 'Dark mode, for long shifts');
  await clickVisibly(page, page.getByRole('button', { name: 'Switch to dark theme' }));
  await sleep(1500);
  await shot(page, 'approver-case-dark-mode');
  await clickVisibly(page, page.getByRole('button', { name: 'Switch to light theme' }));
  await logout(page);
}

async function customerSeesRefund(page, caseId) {
  await caption(page, 'Back to Asha: her request shows the refund');
  await login(page, 'asha@demo.in', { quickFill: true });
  await page.goto(`${WEB_URL}/cases/${caseId}`);
  await page.getByText('Refunded').first().waitFor();
  await sleep(2500);
  await shot(page, 'customer-case-refunded');
  await logout(page);
}

async function adminTour(page) {
  await caption(page, 'Admins manage users and the policy rules the agent reads');
  await login(page, 'admin@demo.in', { quickFill: true });
  await clickVisibly(page, page.getByRole('link', { name: 'Admin' }));
  await page.getByRole('heading', { name: 'Admin' }).waitFor();
  await sleep(1500);
  await shot(page, 'admin-users');
  await clickVisibly(page, page.getByRole('tab', { name: 'Policies' }));
  await sleep(1500);
  await shot(page, 'admin-policies');
  await caption(page, 'Every screen works by keyboard and passes automated accessibility checks');
  await sleep(2500);
  await logout(page);
  await caption(page, 'RefundDesk · open source · github.com/mrahuls2608/refunddesk');
  await page.goto(WEB_URL);
  await sleep(3500);
}

async function extraScreens(browser) {
  const page = await (await browser.newContext({ viewport: VIEWPORT })).newPage();
  await page.goto(`${WEB_URL}/privacy`);
  await shot(page, 'privacy');
  await page.goto(`${WEB_URL}/this-page-does-not-exist`);
  await shot(page, 'not-found');
  await page.goto(`${WEB_URL}/login?reason=expired`);
  await shot(page, 'login-session-expired');
  await page.context().close();

  const phone = await (await browser.newContext({ viewport: PHONE, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await phone.goto(WEB_URL);
  await phone.waitForLoadState('networkidle');
  await sleep(2500);
  await shot(phone, 'mobile-landing');
  await phone.getByRole('button', { name: 'Open menu' }).click();
  await sleep(1000);
  await shot(phone, 'mobile-menu');
  await phone.goto(`${WEB_URL}/login`);
  await phone.getByLabel('Email').fill('asha@demo.in');
  await phone.getByLabel('Password').fill(PASSWORD);
  await phone.getByRole('button', { name: 'Log in' }).click();
  await phone.getByRole('heading', { name: 'My transactions' }).waitFor();
  await sleep(800);
  await shot(phone, 'mobile-customer-transactions');
  await phone.context().close();
}

async function main() {
  await rm(SCREENS_DIR, { recursive: true, force: true });
  await mkdir(SCREENS_DIR, { recursive: true });
  await mkdir(VIDEO_TMP, { recursive: true });
  const browser = await chromium.launch(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {});
  const context = await browser.newContext({ viewport: VIEWPORT, recordVideo: { dir: VIDEO_TMP, size: VIEWPORT } });
  await context.addInitScript(OVERLAY_SCRIPT);
  const page = await context.newPage();
  videoStartedAt = Date.now();
  page.setDefaultTimeout(20000);
  try {
    await landing(page);
    const caseId = await customerReports(page);
    await opsInvestigates(page, caseId);
    await approverDecides(page, caseId);
    await customerSeesRefund(page, caseId);
    await adminTour(page);
  } catch (err) {
    await page.screenshot({ path: join(OUT_DIR, 'demo-failure.png') }).catch(() => undefined);
    throw err;
  } finally {
    await context.close();
  }
  await extraScreens(browser);
  await browser.close();
  const [video] = await readdir(VIDEO_TMP);
  await rename(join(VIDEO_TMP, video), join(OUT_DIR, 'demo.webm'));
  await rm(VIDEO_TMP, { recursive: true, force: true });
  await writeFile(join(OUT_DIR, 'demo-chapters.json'), `${JSON.stringify(chapters, null, 2)}\n`);
  log(`Video: ${join(OUT_DIR, 'demo.webm')} · ${shotIndex} screenshots in ${SCREENS_DIR}`);
}

main().catch((err) => {
  process.stderr.write(`Demo recording failed: ${err.stack ?? err}\n`);
  process.exit(1);
});
