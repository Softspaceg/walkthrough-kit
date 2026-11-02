#!/usr/bin/env node
/**
 * A walkthrough in numbered screenshots: one part of a website, documented screen by screen.
 * Each screenshot has its main controls marked with numbered badges, and one line under it per
 * number. Read-only: it opens pages, dialogs and menus and closes them; it never saves.
 *
 *   npm run screens -- <name>        e.g.  npm run screens -- contacts
 *
 * The screens of each walkthrough are in walkthroughs/<name>.mjs. What is specific to the website
 * (its name, colour, how to log in) is in walkthrough.config.mjs. This file is the engine they
 * share: login, waiting, numbering, screenshots, the document. It does not need editing.
 *
 * Output: output/<name>/index.html with the images beside it. Ctrl+P (Cmd+P) saves it as a PDF.
 */

import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(root, '.env') });

const config = (await import(pathToFileURL(path.join(root, 'walkthrough.config.mjs')).href)).default;

const NAME = process.argv[2];
const DIR = path.join(root, 'walkthroughs');
const FILE = path.join(DIR, `${NAME}.mjs`);
if (!NAME || !fs.existsSync(FILE)) {
  const have = fs.readdirSync(DIR).filter(f => f.endsWith('.mjs')).map(f => f.replace(/\.mjs$/, ''));
  throw new Error(`Which walkthrough? npm run screens -- <name>. Available: ${have.join(', ') || '(none yet)'}`);
}
const OUT = path.join(root, 'output', NAME);
const BASE = process.env.BASE_URL;
if (!BASE) throw new Error('BASE_URL is not set in .env (see .env.example)');

const BADGE = config.badge ?? '#1aa89c';
const COLOR = config.color ?? '#1aa89c';
const PARTS = config.parts ?? { A: 'Settings & Configuration', B: 'Main functionality' };
// Pixels per screen pixel: 3 gives a 4320×2700 image, sharp when printed; SCALE=2 in .env halves the size.
const SCALE = Number(process.env.SCALE ?? config.scale ?? 3);
const VIEWPORT = config.viewport ?? { width: 1440, height: 900 };
const BUSY = [
  '[aria-busy="true"]', '.animate-pulse', '.animate-spin', '[class*="skeleton" i]', '[class*="spinner" i]',
  ...(config.busySelectors ?? []),
].join(', ');
const DISCARD = config.discardButton ?? /^(Discard|Discard changes|Leave page|Leave without saving|Yes, discard)$/i;

const figures = [];
const counter = Object.fromEntries(Object.keys(PARTS).map(p => [p, 0]));

// ── Marking and shooting ───────────────────────────────────────────────────────────────

async function visible(loc, ms = 6000) {
  try { await loc.first().waitFor({ state: 'visible', timeout: ms }); return true; } catch { return false; }
}

/** Draws a numbered badge on each control's top-left corner. Returns the numbers actually drawn. */
async function mark(page, items) {
  const boxes = [];
  for (const [i, it] of items.entries()) {
    if (!(await visible(it.loc, 4000))) { console.log(`     not found, not marked: ${it.label}`); continue; }
    const b = await it.loc.first().boundingBox().catch(() => null);
    if (b) boxes.push({ n: i + 1, ...b });
  }
  await page.evaluate(({ boxes, color }) => {
    const layer = document.createElement('div');
    layer.id = 'wt-marks';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    for (const b of boxes) {
      const badge = document.createElement('div');
      badge.textContent = String(b.n);
      badge.style.cssText = `position:absolute;left:${Math.max(2, b.x - 14)}px;top:${Math.max(2, b.y - 14)}px;width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font:700 14px/1 system-ui,Segoe UI,Arial,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.3)`;
      layer.append(badge);
    }
    document.body.append(layer);
  }, { boxes, color: BADGE });
  return boxes.map(b => b.n);
}

