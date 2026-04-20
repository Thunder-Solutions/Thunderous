import { describe, test, expect, vi } from 'vitest';
import { customElement, css, html, createSignal } from '../../..';
import { flushPromises } from '../test-utilities';

describe('custom-element coverage - shadowRootOptions.registry variants', () => {
	test('accepts a raw CustomElementRegistry instance in shadowRootOptions', async () => {
		const TestElement = customElement(() => html`<span>native-registry</span>`, {
			// Exercise the branch where `shadowRootOptions.registry instanceof CustomElementRegistry`
			// is TRUE (as opposed to a `RegistryResult` that requires ejecting).
			shadowRootOptions: { mode: 'open', registry: customElements },
		});
		TestElement.define('native-registry-test');
		await customElements.whenDefined('native-registry-test');

		const el = document.createElement('native-registry-test');
		document.body.appendChild(el);
		await flushPromises();

		expect(el.shadowRoot?.textContent).toBe('native-registry');
		el.remove();
	});
});

describe('custom-element coverage - adoptStyleSheet without :host', () => {
	test('does NOT log a :host error when non-:host rules are adopted without shadow DOM', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const TestElement = customElement(
			({ adoptStyleSheet }) => {
				const styles = css`
					.only-non-host {
						color: rebeccapurple;
					}
				`;
				adoptStyleSheet(styles);
				return html`<span class="only-non-host">No host rules</span>`;
			},
			{ attachShadow: false },
		);

		TestElement.define('no-host-rules-test');
		await customElements.whenDefined('no-host-rules-test');

		const container = document.createElement('div');
		container.innerHTML = '<no-host-rules-test></no-host-rules-test>';
		document.body.appendChild(container);
		await flushPromises();

		// The warning about no shadow encapsulation still fires – that is the documented behaviour.
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Styles are only encapsulated when using shadow DOM'));
		// But no :host error should be logged, exercising the FALSE branch of the `:host` selector check.
		const hostErrors = errorSpy.mock.calls.filter((call) =>
			typeof call[0] === 'string' ? call[0].includes(':host are not supported') : false,
		);
		expect(hostErrors.length).toBe(0);

		warnSpy.mockRestore();
		errorSpy.mockRestore();
		container.remove();
	});
});

describe('custom-element coverage - attributesAsProperties edges', () => {
	test('skips re-creating an attribute signal in connectedCallback when one already exists from the constructor', async () => {
		type Props = { count: number };
		const TestElement = customElement<Props>(
			({ propSignals }) => {
				const [count] = propSignals.count.init(0);
				return html`<span class="display">${count}</span>`;
			},
			{
				attributesAsProperties: [['count', Number]],
				shadowRootOptions: { mode: 'open' },
			},
		);
		TestElement.define('constructor-attr-signal-test');
		await customElements.whenDefined('constructor-attr-signal-test');

		// Rendering via innerHTML creates the element with attributes already set,
		// so the constructor populates the attrSignals map BEFORE connectedCallback runs.
		// This exercises the "already in attrSignals" branch of the connectedCallback loop.
		const container = document.createElement('div');
		container.innerHTML = '<constructor-attr-signal-test count="7"></constructor-attr-signal-test>';
		document.body.appendChild(container);
		await flushPromises();

		const el = container.querySelector('constructor-attr-signal-test');
		expect(el?.shadowRoot?.textContent?.trim()).toBe('7');

		container.remove();
	});

	test('does nothing in the attributesAsProperties effect when the prop signal is uninitialized', async () => {
		type Props = { missing: string };
		const TestElement = customElement<Props>(
			() => {
				// Intentionally do NOT initialise propSignals.missing.
				return html`<span class="display">static</span>`;
			},
			{
				attributesAsProperties: [['missing', String]],
				shadowRootOptions: { mode: 'open' },
			},
		);
		TestElement.define('uninitialised-prop-test');
		await customElements.whenDefined('uninitialised-prop-test');

		const el = document.createElement('uninitialised-prop-test');
		// Do NOT set the attribute either.
		document.body.appendChild(el);
		await flushPromises();

		// The effect's getter returns `undefined` (allowed), so the setAttribute/removeAttribute
		// branch is skipped – this exercises the early-return path.
		expect(el.hasAttribute('missing')).toBe(false);
		expect(el.shadowRoot?.textContent?.trim()).toBe('static');

		el.remove();
	});
});

describe('custom-element coverage - attributeChangedCallback guards', () => {
	test('ignores signal-placeholder attribute values during upgrade to avoid binding noise', async () => {
		type Props = { label: string };
		const changes: Array<string | null> = [];
		const TestElement = customElement<Props>(
			({ attrSignals, attributeChangedCallback }) => {
				const [label] = attrSignals.label;
				attributeChangedCallback((_name, _old, newValue) => {
					changes.push(newValue);
				});
				return html`<span class="display">${label}</span>`;
			},
			{
				observedAttributes: ['label'],
				shadowRootOptions: { mode: 'open' },
			},
		);
		TestElement.define('attr-binding-guard-test');
		await customElements.whenDefined('attr-binding-guard-test');

		// Bind a signal to the observed attribute so that, during initial render, the attribute
		// momentarily holds a `{{signal:…}}` placeholder. `attributeChangedCallback` must
		// ignore that placeholder value (the `ANY_BINDING_REGEX.test(...)` guard).
		const [label] = createSignal('hello');
		const wrapper = html`<attr-binding-guard-test label=${label}></attr-binding-guard-test>`;
		const host = document.createElement('div');
		host.appendChild(wrapper);
		document.body.appendChild(host);
		await flushPromises();

		// No recorded change value should contain the placeholder syntax.
		expect(changes.every((c) => c === null || !/\{\{.+:.+\}\}/.test(c))).toBe(true);

		host.remove();
	});
});
