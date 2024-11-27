declare global {
	interface DocumentFragment {
		host: HTMLElement;
	}
}

export type ElementResult = {
	define: (tagname: `${string}-${string}`) => ElementResult;
	register: (registry: RegistryResult) => ElementResult;
	eject: () => CustomElementConstructor;
};

export type AttributeChangedCallback = (name: string, oldValue: string | null, newValue: string | null) => void;

export type CustomElementProps = Record<PropertyKey, unknown>;

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

export type Coerce<T = unknown> = (value: string) => T;

export type RenderOptions = {
	formAssociated: boolean;
	observedAttributes: string[];
	attributesAsProperties: [string, Coerce][];
	attachShadow: boolean;
	shadowRootOptions: Partial<ShadowRootInit> & {
		customElements?: CustomElementRegistry; // necessary with the polyfill
		registry?: CustomElementRegistry | RegistryResult; // future proofing
	};
};

export type AttrProp<T = unknown> = {
	prop: string;
	coerce: Coerce<T>;
	value: T | null;
};

export type RenderFunction<Props extends CustomElementProps> = (args: RenderArgs<Props>) => DocumentFragment;

export type RegistryResult = {
	register: (tagName: string, CustomElement: CustomElementConstructor | ElementResult) => void;
	getTagName: (CustomElement: CustomElementConstructor | ElementResult) => string | undefined;
	eject: () => CustomElementRegistry;
	scoped: boolean;
};

export type RegistryArgs = {
	scoped: boolean;
};

export type ElementParent = Element | DocumentFragment | ShadowRoot;

export type Styles = CSSStyleSheet | HTMLStyleElement;

export type SignalOptions = { debugMode: boolean; label?: string };
export type SignalGetter<T> = (options?: SignalOptions) => T;
export type SignalSetter<T> = (newValue: T, options?: SignalOptions) => void;
export type Signal<T = unknown> = [SignalGetter<T>, SignalSetter<T>];
