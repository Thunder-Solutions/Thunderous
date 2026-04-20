import { describe, test, expect, vi } from 'vitest';
import { html, createSignal } from '../../..';
import { flushPromises } from '../test-utilities';

describe('Signal<Array<DocumentFragment>> - child persistence across updates', () => {
	test('persists child element instances when keys match across updates', async () => {
		const createItems = (items: Array<{ id: string; label: string }>) =>
			items.map(({ id, label }) => html`<li key="${id}" data-label="${label}">${label}</li>`);

		const [signal, setSignal] = createSignal(
			createItems([
				{ id: 'a', label: 'Alpha' },
				{ id: 'b', label: 'Bravo' },
			]),
		);
		const frag = html`<ul>
			${signal}
		</ul>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		const firstRenderA = host.querySelector('[key="a"]');
		const firstRenderB = host.querySelector('[key="b"]');
		expect(firstRenderA).toBeTruthy();
		expect(firstRenderB).toBeTruthy();

		// Update with same keys but different attributes/text
		setSignal(
			createItems([
				{ id: 'a', label: 'Alpha-Updated' },
				{ id: 'b', label: 'Bravo-Updated' },
			]),
		);
		await flushPromises();

		const secondRenderA = host.querySelector('[key="a"]');
		const secondRenderB = host.querySelector('[key="b"]');

		// Instances should be preserved (same DOM node reference)
		expect(secondRenderA).toBe(firstRenderA);
		expect(secondRenderB).toBe(firstRenderB);

		// Attributes are copied from the new child
		expect(secondRenderA?.getAttribute('data-label')).toBe('Alpha-Updated');
		expect(secondRenderB?.getAttribute('data-label')).toBe('Bravo-Updated');

		host.remove();
	});

	test('removes persisted child when key is absent from new array', async () => {
		const createItems = (items: Array<{ id: string; label: string }>) =>
			items.map(({ id, label }) => html`<li key="${id}">${label}</li>`);

		const [signal, setSignal] = createSignal(
			createItems([
				{ id: 'keep', label: 'Keep' },
				{ id: 'remove', label: 'Remove' },
			]),
		);
		const frag = html`<ul>
			${signal}
		</ul>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		expect(host.querySelector('[key="keep"]')).toBeTruthy();
		expect(host.querySelector('[key="remove"]')).toBeTruthy();

		// Update: drop the "remove" item
		setSignal(createItems([{ id: 'keep', label: 'Keep' }]));
		await flushPromises();

		expect(host.querySelector('[key="keep"]')).toBeTruthy();
		expect(host.querySelector('[key="remove"]')).toBeFalsy();

		host.remove();
	});

	test('removes old attributes that are no longer present on new child', async () => {
		const [signal, setSignal] = createSignal([html`<li key="a" data-extra="first" class="start">item</li>`]);
		const frag = html`<ul>
			${signal}
		</ul>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		const original = host.querySelector('[key="a"]');
		expect(original?.getAttribute('data-extra')).toBe('first');
		expect(original?.classList.contains('start')).toBe(true);

		// Update: remove data-extra and class attributes from new element
		setSignal([html`<li key="a">item</li>`]);
		await flushPromises();

		const updated = host.querySelector('[key="a"]');
		expect(updated).toBe(original);
		expect(updated?.hasAttribute('data-extra')).toBe(false);
		expect(updated?.hasAttribute('class')).toBe(false);

		host.remove();
	});

	test('skips re-assignment of custom callback attributes during persistence', async () => {
		const [signal, setSignal] = createSignal([
			html`<button key="btn" onclick="this.__customCallbackFns.get('persisted-cb')(event)">Go</button>`,
		]);
		const frag = html`<ul>
			${signal}
		</ul>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		const original = host.querySelector('[key="btn"]');
		const originalOnclick = original?.getAttribute('onclick');
		expect(originalOnclick).toContain("this.__customCallbackFns.get('persisted-cb')");

		// Update with a new callback attribute value
		setSignal([html`<button key="btn" onclick="this.__customCallbackFns.get('different-cb')(event)">Stay</button>`]);
		await flushPromises();

		const updated = host.querySelector('[key="btn"]');
		expect(updated).toBe(original);
		// The onclick attribute should NOT be overwritten to preserve the callback key
		expect(updated?.getAttribute('onclick')).toBe(originalOnclick);

		host.remove();
	});

	test('ignores old children that have no key attribute', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const [signal, setSignal] = createSignal([html`<li key="a">A</li>`]);
		const frag = html`<ul>
			${signal}
		</ul>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		const originalA = host.querySelector('[key="a"]');
		expect(originalA).toBeTruthy();

		// Update: same key "a" but also include a fresh one
		setSignal([html`<li key="a">A-updated</li>`, html`<li key="b">B</li>`]);
		await flushPromises();

		expect(host.querySelector('[key="a"]')).toBe(originalA);
		expect(host.querySelector('[key="b"]')).toBeTruthy();
		warnSpy.mockRestore();
	});
});
