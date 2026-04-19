import { describe, test, expect } from 'vitest';
import { customElement, derived, html } from '../../..';

describe('Property signals', () => {
	test('propSignals can be initialized with init()', async () => {
		type Props = { count: number };

		const CounterElement = customElement<Props>(
			({ propSignals }) => {
				const [count] = propSignals.count.init(0);
				const display = derived(() => `Count: ${count()}`);
				return html`<span class="display">${display}</span>`;
			},
			{
				shadowRootOptions: { mode: 'open' },
			},
		);

		CounterElement.define('prop-signal-init-test');

		await customElements.whenDefined('prop-signal-init-test');

		const el = document.createElement('prop-signal-init-test') as HTMLElement & { count: number };
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(el.shadowRoot?.textContent).toBe('Count: 0');

		// Cleanup
		el.remove();
	});

	test('propSignals can be set via property assignment', async () => {
		type Props = { message: string };

		const MessageElement = customElement<Props>(
			({ propSignals }) => {
				const [message] = propSignals.message.init('default');
				const display = derived(() => message());
				return html`<span class="display">${display}</span>`;
			},
			{
				shadowRootOptions: { mode: 'open' },
			},
		);

		MessageElement.define('prop-signal-assign-test');

		await customElements.whenDefined('prop-signal-assign-test');

		const el = document.createElement('prop-signal-assign-test') as HTMLElement & { message: string };
		el.message = 'Hello from property!';
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(el.shadowRoot?.textContent).toBe('Hello from property!');

		// Cleanup
		el.remove();
	});

	test('propSignals getter throws if accessed before initialization', async () => {
		const logs: string[] = [];
		const originalConsoleError = console.error;
		console.error = (...args: unknown[]) => {
			logs.push(args.map(String).join(' '));
		};

		type Props = { uninitialized: string };

		const TestElement = customElement<Props>(
			({ propSignals }) => {
				try {
					const [uninitialized] = propSignals.uninitialized;
					// Try to access without initializing
					uninitialized();
				} catch (e) {
					// Expected error - log it so test can capture
					console.error('Error accessing property:', e);
				}
				return html`<span>Test</span>`;
			},
			{
				shadowRootOptions: { mode: 'open' },
			},
		);

		TestElement.define('prop-signal-error-test');

		await customElements.whenDefined('prop-signal-error-test');

		const el = document.createElement('prop-signal-error-test');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Restore console.error
		console.error = originalConsoleError;

		// Should have logged an error about accessing before initialization
		expect(logs.some((log) => log.includes('Error accessing property') || log.includes('uninitialized'))).toBe(true);

		// Cleanup
		el.remove();
	});
});
