import { DEFAULT_RENDER_OPTIONS } from './constants';
import { isCSSStyleSheet, setInnerHTML } from './render';
import { isServer, serverDefine } from './server-side';
import { createSignal } from './signals';
import type {
	AttributeChangedCallback,
	AttrProp,
	CustomElementProps,
	ElementResult,
	RegistryResult,
	RenderArgs,
	RenderFunction,
	RenderOptions,
	ServerRenderFunction,
	Signal,
	SignalGetter,
	SignalSetter,
} from './types';

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
	const _options = { ...DEFAULT_RENDER_OPTIONS, ...options };

	const {
		formAssociated,
		observedAttributes: _observedAttributes,
		attributesAsProperties,
		attachShadow,
		shadowRootOptions: _shadowRootOptions,
	} = _options;

	const shadowRootOptions = { ...DEFAULT_RENDER_OPTIONS.shadowRootOptions, ..._shadowRootOptions };

	const allOptions = { ..._options, shadowRootOptions };

	if (isServer) {
		const serverRender = render as unknown as ServerRenderFunction;
		let _tagName: string | undefined;
		let _registry: RegistryResult | undefined;
		const scopedRegistry = (() => {
			if (
				shadowRootOptions.registry !== undefined &&
				'scoped' in shadowRootOptions.registry &&
				shadowRootOptions.registry.scoped
			) {
				return shadowRootOptions.registry;
			}
		})();
		return {
			define(tagName) {
				_tagName = tagName;
				serverDefine({
					tagName,
					serverRender,
					options: allOptions,
					scopedRegistry,
					parentRegistry: _registry,
					elementResult: this,
				});
				return this;
			},
			register(registry) {
				if (_tagName !== undefined && 'eject' in registry && registry.scoped) {
					console.error('Must call `register()` before `define()` for scoped registries.');
					return this;
				}
				if ('eject' in registry) {
					_registry = registry;
				} else {
					console.error('Registry must be created with `createRegistry()` for SSR.');
				}
				return this;
			},
			eject() {
				throw new Error('Cannot eject a custom element on the server.');
			},
		};
	}

	shadowRootOptions.registry = shadowRootOptions.customElements =
		shadowRootOptions.registry instanceof CustomElementRegistry
			? shadowRootOptions.registry
			: shadowRootOptions.registry?.eject();

	// must set observedAttributes prior to defining the class
	const observedAttributesSet = new Set(_observedAttributes);
	const attributesAsPropertiesMap = new Map<string, AttrProp>();
	for (const [attrName, coerce] of attributesAsProperties) {
		observedAttributesSet.add(attrName);
		attributesAsPropertiesMap.set(attrName, {
			// convert kebab-case attribute names to camelCase property names
			prop: attrName
				.replace(/^([A-Z]+)/, (_, letter: string) => letter.toLowerCase())
				.replace(/(-|_| )([a-zA-Z])/g, (_, letter: string) => letter.toUpperCase()),
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
		#clientOnlyCallbackFns = new Set<() => void>();
		__customCallbackFns = new Map<string, () => void>();
		#shadowRoot = attachShadow ? this.attachShadow(shadowRootOptions as ShadowRootInit) : null;
		#internals = this.attachInternals();
		#observer =
			options?.observedAttributes !== undefined
				? null
				: new MutationObserver((mutations) => {
						for (const mutation of mutations) {
							const attrName = mutation.attributeName;
							if (mutation.type !== 'attributes' || attrName === null) continue;
							if (!(attrName in this.#attrSignals)) this.#attrSignals[attrName] = createSignal<string | null>(null);
							const [getter, setter] = this.#attrSignals[attrName]!;
							const oldValue = getter();
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
				clientOnlyCallback: (fn) => this.#clientOnlyCallbackFns.add(fn),
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
							const [getter] = this.#attrSignals[prop]!;
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
						get: (_, prop: string) => root.querySelector<HTMLElement>(`[ref=${prop}]`),
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

			// The polyfill only supports upgrading scoped elements when using innerHTML.
			// The following code is a workaround to upgrade elements when appending a DocumentFragment.
			const registry =
				shadowRootOptions.registry instanceof CustomElementRegistry
					? shadowRootOptions.registry
					: shadowRootOptions.registry?.eject();

			const tempContainer = document.createElement('div');
			tempContainer.append(fragment.cloneNode(true));
			const fragmentContent = tempContainer.innerHTML;
			root.innerHTML = fragmentContent;

			if (registry?.__tagNames !== undefined) {
				for (const tagName of registry.__tagNames) {
					const upgradedElements = root.querySelectorAll(tagName);
					const nonUpgradedElements = fragment.querySelectorAll(tagName);
					upgradedElements.forEach((upgradedElement, index) => {
						const nonUpgradedElement = nonUpgradedElements[index];
						nonUpgradedElement.replaceWith(upgradedElement);
					});
				}
			}
			// ------ end workaround ------

			for (const fn of this.#clientOnlyCallbackFns) {
				fn();
			}

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
						const [getter] = this.#attrSignals[attrName]!;
						const raw = getter();
						const rawOnly = raw !== null && attr.value === null;
						const value = rawOnly ? attr.coerce(raw) : attr.value; // avoid coercion when possible
						return value === null ? null : value;
					},
					set: (newValue) => {
						const oldValue = attr.value;
						attr.value = newValue;
						if (!(attrName in this.#attrSignals)) this.#attrSignals[attrName] = createSignal<string | null>(null);
						const [, attrSetter] = this.#attrSignals[attrName]!;
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
	let _tagName: string | undefined;
	let _registry: RegistryResult | CustomElementRegistry | undefined;
	const elementResult: ElementResult = {
		define(tagName, options) {
			const registry = _registry ?? customElements;
			const nativeRegistry = 'eject' in registry ? registry.eject() : registry;
			if (nativeRegistry.get(tagName) !== undefined) {
				console.warn(`Custom element "${tagName}" was already defined. Skipping...`);
				return this;
			}
			registry.define(tagName, CustomElement, options);
			_tagName = tagName;
			return this;
		},
		register(registry) {
			if (_tagName !== undefined && 'eject' in registry && registry.scoped) {
				console.error('Must call `register()` before `define()` for scoped registries.');
				return this;
			}
			_registry = registry;
			return this;
		},
		eject: () => CustomElement,
	};
	return elementResult;
};
