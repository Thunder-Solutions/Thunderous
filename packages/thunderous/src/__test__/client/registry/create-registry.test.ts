import { describe, test, expect } from 'vitest';
import { createRegistry } from '../../../registry';

describe('createRegistry', () => {
	test('creates a global registry', () => {
		const registry = createRegistry();
		expect(registry).toBeTruthy();
		expect(registry.scoped).toBe(false);
	});

	test('creates a scoped registry', () => {
		const registry = createRegistry({ scoped: true });
		expect(registry).toBeTruthy();
		expect(registry.scoped).toBe(true);
	});
});
