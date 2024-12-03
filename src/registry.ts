import { isServer } from './server-side';
import { type RegistryArgs, type RegistryResult } from './types';

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
export const createRegistry = (args?: RegistryArgs): RegistryResult => {
	const { scoped = false } = args ?? {};
	const customElementMap = new Map<CustomElementConstructor, string>();
	const customElementTags = new Set<string>();
	const nativeRegistry = (() => {
		if (isServer) return;
		if (scoped) return new CustomElementRegistry();
		return customElements;
	})();
	return {
		__serverCss: new Map(),
		__serverRenderOpts: new Map(),
		define(tagName, ElementResult, options) {
			const isResult = 'eject' in ElementResult;
			if (isServer) {
				// offload the server definition to the element, as it's responsible for scoped registries and rendering.
				if (isResult) ElementResult.register(this).define(tagName, options);
				return this;
			}
			const CustomElement = isResult ? ElementResult.eject() : ElementResult;
			if (customElementMap.has(CustomElement)) {
				console.warn(`Custom element class "${CustomElement.constructor.name}" was already defined. Skipping...`);
				return this;
			}
			if (customElementTags.has(tagName)) {
				console.warn(`Custom element tag name "${tagName}" was already defined. Skipping...`);
				return this;
			}
			customElementMap.set(CustomElement, tagName.toUpperCase());
			customElementTags.add(tagName);
			if (CustomElement === undefined) {
				console.error(`Custom element class for tag name "${tagName}" was not found. You must register it first.`);
				return this;
			}
			nativeRegistry?.define(tagName, CustomElement, options);
			return this;
		},
		getTagName: (ElementResult) => {
			const CustomElement = 'eject' in ElementResult ? ElementResult.eject() : ElementResult;
			return customElementMap.get(CustomElement);
		},
		getAllTagNames: () => Array.from(customElementTags),
		eject: () => {
			if (nativeRegistry === undefined) {
				throw new Error('Cannot eject a registry on the server.');
			}
			return nativeRegistry;
		},
		scoped,
	};
};
