import { describe, it, expect } from 'vitest';
import { createRegistry } from '../../../registry';

describe('createRegistry', () => {
	it('creates a global registry', () => {
		const registry = createRegistry();
		expect(registry).toBeTruthy();
		expect(registry.scoped).toBe(false);
	});

	it('creates a scoped registry', () => {
		const registry = createRegistry({ scoped: true });
		expect(registry).toBeTruthy();
		expect(registry.scoped).toBe(true);
	});
});
