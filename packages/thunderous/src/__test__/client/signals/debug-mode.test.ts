import { describe, test, expect, vi } from 'vitest';
import { createSignal, createEffect } from '../../../signals';

describe('signal debug mode', () => {
	test('logs debug info when debugMode is enabled on getter', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const [getter] = createSignal('test', { debugMode: true, label: 'mySignal' });

		getter();

		expect(logSpy).toHaveBeenCalledWith(
			'Signal retrieved:',
			expect.objectContaining({
				label: expect.stringContaining('mySignal'),
				value: 'test',
			}),
		);

		logSpy.mockRestore();
	});

	test('logs debug info when debugMode is passed to getter call', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const [getter] = createSignal('value', { label: 'labeled' });

		getter({ debugMode: true });

		expect(logSpy).toHaveBeenCalledWith(
			'Signal retrieved:',
			expect.objectContaining({
				label: expect.stringContaining('labeled'),
			}),
		);

		logSpy.mockRestore();
	});

	test('logs debug info when debugMode is enabled on setter', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const [getter, setter] = createSignal('initial', { debugMode: true, label: 'settable' });

		// Subscribe to the signal first
		createEffect(() => {
			getter();
		});

		setter('updated');

		expect(logSpy).toHaveBeenCalledWith(
			'Signal set:',
			expect.objectContaining({
				label: expect.stringContaining('settable'),
				oldValue: 'initial',
				newValue: 'updated',
			}),
		);

		logSpy.mockRestore();
	});

	test('logs debug info when debugMode is passed to setter call', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const [getter, setter] = createSignal('start', { label: 'dynamic' });

		// Subscribe to the signal first
		createEffect(() => {
			getter();
		});

		setter('end', { debugMode: true });

		expect(logSpy).toHaveBeenCalledWith(
			'Signal set:',
			expect.objectContaining({
				label: expect.stringContaining('dynamic'),
			}),
		);

		logSpy.mockRestore();
	});
});
