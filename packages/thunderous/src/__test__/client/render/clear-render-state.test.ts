import { describe, test, expect } from 'vitest';
import { html, createSignal, clearRenderState } from '../../..';
import { flushPromises } from '../test-utilities';

describe('clearRenderState', () => {
	test('clears render state maps without error', () => {
		const [signal] = createSignal('test');
		const frag = html`<div>${signal}</div>`;

		expect(frag).toBeTruthy();
		expect(() => clearRenderState()).not.toThrow();
	});

	test('clearing state allows fresh signal bindings', async () => {
		const [signal1, setSignal1] = createSignal('first');
		const frag1 = html`<div>${signal1}</div>`;

		clearRenderState();

		const [signal2, setSignal2] = createSignal('second');
		const frag2 = html`<span>${signal2}</span>`;

		setSignal1('updated first');
		setSignal2('updated second');
		await flushPromises();

		expect(frag1.querySelector('div')?.textContent).toBe('updated first');
		expect(frag2.querySelector('span')?.textContent).toBe('updated second');
	});
});
