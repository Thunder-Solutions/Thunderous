import { describe, test, expect, vi } from 'vitest';
import { html, createSignal } from '../../..';
import { flushPromises } from '../test-utilities';

describe('array key handling', () => {
	test('warns when duplicate keys are used in array rendering', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		// Create elements with same key
		const items = [html`<span key="same">First</span>`, html`<span key="same">Second</span>`];
		const [signal] = createSignal(items);
		const result = html`<div>${signal}</div>`;

		// Use the result
		expect(result).toBeTruthy();
		await flushPromises();

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate key "same" found on:'), expect.anything());

		warnSpy.mockRestore();
	});
});
