import { describe, test, expect } from 'vitest';
import { customElement, html } from '../../..';

describe('Lifecycle callbacks', () => {
	test('connectedCallback fires when element is added to DOM', async () => {
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

		expect(connected).toBe(true);

		// Cleanup
		el.remove();
	});

	test('disconnectedCallback fires when element is removed from DOM', async () => {
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

		expect(disconnected).toBe(true);
	});

	test('attributeChangedCallback fires when attributes change', async () => {
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

		expect(changes.length).toBeGreaterThanOrEqual(1);
		expect(
			changes.some((c: { name: string; newVal: string | null }) => c.name === 'data-test' && c.newVal === 'changed'),
		).toBe(true);

		// Cleanup
		el.remove();
	});

	test('clientOnlyCallback fires after rendering', async () => {
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

		expect(clientOnlyFired).toBe(true);

		// Cleanup
		el.remove();
	});

	test('adoptedCallback fires when element is adopted into a new document', async () => {
		let adopted = false;

		const TestElement = customElement(({ adoptedCallback }) => {
			adoptedCallback(() => {
				adopted = true;
			});
			return html`<span>Test</span>`;
		});

		TestElement.define('lifecycle-adopted-test');

		await customElements.whenDefined('lifecycle-adopted-test');

		const el = document.createElement('lifecycle-adopted-test');
		document.body.appendChild(el);

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Create a new document and adopt the element
		const newDoc = document.implementation.createHTMLDocument();
		newDoc.body.appendChild(document.adoptNode(el));

		// Wait for adoptedCallback
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(adopted).toBe(true);
	});
});
