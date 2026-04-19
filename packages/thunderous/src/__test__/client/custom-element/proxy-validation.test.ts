import { describe, test, expect, vi } from 'vitest';
import { customElement, html } from '../../..';

describe('Proxy validation', () => {
	describe('attrSignals proxy', () => {
		test('logs error when trying to assign via setter', async () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const TestElement = customElement(({ attrSignals }) => {
				// Try to assign to attrSignals (should log error)
				// Proxy returns false in strict mode which throws TypeError
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(attrSignals as any).foo = 'bar';
				} catch {
					// Expected to throw in strict mode
				}
				return html`<span>Test</span>`;
			});

			TestElement.define('attr-signals-setter-test');

			await customElements.whenDefined('attr-signals-setter-test');

			const el = document.createElement('attr-signals-setter-test');
			document.body.appendChild(el);

			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(errorSpy).toHaveBeenCalledWith('Signals must be assigned via setters.');

			// Cleanup
			errorSpy.mockRestore();
			el.remove();
		});
	});

	describe('propSignals proxy', () => {
		test('logs error when trying to assign via setter', async () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const TestElement = customElement(({ propSignals }) => {
				// Try to assign to propSignals (should log error)
				// Proxy returns false in strict mode which throws TypeError
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(propSignals as any).foo = 'bar';
				} catch {
					// Expected to throw in strict mode
				}
				return html`<span>Test</span>`;
			});

			TestElement.define('prop-signals-setter-test');

			await customElements.whenDefined('prop-signals-setter-test');

			const el = document.createElement('prop-signals-setter-test');
			document.body.appendChild(el);

			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(errorSpy).toHaveBeenCalledWith('Signals must be assigned via setters.');

			// Cleanup
			errorSpy.mockRestore();
			el.remove();
		});
	});

	describe('refs proxy', () => {
		test('logs error when trying to assign', async () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const TestElement = customElement(({ refs }) => {
				// Try to assign to refs (should log error)
				// Proxy returns false in strict mode which throws TypeError
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(refs as any).myRef = document.createElement('div');
				} catch {
					// Expected to throw in strict mode
				}
				return html`<span>Test</span>`;
			});

			TestElement.define('refs-setter-test');

			await customElements.whenDefined('refs-setter-test');

			const el = document.createElement('refs-setter-test');
			document.body.appendChild(el);

			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(errorSpy).toHaveBeenCalledWith('Refs are readonly and cannot be assigned.');

			// Cleanup
			errorSpy.mockRestore();
			el.remove();
		});
	});
});
