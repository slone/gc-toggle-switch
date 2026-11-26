import { test, expect, recordEvents, recorded, recordedDetails } from './fixtures.js';

const isChecked = (locator) => locator.evaluate((el) => el.checked);

test.describe('keyboard', () => {
  test('Tab focuses the switch', async ({ page, mount }) => {
    await mount(`
      <button id="before">Before</button>
      <gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('gc-toggle-switch')).toBeFocused();
  });

  test('an author tabindex is kept', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi" tabindex="-1"></gc-toggle-switch>`);
    await expect(page.locator('gc-toggle-switch')).toHaveAttribute('tabindex', '-1');
  });

  test('Space toggles on key release, like a native button', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await recordEvents(sw);
    await sw.focus();

    await page.keyboard.down(' ');
    expect(await isChecked(sw)).toBe(false);
    expect(await sw.evaluate((el) => el.shadowRoot.querySelector('.track').classList.contains('pressed'))).toBe(true);

    await page.keyboard.up(' ');
    expect(await isChecked(sw)).toBe(true);
    expect(await sw.evaluate((el) => el.shadowRoot.querySelector('.track').classList.contains('pressed'))).toBe(false);
    await expect.poll(() => recorded(sw)).toEqual(['input', 'change', 'toggle']);

    await page.keyboard.press(' ');
    expect(await isChecked(sw)).toBe(false);
  });

  test('Space does not scroll the page', async ({ page, mount }) => {
    await mount(`
      <gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>
      <div style="height: 300vh"></div>`);
    await page.locator('gc-toggle-switch').focus();
    await page.keyboard.press(' ');
    // Give a (wrong) scroll a chance to happen.
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('Enter toggles and does not submit the form', async ({ page, mount }) => {
    await mount(`
      <form>
        <input name="text" aria-label="Text">
        <gc-toggle-switch name="a" aria-label="A"></gc-toggle-switch>
        <button>Send</button>
      </form>`);
    await page.locator('form').evaluate((form) => {
      window.submitted = 0;
      form.addEventListener('submit', (e) => { e.preventDefault(); window.submitted++; });
    });
    const sw = page.locator('gc-toggle-switch');
    await sw.focus();
    await page.keyboard.press('Enter');
    expect(await isChecked(sw)).toBe(true);
    await page.keyboard.press('Enter');
    expect(await isChecked(sw)).toBe(false);
    expect(await page.evaluate(() => window.submitted)).toBe(0);
  });

  test('keys with modifiers do nothing', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await sw.focus();
    await page.keyboard.press('Alt+Enter');
    await page.keyboard.press('Shift+Control+Enter');
    expect(await isChecked(sw)).toBe(false);
  });

  test('disabled: not focusable, keys and clicks do nothing', async ({ page, mount }) => {
    await mount(`
      <button id="before">Before</button>
      <gc-toggle-switch aria-label="Wi-Fi" disabled></gc-toggle-switch>
      <button id="after">After</button>`);
    const sw = page.locator('gc-toggle-switch');
    await expect(sw).not.toHaveAttribute('tabindex');
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#after')).toBeFocused();

    await recordEvents(sw, ['click', 'change']);
    await sw.click({ force: true });
    expect(await isChecked(sw)).toBe(false);
    expect(await recorded(sw)).toEqual([]);

    // Enabling it again restores the managed tabindex.
    await sw.evaluate((el) => { el.disabled = false; });
    await expect(sw).toHaveAttribute('tabindex', '0');
  });

  test('busy: stays focusable but cannot be toggled', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi" busy></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await expect(sw).toHaveAttribute('tabindex', '0');
    await sw.focus();
    await page.keyboard.press(' ');
    await page.keyboard.press('Enter');
    await sw.click();
    expect(await isChecked(sw)).toBe(false);

    await sw.evaluate((el) => { el.busy = false; });
    await page.keyboard.press(' ');
    expect(await isChecked(sw)).toBe(true);
  });
});

