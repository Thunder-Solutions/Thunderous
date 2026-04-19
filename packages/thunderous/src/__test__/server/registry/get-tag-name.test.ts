import { describe, it, expect } from 'vitest';
import { createRegistry } from '../../../registry';
import { customElement } from '../../../custom-element';
import { html } from '../../../render';

describe('getTagName', () => {
	it('gets the tag name of a custom element', () => {
		const registry = createRegistry();
		const tagName = 'my-element';
		const MyElement = customElement(() => html`<div></div>`);
		registry.define(tagName, MyElement);
		const result = registry.getTagName(MyElement);
		expect(result).toBe(tagName.toUpperCase());
	});
});

describe('getAllTagNames', () => {
	it('gets all tag names defined in the registry', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`);
		const MyElement2 = customElement(() => html`<div></div>`);
		registry.define('my-element', MyElement);
		registry.define('my-element-2', MyElement2);
		const result = registry.getAllTagNames();
		expect(result).toEqual(['MY-ELEMENT', 'MY-ELEMENT-2']);
	});
});
