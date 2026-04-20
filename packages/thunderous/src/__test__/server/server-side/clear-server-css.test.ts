import { describe, it, expect } from 'vitest';
import { clearServerCss, serverCss } from '../../../server-side';

describe('clearServerCss', () => {
	it('clears the server CSS map', () => {
		// Add some CSS to the map
		serverCss.set('test-element', ['body { color: red; }']);
		expect(serverCss.size).toBeGreaterThan(0);

		clearServerCss();

		expect(serverCss.size).toBe(0);
	});
});
