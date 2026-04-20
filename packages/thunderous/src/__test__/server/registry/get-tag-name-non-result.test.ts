import { describe, it, expect } from 'vitest';
import { createRegistry } from '../../../registry';

describe('getTagName with a non-ElementResult on the server', () => {
	it('returns undefined when a plain class is passed (no ElementResult was registered for it)', () => {
		const registry = createRegistry();
		class PlainCustom {}
		// On the server, only ElementResults are tracked. Plain constructors should resolve to undefined
		// without throwing, exercising the `!isResult` branch of `getTagName`.
		const result = registry.getTagName(PlainCustom as unknown as CustomElementConstructor);
		expect(result).toBeUndefined();
	});

	it('silently skips defining a non-ElementResult on the server', () => {
		const registry = createRegistry();
		class PlainCustom {}
		// Should not throw; server-side define path returns early for non-ElementResult values,
		// exercising the `!isResult` branch of the server-side define logic.
		expect(() => registry.define('plain-el', PlainCustom as unknown as CustomElementConstructor)).not.toThrow();
		// Tag name should still be registered in the internal set so subsequent defines warn.
		expect(registry.getAllTagNames()).toContain('PLAIN-EL');
	});
});
