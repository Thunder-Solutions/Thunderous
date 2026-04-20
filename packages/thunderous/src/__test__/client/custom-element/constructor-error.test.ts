import { describe, test, expect, vi } from 'vitest';
import { customElement } from '../../..';

describe('Custom element constructor error handling', () => {
	test('catches and reports errors during element instantiation', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		// Use a unique tag name to avoid conflicts
		const tagName = `constructor-error-${Date.now()}` as `${string}-${string}`;

		const TestElement = customElement(() => {
			// Throw an error during render
			throw new Error('Test render error');
		});

		TestElement.define(tagName);
		await customElements.whenDefined(tagName);

		// Creating the element - constructor errors are logged but not thrown
		// since browsers don't propagate them to document.createElement() callers
		document.createElement(tagName);

		// Wait for any async error handling
		await new Promise((resolve) => setTimeout(resolve, 50));

		// The error should have been logged to console.error
		expect(consoleSpy).toHaveBeenCalled();
		// Verify the error message contains expected text
		const errorCall = consoleSpy.mock.calls.find(
			(call) =>
				call[0] instanceof Error &&
				(call[0].message.includes('Error instantiating element') || call[0].message.includes('Test render error')),
		);
		expect(errorCall).toBeDefined();

		consoleSpy.mockRestore();
	});
});
