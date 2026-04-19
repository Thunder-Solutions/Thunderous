import { describe, it, expect, vi } from 'vitest';
import { customElement } from '../../custom-element';
import { html } from '../../render';
import { createRegistry } from '../../registry';
import { NOOP } from '../../utilities';

describe('customElement', () => {
	it('does not throw on the server', () => {
		expect(() => customElement(() => html`<div></div>`)).not.toThrow();
	});
	it('returns an element result class', () => {
		const MyElement = customElement(() => html`<div></div>`);
		expect(MyElement).toBeTruthy();
		const keys = Object.keys(MyElement);
		expect(keys.every((key) => ['define', 'register', 'eject'].includes(key))).toBe(true);
	});
	it('supports scoped registries', () => {
		const registry = createRegistry({ scoped: true });
		expect(() => customElement(() => html`<div></div>`, { shadowRootOptions: { registry } })).not.toThrow();
	});
	it('returns self for chaining', () => {
		const MyElement = customElement(() => html`<div></div>`);
		const registry = createRegistry();
		expect(MyElement.define('my-element')).toBe(MyElement);
		expect(MyElement.register(registry)).toBe(MyElement);
	});
	it('registers the element with a registry', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`)
			.register(registry)
			.define('my-element');
		expect(registry.getTagName(MyElement)).toBe('MY-ELEMENT');
	});
	it('logs an error when registering after defining in a scoped registry', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(NOOP);
		const registry = createRegistry({ scoped: true });
		const MyElement = customElement(() => html`<div></div>`);
		MyElement.define('my-element');
		MyElement.register(registry);
		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith('Must call `register()` before `define()` for scoped registries.');
	});
	it('throws an error when ejecting on the server', () => {
		const MyElement = customElement(() => html`<div></div>`);
		expect(() => MyElement.eject()).toThrow();
	});
});
