import test, { expect } from '@playwright/test';
import { setup } from '../test-utilities';

export const lifecycleTests = () => {
	test('connectedCallback fires when element is added to DOM', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			let connected = false;

			const TestElement = customElement(({ connectedCallback }) => {
				connectedCallback(() => {
					connected = true;
				});
				return html`<span>Test</span>`;
			});

			TestElement.define('lifecycle-connected-test');

			const el = document.createElement('lifecycle-connected-test');
			document.body.appendChild(el);

			// Wait a tick for connectedCallback to fire
			await new Promise((resolve) => setTimeout(resolve, 0));

			return { connected };
		});

		expect(result.connected).toBe(true);
	});

	test('disconnectedCallback fires when element is removed from DOM', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			let disconnected = false;

			const TestElement = customElement(({ disconnectedCallback }) => {
				disconnectedCallback(() => {
					disconnected = true;
				});
				return html`<span>Test</span>`;
			});

			TestElement.define('lifecycle-disconnected-test');

			const el = document.createElement('lifecycle-disconnected-test');
			document.body.appendChild(el);
			await new Promise((resolve) => setTimeout(resolve, 0));

			el.remove();
			await new Promise((resolve) => setTimeout(resolve, 0));

			return { disconnected };
		});

		expect(result.disconnected).toBe(true);
	});

	test('attributeChangedCallback fires when attributes change', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			const changes: Array<{ name: string; oldVal: string | null; newVal: string | null }> = [];

			const TestElement = customElement(({ attributeChangedCallback }) => {
				attributeChangedCallback((name, oldValue, newValue) => {
					changes.push({ name, oldVal: oldValue, newVal: newValue });
				});
				return html`<span>Test</span>`;
			});

			TestElement.define('lifecycle-attr-changed-test');

			const el = document.createElement('lifecycle-attr-changed-test');
			el.setAttribute('data-test', 'initial');
			document.body.appendChild(el);
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Change attribute
			el.setAttribute('data-test', 'changed');
			await new Promise((resolve) => setTimeout(resolve, 0));

			return { changes };
		});

		expect(result.changes.length).toBeGreaterThanOrEqual(1);
		expect(
			result.changes.some(
				(c: { name: string; newVal: string | null }) => c.name === 'data-test' && c.newVal === 'changed',
			),
		).toBe(true);
	});

	test('clientOnlyCallback fires after rendering', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			let clientOnlyFired = false;

			const TestElement = customElement(({ clientOnlyCallback }) => {
				clientOnlyCallback(() => {
					clientOnlyFired = true;
				});
				return html`<span>Test</span>`;
			});

			TestElement.define('lifecycle-client-only-test');

			const el = document.createElement('lifecycle-client-only-test');
			document.body.appendChild(el);

			return { clientOnlyFired };
		});

		expect(result.clientOnlyFired).toBe(true);
	});
};