test.describe('pointer', () => {
  test('a click toggles', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await sw.click();
    expect(await isChecked(sw)).toBe(true);
    await sw.click();
    expect(await isChecked(sw)).toBe(false);
  });

  test('dragging the thumb past half its travel toggles once', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi" style="font-size: 32px"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await recordEvents(sw);
    const box = await sw.boundingBox();
    const y = box.y + box.height / 2;
    const start = box.x + box.height / 2;

    await page.mouse.move(start, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 2, y, { steps: 8 });
    await page.mouse.up();
    expect(await isChecked(sw)).toBe(true);
    await expect.poll(() => recorded(sw)).toEqual(['input', 'change', 'toggle']);
  });

  test('a short drag snaps back without toggling', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi" style="font-size: 32px"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await recordEvents(sw);
    const box = await sw.boundingBox();
    const y = box.y + box.height / 2;
    const start = box.x + box.height / 2;
    const travel = box.width - box.height;

    await page.mouse.move(start, y);
    await page.mouse.down();
    await page.mouse.move(start + travel / 4, y, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(50);
    expect(await isChecked(sw)).toBe(false);
    expect(await recorded(sw)).toEqual([]);
  });
});

test.describe('events', () => {
  test('a user toggle fires input, change and toggle', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await recordEvents(sw);
    await sw.click();
    await expect.poll(() => recorded(sw)).toEqual(['input', 'change', 'toggle']);

    const [input, change, toggle] = await recordedDetails(sw);
    expect(input).toMatchObject({ checked: true, bubbles: true, composed: true });
    expect(change).toMatchObject({ checked: true, bubbles: true });
    expect(toggle).toMatchObject({
      checked: true,
      bubbles: false,
      detail: { oldChecked: false, newChecked: true },
    });
  });

  test('click listeners already see the new state', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await recordEvents(sw, ['click']);
    await sw.click();
    expect(await recordedDetails(sw)).toMatchObject([{ type: 'click', checked: true }]);
  });

  test('preventDefault() on click cancels the toggle', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await recordEvents(sw);
    await sw.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
    await sw.click();
    await page.waitForTimeout(20);
    expect(await isChecked(sw)).toBe(false);
    await expect(sw).not.toHaveAttribute('checked');
    expect(await recorded(sw)).toEqual([]);
  });

  test('preventDefault() on an ancestor also cancels', async ({ page, mount }) => {
    await mount(`<div id="wrap"><gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch></div>`);
    await page.locator('#wrap').evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
    const sw = page.locator('gc-toggle-switch');
    await sw.click();
    await page.waitForTimeout(20);
    expect(await isChecked(sw)).toBe(false);
  });

  test('setting checked or calling toggle() fires no event', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await recordEvents(sw);
    const results = await sw.evaluate((el) => {
      el.checked = true;
      const a = el.checked;
      const b = el.toggle();
      const c = el.toggle(true);
      const d = el.toggle(true);
      return [a, b, c, d];
    });
    expect(results).toEqual([true, false, true, true]);
    await page.waitForTimeout(20);
    expect(await recorded(sw)).toEqual([]);
  });

  test('the checked property reflects to the attribute without changing the default', async ({ page, mount }) => {
    await mount(`<gc-toggle-switch aria-label="Wi-Fi"></gc-toggle-switch>`);
    const sw = page.locator('gc-toggle-switch');
    await sw.evaluate((el) => { el.checked = true; });
    await expect(sw).toHaveAttribute('checked', '');
    expect(await sw.evaluate((el) => el.defaultChecked)).toBe(false);
  });

  test('properties set before the element is defined are kept', async ({ page, mount }) => {
    await mount(`<form><gc-toggle-switch name="a" aria-label="A"></gc-toggle-switch></form>`, { script: false });
    const sw = page.locator('gc-toggle-switch');
    await sw.evaluate(async (el) => {
      el.checked = true;
      el.value = 'yes';
      await import('/gc-toggle-switch.js');
    });
    expect(await isChecked(sw)).toBe(true);
    await expect(sw).toHaveAttribute('checked', '');
    expect(await page.locator('form').evaluate((f) => [...new FormData(f)])).toEqual([['a', 'yes']]);
  });
});
