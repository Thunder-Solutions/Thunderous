import { describe, test, expect } from 'vitest';
import { createRegistry } from '../../../registry';
import { customElement } from '../../../custom-element';
import { html } from '../../../render';

describe('eject', () => {
	test('eject returns the native registry on client', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<span>Test</span>`);

		registry.define('eject-test', MyElement);

		const nativeRegistry = registry.eject();

		expect(nativeRegistry).toBe(customElements);
	});
});
