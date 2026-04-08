import type {
	CustomElementProps,
	RegistryResult,
	RenderArgs,
	ServerDefineArgs,
	ServerDefineFn,
	SignalGetter,
	WrapTemplateArgs,
} from './types';
import { createSignal } from './signals';
import { NOOP } from './utilities';

export const isServer = typeof window === 'undefined';

export const serverDefineFns = new Set<ServerDefineFn>();

/**
 * Add a callback to handle each call to `define()` on the server.
 *
 * This enables you to intercept those definitions and respond to them,
 * for example to inject declarative shadow DOM templates.
 *
 * @example
 * ```ts
 * let response = originalResponse;
 * onServerDefine((tagName, htmlString) => {
 *   // ...
 *   response = htmlString.replace(tagName, `my-${tagName}`);
 * });
 * ```
 */
export const onServerDefine = (fn: ServerDefineFn) => {
	serverDefineFns.add(fn);
};

/**
 * Thunderous tracks its state using several maps to associate values with
 * their respective elements.
 *
 * This function clears the map that tracks CSS on the server side, to prevent
 * memory leaks and purge stale data from previous renders.
 *
 * If you are building a framework or plugin that depends on Thunderous, you
 * should call this function before every render. Otherwise, the map will
 * accumulate stale data and may create significant performance issues.
 *
 * @example
 * ```ts
 * import { clearServerCss } from 'thunderous'
 *
 * clearServerCss();
 * ```
 */
export const clearServerCss = () => {
	serverCss.clear();
};

export const serverDefine = ({
	tagName,
	serverRender,
	options,
	elementResult,
	scopedRegistry,
	parentRegistry,
}: ServerDefineArgs) => {
	if (parentRegistry !== undefined) {
		if (parentRegistry.getTagName(elementResult) !== tagName.toUpperCase()) {
			parentRegistry.define(tagName, elementResult);
		}
		parentRegistry.__serverRenderOpts.set(tagName, { serverRender, ...options });
		if (parentRegistry.scoped) return;
	}
	for (const fn of serverDefineFns) {
		let result = serverRender(getServerRenderArgs(tagName));
		result = wrapTemplate({
			tagName,
			serverRender,
			options,
		});
		if (scopedRegistry !== undefined) {
			for (const [scopedTagName, scopedRenderOptions] of scopedRegistry.__serverRenderOpts) {
				const { serverRender, ...scopedOptions } = scopedRenderOptions;
				let template = serverRender(getServerRenderArgs(scopedTagName, scopedRegistry));
				template = wrapTemplate({
					tagName: scopedTagName,
					serverRender,
					options: scopedOptions,
				});
				result = insertTemplates(scopedTagName, template, result);
			}
		}
		fn(tagName, result);
	}
};

export const serverCss = new Map<string, string[]>();

export const getServerRenderArgs = (tagName: string, registry?: RegistryResult): RenderArgs<CustomElementProps> => ({
	get elementRef() {
		return new Proxy({} as RenderArgs<CustomElementProps>['elementRef'], {
			get: () => {
				const error = new Error('The `elementRef` property is not available on the server.');
				console.error(error);
				throw error;
			},
		});
	},
	get root() {
		return new Proxy({} as RenderArgs<CustomElementProps>['root'], {
			get: () => {
				const error = new Error('The `root` property is not available on the server.');
				console.error(error);
				throw error;
			},
		});
	},
	get internals() {
		return new Proxy({} as RenderArgs<CustomElementProps>['internals'], {
			get: () => {
				const error = new Error('The `internals` property is not available on the server.');
				console.error(error);
				throw error;
			},
		});
	},
	attributeChangedCallback: NOOP,
	connectedCallback: NOOP,
	disconnectedCallback: NOOP,
	adoptedCallback: NOOP,
	formDisabledCallback: NOOP,
	formResetCallback: NOOP,
	formStateRestoreCallback: NOOP,
	formAssociatedCallback: NOOP,
	clientOnlyCallback: NOOP,
	customCallback: () => '',
	getter: (fn) => {
		const _fn: SignalGetter<ReturnType<typeof fn>> = () => fn();
		_fn.getter = true;
		return _fn;
	},
	attrSignals: new Proxy({}, { get: (_, attr) => createSignal(`{{attr:${String(attr)}}}`) }),
	propSignals: new Proxy({}, { get: () => createSignal(null) }),
	refs: {},
	// @ts-expect-error // this will be a string for SSR, but this is true for internal cases only.
	// The end user will see the public type, which is either a CSSStyleSheet or HTMLStyleElement.
	adoptStyleSheet: (cssStr: string) => {
		const _serverCss = registry !== undefined ? registry.__serverCss : serverCss;
		const cssArr = _serverCss.get(tagName) ?? [];
		cssArr.push(cssStr);
		_serverCss.set(tagName, cssArr);
	},
});

export const wrapTemplate = ({ tagName, serverRender, options }: WrapTemplateArgs) => {
	const { registry } = options.shadowRootOptions;
	const scopedRegistry = registry !== undefined && 'scoped' in registry ? registry : undefined;
	const initialRenderString = serverRender(getServerRenderArgs(tagName, scopedRegistry));
	const _serverCss = scopedRegistry?.__serverCss ?? serverCss;
	const cssRenderString = (_serverCss.get(tagName) ?? []).map((cssStr) => `<style>${cssStr}</style>`).join('');
	const finalScopedRenderString = options.attachShadow
		? /* html */ `
				<template
					shadowrootmode="${options.shadowRootOptions.mode}"
					shadowrootdelegatesfocus="${options.shadowRootOptions.delegatesFocus}"
					shadowrootclonable="${options.shadowRootOptions.clonable}"
					shadowrootserializable="${options.shadowRootOptions.serializable}"
				>
					${cssRenderString + initialRenderString}
				</template>
			`
		: cssRenderString + initialRenderString;
	return finalScopedRenderString;
};

export const insertTemplates = (tagName: string, template: string, inputString: string) => {
	const tagRegex = new RegExp(`<\\s*${tagName}((?:\\s+[^>]*)*)\\s*>`, 'gm');
	return inputString.replace(tagRegex, ($match: string, $1: string) => {
		const attrs = $1
			.split(/(?<=")\s+/)
			.filter((attr: string) => attr.trim() !== '')
			.map((attr: string) => {
				const [_key, _value] = attr.split('=');
				const key = _key.trim();
				const value = _value?.replace(/"/g, '') ?? '';
				return [key, value];
			});
		let scopedResult = template;
		for (const [key, value] of attrs) {
			scopedResult = scopedResult.replace(new RegExp(`{{attr:${key}}}`, 'gm'), value);
		}
		return $match + scopedResult;
	});
};

export const clientOnlyCallback = (fn: (() => void) | (() => Promise<void>)) => {
	if (!isServer) return fn();
};
