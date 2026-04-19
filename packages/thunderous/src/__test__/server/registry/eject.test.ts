import { describe, it, expect } from 'vitest';
import { createRegistry } from '../../../registry';
import { customElement } from '../../../custom-element';
import { html } from '../../../render';

describe('eject', () => {
	it('throws an error if ejected on the server', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`);
		registry.define('my-element', MyElement);
		expect(() => registry.eject()).toThrow('Cannot eject a registry on the server.');
	});
});
