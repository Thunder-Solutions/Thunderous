import { setInnerHTML } from './html-helpers';
import { isCSSStyleSheet, Styles } from './render';
import { createSignal, Signal, SignalGetter, SignalSetter } from './signals';

declare global {
	interface DocumentFragment {
		host: HTMLElement;
	}
}

type ElementResult = {
	define: (tagname: `${string}-${string}`) => ElementResult;
	register: (registry: Registry) => ElementResult;
	eject: () => CustomElementConstructor;
};

type AttributeChangedCallback = (name: string, oldValue: string | null, newValue: string | null) => void;

type CustomElementProps = Record<PropertyKey, unknown>;

export type RenderArgs<Props extends CustomElementProps> = {
	elementRef: HTMLElement;
	root: ShadowRoot | HTMLElement;
	internals: ElementInternals;
	attributeChangedCallback: (fn: AttributeChangedCallback) => void;
	connectedCallback: (fn: () => void) => void;
	disconnectedCallback: (fn: () => void) => void;
	adoptedCallback: (fn: () => void) => void;
	formDisabledCallback: (fn: () => void) => void;
	formResetCallback: (fn: () => void) => void;
	formStateRestoreCallback: (fn: () => void) => void;
	formAssociatedCallback: (fn: () => void) => void;
	customCallback: (fn: () => void) => `{{callback:${string}}}`;
	attrSignals: Record<string, Signal<string | null>>;
	propSignals: {
		[K in keyof Props]: Signal<Props[K]>;
	};
	refs: Record<string, HTMLElement | null>;
	adoptStyleSheet: (stylesheet: Styles) => void;
};

type Coerce<T = unknown> = (value: string) => T;

type RenderOptions = {
	formAssociated: boolean;
	observedAttributes: string[];
	attributesAsProperties: [string, Coerce][];
	attachShadow: boolean;
	shadowRootOptions: ShadowRootInit;
};

const DEFAULT_RENDER_OPTIONS: RenderOptions = {
	formAssociated: false,
	observedAttributes: [],
	attributesAsProperties: [],
	attachShadow: true,
	shadowRootOptions: {
		mode: 'closed',
	},
};

type AttrProp<T = unknown> = {
	prop: string;
	coerce: Coerce<T>;
	value: T | null;
};

export type RenderFunction<Props extends CustomElementProps> = (args: RenderArgs<Props>) => DocumentFragment;

const getPropName = (attrName: string) =>
	attrName
		.replace(/^([A-Z]+)/, (_, letter) => letter.toLowerCase())
		.replace(/(-|_| )([a-zA-Z])/g, (_, letter) => letter.toUpperCase());

/**
 * Create a custom element that can be defined for use in the DOM.
 * @example
 * ```ts
 * const MyElement = customElement(() => {
 *   return html`<h1>Hello, World!</h1>`;
 * });
 * MyElement.define('my-element');
 * ```
 */
