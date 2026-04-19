import { describe, it, expect, vi } from 'vitest';
import { createRegistry } from '../../../registry';
import { customElement } from '../../../custom-element';
import { html } from '../../../render';
import { NOOP } from '../../../utilities';

describe('define', () => {
	it('defines a custom element', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`);
		expect(() => registry.define('my-element', MyElement)).not.toThrow();
	});

	it('warns about duplicate custom elements', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(NOOP);
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`);
		const MyElement2 = customElement(() => html`<div></div>`);
		registry.define('my-element', MyElement);
		registry.define('my-element', MyElement2);
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenNthCalledWith(1, 'Custom element tag name "MY-ELEMENT" was already defined. Skipping...');
		registry.define('my-element-2', MyElement);
		expect(warnSpy).toHaveBeenCalledTimes(2);
		expect(warnSpy).toHaveBeenNthCalledWith(2, 'MY-ELEMENT-2 was already defined. Skipping...');
	});
});
