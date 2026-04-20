import { describe, test, expect, vi } from 'vitest';
import { customElement, html } from '../../..';

describe('Property setter stack overflow protection', () => {
	test('logs an error and bails out once the property setter exceeds the depth guard', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		// Unique tag name so the element can be (re)registered even if the file is re-evaluated.
		const tagName = `x-${Date.now()}` as `${string}-${string}`;

		// Capture the property signal outside the component so we can drive the setter synchronously.
		let setCount: ((value: number) => void) | undefined;

		const TestElement = customElement<{ count: number }>(({ propSignals }) => {
			const [getCount, _setCount] = propSignals.count.init(0);
			setCount = _setCount;
			return html`<span>${getCount}</span>`;
		});

		TestElement.define(tagName);
		await customElements.whenDefined(tagName);

		const el = document.createElement(tagName);
		document.body.appendChild(el);

		// Calls to setCount are synchronous; the `queueMicrotask` decrement of the internal
		// stack counter is deferred until the current sync block ends. So a tight synchronous
		// loop is sufficient to exceed the `stackLength > 999` guard without any deep recursion,
		// which avoids the browser's native stack limit.
		const iterationCap = 2000;
		for (let i = 1; i <= iterationCap; i++) {
			setCount?.(i);
		}

		const overflowErrors = consoleSpy.mock.calls.filter(
			(call) => call[0] instanceof Error && call[0].message.includes('Property signal setter stack overflow detected'),
		);
		expect(overflowErrors.length).toBeGreaterThan(0);

		el.remove();
		consoleSpy.mockRestore();
	});
});
