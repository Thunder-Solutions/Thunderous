import { describe, test, expect, vi } from 'vitest';
import { createRegistry } from '../../../registry';
import { customElement } from '../../../custom-element';
import { html } from '../../../render';

describe('define', () => {
	test('defines a custom element on the client', async () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<span>Test</span>`);

		registry.define('client-registry-test', MyElement);

		await customElements.whenDefined('client-registry-test');
		expect(customElements.get('client-registry-test')).toBeTruthy();
	});

	test('warns when defining duplicate custom element class on client', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const registry = createRegistry();

		class TestClass extends HTMLElement {}

		registry.define('dup-class-test-1', TestClass as unknown as ReturnType<typeof customElement>);
		registry.define('dup-class-test-2', TestClass as unknown as ReturnType<typeof customElement>);

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('was already defined. Skipping...'));

		warnSpy.mockRestore();
	});
});
