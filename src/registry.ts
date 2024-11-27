import { isServer } from './server-side';
import { ElementResult, RegistryArgs, RegistryResult } from './types';

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
	const customElementMap = new Map<CustomElementConstructor | ElementResult, string>();
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
		register: (tagName: string, element: CustomElementConstructor | ElementResult) => {
			if (customElementMap.has(element)) {
				console.warn(`Custom element class "${element.constructor.name}" was already registered. Skipping...`);
				return;
			}
			customElementMap.set(element, tagName.toUpperCase());
		},
		getTagName: (element: CustomElementConstructor | ElementResult) => customElementMap.get(element),
		eject: () => {
			if (registry === null) {
				throw new Error('Cannot eject a registry on the server.');
			}
			return registry;
		},
		scoped,
	};
};