/** Waits until the page has stopped loading: no requests in flight, no spinner, every image drawn. */
async function settled(page) {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForFunction(sel => !document.querySelector(sel), BUSY, { timeout: 20_000 }).catch(() => {});
  await page.waitForFunction(() => [...document.images]
    .filter(i => i.getBoundingClientRect().width > 0)
    .every(i => i.complete && i.naturalWidth > 0), null, { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function shot(page, part, title, items = [], note = '') {
  if (!(part in counter)) throw new Error(`Unknown part "${part}": the parts are ${Object.keys(PARTS).join(', ')} (walkthrough.config.mjs)`);
  await settled(page);
  const drawn = await mark(page, items);
  const id = `${part}${++counter[part]}`;
  const file = `${id}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  await page.evaluate(() => document.getElementById('wt-marks')?.remove());
  figures.push({ id, part, title, note, file, items: items.map((it, i) => ({ n: i + 1, label: it.label, drawn: drawn.includes(i + 1) })) });
  console.log(`  ${id}  ${title}`);
}

/** Closes whatever is open without saving: Escape, and Discard if the site asks about unsaved changes. */
async function close(page) {
  for (let i = 0; i < 3; i++) {
    const discard = page.getByRole('dialog').getByRole('button', { name: DISCARD });
    if (await visible(discard, 500)) { await discard.first().click(); continue; }
    if (!(await visible(page.getByRole('dialog'), 500)) && !(await visible(page.getByRole('menu'), 300))) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
}

/** One group of screens. A group that fails is logged and the walkthrough moves on. */
async function step(page, name, fn) {
  try { await fn(); } catch (e) {
    console.log(`  !! ${name}: ${String(e.message ?? e).split('\n')[0]}`);
    await close(page).catch(() => {});
  }
}

const L = (loc, label) => ({ loc, label });

/** Clicks a day of the month in an open calendar, skipping the greyed days of the months around it. */
async function pickDay(page, day) {
  const days = page.locator('[role="grid"] button, [role="gridcell"], [data-radix-popper-content-wrapper] button, .flatpickr-day, .o_datetime_picker button')
    .filter({ hasText: new RegExp(`^\\s*${day}\\s*$`) });
  for (let i = 0, n = await days.count(); i < n; i++) {
    const inMonth = await days.nth(i).evaluate(el => {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
      if (/outside|prevMonth|nextMonth|o_out_of_range/i.test(`${el.className} ${el.parentElement?.className ?? ''}`)) return false;
      const [r, g, b] = (getComputedStyle(el).color.match(/\d+/g) ?? []).map(Number);
      return ![r, g, b].every(c => c >= 120 && c <= 240) && Number(getComputedStyle(el).opacity) > 0.9;
    }).catch(() => false);
    if (inMonth) { await days.nth(i).click(); await page.waitForTimeout(400); return true; }
  }
  console.log(`     day ${day} not found in the calendar`);
  return false;
}

// ── The document ───────────────────────────────────────────────────────────────────────

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function html(title) {
  const parts = Object.entries(PARTS).map(([p, name]) => {
    const figs = figures.filter(f => f.part === p);
    if (!figs.length) return '';
    return `<h2>${p}. ${esc(name)}</h2>` + figs.map(f => `
<figure id="${f.id}">
  <figcaption><span class="id">${f.id}</span> ${esc(f.title)}</figcaption>
  <img src="${f.file}" alt="${esc(f.title)}">
  ${f.items.length ? `<ol>${f.items.map(i => `<li${i.drawn ? '' : ' class="off"'}><span class="n">${i.n}</span>${esc(i.label)}</li>`).join('')}</ol>` : ''}
  ${f.note ? `<p class="note">${esc(f.note)}</p>` : ''}
</figure>`).join('');
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(config.appName ?? '')} ${esc(title)}</title>
<style>
:root{--g:${COLOR};--ink:#1f2937;--mute:#6b7280;--line:#e5e7eb;--bg:#fff}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,Segoe UI,Arial,sans-serif}
main{max-width:1100px;margin:0 auto;padding:32px 16px 64px}
h1{margin:0 0 4px;font-size:26px} .sub{color:var(--mute);margin:0 0 28px}
h2{margin:40px 0 16px;padding-bottom:6px;border-bottom:3px solid var(--g);font-size:20px}
figure{margin:0 0 36px;break-inside:avoid}
figcaption{font-weight:600;margin-bottom:8px} .id{display:inline-block;background:var(--g);color:#fff;border-radius:6px;padding:0 8px;margin-right:6px}
img{width:100%;border:1px solid var(--line);border-radius:8px}
ol{list-style:none;margin:10px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:4px 20px}
li{display:flex;gap:8px;align-items:flex-start} li.off{color:var(--mute)}
.n{flex:none;width:22px;height:22px;border-radius:50%;background:var(--g);color:#fff;font:700 12px/22px Arial,sans-serif;text-align:center}
.note{color:var(--mute);margin:8px 0 0}
@media print{main{padding:0} h2{break-before:page} h2:first-of-type{break-before:auto}}
</style></head><body><main>
<h1>${esc(config.appName ? `${config.appName} · ` : '')}${esc(title)}</h1>
<p class="sub">${esc(BASE)} · ${new Date().toISOString().slice(0, 10)} · ${figures.length} screens</p>
${parts}
</main></body></html>`;
}

// ── Run ────────────────────────────────────────────────────────────────────────────────

const wt = await import(pathToFileURL(FILE).href);
const title = `${wt.title ?? NAME} — walkthrough`;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: !!process.env.CI });
const context = await browser.newContext({ baseURL: BASE, viewport: VIEWPORT, deviceScaleFactor: SCALE, ignoreHTTPSErrors: true });
const page = await context.newPage();
page.setDefaultTimeout(20_000);
page.on('dialog', d => d.accept().catch(() => {})); // a "leave this page?" prompt: leaving never saves

await config.login(page, { user: process.env.LOGIN_USER ?? '', password: process.env.LOGIN_PASS ?? '' });

console.log(`\nWalkthrough: ${NAME}\n`);
try {
  await wt.default(page, {
    shot: (part, t, items, note) => shot(page, part, t, items, note),
    L,
    visible,
    close: () => close(page),
    step: (name, fn) => step(page, name, fn),
    pickDay: day => pickDay(page, day),
  });
} finally {
  fs.writeFileSync(path.join(OUT, 'index.html'), html(title), 'utf8');
  await browser.close();
}
const kept = new Set(figures.map(f => f.file));
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png') && !kept.has(f)) fs.rmSync(path.join(OUT, f));
console.log(`\n${figures.length} screens → ${path.join(OUT, 'index.html')}`);
