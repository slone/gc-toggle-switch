// Shared test fixtures.
//
// Pages are served from a fake origin (http://gc.test) through request
// interception: no web server, and the component is loaded exactly as a
// user would load it, as a native ES module, without any build step.
import { test as base, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, normalize, sep } from 'node:path';

export const ORIGIN = 'http://gc.test';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

/** Records each element's ElementInternals, so tests can read the ARIA
 *  state the component exposes without adding attributes to the DOM. */
function spyOnInternals() {
  const map = new WeakMap();
  const original = HTMLElement.prototype.attachInternals;
  HTMLElement.prototype.attachInternals = function attachInternals() {
    const internals = original.call(this);
    map.set(this, internals);
    return internals;
  };
  window.__internalsOf = (el) => map.get(el);
}

function fixtureHtml(body, { lang = 'en', dir, script = true } = {}) {
  return `<!doctype html>
<html lang="${lang}"${dir ? ` dir="${dir}"` : ''}>
<head>
  <meta charset="utf-8">
  <title>gc-toggle-switch test</title>
  ${script ? '<script type="module" src="/gc-toggle-switch.js"></script>' : ''}
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(spyOnInternals);
    await page.route(`${ORIGIN}/**`, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/__fixture__') {
        return route.fulfill({ contentType: 'text/html', body: url.searchParams.get('html') ?? '' });
      }
      const file = normalize(ROOT + decodeURIComponent(url.pathname));
      if (!file.startsWith(ROOT) || file.includes(`${sep}node_modules${sep}`)) {
        return route.fulfill({ status: 404 });
      }
      try {
        const body = await readFile(file);
        return route.fulfill({ contentType: TYPES[extname(file)] ?? 'application/octet-stream', body });
      } catch {
        return route.fulfill({ status: 404 });
      }
    });
    await use(page);
  },

  /** Loads a page whose <main> holds `body`, and waits for the element definition
   *  (unless `script: false`, where the component is not loaded). */
  mount: async ({ page }, use) => {
    await use(async (body, options = {}) => {
      const html = fixtureHtml(body, options);
      await page.goto(`${ORIGIN}/__fixture__?html=${encodeURIComponent(html)}`);
      if (options.script === false) return;
      await page.evaluate(() => customElements.whenDefined('gc-toggle-switch'));
    });
  },
});

/** The ARIA state held by the element's ElementInternals. */
export function internals(locator) {
  return locator.evaluate((el) => {
    const i = window.__internalsOf(el);
    let states = [];
    try { states = [...i.states]; } catch { /* CustomStateSet not supported */ }
    return {
      role: i.role,
      ariaChecked: i.ariaChecked,
      ariaDisabled: i.ariaDisabled,
      ariaRequired: i.ariaRequired,
      ariaBusy: i.ariaBusy,
      states,
    };
  });
}

/** Records the events fired by `locator` (or its descendants); read them with `recorded(locator)`. */
export function recordEvents(locator, types = ['input', 'change', 'toggle']) {
  return locator.evaluate((el, types) => {
    el.__events = [];
    for (const type of types) {
      el.addEventListener(type, (e) => el.__events.push({
        type,
        checked: el.checked,
        detail: e.detail ?? null,
        bubbles: e.bubbles,
        composed: e.composed,
      }));
    }
  }, types);
}

/** Types of the events recorded so far. */
export function recorded(locator) {
  return locator.evaluate((el) => el.__events.map((e) => e.type));
}

/** Full records ({ type, checked, detail, bubbles, composed }) of the events so far. */
export function recordedDetails(locator) {
  return locator.evaluate((el) => el.__events);
}

export { expect };
