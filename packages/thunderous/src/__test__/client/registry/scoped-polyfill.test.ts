import { describe, test, expect, vi } from 'vitest';
import { createRegistry } from '../../../registry';

describe('scoped polyfill fallback', () => {
	test('scoped registry falls back to global when polyfill missing', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const registry = createRegistry({ scoped: true });

		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('scoped custom elements polyfill was not found'));
		expect(registry.scoped).toBe(true);

		errorSpy.mockRestore();
	});
});
