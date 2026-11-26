import AxeBuilder from '@axe-core/playwright';
import { test, expect, internals, ORIGIN } from './fixtures.js';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('ARIA through ElementInternals', () => {
  test('role and states follow the element', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');

    expect(await internals(sw)).toMatchObject({
      role: 'switch', ariaChecked: 'false', ariaDisabled: null, ariaRequired: null, ariaBusy: null,
    });

    await sw.click();
    expect((await internals(sw)).ariaChecked).toBe('true');

    await sw.evaluate((el) => { el.disabled = true; el.required = true; el.busy = true; });
    expect(await internals(sw)).toMatchObject({
      ariaChecked: 'true', ariaDisabled: 'true', ariaRequired: 'true', ariaBusy: 'true',
    });

    await sw.evaluate((el) => { el.disabled = false; el.required = false; el.busy = false; el.checked = false; });
    expect(await internals(sw)).toMatchObject({
      ariaChecked: 'false', ariaDisabled: null, ariaRequired: null, ariaBusy: null,
    });
  });

  test('no ARIA attribute is added to the light DOM', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi" checked required></gc-toggle-switch>`);
    const attrs = await page.locator('gc-toggle-switch').evaluate((el) => el.getAttributeNames().sort());
    expect(attrs).toEqual(['aria-label', 'checked', 'required', 'tabindex']);
  });

  test('the :state(checked) custom state follows the state', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    const supported = await page.evaluate(() => CSS.supports('selector(:state(checked))'));
    test.skip(!supported, 'CustomStateSet / :state() not supported by this browser');

    const matches = () => sw.evaluate((el) => el.matches(':state(checked)'));
    expect(await matches()).toBe(false);
    expect((await internals(sw)).states).toEqual([]);
    await sw.click();
    expect(await matches()).toBe(true);
    expect((await internals(sw)).states).toEqual(['checked']);
  });

  test('the state indicators are hidden from assistive technologies', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi" state-labels></gc-toggle-switch>`);
    const hidden = await page.locator('gc-toggle-switch').evaluate((el) =>
      [...el.shadowRoot.querySelectorAll('.label')].map((l) => l.getAttribute('aria-hidden')));
    expect(hidden).toEqual(['true', 'true']);
  });
});

test.describe('accessibility tree (Chromium)', () => {
  /** Switch nodes of the browser's computed accessibility tree. */
  async function switches(page) {
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    return nodes
      .filter((n) => n.role?.value === 'switch' && !n.ignored)
      .map((n) => {
        const props = Object.fromEntries((n.properties ?? []).map((p) => [p.name, p.value.value]));
        return {
          name: n.name?.value,
          checked: props.checked,
          disabled: props.disabled ?? false,
          focusable: props.focusable ?? false,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  test('role, accessible name and state are computed by the browser', async ({ page, mount, browserName }) => {
    test.skip(browserName !== 'chromium', 'Reads the tree through the Chrome DevTools Protocol');
    await mount(`
      <label for="wifi">Wi-Fi</label>
      <gc-toggle-switch id="wifi" checked></gc-toggle-switch>
      <label>Bluetooth <gc-toggle-switch></gc-toggle-switch></label>
      <gc-toggle-switch aria-label="Airplane mode" disabled></gc-toggle-switch>
      <span id="loc">Location</span>
      <gc-toggle-switch aria-labelledby="loc"></gc-toggle-switch>`);

    // Sorted by name.
    expect(await switches(page)).toEqual([
      { name: 'Airplane mode', checked: 'false', disabled: true, focusable: false },
      { name: 'Bluetooth', checked: 'false', disabled: false, focusable: true },
      { name: 'Location', checked: 'false', disabled: false, focusable: true },
      { name: 'Wi-Fi', checked: 'true', disabled: false, focusable: true },
    ]);

    await page.locator('#wifi').click();
    expect((await switches(page)).find((s) => s.name === 'Wi-Fi').checked).toBe('false');
  });
});

test.describe('axe', () => {
  test('no WCAG violation on a page of switches', async ({ page, mount }) => {
    await mount(`
      <h1>Settings</h1>
      <form>
        <label for="wifi">Wi-Fi</label>
        <gc-toggle-switch id="wifi" name="wifi" checked></gc-toggle-switch>
        <label>Bluetooth <gc-toggle-switch name="bt"></gc-toggle-switch></label>
        <gc-toggle-switch aria-label="Airplane mode" disabled></gc-toggle-switch>
        <gc-toggle-switch aria-label="Sync" busy checked></gc-toggle-switch>
        <gc-toggle-switch aria-label="Dark mode" state-labels></gc-toggle-switch>
        <gc-toggle-switch aria-label="Bit 0" orientation="vertical"></gc-toggle-switch>
        <gc-toggle-switch aria-label="Terms" required></gc-toggle-switch>
      </form>`);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test('no WCAG violation on the demo page', async ({ page }) => {
    for (const lang of ['en', 'fr']) {
      await page.goto(`${ORIGIN}/demo.html?lang=${lang}`);
      await page.evaluate(() => customElements.whenDefined('gc-toggle-switch'));
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations, `demo.html?lang=${lang}`).toEqual([]);
    }
  });
});
