import { describe, test, expect, vi } from 'vitest';
import { html, createSignal } from '../../..';
import { assertDocumentFragment, flushPromises, getContentWithoutComments } from '../test-utilities';

describe('signal type switching coverage', () => {
	test('switches from Signal<Array<DocumentFragment>> to Signal<DocumentFragment>', async () => {
		const [signal, setSignal] = createSignal<DocumentFragment | DocumentFragment[]>([
			html`<span key="a">A</span>`,
			html`<span key="b">B</span>`,
		]);
		const frag = html`<section>${signal}</section>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		expect(host.querySelector('section')?.textContent).toBe('AB');

		// Switch to a single DocumentFragment (triggers bindArray → bindFragment switch)
		setSignal(html`<span>solo</span>`);
		await flushPromises();

		expect(host.querySelector('section')?.textContent).toBe('solo');

		host.remove();
	});

	test('switches from Signal<DocumentFragment> to Signal<Array<DocumentFragment>>', async () => {
		const [signal, setSignal] = createSignal<DocumentFragment | DocumentFragment[]>(html`<span>single</span>`);
		const frag = html`<section>${signal}</section>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		expect(host.querySelector('section')?.textContent).toBe('single');

		// Switch to an array (triggers bindFragment → bindArray switch)
		setSignal([html`<span key="x">X</span>`, html`<span key="y">Y</span>`]);
		await flushPromises();

		expect(host.querySelector('section')?.textContent).toBe('XY');

		host.remove();
	});

	test('warns when a previously-cached fragment lacks a key when re-rendered inside an array', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		// Fragment begins life as a standalone signal value (no autoKey applied)
		const item = html`<span>cached</span>`;
		const [signal, setSignal] = createSignal<DocumentFragment | DocumentFragment[]>(item);
		const frag = html`<section>${signal}</section>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		// Transition the same fragment into an array. Cache was populated without a key,
		// so the array path must auto-assign one and emit the expected warning.
		setSignal([item]);
		await flushPromises();

		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('a `key` attribute should be provided on each child element'),
			expect.anything(),
		);

		warnSpy.mockRestore();
		host.remove();
	});

	test('emits an error when an array contains a fragment with more than one top-level element', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const multi = html`<span key="m1">1</span><span key="m2">2</span>`;
		const [signal] = createSignal<DocumentFragment[]>([multi]);
		const result = html`<ul>
			${signal}
		</ul>`;
		expect(result).toBeTruthy();
		await flushPromises();

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('fragments must contain only one top-level element'),
			expect.anything(),
		);

		errorSpy.mockRestore();
	});

	test('skips empty fragments (no top-level children) inside an array signal', () => {
		const emptyFragment = html``;
		const itemFragment = html`<span key="item">kept</span>`;
		const [signal] = createSignal<DocumentFragment[]>([emptyFragment, itemFragment]);
		const frag = html`<ul>
			${signal}
		</ul>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);

		// The empty fragment contributes no children; the other item should still render.
		expect(host.querySelector('[key="item"]')?.textContent).toBe('kept');
		host.remove();
	});

	test('multiple signals in a single text node apply distinct auto keys to interpolated fragments', () => {
		const [a] = createSignal(html`<span>Alpha</span>`);
		const [b] = createSignal(html`<span>Bravo</span>`);
		const result = html`<div>${a}${b}</div>`;
		const content = getContentWithoutComments(assertDocumentFragment(result));
		expect(content).toContain('key="0"');
		expect(content).toContain('key="1"');
	});
});
