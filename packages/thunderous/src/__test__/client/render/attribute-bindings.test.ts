import { describe, test, expect, vi } from 'vitest';
import { html, createSignal } from '../../..';
import { flushPromises } from '../test-utilities';

describe('attribute bindings', () => {
	describe('signal attribute bindings', () => {
		test('binds signal to element attribute', async () => {
			const [color, setColor] = createSignal('red');
			const result = html`<div class=${color}></div>`;
			const div = result.querySelector('div');

			expect(div?.getAttribute('class')).toBe('red');

			setColor('blue');
			await flushPromises();

			expect(div?.getAttribute('class')).toBe('blue');
		});

		test('removes attribute when signal value is null', async () => {
			const [value, setValue] = createSignal<string | null>('initial');
			const result = html`<div data-attr=${value}></div>`;
			const div = result.querySelector('div');

			expect(div?.hasAttribute('data-attr')).toBe(true);

			setValue(null);
			await flushPromises();

			expect(div?.hasAttribute('data-attr')).toBe(false);
		});
	});

	describe('property bindings', () => {
		test('binds signal to element property via prop:', async () => {
			const [value, setValue] = createSignal('test-value');
			const result = html`<input prop:value=${value} />`;
			const input = result.querySelector('input')!;

			expect(input?.value).toBe('test-value');

			setValue('updated');
			await flushPromises();

			expect(input?.value).toBe('updated');
		});

		test('sets null value on property when signal is null', async () => {
			const [value, setValue] = createSignal<string | null>('initial');
			const result = html`<input prop:value=${value} />`;
			const input = result.querySelector('input')!;

			expect(input?.value).toBe('initial');

			setValue(null);
			await flushPromises();

			expect(input?.value).toBe('');
		});

		test('logs warning when property does not exist on element', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const [value] = createSignal('test');
			const frag = html`<div prop:nonExistent=${value}></div>`;
			expect(frag).toBeTruthy();
			await flushPromises();

			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Property "nonExistent" does not exist on element'),
				expect.anything(),
				expect.anything(),
			);

			warnSpy.mockRestore();
		});
	});

	describe('callback bindings', () => {
		test('binds callback to event attribute', async () => {
			const clickHandler = vi.fn();
			const result = html`<button onclick=${clickHandler}>Click</button>`;
			const button = result.querySelector('button')!;

			// Simulate click by calling the handler directly through the binding
			button.dispatchEvent(new MouseEvent('click'));
			await flushPromises();

			expect(clickHandler).toHaveBeenCalled();
		});

		test('binds callback to property via prop:', async () => {
			const handler = vi.fn();
			const result = html`<input prop:onchange=${handler} />`;
			const input = result.querySelector('input')!;

			// Verify the callback was stored

			expect(
				(input as unknown as { __customCallbackFns: Map<string, unknown> }).__customCallbackFns?.size,
			).toBeGreaterThan(0);
		});
	});
});
