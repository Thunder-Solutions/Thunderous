import { describe, it, type Mock } from 'node:test';
import assert from 'assert';
import { customElement } from '../../custom-element';
import { html } from '../../render';
import { createRegistry } from '../../registry';
import { NOOP } from '../../utilities';

await describe('customElement', async () => {
	await it('does not throw on the server', () => {
		assert.doesNotThrow(() => customElement(() => html`<div></div>`));
	});
	await it('returns an element result class', () => {
		const MyElement = customElement(() => html`<div></div>`);
		assert.ok(MyElement);
		const keys = Object.keys(MyElement);
		assert(keys.every((key) => ['define', 'register', 'eject'].includes(key)));
	});
	await it('supports scoped registries', () => {
		const registry = createRegistry({ scoped: true });
		assert.doesNotThrow(() => customElement(() => html`<div></div>`, { shadowRootOptions: { registry } }));
	});
	await it('returns self for chaining', () => {
		const MyElement = customElement(() => html`<div></div>`);
		const registry = createRegistry();
		assert.strictEqual(MyElement.define('my-element'), MyElement);
		assert.strictEqual(MyElement.register(registry), MyElement);
	});
	await it('registers the element with a registry', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`)
			.register(registry)
			.define('my-element');
		assert.strictEqual(registry.getTagName(MyElement), 'MY-ELEMENT');
	});
	await it('logs an error when registering after defining in a scoped registry', (testContext) => {
		testContext.mock.method(console, 'error', NOOP);
		const errorMock = (console.error as Mock<typeof console.error>).mock;
		const registry = createRegistry({ scoped: true });
		const MyElement = customElement(() => html`<div></div>`);
		MyElement.define('my-element');
		MyElement.register(registry);
		assert.strictEqual(errorMock.callCount(), 1);
		assert.strictEqual(
			errorMock.calls[0].arguments[0],
			'Must call `register()` before `define()` for scoped registries.',
		);
	});
	await it('throws an error when ejecting on the server', () => {
		const MyElement = customElement(() => html`<div></div>`);
		assert.throws(() => MyElement.eject());
	});
});
