/**
 * <toggle-switch> — interrupteur à bascule (« toggle switch ») accessible,
 * sans dépendance, sous forme de Custom Element natif et associé aux formulaires.
 *
 * Usage :
 *   <script type="module" src="./toggle-switch.js"></script>
 *   <label for="wifi">Wi-Fi</label>
 *   <toggle-switch id="wifi" name="wifi" checked></toggle-switch>
 *
 * Voir README.md pour la documentation complète.
 */

const STYLES = /* css */ `
:host {
  /* ---- API publique (surchargeable depuis la page) ----
     --switch-off-color      couleur de la piste à l'état off
     --switch-on-color       couleur de la piste à l'état on
     --switch-thumb-color    couleur du curseur
     --switch-thumb-shadow   ombre du curseur
     --switch-thumb-size     diamètre du curseur
     --switch-padding        espace entre curseur et bord de la piste
     --switch-length         longueur de la piste (grand côté)
     --switch-focus-color    couleur de l'anneau de focus
     --switch-duration       durée de l'animation
     --switch-vertical       0 = horizontal, 1 = vertical            */

  /* Valeurs par défaut, adaptées au thème clair/sombre via color-scheme. */
  --_def-off: #767676;
  --_def-on: #1a7f37;
  --_def-thumb: #ffffff;
  --_def-focus: #0b57d0;

  /* Orientation : l'attribut (règles plus bas) l'emporte sur la propriété CSS. */
  --_v: var(--switch-vertical, 0);

  --_thumb: var(--switch-thumb-size, 1.25em);
  --_pad: var(--switch-padding, 0.1875em);
  --_short: calc(var(--_thumb) + 2 * var(--_pad));
  --_long: var(--switch-length, calc(var(--_short) * 1.65));
  --_travel: calc(var(--_long) - var(--_short));
  --_dur: var(--switch-duration, 180ms);

  /* Couleurs : attribut > propriété CSS > défaut. */
  --_off: var(--_off-attr, var(--switch-off-color, var(--_def-off)));
  --_on: var(--_on-attr, var(--switch-on-color, var(--_def-on)));

  display: inline-block;
  position: relative;
  flex: none;
  box-sizing: border-box;
  vertical-align: middle;
  width: calc(var(--_short) + var(--_travel) * (1 - var(--_v)));
  height: calc(var(--_short) + var(--_travel) * var(--_v));
  border-radius: calc(var(--_short) / 2);
  cursor: pointer;
  outline: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

@supports (color: light-dark(#000, #fff)) {
  :host {
    --_def-off: light-dark(#767676, #8e8e93);
    --_def-on: light-dark(#1a7f37, #2ea043);
    --_def-focus: light-dark(#0b57d0, #a8c7fa);
  }
}
@supports not (color: light-dark(#000, #fff)) {
  @media (prefers-color-scheme: dark) {
    :host {
      --_def-off: #8e8e93;
      --_def-on: #2ea043;
      --_def-focus: #a8c7fa;
    }
  }
}

:host([hidden]) { display: none; }

:host([orientation="vertical" i]) { --_v: 1; }
:host([orientation="horizontal" i]) { --_v: 0; }

.track {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--_off);
  transition: background-color var(--_dur) ease;
}

.thumb {
  position: absolute;
  /* Position « off » : en bas à gauche, ce qui convient aux deux orientations. */
  left: var(--_pad);
  bottom: var(--_pad);
  width: var(--_thumb);
  height: var(--_thumb);
  border-radius: 50%;
  background: var(--switch-thumb-color, var(--_def-thumb));
  box-shadow: var(--switch-thumb-shadow, 0 1px 3px rgb(0 0 0 / 0.35), 0 0 0 0.5px rgb(0 0 0 / 0.08));
  transition: transform var(--_dur) cubic-bezier(0.3, 0.7, 0.4, 1);
}

:host([checked]) .track { background: var(--_on); }

/* Horizontal : vers la droite. Vertical : vers le haut (« on » = en haut). */
:host([checked]) .thumb {
  transform: translate(
    calc(var(--_travel) * (1 - var(--_v))),
    calc(var(--_travel) * -1 * var(--_v))
  );
}

:host(:focus-visible) .track {
  outline: 2px solid var(--switch-focus-color, var(--_def-focus));
  outline-offset: 2px;
}

:host([disabled]) { cursor: not-allowed; opacity: 0.45; }
:host(:disabled) { cursor: not-allowed; opacity: 0.45; }

@media (prefers-reduced-motion: reduce) {
  .track, .thumb { transition: none; }
}

@media (forced-colors: active) {
  .track, .thumb { forced-color-adjust: none; }
  .track { background: Canvas; border: 1px solid CanvasText; }
  .thumb { background: CanvasText; box-shadow: none; }
  :host([checked]) .track { background: Highlight; border-color: Highlight; }
  :host([checked]) .thumb { background: HighlightText; }
  :host(:focus-visible) .track { outline-color: Highlight; }
  :host([disabled]) .track, :host(:disabled) .track { border-color: GrayText; background: Canvas; }
  :host([disabled]) .thumb, :host(:disabled) .thumb { background: GrayText; }
  :host([disabled]), :host(:disabled) { opacity: 1; }
}
`;

let sharedSheet;
function getSheet() {
  if (!sharedSheet) {
    sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(STYLES);
  }
  return sharedSheet;
}

const COLOR_ATTRS = { 'off-color': '--_off-attr', 'on-color': '--_on-attr' };

function defaultValueMissingMessage(el) {
  const lang = (el.closest('[lang]')?.getAttribute('lang') || navigator.language || '').toLowerCase();
  return lang.startsWith('fr') ? 'Veuillez activer cet interrupteur.' : 'Please turn this switch on.';
}

