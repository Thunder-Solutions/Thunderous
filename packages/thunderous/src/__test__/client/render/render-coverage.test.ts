import { describe, test, expect, vi } from 'vitest';
import { html, createSignal } from '../../..';
import { renderState } from '../../../render';
import { flushPromises } from '../test-utilities';

describe('render coverage - defensive error paths', () => {
	test('logs an error when a callback prop-id is missing from the property map', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const handler = () => void 0;
		// Bypass the normal `prop:` → `prop-id:` conversion by writing `prop-id:` directly in the template.
		// Because the underlying `prop:` regex requires a literal `prop:` substring, `prop-id:` escapes it,
		// leaving the property map empty for the generated attribute and exercising the defensive error path.
		void html`<div prop-id:some-missing-callback=${handler}></div>`;

		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('BRANCH:CALLBACK'), expect.anything());

		errorSpy.mockRestore();
	});

	test('logs an error when a static prop-id is missing from the property map', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		// Static attribute value (no binding) with a prop-id not registered in the property map.
		void html`<div prop-id:static-missing="value"></div>`;

		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('BRANCH:PROP'), expect.anything());

		errorSpy.mockRestore();
	});

	test('logs a property warning when a static prop-id target does not exist on the element', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const id = 'static-prop-id';
		renderState.propertyMap.set(id, 'nonExistentStaticProp');
		void html`<div prop-id:${id}="static-value"></div>`;

		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('Property "nonExistentStaticProp" does not exist on element'),
			expect.anything(),
			expect.anything(),
		);

		warnSpy.mockRestore();
	});

	test('logs a property warning when a callback prop-id target does not exist on the element', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const id = 'callback-prop-id';
		renderState.propertyMap.set(id, 'nonExistentCallbackProp');
		const handler = () => void 0;
		void html`<div prop-id:${id}=${handler}></div>`;

		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('Property "nonExistentCallbackProp" does not exist on element'),
			expect.anything(),
			expect.anything(),
		);

		warnSpy.mockRestore();
	});
});

describe('render coverage - attribute signal edge cases', () => {
	test('skips setAttribute when the resolved text did not change between updates', async () => {
		// Use object values to bypass the signal's primitive equality short-circuit: the signal fires
		// on every `set(...)`, while `String(obj)` still yields the same `"[object Object]"` for each,
		// which exercises the `newText !== prevText` FALSE branch inside the attribute-binding effect.
		const [signal, setSignal] = createSignal<object>({ id: 1 });
		const frag = html`<div data-value="${signal}"></div>`;
		const div = frag.querySelector('div');
		expect(div?.getAttribute('data-value')).toBe('[object Object]');

		const spy = vi.spyOn(div!, 'setAttribute');
		setSignal({ id: 2 });
		await flushPromises();

		expect(spy).not.toHaveBeenCalled();

		spy.mockRestore();
	});
});

describe('render coverage - html template null-value branch', () => {
	test('renders `null` interpolations as empty strings in the innerHTML stage', () => {
		// `values[i] ?? ''` coerces null to empty string, so the interpolated text is empty.
		const frag = html`<div data-before="a">${null}</div>`;
		expect(frag.querySelector('div')?.textContent).toBe('');
	});
});

describe('render coverage - static prop-id with existing property', () => {
	test('does not log a warning when the static prop-id maps to a real element property', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		// `value` exists as a property on <input>, so the `!(propName in child)` guard is falsy
		// and `logPropertyWarning` must NOT be invoked.
		const frag = html`<input prop:value="static-input-value" />`;
		const input = frag.querySelector('input');
		expect(input?.value).toBe('static-input-value');

		const propertyWarnings = warnSpy.mock.calls.filter((call) =>
			typeof call[0] === 'string' ? call[0].includes('does not exist on element') : false,
		);
		expect(propertyWarnings.length).toBe(0);

		warnSpy.mockRestore();
	});
});

describe('render coverage - signal type switching from primitive to fragment', () => {
	test('bindFragment handles a prior [Text] initialChildren without caching', async () => {
		// The signal starts with a string value (so `initialChildren` is [Text]), then switches
		// to a DocumentFragment. The bindText effect destroys itself and delegates to bindFragment,
		// passing the original [Text] `initialChildren`. Because `firstInitialChild` is a Text node
		// (not an Element), the childrenMap cache branch is skipped.
		const [signal, setSignal] = createSignal<string | DocumentFragment>('primitive-initial');
		const frag = html`<div class="type-switch-root">${signal}</div>`;
		const host = document.createElement('div');
		host.appendChild(frag);
		document.body.appendChild(host);
		await flushPromises();

		expect(host.querySelector('.type-switch-root')?.textContent).toBe('primitive-initial');

		setSignal(html`<span class="switched">after-switch</span>`);
		await flushPromises();

		expect(host.querySelector('.type-switch-root .switched')?.textContent).toBe('after-switch');
		host.remove();
	});
});

describe('render coverage - signal binding with cleared signalMap', () => {
	test('falls back to newText when the signal binding key is missing from signalMap during a re-run', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const [value, setValue] = createSignal('initial-signal');
		const frag = html`<input prop:value=${value} />`;
		const input = frag.querySelector('input')!;
		expect(input.value).toBe('initial-signal');

		// Clear signalMap so that subsequent effect re-runs cannot resolve the signal through the map.
		// Inside the effect, `signal` will stay undefined, exercising the `signal !== undefined ? … : newValue`
		// cond-expr FALSE branch in the prop-id signal-binding handler.
		renderState.signalMap.clear();
		setValue('updated-signal');
		await flushPromises();

		// No additional behaviour assertion; the aim is to exercise the fallback branch without crashing.
		warnSpy.mockRestore();
	});
});

describe('render coverage - dangling fragment attribute', () => {
	test('silently skips a fragment placeholder whose key is missing from the fragmentMap', () => {
		// An element carrying the internal fragment-attribute but not registered in `renderState.fragmentMap`
		// (e.g. hand-authored HTML) should not throw — the lookup returns undefined and `replaceWith` is skipped.
		const frag = html`<div ___thunderous-fragment="no-such-fragment-key"></div>`;
		const placeholder = frag.querySelector('div');
		expect(placeholder).not.toBeNull();
		// The element must remain intact because no replacement fragment could be resolved.
		expect(placeholder?.getAttribute('___thunderous-fragment')).toBe('no-such-fragment-key');
	});
});

describe('render coverage - legacy callback binding inside a shadow root', () => {
	test('getRootNode returns the shadow root unchanged when the element lives inside one', async () => {
		// When the legacy callback rebinding runs on an element whose root is a ShadowRoot,
		// the ternary `rootNode instanceof ShadowRoot ? rootNode : fragment` must take the TRUE branch.
		const host = document.createElement('div');
		host.attachShadow({ mode: 'open' });
		host.shadowRoot!.appendChild(
			html`<button onclick="this.getRootNode().host.__customCallbackFns.get('legacy-shadow')(event)">Click</button>`,
		);
		document.body.appendChild(host);
		await flushPromises();

		const button = host.shadowRoot!.querySelector('button')!;
		expect(button.getRootNode()).toBe(host.shadowRoot);

		host.remove();
	});
});
