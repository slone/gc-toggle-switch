import { test, expect, internals } from './fixtures.js';

/** Entries the form would submit, as [name, value] pairs. */
function formEntries(page, selector = 'form') {
  return page.locator(selector).evaluate((form) => [...new FormData(form)]);
}

test.describe('form association', () => {
  test('submits name=value when on, nothing when off', async ({ page, mount }) => {
    await mount(`
      <form>
        <gc-toggle-switch name="wifi" aria-label="Wi-Fi" checked></gc-toggle-switch>
        <gc-toggle-switch name="bt" aria-label="Bluetooth"></gc-toggle-switch>
      </form>`);
    expect(await formEntries(page)).toEqual([['wifi', 'on']]);

    await page.locator('[name=bt]').click();
    await page.locator('[name=wifi]').click();
    expect(await formEntries(page)).toEqual([['bt', 'on']]);
  });

  test('submits the value attribute', async ({ page, mount }) => {
    await mount(`
      <form>
        <gc-toggle-switch name="mode" value="dark" aria-label="Dark mode" checked></gc-toggle-switch>
      </form>`);
    expect(await formEntries(page)).toEqual([['mode', 'dark']]);

    await page.locator('gc-toggle-switch').evaluate((el) => { el.value = 'night'; });
    expect(await formEntries(page)).toEqual([['mode', 'night']]);
  });

  test('exposes form, labels, type and willValidate', async ({ page, mount }) => {
    await mount(`
      <form id="f">
        <label for="sw">Wi-Fi</label>
        <gc-toggle-switch id="sw" name="wifi"></gc-toggle-switch>
      </form>`);
    const info = await page.locator('#sw').evaluate((el) => ({
      form: el.form?.id,
      labels: [...el.labels].map((l) => l.textContent),
      type: el.type,
      willValidate: el.willValidate,
      inElements: [...el.form.elements].includes(el),
    }));
    expect(info).toEqual({
      form: 'f', labels: ['Wi-Fi'], type: 'gc-toggle-switch', willValidate: true, inElements: true,
    });
  });

  test('form.reset() restores the default state', async ({ page, mount }) => {
    await mount(`
      <form>
        <gc-toggle-switch id="a" name="a" aria-label="A" checked></gc-toggle-switch>
        <gc-toggle-switch id="b" name="b" aria-label="B"></gc-toggle-switch>
      </form>`);
    const a = page.locator('#a');
    const b = page.locator('#b');
    await a.click();
    await b.click();
    await expect(a).not.toHaveAttribute('checked');
    await expect(b).toHaveAttribute('checked', '');

    await page.locator('form').evaluate((form) => form.reset());
    expect(await a.evaluate((el) => el.checked)).toBe(true);
    expect(await b.evaluate((el) => el.checked)).toBe(false);
    await expect(a).toHaveAttribute('checked', '');
    await expect(b).not.toHaveAttribute('checked');
    expect(await formEntries(page)).toEqual([['a', 'on']]);
  });

  test('form.reset() uses defaultChecked when set by script', async ({ page, mount }) => {
    await mount(`<form><gc-toggle-switch name="a" aria-label="A"></gc-toggle-switch></form>`);
    const sw = page.locator('gc-toggle-switch');
    await sw.evaluate((el) => { el.defaultChecked = true; });
    expect(await sw.evaluate((el) => el.checked)).toBe(false);

    await page.locator('form').evaluate((form) => form.reset());
    expect(await sw.evaluate((el) => el.checked)).toBe(true);
  });

  test('form.reset() fires no change event', async ({ page, mount }) => {
    await mount(`<form><gc-toggle-switch name="a" aria-label="A"></gc-toggle-switch></form>`);
    const sw = page.locator('gc-toggle-switch');
    await sw.click();
    const fired = await page.evaluate(async () => {
      const el = document.querySelector('gc-toggle-switch');
      let count = 0;
      el.addEventListener('change', () => count++);
      el.form.reset();
      await new Promise((r) => setTimeout(r, 20));
      return count;
    });
    expect(fired).toBe(0);
  });

  test('required: invalid while off, valid once on', async ({ page, mount }) => {
    await mount(`
      <form>
        <gc-toggle-switch name="terms" aria-label="Terms" required></gc-toggle-switch>
      </form>`);
    const sw = page.locator('gc-toggle-switch');
    const state = () => sw.evaluate((el) => ({
      valid: el.checkValidity(),
      valueMissing: el.validity.valueMissing,
      formValid: el.form.checkValidity(),
      message: el.validationMessage,
      invalidMatches: el.matches(':invalid'),
    }));

    expect(await state()).toEqual({
      valid: false,
      valueMissing: true,
      formValid: false,
      message: 'Please turn this switch on.',
      invalidMatches: true,
    });

    await sw.click();
    expect(await state()).toEqual({
      valid: true, valueMissing: false, formValid: true, message: '', invalidMatches: false,
    });
  });

  test('required: submission is blocked while off', async ({ page, mount }) => {
    await mount(`
      <form>
        <gc-toggle-switch name="terms" aria-label="Terms" required></gc-toggle-switch>
        <button>Send</button>
      </form>`);
    await page.locator('form').evaluate((form) => {
      window.submitted = 0;
      window.invalid = 0;
      form.addEventListener('submit', (e) => { e.preventDefault(); window.submitted++; });
      form.querySelector('gc-toggle-switch').addEventListener('invalid', () => window.invalid++);
    });

    await page.locator('form').evaluate((form) => form.requestSubmit());
    expect(await page.evaluate(() => [window.submitted, window.invalid])).toEqual([0, 1]);

    await page.locator('gc-toggle-switch').click();
    await page.locator('form').evaluate((form) => form.requestSubmit());
    expect(await page.evaluate(() => [window.submitted, window.invalid])).toEqual([1, 1]);
  });

  test('the built-in validation message follows the page language', async ({ page, mount }) => {
    await mount(`<form><gc-toggle-switch aria-label="Conditions" required></gc-toggle-switch></form>`, { lang: 'fr' });
    expect(await page.locator('gc-toggle-switch').evaluate((el) => el.validationMessage))
      .toBe('Veuillez activer cet interrupteur.');

    await page.evaluate(() => document.documentElement.setAttribute('lang', 'en'));
    expect(await page.locator('gc-toggle-switch').evaluate((el) => el.validationMessage))
      .toBe('Please turn this switch on.');
  });

  test('setCustomValidity() sets and clears a custom error', async ({ page, mount }) => {
    await mount(`<form><gc-toggle-switch aria-label="A" checked></gc-toggle-switch></form>`);
    const sw = page.locator('gc-toggle-switch');
    const result = await sw.evaluate((el) => {
      el.setCustomValidity('Not now');
      const set = [el.checkValidity(), el.validity.customError, el.validationMessage];
      el.setCustomValidity('');
      const cleared = [el.checkValidity(), el.validity.customError, el.validationMessage];
      return { set, cleared };
    });
    expect(result).toEqual({ set: [false, true, 'Not now'], cleared: [true, false, ''] });
  });

  test('<fieldset disabled> disables the switch', async ({ page, mount }) => {
    await mount(`
      <form>
        <fieldset>
          <gc-toggle-switch name="a" aria-label="A"></gc-toggle-switch>
        </fieldset>
      </form>`);
    const sw = page.locator('gc-toggle-switch');
    await expect(sw).toHaveAttribute('tabindex', '0');

    await page.locator('fieldset').evaluate((f) => { f.disabled = true; });
    expect(await sw.evaluate((el) => el.matches(':disabled'))).toBe(true);
    await expect(sw).not.toHaveAttribute('tabindex');
    expect((await internals(sw)).ariaDisabled).toBe('true');

    await sw.click({ force: true });
    expect(await sw.evaluate((el) => el.checked)).toBe(false);
    // Disabled controls are not submitted, even when on.
    await sw.evaluate((el) => { el.checked = true; });
    expect(await formEntries(page)).toEqual([]);

    await page.locator('fieldset').evaluate((f) => { f.disabled = false; });
    await expect(sw).toHaveAttribute('tabindex', '0');
    expect((await internals(sw)).ariaDisabled).toBeNull();
    expect(await formEntries(page)).toEqual([['a', 'on']]);
  });

  test('clicking a <label for> toggles the switch', async ({ page, mount }) => {
    await mount(`
      <label for="sw">Wi-Fi</label>
      <gc-toggle-switch id="sw"></gc-toggle-switch>`);
    await page.getByText('Wi-Fi').click();
    expect(await page.locator('#sw').evaluate((el) => el.checked)).toBe(true);
    await page.getByText('Wi-Fi').click();
    expect(await page.locator('#sw').evaluate((el) => el.checked)).toBe(false);
  });

  test('clicking a wrapping <label> toggles the switch once', async ({ page, mount }) => {
    await mount(`<label><span>Bluetooth</span> <gc-toggle-switch></gc-toggle-switch></label>`);
    await page.getByText('Bluetooth').click();
    expect(await page.locator('gc-toggle-switch').evaluate((el) => el.checked)).toBe(true);
    await page.locator('gc-toggle-switch').click();
    expect(await page.locator('gc-toggle-switch').evaluate((el) => el.checked)).toBe(false);
  });

  test('a label that sends the click again does not toggle the switch back', async ({ page, mount }) => {
    // What Firefox's label activation does for a click on the switch itself.
    await mount(`<label><span>Bluetooth</span> <gc-toggle-switch></gc-toggle-switch></label>`);
    await page.locator('label').evaluate((label) => {
      label.addEventListener('click', (e) => {
        if (e.target.localName === 'gc-toggle-switch') e.target.click();
      });
    });
    const sw = page.locator('gc-toggle-switch');
    await sw.click();
    expect(await sw.evaluate((el) => el.checked)).toBe(true);
    await sw.click();
    expect(await sw.evaluate((el) => el.checked)).toBe(false);
  });

  test('the keyboard toggles a switch in a wrapping <label> once', async ({ page, mount }) => {
    await mount(`<label><span>Bluetooth</span> <gc-toggle-switch></gc-toggle-switch></label>`);
    const sw = page.locator('gc-toggle-switch');
    await sw.focus();
    await page.keyboard.press(' ');
    expect(await sw.evaluate((el) => el.checked)).toBe(true);
    await page.keyboard.press('Enter');
    expect(await sw.evaluate((el) => el.checked)).toBe(false);
  });
});
