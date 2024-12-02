declare global {
	interface DocumentFragment {
		host: HTMLElement;
	}
	interface Element {
		__findHost: () => Element;
	}
	interface CustomElementRegistry {
		__tagNames: Set<string>;
	}
}

export type TagName = `${string}-${string}`;

export type ElementResult = {
	define: (tagName: TagName, options?: ElementDefinitionOptions) => ElementResult;
	register: (registry: RegistryResult | CustomElementRegistry) => ElementResult;
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
	clientOnlyCallback: (fn: () => void) => void;
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
		registry?: CustomElementRegistry | RegistryResult; // current state of the proposal
		clonable?: boolean; // missing from typescript but present in the spec
	};
};

export type AttrProp<T = unknown> = {
	prop: string;
	coerce: Coerce<T>;
	value: T | null;
};

export type RenderFunction<Props extends CustomElementProps> = (args: RenderArgs<Props>) => DocumentFragment;

export type ServerRenderFunction = (args: RenderArgs<CustomElementProps>) => string;

export type ServerRenderOptions = { serverRender: ServerRenderFunction } & RenderOptions;

export type ServerDefineArgs = {
	tagName: string;
	serverRender: ServerRenderFunction;
	options: RenderOptions;
	scopedRegistry?: RegistryResult;
	parentRegistry?: RegistryResult;
};

export type ServerDefineFn = (tagName: string, htmlString: string) => void;

export type WrapTemplateArgs = {
	tagName: string;
	serverRender: ServerRenderFunction;
	options: RenderOptions;
};

export type RegistryResult = {
	__serverCss: Map<string, string[]>;
	__serverRenderOpts: Map<string, ServerRenderOptions>;
	define: (
		tagName: TagName,
		CustomElement: CustomElementConstructor | ElementResult,
		options?: ElementDefinitionOptions,
	) => RegistryResult;
	getTagName: (CustomElement: CustomElementConstructor | ElementResult) => string | undefined;
	getAllTagNames: () => string[];
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
