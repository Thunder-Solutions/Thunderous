import type { CustomElementProps, RegistryResult, RenderArgs } from './types';
import { createSignal } from './signals';

export const isServer = typeof window === 'undefined';

type ServerDefineFn = (tagName: string, htmlString: string) => void;

export const serverDefineFns = new Set<ServerDefineFn>();

export const onServerDefine = (fn: ServerDefineFn) => {
	serverDefineFns.add(fn);
};

export const serverCss = new Map<string, string[]>();

export const getServerRenderArgs = (tagName: string, registry?: RegistryResult): RenderArgs<CustomElementProps> => ({
	get elementRef() {
		return new Proxy({} as RenderArgs<CustomElementProps>['elementRef'], {
			get: () => {
				throw new Error('The `elementRef` property is not available on the server.');
			},
		});
	},
	get root() {
		return new Proxy({} as RenderArgs<CustomElementProps>['root'], {
			get: () => {
				throw new Error('The `root` property is not available on the server.');
			},
		});
	},
	get internals() {
		return new Proxy({} as RenderArgs<CustomElementProps>['internals'], {
			get: () => {
				throw new Error('The `internals` property is not available on the server.');
			},
		});
	},
	attributeChangedCallback: () => {},
	connectedCallback: () => {},
	disconnectedCallback: () => {},
	adoptedCallback: () => {},
	formDisabledCallback: () => {},
	formResetCallback: () => {},
	formStateRestoreCallback: () => {},
	formAssociatedCallback: () => {},
	clientOnlyCallback: () => {},
	customCallback: () => `{{callback:unavailable-on-server}}`,
	attrSignals: new Proxy({}, { get: (_, attr) => createSignal(`{{attr:${String(attr)}}}`) }),
	propSignals: new Proxy({}, { get: () => createSignal(null) }),
	refs: {},
	// @ts-expect-error // this should be a string for server-side rendering
	adoptStyleSheet: (cssStr: string) => {
		const _serverCss = registry !== undefined ? registry.__serverCss : serverCss;
		const cssArr = _serverCss.get(tagName) ?? [];
		cssArr.push(cssStr);
		_serverCss.set(tagName, cssArr);
	},
});
