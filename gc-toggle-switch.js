/**
 * <gc-toggle-switch> — interrupteur à bascule (« toggle switch ») accessible,
 * sans dépendance, sous forme de Custom Element natif et associé aux formulaires.
 *
 * Usage :
 *   <script type="module" src="./gc-toggle-switch.js"></script>
 *   <label for="wifi">Wi-Fi</label>
 *   <gc-toggle-switch id="wifi" name="wifi" checked></gc-toggle-switch>
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
     --switch-label-color    couleur des indicateurs d'état (I / O)
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

  /* Sens de lecture : 1 = gauche→droite, -1 = droite→gauche (dir="rtl"). */
  --_dir: 1;
  /* Déplacement de la position « off » à la position « on ».
     Horizontal : vers la fin de ligne (droite, ou gauche en RTL). Vertical : vers le haut. */
  --_shift: translate(
    calc(var(--_travel) * (1 - var(--_v)) * var(--_dir)),
    calc(var(--_travel) * -1 * var(--_v))
  );

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
:host(:dir(rtl)) { --_dir: -1; }

.track {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--_off);
  transition: background-color var(--_dur) ease;
}

/* Position « off » : en bas, au début de la ligne. Convient aux deux orientations. */
.thumb, .label {
  position: absolute;
  left: var(--_pad);
  bottom: var(--_pad);
  width: var(--_thumb);
  height: var(--_thumb);
}
:host(:dir(rtl)) .thumb, :host(:dir(rtl)) .label {
  left: auto;
  right: var(--_pad);
}

/* Indicateurs d'état (attribut state-labels ou slots "on"/"off") :
   chacun occupe l'extrémité laissée libre par le curseur. */
.label {
  display: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: var(--switch-label-color, #ffffff);
  line-height: 1;
  opacity: 0;
  transition: opacity var(--_dur) ease;
  pointer-events: none;
}
.show-labels .label { display: flex; }
.label.off { transform: var(--_shift); }
:host([checked]) .label.on, :host(:not([checked])) .label.off { opacity: 1; }
.label slot { font-size: 0.6em; font-weight: 700; }
.glyph-on {
  display: block;
  width: 0.2em;
  height: 1em;
  border-radius: 0.1em;
  background: currentColor;
}
.glyph-off {
  display: block;
  box-sizing: border-box;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  border: 0.2em solid currentColor;
}

.thumb {
  border-radius: 50%;
  background: var(--switch-thumb-color, var(--_def-thumb));
  box-shadow: var(--switch-thumb-shadow, 0 1px 3px rgb(0 0 0 / 0.35), 0 0 0 0.5px rgb(0 0 0 / 0.08));
  transition: transform var(--_dur) cubic-bezier(0.3, 0.7, 0.4, 1);
}

:host([checked]) .track { background: var(--_on); }

:host([checked]) .thumb { transform: var(--_shift); }

:host(:focus-visible) .track {
  outline: 2px solid var(--switch-focus-color, var(--_def-focus));
  outline-offset: 2px;
}

:host([disabled]) { cursor: not-allowed; opacity: 0.45; }
:host(:disabled) { cursor: not-allowed; opacity: 0.45; }

@media (prefers-reduced-motion: reduce) {
  .track, .thumb, .label { transition: none; }
}

@media (forced-colors: active) {
  .track, .thumb, .label { forced-color-adjust: none; }
  .label.off { color: CanvasText; }
  .label.on { color: HighlightText; }
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
  static observedAttributes = ['checked', 'disabled', 'required', 'value', 'off-color', 'on-color', 'state-labels'];

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
    root.innerHTML =
      '<span class="track" part="track">' +
        '<span class="label on" part="on-label" aria-hidden="true"><slot name="on"><span class="glyph-on"></span></slot></span>' +
        '<span class="label off" part="off-label" aria-hidden="true"><slot name="off"><span class="glyph-off"></span></slot></span>' +
        '<span class="thumb" part="thumb"></span>' +
      '</span>';
    this.#track = root.querySelector('.track');
    for (const slot of root.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => this.#updateLabels());
    }

    this.#internals.role = 'switch';

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('keyup', this.#onKeyUp);
    this.addEventListener('blur', () => { this.#spacePressed = false; });
  }

  connectedCallback() {
    // Propriétés posées avant la définition de l'élément (upgrade).
    for (const prop of ['checked', 'defaultChecked', 'disabled', 'required', 'name', 'value', 'orientation', 'stateLabels']) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const v = this[prop];
        delete this[prop];
        this[prop] = v;
      }
    }
    this.#updateLabels();
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
    } else if (name === 'state-labels') {
      this.#updateLabels();
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

  get stateLabels() { return this.hasAttribute('state-labels'); }
  set stateLabels(v) { this.toggleAttribute('state-labels', Boolean(v)); }

  get type() { return 'gc-toggle-switch'; }
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
    // Comme <input type="checkbox"> : l'état bascule tout de suite (les écouteurs
    // de `click` voient le nouvel état), puis, une fois l'événement entièrement
    // propagé, il est annulé si un écouteur a appelé preventDefault().
    this.#setChecked(!this.#checked);

    let settled = false;
    const settle = (e) => {
      if (settled || (e && e !== event)) return;
      settled = true;
      window.removeEventListener('click', settle);
      if (event.defaultPrevented) {
        this.#setChecked(!this.#checked);
      } else {
        this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    // Fin de la propagation : l'écouteur ajouté sur window s'exécute en dernier.
    // Repli si la propagation est stoppée ou si l'élément n'est pas dans le document.
    window.addEventListener('click', settle);
    setTimeout(settle, 0);
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

  #updateLabels() {
    const show = this.hasAttribute('state-labels') ||
      [...this.children].some((child) => child.slot === 'on' || child.slot === 'off');
    this.#track.classList.toggle('show-labels', show);
  }

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

if (!customElements.get('gc-toggle-switch')) {
  customElements.define('gc-toggle-switch', ToggleSwitch);
}
