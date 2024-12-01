import type {
	CustomElementProps,
	RegistryResult,
	RenderArgs,
	RenderOptions,
	ServerDefineArgs,
	ServerRenderFunction,
} from './types';
import { createSignal } from './signals';

export const isServer = typeof window === 'undefined';

type ServerDefineFn = (tagName: string, htmlString: string) => void;

export const serverDefineFns = new Set<ServerDefineFn>();

export const onServerDefine = (fn: ServerDefineFn) => {
	serverDefineFns.add(fn);
};

export const serverDefine = ({ tagName, serverRender, options, scopedRegistry, parentRegistry }: ServerDefineArgs) => {
	if (parentRegistry !== undefined) {
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

type WrapTemplateArgs = {
	tagName: string;
	serverRender: ServerRenderFunction;
	options: RenderOptions;
};

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
	return inputString.replace(new RegExp(`(<\s*${tagName}([^>]*)>)`, 'gm'), ($1, _, $3) => {
		const attrs = $3
			.split(/(?!=")\s+/)
			.filter((attr: string) => attr !== '')
			.map((attr: string) => {
				const [key, _value] = attr.split('=');
				const value = _value?.replace(/"/g, '') ?? '';
				return [key, value];
			});
		let scopedResult = template;
		for (const [key, value] of attrs) {
			scopedResult = scopedResult.replace(new RegExp(`{{attr:${key}}}`, 'gm'), value);
		}
		return $1 + scopedResult;
	});
};

export const clientOnlyCallback = (fn: (() => void) | (() => Promise<void>)) => {
	if (!isServer) return fn();
};
