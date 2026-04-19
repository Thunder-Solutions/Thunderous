import test, { expect } from '@playwright/test';
import { setup } from '../test-utilities';

export const propertySignalsTests = () => {
	test('propSignals can be initialized with init()', async ({ page }) => {
		await setup(page, async ({ customElement, derived, html }) => {
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
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('prop-signal-init-test');
			return el?.shadowRoot?.textContent;
		});

		expect(result).toBe('Count: 0');
	});

	test('propSignals can be set via property assignment', async ({ page }) => {
		await setup(page, async ({ customElement, derived, html }) => {
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
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('prop-signal-assign-test');
			return el?.shadowRoot?.textContent;
		});

		expect(result).toBe('Hello from property!');
	});

	test('propSignals getter throws if accessed before initialization', async ({ page }) => {
		const logs: string[] = [];

		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				logs.push(msg.text());
			}
		});

		await setup(page, async ({ customElement, html }) => {
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
		});

		await page.waitForTimeout(100);

		// Should have logged an error about accessing before initialization
		expect(logs.some((log) => log.includes('Error accessing property') || log.includes('uninitialized'))).toBe(true);
	});
};
