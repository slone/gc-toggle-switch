/**
 * Type definitions for <gc-toggle-switch>.
 * Importing "./gc-toggle-switch.js" also registers the element, so that
 * `document.querySelector('gc-toggle-switch')` and
 * `document.createElement('gc-toggle-switch')` are typed.
 */

export type ToggleSwitchOrientation = 'horizontal' | 'vertical';

export declare class ToggleSwitch extends HTMLElement {
  static readonly formAssociated: true;
  static readonly observedAttributes: string[];

  /** Current state, reflected to the `checked` attribute. Setting it fires no event. */
  get checked(): boolean;
  set checked(value: boolean);

  /** State restored by `form.reset()`. Initialised from the `checked` attribute. */
  get defaultChecked(): boolean;
  set defaultChecked(value: boolean);

  /** Reflects the `disabled` attribute (not a parent `<fieldset disabled>`). */
  get disabled(): boolean;
  set disabled(value: boolean);

  /** Reflects the `busy` attribute: shows a spinner and ignores user actions. */
  get busy(): boolean;
  set busy(value: boolean);

  /** Reflects the `required` attribute: the form is invalid while the switch is off. */
  get required(): boolean;
  set required(value: boolean);

  /** Field name in the form. */
  get name(): string;
  set name(value: string);

  /** Value submitted when the switch is on (`"on"` by default). */
  get value(): string;
  set value(value: string);

  /** Orientation set by the attribute; an orientation set in CSS is not visible here. */
  get orientation(): ToggleSwitchOrientation;
  /** `null`, `undefined` or `""` removes the attribute. */
  set orientation(value: ToggleSwitchOrientation | '' | null | undefined);

  /** Reflects the `state-labels` attribute: shows I / O indicators in the track. */
  get stateLabels(): boolean;
  set stateLabels(value: boolean);

  /** Always `"gc-toggle-switch"`. */
  get type(): 'gc-toggle-switch';

  /** Associated form, if any. */
  get form(): HTMLFormElement | null;
  /** Labels associated with the element. */
  get labels(): NodeList;
  get validity(): ValidityState;
  get validationMessage(): string;
  get willValidate(): boolean;

  checkValidity(): boolean;
  reportValidity(): boolean;
  /** An empty string clears the custom error. */
  setCustomValidity(message: string): void;

  /**
   * Toggles the state, or sets it when `force` is a boolean. Fires no event.
   * @returns the new state
   */
  toggle(force?: boolean): boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'gc-toggle-switch': ToggleSwitch;
  }
}
