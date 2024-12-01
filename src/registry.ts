import { isServer } from './server-side';
import { ElementResult, RegistryArgs, RegistryResult, ServerRenderOptions } from './types';

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
	const tagMap = new Map<string, CustomElementConstructor>();
	const elementResultMap = new Map<ElementResult, string>();
	const customElementTags = new Set<string>();
	const registry = (() => {
		if (isServer) return null;
		try {
			return new CustomElementRegistry();
		} catch (error) {
			if (scoped) {
				console.error(
					'Scoped custom element registries are not supported in this environment. Please install `@webcomponents/scoped-custom-element-registry` to use this feature.',
				);
			}
			return customElements;
		}
	})();
	return {
		__serverCss: new Map<string, string[]>(),
		__serverRenderOpts: new Map<string, ServerRenderOptions>(),
		define(tagName, options) {
			const nativeRegistry = this.eject();
			const CustomElement = tagMap.get(tagName.toUpperCase());
			if (CustomElement === undefined) {
				console.error(`Custom element class for tag name "${tagName}" was not found. You must register it first.`);
				return this;
			}
			nativeRegistry.define(tagName, CustomElement, options);
			return this;
		},
		register(tagName, ElementResult) {
			const isResult = 'eject' in ElementResult;
			if (isResult ? elementResultMap.has(ElementResult) : customElementMap.has(ElementResult)) {
				console.warn(`Custom element class "${ElementResult.constructor.name}" was already registered. Skipping...`);
				return this;
			}
			if (customElementTags.has(tagName)) {
				console.warn(`Custom element tag name "${tagName}" was already registered. Skipping...`);
				return this;
			}
			if (isResult) elementResultMap.set(ElementResult, tagName.toUpperCase());
			const CustomElement = isResult ? ElementResult.eject() : ElementResult;
			customElementMap.set(CustomElement, tagName.toUpperCase());
			tagMap.set(tagName.toUpperCase(), CustomElement);
			customElementTags.add(tagName);
			return this;
		},
		getTagName: (element) => {
			const isResult = 'eject' in element;
			return isResult ? elementResultMap.get(element) : customElementMap.get(element);
		},
		getAllTagNames: () => Array.from(customElementTags),
		eject: () => {
			if (registry === null) {
				throw new Error('Cannot eject a registry on the server.');
			}
			return registry;
		},
		scoped,
	};
};