export const customElement = <Props extends CustomElementProps>(
	render: RenderFunction<Props>,
	options?: Partial<RenderOptions>,
): ElementResult => {
	const {
		formAssociated,
		observedAttributes: _observedAttributes,
		attributesAsProperties,
		attachShadow,
		shadowRootOptions: _shadowRootOptions,
	} = { ...DEFAULT_RENDER_OPTIONS, ...options };

	const shadowRootOptions = { ...DEFAULT_RENDER_OPTIONS.shadowRootOptions, ..._shadowRootOptions };

	// must set observedAttributes prior to defining the class
	const observedAttributesSet = new Set(_observedAttributes);
	const attributesAsPropertiesMap = new Map<string, AttrProp>();
	for (const [attrName, coerce] of attributesAsProperties) {
		observedAttributesSet.add(attrName);
		attributesAsPropertiesMap.set(attrName, {
			prop: getPropName(attrName),
			coerce,
			value: null,
		});
	}
	const observedAttributes = Array.from(observedAttributesSet);

	class CustomElement extends HTMLElement {
		#attributesAsPropertiesMap = new Map(attributesAsPropertiesMap);
		#attrSignals: Record<string, Signal<string | null> | undefined> = {};
		#propSignals = {} as {
			[K in keyof Props]: Signal<Props[K] | undefined>;
		};
		#attributeChangedFns = new Set<AttributeChangedCallback>();
		#connectedFns = new Set<() => void>();
		#disconnectedFns = new Set<() => void>();
		#adoptedCallbackFns = new Set<() => void>();
		#formAssociatedCallbackFns = new Set<() => void>();
		#formDisabledCallbackFns = new Set<() => void>();
		#formResetCallbackFns = new Set<() => void>();
		#formStateRestoreCallbackFns = new Set<() => void>();
		__customCallbackFns = new Map<string, () => void>();
		#shadowRoot = attachShadow ? this.attachShadow(shadowRootOptions) : null;
		#internals = this.attachInternals();
		#observer =
			options?.observedAttributes !== undefined
				? null
				: new MutationObserver((mutations) => {
						for (const mutation of mutations) {
							const attrName = mutation.attributeName;
							if (mutation.type !== 'attributes' || attrName === null) continue;
							if (!(attrName in this.#attrSignals)) this.#attrSignals[attrName] = createSignal<string | null>(null);
							const [getter, setter] = this.#attrSignals[attrName] as Signal<string | null>;
							const _oldValue = getter();
							const oldValue = _oldValue === null ? null : _oldValue;
							const newValue = this.getAttribute(attrName);
							setter(newValue);
							for (const fn of this.#attributeChangedFns) {
								fn(attrName, oldValue, newValue);
							}
						}
					});
		#render() {
			const root = this.#shadowRoot ?? this;
			const fragment = render({
				elementRef: this,
				root,
				internals: this.#internals,
				attributeChangedCallback: (fn) => this.#attributeChangedFns.add(fn),
				connectedCallback: (fn) => this.#connectedFns.add(fn),
				disconnectedCallback: (fn) => this.#disconnectedFns.add(fn),
				adoptedCallback: (fn) => this.#adoptedCallbackFns.add(fn),
				formAssociatedCallback: (fn) => this.#formAssociatedCallbackFns.add(fn),
				formDisabledCallback: (fn) => this.#formDisabledCallbackFns.add(fn),
				formResetCallback: (fn) => this.#formResetCallbackFns.add(fn),
				formStateRestoreCallback: (fn) => this.#formStateRestoreCallbackFns.add(fn),
				customCallback: (fn) => {
					const key = crypto.randomUUID();
					this.__customCallbackFns.set(key, fn);
					return `{{callback:${key}}}`;
				},
				attrSignals: new Proxy(
					{},
					{
						get: (_, prop: string) => {
							if (!(prop in this.#attrSignals)) this.#attrSignals[prop] = createSignal<string | null>(null);
							const [getter] = this.#attrSignals[prop] as Signal<string | null>;
							const setter = (newValue: string) => this.setAttribute(prop, newValue);
							return [getter, setter];
						},
						set: () => {
							console.error('Signals must be assigned via setters.');
							return false;
						},
					},
				),
				propSignals: new Proxy({} as RenderArgs<Props>['propSignals'], {
					get: (_, prop: Extract<keyof Props, string>) => {
						if (!(prop in this.#propSignals)) this.#propSignals[prop] = createSignal<Props[typeof prop] | undefined>();
						const [_getter, _setter] = this.#propSignals[prop];
						const setter: SignalSetter<Props[typeof prop]> = (newValue: Props[typeof prop]) => {
							// @ts-expect-error // TODO: look into this
							this[prop] = newValue;
							_setter(newValue);
						};
						const getter: SignalGetter<Props[typeof prop]> = () => {
							const value = _getter();
							if (value === undefined)
								throw new Error(
									`\n\nProperty: ${prop}\n\nYou must set an initial value before calling a property signal's getter.\n`,
								);
							return value;
						};
						return [getter, setter];
					},
					set: () => {
						console.error('Signals must be assigned via setters.');
						return false;
					},
				}),
				refs: new Proxy(
					{},
					{
						get: (_, prop: string) => root.querySelector(`[ref=${prop}]`),
						set: () => {
							console.error('Refs are readonly and cannot be assigned.');
							return false;
						},
					},
				),
				adoptStyleSheet: (stylesheet) => {
					if (!attachShadow) {
						console.warn(
							'Styles are only encapsulated when using shadow DOM. The stylesheet will be applied to the global document instead.',
						);
					}
					if (isCSSStyleSheet(stylesheet)) {
						if (this.#shadowRoot === null) {
							for (const rule of stylesheet.cssRules) {
								if (rule instanceof CSSStyleRule && rule.selectorText.includes(':host')) {
									console.error('Styles with :host are not supported when not using shadow DOM.');
								}
							}
							document.adoptedStyleSheets.push(stylesheet);
							return;
						}
						this.#shadowRoot.adoptedStyleSheets.push(stylesheet);
					} else {
						requestAnimationFrame(() => {
							root.appendChild(stylesheet);
						});
					}
				},
			});
			fragment.host = this;
			setInnerHTML(root, fragment);
		}
		static get formAssociated() {
			return formAssociated;
		}
		static get observedAttributes() {
			return observedAttributes;
		}
		constructor() {
			super();
			for (const [attrName, attr] of this.#attributesAsPropertiesMap) {
				this.#attrSignals[attrName] = createSignal<string | null>(null);
				Object.defineProperty(this, attr.prop, {
					get: () => {
						if (!(attrName in this.#attrSignals)) this.#attrSignals[attrName] = createSignal<string | null>(null);
						const [getter] = this.#attrSignals[attrName] as Signal<string | null>;
						const raw = getter();
						const rawOnly = raw !== null && attr.value === null;
						const value = rawOnly ? attr.coerce(raw) : attr.value; // avoid coercion when possible
						return value === null ? null : value;
					},
					set: (newValue) => {
						const oldValue = attr.value;
						attr.value = newValue;
						if (!(attrName in this.#attrSignals)) this.#attrSignals[attrName] = createSignal<string | null>(null);
						const [, attrSetter] = this.#attrSignals[attrName] as Signal<string | null>;
						const [, propSetter] = this.#propSignals[attrName] as Signal;
						const attrValue = newValue === null ? null : String(newValue);
						if (String(oldValue) === attrValue) return;
						attrSetter(attrValue);
						propSetter(newValue);
						if (attrValue === null) this.removeAttribute(attrName);
						else this.setAttribute(attrName, attrValue);
					},
					configurable: true,
					enumerable: true,
				});
			}
			for (const attr of this.attributes) {
				this.#attrSignals[attr.name] = createSignal<string | null>(attr.value);
			}
			this.#render();
		}
		connectedCallback() {
			if (this.#observer !== null) {
				this.#observer.observe(this, { attributes: true });
			}
			for (const fn of this.#connectedFns) {
				fn();
			}
		}
		disconnectedCallback() {
			if (this.#observer !== null) {
				this.#observer.disconnect();
			}
			for (const fn of this.#disconnectedFns) {
				fn();
			}
		}
		attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
			const [, attrSetter] = this.#attrSignals[name] ?? [];
			attrSetter?.(newValue);
			const prop = this.#attributesAsPropertiesMap.get(name);
			if (prop !== undefined) {
				// @ts-expect-error // TODO: look into this
				this[prop.prop] = newValue === null ? null : prop.coerce(newValue);
			}
			for (const fn of this.#attributeChangedFns) {
				fn(name, oldValue, newValue);
			}
		}
		adoptedCallback() {
			for (const fn of this.#adoptedCallbackFns) {
				fn();
			}
		}
		formAssociatedCallback() {
			for (const fn of this.#formAssociatedCallbackFns) {
				fn();
			}
		}
		formDisabledCallback() {
			for (const fn of this.#formDisabledCallbackFns) {
				fn();
			}
		}
		formResetCallback() {
			for (const fn of this.#formResetCallbackFns) {
				fn();
			}
		}
		formStateRestoreCallback() {
			for (const fn of this.#formStateRestoreCallbackFns) {
				fn();
			}
		}
	}
	let _tagname: string | null = null;
	let _registry: Registry | null = null;
	let _registered = false;
	const register = () => {
		if (_tagname === null || _registry === null || _registered) return;
		_registry.register(_tagname, CustomElement);
		_registry.register(_tagname, elementResult);
		_registered = true;
	};
	const elementResult: ElementResult = {
		define(tagname) {
			if (customElements.get(tagname) !== undefined) {
				console.warn(`Custom element "${tagname}" was already defined. Skipping...`);
				return this;
			}
			customElements.define(tagname, CustomElement);
			_tagname = tagname;
			register();
			return this;
		},
		register(registry) {
			_registry = registry;
			register();
			return this;
		},
		eject: () => CustomElement,
	};
	return elementResult;
};

type Registry = {
	register: (tagName: string, element: CustomElementConstructor | ElementResult) => void;
	getTagName: (element: CustomElementConstructor | ElementResult) => string | undefined;
};

/**
 * Create a registry for custom elements.
 *
 * This allows you to delegate custom element definitions to the consumer of your library,
 * by using their associated classes to look up tag names dynamically.
 *
 * This can be useful when you need to select a custom element whose tag name is variable.
 * @example
 * ```ts
 * const registry = createRegistry();
 * registry.register('my-element', MyElement);
 * const tagName = registry.getTagName(MyElement);
 * console.log(tagName); // 'MY-ELEMENT'
 * ```
 */
export const createRegistry = (): Registry => {
	const registry = new Map<CustomElementConstructor | ElementResult, string>();
	return {
		register: (tagName: string, element: CustomElementConstructor | ElementResult) => {
			if (registry.has(element)) {
				console.warn(`Custom element class "${element.constructor.name}" was already registered. Skipping...`);
				return;
			}
			registry.set(element, tagName.toUpperCase());
		},
		getTagName: (element: CustomElementConstructor | ElementResult) => registry.get(element),
	};
};
