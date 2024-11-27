// Extend CustomElementRegistry to track tag names.
// This is only needed to support scoped elements.
declare global {
	interface CustomElementRegistry {
		__tagNames: Set<string>;
	}
}
if (typeof window !== 'undefined') {
	class TrackableCustomElementRegistry extends window.CustomElementRegistry {
		__tagNames = new Set<string>();
		define(tagName: string, constructor: CustomElementConstructor) {
			super.define(tagName, constructor);
			this.__tagNames.add(tagName);
		}
	}
	window.CustomElementRegistry = TrackableCustomElementRegistry;
}

export {};
