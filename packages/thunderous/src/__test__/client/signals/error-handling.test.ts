import { describe, test, expect, vi } from 'vitest';
import { createSignal, createEffect, derived } from '../../../signals';

describe('signal error handling', () => {
	test('logs error when effect throws', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const [getter] = createSignal('test');

		createEffect(() => {
			getter();
			throw new Error('Effect error');
		});

		expect(errorSpy).toHaveBeenCalledWith(
			'Error in effect:',
			expect.objectContaining({
				error: expect.any(Error),
			}),
		);

		errorSpy.mockRestore();
	});

	test('logs error when subscriber throws during signal update', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const [getter, setter] = createSignal('initial');

		createEffect(() => {
			getter();
			throw new Error('Subscriber error');
		});

		// Wait for effect to run first
		await new Promise((resolve) => setTimeout(resolve, 0));

		setter('new value');

		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(errorSpy).toHaveBeenCalledWith(
			'Error in subscriber:',
			expect.objectContaining({
				newValue: 'new value',
				oldValue: 'initial',
			}),
		);

		errorSpy.mockRestore();
	});

	test('logs error when derived signal throws', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		derived(() => {
			throw new Error('Derived error');
		});

		expect(errorSpy).toHaveBeenCalledWith(
			'Error in derived signal:',
			expect.objectContaining({
				error: expect.any(Error),
			}),
		);

		errorSpy.mockRestore();
	});

	test('destroy callback stops effect from running', () => {
		const [getter, setter] = createSignal('initial');
		const effectFn = vi.fn();
		let destroyFn: (() => void) | undefined;

		createEffect(({ destroy }) => {
			getter();
			effectFn();
			destroyFn = destroy;
		});

		// Effect should have run once
		expect(effectFn).toHaveBeenCalledTimes(1);

		// Destroy the effect
		destroyFn?.();

		// Signal update should not trigger destroyed effect
		setter('updated');
		expect(effectFn).toHaveBeenCalledTimes(1); // Still 1, not 2
	});

	test('does not trigger effect when setting equivalent plain object', async () => {
		const [getter, setter] = createSignal({ a: 1, b: 2 });
		const effectFn = vi.fn();

		createEffect(() => {
			getter();
			effectFn();
		});

		// Effect should have run once on initial setup
		expect(effectFn).toHaveBeenCalledTimes(1);

		// Set an equivalent object (different reference, same content)
		setter({ a: 1, b: 2 });

		await new Promise((resolve) => setTimeout(resolve, 0));

		// Effect should NOT have been called again (deep equality check on line 63)
		expect(effectFn).toHaveBeenCalledTimes(1);
	});
});
