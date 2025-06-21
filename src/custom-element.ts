import { DEFAULT_RENDER_OPTIONS } from './constants';
import { isCSSStyleSheet, renderState } from './render';
import { isServer, serverDefine } from './server-side';
import { createEffect, createSignal } from './signals';
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
	SignalOptions,
	SignalSetter,
	SignalWithInit,
} from './types';

const ANY_BINDING_REGEX = /(\{\{.+:.+\}\})/;

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
				const error = new Error('Cannot eject a custom element on the server.');
				console.error(error);
				throw error;
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
		#getPropSignal = ((prop: Extract<keyof Props, string>, { allowUndefined = false } = {}) => {
			if (!(prop in this.#propSignals)) this.#propSignals[prop] = createSignal<Props[typeof prop] | undefined>();
			const [_getter, __setter] = this.#propSignals[prop];
			let stackLength = 0;
			const _setter = (newValue: Props[typeof prop], options?: SignalOptions) => {
				stackLength++;
				queueMicrotask(() => stackLength--);
				if (stackLength > 999) {
					console.error(
						new Error(
							`Property signal setter stack overflow detected. Possible infinite loop. Bailing out.

Property: ${prop}

New value: ${JSON.stringify(newValue, null, 2)}

Element: <${this.tagName.toLowerCase()}>
`,
						),
					);
					stackLength = 0;
					return;
				}
				__setter(newValue, options);
			};
			const descriptor = Object.getOwnPropertyDescriptor(this, prop);
			if (descriptor === undefined) {
				Object.defineProperty(this, prop, {
					get: _getter,
					set: _setter,
					configurable: false,
					enumerable: true,
				});
			}
			const setter: SignalSetter<Props[typeof prop]> = (newValue: Props[typeof prop], options?: SignalOptions) => {
				// @ts-expect-error // TODO: look into this
				this[prop] = newValue;
				_setter(newValue, options);
			};
			const getter = ((options?: SignalOptions) => {
				const value = _getter(options);
				if (value === undefined && !allowUndefined) {
					const error = new Error(
						`Error accessing property: "${prop}"\nYou must set an initial value before calling a property signal's getter.\n`,
					);
					console.error(error);
					throw error;
				}
				return value;
			}) as SignalGetter<Props[typeof prop]>;
			getter.getter = true;
			const publicSignal = [getter, setter] as SignalWithInit<Props[typeof prop]>;
			publicSignal.init = (value) => {
				_setter(value);
				return [getter, setter] as Signal<Props[typeof prop]>;
			};
			return publicSignal;
		}).bind(this);
		#render = (() => {
			const root = this.#shadowRoot ?? this;
			renderState.currentShadowRoot = this.#shadowRoot;
			renderState.registry = shadowRootOptions.customElements ?? customElements;
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
				getter: (fn) => {
					const _fn: SignalGetter<ReturnType<typeof fn>> = () => fn();
					_fn.getter = true;
					return _fn;
				},
				customCallback: (fn) => {
					const key = crypto.randomUUID();
					this.__customCallbackFns?.set(key, fn);
					return `this.getRootNode().host.__customCallbackFns.get('${key}')(event)`;
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
					get: (_, prop: Extract<keyof Props, string>) => this.#getPropSignal(prop),
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

			for (const fn of this.#clientOnlyCallbackFns) {
				fn();
			}

			root.replaceChildren(fragment);

			renderState.currentShadowRoot = null;
			renderState.registry = customElements;
		}).bind(this);
		static get formAssociated() {
			return formAssociated;
		}
		static get observedAttributes() {
			return observedAttributes;
		}
		constructor() {
			try {
				super();
				if (!Object.prototype.hasOwnProperty.call(this, '__customCallbackFns')) {
					this.__customCallbackFns = new Map<string, () => void>();
				}
				for (const attr of this.attributes) {
					this.#attrSignals[attr.name] = createSignal<string | null>(attr.value);
				}
				for (const [attrName, attr] of this.#attributesAsPropertiesMap) {
					if (!(attrName in this.#attrSignals)) this.#attrSignals[attrName] = createSignal<string | null>(null);
					const propName = attr.prop as Extract<keyof Props, string>;
					const [getter] = this.#getPropSignal(propName, { allowUndefined: true });
					createEffect(() => {
						const value = getter();
						if (value === undefined) return;
						if (value !== null) {
							this.setAttribute(attrName, String(value));
						} else {
							this.removeAttribute(attrName);
						}
					});
				}
				this.#render();
			} catch (error) {
				const _error = new Error(
					'Error instantiating element:\nThis usually occurs if you have errors in the function body of your component. Check prior logs for possible causes.\n',
					{ cause: error },
				);
				console.error(_error);
				throw _error;
			}
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
		#attributesBusy = false;
		attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
			if (this.#attributesBusy || ANY_BINDING_REGEX.test(newValue ?? '')) return;
			const [, attrSetter] = this.#attrSignals[name] ?? [];
			attrSetter?.(newValue);
			const prop = this.#attributesAsPropertiesMap.get(name);
			if (prop !== undefined) {
				const propName = prop.prop as Extract<keyof Props, string>;
				this.#attributesBusy = true; // prevent infinite loop
				const [, propSetter] = this.#getPropSignal(propName);
				const propValue = (newValue === null ? null : prop.coerce(newValue)) as Props[typeof propName];
				propSetter(propValue);
				this.#attributesBusy = false;
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