export class ToggleSwitch extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['checked', 'disabled', 'required', 'value', 'off-color', 'on-color'];

  #internals;
  #track;
  #attrSheet;
  #checked = false;
  #defaultChecked = false;
  #reflecting = false;
  #formDisabled = false;
  #managedTabindex = false;
  #spacePressed = false;
  #customValidity = '';

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const root = this.attachShadow({ mode: 'open' });
    this.#attrSheet = new CSSStyleSheet();
    root.adoptedStyleSheets = [getSheet(), this.#attrSheet];
    root.innerHTML = '<span class="track" part="track"><span class="thumb" part="thumb"></span></span>';
    this.#track = root.querySelector('.track');

    this.#internals.role = 'switch';

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('keyup', this.#onKeyUp);
    this.addEventListener('blur', () => { this.#spacePressed = false; });
  }

  connectedCallback() {
    // Propriétés posées avant la définition de l'élément (upgrade).
    for (const prop of ['checked', 'defaultChecked', 'disabled', 'required', 'name', 'value', 'orientation']) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = this[prop];
        delete this[prop];
        this[prop] = v;
      }
    }
    this.#sync();
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'checked') {
      if (this.#reflecting) return;
      // Comme pour <input type="checkbox"> : l'attribut définit l'état par défaut
      // (utilisé par form.reset()) ; ici il fixe aussi l'état courant.
      this.#defaultChecked = value !== null;
      this.#checked = value !== null;
    } else if (name in COLOR_ATTRS) {
      this.#updateColorSheet();
      return;
    }
    this.#sync();
  }

  // ---- Formulaires ----------------------------------------------------------

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#sync();
  }

  formResetCallback() {
    this.#setChecked(this.#defaultChecked);
  }

  formStateRestoreCallback(state) {
    this.#setChecked(state === 'true');
  }

  // ---- Propriétés -----------------------------------------------------------

  get checked() { return this.#checked; }
  set checked(v) { this.#setChecked(Boolean(v)); }

  get defaultChecked() { return this.#defaultChecked; }
  set defaultChecked(v) { this.#defaultChecked = Boolean(v); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', Boolean(v)); }

  get required() { return this.hasAttribute('required'); }
  set required(v) { this.toggleAttribute('required', Boolean(v)); }

  get name() { return this.getAttribute('name') ?? ''; }
  set name(v) { this.setAttribute('name', v); }

  get value() { return this.getAttribute('value') ?? 'on'; }
  set value(v) { this.setAttribute('value', v); }

  get orientation() {
    return (this.getAttribute('orientation') || '').toLowerCase() === 'vertical' ? 'vertical' : 'horizontal';
  }
  set orientation(v) {
    if (v == null || v === '') this.removeAttribute('orientation');
    else this.setAttribute('orientation', v);
  }

  get type() { return 'toggle-switch'; }
  get form() { return this.#internals.form; }
  get labels() { return this.#internals.labels; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  get willValidate() { return this.#internals.willValidate; }

  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }
  setCustomValidity(message) {
    this.#customValidity = String(message ?? '');
    this.#sync();
  }

  /** Bascule l'état (ou le force si `force` est un booléen). Ne déclenche pas d'événement. */
  toggle(force) {
    this.checked = typeof force === 'boolean' ? force : !this.#checked;
    return this.#checked;
  }

  // ---- Interne --------------------------------------------------------------

  #isDisabled() {
    return this.hasAttribute('disabled') || this.#formDisabled;
  }

  #setChecked(v) {
    this.#checked = v;
    this.#reflecting = true;
    this.toggleAttribute('checked', v);
    this.#reflecting = false;
    this.#sync();
  }

  #onClick = (event) => {
    if (this.#isDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.#setChecked(!this.#checked);
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  #onKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || this.#isDisabled()) return;
    if (event.key === ' ') {
      event.preventDefault(); // pas de défilement de page
      this.#spacePressed = true;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // pas d'envoi implicite du formulaire
      if (!event.repeat) this.click();
    }
  };

  #onKeyUp = (event) => {
    if (event.key === ' ' && this.#spacePressed) {
      this.#spacePressed = false;
      if (!this.#isDisabled()) this.click();
    }
  };

  #updateColorSheet() {
    const decls = [];
    for (const [attr, prop] of Object.entries(COLOR_ATTRS)) {
      const value = this.getAttribute(attr)?.trim();
      // CSS.supports() écarte les valeurs invalides (et toute injection de CSS).
      if (value && CSS.supports('color', value)) decls.push(`${prop}: ${value};`);
    }
    this.#attrSheet.replaceSync(decls.length ? `:host { ${decls.join(' ')} }` : '');
  }

  #sync() {
    const internals = this.#internals;
    const checked = this.#checked;
    const disabled = this.#isDisabled();

    internals.ariaChecked = String(checked);
    internals.ariaDisabled = disabled ? 'true' : null;
    internals.ariaRequired = this.required ? 'true' : null;

    try {
      if (checked) internals.states.add('checked');
      else internals.states.delete('checked');
    } catch { /* CustomStateSet non pris en charge */ }

    internals.setFormValue(checked ? this.value : null, String(checked));

    if (this.#customValidity) {
      internals.setValidity({ customError: true }, this.#customValidity, this.#track);
    } else if (this.required && !checked) {
      internals.setValidity({ valueMissing: true }, defaultValueMissingMessage(this), this.#track);
    } else {
      internals.setValidity({});
    }

    if (!this.isConnected) return;
    if (disabled) {
      if (this.#managedTabindex) {
        this.removeAttribute('tabindex');
        this.#managedTabindex = false;
      }
    } else if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
      this.#managedTabindex = true;
    }
  }
}

if (!customElements.get('toggle-switch')) {
  customElements.define('toggle-switch', ToggleSwitch);
}
