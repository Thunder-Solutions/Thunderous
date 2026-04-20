import { describe, it, expect } from 'vitest';
import { getServerRenderArgs } from '../../../server-side';

describe('getServerRenderArgs propSignals proxy', () => {
	it('returns a signal whose getter resolves to null on the server', () => {
		const args = getServerRenderArgs('my-element-prop-signal');
		// The server-side propSignals proxy returns a signal with an initial value of `null`
		// for any accessed property. This exercises the proxy's `get` handler (function body).
		const [get] = args.propSignals.someProp;
		expect(get()).toBeNull();
	});

	it('returns a unique signal pair for each access (distinct getters)', () => {
		const args = getServerRenderArgs('my-element-prop-signal-unique');
		const [getA] = args.propSignals.a;
		const [getB] = args.propSignals.b;
		expect(typeof getA).toBe('function');
		expect(typeof getB).toBe('function');
		expect(getA).not.toBe(getB);
	});
});
