import { describe, test, expect } from 'vitest';
import { createRegistry } from '../../../registry';
import { customElement } from '../../../custom-element';
import { html } from '../../../render';

describe('getTagName', () => {
	test('getTagName returns undefined for unregistered ElementResult on client', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<span>Test</span>`);

		const tagName = registry.getTagName(MyElement);

		expect(tagName).toBeUndefined();
	});

	test('getTagName works with plain custom element class on client', () => {
		const registry = createRegistry();

		class PlainElement extends HTMLElement {}

		registry.define('registry-plain-test', PlainElement as unknown as ReturnType<typeof customElement>);

		const tagName = registry.getTagName(PlainElement as unknown as ReturnType<typeof customElement>);

		expect(tagName).toBe('REGISTRY-PLAIN-TEST');
	});
});
