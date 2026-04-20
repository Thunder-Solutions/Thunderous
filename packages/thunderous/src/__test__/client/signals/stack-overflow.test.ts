import { describe, test, expect, vi } from 'vitest';
import { createSignal, createEffect } from '../../../signals';

describe('signal stack overflow protection', () => {
	test('prevents infinite loops in signal setters', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const [getter, setter] = createSignal(0);

		// Create an effect that triggers itself in a loop
		createEffect(() => {
			const value = getter();
			if (value < 2000) {
				setter(value + 1);
			}
		});

		// Wait for microtasks to process
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should have logged the stack overflow error
		expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
		expect(errorSpy.mock.calls[0][0].message).toContain('stack overflow');

		errorSpy.mockRestore();
	});
});
